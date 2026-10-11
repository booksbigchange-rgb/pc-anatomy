'use client';
import {
  Code2,
  Cpu,
  GraduationCap,
  Info,
  Languages,
  Layers3,
  Monitor,
  Search,
} from 'lucide-react';
import { locales, useI18n, type Locale } from '@/lib/i18n/provider';
import { GUIDE, UPSTREAM_REPOSITORY } from './links';

type Props = {
  layers: boolean;
  studentMode: boolean;
  onReset: () => void;
  onOpenLab: () => void;
  onToggleLayers: () => void;
  onToggleStudentMode: () => void;
  onSearch: () => void;
  onAbout: () => void;
};

export default function Topbar({
  layers,
  studentMode,
  onReset,
  onOpenLab,
  onToggleLayers,
  onToggleStudentMode,
  onSearch,
  onAbout,
}: Props) {
  const { locale, setLocale, t } = useI18n();

  return (
    <header className="topbar">
      <button
        type="button"
        className="brand"
        onClick={onReset}
        aria-label="Reset Big Change PC Atlas"
      >
        <span className="brand-icon">
          <Cpu size={21} />
        </span>
        <span>Big Change PC Atlas</span>
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
        <label className="language-picker" title={t('language')}>
          <Languages size={15} aria-hidden="true" />
          <span className="sr-only">{t('language')}</span>
          <select
            aria-label={t('language')}
            value={locale}
            onChange={(event) => setLocale(event.target.value as Locale)}
          >
            {Object.values(locales).map((language) => (
              <option key={language.code} value={language.code}>
                {language.nativeLabel}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="student-mode-button"
          onClick={onOpenLab}
          title="Return to the whole computer setup"
        >
          <Monitor size={16} />
          <span>{t('computerLab')}</span>
        </button>
        <button
          type="button"
          className="student-mode-button"
          aria-pressed={studentMode}
          onClick={onToggleStudentMode}
          title="Switch between student and technical explanations"
        >
          <GraduationCap size={16} />
          <span>{studentMode ? t('studentMode') : t('technicalMode')}</span>
        </button>
        <a
          className="guide-link"
          href={GUIDE}
          title="Learn about PC components"
        >
          {t('guide')}
        </a>
        <button
          type="button"
          className="mobile-layers"
          onClick={onToggleLayers}
          aria-label={t('toggleSystems')}
          aria-expanded={layers}
        >
          <Layers3 size={19} />
        </button>
        <button
          type="button"
          className="search-button"
          aria-label={t('findComponent')}
          onClick={onSearch}
        >
          <Search size={16} />
          <span>{t('searchComponents')}</span>
          <kbd>/</kbd>
        </button>
        <button
          type="button"
          className="info-button"
          aria-label={t('aboutSources')}
          onClick={onAbout}
        >
          <Info size={19} />
        </button>
      </div>
    </header>
  );
}
