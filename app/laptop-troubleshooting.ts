import type { LaptopLessonPartId } from './laptop-lesson.ts';

export type LaptopTroubleshootingScenario = {
  id: string;
  title: string;
  symptom: string;
  clue: string;
  explode: number;
  options: readonly LaptopLessonPartId[];
  answer: LaptopLessonPartId;
  explanation: string;
};

export const LAPTOP_TROUBLESHOOTING_SCENARIOS:
  readonly LaptopTroubleshootingScenario[] = [
  {
    id: 'battery-runtime',
    title: 'Runs only when plugged in',
    symptom:
      'The laptop works with the charger connected, but shuts down when the charger is removed.',
    clue: 'Think about which component stores energy for portable use.',
    explode: 18,
    options: ['battery', 'ssd', 'ram'],
    answer: 'battery',
    explanation:
      'The battery is the first component to inspect because it stores the energy used when the charger is disconnected.',
  },
  {
    id: 'overheating',
    title: 'Hot and slowing down',
    symptom:
      'The laptop becomes very hot, the fan sounds unusual, and performance drops during heavy work.',
    clue: 'Look for the hardware responsible for moving heat away from the processor.',
    explode: 58,
    options: ['fan', 'wifi', 'ssd'],
    answer: 'fan',
    explanation:
      'The cooling assembly is the best place to investigate because the fan, fin stack and heat pipes remove processor heat.',
  },
  {
    id: 'multitasking',
    title: 'Slow with many apps open',
    symptom:
      'The laptop starts normally, but switching between several open apps becomes very slow.',
    clue: 'Which component holds the working data used by running programs?',
    explode: 42,
    options: ['ram', 'battery', 'wifi'],
    answer: 'ram',
    explanation:
      'RAM holds active working data. Limited or faulty memory can make multitasking slow even when storage is healthy.',
  },
  {
    id: 'storage',
    title: 'System cannot find storage',
    symptom:
      'The laptop powers on, but the operating system or saved files cannot be found.',
    clue: 'Look for the removable module that keeps data when power is off.',
    explode: 30,
    options: ['ssd', 'ram', 'speakers'],
    answer: 'ssd',
    explanation:
      'The M.2 SSD stores the operating system, applications and saved files, so its connection and health are relevant here.',
  },
  {
    id: 'wireless',
    title: 'Wi-Fi disappears',
    symptom:
      'The laptop works normally but no wireless networks appear.',
    clue: 'Find the small card connected to two thin antenna leads.',
    explode: 34,
    options: ['wifi', 'ssd', 'fan'],
    answer: 'wifi',
    explanation:
      'The Wi-Fi module and its antenna connections provide wireless networking, so they are the most relevant hardware to inspect.',
  },
  {
    id: 'black-display',
    title: 'Power on, black display',
    symptom:
      'The laptop appears to power on, but the built-in screen stays black.',
    clue: 'Trace the display path from the mainboard toward the hinge and screen.',
    explode: 89,
    options: ['display', 'battery', 'speakers'],
    answer: 'display',
    explanation:
      'The display assembly and its routed display cable are the first hardware path to inspect when the computer appears to run but the screen stays black.',
  },
] as const;
