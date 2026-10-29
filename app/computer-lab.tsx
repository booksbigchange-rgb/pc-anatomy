'use client';
import AcademyLogo from './academy-logo';

import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  BookOpen,
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
  Wrench,
  Zap,
} from 'lucide-react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createChassis } from '@/lib/optiplex-7040';

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
  example: string;
  connects: string;
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
    example: 'When you watch a video, the picture you see comes out of the monitor.',
    connects: 'Display cable (HDMI or DisplayPort) and a power cable',
  },
  {
    id: 'tower',
    name: 'System unit',
    icon: PcCase,
    description:
      'The system unit contains the main hardware that processes, stores and powers the computer.',
    lesson:
      'Open it to explore the motherboard, CPU, RAM, storage, GPU, cooling and power supply.',
    example: 'When you save a file, the system unit stores it inside on the SSD.',
    connects: 'Monitor, keyboard, mouse, network cable and power cable',
  },
  {
    id: 'keyboard',
    name: 'Keyboard',
    icon: Keyboard,
    description:
      'The keyboard is an input device used to type letters, numbers and commands.',
    lesson: 'Most classroom keyboards connect to a USB port.',
    example: 'When you type your name, the keyboard sends each letter to the computer.',
    connects: 'USB port on the system unit',
  },
  {
    id: 'mouse',
    name: 'Mouse',
    icon: Mouse,
    description:
      'The mouse is an input device used to point, click, drag and select.',
    lesson: 'A wired mouse commonly connects to a USB port.',
    example: 'When you click a button on screen, the mouse tells the computer where you clicked.',
    connects: 'USB port on the system unit',
  },
  {
    id: 'network',
    name: 'Network',
    icon: Wifi,
    description:
      'A router or network switch connects the computer to a local network and often to the internet.',
    lesson:
      'A wired Ethernet cable connects the network equipment to the computer’s Ethernet port.',
    example: 'When you open a website, the data comes through the network.',
    connects: 'Ethernet port on the system unit',
  },
  {
    id: 'power-strip',
    name: 'Power',
    icon: Zap,
    description:
      'The computer and monitor need electrical power before any data connection can work.',
    lesson:
      'Power cables connect the equipment to a safe outlet or power strip. Students should not handle mains wiring inside a real power supply.',
    example: 'If the power cable is unplugged, the computer cannot start.',
    connects: 'Wall socket or power strip, then the computer and monitor',
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

/** Port names for the button list, front to back. */
const PORT_NAMES: Record<PortId, string> = {
  'tower-usb-1': 'Front USB 1',
  'tower-usb-2': 'Front USB 2',
  'tower-hdmi': 'Rear HDMI',
  'tower-ethernet': 'Rear Ethernet',
  'tower-power': 'Power inlet',
};

const PORT_TYPES: Record<PortId, PortType> = {
  'tower-usb-1': 'usb',
  'tower-usb-2': 'usb',
  'tower-hdmi': 'hdmi',
  'tower-ethernet': 'ethernet',
  'tower-power': 'power',
};

const COLORS = {
  background: 0x111820,
  floor: 0x2a2724,
  desk: 0x8b7663,
  deskEdge: 0x665546,
  dark: 0x171c21,
  panel: 0x2b333a,
  panelSoft: 0x39434a,
  keys: 0x2b3136,
  keyDark: 0x23292d,
  accent: 0x78cbd6,
  accentSoft: 0xa7dfe5,
  wall: 0x2c3236,
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

function canvasTexture(width: number, height: number, paint: (context: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return null;
  paint(context);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** A working desktop: wallpaper, an open lesson window and a taskbar with a clock. */
function desktopTexture() {
  return canvasTexture(1024, 576, (context) => {
    const wallpaper = context.createLinearGradient(0, 0, 1024, 576);
    wallpaper.addColorStop(0, '#0d3b5c');
    wallpaper.addColorStop(0.6, '#1d6a8a');
    wallpaper.addColorStop(1, '#3a8f9e');
    context.fillStyle = wallpaper;
    context.fillRect(0, 0, 1024, 576);
    const glow = context.createRadialGradient(780, 140, 10, 780, 140, 420);
    glow.addColorStop(0, 'rgba(180,240,245,.35)');
    glow.addColorStop(1, 'rgba(180,240,245,0)');
    context.fillStyle = glow;
    context.fillRect(0, 0, 1024, 576);
    // Desktop icons.
    for (const [y, label] of [[40, 'Files'], [120, 'Browser'], [200, 'Notes']] as const) {
      context.fillStyle = 'rgba(255,255,255,.85)';
      context.fillRect(34, y, 44, 36);
      context.fillStyle = '#eaf6f8';
      context.font = '15px Segoe UI, Arial, sans-serif';
      context.fillText(label, 30, y + 56);
    }
    // An open lesson window.
    context.fillStyle = 'rgba(0,0,0,.25)';
    context.fillRect(222, 96, 560, 330);
    context.fillStyle = '#f4f7f8';
    context.fillRect(214, 88, 560, 330);
    context.fillStyle = '#1f4f63';
    context.fillRect(214, 88, 560, 34);
    context.fillStyle = '#ffffff';
    context.font = '600 17px Segoe UI, Arial, sans-serif';
    context.fillText('Big Change Computer Lab', 228, 111);
    context.fillStyle = '#e45d50';
    context.fillRect(744, 98, 18, 14);
    context.fillStyle = '#1b2b31';
    context.font = '700 30px Segoe UI, Arial, sans-serif';
    context.fillText('Meet the whole computer', 240, 170);
    context.fillStyle = '#4a5c63';
    context.font = '18px Segoe UI, Arial, sans-serif';
    for (const [index, line] of ['The monitor shows the picture.', 'The keyboard and mouse send input.', 'The system unit does the work.'].entries())
      context.fillText(line, 240, 212 + index * 32);
    context.fillStyle = '#2c8f9d';
    context.fillRect(240, 330, 150, 40);
    context.fillStyle = '#ffffff';
    context.font = '600 17px Segoe UI, Arial, sans-serif';
    context.fillText('Start lesson', 266, 356);
    // Taskbar.
    context.fillStyle = 'rgba(14,24,30,.92)';
    context.fillRect(0, 534, 1024, 42);
    context.fillStyle = '#5fc3cf';
    context.fillRect(14, 544, 22, 22);
    for (const x of [54, 90, 126]) {
      context.fillStyle = 'rgba(255,255,255,.55)';
      context.fillRect(x, 546, 20, 18);
    }
    context.fillStyle = '#e6f1f3';
    context.font = '16px Segoe UI, Arial, sans-serif';
    context.fillText('09:41', 958, 561);
  });
}

/** What a monitor shows when its cable or the computer's power is missing. */
function noSignalTexture() {
  return canvasTexture(1024, 576, (context) => {
    context.fillStyle = '#020304';
    context.fillRect(0, 0, 1024, 576);
    context.strokeStyle = 'rgba(255,255,255,.55)';
    context.lineWidth = 2;
    context.strokeRect(362, 238, 300, 100);
    context.fillStyle = '#e9eef0';
    context.font = '600 30px Segoe UI, Arial, sans-serif';
    context.fillText('No signal', 446, 285);
    context.fillStyle = 'rgba(233,238,240,.7)';
    context.font = '17px Segoe UI, Arial, sans-serif';
    context.fillText('Check the HDMI cable and computer power', 345 + 10, 318);
  });
}

/** Faint wood grain so the desk reads as a laminated classroom table. */
function woodTexture() {
  const texture = canvasTexture(512, 512, (context) => {
    context.fillStyle = '#8b7663';
    context.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 140; i++) {
      const y = (i * 37) % 512, wave = 3 + (i % 5);
      context.strokeStyle = `rgba(${i % 3 ? 70 : 120},${i % 3 ? 52 : 92},${i % 3 ? 38 : 70},${0.06 + (i % 4) * 0.025})`;
      context.lineWidth = 1 + (i % 3);
      context.beginPath();
      for (let x = 0; x <= 512; x += 16) context.lineTo(x, y + Math.sin((x + i * 13) / 60) * wave);
      context.stroke();
    }
  });
  if (texture) { texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(2, 1); }
  return texture;
}

function buildMonitor() {
  const group = new THREE.Group();

  const frame = rounded(4.62, 2.78, 0.22, 0.08, COLORS.dark, 0.32, 0.42);
  frame.position.y = 3.24;
  group.add(frame);

  const screenGeometry = new THREE.PlaneGeometry(4.42, 2.5);
  const desktop = desktopTexture();
  const noSignal = noSignalTexture();
  const screen = new THREE.Mesh(
    screenGeometry,
    new THREE.MeshBasicMaterial({ color: 0xffffff, map: desktop ?? undefined, toneMapped: false }),
  );
  screen.position.set(0, 3.3, 0.125);
  screen.userData.textures = { desktop, noSignal };
  group.add(screen);
  // Power light under the screen: green when the monitor shows a picture, amber when it has no signal.
  const powerLight = mesh(new THREE.SphereGeometry(0.035, 12, 8), 0x2bd46f, 0.3, 0);
  powerLight.position.set(1.95, 2.02, 0.17);
  powerLight.userData.powerLight = true;
  group.add(powerLight);
  group.userData.screen = screen;
  group.userData.powerLight = powerLight;

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

/**
 * The system unit is the same OptiPlex 7040 mini-tower students later build,
 * stood upright with its front toward the keyboard and scaled to the desk.
 * Port targets sit on the model's own rear and front connectors.
 */
function buildTower() {
  const group = new THREE.Group();
  const { group: chassis, cover, driveCage } = createChassis();
  cover.visible = true;
  driveCage.rotation.z = 0;
  chassis.rotation.x = Math.PI / 2;
  const upright = new THREE.Group();
  upright.add(chassis);
  upright.rotation.y = -Math.PI / 2;
  const fit = new THREE.Group();
  fit.add(upright);
  fit.updateMatrixWorld(true);
  let bounds = new THREE.Box3().setFromObject(fit);
  fit.scale.setScalar(4.15 / bounds.getSize(new THREE.Vector3()).y);
  fit.updateMatrixWorld(true);
  bounds = new THREE.Box3().setFromObject(fit);
  const center = bounds.getCenter(new THREE.Vector3());
  fit.position.set(-center.x, -bounds.min.y, -center.z);
  group.add(fit);
  group.updateMatrixWorld(true);
  bounds = new THREE.Box3().setFromObject(fit);

  const features: Partial<Record<string, THREE.Vector3[]>> = {};
  chassis.traverse((object) => {
    const id = object.userData.caseTarget as string | undefined;
    if (!id) return;
    (features[id] ??= []).push(new THREE.Box3().setFromObject(object).getCenter(new THREE.Vector3()));
  });
  const front = bounds.max.z + 0.03,
    rear = bounds.min.z - 0.03;
  const at = (id: string, face: 'front' | 'rear', fallback: THREE.Vector3, index = 0) => {
    const matches = (features[id] ?? []).filter((point) => (face === 'front' ? point.z > 0 : point.z < 0)).sort((a, b) => b.y - a.y || a.x - b.x);
    const point = (matches[index] ?? fallback).clone();
    point.z = face === 'front' ? front : rear;
    return point.toArray() as [number, number, number];
  };
  const top = bounds.max.y;
  const usb1 = port('tower-usb-1', [0.22, 0.09, 0.05], at('usb', 'front', new THREE.Vector3(-0.32, top - 0.42, 0), 0), 0x4e8394);
  const usb2 = port('tower-usb-2', [0.22, 0.09, 0.05], at('usb', 'front', new THREE.Vector3(-0.02, top - 0.42, 0), 1), 0x4e8394);
  const hdmi = port('tower-hdmi', [0.26, 0.11, 0.05], at('hdmi', 'rear', new THREE.Vector3(0.3, top - 0.9, 0)), 0x8e7ca8);
  const ethernet = port('tower-ethernet', [0.24, 0.2, 0.05], at('network', 'rear', new THREE.Vector3(0.3, top - 1.2, 0)), 0x658f79);
  // The power inlet is on the power supply, low on the rear panel.
  const power = port('tower-power', [0.34, 0.26, 0.05], at('psu-inlet', 'rear', new THREE.Vector3(-0.35, 0.62, 0)), 0xa98265);
  const ports = [usb1, usb2, hdmi, ethernet, power];
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

/** Real cable colours: black power and video leads, grey USB, blue network patch cable. */
const CABLE_COLOURS: Record<ConnectionId, number> = {
  'keyboard-usb': 0x3a4045,
  'mouse-usb': 0x3a4045,
  'monitor-hdmi': 0x15181a,
  'network-ethernet': 0x2f6fb0,
  'tower-power': 0x111315,
};

function cableLine(start: THREE.Vector3, end: THREE.Vector3, id: ConnectionId) {
  const middle = start.clone().lerp(end, 0.5);
  middle.y = Math.max(0.58, Math.min(start.y, end.y) - 0.35);
  const curve = new THREE.CatmullRomCurve3([start, middle, end]);
  const geometry = new THREE.TubeGeometry(curve, 30, id === 'tower-power' ? 0.05 : 0.035, 10, false);
  const material = new THREE.MeshStandardMaterial({ color: CABLE_COLOURS[id], roughness: 0.55, metalness: 0.02 });
  const cable = new THREE.Mesh(geometry, material);
  cable.castShadow = true;
  // A moulded plug where the cable meets the port.
  const plug = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.2), new THREE.MeshStandardMaterial({ color: 0x1b1f22, roughness: 0.6 }));
  plug.position.copy(end);
  plug.lookAt(curve.getPointAt(0.97));
  plug.castShadow = true;
  cable.add(plug);
  return cable;
}

function addDesk(scene: THREE.Scene) {
  const desktop = rounded(13.8, 0.5, 7.25, 0.18, 0xffffff, 0.62, 0.04);
  const grain = woodTexture();
  if (grain) (desktop.material as THREE.MeshStandardMaterial).map = grain;
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

  // A classroom whiteboard and skirting make the room read as a school lab.
  const boardFrame = rounded(9.4, 4.0, 0.12, 0.05, 0x9aa3a8, 0.35, 0.6);
  boardFrame.position.set(0.4, 6.4, -7.12);
  scene.add(boardFrame);
  const board = rounded(9.1, 3.7, 0.06, 0.03, 0xf1f4f2, 0.3, 0.02);
  board.position.set(0.4, 6.4, -7.04);
  scene.add(board);
  const tray = rounded(5.2, 0.1, 0.32, 0.03, 0x9aa3a8, 0.35, 0.6);
  tray.position.set(0.4, 4.36, -6.92);
  scene.add(tray);
  const skirting = rounded(34, 0.35, 0.08, 0.02, 0x23292d, 0.7, 0.05);
  skirting.position.set(0, -1.93, -7.15);
  scene.add(skirting);

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
  onOpenAssembly,
  onOpenTaskManager,
  onOpenCourse,
}: {
  onOpenPC: () => void;
  onOpenLaptop: () => void;
  onOpenAssembly: () => void;
  onOpenTaskManager: () => void;
  onOpenCourse: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selectedRef = useRef<LabPartId>('tower');
  const modeRef = useRef<LabMode>('explore');
  const taskRef = useRef(0);
  const connectedRef = useRef<ConnectionId[]>([]);
  const connectPortRef = useRef<((id: PortId) => void) | null>(null);

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
    // Soft room reflections so metal, plastic and glass look different from each other.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnvironment = new RoomEnvironment();
    const environment = pmrem.fromScene(roomEnvironment, 0.04);
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.42;
    roomEnvironment.dispose();
    pmrem.dispose();

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.enablePan = false;
    controls.minDistance = 8;
    controls.maxDistance = 24;
    controls.minPolarAngle = 0.35;
    controls.maxPolarAngle = Math.PI / 2.03;
    controls.target.set(0.75, 1.7, 0.35);

    scene.add(new THREE.HemisphereLight(0xcfeeff, 0x3a312d, 1.25));

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
          'keyboard-usb',
        ),
      ],
      [
        'mouse-usb',
        cableLine(
          new THREE.Vector3(3.0, 0.96, 2.76),
          portPosition('tower-usb-2'),
          'mouse-usb',
        ),
      ],
      [
        'monitor-hdmi',
        cableLine(
          new THREE.Vector3(0.05, 1.1, -1.48),
          portPosition('tower-hdmi'),
          'monitor-hdmi',
        ),
      ],
      [
        'network-ethernet',
        cableLine(
          new THREE.Vector3(-4.45, 0.9, -0.98),
          portPosition('tower-ethernet'),
          'network-ethernet',
        ),
      ],
      [
        'tower-power',
        cableLine(
          new THREE.Vector3(4.55, 0.84, 2.72),
          portPosition('tower-power'),
          'tower-power',
        ),
      ],
    ]);

    for (const cable of cables.values()) {
      cable.visible = false;
      scene.add(cable);
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    /** One connection attempt, from a 3D click or from the port buttons. Same checks either way. */
    const tryPort = (id: PortId) => {
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
    };
    connectPortRef.current = tryPort;

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

        tryPort(portHit.object.userData.labPort as PortId);
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

    // Set by resizes, camera moves and state changes; the draw loop renders only when it is true.
    let redraw = true;
    const resize = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      redraw = true;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    // Draw only when something changes; the pulsing target port needs ~20 frames a second.
    let frame = 0, lastState = '', lastPulse = 0;
    const requestRedraw = () => { redraw = true; };
    controls.addEventListener('change', requestRedraw);
    const draw = () => {
      frame = requestAnimationFrame(draw);
      const now = performance.now();
      const state = JSON.stringify([modeRef.current, selectedRef.current, taskRef.current, connectedRef.current]);
      if (state !== lastState) { lastState = state; redraw = true; }
      if (modeRef.current === 'connect' && now - lastPulse > 50) { lastPulse = now; redraw = true; }
      controls.update();
      if (!redraw) return;
      redraw = false;

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

      // The monitor only shows a picture when it is cabled and the computer has power.
      const screen = monitor.userData.screen as THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
      const { desktop: lit, noSignal } = screen.userData.textures as { desktop: THREE.Texture | null; noSignal: THREE.Texture | null };
      const signal = modeRef.current !== 'connect' || (connectedRef.current.includes('monitor-hdmi') && connectedRef.current.includes('tower-power'));
      const wanted = (signal ? lit : noSignal) ?? null;
      if (screen.material.map !== wanted) { screen.material.map = wanted; screen.material.needsUpdate = true; }
      const lamp = (monitor.userData.powerLight as THREE.Mesh).material as THREE.MeshStandardMaterial;
      lamp.color.setHex(signal ? 0x2bd46f : 0xe0a23b);
      lamp.emissive.setHex(signal ? 0x2bd46f : 0xe0a23b);
      lamp.emissiveIntensity = 1.6;

      for (const [partId, group] of groups) {
        group.traverse((object) => {
          if (!('isMesh' in object) || !(object as THREE.Mesh).isMesh) return;
          if (object.userData.labPort || object.userData.powerLight) return;
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

      renderer.render(scene, camera);
    };
    draw();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.removeEventListener('change', requestRedraw);
      environment.dispose();
      const textures = (monitor.userData.screen as THREE.Mesh).userData.textures as Record<string, THREE.Texture | null>;
      for (const texture of Object.values(textures)) texture?.dispose();
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
          <AcademyLogo />
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
          <button type="button" className="lab-open-pc" aria-label="My learning path" onClick={onOpenCourse}><BookOpen size={16} /><span>My learning path</span></button>
          <button type="button" className="lab-open-pc" onClick={onOpenTaskManager} aria-label="Task Manager"><Activity size={16} /><span>Task Manager</span></button>
          <button type="button" className="lab-open-pc" aria-label="Build a PC" onClick={onOpenAssembly}>
            <Wrench size={16} />
            <span>Build a PC</span>
          </button>
          <button type="button" className="lab-open-pc" aria-label="Laptop Lab" onClick={onOpenLaptop}>
            <Laptop size={16} />
            <span>Laptop Lab</span>
          </button>
          <button type="button" className="lab-open-pc" aria-label="Explore inside the PC" onClick={onOpenPC}>
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
          <strong>About this model</strong>
          <span>Tower: Dell OptiPlex 7040 reference model, interior estimated. Monitor, keyboard and mouse: original Big Change models.</span>
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
            <p><strong>Example:</strong> {selectedPart.example}</p>
            <p><strong>Connects to:</strong> {selectedPart.connects}</p>
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
            <fieldset className="lab-port-key">
              <legend className="sr-only">Ports on the system unit</legend>
              {(Object.keys(PORT_NAMES) as PortId[]).map((id) => (
                <button key={id} type="button" disabled={allConnected} onClick={() => connectPortRef.current?.(id)}>
                  <i className={PORT_TYPES[id]} /> {PORT_NAMES[id]}
                </button>
              ))}
            </fieldset>
            <p className="lab-port-hint">Click the glowing port in 3D, or choose it here.</p>
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
