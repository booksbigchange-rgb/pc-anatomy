import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EMPTY_OS, FINAL_QUESTIONS, assessmentResult, osAction, readCourse, saveCourse } from '../app/course-model.ts';

await test('Virtual OS preserves saved data through shutdown, discards working data, and restores a deleted file', () => {
  assert.equal(osAction(EMPTY_OS, 'open').state.editor, false);
  let state = osAction(EMPTY_OS, 'power').state;
  assert.equal(osAction(state, 'open').state.editor, false);
  state = osAction(state, 'sign-in').state;
  assert.equal(osAction(state, 'save', 'hello').state.saved, null);
  state = osAction(state, 'open').state;
  assert.equal(osAction(state, 'save', '  ').state.saved, null);
  state = osAction(state, 'save', 'My lesson').state;
  state = osAction({ ...state, draft: 'Unsaved change' }, 'shutdown').state;
  assert.equal(state.draft, ''); assert.equal(state.saved, 'My lesson');
  state = osAction(state, 'power').state; state = osAction(state, 'sign-in').state;
  state = osAction(state, 'reopen').state; assert.equal(state.draft, 'My lesson');
  state = osAction(state, 'delete').state; assert.equal(state.saved, null); assert.equal(state.deleted, 'My lesson');
  state = osAction(state, 'restore').state; assert.equal(state.saved, 'My lesson'); assert.equal(state.deleted, null);
});
await test('Final assessment counts valid answers and does not award a perfect result for unanswered or incorrect questions', () => {
  assert.deepEqual(assessmentResult({}), { answered: 0, correct: 0, complete: false, percent: 0 });
  const answers = Object.fromEntries(FINAL_QUESTIONS.map(q => [q.id, q.answer]));
  assert.equal(assessmentResult(answers).percent, 100);
  assert.equal(assessmentResult({ ...answers, cpu: 'Speaker' }).percent, 88);
  assert.equal(assessmentResult({ ...answers, cpu: 'invented' }).complete, false);
});
await test('Course progress survives reload, rejects corrupt values, and reports unavailable storage', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  let value: string | null = null;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => value, setItem: (_key: string, next: string) => { value = next; } } });
  try {
    assert.equal(saveCourse({ flow: true }), true); saveCourse({ os: true, laptopScore: 80 });
    assert.equal(readCourse().flow, true); assert.equal(readCourse().os, true); assert.equal(readCourse().laptopScore, 80);
    value = '{"flow":"true","laptopScore":101,"finalAnswers":{"cpu":"fake","ram":"RAM"}}';
    assert.equal(readCourse().flow, false); assert.equal(readCourse().laptopScore, null); assert.deepEqual(readCourse().finalAnswers, { ram: 'RAM' });
    value = 'null'; assert.equal(readCourse().os, false);
    value = '{bad'; assert.equal(readCourse().flow, false);
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => { throw Error('blocked'); }, setItem: () => { throw Error('quota'); } } });
    assert.equal(saveCourse({ flow: true }), false); assert.equal(readCourse().flow, false);
  } finally { if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor); else Reflect.deleteProperty(globalThis, 'localStorage'); }
});
