'use client';
import {
  ArrowUpRight,
  ChevronRight,
  EyeOff,
  Focus,
  Maximize,
  X,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { byId, colors, openLevel, sources, type Concept } from '@/lib/manifest';
import type { Selection } from '@/lib/explorer-state';
import { levels, type LevelId } from '@/lib/levels';
import { localizeConcept } from '@/lib/i18n/concepts';
import { useI18n } from '@/lib/i18n/provider';

type Props = {
  selected: Concept | null;
  selection: Selection | null;
  level: LevelId;
  isolated: boolean;
  onClose: () => void;
  onSelectConcept: (id: string) => void;
  onDive: (id: string) => void;
  onIsolate: () => void;
  onFocus: () => void;
  onHide: (id: string) => void;
};

export default function DetailPanel({
  selected,
  selection,
  level,
  isolated,
  onClose,
  onSelectConcept,
  onDive,
  onIsolate,
  onFocus,
  onHide,
}: Props) {
  const { locale, t } = useI18n();
  const opens = selected && openLevel(selected.id);
  const localized = selected ? localizeConcept(selected, locale) : null;

  return (
    <Sheet
      open={!!selected}
      modal={false}
      onOpenChange={(open, details) => {
        if (!open && details.reason !== 'outside-press') onClose();
      }}
    >
      <SheetContent
        className="detail-panel"
        side="right"
        showCloseButton={false}
        initialFocus={false}
      >
        {selected && localized && (
          <>
            <div className="detail-top">
              <span style={{ color: colors[selected.category] }}>
                {t(`category.${selected.category}`)} /{' '}
                {selected.representationType === 'logical'
                  ? t('architecture')
                  : t('hardware')}
              </span>
              <button aria-label={t('closeDetails')} onClick={onClose}>
                <X size={17} />
              </button>
            </div>
            <SheetTitle>{localized.name}</SheetTitle>
            <div className="instance-label">
              {selection?.instance !== undefined
                ? t('instance') +
                  ' ' +
                  String(selection.instance + 1).padStart(2, '0')
                : t('componentGroup')}
            </div>
            <SheetDescription>{localized.description}</SheetDescription>
            <div className="purpose">
              <h3>{t('whatItDoes')}</h3>
              <p>{localized.purpose}</p>
            </div>
            <div className="quantity">{localized.quantity}</div>
            <dl>
              {Object.entries(selected.specifications).map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            {selected.parent && (
              <div className="parent-link">
                {t('partOf')}{' '}
                <button onClick={() => onSelectConcept(selected.parent!)}>
                  {localizeConcept(byId[selected.parent], locale).shortName}
                  <ChevronRight size={12} />
                </button>
              </div>
            )}
            {opens && opens !== level && (
              <button
                className="open-component"
                onClick={() => onDive(selected.id)}
              >
                {t('takeApart')} {levels[opens].name}
                <ChevronRight size={17} />
              </button>
            )}
            <div className="detail-actions">
              <button onClick={onIsolate}>
                <Focus size={14} />
                {isolated ? t('showContext') : t('isolate')}
              </button>
              <button onClick={onFocus}>
                <Maximize size={14} />
                {t('focus')}
              </button>
              <button onClick={() => onHide(selected.id)}>
                <EyeOff size={14} />
                {t('hide')}
              </button>
            </div>
            <p className="accuracy">{selected.physicalAccuracy}</p>
            {selected.sources.length > 0 && (
              <div className="source-links">
                <h3>{t('referencesArchitecture')}</h3>
                <p>{t('referenceExplanation')}</p>
                {selected.sources.map((s) => (
                  <a
                    key={s}
                    href={sources[s].url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {sources[s].name}
                    <ArrowUpRight size={12} />
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
