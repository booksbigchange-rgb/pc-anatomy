import test from 'node:test';
import assert from 'node:assert/strict';
import { COFFEE_STEPS, coffeeFeedback } from '../app/coffee-lesson.ts';

void test('every coffee step has one right answer among its choices and a short explanation', () => {
  for (const step of COFFEE_STEPS) {
    assert.ok(step.choices.includes(step.answer), step.title);
    assert.equal(new Set(step.choices).size, step.choices.length, `${step.title} has no duplicate choices`);
    assert.ok(step.explanation.split(/[.!?]/).filter(Boolean).every(sentence => sentence.trim().split(/\s+/).length <= 25), `${step.title} uses short sentences`);
  }
});

void test('the lesson covers input, processing, working memory, output and storage', () => {
  const answers = COFFEE_STEPS.map(step => step.answer.split(':')[0]);
  for (const part of ['Input', 'CPU', 'RAM', 'Output', 'SSD']) assert.ok(answers.includes(part), part);
  assert.equal(answers[0], 'Input', 'The ceremony starts with input');
  assert.equal(answers.at(-1), 'SSD', 'It ends by keeping beans for later');
});

void test('feedback explains a right answer and hints on a wrong one', () => {
  const step = COFFEE_STEPS[3];
  assert.deepEqual(coffeeFeedback(step, step.answer), { correct: true, text: step.explanation });
  const wrong = coffeeFeedback(step, step.choices.find(choice => choice !== step.answer)!);
  assert.equal(wrong.correct, false);
  assert.match(wrong.text, /try again/);
});
