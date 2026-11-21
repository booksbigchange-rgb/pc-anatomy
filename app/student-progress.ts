import type { Resource } from './task-manager-model.ts';
const KEY = 'bigchange-hardware-progress-v1';
export type StudentProgress = { taskManager: Resource[]; pcBuilt: boolean };
export function readProgress(): StudentProgress {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { taskManager: Array.isArray(data.taskManager) ? [...new Set<Resource>(data.taskManager.filter((id: unknown) => ['cpu', 'memory', 'disk', 'network'].includes(String(id))))] : [], pcBuilt: data.pcBuilt === true };
  } catch { return { taskManager: [], pcBuilt: false }; }
}
export function saveProgress(update: Partial<StudentProgress>) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...readProgress(), ...update })); } catch { }
}
