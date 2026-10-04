import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { frameInspectionBounds } from '../lib/inspection-camera.ts';

await test('Inspection framing keeps all case corners clear at wide and phone aspect ratios', () => {
  const bounds = new T.Box3(new T.Vector3(0.2, 0.55, -2.3), new T.Vector3(4.9, 6.4, 2.3));
  for (const aspect of [1.5, 0.65]) for (const side of [-1, 1]) {
    const camera = new T.PerspectiveCamera(38, aspect, 0.1, 100);
    const target = new T.Vector3();
    frameInspectionBounds(camera, target, bounds, new T.Vector3(side, 0.04, 0));
    for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
      const point = new T.Vector3(x, y, z).project(camera);
      assert.ok(Math.abs(point.x) < 0.9 && Math.abs(point.y) < 0.9, 'case fits with clearance');
      assert.ok(point.z > -1 && point.z < 1);
    }
  }
});
