'use client';
import { ArrowUpRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
} from '@/components/ui/command';
import { byId, colors, manifest } from '@/lib/manifest';
import { levels } from '@/lib/levels';
import { localizedSearchText, localizeConcept } from '@/lib/i18n/concepts';
import { useI18n } from '@/lib/i18n/provider';

/** What the palette offers before anything has been typed. */
const suggested = [
  'package',
  'gddr7',
  'gpc',
  'sm',
  'tensor',
  'rt',
  'l2',
  'vrm',
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (id: string) => void;
};

export default function SearchDialog({
  open,
  onOpenChange,
  query,
  onQueryChange,
  onSelect,
}: Props) {
  const { locale, t } = useI18n();
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const results = query
    ? manifest.filter((concept) =>
        terms.every((term) => localizedSearchText(concept, locale).includes(term)),
      )
    : suggested.map((id) => byId[id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent className="search-dialog">
        <DialogTitle>{t('findComponent')}</DialogTitle>
        <DialogDescription>{t('searchDescription')}</DialogDescription>
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={onQueryChange}
            placeholder={t('searchPlaceholder')}
          />
          <CommandList>
            <CommandEmpty>{t('noMatches')}</CommandEmpty>
            <CommandGroup
              heading={query ? t('matchingStructures') : t('exploreComputer')}
            >
              {results.map((concept) => {
                const c = localizeConcept(concept, locale);
                return (
                  <CommandItem
                    key={c.id}
                    value={c.id}
                    onSelect={() => onSelect(c.id)}
                  >
                    <i style={{ background: colors[c.category] }} />
                    <div>
                      {c.name}
                      <small>
                        <span>{levels[c.level].name}</span>
                        {t(`category.${c.category}`)} ·{' '}
                        {c.representationType === 'logical'
                          ? t('logicalArchitecture')
                          : t('physicalHardware')}
                      </small>
                    </div>
                    <ArrowUpRight size={15} />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="search-hint">
          {t('browseHint')} <span>{t('inspectHint')}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
