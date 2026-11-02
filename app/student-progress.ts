import type { Resource } from './task-manager-model.ts';
const KEY = 'bigchange-hardware-progress-v1';
/** A practice activity's record: finished attempts and mistakes (latest and fewest). */
export type AttemptResult = { attempts: number; latestMistakes: number; bestMistakes: number };
/** reassembly: put the PC back together. osInstall: install Lab OS. No names or passwords are stored. */
export type StudentProgress = { taskManager: Resource[]; pcBuilt: boolean; reassembly: AttemptResult | null; osInstall: AttemptResult | null };
const count = (value: unknown) => (Number.isInteger(value) && (value as number) >= 0 ? (value as number) : null);
function readAttempt(value: unknown): AttemptResult | null {
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
      reassembly: readAttempt(data.reassembly),
      osInstall: readAttempt(data.osInstall),
    };
  } catch { return { taskManager: [], pcBuilt: false, reassembly: null, osInstall: null }; }
}
export function saveProgress(update: Partial<StudentProgress>) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...readProgress(), ...update })); } catch { }
}
/** The record after one more finished attempt. */
export function nextAttempt(previous: AttemptResult | null, mistakes: number): AttemptResult {
  return previous
    ? { attempts: previous.attempts + 1, latestMistakes: mistakes, bestMistakes: Math.min(previous.bestMistakes, mistakes) }
    : { attempts: 1, latestMistakes: mistakes, bestMistakes: mistakes };
}
