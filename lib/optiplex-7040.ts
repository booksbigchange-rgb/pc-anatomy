/** Original reference-derived geometry. Dell's manual is a visual reference,
 * not a source of redistributed meshes. Component measurements are estimates.
 * Case envelope: 350 x 154 x 274 mm; 1 scene unit = 60 mm, laid on right side.
 */
import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
export type HardwareId =
  | 'motherboard'
  | 'cpu'
  | 'cooler'
  | 'ram'
  | 'ssd'
  | 'gpu'
  | 'psu';
export type Vec3 = [number, number, number];
export const MOUNTS: Record<HardwareId, Vec3> = {
  motherboard: [2.08, 0.76, -0.7],
  cpu: [1.48, 0.93, -1.68],
  cooler: [1.48, 1.08, -1.68],
  ram: [2.91, 1.2, -1.63],
  ssd: [3.64, 0.92, -0.3],
  gpu: [1.66, 1.52, 0.07],
  psu: [1.33, 1.37, 2.05],
};
const steel = 0xa4a9ac,
  black = 0x171a1d,
  blue = 0x327eb2,
  gold = 0xc9a34d;
function material(color: number) {
  return new T.MeshStandardMaterial({
    color,
    metalness: color === steel || color === gold ? 0.68 : 0.12,
    roughness: color === steel ? 0.38 : 0.6,
  });
}
function box(w: number, h: number, d: number, color: number, r = 0.012) {
  return new T.Mesh(
    new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 4, h / 4, d / 4)),
    material(color),
  );
}
function put(g: T.Group, o: T.Object3D, x = 0, y = 0, z = 0) {
  o.position.set(x, y, z);
  g.add(o);
  return o;
}
function cyl(r: number, h: number, color: number) {
  return new T.Mesh(new T.CylinderGeometry(r, r, h, 24), material(color));
}
function screw(g: T.Group, x: number, y: number, z: number) {
  put(g, cyl(0.052, 0.034, steel), x, y, z);
  put(g, box(0.058, 0.005, 0.011, black, 0), x, y + 0.019, z);
  put(g, box(0.011, 0.005, 0.058, black, 0), x, y + 0.019, z);
}
function label(
  g: T.Group,
  text: string,
  w: number,
  d: number,
  x: number,
  y: number,
  z: number,
  color = '#dee3dd',
) {
  if (typeof document === 'undefined') return;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = '#19201f';
  ctx.font = 'bold 30px monospace';
  ctx.fillText(text, 16, 49);
  ctx.font = '17px monospace';
  ctx.fillText('PC HARDWARE ATLAS / TRAINING', 16, 89);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  const mesh = new T.Mesh(
    new T.PlaneGeometry(w, d),
    new T.MeshStandardMaterial({ map: texture, roughness: 0.8 }),
  );
  mesh.rotation.x = -Math.PI / 2;
  put(g, mesh, x, y, z);
}
function cable(g: T.Group, points: Vec3[], color: number, r = 0.024) {
  const curve = new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p)));
  g.add(
    new T.Mesh(new T.TubeGeometry(curve, 24, r, 6, false), material(color)),
  );
}
function fan(size = 1.05) {
  const g = new T.Group();
  const r = size * 0.43;
  for (const x of [-1, 1])
    put(g, box(size * 0.1, 0.13, size, black), x * size * 0.45, 0, 0);
  for (const z of [-1, 1])
    put(g, box(size, 0.13, size * 0.1, black), 0, 0, z * size * 0.45);
  const ring = new T.Mesh(
    new T.TorusGeometry(r, 0.035, 8, 36),
    material(black),
  );
  ring.rotation.x = Math.PI / 2;
  g.add(ring);
  for (let i = 0; i < 7; i++) {
    const blade = box(r * 0.76, 0.035, r * 0.27, 0x303638, 0.035);
    blade.position.set(
      Math.cos((i * Math.PI * 2) / 7) * r * 0.53,
      0,
      Math.sin((i * Math.PI * 2) / 7) * r * 0.53,
    );
    blade.rotation.y = (-i * Math.PI * 2) / 7 + 0.5;
    blade.rotation.z = 0.2;
    g.add(blade);
  }
  put(g, cyl(size * 0.12, 0.09, black), 0, 0.04, 0);
  for (const x of [-1, 1])
    for (const z of [-1, 1]) screw(g, x * size * 0.4, 0.075, z * size * 0.4);
  return g;
}
/** Batch static surfaces by material while retaining selectable component roots. */
function shadows(g: T.Group) {
  g.updateMatrixWorld(true);
  const inverse = g.matrixWorld.clone().invert();
  const buckets = new Map<
    string,
    {
      material: T.MeshStandardMaterial;
      meshes: T.Mesh[];
      geometries: T.BufferGeometry[];
    }
  >();
  g.traverse((o) => {
    if (
      !(o instanceof T.Mesh) ||
      !(o.material instanceof T.MeshStandardMaterial)
    )
      return;
    o.castShadow = true;
    o.receiveShadow = true;
    let ancestor: T.Object3D | null = o.parent;
    while (ancestor && ancestor !== g) {
      if (ancestor.name === 'cover') return;
      ancestor = ancestor.parent;
    }
    if (o.material.map) return;
    const key = `${o.material.color.getHex()}/${o.material.metalness}/${o.material.roughness}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { material: o.material, meshes: [], geometries: [] };
      buckets.set(key, bucket);
    }
    const geometry = o.geometry.index
      ? o.geometry.toNonIndexed()
      : o.geometry.clone();
    geometry.applyMatrix4(
      new T.Matrix4().multiplyMatrices(inverse, o.matrixWorld),
    );
    bucket.meshes.push(o);
    bucket.geometries.push(geometry);
  });
  for (const bucket of buckets.values()) {
    const geometry = mergeGeometries(bucket.geometries, false);
    if (geometry) {
      const mesh = new T.Mesh(geometry, bucket.material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      g.add(mesh);
      for (const source of bucket.meshes) {
        source.removeFromParent();
        source.geometry.dispose();
        if (
          source.material !== bucket.material &&
          source.material instanceof T.Material
        )
          source.material.dispose();
      }
    }
    bucket.geometries.forEach((geometry) => geometry.dispose());
  }
  return g;
}
export function createHardware(id: HardwareId) {
  const g = new T.Group();
  g.name = id;
  if (id === 'motherboard') {
    put(g, box(3.6, 0.055, 3.84, 0x24614d));
    // CPU socket and retention frame, four DIMM connectors, four expansion slots.
    put(g, box(0.76, 0.06, 0.76, steel), -0.6, 0.07, -0.98);
    put(g, box(0.6, 0.06, 0.6, black), -0.6, 0.12, -0.98);
    cable(
      g,
      [
        [-0.99, 0.16, -1.38],
        [-0.98, 0.16, -0.56],
        [-0.19, 0.16, -0.56],
        [-0.18, 0.16, -1.3],
      ],
      steel,
      0.016,
    );
    for (const x of [0.61, 0.83, 1.05, 1.27]) {
      put(g, box(0.09, 0.15, 2.22, black), x, 0.09, -0.93);
      put(g, box(0.028, 0.004, 2.1, 0x887452), x, 0.169, -0.93);
      for (const z of [-2.03, 0.18])
        put(g, box(0.13, 0.19, 0.12, 0xdad8c9), x, 0.11, z);
    }
    for (const [z, c, w] of [
      [0.77, blue, 2.78],
      [1.14, black, 0.65],
      [1.52, black, 2.78],
      [1.83, 0xd8d6c4, 2.5],
    ]) {
      put(g, box(w, 0.13, 0.1, c), -0.18, 0.09, z);
      put(g, box(w - 0.09, 0.005, 0.024, black), -0.18, 0.16, z);
    }
    // Rear I/O shielding faces the rear x edge.
    for (const [z, w, h] of [
      [-1.54, 0.42, 0.28],
      [-0.99, 0.4, 0.39],
      [-0.42, 0.42, 0.32],
      [0.02, 0.32, 0.43],
    ]) {
      put(g, box(0.28, h, w, steel), -1.65, h / 2 + 0.025, z);
      put(g, box(0.014, h * 0.6, w * 0.65, black), -1.8, h / 2 + 0.025, z);
    }
    // VRM chokes, capacitors, chipset, power and SATA connectors.
    for (let i = 0; i < 8; i++) {
      const x = -1.27 + i * 0.17;
      put(g, cyl(0.046, 0.19, black), x, 0.13, -1.69);
      put(g, cyl(0.042, 0.014, steel), x, 0.231, -1.69);
      put(g, box(0.13, 0.09, 0.15, 0x747c80), x, 0.09, -1.44);
    }
    put(g, box(0.53, 0.13, 0.5, 0x46515b), 0.62, 0.08, 0.79);
    for (let x = 0.4; x < 0.87; x += 0.045)
      put(g, box(0.018, 0.13, 0.48, steel), x, 0.17, 0.79);
    put(g, cyl(0.168, 0.04, steel), 1.26, 0.07, 0.61);
    put(g, cyl(0.186, 0.025, black), 1.26, 0.03, 0.61);
    for (const z of [0.8, 1.12, 1.44, 1.72])
      put(g, box(0.16, 0.14, 0.17, black), 1.64, 0.1, z);
    put(g, box(0.3, 0.19, 0.16, 0xe6e2d4), 1.45, 0.11, 1.85);
    put(g, box(0.25, 0.16, 0.15, 0xe6e2d4), -0.62, 0.1, -1.85);
    put(g, box(0.38, 0.09, 0.13, black), 1.56, 0.07, -0.3);
    for (let i = 0; i < 45; i++) {
      const x = -1.35 + (i % 9) * 0.31,
        z = -0.25 + Math.floor(i / 9) * 0.2;
      put(g, box(0.09, 0.03, 0.04, i % 3 ? 0xb49a63 : black), x, 0.049, z);
    }
    for (const [x, z] of [
      [-1.55, -1.76],
      [1.57, -1.76],
      [-1.55, 1.75],
      [1.57, 1.75],
    ])
      screw(g, x, 0.075, z);
    label(g, 'Q170 / LGA1151', 0.86, 0.22, -0.48, 0.055, 0.34);
  }
  if (id === 'cpu') {
    put(g, box(0.62, 0.06, 0.62, 0x315445));
    put(g, box(0.55, 0.05, 0.55, steel), 0, 0.055, 0);
    label(g, 'Intel Core', 0.45, 0.12, 0, 0.082, 0);
  }
  if (id === 'cooler') {
    put(g, box(1.05, 0.13, 1.05, steel), 0, 0, 0);
    for (let i = 0; i < 27; i++)
      put(g, box(0.028, 0.5, 1.02, steel), -0.49 + i * 0.038, 0.3, 0);
    put(g, fan(1.06), 0, 0.61, 0);
    for (const x of [-0.58, 0.58])
      for (const z of [-0.58, 0.58]) {
        put(g, cyl(0.03, 0.5, steel), x, 0.22, z);
        screw(g, x, 0.48, z);
      }
    cable(
      g,
      [
        [0.46, 0.62, 0.3],
        [0.68, 0.15, 0.3],
        [0.7, -0.03, -0.3],
      ],
      black,
      0.019,
    );
  }
  if (id === 'ram') {
    put(g, box(0.042, 0.52, 2.22, 0x25543e));
    for (const x of [-0.04, 0.04])
      for (let z = -0.85; z < 1; z += 0.255)
        put(g, box(0.03, 0.24, 0.2, black), x, 0.07, z);
    for (let z = -1.02; z < 1.04; z += 0.041) {
      if (Math.abs(z + 0.15) < 0.06) continue;
      put(g, box(0.046, 0.095, 0.025, gold, 0), 0, -0.3, z);
    }
    const sticker = box(0.016, 0.21, 0.75, 0xe8e9df);
    put(g, sticker, 0.059, 0.03, 0.15);
  }
  if (id === 'ssd') {
    put(g, box(0.367, 0.036, 1.333, 0x21563c));
    for (const z of [-0.36, 0.06, 0.42])
      put(g, box(0.25, 0.05, 0.28, black), 0, 0.043, z);
    for (let x = -0.15; x < 0.17; x += 0.028)
      put(g, box(0.018, 0.038, 0.095, gold, 0), x, 0, -0.7);
    screw(g, 0, 0.029, 0.61);
    label(g, 'M.2 NVMe', 0.28, 0.26, 0, 0.072, 0.08);
  }
  if (id === 'gpu') {
    // Small slot-powered teaching card; no giant modern GPU in a 240 W chassis.
    put(g, box(2.76, 1.04, 0.045, 0x2b5142));
    put(g, box(2.14, 0.73, 0.28, steel), 0.12, 0.03, 0.15);
    for (let x = -0.9; x < 1.13; x += 0.07)
      put(g, box(0.026, 0.68, 0.32, 0x738086), x, 0.04, 0.2);
    const f = fan(0.7);
    f.rotation.x = Math.PI / 2;
    put(g, f, 0.35, 0.04, 0.39);
    put(g, box(0.045, 1.85, 0.24, steel), -1.39, 0.14, 0);
    put(g, box(1.54, 0.1, 0.05, gold), -0.18, -0.55, 0);
    for (const y of [-0.18, 0.16, 0.5])
      put(g, box(0.04, 0.16, 0.13, black), -1.42, y, 0);
  }
  if (id === 'psu') {
    put(g, box(2.17, 1.08, 1.25, steel));
    label(g, '240 W / OEM PSU', 1.64, 0.67, 0, 0.55, 0);
    for (let z = -0.48; z <= 0.49; z += 0.095)
      for (let y = -0.4; y <= 0.4; y += 0.11)
        put(g, box(0.006, 0.046, 0.052, black, 0), -1.088, y, z);
    put(g, box(0.034, 0.29, 0.37, black), -1.1, 0.04, 0);
    put(g, box(0.04, 0.035, 0.045, 0x6cad55), -1.11, -0.24, 0.31);
    for (let i = 0; i < 6; i++)
      cable(
        g,
        [
          [1.08, -0.22, -0.2 - i * 0.03],
          [1.32, -0.42, -0.25 - i * 0.03],
          [1.42, -0.54, -0.8 - i * 0.02],
        ],
        i % 2 ? 0xd9b343 : black,
        0.018,
      );
  }
  return shadows(g);
}
export function createChassis() {
  const g = new T.Group();
  g.name = 'chassis';
  const cx = 2.5,
    base = 0.58,
    top = base + 154 / 60,
    zmax = 350 / 120,
    back = cx - 274 / 120,
    front = cx + 274 / 120;
  // Thin folded steel walls, with rear openings rather than a solid blocking wall.
  put(g, box(274 / 60, 0.075, 350 / 60, steel), cx, base, 0);
  for (const z of [-zmax, zmax]) {
    put(g, box(274 / 60, 154 / 60, 0.065, steel), cx, (base + top) / 2, z);
    put(g, box(274 / 60, 0.07, 0.13, steel), cx, top, z);
  }
  put(
    g,
    box(0.07, 154 / 60, 0.36, steel),
    back,
    (base + top) / 2,
    -zmax + 0.18,
  );
  put(g, box(0.07, 0.1, 350 / 60, steel), back, base + 0.07, 0);
  put(g, box(0.07, 0.1, 350 / 60, steel), back, top - 0.03, 0);
  for (const z of [-2.82, -0.43, 1.25, 2.82])
    put(g, box(0.07, 154 / 60, 0.1, steel), back, (base + top) / 2, z);
  // Rear ventilation, motherboard I/O, four expansion covers.
  for (let z = -2.62; z < -0.57; z += 0.13)
    for (let y = 1.38; y < 2.85; y += 0.13)
      put(g, box(0.025, 0.047, 0.065, black, 0), back, y, z);
  for (let i = 0; i < 4; i++) {
    const z = 0.07 + i * 0.35;
    put(g, box(0.06, 1.68, 0.2, steel), back, 1.62, z);
    for (let y = 0.95; y < 2.25; y += 0.13)
      put(g, box(0.01, 0.075, 0.12, black), back - 0.04, y, z);
  }
  const exhaust = fan(1.23);
  exhaust.rotation.z = Math.PI / 2;
  put(g, exhaust, back + 0.09, 2.08, -1.6);
  // Front bezel cut-out and geometric lattice, optical bay, four USB ports.
  const shape = new T.Shape();
  shape.moveTo(-154 / 120, -zmax);
  shape.lineTo(154 / 120, -zmax);
  shape.lineTo(154 / 120, zmax);
  shape.lineTo(-154 / 120, zmax);
  shape.closePath();
  const opening = new T.Path();
  opening.moveTo(-1.07, -0.22);
  opening.lineTo(-1.07, 2.7);
  opening.lineTo(1.07, 2.7);
  opening.lineTo(1.07, -0.22);
  opening.closePath();
  shape.holes.push(opening);
  const bezel = new T.Mesh(
    new T.ExtrudeGeometry(shape, { depth: 0.16, bevelEnabled: false }),
    material(black),
  );
  bezel.quaternion.setFromRotationMatrix(
    new T.Matrix4().makeBasis(
      new T.Vector3(0, 1, 0),
      new T.Vector3(0, 0, 1),
      new T.Vector3(1, 0, 0),
    ),
  );
  put(g, bezel, front - 0.08, (base + top) / 2, 0);
  for (let y = base + 0.23; y < top - 0.15; y += 0.095)
    put(g, box(0.028, 0.016, 2.92, 0x42474a, 0), front + 0.084, y, 1.24);
  for (let z = -0.22; z < 2.72; z += 0.105)
    put(
      g,
      box(0.028, 2.14, 0.017, 0x42474a, 0),
      front + 0.085,
      (base + top) / 2,
      z,
    );
  put(g, box(0.028, 2.16, 0.19, 0x383c3e), front + 0.096, 1.89, -2.42);
  put(g, box(0.035, 0.12, 0.035, black), front + 0.12, 2.78, -2.42);
  put(g, box(0.03, 2.16, 0.61, 0x25292c), front + 0.098, 1.89, -1.82);
  for (const z of [-2.13, -1.51])
    put(g, box(0.02, 2.16, 0.016, 0x5d6366), front + 0.12, 1.89, z);
  for (let i = 0; i < 4; i++) {
    const y = base + 0.43 + i * 0.39;
    put(g, box(0.031, 0.3, 0.15, 0x747b7e), front + 0.098, y, -0.76);
    put(
      g,
      box(0.035, 0.23, 0.085, i > 1 ? 0x1b6895 : black),
      front + 0.12,
      y,
      -0.76,
    );
  }
  const power = cyl(0.115, 0.028, steel);
  power.rotation.z = Math.PI / 2;
  put(g, power, front + 0.11, 2.76, -0.78);
  const audio = cyl(0.055, 0.035, black);
  audio.rotation.z = Math.PI / 2;
  put(g, audio, front + 0.11, 2.29, -0.76);
  // Open drive cage rails and optical assembly, release tabs.
  for (const y of [0.92, 2.71])
    put(g, box(1.05, 0.075, 1.82, steel), front - 0.69, y, -1.78);
  for (const x of [front - 0.22, front - 1.16])
    put(g, box(0.065, 1.83, 0.12, steel), x, 1.82, -2.64);
  put(g, box(1.02, 1.9, 0.14, steel), front - 0.7, 1.82, -0.9);
  put(g, box(0.94, 1.79, 0.13, 0x747d80), front - 0.69, 1.82, -2.24);
  put(g, box(0.17, 0.3, 0.3, blue), front - 1.23, 2.64, -1.18);
  // Lower drive caddy and cable routing; remains clear of RAM and board mounts.
  for (const z of [1.38, 2.72])
    put(g, box(0.76, 0.075, 0.075, steel), front - 0.51, 0.82, z);
  for (const x of [front - 0.15, front - 0.86])
    put(g, box(0.065, 0.4, 1.35, blue), x, 1.05, 2.05);
  for (const [x, z] of [
    [0.53, -1.3],
    [3.66, -1.3],
    [0.53, 2.25],
    [3.66, 2.25],
  ])
    put(g, cyl(0.057, 0.12, gold), x, 0.69, z);
  cable(
    g,
    [
      [front - 0.3, 0.76, -0.6],
      [front - 0.5, 0.72, 0.2],
      [front - 0.65, 0.73, 1],
      [3.65, 0.78, 1.55],
    ],
    black,
    0.045,
  );
  const cover = new T.Group();
  cover.name = 'cover';
  put(cover, box(274 / 60, 0.055, 350 / 60, black), cx, top + 0.035, 0);
  put(cover, box(0.35, 0.06, 0.48, blue), back + 0.32, top + 0.085, -2.46);
  for (let z = -0.55; z < 0.6; z += 0.11)
    put(cover, box(1.4, 0.012, 0.032, 0x404548), 1.48, top + 0.07, z);
  shadows(cover);
  cover.visible = false;
  g.add(cover);
  return { group: shadows(g), cover };
}
