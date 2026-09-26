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
  // Overall envelope follows Framework's published tray dimensions:
  // 226.9 mm wide x 104.83 mm deep. The perimeter notches remain a
  // teaching approximation until the DXF extraction is accepted.
  shape.moveTo(-3.0, -1.385);
  shape.lineTo(3.0, -1.385);
  shape.lineTo(3.0, -0.526);
  shape.lineTo(2.6, -0.526);
  shape.lineTo(2.6, 0.491);
  shape.lineTo(1.55, 0.491);
  shape.lineTo(1.55, 1.309);
  shape.lineTo(0.15, 1.309);
  shape.lineTo(0.15, 0.912);
  shape.lineTo(-1.15, 0.912);
  shape.lineTo(-1.15, 1.344);
  shape.lineTo(-2.35, 1.344);
  shape.lineTo(-2.35, 0.678);
  shape.lineTo(-3.0, 0.678);
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

function pinConnector(
  width: number,
  depth: number,
  pins: number,
  color = C.connector,
) {
  const connector = new THREE.Group();
  const housing = rounded(width, 0.085, depth, 0.018, color, 0.42, 0.12);
  connector.add(housing);

  const span = Math.max(width - 0.08, 0.04);
  for (let index = 0; index < pins; index++) {
    const x =
      pins === 1 ? 0 : -span / 2 + (span * index) / Math.max(pins - 1, 1);
    const pin = rounded(0.018, 0.018, depth * 0.62, 0.003, C.gold, 0.26, 0.62);
    pin.position.set(x, 0.05, 0);
    connector.add(pin);
  }
  return connector;
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

  // Framework publishes the connector families and pin counts. Positions are
  // aligned to the current teaching layout and will be snapped to the official
  // DXF coordinates once the mechanical-view transform is validated.
  const batteryConnector = pinConnector(0.72, 0.2, 10, 0x202529);
  batteryConnector.userData.connectorRole = 'battery';
  batteryConnector.position.set(0.3, 0.125, 0.76);
  group.add(batteryConnector);

  const fanConnector = pinConnector(0.34, 0.18, 4);
  fanConnector.userData.connectorRole = 'fan';
  fanConnector.position.set(-2.2, 0.125, 0.42);
  group.add(fanConnector);

  const speakerConnector = pinConnector(0.34, 0.18, 4);
  speakerConnector.userData.connectorRole = 'speaker';
  speakerConnector.position.set(2.1, 0.125, 0.2);
  group.add(speakerConnector);

  const displayConnector = pinConnector(0.92, 0.14, 40, 0xd7d9d4);
  displayConnector.userData.connectorRole = 'display';
  displayConnector.position.set(1.08, 0.125, 0.54);
  group.add(displayConnector);

  const webcamConnector = pinConnector(0.72, 0.14, 30, 0xd7d9d4);
  webcamConnector.position.set(-0.95, 0.125, 0.48);
  group.add(webcamConnector);

  const inputCoverConnector = pinConnector(1.04, 0.16, 50, 0xd7d9d4);
  inputCoverConnector.userData.connectorRole = 'input-cover';
  inputCoverConnector.position.set(0.12, 0.125, 0.16);
  group.add(inputCoverConnector);

  const audioZif = pinConnector(0.5, 0.14, 15, 0xe3e0d7);
  audioZif.userData.connectorRole = 'audio';
  audioZif.position.set(2.42, 0.125, 0.56);
  group.add(audioZif);

  // Framework publishes five mainboard fastener locations in
  // Mainboard/OpenSCAD/tray.scad. These are mapped into the teaching board
  // using the official 226.9 x 104.83 mm envelope.
  for (const [x, z] of [
    [0.753, -1.325],
    [-2.939, 1.101],
    [-2.939, -0.591],
    [2.922, 1.228],
    [2.935, -0.562],
  ] as const) {
    const pad = mesh(
      new THREE.CylinderGeometry(0.075, 0.075, 0.028, 20),
      C.gold,
      0.28,
      0.6,
    );
    pad.position.set(x, 0.105, z);
    group.add(pad);

    const screw = mesh(
      new THREE.CylinderGeometry(0.034, 0.034, 0.034, 18),
      0xb8bec1,
      0.24,
      0.7,
    );
    screw.position.set(x, 0.135, z);
    group.add(screw);
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

function buildBottomCover() {
  const cover = new THREE.Group();

  const panel = rounded(7.28, 0.12, 5.56, 0.16, 0x59646a, 0.42, 0.42);
  cover.add(panel);

  // Vent field near the cooling area.
  for (let row = 0; row < 4; row++) {
    for (let column = 0; column < 12; column++) {
      const vent = rounded(0.26, 0.022, 0.055, 0.015, 0x20272b, 0.72, 0.05);
      vent.position.set(-1.55 + column * 0.3, 0.07, -1.25 + row * 0.16);
      cover.add(vent);
    }
  }

  // Framework's service procedure uses five captive T5 fasteners. Positions
  // here are representative until the bottom-cover drawing is imported.
  for (const [x, z] of [
    [-3.15, -2.42],
    [0, -2.5],
    [3.15, -2.42],
    [-3.15, 2.38],
    [3.15, 2.38],
  ] as const) {
    const screw = mesh(
      new THREE.CylinderGeometry(0.075, 0.075, 0.035, 20),
      0x9aa4a9,
      0.28,
      0.62,
    );
    screw.position.set(x, 0.08, z);
    cover.add(screw);
  }

  // Home position is the assembled underside of the chassis. The Laptop
  // Anatomy teardown moves the whole cover aside as its first removal step.
  cover.position.set(0, 0.59, 0);
  cover.rotation.set(0, 0, 0);
  cover.traverse((object) => {
    if (!('isMesh' in object) || !(object as THREE.Mesh).isMesh) return;
    const item = object as THREE.Mesh;
    item.castShadow = true;
    item.receiveShadow = true;
  });
  return cover;
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

export type LaptopInternalCableId = 'battery' | 'speaker' | 'display';

export type LaptopInternalCable = {
  id: LaptopInternalCableId;
  object: THREE.Mesh;
  at: number;
  unplugOffset: THREE.Vector3;
};

export type LaptopTeardownPart = {
  object: THREE.Object3D;
  start: number;
  end: number;
  homePosition: THREE.Vector3;
  homeRotation: THREE.Euler;
  offset: THREE.Vector3;
  rotationOffset: THREE.Vector3;
};

export function applyLaptopTeardown(
  parts: readonly LaptopTeardownPart[],
  amount: number,
) {
  const progress = Math.min(100, Math.max(0, amount));

  for (const part of parts) {
    const raw =
      part.end === part.start
        ? progress >= part.end
          ? 1
          : 0
        : (progress - part.start) / (part.end - part.start);
    const t = Math.min(1, Math.max(0, raw));
    const eased = t * t * (3 - 2 * t);

    part.object.position.set(
      part.homePosition.x + part.offset.x * eased,
      part.homePosition.y + part.offset.y * eased,
      part.homePosition.z + part.offset.z * eased,
    );
    part.object.rotation.set(
      part.homeRotation.x + part.rotationOffset.x * eased,
      part.homeRotation.y + part.rotationOffset.y * eased,
      part.homeRotation.z + part.rotationOffset.z * eased,
    );
  }
}

function teardownPart(
  object: THREE.Object3D,
  start: number,
  end: number,
  offset: [number, number, number],
  rotationOffset: [number, number, number] = [0, 0, 0],
): LaptopTeardownPart {
  return {
    object,
    start,
    end,
    homePosition: object.position.clone(),
    homeRotation: object.rotation.clone(),
    offset: new THREE.Vector3(...offset),
    rotationOffset: new THREE.Vector3(...rotationOffset),
  };
}

export function buildRealisticLaptopInternals() {
  const inside = new THREE.Group();

  // Thin structural shell instead of one large solid block.
  const bottom = rounded(7.34, 0.1, 5.62, 0.17, 0x5d696f, 0.42, 0.42);
  bottom.position.y = 0.68;
  inside.add(bottom);

  for (const [x, z, w, d] of [
    [0, -2.73, 7.2, 0.12],
    [0, 2.73, 7.2, 0.12],
    [-3.57, 0, 0.12, 5.35],
    [3.57, 0, 0.12, 5.35],
  ] as const) {
    const rail = rounded(w, 0.22, d, 0.045, C.shellDark, 0.45, 0.38);
    rail.position.set(x, 0.82, z);
    inside.add(rail);
  }

  const removedBottomCover = buildBottomCover();
  const battery = buildBatteryFallback();
  const motherboard = buildMotherboard();
  const cpu = buildCpu();
  const ram = buildRam();
  const ssd = buildSsd();
  const fan = buildCooling();
  const wifi = buildWifi();
  const speakers = buildSpeakers();

  inside.add(
    removedBottomCover,
    battery,
    motherboard.group,
    cpu,
    ram,
    ssd,
    fan,
    wifi,
    speakers,
  );

  // Major internal cables terminate at the teaching-board connector mounts.
  // Their removal thresholds mirror the teardown order so a component never
  // appears to move away while its cable remains magically attached.
  const batteryCable = ribbon(
    new THREE.Vector3(0.12, 1.22, 0.28),
    new THREE.Vector3(0.45, 1.16, -0.16),
    0.035,
    0x202428,
  );
  const displayCable = ribbon(
    new THREE.Vector3(1.23, 1.17, -0.38),
    new THREE.Vector3(1.34, 1.22, -2.28),
    0.025,
    0xd8c477,
  );
  const speakerCable = ribbon(
    new THREE.Vector3(2.25, 1.16, -0.72),
    new THREE.Vector3(3.02, 1.18, 1.18),
    0.018,
    0x202428,
  );
  inside.add(batteryCable, displayCable, speakerCable);

  const teardownParts: LaptopTeardownPart[] = [
    // The sequence mirrors a real service flow rather than a decorative
    // radial explosion: cover, battery, serviceable cards/memory, cooling,
    // processor, and finally the motherboard.
    teardownPart(
      removedBottomCover,
      0,
      18,
      [7.85, 0.62, 1.2],
      [-0.12, 0.3, -0.08],
    ),
    teardownPart(battery, 14, 32, [0, 1.55, 2.7], [-0.05, 0, 0]),
    teardownPart(ssd, 27, 44, [2.25, 1.35, 0.45], [0, -0.08, 0.06]),
    teardownPart(wifi, 32, 49, [-2.2, 1.25, 0.7], [0, 0.08, -0.06]),
    teardownPart(ram, 40, 58, [0.45, 1.85, 0.2], [-0.12, 0, 0]),
    teardownPart(speakers, 48, 66, [0, 1.0, 2.55], [0.04, 0, 0]),
    teardownPart(fan, 56, 76, [-2.3, 1.45, -1.35], [-0.08, -0.08, 0]),
    teardownPart(cpu, 70, 87, [-0.45, 2.05, -0.25], [0, 0.08, 0]),
    teardownPart(
      motherboard.group,
      82,
      100,
      [0.15, 2.35, -1.0],
      [-0.08, 0, 0.04],
    ),
  ];

  return {
    inside,
    batteryMount: battery,
    motherboardMount: motherboard.group,
    motherboardShell: motherboard.shell,
    removedBottomCover,
    teardownParts,
    disconnectCables: [
      {
        id: 'battery' as const,
        object: batteryCable,
        at: 14,
        unplugOffset: new THREE.Vector3(0.18, 0.16, 0.16),
      },
      {
        id: 'speaker' as const,
        object: speakerCable,
        at: 48,
        unplugOffset: new THREE.Vector3(-0.14, 0.14, 0.12),
      },
      {
        id: 'display' as const,
        object: displayCable,
        at: 90,
        unplugOffset: new THREE.Vector3(0.12, 0.18, -0.18),
      },
    ] satisfies LaptopInternalCable[],
  };
}
