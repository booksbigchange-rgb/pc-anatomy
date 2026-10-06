import type { Concept } from '@/lib/concept';
import type { Locale } from './config';

type ConceptTranslation = Partial<
  Pick<Concept, 'name' | 'shortName' | 'description' | 'purpose' | 'quantity'>
>;

const tigrinya: Record<string, ConceptTranslation> = {
  pc: {
    name: 'Desktop PC — ዴስክቶፕ ኮምፒዩተር',
    shortName: 'Desktop PC',
    description:
      'ኩሎም ዋና ክፍልታት ብሓንሳብ ዝሰርሑሉ ሙሉእ ኮምፒዩተር እዩ።',
    purpose:
      'ፕሮግራማት ንምስራሕ፣ ምስሊ ንምርኣይን ፋይላት ንምኽዛንን CPU፣ RAM፣ storageን ካልኦት ክፍልታትን ብሓንሳብ የስርሕ።',
    quantity: '1 ሙሉእ ኮምፒዩተር',
  },
  motherboard: {
    name: 'Motherboard — ማዘርቦርድ',
    shortName: 'Motherboard',
    description:
      'CPU፣ RAM፣ GPUን storageን ዝተኣሳሰሩላ ዋና ቦርድ እያ።',
    purpose:
      'ኣብ መንጎ ክፍልታት ሓይልን ዳታን ንኽተሓላለፍ ትሕግዝ።',
    quantity: '1 ATX ቦርድ',
  },
  cpu: {
    name: 'CPU — Central Processing Unit',
    shortName: 'CPU',
    description:
      'CPU መምርሒታት ዘንብብን ስሌታት ዝገብርን ዋና ፕሮሰሰር እዩ።',
    purpose:
      'ፕሮግራማት እንታይ ክገብሩ ከም ዘለዎም ይፍጽምን ካልኦት ክፍልታት ክሰርሑ ይመርሕን።',
    quantity: '1 CPU',
  },
  ram: {
    name: 'RAM — Memory',
    shortName: 'RAM',
    description:
      'RAM እቲ CPU ኣብዚ ግዜ ዝጥቀመሉ ዳታን ፕሮግራማትን ንግዚኡ ይሕዝ።',
    purpose:
      'CPU ብቕልጡፍ ናብ ዳታ ንኽበጽሕ ይሕግዝ። ኮምፒዩተር ምስ ጠፍአ ኣብ RAM ዘሎ ዳታ ይጠፍእ።',
    quantity: '2 RAM modules',
  },
  graphicscard: {
    name: 'GPU / Graphics card',
    shortName: 'GPU',
    description:
      'GPU ምስልታት፣ ቪድዮን 3D graphicsን ብቕልጡፍ ንምስራሕ ዝተዳለወ ክፍሊ እዩ።',
    purpose:
      'ግራፊክስ ይሰርሕ እና ብዙሕ ተመሳሳሊ ስሌት ብሓንሳብ ይፍጽም።',
    quantity: '1 GPU card',
  },
  psu: {
    name: 'PSU — Power Supply Unit',
    shortName: 'PSU',
    description:
      'PSU ካብ ግድግዳ ዝመጽእ ኤሌክትሪክ ናብ ኮምፒዩተር ዝጥቀመሉ ሓይሊ ይቕይሮ።',
    purpose:
      'Motherboard፣ CPU፣ GPUን storageን ዘድልዮም ሓይሊ ይህብ።',
    quantity: '1 PSU',
  },
  cpucooler: {
    name: 'CPU cooler — መዝሓሊ CPU',
    shortName: 'CPU cooler',
    description:
      'ካብ CPU ዝወጽእ ሙቐት ናብ finsን ኣየርን ዘሕልፍ መዝሓሊ እዩ።',
    purpose:
      'CPU ኣዝዩ ከይውዕይ ይሕግዝ፣ ስለዚ ብጽቡቕ ፍጥነት ክሰርሕ ይኽእል።',
    quantity: '1 CPU cooler',
  },
  casefan: {
    name: 'Case fans — ናይ ኬዝ ፋናት',
    shortName: 'Case fan',
    description:
      'ፋናት ዝሑል ኣየር ናብ ውሽጢ ኬዝ የእትዉ እና ውዑይ ኣየር የውጽኡ።',
    purpose:
      'ሙቐት ኣብ ውሽጢ ኬዝ ከይእከብ የድርጉ።',
    quantity: '4 fans',
  },
  ssd: {
    name: 'SATA SSD — Storage',
    shortName: 'SATA SSD',
    description:
      'SSD ፋይላት፣ appsን operating systemን ንነዊሕ ግዜ ዝሕዝ መኽዘን እዩ።',
    purpose:
      'ኮምፒዩተር ምስ ጠፍአ እውን ዳታ ይሕዝ፣ ካብ ባህላዊ hard drive ድማ ብዙሕ ግዜ ይቕልጥፍ።',
    quantity: '1 SATA SSD',
  },
  nvme: {
    name: 'NVMe SSD — Storage',
    shortName: 'NVMe SSD',
    description:
      'NVMe SSD ኣብ motherboard ዝተኣሳሰር ፈጣን flash storage እዩ።',
    purpose:
      'Operating system፣ appsን ፋይላትን ብቕልጡፍ ንምንባብን ንምጽሓፍን PCIe ይጥቀም።',
    quantity: '1 NVMe SSD',
  },
};

const translations: Partial<Record<Locale, Record<string, ConceptTranslation>>> = {
  'ti-ER': tigrinya,
};

export function localizeConcept(concept: Concept, locale: Locale): Concept {
  const translation = translations[locale]?.[concept.id];
  return translation ? { ...concept, ...translation } : concept;
}

export function localizedSearchText(concept: Concept, locale: Locale) {
  const localized = localizeConcept(concept, locale);
  return [
    concept.name,
    concept.shortName,
    ...concept.searchTerms,
    localized.name,
    localized.shortName,
    localized.description,
    localized.purpose,
  ]
    .join(' ')
    .toLowerCase();
}
