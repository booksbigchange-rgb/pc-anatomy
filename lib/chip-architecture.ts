import type * as THREE from 'three';
import type { ModelTools } from './hardware.ts';
import type { Vec3 } from './layout.ts';
import { diagramKit, type DiagramPalette } from './diagram-kit.ts';

/**
 * Inside the chip: the five scales below one Zen 5 core.
 *
 * Drawn in the shared diagram language — labelled blocks on a slab — so they
 * read as the same kind of picture as the GPU and I/O-die diagrams. The core
 * keeps AMD's counts; the four scales beneath it are teaching models, and the
 * transistor stands up as a cut sample of silicon rather than lying flat, so
 * its layers can be seen from the side.
 */

type Level = 'zen5core' | 'alu' | 'adder' | 'gate' | 'transistor';

/** Warm ochre, so the silicon scales read as one family. */
const palette: DiagramPalette = {
  panel: '#1b1914',
  rail: '#7a6440',
  caption: '#c2a36e',
  text: '#f0e6d2',
};

const memory = '#2c5563',
  compute = '#34506e',
  logic = '#4b4570',
  carry = '#6c5a3a',
  power = '#7a4f2e',
  ground = '#3a3f45';

export function buildChipArchitecture(
  level: Level,
  tools: ModelTools,
  root: THREE.Group,
) {
  const { backdrop, readableBlock: block } = diagramKit(tools, palette);

  if (level === 'zen5core') {
    backdrop(root, [11.2, 7.6], 'ZEN 5 CORE · AMD');
    block('z5l1i', [2.3, 0.16, 1.0], [-4.3, 0.1, -2.6], memory, 'L1 I · 32 KB');
    block('z5fetch', [2.6, 0.18, 1.0], [-1.6, 0.11, -2.6], compute, 'FETCH');
    block(
      'z5decode',
      [4.2, 0.18, 1.0],
      [2.2, 0.11, -2.6],
      compute,
      'DECODE · OP CACHE',
    );
    block(
      'z5schedule',
      [10.3, 0.18, 0.6],
      [0, 0.11, -1.25],
      logic,
      'SCHEDULERS · OUT OF ORDER',
      [0, 0.9, -0.5],
    );
    for (let i = 0; i < 6; i++)
      block(
        'z5alu',
        [0.72, 0.32, 1.7],
        [-4.9 + i * 0.85, 0.18, 0.55],
        compute,
        'ALU ' + (i + 1),
        [(i - 2.5) * 0.12, 1.3, 0],
      );
    for (let i = 0; i < 4; i++)
      block(
        'z5agu',
        [0.72, 0.32, 1.7],
        [0.2 + i * 0.85, 0.18, 0.55],
        compute,
        'AGU ' + (i + 1),
        [i * 0.12, 1.3, 0],
      );
    block(
      'z5fpu',
      [1.85, 0.32, 1.7],
      [4.55, 0.18, 0.55],
      logic,
      'FP · 512-BIT',
      [0.5, 1.3, 0],
    );
    block(
      'z5l1d',
      [3.4, 0.16, 1.0],
      [-3.45, 0.1, 2.55],
      memory,
      'L1 D · 48 KB',
    );
    block('z5l2', [6.5, 0.16, 1.0], [1.85, 0.1, 2.55], memory, 'L2 · 1 MB');
    return;
  }

  if (level === 'alu') {
    backdrop(root, [11.2, 7.6], 'TEACHING MODEL · INTEGER ALU');
    for (const [text, x] of [
      ['A', -1.6],
      ['B', 2.8],
    ] as const)
      block(
        'aluinput',
        [3.4, 0.16, 0.7],
        [x, 0.1, -2.85],
        memory,
        'OPERAND ' + text,
        [0, 0.8, -0.8],
      );
    block(
      'aluop',
      [1.4, 0.2, 4.6],
      [-4.6, 0.12, 0],
      carry,
      'OP SELECT',
      [-0.8, 0.8, 0],
    );
    block('aluadder', [2.6, 0.36, 2.0], [-2.25, 0.2, -0.55], compute, 'ADDER');
    block(
      'alulogic',
      [2.6, 0.36, 2.0],
      [0.6, 0.2, -0.55],
      logic,
      'AND · OR · XOR',
    );
    block('alushift', [2.4, 0.36, 2.0], [3.4, 0.2, -0.55], logic, 'SHIFTER');
    block(
      'alumux',
      [8.3, 0.2, 0.7],
      [0.55, 0.12, 1.45],
      carry,
      'RESULT SELECT',
      [0, 1, 0.4],
    );
    block('aluresult', [3.4, 0.16, 0.7], [-0.6, 0.1, 2.85], memory, 'RESULT');
    block('aluflags', [2.4, 0.16, 0.7], [3.4, 0.1, 2.85], carry, 'FLAGS');
    return;
  }

  if (level === 'adder') {
    backdrop(root, [11.2, 7.6], '4-BIT RIPPLE-CARRY ADDER');
    // Bit 3 on the left and bit 0 on the right, the way a number is written,
    // so the carry runs right to left as it does when adding by hand.
    for (let bit = 0; bit < 4; bit++) {
      const x = 3.9 - bit * 2.6;
      block(
        'addfull',
        [2.3, 0.08, 3.6],
        [x, 0.05, 0],
        '#26303a',
        'FULL ADDER ' + bit,
        [0, 0.5, 0],
      );
      const gate = (id: string, text: string, pos: Vec3, color: string) =>
        block(id, [1.0, 0.26, 0.8], pos, color, text, [0, 1.5, 0]);
      gate('gatexor', 'XOR', [x - 0.56, 0.26, -1.1], logic);
      gate('gateand', 'AND', [x + 0.56, 0.26, -1.1], compute);
      gate('gatexor', 'XOR', [x - 0.56, 0.26, 0.02], logic);
      gate('gateand', 'AND', [x + 0.56, 0.26, 0.02], compute);
      gate('gateor', 'OR', [x, 0.26, 1.18], carry);
      for (const [operand, dx] of [
        ['A', -0.55],
        ['B', 0.55],
      ] as const)
        block(
          'addbits',
          [1.0, 0.12, 0.6],
          [x + dx, 0.08, -2.85],
          memory,
          operand + bit,
          [0, 0.7, -0.7],
        );
      block(
        'addsum',
        [1.1, 0.12, 0.6],
        [x, 0.08, 2.85],
        memory,
        'S' + bit,
        [0, 0.7, 0.7],
      );
      // The link carrying this column's carry into the next one to its left.
      block(
        'addcarry',
        [bit === 3 ? 0.36 : 0.5, 0.1, 0.18],
        [bit === 3 ? x - 1.4 : x - 1.3, 0.07, 1.18],
        carry,
        'C',
        [0, 0.6, 0.3],
      );
    }
    block(
      'addsum',
      [0.8, 0.12, 0.5],
      [-5.0, 0.08, 2.85],
      carry,
      'C OUT',
      [-0.3, 0.7, 0.7],
    );
    return;
  }

  if (level === 'gate') {
    backdrop(root, [11.2, 7.6], 'CMOS AND GATE · NAND + INVERTER');
    block(
      'cmosvcc',
      [10.3, 0.12, 0.35],
      [0, 0.07, -3.0],
      power,
      'VCC · LOGIC 1',
      [0, 0.6, -0.6],
    );
    block(
      'cmosgnd',
      [10.3, 0.12, 0.35],
      [0, 0.07, 3.0],
      ground,
      'GND · LOGIC 0',
      [0, 0.6, 0.6],
    );
    for (const [text, z] of [
      ['A', -1.0],
      ['B', 1.2],
    ] as const)
      block(
        'cmosin',
        [0.8, 0.12, 0.5],
        [-5.0, 0.08, z],
        memory,
        text,
        [-0.6, 0.7, 0],
      );
    const fet = (id: string, text: string, pos: Vec3) =>
      block(
        id,
        [1.2, 0.3, 0.85],
        pos,
        id === 'cmospmos' ? '#5a3d58' : compute,
        text,
        [pos[0] * 0.08, 1.4, pos[2] * 0.15],
      );
    // NAND: two p-channel side by side up top, two n-channel stacked below.
    fet('cmospmos', 'P · A', [-3.2, 0.17, -1.65]);
    fet('cmospmos', 'P · B', [-1.2, 0.17, -1.65]);
    fet('cmosnmos', 'N · A', [-2.2, 0.17, 0.85]);
    fet('cmosnmos', 'N · B', [-2.2, 0.17, 2.05]);
    block(
      'cmosnand',
      [4.6, 0.1, 0.25],
      [-1.6, 0.06, -0.35],
      carry,
      'NAND',
      [0, 0.8, 0],
    );
    // The inverter that turns NAND into AND.
    fet('cmospmos', 'P · INV', [2.4, 0.17, -1.65]);
    fet('cmosnmos', 'N · INV', [2.4, 0.17, 1.45]);
    block(
      'cmosout',
      [1.5, 0.12, 0.5],
      [4.5, 0.08, -0.1],
      memory,
      'OUTPUT Y',
      [0.7, 0.7, 0],
    );
    return;
  }

  // The transistor: a cut block of silicon standing on the slab, with its
  // treated regions set into the top and the gate stack built on it.
  backdrop(root, [11.2, 7.6], 'N-CHANNEL MOSFET · CROSS-SECTION');
  block(
    'fetbody',
    [8, 2.4, 2.4],
    [0, 1.2, 0],
    '#4a4f5a',
    'P-TYPE SILICON',
    [0, -0.2, 0],
  );
  // Set slightly proud of the block on every face, so the regions are not
  // drawn in the same plane as the silicon around them.
  block(
    'fetsource',
    [2.0, 0.72, 2.44],
    [-2.7, 2.06, 0],
    '#2f6d5c',
    'SOURCE N+',
    [-1.2, 0.7, 0],
  );
  block(
    'fetdrain',
    [2.0, 0.72, 2.44],
    [2.7, 2.06, 0],
    '#2f6d5c',
    'DRAIN N+',
    [1.2, 0.7, 0],
  );
  block(
    'fetchannel',
    [3.38, 0.1, 2.44],
    [0, 2.36, 0],
    '#7a6a3a',
    'CHANNEL',
    [0, 0.5, 0.9],
  );
  block(
    'fetoxide',
    [3.3, 0.12, 2.2],
    [0, 2.48, 0],
    '#9aa3ad',
    'INSULATOR',
    [0, 1.0, 0],
  );
  block(
    'fetgate',
    [3.0, 0.5, 2.0],
    [0, 2.79, 0],
    '#6f4f8a',
    'GATE',
    [0, 1.6, 0],
  );
  for (const [x, y] of [
    [-2.7, 2.72],
    [0, 3.34],
    [2.7, 2.72],
  ] as const)
    block('fetcontact', [0.5, 0.6, 0.5], [x, y, 0], '#b9a27a', 'METAL', [
      x * 0.1,
      2.2,
      0,
    ]);
}
