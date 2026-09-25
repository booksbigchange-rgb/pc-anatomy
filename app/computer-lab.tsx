'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, Keyboard, Monitor, Mouse, PcCase, Rotate3D } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

type LabPartId = 'monitor' | 'tower' | 'keyboard' | 'mouse';

type LabPart = {
  id: LabPartId;
  name: string;
  icon: typeof Monitor;
  description: string;
  lesson: string;
};

const PARTS: LabPart[] = [
  {
    id: 'monitor',
    name: 'Monitor',
    icon: Monitor,
    description: 'The monitor shows the pictures, text and video produced by the computer.',
    lesson: 'Next we will connect it to the graphics output with HDMI or DisplayPort.',
  },
  {
    id: 'tower',
    name: 'System unit',
    icon: PcCase,
    description: 'The system unit contains the main hardware that processes, stores and powers the computer.',
    lesson: 'Open it to explore the motherboard, CPU, RAM, storage, GPU, cooling and power supply.',
  },
  {
    id: 'keyboard',
    name: 'Keyboard',
    icon: Keyboard,
    description: 'The keyboard is an input device used to type letters, numbers and commands.',
    lesson: 'Later, students will connect it to a matching USB port.',
  },
  {
    id: 'mouse',
    name: 'Mouse',
    icon: Mouse,
    description: 'The mouse is an input device used to point, click, drag and select.',
    lesson: 'Later, students will connect it to a matching USB port.',
  },
];

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

function buildMonitor() {
  const group = new THREE.Group();
  const frame = mesh(new THREE.BoxGeometry(4.6, 2.8, 0.22), COLORS.dark, 0.35, 0.45);
  frame.position.y = 3.25;
  group.add(frame);

  const screen = mesh(new THREE.PlaneGeometry(4.15, 2.35), COLORS.screen, 0.32, 0.05);
  screen.position.set(0, 3.25, 0.116);
  group.add(screen);

  const stem = mesh(new THREE.BoxGeometry(0.28, 1.4, 0.28), COLORS.panel, 0.45, 0.5);
  stem.position.y = 1.35;
  group.add(stem);

  const stand = mesh(new THREE.BoxGeometry(2.1, 0.18, 1.05), COLORS.panel, 0.5, 0.5);
  stand.position.set(0, 0.68, 0.25);
  group.add(stand);
  group.position.set(0.15, 0, -1.25);
  return tag(group, 'monitor');
}

function buildTower() {
  const group = new THREE.Group();
  const body = mesh(new THREE.BoxGeometry(2.25, 4.3, 3.4), COLORS.dark, 0.38, 0.42);
  body.position.y = 2.2;
  group.add(body);

  const glass = mesh(new THREE.BoxGeometry(2.29, 3.75, 2.75), 0x26343d, 0.18, 0.15);
  glass.position.set(0, 2.25, 0.18);
  const glassMaterial = glass.material as THREE.MeshStandardMaterial;
  glassMaterial.transparent = true;
  glassMaterial.opacity = 0.36;
  group.add(glass);

  for (const y of [1.25, 2.2, 3.15]) {
    const fan = mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.08, 28), COLORS.accent, 0.3, 0.2);
    fan.rotation.z = Math.PI / 2;
    fan.position.set(-1.16, y, -0.58);
    group.add(fan);
  }

  const powerButton = mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 20), COLORS.accent, 0.25, 0.3);
  powerButton.rotation.x = Math.PI / 2;
  powerButton.position.set(0.62, 4.05, 1.72);
  group.add(powerButton);

  group.position.set(4.2, 0.02, -0.45);
  return tag(group, 'tower');
}

function buildKeyboard() {
  const group = new THREE.Group();
  const base = mesh(new THREE.BoxGeometry(4.8, 0.22, 1.65), COLORS.panel, 0.5, 0.28);
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
  const body = mesh(new THREE.SphereGeometry(0.52, 30, 20), COLORS.panel, 0.4, 0.25);
  body.scale.set(0.75, 0.38, 1.05);
  body.position.y = 0.1;
  group.add(body);

  const wheel = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.18, 16), COLORS.accent, 0.35, 0.2);
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(0, 0.34, -0.12);
  group.add(wheel);

  group.position.set(3.05, 0.83, 2.25);
  return tag(group, 'mouse');
}

export default function ComputerLab({ onOpenPC }: { onOpenPC: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState<LabPartId>('tower');
  const selectedPart = PARTS.find((part) => part.id === selected)!;

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

    const desk = mesh(new THREE.BoxGeometry(13.5, 0.55, 7.3), COLORS.desk, 0.72, 0.08);
    desk.position.set(0.4, 0.35, 0.35);
    desk.receiveShadow = true;
    scene.add(desk);

    const floor = mesh(new THREE.PlaneGeometry(40, 40), 0x121416, 0.88, 0.02);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    floor.receiveShadow = true;
    scene.add(floor);

    const groups = new Map<LabPartId, THREE.Group>();
    const monitor = buildMonitor();
    const tower = buildTower();
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

    const applyHighlight = (id: LabPartId) => {
      for (const [partId, group] of groups) {
        group.traverse((object) => {
          if (!('isMesh' in object) || !(object as THREE.Mesh).isMesh) return;
          const material = (object as THREE.Mesh).material;
          if (material instanceof THREE.MeshStandardMaterial) {
            material.emissive.setHex(partId === id ? 0x15343a : 0x000000);
            material.emissiveIntensity = partId === id ? 0.72 : 0;
          }
        });
      }
    };
    applyHighlight(selected);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const pick = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects([...groups.values()], true)[0];
      if (!hit) return;

      let current: THREE.Object3D | null = hit.object;
      while (current && !current.userData.labPart) current = current.parent;
      const id = current?.userData.labPart as LabPartId | undefined;
      if (!id) return;
      setSelected(id);
      applyHighlight(id);
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
  }, []);

  return (
    <main className="computer-lab">
      <header className="lab-topbar">
        <div className="lab-brand">
          <span className="lab-brand-icon"><Box size={20} /></span>
          <span>
            <strong>Big Change Computer Lab</strong>
            <small>LEARN THE WHOLE COMPUTER</small>
          </span>
        </div>
        <button type="button" className="lab-open-pc" onClick={onOpenPC}>
          <PcCase size={16} />
          Explore inside the PC
        </button>
      </header>

      <aside className="lab-parts" aria-label="Computer setup components">
        <p className="lab-eyebrow">01 / COMPUTER SETUP</p>
        <h1>Meet the whole computer.</h1>
        <p className="lab-intro">
          Start with the equipment students see every day, then move inside the system unit.
        </p>
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
        <div className="lab-next">
          <strong>Coming next</strong>
          <span>Ports · cables · laptop · build challenge</span>
        </div>
      </aside>

      <section className="lab-stage" aria-label="Interactive 3D computer setup">
        <canvas ref={canvasRef} aria-label="3D desktop computer setup. Drag to orbit and click a component." />
        <div className="lab-stage-tip">
          <Rotate3D size={15} />
          Drag to orbit · scroll to zoom · click a part
        </div>
      </section>

      <aside className="lab-detail" aria-live="polite">
        <p className="lab-eyebrow">SELECTED COMPONENT</p>
        <h2>{selectedPart.name}</h2>
        <p>{selectedPart.description}</p>
        <div className="lab-lesson">
          <strong>What students learn next</strong>
          <p>{selectedPart.lesson}</p>
        </div>
        {selected === 'tower' && (
          <button type="button" className="lab-primary-action" onClick={onOpenPC}>
            Open the system unit
            <span>→</span>
          </button>
        )}
      </aside>
    </main>
  );
}
