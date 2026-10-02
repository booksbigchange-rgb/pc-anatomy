// Adapted from user-supplied interactive-3d-laptop-model.zip.
import * as THREE from 'three';
export function roundedRim(
  w: number,
  d: number,
  h: number,
  wall = 0.04,
  r = 0.09,
) {
  const mk = (w2: number, d2: number, r2: number) => {
    const rr = Math.min(r2, w2 / 2 - 0.001, d2 / 2 - 0.001);
    const s = new THREE.Shape();
    s.moveTo(-w2 / 2 + rr, -d2 / 2);
    s.lineTo(w2 / 2 - rr, -d2 / 2);
    s.quadraticCurveTo(w2 / 2, -d2 / 2, w2 / 2, -d2 / 2 + rr);
    s.lineTo(w2 / 2, d2 / 2 - rr);
    s.quadraticCurveTo(w2 / 2, d2 / 2, w2 / 2 - rr, d2 / 2);
    s.lineTo(-w2 / 2 + rr, d2 / 2);
    s.quadraticCurveTo(-w2 / 2, d2 / 2, -w2 / 2, d2 / 2 - rr);
    s.lineTo(-w2 / 2, -d2 / 2 + rr);
    s.quadraticCurveTo(-w2 / 2, -d2 / 2, -w2 / 2, -d2 / 2 + rr);
    return s;
  };
  const outer = mk(w, d, r);
  const inner = mk(w - wall * 2, d - wall * 2, Math.max(r - wall, 0.01));
  outer.holes.push(new THREE.Path(inner.getPoints(40).reverse()));
  const geo = new THREE.ExtrudeGeometry(outer, {
    depth: h,
    bevelEnabled: false,
    curveSegments: 8,
  });
  geo.rotateX(-Math.PI / 2);
  geo.center();
  geo.computeVertexNormals();
  return geo;
}
