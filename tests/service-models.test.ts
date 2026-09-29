import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { buildRealisticLaptopInternals, applyLaptopTeardown } from '../app/laptop-internals.ts';

await test('Blender service assets fit existing mounts and preserve global/local fixture ownership', async () => {
  const laptop = buildRealisticLaptopInternals();
  for (const id of ['ssd', 'ram', 'wifi', 'cooling'] as const) {
    const bytes = await readFile(new URL(`../public/models/service-realistic/${id}.glb`, import.meta.url));
    const data = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const gltf = await new GLTFLoader().parseAsync(data, '');
    const mount = laptop.parts[id];
    const original = new THREE.Box3().setFromObject(mount);
    const size = new THREE.Box3().setFromObject(gltf.scene).getSize(new THREE.Vector3());
    assert.ok(size.y < .25, `${id} must remain thin laptop hardware`);
    assert.ok(size.x > .5 && size.z > .4, `${id} has plausible board dimensions`);
    const originalSize = original.getSize(new THREE.Vector3());
    assert.ok(size.x < originalSize.x + .15 && size.z < originalSize.z + .15, `${id} fits its footprint`);
    gltf.scene.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      assert.ok(object.geometry.attributes.normal, `${id} needs surface normals`);
      assert.ok(!object.userData.boardFixture);
    });
    mount.clear();
    mount.add(gltf.scene);
  }
  for (const stage of [18, 60, 78, 100]) {
    applyLaptopTeardown(laptop.teardownParts, stage);
    laptop.inside.updateMatrixWorld(true);
    const fixtures: { object: THREE.Object3D; matrix: number[] }[] = [];
    laptop.parts.motherboard.traverse(object => {
      if (object.userData.boardFixture) fixtures.push({ object, matrix: [...object.matrixWorld.elements] });
    });
    for (const id of ['ssd', 'ram', 'wifi'] as const) {
      const home = laptop.parts[id].position.clone();
      applyLaptopTeardown(laptop.teardownParts, stage, id, 1);
      laptop.inside.updateMatrixWorld(true);
      assert.ok(laptop.parts[id].position.y > home.y + .6);
      for (const fixture of fixtures) assert.deepEqual(fixture.object.matrixWorld.elements, fixture.matrix);
      applyLaptopTeardown(laptop.teardownParts, stage, id, 0);
      assert.deepEqual(laptop.parts[id].position.toArray(), home.toArray());
    }
  }
});
