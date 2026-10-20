import test from 'node:test';
import assert from 'node:assert/strict';
import type { HardwareId } from '../lib/optiplex-7040.ts';
import {
  INSTALL_ORDER, NEW_BUILD, PREREQUISITES, SNAP_FORGIVENESS, completedSteps, diagnosis, dropPart, installPart,
  installProblem, isOriented, nextPart, partStatus, postProblems, turnPart, TOTAL_STEPS, type BuildState,
} from '../app/build-session.ts';
import { COOLER_ORDER, PC_CONNECTIONS } from '../app/pc-power-challenge.ts';
import { RETAINERS, type Retainer } from '../app/hardware-practice.ts';

const SNAP = { motherboard: 0.4, cpu: 0.24, cooler: 0.32, ram: 0.24, ssd: 0.24, gpu: 0.3, psu: 0.32 } satisfies Record<HardwareId, number>;
const far = () => Object.fromEntries(INSTALL_ORDER.map(id => [id, 9])) as Record<HardwareId, number>;
const at = (id: HardwareId, distance = 0) => ({ ...far(), [id]: distance });

/** Prepare a part the way a careful student would, then drop it on its guide. */
function placeCorrectly(state: BuildState, id: HardwareId) {
  if (isOriented(id) && !state.aligned.includes(id)) state = turnPart(state, id);
  if (id === 'cooler') state = { ...state, pasteApplied: true };
  const result = dropPart(state, id, at(id), SNAP);
  assert.ok(result.ok, `${id}: ${result.message}`);
  return result.state;
}

function finishedBuild() {
  let state = NEW_BUILD;
  for (const id of INSTALL_ORDER) state = placeCorrectly(state, id);
  return {
    ...state,
    fastened: Object.keys(RETAINERS) as Retainer[],
    screws: [...COOLER_ORDER],
    connections: PC_CONNECTIONS.map(connection => connection.id),
    cageOpen: false,
    coverClosed: true,
  };
}

void test('every one of the seven parts can be dragged onto its guide and installs', () => {
  const state = INSTALL_ORDER.reduce(placeCorrectly, NEW_BUILD);
  assert.deepEqual(state.installed, INSTALL_ORDER);
  assert.equal(nextPart(state), null);
  assert.equal(state.mistakes, 0);
});

void test('the guide is forgiving, but a drop well away from it returns the part', () => {
  let state = NEW_BUILD;
  const nearEdge = dropPart(state, 'motherboard', at('motherboard', SNAP.motherboard * SNAP_FORGIVENESS * 0.95), SNAP);
  assert.ok(nearEdge.ok, 'A drop just inside the forgiving circle must install');
  const missed = dropPart(state, 'motherboard', at('motherboard', SNAP.motherboard * SNAP_FORGIVENESS * 1.2), SNAP);
  assert.equal(missed.ok, false);
  assert.match(missed.message, /missed its mounting guide.*back to the tray/);
  assert.deepEqual(missed.state.installed, []);
  assert.equal(missed.state.mistakes, 1);
  state = placeCorrectly(state, 'motherboard');
  const wrongGuide = dropPart(turnPart(state, 'ram'), 'ram', { ...far(), ssd: 0 }, SNAP);
  assert.equal(wrongGuide.ok, false);
  assert.match(wrongGuide.message, /That is the SSD guide\. The RAM goes in the memory slot/);
});

void test('wrong direction blocks installation; turning the part allows it', () => {
  let state = placeCorrectly(NEW_BUILD, 'motherboard');
  for (const id of ['cpu', 'ram', 'ssd', 'gpu'] as HardwareId[]) {
    const blocked = dropPart(state, id, at(id), SNAP);
    assert.equal(blocked.ok, false, `${id} must not install the wrong way round`);
    assert.match(blocked.message, /Wrong direction.*Turn part 180°/);
    assert.ok(!blocked.state.installed.includes(id));
    const turned = turnPart(state, id);
    assert.ok(turned.aligned.includes(id));
    assert.deepEqual(turnPart(turned, id).aligned.includes(id), false, 'Turning twice puts it back the wrong way');
    state = placeCorrectly(state, id);
  }
  assert.equal(turnPart(NEW_BUILD, 'psu'), NEW_BUILD, 'Unkeyed parts have no direction to turn');
});

void test('parts wait for what they sit on, and the cooler waits for thermal paste', () => {
  for (const id of INSTALL_ORDER) {
    const problem = installProblem(turnPart(NEW_BUILD, id), id);
    if (PREREQUISITES[id].length) assert.match(problem!, /^Install the .* first/);
  }
  let state = placeCorrectly(NEW_BUILD, 'motherboard');
  state = placeCorrectly(state, 'cpu');
  const noPaste = dropPart(state, 'cooler', at('cooler'), SNAP);
  assert.equal(noPaste.ok, false);
  assert.match(noPaste.message, /Apply thermal paste/);
  assert.ok(installPart({ ...state, pasteApplied: true }, 'cooler').ok);
  assert.equal(partStatus(NEW_BUILD, 'motherboard'), 'Next step');
  assert.equal(partStatus(NEW_BUILD, 'ram'), 'Needs motherboard first');
  assert.equal(partStatus(NEW_BUILD, 'psu'), 'Ready to install');
  assert.equal(partStatus(state, 'cpu'), 'Installed');
});

void test('parts cannot be installed with wall power connected or the cover on', () => {
  const plugged = { ...NEW_BUILD, connections: ['mains' as const] };
  assert.match(installProblem(plugged, 'motherboard')!, /Unplug wall power/);
  assert.match(installProblem({ ...NEW_BUILD, coverClosed: true }, 'motherboard')!, /side cover/);
  assert.match(installProblem(placeCorrectly(NEW_BUILD, 'motherboard'), 'motherboard')!, /already installed/);
});

void test('POST passes only when every requirement is met, and explains the first failure', () => {
  const done = finishedBuild();
  assert.deepEqual(postProblems(done), []);
  assert.match(diagnosis([]), /POST passed/);
  const cases: Array<[Partial<BuildState>, RegExp]> = [
    [{ installed: done.installed.filter(id => id !== 'ram') }, /part is missing/],
    [{ connections: done.connections.filter(id => id !== 'fan') }, /cable is not connected/],
    [{ coverClosed: false }, /case is still open/],
    [{ cageOpen: true }, /case is still open/],
    [{ pasteApplied: false }, /cooler is not ready/],
    [{ screws: [1, 2, 3, 4] }, /cooler is not ready/],
    [{ fastened: ['ram', 'ssd'] }, /part is loose/],
  ];
  for (const [change, explanation] of cases) {
    const problems = postProblems({ ...done, ...change });
    assert.ok(problems.length, JSON.stringify(change));
    assert.match(diagnosis(problems), explanation);
  }
});

void test('progress counts every step and restarting starts from nothing', () => {
  const done = { ...finishedBuild(), powerOn: true };
  assert.equal(completedSteps(done), TOTAL_STEPS);
  assert.equal(completedSteps(NEW_BUILD), 0);
  assert.deepEqual(NEW_BUILD.installed, []);
  assert.equal(NEW_BUILD.cageOpen, true);
});
