# BigChange PC Hardware Atlas

BigChange PC Hardware Atlas is a free 3D school for technology, written for high school students of BigChange Academy. Students take real hardware apart in 3D, from a whole desk setup down to a single transistor, either on their own or through step-by-step courses with checks. There are no accounts and no logins.

It is built on [**PC Anatomy**](https://github.com/Yoosseph/pc-anatomy) by Yoseph, the open-source 3D explorer that takes a desktop computer apart from the assembled ATX tower down to a single GPU streaming multiprocessor. The [original PC Anatomy demo](https://pc-anatomy.com/) and its [roadmap](https://github.com/users/Yoosseph/projects/1) belong to that project.

Before changing any code, read [**ARCHITECTURE.md →**](ARCHITECTURE.md). It is the full technical picture of the project — the scale tree, where every module lives, the conventions behind the geometry, and the traps that are not obvious from reading the source. It is written to be read start to finish by whoever is doing the work, person or language model.

The PC explorer's polygons are generated in TypeScript with three.js, with no imported models or image textures. The Computer Lab and Laptop Lab add a small set of reviewed CAD models, converted to local files at build time and recorded in [MODEL_ASSET_MANIFEST.md](MODEL_ASSET_MANIFEST.md). The roughly 390 selectable components each carry a name, a description, an explanation of their purpose, specifications, and citations instead of stopping at a label.

![An assembled ATX tower in PC Anatomy: a dual-glass aluminium case with the motherboard, graphics card, cooler and power supply visible through the window](docs/screenshots/pc-assembled.png)

Press **Auto** at the left end of the bottom bar to watch the machine take itself apart, or drag the timeline to move through the sequence by hand.

## Scale tree

```text
Desktop PC
├── Motherboard
│   ├── Network controller
│   │   ├── Ethernet frame
│   │   └── Ethernet cable
│   ├── Ryzen 9 9950X
│   │   ├── Ryzen I/O die
│   │   └── Zen 5 core
│   │       └── ALU
│   │           └── Adder
│   │               └── AND gate
│   │                   └── Transistor
│   └── Core Ultra 9 285K
│       └── Core Ultra I/O tile
├── Power supply
│   ├── ASUS TUF Gaming 850W Gold · modular
│   └── ASUS TUF Gaming 750W Bronze · non-modular
├── Cooling
│   ├── Case fan
│   ├── CPU cooler
│   └── Liquid cooling
├── SATA SSD
└── GPU
    ├── RTX 5090
    │   └── GB202 processor
    │       └── Graphics processing cluster (GPC)
    │           └── Texture processing cluster (TPC)
    │               └── Streaming multiprocessor (SM)
    ├── Radeon RX 9070 XT
    │   └── Navi 48 processor
    │       └── Shader engine
    │           └── Workgroup processor (WGP)
    │               └── Compute unit (CU)
    └── Arc B580
        └── BMG-G21 processor
            └── Render slice
                └── Xe-core
                    └── Xe vector engine (XVE)

Home network (a second root: computer, router, Wi-Fi, provider, DNS, web server)
```

The slider moves each scale from its assembled state to a laid-out inventory. Search can jump directly to a component at any depth, while breadcrumbs and the scale navigator move back through the machine.

![The same machine at the far end of the slider, with every part lifted out and laid flat as a component inventory](docs/screenshots/pc-disassembled.png)

Descending into a part rebuilds it at its own scale with its own timeline, so the graphics card that was installed in the tower comes apart into its shroud, fans, fin banks, heat pipes, vapor chamber, board and backplate.

![The GeForce RTX 5090 at its own scale, assembled: a triple-fan card with its shroud, backplate and PCIe bracket in place](docs/screenshots/gpu-assembled.png)

![The RTX 5090 part way through its own disassembly, with the shroud and fans lifted clear of the fin banks, vapor chamber and circuit board below](docs/screenshots/gpu-exploded.png)

## The interface

The rail on the left carries the scale tree and per-system visibility. The GPU menu holds three cards, the RTX 5090, Radeon RX 9070 XT and Arc B580, each with its own dropdown of scales. The Power supply menu lists two TUF Gaming units directly: an 850W Gold with modular sockets and a 750W Bronze with fixed cables. The bar along the bottom is the disassembly timeline, with the **Auto** key at its left-hand end, the named phases above the slider, and a reset on the right. Left-click an explorable component to open it; right-click to inspect it and use the detail, hide, isolate and focus controls. Hidden components remain available from the stage tracker until they are restored, the scale changes, or the explorer is reset. The **Airflow** switch beside the camera views draws the path the air takes, cool where it enters and warm where it leaves, and it fades as soon as the disassembly slider moves. It starts on wherever there are fans except on the complete machine, where the case is closed and the switch is there to turn it on. The corner expand control toggles browser fullscreen. While a lesson is open, it takes the rail's place on the left; on a phone it is a card above the timeline that folds away to give the model the screen.

| Workbench                                                                                                              | On a phone                                                                                                                                               |
| ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ![The full desktop workbench: scale rail, 3D stage and disassembly timeline](docs/screenshots/workbench-assembled.png) | ![The same explorer on a phone, with the rail collapsed behind a button and the timeline stacked below the stage](docs/screenshots/workbench-mobile.png) |

![Every part of the machine laid out flat as a component inventory, seen on the desktop workbench](docs/screenshots/workbench-inventory.png)

## The school

The site opens on the **School home**, which lists each subject with its course and the exhibits students can open on their own. Every course step moves the 3D model to what it is talking about: it opens the right part, takes it apart to the right point and highlights a component. Every lesson ends with checks: click a part on the model, or answer a multiple-choice question. Progress is kept in the student's own browser.

**Computers.** Exhibits: Computer Lab, Inside the PC, Laptop Lab, Build a PC, Task Manager and My learning path. Course, _How a computer works_:

1. **Meet the machine** — the big parts of a desktop PC and what each one is for
2. **The motherboard** — where everything plugs in, and how power and start-up work
3. **Inside the processor** — cores, clock speed, cache and chiplets
4. **Memory and storage** — why a computer needs both RAM and a drive
5. **The graphics card** — why a GPU has thousands of small cores
6. **Power and cooling** — from wall socket to chip, and how heat gets out

**Inside the chip.** Exhibits: a processor core, an ALU, an adder, a logic gate and a transistor, continuing the explorer's dive below one Zen 5 core. Course, _Inside the chip_:

1. **Inside a core** — fetch, decode and out-of-order execution
2. **The ALU** — adding, logic, shifting and flags
3. **Adding in binary** — how a few logic gates add numbers column by column
4. **Gates from switches** — six transistors make an AND gate
5. **The transistor** — one switch, cut open

The core follows AMD's published Zen 5 figures. The ALU, adder, gate and transistor are teaching models, and each says so; see [SOURCES.md](SOURCES.md) for what every cited document supports.

**Networks and the internet.** Exhibits: a home network (with the router, Wi-Fi, DNS and a web server), the network controller, an Ethernet cable and a packet's layers. Course, _How the internet reaches you_:

1. **Your home network** — private addresses, the router, Wi-Fi and DNS
2. **The network controller** — MAC, PHY, transformer, jack and status lights
3. **The Ethernet cable** — eight wires in four twisted pairs
4. **A packet's layers** — data inside TCP, inside IP, inside Ethernet

The networking facts come from the IETF RFCs that define them and Texas Instruments' DP83867 Ethernet datasheet; see [SOURCES.md](SOURCES.md).

### For teachers

There are no accounts, so everything works through links and each student's own browser:

- **For teachers** (`/?teach`) lists every lesson with its steps and answer key, copies lesson links, and builds an **assignment link** for a set of lessons with an optional title. Anyone can open it, so the answer keys are not secret.
- A student who opens an assignment link (`/?assign=…`) sees it on their School home, with each lesson's status, until they remove it.
- **My progress** (`/?progress`) shows every lesson's status and its best "right first time" score on the checks, with a certificate for each finished course. Students can print it or show it to the teacher; the teacher page cannot see it.

Every screen has its own link, so a teacher can send a class straight to a lab (`/?lab=laptop`), a lesson step (`/?lesson=the-motherboard&step=3`) or a part (`/?scale=card&part=vapor&explode=60`). Back and Forward step between them.

## Quick start

The Atlas requires Node.js 22.13 or newer.

```bash
git clone https://github.com/booksbigchange-rgb/pc-anatomy.git
cd pc-anatomy
npm install
npm run dev
```

Vite prints the local development URL. To create and preview a production build:

```bash
npm run build
npm start
```

The project is entirely static. The production output is written to `dist/` and needs no backend.

## Search appearance

The public URL is `https://pc-anatomy.com/`. The HTML entry includes a canonical URL, descriptive title, social preview metadata, and WebSite / WebApplication structured data. `public/guide/index.html` is a readable hardware guide that works without JavaScript and links back to the explorer.

Deploy the entire `dist/` directory, including `guide/`, `robots.txt`, `sitemap.xml`, and the icon files. Serve `/guide/` from its own `index.html` before applying any single-page-app fallback. If the hostname changes, update the canonical and social URLs in both HTML pages, the structured data, and the sitemap and robots files together.

After deployment, submit `https://pc-anatomy.com/sitemap.xml` in Google Search Console and request indexing of the homepage and guide. Indexing, favicon display, and ranking are decided by Google and may take time after a recrawl. Do not add fabricated ratings or keyword stuffing.

The browser and search icons are derived from `public/favicon.svg`. Run `node scripts/generate-icons.mjs` to regenerate the PNG and multi-resolution ICO variants (uses Playwright and Microsoft Edge). `public/pc-assembled.png` is a capture of the actual model; `public/social-preview.png` is its sharing card.

## Working on the code

The technical detail lives in **[ARCHITECTURE.md](ARCHITECTURE.md)**, next to this file. It covers how to run and check the project, the full scale tree, where every module lives and what it answers for, the interface a geometry builder is handed, the conventions that keep the models consistent, how to add a component or a whole new scale, the sourcing rules, and what the tests do and do not verify.

Read it before the first edit. It is kept current with the code, and a change that moves a module or settles a decision should update it in the same commit.

## Accuracy and sources

The machine follows published ATX dimensions where those dimensions are standardized. Seven products are named and modeled as specific subjects: the GeForce RTX 5090, AMD Radeon RX 9070 XT, Intel Arc B580, AMD Ryzen 9 9950X, Intel Core Ultra 9 285K, ASUS TUF Gaming 850W Gold and ASUS TUF Gaming 750W Bronze. The RTX 5090 is the card installed in the tower; the Radeon (after the Sapphire NITRO+) and the Arc (Intel Limited Edition) are complete alternative cards opened from the GPU menu. The modular PSU is the one installed in the tower; the fixed-cable model opens from the Power supply menu. The rest is an illustrative desktop build that explains representative construction and relationships rather than reproducing a particular bill of materials.

Processor and GPU floorplans are explanatory diagrams of documented logical architecture. They are not semiconductor mask layouts and do not claim exact transistor-level placement. See [SOURCES.md](SOURCES.md) for standards, product documentation, architecture references, and the scope of each source.

The PSU exteriors follow published dimensions and visible product features; their internal boards explain the conversion chain and are not service diagrams of ASUS circuitry. Product and company names are used nominatively to identify the hardware being described. PC Anatomy is not affiliated with or endorsed by NVIDIA, AMD, Intel, ASUS, or any other named company.

## Contributing

Issues and focused pull requests are welcome, and the [roadmap and Kanban board](https://github.com/users/Yoosseph/projects/1) lists what is open. Start with [ARCHITECTURE.md](ARCHITECTURE.md), keep written claims cited, preserve the distinction between physical models and logical diagrams, and run the full local checks before opening a change:

```bash
npm run check
npm run lint
npm test
npm run build
```

GitHub Actions runs these checks on every push and pull request using Node.js 22.

## AI disclaimer

AI-assisted tools were used selectively during development for coding support, debugging, iteration, and documentation. The project’s architecture, technical direction, design, integration, and validation were developed and maintained by the project maintainer.

The Atlas, like PC Anatomy, is available under the [MIT License](LICENSE).
