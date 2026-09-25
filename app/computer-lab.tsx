'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Cable,
  CheckCircle2,
  Circle,
  Keyboard,
  Monitor,
  Mouse,
  PcCase,
  Rotate3D,
} from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

type LabPartId = 'monitor' | 'tower' | 'keyboard' | 'mouse';
type LabMode = 'explore' | 'connect';
type ConnectionId = 'keyboard-usb' | 'mouse-usb' | 'monitor-hdmi';
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
];

const CONNECTION_TASKS: ConnectionTask[] = [
  {
    id: 'keyboard-usb',
    name: 'Keyboard → USB',
    device: 'keyboard',
    portType: 'usb',
    targetPort: 'tower-usb-1',
    instruction:
      'Connect the keyboard. Rotate the computer if needed, then click one of the USB ports.',
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
      'Connect the monitor to HDMI. The display connector is on the rear teaching panel, so rotate the tower to find it.',
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
  desk: 0x6d6258,
  dark: 0x15191d,
  panel: 0x242a30,
  screen: 0x78b6d4,
  keys: 0xd6d9dc,
  accent: 0x80cbd8,
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

function tag(group: THREE.Group, id: LabPartId) {
  group.userData.labPart = id;
  group.traverse((object) => {
    if (!('isMesh' in object) || !(object as THREE.Mesh).isMesh) return;
    const item = object as THREE.Mesh;
    item.castShadow = true;
    item.receiveShadow = true;
    const material = item.material;
    if (material instanceof THREE.MeshStandardMaterial) {
      material.emissive = new THREE.Color(0x000000);
      material.emissiveIntensity = 0;
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
  const item = mesh(new THREE.BoxGeometry(...size), color, 0.32, 0.42);
  item.position.set(...position);
  item.userData.labPort = id;
  item.userData.portType = PORT_TYPES[id];
  return item;
}

function buildMonitor() {
  const group = new THREE.Group();
  const frame = mesh(
    new THREE.BoxGeometry(4.6, 2.8, 0.22),
    COLORS.dark,
    0.35,
    0.45,
  );
  frame.position.y = 3.25;
  group.add(frame);

  const screen = mesh(
    new THREE.PlaneGeometry(4.15, 2.35),
    COLORS.screen,
    0.32,
    0.05,
  );
  screen.position.set(0, 3.25, 0.116);
  group.add(screen);

  const stem = mesh(
    new THREE.BoxGeometry(0.28, 1.4, 0.28),
    COLORS.panel,
    0.45,
    0.5,
  );
  stem.position.y = 1.35;
  group.add(stem);

  const stand = mesh(
    new THREE.BoxGeometry(2.1, 0.18, 1.05),
    COLORS.panel,
    0.5,
    0.5,
  );
  stand.position.set(0, 0.68, 0.25);
  group.add(stand);
  group.position.set(0.15, 0, -1.25);
  return tag(group, 'monitor');
}

function buildTower() {
  const group = new THREE.Group();
  const ports: THREE.Mesh[] = [];
  const body = mesh(
    new THREE.BoxGeometry(2.25, 4.3, 3.4),
    COLORS.dark,
    0.38,
    0.42,
  );
  body.position.y = 2.2;
  group.add(body);

  const glass = mesh(
    new THREE.BoxGeometry(2.29, 3.75, 2.75),
    0x26343d,
    0.18,
    0.15,
  );
  glass.position.set(0, 2.25, 0.18);
  const glassMaterial = glass.material as THREE.MeshStandardMaterial;
  glassMaterial.transparent = true;
  glassMaterial.opacity = 0.36;
  group.add(glass);

  for (const y of [1.25, 2.2, 3.15]) {
    const fan = mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.08, 28),
      COLORS.accent,
      0.3,
      0.2,
    );
    fan.rotation.z = Math.PI / 2;
    fan.position.set(-1.16, y, -0.58);
    group.add(fan);
  }

  const powerButton = mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 0.04, 20),
    COLORS.accent,
    0.25,
    0.3,
  );
  powerButton.rotation.x = Math.PI / 2;
  powerButton.position.set(0.62, 4.05, 1.72);
  group.add(powerButton);

  // Front I/O: two enlarged USB ports for the classroom connection exercise.
  const usb1 = port(
    'tower-usb-1',
    [0.28, 0.11, 0.045],
    [-0.35, 4.02, 1.72],
    0x4e8394,
  );
  const usb2 = port(
    'tower-usb-2',
    [0.28, 0.11, 0.045],
    [0.02, 4.02, 1.72],
    0x4e8394,
  );

  // Rear teaching panel: the ports are slightly enlarged so students can find
  // them on a classroom screen while still learning where rear I/O lives.
  const hdmi = port(
    'tower-hdmi',
    [0.38, 0.13, 0.045],
    [0.42, 2.72, -1.72],
    0x8e7ca8,
  );
  const ethernet = port(
    'tower-ethernet',
    [0.34, 0.28, 0.045],
    [0.42, 2.2, -1.72],
    0x658f79,
  );
  const power = port(
    'tower-power',
    [0.42, 0.38, 0.045],
    [-0.35, 0.65, -1.72],
    0xa98265,
  );

  ports.push(usb1, usb2, hdmi, ethernet, power);
  group.add(...ports);
  group.position.set(4.2, 0.02, -0.45);
  return { group: tag(group, 'tower'), ports };
}

function buildKeyboard() {
  const group = new THREE.Group();
  const base = mesh(
    new THREE.BoxGeometry(4.8, 0.22, 1.65),
    COLORS.panel,
    0.5,
    0.28,
  );
  group.add(base);

  const keyGeo = new THREE.BoxGeometry(0.31, 0.09, 0.25);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 12; col++) {
      const key = mesh(keyGeo, COLORS.keys, 0.65, 0.06);
      key.position.set(-1.98 + col * 0.36, 0.15, -0.56 + row * 0.35);
      group.add(key);
    }
  }

  group.position.set(-0.25, 0.72, 2.35);
  group.rotation.y = -0.03;
  return tag(group, 'keyboard');
}

function buildMouse() {
  const group = new THREE.Group();
  const body = mesh(
    new THREE.SphereGeometry(0.52, 30, 20),
    COLORS.panel,
    0.4,
    0.25,
  );
  body.scale.set(0.75, 0.38, 1.05);
  body.position.y = 0.1;
  group.add(body);

  const wheel = mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.18, 16),
    COLORS.accent,
    0.35,
    0.2,
  );
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(0, 0.34, -0.12);
  group.add(wheel);

  group.position.set(3.05, 0.83, 2.25);
  return tag(group, 'mouse');
}

function cableLine(start: THREE.Vector3, end: THREE.Vector3) {
  const middle = start.clone().lerp(end, 0.5);
  middle.y = Math.max(0.58, Math.min(start.y, end.y) - 0.35);
  const curve = new THREE.CatmullRomCurve3([start, middle, end]);
  const geometry = new THREE.TubeGeometry(curve, 28, 0.035, 8, false);
  const material = new THREE.MeshStandardMaterial({
    color: 0x7fc4d0,
    roughness: 0.52,
    metalness: 0.05,
    emissive: 0x102d32,
    emissiveIntensity: 0.35,
  });
  const cable = new THREE.Mesh(geometry, material);
  cable.castShadow = true;
  return cable;
}

export default function ComputerLab({ onOpenPC }: { onOpenPC: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const groupsRef = useRef<Map<LabPartId, THREE.Group> | null>(null);

  const [selected, setSelected] = useState<LabPartId>('tower');
  const [labMode, setLabMode] = useState<LabMode>('explore');
  const [taskIndex, setTaskIndex] = useState(0);
  const [connected, setConnected] = useState<ConnectionId[]>([]);
  const [feedback, setFeedback] = useState(
    'Choose Connections when you are ready to practise ports and cables.',
  );

  const selectedPart = PARTS.find((part) => part.id === selected)!;
  const currentTask = CONNECTION_TASKS[taskIndex];
  const allConnected = connected.length === CONNECTION_TASKS.length;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0d0f);

    const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 100);
    camera.position.set(10.8, 7.4, 12.8);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 8;
    controls.maxDistance = 24;
    controls.target.set(0.8, 2.0, 0.4);

    scene.add(new THREE.HemisphereLight(0xd8efff, 0x343028, 2.1));
    const key = new THREE.DirectionalLight(0xffffff, 3.1);
    key.position.set(7, 10, 8);
    key.castShadow = true;
    scene.add(key);

    const desk = mesh(
      new THREE.BoxGeometry(13.5, 0.55, 7.3),
      COLORS.desk,
      0.72,
      0.08,
    );
    desk.position.set(0.4, 0.35, 0.35);
    desk.receiveShadow = true;
    scene.add(desk);

    const floor = mesh(
      new THREE.PlaneGeometry(40, 40),
      0x121416,
      0.88,
      0.02,
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    floor.receiveShadow = true;
    scene.add(floor);

    const groups = new Map<LabPartId, THREE.Group>();
    const monitor = buildMonitor();
    const towerBuild = buildTower();
    const tower = towerBuild.group;
    const keyboard = buildKeyboard();
    const mouse = buildMouse();

    for (const [id, group] of [
      ['monitor', monitor],
      ['tower', tower],
      ['keyboard', keyboard],
      ['mouse', mouse],
    ] as const) {
      groups.set(id, group);
      scene.add(group);
    }
    groupsRef.current = groups;

    scene.updateMatrixWorld(true);

    const portPosition = (id: PortId) => {
      const item = towerBuild.ports.find(
        (candidate) => candidate.userData.labPort === id,
      );
      return item?.getWorldPosition(new THREE.Vector3()) ?? new THREE.Vector3();
    };

    const keyboardCable = cableLine(
      new THREE.Vector3(-0.25, 0.9, 3.05),
      portPosition('tower-usb-1'),
    );
    const mouseCable = cableLine(
      new THREE.Vector3(3.05, 0.95, 2.75),
      portPosition('tower-usb-2'),
    );
    const monitorCable = cableLine(
      new THREE.Vector3(0.15, 1.08, -1.45),
      portPosition('tower-hdmi'),
    );

    for (const [id, cable] of [
      ['keyboard-usb', keyboardCable],
      ['mouse-usb', mouseCable],
      ['monitor-hdmi', monitorCable],
    ] as const) {
      cable.visible = connected.includes(id);
      scene.add(cable);
    }

    for (const item of towerBuild.ports) {
      const material = item.material;
      if (!(material instanceof THREE.MeshStandardMaterial)) continue;
      const type = item.userData.portType as PortType;
      const target = labMode === 'connect' && type === currentTask.portType;
      material.emissive.setHex(target ? 0x19444b : 0x000000);
      material.emissiveIntensity = target ? 1.1 : 0;
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const pick = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      if (labMode === 'connect') {
        const portHit = raycaster.intersectObjects(towerBuild.ports, false)[0];
        if (!portHit) {
          setFeedback(
            'That is not a connection port. Rotate the setup and look for the highlighted ports.',
          );
          return;
        }

        const id = portHit.object.userData.labPort as PortId;
        const clickedType = PORT_TYPES[id];
        const task = CONNECTION_TASKS[taskIndex];

        if (clickedType !== task.portType) {
          setFeedback(
            `Not quite. ${task.name} needs a ${task.portType.toUpperCase()} connection.`,
          );
          return;
        }

        if (id !== task.targetPort) {
          setFeedback(
            `That is the right kind of port, but this exercise uses the other ${task.portType.toUpperCase()} socket so each cable stays visible. Try the highlighted target.`,
          );
          return;
        }

        const nextConnected = connected.includes(task.id)
          ? connected
          : [...connected, task.id];
        setConnected(nextConnected);
        setFeedback(`Correct — ${task.name} is connected.`);

        const nextIndex = CONNECTION_TASKS.findIndex(
          (candidate, index) =>
            index > taskIndex && !nextConnected.includes(candidate.id),
        );
        if (nextIndex >= 0) {
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
      if (id) setSelected(id);
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
      controls.update();
      renderer.render(scene, camera);
    };
    draw();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener('pointerup', pick);
      controls.dispose();
      groupsRef.current = null;
      renderer.dispose();
      scene.traverse((object) => {
        if (!('isMesh' in object) || !(object as THREE.Mesh).isMesh) return;
        const item = object as THREE.Mesh;
        item.geometry.dispose();
        const material = item.material;
        if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
        else material.dispose();
      });
    };
  }, [connected, currentTask.portType, labMode, taskIndex]);

  useEffect(() => {
    const groups = groupsRef.current;
    if (!groups) return;
    for (const [partId, group] of groups) {
      group.traverse((object) => {
        if (!('isMesh' in object) || !(object as THREE.Mesh).isMesh) return;
        if (object.userData.labPort) return;
        const material = (object as THREE.Mesh).material;
        if (material instanceof THREE.MeshStandardMaterial) {
          material.emissive.setHex(
            labMode === 'explore' && partId === selected ? 0x15343a : 0x000000,
          );
          material.emissiveIntensity =
            labMode === 'explore' && partId === selected ? 0.72 : 0;
        }
      });
    }
  }, [labMode, selected]);

  const resetConnections = () => {
    setConnected([]);
    setTaskIndex(0);
    setFeedback('Start with the keyboard. Find a USB port on the system unit.');
  };

  const chooseMode = (mode: LabMode) => {
    setLabMode(mode);
    if (mode === 'connect') {
      setFeedback(
        allConnected
          ? 'All three connections are complete. Reset them to practise again.'
          : currentTask.instruction,
      );
    }
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
            className={labMode === 'explore' ? 'active' : ''}
            onClick={() => chooseMode('explore')}
          >
            <Rotate3D size={15} />
            Explore
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

        <button type="button" className="lab-open-pc" onClick={onOpenPC}>
          <PcCase size={16} />
          <span>Explore inside the PC</span>
        </button>
      </header>

      <aside className="lab-parts" aria-label="Computer setup learning panel">
        <p className="lab-eyebrow">
          {labMode === 'explore'
            ? '01 / COMPUTER SETUP'
            : '02 / CONNECTIONS'}
        </p>
        <h1>
          {labMode === 'explore'
            ? 'Meet the whole computer.'
            : 'Connect the devices.'}
        </h1>
        <p className="lab-intro">
          {labMode === 'explore'
            ? 'Start with the equipment students see every day, then move inside the system unit.'
            : 'Follow the tasks in order. Rotate the 3D setup and click the correct port on the system unit.'}
        </p>

        {labMode === 'explore' ? (
          <div className="lab-part-list">
            {PARTS.map((part) => {
              const Icon = part.icon;
              return (
                <button
                  type="button"
                  key={part.id}
                  className={selected === part.id ? 'active' : ''}
                  onClick={() => setSelected(part.id)}
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
                    setTaskIndex(index);
                    setFeedback(
                      done
                        ? `${task.name} is already connected.`
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
          <strong>Coming next</strong>
          <span>Ethernet · power · laptop · build challenge</span>
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
            : 'Drag to orbit · find the highlighted port · click to connect'}
        </div>
      </section>

      <aside className="lab-detail" aria-live="polite">
        {labMode === 'explore' ? (
          <>
            <p className="lab-eyebrow">SELECTED COMPONENT</p>
            <h2>{selectedPart.name}</h2>
            <p>{selectedPart.description}</p>
            <div className="lab-lesson">
              <strong>What students learn next</strong>
              <p>{selectedPart.lesson}</p>
            </div>
            {selected === 'tower' && (
              <button
                type="button"
                className="lab-primary-action"
                onClick={onOpenPC}
              >
                Open the system unit
                <span>→</span>
              </button>
            )}
          </>
        ) : (
          <>
            <p className="lab-eyebrow">CONNECTION CHALLENGE</p>
            <h2>{allConnected ? 'Setup connected!' : currentTask.name}</h2>
            <p>
              {allConnected
                ? 'The keyboard, mouse and monitor now have their basic data connections.'
                : currentTask.instruction}
            </p>
            <div className="lab-lesson">
              <strong>Feedback</strong>
              <p>{feedback}</p>
            </div>
            <div className="lab-port-key">
              <span><i className="usb" /> USB</span>
              <span><i className="hdmi" /> HDMI</span>
              <span><i className="ethernet" /> Ethernet</span>
              <span><i className="power" /> Power</span>
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
