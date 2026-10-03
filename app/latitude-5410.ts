/** Original Dell-reference teaching geometry. 40 mm per scene unit.
 * Exterior dimensions follow Dell; internals are estimated from service images.
 * The service scene shows the closed laptop turned over, with its base removed.
 * No Framework CAD or manufacturer images are redistributed in this model.
 */
import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type {
  LaptopTeardownPart,
  LaptopInternalCable,
} from './laptop-internals.ts';
export const LATITUDE_DIMENSIONS = {
  width: 323.05 / 40,
  depth: 216 / 40,
  closedHeight: 21.18 / 40,
  screenWidth: 309.8 / 40,
  screenHeight: 174.3 / 40,
};
export const LATITUDE_HOME = {
  battery: [0.58, 1.06, 1.23],
  motherboard: [0, 0.95, -1.16],
  cpu: [-0.75, 1.09, -1.86],
  ram: [-0.65, 1.08, -0.52],
  ssd: [-3.13, 1.08, 1.05],
  wifi: [-3.13, 1.08, -0.77],
  cooling: [0, 1.19, 0],
  speakers: [0, 0.99, 2.4],
} as const;
const C = {
  shell: 0x7d858b,
  dark: 0x171b1f,
  steel: 0x9aa3aa,
  board: 0x205569,
  gold: 0xc3a05d,
  blue: 0x208aca,
};
function mat(c: number) {
  return new T.MeshStandardMaterial({
    color: c,
    roughness: c === C.dark ? 0.76 : c === C.board ? 0.72 : c === C.steel || c === 0xad703e ? 0.32 : 0.48,
    metalness: c === C.steel || c === 0xad703e ? 0.82 : c === C.gold ? 0.72 : c === C.shell ? 0.24 : 0,
  });
}
function box(w: number, h: number, d: number, c: number, r = 0.02) {
  return new T.Mesh(
    new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 4, h / 4, d / 4)),
    mat(c),
  );
}
/** Board cutouts are geometry, so they remain visible when modules lift out. */
function moduleBoard(w: number, d: number, thickness: number, color: number, holeZ?: number) {
  const shape = new T.Shape();
  const points = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2 - 0.1], [0.08, d / 2 - 0.1], [0.08, d / 2 - 0.18], [0.025, d / 2 - 0.18], [0.025, d / 2 - 0.1], [-w / 2, d / 2 - 0.1]];
  points.forEach(([x, z], i) => i ? shape.lineTo(x, z) : shape.moveTo(x, z));
  shape.closePath();
  if (holeZ !== undefined) { const hole = new T.Path(); hole.absarc(0, holeZ, 0.034, 0, Math.PI * 2, true); shape.holes.push(hole); }
  const mesh = new T.Mesh(new T.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, curveSegments: 16 }), mat(color));
  mesh.rotation.x = Math.PI / 2;
  mesh.position.y = thickness / 2;
  mesh.userData.geometryRole = 'module-board';
  return mesh;
}
function add(g: T.Group, o: T.Object3D, x = 0, y = 0, z = 0) {
  o.position.set(x, y, z);
  g.add(o);
  return o;
}
function disk(r: number, h: number, c: number) {
  return new T.Mesh(new T.CylinderGeometry(r, r, h, 32), mat(c));
}
function screw(g: T.Group, x: number, y: number, z: number) {
  add(g, disk(0.035, 0.023, C.steel), x, y, z);
  add(g, box(0.043, 0.003, 0.008, C.dark, 0), x, y + 0.013, z);
  add(g, box(0.008, 0.003, 0.043, C.dark, 0), x, y + 0.013, z);
}
function text(
  g: T.Group,
  words: string,
  w: number,
  d: number,
  x: number,
  y: number,
  z: number,
  color = '#9ba4a8',
) {
  if (typeof document === 'undefined') return;
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1024, 512);
  ctx.fillStyle = '#182126';
  ctx.font = 'bold 68px sans-serif';
  words.split('\n').forEach((s, i) => {
    ctx.font = 'bold 68px sans-serif';
    const size = Math.min(
      68,
      Math.floor((68 * 960) / Math.max(1, ctx.measureText(s).width)),
    );
    ctx.font = `bold ${size}px sans-serif`;
    ctx.fillText(s, 32, 94 + i * 93);
  });
  const texture = new T.CanvasTexture(c);
  texture.colorSpace = T.SRGBColorSpace;
  const o = new T.Mesh(
    new T.PlaneGeometry(w, d),
    new T.MeshStandardMaterial({ map: texture, roughness: 0.85 }),
  );
  o.rotation.x = -Math.PI / 2;
  add(g, o, x, y, z);
}
function wire(g: T.Group, p: number[][], c = C.dark, r = 0.016) {
  const curve = new T.CatmullRomCurve3(p.map((v) => new T.Vector3(...v)));
  const o = new T.Mesh(new T.TubeGeometry(curve, 30, r, 6, false), mat(c));
  g.add(o);
  return o;
}
function owner(g: T.Group, id: string) {
  g.userData.laptopPart = id;
  return g;
}
/** Keep component owners and their moving fixtures separate while batching surfaces. */
function batch(g: T.Group) {
  g.updateMatrixWorld(true);
  const inv = g.matrixWorld.clone().invert();
  const buckets = new Map<
    number,
    { geos: T.BufferGeometry[]; meshes: T.Mesh[]; material: T.Material }
  >();
  g.traverse((o) => {
    if (!(o instanceof T.Mesh)) return;
    o.castShadow = true;
    o.receiveShadow = true;
    if (o.userData.geometryRole || !(o.material instanceof T.MeshStandardMaterial) || o.material.map)
      return;
    let p = o.parent;
    while (p && p !== g) {
      if (p.userData.laptopPart) return;
      p = p.parent;
    }
    const key = o.material.color.getHex();
    let b = buckets.get(key);
    if (!b) {
      b = { geos: [], meshes: [], material: o.material };
      buckets.set(key, b);
    }
    const geo = o.geometry.index
      ? o.geometry.toNonIndexed()
      : o.geometry.clone();
    geo.applyMatrix4(new T.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    b.geos.push(geo);
    b.meshes.push(o);
  });
  for (const b of buckets.values()) {
    const geo = mergeGeometries(b.geos, false);
    if (geo) {
      const m = new T.Mesh(geo, b.material);
      m.castShadow = m.receiveShadow = true;
      g.add(m);
      b.meshes.forEach((o) => {
        o.removeFromParent();
        o.geometry.dispose();
        if (o.material !== b.material && o.material instanceof T.Material)
          o.material.dispose();
      });
    }
    b.geos.forEach((o) => o.dispose());
  }
  return g;
}
function rim(g: T.Group, y: number) {
  const w = LATITUDE_DIMENSIONS.width,
    d = LATITUDE_DIMENSIONS.depth;
  for (const x of [-w / 2, w / 2])
    add(g, box(0.085, 0.32, d, C.dark, 0.03), x, y, 0);
  for (const z of [-d / 2, d / 2])
    add(g, box(w, 0.32, 0.085, C.dark, 0.03), 0, y, z);
}
function port(
  g: T.Group,
  id: string,
  x: number,
  z: number,
  w: number,
  h: number,
  round = false,
) {
  const o = round ? disk(w / 2, 0.06, C.dark) : box(0.065, h, w, C.dark, 0.014);
  if (round) o.rotation.z = Math.PI / 2;
  add(g, o, x, 0.84, z);
  o.userData.laptopPort = id;
  o.userData.highlightColor = 0x297b92;
  const trimStart = g.children.length;
  const sx = Math.sign(x);
  if (!round) {
    for (const dz of [-w / 2, w / 2])
      add(g, box(0.04, h + 0.025, 0.02, C.steel), x, 0.84, z + dz);
    for (const dy of [-h / 2, h / 2])
      add(g, box(0.04, 0.018, w, C.steel), x, 0.84 + dy, z);
    add(
      g,
      box(0.018, 0.022, w * 0.75, id.startsWith('usb-') ? C.blue : C.steel, 0),
      x + sx * 0.038,
      0.85,
      z,
    );
  } else {
    const ring = new T.Mesh(
      new T.TorusGeometry(w / 2, 0.018, 8, 32),
      mat(C.steel),
    );
    ring.rotation.y = Math.PI / 2;
    add(g, ring, x + sx * 0.035, 0.84, z);
  }
  for (const trim of g.children.slice(trimStart)) {
    trim.userData.laptopPort = id;
  }
  return o;
}
function exterior() {
  const g = new T.Group(),
    w = LATITUDE_DIMENSIONS.width,
    d = LATITUDE_DIMENSIONS.depth;
  // Hollow side walls: sockets are openings in the chassis, not pasted on a solid block.
  add(g, box(w, 0.055, d, C.shell, 0.06), 0, 0.697, 0);
  for (const z of [-d / 2 + 0.05, d / 2 - 0.05])
    add(g, box(w - 0.1, 0.3, 0.1, C.shell, 0.045), 0, 0.84, z);
  const sidePorts = [
    [
      [-2.15, 0.2, 0.2],
      [-1.67, 0.22, 0.11],
      [-1.2, 0.33, 0.17],
      [1.28, 1.26, 0.023],
    ],
    [
      [-1.9, 0.36, 0.26],
      [-1.34, 0.4, 0.14],
      [-0.77, 0.33, 0.17],
      [-0.23, 0.33, 0.17],
      [0.4, 0.14, 0.14],
      [0.86, 0.25, 0.025],
      [1.14, 0.25, 0.025],
    ],
  ];
  for (let side = 0; side < 2; side++) {
    const shape = new T.Shape();
    shape.moveTo(-d / 2, -0.17);
    shape.lineTo(d / 2, -0.17);
    shape.lineTo(d / 2, 0.17);
    shape.lineTo(-d / 2, 0.17);
    shape.closePath();
    const openings = [...sidePorts[side]];
    if (side === 0)
      for (let i = 0; i < 14; i++)
        openings.push([-0.75 + i * 0.097, 0.067, 0.16]);
    for (const [z, pw, ph] of openings) {
      const hole = new T.Path();
      const center = -z;
      hole.moveTo(center - pw / 2, -ph / 2);
      hole.lineTo(center - pw / 2, ph / 2);
      hole.lineTo(center + pw / 2, ph / 2);
      hole.lineTo(center + pw / 2, -ph / 2);
      hole.closePath();
      shape.holes.push(hole);
    }
    const wall = new T.Mesh(
      new T.ExtrudeGeometry(shape, { depth: 0.065, bevelEnabled: false }),
      mat(C.shell),
    );
    wall.rotation.y = Math.PI / 2;
    add(g, wall, side === 0 ? -w / 2 : w / 2 - 0.065, 0.84, 0);
  }
  add(g, box(w - 0.12, 0.018, d - 0.08, C.dark, 0.09), 0, 1.025, 0);
  add(g, box(w - 0.16, 0.035, d - 0.16, 0x7f878c, 0.1), 0, 1.045, 0);
  const keyboard = owner(new T.Group(), 'keyboard');
  add(keyboard, box(6.72, 0.022, 2.46, C.dark, 0.07), 0, 1.08, -0.83);
  const rows = [
    [
      'Esc',
      'F1',
      'F2',
      'F3',
      'F4',
      'F5',
      'F6',
      'F7',
      'F8',
      'F9',
      'F10',
      'F11',
      'F12',
      'Del',
    ],
    ['~', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', '⌫'],
    ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
    ['Caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'Enter'],
    ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'Shift'],
    ['Ctrl', 'Fn', 'Win', 'Alt', 'Space', 'Alt', 'Ctrl', 'PgUp', '↑', 'PgDn'],
  ];
  for (let row = 0; row < rows.length; row++) {
    let x = -3.22;
    for (let i = 0; i < rows[row].length; i++) {
      const k = rows[row][i],
        kw =
          k === 'Space'
            ? 1.85
            : k === 'Shift'
              ? 0.72
              : k === 'Enter'
                ? 0.67
                : row === 0
                  ? 0.43
                  : 0.455;
      const key = box(
        kw - 0.045,
        0.035,
        row === 0 ? 0.24 : 0.35,
        0x252a2e,
        0.035,
      );
      add(keyboard, key, x + kw / 2, 1.11, -1.95 + row * 0.405);
      if (typeof document !== 'undefined') {
        const c = document.createElement('canvas');
        c.width = 128;
        c.height = 64;
        const ctx = c.getContext('2d')!;
        ctx.fillStyle = '#c5ced3';
        ctx.font = '26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(k, 64, 39);
        const tx = new T.CanvasTexture(c);
        tx.colorSpace = T.SRGBColorSpace;
        const label = new T.Mesh(
          new T.PlaneGeometry(kw - 0.06, 0.22),
          new T.MeshBasicMaterial({ map: tx, transparent: true }),
        );
        label.rotation.x = -Math.PI / 2;
        add(keyboard, label, x + kw / 2, 1.13, -1.95 + row * 0.405);
      }
      x += kw;
    }
  }
  add(keyboard, disk(0.075, 0.028, C.dark), -0.18, 1.145, -0.44);
  for (const x of [1.89, 2.345, 2.8])
    add(keyboard, box(0.4, 0.035, 0.17, C.dark, 0.025), x, 1.11, 0.3);
  g.add(batch(keyboard));
  const trackpad = owner(new T.Group(), 'trackpad');
  add(trackpad, box(2.6, 0.025, 1.32, 0x717b82, 0.055), -0.42, 1.082, 1.23);
  for (const x of [-1.07, 0.23])
    add(trackpad, box(1.26, 0.02, 0.25, 0x646f76), x, 1.087, 2.07);
  for (const [x, w] of [
    [-1.28, 0.87],
    [-0.42, 0.48],
    [0.44, 0.87],
  ])
    add(trackpad, box(w, 0.02, 0.22, 0x454f56), x, 1.087, 0.43);
  g.add(batch(trackpad));
  add(g, disk(0.115, 0.026, C.steel), 3.48, 1.09, -1.72);
  const lid = owner(new T.Group(), 'display');
  lid.position.set(0, 1.03, -2.54);
  lid.rotation.x = -0.17;
  add(lid, box(w - 0.07, 5.1, 0.1, C.shell, 0.12), 0, 2.55, -0.07);
  add(lid, box(w - 0.22, 4.97, 0.05, C.dark, 0.09), 0, 2.55, 0);
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d')!;
    ctx.strokeStyle = '#4b555b';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(128, 128, 106, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#4b555b';
    ctx.font = 'bold 66px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DELL', 128, 151);
    const texture = new T.CanvasTexture(c);
    texture.colorSpace = T.SRGBColorSpace;
    const badge = new T.Mesh(
      new T.PlaneGeometry(0.76, 0.76),
      new T.MeshBasicMaterial({ map: texture, transparent: true }),
    );
    badge.rotation.y = Math.PI;
    add(lid, badge, 0, 2.55, -0.121);
  }
  const screen = box(
    LATITUDE_DIMENSIONS.screenWidth,
    LATITUDE_DIMENSIONS.screenHeight,
    0.016,
    0x153848,
    0.015,
  );
  add(lid, screen, 0, 2.67, 0.039);
  const glass = new T.Mesh(
    new T.PlaneGeometry(LATITUDE_DIMENSIONS.screenWidth, LATITUDE_DIMENSIONS.screenHeight),
    new T.MeshPhysicalMaterial({ color: 0x9eb7c5, transparent: true, opacity: 0.14, roughness: 0.12, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.08 }),
  );
  add(lid, glass, 0, 2.67, 0.05);
  const lens = disk(0.047, 0.024, 0x0b1216);
  lens.rotation.x = Math.PI / 2;
  add(lid, lens, 0, 4.96, 0.041);
  add(lid, box(0.13, 0.014, 0.015, 0x39474d), 0.16, 4.96, 0.053);
  for (const x of [-2.9, 2.9])
    add(g, box(0.84, 0.23, 0.33, 0x525d63, 0.055), x, 1.0, -2.56);
  g.add(batch(lid));
  const ports = [
    port(g, 'power-left', -w / 2 + 0.022, -2.15, 0.2, 0.2, true),
    port(g, 'usb-rear-right', w / 2 - 0.022, -0.77, 0.33, 0.17),
    port(g, 'usb-front-right', w / 2 - 0.022, -0.23, 0.33, 0.17),
    port(g, 'hdmi-left', w / 2 - 0.022, -1.34, 0.4, 0.14),
    port(g, 'audio-right', w / 2 - 0.022, 0.4, 0.14, 0.14, true),
  ];
  port(g, 'usb-c-left', -w / 2 + 0.022, -1.67, 0.22, 0.11);
  port(g, 'usb-a-left', -w / 2 + 0.022, -1.2, 0.33, 0.17);
  port(g, 'ethernet-right', w / 2 - 0.022, -1.9, 0.36, 0.26);
  for (let i = 0; i < 14; i++)
    add(
      g,
      box(0.016, 0.16, 0.07, C.dark, 0),
      -w / 2 - 0.0229,
      0.84,
      -0.75 + i * 0.097,
    );
  for (const z of [0.86, 1.14])
    add(g, box(0.014, 0.025, 0.25, C.dark, 0), w / 2 + 0.052, 0.82, z);
  add(g, box(0.017, 0.023, 1.26, C.dark), -w / 2 - 0.052, 0.81, 1.28);
  return { g, ports, keyboard, trackpad, lid };
}
function step(
  object: T.Object3D,
  start: number,
  end: number,
  offset: number[],
  rotation = [0, 0, 0],
): LaptopTeardownPart {
  return {
    object,
    start,
    end,
    offset: new T.Vector3(...offset),
    rotationOffset: new T.Vector3(...rotation),
    homePosition: object.position.clone(),
    homeRotation: object.rotation.clone(),
  };
}
export function latitudeTeardownStage(t: number) {
  return t < 18
    ? 'Remove underside base cover'
    : t < 24
      ? 'Disconnect battery power'
      : t < 34
        ? 'Remove battery'
        : t < 50
          ? 'Inspect storage and wireless'
          : t < 60
            ? 'Release SODIMM memory'
            : t < 78
              ? 'Remove cooling assembly'
              : t < 90
                ? 'Inspect soldered CPU'
                : 'Separate system board and display';
}
export function buildLatitude5410() {
  const root = new T.Group(),
    inside = new T.Group();
  const ext = exterior(),
    outside = ext.g;
  root.add(outside, inside);
  root.position.set(0, -0.05, 0.2);
  const closed = outside.clone(true);
  const closedLid = closed.children.find(
    (o) => o.userData.laptopPart === 'display',
  );
  if (closedLid) closedLid.rotation.x = Math.PI / 2;
  closed.position.copy(root.position);
  const base = new T.Group();
  add(
    base,
    box(
      LATITUDE_DIMENSIONS.width - 0.1,
      0.045,
      LATITUDE_DIMENSIONS.depth - 0.12,
      0x596268,
      0.09,
    ),
    0,
    0.74,
    0,
  );
  rim(base, 0.89);
  for (let i = 0; i < 8; i++) {
    const x = i < 4 ? -3.78 : 3.78,
      z = -2.4 + (i % 4) * 1.6;
    screw(base, x, 1.04, z);
  }
  inside.add(batch(base));
  const serviceInterior = new T.Group();
  inside.add(serviceInterior);
  const board = owner(new T.Group(), 'motherboard');
  board.position.set(...LATITUDE_HOME.motherboard);
  const shape = new T.Shape();
  [
    [-3.73, -1.35],
    [3.65, -1.35],
    [3.65, -0.2],
    [2.0, -0.2],
    [2.0, 0.85],
    [-2.38, 0.85],
    [-2.38, 3.45],
    [-3.73, 3.45],
  ].forEach((p, i) =>
    i ? shape.lineTo(p[0], p[1]) : shape.moveTo(p[0], p[1]),
  );
  shape.closePath();
  for (const [holeX, holeZ] of [[-3.4, -1.15], [-2.05, -1.15], [1.63, -1.15], [3.48, -1.15]]) {
    const hole = new T.Path();
    hole.absarc(holeX, holeZ, 0.046, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  const pcb = new T.Mesh(
    new T.ExtrudeGeometry(shape, { depth: 0.045, bevelEnabled: false }),
    mat(C.board),
  );
  pcb.rotation.x = Math.PI / 2;
  board.add(pcb);
  for (const x of [-1.45, -1.12, -0.79]) {
    add(board, box(0.21, 0.07, 0.22, 0x505960, 0.018), x, 0.055, -1.02);
    add(board, box(0.16, 0.006, 0.16, 0x899298, 0.012), x, 0.093, -1.02);
  }
  for (const [centerX, centerZ] of [[-2.7, -1.02], [0.6, -0.9], [1.7, -1.04], [2.85, -0.95], [-2.96, 1.7]]) {
    for (let index = 0; index < 16; index++) {
      const x = centerX + (index % 4) * 0.095;
      const z = centerZ + Math.floor(index / 4) * 0.11;
      add(board, box(0.048, 0.018, 0.065, index % 3 ? 0x9b8868 : C.dark, 0.003), x, 0.022, z);
      for (const end of [-1, 1])
        add(board, box(0.012, 0.02, 0.065, C.steel, 0), x + end * 0.024, 0.023, z);
    }
    add(board, box(0.24, 0.045, 0.25, C.dark, 0.008), centerX + 0.12, 0.037, centerZ + 0.52);
    for (let lane = 0; lane < 6; lane++) {
      const traceX = centerX + lane * 0.036;
      add(board, box(0.009, 0.002, 0.38, 0x397486, 0), traceX, 0.005, centerZ + 0.39);
      add(board, box(0.2, 0.002, 0.009, 0x397486, 0), traceX + 0.1, 0.005, centerZ + 0.58);
    }
  }
  for (const x of [-3.4, -2.05, 1.63, 3.48]) screw(board, x, 0.075, -1.15);
  const cpu = owner(new T.Group(), 'cpu');
  add(cpu, box(0.94, 0.04, 0.76, 0x224734));
  add(cpu, box(0.7, 0.043, 0.35, 0x3c464e), 0, 0.043, 0);
  cpu.position.set(-0.75, 0.14, -0.7);
  board.add(batch(cpu));
  const coin = disk(0.25, 0.035, C.dark);
  add(board, coin, -1.8, 0.07, -0.5);
  const coinRing = new T.Mesh(
    new T.TorusGeometry(0.255, 0.019, 8, 32),
    mat(C.steel),
  );
  coinRing.rotation.x = Math.PI / 2;
  add(board, coinRing, -1.8, 0.08, -0.5);
  // DIMM sockets stay fixed on the board when their two modules lift away.
  for (const x of [-1.58, 0.3]) {
    add(board, box(1.66, 0.065, 0.14, 0xd9d7ca), x, 0.07, 1.0);
    for (const dx of [-0.85, 0.85])
      add(board, box(0.04, 0.06, 0.58, C.steel), x + dx, 0.065, 0.64);
  }
  for (const z of [3.14, 0.765]) {
    add(board, box(0.58, 0.125, 0.14, C.dark), -3.13, 0.065, z);
    const isSsd = z === 3.14;
    const supportHeight = isSsd ? 0.112 : 0.11;
    const support = disk(0.04, supportHeight, C.gold);
    support.name = isSsd ? 'SSD standoff' : 'Wi-Fi standoff';
    support.userData.geometryRole = 'fixed-standoff';
    add(board, support, -3.13, supportHeight / 2, isSsd ? 1.27 : 0.075);
    screw(board, -3.13, 0.145, isSsd ? 1.27 : 0.075);
  }
  for (const [x, z, w] of [
    [-3.13, -0.95, 0.5],
    [0.8, 0.48, 0.47],
    [-0.8, 0.49, 0.64],
    [-2.16, 2.36, 0.4],
  ]) {
    add(board, box(w, 0.075, 0.13, 0xe3ddd0), x, 0.07, z);
    for (let i = 0; i < 8; i++)
      add(
        board,
        box(0.016, 0.008, 0.09, C.gold, 0),
        x - w / 2 + 0.04 + (i * (w - 0.08)) / 8,
        0.08,
        z,
      );
  }
  text(board, 'DIMM A    DDR4', 1.06, 0.22, 0.3, 0.057, 0.04, '#27677a');
  batch(board);
  serviceInterior.add(board);
  const battery = owner(new T.Group(), 'battery');
  battery.position.set(...LATITUDE_HOME.battery);
  add(battery, box(5.8, 0.23, 2.04, C.dark, 0.035));
  for (const x of [-2.16, -0.72, 0.72, 2.16])
    add(battery, box(1.38, 0.018, 1.92, 0x252b2f, 0.02), x, 0.127, 0);
  text(
    battery,
    '68 Wh · Li-ion\nLatitude 5410\nDisconnect before service',
    2.15,
    0.82,
    0,
    0.14,
    0,
  );
  for (const x of [-2.7, 2.7]) screw(battery, x, 0.15, -0.88);
  batch(battery);
  serviceInterior.add(battery);
  const ram = owner(new T.Group(), 'ram');
  ram.position.set(...LATITUDE_HOME.ram);
  for (const x of [-0.93, 0.93]) {
    add(ram, box(1.68, 0.04, 0.7, 0x377746), x, 0, 0);
    for (let i = 0; i < 4; i++)
      add(ram, box(0.27, 0.03, 0.27, C.dark), x - 0.55 + i * 0.365, 0.037, 0);
    for (let i = 0; i < 32; i++)
      add(
        ram,
        box(0.024, 0.01, 0.09, C.gold, 0),
        x - 0.76 + i * 0.048,
        0.025,
        0.355,
      );
  }
  for (const x of [-0.93, 0.93]) text(ram, 'DDR4 · SODIMM', 1.08, 0.15, x, 0.055, -0.24, '#d3d7c8');
  for (const x of [-0.93, 0.93]) for (let i = 0; i < 4; i++)
    add(ram, box(0.27, 0.025, 0.27, C.dark), x - 0.55 + i * 0.365, -0.034, 0);
  batch(ram);
  serviceInterior.add(ram);
  const ssd = owner(new T.Group(), 'ssd');
  ssd.position.set(...LATITUDE_HOME.ssd);
  const ssdPcb = moduleBoard(0.55, 2, 0.036, 0x23734e, -0.94);
  ssdPcb.name = 'SSD PCB';
  ssd.add(ssdPcb);
  const ssdEyelet = new T.Mesh(new T.RingGeometry(0.034, 0.058, 24), mat(C.gold));
  ssdEyelet.rotation.x = -Math.PI / 2;
  add(ssd, ssdEyelet, 0, 0.02, -0.94);
  for (const z of [-0.68, -0.2, 0.38])
    add(ssd, box(0.37, 0.03, 0.4, C.dark), 0, 0.035, z);
  text(ssd, 'M.2\nNVMe', 0.37, 0.68, 0, 0.053, 0.15);
  for (let i = 0; i < 16; i++) {
    if (i === 9 || i === 10) continue;
    add(ssd, box(0.019, 0.016, 0.1, C.gold, 0), -0.22 + i * 0.029, 0.02, 0.95);
  }
  for (const z of [-0.45, 0.25]) add(ssd, box(0.34, 0.023, 0.37, C.dark), 0, -0.03, z);
  batch(ssd);
  serviceInterior.add(ssd);
  const wifi = owner(new T.Group(), 'wifi');
  wifi.position.set(...LATITUDE_HOME.wifi);
  const wifiPcb = moduleBoard(0.55, 0.75, 0.04, 0x2e6344, -0.315);
  wifiPcb.name = 'Wi-Fi PCB';
  wifi.add(wifiPcb);
  add(wifi, box(0.45, 0.025, 0.44, C.steel), 0, 0.043, 0);
  text(wifi, 'WLAN', 0.4, 0.23, 0, 0.064, 0);
  for (const x of [-0.14, 0.14])
    add(wifi, disk(0.024, 0.025, C.gold), x, 0.077, -0.29);
  for (let i = 0; i < 16; i++) {
    if (i === 9 || i === 10) continue;
    add(
      wifi,
      box(0.019, 0.013, 0.1, C.gold, 0),
      -0.22 + i * 0.029,
      0.023,
      0.325,
    );
  }
  add(wifi, box(0.29, 0.022, 0.22, C.dark), 0, -0.031, -0.02);
  for (const x of [-0.19, 0.19]) for (let i = 0; i < 5; i++)
    add(wifi, box(0.028, 0.008, 0.035, C.gold, 0), x, -0.025, -0.19 + i * 0.075);
  batch(wifi);
  serviceInterior.add(wifi);
  const cooling = owner(new T.Group(), 'fan');
  cooling.position.set(...LATITUDE_HOME.cooling);
  add(cooling, box(1.16, 0.12, 0.74, C.dark), -0.75, 0.04, -1.86);
  const contact = box(0.76, 0.02, 0.4, 0xad703e, 0.008);
  contact.name = 'CPU cooler contact';
  contact.userData.geometryRole = 'cold-plate';
  add(cooling, contact, -0.75, -0.025, -1.86);
  for (const z of [-2.02, -1.79]) {
    const pipe = wire(
      cooling,
      [
        [-0.75, 0.16, z],
        [0.3, 0.16, z],
        [2, 0.16, z + 0.05],
        [2.9, 0.16, -1.6],
        [3.61, 0.16, -0.65],
      ],
      0x282d30,
      0.072,
    );
    pipe.scale.y = 0.35;
    pipe.position.y = 0.104;
  }
  const blower = new T.Group();
  add(blower, disk(0.86, 0.11, C.dark), 2.78, 0.075, -0.55);
  const shroud = new T.Mesh(new T.RingGeometry(0.64, 0.86, 64), mat(0x454c51));
  shroud.rotation.x = -Math.PI / 2;
  add(blower, shroud, 2.78, 0.245, -0.55);
  add(blower, disk(0.64, 0.023, 0x101518), 2.78, 0.14, -0.55);
  for (let i = 0; i < 43; i++) {
    const a = (i * Math.PI * 2) / 43,
      o = box(0.2, 0.04, 0.025, C.dark, 0.006);
    o.rotation.y = -a + 0.45;
    add(blower, o, 2.78 + Math.cos(a) * 0.52, 0.23, -0.55 + Math.sin(a) * 0.52);
  }
  add(blower, disk(0.28, 0.04, C.dark), 2.78, 0.245, -0.55);
  add(blower, box(0.34, 0.23, 1.52, C.dark), 3.7, 0.13, -0.55);
  for (let i = 0; i < 22; i++)
    add(
      blower,
      box(0.019, 0.18, 0.055, C.steel, 0),
      3.88,
      0.13,
      -1.2 + i * 0.06,
    );
  cooling.add(blower);
  for (const [x, z] of [
    [-0.75, -2.26],
    [-0.75, -1.5],
    [1, -2.26],
    [1, -1.5],
    [2.25, -1.16],
    [2.28, 0.04],
    [3.45, 0.13],
  ])
    screw(cooling, x, 0.17, z);
  batch(cooling);
  serviceInterior.add(cooling);
  const speakers = owner(new T.Group(), 'speakers');
  speakers.position.set(...LATITUDE_HOME.speakers);
  for (const x of [-2.92, 2.92]) {
    add(speakers, box(1.35, 0.16, 0.32, C.dark, 0.06), x, 0, 0);
    const surround = new T.Mesh(new T.TorusGeometry(0.105, 0.014, 8, 32), mat(0x363c40));
    surround.rotation.x = Math.PI / 2;
    surround.scale.x = 3.1;
    add(speakers, surround, x, 0.083, 0);
    const diaphragm = disk(0.092, 0.008, 0x242a2e);
    diaphragm.scale.x = 3.1;
    add(speakers, diaphragm, x, 0.082, 0);
    for (let i = 0; i < 18; i++)
      add(speakers, box(0.012, 0.003, 0.18, 0x434a4e, 0), x - 0.29 + i * 0.034, 0.09, 0);
    for (const dx of [-0.56, 0.56]) screw(speakers, x + dx, 0.087, 0);
  }
  batch(speakers);
  serviceInterior.add(speakers);
  // The inner frame and cable routes remain with the chassis.
  const frame = new T.Group();
  for (const x of [-2.47, 3.58])
    add(frame, box(0.09, 0.06, 4.43, C.dark), x, 1.09, 0.06);
  add(frame, box(5.98, 0.06, 0.1, C.dark), 0.59, 1.09, 0.05);
  for (const x of [-3.77, 3.77])
    for (const z of [-2.34, 0.27, 2.38]) screw(frame, x, 1.07, z);
  wire(
    frame,
    [
      [-3.27, 1.15, -1.11],
      [-3.32, 1.12, -2.21],
      [-2.9, 1.11, -2.44],
    ],
    0xc4c7bf,
    0.009,
  );
  wire(
    frame,
    [
      [-2.99, 1.15, -1.1],
      [-2.93, 1.12, -1.95],
      [-2.8, 1.11, -2.44],
    ],
    C.dark,
    0.009,
  );
  batch(frame);
  serviceInterior.add(frame);
  const batteryCable = wire(
      serviceInterior,
      [
        [0.7, 1.11, 0.27],
        [0.68, 1.2, 0.05],
        [0.66, 1.13, -0.36],
      ],
      C.dark,
      0.041,
    ),
    speakerCable = wire(
      serviceInterior,
      [
        [-2.95, 1.08, 2.4],
        [-3.62, 1.13, 2.24],
        [-3.55, 1.12, 0.5],
      ],
      0x923f31,
      0.025,
    ),
    displayCable = wire(
      serviceInterior,
      [
        [1.58, 1.13, -2.4],
        [1.24, 1.17, -2.2],
        [0.88, 1.14, -1.96],
      ],
      C.dark,
      0.044,
    );
  const baseCover = new T.Group();
  baseCover.position.set(0, 1.39, 0);
  add(
    baseCover,
    box(
      LATITUDE_DIMENSIONS.width - 0.02,
      0.06,
      LATITUDE_DIMENSIONS.depth - 0.04,
      C.shell,
      0.1,
    ),
  );
  for (let i = 0; i < 22; i++)
    add(
      baseCover,
      box(0.023, 0.005, 0.65, C.dark, 0),
      1.73 + i * 0.069,
      0.033,
      -0.67,
    );
  for (const z of [-2.21, 2.21])
    add(baseCover, box(5.6, 0.07, 0.095, C.dark, 0.035), 0, 0.06, z);
  for (const x of [-3.65, 3.65])
    for (const z of [-2.35, -0.77, 0.81, 2.35]) screw(baseCover, x, 0.049, z);
  batch(baseCover);
  inside.add(baseCover);
  const serviceDisplay = new T.Group();
  owner(serviceDisplay, 'display');
  add(
    serviceDisplay,
    box(
      LATITUDE_DIMENSIONS.width,
      0.08,
      LATITUDE_DIMENSIONS.depth,
      C.shell,
      0.13,
    ),
    0,
    0.65,
    0,
  );
  inside.add(serviceDisplay);
  const empty = () => new T.Group();
  const teardownParts = [
    step(baseCover, 0, 18, [0, 1.35, 6.5]),
    step(battery, 24, 34, [0, 0.55, 2.65]),
    step(ssd, 30, 46, [-1.8, 0.8, 0.45]),
    step(wifi, 34, 50, [-1.8, 0.65, -0.65]),
    step(ram, 42, 60, [4.4, 0.8, 2.6]),
    step(speakers, 50, 68, [0, 0.5, 2.7]),
    step(cooling, 58, 78, [3.1, 1.3, -2.4]),
    step(board, 90, 100, [0, 1.15, -1.1]),
    step(serviceDisplay, 90, 100, [0, -0.08, -0.2]),
  ];
  const disconnectCables: LaptopInternalCable[] = [
    {
      id: 'battery',
      object: batteryCable,
      at: 24,
      unplugOffset: new T.Vector3(0.18, 0.16, 0.16),
    },
    {
      id: 'speaker',
      object: speakerCable,
      at: 50,
      unplugOffset: new T.Vector3(-0.14, 0.14, 0.12),
    },
    {
      id: 'display',
      object: displayCable,
      at: 90,
      unplugOffset: new T.Vector3(0.12, 0.18, -0.18),
    },
  ];
  inside.visible = false;
  return {
    root,
    outside,
    inside,
    closed,
    ports: ext.ports,
    parts: {
      battery,
      motherboard: board,
      cpu,
      ram,
      ssd,
      cooling,
      wifi,
      speakers,
    },
    batteryMount: battery,
    motherboardMount: board,
    motherboardShell: board,
    serviceDisplayMount: serviceDisplay,
    serviceHingeLeft: empty(),
    serviceHingeRight: empty(),
    serviceWebcam: empty(),
    serviceInputCoverAssembly: baseCover,
    serviceInputCoverCadMount: empty(),
    serviceInputCoverFallback: baseCover,
    serviceInputCoverKeyboard: empty(),
    serviceInputCoverTrackpad: empty(),
    serviceInputCoverUnderside: empty(),
    serviceInterior,
    inputCoverCadMount: empty(),
    displayTopCoverCadMount: empty(),
    displayBezelCadMount: empty(),
    deckFallback: ext.g,
    lidFrameFallback: ext.lid,
    bezelFallback: ext.lid,
    teardownParts,
    disconnectCables,
  };
}
