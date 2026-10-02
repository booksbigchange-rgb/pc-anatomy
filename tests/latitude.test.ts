import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  buildLatitude5410,
  LATITUDE_DIMENSIONS,
} from '../app/latitude-5410.ts';
import { applyLaptopTeardown } from '../app/laptop-internals.ts';
await test('Latitude removable modules reset exactly and expanded layout separates their footprints', () => {
  const model = buildLatitude5410();
  for (const id of ['ssd', 'ram', 'wifi'] as const) {
    const home = model.parts[id].position.clone();
    const rotation = model.parts[id].rotation.clone();
    const fixtures = model.parts.motherboard.children.map((object) => object.position.clone());
    applyLaptopTeardown(model.teardownParts, 18, id, 1);
    assert.ok(model.parts[id].position.y > home.y);
    model.parts.motherboard.children.forEach((object, index) => assert.ok(object.position.equals(fixtures[index])));
    applyLaptopTeardown(model.teardownParts, 18, null, 0);
    assert.ok(model.parts[id].position.equals(home));
    assert.ok(model.parts[id].rotation.equals(rotation));
  }
  applyLaptopTeardown(model.teardownParts, 100, null, 0);
  const ids = ['battery', 'ram', 'ssd', 'wifi'] as const;
  for (let first = 0; first < ids.length; first++) {
    for (let second = first + 1; second < ids.length; second++) {
      const firstBounds = new T.Box3().setFromObject(model.parts[ids[first]]);
      const secondBounds = new T.Box3().setFromObject(model.parts[ids[second]]);
      assert.ok(firstBounds.max.x < secondBounds.min.x || secondBounds.max.x < firstBounds.min.x || firstBounds.max.z < secondBounds.min.z || secondBounds.max.z < firstBounds.min.z);
    }
  }
});
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

await test('Latitude side walls expose their own sockets and occlude opposite-side ports', () => {
  const m = buildLatitude5410();
  m.root.updateMatrixWorld(true);
  for (const side of [-1, 1]) {
    const c = new T.PerspectiveCamera(40, 1.2, 0.1, 100);
    c.position.set(side * 13, 3.4, 0.15);
    c.lookAt(0, 1.15, 0.15);
    c.updateMatrixWorld();
    for (const port of m.ports) {
      const p = port.getWorldPosition(new T.Vector3()).project(c);
      const ray = new T.Raycaster();
      ray.setFromCamera(new T.Vector2(p.x, p.y), c);
      const hit = ray.intersectObject(m.outside, true)[0];
      if (Math.sign(port.position.x) === side)
        assert.equal(hit?.object.userData.laptopPort, port.userData.laptopPort);
      else
        assert.notEqual(
          hit?.object.userData.laptopPort,
          port.userData.laptopPort,
        );
    }
  }
});
