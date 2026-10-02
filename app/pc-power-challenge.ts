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
