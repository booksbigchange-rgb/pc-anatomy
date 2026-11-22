'use client';
import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  MousePointerClick,
  Printer,
} from 'lucide-react';
import { byId } from '@/lib/manifest';
import { courses, type Lesson } from '@/lib/lessons';
import { writeAddress, type Address } from '@/lib/url-state';
import AcademyLogo from './academy-logo';
import { SCHOOL_NAME } from './links';

type Props = { onHome: () => void };

/** A full link to an address on this site, for pasting into a class page. */
function linkTo(address: Address) {
  return location.origin + location.pathname + writeAddress(address);
}

/** Copy text, reporting whether it worked so the button can say so. */
async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<'idle' | 'done' | 'failed'>('idle');
  return (
    <button
      type="button"
      className="teach-copy"
      onClick={async () => {
        setState((await copy(text)) ? 'done' : 'failed');
        setTimeout(() => setState('idle'), 2200);
      }}
    >
      {state === 'done' ? <Check size={14} /> : <Copy size={14} />}
      {state === 'done'
        ? 'Copied'
        : state === 'failed'
          ? 'Copy failed: select the link'
          : label}
    </button>
  );
}

/** The answer to one check, written for a teacher's key. */
function answerOf(lesson: Lesson, index: number) {
  const check = lesson.steps[index].check!;
  if (check.kind === 'choice')
    return { answer: check.options[check.answer], note: check.explain };
  return {
    answer:
      'Click: ' + check.answers.map((id) => byId[id].shortName).join(' or '),
    note: check.hint,
  };
}

/**
 * For teachers: every lesson with its outline and answer key, links to send
 * to a class, and a builder for an assignment link. There are no accounts,
 * so nothing here can see a student's progress; the page says how to get it.
 */
export default function TeacherPage({ onHome }: Props) {
  const [chosen, setChosen] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const assignment = useMemo(() => {
    // Keep the course order, whatever order the boxes were ticked in.
    const lessons = courses
      .flatMap((c) => c.lessons.map((l) => l.id))
      .filter((id) => chosen.includes(id));
    return lessons.length
      ? linkTo({
          kind: 'assignment',
          assignment: title.trim()
            ? { lessons, title: title.trim().slice(0, 80) }
            : { lessons },
        })
      : '';
  }, [chosen, title]);

  return (
    <div className="school teach">
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
            <small>For teachers</small>
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
        <section className="school-hero teach-hero">
          <p className="school-eyebrow">For teachers</p>
          <h1>Lessons, answer keys and links for your class.</h1>
          <p>
            Every lesson is listed below with its steps and the answers to its
            checks. Send students a link to one lesson, or build an assignment
            link for several.
          </p>
          <p className="teach-note">
            There are no accounts, so this page cannot see your students’
            progress: it stays in each student’s own browser. Ask students to
            open <strong>My progress</strong> on the School home and print it or
            show you. Anyone who opens this page can see the answer keys.
          </p>
        </section>

        <section className="teach-builder" aria-labelledby="builder-title">
          <h2 id="builder-title">Make an assignment link</h2>
          <p>
            Tick the lessons, give it a title if you like, and share the link.
            Students who open it see the assignment on their School home.
          </p>
          <label className="teach-title">
            <span>Title (optional)</span>
            <input
              type="text"
              value={title}
              maxLength={80}
              placeholder="e.g. Week 3: inside the processor"
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <div className="teach-picks">
            {courses.map((course) => (
              <fieldset key={course.id}>
                <legend>{course.title}</legend>
                {course.lessons.map((lesson) => (
                  <label key={lesson.id}>
                    <input
                      type="checkbox"
                      checked={chosen.includes(lesson.id)}
                      onChange={(event) =>
                        setChosen((now) =>
                          event.target.checked
                            ? [...now, lesson.id]
                            : now.filter((id) => id !== lesson.id),
                        )
                      }
                    />
                    {lesson.title}
                  </label>
                ))}
              </fieldset>
            ))}
          </div>
          <div className="teach-link">
            <input
              type="text"
              readOnly
              aria-label="Assignment link"
              value={assignment}
              placeholder="Tick at least one lesson"
              onFocus={(event) => event.target.select()}
            />
            {assignment && (
              <>
                <CopyButton text={assignment} label="Copy link" />
                <a
                  className="teach-copy"
                  href={assignment}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={14} />
                  Preview
                </a>
              </>
            )}
          </div>
        </section>

        {courses.map((course) => (
          <section
            key={course.id}
            className="teach-course"
            aria-labelledby={`teach-${course.id}`}
          >
            <header>
              <h2 id={`teach-${course.id}`}>{course.title}</h2>
              <p>
                {course.summary} <span>{course.audience}</span>
              </p>
            </header>
            {course.lessons.map((lesson, number) => {
              const link = linkTo({
                kind: 'lesson',
                lesson: lesson.id,
                step: 0,
              });
              const checks = lesson.steps.flatMap((s, i) =>
                s.check ? [i] : [],
              );
              return (
                <article key={lesson.id} className="teach-lesson">
                  <header>
                    <h3>
                      <span>{number + 1}</span>
                      {lesson.title}
                    </h3>
                    <p>
                      {lesson.summary} · about {lesson.minutes} minutes ·{' '}
                      {lesson.steps.length} steps
                    </p>
                    <div className="teach-lesson-links">
                      <CopyButton text={link} label="Copy lesson link" />
                      <a
                        className="teach-copy"
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink size={14} />
                        Open
                      </a>
                    </div>
                  </header>
                  <div className="teach-lesson-body">
                    <div>
                      <h4>Steps</h4>
                      <ol>
                        {lesson.steps.map((step, i) => (
                          <li key={i}>{step.title}</li>
                        ))}
                      </ol>
                    </div>
                    <div>
                      <h4>Answer key</h4>
                      <dl>
                        {checks.map((i) => {
                          const { answer, note } = answerOf(lesson, i);
                          const check = lesson.steps[i].check!;
                          return (
                            <div key={i}>
                              <dt>
                                Step {i + 1}
                                {check.kind === 'find' && (
                                  <MousePointerClick size={13} />
                                )}{' '}
                                {check.prompt}
                              </dt>
                              <dd>
                                <strong>{answer}</strong>
                                <small>{note}</small>
                              </dd>
                            </div>
                          );
                        })}
                      </dl>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ))}
      </main>
    </div>
  );
}
