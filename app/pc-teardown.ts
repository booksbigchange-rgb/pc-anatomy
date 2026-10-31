/**
 * OptiPlex teardown timeline: one 0–100 value takes the reference model apart in a fixed
 * service order, the way a technician would. Same idea as the original explorer's
 * disassembly slider (Auto, named phases, scrub, reset), rebuilt for our OptiPlex model.
 * The order is a teaching sequence based on Dell's manual, simplified; it is not a repair guide.
 */
import type { HardwareId, Vec3 } from '../lib/optiplex-7040.ts';

/**
 * Where each part rests on the bench, left of the case, in rows a student can read:
 * back row power supply; middle row CPU, cooler, motherboard; front row card, memory, SSD.
 * Each height puts the part's lowest point on the table top (0.515).
 */
export const BENCH: Record<HardwareId, Vec3> = {
  psu: [-5.6, 1.08, -2.05],
  cpu: [-6.6, 0.56, 0.1],
  cooler: [-5.0, 0.58, 0.1],
  motherboard: [-2.25, 0.55, -0.05],
  gpu: [-5.6, 1.31, 2.75],
  ram: [-3.4, 0.78, 3.3],
  ssd: [-2.4, 0.54, 3.25],
};

export type TeardownStepId = 'cover' | 'cage' | HardwareId;
export type TeardownStep = { id: TeardownStepId; label: string; from: number; to: number; action: string };

export const TEARDOWN: readonly TeardownStep[] = [
  { id: 'cover', label: 'Cover', from: 0, to: 8, action: 'Side cover lifted off.' },
  { id: 'cage', label: 'Drive cage', from: 8, to: 15, action: 'Drive cage swung up out of the way.' },
  { id: 'gpu', label: 'Card', from: 15, to: 26, action: 'Card bracket opened, expansion card lifted out of its slot.' },
  { id: 'ram', label: 'Memory', from: 26, to: 36, action: 'Memory clips opened, RAM lifted straight up.' },
  { id: 'ssd', label: 'SSD', from: 36, to: 46, action: 'SSD screw removed, drive slid out of the M.2 socket.' },
  { id: 'cooler', label: 'Cooler', from: 46, to: 58, action: 'Cooler screws loosened in order, cooler lifted off the CPU.' },
  { id: 'cpu', label: 'CPU', from: 58, to: 68, action: 'Socket lever opened, CPU lifted out by its edges.' },
  { id: 'psu', label: 'Power', from: 68, to: 80, action: 'Power supply released and lifted out of its bay.' },
  { id: 'motherboard', label: 'Board', from: 80, to: 100, action: 'Motherboard screws removed, board lifted out. Every part is laid out.' },
];

/** Phase buttons for the timeline, as [label, value] pairs like the original explorer. */
export const TEARDOWN_PHASES: readonly (readonly [string, number])[] = [
  ['Assembled', 0],
  ...TEARDOWN.map(step => [step.label, step.to] as const),
];

/** Retainers and screws are undone in the first part of each window; the part moves after. */
const RELEASE = 0.25;
/** Height a part is lifted to before it moves to the bench, clear of the case walls. */
export const LIFT_HEIGHT = 3.4;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const ease = (value: number) => value * value * (3 - 2 * value);

/** How far one step has gone, from 0 (not started) to 1 (finished). */
export function stepProgress(t: number, id: TeardownStepId) {
  const step = TEARDOWN.find(item => item.id === id)!;
  return clamp01((t - step.from) / (step.to - step.from));
}

/** Movement of a part from its step progress: the retainer opens first, then the part moves. */
export function moveOf(progress: number) {
  return clamp01((progress - RELEASE) / (1 - RELEASE));
}

/** Movement of a part (after its retainer is released), 0 to 1. */
export function partMove(t: number, id: HardwareId) {
  return moveOf(stepProgress(t, id));
}

/** True while the part's retainer or screws are still done up. */
export function stillFastened(t: number, id: 'ram' | 'ssd' | 'gpu' | 'cooler') {
  return stepProgress(t, id) <= 0;
}

/** Where a part is: straight up out of its mount, then across to its place on the bench. */
export function partPose(mount: Vec3, bench: Vec3, move: number): Vec3 {
  if (move <= 0) return [...mount];
  const up = ease(clamp01(move / 0.4)), across = ease(clamp01((move - 0.4) / 0.6));
  const lifted = mount[1] + (Math.max(LIFT_HEIGHT, mount[1]) - mount[1]) * up;
  return [
    mount[0] + (bench[0] - mount[0]) * across,
    lifted + (bench[1] - lifted) * across,
    mount[2] + (bench[2] - mount[2]) * across,
  ];
}

/** Side cover offset: up, then aside. Hidden once the step is done. */
export function coverOffset(t: number): { visible: boolean; offset: Vec3 } {
  return coverPose(stepProgress(t, 'cover'));
}

/** Side cover from its step progress (0 fitted, 1 set aside). */
export function coverPose(p: number): { visible: boolean; offset: Vec3 } {
  return { visible: p < 1, offset: [0, 1.6 * ease(clamp01(p / 0.5)), 6.5 * ease(clamp01((p - 0.5) / 0.5))] };
}

/** The step happening at this point, for the readout and the screen-reader value. */
export function teardownStage(t: number) {
  if (t <= 0) return 'Assembled';
  const step = TEARDOWN.find(item => t < item.to) ?? TEARDOWN[TEARDOWN.length - 1];
  return t >= 100 ? 'All parts laid out' : `${step.label}: ${step.action}`;
}
