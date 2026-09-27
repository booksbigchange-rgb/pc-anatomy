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
    home: [0.56, 1.18, -1.49] as LaptopVec3,
    teardown: {
      start: 72,
      end: 88,
      offset: [3.18, 0.18, -0.02] as LaptopVec3,
      rotation: [0, 0.04, 0] as LaptopVec3,
    },
  },
  ram: {
    home: [1.28, 1.16, -0.78] as LaptopVec3,
    teardown: {
      start: 42,
      end: 60,
      offset: [0.62, 0.18, 3.08] as LaptopVec3,
      rotation: [-0.035, 0, 0] as LaptopVec3,
    },
  },
  ssd: {
    home: [-0.68, 1.16, 0.02] as LaptopVec3,
    rotationY: -0.03,
    teardown: {
      start: 30,
      end: 46,
      offset: [-2.74, 0.16, 2.2] as LaptopVec3,
      rotation: [0, -0.03, 0.025] as LaptopVec3,
    },
  },
  wifi: {
    home: [2.5, 1.15, 0.18] as LaptopVec3,
    teardown: {
      start: 34,
      end: 50,
      offset: [1.02, 0.16, 2.0] as LaptopVec3,
      rotation: [0, 0.04, -0.025] as LaptopVec3,
    },
  },
  cooling: {
    home: [-1.52, 1.17, -1.35] as LaptopVec3,
    teardown: {
      start: 58,
      end: 78,
      offset: [-3.15, 0.32, -0.18] as LaptopVec3,
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
      start: 18,
      end: 34,
      offset: [0, 0.12, 2.34] as LaptopVec3,
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
  visibleUntil: 34,
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
