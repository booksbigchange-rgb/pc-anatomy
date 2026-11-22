'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CircleCheck,
  GraduationCap,
  Info,
  MousePointerClick,
  RotateCcw,
  X,
} from 'lucide-react';
import { courseOf, nextLesson } from '@/lib/lessons';
import { lessonsDone } from '@/lib/progress';
import type { Concept } from '@/lib/manifest';
import type { LessonControls } from './use-lesson';

type Props = {
  lesson: LessonControls;
  /** A selected part whose detail panel is held back on a small screen. */
  waitingPart: Concept | null;
  onShowPart: (id: string) => void;
  onOpenCourses: () => void;
  onOpenProgress: () => void;
};

/**
 * The lesson being taken. On a wide screen it stands in the rail's place, so
 * the stage keeps its size and the detail panel can still open on the right;
 * on a phone it is a card above the timeline that folds down to its controls.
 */
export default function LessonPanel({
  lesson,
  waitingPart,
  onShowPart,
  onOpenCourses,
  onOpenProgress,
}: Props) {
  const { run, step, progress } = lesson;
  const current = lesson.lesson;
  const [folded, setFolded] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  // Move focus to the new step's heading after Next or Back, so a screen
  // reader starts reading it, but never on the first render: arriving from a
  // link should not pull focus out of the page.
  useEffect(() => {
    if (moved.current) heading.current?.focus({ preventScroll: true });
    moved.current = true;
  }, [run?.lesson, run?.step, run?.complete]);

  if (!run || !current || !step) return null;
  const course = courseOf(current.id)!;
  const number = course.lessons.indexOf(current) + 1;
  const last = run.step === current.steps.length - 1;
  const check = step.check;
  const following = nextLesson(current.id);

  return (
    <aside
      className={
        'lesson-panel' +
        (folded ? ' folded' : '') +
        (run.complete || check?.kind === 'choice' ? ' tall' : '')
      }
      aria-label={`Lesson: ${current.title}`}
    >
      <header className="lesson-head">
        <button
          className="lesson-course"
          onClick={onOpenCourses}
          title="All lessons"
        >
          <GraduationCap size={15} />
          <span>
            Lesson {number} of {course.lessons.length}
          </span>
        </button>
        <button
          className="lesson-fold"
          aria-label={folded ? 'Show lesson text' : 'Hide lesson text'}
          aria-expanded={!folded}
          onClick={() => setFolded(!folded)}
        >
          <ChevronDown size={17} />
        </button>
        <button
          className="lesson-exit"
          aria-label="Leave lesson"
          title="Leave lesson"
          onClick={lesson.exit}
        >
          <X size={16} />
        </button>
      </header>
      <h2 className="lesson-title">{current.title}</h2>
      <ol className="lesson-steps" aria-label="Steps">
        {current.steps.map((s, i) => (
          <li key={i}>
            <button
              aria-label={`Step ${i + 1}: ${s.title}`}
              aria-current={
                i === run.step && !run.complete ? 'step' : undefined
              }
              className={
                run.complete || i < run.step
                  ? 'passed'
                  : i === run.step
                    ? 'here'
                    : ''
              }
              disabled={!run.complete && i > run.step}
              onClick={() => lesson.goTo(i)}
            />
          </li>
        ))}
      </ol>

      {run.complete ? (
        <div className="lesson-complete">
          <CircleCheck size={30} />
          <h3 ref={heading} tabIndex={-1}>
            Lesson complete
          </h3>
          <p>
            You finished “{current.title}”. That makes{' '}
            {lessonsDone(progress, course)} of {course.lessons.length} lessons
            in {course.title}.
          </p>
          {lesson.lastScore && lesson.lastScore.of > 0 && (
            <p className="lesson-score">
              Right first time: {lesson.lastScore.right} of{' '}
              {lesson.lastScore.of} checks.
            </p>
          )}
          {following ? (
            <button
              className="lesson-next"
              onClick={() => lesson.begin(following.id, 0)}
            >
              <span>
                <small>Next lesson</small>
                {following.title}
              </span>
              <ArrowRight size={17} />
            </button>
          ) : (
            <p className="lesson-finale">
              That was the last lesson in the course. Keep exploring: every part
              you click has more to read, and search finds anything by name.
            </p>
          )}
          <div className="lesson-complete-actions">
            <button onClick={onOpenCourses}>All lessons</button>
            <button onClick={onOpenProgress}>My progress</button>
            <button onClick={lesson.exit}>Keep exploring</button>
          </div>
        </div>
      ) : (
        <>
          <div className="lesson-body">
            <p className="lesson-count">
              Step {run.step + 1} of {current.steps.length}
            </p>
            <h3 ref={heading} tabIndex={-1}>
              {step.title}
            </h3>
            {step.body.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
            {check && (
              <div className="lesson-check">
                <p className="lesson-prompt">
                  {check.kind === 'find' && <MousePointerClick size={15} />}
                  {check.prompt}
                </p>
                {check.kind === 'choice' && (
                  <fieldset className="lesson-options">
                    <legend className="sr-only">{check.prompt}</legend>
                    {check.options.map((option, i) => {
                      const right = run.solved && i === check.answer;
                      const wrong = run.wrong.includes(i);
                      return (
                        <button
                          key={i}
                          className={right ? 'right' : wrong ? 'wrong' : ''}
                          aria-pressed={right || wrong}
                          disabled={run.solved || wrong}
                          onClick={() => lesson.choose(i)}
                        >
                          <span>{String.fromCharCode(65 + i)}</span>
                          {option}
                          {right && <Check size={14} />}
                        </button>
                      );
                    })}
                  </fieldset>
                )}
                <div aria-live="polite">
                  {run.feedback && (
                    <p className={'lesson-feedback ' + run.feedback.tone}>
                      {run.feedback.text}
                    </p>
                  )}
                </div>
                {lesson.revealable && (
                  <button className="lesson-reveal" onClick={lesson.reveal}>
                    Show me the answer
                  </button>
                )}
              </div>
            )}
          </div>
          <footer className="lesson-nav">
            <button
              className="lesson-back"
              onClick={() => lesson.goTo(run.step - 1)}
              disabled={run.step === 0}
            >
              <ArrowLeft size={15} />
              Back
            </button>
            <button
              className="lesson-replay"
              onClick={lesson.replay}
              aria-label="Reset the view for this step"
              title="Reset the view for this step"
            >
              <RotateCcw size={15} />
            </button>
            {waitingPart && (
              <button
                className="lesson-part"
                onClick={() => onShowPart(waitingPart.id)}
                aria-label={`More about the ${waitingPart.shortName}`}
                title={`More about the ${waitingPart.shortName}`}
              >
                <Info size={16} />
              </button>
            )}
            <button
              className="lesson-next"
              onClick={lesson.next}
              disabled={!run.solved}
              title={run.solved ? undefined : 'Answer the question to go on'}
            >
              {last ? 'Finish' : 'Next'}
              <ArrowRight size={15} />
            </button>
          </footer>
        </>
      )}
    </aside>
  );
}
