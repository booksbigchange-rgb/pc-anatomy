import type { HardwareId } from '../lib/optiplex-7040.ts';
export const PC_CONNECTIONS = [
  { id: 'board-power', label: 'PSU → system board', target: 'Board power socket', needs: ['psu', 'motherboard'] },
  { id: 'cpu-power', label: 'PSU → CPU power', target: 'CPU power socket', needs: ['psu', 'motherboard', 'cpu'] },
  { id: 'fan', label: 'Cooler → fan header', target: 'CPU fan header', needs: ['cooler', 'motherboard'] },
  { id: 'switch', label: 'Front button → board', target: 'Power-button header', needs: ['motherboard'] },
  { id: 'display', label: 'Monitor → graphics card', target: 'Graphics display output', needs: ['gpu'] },
  { id: 'mains', label: 'Wall power → PSU', target: 'PSU AC inlet', needs: ['psu'] },
] as const;
export type PcConnection = (typeof PC_CONNECTIONS)[number]['id'];
export const PC_REQUIRED_PARTS: HardwareId[] = ['motherboard', 'cpu', 'cooler', 'ram', 'ssd', 'gpu', 'psu'];
export function canConnect(id: PcConnection, target: string, installed: HardwareId[], connected: PcConnection[]) {
  const cable = PC_CONNECTIONS.find(connection => connection.id === id)!;
  if (target !== cable.target) return 'Wrong socket. Match the cable to its named socket.';
  if (!cable.needs.every(part => installed.includes(part))) return 'Install the parts for this cable first.';
  if (id !== 'mains' && connected.includes('mains')) return 'Unplug wall power before changing an internal or display connection.';
  return null;
}
export function checkPcPower(installed: HardwareId[], connected: PcConnection[], coverClosed: boolean, cageClosed: boolean) {
  const problems: string[] = [];
  for (const part of PC_REQUIRED_PARTS) if (!installed.includes(part)) problems.push(`Install ${part === 'cooler' ? 'CPU cooler' : part.toUpperCase()}.`);
  for (const connection of PC_CONNECTIONS) if (!connected.includes(connection.id)) problems.push(`Connect ${connection.label}.`);
  if (!cageClosed) problems.push('Close the drive cage.');
  if (!coverClosed) problems.push('Fit the side cover.');
  return problems;
}

export type CoolingPreparation = { pasteApplied: boolean; screws: number[] };
export const COOLER_ORDER = [1, 3, 2, 4] as const;
export function checkCooling(cooling: CoolingPreparation) {
  const problems: string[] = [];
  if (!cooling.pasteApplied) problems.push('Apply thermal paste before seating the cooler.');
  if (!COOLER_ORDER.every((screw, index) => cooling.screws[index] === screw) || cooling.screws.length !== 4) problems.push('Fasten the cooler in the marked diagonal order.');
  return problems;
}

type Point = readonly [number, number, number];
/**
 * Where each cable runs in the build scene (teaching routes, not a wiring guide). Internal cables
 * plug in at their last point; the monitor and wall-power cables plug into the PC at their first.
 */
export const CABLE_ROUTES: Record<PcConnection, readonly Point[]> = {
  'board-power': [[1.33, 1.6, 2.05], [3.6, 1.05, 1.8], [3.4, 1, -0.9]],
  'cpu-power': [[1.33, 1.6, 2.05], [0.5, 1.05, 1], [0.55, 1, -1.9]],
  fan: [[1.48, 1.8, -1.68], [1.9, 1.1, -1.9], [2.25, 1, -2.05]],
  switch: [[4.3, 0.95, 1.5], [3.6, 0.98, 0.9], [2.9, 0.98, 0.7]],
  display: [[0.3, 1.65, 0.1], [-0.4, 1.3, 0.1], [-0.9, 0.65, -0.7]],
  mains: [[0.4, 1.35, 2.1], [-0.5, 1, 2.1], [-1.3, 0.7, 2.8]],
};
const OUTSIDE: readonly PcConnection[] = ['display', 'mains'];

/** The socket a cable plugs into, its fixed end, and where its loose plug waits. */
export function cableEnds(id: PcConnection): { socket: Point; anchor: Point; rest: Point } {
  const route = CABLE_ROUTES[id];
  if (OUTSIDE.includes(id)) return { socket: route[0], anchor: route[2], rest: route[1] };
  // Loose internal plugs hang just above the board, halfway from their fixed end to the route's middle.
  const [a, m] = [route[0], route[1]];
  return { socket: route[2], anchor: route[0], rest: [(a[0] + m[0]) / 2, Math.max(a[1], m[1]) + 0.25, (a[2] + m[2]) / 2] };
}

/** The socket nearest a dropped plug (measured across the table, ignoring height), if close enough. */
export function nearestSocket(x: number, z: number, reach = 0.45): PcConnection | null {
  let best: PcConnection | null = null, bestDistance = reach;
  for (const connection of PC_CONNECTIONS) {
    const [sx, , sz] = cableEnds(connection.id).socket;
    const distance = Math.hypot(sx - x, sz - z);
    if (distance <= bestDistance) { best = connection.id; bestDistance = distance; }
  }
  return best;
}

/** A plug dropped at (x, z): the same rules as choosing a socket from the list. */
export function dropCable(id: PcConnection, x: number, z: number, installed: HardwareId[], connected: PcConnection[]) {
  const socket = nearestSocket(x, z);
  if (!socket) return 'Drop the plug onto one of the glowing sockets.';
  return canConnect(id, PC_CONNECTIONS.find(connection => connection.id === socket)!.target, installed, connected);
}
