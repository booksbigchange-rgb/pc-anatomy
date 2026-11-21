import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { byId } from '../lib/manifest.ts';
import { levels, rootLevel } from '../lib/levels.ts';
import { sources } from '../lib/sources.ts';
import {
  courses,
  courseOf,
  lessonById,
  nextLesson,
} from '../lib/lessons/index.ts';
import {
  advance,
  answerChoice,
  answerPick,
  beginStep,
  canReveal,
  reveal,
  revealAfter,
} from '../lib/lesson-run.ts';
import {
  emptyProgress,
  lessonStatus,
  lessonsDone,
  progressKey,
  readProgress,
  recordDone,
  recordStep,
  resumeStep,
  writeProgress,
} from '../lib/progress.ts';
import {
  initialState,
  showScene,
  type ExplorerState,
} from '../lib/explorer-state.ts';
import { addressOf, readAddress, writeAddress } from '../lib/url-state.ts';

// Building geometry needs the canvas texture API but not WebGL; the same stub
// tests/models.test.ts uses.
const previousDocument = globalThis.document;
globalThis.document = {
  createElement: () => ({
    width: 0,
    height: 0,
    getContext: () =>
      new Proxy(
        {},
        {
          get: (_, key) =>
            key === 'createImageData'
              ? (w: number, h: number) => ({
                  data: new Uint8ClampedArray(w * h * 4),
                })
              : () => {},
        },
      ),
  }),
} as unknown as Document;
after(() => {
  globalThis.document = previousDocument;
});
const { buildModel } = await import('../lib/models.ts');

const allLessons = courses.flatMap((c) => c.lessons);
const allSteps = allLessons.flatMap((lesson) =>
  lesson.steps.map((step, index) => ({ lesson, step, index })),
);
// Built up front, while the stub above is in place.
const models = new Map(
  [...new Set(allSteps.map(({ step }) => step.scene.level))]
    .filter((level) => Object.hasOwn(levels, level))
    .map((level) => [level, buildModel(level)]),
);
const where = (lesson: { id: string }, index: number) =>
  `${lesson.id} step ${index + 1}`;

await test('courses and lessons have unique ids and complete text', () => {
  assert.equal(new Set(courses.map((c) => c.id)).size, courses.length);
  assert.equal(new Set(allLessons.map((l) => l.id)).size, allLessons.length);
  assert.equal(Object.keys(lessonById).length, allLessons.length);
  for (const course of courses) {
    assert.ok(course.title && course.summary && course.audience, course.id);
    assert.ok(course.lessons.length > 0, course.id);
  }
  for (const lesson of allLessons) {
    // Ids appear in links, so they are kept to URL-safe slugs.
    assert.match(lesson.id, /^[a-z0-9]+(-[a-z0-9]+)*$/, lesson.id);
    assert.ok(lesson.title && lesson.summary && lesson.minutes > 0, lesson.id);
    assert.ok(lesson.steps.length >= 3, lesson.id);
    assert.equal(courseOf(lesson.id)?.lessons.includes(lesson), true);
  }
  for (const { lesson, step, index } of allSteps) {
    assert.ok(step.title.trim(), where(lesson, index));
    assert.ok(step.body.length > 0, where(lesson, index));
    for (const paragraph of step.body)
      assert.ok(paragraph.trim(), where(lesson, index));
  }
});

await test('every lesson ends with a check, and every check is answerable', () => {
  for (const lesson of allLessons)
    assert.ok(lesson.steps.at(-1)!.check, `${lesson.id} ends without a check`);
  for (const { lesson, step, index } of allSteps) {
    const check = step.check;
    if (!check) continue;
    const at = where(lesson, index);
    assert.ok(check.prompt.trim(), at);
    if (check.kind === 'choice') {
      assert.ok(check.options.length >= 2, at);
      assert.equal(new Set(check.options).size, check.options.length, at);
      assert.ok(
        Number.isInteger(check.answer) &&
          check.answer >= 0 &&
          check.answer < check.options.length,
        at,
      );
      assert.ok(check.explain.trim(), at);
    } else {
      assert.ok(check.answers.length > 0 && check.hint.trim(), at);
      // A find check that pre-selects its own answer gives it away.
      assert.ok(
        !step.scene.part || !check.answers.includes(step.scene.part),
        `${at} selects its own answer`,
      );
      for (const id of check.answers)
        assert.equal(byId[id]?.level, step.scene.level, `${at}: ${id}`);
    }
  }
});

await test('every step names a real scale, a part that lives there, and real sources', () => {
  for (const { lesson, step, index } of allSteps) {
    const at = where(lesson, index);
    assert.ok(Object.hasOwn(levels, step.scene.level), at);
    if (step.scene.part)
      assert.equal(byId[step.scene.part]?.level, step.scene.level, at);
    const explode = step.scene.explode ?? 0;
    assert.ok(explode >= 0 && explode <= 100, at);
    for (const id of step.sources ?? [])
      assert.ok(Object.hasOwn(sources, id), `${at}: source ${id}`);
    assert.equal(
      new Set(step.sources ?? []).size,
      (step.sources ?? []).length,
      at,
    );
  }
});

await test('every part a step shows or asks for is drawn at that disassembly', () => {
  for (const { lesson, step, index } of allSteps) {
    const ids = [
      ...(step.scene.part ? [step.scene.part] : []),
      ...(step.check?.kind === 'find' ? step.check.answers : []),
    ];
    const explode = (step.scene.explode ?? 0) / 100;
    for (const id of ids) {
      // The scene's own visibility rule: a piece with a reveal threshold
      // only appears once the disassembly has passed it.
      const shown = models
        .get(step.scene.level)!
        .pieces.some(
          (p) => p.concept === id && (p.reveal === 0 || explode > p.reveal),
        );
      assert.ok(shown, `${where(lesson, index)}: ${id} is not on screen`);
    }
  }
});

await test('a step opens Next at once, or only after its check is answered', () => {
  const lesson = lessonById['meet-the-machine'];
  const reading = beginStep(lesson.id, 0);
  assert.equal(reading.solved, true);

  const findIndex = lesson.steps.findIndex((s) => s.check?.kind === 'find');
  let run = beginStep(lesson.id, findIndex);
  assert.equal(run.solved, false);
  assert.equal(advance(run), run, 'Next is closed until the check is solved');
  run = answerPick(run, 'psu');
  assert.equal(run.solved, false);
  assert.equal(run.feedback?.tone, 'wrong');
  assert.match(run.feedback!.text, /PSU/, 'says what was clicked instead');
  assert.equal(canReveal(run), revealAfter <= 1);
  run = answerPick(run, 'graphicscard');
  assert.equal(run.solved, true);
  assert.equal(run.feedback?.tone, 'correct');
  assert.equal(answerChoice(run, 0), run, 'a find step ignores choices');

  const choiceIndex = lesson.steps.findIndex((s) => s.check?.kind === 'choice');
  const check = lesson.steps[choiceIndex].check;
  assert.equal(check?.kind, 'choice');
  if (check?.kind !== 'choice') return;
  const wrong = check.options.findIndex((_, i) => i !== check.answer);
  run = beginStep(lesson.id, choiceIndex);
  for (let i = 0; i < revealAfter; i++) run = answerChoice(run, wrong);
  assert.deepEqual(
    run.wrong,
    [wrong],
    'a repeated wrong answer is marked once',
  );
  assert.equal(run.attempts, revealAfter);
  assert.equal(canReveal(run), true);
  run = reveal(run);
  assert.equal(run.solved, true);
  assert.equal(run.feedback?.tone, 'revealed');
  assert.equal(canReveal(run), false);
});

await test('advancing walks every step and completes on the last', () => {
  for (const lesson of allLessons) {
    let run = beginStep(lesson.id, 0);
    for (let i = 0; i < lesson.steps.length; i++) {
      assert.equal(run.step, i);
      assert.equal(run.complete, false);
      run = advance(run.solved ? run : reveal(run));
    }
    assert.equal(run.complete, true, lesson.id);
  }
  const first = courses[0].lessons;
  assert.equal(nextLesson(first[0].id), first[1]);
  assert.equal(nextLesson(first.at(-1)!.id), undefined);
  assert.equal(beginStep(first[0].id, 999).step, first[0].steps.length - 1);
});

await test('a scene arrives clean and refuses parts from another scale', () => {
  const messy: ExplorerState = {
    ...initialState,
    level: 'card',
    explode: 70,
    hidden: ['fan'],
    visible: [],
    isolated: true,
    view: 'top',
    airflow: 'on',
    diveInto: 'package',
  };
  const shown = showScene(messy, { level: 'motherboard', part: 'ram' });
  assert.equal(shown.level, 'motherboard');
  assert.equal(shown.explode, 0);
  assert.deepEqual(shown.hidden, []);
  assert.equal(shown.visible.length, initialState.visible.length);
  assert.deepEqual(shown.selection, { concept: 'ram' });
  assert.equal(shown.isolated, false);
  assert.equal(shown.view, 'perspective');
  assert.equal(shown.airflow, 'auto');
  assert.equal(shown.diveInto, null);
  assert.equal(shown.focusRevision, 0);
  assert.equal(shown.cameraRevision, messy.cameraRevision + 1);

  const foreign = showScene(initialState, { level: 'pc', part: 'ram' });
  assert.equal(foreign.selection, null, 'ram lives on the motherboard scale');
  const focused = showScene(initialState, {
    level: 'card',
    part: 'vapor',
    focus: true,
    explode: 140,
  });
  assert.ok(focused.focusRevision > 0);
  assert.equal(focused.explode, 100);
});

await test('addresses round-trip and forgive anything they do not recognise', () => {
  // The bare address is the School home, so the untouched tower has its own.
  assert.equal(writeAddress(addressOf(initialState)), '?scale=pc');
  assert.deepEqual(readAddress(''), { kind: 'home' });
  assert.equal(writeAddress({ kind: 'home' }), '');
  assert.deepEqual(readAddress('?lab=laptop'), { kind: 'lab', lab: 'laptop' });
  assert.equal(writeAddress({ kind: 'lab', lab: 'build' }), '?lab=build');
  assert.deepEqual(readAddress('?lab=nowhere'), { kind: 'home' });

  const view = showScene(initialState, {
    level: 'card',
    part: 'vapor',
    explode: 60,
    focus: true,
    view: 'top',
    airflow: 'off',
  });
  const search = writeAddress(addressOf(view));
  assert.equal(
    search,
    '?scale=card&part=vapor&explode=60&view=top&airflow=off&focus=1',
  );
  const read = readAddress(search);
  assert.equal(read.kind, 'view');
  if (read.kind !== 'view') return;
  assert.deepEqual(
    addressOf(showScene(initialState, read.scene)),
    addressOf(view),
  );

  assert.deepEqual(readAddress('?scale=nowhere&part=vapor'), { kind: 'home' });
  assert.deepEqual(readAddress('?scale=toString'), { kind: 'home' });
  assert.deepEqual(
    readAddress('?scale=pc&part=vapor&explode=abc&view=sideways&airflow=x'),
    { kind: 'view', scene: { level: 'pc' } },
  );
  assert.deepEqual(readAddress('?scale=pc&explode=250'), {
    kind: 'view',
    scene: { level: 'pc', explode: 100 },
  });

  const lesson = courses[0].lessons[1];
  assert.equal(
    writeAddress({ kind: 'lesson', lesson: lesson.id, step: 2 }),
    `?lesson=${lesson.id}&step=3`,
  );
  assert.deepEqual(readAddress(`?lesson=${lesson.id}&step=3`), {
    kind: 'lesson',
    lesson: lesson.id,
    step: 2,
  });
  assert.equal(
    readAddress(`?lesson=${lesson.id}&step=999`).kind === 'lesson' &&
      (readAddress(`?lesson=${lesson.id}&step=999`) as { step: number }).step,
    lesson.steps.length - 1,
  );
  assert.deepEqual(readAddress(`?lesson=${lesson.id}&step=0`), {
    kind: 'lesson',
    lesson: lesson.id,
    step: 0,
  });
  assert.deepEqual(readAddress('?lesson=no-such-lesson&scale=sm'), {
    kind: 'view',
    scene: { level: 'sm' },
  });
  assert.equal(rootLevel, 'pc');
});

await test('progress survives bad storage and records what was finished', () => {
  const memory = new Map<string, string>();
  const store = {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => void memory.set(k, v),
  };
  const throwing = {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('blocked');
    },
  };
  assert.deepEqual(readProgress(null), emptyProgress());
  assert.deepEqual(readProgress(throwing), emptyProgress());
  writeProgress(throwing, emptyProgress());
  for (const junk of ['{', 'null', '[]', '{"lessons":3}'])
    assert.deepEqual(
      (memory.set(progressKey, junk), readProgress(store)),
      emptyProgress(),
      junk,
    );
  memory.set(
    progressKey,
    '{"lessons":{"a":{"done":true,"step":"x"},"b":{"step":-1},"c":7}}',
  );
  assert.deepEqual(readProgress(store), {
    lessons: { a: { done: true }, b: {} },
  });

  const course = courses[0];
  const [first, second] = course.lessons;
  let progress = recordStep(emptyProgress(), second.id, 2);
  assert.equal(lessonStatus(progress, second), 'started');
  assert.equal(resumeStep(progress, second), 2);
  assert.equal(lessonStatus(progress, first), 'new');
  assert.equal(recordStep(progress, second.id, 2), progress);
  progress = recordDone(progress, first.id);
  assert.equal(lessonStatus(progress, first), 'done');
  assert.equal(resumeStep(progress, first), 0, 'a finished lesson restarts');
  assert.equal(lessonsDone(progress, course), 1);
  writeProgress(store, progress);
  assert.deepEqual(readProgress(store), progress);
});
