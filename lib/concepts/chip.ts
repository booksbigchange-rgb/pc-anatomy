import { concept, type Concept, type Entry } from '../concept.ts';
import type { SourceId } from '../sources.ts';

/**
 * Inside the chip: five logical scales below one Zen 5 core.
 *
 * The core scale follows AMD's Zen 5 optimization guide. Below it the
 * drawings are teaching models: AMD publishes nothing about the circuits
 * inside an ALU pipe, so the ALU, adder, gate and transistor show how such
 * things are built in general, each citing a Texas Instruments document for
 * the behaviour it describes. Every accuracy note says which is which.
 *
 * Ids are prefixed by scale — `z5` for the core, `alu`, `add`, `gate`/`cmos`,
 * `fet` — so nothing here can collide with the GPU catalogues' bare names.
 */

const core =
  'Documented Zen 5 organisation from AMD’s optimization guide: the counts and sizes are AMD’s. Block size and placement are illustrative; this is not a floorplan of the core.';
const teachingAlu =
  'A teaching model of an integer ALU, organised the way textbooks and TI’s SN74LS181 ALU chip describe one. AMD does not publish the circuits inside a Zen 5 ALU pipe, so this is not AMD’s design.';
const teachingAdder =
  'A teaching model: a 4-bit ripple-carry adder built from full adders. Real processors, and even TI’s 74HC283 chip, add faster with look-ahead carry; block sizes are illustrative.';
const teachingGate =
  'Standard CMOS teaching circuit. That p-channel transistors connect the output to the supply and n-channel ones to ground, with one side always off, is from TI’s CMOS note; the series and parallel arrangement of the NAND half is the textbook design, not a published schematic of any product.';
const crossSection =
  'Illustrative cross-section of a planar n-channel MOSFET, after the structure in TI’s CMOS note. Not to scale, and not the shape of any particular product’s transistors.';

const part = (
  physicalAccuracy: string,
  e: Omit<Entry, 'representationType' | 'physicalAccuracy'> & {
    sources: SourceId[];
  },
) => concept({ ...e, physicalAccuracy, representationType: 'logical' });

export const chipConcepts: Concept[] = [
  // ── One Zen 5 core ────────────────────────────────────────────────────────
  part(core, {
    id: 'z5fetch',
    name: 'Fetch and branch prediction',
    shortName: 'Fetch',
    category: 'Compute',
    parent: 'zencore',
    level: 'zen5core',
    description:
      'The start of the core: it reads instructions from the instruction cache and predicts which way each branch will go.',
    purpose:
      'Keeps the rest of the core fed. By guessing where a program goes next, it can fetch the next instructions before they are needed.',
    quantity: '1 front end per core',
    specifications: {
      Fetch: '32-byte instruction cache fetch',
      Prediction: 'Advanced dynamic branch prediction',
    },
    sources: ['zen5'],
    searchTerms: ['fetch', 'branch predictor', 'front end'],
  }),
  part(core, {
    id: 'z5l1i',
    name: 'L1 instruction cache',
    shortName: 'L1 instructions',
    category: 'Memory',
    parent: 'zencore',
    level: 'zen5core',
    description:
      'A small, very fast store of the instructions the core is about to run.',
    purpose:
      'Holds program instructions right next to the fetch unit, so the core rarely waits for them to arrive from further away.',
    quantity: '1 per core',
    specifications: { Size: '32 KB', Associativity: '8-way' },
    sources: ['zen5'],
    searchTerms: ['instruction cache', 'icache', 'l1'],
  }),
  part(core, {
    id: 'z5decode',
    name: 'Decode and op cache',
    shortName: 'Decode',
    category: 'Compute',
    parent: 'zencore',
    level: 'zen5core',
    description:
      'Turns x86 instructions into the simpler operations the core executes, and keeps recently decoded operations in an op cache.',
    purpose:
      'Translates programs into steps the execution units understand. Operations found in the op cache skip decoding altogether, which is faster.',
    quantity: '1 per core',
    specifications: {
      'x86 decode': '4-way',
      'Op cache': 'Previously decoded instructions',
      Dispatch: 'Up to 8 macro-ops per cycle',
    },
    sources: ['zen5'],
    searchTerms: ['decoder', 'op cache', 'dispatch', 'uop'],
  }),
  part(core, {
    id: 'z5schedule',
    name: 'Schedulers',
    shortName: 'Schedulers',
    category: 'Compute',
    parent: 'zencore',
    level: 'zen5core',
    description:
      'Queues that hold operations until their inputs are ready, then send them to an execution pipe, not necessarily in program order.',
    purpose:
      'Lets the core work on whatever is ready instead of waiting in line. This out-of-order execution keeps many pipes busy at once.',
    quantity: 'Integer, address and floating-point schedulers',
    specifications: {
      Issue: 'Up to 16 micro-ops per cycle',
      Execution: 'Out of order and speculative',
    },
    sources: ['zen5'],
    searchTerms: ['scheduler', 'out of order', 'issue'],
  }),
  part(core, {
    id: 'z5alu',
    name: 'Integer ALU pipes',
    shortName: 'ALU',
    category: 'Compute',
    parent: 'zencore',
    level: 'zen5core',
    open: 'alu',
    description:
      'The pipelines that do whole-number work: adding, subtracting, comparing and logic.',
    purpose:
      'This is where a program’s everyday arithmetic actually happens. Six of them let the core do up to six of these operations at the same time.',
    quantity: '6 per core',
    specifications: { Pipes: '6', Work: 'Integer arithmetic and logic' },
    sources: ['zen5'],
    searchTerms: ['alu', 'arithmetic logic unit', 'integer', 'execution'],
  }),
  part(core, {
    id: 'z5agu',
    name: 'Address generation pipes',
    shortName: 'AGU',
    category: 'Compute',
    parent: 'zencore',
    level: 'zen5core',
    description:
      'Pipelines that work out the memory address each load or store needs.',
    purpose:
      'Finds where in memory a piece of data lives, so the core can read it or write it.',
    quantity: '4 per core',
    specifications: { Pipes: '4', Work: 'Load and store addresses' },
    sources: ['zen5'],
    searchTerms: ['agu', 'address generation', 'load', 'store'],
  }),
  part(core, {
    id: 'z5fpu',
    name: 'Floating-point and vector unit',
    shortName: 'Floating point',
    category: 'Compute',
    parent: 'zencore',
    level: 'zen5core',
    description:
      'Pipelines for numbers with decimal points and for vector work, where one instruction acts on many numbers at once.',
    purpose:
      'Handles the maths behind graphics, physics, audio and AI, where the same calculation is repeated across lots of numbers.',
    quantity: '1 unit per core',
    specifications: {
      Width: '512-bit',
      Pipes: '6 FPU pipes',
    },
    sources: ['zen5'],
    searchTerms: ['fpu', 'floating point', 'vector', 'avx-512', 'simd'],
  }),
  part(core, {
    id: 'z5l1d',
    name: 'L1 data cache',
    shortName: 'L1 data',
    category: 'Memory',
    parent: 'zencore',
    level: 'zen5core',
    description:
      'A small, very fast store of the data the core is reading and writing right now.',
    purpose:
      'Most loads find their data here, without having to go out to the larger caches or to RAM.',
    quantity: '1 per core',
    specifications: { Size: '48 KB', Associativity: '12-way' },
    sources: ['zen5'],
    searchTerms: ['data cache', 'dcache', 'l1'],
  }),
  part(core, {
    id: 'z5l2',
    name: 'L2 cache',
    shortName: 'L2',
    category: 'Memory',
    parent: 'zencore',
    level: 'zen5core',
    description:
      'A larger private cache behind both L1 caches, holding instructions and data for this core alone.',
    purpose:
      'Catches what does not fit in L1, so the core still avoids the much slower trip to the shared L3 or to RAM.',
    quantity: '1 per core',
    specifications: { Size: '1 MB', Shared: 'No, one per core' },
    sources: ['zen5'],
    searchTerms: ['l2', 'cache'],
  }),

  // ── An ALU ───────────────────────────────────────────────────────────────
  part(teachingAlu, {
    id: 'aluinput',
    name: 'Operands',
    shortName: 'Operand',
    category: 'Memory',
    parent: 'z5alu',
    level: 'alu',
    description: 'The two numbers the ALU works on, A and B.',
    purpose:
      'Every ALU operation takes two inputs and makes one result: A plus B, A AND B, and so on.',
    quantity: '2 inputs, A and B',
    specifications: { Inputs: 'A and B' },
    sources: ['ls181'],
    searchTerms: ['operand', 'input'],
  }),
  part(teachingAlu, {
    id: 'aluop',
    name: 'Operation select',
    shortName: 'Operation',
    category: 'Compute',
    parent: 'z5alu',
    level: 'alu',
    description:
      'A few control bits that choose which job the ALU does this time.',
    purpose:
      'The same hardware can add one moment and compare the next. These bits, set by the instruction being run, decide which.',
    quantity: '1 control input',
    specifications: { Chooses: 'Arithmetic or logic operation' },
    sources: ['ls181'],
    searchTerms: ['opcode', 'select', 'control'],
  }),
  part(teachingAlu, {
    id: 'aluadder',
    name: 'Adder',
    shortName: 'Adder',
    category: 'Compute',
    parent: 'z5alu',
    level: 'alu',
    open: 'adder',
    description:
      'The circuit that adds two binary numbers. Subtraction and comparison use it too.',
    purpose:
      'Adding is the most common thing a processor does, from counting loop steps to working out memory addresses.',
    quantity: '1 per ALU',
    specifications: { Work: 'Binary addition with carry' },
    sources: ['hc283', 'ls181'],
    searchTerms: ['adder', 'addition', 'add', 'sum'],
  }),
  part(teachingAlu, {
    id: 'alulogic',
    name: 'Logic unit',
    shortName: 'Logic',
    category: 'Compute',
    parent: 'z5alu',
    level: 'alu',
    description:
      'Applies AND, OR and XOR to each pair of bits in A and B, all at once.',
    purpose:
      'Lets programs test, combine and switch individual bits, which is how flags, masks and many tricks in code work.',
    quantity: '1 per ALU',
    specifications: { Operations: 'AND · OR · XOR' },
    sources: ['hc08', 'ls181'],
    searchTerms: ['logic', 'and', 'or', 'xor', 'bitwise'],
  }),
  part(teachingAlu, {
    id: 'alushift',
    name: 'Shifter',
    shortName: 'Shifter',
    category: 'Compute',
    parent: 'z5alu',
    level: 'alu',
    description: 'Moves all the bits of a number left or right.',
    purpose:
      'Shifting a binary number one place left doubles it, the way adding a zero multiplies by ten in decimal. It is a fast way to multiply and divide by two.',
    quantity: '1 per ALU',
    specifications: { Moves: 'Bits left or right' },
    sources: ['zen5'],
    searchTerms: ['shift', 'shifter', 'rotate'],
  }),
  part(teachingAlu, {
    id: 'alumux',
    name: 'Result select',
    shortName: 'Result select',
    category: 'Compute',
    parent: 'z5alu',
    level: 'alu',
    description:
      'A switch that picks which unit’s answer leaves the ALU: the adder, the logic unit or the shifter.',
    purpose:
      'All three units work on every input, and the operation select decides which answer is kept.',
    quantity: '1 per ALU',
    specifications: { Kind: 'Multiplexer' },
    sources: ['ls181'],
    searchTerms: ['multiplexer', 'mux', 'select'],
  }),
  part(teachingAlu, {
    id: 'aluflags',
    name: 'Flags',
    shortName: 'Flags',
    category: 'Compute',
    parent: 'z5alu',
    level: 'alu',
    description:
      'Single bits that record facts about the result: was it zero, was it negative, did the addition carry out of the top bit?',
    purpose:
      'Programs make decisions with these. An "if" in code is usually a comparison that sets a flag, then a branch that reads it.',
    quantity: '1 set per ALU',
    specifications: { Examples: 'Zero · negative · carry' },
    sources: ['hc283'],
    searchTerms: ['flags', 'carry', 'zero flag', 'status'],
  }),
  part(teachingAlu, {
    id: 'aluresult',
    name: 'Result',
    shortName: 'Result',
    category: 'Memory',
    parent: 'z5alu',
    level: 'alu',
    description: 'The answer, on its way back to a register.',
    purpose:
      'Becomes the input to a later instruction. Chains of these results are how a program gets work done.',
    quantity: '1 output',
    specifications: { Output: 'One number' },
    sources: ['ls181'],
    searchTerms: ['result', 'output'],
  }),

  // ── A 4-bit adder ────────────────────────────────────────────────────────
  part(teachingAdder, {
    id: 'addbits',
    name: 'Input bits',
    shortName: 'Input bits',
    category: 'Memory',
    parent: 'aluadder',
    level: 'adder',
    description:
      'The two 4-bit numbers being added, one bit of each going to every full adder.',
    purpose:
      'Binary numbers are added one column at a time, just like adding by hand, so each column gets its own pair of bits.',
    quantity: '2 numbers × 4 bits',
    specifications: { Width: '4 bits each' },
    sources: ['hc283'],
    searchTerms: ['bits', 'binary', 'input'],
  }),
  part(teachingAdder, {
    id: 'addfull',
    name: 'Full adder',
    shortName: 'Full adder',
    category: 'Compute',
    parent: 'aluadder',
    level: 'adder',
    description:
      'Adds one column: a bit of A, a bit of B and the carry from the column before. It makes a sum bit and a carry for the next column.',
    purpose:
      'Line up enough of these and you can add numbers of any length. A 64-bit adder needs 64 columns.',
    quantity: '4 in this adder',
    specifications: { Inputs: 'A · B · carry in', Outputs: 'Sum · carry out' },
    sources: ['hc283'],
    searchTerms: ['full adder', 'column'],
  }),
  part(teachingAdder, {
    id: 'gatexor',
    name: 'XOR gate',
    shortName: 'XOR',
    category: 'Compute',
    parent: 'aluadder',
    level: 'adder',
    description:
      'Outputs 1 when exactly one of its two inputs is 1, and 0 otherwise.',
    purpose:
      'In binary, 0 + 1 and 1 + 0 make 1 but 1 + 1 makes 0 with a carry. That is exactly XOR, so two of them make each sum bit.',
    quantity: '2 per full adder · 8 in all',
    specifications: { Rule: '1 when the inputs differ' },
    sources: ['hc283'],
    searchTerms: ['xor', 'exclusive or', 'gate'],
  }),
  part(teachingAdder, {
    id: 'gateand',
    name: 'AND gate',
    shortName: 'AND',
    category: 'Compute',
    parent: 'aluadder',
    level: 'adder',
    open: 'gate',
    description: 'Outputs 1 only when both of its inputs are 1.',
    purpose:
      'In a full adder, AND gates spot when a column needs to carry: 1 + 1 always does.',
    quantity: '2 per full adder · 8 in all',
    specifications: { Rule: 'Y = A · B' },
    sources: ['hc08', 'hc283'],
    searchTerms: ['and', 'gate'],
  }),
  part(teachingAdder, {
    id: 'gateor',
    name: 'OR gate',
    shortName: 'OR',
    category: 'Compute',
    parent: 'aluadder',
    level: 'adder',
    description: 'Outputs 1 when either input is 1, or both.',
    purpose:
      'Combines the two ways a column can produce a carry into one carry-out signal.',
    quantity: '1 per full adder · 4 in all',
    specifications: { Rule: '1 when any input is 1' },
    sources: ['hc283'],
    searchTerms: ['or', 'gate'],
  }),
  part(teachingAdder, {
    id: 'addcarry',
    name: 'Carry chain',
    shortName: 'Carry',
    category: 'Compute',
    parent: 'aluadder',
    level: 'adder',
    description:
      'The links that pass each column’s carry to the next column, like carrying the 1 when adding by hand.',
    purpose:
      'In this simple design the carry ripples from column to column, which gets slow for long numbers. Real chips work the carries out ahead of time instead (look-ahead carry).',
    quantity: '4 links, including the carry out',
    specifications: {
      Shown: 'Ripple carry',
      'In the 74HC283': 'Full internal look-ahead',
    },
    sources: ['hc283'],
    searchTerms: ['carry', 'ripple', 'lookahead'],
  }),
  part(teachingAdder, {
    id: 'addsum',
    name: 'Sum bits',
    shortName: 'Sum',
    category: 'Memory',
    parent: 'aluadder',
    level: 'adder',
    description:
      'The 4-bit answer, plus the final carry out of the top column.',
    purpose:
      'If the carry out is 1, the answer was too big for 4 bits. The ALU records that in a flag.',
    quantity: '4 sum bits and 1 carry out',
    specifications: { Width: '4 bits + carry' },
    sources: ['hc283'],
    searchTerms: ['sum', 'output', 'carry out'],
  }),

  // ── A CMOS AND gate ──────────────────────────────────────────────────────
  part(teachingGate, {
    id: 'cmosvcc',
    name: 'Power rail (VCC)',
    shortName: 'VCC',
    category: 'Power',
    parent: 'gateand',
    level: 'gate',
    description: 'The supply voltage: the wire that means "1".',
    purpose:
      'When a path of switched-on transistors connects the output to this rail, the output reads as 1.',
    quantity: '1 rail',
    specifications: { Meaning: 'Logic 1' },
    sources: ['cmospower'],
    searchTerms: ['vcc', 'vdd', 'power', 'supply'],
  }),
  part(teachingGate, {
    id: 'cmosgnd',
    name: 'Ground rail (GND)',
    shortName: 'GND',
    category: 'Power',
    parent: 'gateand',
    level: 'gate',
    description: 'Zero volts: the wire that means "0".',
    purpose:
      'When a path of switched-on transistors connects the output to ground, the output reads as 0.',
    quantity: '1 rail',
    specifications: { Meaning: 'Logic 0' },
    sources: ['cmospower'],
    searchTerms: ['ground', 'gnd'],
  }),
  part(teachingGate, {
    id: 'cmosin',
    name: 'Inputs A and B',
    shortName: 'Input',
    category: 'Compute',
    parent: 'gateand',
    level: 'gate',
    description:
      'The two input wires. Each one goes to the gate terminal of a p-channel and an n-channel transistor.',
    purpose:
      'An input never connects to the output directly. It only switches transistors on and off, and almost no current flows into it.',
    quantity: '2 inputs',
    specifications: { Inputs: 'A · B' },
    sources: ['cmospower', 'hc08'],
    searchTerms: ['input', 'gate input'],
  }),
  part(teachingGate, {
    id: 'cmospmos',
    name: 'p-channel transistors',
    shortName: 'p-channel',
    category: 'Compute',
    parent: 'gateand',
    level: 'gate',
    description:
      'Switches between the output and the power rail. A p-channel transistor is ON when its input is 0.',
    purpose:
      'They pull the output up to 1. In the NAND half, two sit side by side, so either input being 0 is enough.',
    quantity: '3 in this gate',
    specifications: {
      'On when': 'Input is 0',
      'Connects to': 'Power rail',
    },
    sources: ['cmospower'],
    searchTerms: ['pmos', 'p-channel', 'transistor', 'pull up'],
  }),
  part(teachingGate, {
    id: 'cmosnmos',
    name: 'n-channel transistors',
    shortName: 'n-channel',
    category: 'Compute',
    parent: 'gateand',
    level: 'gate',
    open: 'transistor',
    description:
      'Switches between the output and ground. An n-channel transistor is ON when its input is 1.',
    purpose:
      'They pull the output down to 0. In the NAND half, two sit one above the other, so both inputs must be 1 to connect.',
    quantity: '3 in this gate',
    specifications: {
      'On when': 'Input is 1',
      'Connects to': 'Ground',
    },
    sources: ['cmospower'],
    searchTerms: ['nmos', 'n-channel', 'transistor', 'pull down', 'mosfet'],
  }),
  part(teachingGate, {
    id: 'cmosnand',
    name: 'NAND output',
    shortName: 'NAND',
    category: 'Compute',
    parent: 'gateand',
    level: 'gate',
    description:
      'The wire between the two halves. The first four transistors make it a NAND gate: 0 only when both inputs are 1.',
    purpose:
      'NAND is the natural gate for CMOS. An AND gate is a NAND followed by an inverter that flips its answer.',
    quantity: '1 internal wire',
    specifications: { Rule: 'NOT (A · B)' },
    sources: ['cmospower'],
    searchTerms: ['nand', 'node'],
  }),
  part(teachingGate, {
    id: 'cmosout',
    name: 'AND output',
    shortName: 'Output',
    category: 'Compute',
    parent: 'gateand',
    level: 'gate',
    description:
      'The output of the last two transistors, an inverter that flips the NAND answer. The result is AND.',
    purpose:
      'This is Y = A · B from the datasheet: 1 only when both A and B are 1.',
    quantity: '1 output',
    specifications: { Rule: 'Y = A · B' },
    sources: ['hc08', 'cmospower'],
    searchTerms: ['output', 'inverter', 'and'],
  }),

  // ── One n-channel transistor ─────────────────────────────────────────────
  part(crossSection, {
    id: 'fetbody',
    name: 'P-type silicon',
    shortName: 'Silicon',
    category: 'Board',
    parent: 'cmosnmos',
    level: 'transistor',
    description:
      'The silicon the transistor is built into, labelled P-substrate in TI’s drawing.',
    purpose:
      'Every transistor on the chip sits in the same slice of silicon. Its regions are made by treating small areas of it differently.',
    quantity: '1 substrate',
    specifications: { Type: 'P-type' },
    sources: ['cmospower'],
    searchTerms: ['substrate', 'silicon', 'p-type'],
  }),
  part(crossSection, {
    id: 'fetsource',
    name: 'Source',
    shortName: 'Source',
    category: 'Compute',
    parent: 'cmosnmos',
    level: 'transistor',
    description:
      'One end of the switch: a region of silicon treated so it conducts easily, marked N+.',
    purpose:
      'Current enters or leaves the transistor here. It is wired to ground in the gate above.',
    quantity: '1',
    specifications: { Type: 'N+ region' },
    sources: ['cmospower'],
    searchTerms: ['source', 'n+'],
  }),
  part(crossSection, {
    id: 'fetdrain',
    name: 'Drain',
    shortName: 'Drain',
    category: 'Compute',
    parent: 'cmosnmos',
    level: 'transistor',
    description: 'The other end of the switch, also an N+ region.',
    purpose:
      'When the switch is on, current flows between drain and source. It is wired towards the gate’s output.',
    quantity: '1',
    specifications: { Type: 'N+ region' },
    sources: ['cmospower'],
    searchTerms: ['drain', 'n+'],
  }),
  part(crossSection, {
    id: 'fetchannel',
    name: 'Channel',
    shortName: 'Channel',
    category: 'Compute',
    parent: 'cmosnmos',
    level: 'transistor',
    description:
      'The strip of silicon between source and drain, under the gate.',
    purpose:
      'With a 1 on the gate, this strip conducts and the switch is on. With a 0, it does not, and the switch is off.',
    quantity: '1',
    specifications: { 'On when': 'Gate is 1' },
    sources: ['cmospower'],
    searchTerms: ['channel'],
  }),
  part(crossSection, {
    id: 'fetoxide',
    name: 'Gate insulator',
    shortName: 'Insulator',
    category: 'Board',
    parent: 'cmosnmos',
    level: 'transistor',
    description:
      'A very thin insulating layer between the gate and the channel.',
    purpose:
      'Keeps the gate electrically separate from the silicon, which is why no current flows into the gate.',
    quantity: '1 layer',
    specifications: { Kind: 'Insulator' },
    sources: ['cmospower'],
    searchTerms: ['oxide', 'insulator', 'dielectric'],
  }),
  part(crossSection, {
    id: 'fetgate',
    name: 'Gate',
    shortName: 'Gate',
    category: 'Compute',
    parent: 'cmosnmos',
    level: 'transistor',
    description: 'The control terminal, sitting on top of the insulator.',
    purpose:
      'Its voltage alone decides whether the switch is on or off. The input wires of a logic gate connect here.',
    quantity: '1',
    specifications: { Current: 'None flows in' },
    sources: ['cmospower'],
    searchTerms: ['gate terminal', 'control'],
  }),
  part(crossSection, {
    id: 'fetcontact',
    name: 'Metal contacts',
    shortName: 'Contact',
    category: 'Board',
    parent: 'cmosnmos',
    level: 'transistor',
    description:
      'Metal connections from the source, drain and gate up to the wiring layers above.',
    purpose:
      'Join this transistor to the others. Wiring layers above the silicon connect billions of transistors into gates, adders and cores.',
    quantity: '3: source, drain and gate',
    specifications: { Terminals: 'Source · gate · drain' },
    sources: ['cmospower'],
    searchTerms: ['contact', 'metal', 'wiring'],
  }),
];
