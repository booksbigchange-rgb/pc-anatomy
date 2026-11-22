import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import type { Vec3 } from './layout.ts';
import { diagramKit, put, type DiagramPalette } from './diagram-kit.ts';

/**
 * Networks: the home network, the network controller, the Ethernet frame
 * and the cable.
 *
 * The first three are diagrams in the shared language. The frame is drawn
 * as headers in a row with brackets beneath showing what each layer wraps,
 * so pulling the scale apart lifts the layers off one by one. The cable is
 * physical hardware in millimetres, like the other hardware scales.
 */

type Level = 'homenet' | 'nic' | 'frame' | 'cable';

/** Cool greens, so the network scales read as one family. */
const palette: DiagramPalette = {
  panel: '#131b19',
  rail: '#3f7466',
  caption: '#86bfae',
  text: '#e2f1ec',
};

const device = '#2f5464',
  link = '#4f6a3a',
  radio = '#5b4a77',
  router = '#2f6a5c',
  outside = '#3b4552',
  header = ['#2f6a5c', '#34506e', '#5b4a77'] as const,
  payload = '#6a5a38';

export function buildNetworkArchitecture(
  level: Level,
  tools: ModelTools,
  root: T.Group,
) {
  if (level === 'cable') return buildCable(tools);
  const { backdrop, readableBlock: block } = diagramKit(tools, palette);
  const { box, label, add } = tools;

  if (level === 'homenet') {
    backdrop(root, [11.2, 7.6], 'HOME NETWORK · TEACHING DIAGRAM');
    // Scenery marking out the home, so "inside" and "outside" read at once.
    const home = new T.Group();
    home.userData.contextFrame = true;
    put(home, box([5.9, 0.04, 6.6], '#1b2623', 0.2), [-2.45, 0.0, 0]);
    label(home, 'YOUR HOME', [-4.3, 0.04, -3.05], 1.6, '#86bfae');
    root.add(home);

    block('netpc', [1.7, 0.4, 1.4], [-4.4, 0.22, -1.5], device, 'COMPUTER');
    block(
      'netdevices',
      [1.7, 0.4, 1.4],
      [-4.4, 0.22, 1.7],
      device,
      'PHONE · LAPTOP',
    );
    block(
      'netcable',
      [1.6, 0.1, 0.3],
      [-2.75, 0.07, -1.1],
      link,
      'CABLE',
      [0, 0.7, -0.4],
    );
    block(
      'netwifi',
      [1.6, 0.1, 0.3],
      [-2.75, 0.07, 1.25],
      radio,
      'WI-FI',
      [0, 0.7, 0.4],
    );
    block(
      'netrouter',
      [1.6, 0.46, 2.8],
      [-1.0, 0.25, 0],
      router,
      'ROUTER',
      [0, 1.2, 0],
    );
    block(
      'netisp',
      [1.9, 0.14, 0.6],
      [1.35, 0.09, 0],
      outside,
      'PROVIDER',
      [0, 0.8, 0],
    );
    block(
      'netinternet',
      [2.4, 0.3, 3.2],
      [3.85, 0.17, 0],
      outside,
      'INTERNET',
      [0.4, 1, 0],
    );
    block(
      'netdns',
      [2.4, 0.3, 0.9],
      [3.85, 0.17, -2.65],
      '#45506a',
      'DNS SERVER',
      [0.4, 1, -0.6],
    );
    block(
      'netserver',
      [2.4, 0.3, 0.9],
      [3.85, 0.17, 2.65],
      '#45506a',
      'WEB SERVER',
      [0.4, 1, 0.6],
    );
    return;
  }

  if (level === 'nic') {
    backdrop(root, [11.2, 7.6], 'WIRED ETHERNET CONTROLLER · TEACHING MODEL');
    block(
      'nicmac',
      [2.6, 0.36, 2.4],
      [-3.7, 0.2, 0],
      header[1],
      'MAC',
      [-0.6, 1.2, 0],
    );
    block(
      'nicmii',
      [1.3, 0.12, 0.5],
      [-1.65, 0.08, 0],
      link,
      'MII',
      [0, 0.8, 0],
    );
    block(
      'nicphy',
      [2.6, 0.36, 2.4],
      [0.4, 0.2, 0],
      header[0],
      'PHY',
      [0, 1.2, 0],
    );
    block(
      'nicmagnetics',
      [1.6, 0.32, 1.6],
      [2.65, 0.18, 0],
      '#6a5a38',
      'MAGNETICS',
      [0.4, 1.1, 0],
    );
    block(
      'nicjack',
      [1.3, 0.6, 1.5],
      [4.35, 0.32, 0],
      '#4a4f5a',
      'RJ45',
      [0.8, 1.0, 0],
    );
    block(
      'nicled',
      [0.7, 0.12, 0.45],
      [4.35, 0.08, -1.35],
      '#3f7a3f',
      'LINK',
      [0.6, 0.8, -0.5],
    );
    block(
      'nicled',
      [0.7, 0.12, 0.45],
      [4.35, 0.08, 1.35],
      '#8a7a2f',
      'ACT',
      [0.6, 0.8, 0.5],
    );
    return;
  }

  // The frame: headers in a row, in the order they go out on the wire, with
  // a bracket under each layer spanning everything it wraps.
  backdrop(root, [11.2, 7.6], 'ONE ETHERNET FRAME · NOT TO SCALE');
  const left = -5.0,
    right = 5.0;
  const layer = (
    id: string,
    text: string,
    from: number,
    to: number,
    color: string,
    bracketZ: number,
    bracketText: string,
    lift: number,
  ) => {
    const group = new T.Group();
    const width = to - from;
    put(group, box([width, 0.36, 1.6], color, 0.12), [0, 0, 0]);
    label(
      group,
      text,
      [0, 0.19, 0],
      labelWidth(text, width, 1.6),
      palette.text,
    );
    const span = right - from;
    put(group, box([span, 0.08, 0.42], color, 0.12), [
      (span - width) / 2,
      -0.12,
      bracketZ,
    ]);
    label(
      group,
      bracketText,
      [(span - width) / 2, -0.07, bracketZ],
      labelWidth(bracketText, span, 0.42),
      palette.text,
    );
    return add(id, group, [from + width / 2, 0.2, -1.6], [0, lift, -0.3]);
  };
  layer(
    'frameeth',
    'ETHERNET HEADER',
    left,
    -2.6,
    header[0],
    4.0,
    'ETHERNET FRAME',
    2.4,
  );
  layer('frameip', 'IP HEADER', -2.5, -0.3, header[1], 3.2, 'IP PACKET', 1.7);
  layer(
    'frametcp',
    'TCP HEADER',
    -0.2,
    1.8,
    header[2],
    2.4,
    'TCP SEGMENT',
    1.0,
  );
  const data = new T.Group();
  put(data, box([right - 1.9, 0.36, 1.6], payload, 0.12), [0, 0, 0]);
  label(
    data,
    'DATA',
    [0, 0.19, 0],
    labelWidth('DATA', right - 1.9, 1.6),
    palette.text,
  );
  add('framedata', data, [(1.9 + right) / 2, 0.2, -1.6], [0, 0.4, 0]);
}

function labelWidth(text: string, across: number, depth: number) {
  const chars = Math.max(text.length, 1);
  const letters = Math.min(across * 0.82, chars * 0.24);
  return Math.min((letters * 512) / (chars * 25.2), (depth * 0.7 * 512) / 42);
}

/**
 * An RJ45 plug on a short length of cable, its jacket cut back so the four
 * twisted pairs show. Millimetres throughout; sizes are illustrative.
 */
function buildCable({ add, material, box }: ModelTools) {
  const mm = (v: number) => v / 6;
  const plug = new T.Group();
  const shell = new T.Mesh(
    new T.BoxGeometry(mm(11.7), mm(8), mm(21)),
    // Clear plastic, so the wires can be seen running in to the contacts.
    new T.MeshStandardMaterial({
      color: '#e4ecef',
      roughness: 0.2,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    }),
  );
  plug.add(shell);
  // The latch: a springy tab on the underside, angled back towards the cable.
  const latch = box([mm(6), mm(1), mm(12)], '#d9e1e4', 0.05);
  latch.rotation.x = -0.22;
  put(plug, latch, [0, -mm(5), mm(2)]);
  add('cableplug', plug, [0, mm(4), -mm(10.5)], [0, 0.6, -1.2]);

  // Eight contacts across the top, at the front of the plug.
  const contacts = new T.Group();
  for (let i = 0; i < 8; i++)
    put(contacts, box([mm(0.6), mm(1.2), mm(5)], '#d4b25a', 0.9, 0.01), [
      mm((i - 3.5) * 1.02),
      0,
      0,
    ]);
  add('cablecontact', contacts, [0, mm(8.3), -mm(17)], [0, 1.4, -0.6]);

  // The jacket, cut back a little behind the plug.
  const jacket = new T.Mesh(
    new T.CylinderGeometry(mm(3), mm(3), mm(34), 32, 1, true),
    material('#3a6fb0', 0.05, 0.6),
  );
  jacket.material.side = T.DoubleSide;
  jacket.rotation.x = Math.PI / 2;
  add('cablejacket', jacket, [0, mm(4), mm(40)], [0, -0.4, 1.2]);

  // Four pairs fanning out of the jacket towards the plug, each pair a
  // coloured wire and a white one twisted round each other.
  const colours = ['#e08a2f', '#3f9a4f', '#3a6fd0', '#8a5a34'];
  for (let pair = 0; pair < 4; pair++) {
    const group = new T.Group();
    const offset = new T.Vector3(
      mm((pair - 1.5) * 1.6),
      mm((pair % 2) - 0.5),
      0,
    );
    for (const [phase, colour] of [
      [0, colours[pair]],
      [Math.PI, '#eef0f0'],
    ] as const) {
      const points: T.Vector3[] = [];
      for (let k = 0; k <= 60; k++) {
        // From just behind the contacts, out of the plug and into the
        // jacket: 41 mm of cable in 60 steps.
        const z = mm(-18 + k * 0.68);
        const turn = (k / 60) * Math.PI * 10 + phase;
        points.push(
          new T.Vector3(
            offset.x + mm(0.55) * Math.cos(turn),
            offset.y + mm(0.55) * Math.sin(turn),
            z,
          ),
        );
      }
      put(
        group,
        new T.Mesh(
          new T.TubeGeometry(new T.CatmullRomCurve3(points), 120, mm(0.45), 8),
          material(colour, 0.05, 0.5),
        ),
        [0, 0, 0],
      );
    }
    add('cablepair', group, [0, mm(4), mm(2)] as Vec3, [
      (pair - 1.5) * 0.5,
      0.4 + (pair % 2) * 0.3,
      0.2,
    ]);
  }
}
