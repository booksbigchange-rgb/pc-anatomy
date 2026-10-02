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
    prompt: 'Which component stores energy so the laptop can run away from a charger?',
    part: 'battery',
    explode: 18,
    options: [
      { id: 'battery', label: 'Battery' },
      { id: 'ssd', label: 'SSD' },
      { id: 'ram', label: 'RAM' },
    ],
    answer: 'battery',
    explanation: 'The battery stores electrical energy for portable operation.',
    review: 'Battery and power path',
  },
  {
    id: 'service-safety',
    title: 'Safe service order',
    prompt: 'Before removing internal components, what should you disconnect first?',
    part: 'battery',
    explode: 18,
    options: [
      { id: 'battery-cable', label: 'Battery cable' },
      { id: 'speaker-wire', label: 'Speaker wire' },
      { id: 'wifi-antenna', label: 'Wi-Fi antenna' },
    ],
    answer: 'battery-cable',
    explanation: 'Disconnecting battery power reduces the chance of powering the board while you work.',
    review: 'Battery disconnect before service',
  },
  {
    id: 'ram-role',
    title: 'Working memory',
    prompt: 'Which component holds working data for programs that are currently running?',
    part: 'ram',
    explode: 60,
    options: [
      { id: 'ram', label: 'RAM / SODIMM' },
      { id: 'ssd', label: 'SSD' },
      { id: 'wifi', label: 'Wi-Fi card' },
    ],
    answer: 'ram',
    explanation: 'RAM holds active working data used by running programs.',
    review: 'RAM versus storage',
  },
  {
    id: 'storage-role',
    title: 'Persistent storage',
    prompt: 'Which removable module keeps the operating system and files when power is off?',
    part: 'ssd',
    explode: 46,
    options: [
      { id: 'ssd', label: 'M.2 SSD' },
      { id: 'ram', label: 'RAM' },
      { id: 'cpu', label: 'CPU' },
    ],
    answer: 'ssd',
    explanation: 'The SSD stores the operating system, applications and files persistently.',
    review: 'SSD and M.2 storage',
  },
  {
    id: 'cooling-path',
    title: 'Heat removal',
    prompt: 'What carries processor heat toward the fan and fin stack?',
    part: 'fan',
    explode: 78,
    options: [
      { id: 'heat-pipes', label: 'Heat pipes' },
      { id: 'antenna-leads', label: 'Antenna leads' },
      { id: 'speaker-wires', label: 'Speaker wires' },
    ],
    answer: 'heat-pipes',
    explanation: 'Heat pipes move heat from the CPU cold plate toward the fin stack where airflow removes it.',
    review: 'Cooling assembly and heat path',
  },
  {
    id: 'wireless-path',
    title: 'Wireless networking',
    prompt: 'Which small removable module connects to two thin antenna leads?',
    part: 'wifi',
    explode: 50,
    options: [
      { id: 'wifi', label: 'Wi-Fi card' },
      { id: 'ssd', label: 'SSD' },
      { id: 'battery', label: 'Battery' },
    ],
    answer: 'wifi',
    explanation: 'The Wi-Fi module uses two antenna connections routed through the chassis.',
    review: 'Wi-Fi card and antennas',
  },
  {
    id: 'motherboard-role',
    title: 'Central connection',
    prompt: 'Which part links the CPU, memory, storage, ports and power system together?',
    part: 'motherboard',
    explode: 100,
    options: [
      { id: 'motherboard', label: 'Motherboard' },
      { id: 'battery', label: 'Battery' },
      { id: 'display', label: 'Display' },
    ],
    answer: 'motherboard',
    explanation: 'The motherboard is the central electrical and mechanical connection point for the laptop hardware.',
    review: 'Motherboard connections',
  },
  {
    id: 'display-path',
    title: 'Built-in screen path',
    prompt: 'A laptop powers on but its built-in screen stays black. Which hardware path should you inspect first?',
    part: 'display',
    explode: 89,
    options: [
      { id: 'display-path', label: 'Display and display cable' },
      { id: 'speakers', label: 'Speakers' },
      { id: 'battery', label: 'Battery only' },
    ],
    answer: 'display-path',
    explanation: 'The display assembly and its routed cable are the most relevant hardware path for a black built-in screen.',
    review: 'Display cable and hinge routing',
  },
] as const;
