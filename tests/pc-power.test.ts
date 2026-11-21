import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PC_CONNECTIONS, PC_REQUIRED_PARTS, canConnect, checkPcPower, checkCooling } from '../app/pc-power-challenge.ts';
await test('PC power requires all hardware, all connections and closed service panels', () => {
  const cables = PC_CONNECTIONS.map(connection => connection.id);
  assert.deepEqual(checkPcPower(PC_REQUIRED_PARTS, cables, true, true), []);
  for (const part of PC_REQUIRED_PARTS) assert.ok(checkPcPower(PC_REQUIRED_PARTS.filter(id => id !== part), cables, true, true).length);
  for (const cable of cables) assert.ok(checkPcPower(PC_REQUIRED_PARTS, cables.filter(id => id !== cable), true, true).length);
  assert.ok(checkPcPower(PC_REQUIRED_PARTS, cables, false, true).includes('Fit the side cover.'));
  assert.ok(checkPcPower(PC_REQUIRED_PARTS, cables, true, false).includes('Close the drive cage.'));
});
await test('Cable matching rejects wrong sockets, missing parts and servicing under wall power', () => {
  for (const cable of PC_CONNECTIONS) {
    assert.equal(canConnect(cable.id, cable.target, PC_REQUIRED_PARTS, []), null);
    assert.ok(canConnect(cable.id, 'wrong socket', PC_REQUIRED_PARTS, []));
    assert.ok(canConnect(cable.id, cable.target, [], []));
    if (cable.id !== 'mains') assert.ok(canConnect(cable.id, cable.target, PC_REQUIRED_PARTS, ['mains']));
  }
});

await test('Cooling check requires paste and all corners in diagonal order', () => {
  assert.deepEqual(checkCooling({ pasteApplied: true, screws: [1, 3, 2, 4] }), []);
  assert.equal(checkCooling({ pasteApplied: false, screws: [] }).length, 2);
  assert.equal(checkCooling({ pasteApplied: true, screws: [1, 2, 3, 4] }).length, 1);
  for (let count = 0; count < 4; count++) assert.equal(checkCooling({ pasteApplied: true, screws: [1, 3, 2, 4].slice(0, count) }).length, 1);
});
