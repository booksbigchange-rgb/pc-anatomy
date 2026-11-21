# PC Anatomy — architecture

Read this before changing anything. It is written for whoever picks the project
up next, person or language model, and it assumes you have not seen the code
before. [README.md](README.md) explains what PC Anatomy is and what it looks
like; this file explains how it is built and what will bite you.

Most of what follows is a decision that already went one way once. Where a rule
sounds arbitrary, it is usually the scar of a bug.

## What it is, technically

A static single-page app. The original PC Anatomy explorer remains procedural:
its hardware polygons are generated in TypeScript at runtime with three.js, and
its 367 catalogue entries are joined to geometry by a single string id.

The BigChange school layer adds two things on top of it. **Lessons** are
step-by-step courses, written for high school students, that drive the same
stage and are kept in source the same way (see
[Lessons and links](#lessons-and-links)). The **labs** — Computer Lab, Laptop
Lab, Build a PC and Task Manager — use a separate audited asset path. Approved
Framework and KiCad source CAD is pinned, converted in CI to small local GLBs
under `public/models/`, and served by the same static site. Student browsers
never fetch those models from third-party hosts. Every external asset requires
provenance, license review, size/geometry gates and a procedural fallback
before it can enter the classroom build.

React 19, strict TypeScript, Vite 8, Tailwind 4, and three.js used directly:
no react-three-fiber. UI primitives under `components/ui/` are generated
shadcn/Base UI files and are excluded from linting. The entry point is
`index.html` → `app/main.tsx` → `app/page.tsx`. The 3D engine is imported
dynamically inside `app/viewer.tsx`, so three.js lands in its own chunk and the
interface paints before it arrives.

## Run it

Node 22.13 or newer.

```bash
npm install
npm run dev       # vite dev server, http://127.0.0.1:5173/

npm run check     # tsc --noEmit, strict
npm run lint      # oxlint
npm run format    # oxfmt (CI runs npm run format:check)
npm test          # node --experimental-strip-types --test tests/*.test.ts
npm run build     # tsc --noEmit && vite build
npm start         # preview the production build
```

Two things about the toolchain are worth knowing before you debug them:

**Native binaries are per-platform.** oxlint, oxfmt, rolldown (inside Vite) and
lightningcss ship compiled binaries. A `node_modules` installed on one operating
system cannot run them on another — for example from a Linux shell against a
Windows checkout. `tsc` and the test suite are pure JavaScript and run anywhere,
so those two are always available; the rest need a matching install.

**`npm test` uses Node's native type stripping, not a bundler.** There is no
path-alias resolution and no extensionless import resolution. Every module a
test reaches must import with explicit `.ts` extensions all the way down. One
extensionless import makes its module, and everything that imports it,
unloadable from a test. `tests/imports.test.ts` loads every module under `lib/`
so a missing extension fails the suite straight away. `lib/scene.ts` loads, but
`createViewer` needs a WebGL context, so pure logic is still easier to test
from its own module, as `lib/picking.ts` does.

## How it fits together

Four layers, joined by the concept id.

```text
lib/levels.ts        the scale tree: what scales exist, what opens into what
      │
lib/concepts/*.ts    the written catalogue, composed by lib/manifest.ts
      │              367 entries, each with a globally unique id
      │
lib/models.ts        one geometry builder per scale, handed `ModelTools`.
      │              Builders attach geometry to concept ids via add()
      │
lib/stage-runtime.ts shared WebGL, lighting, camera and controls
lib/model-stage.ts   shared posing, inventory, bounds and model disposal
lib/scene.ts         ordinary explorer visibility, picking and dive ramp
lib/comparison-*.ts  same-category comparison state/data and renderer
      │
app/                 React: what the viewer is currently looking at
```

The concept id is the join. The same string appears in the catalogue entry, in
the builder's `add()` call, in the search index, in the selection state and in
the detail panel. Nothing else ties them together, which is why ids are global
and why a collision between two catalogue files is a real hazard rather than a
theoretical one.

Exploration is data, not code. Adding a scale means adding an entry to
`lib/levels.ts`, a concept file, a geometry builder, and one line in the
`builders` registry. There is no route table — navigation is state. The address
bar is a serialisation of that state (`lib/url-state.ts`), not a router: see
[Lessons and links](#lessons-and-links).

## Big Change school lab layer

The school-facing lab is intentionally outside the core scale tree. It teaches
whole-device context first, then hands students into the original detailed PC
explorer.

| Path                                         | Responsibility                                                                                        |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `app/computer-lab.tsx`                       | Whole desktop setup, ports and connection practice.                                                   |
| `app/laptop-lab.tsx`                         | Laptop exterior/interior scene, guided lesson, connection practice, real CAD loading and teardown UI. |
| `app/laptop-internals.ts`                    | Laptop internal teaching geometry, component groups, cables and staged teardown transforms.           |
| `app/use-disassembly-playback.ts`            | Shared 0–100 auto/pause/reset playback used by both PC Anatomy and Laptop Anatomy.                    |
| `scripts/convert-framework-*.py`             | Build-time conversion of pinned Framework CAD/DXF into local GLBs.                                    |
| `scripts/convert-kicad-laptop-connectors.py` | Build-time conversion of individually reviewed KiCad connector STEP models.                           |
| `MODEL_ASSET_MANIFEST.md`                    | Source, blob, license, dimensions and release status for external 3-D assets.                         |
| `THIRD_PARTY_REVIEW.md`                      | School-safety and redistribution review.                                                              |

### Laptop Anatomy teardown

Laptop teardown reuses the PC Anatomy playback idea but does not register the
laptop as a `lib/levels.ts` scale. The laptop has its own service sequence
because laptop removal directions and cable dependencies differ from ATX parts.

The current order is:

`bottom cover → battery → SSD/Wi-Fi → RAM/speakers → cooling → CPU → motherboard → display/hinges`.

Parts move as real object groups rather than duplicated "exploded" meshes.
Battery, motherboard, display, hinges, webcam and reviewed connector geometry
can be replaced by local CAD-derived GLBs while the procedural objects remain
fallbacks. Major service cables have explicit disconnect thresholds and manual
unplug/reconnect state.

## The scale tree

33 scales, 367 concepts. `physical` scales are lit like hardware and keep real
size relationships in the inventory; `logical` scales are block diagrams and are
lit flat.

| Scale         | Parent        | Menu             | Kind     | Concepts |
| ------------- | ------------- | ---------------- | -------- | -------: |
| `pc`          | —             | root             | physical |       18 |
| `motherboard` | `pc`          | Motherboard      | physical |       24 |
| `ryzen`       | `motherboard` | Motherboard      | logical  |        6 |
| `ryzenio`     | `ryzen`       | Motherboard      | logical  |        5 |
| `zen5core`    | `ryzen`       | Motherboard      | logical  |        9 |
| `alu`         | `zen5core`    | Motherboard      | logical  |        8 |
| `adder`       | `alu`         | Motherboard      | logical  |        7 |
| `gate`        | `adder`       | Motherboard      | logical  |        7 |
| `transistor`  | `gate`        | Motherboard      | logical  |        7 |
| `corei9`      | `motherboard` | Motherboard      | logical  |        9 |
| `coreio`      | `corei9`      | Motherboard      | logical  |        4 |
| `psu`         | `pc`          | Power supply     | physical |       17 |
| `psubronze`   | `pc`          | Power supply     | physical |       17 |
| `fan`         | `pc`          | Cooling          | physical |        8 |
| `cooler`      | `pc`          | Cooling          | physical |        8 |
| `liquid`      | `pc`          | Cooling          | physical |        9 |
| `ssd`         | `pc`          | Storage          | physical |        8 |
| `nvme`        | `motherboard` | Storage          | physical |        6 |
| `card`        | `pc`          | GPU · RTX 5090   | physical |       40 |
| `die`         | `card`        | GPU · RTX 5090   | logical  |        9 |
| `gpc`         | `die`         | GPU · RTX 5090   | logical  |        3 |
| `tpc`         | `gpc`         | GPU · RTX 5090   | logical  |        2 |
| `sm`          | `tpc`         | GPU · RTX 5090   | logical  |        9 |
| `rx9070`      | `pc`          | GPU · RX 9070 XT | physical |       40 |
| `navi48`      | `rx9070`      | GPU · RX 9070 XT | logical  |       11 |
| `rxse`        | `navi48`      | GPU · RX 9070 XT | logical  |        5 |
| `rxwgp`       | `rxse`        | GPU · RX 9070 XT | logical  |        3 |
| `rxcu`        | `rxwgp`       | GPU · RX 9070 XT | logical  |       12 |
| `arcb580`     | `pc`          | GPU · Arc B580   | physical |       36 |
| `bmg`         | `arcb580`     | GPU · Arc B580   | logical  |        7 |
| `xeslice`     | `bmg`         | GPU · Arc B580   | logical  |        3 |
| `xecore`      | `xeslice`     | GPU · Arc B580   | logical  |        4 |
| `xve`         | `xecore`      | GPU · Arc B580   | logical  |        6 |

Menus are grouped by `branchLabel`, not by branch root, which is why the case
fan, the tower cooler and the AIO share one Cooling heading instead of nesting.
The GPU menu has sub-menus: each card declares `submenu`, and every scale beneath
it is listed under that card. The Power supply menu lists its two models directly.

Five scales are marked `alternative: true`: the second processor, the liquid
cooler, the two graphics cards and the fixed-cable PSU the tower does not carry.
Only one cooler bolts to one socket, only one processor sits in it, one card is
installed and the tower carries one supply —
so these are real scales with real content that simply have nothing to click on
at the scale above. They are reached from their subsystem menu instead. The flag
is what keeps the "every scale is reachable" test honest without forcing the
machine to carry two coolers and three cards at once.

Each `LevelDef` also declares `phases` — the named stops along the 0–100
disassembly slider — and optionally `spread`, which multiplies how far pieces
travel as they come apart. A tower needs far bigger gaps than a card before its
subsystems stop touching.

## Where the code lives

| Path                                                                                                                                                                          | Responsibility                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/levels.ts`                                                                                                                                                               | The scale tree: parents, kind, phases, spread, menu grouping. Also `levelPath`, `branchRoot`, `submenuRoot`, `branches`, `menuRoot`.                                                                                                                              |
| `lib/concept.ts`                                                                                                                                                              | The `Concept` shape, the eight categories and their colours, the three accuracy strings, and the `concept()` factory.                                                                                                                                             |
| `lib/concepts/*.ts`                                                                                                                                                           | The written catalogue, one file per subsystem. Ids are global.                                                                                                                                                                                                    |
| `lib/sources.ts`                                                                                                                                                              | Every citable reference, keyed by id. 60 of them.                                                                                                                                                                                                                 |
| `lib/manifest.ts`                                                                                                                                                             | Composes the catalogue, wires parents to children, and answers questions about it: `byId`, `searchConcepts`, `openLevel`, `levelConcept`. Nothing about the current view.                                                                                         |
| `lib/explorer-state.ts`                                                                                                                                                       | `ExplorerState` — what the viewer is looking at — plus `initialState`, `selectSearch`, and `Scene` / `showScene`, a view described from outside (a lesson step or a link).                                                                                        |
| `lib/lessons/`                                                                                                                                                                | The school: `types.ts` (course, lesson, step, check), one file per course, and `index.ts` (`courses`, `lessonById`, `courseOf`, `nextLesson`).                                                                                                                    |
| `lib/lesson-run.ts`                                                                                                                                                           | One reader's way through a lesson, as pure transitions: `beginStep`, `answerChoice`, `answerPick`, `reveal`, `advance`.                                                                                                                                           |
| `lib/progress.ts`                                                                                                                                                             | Finished lessons and where a reader left off, read from and written to `localStorage` defensively.                                                                                                                                                                |
| `lib/catalogue.ts`                                                                                                                                                            | The school's map: subjects, each with its exhibits (a scale or a lab) and its course ids, plus the lab ids that addresses use.                                                                                                                                    |
| `lib/chip-architecture.ts`, `lib/concepts/chip.ts`                                                                                                                            | The five Inside-the-chip scales below one Zen 5 core, drawn in the diagram kit's language with labels sized to be read.                                                                                                                                           |
| `lib/url-state.ts`                                                                                                                                                            | `readAddress`, `writeAddress`, `addressOf`: the query string on `/` to and from a lesson step or a view.                                                                                                                                                          |
| `lib/models.ts`                                                                                                                                                               | The `builders` registry, the `Piece` type, the shared `material()` cache, and `buildModel(level)`.                                                                                                                                                                |
| `lib/hardware.ts`                                                                                                                                                             | `ModelTools`, the interface every builder is handed, and the RTX 5090 card assembly.                                                                                                                                                                              |
| `lib/machine.ts`                                                                                                                                                              | The tower itself: ATX constants, what goes where inside the case, cable routing, the rear I/O shield, RGB palette.                                                                                                                                                |
| `lib/chassis.ts`                                                                                                                                                              | The case: corner columns and rails, the cut rear panel, tray, floor and roof, the glass side, the mesh front, the dust filters, the front I/O, and `plateWithHoles`, which cuts openings in a sheet. It is handed its openings as measurements from `machine.ts`. |
| `lib/mainboard.ts`, `power-supply.ts`, `fan-unit.ts`, `cooler.ts`, `liquid.ts`, `ssd.ts`, `nvme.ts`, `processor.ts`, `io-die.ts`                                              | Builders for physical or logical scales. `power-supply.ts` builds both TUF exteriors from one illustrative conversion chain.                                                                                                                                      |
| `lib/graphics-card.ts`, `card-kit.ts`, `radeon-card.ts`, `arc-card.ts`                                                                                                        | The three graphics cards. `card-kit.ts` holds the millimetre-scale parts all three share.                                                                                                                                                                         |
| `lib/gpu-architecture.ts`, `radeon-architecture.ts`, `arc-architecture.ts`                                                                                                    | The chip block diagrams.                                                                                                                                                                                                                                          |
| `lib/diagram-kit.ts`                                                                                                                                                          | The shared visual language of those diagrams — `put`, `backdrop`, `block` — with a palette per chip. Navi 48 and BMG-G21 draw from it; the GB202 scales predate it and build their own scenery.                                                                   |
| `lib/airflow.ts`                                                                                                                                                              | Where the air goes: the chevron, the sampling and marching of a path, `cardAirflow` for the three cards, and `airflowStrength`, the curve that takes it off screen as the machine opens.                                                                          |
| `lib/airflow-mode.ts`                                                                                                                                                         | `airflowLevels`, `hasAirflow` and `airflowShown`, which decide whether a scale draws air at all. Kept free of three.js so `app/` can import it without pulling the engine into the first-paint bundle; `airflow.ts` re-exports it.                                |
| `lib/parts.ts`                                                                                                                                                                | Shared realistic parts: fans, grilles, fin stacks, capacitors, chokes, slots, ports, screws, `glowMaterial`, `buildLightStrip`.                                                                                                                                   |
| `lib/materials.ts`                                                                                                                                                            | The ten surface finishes and `temperedGlass`.                                                                                                                                                                                                                     |
| `lib/surfaces.ts`, `pcb.ts`, `silicon-texture.ts`                                                                                                                             | Generated material maps. No downloaded textures.                                                                                                                                                                                                                  |
| `lib/board-details.ts`                                                                                                                                                        | Representative support circuitry and mechanical subassemblies.                                                                                                                                                                                                    |
| `lib/stage-runtime.ts`                                                                                                                                                        | Shared Three.js stage foundation: renderer, environment, lighting, camera, controls, demand-driven frame scheduling, animation ticking, camera fitting, context-loss reporting, and base disposal.                                                                |
| `lib/scene.ts`                                                                                                                                                                | Ordinary explorer visibility, picking, camera targets, and dive ramp composed over the shared stage runtime. Returns `{ update, dispose }`.                                                                                                                       |
| `lib/model-stage.ts`                                                                                                                                                          | Reusable model-stage primitives shared by both renderers: scratch-backed piece posing and bounds, inventory preparation, common bounds, and resource disposal.                                                                                                    |
| `lib/comparison-state.ts`                                                                                                                                                     | Category-specific comparison schemas, metadata-driven model discovery, pure comparison transitions, catalogue-backed spec projection, validation, and pane coordinate math.                                                                                       |
| `lib/comparison-scene.ts`                                                                                                                                                     | One-renderer comparison engine composed over the shared stage runtime. It renders isolated scissored panes on wide screens and one active pane below 700 CSS pixels.                                                                                              |
| `lib/picking.ts`                                                                                                                                                              | `resolvePick` / `resolvePickNear` — the see-through picking policy. Kept outside the scene so tests can call it without a WebGL context.                                                                                                                          |
| `lib/layout.ts`                                                                                                                                                               | `inventoryLayout`, `hardwareInventory`, `spatialInventory`, `smoothstep`, `Vec3`.                                                                                                                                                                                 |
| `app/page.tsx`                                                                                                                                                                | Chooses the explorer or comparison workbench and otherwise keeps application-level composition state.                                                                                                                                                             |
| `app/comparison-workbench.tsx`, `comparison-viewer.tsx`, `comparison-specs.tsx`                                                                                               | Comparison composition and controls, the React-to-Three bridge, and the responsive specification sheet.                                                                                                                                                           |
| `app/use-explorer.ts`                                                                                                                                                         | All explorer state and every named move: navigate, dive, arrive, choose, isolate, hide, and the rest.                                                                                                                                                             |
| `app/use-disassembly-playback.ts`                                                                                                                                             | Shared request-animation-frame playback for explorer and comparison disassembly controls.                                                                                                                                                                         |
| `app/use-lesson.ts`, `app/use-address.ts`, `app/use-narrow.ts`                                                                                                                | The lesson being taken, as named moves; keeping the address bar and Back/Forward in step with the view; whether the phone/tablet layout is in force.                                                                                                              |
| `app/school-home.tsx`, `app/course-card.tsx`, `app/school.css`                                                                                                                | The School home (no 3D, so it draws at once), the course card it shares with the Lessons dialog, and the home and header styles.                                                                                                                                  |
| `app/lesson-panel.tsx`, `app/courses-dialog.tsx`, `app/lessons.css`                                                                                                           | The lesson player (in the rail's place on a wide screen, a folding card on a phone), the course list, and their styles.                                                                                                                                           |
| `app/topbar.tsx`, `scale-nav.tsx`, `systems-list.tsx`, `stage-heading.tsx`, `stage-tools.tsx`, `disassembly.tsx`, `search-dialog.tsx`, `detail-panel.tsx`, `about-dialog.tsx` | One panel each.                                                                                                                                                                                                                                                   |
| `app/viewer.tsx`                                                                                                                                                              | The React ↔ three.js bridge: lazy scene load, hover label, error state.                                                                                                                                                                                           |
| `app/links.ts`                                                                                                                                                                | Destinations used by more than one panel.                                                                                                                                                                                                                         |
| `app/globals.css`, `app/workbench.css`                                                                                                                                        | The visual direction, desktop through phone.                                                                                                                                                                                                                      |
| `tests/*.test.ts`                                                                                                                                                             | 135 tests: module loading, catalogue integrity, layout, picking, geometry presence, airflow, the case, comparison state/data/pane/bounds behaviour, and lessons, links and progress.                                                                              |
| `scripts/generate-icons.mjs`                                                                                                                                                  | Rasterises `public/favicon.svg` into PNG and ICO variants. Uses Playwright and Edge.                                                                                                                                                                              |
| `scripts/generate-reference-index.mjs`                                                                                                                                        | Regenerates `docs/component-references.md` from the catalogue. Run it after changing citations.                                                                                                                                                                   |

## The interfaces you will touch

**`ModelTools`** (`lib/hardware.ts`) is what every builder receives:

| Member                                                            | What it does                                                                                                              |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `add(concept, object, pos, delta?, reveal?)`                      | Registers an object as one selectable piece of a named concept.                                                           |
| `instances(concept, positions, size, reveal?, color?, geometry?)` | The same, for many identical pieces drawn as one instanced mesh.                                                          |
| `box(size, color, metal?, r?)`                                    | A rounded box in the shared material cache.                                                                               |
| `pcb(size, variant?)`                                             | A circuit board: routed faces, bare laminate on the cut edges.                                                            |
| `material(color, metal?, rough?)`                                 | The cached standard material.                                                                                             |
| `label(parent, text, pos, width, color?)`                         | 3-D text, sized to a width rather than a font size.                                                                       |
| `assembly(level)`                                                 | Reuses a detailed scale as one installed, selectable assembly — how the motherboard and the card appear inside the tower. |
| `airflow(streams)`                                                | Chevrons marching along the paths this build moves air along. Scenery, not parts: see the convention below.               |

`delta` is the direction a piece travels as the machine comes apart. `reveal` is
the disassembly fraction below which a piece is hidden, and it defaults to 0.

**`Piece`** (`lib/models.ts`) is what a builder produces: the object, its base
and exploded positions, its inventory slot, its concept and instance number, and
its visibility. The scene animates pieces; it never re-reads the catalogue.

**`ExplorerState`** (`lib/explorer-state.ts`) is the whole of what the viewer is
looking at: level, explode 0–100, visible categories, hidden ids, selection,
isolated, camera view, the airflow mode, and three revision counters. `cameraRevision` and
`focusRevision` exist so that asking for the same camera twice still moves it;
`diveRevision` starts a dive. The scene watches the revisions, not the values.

## Conventions that matter

**Geometry is millimetres.** Every builder opens with a local `mm()` converting
to scene units and states its scale in the file header: the tower is 1 unit ≈
35 mm, the motherboard 22, the AIO 14, the power supply 12, the tower cooler 11,
the case fan 9, the SSD 8. The three graphics cards share `MM` from
`card-kit.ts`, which is sized so all three come out at their true relative
lengths. Keep this. A builder without an `mm()` is a builder whose numbers mean
nothing.

**Every rendered object belongs to a named concept.** `tests/models.test.ts`
enforces it. An anonymous mesh is one a viewer can hover and get nothing from.
The only exception is scenery explicitly marked `userData.contextFrame`.

**`reveal` is for things genuinely inside something.** If you could see it
before picking up a screwdriver, `reveal` is 0. Putting a reveal on a cooler's
fin stack once meant the assembled cooler rendered as a bare coldplate.

**Ids are global across every catalogue file.** The Radeon branch prefixes
everything `rx` and the Arc branch `arc` precisely because the original GPU
catalogue claimed bare names like `fan` and `pcb`. A duplicate id fails the
tests, but only after you have written the geometry.

**Airflow is authored, not derived, and it is never a part.** A builder states
the path its build actually moves air along and hands it to `tools.airflow`;
nothing reads a fan's transform and blows air along its axis. It cannot:
`buildFan` contradicts itself about which face is the intake — the lit ring and
the finger guard are on +Y, documented as the intake face, while the builder's
own header says it blows along +Y — and the callers are split on which of those
they believed. Air that followed the geometry would leave the tower through the
front panel. The chevrons carry `contextFrame`, refuse raycasts outright, and
fade out over the first tenth of the disassembly, because a path through a
machine is a claim about a machine that is closed.

**Covers come off first.** A concept marked `opensFirst` — the glass and mesh
panels, the lid, the dust filters — finishes its travel in the first fifth of
the disassembly, before anything else starts to move. Without it the front
fans set off forward while the mesh in front of them was still shut, and went
through it. Anything that closes over other parts should carry the flag.

**Case openings are measured, not styled.** `buildChassis` is handed the rear
I/O window, the slot pitch, the supply's opening, the exhaust fan and the
processor-power grommet as numbers taken from the parts that need them, and
the I/O shield's holes are cut from the board's own connector positions,
which the motherboard builder records on its root as `userData.rearPorts`
before its meshes are merged. Move a connector and the shield follows it.

**Shine is contrast, not brightness.** High `envMapIntensity` and low roughness
on metals, restrained key light. Raising overall exposure washes everything to
chalk; that was tried and reverted.

**Emissive materials do not light anything.** RGB needs `glowMaterial` for the
surface _and_ a `PointLight` beside it.

**Nothing is downloaded at runtime.** Material maps are generated in
`surfaces.ts`, `pcb.ts` and `silicon-texture.ts`. If you find yourself reaching
for a texture file, you are solving it the wrong way.

**When a model is rebuilt, the scene clears its cached `layoutSignature`.**
Otherwise returning to a scale leaves every piece with an inventory position of
zero, heaped at the origin.

## The interface layer

`app/page.tsx` is composition and nothing else: it renders the panels in order
and wires them to `useExplorer` and `useLesson`. It holds only the state no
panel owns — whether the app is in explorer or comparison mode, whether the
search palette, course list and about dialog are open, and the part count the
viewer reports. It also reads the address once on arrival, so a link opens on
its own scale rather than building the tower first.

`app/use-explorer.ts` owns everything else about the current view and exposes it
as named moves rather than state patches. A panel calls `navigate`, `dive`,
`toggleCategory`, `isolate` or `hide`; it never assembles an `ExplorerState`
itself. State that only one panel cares about lives in that panel — which system
is unfolded is inside `systems-list.tsx`, whether the window is fullscreen is
inside `stage-tools.tsx`.

Three interaction decisions are settled, and re-opening them has been tried:

- **The dive is a zoom, not a scene change.** Clicking an explorable component
  scales the rest of the stage away while the camera closes on it, then swaps in
  the deeper scale, which grows back out of the same spot. The ramp is owned by
  `lib/scene.ts`, not by React timers — timers drifted against the render loop.
  `diveInto` is the whole record of a dive in flight, so cancelling one is just
  clearing it.
- **The detail panel is suppressed mid-dive.** `selected` is null while
  `diveInto` is set, or the outer component's panel flashes for a few hundred
  milliseconds before the deeper scale replaces it.
- **Glass is see-through to the cursor.** `resolvePick` steps past transparent
  surfaces. Before it existed, the side panel answered for the whole machine and
  nothing inside the case could be hovered.
- **Airflow is a preference, and its default belongs to the scale.**
  `state.airflow` is `auto`, `on` or `off`, and `airflowShown` resolves it.
  `auto` draws air wherever there are fans except on the assembled machine:
  that is the scale a viewer arrives at, the case is closed, nothing has moved
  yet, and four streams crossing an untouched tower is a lot to meet first.
  It is also the one scale where a viewer might never think to look for the
  control, which is why that control is a labelled switch beside the camera
  row rather than a glyph inside it. Saying either way holds on every scale
  until Reset, so returning to the tower having asked for air does not switch
  it off again. The switch is absent where there are no fans, and airflow
  follows the Cooling category — hide the fans and the arrows go with them.

## The School home and the catalogue

A bare `/` opens the School home: every subject in `lib/catalogue.ts`, with
its course and its exhibits. An exhibit is a doorway, not content. It names a
scale of the explorer or one of the labs, so the catalogue never duplicates
what they hold, and `tests/catalogue.test.ts` checks it against both. Two
subjects exist: **Computers** (the Computer Lab, the PC explorer, the Laptop
Lab, Build a PC, Task Manager and the learning path, with the _How a computer
works_ course) and **Inside the chip** (the five scales below a Zen 5 core,
with the course of the same name).

The home page draws no 3D, so a classroom of Chromebooks has something on
screen at once. The labs are loaded with `React.lazy` when opened, which keeps
them out of the first-paint bundle, and three.js add-ons (loaders, controls)
ride in the labs' chunks rather than in the shared `three` chunk.

Settled decisions:

- **The logo is home.** The brand in the explorer header and in the Computer
  Lab returns to the School home; Reset in the timeline still resets the stage.
- **A lab's Back returns to the hub it came from.** `page.tsx` keeps `hub`
  (`school` or `lab`), so a lab opened from the Computer Lab goes back there.
- **Inside the chip continues the explorer's dive** rather than starting a
  separate tree: the Zen 5 core concept opens `zen5core`, and each scale below
  opens the next. The core keeps AMD's counts; the ALU, adder, gate and
  transistor are teaching models whose accuracy notes say so. See SOURCES.md
  for what each cited document supports.

## Lessons and links

The school is a layer over the explorer, not a second app. A course is a list
of lessons, a lesson is a list of steps, and a step is some reading, a `Scene`
and optionally a check (`lib/lessons/types.ts`). A scene names a scale, a
disassembly amount, a part to select and whether to frame it; `showScene`
turns it into explorer state with the same clean slate navigation gives. A
lesson therefore cannot show anything the explorer does not already draw, and
`useLesson` moves the stage only through the explorer's `showScene` move.

Checks come in two kinds. **Find** asks the reader to click a part on the
stage; **choice** is multiple choice. Next stays shut until a check is
answered, and after two wrong answers the panel offers "Show me the answer",
which unlocks it, so nobody is stuck. The rules are pure functions in
`lib/lesson-run.ts`.

Settled decisions:

- **A find check's click is an answer, never a dive.** While one is open,
  `page.tsx` routes stage clicks to `choose(…, 'inspect')` and then to
  `lesson.pick`. The wrong part is still selected and described, so a wrong
  answer teaches what was clicked.
- **On a phone the detail panel waits to be asked.** It and the lesson card
  would share the bottom of the screen, and nearly every step selects a part.
  During a lesson below the 900 px breakpoint the panel opens only from the
  card's ⓘ button. The part stays selected and outlined on the stage.
- **Tower-level steps stay assembled.** Opening the tower even a quarter of the
  way shrinks it to fit, and a highlighted part becomes a speck. The glass is
  see-through, so the selection outline reads better on the closed machine.

**Writing lessons.** The first course, `how-a-computer-works.ts`, sets the house
style: short sentences, one idea per paragraph, every technical word explained
the first time it is used, and an everyday comparison where one helps (RAM as a
desk, storage as a filing cabinet). Numbers come from the catalogue entry of the
part on screen, or from a source listed in the step's `sources`; the sourcing
rules below apply to lesson text as much as to concepts. Every lesson ends with
a check.

`tests/lessons.test.ts` enforces the structure: unique, URL-safe ids; every
scene's scale exists; every selected part and every find answer lives at that
scale **and is drawn at that disassembly**, by building the model and applying
the scene's reveal rule; no find check pre-selects its own answer; every choice
has a valid answer; cited sources resolve. It does not check that the writing is
right. Read it aloud before you commit it.

**Progress** lives in `localStorage` under `pc-anatomy:progress:v1`. There are
no accounts. Every read and write tolerates a throwing or corrupt store, and
losing progress costs a reader nothing worse than seeing lessons as new.

**Links.** The address is a query string on `/`, so a static host needs no
single-page-app fallback for it:

```text
/                                   the School home
/?lab=laptop                        a lab: computer, laptop, build, task-manager, path
/?lesson=the-motherboard&step=3
/?scale=card&part=vapor&explode=60&focus=1&view=top&airflow=on
```

Because `/` is the School home, the untouched tower has an address of its own,
`/?scale=pc`.

`useAddress` writes it after the stage settles (never mid-dive or during Auto,
because browsers throttle history calls). A new scale or lesson step pushes a
history entry; anything finer — the slider, a selection, a camera view —
replaces the current one, so Back goes to the previous scale or step rather
than through every frame of a disassembly. `popstate` re-applies the address.
Reading is forgiving: an unknown scale, a part from another scale or a value
out of range is dropped, not refused, so an old link still opens something.

**Adding a lesson:** append it to a course file (or a new course file listed in
`courses` in `lib/lessons/index.ts`), run `npm test`, then take it in the
browser once, at desktop and phone widths.

## Same-category comparison mode

Comparison is a separate workbench; see
[`docs/comparison-mode-spec.md`](docs/comparison-mode-spec.md) for its contract.
Levels opt in through `comparisonGroup`, and configured groups appear once two
models opt in. The registry supplies labels and catalogue-backed row schemas;
pure transitions and startup validation reject invalid groups, pairs, or rows.

Its scene coordinator shares `stage-runtime.ts` and `model-stage.ts` with the
explorer. One camera and disassembly amount frame both models at true relative
scale. Wide screens use two scissored panes; below 700 CSS pixels only the
selected A/B pane renders. Swaps reuse both roots, replacements dispose only
one root, and exit disposes the renderer and both models.

## Adding a component

A component joins the written catalogue to selectable geometry through its id.

1. Add the concept to the right file in `lib/concepts/`. Follow a neighbour: it
   needs a unique `id`, scale, parent, category, representation type,
   description, purpose, quantity, specifications and source ids.
2. In that scale's builder, create the geometry and pass the same id to `add` or
   `instances`. The helper supplies selection identity, explode placement,
   inventory layout and counting.
3. Add any new reference to `lib/sources.ts` and document it in `SOURCES.md`,
   then regenerate the index:
   `node --experimental-strip-types scripts/generate-reference-index.mjs`.
4. If the concept lives in a new catalogue file, export its array and compose it
   into `lib/manifest.ts`.
5. Run the checks. The tests reject anonymous geometry, duplicate ids, broken
   parent links, and scales with nothing to render.

Do not introduce a reveal threshold for assembled geometry. A component that
exists in the assembled product exists at slider position zero and moves
continuously as the product comes apart.

## Adding a scale

Five integration points, and the tests check both directions of the link:

1. Add the id and its `LevelDef` to `lib/levels.ts` — parent, kind, concept,
   phases, navigation text, and `spread` if its assemblies are large.
2. Write the geometry builder and register it in the `builders` map in
   `lib/models.ts`.
3. Add its written catalogue under `lib/concepts/`.
4. Put `open: '<new-level-id>'` on the concept one scale up that leads into it.
   A complete alternative the machine does not carry sets `alternative: true`
   instead and is reached from its subsystem menu; `submenu` gives it a dropdown
   of its own inside that menu.
5. Export and compose the new concepts in `lib/manifest.ts`.

The scale tree drives navigation, breadcrumbs, lighting and the disassembly
timeline. Do not add a second hand-written route table.

## Sourcing rules

Every technical claim points at an entry in `lib/sources.ts`. Standards bodies
and vendor documentation first. All 367 concepts currently cite at least one
source, and `docs/component-references.md` is the generated index of which.

`concept()` fills in a default when an entry names no sources — `specs` for a
physical concept, `whitepaper` for a logical one. **This is a trap.** It once left
components across the machine silently citing NVIDIA for drive cages and CMOS
batteries.
Name your sources explicitly, and if no honest reference exists, say so with
`sources: []` rather than inheriting one. Sheet metal and fin stacks do not need
a vendor document, and inventing one is worse than admitting there is none.

`tests/manifest.test.ts` checks that every cited id resolves and that no concept
cites the same source twice. It does not check that a citation is appropriate.

Nothing here claims a specific product's bill of materials. Every physical
concept carries a `physicalAccuracy` string saying so, and they are not
decorative — read one before adding a component that implies more precision than
the model has. 231 concepts are physical, 136 are logical diagrams.

## Tests

135 tests in 21 files, all through Node's built-in runner. The files below are
the explorer's and the school's; the labs' own tests (`laptop`, `optiplex`,
`task-manager` and the rest) are described in their planning documents.

`.github/workflows/ci.yml` runs `npm ci`, type checking, a format check, linting, tests, and a
production build on every push and pull request with Node.js 22.

- `tests/imports.test.ts` (2) — every module under `lib/` loads under Node's
  type stripping, so a missing `.ts` extension fails here, and `lib/scene.ts`
  exports `createViewer`.
- `tests/manifest.test.ts` (16) — unique ids, reciprocal parents, no cycles,
  source resolution, SKU counts against full-chip capacity, search behaviour,
  reachability of every scale, the three-stage dissection language, inventory
  packing without overlap at several aspect ratios, machine depth.
- `tests/models.test.ts` (18) — geometry presence and identity for every scale,
  ATX outline compliance, clearances between sockets, slots and armour, fits
  (M.2 packages under their covers, DDR5 notches), picking through glass,
  instanced pieces staying pickable after the layout moves them, and the rule
  that no rendered object is anonymous.
- `tests/gpus.test.ts` (10) — the three-card menu structure, published hierarchy
  counts multiplying out to published totals, diagram blocks not overlapping,
  each card's published construction and envelope, board passives not
  intersecting, and search reaching the new chips at their own scale.
- `tests/airflow.test.ts` (8) — that the scales drawing airflow are exactly the
  ones `airflowLevels` names (the stage tools offer the control from that
  list), that the installed card brings its own streams into the tower, that
  the chevrons are scenery no ray can reach, that the explorer opens on a quiet
  machine while every other scale starts drawing, that the fade is monotonic
  and over by a tenth, that the chevrons march and stop on command, that no
  stream strays far from the hardware it describes, and that the tower's air
  enters at the front and leaves at the back.
- `tests/case.test.ts` (3) — that no case fan runs into the front mesh or
  its filter anywhere in the first half of the disassembly, that every rear
  connector can be seen from behind the machine through the I/O shield, and
  that the front I/O sits on the outside of the roof.
- `tests/catalogue.test.ts` (3) — subject and exhibit ids, every exhibit
  opening a real scale or lab, every lab reachable from the School home, and
  every course listed under exactly one subject.
- `tests/lessons.test.ts` (9) — course and lesson structure, answerable checks,
  real scales, parts and sources, every part a step shows or asks for being
  drawn at that step's disassembly, the Next/reveal rules, scenes arriving
  clean, addresses round-tripping and forgiving bad input, and progress
  surviving broken storage.
- `tests/comparison.test.ts` (6) — metadata-driven discovery, valid distinct
  state and group transitions, complete catalogue-backed spec rows, pane-local
  pointer coordinates at desktop and mobile widths, and common bounds that
  contain both posed models at assembled, half-disassembled, and inventory
  positions.

The suite builds every scale, so a geometry regression usually surfaces as a
failing assertion rather than a silent visual change.

## What is verified, and what is not

Keep this section honest; it is the part a newcomer will trust.

- `npm run check` and `npm test` run on any platform and are the baseline.
- `npm run lint`, `npm run format` and `npm run build` need a `node_modules`
  installed for the machine you are running them on. A cross-platform checkout
  cannot run them, and "lint passes" must not be reported from a machine that
  could not execute oxlint.
- **Real touch and pinch input is not verified**, nor is the full tablet and
  small-phone matrix, nor a clean console audit across every scale. Do not
  report those as passing.
- The lesson player was driven end to end in headless Chromium at 1440 × 900
  and at a 390 × 844 emulated phone: links, Next and Back, both kinds of check,
  the reveal, completion, saved progress and browser Back/Forward. Landscape
  phones and tablets were not.
- The School home, lab addresses, Back/Forward between home, labs and
  scales, the five Inside-the-chip scales and their lessons were checked the
  same way at 1280 × 800 and the emulated phone. The labs themselves were
  only opened, not exercised; their own classroom protocols are in
  `docs/planning/`.

If you automate a browser against this app:

- `page.click()` fails Playwright's stability check here even on provably still
  elements. Use `page.evaluate(el => el.click())`.
- `deviceScaleFactor: 1` is required, or screenshots time out under SwiftShader.
- `.viewport` carries `data-level`, `data-visible`, `data-component-types`,
  `data-explode`, `data-draw-calls` and `data-triangles` for assertions. Under
  software rendering they lag several seconds behind a level change — wait for
  them, do not poll tightly.
- The fastest way to a scale, a part or a lesson step is its address:
  `page.goto('/?scale=card&part=vapor&explode=60')` or
  `page.goto('/?lesson=meet-the-machine&step=9')`. Clicking `button.branch-head`
  then the entry in `.branch-scales` still works when the click path is what
  you are testing.

For UI work that is meant to change nothing visible, the strongest check is to
render the old and new trees and diff the markup: transpile with TypeScript's
`transpileModule`, stub `lib/scene.ts` with a fake `createViewer` that reports a
part count, mount both into jsdom, drive the same script of clicks through
`act`, and compare `document.body.innerHTML` at each step.

## Keeping this file honest

This document is only useful while it is true. When you change the scale tree,
move a module, or settle a decision the hard way, update the section that covers
it in the same change. If you are a model working on this repository, treat that
as part of the task rather than a follow-up.
