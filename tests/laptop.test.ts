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


await test('removable modules leave their sockets and retainers on the motherboard', () => {
  const laptop = buildRealisticLaptopInternals();

  for (const name of ['ram', 'ssd', 'wifi'] as const) {
    assert.equal(
      laptop.parts[name].userData.removableHardwareVersion,
      2,
      name + ' is not using the refined removable-hardware model',
    );
  }

  const fixtureNames = new Set<string>();
  laptop.parts.motherboard.traverse((object) => {
    if (object.userData.boardFixture) fixtureNames.add(object.name);
  });

  for (const required of [
    'RAM socket A',
    'RAM socket B',
    'M.2 SSD socket',
    'SSD standoff',
    'M.2 Wi-Fi socket',
    'Wi-Fi standoff',
  ]) {
    assert.ok(fixtureNames.has(required), 'missing fixed motherboard fixture: ' + required);
  }

  let wifiEmbeddedCables = 0;
  laptop.parts.wifi.traverse((object) => {
    if (object.userData.cableKind) wifiEmbeddedCables++;
  });
  assert.equal(wifiEmbeddedCables, 0, 'Wi-Fi antenna cables incorrectly move with the card');
});

await test('internal cabling distinguishes flat flex ribbons from wire harnesses', () => {
  const laptop = buildRealisticLaptopInternals();
  let ribbons = 0;
  let wires = 0;

  laptop.serviceInterior.traverse((object) => {
    if (object.userData.cableKind === 'ribbon') ribbons++;
    if (object.userData.cableKind === 'wire') wires++;
  });

  assert.ok(ribbons >= 3, `expected at least 3 flat flex ribbons, found ${ribbons}`);
  assert.ok(wires >= 4, `expected at least 4 wire/coax runs, found ${wires}`);
});


await test('internal material palette preserves distinct real-world surface classes', () => {
  const laptop = buildRealisticLaptopInternals();
  const roles = new Set<string>();
  const roleMaterials = new Map<string, THREE.MeshStandardMaterial>();

  laptop.inside.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];

    for (const value of materials) {
      if (!(value instanceof THREE.MeshStandardMaterial)) continue;
      const role =
        (object.userData.materialRole as string | undefined) ??
        (value.userData.materialRole as string | undefined);
      if (!role) continue;
      roles.add(role);
      roleMaterials.set(role, value);
    }
  });

  for (const role of [
    'pcb',
    'ic-package',
    'battery-wrap',
    'copper',
    'gold-contact',
    'metal-shield',
    'speaker-plastic',
    'tape',
    'aluminum',
  ]) {
    assert.ok(roles.has(role), 'missing material class: ' + role);
  }

  const battery = roleMaterials.get('battery-wrap');
  const copper = roleMaterials.get('copper');
  const pcb = roleMaterials.get('pcb');
  assert.ok(battery && battery.roughness >= 0.7 && battery.metalness <= 0.05);
  assert.ok(copper && copper.metalness >= 0.8);
  assert.ok(pcb && pcb.metalness <= 0.08 && pcb.roughness >= 0.55);
});


await test('chassis realism includes rails, speaker pockets, hinge routing and retention hardware', () => {
  const laptop = buildRealisticLaptopInternals();
  assert.equal(laptop.chassisDetails.userData.chassisDetailVersion, 1);

  let batteryRails = 0;
  let speakerPockets = 0;
  let hingeLanes = 0;
  let clips = 0;
  let tape = 0;

  laptop.chassisDetails.traverse((object) => {
    if (object.userData.detailKind === 'battery-rail') batteryRails++;
    if (object.userData.detailKind === 'speaker-pocket') speakerPockets++;
    if (object.userData.detailKind === 'hinge-routing-lane') hingeLanes++;
    if (object.userData.retentionKind === 'clip') clips++;
    if (object.userData.retentionKind === 'tape') tape++;
  });

  assert.ok(batteryRails >= 3, `expected battery-bay rails, found ${batteryRails}`);
  assert.ok(speakerPockets >= 2, `expected speaker pockets, found ${speakerPockets}`);
  assert.ok(hingeLanes >= 1, 'missing hinge routing lane');
  assert.ok(clips >= 8, `expected cable-retention clips, found ${clips}`);
  assert.ok(tape >= 6, `expected cable-retention tape, found ${tape}`);
});

await test('routed chassis cables have roles and remain low inside the laptop envelope', () => {
  const laptop = buildRealisticLaptopInternals();
  const roles = new Set<string>();
  let maxY = -Infinity;

  laptop.serviceInterior.traverse((object) => {
    if (!object.userData.cableRole) return;
    roles.add(object.userData.cableRole as string);
    assert.equal(object.userData.cableOwner, 'chassis');

    const box = new THREE.Box3().setFromObject(object);
    maxY = Math.max(maxY, box.max.y);
  });

  for (const role of [
    'battery',
    'display',
    'speaker',
    'speaker-left',
    'speaker-right',
    'wifi-black',
    'wifi-white',
    'keyboard',
    'touchpad',
  ]) {
    assert.ok(roles.has(role), 'missing routed cable role: ' + role);
  }

  assert.ok(maxY < 1.45, `cable routing floats too high above chassis: ${maxY}`);
});

await test('battery cable is visible after the cover opens and before battery removal begins', () => {
  assert.ok(
    LAPTOP_INTERNAL_LAYOUT.battery.teardown.start > LAPTOP_INPUT_COVER_SERVICE.end,
    'battery begins moving before the student can inspect its cable',
  );
});


await test('18% teaching state removes the Input Cover from the active work area', () => {
  assert.equal(
    LAPTOP_INPUT_COVER_SERVICE.visibleUntil,
    LAPTOP_INPUT_COVER_SERVICE.end,
  );
});

await test('100% service row keeps removable modules compact around the chassis', () => {
  const laptop = buildRealisticLaptopInternals();
  applyLaptopTeardown(laptop.teardownParts, 100);

  const names = ['battery', 'ssd', 'wifi', 'ram', 'cooling', 'cpu'] as const;
  const positions = names.map((name) => laptop.parts[name].position);

  const minX = Math.min(...positions.map((p) => p.x));
  const maxX = Math.max(...positions.map((p) => p.x));
  const minZ = Math.min(...positions.map((p) => p.z));
  const maxZ = Math.max(...positions.map((p) => p.z));

  assert.ok(maxX - minX < 8.2, 'service row is spread too widely across X');
  assert.ok(maxZ - minZ < 5.2, 'service row is spread too widely across Z');
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
