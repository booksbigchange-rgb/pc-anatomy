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
  outcomeOf,
  reveal as revealAnswer,
  scoreOf,
  stepOf,
  type LessonRun,
  type Outcome,
} from '@/lib/lesson-run';
import {
  readProgress,
  recordDone,
  recordStep,
  resumeStep,
  writeProgress,
  type Progress,
  type Score,
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
  // How each check of the lesson being taken went, the first time it was
  // answered in this sitting, and the score of the lesson just finished.
  const [outcomes, setOutcomes] = useState<Record<number, Outcome>>({});
  const [lastScore, setLastScore] = useState<Score | null>(null);

  /** Take an answered run, noting its outcome if this step has none yet. */
  const answered = useCallback((next: LessonRun) => {
    setRun(next);
    const outcome = outcomeOf(next);
    if (outcome)
      setOutcomes((o) => (next.step in o ? o : { ...o, [next.step]: outcome }));
  }, []);

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
    (lesson: string, step?: number) => {
      const at = step ?? resumeStep(progress, lessonById[lesson]);
      // A new lesson, or the same one from the top, is a fresh sitting.
      if (run?.lesson !== lesson || at === 0) setOutcomes({});
      setLastScore(null);
      open(beginStep(lesson, at));
    },
    [open, progress, run?.lesson],
  );

  const next = useCallback(() => {
    if (!run?.solved) return;
    const moved = advance(run);
    if (moved.complete) {
      const score = scoreOf(run.lesson, outcomes);
      setRun(moved);
      setLastScore(score);
      setProgress((p) => recordDone(p, run.lesson, score));
    } else open(moved);
  }, [open, outcomes, run]);

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
    (index: number) => {
      if (run) answered(answerChoice(run, index));
    },
    [answered, run],
  );

  const pick = useCallback(
    (concept: string) => {
      if (run) answered(answerPick(run, concept));
    },
    [answered, run],
  );

  const reveal = useCallback(() => {
    if (!run) return;
    const check = stepOf(run).check;
    answered(revealAnswer(run));
    // Showing the answer to a find check means pointing at it on the stage.
    if (check?.kind === 'find')
      showScene({ ...stepOf(run).scene, part: check.answers[0], focus: true });
  }, [answered, run, showScene]);

  const exit = useCallback(() => setRun(null), []);

  const step = run ? stepOf(run) : null;
  return {
    run,
    progress,
    /** Checks right at the first try in the lesson just finished. */
    lastScore,
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
