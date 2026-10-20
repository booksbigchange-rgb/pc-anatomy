import { rootLevel, type LevelId } from './levels.ts';

// Kept apart from the geometry in airflow.ts so the interface can ask whether
// a scale draws air without pulling three.js into the first-paint bundle.

/** The scales with a fan in them, and so with air to draw. */
export const airflowLevels: readonly LevelId[] = [
  'pc',
  'fan',
  'cooler',
  'liquid',
  'psu',
  'psubronze',
  'card',
  'rx9070',
  'arcb580',
];

export function hasAirflow(level: LevelId) {
  return airflowLevels.includes(level);
}

/**
 * Whether the chevrons are drawn.
 *
 * `auto` is on wherever there are fans, with one exception: the assembled
 * machine you arrive on. A sealed tower is the one place the arrows have to
 * cross the whole case to say anything, and four streams over a machine
 * nobody has touched yet is a lot to meet first — but it is also the one
 * place a viewer might never think to look for them, so the control says its
 * own name there rather than hiding behind an icon.
 *
 * `on` and `off` are someone having said, and they hold on every scale for
 * the rest of the session. Coming back to the tower having asked to see the
 * air and finding it switched off again would be the machine overruling them.
 */
export type AirflowMode = 'auto' | 'on' | 'off';

export function airflowShown(mode: AirflowMode, level: LevelId) {
  if (!hasAirflow(level)) return false;
  return mode === 'auto' ? level !== rootLevel : mode === 'on';
}
