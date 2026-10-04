import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  buildLatitude5410,
  LATITUDE_DIMENSIONS,
  LATITUDE_RAM,
} from '../app/latitude-5410.ts';
import { applyLaptopTeardown } from '../app/laptop-internals.ts';
await test('Latitude blower intake is open and its casing fits inside the chassis', () => {
  const model = buildLatitude5410();
  model.root.updateMatrixWorld(true);
  const casing = model.parts.cooling.getObjectByName('Blower intake casing')!;
  assert.ok(casing);
  const ray = new T.Raycaster(new T.Vector3(2.78, 5, -0.55), new T.Vector3(0, -1, 0));
  assert.equal(ray.intersectObject(casing).length, 0, 'air intake is a real opening');
  ray.ray.origin.x = 2.78 - 0.78;
  assert.ok(ray.intersectObject(casing).length > 0, 'casing remains solid beside intake');
  const bounds = new T.Box3().setFromObject(model.parts.cooling);
  assert.ok(bounds.max.x < LATITUDE_DIMENSIONS.width / 2);
  assert.ok(bounds.min.z > -LATITUDE_DIMENSIONS.depth / 2);
  applyLaptopTeardown(model.teardownParts, 78);
  model.root.updateMatrixWorld(true);
  const before = casing.getWorldPosition(new T.Vector3());
  applyLaptopTeardown(model.teardownParts, 18);
  model.root.updateMatrixWorld(true);
  assert.ok(casing.getWorldPosition(new T.Vector3()).distanceTo(before) > 1, 'casing travels with the cooling assembly');
});
await test('Latitude SODIMM key fits a real PCB cutout and sockets stay fixed during extraction', () => {
  const model = buildLatitude5410();
  model.root.updateMatrixWorld(true);
  for (const index of [1, 2]) {
    const pcb = model.parts.ram.getObjectByName(`RAM PCB ${index}`)!;
    const key = model.parts.motherboard.getObjectByName(`RAM socket key ${index}`)!;
    const bounds = new T.Box3().setFromObject(pcb);
    const size = bounds.getSize(new T.Vector3());
    assert.ok(Math.abs(size.x - 69.6 / 40) < 0.00001);
    assert.ok(Math.abs(size.z - 30 / 40) < 0.00001);
    const center = bounds.getCenter(new T.Vector3());
    const ray = new T.Raycaster(new T.Vector3(center.x + LATITUDE_RAM.notchX, 5, bounds.max.z - 0.025), new T.Vector3(0, -1, 0));
    assert.equal(ray.intersectObject(pcb).length, 0, 'PCB has open keyed notch');
    ray.ray.origin.x = center.x - 0.4;
    assert.ok(ray.intersectObject(pcb).length > 0, 'PCB remains solid beside notch');
    const position = key.getWorldPosition(new T.Vector3());
    assert.ok(Math.abs(position.x - center.x - LATITUDE_RAM.notchX) < 0.00001);
    assert.ok(Math.abs(position.z - bounds.max.z + LATITUDE_RAM.notchDepth / 2) < 0.00001);
    assert.equal(key.parent, model.parts.motherboard);
    applyLaptopTeardown(model.teardownParts, 18, 'ram', 1);
    model.root.updateMatrixWorld(true);
    assert.ok(key.getWorldPosition(new T.Vector3()).equals(position));
    applyLaptopTeardown(model.teardownParts, 18);
    model.root.updateMatrixWorld(true);
  }
});
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

await test('Latitude module footprints and cooler contact fit the teaching scale', () => {
  const m = buildLatitude5410();
  m.root.updateMatrixWorld(true);
  const ssd = m.parts.ssd.getObjectByName('SSD PCB')!;
  const wifi = m.parts.wifi.getObjectByName('Wi-Fi PCB')!;
  for (const [object, width, length] of [[ssd, 0.55, 2], [wifi, 0.55, 0.75]] as const) {
    const size = new T.Box3().setFromObject(object).getSize(new T.Vector3());
    assert.ok(Math.abs(size.x - width) < 0.001);
    // Connector finger tips complete the PCB footprint's final 0.1 units.
    assert.ok(Math.abs(size.z - (length - 0.1)) < 0.001);
  }
  for (const [module, name] of [[ssd, 'SSD standoff'], [wifi, 'Wi-Fi standoff']] as const) {
    const support = m.parts.motherboard.getObjectByName(name)!;
    const supportBox = new T.Box3().setFromObject(support);
    const moduleBox = new T.Box3().setFromObject(module);
    assert.ok(Math.abs(supportBox.max.y - moduleBox.min.y) < 0.001, 'fixed support meets the PCB underside');
    const home = support.getWorldPosition(new T.Vector3());
    applyLaptopTeardown(m.teardownParts, 18, module === ssd ? 'ssd' : 'wifi', 1);
    assert.ok(support.getWorldPosition(new T.Vector3()).equals(home));
    applyLaptopTeardown(m.teardownParts, 18, null, 0);
    m.root.updateMatrixWorld(true);
  }
  const cpu = new T.Box3().setFromObject(m.parts.cpu);
  const plate = new T.Box3().setFromObject(m.parts.cooling.getObjectByName('CPU cooler contact')!);
  assert.ok(Math.abs(cpu.max.y - plate.min.y) < 0.005, 'cold plate contacts the CPU die');
  assert.ok(plate.min.x < cpu.getCenter(new T.Vector3()).x && plate.max.x > cpu.getCenter(new T.Vector3()).x);
  assert.ok(plate.min.z < cpu.getCenter(new T.Vector3()).z && plate.max.z > cpu.getCenter(new T.Vector3()).z);
});

await test('Detached part rotation keeps its center fixed, does not accumulate and resets to the global pose', () => {
  const m = buildLatitude5410();
  for (const id of ['battery', 'motherboard', 'ram', 'ssd', 'cooling', 'wifi', 'speakers'] as const) {
    applyLaptopTeardown(m.teardownParts, 100);
    m.root.updateMatrixWorld(true);
    const object = m.parts[id];
    const position = object.position.clone(), quaternion = object.quaternion.clone();
    const center = new T.Box3().setFromObject(object).getCenter(new T.Vector3());
    const pivot = object.worldToLocal(center.clone());
    const inspection = { id: id === 'cooling' ? 'fan' : id, angles: [Math.PI / 2, Math.PI / 4, 0] as const };
    applyLaptopTeardown(m.teardownParts, 100, null, 0, inspection);
    assert.ok(object.localToWorld(pivot.clone()).distanceTo(center) < 0.00001, id + ' rotates around its own center');
    assert.ok(Math.abs(object.quaternion.dot(quaternion)) < 0.999);
    const rotated = object.position.clone(), turned = object.quaternion.clone();
    applyLaptopTeardown(m.teardownParts, 100, null, 0, inspection);
    assert.ok(object.position.distanceTo(rotated) < 0.00001);
    assert.ok(Math.abs(object.quaternion.dot(turned)) > 0.999999);
    applyLaptopTeardown(m.teardownParts, 100);
    assert.ok(object.position.equals(position));
    assert.ok(Math.abs(object.quaternion.dot(quaternion)) > 0.999999);
  }
});
await test('Seated parts cannot rotate; lifted module rotation leaves its motherboard fixtures fixed', () => {
  const m = buildLatitude5410();
  applyLaptopTeardown(m.teardownParts, 18);
  const home = m.parts.ssd.rotation.clone();
  const inspection = { id: 'ssd', angles: [Math.PI, 0, 0] as const };
  applyLaptopTeardown(m.teardownParts, 18, null, 0, inspection);
  assert.ok(m.parts.ssd.rotation.equals(home));
  const support = m.parts.motherboard.getObjectByName('SSD standoff')!;
  const supportHome = support.position.clone();
  applyLaptopTeardown(m.teardownParts, 18, 'ssd', 1, inspection);
  assert.ok(!m.parts.ssd.rotation.equals(home));
  assert.ok(support.position.equals(supportHome));
  applyLaptopTeardown(m.teardownParts, 18);
  assert.ok(m.parts.ssd.rotation.equals(home));
});
