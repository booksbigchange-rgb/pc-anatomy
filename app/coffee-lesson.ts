/**
 * Coffee ceremony lesson: each step of making coffee for guests is matched to the computer
 * part that does the same kind of job. A comparison to help remember, not an exact model.
 */
export type CoffeeStep = {
  title: string;
  scene: string;
  question: string;
  choices: readonly string[];
  answer: string;
  explanation: string;
};

export const COFFEE_INTRO =
  'In a coffee ceremony, raw beans become cups of coffee for the guests. A computer also turns input into output. Match each step to the part of the computer that does the same kind of job.';

export const COFFEE_STEPS: readonly CoffeeStep[] = [
  {
    title: 'Bring the green beans',
    scene: 'The host brings raw green coffee beans to the ceremony.',
    question: 'Which computer job is like bringing in the raw beans?',
    choices: ['Output: screen and speakers', 'Input: keyboard and mouse', 'Storage: SSD'],
    answer: 'Input: keyboard and mouse',
    explanation: 'The beans are the raw material. Input devices, like the keyboard and mouse, bring raw data into the computer.',
  },
  {
    title: 'Roast the beans',
    scene: 'The beans are roasted on a hot pan until they turn dark and smell good. Smoke leaves the room.',
    question: 'Which part does the main work, like the hot pan that changes the beans?',
    choices: ['CPU', 'Speaker', 'Battery'],
    answer: 'CPU',
    explanation: 'Roasting changes the beans. The CPU changes data by following instructions. It gets hot too, so the cooler and fan carry the heat away, like the smoke leaving the room.',
  },
  {
    title: 'Grind the beans',
    scene: 'The roasted beans are ground into powder with a mortar and pestle, many small hits at a time.',
    question: 'Which part works through many small steps, very fast?',
    choices: ['Monitor', 'CPU', 'SSD'],
    answer: 'CPU',
    explanation: 'Processing happens in many small steps. The CPU does billions of tiny steps every second.',
  },
  {
    title: 'Brew in the jebena',
    scene: 'The powder and water heat together in the jebena. It holds the coffee only while it is being made.',
    question: 'Which part holds the work in progress, like the jebena?',
    choices: ['RAM', 'SSD', 'Keyboard'],
    answer: 'RAM',
    explanation: 'RAM holds the data an app is using right now. When the power goes off, RAM is emptied, like the jebena after the ceremony.',
  },
  {
    title: 'Serve the sini cups',
    scene: 'The coffee is poured into small sini cups and given to each guest.',
    question: 'Which computer job is like serving the cups?',
    choices: ['Input: keyboard and mouse', 'Storage: SSD', 'Output: screen and speakers'],
    answer: 'Output: screen and speakers',
    explanation: 'Output devices give the result to people. The screen shows pictures and the speakers play sound.',
  },
  {
    title: 'Keep beans for next time',
    scene: 'Extra beans go into a closed jar for another day.',
    question: 'Which part keeps things for later, even when the power is off?',
    choices: ['RAM', 'SSD', 'CPU'],
    answer: 'SSD',
    explanation: 'The SSD keeps files when the computer is off, like the jar keeps beans for the next ceremony.',
  },
];

export const COFFEE_SUMMARY =
  'Input → processing → output, with storage for later. A ceremony serves coffee in several rounds; a computer repeats this cycle millions of times every second.';

/** Feedback for one choice: the explanation when right, a hint when not. */
export function coffeeFeedback(step: CoffeeStep, choice: string) {
  return choice === step.answer
    ? { correct: true, text: step.explanation }
    : { correct: false, text: 'Not quite. Think about what this step does with the coffee, then try again.' };
}
