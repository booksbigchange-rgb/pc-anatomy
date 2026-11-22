'use client';
import {
  Activity,
  ArrowRight,
  Binary,
  Cable,
  Calculator,
  Code2,
  Cpu,
  EthernetPort,
  Info,
  Laptop,
  Monitor,
  Package,
  PcCase,
  Route,
  Router,
  SquarePlus,
  ToggleLeft,
  Wrench,
} from 'lucide-react';
import { subjects, type Doorway, type ExhibitIcon } from '@/lib/catalogue';
import { courseById, type Lesson } from '@/lib/lessons';
import { lessonStatus, type Progress } from '@/lib/progress';
import AcademyLogo from './academy-logo';
import CourseCard from './course-card';
import { SCHOOL_NAME, UPSTREAM_REPOSITORY } from './links';

const icons: Record<ExhibitIcon, typeof Cpu> = {
  desk: Monitor,
  tower: PcCase,
  laptop: Laptop,
  wrench: Wrench,
  activity: Activity,
  path: Route,
  chip: Cpu,
  switch: ToggleLeft,
  gate: Binary,
  adder: SquarePlus,
  alu: Calculator,
  router: Router,
  nic: EthernetPort,
  cable: Cable,
  packet: Package,
};

type Props = {
  progress: Progress;
  onOpen: (doorway: Doorway) => void;
  onStartLesson: (lesson: string) => void;
  onAbout: () => void;
};

/** The first lesson a reader is part way through, in catalogue order. */
function inProgress(progress: Progress): Lesson | undefined {
  return subjects
    .flatMap((subject) => subject.courses)
    .flatMap((id) => courseById[id]?.lessons ?? [])
    .find((lesson) => lessonStatus(progress, lesson) === 'started');
}

/**
 * The front door: every subject, its courses and its exhibits on one page
 * that needs no 3D to draw, so a classroom of Chromebooks gets something on
 * screen at once and only loads a model when a student opens one.
 */
export default function SchoolHome({
  progress,
  onOpen,
  onStartLesson,
  onAbout,
}: Props) {
  const resume = inProgress(progress);
  return (
    <div className="school">
      <header className="school-top">
        <div className="school-brand">
          <AcademyLogo />
          <span>
            <strong>{SCHOOL_NAME}</strong>
            <small>A 3D school for technology</small>
          </span>
        </div>
        <button
          type="button"
          className="school-about"
          onClick={onAbout}
          aria-label="About and sources"
        >
          <Info size={19} />
        </button>
      </header>

      <main className="school-main">
        <section className="school-hero">
          <p className="school-eyebrow">Free · no account needed</p>
          <h1>Learn how technology works by taking it apart.</h1>
          <p>
            Pick a subject. Explore the 3D models on your own, or follow a
            course one step at a time. Your progress stays in this browser.
          </p>
          {resume && (
            <button
              type="button"
              className="school-continue"
              onClick={() => onStartLesson(resume.id)}
            >
              <span>
                <small>Continue where you left off</small>
                {resume.title} · step{' '}
                {(progress.lessons[resume.id].step ?? 0) + 1} of{' '}
                {resume.steps.length}
              </span>
              <ArrowRight size={18} />
            </button>
          )}
        </section>

        {subjects.map((subject, index) => (
          <section
            key={subject.id}
            className="school-subject"
            aria-labelledby={`subject-${subject.id}`}
          >
            <header className="school-subject-head">
              <span className="school-subject-number" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <h2 id={`subject-${subject.id}`}>{subject.title}</h2>
                <p>{subject.summary}</p>
              </div>
            </header>
            <div className="school-subject-body">
              <div className="school-courses">
                <h3 className="school-label">Course</h3>
                {subject.courses.map((id) => (
                  <CourseCard
                    key={id}
                    course={courseById[id]}
                    progress={progress}
                    current={null}
                    onStart={onStartLesson}
                  />
                ))}
              </div>
              <div className="school-exhibits">
                <h3 className="school-label">Explore on your own</h3>
                <ul>
                  {subject.exhibits.map((exhibit) => {
                    const Icon = icons[exhibit.icon];
                    return (
                      <li key={exhibit.id}>
                        <button
                          type="button"
                          onClick={() => onOpen(exhibit.open)}
                        >
                          <Icon size={20} />
                          <span>
                            <strong>{exhibit.title}</strong>
                            <small>{exhibit.summary}</small>
                          </span>
                          <ArrowRight size={15} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </section>
        ))}
      </main>

      <footer className="school-foot">
        <a href={UPSTREAM_REPOSITORY} target="_blank" rel="noreferrer">
          <Code2 size={13} />
          Based on <strong>PC Anatomy</strong> by Yoseph
        </a>
        <span>
          Not affiliated with NVIDIA, AMD, Intel, ASUS, Dell, Framework or any
          other named company.
        </span>
      </footer>
    </div>
  );
}
