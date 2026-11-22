'use client';
import { useEffect, useState } from 'react';
import { ArrowLeft, Award, Check, Printer } from 'lucide-react';
import { courses } from '@/lib/lessons';
import { lessonStatus, lessonsDone, type Progress } from '@/lib/progress';
import AcademyLogo from './academy-logo';
import { SCHOOL_NAME } from './links';

const nameKey = 'pc-anatomy:student-name:v1';

function readName() {
  try {
    return localStorage.getItem(nameKey) ?? '';
  } catch {
    return '';
  }
}

type Props = {
  progress: Progress;
  onHome: () => void;
  onStartLesson: (lesson: string) => void;
};

/**
 * A student's own record, made from what this browser has saved, to print
 * or show a teacher. There is no account behind it, so it says so, and it
 * carries the date it was made.
 */
export default function ProgressPage({
  progress,
  onHome,
  onStartLesson,
}: Props) {
  const [name, setName] = useState(readName);
  useEffect(() => {
    try {
      localStorage.setItem(nameKey, name);
    } catch {
      // Blocked storage: the name lasts until the page closes.
    }
  }, [name]);
  const today = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const finished = courses.filter(
    (c) => lessonsDone(progress, c) === c.lessons.length,
  );

  return (
    <div className="school report">
      <header className="school-top">
        <button
          type="button"
          className="school-brand"
          onClick={onHome}
          title="Back to the School home"
        >
          <AcademyLogo />
          <span>
            <strong>{SCHOOL_NAME}</strong>
            <small>My progress</small>
          </span>
        </button>
        <div className="teach-actions">
          <button type="button" className="header-button" onClick={onHome}>
            <ArrowLeft size={15} />
            <span>School home</span>
          </button>
          <button
            type="button"
            className="header-button"
            onClick={() => window.print()}
          >
            <Printer size={15} />
            <span>Print</span>
          </button>
        </div>
      </header>

      <main className="school-main">
        <section className="school-hero report-hero">
          <p className="school-eyebrow">Progress report · {today}</p>
          <h1>My progress</h1>
          <label className="report-name">
            <span>Your name, for the printout</span>
            <input
              type="text"
              value={name}
              maxLength={60}
              placeholder="Type your name"
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <p className="teach-note">
            This report is made from the progress saved in this browser on this
            device. “Right first time” counts the checks answered correctly at
            the first try, the best of every time the lesson was finished.
          </p>
        </section>

        {finished.map((course) => (
          <section
            key={course.id}
            className="certificate"
            aria-label={`Certificate: ${course.title}`}
          >
            <AcademyLogo />
            <div>
              <p className="certificate-kicker">
                <Award size={15} /> Certificate of completion
              </p>
              <h2>{name.trim() || 'Student'}</h2>
              <p>
                completed the course <strong>{course.title}</strong> at{' '}
                {SCHOOL_NAME}.
              </p>
              <p className="certificate-date">{today}</p>
            </div>
          </section>
        ))}

        {courses.map((course) => {
          const done = lessonsDone(progress, course);
          return (
            <section
              key={course.id}
              className="report-course"
              aria-labelledby={`report-${course.id}`}
            >
              <header>
                <h2 id={`report-${course.id}`}>{course.title}</h2>
                <span>
                  {done} of {course.lessons.length} lessons done
                </span>
              </header>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Lesson</th>
                    <th scope="col">Status</th>
                    <th scope="col">Right first time</th>
                  </tr>
                </thead>
                <tbody>
                  {course.lessons.map((lesson) => {
                    const status = lessonStatus(progress, lesson);
                    const entry = progress.lessons[lesson.id];
                    return (
                      <tr key={lesson.id} className={status}>
                        <th scope="row">
                          <button
                            type="button"
                            onClick={() => onStartLesson(lesson.id)}
                          >
                            {lesson.title}
                          </button>
                        </th>
                        <td>
                          {status === 'done' ? (
                            <>
                              <Check size={14} /> Done
                            </>
                          ) : status === 'started' ? (
                            `Step ${(entry?.step ?? 0) + 1} of ${lesson.steps.length}`
                          ) : (
                            'Not started'
                          )}
                        </td>
                        <td>
                          {entry?.best
                            ? `${entry.best.right} of ${entry.best.of} checks`
                            : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          );
        })}
      </main>
    </div>
  );
}
