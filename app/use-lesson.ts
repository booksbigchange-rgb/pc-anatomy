'use client';
import { useCallback, useEffect, useState } from 'react';
import type { Scene } from '@/lib/explorer-state';
import { lessonById } from '@/lib/lessons';
import {
  advance,
  answerChoice,
  answerPick,
  beginStep,
  canReveal,
  reveal as revealAnswer,
  stepOf,
  type LessonRun,
} from '@/lib/lesson-run';
import {
  readProgress,
  recordDone,
  recordStep,
  resumeStep,
  writeProgress,
  type Progress,
} from '@/lib/progress';

/** localStorage, or nothing where reading it throws. */
function storage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * The lesson being taken, as named moves, the way `useExplorer` is the
 * explorer. Each move that changes step also moves the stage, through the one
 * `showScene` the explorer exposes, so a lesson never assembles explorer
 * state of its own.
 */
export function useLesson(
  showScene: (scene: Scene) => void,
  start: { lesson: string; step: number } | null,
) {
  const [run, setRun] = useState<LessonRun | null>(() =>
    start ? beginStep(start.lesson, start.step) : null,
  );
  const [progress, setProgress] = useState<Progress>(() =>
    readProgress(storage()),
  );
  useEffect(() => writeProgress(storage(), progress), [progress]);

  const open = useCallback(
    (next: LessonRun) => {
      setRun(next);
      setProgress((p) => recordStep(p, next.lesson, next.step));
      showScene(stepOf(next).scene);
    },
    [showScene],
  );

  /** Start a lesson where the reader left it, or at a given step. */
  const begin = useCallback(
    (lesson: string, step?: number) =>
      open(beginStep(lesson, step ?? resumeStep(progress, lessonById[lesson]))),
    [open, progress],
  );

  const next = useCallback(() => {
    if (!run?.solved) return;
    const moved = advance(run);
    if (moved.complete) {
      setRun(moved);
      setProgress((p) => recordDone(p, run.lesson));
    } else open(moved);
  }, [open, run]);

  const goTo = useCallback(
    (step: number) => {
      if (run) open(beginStep(run.lesson, step));
    },
    [open, run],
  );

  /** Put the stage back the way this step set it out. */
  const replay = useCallback(() => {
    if (run) showScene(stepOf(run).scene);
  }, [run, showScene]);

  const choose = useCallback(
    (index: number) => setRun((r) => r && answerChoice(r, index)),
    [],
  );

  const pick = useCallback(
    (concept: string) => setRun((r) => r && answerPick(r, concept)),
    [],
  );

  const reveal = useCallback(() => {
    if (!run) return;
    const check = stepOf(run).check;
    setRun(revealAnswer(run));
    // Showing the answer to a find check means pointing at it on the stage.
    if (check?.kind === 'find')
      showScene({ ...stepOf(run).scene, part: check.answers[0], focus: true });
  }, [run, showScene]);

  const exit = useCallback(() => setRun(null), []);

  const step = run ? stepOf(run) : null;
  return {
    run,
    progress,
    lesson: run ? lessonById[run.lesson] : null,
    step,
    /** A click on the stage is an answer, not a dive. */
    awaitingPick:
      !!run && !run.complete && !run.solved && step?.check?.kind === 'find',
    revealable: !!run && canReveal(run),
    begin,
    next,
    goTo,
    replay,
    choose,
    pick,
    reveal,
    exit,
  };
}

export type LessonControls = ReturnType<typeof useLesson>;
