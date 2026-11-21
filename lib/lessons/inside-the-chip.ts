import type { Course } from './types.ts';

/**
 * The second course: from one processor core down to a single transistor.
 *
 * Same house style as the first course. The core lesson uses AMD's figures;
 * from the ALU down the scales are teaching models, and the lessons say so
 * the first time it matters rather than on every step.
 */
export const insideTheChip: Course = {
  id: 'inside-the-chip',
  title: 'Inside the chip',
  summary:
    'Five short lessons that zoom from one processor core down to a single transistor, and show how switches add up to maths.',
  audience: 'High school · best after How a computer works',
  lessons: [
    {
      id: 'inside-a-core',
      title: 'Inside a core',
      summary:
        'How one core fetches, decodes and runs instructions, out of order.',
      minutes: 7,
      steps: [
        {
          title: 'Zooming in',
          body: [
            'The Ryzen processor in the first course has 16 cores. This diagram is one of them. It shows how the core is organised, not what it looks like under a microscope.',
            'A core works like a production line. Instructions come in at the top, are prepared in the middle, and are carried out lower down.',
          ],
          scene: { level: 'zen5core' },
        },
        {
          title: 'Fetch',
          body: [
            'A program is a long list of instructions. Fetch reads the next ones from the L1 instruction cache, a 32 KB store right beside it.',
            'It also guesses which way the program will go at each branch, like an “if”, so it can fetch ahead instead of waiting to find out.',
          ],
          scene: { level: 'zen5core', part: 'z5fetch' },
          sources: ['zen5'],
        },
        {
          title: 'Decode',
          body: [
            'The instructions programs are written in, called x86, are complicated. Decode breaks them into simpler operations and sends up to 8 of them onwards every tick.',
            'Operations decoded recently are kept in an op cache, so the next time they are needed they skip decoding altogether.',
          ],
          scene: { level: 'zen5core', part: 'z5decode' },
          sources: ['zen5'],
        },
        {
          title: 'Out of order',
          body: [
            'The schedulers hold operations until their inputs are ready, then send them to be carried out, and not always in program order.',
            'If one instruction is waiting for data, others that are ready go first. Up to 16 operations can be sent off in a single tick.',
          ],
          scene: { level: 'zen5core', part: 'z5schedule' },
          sources: ['zen5'],
        },
        {
          title: 'Doing the work',
          body: [
            'Six ALUs (arithmetic logic units) do whole-number maths. Four AGUs work out the memory addresses data is read from and written to.',
            'The floating-point unit handles numbers with decimal points, and vector work where one instruction acts on many numbers at once, up to 512 bits wide.',
          ],
          scene: { level: 'zen5core', part: 'z5alu', focus: true },
          sources: ['zen5'],
        },
        {
          title: 'Caches',
          body: [
            'Data the core is working on sits in the 48 KB L1 data cache. Behind it, the 1 MB L2 cache holds what does not fit.',
            'Both belong to this one core. The bigger L3 cache from the first course is shared with the seven other cores on the same die.',
          ],
          scene: { level: 'zen5core', part: 'z5l1d' },
          sources: ['zen5', 'ryzen'],
        },
        {
          title: 'Check: find an ALU',
          body: ['Back to the whole core.'],
          scene: { level: 'zen5core' },
          check: {
            kind: 'find',
            prompt: 'Click one of the ALUs.',
            answers: ['z5alu'],
            hint: 'There are six of them side by side in the middle row, labelled ALU 1 to ALU 6.',
          },
        },
        {
          title: 'Check: out of order',
          body: ['One question to finish.'],
          scene: { level: 'zen5core' },
          check: {
            kind: 'choice',
            prompt:
              'The next instruction in a program is still waiting for its data. What do the schedulers do?',
            options: [
              'Stop the whole core until the data arrives',
              'Send other instructions that are already ready',
              'Skip that instruction for good',
            ],
            answer: 1,
            explain:
              'Right. Working on whatever is ready keeps the execution pipes busy. The waiting instruction runs as soon as its data arrives.',
          },
        },
      ],
    },
    {
      id: 'the-alu',
      title: 'The ALU',
      summary:
        'The calculator inside every core: adding, logic, shifting and flags.',
      minutes: 6,
      steps: [
        {
          title: 'A calculator for whole numbers',
          body: [
            'An ALU, or arithmetic logic unit, does maths on whole numbers. This is a teaching model: AMD does not publish what is inside its ALUs, so this shows the parts an ALU is generally built from.',
            'Chip makers have even sold ALUs as chips of their own, such as Texas Instruments’ SN74LS181.',
          ],
          scene: { level: 'alu' },
          sources: ['ls181'],
        },
        {
          title: 'Two numbers and a job',
          body: [
            'Two numbers come in, called A and B. A few control bits, set by the instruction being run, choose the job: add, subtract, AND, compare and so on.',
          ],
          scene: { level: 'alu', part: 'aluop' },
        },
        {
          title: 'Everyone works, one answer wins',
          body: [
            'The adder, the logic unit and the shifter all work on A and B at the same time.',
            'The result select then keeps only the answer the operation asked for.',
          ],
          scene: { level: 'alu', part: 'alumux' },
        },
        {
          title: 'Logic, bit by bit',
          body: [
            'The logic unit compares A and B one bit at a time. AND gives 1 only where both bits are 1.',
            'So 1100 AND 1010 gives 1000: only the leftmost bit is 1 in both numbers.',
          ],
          scene: { level: 'alu', part: 'alulogic' },
        },
        {
          title: 'Shifting',
          body: [
            'The shifter slides every bit one or more places left or right.',
            'Shifting a binary number one place left doubles it, the way adding a 0 on the end multiplies by ten in decimal. So 0011 (three) becomes 0110 (six).',
          ],
          scene: { level: 'alu', part: 'alushift' },
        },
        {
          title: 'Flags',
          body: [
            'Flags are single bits that record facts about the result: was it zero, was it negative, did it carry out of the top bit?',
            'This is how computers make decisions. An “if” in a program is usually a comparison that sets a flag, then a branch that reads it.',
          ],
          scene: { level: 'alu', part: 'aluflags' },
        },
        {
          title: 'Check: shifting',
          body: ['Try one.'],
          scene: { level: 'alu' },
          check: {
            kind: 'choice',
            prompt: 'Shift 0101 (five) one place to the left. What do you get?',
            options: ['1010 (ten)', '0010 (two)', '0101 (five)'],
            answer: 0,
            explain:
              'Right. Every bit moves one place left and a 0 fills in on the right, which doubles the number.',
          },
        },
        {
          title: 'Check: find the adder',
          body: ['The adder is where the next lesson goes.'],
          scene: { level: 'alu' },
          check: {
            kind: 'find',
            prompt: 'Click the adder.',
            answers: ['aluadder'],
            hint: 'It is the block on the left of the middle row, next to the logic unit.',
          },
        },
      ],
    },
    {
      id: 'adding-in-binary',
      title: 'Adding in binary',
      summary:
        'Binary numbers, and how a few logic gates add them one column at a time.',
      minutes: 7,
      steps: [
        {
          title: 'Only 0 and 1',
          body: [
            'Computers count in binary, using only 0 and 1. Each place is worth double the one to its right: 8, 4, 2, 1.',
            'So 0110 means 4 + 2, which is six. Every number inside a computer is stored this way.',
          ],
          scene: { level: 'adder' },
        },
        {
          title: 'One column at a time',
          body: [
            'Binary adds like adding by hand, column by column from the right. 0 + 0 = 0 and 0 + 1 = 1. But 1 + 1 = 10: write 0 and carry 1.',
            'Each full adder handles one column. It takes a bit of A, a bit of B and the carry from the column before.',
          ],
          scene: { level: 'adder', part: 'addfull' },
        },
        {
          title: 'The sum: XOR',
          body: [
            'A column’s sum bit is 1 when exactly one of its two inputs is 1. That rule is called XOR, short for exclusive or.',
            'With the carry coming in as a third input, each full adder uses two XOR gates to get its sum bit.',
          ],
          scene: { level: 'adder', part: 'gatexor' },
        },
        {
          title: 'The carry: AND and OR',
          body: [
            'A column needs to carry when both bits are 1. Spotting “both are 1” is the job of an AND gate.',
            'A carry can also happen when one bit and the carry in are both 1. A second AND spots that, and an OR gate combines the two into the carry out.',
          ],
          scene: { level: 'adder', part: 'gateand' },
        },
        {
          title: 'The carry chain',
          body: [
            'Each carry passes to the column on its left. In this simple design it ripples along one column after another.',
            'That gets slow for 64-bit numbers, so real chips work the carries out ahead of time. Even the small TI 74HC283 adder chip does this, using what is called look-ahead carry.',
          ],
          scene: { level: 'adder', part: 'addcarry' },
          sources: ['hc283'],
        },
        {
          title: 'Check: add two numbers',
          body: ['Use the column rules: 1 + 1 = 10, write 0 and carry 1.'],
          scene: { level: 'adder' },
          check: {
            kind: 'choice',
            prompt: 'What is 0011 + 0001 in binary?',
            options: ['0100', '0012', '0010'],
            answer: 0,
            explain:
              'Right. That is 3 + 1 = 4. The carry ripples through the two right-hand columns into the 4s place.',
          },
        },
        {
          title: 'Check: find an AND gate',
          body: ['The AND gate is where the next lesson goes.'],
          scene: { level: 'adder' },
          check: {
            kind: 'find',
            prompt: 'Click any AND gate.',
            answers: ['gateand'],
            hint: 'Each full adder has two, labelled AND, to the right of its XOR gates.',
          },
        },
      ],
    },
    {
      id: 'gates-from-switches',
      title: 'Gates from switches',
      summary: 'How six transistors between power and ground make an AND gate.',
      minutes: 7,
      steps: [
        {
          title: 'Switches between two wires',
          body: [
            'Every logic gate is built from transistors, which are tiny electrical switches. This AND gate uses six.',
            'They sit between two wires: the power rail, which means 1, and ground, which means 0. The output reads whichever one the switched-on transistors connect it to.',
          ],
          scene: { level: 'gate' },
        },
        {
          title: 'Two kinds of switch',
          body: [
            'An n-channel transistor is ON when its input is 1, and connects towards ground. A p-channel transistor is ON when its input is 0, and connects towards power.',
            'Each input drives one of each kind. So whenever one of the pair is on, the other is off.',
          ],
          scene: { level: 'gate', part: 'cmosnmos' },
        },
        {
          title: 'First, a NAND gate',
          body: [
            'The two n-channel transistors on the left are stacked, so only when A and B are both 1 do they connect the middle wire to ground, making it 0.',
            'If either input is 0, its p-channel transistor connects the wire to power instead, making it 1. That rule, “0 only when both are 1”, is called NAND.',
          ],
          scene: { level: 'gate', part: 'cmosnand' },
        },
        {
          title: 'Then flip it',
          body: [
            'The last two transistors form an inverter: they flip 1 to 0 and 0 to 1.',
            'Flipping NAND gives AND: the output is 1 only when both A and B are 1. That is the rule in the datasheet of a real AND gate chip, written Y = A · B.',
          ],
          scene: { level: 'gate', part: 'cmosout' },
          sources: ['hc08'],
        },
        {
          title: 'Why this saves power',
          body: [
            'Because one switch of each pair is always off, there is almost never a path straight from power to ground. While nothing changes, the gate uses almost no power.',
            'This design is called CMOS. Most of the power a CMOS chip uses goes on switching, not on sitting still.',
          ],
          scene: { level: 'gate', part: 'cmosvcc' },
          sources: ['cmospower'],
        },
        {
          title: 'Check: AND',
          body: ['Work it out from the rule.'],
          scene: { level: 'gate' },
          check: {
            kind: 'choice',
            prompt: 'In this AND gate, A is 1 and B is 0. What is the output?',
            options: ['1', '0'],
            answer: 1,
            explain:
              'Right. AND needs both inputs to be 1. With B at 0, the NAND wire is 1 and the inverter flips it to 0.',
          },
        },
        {
          title: 'Check: find an n-channel transistor',
          body: ['The n-channel transistor is where the last lesson goes.'],
          scene: { level: 'gate' },
          check: {
            kind: 'find',
            prompt: 'Click any n-channel transistor.',
            answers: ['cmosnmos'],
            hint: 'They are marked N and sit between the middle wire and ground, in the lower half.',
          },
        },
      ],
    },
    {
      id: 'the-transistor',
      title: 'The transistor',
      summary:
        'One switch, cut open: silicon, source, drain, gate and channel.',
      minutes: 6,
      steps: [
        {
          title: 'One switch, cut open',
          body: [
            'This is one n-channel transistor, cut in half so you can see its layers. It is drawn far larger than life and not to scale.',
          ],
          scene: { level: 'transistor' },
        },
        {
          title: 'Silicon',
          body: [
            'The transistor is built into silicon, the same slice every other transistor on the chip shares.',
            'Its parts are made by treating small areas of the silicon differently, so they carry electricity in different ways.',
          ],
          scene: { level: 'transistor', part: 'fetbody' },
        },
        {
          title: 'Source and drain',
          body: [
            'The two regions marked N+ are the source and the drain, the two ends of the switch. They are treated so electricity flows through them easily.',
          ],
          scene: { level: 'transistor', part: 'fetsource' },
        },
        {
          title: 'The gate',
          body: [
            'On top sits the gate, the control. A very thin insulating layer keeps it separate from the silicon, so no current flows into the gate at all.',
            'Only its voltage matters: 1 or 0.',
          ],
          scene: { level: 'transistor', part: 'fetgate' },
          sources: ['cmospower'],
        },
        {
          title: 'The channel',
          body: [
            'Between source and drain, under the gate, is the channel. With a 1 on the gate, the channel conducts and the switch is on. With a 0, it does not, and the switch is off.',
          ],
          scene: { level: 'transistor', part: 'fetchannel' },
        },
        {
          title: 'Billions of them',
          body: [
            'Metal contacts join the transistor to layers of wiring above the silicon.',
            'The graphics chip from the first course has 92.2 billion transistors. Wired together they make gates, gates make adders, adders make ALUs, and ALUs sit inside cores.',
          ],
          scene: { level: 'transistor', part: 'fetcontact' },
          sources: ['whitepaper'],
        },
        {
          title: 'Check: on or off?',
          body: ['One question about the switch.'],
          scene: { level: 'transistor' },
          check: {
            kind: 'choice',
            prompt: 'What decides whether this transistor is on or off?',
            options: [
              'The voltage on the gate',
              'How warm the silicon is',
              'Current flowing into the gate',
            ],
            answer: 0,
            explain:
              'Right. The gate’s voltage switches the channel on and off. The insulator means no current flows into the gate.',
          },
        },
        {
          title: 'Check: biggest to smallest',
          body: ['Last question of the course.'],
          scene: { level: 'transistor' },
          check: {
            kind: 'choice',
            prompt: 'Which list goes from biggest to smallest?',
            options: [
              'Core → ALU → adder → gate → transistor',
              'Transistor → gate → adder → ALU → core',
              'Gate → core → transistor → ALU → adder',
            ],
            answer: 0,
            explain:
              'Exactly. A core holds ALUs, an ALU holds an adder, an adder is made of gates, and gates are made of transistors.',
          },
        },
      ],
    },
  ],
};
