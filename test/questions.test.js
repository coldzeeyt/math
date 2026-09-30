import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOPICS, GRADES, topicsForGrade, makeQuestion } from '../public/js/questions.js';
import { newPlayerStats, scoreAnswer, openChest, CHEST_EVERY } from '../public/js/scoring.js';

test('every grade has at least 5 topics', () => {
  for (const g of GRADES) assert.ok(topicsForGrade(g.id).length >= 5, `grade ${g.name}`);
});

test('topic ids are unique', () => {
  const ids = TOPICS.map(t => t.id);
  assert.equal(new Set(ids).size, ids.length);
});

for (const t of TOPICS) {
  test(`${t.id}: 4 unique choices that include the answer`, () => {
    for (let i = 0; i < 400; i++) {
      const q = t.gen();
      assert.ok(q.prompt, 'has a prompt');
      assert.equal(q.choices.length, 4, `choices for "${q.prompt}": ${q.choices}`);
      assert.equal(new Set(q.choices).size, 4, `duplicate choices for "${q.prompt}": ${q.choices}`);
      assert.ok(q.choices.includes(q.answer), `answer ${q.answer} missing from ${q.choices}`);
      for (const c of q.choices) assert.doesNotMatch(c, /NaN|undefined|Infinity/, `bad choice in "${q.prompt}"`);
    }
  });
}

test('makeQuestion respects topic filters', () => {
  for (let i = 0; i < 50; i++) assert.equal(makeQuestion(3, ['g3-area']).topic, 'g3-area');
});

test('correct answers score, streaks build, wrong answers reset', () => {
  const s = newPlayerStats();
  const r1 = scoreAnswer(s, { correct: true, ms: 12000 });
  assert.equal(r1.gained, 100);
  const r2 = scoreAnswer(s, { correct: true, ms: 12000 });
  assert.equal(r2.gained, 110);
  scoreAnswer(s, { correct: false });
  assert.equal(s.streak, 0);
  assert.equal(s.answered, 3);
  assert.equal(s.correct, 2);
  assert.equal(s.bestStreak, 2);
});

test('a chest opens every few correct answers in a row', () => {
  const s = newPlayerStats();
  let chests = 0;
  for (let i = 0; i < CHEST_EVERY * 3; i++) if (scoreAnswer(s, { correct: true, ms: 5000 }).chest) chests++;
  assert.equal(chests, 3);
});

test('double-power chest doubles the next three answers', () => {
  const s = newPlayerStats();
  openChest(s, 0.5);
  assert.equal(s.mult, 2);
  assert.equal(scoreAnswer(s, { correct: true, ms: 12000 }).gained, 200);
  scoreAnswer(s, { correct: true, ms: 12000 });
  scoreAnswer(s, { correct: true, ms: 12000 });
  assert.equal(s.mult, 1);
  assert.equal(scoreAnswer(s, { correct: true, ms: 12000 }).gained, 130);
});

// A wrong choice must never be secretly equal to the right answer (e.g. "2/4" vs "1/2").
const value = s => {
  const m = String(s).replace('−', '-').replace(/^x = /, '').replace(/[¢$%π]| cm/g, '').replace(/,/g, '').match(/^(-?\d+(?:\.\d+)?)(?:\/(\d+))?$/);
  return m ? (m[2] ? Number(m[1]) / Number(m[2]) : Number(m[1])) : null;
};
test('no distractor has the same value as the answer', () => {
  for (const t of TOPICS) {
    for (let i = 0; i < 300; i++) {
      const q = t.gen();
      const a = value(q.answer);
      if (a === null) continue;
      for (const c of q.choices) {
        if (c === q.answer) continue;
        const v = value(c);
        assert.ok(v === null || Math.abs(v - a) > 1e-9, `${t.id}: "${c}" equals answer "${q.answer}" in "${q.prompt}"`);
      }
    }
  }
});
