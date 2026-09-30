import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  LAPTOP_CABLE_LAYOUT,
  LAPTOP_CHASSIS_FEATURES,
  LAPTOP_INTERNAL_LAYOUT,
  type LaptopVec3,
} from './laptop-layout.ts';

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
  shell: 0x727c81,
  shellDark: 0x30383c,
  pcb: 0x1f5046,
  pcbEdge: 0x173c35,
  chip: 0x14191c,
  chipSoft: 0x272e32,
  shield: 0xa9b1b4,
  copper: 0xb87345,
  gold: 0xb9964e,
  battery: 0x252c30,
  ram: 0x2b5147,
  ssd: 0x31554b,
  wifi: 0x365a4f,
  speaker: 0x1d2327,
  connector: 0xe2e4df,
};

function material(
  color: number,
  roughness = 0.5,
  metalness = 0.15,
  role?: string,
) {
  const value = new THREE.MeshStandardMaterial({ color, roughness, metalness });
  if (role) value.userData.materialRole = role;
  return value;
}

function mesh(
  geometry: THREE.BufferGeometry,
  color: number,
  roughness = 0.5,
  metalness = 0.15,
  role?: string,
) {
  const item = new THREE.Mesh(
    geometry,
    material(color, roughness, metalness, role),
  );
  if (role) item.userData.materialRole = role;
  return item;
}

function physicalMesh(
  geometry: THREE.BufferGeometry,
  color: number,
  roughness = 0.32,
  metalness = 0.7,
  role?: string,
) {
  const value = new THREE.MeshPhysicalMaterial({
    color,
    roughness,
    metalness,
    clearcoat: metalness > 0.5 ? 0.04 : 0.02,
    clearcoatRoughness: 0.34,
    envMapIntensity: metalness > 0.5 ? 0.92 : 0.72,
    anisotropy: metalness > 0.5 ? 0.24 : 0,
    anisotropyRotation: Math.PI / 2,
  });
  if (role) value.userData.materialRole = role;

  const item = new THREE.Mesh(geometry, value);
  if (role) item.userData.materialRole = role;
  return item;
}

function rounded(
  width: number,
  height: number,
  depth: number,
  radius: number,
  color: number,
  roughness = 0.5,
  metalness = 0.15,
  role?: string,
) {
  return mesh(
    new RoundedBoxGeometry(width, height, depth, 4, radius),
    color,
    roughness,
    metalness,
    role,
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

function chip(width: number, depth: number, height = 0.12, color = C.chip) {
  return rounded(width, height, depth, 0.035, color, 0.56, 0.06, 'ic-package');
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
    const pin = rounded(
      0.018,
      0.018,
      depth * 0.62,
      0.003,
      C.gold,
      0.24,
      0.78,
      'gold-contact',
    );
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
    // Exposed leads belong to leaded controller packages; BGA chips stay pinless.
    if (
      name === 'Embedded controller' ||
      name === 'BIOS flash' ||
      name === 'Audio codec'
    ) {
      const count = name === 'BIOS flash' ? 4 : 10;
      const leads = new THREE.InstancedMesh(
        new THREE.BoxGeometry(0.018, 0.018, 0.065),
        material(0x8e999d, 0.34, 0.76),
        count * 2,
      );
      leads.name = name + ' soldered leads';
      for (let i = 0; i < count; i++) {
        const px = x + (i - (count - 1) / 2) * ((width * 0.8) / count);
        for (const side of [-1, 1]) {
          leads.setMatrixAt(
            i * 2 + (side === 1 ? 1 : 0),
            new THREE.Matrix4().makeTranslation(
              px,
              0.125,
              z + side * (depth / 2 + 0.018),
            ),
          );
        }
      }
      group.add(leads);
      const dot = mesh(
        new THREE.CylinderGeometry(0.014, 0.014, 0.002, 12),
        0x798184,
        0.8,
        0,
      );
      dot.position.set(x - width * 0.3, 0.116 + height, z - depth * 0.3);
      group.add(dot);
    }
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
    const geometry = new RoundedBoxGeometry(0.062, 0.022, 0.034, 2, 0.005);
    const ends = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.015, 0.025, 0.036),
      material(0x929e9f, 0.36, 0.72),
      columns * rows * 2,
    );
    let terminal = 0;
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
        passive.rotation.y = rotation + (((row + column) % 2) * Math.PI) / 2;
        group.add(passive);
        for (const side of [-1, 1]) {
          const pos = new THREE.Vector3(side * 0.026, 0, 0)
            .applyAxisAngle(new THREE.Vector3(0, 1, 0), passive.rotation.y)
            .add(passive.position);
          ends.setMatrixAt(
            terminal++,
            new THREE.Matrix4().compose(
              pos,
              passive.quaternion,
              new THREE.Vector3(1, 1, 1),
            ),
          );
        }
      }
    }
    ends.name = 'Soldered passive terminals';
    group.add(ends);
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
    const inductor = rounded(0.24, 0.09, 0.22, 0.02, 0x42494c, 0.7, 0.12);
    inductor.position.set(x, 0.155, z);
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
    // Four metal walls leave a real opening through the receptacle.
    const metal = material(0x9ca9b1, 0.3, 0.8);
    for (const [w, h, d, px, py] of [
      [0.48, 0.022, 0.3, 0, 0.079],
      [0.48, 0.022, 0.3, 0, -0.079],
      [0.025, 0.14, 0.3, -0.228, 0],
      [0.025, 0.14, 0.3, 0.228, 0],
    ]) {
      const wall = new THREE.Mesh(
        new RoundedBoxGeometry(w, h, d, 2, 0.008),
        metal,
      );
      wall.position.set(px, py, 0);
      port.add(wall);
    }
    const back = rounded(0.42, 0.13, 0.018, 0.008, 0x101619, 0.88, 0.02);
    back.position.z = 0.14;
    port.add(back);
    const tongue = rounded(0.31, 0.026, 0.23, 0.012, 0x192125, 0.75, 0.02);
    tongue.position.z = 0.012;
    port.add(tongue);
    for (let pin = 0; pin < 12; pin++) {
      const contact = mesh(
        new THREE.BoxGeometry(0.012, 0.004, 0.12),
        C.gold,
        0.28,
        0.8,
      );
      contact.position.set(-0.132 + pin * 0.024, 0.016, -0.015);
      port.add(contact);
    }
    for (const px of [-0.25, 0.25]) {
      const lug = rounded(0.07, 0.035, 0.1, 0.009, 0x89979f, 0.32, 0.75);
      lug.position.set(px, -0.067, 0.08);
      port.add(lug);
    }

    port.position.set(x, 0.115, -1.235);
    group.add(port);
  }

  // --- Fine passives around edge controllers ----------------------------
  addPassiveBank(-2.18, -0.46, 5, 3, 0.1, 0.1);
  addPassiveBank(2.1, -0.46, 5, 3, 0.1, 0.1);
  addPassiveBank(1.64, 0.52, 5, 3, 0.1, 0.1);
  addPassiveBank(-1.72, 0.53, 5, 3, 0.1, 0.1);

  // --- Removable-module sockets and retainers ----------------------------
  // These stay on the motherboard when RAM / SSD / Wi-Fi are removed.
  // Coordinates are board-local and aligned to the current installed modules.
  for (const [slotName, x] of [
    ['RAM socket A', 0.7],
    ['RAM socket B', 1.56],
  ] as const) {
    const socket = rounded(0.11, 0.065, 1.64, 0.025, 0x22282b, 0.5, 0.16);
    socket.name = slotName;
    socket.userData.boardFixture = 'ram-socket';
    socket.position.set(x - 0.31, 0.13, 0.14);
    group.add(socket);

    for (const z of [-0.72, 0.72]) {
      const clip = rounded(0.11, 0.07, 0.16, 0.022, 0x9ba3a6, 0.32, 0.5);
      clip.name = slotName + ' retaining clip';
      clip.userData.boardFixture = 'ram-retainer';
      clip.position.set(x, 0.14, z + 0.14);
      group.add(clip);
    }
  }

  const ssdSocket = rounded(0.16, 0.07, 0.58, 0.025, 0x22282b, 0.48, 0.18);
  ssdSocket.name = 'M.2 SSD socket';
  ssdSocket.userData.boardFixture = 'm2-ssd-socket';
  ssdSocket.position.set(-1.84, 0.14, 0.94);
  group.add(ssdSocket);

  const ssdStandoff = mesh(
    new THREE.CylinderGeometry(0.065, 0.07, 0.075, 20),
    0xb4bbbe,
    0.26,
    0.68,
  );
  ssdStandoff.name = 'SSD standoff';
  ssdStandoff.userData.boardFixture = 'm2-ssd-standoff';
  ssdStandoff.position.set(0.18, 0.15, 0.94);
  group.add(ssdStandoff);

  const wifiSocket = rounded(0.14, 0.07, 0.56, 0.025, 0x22282b, 0.48, 0.18);
  wifiSocket.name = 'M.2 Wi-Fi socket';
  wifiSocket.userData.boardFixture = 'm2-wifi-socket';
  wifiSocket.position.set(1.98, 0.14, 1.1);
  group.add(wifiSocket);

  const wifiStandoff = mesh(
    new THREE.CylinderGeometry(0.055, 0.06, 0.07, 20),
    0xb4bbbe,
    0.26,
    0.68,
  );
  wifiStandoff.name = 'Wi-Fi standoff';
  wifiStandoff.userData.boardFixture = 'm2-wifi-standoff';
  wifiStandoff.position.set(2.72, 0.15, 1.1);
  group.add(wifiStandoff);

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

  const pcb = mesh(boardShape(), C.pcb, 0.62, 0.035, 'pcb');
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

  const substrate = rounded(0.82, 0.024, 0.72, 0.025, 0x244f45, 0.64, 0.08);
  group.add(substrate);

  // Low-profile mobile package with an exposed die, rather than a tall
  // desktop-style silver heat spreader. Die top meets the copper plate.
  const packageTop = rounded(0.58, 0.024, 0.5, 0.015, 0x20292a, 0.65, 0.08);
  packageTop.position.y = 0.024;
  group.add(packageTop);

  const die = rounded(0.4, 0.048, 0.3, 0.012, 0x545c63, 0.22, 0.48);
  die.name = 'CPU thermal contact die';
  die.position.y = 0.047;
  group.add(die);

  // The processor sits under the cooling cold plate, just to the right of
  // the fan in the Framework service orientation.
  group.position.set(...LAPTOP_INTERNAL_LAYOUT.cpu.home);
  return tag(group, 'cpu');
}

function buildRam() {
  const group = new THREE.Group();
  group.userData.removableHardwareVersion = 2;

  // Two low-profile SODIMMs. The sockets and retaining clips belong to the
  // motherboard and are intentionally NOT children of this removable group.
  for (const x of [-0.43, 0.43]) {
    const ramBoard = rounded(
      0.68,
      0.035,
      1.58,
      0.018,
      C.ram,
      0.62,
      0.035,
      'pcb',
    );
    ramBoard.position.set(x, 0.035, 0);
    group.add(ramBoard);

    for (const z of [-0.56, -0.19, 0.19, 0.56]) {
      const memoryChip = chip(0.42, 0.24, 0.052, 0x202529);
      memoryChip.position.set(x + 0.05, 0.088, z);
      group.add(memoryChip);
    }

    const spd = chip(0.16, 0.14, 0.045, 0x2a3033);
    spd.position.set(x - 0.18, 0.082, 0);
    group.add(spd);

    // Visible contact fingers run along the socketed long edge.
    for (let index = 0; index < 14; index++) {
      const contact = rounded(
        0.055,
        0.01,
        0.028,
        0.003,
        C.gold,
        0.24,
        0.78,
        'gold-contact',
      );
      contact.position.set(x - 0.312, 0.058, -0.62 + index * (1.24 / 13));
      group.add(contact);
    }

    // Small center notch makes the insertion edge read like a keyed SODIMM.
    const notch = rounded(0.07, 0.012, 0.06, 0.008, 0x1f2628, 0.7, 0.02);
    notch.position.set(x - 0.325, 0.06, 0.08);
    group.add(notch);
  }

  group.position.set(...LAPTOP_INTERNAL_LAYOUT.ram.home);
  return tag(group, 'ram');
}

function buildSsd() {
  const group = new THREE.Group();
  group.userData.removableHardwareVersion = 2;

  // M.2 2280: thin PCB, controller, NAND, DRAM/cache and keyed contacts.
  const pcb = rounded(2.03, 0.035, 0.56, 0.02, C.ssd, 0.62, 0.035, 'pcb');
  group.add(pcb);

  for (const x of [-0.48, -0.05, 0.38]) {
    const nand = chip(0.35, 0.36, 0.065, 0x202529);
    nand.position.set(x, 0.068, 0);
    group.add(nand);
  }

  const controller = chip(0.26, 0.27, 0.075, 0x171d20);
  controller.position.set(0.72, 0.074, 0);
  group.add(controller);

  const dram = chip(0.18, 0.2, 0.055, 0x252b2e);
  dram.position.set(0.58, 0.066, -0.16);
  group.add(dram);

  // Subtle identification label instead of a large toy-like white slab.
  const label = rounded(0.62, 0.008, 0.25, 0.012, 0xb8bebc, 0.78, 0.01);
  label.position.set(0.02, 0.077, 0.04);
  group.add(label);

  // Gold edge fingers at the socket end with an M-key gap.
  for (let index = 0; index < 12; index++) {
    if (index === 8 || index === 9) continue;
    const finger = rounded(
      0.15,
      0.009,
      0.022,
      0.003,
      C.gold,
      0.24,
      0.78,
      'gold-contact',
    );
    finger.position.set(-0.95, 0.028, -0.22 + index * 0.04);
    group.add(finger);
  }

  // Mounting hole belongs to the PCB; the screw/standoff stays on the board.
  const mountingRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.052, 0.012, 8, 20),
    material(0xb8bec1, 0.28, 0.62),
  );
  mountingRing.rotation.x = Math.PI / 2;
  mountingRing.position.set(0.94, 0.045, 0);
  group.add(mountingRing);

  group.position.set(...LAPTOP_INTERNAL_LAYOUT.ssd.home);
  group.rotation.y = LAPTOP_INTERNAL_LAYOUT.ssd.rotationY;
  return tag(group, 'ssd');
}

function buildWifi() {
  const group = new THREE.Group();
  group.userData.removableHardwareVersion = 2;

  // M.2 2230 Wi-Fi module. Chassis antenna leads are modeled separately so
  // they do not travel away with the card during teardown.
  const pcb = rounded(0.76, 0.035, 0.56, 0.02, C.wifi, 0.62, 0.035, 'pcb');
  group.add(pcb);

  const shield = physicalMesh(
    new RoundedBoxGeometry(0.46, 0.045, 0.34, 3, 0.022),
    0xaeb5b8,
    0.28,
    0.72,
    'metal-shield',
  );
  shield.position.set(0.06, 0.065, 0.02);
  group.add(shield);

  const controller = chip(0.16, 0.16, 0.045, 0x252b2e);
  controller.position.set(-0.22, 0.065, 0.1);
  group.add(controller);

  for (const x of [-0.18, 0.18]) {
    const socketBase = mesh(
      new THREE.CylinderGeometry(0.052, 0.052, 0.024, 18),
      0xd6c277,
      0.24,
      0.62,
    );
    socketBase.position.set(x, 0.075, -0.2);
    group.add(socketBase);

    const socketCore = mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.029, 16),
      0x30373a,
      0.42,
      0.2,
    );
    socketCore.position.set(x, 0.09, -0.2);
    group.add(socketCore);
  }

  // Keyed M.2 contact edge.
  for (let index = 0; index < 9; index++) {
    if (index === 6) continue;
    const finger = rounded(
      0.1,
      0.009,
      0.022,
      0.003,
      C.gold,
      0.24,
      0.78,
      'gold-contact',
    );
    finger.position.set(-0.34, 0.027, -0.18 + index * 0.045);
    group.add(finger);
  }

  const mountingRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.045, 0.01, 8, 18),
    material(0xb8bec1, 0.28, 0.62),
  );
  mountingRing.rotation.x = Math.PI / 2;
  mountingRing.position.set(0.34, 0.043, 0);
  group.add(mountingRing);

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
    const fin = mesh(finGeometry.clone(), C.copper, 0.3, 0.82, 'copper');
    fin.position.set(-1.62 + index * 0.025, 0.095, fanZ);
    group.add(fin);
  }

  // Cold plate over the processor.
  const coldPlate = physicalMesh(
    new RoundedBoxGeometry(0.92, 0.035, 0.84, 4, 0.017),
    C.copper,
    0.28,
    0.86,
    'copper',
  );
  coldPlate.name = 'CPU copper contact plate';
  coldPlate.position.set(1.0, 0.1, -0.06);
  group.add(coldPlate);

  const pressurePlate = rounded(1.08, 0.035, 0.97, 0.06, 0x747e83, 0.34, 0.58);
  pressurePlate.position.set(1.0, 0.135, -0.06);
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
      material(C.copper, 0.28, 0.86, 'copper'),
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
    // Slim sealed speaker enclosure fitted within the battery side channels.
    const body = rounded(
      0.4,
      0.1,
      1.25,
      0.055,
      C.speaker,
      0.8,
      0.025,
      'speaker-plastic',
    );
    body.position.set(x, -0.02, 0.62);
    group.add(body);
    const diaphragm = rounded(0.27, 0.007, 0.66, 0.09, 0x101619, 0.92, 0.01);
    diaphragm.position.set(x, 0.033, 0.62);
    group.add(diaphragm);
    // Flush dark perforations replace the old protruding silver pegs.
    const grilleGeometry = new THREE.CylinderGeometry(0.011, 0.011, 0.002, 8);
    const grilleMaterial = material(0x080d0f, 0.95, 0);
    const grille = new THREE.InstancedMesh(grilleGeometry, grilleMaterial, 36);
    let index = 0;
    for (let row = 0; row < 12; row++) {
      for (let col = 0; col < 3; col++) {
        grille.setMatrixAt(
          index++,
          new THREE.Matrix4().makeTranslation(
            x - 0.065 + col * 0.065,
            0.038,
            0.35 + row * 0.049,
          ),
        );
      }
    }
    group.add(grille);
  }
  group.position.set(...LAPTOP_INTERNAL_LAYOUT.speakers.home);
  return tag(group, 'speakers');
}

function buildBatteryFallback() {
  const group = new THREE.Group();

  // Fallback used only until the official Framework battery GLB is loaded.
  const body = rounded(
    5.75,
    0.28,
    2.45,
    0.13,
    C.battery,
    0.78,
    0.018,
    'battery-wrap',
  );
  group.add(body);

  for (const x of [-2.1, -1.05, 0, 1.05, 2.1]) {
    const seam = rounded(
      0.018,
      0.02,
      2.12,
      0.005,
      0x454d51,
      0.82,
      0.01,
      'battery-seam',
    );
    seam.position.set(x, 0.15, 0);
    group.add(seam);
  }

  // The battery fills most of the lower half of the chassis while leaving
  // narrow side channels for the speakers and cabling.
  group.position.set(...LAPTOP_INTERNAL_LAYOUT.battery.home);
  return tag(group, 'battery');
}

function vectorPath(points: readonly LaptopVec3[]) {
  return points.map(([x, y, z]) => new THREE.Vector3(x, y, z));
}

function wireCablePath(
  points: readonly LaptopVec3[],
  radius: number,
  color: number,
  role: string,
) {
  const curve = new THREE.CatmullRomCurve3(vectorPath(points));
  const cable = new THREE.Mesh(
    new THREE.TubeGeometry(
      curve,
      Math.max(24, points.length * 10),
      radius,
      7,
      false,
    ),
    material(color, 0.62, 0.05),
  );
  cable.userData.cableKind = 'wire';
  cable.userData.cableRole = role;
  cable.userData.cableOwner = 'chassis';
  cable.castShadow = true;
  return cable;
}

function flatRibbonPath(
  points: readonly LaptopVec3[],
  width: number,
  color: number,
  role: string,
) {
  const curve = new THREE.CatmullRomCurve3(vectorPath(points));

  const segments = Math.max(28, points.length * 10);
  const positions: number[] = [];
  const indices: number[] = [];

  for (let index = 0; index <= segments; index++) {
    const t = index / segments;
    const point = curve.getPoint(t);
    const tangent = curve.getTangent(t).normalize();
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x);
    if (side.lengthSq() < 1e-8) side.set(1, 0, 0);
    side.normalize().multiplyScalar(width / 2);

    const left = point.clone().add(side);
    const right = point.clone().sub(side);
    positions.push(left.x, left.y, left.z, right.x, right.y, right.z);

    if (index < segments) {
      const base = index * 2;
      indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const cable = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.58,
      metalness: 0.04,
      side: THREE.DoubleSide,
    }),
  );
  cable.userData.cableKind = 'ribbon';
  cable.userData.cableRole = role;
  cable.userData.cableOwner = 'chassis';
  cable.castShadow = true;
  return cable;
}

function buildChassisDetails() {
  const group = new THREE.Group();
  group.userData.chassisDetailVersion = 1;

  for (const rail of LAPTOP_CHASSIS_FEATURES.batteryRails) {
    const object = rounded(
      rail.size[0],
      rail.size[1],
      rail.size[2],
      0.025,
      0x424b50,
      0.56,
      0.18,
    );
    object.position.set(...rail.position);
    object.userData.detailKind = 'battery-rail';
    group.add(object);
  }

  for (const pocket of LAPTOP_CHASSIS_FEATURES.speakerPockets) {
    const object = rounded(
      pocket.size[0],
      pocket.size[1],
      pocket.size[2],
      0.08,
      0x171d20,
      0.8,
      0.03,
    );
    object.position.set(...pocket.position);
    object.userData.detailKind = 'speaker-pocket';
    group.add(object);
  }

  const hingeLane = rounded(
    LAPTOP_CHASSIS_FEATURES.hingeLane.size[0],
    LAPTOP_CHASSIS_FEATURES.hingeLane.size[1],
    LAPTOP_CHASSIS_FEATURES.hingeLane.size[2],
    0.035,
    0x252d31,
    0.64,
    0.16,
  );
  hingeLane.position.set(...LAPTOP_CHASSIS_FEATURES.hingeLane.position);
  hingeLane.userData.detailKind = 'hinge-routing-lane';
  group.add(hingeLane);

  for (const clip of LAPTOP_CHASSIS_FEATURES.clips) {
    const base = rounded(0.18, 0.035, 0.12, 0.025, 0x596268, 0.46, 0.34);
    base.position.set(...clip.position);
    base.rotation.y = clip.rotation;
    base.userData.retentionKind = 'clip';
    base.userData.cableRole = clip.role;
    base.userData.cableOwner = 'chassis';
    group.add(base);

    const bridge = rounded(0.11, 0.045, 0.05, 0.018, 0x7a8488, 0.38, 0.46);
    bridge.position.set(
      clip.position[0],
      clip.position[1] + 0.035,
      clip.position[2],
    );
    bridge.rotation.y = clip.rotation;
    bridge.userData.retentionKind = 'clip';
    bridge.userData.cableRole = clip.role;
    bridge.userData.cableOwner = 'chassis';
    group.add(bridge);
  }

  for (const tape of LAPTOP_CHASSIS_FEATURES.tape) {
    const object = physicalMesh(
      new RoundedBoxGeometry(tape.size[0], tape.size[1], tape.size[2], 3, 0.02),
      tape.role === 'display' ? 0x343a3d : 0xb39a6a,
      0.82,
      0.025,
      'tape',
    );
    object.position.set(...tape.position);
    object.rotation.y = tape.rotation;
    object.userData.retentionKind = 'tape';
    object.userData.cableRole = tape.role;
    object.userData.cableOwner = 'chassis';
    group.add(object);
  }

  return group;
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

export type LaptopLocalPart = 'ssd' | 'ram' | 'wifi';
export const LAPTOP_LOCAL_EXPLODE = {
  ssd: { offset: [0.32, 0.85, 0], rotation: [0, 0, 0.16] },
  ram: { offset: [0.28, 0.85, 0], rotation: [0, 0, 0.2] },
  wifi: { offset: [0.24, 0.7, 0], rotation: [0, 0, 0.16] },
} as const;

export function isLaptopLocalPart(id: string): id is LaptopLocalPart {
  return id === 'ssd' || id === 'ram' || id === 'wifi';
}

export function applyLaptopTeardown(
  parts: readonly LaptopTeardownPart[],
  amount: number,
  localPart: LaptopLocalPart | null = null,
  localAmount = 1,
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
    // Compose from the global pose every frame, never from the last local pose.
    // Fixtures are children of the motherboard and never enter this branch.
    if (
      progress >= 18 &&
      part.object.userData.laptopPart === localPart &&
      localPart
    ) {
      const local = LAPTOP_LOCAL_EXPLODE[localPart];
      const t = Math.min(1, Math.max(0, localAmount));
      const lift = t * t * (3 - 2 * t);
      part.object.position.addScaledVector(
        new THREE.Vector3(...local.offset),
        lift,
      );
      part.object.rotation.x += local.rotation[0] * lift;
      part.object.rotation.y += local.rotation[1] * lift;
      part.object.rotation.z += local.rotation[2] * lift;
    }
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
    C.shell,
    0.34,
    0.76,
    'aluminum',
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
    const tape = rounded(w, 0.022, d, 0.025, 0x15191b, 0.9, 0.005, 'tape');
    tape.position.set(x, 0.86, z);
    tape.rotation.y = rotation;
    serviceInterior.add(tape);
  }

  const chassisDetails = buildChassisDetails();
  serviceInterior.add(chassisDetails);

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
  const batteryCable = wireCablePath(
    LAPTOP_CABLE_LAYOUT.battery,
    0.035,
    0x202428,
    'battery',
  );
  const displayCable = flatRibbonPath(
    LAPTOP_CABLE_LAYOUT.display,
    0.12,
    0x23292c,
    'display',
  );
  const speakerCable = wireCablePath(
    LAPTOP_CABLE_LAYOUT.speakerHarness,
    0.018,
    0x202428,
    'speaker',
  );
  const speakerWireLeft = wireCablePath(
    LAPTOP_CABLE_LAYOUT.speakerLeft,
    0.012,
    0x30363a,
    'speaker-left',
  );
  const speakerWireRight = wireCablePath(
    LAPTOP_CABLE_LAYOUT.speakerRight,
    0.012,
    0x30363a,
    'speaker-right',
  );
  const wifiAntennaBlack = wireCablePath(
    LAPTOP_CABLE_LAYOUT.wifiBlack,
    0.01,
    0x111416,
    'wifi-black',
  );
  const wifiAntennaWhite = wireCablePath(
    LAPTOP_CABLE_LAYOUT.wifiWhite,
    0.01,
    0xd4d6d4,
    'wifi-white',
  );
  const keyboardRibbon = flatRibbonPath(
    LAPTOP_CABLE_LAYOUT.keyboard,
    0.18,
    0xb7864a,
    'keyboard',
  );
  const touchpadRibbon = flatRibbonPath(
    LAPTOP_CABLE_LAYOUT.touchpad,
    0.16,
    0xb98b50,
    'touchpad',
  );

  serviceInterior.add(
    batteryCable,
    displayCable,
    speakerCable,
    speakerWireLeft,
    speakerWireRight,
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
    chassisDetails,
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
    teardownParts,
    disconnectCables: [
      {
        id: 'battery' as const,
        object: batteryCable,
        at: 24,
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

