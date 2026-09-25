import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export type RealisticLaptopInternalId =
  | 'battery'
  | 'motherboard'
  | 'cpu'
  | 'ram'
  | 'ssd'
  | 'fan'
  | 'wifi'
  | 'speakers';

const C = {
  shell: 0x69747a,
  shellDark: 0x343d42,
  pcb: 0x24594e,
  pcbEdge: 0x1d473f,
  chip: 0x171c1f,
  chipSoft: 0x2b3236,
  shield: 0xadb4b7,
  copper: 0xba794a,
  gold: 0xc6a15a,
  battery: 0x30383d,
  ram: 0x31594f,
  ssd: 0x3a5b52,
  wifi: 0x3e6257,
  speaker: 0x22292d,
  connector: 0xe2e4df,
};

function material(
  color: number,
  roughness = 0.5,
  metalness = 0.15,
) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function mesh(
  geometry: THREE.BufferGeometry,
  color: number,
  roughness = 0.5,
  metalness = 0.15,
) {
  return new THREE.Mesh(geometry, material(color, roughness, metalness));
}

function rounded(
  width: number,
  height: number,
  depth: number,
  radius: number,
  color: number,
  roughness = 0.5,
  metalness = 0.15,
) {
  return mesh(
    new RoundedBoxGeometry(width, height, depth, 4, radius),
    color,
    roughness,
    metalness,
  );
}

function tag(group: THREE.Group, id: RealisticLaptopInternalId) {
  group.userData.laptopPart = id;
  group.traverse((object) => {
    if (!('isMesh' in object) || !(object as THREE.Mesh).isMesh) return;
    const item = object as THREE.Mesh;
    item.castShadow = true;
    item.receiveShadow = true;
    const materials = Array.isArray(item.material)
      ? item.material
      : [item.material];
    for (const value of materials) {
      if (value instanceof THREE.MeshStandardMaterial) {
        value.emissive = new THREE.Color(0x000000);
        value.emissiveIntensity = 0;
      }
    }
  });
  return group;
}

function chip(
  width: number,
  depth: number,
  height = 0.12,
  color = C.chip,
) {
  return rounded(width, height, depth, 0.035, color, 0.45, 0.18);
}

function boardShape() {
  // Representative Framework Laptop 13 mainboard silhouette based on the
  // published 2D mechanical drawing: wide rear edge, port cut-ins and a
  // forward-right step around the battery/storage region.
  const shape = new THREE.Shape();
  shape.moveTo(-3.05, -1.22);
  shape.lineTo(2.95, -1.22);
  shape.lineTo(2.95, -0.45);
  shape.lineTo(2.55, -0.45);
  shape.lineTo(2.55, 0.42);
  shape.lineTo(1.55, 0.42);
  shape.lineTo(1.55, 1.12);
  shape.lineTo(0.15, 1.12);
  shape.lineTo(0.15, 0.78);
  shape.lineTo(-1.15, 0.78);
  shape.lineTo(-1.15, 1.15);
  shape.lineTo(-2.35, 1.15);
  shape.lineTo(-2.35, 0.58);
  shape.lineTo(-3.05, 0.58);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.075,
    bevelEnabled: false,
    curveSegments: 1,
  });
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, 0.0375, 0);
  return geometry;
}

function addBoardDetails(group: THREE.Group) {
  // CPU-side VRM stages / inductors.
  for (const [x, z] of [
    [-1.42, -0.55],
    [-1.08, -0.55],
    [-0.74, -0.55],
    [-1.42, -0.2],
    [-1.08, -0.2],
  ] as const) {
    const block = chip(0.22, 0.22, 0.15, 0x4a5053);
    block.position.set(x, 0.15, z);
    group.add(block);
  }

  // Embedded controller / I/O controller / power ICs.
  for (const [x, z, w, d] of [
    [0.45, -0.78, 0.36, 0.32],
    [1.15, -0.75, 0.28, 0.28],
    [1.85, -0.72, 0.33, 0.31],
    [2.25, -0.7, 0.24, 0.24],
    [-2.35, -0.55, 0.3, 0.26],
    [-2.72, -0.2, 0.22, 0.22],
  ] as const) {
    const item = chip(w, d, 0.1);
    item.position.set(x, 0.13, z);
    group.add(item);
  }

  // Small passive component banks. These are intentionally individual
  // components so the board reads like real electronics rather than a slab.
  const passiveGeometry = new RoundedBoxGeometry(0.075, 0.055, 0.035, 2, 0.008);
  for (let row = 0; row < 6; row++) {
    for (let column = 0; column < 10; column++) {
      const passive = mesh(
        passiveGeometry.clone(),
        (row + column) % 3 === 0 ? 0xa99779 : 0x343b3f,
        0.55,
        0.08,
      );
      passive.position.set(-2.35 + column * 0.46, 0.115, -0.98 + row * 0.34);
      passive.rotation.y = (column % 2) * Math.PI / 2;
      group.add(passive);
    }
  }

  // USB-C / expansion-card edge connectors.
  for (const x of [-2.72, -1.96, 1.98, 2.72]) {
    const connector = rounded(0.48, 0.19, 0.28, 0.045, 0xb5bdc0, 0.28, 0.58);
    connector.position.set(x, 0.12, -1.24);
    group.add(connector);
  }

  // Board headers represented from Framework's published interface set:
  // battery, fan/speaker JST, display/webcam and input-cover connectors.
  for (const [x, z, w, d, color] of [
    [0.3, 0.76, 0.66, 0.18, 0x202529],
    [-2.2, 0.42, 0.32, 0.18, C.connector],
    [2.1, 0.2, 0.32, 0.18, C.connector],
    [1.1, 0.54, 0.82, 0.12, 0xd7d9d4],
    [-0.9, 0.48, 0.72, 0.12, 0xd7d9d4],
  ] as const) {
    const connector = rounded(w, 0.09, d, 0.02, color, 0.42, 0.12);
    connector.position.set(x, 0.115, z);
    group.add(connector);
  }

  // Gold mounting pads.
  for (const [x, z] of [
    [-2.75, -0.93],
    [2.65, -0.93],
    [-2.05, 0.87],
    [1.25, 0.82],
  ] as const) {
    const pad = mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.025, 20),
      C.gold,
      0.28,
      0.6,
    );
    pad.position.set(x, 0.105, z);
    group.add(pad);
  }
}

function buildMotherboard() {
  const group = new THREE.Group();
  const shell = new THREE.Group();

  const pcb = mesh(boardShape(), C.pcb, 0.56, 0.06);
  shell.add(pcb);

  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(boardShape(), 20),
    new THREE.LineBasicMaterial({ color: C.pcbEdge }),
  );
  edge.position.y = 0.012;
  shell.add(edge);

  group.add(shell);
  addBoardDetails(group);
  group.position.set(0.15, 1.02, -0.92);
  return { group: tag(group, 'motherboard'), shell };
}

function buildCpu() {
  const group = new THREE.Group();

  const substrate = rounded(0.82, 0.06, 0.82, 0.045, 0x244f45, 0.44, 0.12);
  group.add(substrate);

  const packageTop = rounded(0.58, 0.08, 0.58, 0.04, 0x9da1a0, 0.25, 0.68);
  packageTop.position.y = 0.07;
  group.add(packageTop);

  const die = rounded(0.3, 0.04, 0.28, 0.025, 0x474d51, 0.18, 0.52);
  die.position.y = 0.13;
  group.add(die);

  group.position.set(-0.95, 1.18, -1.28);
  return tag(group, 'cpu');
}

function buildRam() {
  const group = new THREE.Group();

  for (const z of [-0.22, 0.36]) {
    const slot = rounded(1.95, 0.12, 0.17, 0.025, 0x292f32, 0.5, 0.14);
    slot.position.set(0, 0.02, z);
    group.add(slot);

    const ramModule = rounded(1.78, 0.43, 0.07, 0.025, C.ram, 0.52, 0.06);
    ramModule.position.set(0, 0.24, z);
    group.add(ramModule);

    for (const x of [-0.6, -0.2, 0.2, 0.6]) {
      const memoryChip = chip(0.29, 0.045, 0.23);
      memoryChip.rotation.x = Math.PI / 2;
      memoryChip.position.set(x, 0.25, z + 0.04);
      group.add(memoryChip);
    }

    for (let index = 0; index < 18; index++) {
      const contact = rounded(0.035, 0.18, 0.014, 0.003, C.gold, 0.3, 0.55);
      contact.position.set(-0.72 + index * 0.085, 0.04, z - 0.04);
      group.add(contact);
    }
  }

  group.position.set(0.65, 1.18, -0.88);
  return tag(group, 'ram');
}

function buildSsd() {
  const group = new THREE.Group();

  // 22 x 80 mm M.2 2280 proportions scaled to the Laptop Lab chassis.
  const pcb = rounded(2.03, 0.055, 0.56, 0.025, C.ssd, 0.52, 0.05);
  group.add(pcb);

  for (const x of [-0.55, -0.12, 0.32]) {
    const nand = chip(0.34, 0.38, 0.09);
    nand.position.set(x, 0.08, 0);
    group.add(nand);
  }
  const controller = chip(0.28, 0.28, 0.1, 0x1d2326);
  controller.position.set(0.7, 0.08, 0);
  group.add(controller);

  for (let index = 0; index < 10; index++) {
    const finger = rounded(0.035, 0.035, 0.3, 0.004, C.gold, 0.28, 0.6);
    finger.position.set(-1.0 + index * 0.047, 0.03, 0);
    group.add(finger);
  }

  const screw = mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.035, 18),
    0xb8bec1,
    0.25,
    0.66,
  );
  screw.position.set(0.97, 0.08, 0);
  group.add(screw);

  group.position.set(1.95, 1.17, 0.12);
  group.rotation.y = -0.08;
  return tag(group, 'ssd');
}

function buildWifi() {
  const group = new THREE.Group();

  // 22 x 30 mm M.2 2230 proportions.
  const pcb = rounded(0.76, 0.055, 0.56, 0.025, C.wifi, 0.52, 0.05);
  group.add(pcb);

  const shield = rounded(0.48, 0.055, 0.36, 0.025, C.shield, 0.3, 0.58);
  shield.position.y = 0.065;
  group.add(shield);

  for (const x of [-0.18, 0.18]) {
    const antennaSocket = mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.025, 16),
      C.gold,
      0.25,
      0.6,
    );
    antennaSocket.position.set(x, 0.105, -0.2);
    group.add(antennaSocket);
  }

  const antennaMaterial = material(0xd1d4d5, 0.55, 0.22);
  for (const offset of [-0.18, 0.18]) {
    const cable = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(offset, 0.11, -0.2),
          new THREE.Vector3(offset - 0.4, 0.15, -0.62),
          new THREE.Vector3(offset - 0.72, 0.16, -1.32),
        ]),
        20,
        0.012,
        6,
        false,
      ),
      antennaMaterial.clone(),
    );
    group.add(cable);
  }

  group.position.set(-2.3, 1.15, 0.05);
  return tag(group, 'wifi');
}

function buildCooling() {
  const group = new THREE.Group();

  const fanRadius = 0.64;
  const housing = mesh(
    new THREE.CylinderGeometry(fanRadius, fanRadius, 0.16, 40),
    0x242b2f,
    0.38,
    0.28,
  );
  housing.rotation.x = Math.PI / 2;
  group.add(housing);

  const hub = mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 0.18, 24),
    0x414b50,
    0.42,
    0.22,
  );
  hub.rotation.x = Math.PI / 2;
  group.add(hub);

  for (let index = 0; index < 12; index++) {
    const blade = rounded(0.11, 0.035, 0.42, 0.035, 0x58666d, 0.42, 0.12);
    blade.rotation.y = (Math.PI * 2 * index) / 12 + 0.24;
    blade.translateZ(0.31);
    blade.position.y = 0.09;
    group.add(blade);
  }

  // Dual heat-pipe path from CPU area to fin stack.
  for (const offset of [-0.07, 0.07]) {
    const heatPipe = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-2.0, 0.14 + offset, -0.15),
          new THREE.Vector3(-1.35, 0.18 + offset, -0.12),
          new THREE.Vector3(-0.7, 0.16 + offset, 0),
          new THREE.Vector3(-0.1, 0.13 + offset, 0.02),
        ]),
        32,
        0.045,
        10,
        false,
      ),
      material(C.copper, 0.28, 0.68),
    );
    group.add(heatPipe);
  }

  const coldPlate = rounded(0.95, 0.07, 0.95, 0.07, C.copper, 0.3, 0.72);
  coldPlate.position.set(-2.08, 0.15, -0.14);
  group.add(coldPlate);

  const finGeometry = new THREE.BoxGeometry(0.03, 0.18, 0.8);
  for (let index = 0; index < 18; index++) {
    const fin = mesh(finGeometry.clone(), 0x8c979c, 0.32, 0.55);
    fin.position.set(0.72 + index * 0.045, 0.08, -0.02);
    group.add(fin);
  }

  group.position.set(1.12, 1.17, -1.55);
  return tag(group, 'fan');
}

function buildSpeakers() {
  const group = new THREE.Group();

  for (const x of [-3.1, 3.1]) {
    const body = rounded(0.56, 0.18, 1.46, 0.16, C.speaker, 0.6, 0.06);
    body.position.set(x, 0, 0.62);
    group.add(body);

    const grilleGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.025, 12);
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 3; col++) {
        const dot = mesh(grilleGeometry.clone(), 0x626e74, 0.5, 0.12);
        dot.rotation.x = Math.PI / 2;
        dot.position.set(
          x - 0.12 + col * 0.12,
          0.105,
          0.3 + row * 0.17,
        );
        group.add(dot);
      }
    }
  }

  group.position.set(0, 1.08, 0.7);
  return tag(group, 'speakers');
}

function buildBatteryFallback() {
  const group = new THREE.Group();

  // Fallback used only until the official Framework battery GLB is loaded.
  const body = rounded(5.75, 0.28, 2.45, 0.13, C.battery, 0.5, 0.12);
  group.add(body);

  for (const x of [-2.1, -1.05, 0, 1.05, 2.1]) {
    const seam = rounded(0.018, 0.02, 2.12, 0.005, 0x495258, 0.7, 0.02);
    seam.position.set(x, 0.15, 0);
    group.add(seam);
  }

  group.position.set(0, 1.02, 1.12);
  return tag(group, 'battery');
}

function ribbon(
  start: THREE.Vector3,
  end: THREE.Vector3,
  width: number,
  color: number,
) {
  const middle = start.clone().lerp(end, 0.5);
  middle.y += 0.08;
  const curve = new THREE.CatmullRomCurve3([start, middle, end]);
  const cable = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 20, width, 6, false),
    material(color, 0.62, 0.05),
  );
  cable.castShadow = true;
  return cable;
}

export function buildRealisticLaptopInternals() {
  const inside = new THREE.Group();

  // Thin structural shell instead of one large solid block.
  const bottom = rounded(7.34, 0.1, 4.82, 0.17, 0x5d696f, 0.42, 0.42);
  bottom.position.y = 0.68;
  inside.add(bottom);

  for (const [x, z, w, d] of [
    [0, -2.33, 7.2, 0.12],
    [0, 2.33, 7.2, 0.12],
    [-3.57, 0, 0.12, 4.55],
    [3.57, 0, 0.12, 4.55],
  ] as const) {
    const rail = rounded(w, 0.22, d, 0.045, C.shellDark, 0.45, 0.38);
    rail.position.set(x, 0.82, z);
    inside.add(rail);
  }

  const battery = buildBatteryFallback();
  const motherboard = buildMotherboard();
  const cpu = buildCpu();
  const ram = buildRam();
  const ssd = buildSsd();
  const fan = buildCooling();
  const wifi = buildWifi();
  const speakers = buildSpeakers();

  inside.add(
    battery,
    motherboard.group,
    cpu,
    ram,
    ssd,
    fan,
    wifi,
    speakers,
  );

  // Major internal cables students can recognize.
  inside.add(
    ribbon(
      new THREE.Vector3(0.0, 1.23, 0.45),
      new THREE.Vector3(0.0, 1.24, 0.9),
      0.035,
      0x202428,
    ),
    ribbon(
      new THREE.Vector3(-1.0, 1.25, -1.65),
      new THREE.Vector3(-1.5, 1.25, -2.2),
      0.025,
      0xd8c477,
    ),
    ribbon(
      new THREE.Vector3(2.0, 1.2, -0.45),
      new THREE.Vector3(3.0, 1.18, 0.55),
      0.018,
      0x202428,
    ),
  );

  return {
    inside,
    batteryMount: battery,
    motherboardMount: motherboard.group,
    motherboardShell: motherboard.shell,
  };
}
