export type LaptopVec3 = readonly [number, number, number];

export const LAPTOP_INTERNAL_LAYOUT = {
  motherboard: {
    home: [0.15, 1.02, -0.92] as LaptopVec3,
    teardown: {
      start: 84,
      end: 100,
      offset: [0, 0.34, -0.22] as LaptopVec3,
      rotation: [-0.025, 0, 0.012] as LaptopVec3,
    },
  },
  cpu: {
    // Cooling mount (-1.52, -1.35) + cold plate local centre (1, -0.06).
    home: [-0.52, 1.18, -1.41] as LaptopVec3,
    teardown: {
      start: 72,
      end: 88,
      // Preserve the established full-teardown service position.
      offset: [3.48, 0.16, 2.27] as LaptopVec3,
      rotation: [0, 0.04, 0] as LaptopVec3,
    },
  },
  ram: {
    home: [1.28, 1.16, -0.78] as LaptopVec3,
    teardown: {
      start: 42,
      end: 60,
      offset: [0.34, 0.16, 2.62] as LaptopVec3,
      rotation: [-0.035, 0, 0] as LaptopVec3,
    },
  },
  ssd: {
    home: [-0.68, 1.16, 0.02] as LaptopVec3,
    rotationY: -0.03,
    teardown: {
      start: 30,
      end: 46,
      offset: [-2.28, 0.15, 1.94] as LaptopVec3,
      rotation: [0, -0.03, 0.025] as LaptopVec3,
    },
  },
  wifi: {
    home: [2.5, 1.15, 0.18] as LaptopVec3,
    teardown: {
      start: 34,
      end: 50,
      offset: [0.3, 0.15, 1.94] as LaptopVec3,
      rotation: [0, 0.04, -0.025] as LaptopVec3,
    },
  },
  cooling: {
    home: [-1.52, 1.17, -1.35] as LaptopVec3,
    teardown: {
      start: 58,
      end: 78,
      offset: [-3.55, 0.24, -0.06] as LaptopVec3,
      rotation: [-0.03, -0.035, 0] as LaptopVec3,
    },
  },
  speakers: {
    home: [0, 1.08, 0.7] as LaptopVec3,
    teardown: {
      start: 50,
      end: 68,
      offset: [0, 0.12, 0.32] as LaptopVec3,
      rotation: [0.015, 0, 0] as LaptopVec3,
    },
  },
  battery: {
    home: [0, 1.02, 1.38] as LaptopVec3,
    teardown: {
      start: 24,
      end: 34,
      offset: [0, 0.1, 2.18] as LaptopVec3,
      rotation: [-0.025, -0.04, 0] as LaptopVec3,
    },
  },
} as const;

export const LAPTOP_INPUT_COVER_SERVICE = {
  home: [0, 1.07, 0] as LaptopVec3,
  start: 0,
  end: 18,
  offset: [0, 0.44, 2.72] as LaptopVec3,
  rotation: [Math.PI, 0, 0] as LaptopVec3,
  flippedAt: 9,
  internalsVisibleAt: 18,
  // After the first service operations begin, the removed Input Cover is
  // placed off the technician's active mat instead of dominating the view.
  visibleUntil: 18,
} as const;

export const LAPTOP_DISPLAY_SERVICE = {
  start: 90,
  end: 100,
  offset: [0, 0.18, -0.12] as LaptopVec3,
  rotation: [-0.025, 0, 0] as LaptopVec3,
} as const;

export function laptopTeardownStage(amount: number) {
  if (amount < 1) return 'Assembled';
  if (amount < LAPTOP_INPUT_COVER_SERVICE.end) return 'Input cover';
  if (amount < 34) return 'Battery + service parts';
  if (amount < 50) return 'Storage + wireless';
  if (amount < 68) return 'Memory + speakers';
  if (amount < 88) return 'Cooling + CPU';
  if (amount < 96) return 'Motherboard';
  return 'Service layout';
}


export const LAPTOP_CHASSIS_FEATURES = {
  batteryRails: [
    { position: [-3.02, 0.86, 1.42] as LaptopVec3, size: [0.08, 0.08, 2.3] as LaptopVec3 },
    { position: [3.02, 0.86, 1.42] as LaptopVec3, size: [0.08, 0.08, 2.3] as LaptopVec3 },
    { position: [0, 0.86, 2.54] as LaptopVec3, size: [5.96, 0.08, 0.08] as LaptopVec3 },
  ],
  speakerPockets: [
    { position: [-3.08, 0.79, 0.7] as LaptopVec3, size: [0.68, 0.035, 1.58] as LaptopVec3 },
    { position: [3.08, 0.79, 0.7] as LaptopVec3, size: [0.68, 0.035, 1.58] as LaptopVec3 },
  ],
  hingeLane: {
    position: [0, 0.82, -2.38] as LaptopVec3,
    size: [6.35, 0.035, 0.16] as LaptopVec3,
  },
  clips: [
    { role: 'battery', position: [0.18, 0.98, 0.22] as LaptopVec3, rotation: 0.14 },
    { role: 'display', position: [1.52, 0.98, -1.05] as LaptopVec3, rotation: -0.08 },
    { role: 'display', position: [1.9, 0.96, -1.82] as LaptopVec3, rotation: -0.14 },
    { role: 'speaker-right', position: [2.72, 0.93, 0.3] as LaptopVec3, rotation: 0.28 },
    { role: 'speaker-left', position: [-2.38, 0.91, 1.58] as LaptopVec3, rotation: -0.12 },
    { role: 'wifi-black', position: [3.02, 0.94, -0.82] as LaptopVec3, rotation: 0.04 },
    { role: 'wifi-white', position: [2.84, 0.94, -1.42] as LaptopVec3, rotation: -0.02 },
    { role: 'ribbon', position: [0.34, 0.97, 0.72] as LaptopVec3, rotation: 0.02 },
  ],
  tape: [
    { role: 'battery', position: [0.3, 0.955, 0.05] as LaptopVec3, size: [0.44, 0.016, 0.18] as LaptopVec3, rotation: 0.08 },
    { role: 'display', position: [1.72, 0.945, -1.52] as LaptopVec3, size: [0.48, 0.016, 0.2] as LaptopVec3, rotation: -0.12 },
    { role: 'wifi', position: [2.98, 0.935, -1.08] as LaptopVec3, size: [0.36, 0.014, 0.16] as LaptopVec3, rotation: 0.03 },
    { role: 'speaker-left', position: [-2.34, 0.91, 1.58] as LaptopVec3, size: [0.34, 0.014, 0.14] as LaptopVec3, rotation: -0.12 },
    { role: 'keyboard', position: [0.12, 0.97, -0.36] as LaptopVec3, size: [0.44, 0.014, 0.18] as LaptopVec3, rotation: 0.02 },
    { role: 'touchpad', position: [0.48, 0.965, 0.92] as LaptopVec3, size: [0.42, 0.014, 0.18] as LaptopVec3, rotation: -0.08 },
  ],
} as const;

export const LAPTOP_CABLE_LAYOUT = {
  battery: [
    [0.12, 1.18, 0.5],
    [0.16, 1.14, 0.3],
    [0.28, 1.13, 0.06],
    [0.45, 1.16, -0.16],
  ] as readonly LaptopVec3[],
  display: [
    [1.23, 1.17, -0.38],
    [1.38, 1.12, -0.86],
    [1.62, 1.08, -1.42],
    [1.92, 1.06, -1.94],
    [2.12, 1.04, -2.4],
  ] as readonly LaptopVec3[],
  speakerHarness: [
    [2.25, 1.16, -0.72],
    [2.48, 1.08, -0.2],
    [2.66, 1.02, 0.42],
    [2.78, 1.0, 0.9],
  ] as readonly LaptopVec3[],
  speakerLeft: [
    [2.78, 1.0, 0.9],
    [1.4, 0.97, 1.72],
    [0, 0.95, 1.94],
    [-1.65, 0.94, 1.82],
    [-2.82, 1.02, 1.28],
  ] as readonly LaptopVec3[],
  speakerRight: [
    [2.78, 1.0, 0.9],
    [3.0, 1.0, 1.12],
  ] as readonly LaptopVec3[],
  wifiBlack: [
    [2.32, 1.25, -0.02],
    [2.78, 1.03, -0.58],
    [3.04, 0.99, -1.18],
    [3.12, 1.0, -2.3],
  ] as readonly LaptopVec3[],
  wifiWhite: [
    [2.68, 1.25, -0.02],
    [2.86, 1.03, -0.68],
    [2.88, 0.99, -1.48],
    [2.84, 1.0, -2.42],
  ] as readonly LaptopVec3[],
  keyboard: [
    [0.08, 1.17, -0.8],
    [0.1, 1.11, -0.42],
    [0.16, 1.12, 0.12],
  ] as readonly LaptopVec3[],
  touchpad: [
    [0.72, 1.13, 0.2],
    [0.62, 1.07, 0.68],
    [0.5, 1.05, 1.16],
    [0.38, 1.08, 1.62],
  ] as readonly LaptopVec3[],
} as const;
