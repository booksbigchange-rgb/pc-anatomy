'use client';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { categories, colors, manifest, type Category } from '@/lib/manifest';
import { localizeConcept } from '@/lib/i18n/concepts';
import { useI18n } from '@/lib/i18n/provider';

type Props = {
  visible: Category[];
  hidden: string[];
  onToggleCategory: (category: Category) => void;
  onToggleAll: () => void;
  onSetConceptVisible: (
    id: string,
    category: Category,
    visible: boolean,
  ) => void;
  onSelectConcept: (id: string) => void;
};

export default function SystemsList({
  visible,
  hidden,
  onToggleCategory,
  onToggleAll,
  onSetConceptVisible,
  onSelectConcept,
}: Props) {
  const [expanded, setExpanded] = useState<Category | null>(null);
  const { locale, t } = useI18n();

  return (
    <div className="systems-section">
      <div className="section-heading">
        {t('visibleSystems')}{' '}
        <button onClick={onToggleAll}>
          {visible.length === categories.length ? t('hideAll') : t('showAll')}
        </button>
      </div>
      <div className="layer-scroll">
        {categories.map((category) => (
          <div key={category}>
            <div className="layer-row">
              <button
                className="category-visibility"
                aria-pressed={visible.includes(category)}
                aria-label={
                  (visible.includes(category) ? t('hide') : t('show')) +
                  ' ' +
                  t(`category.${category}`)
                }
                onClick={() => onToggleCategory(category)}
              >
                <i style={{ background: colors[category] }} />
                <span>{t(`category.${category}`)}</span>
                <small>{visible.includes(category) ? t('on') : t('off')}</small>
              </button>
              <button
                className="category-expand"
                onClick={() =>
                  setExpanded(expanded === category ? null : category)
                }
                aria-expanded={expanded === category}
                aria-label={
                  (expanded === category ? t('hide') : t('show')) +
                  ' ' +
                  t(`category.${category}`) +
                  ' ' +
                  t('components')
                }
              >
                <ChevronDown size={12} />
              </button>
            </div>
            {expanded === category && (
              <div className="sublayers">
                {manifest
                  .filter((concept) => concept.category === category && concept.id !== 'card')
                  .map((concept) => {
                    const c = localizeConcept(concept, locale);
                    return (
                      <div key={c.id}>
                        <button onClick={() => onSelectConcept(c.id)}>
                          {c.shortName}
                        </button>
                        <Switch
                          size="sm"
                          checked={
                            visible.includes(category) && !hidden.includes(c.id)
                          }
                          onCheckedChange={(checked) =>
                            onSetConceptVisible(c.id, category, checked)
                          }
                          aria-label={
                            (visible.includes(category) && !hidden.includes(c.id)
                              ? t('hide')
                              : t('show')) +
                            ' ' +
                            c.name
                          }
                        />
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
