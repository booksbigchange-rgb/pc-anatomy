import test from 'node:test';
import assert from 'node:assert/strict';
import { diagnose, EMPTY_DIAGNOSIS, PC_FAULTS, LAPTOP_FAULT_FOLLOWUPS, ORIENTED_PARTS, RETAINERS, placementProblem, fasteningProblems } from '../app/hardware-practice.ts';
import { LAPTOP_TROUBLESHOOTING_SCENARIOS } from '../app/laptop-troubleshooting.ts';

void test('Direction gates only keyed removable modules; retaining steps cannot be omitted', () => {
  for (const id of ORIENTED_PARTS) { assert.ok(placementProblem(id,false)); assert.equal(placementProblem(id,true),null); }
  assert.equal(placementProblem('motherboard',false),null);
  assert.equal(fasteningProblems([]).length,3);
  assert.deepEqual(fasteningProblems(Object.keys(RETAINERS) as (keyof typeof RETAINERS)[]),[]);
});
void test('Every desktop and laptop diagnosis needs evidence, a matching fix and a retest', () => {
  const cases=[...PC_FAULTS,...LAPTOP_TROUBLESHOOTING_SCENARIOS.map(item=>({...item,...LAPTOP_FAULT_FOLLOWUPS[item.id]}))];
  for (const scenario of cases) {
    assert.equal(diagnose(EMPTY_DIAGNOSIS,'verify',true,scenario).verified,false);
    assert.equal(diagnose(EMPTY_DIAGNOSIS,'fix',true,scenario).fixed,false);
    let state=diagnose(EMPTY_DIAGNOSIS,'test',false,scenario);
    assert.equal(state.inspected,false);
    state=diagnose(state,'test',true,scenario); assert.equal(state.feedback,scenario.evidence);
    assert.equal(diagnose(state,'fix',false,scenario).fixed,false);
    assert.equal(diagnose(state,'verify',true,scenario).verified,false);
    state=diagnose(state,'fix',true,scenario); assert.equal(state.verified,false);
    state=diagnose(state,'verify',true,scenario); assert.equal(state.verified,true); assert.equal(state.feedback,scenario.retest);
    state=diagnose(state,'test',true,scenario); assert.equal(state.fixed,false); assert.equal(state.verified,false);
  }
});
