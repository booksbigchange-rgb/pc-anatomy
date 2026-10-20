import type { HardwareId } from '../lib/optiplex-7040.ts';
import { ORIENTED_PARTS, RETAINERS, fasteningProblems, placementProblem, type Retainer } from './hardware-practice.ts';
import { PC_CONNECTIONS, checkCooling, checkPcPower, type PcConnection } from './pc-power-challenge.ts';

/**
 * The rules of Build Your PC, kept apart from three.js so they can be tested
 * with Node's runner. The 3D lab and the "Seat in its guide" button both ask
 * these functions, so dragging and the button can never disagree.
 */

/** The order the coach recommends. Students may install a part early when its prerequisites are met. */
export const INSTALL_ORDER: HardwareId[] = ['motherboard', 'cpu', 'cooler', 'ram', 'ssd', 'gpu', 'psu'];

/** What must already be in the case before a part can go in. */
export const PREREQUISITES: Record<HardwareId, HardwareId[]> = {
  motherboard: [],
  cpu: ['motherboard'],
  cooler: ['cpu'],
  ram: ['motherboard'],
  ssd: ['motherboard'],
  gpu: ['motherboard'],
  psu: [],
};

export const SHORT_NAME: Record<HardwareId, string> = {
  motherboard: 'motherboard',
  cpu: 'CPU',
  cooler: 'CPU cooler',
  ram: 'RAM',
  ssd: 'SSD',
  gpu: 'expansion card',
  psu: 'power supply',
};

/** Where each part belongs, in words a student can follow. */
export const PLACE: Record<HardwareId, string> = {
  motherboard: 'on the standoffs in the case',
  cpu: 'in the CPU socket',
  cooler: 'on top of the CPU',
  ram: 'in the memory slot',
  ssd: 'in the M.2 socket',
  gpu: 'in the long PCIe slot',
  psu: 'in the power supply bay',
};

/** Why the direction matters, for the four keyed parts. */
export const DIRECTION_REASON: Partial<Record<HardwareId, string>> = {
  cpu: 'The gold triangle on the CPU must match the triangle on the socket. The pins are very thin and bend easily.',
  ram: 'The notch in the gold contacts must line up with the bump in the slot. Then it only fits one way.',
  ssd: 'The gold contacts go into the socket. The screw end goes over the small mount post.',
  gpu: 'The gold contacts go down into the slot. The metal bracket goes to the back of the case.',
};

/** One short safety note per part. */
export const SAFETY: Record<HardwareId, string> = {
  motherboard: 'Hold the board by its edges. Do not touch the chips.',
  cpu: 'Never touch the gold contacts or the socket pins.',
  cooler: 'Put on thermal paste first. A cooler without paste lets the CPU get too hot.',
  ram: 'Push straight down until both clips close. Do not rock it.',
  ssd: 'Hold it by the edges. Only fasten the screw gently.',
  gpu: 'Push straight down into the slot. Then fasten the bracket.',
  psu: 'Never open a power supply. Keep it unplugged while you work.',
};

/** Pause-points the coach can show when the student picks a fixed board or case part. */
export const FIXED_NOTE = 'Fixed part: it stays on the board. You cannot remove it.';
export const REMOVABLE_NOTE = 'Removable part: you can take it out and put it back.';

export type BuildState = {
  installed: HardwareId[];
  aligned: HardwareId[];
  fastened: Retainer[];
  pasteApplied: boolean;
  screws: number[];
  connections: PcConnection[];
  coverClosed: boolean;
  cageOpen: boolean;
  powerOn: boolean;
  mistakes: number;
};

export const NEW_BUILD: BuildState = {
  installed: [],
  aligned: [],
  fastened: [],
  pasteApplied: false,
  screws: [],
  connections: [],
  coverClosed: false,
  cageOpen: true,
  powerOn: false,
  mistakes: 0,
};

/** The next part the coach suggests, or null when every part is in. */
export function nextPart(state: Pick<BuildState, 'installed'>) {
  return INSTALL_ORDER.find(id => !state.installed.includes(id)) ?? null;
}

export function isOriented(id: HardwareId) {
  return ORIENTED_PARTS.includes(id);
}

/** A status line for the part list. */
export function partStatus(state: Pick<BuildState, 'installed'>, id: HardwareId) {
  if (state.installed.includes(id)) return 'Installed';
  if (nextPart(state) === id) return 'Next step';
  const missing = PREREQUISITES[id].filter(part => !state.installed.includes(part));
  return missing.length ? `Needs ${missing.map(part => SHORT_NAME[part]).join(' and ')} first` : 'Ready to install';
}

/** Why this part cannot go in now, or null when it can. Dragging and the seat button share this. */
export function installProblem(state: BuildState, id: HardwareId) {
  if (state.installed.includes(id)) return `The ${SHORT_NAME[id]} is already installed.`;
  if (state.powerOn || state.connections.includes('mains')) return 'Unplug wall power before you install parts.';
  if (state.coverClosed) return 'Take off the side cover before you install parts.';
  const missing = PREREQUISITES[id].filter(part => !state.installed.includes(part));
  if (missing.length) {
    const needs = missing.map(part => SHORT_NAME[part]).join(' and ');
    return `Install the ${needs} first. The ${SHORT_NAME[id]} goes ${PLACE[id]}.`;
  }
  if (id === 'cooler' && !state.pasteApplied) return 'Apply thermal paste to the CPU first. Then the cooler can go on.';
  const direction = placementProblem(id, state.aligned.includes(id));
  if (direction) return `${direction} Use “Turn part 180°”.`;
  return null;
}

export type Drop = { ok: true; state: BuildState; message: string } | { ok: false; state: BuildState; message: string };

/** Students drop parts with a hand, not a mouse at pixel precision: guides accept a generous circle. */
export const SNAP_FORGIVENESS = 1.35;

/**
 * Where a dragged part landed decides what happens.
 * `distances` gives the flat distance from the drop point to each guide, and
 * `snap` gives each guide's base radius.
 */
export function dropPart(
  state: BuildState,
  id: HardwareId,
  distances: Record<HardwareId, number>,
  snap: Record<HardwareId, number>,
): Drop {
  if (distances[id] <= snap[id] * SNAP_FORGIVENESS) return installPart(state, id);
  const other = INSTALL_ORDER.filter(part => part !== id && distances[part] <= snap[part] * SNAP_FORGIVENESS)
    .sort((a, b) => distances[a] - distances[b])[0];
  const message = other
    ? `That is the ${SHORT_NAME[other]} guide. The ${SHORT_NAME[id]} goes ${PLACE[id]}. It went back to the tray.`
    : `The ${SHORT_NAME[id]} missed its mounting guide. It went back to the tray. Try again.`;
  return { ok: false, state: { ...state, mistakes: state.mistakes + 1 }, message };
}

/** Install a part when it is allowed. Used by a successful drop and by the seat button. */
export function installPart(state: BuildState, id: HardwareId): Drop {
  const problem = installProblem(state, id);
  if (problem) return { ok: false, state: { ...state, mistakes: state.mistakes + 1 }, message: `${problem} It went back to the tray.` };
  const installed = [...state.installed, id];
  const next = nextPart({ installed });
  const after = id === 'cooler' ? ' Now fasten the corners 1 → 3 → 2 → 4.' : id in RETAINERS ? ` Now ${RETAINERS[id as Retainer].toLowerCase()}.` : '';
  const message = next
    ? `Installed: ${SHORT_NAME[id]}.${after} Next: ${SHORT_NAME[next]}.`
    : `Installed: ${SHORT_NAME[id]}.${after} All parts are in. Secure them, connect the cables, close the case, then test power.`;
  return { ok: true, state: { ...state, installed }, message };
}

export function turnPart(state: BuildState, id: HardwareId): BuildState {
  if (!isOriented(id) || state.installed.includes(id)) return state;
  return { ...state, aligned: state.aligned.includes(id) ? state.aligned.filter(part => part !== id) : [...state.aligned, id] };
}

/** Every reason the virtual PC would not pass POST. Empty means it starts. */
export function postProblems(state: BuildState) {
  return [
    ...checkPcPower(state.installed, state.connections, state.coverClosed, !state.cageOpen),
    ...checkCooling({ pasteApplied: state.pasteApplied, screws: state.screws }),
    ...fasteningProblems(state.fastened),
  ];
}

/** A short explanation of a POST problem, so the result reads as a diagnosis rather than a list. */
export function diagnosis(problems: string[]) {
  if (!problems.length) return 'POST passed. The CPU, RAM and SSD were found, and the screen has a signal.';
  const first = problems[0];
  if (first.startsWith('Install')) return 'The PC did not start because a part is missing.';
  if (first.startsWith('Connect')) return 'The PC did not start because a cable is not connected.';
  if (/cage|cover/.test(first)) return 'The PC did not start because the case is still open. Close it so air flows the right way.';
  if (/paste|cooler/.test(first)) return 'The PC stopped to protect the CPU. The cooler is not ready.';
  return 'The PC did not start because a part is loose. Secure every clip, screw and bracket.';
}

export const XP_PER_STEP = 10;
/** Steps the student completed: parts, retainers, paste, cooler corners, cables, cage, cover, POST. */
export function completedSteps(state: BuildState) {
  return state.installed.length + state.fastened.length + (state.pasteApplied ? 1 : 0) + state.screws.length +
    state.connections.length + (state.cageOpen ? 0 : 1) + (state.coverClosed ? 1 : 0) + (state.powerOn ? 1 : 0);
}
export const TOTAL_STEPS = INSTALL_ORDER.length + Object.keys(RETAINERS).length + 1 + 4 + PC_CONNECTIONS.length + 3;

export const LEARNED = [
  'The motherboard connects every part.',
  'The CPU and RAM only fit one way. Match the triangle and the notch.',
  'Thermal paste goes on before the cooler.',
  'Tighten cooler corners across from each other: 1 → 3 → 2 → 4.',
  'Clips, screws and brackets hold parts still.',
  'Plug in wall power last, and unplug it before you change anything.',
  'POST is the first self-test. It finds missing or loose parts.',
];
