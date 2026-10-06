import type { Locale } from './config';

export type MessageKey =
  | 'language'
  | 'guide'
  | 'createdBy'
  | 'toggleSystems'
  | 'findComponent'
  | 'searchComponents'
  | 'aboutSources'
  | 'visibleSystems'
  | 'hideAll'
  | 'showAll'
  | 'hide'
  | 'show'
  | 'on'
  | 'off'
  | 'components'
  | 'searchDescription'
  | 'searchPlaceholder'
  | 'noMatches'
  | 'matchingStructures'
  | 'exploreComputer'
  | 'browseHint'
  | 'inspectHint'
  | 'architecture'
  | 'hardware'
  | 'logicalArchitecture'
  | 'physicalHardware'
  | 'closeDetails'
  | 'instance'
  | 'componentGroup'
  | 'whatItDoes'
  | 'whyItMatters'
  | 'tryIt'
  | 'computerLab'
  | 'studentMode'
  | 'technicalMode'
  | 'partOf'
  | 'takeApart'
  | 'showContext'
  | 'isolate'
  | 'focus'
  | 'referencesArchitecture'
  | 'referenceExplanation'
  | 'category.Chassis'
  | 'category.Cooling'
  | 'category.Board'
  | 'category.Power'
  | 'category.Memory'
  | 'category.Storage'
  | 'category.Compute'
  | 'category.Graphics';

const en: Record<MessageKey, string> = {
  language: 'Language',
  guide: 'Guide',
  createdBy: 'Created by',
  toggleSystems: 'Toggle systems',
  findComponent: 'Find a component',
  searchComponents: 'Search components',
  aboutSources: 'About and sources',
  visibleSystems: 'VISIBLE SYSTEMS',
  hideAll: 'Hide all',
  showAll: 'Show all',
  hide: 'Hide',
  show: 'Show',
  on: 'On',
  off: 'Off',
  components: 'components',
  searchDescription: 'Jump to any hardware or architecture resource.',
  searchPlaceholder: 'Try CPU, RAM, SSD or GPU…',
  noMatches: 'No matching components. Try “memory” or “CPU”.',
  matchingStructures: 'Matching structures',
  exploreComputer: 'Explore the computer',
  browseHint: '↑ ↓ to browse',
  inspectHint: 'Enter to inspect',
  architecture: 'ARCHITECTURE',
  hardware: 'HARDWARE',
  logicalArchitecture: 'Logical architecture',
  physicalHardware: 'Physical hardware',
  closeDetails: 'Close component details',
  instance: 'INSTANCE',
  componentGroup: 'COMPONENT GROUP',
  whatItDoes: 'What it does',
  whyItMatters: 'Why it matters',
  tryIt: 'Try it',
  computerLab: 'Computer Lab',
  studentMode: 'Student mode',
  technicalMode: 'Technical mode',
  partOf: 'Part of',
  takeApart: 'Take apart',
  showContext: 'Show context',
  isolate: 'Isolate',
  focus: 'Focus',
  referencesArchitecture: 'References & architecture',
  referenceExplanation:
    'Manufacturer documents and standards explain this component family. Illustrative geometry is not a product schematic.',
  'category.Chassis': 'Chassis',
  'category.Cooling': 'Cooling',
  'category.Board': 'Board',
  'category.Power': 'Power',
  'category.Memory': 'Memory',
  'category.Storage': 'Storage',
  'category.Compute': 'Compute',
  'category.Graphics': 'Graphics',
};

const ti: Partial<Record<MessageKey, string>> = {
  language: 'ቋንቋ',
  guide: 'መምርሒ',
  createdBy: 'ዝፈጠሮ',
  toggleSystems: 'ስርዓታት ኣርኢ/ሕባእ',
  findComponent: 'ክፍሊ ድለ',
  searchComponents: 'ክፍልታት ድለ',
  aboutSources: 'ብዛዕባን ምንጭታትን',
  visibleSystems: 'ዝረኣዩ ስርዓታት',
  hideAll: 'ኩሉ ሕባእ',
  showAll: 'ኩሉ ኣርኢ',
  hide: 'ሕባእ',
  show: 'ኣርኢ',
  on: 'ይረአ',
  off: 'ተሓቢኡ',
  components: 'ክፍልታት',
  searchDescription: 'ናብ ዝደለኻዮ ናይ ሃርድዌር ወይ ኣርኪቴክቸር ክፍሊ ብቕልጡፍ ኪድ።',
  searchPlaceholder: 'CPU፣ RAM፣ SSD ወይ GPU ፈትን…',
  noMatches: 'ዝሰማማዕ ክፍሊ ኣይተረኽበን። “RAM” ወይ “CPU” ፈትን።',
  matchingStructures: 'ዝሰማምዑ ክፍልታት',
  exploreComputer: 'ኮምፒዩተር መርምር',
  browseHint: '↑ ↓ ንምምራጽ',
  inspectHint: 'Enter ንምርኣይ',
  architecture: 'ኣርኪቴክቸር',
  hardware: 'ሃርድዌር',
  logicalArchitecture: 'ሎጂካዊ ኣርኪቴክቸር',
  physicalHardware: 'ፊዚካዊ ሃርድዌር',
  closeDetails: 'ዝርዝር ክፍሊ ዕጾ',
  instance: 'ሓደ ክፍሊ',
  componentGroup: 'ጉጅለ ክፍልታት',
  whatItDoes: 'እንታይ ይገብር',
  whyItMatters: 'ንምንታይ ኣገዳሲ እዩ',
  tryIt: 'ፈትኖ',
  computerLab: 'ኮምፒዩተር ላብ',
  studentMode: 'ናይ ተማሃራይ ሞድ',
  technicalMode: 'ቴክኒካዊ ሞድ',
  partOf: 'ክፍሊ ናይ',
  takeApart: 'ፈላልዮ',
  showContext: 'ካልኦት ክፍልታት ኣርኢ',
  isolate: 'እዚ ጥራይ ኣርኢ',
  focus: 'ኣቕርብ',
  referencesArchitecture: 'ምንጭታትን ኣርኪቴክቸርን',
  referenceExplanation:
    'ሰነዳት ኣፍራዪን መለክዒታትን ነዚ ዓይነት ክፍሊ ይገልጹ። እቲ 3D ቅርጺ ንትምህርቲ ዝተዳለወ እዩ።',
  'category.Chassis': 'ኬዝ',
  'category.Cooling': 'ምዝሓል',
  'category.Board': 'ቦርድ',
  'category.Power': 'ሓይሊ',
  'category.Memory': 'መሞሪ',
  'category.Storage': 'መኽዘን',
  'category.Compute': 'ስሌት',
  'category.Graphics': 'ግራፊክስ',
};

const he: Partial<Record<MessageKey, string>> = {
  language: 'שפה',
  guide: 'מדריך',
  createdBy: 'נוצר על ידי',
  toggleSystems: 'הצג או הסתר מערכות',
  findComponent: 'חיפוש רכיב',
  searchComponents: 'חיפוש רכיבים',
  aboutSources: 'אודות ומקורות',
  visibleSystems: 'מערכות גלויות',
  hideAll: 'הסתר הכל',
  showAll: 'הצג הכל',
  hide: 'הסתר',
  show: 'הצג',
  on: 'פעיל',
  off: 'כבוי',
  components: 'רכיבים',
  searchDescription: 'מעבר מהיר לכל רכיב חומרה או ארכיטקטורה.',
  searchPlaceholder: 'נסו CPU, RAM, SSD או GPU…',
  noMatches: 'לא נמצאו רכיבים מתאימים. נסו “RAM” או “CPU”.',
  matchingStructures: 'תוצאות מתאימות',
  exploreComputer: 'סיור במחשב',
  browseHint: '↑ ↓ לניווט',
  inspectHint: 'Enter לבדיקה',
  architecture: 'ארכיטקטורה',
  hardware: 'חומרה',
  logicalArchitecture: 'ארכיטקטורה לוגית',
  physicalHardware: 'חומרה פיזית',
  closeDetails: 'סגירת פרטי הרכיב',
  instance: 'יחידה',
  componentGroup: 'קבוצת רכיבים',
  whatItDoes: 'מה הוא עושה',
  whyItMatters: 'למה זה חשוב',
  tryIt: 'נסו',
  computerLab: 'מעבדת מחשבים',
  studentMode: 'מצב תלמיד',
  technicalMode: 'מצב טכני',
  partOf: 'חלק מ־',
  takeApart: 'פירוק',
  showContext: 'הצג הקשר',
  isolate: 'הצג רק רכיב',
  focus: 'מיקוד',
  referencesArchitecture: 'מקורות וארכיטקטורה',
  referenceExplanation:
    'מסמכי יצרן ותקנים מסבירים את משפחת הרכיבים. הגאומטריה המוצגת היא המחשה לימודית ולא שרטוט מוצר.',
  'category.Chassis': 'מארז',
  'category.Cooling': 'קירור',
  'category.Board': 'לוח',
  'category.Power': 'חשמל',
  'category.Memory': 'זיכרון',
  'category.Storage': 'אחסון',
  'category.Compute': 'עיבוד',
  'category.Graphics': 'גרפיקה',
};

export const messages: Record<Locale, Partial<Record<MessageKey, string>>> = {
  en,
  'ti-ER': ti,
  'he-IL': he,
};

export function translate(locale: Locale, key: MessageKey) {
  return messages[locale][key] ?? en[key];
}
