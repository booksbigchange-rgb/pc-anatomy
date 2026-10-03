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
  ram: [2.91, 1.11, -1.63],
  ssd: [3.64, 0.92, -0.3],
  gpu: [1.66, 1.52, 0.07],
  psu: [1.33, 1.37, 2.05],
};
export const BOARD_TARGETS = {
  'cpu-socket': { name: 'CPU socket', job: 'Holds the processor and connects it to the motherboard.', connects: 'Intel LGA1151 processor' },
  'memory-slots': { name: 'Memory slots', job: 'Hold RAM upright. Match the notch before pressing the module into place.', connects: 'DDR4 memory modules' },
  'expansion-slots': { name: 'Expansion slots', job: 'Connect extra cards, such as a graphics card, to the computer.', connects: 'PCIe expansion cards' },
  'storage-socket': { name: 'M.2 storage socket', job: 'Connects the SSD. A fixed mount supports its other end.', connects: 'M.2 2280 SSD' },
  'sata-ports': { name: 'SATA ports', job: 'Connect data cables for supported hard drives and SATA SSDs.', connects: 'SATA data cable' },
  'clock-battery': { name: 'Clock battery', job: 'Keeps the clock running when the computer is unplugged.', connects: 'Battery holder on the motherboard' },
} as const;
export type BoardTargetId = keyof typeof BOARD_TARGETS;
function markTarget(g: T.Group, start: number, id: BoardTargetId) {
  const target = new T.Group();
  target.name = id;
  target.userData.boardTarget = id;
  for (const child of g.children.slice(start)) target.add(child);
  g.add(target);
}
export const CASE_TARGETS = {
  usb: { name:'USB port', job:'Connects devices and transfers data.', connects:'USB keyboard, mouse or storage device' },
  display: { name:'DisplayPort', job:'Sends video and audio to a compatible screen.', connects:'DisplayPort monitor cable' },
  hdmi: { name:'HDMI port', job:'Sends video and audio to a compatible screen.', connects:'HDMI monitor cable' },
  network: { name:'Ethernet port', job:'Connects the computer to a wired network.', connects:'Ethernet network cable' },
  audio: { name:'Audio socket', job:'Connects compatible audio equipment.', connects:'Matching audio plug' },
  ps2: { name:'PS/2 port', job:'Connects an older keyboard or mouse.', connects:'Matching PS/2 keyboard or mouse' },
  serial: { name:'Serial port', job:'Connects supported older equipment.', connects:'Compatible serial device cable' },
  button: { name:'Power button', job:'Sends a request to start or shut down the computer.', connects:'Front-panel switch lead to the board' },
  optical: { name:'Optical drive bay', job:'Holds the fitted optical drive.', connects:'Supported disc and internal drive connections' },
  chassis: { name:'Case and ventilation', job:'Supports and protects the hardware. Open vents let cooling air pass.', connects:'Side cover, drive cage and component mounting points' },
} as const;
export type CaseTargetId = keyof typeof CASE_TARGETS;
function markCase(g: T.Group, start: number, id: CaseTargetId) {
  const target = new T.Group(); target.name = `case-${id}-${g.children.length}`;
  target.userData.caseTarget = id;
  for (const child of g.children.slice(start)) target.add(child);
  g.add(target);
}
function markRetainer(g: T.Group, start: number, id: string) {
  const target = new T.Group(); target.name=id; target.userData.retainer=id;
  for (const child of g.children.slice(start)) target.add(child);
  g.add(target);
}
export function setHardwareRetainers(board: T.Group, fastened: readonly string[]) {
  for (const name of ['ram-clip-left','ram-clip-right']) {
    const clip=board.getObjectByName(name);
    if (clip) clip.rotation.x=fastened.includes('ram') ? 0 : (name.endsWith('left') ? -.4 : .4);
  }
  const bracket=board.getObjectByName('gpu-retainer');
  if (bracket) bracket.rotation.x=fastened.includes('gpu') ? 0 : .55;
  const screw=board.getObjectByName('ssd-retainer');
  if (screw) screw.position.y=fastened.includes('ssd') ? 0 : .12;
}
const steel = 0xa4a9ac,
  black = 0x090b0d,
  blue = 0x327eb2,
  gold = 0xc9a34d;
function material(color: number) {
  return new T.MeshStandardMaterial({
    color,
    metalness: color === steel || color === gold ? 0.68 : color === black ? 0 : 0.12,
    roughness: color === steel ? 0.38 : color === black ? 0.94 : 0.6,
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
    const outline = new T.Shape();
    outline.moveTo(r * .18, -.035);
    outline.bezierCurveTo(r * .4, -r * .16, r * .75, -r * .32, r * .96, -r * .12);
    outline.bezierCurveTo(r * .88, r * .04, r * .49, r * .2, r * .23, r * .12);
    outline.closePath();
    const blade = new T.Mesh(new T.ExtrudeGeometry(outline, {depth:.024,bevelEnabled:true,bevelSize:.007,bevelThickness:.004,bevelSegments:1,steps:1}),material(0x303638));
    blade.rotation.x = -Math.PI / 2;
    const bladeRoot = new T.Group(); bladeRoot.rotation.y = i * Math.PI * 2 / 7;
    bladeRoot.add(blade);g.add(bladeRoot);
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
      if (ancestor.name === 'cover' || ancestor.name === 'drive-cage' || ancestor.userData.boardTarget || ancestor.userData.caseTarget || ancestor.userData.retainer) return;
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
    // Keep learning targets separate so picking survives geometry batching.
    let start = g.children.length;
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
    markTarget(g, start, 'cpu-socket');
    start = g.children.length;
    for (const x of [0.61, 0.83, 1.05, 1.27]) {
      put(g, box(0.09, 0.15, 2.22, black), x, 0.09, -0.93);
      put(g, box(0.028, 0.004, 2.1, 0x887452), x, 0.169, -0.93);
      for (const z of [-2.03, 0.18]) {
        const clip = new T.Group(); clip.position.set(x, 0.11, z);
        put(clip, box(0.13, 0.19, 0.12, 0xdad8c9));
        if (x === 0.83) { clip.name=z<0 ? 'ram-clip-left' : 'ram-clip-right'; clip.userData.retainer=clip.name; }
        g.add(clip);
      }
    }
    markTarget(g, start, 'memory-slots');
    start = g.children.length;
    for (const [z, c, w] of [
      [0.77, blue, 2.78],
      [1.14, black, 0.65],
      [1.52, black, 2.78],
      [1.83, 0xd8d6c4, 2.5],
    ]) {
      put(g, box(w, 0.13, 0.1, c), -0.18, 0.09, z);
      put(g, box(w - 0.09, 0.005, 0.024, black), -0.18, 0.16, z);
    }
    markTarget(g, start, 'expansion-slots');
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
    start = g.children.length;
    put(g, cyl(0.168, 0.04, steel), 1.26, 0.07, 0.61);
    put(g, cyl(0.186, 0.025, black), 1.26, 0.03, 0.61);
    markTarget(g, start, 'clock-battery');
    start = g.children.length;
    for (const z of [0.8, 1.12, 1.44, 1.72])
      put(g, box(0.16, 0.14, 0.17, black), 1.64, 0.1, z);
    markTarget(g, start, 'sata-ports');
    put(g, box(0.3, 0.19, 0.16, 0xe6e2d4), 1.45, 0.11, 1.85);
    put(g, box(0.25, 0.16, 0.15, 0xe6e2d4), -0.62, 0.1, -1.85);
    start = g.children.length;
    // SSD contacts enter at the negative-z edge; fixture stays on the board.
    put(g, box(0.38, 0.09, 0.13, black), 1.56, 0.13, -0.3);
    put(g, box(0.32, 0.008, 0.045, gold, 0), 1.56, 0.145, -0.26);
    put(g, cyl(0.045, 0.105, gold), 1.56, 0.105, 1.01);
    const screwStart=g.children.length;
    screw(g, 1.56, 0.17, 1.01);
    markRetainer(g,screwStart,'ssd-retainer');
    markTarget(g, start, 'storage-socket');
    // Uneven circuit clusters, with small packages and metal terminations.
    for (const [cx, cz, count] of [[-1.1, -0.12, 7], [-0.45, 0.31, 5], [0.96, 0.32, 6]]) {
      for (let i = 0; i < count; i++) {
        const x = cx + (i % 3) * 0.12, z = cz + Math.floor(i / 3) * 0.095;
        put(g, box(0.045, 0.018, 0.025, i % 2 ? black : 0x9a8260, 0), x, 0.042, z);
        for (const dx of [-0.027, 0.027]) put(g, box(0.01, 0.019, 0.025, steel, 0), x + dx, 0.043, z);
      }
    }
    for (const [x, z, w, d] of [[-1.1, 0.34, 0.2, 0.26], [-0.67, -0.2, 0.24, 0.18], [0.02, -0.38, 0.28, 0.24]]) {
      put(g, box(w, 0.045, d, black), x, 0.055, z);
      for (let i = 0; i < 5; i++) for (const side of [-1, 1])
        put(g, box(0.026, 0.013, 0.018, steel, 0), x + side * (w / 2 + 0.012), 0.038, z - d * 0.35 + i * d * 0.17);
    }
    for (const [x, z] of [
      [-1.55, -1.76],
      [1.57, -1.76],
      [-1.55, 1.75],
      [1.57, 1.75],
    ])
      screw(g, x, 0.075, z);
    for(let i=0;i<12;i++) {
      const z=-.08+i*.038;
      put(g,box(.64,.002,.006,0x52826c,0),.2,.056,z);
      put(g,box(.006,.002,.28,0x52826c,0),.52,.056,z-.14);
      put(g,cyl(.012,.004,gold),.52,.058,z-.28);
    }
    for(let i=0;i<18;i++) {
      const x=-1.38+(i%6)*.23,z=.38+Math.floor(i/6)*.12;
      put(g,box(.047,.025,.024,0x6c6e67,0),x,.06,z);
      for(const dx of [-.029,.029])put(g,box(.012,.022,.023,steel,0),x+dx,.06,z);
    }
    label(g, 'Q170 / LGA1151', 0.86, 0.22, -0.48, 0.055, 0.34);
  }
  if (id === 'cpu') {
    put(g, box(0.62, 0.06, 0.62, 0x315445));
    put(g, box(0.55, 0.05, 0.55, steel), 0, 0.055, 0);
    put(g,box(.065,.004,.065,gold,0),-.22,.082,-.22);
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
    const edge = new T.Shape();
    edge.moveTo(-1.11,-.26); edge.lineTo(.09,-.26); edge.lineTo(.09,-.19); edge.lineTo(.21,-.19); edge.lineTo(.21,-.26);
    edge.lineTo(1.11,-.26); edge.lineTo(1.11,.26); edge.lineTo(-1.11,.26); edge.closePath();
    const board = new T.Mesh(new T.ExtrudeGeometry(edge,{depth:.042,bevelEnabled:false}),material(0x25543e));
    board.rotation.y=Math.PI/2; put(g,board,-.021,0,0);
    for (const x of [-0.04, 0.04])
      for (let z = -0.85; z < 1; z += 0.255)
        put(g, box(0.03, 0.24, 0.2, black), x, 0.07, z);
    for (let z = -1.02; z < 1.04; z += 0.041) {
      if (Math.abs(z + 0.15) < 0.06) continue;
      put(g, box(0.046, 0.095, 0.025, gold, 0), 0, -0.21, z);
    }
    const sticker = box(0.016, 0.21, 0.75, 0xe8e9df);
    put(g, sticker, 0.059, 0.03, 0.15);
  }
  if (id === 'ssd') {
    const outline = new T.Shape();
    outline.moveTo(-0.1835, -0.6665); outline.lineTo(0.1835, -0.6665);
    outline.lineTo(0.1835, 0.6665); outline.lineTo(-0.1835, 0.6665); outline.closePath();
    const mountingHole = new T.Path(); mountingHole.absarc(0, 0.61, 0.045, 0, Math.PI * 2, true);
    outline.holes.push(mountingHole);
    const pcb = new T.Mesh(new T.ExtrudeGeometry(outline, { depth:0.036, bevelEnabled:false }), material(0x21563c));
    pcb.rotation.x = Math.PI / 2;
    put(g, pcb, 0, 0.018, 0);
    for (const z of [-0.36, 0.06, 0.42])
      put(g, box(0.25, 0.05, 0.28, black), 0, 0.043, z);
    for (let x = -0.15; x < 0.17; x += 0.028)
      put(g, box(0.018, 0.038, 0.095, gold, 0), x, 0, -0.7);

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
    const bracketStart=g.children.length;
    put(g,box(.15,.10,.18,blue),-1.37,.97,0);
    markRetainer(g,bracketStart,'gpu-retainer');
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
    put(g, box(.024,.32,.39,black),-1.095,.04,0);
    put(g, box(.018,.23,.28,0x353c40),-1.112,.04,0);
    for(const [y,z] of [[-.04,.07],[.12,.07],[.04,-.07]])put(g,box(.012,.034,.06,steel,0),-1.116,y,z);
    for(const [y,z] of [[-.43,-.5],[.43,-.5],[.43,.5]]) {const head=cyl(.039,.014,steel);head.rotation.z=Math.PI/2;put(g,head,-1.096,y,z);}
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
  const batchTargets = (root: T.Group) => {
    for (const child of root.children) if (child instanceof T.Group) { batchTargets(child); if (child.userData.boardTarget || child.userData.retainer) shadows(child); }
  };
  batchTargets(g);
  return shadows(g);
}
/** A formed panel with real through openings, in its own XY plane. */
function panel(w: number, h: number, depth: number, holes: [number, number, number, number][], color = steel) {
  const shape = new T.Shape();
  shape.moveTo(-w / 2, -h / 2); shape.lineTo(w / 2, -h / 2);
  shape.lineTo(w / 2, h / 2); shape.lineTo(-w / 2, h / 2); shape.closePath();
  for (const [x, y, hw, hh] of holes) {
    const hole = new T.Path();
    hole.moveTo(x - hw / 2, y - hh / 2); hole.lineTo(x - hw / 2, y + hh / 2);
    hole.lineTo(x + hw / 2, y + hh / 2); hole.lineTo(x + hw / 2, y - hh / 2); hole.closePath();
    shape.holes.push(hole);
  }
  return new T.Mesh(new T.ExtrudeGeometry(shape, { depth, bevelEnabled: false }), material(color));
}
/** Rear-facing ports: open socket shells, inset contacts and shaped connector profiles. */
function rearSocket(g: T.Group, x: number, y: number, z: number, w: number, h: number, kind: 'usb' | 'display' | 'hdmi' | 'network' | 'serial') {
  const start=g.children.length;
  const holes: [number, number, number, number][] = [[0, 0, w - .04, h - .04]];
  const shell = panel(w, h, .055, holes);
  shell.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(new T.Vector3(0, 1, 0), new T.Vector3(0, 0, 1), new T.Vector3(1, 0, 0)));
  put(g, shell, x, y, z);
  put(g, box(.013, w - .04, h - .04, black, 0), x + .027, y, z);
  if (kind === 'usb') {
    put(g, box(.016, w - .08, .035, 0x28628d, 0), x + .015, y, z + .015);
    for (let i = 0; i < 4; i++) put(g, box(.012, .016, .009, gold, 0), x + .007, y - w / 2 + .075 + i * .033, z + .012);
  } else if (kind === 'network') {
    for (let i = 0; i < 8; i++) put(g, box(.018, .01, .06, gold, 0), x + .021, y - .09 + i * .026, z);
    for (const dy of [-w / 2 + .025, w / 2 - .025]) put(g, box(.01, .025, .024, 0x75a04b, 0), x - .005, y + dy, z + h / 2 - .03);
  } else if (kind === 'display' || kind === 'hdmi') {
    put(g, box(.016, w - .08, .024, 0x55595c, 0), x + .023, y, z);
    for (let i = 0; i < 10; i++) put(g, box(.01, .008, .009, gold, 0), x + .009, y - w / 2 + .06 + i * (w - .12) / 10, z);
  } else {
    for (const dy of [-1, 1]) for (let i = 0; i < (dy < 0 ? 5 : 4); i++) {
      const pin = cyl(.012, .028, gold); pin.rotation.z = Math.PI / 2;
      put(g, pin, x + .018, y - .13 + i * .064, z + dy * .035);
    }
  }
  markCase(g,start,kind);
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
  // Interior steel with separate painted exterior skins and folded edge seams.
  put(g, box(274 / 60, .075, 350 / 60, steel), cx, base, 0);
  put(g, box(274 / 60, .018, 350 / 60, black), cx, base - .045, 0);
  for (const z of [-zmax, zmax]) {
    put(g, box(274 / 60, 154 / 60, .055, steel), cx, (base + top) / 2, z);
    put(g, box(274 / 60, 154 / 60, .012, black), cx, (base + top) / 2, z + Math.sign(z) * .036);
    put(g, box(274 / 60, .055, .12, steel), cx, top - .045, z - Math.sign(z) * .06);
  }
  // The rear sheet is continuous around I/O, expansion and PSU openings.
  const rearHoles: [number, number, number, number][] = [
    [.25, -1.95, 1.25, 1.65], // CPU exhaust field
    [-.79, -1.55, .55, 2.35], // motherboard I/O shield
    [-.493, 2.05, 1.11, 1.28], // OEM supply
  ];
  for (let i = 0; i < 4; i++) rearHoles.push([-.1, .07 + i * .35, 1.75, .24]);
  // Panel XY axes map to case width and height; thickness points rearward.
  const rear = panel(154 / 60, 350 / 60, .035, rearHoles);
  rear.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(new T.Vector3(0, 1, 0), new T.Vector3(0, 0, 1), new T.Vector3(1, 0, 0)));
  put(g, rear, back - .025, (base + top) / 2, 0);
  // Exhaust grille made from steel, so it no longer floats on an empty opening.
  for (let z = -2.76; z < -1.15; z += .1) put(g, box(.035, 1.25, .023, steel, 0), back - .035, 2.113, z);
  for (let y = 1.49; y <= 2.7; y += .1) put(g, box(.035, .023, 1.65, steel, 0), back - .035, y, -1.95);
  const exhaust = fan(1.23); exhaust.rotation.z = Math.PI / 2;
  put(g, exhaust, back + .12, 2.08, -1.95);
  // I/O plate: six USB, two DisplayPort, Ethernet, serial, PS/2 and line-out.
  const io = new T.Group();
  put(io, box(.022, .56, 2.35, steel), back - .047, 1.073, -1.55);
  const face = back - .084;
  for (const [y, z] of [[.93,-1.13],[1.2,-1.13],[.93,-.92],[1.2,-.92],[.93,-.69],[.93,-.48]]) rearSocket(io, face, y, z, .22, .12, 'usb');
  // Two lower USB sockets are black USB 2.0; four upper sockets are USB 3.0.
  for (const z of [-.69,-.48]) put(io,box(.012,.14,.035,black,0),face-.005,.93,z+.015);
  rearSocket(io, face, 1.2, -.6, .23, .3, 'network');
  for (const z of [-2.09, -1.86]) rearSocket(io, face, 1.05, z, .29, .12, 'display');
  rearSocket(io, face, 1.05, -2.34, .29, .12, 'hdmi'); // HDMI
  rearSocket(io, face, 1.05, -1.61, .39, .17, 'serial');
  for (const [y, z, c] of [[.93,-1.37,0x936cb6],[1.2,-1.37,0x519350],[1.05,-2.58,0x519350]]) {
    const start=io.children.length;
    const rim = new T.Mesh(new T.TorusGeometry(.065,.014,8,24), material(c)); rim.rotation.y = Math.PI / 2;
    put(io, rim, face-.012,y,z);
    const dark = cyl(.047,.014,black); dark.rotation.z = Math.PI / 2; put(io,dark,face,y,z);
    if(z === -1.37)for(const dy of [-.025,0,.025])for(const dz of [-.02,.02]){const contact=cyl(.005,.01,steel);contact.rotation.z=Math.PI/2;put(io,contact,face-.01,y+dy,z+dz);}
    markCase(io,start,z===-1.37 ? 'ps2' : 'audio');
  }
  g.add(io);
  for (let i = 0; i < 4; i++) {
    const z = .07 + i * .35;
    // Vented slot covers; one is replaced by the installed graphics bracket.
    put(g, box(.026, 1.74, .22, steel), back - .018, 1.76, z);
    for (let y = 1.04; y < 2.51; y += .11) put(g, box(.012,.06,.13,black,0),back-.038,y,z);
  }
  put(g, box(.05,.14,1.46,steel),back-.045,2.79,.6);
  for (const z of [-2.73,1.34,2.72]) { const fastener = cyl(.045,.035,steel); fastener.rotation.z=Math.PI/2;put(g,fastener,back-.056,2.96,z); }
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
    const start=g.children.length;
    const y = base + 0.43 + i * 0.39;
    put(g, box(0.031, 0.3, 0.15, 0x747b7e), front + 0.098, y, -0.76);
    put(
      g,
      box(0.035, 0.23, 0.085, i > 1 ? 0x1b6895 : black),
      front + 0.12,
      y,
      -0.76,
    );
    markCase(g,start,'usb');
  }
  const power = cyl(0.115, 0.028, steel);
  power.rotation.z = Math.PI / 2;
  put(g, power, front + 0.11, 2.76, -0.78);
  markCase(g,g.children.length-1,'button');
  const audio = cyl(0.055, 0.035, black);
  audio.rotation.z = Math.PI / 2;
  put(g, audio, front + 0.11, 2.29, -0.76);
  markCase(g,g.children.length-1,'audio');
  // Hinged front door carries the drive cage. Closed it covers the front half
  // of the board; open it swings about the long front edge, exposing DIMMs.
  const driveCage = new T.Group(); driveCage.name = 'drive-cage';
  driveCage.position.set(front - .12, top - .16, 0);
  const cageSkin = panel(1.4,5.45,.035,[[-.48,-2.35,.14,.22],[-.48,.12,.14,.22],[-.48,2.3,.14,.22],[.46,-2.35,.17,.22],[.46,2.3,.17,.22]]);
  cageSkin.rotation.x = -Math.PI / 2; put(driveCage,cageSkin,-.72,0,0);
  for (const z of [-1.43,1.32]) {
    put(driveCage,box(1.15,.022,2.05,0x929da2),-.73,.04,z);
    for (const x of [-1.3,-.16]) put(driveCage,box(.03,.06,2.1,steel),x,.06,z);
    for(const dz of [-1.04,1.04])put(driveCage,box(1.17,.06,.03,steel),-.73,.06,z+dz);
    for(let i=0;i<5;i++)put(driveCage,box(.48,.01,.014,0x737e83,0),-.72,.056,z-.4+i*.19);
  }
  // Folded cage sides, mounting windows, latch and blue tool-free sled.
  for(const x of [-1.4,-.04])put(driveCage,box(.04,.67,5.45,steel),x,-.32,0);
  for(const z of [-2.64,-.37,.37,2.64])put(driveCage,box(1.36,.62,.035,steel),-.72,-.32,z);
  for(const x of [-1.3,-.16])put(driveCage,box(.07,.1,2.12,blue),x,-.58,1.32);
  for(const z of [.26,2.38])put(driveCage,box(.21,.21,.12,blue),-1.43,-.52,z);
  put(driveCage,box(.3,.07,.35,blue),-1.18,.08,-.15);
  // Optical unit rides behind the upper front slot.
  put(driveCage,box(1.18,.32,2.12,0x778287),-.72,-.22,-1.43);
  for(const z of [-2.4,-.9,1.3,2.5]) { const hinge=cyl(.055,.25,steel); hinge.rotation.x=Math.PI/2;put(g,hinge,front-.12,top-.16,z); }
  shadows(driveCage); driveCage.rotation.z = -Math.PI / 2.4; g.add(driveCage);
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
  put(cover, box(0.35, 0.06, 0.48, 0x454b50), back + 0.32, top + 0.085, -2.46);
  for (let z = -0.55; z < 0.6; z += 0.11)
    put(cover, box(1.4, 0.012, 0.032, 0x404548), 1.48, top + 0.07, z);
  shadows(cover);
  cover.visible = false;
  g.add(cover);
  const batchCaseTargets = (root: T.Group) => {
    for (const child of root.children) if (child instanceof T.Group) { batchCaseTargets(child); if (child.userData.caseTarget) shadows(child); }
  };
  batchCaseTargets(g);
  return { group: shadows(g), cover, driveCage };
}

