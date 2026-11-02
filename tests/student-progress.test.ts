import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextAttempt, readProgress, saveProgress } from '../app/student-progress.ts';
await test('Progress survives a read, preserves other chapters, and rejects malformed stored values', () => {
  const previous = globalThis.localStorage;
  let saved: string | null = null;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => saved, setItem: (_key: string, value: string) => { saved = value; } } });
  try {
    saveProgress({ taskManager: ['cpu', 'memory'] });
    saveProgress({ pcBuilt: true });
    assert.deepEqual(readProgress(), { taskManager: ['cpu', 'memory'], pcBuilt: true, reassembly: null, osInstall: null });
    saveProgress({ taskManager: [] });
    assert.equal(readProgress().pcBuilt, true);
    saved = '{bad json';
    assert.deepEqual(readProgress(), { taskManager: [], pcBuilt: false, reassembly: null, osInstall: null });
    saved = '{"taskManager":["cpu","cpu","fake"],"pcBuilt":"true"}';
    assert.deepEqual(readProgress(), { taskManager: ['cpu'], pcBuilt: false, reassembly: null, osInstall: null });
  } finally { Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: previous }); }
});

await test('The put-it-back-together result keeps attempts, the latest and the fewest wrong choices', () => {
  const previous = globalThis.localStorage;
  let saved: string | null = null;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => saved, setItem: (_key: string, value: string) => { saved = value; } } });
  try {
    const first = nextAttempt(null, 3);
    assert.deepEqual(first, { attempts: 1, latestMistakes: 3, bestMistakes: 3 });
    const second = nextAttempt(first, 0), third = nextAttempt(second, 2);
    assert.deepEqual(third, { attempts: 3, latestMistakes: 2, bestMistakes: 0 });
    saveProgress({ pcBuilt: true });
    saveProgress({ reassembly: third });
    assert.deepEqual(readProgress(), { taskManager: [], pcBuilt: true, reassembly: third, osInstall: null }, 'Saving it keeps the other results');
    for (const bad of ['{"reassembly":{"attempts":0,"latestMistakes":1,"bestMistakes":1}}', '{"reassembly":{"attempts":2,"latestMistakes":-1,"bestMistakes":0}}', '{"reassembly":"yes"}'])
      { saved = bad; assert.equal(readProgress().reassembly, null, bad); }
    saved = '{"reassembly":{"attempts":2,"latestMistakes":1,"bestMistakes":4}}';
    assert.deepEqual(readProgress().reassembly, { attempts: 2, latestMistakes: 1, bestMistakes: 1 }, 'A best worse than the latest is corrected');
  } finally { Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: previous }); }
});
