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
    roughness: c === C.dark ? 0.82 : 0.57,
    metalness: c === C.steel ? 0.65 : c === C.shell ? 0.3 : 0.08,
  });
}
function box(w: number, h: number, d: number, c: number, r = 0.02) {
  return new T.Mesh(
    new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 4, h / 4, d / 4)),
    mat(c),
  );
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
  words.split('\n').forEach((s, i) => ctx.fillText(s, 32, 94 + i * 93));
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
    if (!(o.material instanceof T.MeshStandardMaterial) || o.material.map)
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
  const sx = Math.sign(x);
  if (!round) {
    for (const dz of [-w / 2, w / 2])
      add(g, box(0.04, h + 0.025, 0.02, C.steel), x, 0.84, z + dz);
    for (const dy of [-h / 2, h / 2])
      add(g, box(0.04, 0.018, w, C.steel), x, 0.84 + dy, z);
    add(g, box(0.018, 0.022, w * 0.75, C.blue, 0), x + sx * 0.038, 0.85, z);
  } else {
    const ring = new T.Mesh(
      new T.TorusGeometry(w / 2, 0.018, 8, 32),
      mat(C.steel),
    );
    ring.rotation.y = Math.PI / 2;
    add(g, ring, x + sx * 0.035, 0.84, z);
  }
  return o;
}
function exterior() {
  const g = new T.Group(),
    w = LATITUDE_DIMENSIONS.width,
    d = LATITUDE_DIMENSIONS.depth;
  add(g, box(w, 0.34, d, C.shell, 0.13), 0, 0.84, 0);
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
    ['Ctrl', 'Fn', 'Win', 'Alt', 'Space', 'Alt', 'Ctrl', '←', '↑', '↓', '→'],
  ];
  for (let row = 0; row < rows.length; row++) {
    let x = -3.22;
    for (let i = 0; i < rows[row].length; i++) {
      const k = rows[row][i],
        kw =
          k === 'Space'
            ? 2.3
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
  g.add(batch(keyboard));
  const trackpad = owner(new T.Group(), 'trackpad');
  add(trackpad, box(2.6, 0.025, 1.32, 0x4f595f, 0.055), 0, 1.082, 1.15);
  for (const x of [-0.65, 0.65])
    add(trackpad, box(1.26, 0.02, 0.25, 0x646f76), x, 1.087, 0.34);
  g.add(batch(trackpad));
  add(g, box(0.39, 0.022, 0.18, C.dark, 0.045), 3.34, 1.09, -1.96);
  const lid = owner(new T.Group(), 'display');
  lid.position.set(0, 1.03, -2.54);
  lid.rotation.x = -0.17;
  add(lid, box(w - 0.07, 5.1, 0.1, C.shell, 0.12), 0, 2.55, -0.07);
  add(lid, box(w - 0.22, 4.97, 0.05, C.dark, 0.09), 0, 2.55, 0);
  const screen = box(
    LATITUDE_DIMENSIONS.screenWidth,
    LATITUDE_DIMENSIONS.screenHeight,
    0.016,
    0x153848,
    0.015,
  );
  add(lid, screen, 0, 2.67, 0.039);
  const lens = disk(0.047, 0.024, 0x0b1216);
  lens.rotation.x = Math.PI / 2;
  add(lid, lens, 0, 4.96, 0.041);
  add(lid, box(0.13, 0.014, 0.015, 0x39474d), 0.16, 4.96, 0.053);
  for (const x of [-2.9, 2.9])
    add(g, box(0.84, 0.23, 0.33, 0x525d63, 0.055), x, 1.0, -2.56);
  g.add(batch(lid));
  const ports = [
    port(g, 'power-left', -w / 2 - 0.035, -2.15, 0.2, 0.2, true),
    port(g, 'usb-rear-right', w / 2 + 0.035, -0.77, 0.33, 0.17),
    port(g, 'usb-front-right', w / 2 + 0.035, -0.23, 0.33, 0.17),
    port(g, 'hdmi-left', w / 2 + 0.035, -1.34, 0.4, 0.14),
    port(g, 'audio-right', w / 2 + 0.035, 0.4, 0.14, 0.14, true),
  ];
  port(g, 'usb-c-left', -w / 2 - 0.035, -1.67, 0.22, 0.11);
  port(g, 'usb-a-left', -w / 2 - 0.035, -1.2, 0.33, 0.17);
  port(g, 'ethernet-right', w / 2 + 0.035, -1.9, 0.36, 0.26);
  for (let i = 0; i < 14; i++)
    add(
      g,
      box(0.016, 0.16, 0.07, C.dark, 0),
      -w / 2 - 0.049,
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
  const base = owner(new T.Group(), 'motherboard');
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
  const pcb = new T.Mesh(
    new T.ExtrudeGeometry(shape, { depth: 0.045, bevelEnabled: false }),
    mat(C.board),
  );
  pcb.rotation.x = Math.PI / 2;
  board.add(pcb);
  for (let i = 0; i < 70; i++) {
    const x = -3.42 + (i % 14) * 0.42,
      z = -1.14 + Math.floor(i / 14) * 0.35;
    if (x > 1.7 && z > -0.2) continue;
    add(
      board,
      box(0.1, 0.045, 0.075, i % 4 ? C.dark : C.steel, 0.007),
      x,
      0.052,
      z,
    );
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
    add(board, box(1.66, 0.065, 0.14, 0xd9d7ca), x, 0.07, 0.27);
    for (const dx of [-0.85, 0.85])
      add(board, box(0.04, 0.06, 0.58, C.steel), x + dx, 0.065, 0.3);
  }
  for (const z of [2.96, 1.22]) {
    add(board, box(0.58, 0.075, 0.14, C.dark), -3.13, 0.065, z);
    screw(board, -3.13, 0.07, z - 1.48);
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
        box(0.016, 0.04, 0.13, C.gold, 0),
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
  for (const x of [-1.85, 0, 1.85])
    add(battery, box(1.78, 0.018, 1.92, 0x252b2f, 0.02), x, 0.127, 0);
  text(
    battery,
    '68 Wh · 4 CELL\nLatitude 5410\nDISCONNECT BEFORE SERVICE\nTEACHING REFERENCE',
    3.6,
    1.28,
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
  batch(ram);
  serviceInterior.add(ram);
  const ssd = owner(new T.Group(), 'ssd');
  ssd.position.set(...LATITUDE_HOME.ssd);
  add(ssd, box(0.55, 0.036, 2, 0x23734e));
  for (const z of [-0.68, -0.2, 0.38])
    add(ssd, box(0.37, 0.03, 0.4, C.dark), 0, 0.035, z);
  text(ssd, 'M.2\nNVMe', 0.37, 0.68, 0, 0.053, 0.15);
  for (let i = 0; i < 16; i++)
    add(ssd, box(0.019, 0.016, 0.1, C.gold, 0), -0.22 + i * 0.029, 0.02, 0.98);
  screw(ssd, 0, 0.035, -0.94);
  batch(ssd);
  serviceInterior.add(ssd);
  const wifi = owner(new T.Group(), 'wifi');
  wifi.position.set(...LATITUDE_HOME.wifi);
  add(wifi, box(0.55, 0.04, 0.75, 0x2e6344));
  add(wifi, box(0.45, 0.035, 0.56, C.steel), 0, 0.043, 0);
  text(wifi, 'WLAN', 0.4, 0.23, 0, 0.064, 0);
  for (const x of [-0.14, 0.14])
    add(wifi, disk(0.024, 0.025, C.gold), x, 0.077, -0.29);
  batch(wifi);
  serviceInterior.add(wifi);
  const cooling = owner(new T.Group(), 'fan');
  cooling.position.set(...LATITUDE_HOME.cooling);
  add(cooling, box(1.16, 0.12, 0.74, C.dark), -0.75, 0.07, -1.86);
  for (const z of [-2.02, -1.79])
    wire(
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
  const blower = new T.Group();
  add(blower, disk(0.86, 0.16, C.dark), 2.78, 0.1, -0.55);
  add(blower, disk(0.64, 0.023, 0x3a4045), 2.78, 0.2, -0.55);
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
    for (let i = 0; i < 9; i++)
      add(
        speakers,
        box(0.064, 0.007, 0.18, 0x3c464c, 0),
        x - 0.38 + i * 0.095,
        0.085,
        0,
      );
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
    step(baseCover, 0, 18, [0, 1.35, 3.2]),
    step(battery, 24, 34, [0, 0.35, 3.15]),
    step(ssd, 30, 46, [-1.1, 0.6, 1.5]),
    step(wifi, 34, 50, [-1.1, 0.4, -0.4]),
    step(ram, 42, 60, [0, 0.45, 2.3]),
    step(speakers, 50, 68, [0, 0.25, 0.45]),
    step(cooling, 58, 78, [0, 0.75, -0.8]),
    step(board, 84, 100, [0, 0.65, -0.1]),
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
