'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Cpu,
  HardDrive,
  MemoryStick,
  Microchip,
  PackageCheck,
  Rotate3D,
  Wrench,
  Zap,
} from 'lucide-react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

type AssemblyPartId = 'psu' | 'motherboard' | 'cpu' | 'ram' | 'ssd' | 'gpu';

type AssemblyPart = {
  id: AssemblyPartId;
  name: string;
  icon: typeof Cpu;
  instruction: string;
  why: string;
  size: [number, number, number];
  start: [number, number, number];
  target: [number, number, number];
  color: number;
};

const PARTS: AssemblyPart[] = [
  {
    id: 'psu',
    name: 'Power Supply',
    icon: Zap,
    instruction: 'Install the power supply in the lower section of the case.',
    why: 'The PSU converts wall power into the low-voltage power the computer parts use.',
    size: [1.9, 0.95, 1.65],
    start: [-4.5, 1.0, -2.1],
    target: [3.65, 1.0, 1.45],
    color: 0x343c42,
  },
  {
    id: 'motherboard',
    name: 'Motherboard',
    icon: Microchip,
    instruction: 'Place the motherboard onto the case tray.',
    why: 'The motherboard is the main platform that connects the processor, memory, storage and expansion cards.',
    size: [3.35, 0.16, 2.85],
    start: [-4.5, 0.95, -1.25],
    target: [1.45, 0.82, -0.48],
    color: 0x2f6a5b,
  },
  {
    id: 'cpu',
    name: 'CPU',
    icon: Cpu,
    instruction: 'Place the processor into the CPU socket on the motherboard.',
    why: 'The CPU executes instructions and performs the core calculations that run software.',
    size: [0.68, 0.13, 0.68],
    start: [-4.5, 1.0, -0.4],
    target: [0.7, 1.02, -0.55],
    color: 0xb8b9b5,
  },
  {
    id: 'ram',
    name: 'RAM',
    icon: MemoryStick,
    instruction: 'Install the memory module beside the CPU.',
    why: 'RAM holds the data the processor needs quickly while programs are running.',
    size: [0.22, 0.64, 1.75],
    start: [-4.5, 1.15, 0.45],
    target: [2.05, 1.18, -0.45],
    color: 0x40565c,
  },
  {
    id: 'ssd',
    name: 'SSD',
    icon: HardDrive,
    instruction: 'Install the storage drive in the available storage position.',
    why: 'The SSD keeps the operating system, apps and files even when the PC is powered off.',
    size: [1.45, 0.12, 0.48],
    start: [-4.5, 1.0, 1.3],
    target: [2.85, 0.98, 1.48],
    color: 0x56636b,
  },
  {
    id: 'gpu',
    name: 'Graphics Card',
    icon: PackageCheck,
    instruction: 'Finish by installing the graphics card into the expansion area.',
    why: 'The GPU renders graphics and can accelerate many parallel computing tasks.',
    size: [3.15, 0.48, 1.0],
    start: [-4.5, 1.15, 2.15],
    target: [1.55, 1.32, 1.02],
    color: 0x30383d,
  },
];

function mesh(
  geometry: THREE.BufferGeometry,
  color: number,
  roughness = 0.58,
  metalness = 0.14,
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
  metalness = 0.14,
) {
  return mesh(
    new RoundedBoxGeometry(width, height, depth, 4, radius),
    color,
    roughness,
    metalness,
  );
}

function buildCase(scene: THREE.Scene) {
  const floor = rounded(5.9, 0.22, 5.2, 0.12, 0x343c42, 0.55, 0.28);
  floor.position.set(2.15, 0.48, 0);
  scene.add(floor);

  const rear = rounded(5.9, 3.7, 0.16, 0.08, 0x2b3338, 0.52, 0.32);
  rear.position.set(2.15, 2.2, -2.52);
  scene.add(rear);

  const right = rounded(0.16, 3.7, 5.05, 0.08, 0x2b3338, 0.52, 0.32);
  right.position.set(5.02, 2.2, 0);
  scene.add(right);

  const frontRail = rounded(5.9, 0.18, 0.18, 0.06, 0x59656b, 0.46, 0.34);
  frontRail.position.set(2.15, 0.62, 2.48);
  scene.add(frontRail);

  const tray = rounded(3.7, 0.05, 3.2, 0.04, 0x263038, 0.7, 0.12);
  tray.position.set(1.42, 0.64, -0.45);
  scene.add(tray);

  const riser = rounded(2.15, 0.08, 1.9, 0.05, 0x242c31, 0.68, 0.16);
  riser.position.set(3.6, 0.66, 1.42);
  scene.add(riser);
}

function buildPart(part: AssemblyPart) {
  const group = new THREE.Group();
  const body = rounded(
    part.size[0],
    part.size[1],
    part.size[2],
    Math.min(...part.size) * 0.18,
    part.color,
    0.46,
    0.22,
  );
  group.add(body);

  if (part.id === 'motherboard') {
    for (const [x, z, color] of [
      [-0.75, -0.4, 0x1e272c],
      [0.15, -0.65, 0x2e3539],
      [0.85, 0.2, 0x20272b],
      [-0.2, 0.55, 0x354047],
    ] as const) {
      const chip = rounded(0.52, 0.12, 0.45, 0.04, color, 0.45, 0.12);
      chip.position.set(x, 0.12, z);
      group.add(chip);
    }
  }

  if (part.id === 'gpu') {
    for (const x of [-0.72, 0.72]) {
      const fan = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.08, 28),
        new THREE.MeshStandardMaterial({
          color: 0x59666d,
          roughness: 0.38,
          metalness: 0.18,
        }),
      );
      fan.rotation.x = Math.PI / 2;
      fan.position.set(x, 0.27, 0);
      group.add(fan);
    }
  }

  if (part.id === 'psu') {
    const grille = new THREE.Mesh(
      new THREE.TorusGeometry(0.34, 0.035, 8, 28),
      new THREE.MeshStandardMaterial({
        color: 0x6f7d84,
        roughness: 0.4,
        metalness: 0.3,
      }),
    );
    grille.rotation.x = Math.PI / 2;
    grille.position.set(0, 0.49, 0);
    group.add(grille);
  }

  group.position.set(...part.start);
  group.userData.assemblyPart = part.id;
  group.traverse((object) => {
    if (!('isMesh' in object) || !(object as THREE.Mesh).isMesh) return;
    const item = object as THREE.Mesh;
    item.castShadow = true;
    item.receiveShadow = true;
  });
  return group;
}

function addRoom(scene: THREE.Scene) {
  const table = rounded(13.2, 0.48, 7.4, 0.18, 0x846f5e, 0.72, 0.04);
  table.position.set(0.2, 0.28, 0);
  table.receiveShadow = true;
  scene.add(table);

  const mat = rounded(11.7, 0.035, 6.2, 0.12, 0x1f282d, 0.84, 0.02);
  mat.position.set(0.2, 0.55, 0);
  scene.add(mat);

  const floor = mesh(new THREE.PlaneGeometry(40, 40), 0x141b20, 0.92, 0.01);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2;
  floor.receiveShadow = true;
  scene.add(floor);
}

export default function AssemblyLab({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentRef = useRef(0);
  const installedRef = useRef<AssemblyPartId[]>([]);

  const [current, setCurrent] = useState(0);
  const [installed, setInstalled] = useState<AssemblyPartId[]>([]);
  const [feedback, setFeedback] = useState(
    'Drag the highlighted part into the glowing target.',
  );

  const activePart = PARTS[current];
  const complete = installed.length === PARTS.length;

  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  useEffect(() => {
    installedRef.current = installed;
  }, [installed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x10171d);
    scene.fog = new THREE.Fog(0x10171d, 18, 38);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(11.8, 8.7, 13.6);

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
    controls.enablePan = false;
    controls.minDistance = 8;
    controls.maxDistance = 25;
    controls.target.set(0.7, 1.2, 0);

    scene.add(new THREE.HemisphereLight(0xd7efff, 0x3a312d, 1.8));
    const key = new THREE.DirectionalLight(0xfff4e9, 3.7);
    key.position.set(8, 11, 8);
    key.castShadow = true;
    key.shadow.mapSize.set(1536, 1536);
    key.shadow.camera.left = -11;
    key.shadow.camera.right = 11;
    key.shadow.camera.top = 11;
    key.shadow.camera.bottom = -11;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x8eb8ff, 1.05);
    fill.position.set(-8, 5, 5);
    scene.add(fill);

    addRoom(scene);
    buildCase(scene);

    const groups = new Map<AssemblyPartId, THREE.Group>();
    const ghosts = new Map<AssemblyPartId, THREE.Mesh>();

    for (const part of PARTS) {
      const group = buildPart(part);
      groups.set(part.id, group);
      scene.add(group);

      const ghost = new THREE.Mesh(
        new THREE.BoxGeometry(...part.size),
        new THREE.MeshBasicMaterial({
          color: 0x7cd1db,
          wireframe: true,
          transparent: true,
          opacity: 0.55,
        }),
      );
      ghost.position.set(...part.target);
      ghost.visible = false;
      ghosts.set(part.id, ghost);
      scene.add(ghost);
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hitPoint = new THREE.Vector3();
    let dragging: AssemblyPartId | null = null;
    let dragOffset = new THREE.Vector3();

    const setPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
    };

    const pointerDown = (event: PointerEvent) => {
      if (installedRef.current.length === PARTS.length) return;
      setPointer(event);
      const part = PARTS[currentRef.current];
      const group = groups.get(part.id);
      if (!group) return;
      const hit = raycaster.intersectObject(group, true)[0];
      if (!hit) {
        setFeedback('Use the highlighted part on the parts tray.');
        return;
      }

      dragging = part.id;
      controls.enabled = false;
      dragPlane.constant = -part.target[1];
      if (raycaster.ray.intersectPlane(dragPlane, hitPoint)) {
        dragOffset = group.position.clone().sub(hitPoint);
      }
      canvas.setPointerCapture(event.pointerId);
      setFeedback('Move it toward the glowing target inside the case.');
    };

    const pointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      setPointer(event);
      const group = groups.get(dragging);
      const part = PARTS.find((candidate) => candidate.id === dragging);
      if (!group || !part) return;
      dragPlane.constant = -part.target[1];
      if (!raycaster.ray.intersectPlane(dragPlane, hitPoint)) return;
      group.position.set(
        hitPoint.x + dragOffset.x,
        part.target[1],
        hitPoint.z + dragOffset.z,
      );
    };

    const pointerUp = (event: PointerEvent) => {
      if (!dragging) return;
      const id = dragging;
      dragging = null;
      controls.enabled = true;
      if (canvas.hasPointerCapture(event.pointerId))
        canvas.releasePointerCapture(event.pointerId);

      const part = PARTS.find((candidate) => candidate.id === id);
      const group = groups.get(id);
      if (!part || !group) return;

      const target = new THREE.Vector3(...part.target);
      const distance = new THREE.Vector2(
        group.position.x - target.x,
        group.position.z - target.z,
      ).length();

      if (distance <= 0.78) {
        group.position.copy(target);
        const nextInstalled = installedRef.current.includes(id)
          ? installedRef.current
          : [...installedRef.current, id];
        installedRef.current = nextInstalled;
        setInstalled(nextInstalled);
        setFeedback('Correct — ' + part.name + ' installed.');

        const next = Math.min(currentRef.current + 1, PARTS.length - 1);
        currentRef.current = next;
        setCurrent(next);
      } else {
        group.position.set(...part.start);
        setFeedback('Not quite. Move the part closer to the glowing target.');
      }
    };

    canvas.addEventListener('pointerdown', pointerDown);
    canvas.addEventListener('pointermove', pointerMove);
    canvas.addEventListener('pointerup', pointerUp);
    canvas.addEventListener('pointercancel', pointerUp);

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

      const active = PARTS[currentRef.current];
      for (const [id, ghost] of ghosts) {
        ghost.visible =
          installedRef.current.length < PARTS.length &&
          id === active.id &&
          !installedRef.current.includes(id);
      }

      for (const [id, group] of groups) {
        const activeNow =
          installedRef.current.length < PARTS.length &&
          id === active.id &&
          !installedRef.current.includes(id);
        group.traverse((object) => {
          if (!('isMesh' in object) || !(object as THREE.Mesh).isMesh) return;
          const item = object as THREE.Mesh;
          const materials = Array.isArray(item.material)
            ? item.material
            : [item.material];
          for (const material of materials) {
            if (!(material instanceof THREE.MeshStandardMaterial)) continue;
            material.emissive.setHex(activeNow ? 0x123a40 : 0x000000);
            material.emissiveIntensity = activeNow ? 0.72 : 0;
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
      canvas.removeEventListener('pointerdown', pointerDown);
      canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerup', pointerUp);
      canvas.removeEventListener('pointercancel', pointerUp);
      controls.dispose();
      renderer.dispose();
      scene.traverse((object) => {
        if (!('isMesh' in object) || !(object as THREE.Mesh).isMesh) return;
        const item = object as THREE.Mesh;
        item.geometry.dispose();
        const materials = Array.isArray(item.material)
          ? item.material
          : [item.material];
        for (const material of materials) material.dispose();
      });
    };
  }, []);

  const reset = () => {
    window.location.reload();
  };

  return (
    <main className="assembly-lab">
      <header className="assembly-topbar">
        <button type="button" className="assembly-back" onClick={onBack}>
          <ArrowLeft size={16} />
          Computer Lab
        </button>
        <div className="assembly-brand">
          <span className="assembly-brand-icon">
            <Wrench size={20} />
          </span>
          <span>
            <strong>Big Change PC Build Lab</strong>
            <small>INSTALL THE PARTS IN ORDER</small>
          </span>
        </div>
        <div className="assembly-progress-label">
          {installed.length} / {PARTS.length} installed
        </div>
      </header>

      <aside className="assembly-steps">
        <p className="assembly-eyebrow">PC ASSEMBLY</p>
        <h1>{complete ? 'Build complete.' : activePart.name}</h1>
        <p className="assembly-intro">
          {complete
            ? 'You installed the main PC components in a safe training sequence.'
            : activePart.instruction}
        </p>
        <div className="assembly-progress">
          <span style={{ width: (installed.length / PARTS.length) * 100 + '%' }} />
        </div>
        <div className="assembly-step-list">
          {PARTS.map((part, index) => {
            const Icon = part.icon;
            const done = installed.includes(part.id);
            const active = !complete && index === current;
            return (
              <div
                key={part.id}
                className={
                  'assembly-step ' +
                  (done ? 'done ' : '') +
                  (active ? 'active' : '')
                }
              >
                {done ? <CheckCircle2 size={17} /> : <Icon size={17} />}
                <span>{part.name}</span>
              </div>
            );
          })}
        </div>
      </aside>

      <section className="assembly-stage">
        <canvas
          ref={canvasRef}
          aria-label="Interactive PC assembly training scene. Drag the highlighted component into the glowing target."
        />
        <div className="assembly-stage-tip">
          <Rotate3D size={15} />
          Drag the highlighted part · drop it on the glowing target
        </div>
      </section>

      <aside className="assembly-detail" aria-live="polite">
        <p className="assembly-eyebrow">
          {complete ? 'BUILD COMPLETE' : 'CURRENT STEP'}
        </p>
        <h2>{complete ? 'Nice work.' : activePart.name}</h2>
        <p>
          {complete
            ? 'This first build challenge covers the major components. Cooling, cables and detailed fasteners come next.'
            : activePart.why}
        </p>
        <div className="assembly-feedback">
          <strong>Feedback</strong>
          <p>{feedback}</p>
        </div>
        {complete && (
          <button type="button" className="assembly-primary" onClick={reset}>
            Build it again
            <span>↻</span>
          </button>
        )}
      </aside>
    </main>
  );
}
