import test from 'node:test';
import assert from 'node:assert/strict';
import { TEARDOWN, type TeardownStepId } from '../app/pc-teardown.ts';
import {
  REASSEMBLY_LABEL, REASSEMBLY_NEEDS, REASSEMBLY_STEPS, reassemblyComplete, tryReassemble,
} from '../app/pc-reassembly.ts';

void test('every teardown step has a reassembly step, label and rule', () => {
  assert.equal(REASSEMBLY_STEPS.length, TEARDOWN.length);
  assert.equal(REASSEMBLY_STEPS[0], 'motherboard');
  assert.equal(REASSEMBLY_STEPS.at(-1), 'cover');
  for (const id of REASSEMBLY_STEPS) {
    assert.ok(REASSEMBLY_LABEL[id], id);
    assert.ok(REASSEMBLY_NEEDS[id], id);
  }
});

void test('the exact reverse of the teardown is always accepted', () => {
  const done: TeardownStepId[] = [];
  for (const id of REASSEMBLY_STEPS) {
    const result = tryReassemble(done, id);
    assert.ok(result.ok, `${id}: ${result.message}`);
    done.push(id);
  }
  assert.ok(reassemblyComplete(done));
});

void test('the rules match the removal order', () => {
  // Every part a step needs must have been removed after that step in the teardown.
  const removedAt = (id: TeardownStepId) => TEARDOWN.findIndex(step => step.id === id);
  for (const id of REASSEMBLY_STEPS)
    for (const need of REASSEMBLY_NEEDS[id]) assert.ok(removedAt(need) > removedAt(id), `${id} needs ${need}`);
});

void test('a different working order is also accepted', () => {
  const done: TeardownStepId[] = [];
  for (const id of ['motherboard', 'ram', 'gpu', 'cpu', 'ssd', 'cooler', 'psu', 'cage', 'cover'] as TeardownStepId[]) {
    assert.ok(tryReassemble(done, id).ok, id);
    done.push(id);
  }
});

void test('wrong choices explain what has to go in first and change nothing', () => {
  assert.match(tryReassemble([], 'cpu').message, /motherboard in first/);
  assert.match(tryReassemble(['motherboard'], 'cooler').message, /CPU in first/);
  assert.match(tryReassemble(['motherboard', 'cpu'], 'cage').message, /every part/);
  assert.match(tryReassemble(REASSEMBLY_STEPS.slice(0, 7), 'cover').message, /drive cage first/);
  assert.equal(tryReassemble(['motherboard'], 'motherboard').ok, false);
  assert.equal(reassemblyComplete(['motherboard']), false);
});
