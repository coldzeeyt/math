// The self-paced question loop shared by solo and live play.
import { makeQuestion } from './questions.js';
import { esc, mathHtml, sound, flash, confetti } from './ui.js';
import { answerParts, isCorrect, keypadExtras } from './answers.js';

const CHEER = ['Nice!', 'Awesome!', 'Boom!', 'Genius!', 'Yes!', 'Great!', 'Wow!', 'Super!'];

export class Quiz {
  /**
   * @param {HTMLElement} root
   * @param {{grade:number, topics:string[], onAnswer:(correct:boolean, ms:number, skipped:boolean)=>Promise<any>}} opts
   */
  constructor(root, { grade, topics, onAnswer }) {
    this.root = root;
    this.grade = grade;
    this.topics = topics;
    this.onAnswer = onAnswer;
    this.stopped = false;
    this.busy = false;
    this.recent = [];
  }

  start() {
    this.stopped = false;
    this.next();
  }

  stop() {
    this.stopped = true;
    this.root.querySelectorAll('button, input').forEach(b => (b.disabled = true));
  }

  next() {
    if (this.stopped) return;
    let q;
    for (let tries = 0; tries < 6; tries++) {
      q = makeQuestion(this.grade, this.topics);
      if (!this.recent.includes(q.prompt)) break;
    }
    this.recent = [q.prompt, ...this.recent].slice(0, 8);
    this.q = q;
    this.busy = false;
    const { prefix, suffix, kind } = answerParts(q.answer);
    const word = kind === 'word';
    // Calculator layout: digits on the left, ⌫ and symbols down the right, a wide 0 at the bottom.
    const [e0 = '', e1 = '', e2 = ''] = keypadExtras(kind, this.grade);
    const keys = ['7', '8', '9', '⌫', '4', '5', '6', e0, '1', '2', '3', e1, '0', e2];
    this.root.innerHTML = `
      <div class="qcard">
        <span class="qtopic">${q.topicIcon} ${esc(q.topicName)}</span>
        <div class="qprompt">${mathHtml(q.prompt)}</div>
        <div class="qvisual">${q.visual}</div>
      </div>
      <form class="answer-row" autocomplete="off">
        <label class="answer-box">
          ${prefix ? `<span class="affix">${esc(prefix.trim())}</span>` : ''}
          <input class="answer-input" name="a" maxlength="14" spellcheck="false" autocapitalize="off"
                 inputmode="${word ? 'text' : 'none'}" placeholder="${word ? 'type a word' : '?'}" aria-label="Your answer">
          ${suffix ? `<span class="affix">${esc(suffix.trim())}</span>` : ''}
        </label>
        <button class="btn big green submit" type="submit" aria-label="Submit answer">✓</button>
        <button type="button" class="btn ghost skip" title="Skip this question (everyone will see!)">Skip<br>⏭</button>
      </form>
      ${word ? '' : `<div class="keypad">${keys.map(k => k ? `<button type="button" class="key ${k === '⌫' ? 'back' : ''} ${k === '0' ? 'wide' : ''}" data-k="${k}">${k}</button>` : '<span></span>').join('')}</div>`}`;

    const input = this.root.querySelector('.answer-input');
    this.root.querySelector('.answer-row').addEventListener('submit', e => { e.preventDefault(); this.submit(); });
    this.root.querySelector('.skip').addEventListener('click', () => this.skip());
    this.root.querySelector('.keypad')?.addEventListener('click', e => {
      const k = e.target.closest('.key')?.dataset.k;
      if (!k || this.busy) return;
      input.value = k === '⌫' ? input.value.slice(0, -1) : (input.value + k).slice(0, 14);
      sound('tick');
    });
    // Only grab focus when a real keyboard is likely, so phones don't pop up their own keyboard.
    if (word || matchMedia('(pointer: fine)').matches) input.focus();
    this.t0 = performance.now();
  }

  submit() {
    const input = this.root.querySelector('.answer-input');
    if (this.busy || this.stopped || !input.value.trim()) {
      if (!input.value.trim()) input.animate([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], 200);
      return;
    }
    this.finish(isCorrect(input.value, this.q.answer), false);
  }

  skip() {
    if (this.busy || this.stopped) return;
    this.finish(false, true);
  }

  async finish(correct, skipped) {
    this.busy = true;
    const ms = Math.round(performance.now() - this.t0);
    const q = this.q;
    this.root.querySelectorAll('.answer-row input, .answer-row button, .key, .skip').forEach(b => (b.disabled = true));
    const box = this.root.querySelector('.answer-box');
    box.classList.add(correct ? 'right' : skipped ? 'skipped' : 'wrong');

    let result = null;
    try {
      result = await this.onAnswer(correct, ms, skipped);
    } catch {
      // Network hiccup or game over: the page decides what to do via its own state.
    }
    if (this.stopped) return;

    if (correct) {
      const streak = result?.streak ?? 0;
      sound(streak > 0 && streak % 3 === 0 ? 'streak' : 'correct');
      flash(result?.gained ? `+${result.gained}` : CHEER[Math.floor(Math.random() * CHEER.length)]);
    } else {
      sound(skipped ? 'pop' : 'wrong');
      flash(skipped ? 'Skipped!' : 'Oops!', false);
      const was = document.createElement('div');
      was.className = 'correct-was';
      was.innerHTML = `The answer was <span style="font-size:1.25em">${mathHtml(q.answer)}</span>${q.hint ? `<span class="hint">💡 ${mathHtml(q.hint)}</span>` : ''}`;
      this.root.querySelector('.qcard').appendChild(was);
    }

    if (result?.chest) {
      await wait(500);
      await showChest(result.chest);
    }
    await wait(correct ? 750 : q.hint ? 2800 : 1900);
    this.next();
  }
}

const wait = ms => new Promise(r => setTimeout(r, ms));

/** Blooket-style treasure chest: tap to open, reveal reward. */
export function showChest(chest) {
  return new Promise(resolve => {
    const ov = document.createElement('div');
    ov.className = 'overlay';
    ov.innerHTML = `<div class="rays"></div><div class="chest-box">
      <h2 style="font-size:2rem;margin:0 0 10px">🔥 5 in a row! 🔥</h2>
      <button class="chest" aria-label="Open the treasure chest">🎁</button>
      <p style="font-size:1.2rem">Tap the chest to open it!</p></div>`;
    document.body.appendChild(ov);
    const open = () => {
      sound('chest');
      confetti({ count: 90, duration: 2200 });
      ov.querySelector('.chest-box').innerHTML = `<div class="chest-reward">
        <span class="icon">${chest.icon}</span><h2>${esc(chest.label)}</h2><p>${esc(chest.detail)}</p>
        <button class="btn big">Keep going ➜</button></div>`;
      const btn = ov.querySelector('.btn');
      btn.focus();
      btn.addEventListener('click', () => { ov.remove(); resolve(); });
    };
    const chestBtn = ov.querySelector('.chest');
    chestBtn.focus();
    chestBtn.addEventListener('click', open, { once: true });
  });
}
