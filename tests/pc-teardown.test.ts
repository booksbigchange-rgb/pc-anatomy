import test from 'node:test';
import assert from 'node:assert/strict';
import { MOUNTS, type HardwareId } from '../lib/optiplex-7040.ts';
import { INSTALL_ORDER } from '../app/build-session.ts';
import {
  LIFT_HEIGHT, TEARDOWN, TEARDOWN_PHASES, coverOffset, partMove, partPose, stepProgress, stillFastened, teardownStage,
} from '../app/pc-teardown.ts';

void test('teardown covers 0–100 with no gaps or overlaps and removes every part once', () => {
  assert.equal(TEARDOWN[0].from, 0);
  assert.equal(TEARDOWN.at(-1)!.to, 100);
  for (let i = 1; i < TEARDOWN.length; i++) assert.equal(TEARDOWN[i].from, TEARDOWN[i - 1].to);
  const parts = TEARDOWN.map(step => step.id).filter(id => id !== 'cover' && id !== 'cage');
  assert.deepEqual([...parts].sort(), [...INSTALL_ORDER].sort());
  assert.equal(TEARDOWN_PHASES[0][1], 0);
  assert.equal(TEARDOWN_PHASES.length, TEARDOWN.length + 1);
});

void test('service order: cover first, cooler before CPU, everything above the board before the board', () => {
  const at = (id: string) => TEARDOWN.findIndex(step => step.id === id);
  assert.ok(at('cover') < at('cage'));
  assert.ok(at('cooler') < at('cpu'));
  for (const id of ['gpu', 'ram', 'ssd', 'cooler', 'cpu', 'psu']) assert.ok(at(id) < at('motherboard'), id);
});

void test('retainers come undone before the part moves', () => {
  const card = TEARDOWN.find(step => step.id === 'gpu')!;
  assert.equal(stillFastened(card.from, 'gpu'), true);
  const justStarted = card.from + 0.1;
  assert.equal(stillFastened(justStarted, 'gpu'), false);
  assert.equal(partMove(justStarted, 'gpu'), 0, 'Part waits while the bracket opens');
  assert.equal(partMove(card.to, 'gpu'), 1);
});

void test('parts lift straight up first, then land on their bench spot', () => {
  const mount = MOUNTS.ram, bench: [number, number, number] = [-3.5, 1.14, 2.8];
  assert.deepEqual(partPose(mount, bench, 0), mount);
  const lifted = partPose(mount, bench, 0.4);
  assert.equal(lifted[0], mount[0]);
  assert.equal(lifted[2], mount[2]);
  assert.ok(Math.abs(lifted[1] - LIFT_HEIGHT) < 1e-9);
  const placed = partPose(mount, bench, 1);
  for (let i = 0; i < 3; i++) assert.ok(Math.abs(placed[i] - bench[i]) < 1e-9);
});

void test('at 0 nothing has moved; at 100 every part is out and the cover is off', () => {
  for (const id of INSTALL_ORDER as HardwareId[]) {
    assert.equal(partMove(0, id), 0);
    assert.equal(partMove(100, id), 1);
  }
  assert.equal(coverOffset(0).visible, true);
  assert.deepEqual(coverOffset(0).offset, [0, 0, 0]);
  assert.equal(coverOffset(100).visible, false);
  assert.equal(stepProgress(100, 'cage'), 1);
  assert.equal(teardownStage(0), 'Assembled');
  assert.equal(teardownStage(100), 'All parts laid out');
  assert.match(teardownStage(50), /^Cooler:/);
});

void test('laid-out parts rest on the table without touching each other or the case', async () => {
  const T = await import('three');
  const { BENCH } = await import('../app/pc-teardown.ts');
  const { createChassis, createHardware } = await import('../lib/optiplex-7040.ts');
  const tableTop = 0.515;
  const boxes = (INSTALL_ORDER as HardwareId[]).map(id => {
    const part = createHardware(id);
    part.position.set(...BENCH[id]);
    part.updateMatrixWorld(true);
    return { id, box: new T.Box3().setFromObject(part) };
  });
  const chassis = createChassis().group;
  chassis.updateMatrixWorld(true);
  const caseBox = new T.Box3().setFromObject(chassis);
  const apart = (a: InstanceType<typeof T.Box3>, b: InstanceType<typeof T.Box3>) =>
    a.max.x < b.min.x || b.max.x < a.min.x || a.max.z < b.min.z || b.max.z < a.min.z;
  for (const { id, box } of boxes) {
    assert.ok(Math.abs(box.min.y - tableTop) < 0.02, `${id} rests on the table (${box.min.y.toFixed(3)})`);
    assert.ok(box.min.x > -8.2 && box.max.z < 4.7 && box.min.z > -4.7, `${id} stays on the table`);
    assert.ok(apart(box, caseBox), `${id} is clear of the case`);
  }
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++)
      assert.ok(apart(boxes[i].box, boxes[j].box), `${boxes[i].id} and ${boxes[j].id} do not overlap`);
});
