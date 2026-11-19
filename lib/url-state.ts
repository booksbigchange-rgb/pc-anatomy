import { levels, rootLevel, type LevelId } from './levels.ts';
import { partAt, type ExplorerState, type Scene } from './explorer-state.ts';
import { lessonById } from './lessons/index.ts';

/**
 * The address bar as a serialisation of state, not a route table.
 *
 * Navigation is still state (see ARCHITECTURE.md). This module only turns the
 * part of that state worth sharing into a query string on `/` and back again,
 * so a link can open the RTX 5090's vapor chamber or the third step of a
 * lesson. Everything stays on the one path, which is why a static host needs
 * no single-page-app fallback for it.
 *
 *   /?lesson=the-motherboard&step=3
 *   /?scale=card&part=vapor&explode=60&focus=1
 *
 * Reading is forgiving: anything unknown or out of range is dropped rather
 * than refused, so an old link to a renamed part still opens its scale.
 */

export type Address =
  | { kind: 'home' }
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
  if (address.kind === 'lesson') {
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
  const text = q.toString();
  return text ? '?' + text : '';
}

/** What the explorer is showing, as an address. The untouched machine is home. */
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
  const untouched =
    scene.level === rootLevel &&
    !scene.part &&
    !scene.explode &&
    !scene.view &&
    !scene.airflow;
  return untouched ? { kind: 'home' } : { kind: 'view', scene };
}
