import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  LAPTOP_INPUT_COVER_SERVICE,
  LAPTOP_INTERNAL_LAYOUT,
  laptopTeardownStage,
} from '../app/laptop-layout.ts';
import {
  applyLaptopTeardown,
  buildRealisticLaptopInternals,
} from '../app/laptop-internals.ts';

const close = (actual: number, expected: number, label: string) =>
  assert.ok(Math.abs(actual - expected) < 1e-6, `${label}: ${actual} !== ${expected}`);

const assertVec = (
  actual: THREE.Vector3,
  expected: readonly [number, number, number],
  label: string,
) => {
  close(actual.x, expected[0], label + '.x');
  close(actual.y, expected[1], label + '.y');
  close(actual.z, expected[2], label + '.z');
};

await test('laptop internal home positions stay inside the Framework chassis envelope', () => {
  for (const [name, item] of Object.entries(LAPTOP_INTERNAL_LAYOUT)) {
    const [x, y, z] = item.home;
    assert.ok(Math.abs(x) <= 3.7, name + ' leaves chassis width');
    assert.ok(y >= 0.7 && y <= 1.5, name + ' has implausible installed height');
    assert.ok(Math.abs(z) <= 2.75, name + ' leaves chassis depth');
  }
});

await test('0% teardown preserves every installed internal home transform', () => {
  const laptop = buildRealisticLaptopInternals();
  applyLaptopTeardown(laptop.teardownParts, 0);

  for (const [name, object] of Object.entries(laptop.parts)) {
    const layoutName = name === 'cooling' ? 'cooling' : name;
    const expected =
      LAPTOP_INTERNAL_LAYOUT[layoutName as keyof typeof LAPTOP_INTERNAL_LAYOUT].home;
    assertVec(object.position, expected, name);
  }
  assert.equal(laptopTeardownStage(0), 'Assembled');
});

await test('18% exposes the chassis without moving installed internals yet', () => {
  const laptop = buildRealisticLaptopInternals();
  applyLaptopTeardown(laptop.teardownParts, LAPTOP_INPUT_COVER_SERVICE.end);

  for (const [name, object] of Object.entries(laptop.parts)) {
    const expected =
      LAPTOP_INTERNAL_LAYOUT[name as keyof typeof LAPTOP_INTERNAL_LAYOUT].home;
    assertVec(object.position, expected, name);
  }

  assert.equal(
    LAPTOP_INPUT_COVER_SERVICE.flippedAt,
    LAPTOP_INPUT_COVER_SERVICE.end / 2,
  );
  assert.equal(
    LAPTOP_INPUT_COVER_SERVICE.internalsVisibleAt,
    LAPTOP_INPUT_COVER_SERVICE.end,
  );
  assert.equal(laptopTeardownStage(18), 'Battery + service parts');
});

await test('Framework motherboard population is dense, shallow and keeps removable-module zones readable', () => {
  const laptop = buildRealisticLaptopInternals();
  const board = laptop.parts.motherboard;
  board.updateMatrixWorld(true);

  let meshCount = 0;
  let maxLocalY = -Infinity;
  board.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    meshCount++;
    const box = new THREE.Box3().setFromObject(object);
    const localTop = box.max.y - board.position.y;
    maxLocalY = Math.max(maxLocalY, localTop);
  });

  assert.ok(meshCount >= 180, `motherboard is visually under-populated: ${meshCount} meshes`);
  assert.ok(maxLocalY < 0.55, `motherboard components are implausibly tall: ${maxLocalY}`);

  const boardBox = new THREE.Box3().setFromObject(board);
  for (const name of ['ram', 'ssd', 'wifi'] as const) {
    const moduleBox = new THREE.Box3().setFromObject(laptop.parts[name]);
    assert.ok(
      boardBox.intersectsBox(moduleBox),
      `${name} no longer reads as installed on the motherboard`,
    );
  }

  assert.equal(board.userData.boardDetailVersion, 2);
});


await test('Framework cooling assembly stays flat and within a laptop-scale envelope', () => {
  const laptop = buildRealisticLaptopInternals();
  laptop.inside.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(laptop.parts.cooling);
  const size = box.getSize(new THREE.Vector3());

  assert.ok(size.y < 0.5, `cooling assembly is too tall: ${size.y}`);
  assert.ok(
    size.x >= 2.5 && size.x <= 3.6,
    `cooling width is outside the expected 120 mm-class envelope: ${size.x}`,
  );
  assert.ok(
    size.z >= 1.5 && size.z <= 2.35,
    `cooling depth is outside the expected 85 mm-class envelope: ${size.z}`,
  );
});


await test('100% service layout stays planar enough to read like a technician mat', () => {
  const laptop = buildRealisticLaptopInternals();
  applyLaptopTeardown(laptop.teardownParts, 100);

  const staged = ['battery', 'ssd', 'wifi', 'ram', 'cooling', 'cpu'] as const;
  const heights = staged.map((name) => laptop.parts[name].position.y);
  const spread = Math.max(...heights) - Math.min(...heights);

  assert.ok(
    spread < 0.38,
    `service parts are stacked vertically instead of staged on a mat: ${spread}`,
  );
});


await test('100% teardown separates service parts from the motherboard staging area', () => {
  const laptop = buildRealisticLaptopInternals();
  applyLaptopTeardown(laptop.teardownParts, 100);
  laptop.inside.updateMatrixWorld(true);

  const board = new THREE.Box3().setFromObject(laptop.parts.motherboard);
  for (const name of ['battery', 'ssd', 'wifi', 'ram', 'cooling', 'cpu'] as const) {
    const box = new THREE.Box3().setFromObject(laptop.parts[name]);
    assert.ok(!box.intersectsBox(board), name + ' overlaps motherboard at 100%');
  }

  for (const [name, object] of Object.entries(laptop.parts)) {
    assert.ok(
      [object.position.x, object.position.y, object.position.z].every(Number.isFinite),
      name + ' has a non-finite service position',
    );
  }
  assert.equal(laptopTeardownStage(100), 'Service layout');
});
