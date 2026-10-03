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
  Fan,
} from 'lucide-react';
import * as T from 'three';
import { PC_CONNECTIONS, COOLER_ORDER, checkCooling, canConnect, checkPcPower, type PcConnection } from './pc-power-challenge';
import { readProgress, saveProgress } from './student-progress';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  createHardware,
  createChassis,
  MOUNTS,
  type HardwareId,
  type Vec3,
} from '../lib/optiplex-7040';
type Part = {
  id: HardwareId;
  name: string;
  icon: typeof Cpu;
  instruction: string;
  why: string;
  start: Vec3;
  snap: number;
};
const PARTS: Part[] = [
  {
    id: 'motherboard',
    name: 'Q170 System Board',
    icon: Microchip,
    instruction: 'Drag the board onto the cyan standoff guide.',
    why: 'Dell’s proprietary board includes an LGA1151 socket, four DDR4 DIMM slots, four expansion slots and an M.2 socket.',
    start: [-3.15, 0.75, 0],
    snap: 0.4,
  },
  {
    id: 'cpu',
    name: 'Intel Core Processor',
    icon: Cpu,
    instruction: 'Align the processor with the LGA1151 socket.',
    why: 'This chassis supports sixth-generation Intel Core processors. Socket alignment matters before the retention mechanism is closed.',
    start: [-5.2, 0.82, 2.3],
    snap: 0.24,
  },
  {
    id: 'cooler',
    name: 'CPU Heatsink & Fan',
    icon: Fan,
    instruction: 'Seat the cooling assembly above the processor.',
    why: 'The heatsink and fan remove CPU heat. Connect the fan lead after placement. Apply paste before seating the cooler, then fasten the four marked corners. This is simplified practice, not a torque guide.',
    start: [-4.8, 1.01, -2.2],
    snap: 0.32,
  },
  {
    id: 'ram',
    name: 'DDR4 Memory',
    icon: MemoryStick,
    instruction: 'Align the module with the highlighted DIMM slot.',
    why: 'The 7040 MT uses DDR4-2133 UDIMMs. Match the notch and close the two retention tabs.',
    start: [-3.5, 1.14, 2.8],
    snap: 0.24,
  },
  {
    id: 'ssd',
    name: 'M.2 2280 SSD',
    icon: HardDrive,
    instruction: 'Align the SSD with its Socket 3 mounting guide.',
    why: 'The board accepts a 22 × 80 mm M.2 SSD. The screw at the far end secures it.',
    start: [-2.3, 0.85, 2.8],
    snap: 0.24,
  },
  {
    id: 'gpu',
    name: 'Slot-powered PCIe Card',
    icon: PackageCheck,
    instruction: 'Align the card with the blue PCIe x16 slot.',
    why: 'This is an illustrative small expansion card, not a specific retail GPU. Exact card support requires checking Dell’s configuration and power limits.',
    start: [-2.15, 1.27, -2.45],
    snap: 0.3,
  },
  {
    id: 'psu',
    name: 'Dell 240 W Power Supply',
    icon: Zap,
    instruction: 'Seat the power supply in the lower rear bay.',
    why: 'Dell specifies a 240 W PSU and proprietary board power connections. Generic modern ATX PSU choices have been removed.',
    start: [-4.9, 1.2, -0.5],
    snap: 0.32,
  },
];
type Action = 'home' | 'front' | 'rear' | 'top';
export default function AssemblyLab({
  onBack,
  previewOnly = false,
  componentNames,
}: {
  onBack: () => void;
  previewOnly?: boolean;
  componentNames?: Partial<Record<HardwareId, string>>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null),
    installedRef = useRef<HardwareId[]>([]),
    currentRef = useRef(0);
  const [preview, setPreview] = useState(true),
    [upright, setUpright] = useState(true),
    [closed, setClosed] = useState(false),
    [cageOpen, setCageOpen] = useState(true),
    [exploded, setExploded] = useState(false),
    [isolated, setIsolated] = useState(false);
  const [selected, setSelected] = useState<HardwareId>('ssd'),
    [installed, setInstalled] = useState<HardwareId[]>([]),
    [current, setCurrent] = useState(0),
    [error, setError] = useState('');
  const [feedback, setFeedback] = useState(
    'Explore the assembled reference model, or choose Start assembly practice.',
  );
  const [pasteApplied, setPasteApplied] = useState(false);
  const [screws, setScrews] = useState<number[]>([]);
  const coolingRef = useRef({ pasteApplied: false, screws: [] as number[] });
  useEffect(() => { coolingRef.current = { pasteApplied, screws }; }, [pasteApplied, screws]);
  const [connections, setConnections] = useState<PcConnection[]>([]);
  const [cable, setCable] = useState<PcConnection>('board-power');
  const [powerOn, setPowerOn] = useState(false);
  const [buildEarned, setBuildEarned] = useState(() => readProgress().pcBuilt);
  const [powerProblems, setPowerProblems] = useState<string[]>([]);
  const connectionRef = useRef<PcConnection[]>([]);
  useEffect(() => { connectionRef.current = preview ? [] : connections; }, [connections, preview]);
  const connect = (target: string) => {
    const problem = canConnect(cable, target, installed, connections);
    if (problem) { setFeedback(problem); return; }
    setConnections(previous => [...new Set([...previous, cable])]);
    setPowerProblems([]);
    setFeedback('Cable connected. M.2 storage and this slot-powered card do not need separate power cables.');
  };
  const testPower = () => {
    const problems = [...checkPcPower(installed, connections, closed, !cageOpen), ...checkCooling({ pasteApplied, screws })];
    setPowerProblems(problems);
    setPowerOn(problems.length === 0);
    if (!problems.length) { saveProgress({ pcBuilt: true }); setBuildEarned(true); }
    setFeedback(problems.length ? 'Power-on check stopped. Fix the items below and try again.' : 'POST passed in the simulation. Memory and storage detected. Your virtual PC is ready.');
  };
  const displayRef = useRef({
    preview: true,
    upright: true,
    closed: false,
    cageOpen: true,
    exploded: false,
    isolated: false,
    selected: 'ssd' as HardwareId,
  });
  const actionRef = useRef<Action | null>('home'),
    resetRef = useRef(false);
  useEffect(() => {
    displayRef.current = {
      preview,
      upright,
      closed,
      cageOpen,
      exploded,
      isolated,
      selected,
    };
  }, [preview, upright, closed, cageOpen, exploded, isolated, selected]);
  const complete = installed.length === PARTS.length,
    active = preview ? PARTS.find((p) => p.id === selected)! : PARTS[current];
  const name = (p: Part) => componentNames?.[p.id] ?? p.name;
  const practice = () => {
    setPasteApplied(false);
    setScrews([]);
    coolingRef.current = { pasteApplied: false, screws: [] };
    setConnections([]);
    setPowerOn(false);
    setPowerProblems([]);
    installedRef.current = [];
    currentRef.current = 0;
    resetRef.current = true;
    setInstalled([]);
    setCurrent(0);
    setPreview(false);
    setUpright(false);
    setClosed(false);
    setCageOpen(true);
    setExploded(false);
    setIsolated(false);
    actionRef.current = 'home';
    setFeedback(
      'Install the glowing system board first. Wrong placements return the part to the tray.',
    );
  };
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({ canvas, antialias: true });
    } catch {
      queueMicrotask(() =>
        setError(
          '3D graphics could not start. Enable WebGL and reload this page.',
        ),
      );
      return;
    }
    const scene = new T.Scene();
    scene.background = new T.Color(0x111a21);
    const camera = new T.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(10.6, 12.8, 12.6);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    let dirty = true,
      previousDisplay = '';
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.minDistance = 5;
    controls.maxDistance = 28;
    controls.target.set(1.05, 1.15, 0);
    scene.add(new T.HemisphereLight(0xe4f0ff, 0x4b5262, 2.3));
    const key = new T.DirectionalLight(0xfff4e8, 3.5);
    key.position.set(3, 12, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -10;
    key.shadow.camera.right = 10;
    key.shadow.camera.top = 8;
    key.shadow.camera.bottom = -8;
    key.shadow.bias = -0.0004;
    scene.add(key);
    const fill = new T.DirectionalLight(0xbadfff, 2.1);
    fill.position.set(-5, 6, -7);
    scene.add(fill);
    const table = new T.Mesh(
      new T.BoxGeometry(15, 0.25, 9.4),
      new T.MeshStandardMaterial({ color: 0x25333c, roughness: 0.91 }),
    );
    table.position.set(-0.7, 0.39, 0);
    table.receiveShadow = true;
    scene.add(table);
    const grid = new T.GridHelper(15, 30, 0x3c5865, 0x2e444f);
    grid.position.set(-0.7, 0.522, 0);
    scene.add(grid);
    const { group: chassis, cover, driveCage } = createChassis();
    const assembly = new T.Group();
    scene.add(assembly);
    assembly.add(chassis);
    const cableVisuals = new Map<PcConnection, T.Mesh>();
    const routes: Record<PcConnection, number[][]> = {
      'board-power': [[1.33, 1.6, 2.05], [3.6, 1.05, 1.8], [3.4, 1, -0.9]],
      'cpu-power': [[1.33, 1.6, 2.05], [0.5, 1.05, 1], [0.55, 1, -1.9]],
      fan: [[1.48, 1.8, -1.68], [1.9, 1.1, -1.9], [2.25, 1, -2.05]],
      switch: [[4.3, 0.95, 1.5], [3.6, 0.98, 0.9], [2.9, 0.98, 0.7]],
      display: [[0.3, 1.65, 0.1], [-0.4, 1.3, 0.1], [-0.9, 0.65, -0.7]],
      mains: [[0.4, 1.35, 2.1], [-0.5, 1, 2.1], [-1.3, 0.7, 2.8]],
    };
    for (const connection of PC_CONNECTIONS) {
      const path = new T.CatmullRomCurve3(routes[connection.id].map(point => new T.Vector3(...point)));
      const visual = new T.Mesh(new T.TubeGeometry(path, 24, connection.id === 'mains' ? 0.045 : 0.024, 6, false), new T.MeshStandardMaterial({ color: connection.id === 'fan' ? 0xc9aa52 : 0x30383e, roughness: 0.75 }));
      visual.visible = false;
      visual.castShadow = true;
      assembly.add(visual);
      cableVisuals.set(connection.id, visual);
    }
    const groups = new Map<HardwareId, T.Group>();
    for (const p of PARTS) {
      const g = createHardware(p.id);
      g.position.set(...MOUNTS[p.id]);
      groups.set(p.id, g);
      assembly.add(g);
    }
    const paste = new T.Mesh(new T.SphereGeometry(0.075, 16, 8), new T.MeshStandardMaterial({ color: 0xb6bcc2, roughness: 0.9 }));
    paste.scale.y = 0.2;
    paste.position.set(MOUNTS.cpu[0], MOUNTS.cpu[1] + 0.09, MOUNTS.cpu[2]);
    assembly.add(paste);
    const guide = new T.BoxHelper(groups.get('motherboard')!, 0x70dce5);
    guide.visible = false;
    scene.add(guide);
    const highlight = new T.BoxHelper(groups.get('ssd')!, 0xebb967);
    scene.add(highlight);
    const ray = new T.Raycaster(),
      pointer = new T.Vector2(),
      plane = new T.Plane(new T.Vector3(0, 1, 0), 0),
      point = new T.Vector3(),
      offset = new T.Vector3();
    let dragging: HardwareId | null = null,
      press: { x: number; y: number } | null = null;
    const pointerAt = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        -((e.clientY - r.top) / r.height) * 2 + 1,
      );
      ray.setFromCamera(pointer, camera);
    };
    const down = (e: PointerEvent) => {
      press = { x: e.clientX, y: e.clientY };
      if (
        displayRef.current.preview ||
        installedRef.current.length === PARTS.length
      )
        return;
      pointerAt(e);
      const p = PARTS[currentRef.current],
        g = groups.get(p.id)!;
      if (!ray.intersectObject(g, true).length) return;
      if (p.id === 'cooler' && !coolingRef.current.pasteApplied) { setFeedback('Apply thermal paste to the CPU before seating the cooler.'); return; }
      dragging = p.id;
      controls.enabled = false;
      plane.constant = -MOUNTS[p.id][1];
      if (ray.ray.intersectPlane(plane, point))
        offset.copy(g.position).sub(point);
      canvas.setPointerCapture(e.pointerId);
      setFeedback(`${p.name} selected. Drag it into the cyan guide.`);
      e.stopPropagation();
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      dirty = true;
      pointerAt(e);
      const target = MOUNTS[dragging];
      plane.constant = -target[1];
      if (ray.ray.intersectPlane(plane, point))
        groups
          .get(dragging)!
          .position.set(point.x + offset.x, target[1], point.z + offset.z);
    };
    const finish = (e: PointerEvent, cancelled = false) => {
      dirty = true;
      if (dragging) {
        const id = dragging;
        dragging = null;
        controls.enabled = true;
        if (canvas.hasPointerCapture(e.pointerId))
          canvas.releasePointerCapture(e.pointerId);
        const p = PARTS.find((p) => p.id === id)!,
          g = groups.get(id)!,
          target = MOUNTS[id];
        if (
          !cancelled &&
          Math.hypot(g.position.x - target[0], g.position.z - target[2]) <=
            p.snap
        ) {
          g.position.set(...target);
          installedRef.current = [...installedRef.current, id];
          setInstalled([...installedRef.current]);
          currentRef.current = Math.min(
            currentRef.current + 1,
            PARTS.length - 1,
          );
          setCurrent(currentRef.current);
          setFeedback(
            `Installed: ${p.name}. ${installedRef.current.length === PARTS.length ? 'Parts placed. Match the cables, close the cage, fit the cover, then test power.' : 'Continue with the next highlighted part.'}`,
          );
        } else {
          g.position.set(...p.start);
          setFeedback(
            cancelled
              ? 'Drag cancelled. Part returned to the tray.'
              : `${p.name} missed its mounting guide. Try again.`,
          );
        }
      } else if (
        !cancelled &&
        displayRef.current.preview &&
        !displayRef.current.closed &&
        press &&
        Math.hypot(e.clientX - press.x, e.clientY - press.y) < 5
      ) {
        pointerAt(e);
        const hit = ray.intersectObject(assembly, true).find(({object}) => {
          let node: T.Object3D | null = object;
          while(node && node !== assembly) {
            if(!node.visible) return false;
            node = node.parent;
          }
          return true;
        });
        if (hit) {
          let o: T.Object3D = hit.object;
          while (o.parent && o.parent !== assembly) o = o.parent;
          if (!groups.has(o.name as HardwareId)) { press = null; return; }
          setSelected(o.name as HardwareId);
          setFeedback(
            'Selected component. Use Explode selected or Isolate selected to inspect it.',
          );
        }
      }
      press = null;
    };
    const up = (e: PointerEvent) => finish(e),
      cancel = (e: PointerEvent) => finish(e, true);
    canvas.addEventListener('pointerdown', down, true);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', cancel);
    const resize = () => {
      const w = canvas.clientWidth,
        h = canvas.clientHeight;
      if (w && h) {
        dirty = true;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
    };
    const obs = new ResizeObserver(resize);
    obs.observe(canvas);
    resize();
    let frame = 0;
    const draw = () => {
      frame = requestAnimationFrame(draw);
      const d = displayRef.current,
        done = installedRef.current.length === PARTS.length;
      const signature = JSON.stringify([
        d,
        installedRef.current,
        currentRef.current,
        connectionRef.current,
        coolingRef.current,
      ]);
      if (signature !== previousDisplay) {
        dirty = true;
        previousDisplay = signature;
      }
      for (const [id, visual] of cableVisuals) visual.visible = !d.preview && connectionRef.current.includes(id);
      assembly.rotation.x = d.preview && d.upright ? Math.PI / 2 : 0;
      assembly.position.set(
        0,
        d.preview && d.upright ? 0.55 + 350 / 120 : 0,
        d.preview && d.upright ? -(0.58 + 154 / 120) : 0,
      );
      assembly.updateMatrixWorld(true);
      if (resetRef.current) {
        dragging = null;
        controls.enabled = true;
        resetRef.current = false;
      }
      if (actionRef.current) {
        dirty = true;
        const view = actionRef.current;
        const cx = d.preview || done ? 2.5 : 0.15;
        controls.target.set(cx, d.preview && d.upright ? 3.4 : 1.1, 0);
        if (view === 'home')
          camera.position.set(cx + 8.5, d.preview && d.upright ? 7.4 : 12, 11);
        if (view === 'front') camera.position.set(14, 4.3, 0);
        if (view === 'rear') camera.position.set(-9, 4.3, 0);
        if (view === 'top') camera.position.set(cx, 17, 0.01);
        actionRef.current = null;
      }
      paste.visible = !d.preview && coolingRef.current.pasteApplied && !installedRef.current.includes('cooler');
      chassis.visible = !(d.preview && d.isolated);
      driveCage.rotation.z = !d.closed && (d.cageOpen || (!d.preview && !done)) ? -Math.PI / 2.4 : 0;
      cover.visible = d.closed && (d.preview || done) && !d.isolated;
      for (const p of PARTS) {
        const g = groups.get(p.id)!;
        g.visible = !(d.preview && d.isolated && d.selected !== p.id);
        if (d.preview || installedRef.current.includes(p.id)) {
          g.position.set(...MOUNTS[p.id]);
          if (d.preview && d.exploded && d.selected === p.id)
            g.position.y += 2.3;
        } else if (dragging !== p.id) g.position.set(...p.start);
        const on = !d.preview && !done && p.id === PARTS[currentRef.current].id;
        g.traverse((o) => {
          if (
            o instanceof T.Mesh &&
            o.material instanceof T.MeshStandardMaterial
          ) {
            o.material.emissive.setHex(on ? 0x13616b : 0);
            o.material.emissiveIntensity = on ? 0.35 : 0;
          }
        });
      }
      if (!d.preview && !done) {
        const g = groups.get(PARTS[currentRef.current].id)!;
        const saved = g.position.clone();
        g.position.set(...MOUNTS[PARTS[currentRef.current].id]);
        g.updateMatrixWorld(true);
        guide.setFromObject(g);
        g.position.copy(saved);
        g.updateMatrixWorld(true);
        guide.visible = true;
      } else guide.visible = false;
      highlight.visible = d.preview && !d.closed;
      highlight.setFromObject(groups.get(d.selected)!);
      const cameraChanged = controls.update();
      if (dirty || cameraChanged) {
        if (dirty) renderer.shadowMap.needsUpdate = true;
        renderer.render(scene, camera);
        dirty = false;
      }
    };
    draw();
    return () => {
      cancelAnimationFrame(frame);
      obs.disconnect();
      canvas.removeEventListener('pointerdown', down, true);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', cancel);
      controls.dispose();
      const geometries = new Set<T.BufferGeometry>(),
        materials = new Set<T.Material>(),
        textures = new Set<T.Texture>();
      scene.traverse((o) => {
        if (o instanceof T.Mesh || o instanceof T.LineSegments) {
          geometries.add(o.geometry);
          for (const m of Array.isArray(o.material)
            ? o.material
            : [o.material]) {
            materials.add(m);
            if (m instanceof T.MeshStandardMaterial && m.map)
              textures.add(m.map);
          }
        }
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      renderer.dispose();
    };
  }, []);
  const stage = (
    <section
      className={'assembly-stage' + (previewOnly ? ' assembly-preview' : '')}
    >
      <div className="assembly-view-controls">
        {preview && (
          <button
            onClick={() => {
              setUpright(!upright);
              actionRef.current = 'home';
            }}
          >
            {upright ? 'Service view' : 'Tower view'}
          </button>
        )}
        {!previewOnly && (
          <button
            onClick={() => {
              if (preview) practice();
              else {
                setPowerOn(false);
                setPreview(true);
                setClosed(false);
                actionRef.current = 'home';
              }
            }}
          >
            {preview ? 'Start assembly practice' : 'Inspect assembled model'}
          </button>
        )}
        <button
          disabled={!preview && !complete}
          onClick={() => {
            if (powerOn) { setFeedback('Shut down the virtual PC before opening the case.'); return; }
            setClosed(!closed);
            setExploded(false);
            setIsolated(false);
          }}
        >
          {closed ? 'Remove side cover' : 'Fit side cover'}
        </button>
        {(preview || complete) && !closed && (
          <button disabled={powerOn} aria-pressed={cageOpen} onClick={() => setCageOpen(!cageOpen)}>
            {cageOpen ? 'Close drive cage' : 'Open drive cage'}
          </button>
        )}
        {(['home', 'front', 'rear', 'top'] as Action[]).map((view) => (
          <button
            key={view}
            onClick={() => {
              actionRef.current = view;
            }}
          >
            {view === 'home'
              ? 'Overview'
              : view[0].toUpperCase() + view.slice(1)}
          </button>
        ))}
        {preview && !closed && (
          <>
            <button
              aria-pressed={exploded}
              onClick={() => setExploded(!exploded)}
            >
              {exploded ? 'Return selected' : 'Explode selected'}
            </button>
            <button
              aria-pressed={isolated}
              onClick={() => setIsolated(!isolated)}
            >
              {isolated ? 'Show all' : 'Isolate selected'}
            </button>
            <select
              aria-label="Select component"
              value={selected}
              onChange={(e) => setSelected(e.target.value as HardwareId)}
            >
              {PARTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {name(p)}
                </option>
              ))}
            </select>
          </>
        )}
      </div>
      <canvas
        ref={canvasRef}
        aria-label="OptiPlex 7040 reference model — rotate, select and inspect hardware"
      />
      {error && (
        <div className="assembly-render-error" role="alert">
          {error}
        </div>
      )}
      <div className="assembly-stage-tip">
        <Rotate3D size={15} />
        {preview
          ? 'Drag empty space: rotate · Wheel: zoom · Click hardware: select'
          : 'Drag glowing hardware into cyan guide · Empty space: rotate'}
      </div>
    </section>
  );
  if (previewOnly) return stage;
  return (
    <main className="assembly-lab">
      <header className="assembly-topbar">
        <button className="assembly-back" onClick={onBack}>
          <ArrowLeft size={16} /> Parts picker
        </button>
        <div className="assembly-brand">
          <span className="assembly-brand-icon">
            <Wrench size={20} />
          </span>
          <span>
            <strong>Big Change PC Build Lab</strong>
            <small>OPTIPLEX 7040 MT · SERVICE REFERENCE MODEL</small>
          </span>
        </div>
        <div className="assembly-progress-label">
          {preview
            ? 'Inspection mode'
            : powerOn ? 'POST passed · PC ready' : `${installed.length} / ${PARTS.length} placed`}
        </div>
      </header>
      <aside className="assembly-steps">
        <p className="assembly-eyebrow">
          {preview ? 'EXPLORE THE HARDWARE' : 'ASSEMBLY PRACTICE'}
        </p>
        <h1>{powerOn ? 'PC ready' : !preview && complete ? 'Parts placed' : name(active)}</h1>
        <p className="assembly-intro">
          {preview
            ? 'Select any component, isolate it, or lift just that part out of the case.'
            : complete
              ? 'Parts are seated. Connect the cables and run the power-on check.'
              : active.instruction}
        </p>
        <div className="assembly-progress">
          <span
            style={{ width: (installed.length / PARTS.length) * 100 + '%' }}
          />
        </div>
        <div className="assembly-step-list">
          {PARTS.map((p, i) => {
            const Icon = p.icon,
              done = installed.includes(p.id),
              on = preview ? selected === p.id : i === current && !complete;
            return (
              <button
                key={p.id}
                disabled={!preview}
                onClick={() => setSelected(p.id)}
                className={
                  'assembly-step ' +
                  (done ? 'done ' : '') +
                  (on ? 'active' : '')
                }
              >
                {done ? <CheckCircle2 size={17} /> : <Icon size={17} />}
                <span>{name(p)}</span>
              </button>
            );
          })}
        </div>
      </aside>
      {stage}
      <aside className="assembly-detail" aria-live="polite">
        <p className="assembly-eyebrow">COMPONENT NOTES</p>
        {buildEarned && <p className="assembly-boot">✓ PC Builder earned · saved on this browser</p>}
        <h2>{name(active)}</h2>
        <p>{active.why}</p>
        <div className="assembly-feedback">
          <strong>Service coach</strong>
          <p>{feedback}</p>
        </div>
        {!preview && (
          <section className="assembly-cooling" aria-label="CPU cooling preparation">
            <h3>Prepare CPU cooling</h3>
            <p>Paste fills tiny gaps between the CPU and cooler. The cooler carries heat away.</p>
            <button className="assembly-primary" disabled={pasteApplied || !installed.includes('cpu') || installed.includes('cooler') || connections.includes('mains') || powerOn} onClick={() => { setPasteApplied(true); setFeedback('Paste applied. Seat the cooler over the CPU.'); }}>{pasteApplied ? 'Paste applied' : 'Apply thermal paste'}</button>
            <p>Seat the cooler. Then follow the marked diagonal order: 1 → 3 → 2 → 4.</p>
            <div className="assembly-corners">{[1, 2, 4, 3].map(corner => <button key={corner} disabled={!installed.includes('cooler') || screws.includes(corner) || connections.includes('mains') || powerOn} onClick={() => {
              if (corner !== COOLER_ORDER[screws.length]) { setFeedback(`Choose corner ${COOLER_ORDER[screws.length]} next. Work across opposite corners.`); return; }
              setScrews(previous => [...previous, corner]); setPowerProblems([]);
              setFeedback(screws.length === 3 ? 'Cooler secured. Connect its fan lead to power the fan.' : 'Corner fastened. Choose the opposite marked corner next.');
            }}>{screws.includes(corner) ? 'Done: ' : ''}Corner {corner}</button>)}</div>
            <p>{screws.length} / 4 corners fastened</p>
            <small>Simplified learning steps. Real coolers may use different paste, clips or screw instructions. Follow their manual.</small>
          </section>
        )}
        {!preview && (
          <section className="assembly-wiring" aria-label="Connections and power-on challenge">
            <h3>Connect → Close → Test</h3>
            <p>Choose a cable. Then choose its socket. Connect wall power last. Cable routes are teaching examples.</p>
            <label>Cable<select aria-label="Choose PC cable" value={cable} disabled={powerOn} onChange={event => setCable(event.target.value as PcConnection)}>{PC_CONNECTIONS.map(connection => <option key={connection.id} value={connection.id}>{connections.includes(connection.id) ? '✓ ' : ''}{connection.label}</option>)}</select></label>
            <div className="assembly-sockets">{PC_CONNECTIONS.map(connection => <button key={connection.id} disabled={powerOn} onClick={() => connect(connection.target)}>{connection.target}</button>)}</div>
            <p>{connections.length} / {PC_CONNECTIONS.length} cables connected</p>
            <button className="assembly-back" disabled={powerOn || !connections.includes('mains')} onClick={() => { setConnections(previous => previous.filter(id => id !== 'mains')); setFeedback('Wall power unplugged. You can change connections.'); }}>Unplug wall power</button>
            <button className="assembly-primary" onClick={() => { if (powerOn) { setPowerOn(false); setFeedback('Virtual PC shut down.'); } else testPower(); }}>{powerOn ? 'Shut down PC' : 'Test power-on'}</button>
            {powerProblems.length > 0 && <ul>{powerProblems.map(problem => <li key={problem}>{problem}</li>)}</ul>}
            {powerOn && <output className="assembly-boot"><strong>✓ POST passed</strong><p>RAM detected · NVMe SSD detected · Display signal ready</p><small>Simulated checks. No real operating system starts.</small></output>}
          </section>
        )}
        <p className="assembly-model-note">
          Original geometry based on Dell’s manual. Chassis envelope uses
          documented dimensions; interior measurements and surfaces are
          approximated. The optional graphics card is illustrative.
        </p>
        <a
          className="assembly-reference"
          href="https://dl.dell.com/topicspdf/optiplex-7040-desktop_owners-manual_en-us.pdf"
          target="_blank"
          rel="noreferrer"
        >
          Dell reference manual ↗
        </a>
        {complete && !preview && (
          <button className="assembly-primary" onClick={practice}>
            Restart practice ↻
          </button>
        )}
      </aside>
    </main>
  );
}

