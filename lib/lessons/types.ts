import type { Scene } from '../explorer-state.ts';
import type { SourceId } from '../sources.ts';

/**
 * The shape of the school.
 *
 * A course is an ordered list of lessons; a lesson is an ordered list of
 * steps; a step is some reading, a view of the machine, and optionally a
 * check. Lessons are data in the same way the scale tree is: they point at
 * scales and concepts by id and never at geometry, so a lesson cannot draw
 * anything the explorer does not already have.
 */

/** "Click the part in the 3D view." Any listed concept counts as right. */
export type FindCheck = {
  kind: 'find';
  prompt: string;
  answers: string[];
  /** Shown after a wrong click, alongside the name of what was clicked. */
  hint: string;
};

/** A multiple-choice question. */
export type ChoiceCheck = {
  kind: 'choice';
  prompt: string;
  options: string[];
  /** Index into `options`. */
  answer: number;
  /** Shown once the right answer is chosen. */
  explain: string;
};

export type Check = FindCheck | ChoiceCheck;

export type LessonStep = {
  title: string;
  /** Paragraphs, written for a reader meeting the hardware for the first time. */
  body: string[];
  /** What the explorer shows when the step opens. */
  scene: Scene;
  /** A step with a check cannot be passed until it is answered. */
  check?: Check;
  /**
   * References for the claims the step makes beyond its concepts' own
   * catalogue entries. The same sourcing rules apply as to the catalogue.
   */
  sources?: SourceId[];
};

export type Lesson = {
  id: string;
  title: string;
  summary: string;
  /** A rough reading time, for the course list. */
  minutes: number;
  steps: LessonStep[];
};

export type Course = {
  id: string;
  title: string;
  summary: string;
  /** Who it is written for, shown on the course card. */
  audience: string;
  lessons: Lesson[];
};
