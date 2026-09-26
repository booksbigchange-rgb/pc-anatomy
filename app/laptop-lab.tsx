'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  BatteryCharging,
  BookOpen,
  Cable,
  CircuitBoard,
  Cpu,
  Fan,
  HardDrive,
  Keyboard,
  Laptop,
  MemoryStick,
  Monitor,
  MousePointer2,
  PanelTopOpen,
  Pause,
  Play,
  Scan,
  Rotate3D,
  RotateCcw,
  Volume2,
  Wifi,
} from 'lucide-react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  applyLaptopTeardown,
  buildRealisticLaptopInternals,
  type LaptopInternalCableId,
} from './laptop-internals';
import { useDisassemblyPlayback } from './use-disassembly-playback';

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
  | 'cpu'
  | 'ram'
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
    id: 'cpu',
    name: 'Processor (CPU)',
    icon: Cpu,
    view: 'inside',
    description:
      'The processor is a compact package mounted on the motherboard under the cooling system.',
    why: 'It executes program instructions and produces much of the heat carried away by the heat pipes and fan.',
  },
  {
    id: 'ram',
    name: 'RAM / SODIMM',
    icon: MemoryStick,
    view: 'inside',
    description:
      'Laptop memory uses compact SODIMM modules installed in dedicated memory sockets.',
    why: 'RAM holds working data for running programs and can often be upgraded separately from storage.',
  },
  {
    id: 'ssd',
    name: 'M.2 SSD',
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
  'cpu',
  'ram',
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

  const realisticInternals = buildRealisticLaptopInternals();
  inside.add(realisticInternals.inside);

  // Separate service display assembly for Laptop Anatomy. The real Framework
  // display/hinges/webcam are loaded into these mounts at runtime; keeping the
  // display as one parent lets the teardown move it as a mechanically related
  // assembly instead of scattering the parts radially.
  const serviceDisplayAssembly = new THREE.Group();
  serviceDisplayAssembly.position.set(0, 1.04, LAPTOP_DIMENSIONS.hingeZ);
  serviceDisplayAssembly.rotation.x = -0.14;

  const serviceDisplayMount = new THREE.Group();
  const serviceHingeLeft = new THREE.Group();
  const serviceHingeRight = new THREE.Group();
  const serviceWebcam = new THREE.Group();

  serviceDisplayAssembly.add(
    serviceDisplayMount,
    serviceHingeLeft,
    serviceHingeRight,
    serviceWebcam,
  );
  inside.add(tag(serviceDisplayAssembly, 'display'));

  realisticInternals.teardownParts.push({
    object: serviceDisplayAssembly,
    start: 90,
    end: 100,
    homePosition: serviceDisplayAssembly.position.clone(),
    homeRotation: serviceDisplayAssembly.rotation.clone(),
    offset: new THREE.Vector3(0, 2.8, -2.4),
    rotationOffset: new THREE.Vector3(-0.14, 0, 0),
  });

  inside.visible = false;
  root.add(outside, inside);
  root.position.set(0, -0.05, 0.2);

  return {
    root,
    outside,
    inside,
    ports,
    batteryMount: realisticInternals.batteryMount,
    motherboardMount: realisticInternals.motherboardMount,
    motherboardShell: realisticInternals.motherboardShell,
    serviceDisplayMount,
    serviceHingeLeft,
    serviceHingeRight,
    serviceWebcam,
    teardownParts: realisticInternals.teardownParts,
    disconnectCables: realisticInternals.disconnectCables,
  };
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
  const modeRef = useRef<LaptopMode>('explore');
  const guidedRef = useRef(false);
  const realisticRef = useRef(true);
  const connectionTaskRef = useRef(0);
  const connectedRef = useRef<LaptopConnectionId[]>([]);
  const disconnectedInternalCablesRef = useRef<LaptopInternalCableId[]>([]);
  const explodeRef = useRef(18);

  const [view, setView] = useState<LaptopView>('outside');
  const [selected, setSelected] = useState<LaptopPartId>('display');
  const [guided, setGuided] = useState(false);
  const [realisticExterior, setRealisticExterior] = useState(true);
  const [realisticLoaded, setRealisticLoaded] = useState(false);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [mode, setMode] = useState<LaptopMode>('explore');
  const [connectionTask, setConnectionTask] = useState(0);
  const [connected, setConnected] = useState<LaptopConnectionId[]>([]);
  const [connectionFeedback, setConnectionFeedback] = useState(
    'Choose Connections to practise the ports on a laptop.',
  );
  const [internalCableFeedback, setInternalCableFeedback] = useState(
    'Click a visible internal cable to unplug it before removing its part.',
  );
  const [disconnectedInternalCables, setDisconnectedInternalCables] = useState<
    LaptopInternalCableId[]
  >([]);
  const [explode, setExplodeValue] = useState(18);

  const updateExplode = useCallback((value: number) => {
    explodeRef.current = value;
    setExplodeValue(value);
  }, []);

  const {
    playing: teardownPlaying,
    setExplode,
    stop: stopTeardown,
    toggleAuto: toggleTeardown,
  } = useDisassemblyPlayback(explode, updateExplode);

  const visibleParts = PARTS.filter((part) => part.view === view);
  const selectedPart =
    PARTS.find((part) => part.id === selected) ?? visibleParts[0];
  const lessonPart =
    PARTS.find((part) => part.id === LESSON_ORDER[lessonIndex]) ?? PARTS[0];
  const currentConnection = CONNECTION_TASKS[connectionTask];
  const allConnectionsComplete = connected.length === CONNECTION_TASKS.length;
  const teardownStage =
    explode < 14
      ? 'Assembled'
      : explode < 32
        ? 'Bottom cover'
        : explode < 50
          ? 'Battery + service parts'
          : explode < 68
            ? 'Memory + speakers'
            : explode < 87
              ? 'Cooling + CPU'
              : explode < 96
                ? 'Motherboard'
                : 'Display + hinges';

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    guidedRef.current = guided;
  }, [guided]);

  useEffect(() => {
    realisticRef.current = realisticExterior;
  }, [realisticExterior]);

  useEffect(() => {
    connectionTaskRef.current = connectionTask;
  }, [connectionTask]);

  useEffect(() => {
    connectedRef.current = connected;
  }, [connected]);

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
    for (const cable of laptop.disconnectCables)
      cable.object.userData.laptopCable = cable.id;
    scene.add(laptop.root);

    const realisticLaptop = new THREE.Group();
    realisticLaptop.visible = false;
    scene.add(realisticLaptop);

    let disposed = false;
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      `${import.meta.env.BASE_URL}models/framework-laptop-13.glb`,
      (gltf) => {
        if (disposed) return;
        const model = gltf.scene;
        model.traverse((object) => {
          if (!('isMesh' in object) || !(object as THREE.Mesh).isMesh) return;
          const item = object as THREE.Mesh;
          item.castShadow = true;
          item.receiveShadow = true;
          item.material = new THREE.MeshStandardMaterial({
            color: 0xaab4ba,
            roughness: 0.38,
            metalness: 0.46,
          });
        });
        model.scale.setScalar(25.5);
        model.position.set(0, 0.74, 0.05);
        realisticLaptop.add(model);
        setRealisticLoaded(true);
      },
      undefined,
      () => {
        if (!disposed) {
          realisticRef.current = false;
          setRealisticExterior(false);
          setRealisticLoaded(false);
        }
      },
    );


    const loadFrameworkServicePart = (
      file: string,
      mount: THREE.Group,
      position: [number, number, number],
      rotation: [number, number, number],
      color: number,
      roughness: number,
      metalness: number,
    ) => {
      gltfLoader.load(
        `${import.meta.env.BASE_URL}models/framework-service/${file}.glb`,
        (gltf) => {
          if (disposed) return;
          const model = gltf.scene;
          model.scale.setScalar(25.5);
          model.position.set(...position);
          model.rotation.set(...rotation);
          model.traverse((object) => {
            if (!('isMesh' in object) || !(object as THREE.Mesh).isMesh) return;
            const item = object as THREE.Mesh;
            item.castShadow = true;
            item.receiveShadow = true;
            item.material = new THREE.MeshStandardMaterial({
              color,
              roughness,
              metalness,
            });
          });
          mount.add(model);
        },
        undefined,
        () => {
          // Keep the rest of Laptop Anatomy functional if a candidate asset
          // fails to load; service assets are visual accuracy upgrades.
        },
      );
    };

    loadFrameworkServicePart(
      'display-assembly',
      laptop.serviceDisplayMount,
      [0, 2.86, 0],
      [-Math.PI / 2, 0, 0],
      0xaeb7bd,
      0.34,
      0.5,
    );
    loadFrameworkServicePart(
      'hinge-left',
      laptop.serviceHingeLeft,
      [-2.82, 0.08, 0.02],
      [-Math.PI / 2, 0, 0],
      0x717b81,
      0.3,
      0.62,
    );
    loadFrameworkServicePart(
      'hinge-right',
      laptop.serviceHingeRight,
      [2.82, 0.08, 0.02],
      [-Math.PI / 2, Math.PI, 0],
      0x717b81,
      0.3,
      0.62,
    );
    loadFrameworkServicePart(
      'webcam',
      laptop.serviceWebcam,
      [0, 5.34, 0.16],
      [-Math.PI / 2, 0, 0],
      0x252c30,
      0.42,
      0.18,
    );

    gltfLoader.load(
      `${import.meta.env.BASE_URL}models/framework-laptop-13-battery.glb`,
      (gltf) => {
        if (disposed) return;

        // Replace the simplified fallback battery with Framework's official
        // CC BY 4.0 battery CAD, converted to a local web GLB.
        for (const child of laptop.batteryMount.children)
          child.visible = false;

        const batteryModel = gltf.scene;
        batteryModel.scale.setScalar(25.5);
        batteryModel.position.set(0, -0.1, 0);
        batteryModel.traverse((object) => {
          if (!('isMesh' in object) || !(object as THREE.Mesh).isMesh) return;
          const item = object as THREE.Mesh;
          item.castShadow = true;
          item.receiveShadow = true;
          item.material = new THREE.MeshStandardMaterial({
            color: 0x30383d,
            roughness: 0.48,
            metalness: 0.12,
          });
        });
        laptop.batteryMount.add(batteryModel);
      },
    );


    gltfLoader.load(
      `${import.meta.env.BASE_URL}models/framework-laptop-13-mainboard.glb`,
      (gltf) => {
        if (disposed) return;

        // Replace only the fallback PCB silhouette. The educational component
        // population stays on top, so students keep recognizable chips,
        // sockets and connectors while the board perimeter comes from
        // Framework's official 2D mechanical CAD.
        for (const child of laptop.motherboardShell.children)
          child.visible = false;

        const boardModel = gltf.scene;
        boardModel.scale.setScalar(25.5);
        boardModel.position.set(0, 0, 0);
        boardModel.traverse((object) => {
          if (!('isMesh' in object) || !(object as THREE.Mesh).isMesh) return;
          const item = object as THREE.Mesh;
          item.castShadow = true;
          item.receiveShadow = true;
          item.material = new THREE.MeshStandardMaterial({
            color: 0x24594e,
            roughness: 0.54,
            metalness: 0.06,
          });
        });
        laptop.motherboardShell.add(boardModel);
      },
      undefined,
      () => {
        // Keep the detailed procedural fallback if the CAD-derived candidate
        // is unavailable or fails validation.
      },
    );

    const replaceBoardConnector = (
      role: string,
      file: string,
      color: number,
      rotationY = 0,
    ) => {
      let mount: THREE.Object3D | null = null;
      laptop.motherboardMount.traverse((object) => {
        if (!mount && object.userData.connectorRole === role) mount = object;
      });
      if (!mount) return;

      gltfLoader.load(
        `${import.meta.env.BASE_URL}models/kicad/${file}.glb`,
        (gltf) => {
          if (disposed || !mount) return;

          // Keep the procedural teaching connector as a fallback, but hide it
          // once the pinned KiCad geometry has loaded successfully.
          for (const child of mount.children) child.visible = false;

          const model = gltf.scene;
          model.scale.setScalar(25.5);
          model.rotation.y = rotationY;
          model.traverse((object) => {
            if (!('isMesh' in object) || !(object as THREE.Mesh).isMesh) return;
            const item = object as THREE.Mesh;
            item.castShadow = true;
            item.receiveShadow = true;
            item.material = new THREE.MeshStandardMaterial({
              color,
              roughness: 0.36,
              metalness: 0.28,
            });
          });
          mount.add(model);
        },
        undefined,
        () => {
          // Local converted asset missing: retain the procedural fallback.
        },
      );
    };

    replaceBoardConnector('battery', 'battery-10pin', 0xd6d8d2);
    replaceBoardConnector('fan', 'fan-speaker-4pin', 0xd6d8d2);
    replaceBoardConnector('speaker', 'fan-speaker-4pin', 0xd6d8d2, Math.PI);
    replaceBoardConnector('display', 'display-41pin', 0xdedfd9);
    replaceBoardConnector('input-cover', 'input-51pin', 0xdedfd9);
    replaceBoardConnector('audio', 'audio-15pin', 0xe5e2da);

    scene.updateMatrixWorld(true);

    const portPosition = (id: LaptopPortId) => {
      const item = laptop.ports.find(
        (candidate) => candidate.userData.laptopPort === id,
      );
      return item?.getWorldPosition(new THREE.Vector3()) ?? new THREE.Vector3();
    };

    const connectionCables = new Map<LaptopConnectionId, THREE.Mesh>();
    const connectionMarkers: THREE.Mesh[] = [];
    for (const task of CONNECTION_TASKS) {
      const cable = connectionCable(
        new THREE.Vector3(...task.source),
        portPosition(task.targetPort),
      );
      cable.visible = false;
      connectionCables.set(task.id, cable);
      scene.add(cable);

      const sourceMarker = rounded(0.42, 0.16, 0.62, 0.06, 0x34434a, 0.48, 0.16);
      sourceMarker.position.set(...task.source);
      sourceMarker.position.y -= 0.04;
      sourceMarker.visible = false;
      connectionMarkers.push(sourceMarker);
      scene.add(sourceMarker);
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const pick = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      if (modeRef.current === 'connections') {
        const portHit = raycaster.intersectObjects(laptop.ports, false)[0];
        if (!portHit) {
          setConnectionFeedback(
            'That is not a port. Rotate the laptop and click the glowing connection.',
          );
          return;
        }

        const portId = portHit.object.userData.laptopPort as LaptopPortId;
        const clickedType = PORT_TYPES[portId];
        const task = CONNECTION_TASKS[connectionTaskRef.current];

        if (clickedType !== task.portType) {
          setConnectionFeedback(
            'Not quite. ' +
              task.name +
              ' needs a ' +
              task.portType.toUpperCase() +
              ' port.',
          );
          return;
        }

        if (portId !== task.targetPort) {
          setConnectionFeedback(
            'That port can work for a similar device, but this lesson uses the glowing target.',
          );
          return;
        }

        const nextConnected = connectedRef.current.includes(task.id)
          ? connectedRef.current
          : [...connectedRef.current, task.id];
        connectedRef.current = nextConnected;
        setConnected(nextConnected);
        setConnectionFeedback('Correct — ' + task.name + ' is connected.');

        const nextIndex = CONNECTION_TASKS.findIndex(
          (candidate, index) =>
            index > connectionTaskRef.current &&
            !nextConnected.includes(candidate.id),
        );
        if (nextIndex >= 0) {
          connectionTaskRef.current = nextIndex;
          setConnectionTask(nextIndex);
        }
        return;
      }

      const realisticNow =
        realisticRef.current &&
        !guidedRef.current &&
        modeRef.current === 'explore' &&
        viewRef.current === 'outside';
      if (realisticNow) return;

      if (
        viewRef.current === 'inside' &&
        modeRef.current === 'explore' &&
        !guidedRef.current
      ) {
        const cableObjects = laptop.disconnectCables
          .filter((cable) => explodeRef.current < cable.at)
          .map((cable) => cable.object);
        const cableHit = raycaster.intersectObjects(cableObjects, false)[0];
        const cableId = cableHit?.object.userData.laptopCable as
          | LaptopInternalCableId
          | undefined;
        if (cableId) {
          const next = disconnectedInternalCablesRef.current.includes(cableId)
            ? disconnectedInternalCablesRef.current.filter(
                (id) => id !== cableId,
              )
            : [...disconnectedInternalCablesRef.current, cableId];
          disconnectedInternalCablesRef.current = next;
          setDisconnectedInternalCables(next);
          setInternalCableFeedback(
            next.includes(cableId)
              ? cableId[0].toUpperCase() +
                  cableId.slice(1) +
                  ' cable unplugged. You can now continue the teardown.'
              : cableId[0].toUpperCase() +
                  cableId.slice(1) +
                  ' cable reconnected.',
          );
          return;
        }
      }

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
      const connectionMode = modeRef.current === 'connections';
      const insideNow = !connectionMode && viewRef.current === 'inside';
      const realisticNow =
        realisticRef.current &&
        realisticLaptop.children.length > 0 &&
        !guidedRef.current &&
        !connectionMode &&
        viewRef.current === 'outside';
      realisticLaptop.visible = realisticNow;
      laptop.outside.visible = !insideNow && !realisticNow;
      laptop.inside.visible = insideNow;

      const activeTask = CONNECTION_TASKS[connectionTaskRef.current];
      for (const item of laptop.ports) {
        const material = item.material;
        if (!(material instanceof THREE.MeshStandardMaterial)) continue;
        const target =
          connectionMode && item.userData.laptopPort === activeTask.targetPort;
        material.emissive.setHex(target ? 0x1d5d66 : 0x000000);
        material.emissiveIntensity = target ? 1.5 : 0;
        const pulse = 1 + Math.sin(performance.now() * 0.006) * 0.05;
        item.scale.setScalar(target ? pulse : 1);
      }

      for (const [id, cable] of connectionCables)
        cable.visible =
          connectionMode && connectedRef.current.includes(id);
      for (const marker of connectionMarkers)
        marker.visible = connectionMode;

      if (insideNow) {
        applyLaptopTeardown(laptop.teardownParts, explodeRef.current);
        for (const cable of laptop.disconnectCables) {
          const disconnected =
            disconnectedInternalCablesRef.current.includes(cable.id);
          cable.object.visible = explodeRef.current < cable.at;
          cable.object.position.copy(
            disconnected ? cable.unplugOffset : new THREE.Vector3(),
          );
          const cableMaterial = cable.object.material;
          if (cableMaterial instanceof THREE.MeshStandardMaterial) {
            cableMaterial.emissive.setHex(disconnected ? 0x6a3414 : 0x000000);
            cableMaterial.emissiveIntensity = disconnected ? 0.7 : 0;
          }
        }
      }

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
          !connectionMode &&
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
      disposed = true;
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
    modeRef.current = 'explore';
    setMode('explore');
    viewRef.current = part.view;
    setView(part.view);
    if (part.view === 'inside' && explodeRef.current < 18)
      setExplode(18);
    selectedRef.current = part.id;
    setSelected(part.id);
  };

  const changeView = (next: LaptopView) => {
    setGuided(false);
    stopTeardown();
    modeRef.current = 'explore';
    setMode('explore');
    viewRef.current = next;
    setView(next);
    setExplode(next === 'inside' ? 18 : 0);
    if (next === 'outside') {
      disconnectedInternalCablesRef.current = [];
      setDisconnectedInternalCables([]);
      setInternalCableFeedback(
        'Click a visible internal cable to unplug it before removing its part.',
      );
    }
    const first = PARTS.find((part) => part.view === next)!;
    selectedRef.current = first.id;
    setSelected(first.id);
  };

  const startGuide = () => {
    stopTeardown();
    setExplode(0);
    modeRef.current = 'explore';
    setMode('explore');
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

  const startConnections = () => {
    stopTeardown();
    setExplode(0);
    setGuided(false);
    modeRef.current = 'connections';
    setMode('connections');
    viewRef.current = 'outside';
    setView('outside');
    setConnectionFeedback(
      allConnectionsComplete
        ? 'All four connections are complete. Reset them to practise again.'
        : currentConnection.instruction,
    );
  };

  const resetConnections = () => {
    connectedRef.current = [];
    connectionTaskRef.current = 0;
    setConnected([]);
    setConnectionTask(0);
    setConnectionFeedback(CONNECTION_TASKS[0].instruction);
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
            className={
              'laptop-guide-button' +
              (realisticExterior && realisticLoaded ? ' active' : '')
            }
            onClick={() => {
              setGuided(false);
              guidedRef.current = false;
              modeRef.current = 'explore';
              setMode('explore');
              viewRef.current = 'outside';
              setView('outside');
              setRealisticExterior((value) => !value);
            }}
            title="Toggle the realistic CAD exterior preview"
          >
            <Scan size={15} />
            {realisticExterior && realisticLoaded
              ? 'Realistic exterior'
              : 'Teaching model'}
          </button>
          <button
            type="button"
            className={'laptop-guide-button' + (mode === 'connections' ? ' active' : '')}
            onClick={startConnections}
          >
            <Cable size={15} />
            Connections
          </button>
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
          {mode === 'connections'
            ? `03 / CONNECTIONS · ${Math.min(
                connected.length + 1,
                CONNECTION_TASKS.length,
              )} / ${CONNECTION_TASKS.length}`
            : guided
              ? `GUIDED LESSON · ${lessonIndex + 1} / ${LESSON_ORDER.length}`
              : view === 'outside'
                ? '01 / LAPTOP EXTERIOR'
                : '02 / LAPTOP INTERNALS'}
        </p>
        <h1>
          {mode === 'connections'
            ? allConnectionsComplete
              ? 'Laptop connected.'
              : currentConnection.name
            : guided
              ? lessonPart.name
              : view === 'outside'
                ? realisticExterior && realisticLoaded
                  ? 'Review the realistic exterior.'
                  : 'Start with what students touch.'
                : 'Now look under the keyboard.'}
        </h1>
        <p className="laptop-intro">
          {mode === 'connections'
            ? allConnectionsComplete
              ? 'You connected power, USB, an external display and headphones.'
              : currentConnection.instruction
            : guided
              ? lessonPart.description
              : view === 'outside'
                ? realisticExterior && realisticLoaded
                  ? 'This preview uses converted official Framework Laptop 13 CAD. Switch to the Teaching model for clickable screen, keyboard, trackpad and ports.'
                  : 'Explore the screen, keyboard and trackpad before opening the machine.'
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
        {mode === 'connections' ? (
          <div className="laptop-connection-list">
            {CONNECTION_TASKS.map((task, index) => {
              const done = connected.includes(task.id);
              return (
                <button
                  type="button"
                  key={task.id}
                  className={
                    (index === connectionTask && !done ? 'active ' : '') +
                    (done ? 'done' : '')
                  }
                  onClick={() => {
                    connectionTaskRef.current = index;
                    setConnectionTask(index);
                    setConnectionFeedback(
                      done
                        ? task.name + ' is already connected.'
                        : task.instruction,
                    );
                  }}
                >
                  {done ? <span>✓</span> : <span>{index + 1}</span>}
                  <strong>{task.name}</strong>
                </button>
              );
            })}
            <button
              type="button"
              className="laptop-reset-connections"
              onClick={resetConnections}
            >
              Reset connections
            </button>
          </div>
        ) : (
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
        )}
        <div className="laptop-next">
          <strong>
            {mode === 'connections'
              ? 'Connection tip'
              : guided
                ? 'Lesson path'
                : 'Next laptop milestone'}
          </strong>
          <span>
            {mode === 'connections'
              ? 'Rotate the laptop and look for the glowing port on either side.'
              : guided
                ? 'Outside first, then the main components inside.'
                : 'Improved exterior model · troubleshooting · assembly'}
          </span>
        </div>
      </aside>

      <section className="laptop-stage">
        <canvas
          ref={canvasRef}
          aria-label="Interactive 3D laptop. Drag to orbit and click a component."
        />
        <div
          className={
            'laptop-stage-tip' +
            (view === 'inside' && mode === 'explore' && !guided
              ? ' teardown-open'
              : '')
          }
        >
          <Rotate3D size={15} />
          {mode === 'connections'
            ? 'Drag to orbit · find the glowing port · click to connect'
            : view === 'inside' && !guided
              ? 'Drag to orbit · click cables to unplug · use teardown slider'
              : 'Drag to orbit · scroll to zoom · click a part'}
        </div>

        {view === 'inside' && mode === 'explore' && !guided && (
          <div className="laptop-disassembly" aria-label="Laptop teardown">
            <div className="laptop-disassembly-head">
              <button
                type="button"
                className={teardownPlaying ? 'playing' : ''}
                onClick={toggleTeardown}
                aria-label={
                  teardownPlaying
                    ? 'Pause laptop teardown'
                    : 'Play laptop teardown'
                }
              >
                {teardownPlaying ? <Pause size={16} /> : <Play size={16} />}
                <span>{teardownPlaying ? 'Pause' : 'Auto'}</span>
              </button>
              <div>
                <strong>Laptop anatomy</strong>
                <span>{teardownStage}</span>
              </div>
              <output>{Math.round(explode)}%</output>
              <button
                type="button"
                className="reset"
                onClick={() => {
                  stopTeardown();
                  setExplode(0);
                  disconnectedInternalCablesRef.current = [];
                  setDisconnectedInternalCables([]);
                  setInternalCableFeedback(
                    'Laptop reassembled. Internal cables are connected again.',
                  );
                }}
                aria-label="Reassemble laptop"
              >
                <RotateCcw size={16} />
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={explode}
              onChange={(event) => setExplode(Number(event.target.value))}
              aria-label="Laptop teardown progress"
              aria-valuetext={teardownStage}
            />
            <div className="laptop-disassembly-phases" aria-hidden="true">
              <span>Assembled</span>
              <span>Service parts</span>
              <span>Cooling</span>
              <span>Board out</span>
            </div>
          </div>
        )}
      </section>

      <aside className="laptop-detail" aria-live="polite">
        {mode === 'connections' ? (
          <>
            <p className="laptop-eyebrow">CONNECTION PRACTICE</p>
            <h2>
              {allConnectionsComplete
                ? 'All connected!'
                : currentConnection.name}
            </h2>
            <p>
              {allConnectionsComplete
                ? 'The laptop now has power, USB, display and audio connections.'
                : currentConnection.instruction}
            </p>
            <div className="laptop-why">
              <strong>Feedback</strong>
              <p>{connectionFeedback}</p>
            </div>
            <div className="laptop-port-key">
              <span><i className="power" /> Power</span>
              <span><i className="usb" /> USB</span>
              <span><i className="hdmi" /> HDMI</span>
              <span><i className="audio" /> Audio</span>
            </div>
            {allConnectionsComplete && (
              <button
                type="button"
                className="laptop-primary"
                onClick={resetConnections}
              >
                Practise again
                <span>↻</span>
              </button>
            )}
          </>
        ) : (
          <>
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
            {!guided && view === 'inside' && (
              <div className="laptop-cable-status">
                <strong>Service cables</strong>
                <p>{internalCableFeedback}</p>
                <div>
                  {(['battery', 'speaker', 'display'] as const).map((id) => {
                    const unplugged = disconnectedInternalCables.includes(id);
                    return (
                      <button
                        type="button"
                        key={id}
                        className={unplugged ? 'disconnected' : 'connected'}
                        onClick={() => {
                          const next = unplugged
                            ? disconnectedInternalCables.filter(
                                (candidate) => candidate !== id,
                              )
                            : [...disconnectedInternalCables, id];
                          disconnectedInternalCablesRef.current = next;
                          setDisconnectedInternalCables(next);
                          setInternalCableFeedback(
                            unplugged
                              ? id[0].toUpperCase() +
                                  id.slice(1) +
                                  ' cable reconnected.'
                              : id[0].toUpperCase() +
                                  id.slice(1) +
                                  ' cable unplugged.',
                          );
                        }}
                      >
                        {id}: {unplugged ? 'unplugged' : 'connected'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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
          </>
        )}
      </aside>
    </main>
  );
}
