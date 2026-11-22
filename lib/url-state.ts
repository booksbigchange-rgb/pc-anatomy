import { levels, type LevelId } from './levels.ts';
import { partAt, type ExplorerState, type Scene } from './explorer-state.ts';
import { lessonById } from './lessons/index.ts';
import { isLabId, type LabId } from './catalogue.ts';
import { cleanAssignment, type Assignment } from './assignment.ts';

/**
 * The address bar as a serialisation of state, not a route table.
 *
 * Navigation is still state (see ARCHITECTURE.md). This module only turns the
 * part of that state worth sharing into a query string on `/` and back again,
 * so a link can open the RTX 5090's vapor chamber or the third step of a
 * lesson. Everything stays on the one path, which is why a static host needs
 * no single-page-app fallback for it.
 *
 *   /                                    the School home
 *   /?lab=laptop                         one of the labs
 *   /?teach                              the teacher page
 *   /?progress                           a student's progress report
 *   /?assign=a,b&title=Week%203          an assignment from a teacher
 *   /?lesson=the-motherboard&step=3
 *   /?scale=card&part=vapor&explode=60&focus=1
 *
 * Reading is forgiving: anything unknown or out of range is dropped rather
 * than refused, so an old link to a renamed part still opens its scale.
 */

export type Address =
  | { kind: 'home' }
  | { kind: 'lab'; lab: LabId }
  | { kind: 'teacher' }
  | { kind: 'progress' }
  | { kind: 'assignment'; assignment: Assignment }
  | { kind: 'lesson'; lesson: string; step: number }
  | { kind: 'view'; scene: Scene };

const views = new Set<ExplorerState['view']>(['top', 'front', 'back']);

export function readAddress(search: string): Address {
  const q = new URLSearchParams(search);
  const lesson = q.get('lesson');
  if (lesson && lessonById[lesson]) {
    const count = lessonById[lesson].steps.length;
    const step = Math.trunc(Number(q.get('step') ?? '1'));
    return {
      kind: 'lesson',
      lesson,
      step: Number.isFinite(step) ? Math.min(count, Math.max(1, step)) - 1 : 0,
    };
  }
  const assign = q.get('assign');
  if (assign !== null) {
    const assignment = cleanAssignment(
      assign.split(','),
      q.get('title') ?? undefined,
    );
    if (assignment) return { kind: 'assignment', assignment };
  }
  if (q.has('teach')) return { kind: 'teacher' };
  if (q.has('progress')) return { kind: 'progress' };
  const lab = q.get('lab');
  if (lab && isLabId(lab)) return { kind: 'lab', lab };
  const scale = q.get('scale');
  if (!scale || !Object.hasOwn(levels, scale)) return { kind: 'home' };
  const level = scale as LevelId;
  const scene: Scene = { level };
  const part = q.get('part') ?? undefined;
  if (partAt(level, part)) {
    scene.part = part;
    if (q.get('focus') === '1') scene.focus = true;
    if (q.get('isolate') === '1') scene.isolate = true;
  }
  const explode = Math.round(Number(q.get('explode')));
  if (Number.isFinite(explode) && explode > 0)
    scene.explode = Math.min(100, explode);
  const view = q.get('view') as ExplorerState['view'] | null;
  if (view && views.has(view)) scene.view = view;
  const airflow = q.get('airflow');
  if (airflow === 'on' || airflow === 'off') scene.airflow = airflow;
  return { kind: 'view', scene };
}

export function writeAddress(address: Address): string {
  const q = new URLSearchParams();
  if (address.kind === 'lab') q.set('lab', address.lab);
  else if (address.kind === 'teacher') q.set('teach', '');
  else if (address.kind === 'progress') q.set('progress', '');
  else if (address.kind === 'assignment') {
    q.set('assign', address.assignment.lessons.join(','));
    if (address.assignment.title) q.set('title', address.assignment.title);
  } else if (address.kind === 'lesson') {
    q.set('lesson', address.lesson);
    q.set('step', String(address.step + 1));
  } else if (address.kind === 'view') {
    const { scene } = address;
    q.set('scale', scene.level);
    if (scene.part) q.set('part', scene.part);
    if (scene.explode) q.set('explode', String(Math.round(scene.explode)));
    if (scene.view && scene.view !== 'perspective') q.set('view', scene.view);
    if (scene.airflow && scene.airflow !== 'auto')
      q.set('airflow', scene.airflow);
    if (scene.part && scene.focus) q.set('focus', '1');
    if (scene.part && scene.isolate) q.set('isolate', '1');
  }
  // A flag with no value reads better as `?teach` than as `?teach=`.
  const text = q.toString().replace(/=(?=&|$)/g, '');
  return text ? '?' + text : '';
}

/**
 * What the explorer is showing, as an address. Always a view: the bare `/`
 * belongs to the School home, so even the untouched tower is `?scale=pc`.
 */
export function addressOf(state: ExplorerState): Address {
  const part = state.selection?.concept;
  const scene: Scene = { level: state.level };
  if (part && partAt(state.level, part)) {
    scene.part = part;
    if (state.isolated) scene.isolate = true;
    else if (state.focusRevision > 0) scene.focus = true;
  }
  const explode = Math.round(state.explode);
  if (explode > 0) scene.explode = explode;
  if (state.view !== 'perspective') scene.view = state.view;
  if (state.airflow !== 'auto') scene.airflow = state.airflow;
  return { kind: 'view', scene };
}
