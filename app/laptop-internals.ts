import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { LAPTOP_INTERNAL_LAYOUT } from './laptop-layout.ts';

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

function physicalMesh(
  geometry: THREE.BufferGeometry,
  color: number,
  roughness = 0.32,
  metalness = 0.7,
) {
  return new THREE.Mesh(
    geometry,
    new THREE.MeshPhysicalMaterial({
      color,
      roughness,
      metalness,
      clearcoat: 0.1,
      clearcoatRoughness: 0.24,
      envMapIntensity: 1.14,
      anisotropy: metalness > 0.5 ? 0.28 : 0,
      anisotropyRotation: Math.PI / 2,
    }),
  );
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
  group.userData.boardDetailVersion = 2;

  const addChip = (
    name: string,
    x: number,
    z: number,
    width: number,
    depth: number,
    height = 0.09,
    color = C.chip,
  ) => {
    const item = chip(width, depth, height, color);
    item.name = name;
    item.position.set(x, 0.115 + height / 2, z);
    group.add(item);
    return item;
  };

  const addCap = (
    x: number,
    z: number,
    radius = 0.045,
    height = 0.075,
    color = 0x8d9294,
  ) => {
    const body = mesh(
      new THREE.CylinderGeometry(radius, radius, height, 14),
      color,
      0.44,
      0.3,
    );
    body.position.set(x, 0.11 + height / 2, z);
    group.add(body);
    return body;
  };

  const addPassiveBank = (
    x: number,
    z: number,
    columns: number,
    rows: number,
    spacingX: number,
    spacingZ: number,
    rotation = 0,
  ) => {
    const geometry = new RoundedBoxGeometry(0.062, 0.038, 0.034, 2, 0.007);
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const passive = mesh(
          geometry.clone(),
          (row + column) % 4 === 0 ? 0xb6a17b : 0x4a4f52,
          0.56,
          0.08,
        );
        passive.position.set(
          x + (column - (columns - 1) / 2) * spacingX,
          0.125,
          z + (row - (rows - 1) / 2) * spacingZ,
        );
        passive.rotation.y = rotation + ((row + column) % 2) * Math.PI / 2;
        group.add(passive);
      }
    }
  };

  // --- CPU / VRM zone ----------------------------------------------------
  // Leave the CPU keepout itself open: the processor and cooling assembly are
  // separate selectable objects. Populate the surrounding power-delivery ring.
  for (const [x, z] of [
    [-0.52, -0.92],
    [-0.22, -0.94],
    [0.1, -0.93],
    [-0.52, -0.63],
    [-0.22, -0.64],
    [0.11, -0.64],
  ] as const) {
    const inductor = rounded(0.24, 0.15, 0.22, 0.035, 0x555c60, 0.5, 0.24);
    inductor.position.set(x, 0.18, z);
    group.add(inductor);
  }

  for (const [x, z] of [
    [-0.64, -1.14],
    [-0.36, -1.15],
    [-0.08, -1.15],
    [0.2, -1.14],
    [-0.68, -0.42],
    [-0.4, -0.42],
    [-0.12, -0.42],
    [0.16, -0.42],
  ] as const) {
    addChip('VRM power stage', x, z, 0.16, 0.11, 0.065, 0x252a2d);
  }

  for (const [x, z] of [
    [-0.78, -0.88],
    [-0.76, -0.68],
    [0.33, -0.88],
    [0.34, -0.68],
  ] as const) {
    addCap(x, z, 0.045, 0.085, 0x9a9fa1);
  }

  addPassiveBank(-0.18, -1.23, 11, 2, 0.12, 0.1);
  addPassiveBank(-0.16, -0.27, 10, 2, 0.13, 0.1);

  // --- Controller / shield zone -----------------------------------------
  for (const [name, x, z, w, d] of [
    ['Embedded controller', 0.35, -0.06, 0.43, 0.39],
    ['Platform controller', 0.82, -0.48, 0.38, 0.34],
    ['USB-C controller A', -2.48, -0.75, 0.3, 0.28],
    ['USB-C controller B', -1.82, -0.76, 0.3, 0.28],
    ['USB-C controller C', 1.82, -0.76, 0.3, 0.28],
    ['USB-C controller D', 2.44, -0.75, 0.3, 0.28],
    ['BIOS flash', -1.22, 0.42, 0.24, 0.18],
    ['Audio codec', 2.3, 0.3, 0.28, 0.24],
  ] as const) {
    addChip(name, x, z, w, d, 0.085);
  }

  for (const [x, z, w, d] of [
    [0.92, -0.08, 0.62, 0.45],
    [1.62, 0.2, 0.52, 0.38],
    [-1.48, 0.26, 0.58, 0.4],
  ] as const) {
    const shield = physicalMesh(
      new RoundedBoxGeometry(w, 0.055, d, 3, 0.035),
      0xa8b0b3,
      0.33,
      0.62,
    );
    shield.position.set(x, 0.14, z);
    group.add(shield);
  }

  // --- Memory / storage supporting components ---------------------------
  // Keep the actual RAM, SSD and Wi-Fi footprints mostly clear so those
  // removable modules read as installed parts rather than interpenetrating.
  addPassiveBank(0.84, 0.56, 4, 4, 0.12, 0.11);
  addPassiveBank(-0.62, 0.72, 7, 2, 0.12, 0.1);
  addPassiveBank(2.18, 0.75, 4, 2, 0.11, 0.1);

  for (const [x, z] of [
    [-1.04, 0.55],
    [-0.88, 0.55],
    [1.72, 0.58],
    [1.88, 0.58],
    [2.06, 0.58],
  ] as const) {
    addCap(x, z, 0.035, 0.065, 0x8e9598);
  }

  // --- Edge I/O ----------------------------------------------------------
  // Framework's expansion-card system exposes four USB-C receptacles.
  // Build each as a metal shell with a dark inner cavity instead of one block.
  for (const x of [-2.72, -1.96, 1.98, 2.72]) {
    const port = new THREE.Group();
    const shell = rounded(0.48, 0.18, 0.3, 0.045, 0xb8c0c3, 0.28, 0.64);
    port.add(shell);

    const cavity = rounded(0.34, 0.07, 0.22, 0.03, 0x202629, 0.54, 0.12);
    cavity.position.set(0, 0.035, -0.045);
    port.add(cavity);

    const tongue = rounded(0.22, 0.025, 0.12, 0.018, 0x252c30, 0.55, 0.08);
    tongue.position.set(0, 0.055, -0.04);
    port.add(tongue);

    port.position.set(x, 0.115, -1.235);
    group.add(port);
  }

  // --- Fine passives around edge controllers ----------------------------
  addPassiveBank(-2.18, -0.46, 5, 3, 0.1, 0.1);
  addPassiveBank(2.1, -0.46, 5, 3, 0.1, 0.1);
  addPassiveBank(1.64, 0.52, 5, 3, 0.1, 0.1);
  addPassiveBank(-1.72, 0.53, 5, 3, 0.1, 0.1);

  // --- Board-level connectors -------------------------------------------
  // Framework publishes these connector families and pinouts. Runtime GLBs
  // replace these procedural fallbacks with pinned KiCad geometry when loaded.
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
  webcamConnector.userData.connectorRole = 'webcam';
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

  // --- Board routing / silkscreen cues ----------------------------------
  // Keep routing subtle; this is visual structure, not an electrical diagram.
  const traceMaterial = new THREE.LineBasicMaterial({
    color: 0xa78952,
    transparent: true,
    opacity: 0.34,
  });
  const traceSets = [
    [
      [-2.5, -1.04],
      [-1.7, -0.98],
      [-0.86, -0.86],
      [-0.3, -0.7],
    ],
    [
      [2.52, -1.04],
      [1.72, -0.98],
      [1.02, -0.75],
      [0.55, -0.52],
    ],
    [
      [2.25, 0.47],
      [1.64, 0.38],
      [1.2, 0.28],
      [0.72, 0.12],
    ],
    [
      [-2.18, 0.42],
      [-1.66, 0.36],
      [-1.18, 0.24],
      [-0.72, 0.08],
    ],
  ] as const;
  for (const trace of traceSets) {
    group.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(
          trace.map(([x, z]) => new THREE.Vector3(x, 0.108, z)),
        ),
        traceMaterial.clone(),
      ),
    );
  }

  // Framework publishes five mainboard fastener locations in tray.scad.
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
  group.position.set(...LAPTOP_INTERNAL_LAYOUT.motherboard.home);
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

  // The processor sits under the cooling cold plate, just to the right of
  // the fan in the Framework service orientation.
  group.position.set(...LAPTOP_INTERNAL_LAYOUT.cpu.home);
  return tag(group, 'cpu');
}

function buildRam() {
  const group = new THREE.Group();

  // Framework Laptop 13 SODIMMs lie flat and run front-to-back beside the
  // heatsink. The earlier model made them look like thick upright cartridges.
  for (const x of [-0.43, 0.43]) {
    const slot = rounded(0.78, 0.075, 1.82, 0.025, 0x292f32, 0.5, 0.14);
    slot.position.set(x, 0.01, 0);
    group.add(slot);

    const ramModule = rounded(0.7, 0.055, 1.7, 0.025, C.ram, 0.52, 0.06);
    ramModule.position.set(x, 0.075, 0);
    group.add(ramModule);

    for (const z of [-0.58, -0.2, 0.2, 0.58]) {
      const memoryChip = chip(0.46, 0.28, 0.055);
      memoryChip.position.set(x, 0.135, z);
      group.add(memoryChip);
    }

    // Gold contact edge where each SODIMM enters its socket.
    for (let index = 0; index < 16; index++) {
      const contact = rounded(0.018, 0.012, 0.065, 0.003, C.gold, 0.3, 0.55);
      contact.position.set(
        x - 0.31 + (index % 2) * 0.62,
        0.112,
        -0.66 + Math.floor(index / 2) * 0.19,
      );
      group.add(contact);
    }

    // Retaining clips on the outer edges make the modules read as socketed
    // parts rather than loose boards placed on the motherboard.
    for (const z of [-0.78, 0.78]) {
      const clip = rounded(0.12, 0.09, 0.16, 0.025, 0x9ba3a6, 0.32, 0.5);
      clip.position.set(x, 0.09, z);
      group.add(clip);
    }
  }

  group.position.set(...LAPTOP_INTERNAL_LAYOUT.ram.home);
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

  const label = rounded(0.72, 0.012, 0.34, 0.018, 0xd5d7d3, 0.72, 0.02);
  label.position.set(0.12, 0.116, 0);
  group.add(label);
  for (const x of [-0.08, 0.08, 0.24]) {
    const mark = rounded(0.025, 0.006, 0.2, 0.004, 0x6e777b, 0.7, 0.02);
    mark.position.set(x, 0.126, 0);
    group.add(mark);
  }

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

  // The M.2 2280 storage sits horizontally below the cooling assembly and
  // above the battery, matching the Framework DIY/service photographs.
  group.position.set(...LAPTOP_INTERNAL_LAYOUT.ssd.home);
  group.rotation.y = LAPTOP_INTERNAL_LAYOUT.ssd.rotationY;
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

  // Wi-Fi occupies the front-right corner of the mainboard beside the right
  // speaker/battery edge, with its antenna leads routed along that side.
  group.position.set(...LAPTOP_INTERNAL_LAYOUT.wifi.home);
  return tag(group, 'wifi');
}

function buildCooling() {
  const group = new THREE.Group();

  // Framework Laptop 13 (Intel-era HSF) published dimensions:
  // 120 x 85 x 6 mm module, 65 x 5.5 mm blower fan, dual 5 mm heat pipes.
  // The interactive chassis is 7.34 units for the real 296.63 mm width.
  const unitPerMm = 7.34 / 296.63;
  const fanRadius = (65 * unitPerMm) / 2;
  const fanThickness = 5.5 * unitPerMm;
  const heatPipeRadius = 2.5 * unitPerMm;
  const fanX = -0.58;
  const fanZ = -0.15;

  // Centrifugal-blower shroud. The dark base is deliberately not circular:
  // notebook fans use a scroll housing and a short exhaust throat.
  const shroud = rounded(1.76, 0.07, 1.7, 0.17, 0x252d31, 0.5, 0.24);
  shroud.position.set(fanX, 0.025, fanZ);
  group.add(shroud);

  const exhaust = rounded(0.5, 0.11, 0.92, 0.07, 0x2b3438, 0.45, 0.3);
  exhaust.position.set(-1.36, 0.065, fanZ);
  group.add(exhaust);

  const fanPlate = mesh(
    new THREE.CylinderGeometry(
      fanRadius * 0.91,
      fanRadius * 0.91,
      fanThickness * 0.28,
      56,
    ),
    0x1b2226,
    0.55,
    0.14,
  );
  fanPlate.position.set(fanX, fanThickness * 0.25, fanZ);
  group.add(fanPlate);

  const housing = new THREE.Mesh(
    new THREE.TorusGeometry(fanRadius * 0.8, 0.065, 10, 64),
    new THREE.MeshStandardMaterial({
      color: 0x465157,
      roughness: 0.38,
      metalness: 0.28,
    }),
  );
  housing.rotation.x = Math.PI / 2;
  housing.position.set(fanX, fanThickness * 0.86, fanZ);
  group.add(housing);

  const hub = mesh(
    new THREE.CylinderGeometry(0.18, 0.18, fanThickness * 0.74, 32),
    0x3a4449,
    0.4,
    0.2,
  );
  hub.position.set(fanX, fanThickness * 0.67, fanZ);
  group.add(hub);

  const fanLabel = mesh(
    new THREE.CylinderGeometry(0.115, 0.115, 0.012, 28),
    0x77868c,
    0.52,
    0.08,
  );
  fanLabel.position.set(fanX, fanThickness * 1.08, fanZ);
  group.add(fanLabel);

  for (let index = 0; index < 15; index++) {
    const blade = rounded(0.1, 0.025, 0.52, 0.03, 0x59676d, 0.4, 0.12);
    blade.position.set(fanX, fanThickness * 0.76, fanZ);
    blade.rotation.y = (Math.PI * 2 * index) / 15 + 0.2;
    blade.translateZ(fanRadius * 0.47);
    group.add(blade);
  }

  // Copper fin pack at the exhaust side. Thin repeated fins make the outlet
  // read as a real heatsink instead of one solid silver block.
  const finGeometry = new THREE.BoxGeometry(0.018, 0.15, 0.94);
  for (let index = 0; index < 24; index++) {
    const fin = mesh(finGeometry.clone(), 0xb17a52, 0.3, 0.68);
    fin.position.set(-1.62 + index * 0.025, 0.095, fanZ);
    group.add(fin);
  }

  // Cold plate over the processor.
  const coldPlate = physicalMesh(
    new RoundedBoxGeometry(0.92, 0.07, 0.84, 4, 0.055),
    C.copper,
    0.26,
    0.76,
  );
  coldPlate.position.set(1.0, 0.145, -0.06);
  group.add(coldPlate);

  const pressurePlate = rounded(1.08, 0.035, 0.97, 0.06, 0x747e83, 0.34, 0.58);
  pressurePlate.position.set(1.0, 0.1, -0.06);
  group.add(pressurePlate);

  // Dual 5 mm heat pipes are side-by-side in plan view, not stacked
  // vertically. Each runs from the CPU plate toward the fan/fin outlet.
  for (const zOffset of [-0.075, 0.075]) {
    const heatPipe = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(1.02, 0.17, -0.08 + zOffset),
          new THREE.Vector3(0.62, 0.18, -0.1 + zOffset),
          new THREE.Vector3(0.08, 0.17, -0.14 + zOffset),
          new THREE.Vector3(-0.66, 0.155, fanZ + zOffset),
          new THREE.Vector3(-1.28, 0.145, fanZ + zOffset),
        ]),
        40,
        heatPipeRadius,
        12,
        false,
      ),
      material(C.copper, 0.24, 0.76),
    );
    group.add(heatPipe);
  }

  // Framework's service guide removes two fan fasteners first.
  for (const [index, x, z] of [
    [1, -1.06, -0.69],
    [2, -0.15, 0.46],
  ] as const) {
    const screw = mesh(
      new THREE.CylinderGeometry(0.047, 0.047, 0.04, 20),
      0xc5cbce,
      0.22,
      0.72,
    );
    screw.position.set(x, 0.155, z);
    screw.name = `Fan fastener ${index}`;
    screw.userData.serviceOrder = index;
    group.add(screw);
  }

  // The heatsink itself uses three captive fasteners, serviced 3 -> 2 -> 1
  // during removal according to Framework's guide.
  for (const [label, x, z] of [
    [1, 0.7, -0.38],
    [2, 1.34, -0.24],
    [3, 1.08, 0.34],
  ] as const) {
    const screw = mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.045, 20),
      0xc5cbce,
      0.22,
      0.72,
    );
    screw.position.set(x, 0.205, z);
    screw.name = `Heatsink fastener ${label}`;
    screw.userData.heatsinkFastener = label;
    group.add(screw);
  }

  // Short fan lead toward the mainboard connector.
  const fanLead = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.05, 0.11, 0.48),
        new THREE.Vector3(0.12, 0.12, 0.56),
        new THREE.Vector3(0.34, 0.12, 0.5),
      ]),
      16,
      0.018,
      6,
      false,
    ),
    material(0x1c2225, 0.65, 0.04),
  );
  group.add(fanLead);

  group.position.set(...LAPTOP_INTERNAL_LAYOUT.cooling.home);
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

  group.position.set(...LAPTOP_INTERNAL_LAYOUT.speakers.home);
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

  // The battery fills most of the lower half of the chassis while leaving
  // narrow side channels for the speakers and cabling.
  group.position.set(...LAPTOP_INTERNAL_LAYOUT.battery.home);
  return tag(group, 'battery');
}

function buildBottomCover() {
  const cover = new THREE.Group();

  const panel = physicalMesh(
    new RoundedBoxGeometry(7.28, 0.12, 5.56, 6, 0.16),
    0x727d82,
    0.3,
    0.72,
  );
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
  const serviceInterior = new THREE.Group();
  inside.add(serviceInterior);

  // Thin structural shell instead of one large solid block.
  const bottom = physicalMesh(
    new RoundedBoxGeometry(7.34, 0.1, 5.62, 6, 0.17),
    0x69747a,
    0.32,
    0.66,
  );
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

  // Real laptops have a lot of small structural detail between the large
  // components. These dark liners, screw bosses, foam pads and grounding
  // strips keep the inside from reading like parts floating on a flat tray.
  const liner = rounded(6.92, 0.018, 5.16, 0.13, 0x202529, 0.78, 0.04);
  liner.position.set(0, 0.742, 0.02);
  serviceInterior.add(liner);

  for (const [x, z] of [
    [-3.05, -2.34],
    [0, -2.45],
    [3.05, -2.34],
    [-3.12, -0.55],
    [3.12, -0.55],
    [-3.1, 2.22],
    [0, 2.36],
    [3.1, 2.22],
  ] as const) {
    const boss = mesh(
      new THREE.CylinderGeometry(0.105, 0.12, 0.12, 24),
      0x555f64,
      0.34,
      0.58,
    );
    boss.position.set(x, 0.82, z);
    serviceInterior.add(boss);

    const screw = mesh(
      new THREE.CylinderGeometry(0.048, 0.048, 0.035, 20),
      0xb6bdc0,
      0.22,
      0.72,
    );
    screw.position.set(x, 0.895, z);
    serviceInterior.add(screw);
  }

  for (const [x, z, w, d] of [
    [-2.55, 1.82, 0.7, 0.24],
    [2.55, 1.82, 0.7, 0.24],
    [-2.75, -1.8, 0.54, 0.2],
    [2.72, -1.84, 0.54, 0.2],
  ] as const) {
    const foam = rounded(w, 0.045, d, 0.035, 0x14191c, 0.86, 0.02);
    foam.position.set(x, 0.82, z);
    serviceInterior.add(foam);
  }

  for (const [x, z, w, d, rotation] of [
    [-1.78, 1.78, 1.05, 0.16, -0.16],
    [1.58, 1.9, 0.92, 0.15, 0.12],
    [2.28, -1.98, 0.72, 0.14, -0.1],
  ] as const) {
    const foil = physicalMesh(
      new RoundedBoxGeometry(w, 0.025, d, 3, 0.025),
      0xb8a98b,
      0.38,
      0.56,
    );
    foil.position.set(x, 0.84, z);
    foil.rotation.y = rotation;
    serviceInterior.add(foil);
  }

  // Adhesive tape is common around delicate cable runs and connectors.
  for (const [x, z, w, d, rotation] of [
    [0.48, 0.34, 0.72, 0.22, 0.08],
    [2.6, 0.82, 0.5, 0.18, -0.2],
    [-1.95, -1.78, 0.62, 0.18, 0.14],
  ] as const) {
    const tape = rounded(w, 0.022, d, 0.025, 0x15191b, 0.9, 0.01);
    tape.position.set(x, 0.86, z);
    tape.rotation.y = rotation;
    serviceInterior.add(tape);
  }

  const battery = buildBatteryFallback();
  const motherboard = buildMotherboard();
  const cpu = buildCpu();
  const ram = buildRam();
  const ssd = buildSsd();
  const fan = buildCooling();
  const wifi = buildWifi();
  const speakers = buildSpeakers();

  serviceInterior.add(
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

  const wifiAntennaBlack = ribbon(
    new THREE.Vector3(2.5, 1.24, 0.0),
    new THREE.Vector3(3.12, 1.03, -2.2),
    0.01,
    0x111416,
  );
  const wifiAntennaWhite = ribbon(
    new THREE.Vector3(2.62, 1.24, 0.14),
    new THREE.Vector3(2.82, 1.05, -2.4),
    0.01,
    0xd4d6d4,
  );
  const keyboardRibbon = ribbon(
    new THREE.Vector3(0.08, 1.17, -0.8),
    new THREE.Vector3(0.16, 1.12, 0.12),
    0.045,
    0xc69a52,
  );
  const touchpadRibbon = ribbon(
    new THREE.Vector3(0.72, 1.13, 0.2),
    new THREE.Vector3(0.38, 1.08, 1.62),
    0.04,
    0xc8a05a,
  );

  serviceInterior.add(
    batteryCable,
    displayCable,
    speakerCable,
    wifiAntennaBlack,
    wifiAntennaWhite,
    keyboardRibbon,
    touchpadRibbon,
  );

  const teardownParts: LaptopTeardownPart[] = [
    // The Input Cover is animated by Laptop Lab before this internal service
    // sequence begins. Framework service guides keep the Bottom Cover as the
    // chassis while the Input Cover is lifted/flipped to expose the internals.
    // Final positions form a readable service layout around the chassis
    // instead of stacking every removed part vertically over the board.
    teardownPart(
      battery,
      LAPTOP_INTERNAL_LAYOUT.battery.teardown.start,
      LAPTOP_INTERNAL_LAYOUT.battery.teardown.end,
      [...LAPTOP_INTERNAL_LAYOUT.battery.teardown.offset],
      [...LAPTOP_INTERNAL_LAYOUT.battery.teardown.rotation],
    ),
    teardownPart(
      ssd,
      LAPTOP_INTERNAL_LAYOUT.ssd.teardown.start,
      LAPTOP_INTERNAL_LAYOUT.ssd.teardown.end,
      [...LAPTOP_INTERNAL_LAYOUT.ssd.teardown.offset],
      [...LAPTOP_INTERNAL_LAYOUT.ssd.teardown.rotation],
    ),
    teardownPart(
      wifi,
      LAPTOP_INTERNAL_LAYOUT.wifi.teardown.start,
      LAPTOP_INTERNAL_LAYOUT.wifi.teardown.end,
      [...LAPTOP_INTERNAL_LAYOUT.wifi.teardown.offset],
      [...LAPTOP_INTERNAL_LAYOUT.wifi.teardown.rotation],
    ),
    teardownPart(
      ram,
      LAPTOP_INTERNAL_LAYOUT.ram.teardown.start,
      LAPTOP_INTERNAL_LAYOUT.ram.teardown.end,
      [...LAPTOP_INTERNAL_LAYOUT.ram.teardown.offset],
      [...LAPTOP_INTERNAL_LAYOUT.ram.teardown.rotation],
    ),
    teardownPart(
      speakers,
      LAPTOP_INTERNAL_LAYOUT.speakers.teardown.start,
      LAPTOP_INTERNAL_LAYOUT.speakers.teardown.end,
      [...LAPTOP_INTERNAL_LAYOUT.speakers.teardown.offset],
      [...LAPTOP_INTERNAL_LAYOUT.speakers.teardown.rotation],
    ),
    teardownPart(
      fan,
      LAPTOP_INTERNAL_LAYOUT.cooling.teardown.start,
      LAPTOP_INTERNAL_LAYOUT.cooling.teardown.end,
      [...LAPTOP_INTERNAL_LAYOUT.cooling.teardown.offset],
      [...LAPTOP_INTERNAL_LAYOUT.cooling.teardown.rotation],
    ),
    teardownPart(
      cpu,
      LAPTOP_INTERNAL_LAYOUT.cpu.teardown.start,
      LAPTOP_INTERNAL_LAYOUT.cpu.teardown.end,
      [...LAPTOP_INTERNAL_LAYOUT.cpu.teardown.offset],
      [...LAPTOP_INTERNAL_LAYOUT.cpu.teardown.rotation],
    ),
    teardownPart(
      motherboard.group,
      LAPTOP_INTERNAL_LAYOUT.motherboard.teardown.start,
      LAPTOP_INTERNAL_LAYOUT.motherboard.teardown.end,
      [...LAPTOP_INTERNAL_LAYOUT.motherboard.teardown.offset],
      [...LAPTOP_INTERNAL_LAYOUT.motherboard.teardown.rotation],
    ),
  ];

  return {
    inside,
    serviceInterior,
    parts: {
      battery,
      motherboard: motherboard.group,
      cpu,
      ram,
      ssd,
      cooling: fan,
      wifi,
      speakers,
    },
    batteryMount: battery,
    motherboardMount: motherboard.group,
    motherboardShell: motherboard.shell,
    removedBottomCover,
    teardownParts,
    disconnectCables: [
      {
        id: 'battery' as const,
        object: batteryCable,
        at: 18,
        unplugOffset: new THREE.Vector3(0.18, 0.16, 0.16),
      },
      {
        id: 'speaker' as const,
        object: speakerCable,
        at: 50,
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
