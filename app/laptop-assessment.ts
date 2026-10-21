import type { LaptopLessonPartId } from './laptop-lesson.ts';

export type LaptopAssessmentOption = {
  id: string;
  label: string;
};

export type LaptopAssessmentQuestion = {
  id: string;
  title: string;
  prompt: string;
  part: LaptopLessonPartId;
  explode: number;
  options: readonly LaptopAssessmentOption[];
  answer: string;
  explanation: string;
  review: string;
};

export const LAPTOP_ASSESSMENT_QUESTIONS:
  readonly LaptopAssessmentQuestion[] = [
  {
    id: 'battery-role',
    title: 'Portable power',
    prompt: 'Which part stores power so the laptop works without a charger?',
    part: 'battery',
    explode: 18,
    options: [
      { id: 'battery', label: 'Battery' },
      { id: 'ssd', label: 'SSD' },
      { id: 'ram', label: 'RAM' },
    ],
    answer: 'battery',
    explanation: 'The battery stores power for when you are away from a charger.',
    review: 'Battery and power path',
  },
  {
    id: 'service-safety',
    title: 'Safe service order',
    prompt: 'Before you take parts out, what should you unplug first?',
    part: 'battery',
    explode: 18,
    options: [
      { id: 'battery-cable', label: 'Battery cable' },
      { id: 'speaker-wire', label: 'Speaker wire' },
      { id: 'wifi-antenna', label: 'Wi-Fi antenna' },
    ],
    answer: 'battery-cable',
    explanation: 'Unplug the battery first, so no power reaches the board while you work.',
    review: 'Battery disconnect before service',
  },
  {
    id: 'ram-role',
    title: 'Working memory',
    prompt: 'Which part helps the laptop keep several apps open?',
    part: 'ram',
    explode: 60,
    options: [
      { id: 'ram', label: 'RAM / SODIMM' },
      { id: 'ssd', label: 'SSD' },
      { id: 'wifi', label: 'Wi-Fi card' },
    ],
    answer: 'ram',
    explanation: 'RAM holds the apps and files you are using right now.',
    review: 'RAM versus storage',
  },
  {
    id: 'storage-role',
    title: 'Persistent storage',
    prompt: 'Which part keeps Windows and your files when the power is off?',
    part: 'ssd',
    explode: 46,
    options: [
      { id: 'ssd', label: 'M.2 SSD' },
      { id: 'ram', label: 'RAM' },
      { id: 'cpu', label: 'CPU' },
    ],
    answer: 'ssd',
    explanation: 'The SSD keeps Windows, apps and files, even when the laptop is off.',
    review: 'SSD and M.2 storage',
  },
  {
    id: 'cooling-path',
    title: 'Heat removal',
    prompt: 'What carries heat from the CPU to the fan and metal fins?',
    part: 'fan',
    explode: 78,
    options: [
      { id: 'heat-pipes', label: 'Heat pipes' },
      { id: 'antenna-leads', label: 'Antenna leads' },
      { id: 'speaker-wires', label: 'Speaker wires' },
    ],
    answer: 'heat-pipes',
    explanation: 'Heat pipes carry heat from the CPU to the metal fins. The fan blows the heat out.',
    review: 'Cooling assembly and heat path',
  },
  {
    id: 'wireless-path',
    title: 'Wireless networking',
    prompt: 'Which small card has two thin antenna wires?',
    part: 'wifi',
    explode: 50,
    options: [
      { id: 'wifi', label: 'Wi-Fi card' },
      { id: 'ssd', label: 'SSD' },
      { id: 'battery', label: 'Battery' },
    ],
    answer: 'wifi',
    explanation: 'The Wi-Fi card uses two antenna wires that run through the case.',
    review: 'Wi-Fi card and antennas',
  },
  {
    id: 'motherboard-role',
    title: 'Central connection',
    prompt: 'Which part connects the CPU, RAM, SSD, ports and power together?',
    part: 'motherboard',
    explode: 100,
    options: [
      { id: 'motherboard', label: 'Motherboard' },
      { id: 'battery', label: 'Battery' },
      { id: 'display', label: 'Display' },
    ],
    answer: 'motherboard',
    explanation: 'The motherboard connects all the laptop parts together.',
    review: 'Motherboard connections',
  },
  {
    id: 'display-path',
    title: 'Built-in screen path',
    prompt: 'A laptop turns on but its screen stays black. What should you check first?',
    part: 'display',
    explode: 89,
    options: [
      { id: 'display-path', label: 'Display and display cable' },
      { id: 'speakers', label: 'Speakers' },
      { id: 'battery', label: 'Battery only' },
    ],
    answer: 'display-path',
    explanation: 'The screen and its cable carry the picture. Check them first when the screen is black.',
    review: 'Display cable and hinge routing',
  },
] as const;
