import { test } from 'node:test';
import assert from 'node:assert/strict';
import { courses, lessonById } from '../lib/lessons/index.ts';
import {
  answerChoice,
  answerPick,
  beginStep,
  outcomeOf,
  reveal,
  scoreOf,
} from '../lib/lesson-run.ts';
import {
  emptyProgress,
  progressKey,
  readProgress,
  recordDone,
} from '../lib/progress.ts';
import {
  assignmentKey,
  cleanAssignment,
  readAssignment,
  writeAssignment,
} from '../lib/assignment.ts';
import { readAddress, writeAddress } from '../lib/url-state.ts';

const memoryStore = () => {
  const memory = new Map<string, string>();
  return {
    memory,
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => void memory.set(k, v),
    removeItem: (k: string) => void memory.delete(k),
  };
};

await test('a check is right first time, right later, or given away', () => {
  const lesson = lessonById['meet-the-machine'];
  const find = lesson.steps.findIndex((s) => s.check?.kind === 'find');
  const choice = lesson.steps.findIndex((s) => s.check?.kind === 'choice');
  assert.equal(
    outcomeOf(beginStep(lesson.id, 0)),
    null,
    'no check, no outcome',
  );
  assert.equal(outcomeOf(beginStep(lesson.id, find)), null, 'unanswered');
  assert.equal(
    outcomeOf(answerPick(beginStep(lesson.id, find), 'graphicscard')),
    'first',
  );
  assert.equal(
    outcomeOf(
      answerPick(answerPick(beginStep(lesson.id, find), 'psu'), 'graphicscard'),
    ),
    'later',
  );
  assert.equal(
    outcomeOf(
      reveal(answerChoice(answerChoice(beginStep(lesson.id, choice), 0), 2)),
    ),
    'revealed',
  );
  const checks = lesson.steps.filter((s) => s.check).length;
  assert.deepEqual(scoreOf(lesson.id, { [find]: 'first', [choice]: 'later' }), {
    right: 1,
    of: checks,
  });
  assert.deepEqual(scoreOf(lesson.id, {}), { right: 0, of: checks });
});

await test('finishing keeps the best score, and scores survive storage', () => {
  let progress = recordDone(emptyProgress(), 'meet-the-machine', {
    right: 1,
    of: 2,
  });
  progress = recordDone(progress, 'meet-the-machine', { right: 0, of: 2 });
  assert.deepEqual(progress.lessons['meet-the-machine'].best, {
    right: 1,
    of: 2,
  });
  progress = recordDone(progress, 'meet-the-machine', { right: 2, of: 2 });
  assert.deepEqual(progress.lessons['meet-the-machine'].best, {
    right: 2,
    of: 2,
  });
  progress = recordDone(progress, 'meet-the-machine');
  assert.deepEqual(progress.lessons['meet-the-machine'].best, {
    right: 2,
    of: 2,
  });
  const store = memoryStore();
  store.setItem(
    progressKey,
    JSON.stringify({
      lessons: {
        a: { done: true, best: { right: 2, of: 3 } },
        b: { best: { right: 4, of: 3 } },
        c: { best: 'x' },
      },
    }),
  );
  assert.deepEqual(readProgress(store), {
    lessons: { a: { done: true, best: { right: 2, of: 3 } }, b: {}, c: {} },
  });
});

await test('assignments keep known lessons once, in order, with a short title', () => {
  const [a, b] = courses[0].lessons.map((l) => l.id);
  assert.deepEqual(cleanAssignment([b, 'nope', a, b], '  Week 3  '), {
    lessons: [b, a],
    title: 'Week 3',
  });
  assert.equal(cleanAssignment(['nope']), null);
  assert.equal(cleanAssignment('x'), null);
  assert.equal(cleanAssignment([a], 'x'.repeat(200))!.title!.length, 80);
  const store = memoryStore();
  writeAssignment(store, { lessons: [a] });
  assert.deepEqual(readAssignment(store), { lessons: [a] });
  store.setItem(assignmentKey, '{broken');
  assert.equal(readAssignment(store), null);
  writeAssignment(store, null);
  assert.equal(store.memory.has(assignmentKey), false);
  const throwing = {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('blocked');
    },
    removeItem: () => {
      throw new Error('blocked');
    },
  };
  assert.equal(readAssignment(throwing), null);
  writeAssignment(throwing, { lessons: [a] });
});

await test('teacher, progress and assignment addresses round-trip', () => {
  assert.deepEqual(readAddress('?teach'), { kind: 'teacher' });
  assert.equal(writeAddress({ kind: 'teacher' }), '?teach');
  assert.deepEqual(readAddress('?progress'), { kind: 'progress' });
  assert.equal(writeAddress({ kind: 'progress' }), '?progress');
  const [a, b] = courses[1].lessons.map((l) => l.id);
  const search = writeAddress({
    kind: 'assignment',
    assignment: { lessons: [a, b], title: 'Chips & gates' },
  });
  assert.deepEqual(readAddress(search), {
    kind: 'assignment',
    assignment: { lessons: [a, b], title: 'Chips & gates' },
  });
  assert.deepEqual(readAddress('?assign=nope,also-nope'), { kind: 'home' });
});
