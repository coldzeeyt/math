// Checking typed answers. Kids type only the "core" of an answer; units and wrappers
// ($, ¢, cm, %, π, "x =", parentheses) are shown around the input box for them.

const AFFIX = /^(\$|x = |\()?(.*?)(¢| cm|%|π|\))?$/;

/** Split an answer like "$2.50" into { prefix: '$', core: '2.50', suffix: '', kind }. */
export function answerParts(answer) {
  const [, prefix = '', core, suffix = ''] = String(answer).match(AFFIX);
  let kind = 'number';
  if (/^−?\d+, −?\d+$/.test(core)) kind = 'pair';
  else if (/^\d{1,2}:\d\d$/.test(core)) kind = 'time';
  else if (/^[a-z]+$/i.test(core)) kind = 'word';
  return { prefix, core, suffix, kind };
}

const clean = s => String(s).toLowerCase().replace(/[−–]/g, '-').replace(/\s+/g, '');

/** Parse "12", "-3", "0.25", ".5", "3/4", "1,200" into a number, or null. */
export function toNumber(s) {
  const m = clean(s).replace(/,/g, '').match(/^(-?\d*\.?\d+)(?:\/(-?\d*\.?\d+))?$/);
  if (!m) return null;
  const n = Number(m[1]);
  if (m[2] === undefined) return n;
  const d = Number(m[2]);
  return d === 0 ? null : n / d;
}

/** Is what the student typed correct? Accepts equivalent numbers (1/2 = 2/4 = 0.5) and optional units. */
export function isCorrect(input, answer) {
  const { prefix, core, suffix, kind } = answerParts(answer);
  let typed = clean(input);
  // Forgive kids who also type the unit or wrapper.
  const pre = clean(prefix), suf = clean(suffix);
  if (pre && typed.startsWith(pre)) typed = typed.slice(pre.length);
  if (suf && typed.endsWith(suf)) typed = typed.slice(0, -suf.length);
  if (kind === 'pair') typed = typed.replace(/^\(|\)$/g, '');
  if (!typed) return false;

  if (kind === 'word' || kind === 'time') return typed === clean(core);
  if (kind === 'pair') {
    const want = clean(core).split(','), got = typed.split(',');
    return got.length === 2 && got.every((g, i) => toNumber(g) !== null && toNumber(g) === toNumber(want[i]));
  }
  const want = toNumber(core), got = toNumber(typed);
  return want !== null && got !== null && Math.abs(want - got) < 1e-9;
}

/** Extra keypad keys (beyond 0–9) for a question, based on grade so the pad doesn't give answers away. */
export function keypadExtras(kind, grade) {
  if (kind === 'pair') return ['−', ','];
  if (kind === 'time') return [':'];
  const keys = [];
  if (grade >= 4) keys.push('.');
  if (grade >= 3) keys.push('/');
  if (grade >= 6) keys.push('−');
  return keys;
}
