'use client';

import { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Box,
  Cable,
  CheckCircle2,
  Circle,
  Keyboard,
  Laptop,
  Monitor,
  Mouse,
  PcCase,
  Rotate3D,
  Wifi,
  Zap,
} from 'lucide-react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CC0_TREE_COMPUTER_TOWER_FBX_BASE64 } from '@/lib/cc0-computer-tower';

type LabPartId =
  | 'monitor'
  | 'tower'
  | 'keyboard'
  | 'mouse'
  | 'network'
  | 'power-strip';
type LabMode = 'explore' | 'connect';
type ConnectionId =
  | 'keyboard-usb'
  | 'mouse-usb'
  | 'monitor-hdmi'
  | 'network-ethernet'
  | 'tower-power';
type PortType = 'usb' | 'hdmi' | 'ethernet' | 'power';
type PortId =
  | 'tower-usb-1'
  | 'tower-usb-2'
  | 'tower-hdmi'
  | 'tower-ethernet'
  | 'tower-power';

type LabPart = {
  id: LabPartId;
  name: string;
  icon: typeof Monitor;
  description: string;
  lesson: string;
};

type ConnectionTask = {
  id: ConnectionId;
  name: string;
  device: LabPartId;
  portType: PortType;
  targetPort: PortId;
  instruction: string;
};

const PARTS: LabPart[] = [
  {
    id: 'monitor',
    name: 'Monitor',
    icon: Monitor,
    description:
      'The monitor shows the pictures, text and video produced by the computer.',
    lesson:
      'A display cable such as HDMI or DisplayPort carries the picture from the computer to the monitor.',
  },
  {
    id: 'tower',
    name: 'System unit',
    icon: PcCase,
    description:
      'The system unit contains the main hardware that processes, stores and powers the computer.',
    lesson:
      'Open it to explore the motherboard, CPU, RAM, storage, GPU, cooling and power supply.',
  },
  {
    id: 'keyboard',
    name: 'Keyboard',
    icon: Keyboard,
    description:
      'The keyboard is an input device used to type letters, numbers and commands.',
    lesson: 'Most classroom keyboards connect to a USB port.',
  },
  {
    id: 'mouse',
    name: 'Mouse',
    icon: Mouse,
    description:
      'The mouse is an input device used to point, click, drag and select.',
    lesson: 'A wired mouse commonly connects to a USB port.',
  },
  {
    id: 'network',
    name: 'Network',
    icon: Wifi,
    description:
      'A router or network switch connects the computer to a local network and often to the internet.',
    lesson:
      'A wired Ethernet cable connects the network equipment to the computer’s Ethernet port.',
  },
  {
    id: 'power-strip',
    name: 'Power',
    icon: Zap,
    description:
      'The computer and monitor need electrical power before any data connection can work.',
    lesson:
      'Power cables connect the equipment to a safe outlet or power strip. Students should not handle mains wiring inside a real power supply.',
  },
];

const GUIDE_ORDER: LabPartId[] = [
  'monitor',
  'keyboard',
  'mouse',
  'network',
  'power-strip',
  'tower',
];

const CONNECTION_TASKS: ConnectionTask[] = [
  {
    id: 'keyboard-usb',
    name: 'Keyboard → USB',
    device: 'keyboard',
    portType: 'usb',
    targetPort: 'tower-usb-1',
    instruction:
      'Connect the keyboard. Rotate the computer if needed, then click the highlighted USB port.',
  },
  {
    id: 'mouse-usb',
    name: 'Mouse → USB',
    device: 'mouse',
    portType: 'usb',
    targetPort: 'tower-usb-2',
    instruction:
      'Connect the mouse to the remaining USB port on the system unit.',
  },
  {
    id: 'monitor-hdmi',
    name: 'Monitor → HDMI',
    device: 'monitor',
    portType: 'hdmi',
    targetPort: 'tower-hdmi',
    instruction:
      'Connect the monitor to HDMI. Rotate the setup to find the display connector on the rear teaching panel.',
  },
  {
    id: 'network-ethernet',
    name: 'Network → Ethernet',
    device: 'network',
    portType: 'ethernet',
    targetPort: 'tower-ethernet',
    instruction:
      'Connect the network box to Ethernet. Find the larger rear network socket.',
  },
  {
    id: 'tower-power',
    name: 'Power → System unit',
    device: 'power-strip',
    portType: 'power',
    targetPort: 'tower-power',
    instruction:
      'Finish the setup by connecting power to the system unit. Find the power inlet low on the rear panel.',
  },
];

const PORT_TYPES: Record<PortId, PortType> = {
  'tower-usb-1': 'usb',
  'tower-usb-2': 'usb',
  'tower-hdmi': 'hdmi',
  'tower-ethernet': 'ethernet',
  'tower-power': 'power',
};

const COLORS = {
  background: 0x111820,
  floor: 0x151b20,
  desk: 0x8b7663,
  deskEdge: 0x665546,
  dark: 0x171c21,
  panel: 0x2b333a,
  panelSoft: 0x39434a,
  keys: 0xe6e8e9,
  keyDark: 0xaeb8bd,
  accent: 0x78cbd6,
  accentSoft: 0xa7dfe5,
  screenBlue: 0x102a3a,
  wall: 0x1a2229,
};

function mesh(
  geometry: THREE.BufferGeometry,
  color: number,
  roughness = 0.62,
  metalness = 0.12,
) {
  return new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color, roughness, metalness }),
  );
}

function rounded(
  width: number,
  height: number,
  depth: number,
  radius: number,
  color: number,
  roughness = 0.58,
  metalness = 0.12,
) {
  return mesh(
    new RoundedBoxGeometry(width, height, depth, 4, radius),
    color,
    roughness,
    metalness,
  );
}

function tag(group: THREE.Group, id: LabPartId) {
  group.userData.labPart = id;
  group.traverse((object) => {
    if (!('isMesh' in object) || !(object as THREE.Mesh).isMesh) return;
    const item = object as THREE.Mesh;
    item.castShadow = true;
    item.receiveShadow = true;
    const materials = Array.isArray(item.material)
      ? item.material
      : [item.material];
    for (const material of materials) {
      if (material instanceof THREE.MeshStandardMaterial) {
        material.emissive = new THREE.Color(0x000000);
        material.emissiveIntensity = 0;
      }
    }
  });
  return group;
}

function port(
  id: PortId,
  size: [number, number, number],
  position: [number, number, number],
  color: number,
) {
  const item = rounded(
    size[0],
    size[1],
    size[2],
    Math.min(size[0], size[1], size[2]) * 0.24,
    color,
    0.28,
    0.46,
  );
  item.position.set(...position);
  item.userData.labPort = id;
  item.userData.portType = PORT_TYPES[id];
  return item;
}

function screenTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 576;
  const context = canvas.getContext('2d');
  if (!context) return null;

  const background = context.createLinearGradient(0, 0, 1024, 576);
  background.addColorStop(0, '#0b2533');
  background.addColorStop(0.55, '#153c4b');
  background.addColorStop(1, '#234d57');
  context.fillStyle = background;
  context.fillRect(0, 0, 1024, 576);

  const glow = context.createRadialGradient(745, 155, 20, 745, 155, 430);
  glow.addColorStop(0, 'rgba(116, 224, 225, .42)');
  glow.addColorStop(1, 'rgba(116, 224, 225, 0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, 1024, 576);

  context.fillStyle = 'rgba(255,255,255,.08)';
  context.fillRect(60, 52, 904, 1);
  context.fillRect(60, 488, 904, 1);

  context.fillStyle = '#dff8fb';
  context.font = '700 58px Segoe UI, Arial, sans-serif';
  context.fillText('BIG CHANGE', 72, 230);
  context.fillStyle = '#8fd5dd';
  context.font = '600 28px Segoe UI, Arial, sans-serif';
  context.fillText('COMPUTER LAB', 74, 276);
  context.fillStyle = 'rgba(235,249,250,.72)';
  context.font = '400 20px Segoe UI, Arial, sans-serif';
  context.fillText('Explore • Connect • Build • Troubleshoot', 74, 332);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function buildMonitor() {
  const group = new THREE.Group();

  const frame = rounded(4.72, 2.88, 0.24, 0.12, COLORS.dark, 0.32, 0.42);
  frame.position.y = 3.28;
  group.add(frame);

  const screenGeometry = new THREE.PlaneGeometry(4.3, 2.43);
  const texture = screenTexture();
  const screen = new THREE.Mesh(
    screenGeometry,
    new THREE.MeshBasicMaterial({
      color: COLORS.screenBlue,
      map: texture ?? undefined,
    }),
  );
  screen.position.set(0, 3.28, 0.125);
  group.add(screen);

  const chin = rounded(4.32, 0.12, 0.04, 0.035, COLORS.panel, 0.42, 0.28);
  chin.position.set(0, 2.02, 0.14);
  group.add(chin);

  const stem = rounded(0.3, 1.35, 0.32, 0.08, COLORS.panel, 0.4, 0.45);
  stem.position.y = 1.35;
  group.add(stem);

  const neck = rounded(0.72, 0.22, 0.44, 0.08, COLORS.panelSoft, 0.4, 0.38);
  neck.position.set(0, 1.93, 0.02);
  group.add(neck);

  const stand = rounded(2.15, 0.16, 1.08, 0.08, COLORS.panel, 0.48, 0.42);
  stand.position.set(0, 0.7, 0.22);
  group.add(stand);

  group.position.set(0.05, 0, -1.35);
  return tag(group, 'monitor');
}

function decodeBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++)
    bytes[index] = binary.charCodeAt(index);
  return bytes.buffer;
}

function standardizeImportedTower(root: THREE.Group) {
  root.traverse((object) => {
    if (!('isMesh' in object) || !(object as THREE.Mesh).isMesh) return;
    const item = object as THREE.Mesh;
    const original = Array.isArray(item.material)
      ? item.material
      : [item.material];
    const converted = original.map((material, index) => {
      const sourceColor =
        'color' in material && material.color instanceof THREE.Color
          ? material.color.clone()
          : new THREE.Color(index % 2 === 0 ? 0x232a30 : 0x303940);
      if (sourceColor.r + sourceColor.g + sourceColor.b > 2.55)
        sourceColor.setHex(0x55636b);
      const next = new THREE.MeshStandardMaterial({
        color: sourceColor,
        roughness: 0.46,
        metalness: 0.34,
      });
      if ('opacity' in material && typeof material.opacity === 'number') {
        next.opacity = material.opacity;
        next.transparent = material.opacity < 1;
      }
      return next;
    });
    item.material = Array.isArray(item.material) ? converted : converted[0];
    item.castShadow = true;
    item.receiveShadow = true;
  });

  root.updateMatrixWorld(true);
  let bounds = new THREE.Box3().setFromObject(root);
  let size = bounds.getSize(new THREE.Vector3());

  if (size.x > size.z * 1.2) {
    root.rotation.y += Math.PI / 2;
    root.updateMatrixWorld(true);
    bounds = new THREE.Box3().setFromObject(root);
    size = bounds.getSize(new THREE.Vector3());
  }

  const scale = 4.15 / Math.max(size.y, 0.001);
  root.scale.setScalar(scale);
  root.updateMatrixWorld(true);

  bounds = new THREE.Box3().setFromObject(root);
  const center = bounds.getCenter(new THREE.Vector3());
  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= bounds.min.y;
  root.updateMatrixWorld(true);
  return root;
}

function fallbackTowerShell() {
  const shell = new THREE.Group();
  const body = rounded(2.3, 4.25, 3.35, 0.16, 0x20272d, 0.38, 0.34);
  body.position.y = 2.15;
  shell.add(body);

  const glass = rounded(2.34, 3.65, 2.72, 0.11, 0x263a45, 0.18, 0.14);
  glass.position.set(0, 2.2, 0.17);
  const material = glass.material as THREE.MeshStandardMaterial;
  material.transparent = true;
  material.opacity = 0.32;
  shell.add(glass);

  for (const y of [1.25, 2.18, 3.11]) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.055, 8, 28),
      new THREE.MeshStandardMaterial({
        color: COLORS.accent,
        roughness: 0.32,
        metalness: 0.18,
        emissive: new THREE.Color(0x14353a),
        emissiveIntensity: 0.55,
      }),
    );
    ring.rotation.y = Math.PI / 2;
    ring.position.set(-1.16, y, -0.58);
    shell.add(ring);
  }
  return shell;
}

function buildTower() {
  const group = new THREE.Group();
  const ports: THREE.Mesh[] = [];

  try {
    const loader = new FBXLoader();
    const imported = loader.parse(
      decodeBase64(CC0_TREE_COMPUTER_TOWER_FBX_BASE64),
      '',
    );
    group.add(standardizeImportedTower(imported));
  } catch {
    group.add(fallbackTowerShell());
  }

  const accentRail = rounded(
    0.08,
    3.35,
    0.08,
    0.025,
    COLORS.accent,
    0.32,
    0.2,
  );
  accentRail.position.set(-1.13, 2.2, 1.58);
  group.add(accentRail);

  const powerButton = mesh(
    new THREE.CylinderGeometry(0.095, 0.095, 0.045, 20),
    COLORS.accentSoft,
    0.24,
    0.34,
  );
  powerButton.rotation.x = Math.PI / 2;
  powerButton.position.set(0.62, 4.03, 1.72);
  group.add(powerButton);

  const usb1 = port(
    'tower-usb-1',
    [0.3, 0.12, 0.055],
    [-0.36, 4.02, 1.72],
    0x4e8394,
  );
  const usb2 = port(
    'tower-usb-2',
    [0.3, 0.12, 0.055],
    [0.02, 4.02, 1.72],
    0x4e8394,
  );
  const hdmi = port(
    'tower-hdmi',
    [0.4, 0.14, 0.055],
    [0.42, 2.72, -1.72],
    0x8e7ca8,
  );
  const ethernet = port(
    'tower-ethernet',
    [0.36, 0.3, 0.055],
    [0.42, 2.2, -1.72],
    0x658f79,
  );
  const power = port(
    'tower-power',
    [0.44, 0.4, 0.055],
    [-0.35, 0.65, -1.72],
    0xa98265,
  );

  ports.push(usb1, usb2, hdmi, ethernet, power);
  group.add(...ports);
  group.position.set(4.15, 0.02, -0.42);
  return { group: tag(group, 'tower'), ports };
}

function buildKeyboard() {
  const group = new THREE.Group();

  const base = rounded(4.9, 0.22, 1.7, 0.1, 0x20272c, 0.52, 0.23);
  group.add(base);

  const keyGeometry = new RoundedBoxGeometry(0.3, 0.09, 0.25, 3, 0.035);
  const rows = [
    { count: 13, start: -2.04, z: -0.55 },
    { count: 13, start: -2.0, z: -0.19 },
    { count: 12, start: -1.85, z: 0.17 },
    { count: 9, start: -1.45, z: 0.53 },
  ];

  for (const [rowIndex, row] of rows.entries()) {
    for (let column = 0; column < row.count; column++) {
      const key = mesh(
        keyGeometry.clone(),
        rowIndex === 0 && column === 0 ? COLORS.accentSoft : COLORS.keys,
        0.66,
        0.05,
      );
      key.position.set(row.start + column * 0.34, 0.15, row.z);
      group.add(key);
    }
  }

  const spacebar = rounded(1.65, 0.09, 0.24, 0.035, COLORS.keyDark, 0.64, 0.05);
  spacebar.position.set(0.05, 0.15, 0.53);
  group.add(spacebar);

  group.position.set(-0.35, 0.72, 2.35);
  group.rotation.y = -0.035;
  return tag(group, 'keyboard');
}

function buildMouse() {
  const group = new THREE.Group();
  const body = mesh(
    new THREE.SphereGeometry(0.54, 36, 24),
    0x242c32,
    0.34,
    0.28,
  );
  body.scale.set(0.76, 0.4, 1.08);
  body.position.y = 0.12;
  group.add(body);

  const centerLine = rounded(0.025, 0.025, 0.72, 0.01, 0x59666d, 0.42, 0.2);
  centerLine.position.set(0, 0.33, -0.12);
  group.add(centerLine);

  const wheel = mesh(
    new THREE.CylinderGeometry(0.075, 0.075, 0.19, 18),
    COLORS.accent,
    0.3,
    0.22,
  );
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(0, 0.36, -0.14);
  group.add(wheel);

  const glow = mesh(
    new THREE.SphereGeometry(0.055, 14, 10),
    COLORS.accentSoft,
    0.24,
    0.06,
  );
  glow.scale.set(1.5, 0.35, 0.65);
  glow.position.set(0, 0.22, 0.45);
  group.add(glow);

  group.position.set(3.0, 0.83, 2.22);
  return tag(group, 'mouse');
}

function buildNetworkBox() {
  const group = new THREE.Group();
  const body = rounded(1.62, 0.3, 0.98, 0.09, 0x253038, 0.48, 0.2);
  body.position.y = 0.15;
  group.add(body);

  const topInset = rounded(1.28, 0.035, 0.64, 0.04, 0x33414a, 0.52, 0.16);
  topInset.position.y = 0.31;
  group.add(topInset);

  for (const x of [-0.55, -0.18, 0.18, 0.55]) {
    const light = rounded(0.075, 0.035, 0.035, 0.012, COLORS.accent, 0.25, 0.05);
    light.position.set(x, 0.31, 0.48);
    group.add(light);
  }

  for (const x of [-0.5, 0.5]) {
    const antenna = mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.95, 10),
      0x1d2429,
      0.42,
      0.25,
    );
    antenna.position.set(x, 0.64, -0.32);
    group.add(antenna);
  }

  group.position.set(-4.45, 0.7, -1.35);
  return tag(group, 'network');
}

function buildPowerStrip() {
  const group = new THREE.Group();
  const body = rounded(2.4, 0.22, 0.62, 0.08, 0xd9dede, 0.52, 0.06);
  group.add(body);

  for (const x of [-0.72, 0, 0.72]) {
    const socket = mesh(
      new THREE.CylinderGeometry(0.125, 0.125, 0.035, 20),
      0x4b555b,
      0.44,
      0.08,
    );
    socket.rotation.x = Math.PI / 2;
    socket.position.set(x, 0.12, 0);
    group.add(socket);
  }

  const switchMesh = rounded(0.26, 0.06, 0.18, 0.025, COLORS.accent, 0.32, 0.08);
  switchMesh.position.set(0.97, 0.13, 0);
  group.add(switchMesh);

  group.position.set(4.55, 0.72, 3.0);
  return tag(group, 'power-strip');
}

function cableLine(start: THREE.Vector3, end: THREE.Vector3) {
  const middle = start.clone().lerp(end, 0.5);
  middle.y = Math.max(0.58, Math.min(start.y, end.y) - 0.35);
  const curve = new THREE.CatmullRomCurve3([start, middle, end]);
  const geometry = new THREE.TubeGeometry(curve, 30, 0.035, 8, false);
  const material = new THREE.MeshStandardMaterial({
    color: 0x7fc4d0,
    roughness: 0.5,
    metalness: 0.05,
    emissive: 0x102d32,
    emissiveIntensity: 0.35,
  });
  const cable = new THREE.Mesh(geometry, material);
  cable.castShadow = true;
  return cable;
}

function addDesk(scene: THREE.Scene) {
  const desktop = rounded(13.8, 0.5, 7.25, 0.18, COLORS.desk, 0.7, 0.05);
  desktop.position.set(0.35, 0.38, 0.35);
  desktop.receiveShadow = true;
  scene.add(desktop);

  const apron = rounded(12.9, 0.26, 0.18, 0.06, COLORS.deskEdge, 0.72, 0.04);
  apron.position.set(0.35, 0.05, 3.76);
  scene.add(apron);

  for (const x of [-5.7, 6.4]) {
    for (const z of [-2.42, 3.12]) {
      const leg = rounded(0.34, 2.2, 0.34, 0.08, 0x30383e, 0.48, 0.34);
      leg.position.set(x, -0.98, z);
      leg.castShadow = true;
      scene.add(leg);
    }
  }

  const mat = rounded(6.5, 0.035, 2.45, 0.1, 0x20282d, 0.82, 0.02);
  mat.position.set(0.35, 0.655, 2.2);
  mat.receiveShadow = true;
  scene.add(mat);
}

function addRoom(scene: THREE.Scene) {
  const floor = mesh(
    new THREE.PlaneGeometry(42, 42),
    COLORS.floor,
    0.92,
    0.01,
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.1;
  floor.receiveShadow = true;
  scene.add(floor);

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: COLORS.wall,
    roughness: 0.92,
    metalness: 0,
  });
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(34, 15), wallMaterial);
  backWall.position.set(0, 5.1, -7.2);
  backWall.receiveShadow = true;
  scene.add(backWall);

  const grid = new THREE.GridHelper(34, 34, 0x34464e, 0x26343a);
  grid.position.y = -2.085;
  const materials = Array.isArray(grid.material) ? grid.material : [grid.material];
  for (const material of materials) {
    material.transparent = true;
    material.opacity = 0.22;
  }
  scene.add(grid);
}

export default function ComputerLab({
  onOpenPC,
  onOpenLaptop,
}: {
  onOpenPC: () => void;
  onOpenLaptop: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selectedRef = useRef<LabPartId>('tower');
  const modeRef = useRef<LabMode>('explore');
  const taskRef = useRef(0);
  const connectedRef = useRef<ConnectionId[]>([]);

  const [selected, setSelected] = useState<LabPartId>('tower');
  const [labMode, setLabMode] = useState<LabMode>('explore');
  const [guided, setGuided] = useState(false);
  const [guideIndex, setGuideIndex] = useState(0);
  const [taskIndex, setTaskIndex] = useState(0);
  const [connected, setConnected] = useState<ConnectionId[]>([]);
  const [feedback, setFeedback] = useState(
    'Choose Connections when you are ready to practise ports and cables.',
  );

  const selectedPart = PARTS.find((part) => part.id === selected)!;
  const guidePart =
    PARTS.find((part) => part.id === GUIDE_ORDER[guideIndex]) ?? PARTS[0];
  const currentTask = CONNECTION_TASKS[taskIndex];
  const allConnected = connected.length === CONNECTION_TASKS.length;

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    modeRef.current = labMode;
  }, [labMode]);

  useEffect(() => {
    taskRef.current = taskIndex;
  }, [taskIndex]);

  useEffect(() => {
    connectedRef.current = connected;
  }, [connected]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.background);
    scene.fog = new THREE.Fog(COLORS.background, 18, 38);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(11.5, 7.6, 13.4);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.enablePan = false;
    controls.minDistance = 8;
    controls.maxDistance = 24;
    controls.minPolarAngle = 0.35;
    controls.maxPolarAngle = Math.PI / 2.03;
    controls.target.set(0.75, 1.7, 0.35);

    scene.add(new THREE.HemisphereLight(0xcfeeff, 0x3a312d, 1.75));

    const keyLight = new THREE.DirectionalLight(0xfff4e8, 3.7);
    keyLight.position.set(7.5, 11, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1536, 1536);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 30;
    keyLight.shadow.camera.left = -10;
    keyLight.shadow.camera.right = 10;
    keyLight.shadow.camera.top = 10;
    keyLight.shadow.camera.bottom = -10;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x8fb8ff, 1.15);
    fillLight.position.set(-8, 5, 5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x86e3dc, 1.0);
    rimLight.position.set(5, 7, -9);
    scene.add(rimLight);

    addRoom(scene);
    addDesk(scene);

    const groups = new Map<LabPartId, THREE.Group>();
    const monitor = buildMonitor();
    const towerBuild = buildTower();
    const tower = towerBuild.group;
    const keyboard = buildKeyboard();
    const mouse = buildMouse();
    const network = buildNetworkBox();
    const powerStrip = buildPowerStrip();

    for (const [id, group] of [
      ['monitor', monitor],
      ['tower', tower],
      ['keyboard', keyboard],
      ['mouse', mouse],
      ['network', network],
      ['power-strip', powerStrip],
    ] as const) {
      groups.set(id, group);
      scene.add(group);
    }

    scene.updateMatrixWorld(true);

    const portPosition = (id: PortId) => {
      const item = towerBuild.ports.find(
        (candidate) => candidate.userData.labPort === id,
      );
      return item?.getWorldPosition(new THREE.Vector3()) ?? new THREE.Vector3();
    };

    const cables = new Map<ConnectionId, THREE.Mesh>([
      [
        'keyboard-usb',
        cableLine(
          new THREE.Vector3(-0.35, 0.9, 3.05),
          portPosition('tower-usb-1'),
        ),
      ],
      [
        'mouse-usb',
        cableLine(
          new THREE.Vector3(3.0, 0.96, 2.76),
          portPosition('tower-usb-2'),
        ),
      ],
      [
        'monitor-hdmi',
        cableLine(
          new THREE.Vector3(0.05, 1.1, -1.48),
          portPosition('tower-hdmi'),
        ),
      ],
      [
        'network-ethernet',
        cableLine(
          new THREE.Vector3(-4.45, 0.9, -0.98),
          portPosition('tower-ethernet'),
        ),
      ],
      [
        'tower-power',
        cableLine(
          new THREE.Vector3(4.55, 0.84, 2.72),
          portPosition('tower-power'),
        ),
      ],
    ]);

    for (const cable of cables.values()) {
      cable.visible = false;
      scene.add(cable);
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const pick = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      if (modeRef.current === 'connect') {
        const portHit = raycaster.intersectObjects(towerBuild.ports, false)[0];
        if (!portHit) {
          setFeedback(
            'That is not a connection port. Rotate the setup and look for the highlighted port.',
          );
          return;
        }

        const id = portHit.object.userData.labPort as PortId;
        const clickedType = PORT_TYPES[id];
        const task = CONNECTION_TASKS[taskRef.current];

        if (clickedType !== task.portType) {
          setFeedback(
            'Not quite. ' +
              task.name +
              ' needs a ' +
              task.portType.toUpperCase() +
              ' connection.',
          );
          return;
        }

        if (id !== task.targetPort) {
          setFeedback(
            'That is the right kind of port, but this exercise uses the other ' +
              task.portType.toUpperCase() +
              ' socket. Try the highlighted target.',
          );
          return;
        }

        const nextConnected = connectedRef.current.includes(task.id)
          ? connectedRef.current
          : [...connectedRef.current, task.id];
        connectedRef.current = nextConnected;
        setConnected(nextConnected);
        setFeedback('Correct — ' + task.name + ' is connected.');

        const nextIndex = CONNECTION_TASKS.findIndex(
          (candidate, index) =>
            index > taskRef.current && !nextConnected.includes(candidate.id),
        );
        if (nextIndex >= 0) {
          taskRef.current = nextIndex;
          setTaskIndex(nextIndex);
        }
        return;
      }

      const hit = raycaster.intersectObjects([...groups.values()], true)[0];
      if (!hit) return;
      let current: THREE.Object3D | null = hit.object;
      while (
        current &&
        !current.userData.labPart &&
        !current.userData.labPort
      )
        current = current.parent;
      const id = current?.userData.labPart as LabPartId | undefined;
      if (id) {
        selectedRef.current = id;
        setSelected(id);
      }
    };

    canvas.addEventListener('pointerup', pick);

    const resize = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    let frame = 0;
    const draw = () => {
      frame = requestAnimationFrame(draw);

      const activeTask = CONNECTION_TASKS[taskRef.current];
      for (const item of towerBuild.ports) {
        const material = item.material;
        if (!(material instanceof THREE.MeshStandardMaterial)) continue;
        const target =
          modeRef.current === 'connect' &&
          item.userData.labPort === activeTask.targetPort;
        material.emissive.setHex(target ? 0x1b5963 : 0x000000);
        material.emissiveIntensity = target ? 1.45 : 0;
        const pulse = 1 + Math.sin(performance.now() * 0.006) * 0.04;
        item.scale.setScalar(target ? pulse : 1);
      }

      for (const [id, cable] of cables)
        cable.visible = connectedRef.current.includes(id);

      for (const [partId, group] of groups) {
        group.traverse((object) => {
          if (!('isMesh' in object) || !(object as THREE.Mesh).isMesh) return;
          if (object.userData.labPort) return;
          const item = object as THREE.Mesh;
          const materials = Array.isArray(item.material)
            ? item.material
            : [item.material];
          for (const material of materials) {
            if (!(material instanceof THREE.MeshStandardMaterial)) continue;
            const selectedNow =
              modeRef.current === 'explore' &&
              partId === selectedRef.current;
            material.emissive.setHex(selectedNow ? 0x102f35 : 0x000000);
            material.emissiveIntensity = selectedNow ? 0.48 : 0;
          }
        });
      }

      controls.update();
      renderer.render(scene, camera);
    };
    draw();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener('pointerup', pick);
      controls.dispose();
      renderer.dispose();
      scene.traverse((object) => {
        if (!('isMesh' in object) || !(object as THREE.Mesh).isMesh) return;
        const item = object as THREE.Mesh;
        item.geometry.dispose();
        const materials = Array.isArray(item.material)
          ? item.material
          : [item.material];
        for (const material of materials) {
          if (
            'map' in material &&
            material.map instanceof THREE.Texture
          )
            material.map.dispose();
          material.dispose();
        }
      });
    };
  }, []);

  const resetConnections = () => {
    connectedRef.current = [];
    taskRef.current = 0;
    setConnected([]);
    setTaskIndex(0);
    setFeedback('Start with the keyboard. Find the highlighted USB port.');
  };

  const chooseMode = (mode: LabMode) => {
    setGuided(false);
    modeRef.current = mode;
    setLabMode(mode);
    if (mode === 'connect') {
      setFeedback(
        allConnected
          ? 'All five connections are complete. Reset them to practise again.'
          : currentTask.instruction,
      );
    }
  };

  const startGuide = () => {
    setGuided(true);
    setGuideIndex(0);
    modeRef.current = 'explore';
    setLabMode('explore');
    selectedRef.current = GUIDE_ORDER[0];
    setSelected(GUIDE_ORDER[0]);
  };

  const moveGuide = (direction: -1 | 1) => {
    const next = Math.min(
      GUIDE_ORDER.length - 1,
      Math.max(0, guideIndex + direction),
    );
    setGuideIndex(next);
    selectedRef.current = GUIDE_ORDER[next];
    setSelected(GUIDE_ORDER[next]);
  };

  return (
    <main className="computer-lab">
      <header className="lab-topbar">
        <div className="lab-brand">
          <span className="lab-brand-icon">
            <Box size={20} />
          </span>
          <span>
            <strong>Big Change Computer Lab</strong>
            <small>LEARN THE WHOLE COMPUTER</small>
          </span>
        </div>

        <div className="lab-mode-switch" aria-label="Computer Lab activity">
          <button
            type="button"
            className={labMode === 'explore' && !guided ? 'active' : ''}
            onClick={() => chooseMode('explore')}
          >
            <Rotate3D size={15} />
            Explore
          </button>
          <button
            type="button"
            className={guided ? 'active' : ''}
            onClick={startGuide}
          >
            <BookOpen size={15} />
            Guided
          </button>
          <button
            type="button"
            className={labMode === 'connect' ? 'active' : ''}
            onClick={() => chooseMode('connect')}
          >
            <Cable size={15} />
            Connections
          </button>
        </div>

        <div className="lab-machine-actions">
          <button type="button" className="lab-open-pc" onClick={onOpenLaptop}>
            <Laptop size={16} />
            <span>Laptop Lab</span>
          </button>
          <button type="button" className="lab-open-pc" onClick={onOpenPC}>
            <PcCase size={16} />
            <span>Explore inside the PC</span>
          </button>
        </div>
      </header>

      <aside className="lab-parts" aria-label="Computer setup learning panel">
        <p className="lab-eyebrow">
          {guided
            ? `GUIDED LESSON · ${guideIndex + 1} / ${GUIDE_ORDER.length}`
            : labMode === 'explore'
              ? '01 / COMPUTER SETUP'
              : '02 / CONNECTIONS'}
        </p>
        <h1>
          {guided
            ? guidePart.name
            : labMode === 'explore'
              ? 'Meet the whole computer.'
              : 'Connect the devices.'}
        </h1>
        <p className="lab-intro">
          {guided
            ? guidePart.description
            : labMode === 'explore'
              ? 'Start with the equipment students see every day, then move inside the system unit.'
              : 'Follow the tasks in order. Rotate the 3D setup and click the highlighted port on the system unit.'}
        </p>

        {guided && (
          <div className="lab-progress" aria-label="Whole computer lesson progress">
            <span
              style={{
                width: ((guideIndex + 1) / GUIDE_ORDER.length) * 100 + '%',
              }}
            />
          </div>
        )}

        {labMode === 'explore' ? (
          <div className="lab-part-list">
            {PARTS.map((part) => {
              const Icon = part.icon;
              return (
                <button
                  type="button"
                  key={part.id}
                  className={selected === part.id ? 'active' : ''}
                  onClick={() => {
                    setGuided(false);
                    selectedRef.current = part.id;
                    setSelected(part.id);
                  }}
                  aria-pressed={selected === part.id}
                >
                  <Icon size={18} />
                  <span>{part.name}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="lab-task-list">
            {CONNECTION_TASKS.map((task, index) => {
              const done = connected.includes(task.id);
              return (
                <button
                  type="button"
                  key={task.id}
                  className={
                    (index === taskIndex && !done ? 'active ' : '') +
                    (done ? 'done' : '')
                  }
                  onClick={() => {
                    taskRef.current = index;
                    setTaskIndex(index);
                    setFeedback(
                      done
                        ? task.name + ' is already connected.'
                        : task.instruction,
                    );
                  }}
                >
                  {done ? <CheckCircle2 size={17} /> : <Circle size={17} />}
                  <span>{task.name}</span>
                </button>
              );
            })}
            <button
              type="button"
              className="lab-reset-connections"
              onClick={resetConnections}
            >
              Reset connections
            </button>
          </div>
        )}

        <div className="lab-next">
          <strong>Graphic upgrade</strong>
          <span>CC0 low-poly tower · original Big Change peripherals</span>
        </div>
      </aside>

      <section className="lab-stage" aria-label="Interactive 3D computer setup">
        <canvas
          ref={canvasRef}
          aria-label="3D desktop computer setup. Drag to orbit and click a component or port."
        />
        <div className="lab-stage-tip">
          <Rotate3D size={15} />
          {labMode === 'explore'
            ? 'Drag to orbit · scroll to zoom · click a part'
            : 'Drag to orbit · find the glowing port · click to connect'}
        </div>
      </section>

      <aside className="lab-detail" aria-live="polite">
        {labMode === 'explore' ? (
          <>
            <p className="lab-eyebrow">
              {guided
                ? `LESSON STEP ${guideIndex + 1} / ${GUIDE_ORDER.length}`
                : 'SELECTED COMPONENT'}
            </p>
            <h2>{selectedPart.name}</h2>
            <p>{selectedPart.description}</p>
            <div className="lab-lesson">
              <strong>{guided ? 'Why it matters' : 'What students learn next'}</strong>
              <p>{selectedPart.lesson}</p>
            </div>
            {guided ? (
              <div className="lab-guide-controls">
                <button
                  type="button"
                  disabled={guideIndex === 0}
                  onClick={() => moveGuide(-1)}
                >
                  ← Back
                </button>
                {guideIndex < GUIDE_ORDER.length - 1 ? (
                  <button type="button" onClick={() => moveGuide(1)}>
                    Next →
                  </button>
                ) : (
                  <button type="button" onClick={onOpenPC}>
                    Continue inside PC →
                  </button>
                )}
              </div>
            ) : (
              selected === 'tower' && (
                <button
                  type="button"
                  className="lab-primary-action"
                  onClick={onOpenPC}
                >
                  Open the system unit
                  <span>→</span>
                </button>
              )
            )}
          </>
        ) : (
          <>
            <p className="lab-eyebrow">CONNECTION CHALLENGE</p>
            <h2>{allConnected ? 'Setup connected!' : currentTask.name}</h2>
            <p>
              {allConnected
                ? 'The keyboard, mouse, monitor, network and system unit power connections are complete.'
                : currentTask.instruction}
            </p>
            <div className="lab-lesson">
              <strong>Feedback</strong>
              <p>{feedback}</p>
            </div>
            <div className="lab-port-key">
              <span>
                <i className="usb" /> USB
              </span>
              <span>
                <i className="hdmi" /> HDMI
              </span>
              <span>
                <i className="ethernet" /> Ethernet
              </span>
              <span>
                <i className="power" /> Power
              </span>
            </div>
            {allConnected && (
              <button
                type="button"
                className="lab-primary-action"
                onClick={resetConnections}
              >
                Practise again
                <span>↻</span>
              </button>
            )}
          </>
        )}
      </aside>
    </main>
  );
}
