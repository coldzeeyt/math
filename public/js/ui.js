// Shared browser helpers: background, sounds, confetti, API calls, formatting.

export const AVATARS = ['🦊', '🐼', '🐸', '🐯', '🦁', '🐵', '🐨', '🐰', '🐙', '🦄', '🐲', '🐧', '🦉', '🐢', '🐳', '🦖', '🐝', '🦩', '🐶', '🐱', '👾', '🤖', '🦈', '🐹'];

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Render an answer string, turning "3/4" into a stacked fraction. */
export function mathHtml(s) {
  return esc(s).replace(/(−?\d+)\/(\d+)/g, '<span class="frac"><span>$1</span><span>$2</span></span>');
}

export const fmt = n => Number(n).toLocaleString('en-US');

export function fmtTime(sec) {
  sec = Math.max(0, Math.ceil(sec));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

export const store = {
  get(key, fallback = null) {
    try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
  },
};

export async function api(path, body) {
  const res = await fetch(path, body === undefined ? {} : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Something went wrong.'), { status: res.status, data });
  return data;
}

export function toast(msg, ms = 2400) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), ms);
}

/** Floating + − × ÷ symbols drifting up the background. */
export function initSky() {
  const sky = document.createElement('div');
  sky.className = 'sky';
  const syms = ['+', '−', '×', '÷', '=', 'π', '√', '%', '½', '∑', '7', '3', '9', '∞', '²', '<', '>'];
  for (let i = 0; i < 26; i++) {
    const s = document.createElement('span');
    s.textContent = syms[i % syms.length];
    s.style.left = `${Math.random() * 100}%`;
    s.style.fontSize = `${24 + Math.random() * 50}px`;
    s.style.animationDuration = `${18 + Math.random() * 26}s`;
    s.style.animationDelay = `${-Math.random() * 40}s`;
    sky.appendChild(s);
  }
  document.body.prepend(sky);
}

// ---------- sound ----------
let ctx = null;
let muted = store.get('mb:muted', false);
export const isMuted = () => muted;
export function setMuted(m) { muted = m; store.set('mb:muted', m); }

function tone(freq, start, dur, { type = 'sine', vol = 0.18, slide = 0 } = {}) {
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.exponentialRampToValueAtTime(freq * slide, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

const SOUNDS = {
  correct: () => { tone(660, 0, 0.12, { type: 'triangle' }); tone(990, 0.09, 0.2, { type: 'triangle' }); },
  streak: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.07, 0.18, { type: 'triangle', vol: 0.15 })),
  wrong: () => { tone(220, 0, 0.25, { type: 'sawtooth', vol: 0.08, slide: 0.6 }); },
  chest: () => [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.08, 0.25, { type: 'square', vol: 0.06 })),
  pop: () => tone(880, 0, 0.08, { type: 'sine', vol: 0.12, slide: 1.6 }),
  tick: () => tone(1200, 0, 0.04, { type: 'square', vol: 0.04 }),
  start: () => [262, 330, 392, 523].forEach((f, i) => tone(f, i * 0.12, 0.25, { type: 'triangle' })),
  fanfare: () => [523, 523, 523, 659, 587, 659, 784].forEach((f, i) => tone(f, [0, .12, .24, .4, .62, .74, .9][i], 0.3, { type: 'triangle', vol: 0.14 })),
};

export function sound(name) {
  if (muted) return;
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    SOUNDS[name]?.();
  } catch { /* audio not available */ }
}

export function muteButton(btn) {
  const paint = () => { btn.textContent = muted ? '🔇' : '🔊'; btn.title = muted ? 'Sound off' : 'Sound on'; };
  paint();
  btn.addEventListener('click', () => { setMuted(!muted); paint(); if (!muted) sound('pop'); });
}

// ---------- confetti ----------
export function confetti({ count = 160, duration = 3500 } = {}) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti';
  document.body.appendChild(canvas);
  const c = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  c.scale(dpr, dpr);
  const colors = ['#ffc233', '#ff5c8a', '#18c2d6', '#1fc98c', '#8a5cff', '#ff8a3d', '#fff'];
  const parts = Array.from({ length: count }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * innerWidth * 0.4,
    y: innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 16,
    vy: -Math.random() * 16 - 4,
    s: 6 + Math.random() * 8,
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    color: colors[Math.floor(Math.random() * colors.length)],
    shape: Math.random() < 0.3 ? 'circle' : 'rect',
  }));
  const start = performance.now();
  (function frame(now) {
    const t = now - start;
    c.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      c.save();
      c.globalAlpha = Math.max(0, 1 - t / duration);
      c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = p.color;
      if (p.shape === 'circle') { c.beginPath(); c.arc(0, 0, p.s / 2, 0, Math.PI * 2); c.fill(); }
      else c.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      c.restore();
    }
    if (t < duration) requestAnimationFrame(frame); else canvas.remove();
  })(start);
}

/** Pop a big floating "+150" style message. */
export function flash(text, good = true) {
  const el = document.createElement('div');
  el.className = `feedback ${good ? 'good' : 'bad'}`;
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

/** Animate a number counting up inside an element. */
export function countTo(el, to, ms = 600) {
  const from = Number(el.dataset.v || 0);
  el.dataset.v = to;
  if (from === to) { el.textContent = fmt(to); return; }
  const start = performance.now();
  (function step(now) {
    const k = Math.min(1, (now - start) / ms);
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = fmt(Math.round(from + (to - from) * e));
    if (k < 1) requestAnimationFrame(step);
  })(start);
}

/** Leaderboard rows with FLIP animation when ranks change. */
export function renderBoard(listEl, players, { limit = 10, meId = null } = {}) {
  const before = new Map($$('.row', listEl).map(r => [r.dataset.id, r.getBoundingClientRect().top]));
  const prevScores = new Map($$('.row', listEl).map(r => [r.dataset.id, Number(r.dataset.score)]));
  let shown = players.slice(0, limit);
  if (meId && !shown.some(p => p.id === meId)) {
    const me = players.find(p => p.id === meId);
    if (me) shown = [...shown.slice(0, limit - 1), me];
  }
  listEl.innerHTML = shown.map(p => {
    const rank = players.indexOf(p) + 1;
    const medal = ['🥇', '🥈', '🥉'][rank - 1] || rank;
    const acc = p.answered ? Math.round((p.correct / p.answered) * 100) : 0;
    return `<div class="row ${rank <= 3 ? 'r' + rank : ''} ${p.id === meId ? 'me' : ''}" data-id="${p.id}" data-score="${p.score}">
      <span class="rank">${medal}</span><span class="av">${esc(p.avatar)}</span>
      <span class="nm">${esc(p.name)}${p.streak >= 3 ? `<span class="fire">🔥${p.streak}</span>` : ''}<small>${p.correct} correct · ${acc}%</small></span>
      <span class="pts">${fmt(p.score)}</span></div>`;
  }).join('');
  for (const row of $$('.row', listEl)) {
    const id = row.dataset.id;
    if (before.has(id)) {
      const dy = before.get(id) - row.getBoundingClientRect().top;
      if (dy) {
        row.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 500, easing: 'cubic-bezier(.2,.9,.3,1.1)' });
      }
      if (prevScores.get(id) !== Number(row.dataset.score)) row.classList.add('bump');
    }
  }
}

export function gradeLabel(id) {
  return id === 0 ? 'Kindergarten' : `Grade ${id}`;
}
