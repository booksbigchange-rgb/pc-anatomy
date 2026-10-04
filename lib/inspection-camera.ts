import * as T from 'three';

/** Fit an inspection face with clearance, including narrow phone viewports. */
export function frameInspectionBounds(camera: T.PerspectiveCamera, target: T.Vector3, bounds: T.Box3, direction: T.Vector3) {
  target.copy(bounds.getCenter(new T.Vector3()));
  const outward = direction.clone().normalize();
  camera.position.copy(target).add(outward);
  camera.lookAt(target);
  const right = new T.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
  const up = new T.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
  const vertical = Math.tan(T.MathUtils.degToRad(camera.fov / 2));
  const horizontal = vertical * camera.aspect;
  let distance = 1;
  for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
    const offset = new T.Vector3(x, y, z).sub(target);
    distance = Math.max(distance, Math.abs(offset.dot(right)) / horizontal + offset.dot(outward), Math.abs(offset.dot(up)) / vertical + offset.dot(outward));
  }
  camera.position.copy(target).addScaledVector(outward, distance * 1.16);
  camera.lookAt(target);
  camera.updateMatrixWorld();
}
