export type Device = 'pc' | 'laptop';
export type Resource = 'cpu' | 'memory' | 'disk' | 'network';
export type AppId =
  | 'system'
  | 'browser'
  | 'video'
  | 'game'
  | 'editor'
  | 'copy'
  | 'download';
export const PROFILES = {
  laptop: { name: 'Classroom laptop', memory: 8192, network: 50 },
  pc: { name: 'Classroom PC', memory: 16384, network: 100 },
} as const;
export const APPS: Record<
  AppId,
  {
    name: string;
    icon: string;
    cpu: number;
    memory: number;
    disk: number;
    network: number;
    description: string;
  }
> = {
  system: {
    name: 'System',
    icon: '⚙',
    cpu: 4,
    memory: 1200,
    disk: 1,
    network: 0,
    description: 'Keeps the virtual computer running.',
  },
  browser: {
    name: 'Browser tabs',
    icon: '🌐',
    cpu: 5,
    memory: 1500,
    disk: 1,
    network: 1,
    description: 'Open a group of tabs. Watch RAM grow.',
  },
  video: {
    name: 'Video lesson',
    icon: '▶',
    cpu: 12,
    memory: 650,
    disk: 1,
    network: 8,
    description: 'Stream a lesson. Watch network activity.',
  },
  game: {
    name: '3D game',
    icon: '🎮',
    cpu: 48,
    memory: 2200,
    disk: 4,
    network: 2,
    description: 'Run a game. Watch CPU and RAM.',
  },
  editor: {
    name: 'Video export',
    icon: '🎬',
    cpu: 78,
    memory: 1800,
    disk: 18,
    network: 0,
    description: 'Export a video. Give the CPU a big job.',
  },
  copy: {
    name: 'Copy files',
    icon: '📁',
    cpu: 8,
    memory: 200,
    disk: 88,
    network: 0,
    description: 'Copy files to the SSD. Watch disk activity.',
  },
  download: {
    name: 'Download',
    icon: '↓',
    cpu: 6,
    memory: 250,
    disk: 14,
    network: 44,
    description: 'Download a file. Watch the network.',
  },
};
export type Process = { id: number; app: AppId };
export type Snapshot = Record<Resource, number> & {
  memoryMB: number;
  networkMbps: number;
  rows: Array<Process & Record<Resource, number>>;
};
export type Mission = {
  id: Resource;
  title: string;
  symptom: string;
  task: string;
  hint: string;
  apps: AppId[];
  target: number;
  explanation: string;
};
export const MISSIONS: Mission[] = [
  {
    id: 'cpu',
    title: 'Give the CPU a break',
    symptom: 'The video export is making the laptop busy.',
    task: 'Keep the lesson open. End the heavy job and get CPU below 35%.',
    hint: 'Sort by CPU. Which optional process is using the most?',
    apps: ['video', 'editor'],
    target: 35,
    explanation:
      'The CPU does the work. Ending the export leaves more time for your lesson.',
  },
  {
    id: 'memory',
    title: 'Make room in RAM',
    symptom: 'Too many browser tabs are open.',
    task: 'Keep the lesson open. Close tab groups until RAM is below 65%.',
    hint: 'Each browser row is one group of tabs. Close the ones you do not need.',
    apps: ['video', 'browser', 'browser', 'browser', 'browser', 'browser'],
    target: 65,
    explanation:
      'RAM holds work for open apps. Closing tabs frees RAM. Your saved files stay on the SSD.',
  },
  {
    id: 'disk',
    title: 'Find the busy SSD',
    symptom: 'A large file copy is keeping the SSD busy.',
    task: 'Keep the lesson open. Stop the file copy and get disk activity below 25%.',
    hint: 'Sort by disk. High disk activity means the drive is busy, not full.',
    apps: ['video', 'copy'],
    target: 25,
    explanation:
      'Disk activity measures reading and writing. It is different from storage space used.',
  },
  {
    id: 'network',
    title: 'Help the video lesson',
    symptom: 'A download is sharing the connection with your lesson.',
    task: 'Keep the lesson open. Stop the download and get network use below 30%.',
    hint: 'Sort by network. Keep the video lesson and end the download.',
    apps: ['video', 'download'],
    target: 30,
    explanation:
      'The lesson and download share the connection. Stopping the download leaves room for the lesson.',
  },
];
export function startProcesses(apps: AppId[] = []): Process[] {
  return ['system' as const, ...apps.filter((app) => app !== 'system')].map(
    (app, id) => ({ id: id + 1, app }),
  );
}
export function endProcess(processes: Process[], id: number): Process[] {
  return processes.filter(
    (process) => process.id !== id || process.app === 'system',
  );
}
export function sample(
  processes: Process[],
  device: Device,
  tick: number,
  powered: boolean,
): Snapshot {
  if (!powered)
    return {
      cpu: 0,
      memory: 0,
      disk: 0,
      network: 0,
      memoryMB: 0,
      networkMbps: 0,
      rows: [],
    };
  const profile = PROFILES[device];
  const rows = processes.map((process) => {
    const app = APPS[process.app];
    const wave = 1 + Math.sin(tick * 0.7 + process.id) * 0.045;
    return {
      ...process,
      cpu: app.cpu * wave,
      memory: app.memory,
      disk: app.disk * wave,
      network: app.network * wave,
    };
  });
  const sum = (key: Resource) =>
    rows.reduce((total, row) => total + row[key], 0);
  const rawCpu = sum('cpu'),
    rawDisk = sum('disk'),
    rawNetwork = sum('network');
  const memoryMB = sum('memory');
  // Saturated resources share their finite capacity; table and graph totals agree.
  rows.forEach((row) => {
    row.cpu *= Math.min(1, 100 / (rawCpu || 1));
    row.disk *= Math.min(1, 100 / (rawDisk || 1));
    row.network *= Math.min(1, profile.network / (rawNetwork || 1));
  });
  return {
    cpu: sum('cpu'),
    disk: sum('disk'),
    network: (sum('network') / profile.network) * 100,
    memory: Math.min(100, (memoryMB / profile.memory) * 100),
    memoryMB,
    networkMbps: sum('network'),
    rows,
  };
}
export function missionSolved(
  mission: Mission,
  processes: Process[],
  snapshot: Snapshot,
  powered: boolean,
) {
  return (
    powered &&
    processes.some((p) => p.app === 'video') &&
    snapshot[mission.id] < mission.target
  );
}
