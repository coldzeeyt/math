// Question bank: grade-levelled topics, each generating a fresh multiple-choice question with a visual.
import * as V from './visuals.js';

export const GRADES = [
  { id: 0, name: 'Kindergarten', short: 'K', emoji: '🧸' },
  { id: 1, name: '1st Grade', short: '1', emoji: '🐣' },
  { id: 2, name: '2nd Grade', short: '2', emoji: '🚲' },
  { id: 3, name: '3rd Grade', short: '3', emoji: '🍕' },
  { id: 4, name: '4th Grade', short: '4', emoji: '📐' },
  { id: 5, name: '5th Grade', short: '5', emoji: '🧊' },
  { id: 6, name: '6th Grade', short: '6', emoji: '⚖️' },
  { id: 7, name: '7th Grade', short: '7', emoji: '🎯' },
  { id: 8, name: '8th Grade', short: '8', emoji: '📈' },
];

// ---------- helpers ----------
export const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
export function frac(n, d) {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d) || 1;
  n /= g; d /= g;
  return d === 1 ? String(n) : `${n}/${d}`;
}
const minus = n => (n < 0 ? `−${-n}` : String(n)); // pretty minus sign for display
const paren = n => (n < 0 ? `(${minus(n)})` : String(n));
const money = cents => `$${(cents / 100).toFixed(2)}`;
const dec = (n, places) => String(+n.toFixed(places));
const sup = n => String(n).split('').map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c] ?? c).join('');

/** Build a question with 4 unique shuffled choices. */
function q(prompt, answer, distractors, visual = '', hint = '') {
  const ans = String(answer);
  const seen = new Set([ans]);
  const opts = [];
  for (const d of distractors) {
    const s = String(d);
    if (!seen.has(s) && s !== '' && s !== 'NaN') { seen.add(s); opts.push(s); }
    if (opts.length === 3) break;
  }
  // Top up numeric answers (e.g. "42", "35¢", "x = 7") with nearby values if distractors ran short.
  const m = ans.match(/^(\D*?)(\d+)(\D*)$/);
  for (let k = 1; m && opts.length < 3; k++) {
    const s = `${m[1]}${+m[2] + k}${m[3]}`;
    if (!seen.has(s)) { seen.add(s); opts.push(s); }
  }
  return { prompt, visual, answer: ans, choices: shuffle([ans, ...opts]), hint };
}

/** Plausible numeric distractors near `ans`. */
function near(ans, { spread = 3, min = 0, extra = [], count = 12 } = {}) {
  const out = [...extra];
  const offsets = shuffle([...Array(spread * 2 + 1).keys()].map(i => i - spread).filter(o => o !== 0));
  for (const o of offsets) out.push(ans + o);
  while (out.length < count) out.push(ans + rand(-spread * 3, spread * 3));
  return out.filter(v => v >= min && v !== ans);
}

const EMOJI = ['🍎', '⭐', '🐸', '🍩', '🎈', '🐞', '🍓', '⚽', '🐟', '🌸', '🧁', '🚗', '🐥', '🍪'];
const COLORS = [V.PALETTE.purple, V.PALETTE.blue, V.PALETTE.green, V.PALETTE.orange, V.PALETTE.pink, V.PALETTE.teal, V.PALETTE.red];
const NAMES = ['Mia', 'Leo', 'Ava', 'Kai', 'Zoe', 'Sam', 'Ivy', 'Max', 'Nia', 'Eli'];

// ---------- topics ----------
const T = [];
const topic = (grade, id, name, icon, gen) => T.push({ grade, id, name, icon, gen });

// Kindergarten
topic(0, 'k-count', 'Counting', '🔢', () => {
  const n = rand(1, 12), e = pick(EMOJI);
  return q(`How many ${e} are there?`, n, near(n, { spread: 2, min: 1 }), V.emojiGroup(e, n));
});
topic(0, 'k-add', 'Adding with pictures', '➕', () => {
  const a = rand(1, 5), b = rand(1, 5), e = pick(EMOJI);
  return q(`${a} + ${b} = ?`, a + b, near(a + b, { spread: 2, min: 1 }), V.emojiAdd(e, a, b));
});
topic(0, 'k-sub', 'Take away', '➖', () => {
  const a = rand(3, 10), b = rand(1, a - 1), e = pick(EMOJI);
  return q(`${a} ${e}, take away ${b}. How many are left?`, a - b, near(a - b, { spread: 2 }), V.emojiGroup(e, a, { crossed: b }));
});
topic(0, 'k-compare', 'Bigger number', '🐊', () => {
  const nums = shuffle([...Array(20).keys()].map(i => i + 1)).slice(0, 4);
  const max = Math.max(...nums);
  return q(`🐊 Which is the BIGGEST: ${shuffle(nums).join(', ')}?`, max, nums.filter(n => n !== max), V.numberLine(0, 20, null, { labelEvery: 5, dots: nums }), 'Bigger numbers are farther right');
});
topic(0, 'k-shapes', 'Shapes', '🔷', () => {
  const sides = { triangle: 3, square: 4, rectangle: 4, rhombus: 4, pentagon: 5, hexagon: 6, octagon: 8 };
  const s = pick(Object.keys(sides));
  return q(`How many sides does this ${s} have?`, sides[s], near(sides[s], { spread: 2, min: 3 }), V.shape(s, pick(COLORS)));
});
topic(0, 'k-tenframe', 'Ten frames', '🟥', () => {
  const n = rand(1, 10);
  return q('How many dots are in the ten frame?', n, near(n, { spread: 2, min: 0 }), V.tenFrames(n, { color: pick(COLORS) }));
});

// 1st grade
topic(1, 'g1-add20', 'Add within 20', '➕', () => {
  const a = rand(3, 10), b = rand(2, 10);
  return q(`${a} + ${b} = ?`, a + b, near(a + b, { spread: 3, min: 0 }), V.tenFrames(a, { second: b }));
});
topic(1, 'g1-sub20', 'Subtract within 20', '➖', () => {
  const a = rand(8, 20), b = rand(2, Math.min(9, a - 1));
  return q(`${a} − ${b} = ?`, a - b, near(a - b, { spread: 3 }), V.emojiGroup(pick(EMOJI), a, { crossed: b, cols: 10 }));
});
topic(1, 'g1-missing', 'Missing number', '❓', () => {
  const a = rand(2, 10), b = rand(2, 10);
  return q(`${a} + ? = ${a + b}`, b, near(b, { spread: 3, min: 0, extra: [a + b + a] }), V.balance(`${a} + ?`, `${a + b}`));
});
topic(1, 'g1-tens', 'Tens and ones', '🧱', () => {
  const n = rand(11, 99);
  const t = Math.floor(n / 10), o = n % 10;
  return q('What number do the blocks show?', n, [o * 10 + t, n + 10, n - 10, n + 1, n - 1].filter(x => x > 0), V.baseTen(n));
});
topic(1, 'g1-time', 'Time to the hour', '🕐', () => {
  const h = rand(1, 12), half = Math.random() < 0.4;
  const m = half ? 30 : 0;
  const fmt = (hh, mm) => `${hh}:${String(mm).padStart(2, '0')}`;
  return q('What time is it?', fmt(h, m), [fmt((h % 12) + 1, m), fmt(h, half ? 0 : 30), fmt(((h + 10) % 12) + 1, m), fmt(12 - (h % 12) || 12, m)], V.clock(h, m));
});
topic(1, 'g1-graph', 'Reading graphs', '📊', () => {
  const pets = shuffle(['🐶', '🐱', '🐟', '🐰']).slice(0, 3);
  const data = pets.map(label => ({ label, value: rand(1, 8) }));
  const target = pick(data);
  return q(`How many voted for ${target.label}?`, target.value, near(target.value, { spread: 2, min: 0 }), V.barGraph(data, { max: 8 }));
});

// 2nd grade
topic(2, 'g2-add100', 'Add within 100', '➕', () => {
  const a = rand(12, 69), b = rand(11, 99 - a);
  const s = a + b;
  return q(`${a} + ${b} = ?`, s, [s + 10, s - 10, s + 1, s - 1, (a % 10 + b % 10) % 10 + (Math.floor(a / 10) + Math.floor(b / 10)) * 10], V.baseTen(a) + '<div class="viz-plus">+</div>' + V.baseTen(b));
});
topic(2, 'g2-sub100', 'Subtract within 100', '➖', () => {
  const a = rand(30, 99), b = rand(11, a - 5);
  const d = a - b;
  return q(`${a} − ${b} = ?`, d, [d + 10, d - 10, d + 1, d - 1, d + 2].filter(x => x >= 0), V.bigExpr(`${a} − ${b}`));
});
topic(2, 'g2-place', 'Place value to 1000', '🏗️', () => {
  const n = rand(101, 999);
  const h = Math.floor(n / 100), t = Math.floor(n / 10) % 10, o = n % 10;
  return q('What number do the blocks show?', n, [h * 100 + o * 10 + t, o * 100 + t * 10 + h, n + 100, n - 10, n + 10].filter(x => x > 0 && x < 1000), V.baseTen(n));
});
topic(2, 'g2-time', 'Time to 5 minutes', '⏰', () => {
  const h = rand(1, 12), m = rand(0, 11) * 5;
  const fmt = (hh, mm) => `${hh}:${String(mm).padStart(2, '0')}`;
  const wrongH = ((h + 10) % 12) + 1;
  return q('What time does the clock show?', fmt(h, m), [fmt(h, (m + 5) % 60), fmt(wrongH, m), fmt(h, (60 - m) % 60), fmt(Math.floor(m / 5) || 12, h * 5 % 60), fmt(h, (m + 10) % 60)], V.clock(h, m));
});
topic(2, 'g2-money', 'Counting coins', '🪙', () => {
  const list = [];
  const n = rand(3, 6);
  for (let i = 0; i < n; i++) list.push(pick([1, 5, 10, 25]));
  list.sort((a, b) => b - a);
  const total = list.reduce((s, v) => s + v, 0);
  return q('How much money is this?', `${total}¢`, near(total, { spread: 10, min: 1, extra: [total + 5, total - 5, total + 10] }).map(v => `${v}¢`), V.coins(list));
});
topic(2, 'g2-arrays', 'Arrays', '🔵', () => {
  const r = rand(2, 5), c = rand(2, 6);
  return q(`${r} rows of ${c}. How many dots in all?`, r * c, [r + c, r * c + r, r * c - c, r * (c + 1), (r + 1) * c], V.dotArray(r, c));
});

// 3rd grade
topic(3, 'g3-mult', 'Multiplication facts', '✖️', () => {
  const a = rand(2, 10), b = rand(2, 10);
  const visual = a * b <= 60 ? V.dotArray(a, b, pick(COLORS)) : V.bigExpr(`${a} × ${b}`);
  return q(`${a} × ${b} = ?`, a * b, [a * (b + 1), a * (b - 1), (a + 1) * b, a + b, a * b + 2], visual);
});
topic(3, 'g3-div', 'Division facts', '➗', () => {
  const g = rand(2, 6), e = rand(2, 7);
  return q(`${g * e} ÷ ${g} = ?`, e, near(e, { spread: 3, min: 1, extra: [g] }), V.equalGroups(g, e));
});
topic(3, 'g3-frac', 'Fractions', '🍕', () => {
  const d = pick([2, 3, 4, 6, 8]), n = rand(1, d - 1);
  return q('What fraction of the pizza has pepperoni?', `${n}/${d}`, [`${d - n}/${d}`, `${n}/${d + 1}`, `${d}/${n}`, `${n + 1}/${d}`, `${n}/${d - n}`], V.fractionPie(n, d));
});
topic(3, 'g3-area', 'Area', '🟩', () => {
  const w = rand(3, 8), h = rand(2, 6);
  return q('What is the area of the rectangle (in square units)?', w * h, [2 * (w + h), w + h, w * h + w, w * h - h], V.areaGrid(w, h));
});
topic(3, 'g3-perim', 'Perimeter', '📏', () => {
  const w = rand(3, 12), h = rand(2, 9);
  return q('What is the perimeter?', `${2 * (w + h)} cm`, [`${w * h} cm`, `${w + h} cm`, `${2 * (w + h) + 2} cm`, `${2 * w + h} cm`], V.labeledRect(w, h, ' cm'));
});
topic(3, 'g3-round', 'Rounding', '🎯', () => {
  const to = pick([10, 100]);
  const n = to === 10 ? rand(11, 99) : rand(101, 999);
  const ans = Math.round(n / to) * to;
  const lo = Math.floor(n / to) * to;
  const min = to === 10 ? 0 : Math.floor(n / 100) * 100 - 100;
  const visual = V.numberLine(lo, lo + to, n, { step: to / 10, labelEvery: 10 });
  return q(`Round ${n} to the nearest ${to}.`, ans, [lo === ans ? lo + to : lo, ans + to, ans - to, n].filter(x => x >= min), visual);
});

// 4th grade
topic(4, 'g4-mult', 'Multi-digit multiplication', '✖️', () => {
  const a = pick([rand(12, 99), rand(101, 499)]), b = rand(3, 9);
  const p = a * b;
  return q(`${a} × ${b} = ?`, p, [p + b, p - b, p + 10, p - 10, a * (b + 1)], V.bigExpr(`${a} × ${b}`));
});
topic(4, 'g4-div', 'Long division', '➗', () => {
  const b = rand(3, 9), ans = rand(12, 99);
  return q(`${ans * b} ÷ ${b} = ?`, ans, near(ans, { spread: 4, min: 1, extra: [ans + 10, ans - 10] }), V.bigExpr(`${ans * b} ÷ ${b}`));
});
topic(4, 'g4-equiv', 'Equivalent fractions', '🟦', () => {
  const d = pick([2, 3, 4, 5]), n = rand(1, d - 1), k = rand(2, 4);
  return q(`Fill in the missing number: ${n}/${d} = ?/${d * k}`, n * k, [n + k, n * k + 1, n, d * k - n], V.fractionBars([[n, d], [n * k, d * k]]));
});
topic(4, 'g4-angles', 'Types of angles', '📐', () => {
  const kind = pick(['acute', 'right', 'obtuse', 'straight']);
  const deg = { acute: rand(20, 75), right: 90, obtuse: rand(105, 165), straight: 180 }[kind];
  return q('Is this angle acute, right, obtuse or straight?', kind, ['acute', 'right', 'obtuse', 'straight', 'reflex'].filter(k => k !== kind), V.angle(deg));
});
topic(4, 'g4-factors', 'Factors & multiples', '🧩', () => {
  const n = pick([12, 18, 20, 24, 28, 30, 36, 40, 42, 45, 48, 54, 56, 63, 72]);
  const factors = [...Array(n).keys()].slice(2).filter(f => n % f === 0 && f < n);
  const a = pick(factors);
  return q(`Find the missing factor: ${n} = ${a} × ?`, n / a, near(n / a, { spread: 3, min: 1 }), V.dotArray(a, n / a, pick(COLORS)));
});
topic(4, 'g4-compare-frac', 'Comparing fractions', '⚖️', () => {
  const d1 = pick([3, 4, 5, 6, 8]), d2 = pick([3, 4, 5, 6, 8].filter(x => x !== d1));
  let n1 = rand(1, d1 - 1), n2 = rand(1, d2 - 1);
  if (n1 * d2 === n2 * d1) n1 = n1 === 1 ? 2 : n1 - 1;
  const ans = n1 * d2 > n2 * d1 ? `${n1}/${d1}` : `${n2}/${d2}`;
  const other = ans === `${n1}/${d1}` ? `${n2}/${d2}` : `${n1}/${d1}`;
  return q(`Which is GREATER: ${n1}/${d1} or ${n2}/${d2}?`, ans, [other, `1/${Math.max(d1, d2) * 2}`, `1/${d1 + d2}`], V.fractionBars([[n1, d1], [n2, d2]]));
});

// 5th grade
topic(5, 'g5-decimals', 'Adding decimals', '🔟', () => {
  const a = rand(11, 999), b = rand(11, 999);
  const ans = (a + b) / 100;
  return q(`${(a / 100).toFixed(2)} + ${(b / 100).toFixed(2)} = ?`, ans.toFixed(2), [(ans + 0.1).toFixed(2), (ans - 0.1).toFixed(2), (ans + 1).toFixed(2), ((a + b) / 10).toFixed(1), (ans + 0.01).toFixed(2)], V.bigExpr(`${(a / 100).toFixed(2)} + ${(b / 100).toFixed(2)}`));
});
topic(5, 'g5-pow10', 'Powers of ten', '🚀', () => {
  const n = rand(12, 999) / 10, p = pick([10, 100, 1000]);
  const up = Math.random() < 0.5;
  const ans = up ? n * p : n / p;
  const places = 6;
  return q(`${dec(n, 1)} ${up ? '×' : '÷'} ${p} = ?`, dec(ans, places), [dec(up ? n * p / 10 : n / p * 10, places), dec(up ? n * p * 10 : n / p / 10, places), dec(up ? n / p : n * p, places)], V.bigExpr(`${dec(n, 1)} ${up ? '×' : '÷'} ${p}`));
});
topic(5, 'g5-fracadd', 'Adding fractions', '🥧', () => {
  const d1 = pick([2, 3, 4, 5, 6]), d2 = pick([2, 3, 4, 6, 8]);
  const n1 = rand(1, d1 - 1), n2 = rand(1, d2 - 1);
  const ans = frac(n1 * d2 + n2 * d1, d1 * d2);
  return q(`${n1}/${d1} + ${n2}/${d2} = ?`, ans, [`${n1 + n2}/${d1 + d2}`, frac(n1 * d2 + n2 * d1 + d2, d1 * d2), frac(n1 + n2, Math.max(d1, d2)), frac(n1 * n2, d1 * d2)], V.fractionBars([[n1, d1], [n2, d2]]));
});
topic(5, 'g5-volume', 'Volume', '🧊', () => {
  const l = rand(2, 5), w = rand(2, 4), h = rand(2, 4);
  return q('How many cubes make this box? (volume)', l * w * h, [l * w + h, 2 * (l * w + w * h + l * h), l * w * h + l * w, l * w * (h - 1)], V.prism(l, w, h));
});
topic(5, 'g5-order', 'Order of operations', '🧮', () => {
  const a = rand(2, 9), b = rand(2, 9), c = rand(2, 6), d = rand(1, 9);
  const form = rand(0, 2);
  let expr, ans, wrong;
  if (form === 0) { expr = `${a} + ${b} × ${c}`; ans = a + b * c; wrong = (a + b) * c; }
  else if (form === 1) { expr = `(${a} + ${b}) × ${c} − ${d}`; ans = (a + b) * c - d; wrong = a + b * c - d; }
  else { expr = `${a * c} ÷ ${c} + ${b} × ${d}`; ans = a + b * d; wrong = (a + b) * d; }
  return q(`${expr} = ?`, ans, [wrong, ans + 1, ans - 2, ans + 10].filter(x => x >= 0), V.bigExpr(expr));
});
topic(5, 'g5-coords', 'Coordinate plane', '📍', () => {
  const x = rand(1, 9), y = rand(1, 9);
  return q('What are the coordinates of the red point?', `(${x}, ${y})`, [`(${y}, ${x})`, `(${x + 1}, ${y})`, `(${x}, ${y - 1})`, `(${x - 1}, ${y + 1})`], V.coordPlane({ points: [{ x, y }] }));
});

// 6th grade
topic(6, 'g6-ratio', 'Ratios', '🟥', () => {
  const a = rand(1, 4), b = rand(1, 4) + (a === 1 ? 1 : 0), k = rand(2, 6);
  return q(`For every ${a} 🟥 there are ${b} 🔵. If there are ${a * k} 🟥, how many 🔵?`, b * k, [a * k + (b - a), b * (k + 1), a * k, b + k].filter(x => x > 0), V.ratioTiles(a, b, Math.min(k, 4)));
});
topic(6, 'g6-percent', 'Percents', '💯', () => {
  if (Math.random() < 0.5) {
    const n = rand(5, 95);
    return q('What percent of the grid is shaded?', `${n}%`, [`${100 - n}%`, `${n + 10}%`, `${n - 5}%`, `${n / 10}%`], V.percentGrid(n));
  }
  const p = pick([10, 20, 25, 50, 75]), whole = pick([20, 40, 60, 80, 120, 200]);
  const ans = (p * whole) / 100;
  return q(`What is ${p}% of ${whole}?`, ans, [ans * 2, whole - ans, ans + 10, p].filter(x => x !== ans), V.percentGrid(p));
});
topic(6, 'g6-negatives', 'Negative numbers', '🌡️', () => {
  const n = rand(-8, 8);
  return q('What number is the red marker on?', minus(n), [minus(-n), minus(n + 1), minus(n - 1), minus(n + 2)], V.numberLine(-10, 10, n, { labelEvery: 5 }));
});
topic(6, 'g6-exponents', 'Exponents', '⚡', () => {
  const b = rand(2, 6), e = rand(2, b <= 3 ? 5 : 3);
  const ans = b ** e;
  return q(`${b}${sup(e)} = ?`, ans, [b * e, b ** (e - 1), b ** e + b, e ** b].filter(x => x !== ans), V.bigExpr(`${b}${sup(e)} = ${Array(e).fill(b).join(' × ')}`));
});
topic(6, 'g6-onestep', 'One-step equations', '⚖️', () => {
  const x = rand(2, 15), a = rand(2, 12);
  if (Math.random() < 0.5) return q(`Solve: x + ${a} = ${x + a}`, `x = ${x}`, [`x = ${x + 2 * a}`, `x = ${x + 1}`, `x = ${a}`, `x = ${x - 1}`], V.balance(`x + ${a}`, `${x + a}`));
  return q(`Solve: ${a}x = ${a * x}`, `x = ${x}`, [`x = ${a * x - a}`, `x = ${x + 1}`, `x = ${a * a * x}`, `x = ${x - 1}`], V.balance(`${a}x`, `${a * x}`));
});
topic(6, 'g6-triarea', 'Area of triangles', '🔺', () => {
  const b = rand(3, 12), h = rand(2, 10) * (b % 2 ? 2 : 1);
  return q('What is the area of the triangle?', (b * h) / 2, [b * h, b + h, (b * h) / 2 + b].filter(x => x !== (b * h) / 2), V.triangleBH(b, h));
});

// 7th grade
topic(7, 'g7-integers', 'Integer operations', '➕', () => {
  const a = rand(-12, 12) || 3, b = rand(-12, 12) || -4;
  const op = pick(['+', '−', '×']);
  const ans = op === '+' ? a + b : op === '−' ? a - b : a * b;
  const wrong = op === '+' ? [a - b, -(a + b), Math.abs(a) + Math.abs(b)] : op === '−' ? [a + b, b - a, -(a + b)] : [-(a * b), a + b, Math.abs(a * b) + 1];
  return q(`${minus(a)} ${op} ${paren(b)} = ?`, minus(ans), [...wrong, ans + 1, ans - 1].map(minus), V.numberLine(-12, 12, a, { labelEvery: 4 }));
});
topic(7, 'g7-unitrate', 'Unit rates', '🏷️', () => {
  const n = rand(3, 8), each = rand(2, 12) * 25;
  const item = pick(['🍪 cookies', '📓 notebooks', '🎟️ tickets', '🧃 juice boxes', '🌮 tacos']);
  return q(`${n} ${item} cost ${money(n * each)}. How much for 1?`, money(each), [money(each + 25), money(each - 25), money(n * each - each), money(each * 2)].filter(s => !s.includes('-')), V.bigExpr(`${money(n * each)} ÷ ${n}`));
});
topic(7, 'g7-twostep', 'Two-step equations', '🧗', () => {
  const x = rand(-6, 12), a = rand(2, 9), b = rand(-15, 20);
  const c = a * x + b;
  const bs = b < 0 ? `− ${-b}` : `+ ${b}`;
  return q(`Solve: ${a}x ${bs} = ${minus(c)}`, `x = ${minus(x)}`, [`x = ${minus(x + 1)}`, `x = ${minus(-x)}`, `x = ${minus((c + b) / a | 0)}`, `x = ${minus(x - 2)}`, `x = ${minus(x + 3)}`], V.balance(`${a}x ${bs}`, minus(c)));
});
topic(7, 'g7-circles', 'Circles', '⭕', () => {
  const r = rand(2, 10);
  const area = Math.random() < 0.5;
  const ans = area ? `${r * r}π` : `${2 * r}π`;
  return q(`What is the ${area ? 'AREA' : 'CIRCUMFERENCE'} of the circle? (answer in terms of π)`, ans, area ? [`${2 * r}π`, `${r}π`, `${2 * r * r}π`, `${r * r * 2}π`] : [`${r * r}π`, `${r}π`, `${4 * r}π`], V.circleR(r));
});
topic(7, 'g7-prob', 'Probability', '🎡', () => {
  const n = pick([4, 5, 6, 8]);
  const pal = [
    { color: V.PALETTE.red, name: 'red' }, { color: V.PALETTE.blue, name: 'blue' },
    { color: V.PALETTE.yellow, name: 'yellow' }, { color: V.PALETTE.green, name: 'green' },
  ];
  const sections = Array.from({ length: n }, () => pick(pal));
  const target = pick(sections);
  const k = sections.filter(s => s.name === target.name).length;
  return q(`What is the probability of landing on ${target.name.toUpperCase()}?`, frac(k, n), [frac(n - k, n) === '0' ? '1' : frac(n - k, n), `1/${n + 1}`, `${k}/${n + k}`, frac(k + 1, n), '1/2', '0'], V.spinner(sections));
});
topic(7, 'g7-discount', 'Discounts & tax', '🛍️', () => {
  const price = pick([20, 40, 50, 60, 80, 120]), p = pick([10, 20, 25, 50]);
  const ans = price - (price * p) / 100;
  return q(`A $${price} hoodie is ${p}% off. What is the sale price?`, `$${ans}`, [`$${(price * p) / 100}`, `$${price - p}`, `$${price + (price * p) / 100}`, `$${ans - 5}`], V.percentGrid(p, V.PALETTE.pink));
});

// 8th grade
topic(8, 'g8-linear', 'Linear equations', '⚖️', () => {
  const x = rand(-5, 9), a = rand(3, 9), c = rand(1, a - 1), b = rand(-10, 10);
  const d = (a - c) * x + b;
  const s = n => (n < 0 ? `− ${-n}` : `+ ${n}`);
  return q(`Solve: ${a}x ${s(b)} = ${c}x ${s(d)}`, `x = ${minus(x)}`, [`x = ${minus(-x)}`, `x = ${minus(x + 1)}`, `x = ${minus(x - 1)}`, `x = ${minus(x + 2)}`], V.balance(`${a}x ${s(b)}`, `${c}x ${s(d)}`));
});
topic(8, 'g8-slope', 'Slope', '📈', () => {
  const x1 = rand(-4, 0), y1 = rand(-4, 1);
  const run = rand(1, 4), rise = pick([-3, -2, -1, 1, 2, 3, 4]);
  const x2 = x1 + run, y2 = y1 + rise;
  return q('What is the slope of the line?', frac(rise, run).replace('-', '−'), [frac(run, rise), frac(-rise, run), frac(rise + 1, run), String(rise), String(run)].map(s => s.replace('-', '−')),
    V.coordPlane({ min: -6, max: 6, points: [{ x: x1, y: y1, color: V.PALETTE.purple }, { x: x2, y: y2, color: V.PALETTE.purple }], line: [[x1, y1], [x2, y2]] }));
});
topic(8, 'g8-pythag', 'Pythagorean theorem', '📐', () => {
  const [a, b, c] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25]]);
  if (Math.random() < 0.6) return q('How long is the hypotenuse?', c, [a + b, c + 1, c - 1, a * b / 2], V.rightTriangle(a, b));
  return q('How long is the missing leg?', a, [c - b + 1, a + 2, b, c + b].filter(x => x > 0), V.rightTriangle(a, b, ['?', b, c]));
});
topic(8, 'g8-exprules', 'Exponent rules', '⚡', () => {
  const b = rand(2, 9), m = rand(2, 7), n = rand(2, 6);
  const op = pick(['×', '÷', 'pow']);
  const ask = expr => `${expr} = ${b}ⁿ. What is n?`;
  if (op === '×') return q(ask(`${b}${sup(m)} × ${b}${sup(n)}`), m + n, [m * n, Math.abs(m - n)], V.bigExpr(`${b}${sup(m)} × ${b}${sup(n)} = ${b}ⁿ`));
  if (op === '÷') { const big = m + n; return q(ask(`${b}${sup(big)} ÷ ${b}${sup(n)}`), m, [big + n, big * n], V.bigExpr(`${b}${sup(big)} ÷ ${b}${sup(n)} = ${b}ⁿ`)); }
  return q(ask(`(${b}${sup(m)})${sup(n)}`), m * n, [m + n, m ** n], V.bigExpr(`(${b}${sup(m)})${sup(n)} = ${b}ⁿ`));
});
topic(8, 'g8-roots', 'Square roots', '√', () => {
  const n = rand(2, 15);
  return q(`√${n * n} = ?`, n, [n * 2, n + 1, n - 1, n * n / 2].filter(x => Number.isInteger(x) && x > 0), V.areaGrid(Math.min(n, 12), Math.min(n, 12)));
});
topic(8, 'g8-functions', 'Functions', '🔁', () => {
  const m = pick([-4, -3, -2, 2, 3, 4, 5]), b = rand(-9, 9) || 1, x = rand(-4, 6);
  const ans = m * x + b;
  const rule = `${minus(m)}x ${b < 0 ? `− ${-b}` : `+ ${b}`}`;
  return q(`f(x) = ${rule}. What is f(${minus(x)})?`, minus(ans), [ans + 1, m * x - b, m + x + b, ans - m].map(minus), V.machine(minus(x), rule));
});
topic(8, 'g8-scinot', 'Scientific notation', '🔭', () => {
  const mant = rand(11, 99) / 10, e = rand(2, 6);
  const std = Math.round(mant * 10 ** e).toLocaleString('en-US');
  return q(`Write ${mant} × 10${sup(e)} in standard form.`, std, [Math.round(mant * 10 ** (e - 1)).toLocaleString('en-US'), Math.round(mant * 10 ** (e + 1)).toLocaleString('en-US'), Math.round(mant * 10 ** (e - 2)).toLocaleString('en-US'), Math.round(mant * 10 * e).toLocaleString('en-US')], V.bigExpr(`${mant} × 10${sup(e)}`));
});


// Shown after a wrong answer, so a miss becomes a mini-lesson.
const HINTS = {
  'k-count': 'Touch and count each one: 1, 2, 3…',
  'k-add': 'Count all the pictures together.',
  'k-sub': 'Count the ones that are NOT crossed out.',
  'k-compare': 'Numbers get bigger as you move right on the number line.',
  'k-shapes': 'Count each straight edge of the shape.',
  'k-tenframe': 'A full ten frame has 10 boxes.',
  'g1-add20': 'Fill up a ten first, then add the rest.',
  'g1-sub20': 'Count the ones that are left over.',
  'g1-missing': 'What do you add to the first number to get the total?',
  'g1-tens': 'Each tall rod is 10. Each little cube is 1.',
  'g1-time': 'The short hand points to the hour.',
  'g2-place': 'Big squares are 100, rods are 10, cubes are 1.',
  'g2-time': 'Count by 5s for each number the long hand passes.',
  'g2-money': 'Quarter 25¢, dime 10¢, nickel 5¢, penny 1¢.',
  'g2-arrays': 'Rows × dots in each row.',
  'g3-mult': 'Count the rows, then count the dots in one row, then multiply.',
  'g3-div': 'Share the total into equal groups.',
  'g3-frac': 'Top number = shaded slices. Bottom number = all slices.',
  'g3-area': 'Area = length × width (count the squares!).',
  'g3-perim': 'Perimeter = add up all four sides.',
  'g3-round': '5 or more rounds up. 4 or less rounds down.',
  'g4-equiv': 'Multiply the top and bottom by the same number.',
  'g4-angles': 'Acute < 90°, right = 90°, obtuse > 90°, straight = 180°.',
  'g4-factors': 'Divide: what times this number makes the total?',
  'g4-compare-frac': 'Compare the shaded parts of the bars.',
  'g5-decimals': 'Line up the decimal points before adding.',
  'g5-pow10': '× 10 moves the decimal right; ÷ 10 moves it left.',
  'g5-fracadd': 'Find a common denominator first.',
  'g5-volume': 'Volume = length × width × height.',
  'g5-order': 'Parentheses first, then × and ÷, then + and −.',
  'g5-coords': '(x, y): go ACROSS first, then UP.',
  'g6-ratio': 'Find how many groups there are, then multiply.',
  'g6-percent': 'Percent means "out of 100".',
  'g6-negatives': 'Numbers left of 0 are negative.',
  'g6-exponents': 'Multiply the base by itself exponent times.',
  'g6-onestep': 'Do the opposite operation to both sides.',
  'g6-triarea': 'Triangle area = ½ × base × height.',
  'g7-integers': 'Same signs multiply to positive; different signs to negative.',
  'g7-unitrate': 'Divide the total cost by how many items.',
  'g7-twostep': 'Undo the + or − first, then divide.',
  'g7-circles': 'Area = πr². Circumference = 2πr.',
  'g7-prob': 'Probability = matching sections ÷ total sections.',
  'g7-discount': 'Find the percent of the price, then subtract it.',
  'g8-linear': 'Get all the x terms on one side first.',
  'g8-slope': 'Slope = rise ÷ run.',
  'g8-pythag': 'a² + b² = c²',
  'g8-exprules': '× same base: add exponents. ÷: subtract. Power of a power: multiply.',
  'g8-roots': 'What number times itself makes this?',
  'g8-functions': 'Swap x for the input number, then calculate.',
  'g8-scinot': 'Move the decimal point right as many places as the exponent.',
};

export const TOPICS = T;

export function topicsForGrade(grade) {
  return T.filter(t => t.grade === grade);
}

/**
 * Pick a topic and generate a question. Mixes in a little review from the grade below
 * (about 1 in 6) so kids get some confidence-builders.
 */
export function makeQuestion(grade, topicIds = null) {
  let pool = topicsForGrade(grade);
  if (topicIds?.length) pool = pool.filter(t => topicIds.includes(t.id));
  if (!pool.length) pool = topicsForGrade(grade);
  const useReview = !topicIds?.length && grade > 0 && Math.random() < 1 / 6;
  const t = useReview ? pick(topicsForGrade(grade - 1)) : pick(pool);
  const question = t.gen();
  return { ...question, hint: question.hint || HINTS[t.id] || '', topic: t.id, topicName: t.name, topicIcon: t.icon };
}
