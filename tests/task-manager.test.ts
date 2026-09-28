import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MISSIONS,
  PROFILES,
  endProcess,
  missionSolved,
  sample,
  startProcesses,
  type Resource,
} from '../app/task-manager-model.ts';

await test('each mission starts unsolved and can be solved while keeping the lesson running', () => {
  for (const mission of MISSIONS) {
    const busy = startProcesses(mission.apps);
    const fixed = busy.filter((p) => p.app === 'system' || p.app === 'video');
    for (let tick = 0; tick < 100; tick++) {
      assert.equal(
        missionSolved(mission, busy, sample(busy, 'laptop', tick, true), true),
        false,
        mission.id,
      );
      assert.equal(
        missionSolved(
          mission,
          fixed,
          sample(fixed, 'laptop', tick, true),
          true,
        ),
        true,
        mission.id,
      );
      const noLesson = fixed.filter((p) => p.app !== 'video');
      assert.equal(
        missionSolved(
          mission,
          noLesson,
          sample(noLesson, 'laptop', tick, true),
          true,
        ),
        false,
      );
      assert.equal(
        missionSolved(
          mission,
          fixed,
          sample(fixed, 'laptop', tick, false),
          false,
        ),
        false,
      );
    }
  }
});

await test('ending an app releases its resources and never ends the protected system process', () => {
  const processes = startProcesses(['editor', 'video']);
  assert.deepEqual(endProcess(processes, 1), processes);
  const after = endProcess(processes, 2);
  const beforeSample = sample(processes, 'laptop', 0, true);
  const afterSample = sample(after, 'laptop', 0, true);
  for (const key of ['cpu', 'memory', 'disk'] as Resource[])
    assert.ok(afterSample[key] < beforeSample[key]);
  assert.equal(afterSample.network, beforeSample.network);
  assert.deepEqual(endProcess(processes, 999), processes);
});

await test('saturated readings stay bounded and match process totals', () => {
  const busy = startProcesses([
    'editor',
    'game',
    'copy',
    'download',
    'video',
    'browser',
    'browser',
    'browser',
    'browser',
  ]);
  for (const device of ['pc', 'laptop'] as const) {
    const reading = sample(busy, device, 12, true);
    for (const key of ['cpu', 'memory', 'disk', 'network'] as Resource[])
      assert.ok(reading[key] >= 0 && reading[key] <= 100.000001);
    for (const key of ['cpu', 'disk'] as const)
      assert.ok(
        Math.abs(
          reading.rows.reduce((total, row) => total + row[key], 0) -
            reading[key],
        ) < 0.000001,
      );
    assert.ok(
      Math.abs(
        (reading.networkMbps / PROFILES[device].network) * 100 -
          reading.network,
      ) < 0.000001,
    );
    assert.equal(
      reading.memoryMB,
      reading.rows.reduce((total, row) => total + row.memory, 0),
    );
  }
  const off = sample(busy, 'pc', 12, false);
  assert.equal(off.rows.length, 0);
  assert.equal(off.cpu + off.memory + off.disk + off.network, 0);
});

await test('more RAM reduces pressure for the same workload without altering saved work', () => {
  const processes = startProcesses(['browser', 'browser', 'video']);
  const laptop = sample(processes, 'laptop', 0, true);
  const pc = sample(processes, 'pc', 0, true);
  assert.equal(laptop.memoryMB, pc.memoryMB);
  assert.equal(laptop.memory, pc.memory * 2);
  assert.equal(laptop.cpu, pc.cpu);
});
