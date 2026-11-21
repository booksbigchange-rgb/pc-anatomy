import { howAComputerWorks } from './how-a-computer-works.ts';
import type { Course, Lesson } from './types.ts';

export type * from './types.ts';

/** Every course, in the order the course list shows them. */
export const courses: Course[] = [howAComputerWorks];

export const courseById: Record<string, Course> = Object.fromEntries(
  courses.map((course) => [course.id, course]),
);

/** Lesson ids are global, like concept ids: a link names a lesson alone. */
export const lessonById: Record<string, Lesson> = Object.fromEntries(
  courses.flatMap((course) => course.lessons.map((l) => [l.id, l])),
);

export function courseOf(lessonId: string): Course | undefined {
  return courses.find((course) =>
    course.lessons.some((lesson) => lesson.id === lessonId),
  );
}

/** The lesson after this one in its course, if there is one. */
export function nextLesson(lessonId: string): Lesson | undefined {
  const lessons = courseOf(lessonId)?.lessons ?? [];
  return lessons[lessons.findIndex((l) => l.id === lessonId) + 1];
}
