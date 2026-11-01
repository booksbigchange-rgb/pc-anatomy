import type { Resource } from './task-manager-model.ts';
const KEY = 'bigchange-hardware-progress-v1';
/** Put-it-back-together lesson: finished attempts and wrong choices (latest and fewest). */
export type ReassemblyResult = { attempts: number; latestMistakes: number; bestMistakes: number };
export type StudentProgress = { taskManager: Resource[]; pcBuilt: boolean; reassembly: ReassemblyResult | null };
const count = (value: unknown) => (Number.isInteger(value) && (value as number) >= 0 ? (value as number) : null);
function readReassembly(value: unknown): ReassemblyResult | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  const attempts = count(data.attempts), latest = count(data.latestMistakes), best = count(data.bestMistakes);
  if (!attempts || latest === null) return null;
  return { attempts, latestMistakes: latest, bestMistakes: best === null ? latest : Math.min(best, latest) };
}
export function readProgress(): StudentProgress {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || '{}');
    return {
      taskManager: Array.isArray(data.taskManager) ? [...new Set<Resource>(data.taskManager.filter((id: unknown) => ['cpu', 'memory', 'disk', 'network'].includes(String(id))))] : [],
      pcBuilt: data.pcBuilt === true,
      reassembly: readReassembly(data.reassembly),
    };
  } catch { return { taskManager: [], pcBuilt: false, reassembly: null }; }
}
export function saveProgress(update: Partial<StudentProgress>) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...readProgress(), ...update })); } catch { }
}
/** The record after one more finished attempt. */
export function nextReassembly(previous: ReassemblyResult | null, mistakes: number): ReassemblyResult {
  return previous
    ? { attempts: previous.attempts + 1, latestMistakes: mistakes, bestMistakes: Math.min(previous.bestMistakes, mistakes) }
    : { attempts: 1, latestMistakes: mistakes, bestMistakes: mistakes };
}
