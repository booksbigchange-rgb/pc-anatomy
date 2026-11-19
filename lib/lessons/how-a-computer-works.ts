import type { Course } from './types.ts';

/**
 * The first course: the desktop PC, for high school students meeting the
 * hardware for the first time.
 *
 * House style: short sentences, one idea per paragraph, every technical word
 * explained the first time it appears, and no number that the catalogue or a
 * listed source does not back. Each step's scene is checked by
 * tests/lessons.test.ts, so a part named here is a part the viewer can draw
 * at that disassembly.
 */
export const howAComputerWorks: Course = {
  id: 'how-a-computer-works',
  title: 'How a computer works',
  summary:
    'Six short lessons that take a desktop PC apart, from the case down to the chips inside.',
  audience: 'High school · no experience needed',
  lessons: [
    {
      id: 'meet-the-machine',
      title: 'Meet the machine',
      summary:
        'The big parts of a desktop PC, where they sit and what each one is for.',
      minutes: 6,
      steps: [
        {
          title: 'This is a desktop computer',
          body: [
            'Every part you will meet in this course is inside this box. It is a 3D model, not a photo, so you can look at it from any side.',
            'Drag to turn it. Scroll or pinch to zoom. Click any part to read what it is.',
          ],
          scene: { level: 'pc' },
        },
        {
          title: 'The motherboard',
          body: [
            'The big circuit board on the back wall of the case is the motherboard. Every other part plugs into it, either directly or with a cable.',
            'Think of it as the roads of a city. It carries power and signals between the processor and everything else.',
          ],
          scene: { level: 'pc', part: 'motherboard' },
        },
        {
          title: 'Where is the processor?',
          body: [
            'The processor, or CPU, runs your programs. You can’t see it yet, because it is hidden under the CPU cooler: the tower of metal fins near the top of the motherboard.',
            'The cooler is there because the processor gets very hot while it works. In the next lesson you will open the motherboard and look underneath.',
          ],
          scene: { level: 'pc', part: 'cpucooler' },
        },
        {
          title: 'The graphics card',
          body: [
            'The long card across the middle is the graphics card. It is almost a second computer, with its own processor, its own memory and its own fans.',
            'It handles work that can be split into thousands of small pieces at once, like working out the colour of every pixel on your screen.',
          ],
          scene: { level: 'pc', part: 'graphicscard' },
        },
        {
          title: 'The power supply',
          body: [
            'The power supply is the box in the bottom chamber, under a metal cover called the shroud. Computer chips can’t use the electricity from a wall socket directly.',
            'The power supply turns it into steady, low-voltage power at 12, 5 and 3.3 volts. Cables carry that power to the other parts.',
          ],
          scene: { level: 'pc', part: 'psu' },
        },
        {
          title: 'Storage',
          body: [
            'This small flat box is a solid-state drive, or SSD. It keeps your files, your apps and the operating system, even when the computer is switched off.',
            'This machine also has a second, faster drive lying flat on the motherboard. You will meet both of them in lesson 4.',
          ],
          scene: { level: 'pc', part: 'ssd' },
        },
        {
          title: 'Keeping cool',
          body: [
            'Nearly all the electricity a computer uses ends up as heat. If the heat stayed inside, the chips would have to slow down to protect themselves.',
            'The arrows show the path the air takes. Fans pull cool air in through the front, and warm air leaves through the back.',
          ],
          scene: { level: 'pc', part: 'casefan', airflow: 'on' },
          sources: ['chassis'],
        },
        {
          title: 'Take it apart',
          body: [
            'The slider at the bottom of the screen pulls the machine apart. Drag it, or press Auto to watch it happen by itself.',
            'All the way to the right, every part is laid out flat like a parts list.',
          ],
          scene: { level: 'pc', explode: 55 },
        },
        {
          title: 'Check: find the graphics card',
          body: [
            'The machine is back together. Can you spot the graphics card?',
          ],
          scene: { level: 'pc' },
          check: {
            kind: 'find',
            prompt: 'Click the graphics card in the 3D view.',
            answers: ['graphicscard'],
            hint: 'Look for the long card lying sideways across the middle of the case, with “GeForce RTX” printed on it.',
          },
        },
        {
          title: 'Check: power',
          body: ['One more question before you finish.'],
          scene: { level: 'pc' },
          check: {
            kind: 'choice',
            prompt:
              'Which part turns electricity from the wall into the low voltages the other parts use?',
            options: [
              'The motherboard',
              'The power supply',
              'The graphics card',
              'The case fans',
            ],
            answer: 1,
            explain:
              'Right. The power supply converts wall power into steady 12, 5 and 3.3 volt power for everything else.',
          },
        },
      ],
    },
    {
      id: 'the-motherboard',
      title: 'The motherboard',
      summary:
        'Where the processor, memory, graphics card and drive plug in, and how power and start-up work.',
      minutes: 7,
      steps: [
        {
          title: 'The motherboard on its own',
          body: [
            'Here is the motherboard, out of the case. It is a printed circuit board: thin layers of fibreglass with copper wiring running between them.',
            'Almost everything on it is a socket, a slot, a connector, or a chip that helps those connect to each other.',
          ],
          scene: { level: 'motherboard' },
        },
        {
          title: 'The processor',
          body: [
            'In the middle sits the processor, or CPU (central processing unit). It runs the operating system and your programs, and decides what every other part does next.',
            'It sits in a socket full of tiny metal contacts, so it can be fitted and removed without any soldering.',
          ],
          scene: { level: 'motherboard', part: 'cpu', focus: true },
        },
        {
          title: 'Memory (RAM)',
          body: [
            'The two tall sticks beside the processor are memory modules, called RAM.',
            'RAM holds whatever the processor is working on right now: the game you have open, the page you are reading. It is very fast, but it forgets everything the moment the power goes off.',
          ],
          scene: { level: 'motherboard', part: 'ram', focus: true },
        },
        {
          title: 'The graphics card slot',
          body: [
            'The long slot below the processor is a PCI Express ×16 slot, or PCIe for short. The graphics card plugs in here.',
            'The ×16 means sixteen lanes: sixteen data paths side by side, like a sixteen-lane motorway running straight to the processor.',
          ],
          scene: { level: 'motherboard', part: 'pcie16', focus: true },
        },
        {
          title: 'A drive with no cables',
          body: [
            'This flat card is an NVMe solid-state drive. It plugs into an M.2 socket on the board, so it needs no cables at all.',
            'It talks to the processor over PCIe lanes too, which makes it much faster than the older drive in the case.',
          ],
          scene: { level: 'motherboard', part: 'nvme', focus: true },
          sources: ['nvme', 'sata'],
        },
        {
          title: 'Power for the processor',
          body: [
            'The power supply delivers 12 volts, but the processor runs on a much lower voltage. The row of small parts around the socket is the voltage regulator, or VRM.',
            'It steps the 12 volts down and holds the result steady, even when the processor jumps from idle to full speed in a fraction of a second.',
          ],
          scene: { level: 'motherboard', part: 'cpuvrm', focus: true },
        },
        {
          title: 'Starting up',
          body: [
            'When you press the power button, there is no operating system running yet. The first code to run is the firmware, called UEFI, stored on this small chip.',
            'It checks the hardware, gets the memory ready, then hands control to a small program on the drive that loads the operating system.',
          ],
          scene: { level: 'motherboard', part: 'uefi', focus: true },
        },
        {
          title: 'Check: find the memory',
          body: ['Back to the whole board. Where is the RAM?'],
          scene: { level: 'motherboard' },
          check: {
            kind: 'find',
            prompt: 'Click one of the RAM sticks.',
            answers: ['ram'],
            hint: 'Look for the two tall, thin modules standing upright next to the processor.',
          },
        },
        {
          title: 'Check: power cut',
          body: ['One question to finish.'],
          scene: { level: 'motherboard' },
          check: {
            kind: 'choice',
            prompt:
              'You have an unsaved essay open and the power cuts out. What happens to the copy in RAM?',
            options: [
              'It is kept safely until next time',
              'It is lost, because RAM forgets everything without power',
              'It moves to the graphics card',
            ],
            answer: 1,
            explain:
              'Right. RAM only holds data while it has power. That is why you save your work to a drive.',
          },
        },
      ],
    },
    {
      id: 'inside-the-processor',
      title: 'Inside the processor',
      summary:
        'Cores, clock speed, cache, and why one processor is built from three chips.',
      minutes: 6,
      steps: [
        {
          title: 'Under the lid',
          body: [
            'This is a diagram of what is under the metal lid of an AMD Ryzen 9 9950X processor. It shows how the chip is organised, not exactly what it looks like under a microscope.',
            'The processor is not one piece of silicon but three, called dies, sitting side by side in one package.',
          ],
          scene: { level: 'ryzen' },
        },
        {
          title: 'Cores',
          body: [
            'Each of these blocks is a core: a complete processor that can follow its own list of instructions. This chip has 16 of them.',
            'More cores let the computer do more things at the same time, like running a game while a video uploads in the background.',
          ],
          scene: { level: 'ryzen', part: 'zencore' },
        },
        {
          title: 'How fast is a core?',
          body: [
            'A core works in steps, timed by a clock. This one can run at up to 5.7 GHz: 5.7 billion ticks every second.',
            'On every tick it moves several instructions forward, such as adding two numbers or comparing them.',
          ],
          scene: { level: 'ryzen', part: 'zencore', focus: true },
          sources: ['zen5'],
        },
        {
          title: 'Chiplets',
          body: [
            'The cores come in groups of eight, on a small die called a CCD (core complex die). This processor has two of them.',
            'Two small dies are cheaper to make than one big one. A single speck of dust on the silicon wafer ruins much less when each piece is small.',
          ],
          scene: { level: 'ryzen', part: 'zenccd' },
        },
        {
          title: 'Cache',
          body: [
            'Each CCD has 32 MB of L3 cache: a store of very fast memory right next to the cores.',
            'Fetching data from RAM takes far longer than fetching it from cache, so the processor keeps what it is using here. Most of the time the cores never have to wait for RAM at all.',
          ],
          scene: { level: 'ryzen', part: 'zenl3' },
        },
        {
          title: 'The I/O die',
          body: [
            'The third, larger die is the I/O die, short for input/output. It connects the cores to the memory, the PCIe slots, USB and the display.',
            'Those connections don’t get any faster on the newest, most expensive way of making chips, so this die is made on an older, cheaper one.',
          ],
          scene: { level: 'ryzen', part: 'zeniod' },
        },
        {
          title: 'Check: find a core',
          body: ['Now you know what a core is. Can you find one?'],
          scene: { level: 'ryzen' },
          check: {
            kind: 'find',
            prompt: 'Click one of the 16 cores.',
            answers: ['zencore'],
            hint: 'The cores are the repeated blocks inside the two CCDs, eight in each.',
          },
        },
        {
          title: 'Check: cache',
          body: ['One question to finish.'],
          scene: { level: 'ryzen' },
          check: {
            kind: 'choice',
            prompt:
              'Why does a processor need cache when the computer already has RAM?',
            options: [
              'Cache is much bigger than RAM',
              'Cache is right next to the cores, so it is much faster to reach',
              'Cache keeps data when the power is off',
            ],
            answer: 1,
            explain:
              'Exactly. Cache is small but close, so the cores spend less time waiting for data.',
          },
        },
      ],
    },
    {
      id: 'memory-and-storage',
      title: 'Memory and storage',
      summary:
        'Why a computer needs both RAM and a drive, and how an SSD keeps your files.',
      minutes: 6,
      steps: [
        {
          title: 'Two kinds of memory',
          body: [
            'A computer keeps data in two places. RAM is like the desk you work at: fast, close at hand, and cleared at the end of the day.',
            'Storage is like a filing cabinet: slower to reach, but everything stays there when the power is off. Your files, apps and operating system live in storage.',
          ],
          scene: { level: 'motherboard', part: 'ram', focus: true },
          sources: ['ssdarchitecture'],
        },
        {
          title: 'An NVMe SSD',
          body: [
            'This is the NVMe drive from the motherboard, taken out. SSD stands for solid-state drive: it has no moving parts at all.',
            'It is about the size of a stick of gum, 80 by 22 millimetres.',
          ],
          scene: { level: 'nvme' },
        },
        {
          title: 'Flash memory',
          body: [
            'Your files are stored in the chips marked 3D NAND. Each one holds billions of tiny cells that trap electric charge, stacked in layers like the floors of a building.',
            'Trapped charge stays put without power, which is why the data survives being switched off.',
          ],
          scene: { level: 'nvme', part: 'nvmenand' },
        },
        {
          title: 'The controller',
          body: [
            'The chip marked CTRL is the controller, a small processor of its own. It keeps track of where every piece of every file is stored, and it fixes errors.',
            'Flash cells wear out after many rewrites, so the controller also spreads writing evenly across all the chips. That is called wear levelling.',
          ],
          scene: { level: 'nvme', part: 'nvmecontroller' },
        },
        {
          title: 'The older SATA SSD',
          body: [
            'This is the SATA SSD from the case, opened up. Inside is the same idea: flash chips and a controller.',
            'But it connects through cables and the older SATA interface, which is several times slower than the PCIe lanes the NVMe drive uses.',
          ],
          scene: { level: 'ssd', explode: 50 },
          sources: ['sata', 'nvme'],
        },
        {
          title: 'Check: find the flash',
          body: ['Back to the NVMe drive.'],
          scene: { level: 'nvme' },
          check: {
            kind: 'find',
            prompt: 'Click one of the flash memory chips.',
            answers: ['nvmenand'],
            hint: 'They are the two larger chips marked 3D NAND, furthest from the gold contacts.',
          },
        },
        {
          title: 'Check: what survives?',
          body: ['One question to finish.'],
          scene: { level: 'nvme' },
          check: {
            kind: 'choice',
            prompt:
              'Which of these keeps your photos when the computer is switched off?',
            options: ['RAM', 'The SSD', 'The processor’s cache'],
            answer: 1,
            explain:
              'Right. RAM and cache are both cleared without power. The SSD keeps data in flash cells that hold their charge.',
          },
        },
      ],
    },
    {
      id: 'the-graphics-card',
      title: 'The graphics card',
      summary:
        'Why a GPU has thousands of small cores, and what keeps it cool.',
      minutes: 7,
      steps: [
        {
          title: 'A computer on a card',
          body: [
            'This is a GeForce RTX 5090 graphics card. Most of what you can see is cooling: three fans and a big block of metal fins.',
            'The chip that does the work is buried in the middle. It uses so much power that it needs all of this to stay cool.',
          ],
          scene: { level: 'card' },
        },
        {
          title: 'The GPU chip',
          body: [
            'In the middle of the board is the GPU, the graphics processing unit. This one is called GB202.',
            'It has 92.2 billion transistors, the tiny electrical switches every computer chip is built from. That is more than ten for every person on Earth.',
          ],
          scene: { level: 'card', explode: 60, part: 'package', focus: true },
        },
        {
          title: 'Video memory',
          body: [
            'Around the chip are its memory chips: 32 GB of GDDR7. This is the card’s own RAM.',
            'It holds textures, 3D models and anything else the GPU is working on, and it can move 1,792 GB of data every second.',
          ],
          scene: { level: 'card', explode: 60, part: 'gddr7', focus: true },
        },
        {
          title: 'Inside the GPU',
          body: [
            'This diagram is the inside of the GB202 chip. Instead of 16 big cores like the processor, it is built from small units called streaming multiprocessors, or SMs.',
            'The RTX 5090 has 170 of them switched on, grouped into 11 clusters called GPCs.',
          ],
          scene: { level: 'die', part: 'gpc' },
        },
        {
          title: 'Thousands of small cores',
          body: [
            'This is one SM. It has 128 CUDA cores: simple calculators that all do the same kind of maths at the same time. Across the whole card that makes 21,760.',
            'A CPU is like a few expert chefs who can cook anything. A GPU is like a huge kitchen of cooks all chopping vegetables at once. A game frame needs the same maths for millions of pixels, so the big kitchen wins.',
          ],
          scene: { level: 'sm', part: 'cuda' },
        },
        {
          title: 'Check: find a fan',
          body: ['Back to the whole card.'],
          scene: { level: 'card' },
          check: {
            kind: 'find',
            prompt: 'Click one of the graphics card’s fans.',
            answers: ['fan', 'fanmotor'],
            hint: 'There are three of them, side by side on the face of the card.',
          },
        },
        {
          title: 'Check: why a GPU?',
          body: ['One question to finish.'],
          scene: { level: 'card' },
          check: {
            kind: 'choice',
            prompt: 'Why is a GPU so good at drawing a game?',
            options: [
              'It has a few very fast, very flexible cores',
              'It has thousands of simple cores that work on many pixels at the same time',
              'It keeps files when the power is off',
            ],
            answer: 1,
            explain:
              'Yes. Drawing a frame is the same calculation repeated for millions of pixels, which is exactly what thousands of small cores are good at.',
          },
        },
      ],
    },
    {
      id: 'power-and-cooling',
      title: 'Power and cooling',
      summary:
        'How wall power becomes chip power, and how the heat gets out of the case.',
      minutes: 7,
      steps: [
        {
          title: 'Inside the power supply',
          body: [
            'Electricity from a wall socket is alternating current, or AC. It flips direction 50 or 60 times a second, at around 230 or 120 volts depending on the country.',
            'Chips need direct current, or DC, that flows one way at a steady low voltage. The power supply does that conversion.',
          ],
          scene: { level: 'psu' },
          sources: ['acdc'],
        },
        {
          title: 'Safety first',
          body: [
            'This big capacitor stores energy to smooth the power out. It can hold a dangerous charge even after the plug is pulled.',
            'That is why you should never open a real power supply. Building or upgrading a PC never requires it.',
          ],
          scene: { level: 'psu', explode: 50, part: 'psubulk', focus: true },
          sources: ['acdc'],
        },
        {
          title: 'Stepping the voltage down',
          body: [
            'The power supply switches the high voltage on and off tens of thousands of times a second, and feeds it through this transformer.',
            'The transformer steps it down to about 12 volts. It is also the barrier that keeps the dangerous wall voltage away from the rest of the computer.',
          ],
          scene: {
            level: 'psu',
            explode: 50,
            part: 'psutransformer',
            focus: true,
          },
        },
        {
          title: 'Moving heat away',
          body: [
            'Everything that uses power makes heat. This is the CPU cooler, taken apart.',
            'Its copper base sits on the processor. A thin layer of thermal paste fills the tiny air gaps between them, because air is very bad at carrying heat.',
          ],
          scene: { level: 'cooler', explode: 40, part: 'coolerpaste' },
        },
        {
          title: 'Heat pipes',
          body: [
            'These copper tubes are heat pipes. Inside is a little liquid that boils at the hot end, travels as vapour to the fins and turns back into liquid there, giving its heat away.',
            'The liquid then soaks back to the hot end to start again. Heat pipes move heat much faster than solid copper.',
          ],
          scene: { level: 'cooler', explode: 40, part: 'coolerpipes' },
        },
        {
          title: 'Fins and fans',
          body: [
            'The heat ends up in dozens of thin aluminium fins, which give it a huge surface to escape from. The fan keeps pushing fresh air between them.',
            'Without moving air, the fins would just heat up until they were as hot as the processor.',
          ],
          scene: { level: 'cooler', explode: 40, part: 'coolerfins' },
        },
        {
          title: 'Front to back',
          body: [
            'Back in the case, the arrows show the whole air path. Three fans pull cool air in at the front, and one pushes warm air out at the back.',
            'Dust filters on the intakes stop dust from coating the fins, where it would act like a blanket and hold the heat in.',
          ],
          scene: { level: 'pc', part: 'casefan', airflow: 'on' },
        },
        {
          title: 'Check: find the heat pipes',
          body: ['Back to the cooler.'],
          scene: { level: 'cooler', explode: 40 },
          check: {
            kind: 'find',
            prompt: 'Click one of the heat pipes.',
            answers: ['coolerpipes'],
            hint: 'They are the bent copper tubes running from the base up into the fins.',
          },
        },
        {
          title: 'Check: airflow',
          body: ['Last question of the course.'],
          scene: { level: 'pc' },
          check: {
            kind: 'choice',
            prompt: 'Where does cool air come into this case?',
            options: [
              'Through the front, past the dust filter',
              'Through the back, next to the ports',
              'Through the power cable',
            ],
            answer: 0,
            explain:
              'Right. Cool air comes in at the front and warm air leaves at the back, so it flows one way across all the parts.',
          },
        },
      ],
    },
  ],
};
