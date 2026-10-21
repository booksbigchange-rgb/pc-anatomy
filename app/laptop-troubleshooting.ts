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
      'The laptop works with the charger. It turns off when you unplug the charger.',
    clue: 'Which part stores power for when there is no charger?',
    explode: 18,
    options: ['battery', 'ssd', 'ram'],
    answer: 'battery',
    explanation:
      'Check the battery first. It gives power when the charger is not plugged in.',
  },
  {
    id: 'overheating',
    title: 'Hot and slowing down',
    symptom:
      'The laptop gets very hot. The fan sounds strange. Big jobs become slow.',
    clue: 'Which part moves heat away from the CPU?',
    explode: 58,
    options: ['fan', 'wifi', 'ssd'],
    answer: 'fan',
    explanation:
      'Check the cooling parts. The fan, metal fins and heat pipes take heat away from the CPU.',
  },
  {
    id: 'multitasking',
    title: 'Slow with many apps open',
    symptom:
      'The laptop starts normally. It gets very slow when many apps are open.',
    clue: 'Which part helps the laptop keep several apps open?',
    explode: 42,
    options: ['ram', 'battery', 'wifi'],
    answer: 'ram',
    explanation:
      'RAM holds the apps you are using now. Too little RAM, or a bad RAM stick, makes many open apps slow.',
  },
  {
    id: 'storage',
    title: 'System cannot find storage',
    symptom:
      'The laptop turns on, but it cannot find Windows or your saved files.',
    clue: 'Which part keeps files when the power is off?',
    explode: 30,
    options: ['ssd', 'ram', 'speakers'],
    answer: 'ssd',
    explanation:
      'The SSD stores Windows, apps and saved files. Check that it is seated and working.',
  },
  {
    id: 'wireless',
    title: 'Wi-Fi disappears',
    symptom:
      'The laptop works, but no Wi-Fi networks appear.',
    clue: 'Find the small card with two thin antenna wires.',
    explode: 34,
    options: ['wifi', 'ssd', 'fan'],
    answer: 'wifi',
    explanation:
      'The Wi-Fi card and its antenna wires make wireless work. Check them first.',
  },
  {
    id: 'black-display',
    title: 'Power on, black display',
    symptom:
      'The laptop seems to turn on, but the screen stays black.',
    clue: 'Follow the screen cable from the motherboard, through the hinge, to the screen.',
    explode: 89,
    options: ['display', 'battery', 'speakers'],
    answer: 'display',
    explanation:
      'Check the screen and its cable first. If the computer runs but the screen is black, the picture may not be reaching the screen.',
  },
] as const;
