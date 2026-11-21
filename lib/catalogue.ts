import type { LevelId } from './levels.ts';

/**
 * The school's map: subjects, and in each the exhibits a student can open
 * and the courses that walk through them.
 *
 * An exhibit is a doorway, not content. It points either at a scale of the
 * explorer (by level id) or at one of the hand-built labs (by lab id), so the
 * catalogue can be checked against the scale tree and the lab list but never
 * duplicates what they hold. Courses are named by id from `lib/lessons/`.
 */

/** The hand-built activities from the school edition, outside the explorer. */
export const labIds = [
  'computer',
  'laptop',
  'build',
  'task-manager',
  'path',
] as const;
export type LabId = (typeof labIds)[number];

export function isLabId(value: string): value is LabId {
  return (labIds as readonly string[]).includes(value);
}

export type Doorway =
  | { kind: 'scale'; level: LevelId }
  | { kind: 'lab'; lab: LabId };

/** Icon names resolved by the interface, so this module stays UI-free. */
export type ExhibitIcon =
  | 'desk'
  | 'tower'
  | 'laptop'
  | 'wrench'
  | 'activity'
  | 'path'
  | 'chip'
  | 'switch'
  | 'gate'
  | 'adder'
  | 'alu';

export type Exhibit = {
  id: string;
  title: string;
  summary: string;
  icon: ExhibitIcon;
  open: Doorway;
};

export type Subject = {
  id: string;
  title: string;
  summary: string;
  /** Lesson course ids, in the order the subject offers them. */
  courses: string[];
  exhibits: Exhibit[];
};

export const subjects: Subject[] = [
  {
    id: 'computers',
    title: 'Computers',
    summary:
      'From the whole desk setup down to the parts inside a desktop and a laptop, and how they work together.',
    courses: ['how-a-computer-works'],
    exhibits: [
      {
        id: 'computer-lab',
        title: 'Computer Lab',
        summary:
          'Meet the whole computer on a desk: monitor, keyboard, mouse, network and power, and how they connect.',
        icon: 'desk',
        open: { kind: 'lab', lab: 'computer' },
      },
      {
        id: 'inside-the-pc',
        title: 'Inside the PC',
        summary:
          'Take a desktop tower apart in 3D, from the case down to a single core of the graphics chip.',
        icon: 'tower',
        open: { kind: 'scale', level: 'pc' },
      },
      {
        id: 'laptop-lab',
        title: 'Laptop Lab',
        summary:
          'Open a laptop step by step, in the order a technician would, and see what depends on what.',
        icon: 'laptop',
        open: { kind: 'lab', lab: 'laptop' },
      },
      {
        id: 'build-a-pc',
        title: 'Build a PC',
        summary:
          'Choose parts that fit together, and find out why some combinations do not.',
        icon: 'wrench',
        open: { kind: 'lab', lab: 'build' },
      },
      {
        id: 'task-manager',
        title: 'Task Manager',
        summary:
          'Watch the processor, memory, disk and network work while programs run.',
        icon: 'activity',
        open: { kind: 'lab', lab: 'task-manager' },
      },
      {
        id: 'learning-path',
        title: 'My learning path',
        summary:
          'Follow a file from storage to the screen and back, use a practice computer, and take the final check.',
        icon: 'path',
        open: { kind: 'lab', lab: 'path' },
      },
    ],
  },
];

export const subjectById: Record<string, Subject> = Object.fromEntries(
  subjects.map((s) => [s.id, s]),
);
