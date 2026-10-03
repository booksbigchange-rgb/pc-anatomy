import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  createHardware,
  createChassis,
  MOUNTS,
  type HardwareId,
} from '../lib/optiplex-7040.ts';

void test('OptiPlex inspection batches static meshes without losing selectable roots', () => {
  for (const id of Object.keys(MOUNTS) as HardwareId[]) {
    const g = createHardware(id);
    assert.equal(g.name, id);
    let meshes = 0;
    g.traverse((o) => {
      if (o instanceof T.Mesh) {
        meshes++;
        assert.ok(o.geometry.attributes.position.count > 0);
        assert.ok(o.castShadow);
      }
    });
    assert.ok(meshes > 0 && meshes < 45, `${id} has ${meshes} batches`);
    const bounds = new T.Box3().setFromObject(g);
    assert.ok(!bounds.isEmpty());
    const size = bounds.getSize(new T.Vector3());
    assert.ok(size.x > 0 && size.y > 0 && size.z > 0);
  }
});
void test('OptiPlex core mounts keep board and installed hardware inside the open chassis', () => {
  const { group, cover } = createChassis();
  assert.equal(cover.visible, false);
  assert.equal(group.getObjectByName('cover'), cover);
  for (const id of Object.keys(MOUNTS) as HardwareId[]) {
    const g = createHardware(id);
    g.position.set(...MOUNTS[id]);
    const bounds = new T.Box3().setFromObject(g);
    assert.ok(
      bounds.min.x >= 0.2 && bounds.max.x <= 4.8,
      `${id} exceeds case depth`,
    );
    assert.ok(
      bounds.min.z >= -2.9 && bounds.max.z <= 2.9,
      `${id} exceeds case height`,
    );
    assert.ok(
      bounds.min.y >= 0.58 && bounds.max.y <= 3.16,
      `${id} exceeds case width`,
    );
  }
});

void test('Drive cage remains independently hinged and rear PSU opening stays unobstructed', () => {
  const {group, driveCage} = createChassis();
  assert.equal(group.getObjectByName('drive-cage'), driveCage);
  driveCage.rotation.z = 0;
  group.updateMatrixWorld(true);
  const closed = new T.Box3().setFromObject(driveCage);
  assert.ok(closed.min.y > 2.3, 'Closed cage must clear installed CPU cooler');
  driveCage.rotation.z = -Math.PI / 2.4;
  group.updateMatrixWorld(true);
  const open = new T.Box3().setFromObject(driveCage);
  assert.ok(open.max.y > closed.max.y + .5, 'Hinge must lift cage away from board');
  const ray = new T.Raycaster(new T.Vector3(0, 1.37, 2.05), new T.Vector3(1,0,0), 0, .3);
  assert.equal(ray.intersectObject(group, true).length, 0, 'PSU rear opening must be a real opening');
  ray.set(new T.Vector3(0, 2.95, 2.05), new T.Vector3(1,0,0));
  assert.ok(ray.intersectObject(group, true).length > 0, 'Rear sheet must surround the PSU opening');
});

void test('Motherboard learning targets survive batching and remain fixed when SSD is lifted', () => {
  const board = createHardware('motherboard'); board.position.set(...MOUNTS.motherboard);
  for (const id of ['cpu-socket', 'memory-slots', 'expansion-slots', 'storage-socket', 'sata-ports', 'clock-battery']) {
    const target = board.getObjectByName(id);
    assert.ok(target, id);
    assert.equal(target.userData.boardTarget, id);
    assert.equal(target.parent, board);
    assert.ok(!new T.Box3().setFromObject(target).isEmpty());
  }
  const fixture = board.getObjectByName('storage-socket')!;
  board.updateMatrixWorld(true);
  const home = new T.Box3().setFromObject(fixture);
  const ssd = createHardware('ssd'); ssd.position.set(...MOUNTS.ssd);
  const connector = new T.Vector3(MOUNTS.ssd[0], MOUNTS.ssd[1], MOUNTS.ssd[2] - 0.7);
  assert.ok(home.distanceToPoint(connector) < 0.04, 'SSD contact edge must meet its board socket');
  ssd.position.y += 2.3;
  assert.ok(home.equals(new T.Box3().setFromObject(fixture)), 'Fixture must remain fixed');
  const holeRay = new T.Raycaster(new T.Vector3(0, 1, 0.61), new T.Vector3(0, -1, 0));
  const removable = createHardware('ssd'); removable.updateMatrixWorld(true);
  assert.equal(holeRay.intersectObject(removable, true).length, 0, 'SSD mounting hole must remain open without a travelling screw');
});
