import type { Course, Lesson } from './lessons/types.ts';

/**
 * What a reader has finished, kept in their own browser.
 *
 * There are no accounts: progress belongs to the device it was made on, and
 * losing it costs nothing worse than seeing every lesson as new again. Every
 * read and write tolerates a storage that throws (private windows, blocked
 * site data) or holds something unexpected, and falls back to empty.
 */

export type Progress = {
  lessons: Record<string, { done?: boolean; step?: number }>;
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
      const { done, step } = entry as Record<string, unknown>;
      lessons[id] = {
        ...(done === true ? { done: true } : {}),
        ...(Number.isInteger(step) && (step as number) >= 0
          ? { step: step as number }
          : {}),
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

export function recordDone(progress: Progress, lesson: string): Progress {
  if (progress.lessons[lesson]?.done && progress.lessons[lesson].step === 0)
    return progress;
  return {
    lessons: { ...progress.lessons, [lesson]: { done: true, step: 0 } },
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
