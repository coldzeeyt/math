import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOPICS, GRADES, topicsForGrade, makeQuestion } from '../public/js/questions.js';
import { newPlayerStats, scoreAnswer, scoreSkip, openChest, CHEST_EVERY } from '../public/js/scoring.js';
import { isCorrect, answerParts } from '../public/js/answers.js';

test('every grade has at least 5 topics', () => {
  for (const g of GRADES) assert.ok(topicsForGrade(g.id).length >= 5, `grade ${g.name}`);
});

test('topic ids are unique', () => {
  const ids = TOPICS.map(t => t.id);
  assert.equal(new Set(ids).size, ids.length);
});

for (const t of TOPICS) {
  test(`${t.id}: typing the answer (or its core) is marked correct, wrong choices are not`, () => {
    for (let i = 0; i < 400; i++) {
      const q = t.gen();
      assert.ok(q.prompt, 'has a prompt');
      assert.doesNotMatch(q.answer, /NaN|undefined|Infinity/, `bad answer in "${q.prompt}"`);
      const { core } = answerParts(q.answer);
      assert.ok(isCorrect(q.answer, q.answer), `full answer "${q.answer}" rejected`);
      assert.ok(isCorrect(core, q.answer), `core "${core}" of "${q.answer}" rejected`);
      for (const c of q.choices) if (c !== q.answer) assert.ok(!isCorrect(c, q.answer), `${t.id}: wrong "${c}" accepted for "${q.answer}"`);
    }
  });
}

test('typed answers are forgiving about format', () => {
  assert.ok(isCorrect('1/2', '2/4'));
  assert.ok(isCorrect('0.5', '2/4'));
  assert.ok(isCorrect('-3', 'x = −3'));
  assert.ok(isCorrect('x=-3', 'x = −3'));
  assert.ok(isCorrect('2.5', '$2.50'));
  assert.ok(isCorrect('35', '35¢'));
  assert.ok(isCorrect('4,5', '(4, 5)'));
  assert.ok(isCorrect('(4, 5)', '(4, 5)'));
  assert.ok(!isCorrect('5,4', '(4, 5)'));
  assert.ok(isCorrect('660000', '660,000'));
  assert.ok(isCorrect(' Acute ', 'acute'));
  assert.ok(isCorrect('10:30', '10:30'));
  assert.ok(!isCorrect('', '0'));
  assert.ok(!isCorrect('12', '21'));
});

test('skipping resets the streak and counts as a skip', () => {
  const s = newPlayerStats();
  scoreAnswer(s, { correct: true, ms: 1000 });
  scoreSkip(s);
  assert.equal(s.streak, 0);
  assert.equal(s.skipped, 1);
  assert.equal(s.answered, 1);
});

test('makeQuestion respects topic filters', () => {
  for (let i = 0; i < 50; i++) assert.equal(makeQuestion(3, ['g3-area']).topic, 'g3-area');
});

test('correct answers score, streaks build, wrong answers reset', () => {
  const s = newPlayerStats();
  const r1 = scoreAnswer(s, { correct: true, ms: 20000 });
  assert.equal(r1.gained, 100);
  const r2 = scoreAnswer(s, { correct: true, ms: 20000 });
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
  assert.equal(scoreAnswer(s, { correct: true, ms: 20000 }).gained, 200);
  scoreAnswer(s, { correct: true, ms: 20000 });
  scoreAnswer(s, { correct: true, ms: 20000 });
  assert.equal(s.mult, 1);
  assert.equal(scoreAnswer(s, { correct: true, ms: 20000 }).gained, 130);
});
