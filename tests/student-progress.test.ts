import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readProgress, saveProgress } from '../app/student-progress.ts';
await test('Progress survives a read, preserves other chapters, and rejects malformed stored values', () => {
  const previous = globalThis.localStorage;
  let saved: string | null = null;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => saved, setItem: (_key: string, value: string) => { saved = value; } } });
  try {
    saveProgress({ taskManager: ['cpu', 'memory'] });
    saveProgress({ pcBuilt: true });
    assert.deepEqual(readProgress(), { taskManager: ['cpu', 'memory'], pcBuilt: true });
    saveProgress({ taskManager: [] });
    assert.equal(readProgress().pcBuilt, true);
    saved = '{bad json';
    assert.deepEqual(readProgress(), { taskManager: [], pcBuilt: false });
    saved = '{"taskManager":["cpu","cpu","fake"],"pcBuilt":"true"}';
    assert.deepEqual(readProgress(), { taskManager: ['cpu'], pcBuilt: false });
  } finally { Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: previous }); }
});
