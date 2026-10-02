import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  buildLatitude5410,
  LATITUDE_DIMENSIONS,
} from '../app/latitude-5410.ts';
import { applyLaptopTeardown } from '../app/laptop-internals.ts';
await test('Latitude exterior closes over the deck and preserves Dell dimensions', () => {
  const m = buildLatitude5410();
  const bounds = new T.Box3().setFromObject(m.closed);
  assert.ok(
    Math.abs(bounds.getSize(new T.Vector3()).x - LATITUDE_DIMENSIONS.width) <
      0.12,
  );
  assert.ok(
    bounds.getSize(new T.Vector3()).z < 5.7,
    'Closed lid must fold forwards over chassis',
  );
  assert.ok(
    bounds.getSize(new T.Vector3()).y < 0.8,
    'Closed lid must lie flat',
  );
  assert.equal(
    m.ports.find((p) => p.userData.laptopPort === 'power-left')!.position.x < 0,
    true,
  );
  assert.equal(
    m.ports.find((p) => p.userData.laptopPort === 'hdmi-left')!.position.x > 0,
    true,
  );
});
await test('Latitude CPU remains soldered to the moving system board', () => {
  const m = buildLatitude5410();
  assert.equal(m.parts.cpu.parent, m.parts.motherboard);
  const before = m.parts.cpu.position.clone();
  applyLaptopTeardown(m.teardownParts, 100, null, 0);
  assert.ok(m.parts.cpu.position.equals(before));
  assert.ok(m.parts.motherboard.position.y > 1.5);
  assert.ok(!m.teardownParts.some((p) => p.object === m.parts.cpu));
  applyLaptopTeardown(m.teardownParts, 0, null, 0);
  assert.equal(m.parts.motherboard.position.y, 0.95);
});
await test('Local upgrades leave the board, sockets, and antenna routing in place', () => {
  const m = buildLatitude5410();
  const board = m.parts.motherboard.position.clone();
  const ram = m.parts.ram.position.clone();
  applyLaptopTeardown(m.teardownParts, 18, 'ssd', 1);
  assert.ok(m.parts.ssd.position.y > 1.08);
  assert.ok(m.parts.ram.position.equals(ram));
  assert.ok(m.parts.motherboard.position.equals(board));
  applyLaptopTeardown(m.teardownParts, 18, null, 0);
  assert.equal(m.parts.ssd.position.y, 1.08);
  assert.deepEqual(
    m.disconnectCables.map((c) => [c.id, c.at]),
    [
      ['battery', 24],
      ['speaker', 50],
      ['display', 90],
    ],
  );
});
