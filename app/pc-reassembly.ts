/**
 * Put it back together: after the take-apart timeline, students choose which part goes back
 * next. Any order that works on a real PC is accepted; a part can only go in once what it sits
 * on or behind is already in place. Simplified teaching rules, not a repair guide.
 */
import { TEARDOWN, type TeardownStepId } from './pc-teardown.ts';

export const REASSEMBLY_STEPS: readonly TeardownStepId[] = [...TEARDOWN].reverse().map(step => step.id);

export const REASSEMBLY_LABEL: Record<TeardownStepId, string> = {
  motherboard: 'Motherboard',
  psu: 'Power supply',
  cpu: 'CPU',
  cooler: 'CPU cooler',
  ram: 'Memory (RAM)',
  ssd: 'M.2 SSD',
  gpu: 'Expansion card',
  cables: 'Connect cables',
  cage: 'Close drive cage',
  cover: 'Fit side cover',
};

/** What must already be in place before this step. */
export const REASSEMBLY_NEEDS: Record<TeardownStepId, readonly TeardownStepId[]> = {
  motherboard: [],
  psu: ['motherboard'],
  cpu: ['motherboard'],
  cooler: ['cpu'],
  ram: ['motherboard'],
  ssd: ['motherboard'],
  gpu: ['motherboard'],
  cables: ['motherboard', 'psu', 'cooler'],
  cage: ['motherboard', 'psu', 'cpu', 'cooler', 'ram', 'ssd', 'gpu', 'cables'],
  cover: ['cage'],
};

/** Why a step has to wait, in plain words. Keyed by the step, then the missing step. */
const WAIT_REASON: Partial<Record<TeardownStepId, string>> = {
  psu: 'The power supply sits over the edge of the motherboard. Put the motherboard in first.',
  cpu: 'The CPU goes into the socket on the motherboard. Put the motherboard in first.',
  cooler: 'The cooler sits on top of the CPU and carries its heat away. Put the CPU in first.',
  ram: 'Memory clips into slots on the motherboard. Put the motherboard in first.',
  ssd: 'The SSD plugs into the M.2 socket on the motherboard. Put the motherboard in first.',
  gpu: 'The card plugs into a slot on the motherboard. Put the motherboard in first.',
  cables: 'The cables join the power supply, the cooler fan and the case to the motherboard. Put the motherboard, power supply and cooler in first.',
  cage: 'The drive cage swings down over the parts and cables. Install every part and connect the cables before closing it.',
  cover: 'The cover goes on last. Close the drive cage first.',
};

export const INSTALLED_MESSAGE: Record<TeardownStepId, string> = {
  motherboard: 'Motherboard in. It sits on the case standoffs and its screws hold it in place.',
  psu: 'Power supply in its bay at the back.',
  cpu: 'CPU in. Line up the golden triangle with the socket mark, lay it in gently and press the lever down. Never press on the pins.',
  cooler: 'Cooler on. In a real build you put fresh thermal paste on the CPU first, then tighten the screws corner to corner.',
  ram: 'Memory in. The notch lines up with the slot and both clips close.',
  ssd: 'SSD in. It slides into the socket at an angle and one small screw holds it down.',
  gpu: 'Card in. Press it into the slot until the bracket clicks.',
  cables: 'Cables connected: board power and CPU power from the power supply, the cooler fan lead, and the front-panel switch. Each plug only fits one way.',
  cage: 'Drive cage closed over the parts.',
  cover: 'Side cover on. The PC is back together.',
};

export type ReassemblyResult = { ok: true; message: string } | { ok: false; message: string };

/** Try the next step: accepted when everything it needs is already done. */
export function tryReassemble(done: readonly TeardownStepId[], id: TeardownStepId): ReassemblyResult {
  if (done.includes(id)) return { ok: false, message: `${REASSEMBLY_LABEL[id]} is already done.` };
  const missing = REASSEMBLY_NEEDS[id].filter(need => !done.includes(need));
  if (missing.length) return { ok: false, message: `Not yet. ${WAIT_REASON[id]}` };
  return { ok: true, message: INSTALLED_MESSAGE[id] };
}

export const reassemblyComplete = (done: readonly TeardownStepId[]) => REASSEMBLY_STEPS.every(id => done.includes(id));
