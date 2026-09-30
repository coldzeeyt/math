// The self-paced question loop shared by solo and live play.
import { makeQuestion } from './questions.js';
import { esc, mathHtml, sound, flash, confetti } from './ui.js';

const SHAPES = [
  '<svg class="shape" viewBox="0 0 30 30"><polygon points="15,3 28,27 2,27" fill="#fff"/></svg>',
  '<svg class="shape" viewBox="0 0 30 30"><polygon points="15,2 28,15 15,28 2,15" fill="#fff"/></svg>',
  '<svg class="shape" viewBox="0 0 30 30"><circle cx="15" cy="15" r="13" fill="#fff"/></svg>',
  '<svg class="shape" viewBox="0 0 30 30"><rect x="3" y="3" width="24" height="24" rx="3" fill="#fff"/></svg>',
];

const CHEER = ['Nice!', 'Awesome!', 'Boom!', 'Genius!', 'Yes!', 'Great!', 'Wow!', 'Super!'];

export class Quiz {
  /**
   * @param {HTMLElement} root
   * @param {{grade:number, topics:string[], onAnswer:(correct:boolean, ms:number)=>Promise<any>}} opts
   */
  constructor(root, { grade, topics, onAnswer }) {
    this.root = root;
    this.grade = grade;
    this.topics = topics;
    this.onAnswer = onAnswer;
    this.stopped = false;
    this.busy = false;
    this.recent = [];
    this.onKey = e => {
      if (this.busy || this.stopped) return;
      const i = ['1', '2', '3', '4'].indexOf(e.key);
      if (i >= 0) this.choose(i);
    };
    document.addEventListener('keydown', this.onKey);
  }

  start() {
    this.stopped = false;
    this.next();
  }

  stop() {
    this.stopped = true;
    document.removeEventListener('keydown', this.onKey);
    this.root.querySelectorAll('.answer').forEach(b => (b.disabled = true));
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
    this.root.innerHTML = `
      <div class="qcard">
        <span class="qtopic">${q.topicIcon} ${esc(q.topicName)}</span>
        <div class="qprompt">${mathHtml(q.prompt)}</div>
        <div class="qvisual">${q.visual}</div>
      </div>
      <div class="answers">
        ${q.choices.map((c, i) => `<button class="answer" data-i="${i}">${SHAPES[i]}<span class="key">${i + 1}</span><span>${mathHtml(c)}</span></button>`).join('')}
      </div>`;
    this.root.querySelectorAll('.answer').forEach(b => b.addEventListener('click', () => this.choose(Number(b.dataset.i))));
    this.t0 = performance.now();
  }

  async choose(i) {
    if (this.busy || this.stopped) return;
    this.busy = true;
    const ms = Math.round(performance.now() - this.t0);
    const q = this.q;
    const correct = q.choices[i] === q.answer;
    const buttons = [...this.root.querySelectorAll('.answer')];
    buttons.forEach((b, j) => {
      b.disabled = true;
      if (q.choices[j] === q.answer) b.classList.add('right');
      else if (j === i) b.classList.add('wrong');
      else b.classList.add('dim');
    });

    let result = null;
    try {
      result = await this.onAnswer(correct, ms);
    } catch {
      // Network hiccup or game over: the page decides what to do via its own state.
    }
    if (this.stopped) return;

    if (correct) {
      const streak = result?.streak ?? 0;
      sound(streak > 0 && streak % 3 === 0 ? 'streak' : 'correct');
      flash(result?.gained ? `+${result.gained}` : CHEER[Math.floor(Math.random() * CHEER.length)]);
    } else {
      sound('wrong');
      flash('Oops!', false);
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
