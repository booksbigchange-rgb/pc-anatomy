import { byId } from './manifest.ts';
import { lessonById } from './lessons/index.ts';
import type { LessonStep } from './lessons/types.ts';

/**
 * One reader's way through one lesson: which step, and how the current check
 * is going. Pure, so the rules — when Next unlocks, when "Show me" appears —
 * are tested without a browser.
 */

export type Feedback = {
  tone: 'correct' | 'wrong' | 'revealed';
  text: string;
};

export type LessonRun = {
  lesson: string;
  step: number;
  /** Whether Next is open: true at once for a step with no check. */
  solved: boolean;
  /** Wrong answers given on this step. */
  attempts: number;
  /** Choice indices already tried and wrong, so they can be marked. */
  wrong: number[];
  feedback: Feedback | null;
  /** The last step has been passed: the lesson is over. */
  complete: boolean;
};

/** Wrong answers before the panel offers to show the answer. */
export const revealAfter = 2;

export function stepOf(run: LessonRun): LessonStep {
  return lessonById[run.lesson].steps[run.step];
}

export function beginStep(lesson: string, step: number): LessonRun {
  const steps = lessonById[lesson].steps;
  const index = Math.min(steps.length - 1, Math.max(0, step));
  return {
    lesson,
    step: index,
    solved: !steps[index].check,
    attempts: 0,
    wrong: [],
    feedback: null,
    complete: false,
  };
}

export function answerChoice(run: LessonRun, index: number): LessonRun {
  const check = stepOf(run).check;
  if (check?.kind !== 'choice' || run.solved) return run;
  if (index === check.answer)
    return {
      ...run,
      solved: true,
      feedback: { tone: 'correct', text: check.explain },
    };
  return {
    ...run,
    attempts: run.attempts + 1,
    wrong: run.wrong.includes(index) ? run.wrong : [...run.wrong, index],
    feedback: { tone: 'wrong', text: 'Not quite. Have another go.' },
  };
}

export function answerPick(run: LessonRun, concept: string): LessonRun {
  const check = stepOf(run).check;
  if (check?.kind !== 'find' || run.solved) return run;
  const name = byId[concept]?.shortName ?? 'that';
  if (check.answers.includes(concept))
    return {
      ...run,
      solved: true,
      feedback: { tone: 'correct', text: `Yes, that’s the ${name}.` },
    };
  return {
    ...run,
    attempts: run.attempts + 1,
    feedback: {
      tone: 'wrong',
      text: `That’s the ${name}. ${check.hint}`,
    },
  };
}

/** Give the answer away, for a reader who is stuck. Still unlocks Next. */
export function reveal(run: LessonRun): LessonRun {
  const check = stepOf(run).check;
  if (!check || run.solved) return run;
  const text =
    check.kind === 'choice'
      ? `The answer is “${check.options[check.answer]}”. ${check.explain}`
      : `Here it is: the ${byId[check.answers[0]].shortName}, now highlighted.`;
  return { ...run, solved: true, feedback: { tone: 'revealed', text } };
}

/**
 * How a check went: right at the first try, right after a wrong answer, or
 * given away with "Show me". Null while it is unanswered or has no check.
 */
export type Outcome = 'first' | 'later' | 'revealed';

export function outcomeOf(run: LessonRun): Outcome | null {
  if (!stepOf(run).check || !run.solved || !run.feedback) return null;
  if (run.feedback.tone === 'revealed') return 'revealed';
  return run.attempts === 0 ? 'first' : 'later';
}

/** A lesson's score from the outcomes recorded on its steps. */
export function scoreOf(
  lesson: string,
  outcomes: Record<number, Outcome>,
): { right: number; of: number } {
  const steps = lessonById[lesson].steps;
  const checks = steps.flatMap((s, i) => (s.check ? [i] : []));
  return {
    right: checks.filter((i) => outcomes[i] === 'first').length,
    of: checks.length,
  };
}

export function canReveal(run: LessonRun) {
  return !run.solved && run.attempts >= revealAfter;
}

/** Move on, or finish the lesson from its last step. */
export function advance(run: LessonRun): LessonRun {
  if (!run.solved) return run;
  const last = lessonById[run.lesson].steps.length - 1;
  return run.step >= last
    ? { ...run, complete: true }
    : beginStep(run.lesson, run.step + 1);
}
