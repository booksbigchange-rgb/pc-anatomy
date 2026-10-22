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
import { PC_CONNECTIONS, COOLER_ORDER, canConnect, type PcConnection } from './pc-power-challenge';
import {
  DIRECTION_REASON, FIXED_NOTE, LEARNED, REMOVABLE_NOTE, SAFETY, SHORT_NAME, TOTAL_STEPS, XP_PER_STEP,
  completedSteps, diagnosis, dropPart, installPart, installProblem, nextPart, partStatus, postProblems, turnPart, type BuildState,
} from './build-session.ts';
import FaultPractice from './fault-practice';
import { ORIENTED_PARTS, RETAINERS, PART_JOBS, PC_FAULTS, type Retainer } from './hardware-practice.ts';
import { readProgress, saveProgress } from './student-progress';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { frameInspectionBounds } from '../lib/inspection-camera.ts';
import {
  createHardware,
  createChassis,
  MOUNTS,
  BOARD_TARGETS,
  CASE_TARGETS,
  setHardwareRetainers,
  type CaseTargetId,
  type BoardTargetId,
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
    why: 'This Dell board has a CPU socket, four RAM slots, four expansion slots and an M.2 socket for the SSD.',
    start: [-3.15, 0.75, 0],
    snap: 0.4,
  },
  {
    id: 'cpu',
    name: 'Intel Core Processor',
    icon: Cpu,
    instruction: 'Align the processor with the LGA1151 socket.',
    why: 'This case uses 6th generation Intel Core processors. Line up the triangle before you close the socket lever.',
    start: [-5.2, 0.82, 2.3],
    snap: 0.24,
  },
  {
    id: 'cooler',
    name: 'CPU Heatsink & Fan',
    icon: Fan,
    instruction: 'Seat the cooling assembly above the processor.',
    why: 'The metal fins and fan pull heat away from the CPU. Put thermal paste on first, then fasten the four corners. This is simple practice, not a repair guide.',
    start: [-4.8, 1.01, -2.2],
    snap: 0.32,
  },
  {
    id: 'ram',
    name: 'DDR4 Memory',
    icon: MemoryStick,
    instruction: 'Align the module with the highlighted DIMM slot.',
    why: 'This PC uses DDR4 memory sticks. Match the notch, push down, and close the two clips.',
    start: [-3.5, 1.14, 2.8],
    snap: 0.24,
  },
  {
    id: 'ssd',
    name: 'M.2 2280 SSD',
    icon: HardDrive,
    instruction: 'Align the SSD with its Socket 3 mounting guide.',
    why: 'The SSD is 22 mm wide and 80 mm long. One small screw at the end holds it down.',
    start: [-2.3, 0.85, 2.8],
    snap: 0.24,
  },
  {
    id: 'gpu',
    name: 'Slot-powered PCIe Card',
    icon: PackageCheck,
    instruction: 'Align the card with the blue PCIe x16 slot.',
    why: 'This is a training card, not a real product. Real cards must fit the case and the power supply.',
    start: [-2.15, 1.27, -2.45],
    snap: 0.3,
  },
  {
    id: 'psu',
    name: 'Dell 240 W Power Supply',
    icon: Zap,
    instruction: 'Seat the power supply in the lower rear bay.',
    why: 'Dell uses a 240 W power supply with its own special plugs. Normal desktop power supplies do not fit.',
    start: [-4.9, 1.2, -0.5],
    snap: 0.32,
  },
];
type Action = 'home' | 'front' | 'rear' | 'top' | 'cooling';
/** Below this width/height ratio the overview camera steps back in proportion. */
const PORTRAIT_ASPECT = 1.03;
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
    installedRef = useRef<HardwareId[]>([]);
  const [preview, setPreview] = useState(true),
    [upright, setUpright] = useState(true),
    [closed, setClosed] = useState(false),
    [cageOpen, setCageOpen] = useState(true),
    [exploded, setExploded] = useState(false),
    [isolated, setIsolated] = useState(false);
  const [aligned, setAligned] = useState<HardwareId[]>([]);
  const [fastened, setFastened] = useState<Retainer[]>([]);
  const [fault, setFault] = useState(0);
  const [lightGraphics, setLightGraphics] = useState(false);
  const [caseTarget, setCaseTarget] = useState<CaseTargetId | null>(null);
  const [caseInstance, setCaseInstance] = useState<string | null>(null);
  const [selectedCable, setSelectedCable] = useState<PcConnection | null>(null);
  const [boardTarget, setBoardTarget] = useState<BoardTargetId | null>(null);
  const [selected, setSelected] = useState<HardwareId>('ssd'),
    [installed, setInstalled] = useState<HardwareId[]>([]),
    [error, setError] = useState('');
  const selectHardware = (id: HardwareId) => { setSelected(id); setBoardTarget(null); setCaseTarget(null); setSelectedCable(null); };
  const [feedback, setFeedback] = useState(
    'Explore the assembled reference model, or choose Start assembly practice.',
  );
  const [pasteApplied, setPasteApplied] = useState(false);
  const [screws, setScrews] = useState<number[]>([]);
  const [connections, setConnections] = useState<PcConnection[]>([]);
  const [cable, setCable] = useState<PcConnection>('board-power');
  const [powerOn, setPowerOn] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [buildEarned, setBuildEarned] = useState(() => readProgress().pcBuilt);
  const [powerProblems, setPowerProblems] = useState<string[]>([]);
  const build: BuildState = { installed, aligned, fastened, pasteApplied, screws, connections, coverClosed: closed, cageOpen, powerOn, mistakes };
  // The 3D event handlers live in one long-lived effect, so they read the build through a ref.
  const buildRef = useRef(build);
  useEffect(() => { buildRef.current = { ...build, installed: installedRef.current }; });
  const connect = (target: string) => {
    const problem = canConnect(cable, target, installed, connections);
    if (problem) { setMistakes(count => count + 1); setFeedback(problem); return; }
    setConnections(previous => [...new Set([...previous, cable])]);
    setPowerProblems([]);
    setFeedback(cable === 'mains' ? 'Wall power connected. Unplug it before you change anything inside.' : 'Cable connected. The M.2 SSD and this card get power through their slots, so they need no extra cable.');
  };
  const testPower = () => {
    const problems = postProblems(build);
    setPowerProblems(problems);
    setPowerOn(problems.length === 0);
    if (!problems.length) { saveProgress({ pcBuilt: true }); setBuildEarned(true); setShowResult(true); }
    else setMistakes(count => count + 1);
    setFeedback(problems.length ? `Power-on check stopped. ${diagnosis(problems)} Fix the items below and try again.` : 'POST passed in the simulation. Memory and storage detected. Your virtual PC is ready.');
  };
  const displayRef = useRef({
    preview: true,
    upright: true,
    closed: false,
    cageOpen: true,
    exploded: false,
    isolated: false,
    selected: 'ssd' as HardwareId,
    boardTarget: null as BoardTargetId | null,
    caseTarget: null as CaseTargetId | null,
    caseInstance: null as string | null,
    selectedCable: null as PcConnection | null,
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
      boardTarget,
      caseTarget, caseInstance, selectedCable,
    };
  }, [preview, upright, closed, cageOpen, exploded, isolated, selected, boardTarget, caseTarget, caseInstance, selectedCable]);
  const complete = installed.length === PARTS.length,
    active = PARTS.find((p) => p.id === selected)!;
  const name = (p: Part) => componentNames?.[p.id] ?? p.name;
  const practice = () => {
    setAligned([]); setFastened([]);
    setPasteApplied(false);
    setScrews([]);
    setConnections([]);
    setPowerOn(false);
    setPowerProblems([]);
    setMistakes(0);
    setShowResult(false);
    installedRef.current = [];
    buildRef.current = { ...buildRef.current, installed: [], aligned: [], fastened: [], pasteApplied: false, screws: [], connections: [], coverClosed: false, cageOpen: true, powerOn: false, mistakes: 0 };
    resetRef.current = true;
    setInstalled([]);
    selectHardware('motherboard');
    setPreview(false);
    setUpright(false);
    setClosed(false);
    setCageOpen(true);
    setExploded(false);
    setIsolated(false);
    actionRef.current = 'home';
    setFeedback(
      'Start with the glowing motherboard. Drag any part into its cyan guide. Wrong drops go back to the tray.',
    );
  };
  /** Apply the result of a drop or seat attempt. Shared by dragging and the seat button. */
  const applyAttempt = (id: HardwareId, result: ReturnType<typeof installPart>) => {
    setFeedback(result.message);
    if (!result.ok) { setMistakes(count => count + 1); return false; }
    installedRef.current = result.state.installed;
    buildRef.current = { ...buildRef.current, installed: result.state.installed };
    setInstalled(result.state.installed);
    const next = nextPart(result.state);
    if (next) selectHardware(next);
    return true;
  };
  const seatPart = () => {
    if (preview || installed.includes(selected)) return;
    const problem = installProblem(buildRef.current, selected);
    if (problem) { setMistakes(count => count + 1); setFeedback(problem); return; }
    applyAttempt(selected, installPart(buildRef.current, selected));
  };
  const turnSelected = () => {
    setAligned(previous => turnPart({ ...buildRef.current, aligned: previous }, selected).aligned);
    setFeedback(`${SHORT_NAME[selected][0].toUpperCase() + SHORT_NAME[selected].slice(1)} turned 180°. Compare its yellow arrow with the cyan arrow on the guide.`);
  };
  // The 3D handlers call these through a ref so they always see the latest state setters.
  /** Keys while the 3D view has focus: 1–7 choose a part, T turns it, Enter seats it. Same rules as the buttons. */
  const keyAction = (key: string) => {
    if (preview || powerOn) return false;
    const index = Number(key) - 1;
    if (Number.isInteger(index) && index >= 0 && index < PARTS.length) {
      const part = PARTS[index];
      selectHardware(part.id);
      setFeedback(`${name(part)}: ${partStatus(build, part.id)}.${installed.includes(part.id) ? '' : `${ORIENTED_PARTS.includes(part.id) ? ' Press T to turn it.' : ''} Press Enter to seat it.`}`);
      return true;
    }
    if ((key === 't' || key === 'T') && ORIENTED_PARTS.includes(selected) && !installed.includes(selected)) { turnSelected(); return true; }
    if (key === 'Enter' && !installed.includes(selected)) { seatPart(); return true; }
    return false;
  };
  const handlersRef = useRef({ applyAttempt, selectHardware, setFeedback, keyAction });
  useEffect(() => { Object.assign(handlersRef.current, { applyAttempt, selectHardware, keyAction }); });
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
    renderer.setPixelRatio(Math.min(devicePixelRatio, lightGraphics ? 1 : 1.75));
    renderer.shadowMap.enabled = !lightGraphics;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    let dirty = true,
      previousDisplay = '',
      previousIsolation = '';
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    const pmrem = new T.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, .04);
    scene.environment = environment.texture;
    scene.environmentIntensity = .48;
    room.dispose();
    pmrem.dispose();
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.minDistance = 5;
    controls.maxDistance = 28;
    controls.target.set(1.05, 1.15, 0);
    scene.add(new T.HemisphereLight(0xe4f0ff, 0x343b43, .6));
    const key = new T.DirectionalLight(0xfff4e8, 2.1);
    key.position.set(3, 12, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -10;
    key.shadow.camera.right = 10;
    key.shadow.camera.top = 8;
    key.shadow.camera.bottom = -8;
    key.shadow.bias = -0.00008;
    key.shadow.radius = 2;
    key.shadow.normalBias = 0.003;
    scene.add(key);
    const fill = new T.DirectionalLight(0xd5e5ff, .45);
    fill.position.set(-5, 6, -7);
    scene.add(fill);
    const rim = new T.DirectionalLight(0xe6efff, .65);
    rim.position.set(7, 6, -4);
    scene.add(rim);
    const table = new T.Mesh(
      new T.BoxGeometry(15, 0.25, 9.4),
      new T.MeshStandardMaterial({ color: 0x30383b, roughness: 0.91 }),
    );
    table.position.set(-0.7, 0.39, 0);
    table.receiveShadow = true;
    scene.add(table);
    const grid = new T.GridHelper(15, 30, 0x3c5865, 0x2e444f);
    grid.position.set(-0.7, 0.522, 0);
    for (const material of Array.isArray(grid.material) ? grid.material : [grid.material]) {
      material.transparent = true;
      material.opacity = .16;
      material.depthWrite = false;
    }
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
      // Cable colours a student can tell apart: yellow fan lead, grey front-panel lead, black power and display cables.
      const colour = connection.id === 'fan' ? 0xc9aa52 : connection.id === 'switch' ? 0x8b9399 : connection.id === 'display' ? 0x1f2a44 : 0x22282c;
      const radius = connection.id === 'mains' ? 0.045 : connection.id === 'board-power' ? 0.04 : 0.024;
      const visual = new T.Mesh(new T.TubeGeometry(path, 32, radius, 8, false), new T.MeshStandardMaterial({ color: colour, roughness: 0.7 }));
      // Rubber-moulded plugs at both ends show where each cable seats.
      for (const end of [0, 1]) {
        const plug = new T.Mesh(new T.BoxGeometry(radius * 3.4, radius * 2.6, radius * 4.2), new T.MeshStandardMaterial({ color: 0x101315, roughness: 0.85 }));
        plug.position.copy(path.getPointAt(end));
        plug.lookAt(path.getPointAt(end).add(path.getTangentAt(end)));
        plug.userData.connectionId = connection.id;
        plug.castShadow = true;
        visual.add(plug);
      }
      visual.userData.connectionId = connection.id;
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
    const ghosts = new Map<HardwareId, T.Group>();
    for (const [id, hardware] of groups) {
      const ghost = hardware.clone(true);
      ghost.position.set(...MOUNTS[id]); ghost.visible=false;
      ghost.traverse(object => { if (object instanceof T.Mesh) { object.material=new T.MeshBasicMaterial({color:0x70dce5,transparent:true,opacity:.22,depthWrite:false}); object.castShadow=false; } });
      ghosts.set(id,ghost); assembly.add(ghost);
    }
    // Direction arrows: yellow on the part, cyan on its guide. They point the same way only when the part is turned correctly.
    const markers = new Map<HardwareId, T.Mesh>();
    for (const id of ORIENTED_PARTS) {
      const sample = createHardware(id);
      const bounds = new T.Box3().setFromObject(sample);
      sample.traverse(object => { if (object instanceof T.Mesh) object.geometry.dispose(); });
      const size = bounds.getSize(new T.Vector3());
      const length = T.MathUtils.clamp(Math.min(size.x, size.z) * 0.5, 0.12, 0.26);
      const arrow = new T.ConeGeometry(length * 0.42, length, 3);
      arrow.rotateZ(-Math.PI / 2);
      const place = (mesh: T.Mesh) => { mesh.position.set(bounds.max.x - length * 0.6, bounds.max.y + length * 0.5, (bounds.min.z + bounds.max.z) / 2); mesh.name = `${id}-direction`; };
      const onPart = new T.Mesh(arrow, new T.MeshStandardMaterial({ color: 0xffc94d, emissive: 0x6b4a00, roughness: 0.5 }));
      place(onPart); groups.get(id)!.add(onPart); markers.set(id, onPart);
      const onGuide = new T.Mesh(arrow, new T.MeshBasicMaterial({ color: 0x70dce5, transparent: true, opacity: 0.85, depthWrite: false }));
      place(onGuide); ghosts.get(id)!.add(onGuide);
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
    const assembling = () => !displayRef.current.preview && installedRef.current.length < PARTS.length;
    /** The part the cyan guide and glow point at: the one in hand, else the selected loose part, else the next step. */
    const focusPart = () => {
      if (dragging) return dragging;
      const selected = displayRef.current.selected;
      return installedRef.current.includes(selected) ? nextPart({ installed: installedRef.current }) : selected;
    };
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
      if (!assembling()) return;
      pointerAt(e);
      const loose = PARTS.filter(p => !installedRef.current.includes(p.id));
      const hits = loose
        .map(p => ({ p, hit: ray.intersectObject(groups.get(p.id)!, true)[0] }))
        .filter(({ hit }) => hit)
        .sort((a, b) => a.hit.distance - b.hit.distance);
      if (!hits.length) return;
      const p = hits[0].p,
        g = groups.get(p.id)!;
      dragging = p.id;
      dirty = true;
      handlersRef.current.selectHardware(p.id);
      controls.enabled = false;
      plane.constant = -MOUNTS[p.id][1];
      if (ray.ray.intersectPlane(plane, point))
        offset.copy(g.position).sub(point);
      canvas.setPointerCapture(e.pointerId);
      const build = buildRef.current;
      const warning = p.id === 'cooler' && !build.pasteApplied && build.installed.includes('cpu')
        ? 'You can move the cooler, but it will not go in until thermal paste is on the CPU.'
        : ORIENTED_PARTS.includes(p.id) && !build.aligned.includes(p.id)
          ? 'Wrong direction. The yellow arrow does not match the cyan guide. Use “Turn part 180°” before it can go in.'
          : `${SHORT_NAME[p.id][0].toUpperCase() + SHORT_NAME[p.id].slice(1)} picked up. Drag it into the cyan guide.`;
      handlersRef.current.setFeedback(warning);
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
          g = groups.get(id)!;
        const moved = press ? Math.hypot(e.clientX - press.x, e.clientY - press.y) : 0;
        press = null;
        if (cancelled) {
          g.position.set(...p.start);
          handlersRef.current.setFeedback('Drag cancelled. The part went back to the tray.');
          return;
        }
        // A tap picks a part up to inspect it; it is not a failed drop.
        if (moved < 5) { g.position.set(...p.start); return; }
        const distances = Object.fromEntries(PARTS.map(part => [part.id, Math.hypot(g.position.x - MOUNTS[part.id][0], g.position.z - MOUNTS[part.id][2])])) as Record<HardwareId, number>;
        const snaps = Object.fromEntries(PARTS.map(part => [part.id, part.snap])) as Record<HardwareId, number>;
        const result = dropPart(buildRef.current, id, distances, snaps);
        if (result.ok) g.position.set(...MOUNTS[id]);
        else g.position.set(...p.start);
        handlersRef.current.applyAttempt(id, result);
      } else if (
        !cancelled &&
        press &&
        Math.hypot(e.clientX - press.x, e.clientY - press.y) < 5
      ) {
        pointerAt(e);
        const hit = ray.intersectObjects([chassis, ...groups.values(), ...cableVisuals.values()], true).find(({object}) => {
          let node: T.Object3D | null = object;
          while(node && node !== assembly) {
            if(!node.visible) return false;
            node = node.parent;
          }
          return true;
        });
        if (hit) {
          let o: T.Object3D = hit.object;
          let target: BoardTargetId | null = null;
          let exterior: CaseTargetId | null = null;
          let instance: string | null = null;
          const cableId = o.userData.connectionId as PcConnection | undefined;
          if (cableId) { setSelectedCable(cableId); setCaseTarget(null); setBoardTarget(null); press=null; return; }
          while (o.parent && o.parent !== assembly) {
            if (o.userData.caseTarget) { exterior=o.userData.caseTarget as CaseTargetId; instance=o.name; }
            if (o.userData.boardTarget) target = o.userData.boardTarget as BoardTargetId;
            o = o.parent;
          }
          setSelectedCable(null);
          if (o === chassis) { setCaseTarget(exterior ?? 'chassis'); setCaseInstance(instance); setBoardTarget(null); press=null; return; }
          setCaseTarget(null);
          setBoardTarget(target);
          if (target) setExploded(false);
          if (!groups.has(o.name as HardwareId)) { press = null; return; }
          setSelected(o.name as HardwareId);
          handlersRef.current.setFeedback(
            displayRef.current.preview
              ? 'Selected component. Use Explode selected or Isolate selected to inspect it.'
              : `${SHORT_NAME[o.name as HardwareId][0].toUpperCase() + SHORT_NAME[o.name as HardwareId].slice(1)} selected. Read about it in the notes.`,
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
    // Keyboard orbit for students who cannot drag: arrows rotate, + and - zoom.
    const orbitByKey = (e: KeyboardEvent) => {
      const turn = { ArrowLeft: [-0.17, 0], ArrowRight: [0.17, 0], ArrowUp: [0, -0.12], ArrowDown: [0, 0.12] }[e.key];
      const zoom = e.key === '+' || e.key === '=' ? 0.88 : e.key === '-' || e.key === '_' ? 1.14 : 1;
      if (!turn && zoom === 1) {
        if (handlersRef.current.keyAction(e.key)) e.preventDefault();
        return;
      }
      e.preventDefault();
      const orbit = new T.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
      if (turn) {
        orbit.theta += turn[0];
        orbit.phi = T.MathUtils.clamp(orbit.phi + turn[1], 0.12, Math.PI / 2 - 0.04);
      }
      orbit.radius = T.MathUtils.clamp(orbit.radius * zoom, controls.minDistance, controls.maxDistance);
      camera.position.copy(controls.target).add(new T.Vector3().setFromSpherical(orbit));
      dirty = true;
    };
    canvas.addEventListener('keydown', orbitByKey);
    let framedFace: Action | null = null;
    const resize = () => {
      const w = canvas.clientWidth,
        h = canvas.clientHeight;
      if (w && h) {
        dirty = true;
        renderer.setSize(w, h, false);
        const wasPortrait = camera.aspect < PORTRAIT_ASPECT;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        if (framedFace && displayRef.current.preview && !displayRef.current.isolated) actionRef.current = framedFace;
        else if (wasPortrait !== camera.aspect < PORTRAIT_ASPECT && !displayRef.current.isolated) actionRef.current = 'home';
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
        buildRef.current,
        dragging,
      ]);
      if (signature !== previousDisplay) {
        dirty = true;
        previousDisplay = signature;
      }
      for (const [id, visual] of cableVisuals) visual.visible = !d.preview && buildRef.current.connections.includes(id);
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
      const inspectCooling = actionRef.current === 'cooling';
      if (actionRef.current) {
        dirty = true;
        const view = actionRef.current;
        framedFace = view === 'front' || view === 'rear' ? view : null;
        const cx = d.preview || done ? 2.5 : 0.15;
        controls.target.set(cx, d.preview && d.upright ? 3.4 : 1.1, 0);
        if (view === 'home') {
          camera.position.set(cx + 8.5, d.preview && d.upright ? 7.4 : 12, 11);
          // Tall, narrow stages (portrait tablets, phones) would crop the parts tray: step back to keep it in view.
          if (camera.aspect < PORTRAIT_ASPECT) camera.position.sub(controls.target).multiplyScalar(PORTRAIT_ASPECT / camera.aspect).add(controls.target);
        }
        if (view === 'front') camera.position.set(14, 4.3, 0);
        if (view === 'rear') camera.position.set(-9, 4.3, 0);
        if (d.preview && d.upright && (view === 'front' || view === 'rear')) {
          frameInspectionBounds(camera, controls.target, new T.Box3().setFromObject(assembly), new T.Vector3(view === 'front' ? 1 : -1, 0.04, 0));
        }
        if (view === 'top') camera.position.set(cx, 17, 0.01);
        actionRef.current = null;
      }
      for (const id of ['motherboard','gpu'] as HardwareId[]) setHardwareRetainers(groups.get(id)!, d.preview ? ['ram','ssd','gpu'] : buildRef.current.fastened);
      paste.visible = !d.preview && buildRef.current.pasteApplied && !installedRef.current.includes('cooler');
      const focus = !d.preview && !done ? focusPart() : null;
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
        g.rotation.y = !d.preview && !installedRef.current.includes(p.id) && ORIENTED_PARTS.includes(p.id) && !buildRef.current.aligned.includes(p.id) ? Math.PI : 0;
        const marker = markers.get(p.id);
        if (marker) marker.visible = !d.preview && !installedRef.current.includes(p.id);
        const on = p.id === focus;
        g.traverse((o) => {
          if (
            o instanceof T.Mesh &&
            o.material instanceof T.MeshStandardMaterial &&
            o !== marker
          ) {
            o.material.emissive.setHex(on ? 0x13616b : 0);
            o.material.emissiveIntensity = on ? 0.35 : 0;
          }
        });
      }
      for (const [id,ghost] of ghosts) ghost.visible=id===focus;
      if (inspectCooling) {
        assembly.updateMatrixWorld(true);
        const bounds = new T.Box3().setFromObject(groups.get('cpu')!);
        bounds.union(new T.Box3().setFromObject(groups.get('cooler')!)).expandByScalar(.35);
        controls.minDistance = 2;
        frameInspectionBounds(camera, controls.target, bounds, new T.Vector3(-.65, 1.4, 1));
      }
      if (focus) {
        const g = groups.get(focus)!;
        const saved = g.position.clone();
        const savedRotation=g.rotation.y; g.rotation.y=0;
        g.position.set(...MOUNTS[focus]);
        g.updateMatrixWorld(true);
        guide.setFromObject(g);
        g.position.copy(saved); g.rotation.y=savedRotation;
        g.updateMatrixWorld(true);
        guide.visible = true;
      } else guide.visible = false;
      highlight.visible = d.preview || done ? !d.closed || d.caseTarget !== null : installedRef.current.includes(d.selected) && !dragging;
      const selectedRoot = groups.get(d.selected)!;
      const caseObject = d.caseTarget && !d.caseInstance ? (() => { let found: T.Object3D | undefined; chassis.traverse(object => { if (!found && object.userData.caseTarget === d.caseTarget) found=object; }); return found ?? chassis; })() : chassis;
      const inspectionObject = d.caseTarget ? (d.caseInstance ? chassis.getObjectByName(d.caseInstance) : caseObject) : d.selectedCable ? cableVisuals.get(d.selectedCable) : d.selected === 'motherboard' && d.boardTarget ? selectedRoot.getObjectByName(d.boardTarget) : selectedRoot;
      highlight.setFromObject(inspectionObject ?? selectedRoot);
      const isolationSignature = d.preview && d.isolated ? `${d.selected}:${d.exploded}:${d.upright}` : '';
      if (isolationSignature !== previousIsolation) {
        previousIsolation = isolationSignature;
        if (isolationSignature) {
          assembly.updateMatrixWorld(true);
          const bounds = new T.Box3().setFromObject(selectedRoot);
          const sphere = bounds.getBoundingSphere(new T.Sphere());
          const halfFov = Math.min(T.MathUtils.degToRad(camera.fov / 2), Math.atan(Math.tan(T.MathUtils.degToRad(camera.fov / 2)) * camera.aspect));
          const distance = Math.max(1.8, sphere.radius / Math.sin(halfFov) * 1.3);
          controls.minDistance = 1;
          controls.target.copy(sphere.center);
          camera.position.copy(sphere.center).addScaledVector(new T.Vector3(0.7, 0.8, 1).normalize(), distance);
        } else if (!inspectCooling) actionRef.current = 'home';
        dirty = true;
      }
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
      canvas.removeEventListener('keydown', orbitByKey);
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
      environment.dispose();
      renderer.dispose();
    };
  }, [lightGraphics]);
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
        <button aria-pressed={lightGraphics} onClick={() => { actionRef.current='home'; setLightGraphics(!lightGraphics); }}>{lightGraphics ? 'Full graphics' : 'Light graphics'}</button>
        {preview && <button onClick={() => {
          setSelected('cooler'); setCaseTarget(null); setCaseInstance(null); setBoardTarget(null); setSelectedCable(null);
          setUpright(false); setClosed(false); setCageOpen(true); setIsolated(false); setExploded(true);
          actionRef.current = 'cooling';
          setFeedback('Cooler lifted straight above the CPU. Click the exposed processor to learn about it.');
        }}>Reveal CPU</button>}
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
              disabled={caseTarget !== null || selectedCable !== null || (selected === 'motherboard' && boardTarget !== null)}
              aria-pressed={exploded}
              onClick={() => setExploded(!exploded)}
            >
              {exploded ? 'Return selected' : 'Explode selected'}
            </button>
            <button
              aria-pressed={isolated}
              onClick={() => setIsolated(!isolated)}
            >
              {isolated ? 'Show all' : boardTarget && selected === 'motherboard' ? 'Isolate motherboard' : 'Isolate selected'}
            </button>
            <select
              aria-label="Select component"
              value={selected}
              onChange={(e) => selectHardware(e.target.value as HardwareId)}
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
        tabIndex={0}
        aria-label="OptiPlex 7040 reference model. Arrow keys rotate, plus and minus zoom. In practice, press 1 to 7 to choose a part, T to turn it and Enter to seat it."
      />
      {error && (
        <div className="assembly-render-error" role="alert">
          {error}
        </div>
      )}
      {!preview && !previewOnly && !showResult && (
        <div className={'assembly-stage-coach' + (/Wrong|missed|first|not |Unplug|stopped|That is the/.test(feedback) ? ' warn' : '')} aria-hidden="true">
          {feedback}
        </div>
      )}
      {!preview && showResult && (
        <section className="assembly-result" aria-labelledby="assembly-result-title">
          <p className="assembly-eyebrow">ACHIEVEMENT UNLOCKED</p>
          <h2 id="assembly-result-title">🏅 PC Builder</h2>
          <p className="assembly-result-xp"><strong>{completedSteps(build) * XP_PER_STEP} XP</strong> · {completedSteps(build)} of {TOTAL_STEPS} steps · {mistakes === 0 ? 'no mistakes' : `${mistakes} mistake${mistakes === 1 ? '' : 's'} found and fixed`}</p>
          <h3>You completed</h3>
          <ul>
            <li>Installed all 7 parts in the right places</li>
            <li>Turned the CPU, RAM, SSD and card the right way</li>
            <li>Put on thermal paste and fastened the cooler 1 → 3 → 2 → 4</li>
            <li>Closed the RAM clips, SSD screw and card bracket</li>
            <li>Connected all {PC_CONNECTIONS.length} cables, closed the case and passed POST</li>
          </ul>
          <h3>You learned</h3>
          <ul>{LEARNED.map(item => <li key={item}>{item}</li>)}</ul>
          <div className="assembly-result-actions">
            <button className="assembly-primary" onClick={practice}>Restart practice ↻</button>
            <button onClick={() => setShowResult(false)}>Keep exploring this PC</button>
          </div>
        </section>
      )}
      <div className="assembly-stage-tip">
        <Rotate3D size={15} />
        {preview
          ? 'Drag empty space: rotate · Wheel: zoom · Click hardware: select · Keys: arrows, + −'
          : 'Drag any loose part into its cyan guide · Empty space: rotate · Keys: arrows, + −'}
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
        <h1>{powerOn ? 'PC ready' : !preview && complete ? 'Parts placed' : preview ? name(active) : `Step ${installed.length + 1} of ${PARTS.length}`}</h1>
        <p className="assembly-intro">
          {preview
            ? 'Select any component, isolate it, or lift just that part out of the case.'
            : complete
              ? 'Parts are seated. Secure them, connect the cables and run the power-on check.'
              : `Next: ${name(PARTS.find(p => p.id === nextPart(build))!)}. Tap any part to learn about it. Your progress is kept.`}
        </p>
        <div className="assembly-progress">
          <span
            style={{ width: (installed.length / PARTS.length) * 100 + '%' }}
          />
        </div>
        <div className="assembly-step-list">
          {PARTS.map((p) => {
            const Icon = p.icon,
              done = !preview && installed.includes(p.id),
              status = partStatus(build, p.id),
              on = selected === p.id;
            return (
              <button
                key={p.id}
                aria-pressed={on}
                aria-label={preview ? name(p) : `${name(p)}: ${status}`}
                onClick={() => {
                  selectHardware(p.id);
                  if (!preview && !powerOn) setFeedback(
                    status === 'Installed' ? `${name(p)} is installed. Read about it in the notes.`
                      : status.startsWith('Needs') ? `${name(p)}: ${status.toLowerCase()}. You can still pick it up and look at it.`
                        : `${name(p)}: ${status === 'Next step' ? 'this is the next step' : 'ready'}. Drag it into the cyan guide, or use the Seat button.`,
                  );
                }}
                className={
                  'assembly-step ' +
                  (done ? 'done ' : '') +
                  (on ? 'active' : '')
                }
              >
                {done ? <CheckCircle2 size={17} /> : <Icon size={17} />}
                <span>{name(p)}{!preview && <small className={'assembly-step-status' + (status === 'Next step' ? ' next' : '')}>{status}</small>}</span>
              </button>
            );
          })}
        </div>
      </aside>
      {stage}
      <aside className="assembly-detail" aria-live="polite">
        <p className="assembly-eyebrow">COMPONENT NOTES</p>
        {preview && selected === 'ssd' && !cageOpen && !isolated && <p>The SSD sits behind the drive cage. Choose Open drive cage, then Service view to see it, or Isolate selected for a close look.</p>}
        {buildEarned && <p className="assembly-boot">✓ PC Builder earned · saved on this browser</p>}
        <h2>{caseTarget ? CASE_TARGETS[caseTarget].name : selectedCable ? PC_CONNECTIONS.find(item => item.id === selectedCable)!.label : preview && selected === 'motherboard' && boardTarget ? BOARD_TARGETS[boardTarget].name : name(active)}</h2>
        <p>{caseTarget ? CASE_TARGETS[caseTarget].job : selectedCable ? `Connects to ${PC_CONNECTIONS.find(item => item.id === selectedCable)!.target}. Disconnect wall power before changing hardware connections.` : preview && selected === 'motherboard' && boardTarget ? BOARD_TARGETS[boardTarget].job : active.why}</p>
        {preview && selected === 'motherboard' && boardTarget && <p><strong>Connects to:</strong> {BOARD_TARGETS[boardTarget].connects}</p>}
        {preview && <section className="assembly-board-targets" aria-label="Motherboard learning targets">
          <h3>Explore the board</h3>
          <p>Tap a visible socket, or choose it here. Covered parts can be explored after removing the part above them.</p>
          <div>{(Object.keys(BOARD_TARGETS) as BoardTargetId[]).map(id => <button key={id} aria-pressed={selected === 'motherboard' && boardTarget === id} onClick={() => { setSelected('motherboard'); setCaseTarget(null); setSelectedCable(null); setBoardTarget(id); setExploded(false); setFeedback('Highlighted on the motherboard. Sockets and holders remain attached to the board.'); }}>{BOARD_TARGETS[id].name}</button>)}</div>
        </section>}
        {caseTarget && <p><strong>Connects to:</strong> {CASE_TARGETS[caseTarget].connects}</p>}
        {!boardTarget && !caseTarget && !selectedCable && <div className="assembly-job">
          {!preview && <p className={'assembly-part-status' + (partStatus(build, active.id) === 'Next step' ? ' next' : '')}><strong>Status:</strong> {partStatus(build, active.id)}{partStatus(build, active.id) === 'Next step' ? ' — this is the next installation step.' : ''}</p>}
          <strong>Its job:</strong> {PART_JOBS[active.id].job}<p><strong>Example:</strong> {PART_JOBS[active.id].example}</p><p><strong>Connects to:</strong> {PART_JOBS[active.id].connection}</p>
          <p className="assembly-safety"><strong>Safety:</strong> {SAFETY[active.id]}</p>
          <p className="assembly-fixed-note">{REMOVABLE_NOTE}</p>
        </div>}
        {(boardTarget || caseTarget) && <p className="assembly-fixed-note">{caseTarget === 'chassis' ? 'Fixed part: this is the case itself.' : FIXED_NOTE.replace('the board', caseTarget ? 'the case' : 'the board')}</p>}
        {preview && <section className="assembly-board-targets" aria-label="Case port learning targets"><h3>Ports and case</h3><div>{(Object.keys(CASE_TARGETS) as CaseTargetId[]).filter(id => id !== 'optical').map(id => <button key={id} onClick={() => { setCaseTarget(id); setCaseInstance(null); setBoardTarget(null); setSelectedCable(null); setIsolated(false); actionRef.current = id === 'button' ? 'front' : 'rear'; }}>{CASE_TARGETS[id].name}</button>)}</div></section>}
        {!preview && !installed.includes(active.id) && <section className="assembly-handling" aria-label="Touch assembly">
          <h3>Place this part</h3><p>Drag it into the cyan guide, or use this button. Both follow the same rules.</p><p className="assembly-fixed-note">Keyboard: select the 3D view, press 1–7 to choose a part, T to turn it, Enter to seat it.</p>
          <button onClick={seatPart}>Seat {name(active)} in its guide</button>
        </section>}
        {!preview && !installed.includes(active.id) && ORIENTED_PARTS.includes(active.id) && <section className="assembly-handling" aria-label="Part orientation">
          <h3>Match the direction</h3><p>{DIRECTION_REASON[active.id]} The yellow arrow on the part must point the same way as the cyan arrow on the guide.</p>
          <button aria-pressed={aligned.includes(active.id)} onClick={turnSelected}>Turn part 180°</button>
          <p className={aligned.includes(active.id) ? 'assembly-direction ok' : 'assembly-direction'}>{aligned.includes(active.id) ? '✓ Direction matches the guide.' : '✗ Wrong direction. Turn the part.'}</p>
        </section>}
        {!preview && <section className="assembly-handling" aria-label="Module retainers"><h3>Secure installed parts</h3>
          {(Object.keys(RETAINERS) as Retainer[]).map(id => <button key={id} disabled={!installed.includes(id) || fastened.includes(id) || connections.includes('mains') || powerOn} onClick={() => { setFastened(previous => [...previous, id]); setFeedback(`${RETAINERS[id]}: secured. The retainer holds the part in place.`); }}>{fastened.includes(id) ? '✓ ' : ''}{RETAINERS[id]}</button>)}
          <p>Unplug wall power before changing a retainer. These are simplified actions, not a repair guide.</p></section>}
        {preview && <details className="assembly-faults"><summary>Practise troubleshooting</summary>
          <label>Case<select aria-label="PC troubleshooting case" value={fault} onChange={event => setFault(Number(event.target.value))}>{PC_FAULTS.map((item, index) => <option key={item.id} value={index}>{item.title}</option>)}</select></label>
          <FaultPractice key={PC_FAULTS[fault].id} scenario={PC_FAULTS[fault]} />
        </details>}
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
            <button className="assembly-primary" onClick={() => { if (powerOn) { setPowerOn(false); setShowResult(false); setFeedback('Virtual PC shut down.'); } else testPower(); }}>{powerOn ? 'Shut down PC' : 'Test power-on'}</button>
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
