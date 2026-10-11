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
  studentMode: boolean;
  onClose: () => void;
  onSelectConcept: (id: string) => void;
  onDive: (id: string) => void;
  onIsolate: () => void;
  onFocus: () => void;
  onHide: (id: string) => void;
};

const studentTips: Record<Concept['category'], string> = {
  Chassis: 'The chassis protects the hardware and keeps every major part in the right place.',
  Cooling: 'Cooling removes heat so the computer can keep working safely and reliably.',
  Board: 'Board components connect the computer parts so they can communicate with each other.',
  Power: 'Power components deliver the correct electrical power to the rest of the computer.',
  Memory: 'Memory gives the computer fast temporary space for information it is actively using.',
  Storage: 'Storage keeps files, programs and data even after the computer is turned off.',
  Compute: 'Compute components perform the calculations and instructions that make programs run.',
  Graphics: 'Graphics components calculate and draw images, video and 3D scenes for the display.',
};

const tigrinyaStudentTips: Record<Concept['category'], string> = {
  Chassis: 'ኬዝ ሃርድዌር ይከላኸል እና ዋና ክፍልታት ኣብ ትኽክለኛ ቦታኦም ይሕዝ።',
  Cooling: 'ምዝሓል ሙቐት የውጽእ እና ኮምፒዩተር ብደሓን ንኽሰርሕ ይሕግዝ።',
  Board: 'ቦርድ ክፍልታት ንኽተሓላለፉ እና ሓበሬታ ንኽለዋወጡ የራኽቦም።',
  Power: 'ናይ ሓይሊ ክፍልታት ንኻልኦት ክፍልታት ዝግባእ ኤሌክትሪክ ይህቡ።',
  Memory: 'Memory ኮምፒዩተር ኣብዚ ግዜ ዝጥቀመሉ ሓበሬታ ብቕልጡፍ ይሕዝ።',
  Storage: 'Storage ኮምፒዩተር ምስ ጠፍአ እውን ፋይላትን ፕሮግራማትን ይሕዝ።',
  Compute: 'ናይ compute ክፍልታት ስሌታትን መምርሒታትን ብምፍጻም ፕሮግራማት የስርሑ።',
  Graphics: 'Graphics ክፍልታት ምስልታት፣ ቪድዮን 3D ትዕይንትን ይሰርሑ።',
};

export default function DetailPanel({
  selected,
  selection,
  level,
  isolated,
  studentMode,
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
  const specifications = selected
    ? Object.entries(selected.specifications)
    : [];
  const shownSpecifications = studentMode
    ? specifications.slice(0, 3)
    : specifications;
  const tip =
    selected && locale === 'ti-ER'
      ? tigrinyaStudentTips[selected.category]
      : selected
        ? studentTips[selected.category]
        : '';

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
            <SheetDescription>
              {studentMode ? localized.purpose : localized.description}
            </SheetDescription>
            <div className="purpose">
              <h3>{studentMode ? t('whyItMatters') : t('whatItDoes')}</h3>
              <p>{studentMode ? tip : localized.purpose}</p>
            </div>
            <div className="quantity">{localized.quantity}</div>
            <dl>
              {shownSpecifications.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            {studentMode && (
              <div className="student-task">
                <h3>{t('tryIt')}</h3>
                <p>
                  {opens && opens !== level
                    ? `Focus on this part, then open ${levels[opens].name} to see what is inside.`
                    : 'Isolate this part, then use Focus to study where it sits in the computer.'}
                </p>
              </div>
            )}
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
            {!studentMode && (
              <>
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
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
