'use client';
import { Code2, Cpu, Info, Languages, Layers3, Search } from 'lucide-react';
import { locales, useI18n, type Locale } from '@/lib/i18n/provider';
import { GUIDE, REPOSITORY } from './links';

type Props = {
  layers: boolean;
  onReset: () => void;
  onToggleLayers: () => void;
  onSearch: () => void;
  onAbout: () => void;
};

export default function Topbar({
  layers,
  onReset,
  onToggleLayers,
  onSearch,
  onAbout,
}: Props) {
  const { locale, setLocale, t } = useI18n();

  return (
    <header className="topbar">
      <button className="brand" onClick={onReset} aria-label="Reset PC Anatomy">
        <span className="brand-icon">
          <Cpu size={21} />
        </span>
        <span>PC Anatomy</span>
      </button>
      <a
        className="byline"
        href={REPOSITORY}
        target="_blank"
        rel="noreferrer"
        title="PC Anatomy on GitHub"
      >
        <Code2 size={13} />
        <span>
          {t('createdBy')} <strong>Yoseph</strong>
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
        <a className="guide-link" href={GUIDE} title="Learn about PC components">
          {t('guide')}
        </a>
        <button
          className="mobile-layers"
          onClick={onToggleLayers}
          aria-label={t('toggleSystems')}
          aria-expanded={layers}
        >
          <Layers3 size={19} />
        </button>
        <button
          className="search-button"
          aria-label={t('findComponent')}
          onClick={onSearch}
        >
          <Search size={16} />
          <span>{t('searchComponents')}</span>
          <kbd>/</kbd>
        </button>
        <button
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
