'use client';
import {
  BookOpen,
  Code2,
  GraduationCap,
  Info,
  Layers3,
  Monitor,
  Search,
} from 'lucide-react';
import { GUIDE, SCHOOL_NAME, UPSTREAM_REPOSITORY } from './links';
import AcademyLogo from './academy-logo';

type Props = {
  layers: boolean;
  studentMode: boolean;
  onHome: () => void;
  onOpenLab: () => void;
  onToggleLayers: () => void;
  onToggleStudentMode: () => void;
  onSearch: () => void;
  onAbout: () => void;
  onLessons: () => void;
};

export default function Topbar({
  layers,
  studentMode,
  onHome,
  onOpenLab,
  onToggleLayers,
  onToggleStudentMode,
  onSearch,
  onAbout,
  onLessons,
}: Props) {
  return (
    <header className="topbar">
      <button
        type="button"
        className="brand"
        onClick={onHome}
        aria-label={`${SCHOOL_NAME}: School home`}
        title="Back to the School home"
      >
        <AcademyLogo />
        <span>{SCHOOL_NAME}</span>
      </button>
      <a
        className="byline"
        href={UPSTREAM_REPOSITORY}
        target="_blank"
        rel="noreferrer"
        title="Based on the open-source PC Anatomy project"
      >
        <Code2 size={13} />
        <span>
          Based on <strong>PC Anatomy</strong> by Yoseph
        </span>
      </a>
      <div className="header-actions">
        <button
          type="button"
          className="lessons-button"
          onClick={onLessons}
          aria-label="Lessons"
        >
          <GraduationCap size={17} />
          <span>Lessons</span>
        </button>
        <button
          type="button"
          className="header-button lab-button"
          onClick={onOpenLab}
          title="Return to the whole computer setup"
          aria-label="Computer Lab"
        >
          <Monitor size={16} />
          <span>Computer Lab</span>
        </button>
        <button
          type="button"
          className="header-button student-mode-button"
          aria-pressed={studentMode}
          onClick={onToggleStudentMode}
          title="Switch between student and technical explanations"
          aria-label={studentMode ? 'Student mode' : 'Technical mode'}
        >
          <BookOpen size={16} />
          <span>{studentMode ? 'Student mode' : 'Technical mode'}</span>
        </button>
        <a
          className="guide-link"
          href={GUIDE}
          title="Learn about PC components"
        >
          Guide
        </a>
        <button
          type="button"
          className="mobile-layers"
          onClick={onToggleLayers}
          aria-label="Toggle systems"
          aria-expanded={layers}
        >
          <Layers3 size={19} />
        </button>
        <button
          type="button"
          className="search-button"
          aria-label="Find a component"
          onClick={onSearch}
        >
          <Search size={16} />
          <span>Search components</span>
          <kbd>/</kbd>
        </button>
        <button
          type="button"
          className="info-button"
          aria-label="About and sources"
          onClick={onAbout}
        >
          <Info size={19} />
        </button>
      </div>
    </header>
  );
}
