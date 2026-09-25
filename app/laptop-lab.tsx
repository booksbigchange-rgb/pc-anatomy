'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  BatteryCharging,
  BookOpen,
  Cable,
  CircuitBoard,
  Fan,
  HardDrive,
  Keyboard,
  Laptop,
  Monitor,
  MousePointer2,
  PanelTopOpen,
  Rotate3D,
  Volume2,
  Wifi,
} from 'lucide-react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

type LaptopView = 'outside' | 'inside';
type LaptopMode = 'explore' | 'connections';
type LaptopPortType = 'usb' | 'hdmi' | 'power' | 'audio';
type LaptopPortId =
  | 'usb-left'
  | 'usb-right'
  | 'hdmi-left'
  | 'power-left'
  | 'audio-right';
type LaptopConnectionId =
  | 'charger-power'
  | 'usb-device'
  | 'external-display'
  | 'headphones-audio';
type LaptopPartId =
  | 'display'
  | 'keyboard'
  | 'trackpad'
  | 'battery'
  | 'motherboard'
  | 'ssd'
  | 'fan'
  | 'wifi'
  | 'speakers';

type LaptopConnectionTask = {
  id: LaptopConnectionId;
  name: string;
  portType: LaptopPortType;
  targetPort: LaptopPortId;
  instruction: string;
  source: [number, number, number];
};

type LaptopPart = {
  id: LaptopPartId;
  name: string;
  icon: typeof Laptop;
  view: LaptopView;
  description: string;
  why: string;
};

const PARTS: LaptopPart[] = [
  {
    id: 'display',
    name: 'Display',
    icon: Monitor,
    view: 'outside',
    description:
      'The display turns the computer’s video signal into the pictures, text and motion you see.',
    why: 'Without a working display path, the laptop can still run but you may see a black screen.',
  },
  {
    id: 'keyboard',
    name: 'Keyboard',
    icon: Keyboard,
    view: 'outside',
    description:
      'The built-in keyboard is an input device connected directly to the laptop’s main board.',
    why: 'It lets you type, use shortcuts and control software without an external keyboard.',
  },
  {
    id: 'trackpad',
    name: 'Trackpad',
    icon: MousePointer2,
    view: 'outside',
    description:
      'The trackpad senses finger movement and gestures and turns them into pointer input.',
    why: 'It replaces the mouse when the laptop is used away from a desk.',
  },
  {
    id: 'battery',
    name: 'Battery',
    icon: BatteryCharging,
    view: 'inside',
    description:
      'The battery stores electrical energy so the laptop can run without being plugged in.',
    why: 'Battery capacity, age and power use determine how long the laptop can run unplugged.',
  },
  {
    id: 'motherboard',
    name: 'Motherboard',
    icon: CircuitBoard,
    view: 'inside',
    description:
      'The motherboard connects the laptop’s processor, memory, storage, ports and power system.',
    why: 'Most laptop components are smaller and more tightly integrated than in a desktop PC.',
  },
  {
    id: 'ssd',
    name: 'SSD',
    icon: HardDrive,
    view: 'inside',
    description:
      'The solid-state drive stores the operating system, apps and student files.',
    why: 'Storage keeps data even when the laptop is switched off.',
  },
  {
    id: 'fan',
    name: 'Cooling fan',
    icon: Fan,
    view: 'inside',
    description:
      'The fan moves air through the laptop to carry heat away from the processor.',
    why: 'Good cooling helps the processor stay fast and prevents overheating.',
  },
  {
    id: 'wifi',
    name: 'Wi-Fi card',
    icon: Wifi,
    view: 'inside',
    description:
      'The Wi-Fi module connects the laptop to wireless networks and often also provides Bluetooth.',
    why: 'It lets a portable computer reach the internet without an Ethernet cable.',
  },
  {
    id: 'speakers',
    name: 'Speakers',
    icon: Volume2,
    view: 'inside',
    description:
      'Small speakers turn electrical audio signals into sound.',
    why: 'They let students hear lessons, videos and alerts without external speakers.',
  },
];

const CONNECTION_TASKS: LaptopConnectionTask[] = [
  {
    id: 'charger-power',
    name: 'Charger → Power',
    portType: 'power',
    targetPort: 'power-left',
    instruction:
      'Connect the charger first. Find the small power port near the rear-left side.',
    source: [4.85, 0.82, 2.9],
  },
  {
    id: 'usb-device',
    name: 'USB device → USB',
    portType: 'usb',
    targetPort: 'usb-left',
    instruction:
      'Connect a USB device. Find the rectangular USB port on the left side.',
    source: [-4.85, 0.82, 2.25],
  },
  {
    id: 'external-display',
    name: 'Display → HDMI',
    portType: 'hdmi',
    targetPort: 'hdmi-left',
    instruction:
      'Connect an external display. Find the wider HDMI port on the left side.',
    source: [-4.85, 0.82, -0.6],
  },
  {
    id: 'headphones-audio',
    name: 'Headphones → Audio',
    portType: 'audio',
    targetPort: 'audio-right',
    instruction:
      'Connect headphones. Find the small round audio jack on the right side.',
    source: [4.85, 0.82, 1.5],
  },
];

const LESSON_ORDER: LaptopPartId[] = [
  'display',
  'keyboard',
  'trackpad',
  'battery',
  'motherboard',
  'ssd',
  'fan',
  'wifi',
  'speakers',
];

// Representative 15-inch-class laptop proportions.
 // Scene units are proportional rather than tied to a brand-specific model.
 const LAPTOP_DIMENSIONS = {
   baseWidth: 7.6,
   baseDepth: 5.05,
   baseThickness: 0.34,
   lidWidth: 7.32,
   lidHeight: 4.5,
   lidThickness: 0.22,
   screenWidth: 6.92,
   screenHeight: 3.89, // ~16:9
   hingeZ: -2.34,
 } as const;

const PORT_TYPES: Record<LaptopPortId, LaptopPortType> = {
  'usb-left': 'usb',
  'usb-right': 'usb',
  'hdmi-left': 'hdmi',
  'power-left': 'power',
  'audio-right': 'audio',
};

const COLORS = {
  background: 0x10171d,
  floor: 0x151c21,
  shell: 0xaeb7bd,
  shellDark: 0x69757c,
  keys: 0x252c31,
  keyText: 0x8c989e,
  screen: 0x153443,
  accent: 0x79cdd6,
  battery: 0x353e44,
  board: 0x2e6658,
  boardDark: 0x24483f,
  copper: 0xb87949,
  ssd: 0x3f4c55,
  speaker: 0x2a3035,
};

function mesh(
  geometry: THREE.BufferGeometry,
  color: number,
  roughness = 0.55,
  metalness = 0.16,
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
  roughness = 0.55,
  metalness = 0.16,
) {
  return mesh(
    new RoundedBoxGeometry(width, height, depth, 4, radius),
    color,
    roughness,
    metalness,
  );
}

function tag(group: THREE.Group, id: LaptopPartId) {
  group.userData.laptopPart = id;
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

function laptopPort(
  id: LaptopPortId,
  size: [number, number, number],
  position: [number, number, number],
  color: number,
) {
  const item = rounded(
    size[0],
    size[1],
    size[2],
    Math.min(...size) * 0.22,
    color,
    0.28,
    0.4,
  );
  item.position.set(...position);
  item.userData.laptopPort = id;
  item.userData.portType = PORT_TYPES[id];
  return item;
}

function connectionCable(start: THREE.Vector3, end: THREE.Vector3) {
  const middle = start.clone().lerp(end, 0.5);
  middle.y = Math.max(0.65, Math.min(start.y, end.y) - 0.28);
  const curve = new THREE.CatmullRomCurve3([start, middle, end]);
  const geometry = new THREE.TubeGeometry(curve, 26, 0.035, 8, false);
  const material = new THREE.MeshStandardMaterial({
    color: 0x7fcbd5,
    roughness: 0.5,
    metalness: 0.05,
    emissive: 0x0e3036,
    emissiveIntensity: 0.34,
  });
  const cable = new THREE.Mesh(geometry, material);
  cable.castShadow = true;
  return cable;
}

function makeScreenTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 640;
  const context = canvas.getContext('2d');
  if (!context) return null;

  const gradient = context.createLinearGradient(0, 0, 1024, 640);
  gradient.addColorStop(0, '#0c2631');
  gradient.addColorStop(0.55, '#18414d');
  gradient.addColorStop(1, '#21545d');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1024, 640);

  const glow = context.createRadialGradient(760, 170, 10, 760, 170, 420);
  glow.addColorStop(0, 'rgba(130,235,230,.48)');
  glow.addColorStop(1, 'rgba(130,235,230,0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, 1024, 640);

  context.fillStyle = '#e5fbfd';
  context.font = '700 62px Segoe UI, Arial, sans-serif';
  context.fillText('BIG CHANGE', 74, 248);
  context.fillStyle = '#8ed8df';
  context.font = '600 30px Segoe UI, Arial, sans-serif';
  context.fillText('LAPTOP LAB', 76, 296);
  context.fillStyle = 'rgba(239,250,251,.72)';
  context.font = '400 22px Segoe UI, Arial, sans-serif';
  context.fillText('Outside → Inside → Understand', 76, 354);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function buildLaptop() {
  const root = new THREE.Group();
  const outside = new THREE.Group();
  const inside = new THREE.Group();

  const base = rounded(
    LAPTOP_DIMENSIONS.baseWidth,
    LAPTOP_DIMENSIONS.baseThickness,
    LAPTOP_DIMENSIONS.baseDepth,
    0.2,
    COLORS.shell,
    0.34,
    0.54,
  );
  base.position.y = 0.86;
  outside.add(base);

  const deck = rounded(7.18, 0.08, 4.63, 0.16, 0x9da8af, 0.42, 0.44);
  deck.position.y = 1.05;
  outside.add(deck);

  const keyboard = new THREE.Group();
  const keyGeometry = new RoundedBoxGeometry(0.36, 0.08, 0.33, 3, 0.045);
  for (let row = 0; row < 5; row++) {
    const count = row === 4 ? 10 : 15;
    const width = (count - 1) * 0.42;
    for (let column = 0; column < count; column++) {
      const key = mesh(
        keyGeometry.clone(),
        row === 0 && column === 0 ? COLORS.accent : COLORS.keys,
        0.62,
        0.08,
      );
      key.position.set(-width / 2 + column * 0.42, 1.13, -1.42 + row * 0.48);
      keyboard.add(key);
    }
  }
  const space = rounded(2.55, 0.08, 0.32, 0.05, COLORS.keys, 0.62, 0.08);
  space.position.set(0, 1.13, 0.5);
  keyboard.add(space);
  outside.add(tag(keyboard, 'keyboard'));

  const trackpad = new THREE.Group();
  const trackpadSurface = rounded(2.78, 0.035, 1.45, 0.12, 0x87939a, 0.38, 0.38);
  trackpadSurface.position.set(0, 1.115, 1.58);
  trackpad.add(trackpadSurface);
  outside.add(tag(trackpad, 'trackpad'));

  const hinge = mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 6.35, 24),
    COLORS.shellDark,
    0.32,
    0.52,
  );
  hinge.rotation.z = Math.PI / 2;
  hinge.position.set(0, 1.02, LAPTOP_DIMENSIONS.hingeZ);
  outside.add(hinge);

  // The lid pivots from the hinge. The earlier prototype positioned the lid
  // independently, which made it sit too far behind the base.
  const displayPivot = new THREE.Group();
  displayPivot.position.set(0, 1.04, LAPTOP_DIMENSIONS.hingeZ);
  displayPivot.rotation.x = -0.14;

  const displayGroup = new THREE.Group();
  const lidFrame = rounded(
    LAPTOP_DIMENSIONS.lidWidth,
    LAPTOP_DIMENSIONS.lidHeight,
    LAPTOP_DIMENSIONS.lidThickness,
    0.2,
    COLORS.shell,
    0.34,
    0.52,
  );
  lidFrame.position.set(0, LAPTOP_DIMENSIONS.lidHeight / 2, 0);
  displayGroup.add(lidFrame);

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(
      LAPTOP_DIMENSIONS.screenWidth,
      LAPTOP_DIMENSIONS.screenHeight,
    ),
    new THREE.MeshBasicMaterial({
      color: COLORS.screen,
      map: makeScreenTexture() ?? undefined,
    }),
  );
  screen.position.set(
    0,
    LAPTOP_DIMENSIONS.lidHeight / 2,
    LAPTOP_DIMENSIONS.lidThickness / 2 + 0.006,
  );
  displayGroup.add(screen);

  const webcam = mesh(
    new THREE.SphereGeometry(0.055, 16, 10),
    0x111619,
    0.28,
    0.12,
  );
  webcam.position.set(
    0,
    LAPTOP_DIMENSIONS.lidHeight - 0.19,
    LAPTOP_DIMENSIONS.lidThickness / 2 + 0.018,
  );
  displayGroup.add(webcam);
  displayPivot.add(tag(displayGroup, 'display'));
  outside.add(displayPivot);

  const ports: THREE.Mesh[] = [
    laptopPort('usb-left', [0.06, 0.16, 0.48], [-3.82, 0.96, -0.95], 0x4e8394),
    laptopPort('usb-right', [0.06, 0.16, 0.48], [3.82, 0.96, -0.45], 0x4e8394),
    laptopPort('hdmi-left', [0.06, 0.18, 0.58], [-3.82, 0.96, 0.02], 0x8e7ca8),
    laptopPort('power-left', [0.06, 0.16, 0.28], [-3.82, 0.96, 1.25], 0xa98265),
    laptopPort('audio-right', [0.06, 0.2, 0.2], [3.82, 0.96, 1.12], 0x8aa08e),
  ];
  outside.add(...ports);

  const lowerShell = rounded(7.34, 0.28, 4.82, 0.2, 0x69747a, 0.4, 0.44);
  lowerShell.position.y = 0.6;
  inside.add(lowerShell);

  const battery = new THREE.Group();
  const batteryBody = rounded(5.55, 0.28, 1.55, 0.14, COLORS.battery, 0.48, 0.12);
  batteryBody.position.set(0, 1.0, 1.18);
  battery.add(batteryBody);
  for (const x of [-2.0, -1.0, 0, 1.0, 2.0]) {
    const cellMark = rounded(0.55, 0.02, 1.18, 0.06, 0x454f55, 0.72, 0.04);
    cellMark.position.set(x, 1.16, 1.18);
    battery.add(cellMark);
  }
  inside.add(tag(battery, 'battery'));

  const board = new THREE.Group();
  const boardMain = rounded(5.25, 0.12, 1.75, 0.1, COLORS.board, 0.58, 0.08);
  boardMain.position.set(-0.4, 1.0, -1.05);
  board.add(boardMain);
  for (const [x, z, w, d, color] of [
    [-1.55, -1.15, 0.75, 0.65, 0x34393d],
    [-0.55, -0.9, 0.9, 0.72, 0x1c2326],
    [0.55, -1.32, 0.62, 0.46, 0x2c3439],
    [1.45, -0.8, 0.78, 0.6, 0x232a2e],
  ] as const) {
    const chip = rounded(w, 0.16, d, 0.06, color, 0.42, 0.18);
    chip.position.set(x, 1.12, z);
    board.add(chip);
  }
  const heatPipe = mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.55, 1.26, -0.98),
        new THREE.Vector3(0.3, 1.28, -1.15),
        new THREE.Vector3(1.15, 1.28, -1.35),
      ]),
      24,
      0.055,
      8,
      false,
    ),
    COLORS.copper,
    0.32,
    0.62,
  );
  board.add(heatPipe);
  inside.add(tag(board, 'motherboard'));

  const ssdGroup = new THREE.Group();
  const ssd = rounded(1.7, 0.12, 0.55, 0.07, COLORS.ssd, 0.5, 0.2);
  ssd.position.set(1.65, 1.05, 0.18);
  ssdGroup.add(ssd);
  const ssdLabel = rounded(0.9, 0.02, 0.28, 0.04, COLORS.accent, 0.52, 0.02);
  ssdLabel.position.set(1.65, 1.12, 0.18);
  ssdGroup.add(ssdLabel);
  inside.add(tag(ssdGroup, 'ssd'));

  const fanGroup = new THREE.Group();
  const fanHousing = mesh(
    new THREE.CylinderGeometry(0.56, 0.56, 0.18, 32),
    0x252d31,
    0.38,
    0.24,
  );
  fanHousing.rotation.x = Math.PI / 2;
  fanHousing.position.set(2.4, 1.08, -1.22);
  fanGroup.add(fanHousing);
  for (let index = 0; index < 8; index++) {
    const blade = rounded(0.11, 0.04, 0.4, 0.04, 0x526068, 0.48, 0.1);
    blade.position.set(2.4, 1.18, -1.22);
    blade.rotation.y = (Math.PI * 2 * index) / 8;
    blade.translateZ(0.18);
    fanGroup.add(blade);
  }
  inside.add(tag(fanGroup, 'fan'));

  const wifiGroup = new THREE.Group();
  const wifi = rounded(0.72, 0.12, 0.52, 0.06, 0x4d5d66, 0.48, 0.16);
  wifi.position.set(-2.65, 1.04, 0.05);
  wifiGroup.add(wifi);
  for (const x of [-2.78, -2.52]) {
    const antenna = mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(x, 1.12, 0.05),
          new THREE.Vector3(x - 0.3, 1.16, -0.65),
          new THREE.Vector3(x - 0.5, 1.2, -1.9),
        ]),
        18,
        0.016,
        6,
        false,
      ),
      0xc4c9cc,
      0.5,
      0.24,
    );
    wifiGroup.add(antenna);
  }
  inside.add(tag(wifiGroup, 'wifi'));

  const speakers = new THREE.Group();
  for (const x of [-3.0, 3.0]) {
    const speaker = rounded(0.62, 0.18, 1.15, 0.09, COLORS.speaker, 0.54, 0.08);
    speaker.position.set(x, 1.02, 1.28);
    speakers.add(speaker);
    for (const z of [0.95, 1.25, 1.55]) {
      const slot = rounded(0.35, 0.02, 0.055, 0.02, 0x56636a, 0.7, 0.02);
      slot.position.set(x, 1.13, z);
      speakers.add(slot);
    }
  }
  inside.add(tag(speakers, 'speakers'));

  inside.visible = false;
  root.add(outside, inside);
  root.position.set(0, -0.05, 0.2);

  return { root, outside, inside, ports };
}

function addEnvironment(scene: THREE.Scene) {
  const table = rounded(12.5, 0.5, 7.3, 0.18, 0x846f5e, 0.72, 0.04);
  table.position.set(0, 0.3, 0.2);
  table.receiveShadow = true;
  scene.add(table);

  const mat = rounded(9.1, 0.035, 5.6, 0.12, 0x20282d, 0.84, 0.02);
  mat.position.set(0, 0.58, 0.1);
  scene.add(mat);

  const floor = mesh(
    new THREE.PlaneGeometry(38, 38),
    COLORS.floor,
    0.92,
    0.01,
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.0;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(32, 32, 0x34454d, 0x26343a);
  grid.position.y = -1.985;
  const materials = Array.isArray(grid.material) ? grid.material : [grid.material];
  for (const material of materials) {
    material.transparent = true;
    material.opacity = 0.18;
  }
  scene.add(grid);
}

export default function LaptopLab({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selectedRef = useRef<LaptopPartId>('display');
  const viewRef = useRef<LaptopView>('outside');

  const [view, setView] = useState<LaptopView>('outside');
  const [selected, setSelected] = useState<LaptopPartId>('display');
  const [guided, setGuided] = useState(false);
  const [lessonIndex, setLessonIndex] = useState(0);

  const visibleParts = PARTS.filter((part) => part.view === view);
  const selectedPart =
    PARTS.find((part) => part.id === selected) ?? visibleParts[0];
  const lessonPart =
    PARTS.find((part) => part.id === LESSON_ORDER[lessonIndex]) ?? PARTS[0];

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.background);
    scene.fog = new THREE.Fog(COLORS.background, 16, 34);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(10.8, 7.7, 12.4);

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
    renderer.toneMappingExposure = 1.16;

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.enablePan = false;
    controls.minDistance = 8;
    controls.maxDistance = 22;
    controls.minPolarAngle = 0.3;
    controls.maxPolarAngle = Math.PI / 2.02;
    controls.target.set(0, 1.65, -0.25);

    scene.add(new THREE.HemisphereLight(0xd8efff, 0x3a312d, 1.85));
    const key = new THREE.DirectionalLight(0xfff4e9, 3.6);
    key.position.set(7, 10, 8);
    key.castShadow = true;
    key.shadow.mapSize.set(1536, 1536);
    key.shadow.camera.left = -10;
    key.shadow.camera.right = 10;
    key.shadow.camera.top = 10;
    key.shadow.camera.bottom = -10;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0x8eb8ff, 1.0);
    fill.position.set(-8, 5, 5);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0x82e0db, 0.95);
    rim.position.set(5, 7, -8);
    scene.add(rim);

    addEnvironment(scene);

    const laptop = buildLaptop();
    scene.add(laptop.root);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const pick = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const target =
        viewRef.current === 'outside' ? laptop.outside : laptop.inside;
      const hit = raycaster.intersectObject(target, true)[0];
      if (!hit) return;

      let current: THREE.Object3D | null = hit.object;
      while (current && !current.userData.laptopPart) current = current.parent;
      const id = current?.userData.laptopPart as LaptopPartId | undefined;
      if (!id) return;
      selectedRef.current = id;
      setSelected(id);
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
      const insideNow = viewRef.current === 'inside';
      laptop.outside.visible = !insideNow;
      laptop.inside.visible = insideNow;

      const activeRoot = insideNow ? laptop.inside : laptop.outside;
      activeRoot.traverse((object) => {
        if (!('isMesh' in object) || !(object as THREE.Mesh).isMesh) return;
        const item = object as THREE.Mesh;
        const materials = Array.isArray(item.material)
          ? item.material
          : [item.material];
        let owner: THREE.Object3D | null = object;
        while (owner && !owner.userData.laptopPart) owner = owner.parent;
        const selectedNow =
          owner?.userData.laptopPart === selectedRef.current;
        for (const material of materials) {
          if (!(material instanceof THREE.MeshStandardMaterial)) continue;
          material.emissive.setHex(selectedNow ? 0x10353b : 0x000000);
          material.emissiveIntensity = selectedNow ? 0.5 : 0;
        }
      });

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
          if ('map' in material && material.map instanceof THREE.Texture)
            material.map.dispose();
          material.dispose();
        }
      });
    };
  }, []);

  const selectPart = (id: LaptopPartId) => {
    const part = PARTS.find((candidate) => candidate.id === id);
    if (!part) return;
    viewRef.current = part.view;
    setView(part.view);
    selectedRef.current = part.id;
    setSelected(part.id);
  };

  const changeView = (next: LaptopView) => {
    setGuided(false);
    viewRef.current = next;
    setView(next);
    const first = PARTS.find((part) => part.view === next)!;
    selectedRef.current = first.id;
    setSelected(first.id);
  };

  const startGuide = () => {
    setGuided(true);
    setLessonIndex(0);
    selectPart(LESSON_ORDER[0]);
  };

  const moveGuide = (direction: -1 | 1) => {
    const next = Math.min(
      LESSON_ORDER.length - 1,
      Math.max(0, lessonIndex + direction),
    );
    setLessonIndex(next);
    selectPart(LESSON_ORDER[next]);
  };

  return (
    <main className="laptop-lab">
      <header className="laptop-topbar">
        <button type="button" className="laptop-back" onClick={onBack}>
          <ArrowLeft size={16} />
          Desktop setup
        </button>
        <div className="laptop-brand">
          <span className="laptop-brand-icon">
            <Laptop size={20} />
          </span>
          <span>
            <strong>Big Change Laptop Lab</strong>
            <small>OUTSIDE → INSIDE</small>
          </span>
        </div>
        <div className="laptop-header-actions">
          <button
            type="button"
            className={'laptop-guide-button' + (guided ? ' active' : '')}
            onClick={startGuide}
          >
            <BookOpen size={15} />
            Guided lesson
          </button>
          <div className="laptop-view-switch">
          <button
            type="button"
            className={view === 'outside' ? 'active' : ''}
            onClick={() => changeView('outside')}
          >
            <PanelTopOpen size={15} />
            Outside
          </button>
          <button
            type="button"
            className={view === 'inside' ? 'active' : ''}
            onClick={() => changeView('inside')}
          >
            <CircuitBoard size={15} />
            Inside
          </button>
          </div>
        </div>
      </header>

      <aside className="laptop-parts">
        <p className="laptop-eyebrow">
          {guided
            ? `GUIDED LESSON · ${lessonIndex + 1} / ${LESSON_ORDER.length}`
            : view === 'outside'
              ? '01 / LAPTOP EXTERIOR'
              : '02 / LAPTOP INTERNALS'}
        </p>
        <h1>
          {guided
            ? lessonPart.name
            : view === 'outside'
              ? 'Start with what students touch.'
              : 'Now look under the keyboard.'}
        </h1>
        <p className="laptop-intro">
          {guided
            ? lessonPart.description
            : view === 'outside'
              ? 'Explore the screen, keyboard and trackpad before opening the machine.'
              : 'Laptop parts are smaller and packed closer together than desktop components.'}
        </p>
        {guided && (
          <div className="laptop-progress" aria-label="Laptop lesson progress">
            <span
              style={{
                width:
                  ((lessonIndex + 1) / LESSON_ORDER.length) * 100 + '%',
              }}
            />
          </div>
        )}
        <div className="laptop-part-list">
          {visibleParts.map((part) => {
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
              >
                <Icon size={17} />
                <span>{part.name}</span>
              </button>
            );
          })}
        </div>
        <div className="laptop-next">
          <strong>{guided ? 'Lesson path' : 'Next laptop milestone'}</strong>
          <span>
            {guided
              ? 'Outside first, then the main components inside.'
              : 'Ports · charger · connection practice · improved exterior model'}
          </span>
        </div>
      </aside>

      <section className="laptop-stage">
        <canvas
          ref={canvasRef}
          aria-label="Interactive 3D laptop. Drag to orbit and click a component."
        />
        <div className="laptop-stage-tip">
          <Rotate3D size={15} />
          Drag to orbit · scroll to zoom · click a part
        </div>
      </section>

      <aside className="laptop-detail" aria-live="polite">
        <p className="laptop-eyebrow">
          {guided
            ? `LESSON STEP ${lessonIndex + 1} / ${LESSON_ORDER.length}`
            : 'SELECTED COMPONENT'}
        </p>
        <h2>{selectedPart.name}</h2>
        <p>{selectedPart.description}</p>
        <div className="laptop-why">
          <strong>Why it matters</strong>
          <p>{selectedPart.why}</p>
        </div>
        {guided ? (
          <div className="laptop-guide-controls">
            <button
              type="button"
              disabled={lessonIndex === 0}
              onClick={() => moveGuide(-1)}
            >
              ← Back
            </button>
            {lessonIndex < LESSON_ORDER.length - 1 ? (
              <button type="button" onClick={() => moveGuide(1)}>
                Next →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setGuided(false);
                  selectPart('display');
                }}
              >
                Finish lesson ✓
              </button>
            )}
          </div>
        ) : view === 'outside' ? (
          <button
            type="button"
            className="laptop-primary"
            onClick={() => changeView('inside')}
          >
            Open the laptop
            <span>→</span>
          </button>
        ) : (
          <button
            type="button"
            className="laptop-primary"
            onClick={() => changeView('outside')}
          >
            Put the laptop back together
            <span>↻</span>
          </button>
        )}
      </aside>
    </main>
  );
}
