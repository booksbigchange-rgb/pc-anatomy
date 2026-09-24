'use client';
import { Code2, Cpu, Info, Layers3, Search } from 'lucide-react';
import { GUIDE, UPSTREAM_REPOSITORY } from './links';

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
  return (
    <header className="topbar">
      <button className="brand" onClick={onReset} aria-label="Reset Big Change PC Atlas">
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
        <a
          className="guide-link"
          href={GUIDE}
          title="Learn about PC components"
        >
          Guide
        </a>
        <button
          className="mobile-layers"
          onClick={onToggleLayers}
          aria-label="Toggle systems"
          aria-expanded={layers}
        >
          <Layers3 size={19} />
        </button>
        <button
          className="search-button"
          aria-label="Find a component"
          onClick={onSearch}
        >
          <Search size={16} />
          <span>Search components</span>
          <kbd>/</kbd>
        </button>
        <button
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
