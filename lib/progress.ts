import type { Course, Lesson } from './lessons/types.ts';

/**
 * What a reader has finished, kept in their own browser.
 *
 * There are no accounts: progress belongs to the device it was made on, and
 * losing it costs nothing worse than seeing every lesson as new again. Every
 * read and write tolerates a storage that throws (private windows, blocked
 * site data) or holds something unexpected, and falls back to empty.
 */

/** Checks answered right at the first try, out of the checks in a lesson. */
export type Score = { right: number; of: number };

export type Progress = {
  lessons: Record<string, { done?: boolean; step?: number; best?: Score }>;
};

export const progressKey = 'pc-anatomy:progress:v1';

type Store = Pick<Storage, 'getItem' | 'setItem'>;

export const emptyProgress = (): Progress => ({ lessons: {} });

export function readProgress(store: Store | null): Progress {
  try {
    const raw = store?.getItem(progressKey);
    if (!raw) return emptyProgress();
    const parsed: unknown = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !('lessons' in parsed) ||
      !parsed.lessons ||
      typeof parsed.lessons !== 'object'
    )
      return emptyProgress();
    const lessons: Progress['lessons'] = {};
    for (const [id, entry] of Object.entries(parsed.lessons)) {
      if (!entry || typeof entry !== 'object') continue;
      const { done, step, best } = entry as Record<string, unknown>;
      lessons[id] = {
        ...(done === true ? { done: true } : {}),
        ...(Number.isInteger(step) && (step as number) >= 0
          ? { step: step as number }
          : {}),
        ...(isScore(best) ? { best } : {}),
      };
    }
    return { lessons };
  } catch {
    return emptyProgress();
  }
}

export function writeProgress(store: Store | null, progress: Progress) {
  try {
    store?.setItem(progressKey, JSON.stringify(progress));
  } catch {
    // Storage full or blocked: progress is a convenience, not a record.
  }
}

/** Remember where a reader got to, so the course list can offer Continue. */
export function recordStep(
  progress: Progress,
  lesson: string,
  step: number,
): Progress {
  const entry = progress.lessons[lesson] ?? {};
  if (entry.step === step) return progress;
  return {
    lessons: { ...progress.lessons, [lesson]: { ...entry, step } },
  };
}

function isScore(value: unknown): value is Score {
  if (!value || typeof value !== 'object') return false;
  const { right, of } = value as Record<string, unknown>;
  return (
    Number.isInteger(right) &&
    Number.isInteger(of) &&
    (right as number) >= 0 &&
    (right as number) <= (of as number)
  );
}

/**
 * Mark a lesson finished, keeping the better of this score and any earlier
 * one: a student who reviews a lesson should never see their record go down.
 */
export function recordDone(
  progress: Progress,
  lesson: string,
  score?: Score,
): Progress {
  const before = progress.lessons[lesson];
  const best =
    score && (!before?.best || score.right > before.best.right)
      ? score
      : before?.best;
  return {
    lessons: {
      ...progress.lessons,
      [lesson]: { done: true, step: 0, ...(best ? { best } : {}) },
    },
  };
}

export type LessonStatus = 'done' | 'started' | 'new';

export function lessonStatus(progress: Progress, lesson: Lesson): LessonStatus {
  const entry = progress.lessons[lesson.id];
  if (entry?.done) return 'done';
  if (entry?.step && entry.step > 0 && entry.step < lesson.steps.length)
    return 'started';
  return 'new';
}

/** The step to reopen a lesson at: where the reader left off, or the start. */
export function resumeStep(progress: Progress, lesson: Lesson) {
  return lessonStatus(progress, lesson) === 'started'
    ? progress.lessons[lesson.id].step!
    : 0;
}

export function lessonsDone(progress: Progress, course: Course) {
  return course.lessons.filter((l) => progress.lessons[l.id]?.done).length;
}
