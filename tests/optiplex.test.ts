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
    assert.ok(meshes > 0 && meshes < 20, `${id} has ${meshes} batches`);
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
