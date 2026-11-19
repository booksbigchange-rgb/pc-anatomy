'use client';
import { ArrowRight, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { courses } from '@/lib/lessons';
import { lessonStatus, lessonsDone, type Progress } from '@/lib/progress';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progress: Progress;
  /** The lesson being taken, if any, so it can be marked. */
  current: string | null;
  onStart: (lesson: string) => void;
};

export default function CoursesDialog({
  open,
  onOpenChange,
  progress,
  current,
  onStart,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent className="courses-dialog">
        <DialogTitle>Lessons</DialogTitle>
        <DialogDescription>
          Short, hands-on lessons that use the 3D model. Your progress is saved
          in this browser. No account needed.
        </DialogDescription>
        {courses.map((course) => {
          const done = lessonsDone(progress, course);
          return (
            <section className="course" key={course.id}>
              <header>
                <h3>{course.title}</h3>
                <p>{course.summary}</p>
                <div className="course-meta">
                  <span>{course.audience}</span>
                  <span>
                    {done} of {course.lessons.length} done
                  </span>
                </div>
                <progress
                  className="course-progress"
                  aria-label={`${course.title} progress`}
                  value={done}
                  max={course.lessons.length}
                />
              </header>
              <ol>
                {course.lessons.map((lesson, i) => {
                  const status = lessonStatus(progress, lesson);
                  const here = lesson.id === current;
                  return (
                    <li key={lesson.id}>
                      <button
                        className={status + (here ? ' current' : '')}
                        onClick={() => onStart(lesson.id)}
                      >
                        <span className="course-number" aria-hidden="true">
                          {status === 'done' ? <Check size={14} /> : i + 1}
                        </span>
                        <span className="course-lesson">
                          <strong>{lesson.title}</strong>
                          <small>{lesson.summary}</small>
                        </span>
                        <span className="course-action">
                          {here
                            ? 'Now'
                            : status === 'started'
                              ? 'Continue'
                              : status === 'done'
                                ? 'Review'
                                : `${lesson.minutes} min`}
                          <ArrowRight size={13} />
                        </span>
                        <span className="sr-only">
                          {status === 'done'
                            ? ' (finished)'
                            : status === 'started'
                              ? ' (in progress)'
                              : ''}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </DialogContent>
    </Dialog>
  );
}
