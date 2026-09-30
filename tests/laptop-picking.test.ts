import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { visiblePartHit } from '../app/laptop-picking.ts';

test('hidden covers and retired fallbacks cannot intercept RAM or CPU clicks', () => {
  for (const id of ['ram', 'cpu']) {
    const root = new THREE.Group();
    const oldCover = new THREE.Group();
    oldCover.visible = false;
    const oldMesh = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 2));
    oldMesh.position.y = 2;
    oldCover.add(oldMesh);
    root.add(oldCover);
    const retired = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 2));
    retired.visible = false;
    retired.position.y = 1;
    retired.userData.laptopPart = 'motherboard';
    root.add(retired);
    const part = new THREE.Group();
    part.userData.laptopPart = id;
    part.add(new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 1)));
    root.add(part);
    root.updateMatrixWorld(true);
    const ray = new THREE.Raycaster(
      new THREE.Vector3(0, 5, 0),
      new THREE.Vector3(0, -1, 0),
    );
    const hits = ray.intersectObject(root, true);
    assert.ok(hits.length > 2);
    assert.equal(visiblePartHit(hits)?.id, id);
    part.visible = false;
    assert.equal(visiblePartHit(hits), null);
  }
});
