# BigChange Academy Computer Lab — architecture

Read this before changing code. [README.md](README.md) explains what the lab is for; this file explains how it is built and what to watch for.

## What it is, technically

A static single-page app: React 19, strict TypeScript, Vite 8, Tailwind 4 and three.js used directly (no react-three-fiber). There is no backend and no routing; the page shows one lab at a time from a `mode` state in `app/page.tsx`. The Computer Lab opens first; every other lab is loaded on demand with `React.lazy`.

Entry: `index.html` → `app/main.tsx` (fonts, CSS) → `app/page.tsx`.

Until October 2026 this repository also contained the original PC Anatomy explorer by Yoseph (scale tree, catalogue, procedural RTX/Ryzen models, comparison mode). It was retired so the lab is one coherent product; the code is in git history before the retirement commit and in [Yoosseph/pc-anatomy](https://github.com/Yoosseph/pc-anatomy). Its MIT notice is kept in `LICENSE`.

## Where the code lives

| Path | Responsibility |
| --- | --- |
| `app/page.tsx` | Chooses the lab: `lab`, `inside`, `assembly`, `laptop`, `task-manager-*`, `course`. |
| `app/computer-lab.tsx` | Desk scene: OptiPlex tower, monitor, keyboard, mouse, cables, port practice (3D click and buttons share one check), Habesha touches. On-demand rendering. |
| `app/assembly-lab.tsx` | The OptiPlex 7040 reference model. Inspection mode (select, isolate, lift one part, board and case targets, **Take apart** timeline) and assembly practice (drag/seat, orient, retainers, paste, cooler screws, cables, simulated POST). Used by Explore inside the PC (`backLabel="Computer Lab"`) and by Build a PC. |
| `app/pc-teardown.ts` | Pure rules of the take-apart timeline: step windows on 0–100, service order, bench positions, part path (lift, then across), retainer release. Unit-tested. |
| `app/use-disassembly-playback.ts` | Shared Auto/Pause playback of a 0–100 value (11 %/s, reduced motion jumps to the end). Used by the PC and laptop timelines. Kept from the original explorer. |
| `app/build-session.ts` | Pure build rules: install order, prerequisites, drops, orientation, POST problems, scoring. |
| `app/build-pc-lab.tsx` | Parts picker and compatibility checks before assembly. |
| `app/hardware-practice.ts`, `app/pc-power-challenge.ts`, `app/fault-practice.tsx` | Part jobs, retainers, cable rules, troubleshooting cases. |
| `lib/optiplex-7040.ts` | OptiPlex 7040 reference geometry: chassis, cover, drive cage, every part, mounts, retainer and cooler-screw poses, fan rotors. |
| `lib/inspection-camera.ts` | Fits the camera to a bounding box. |
| `lib/pcb-artwork.ts` | Shared circuit-board surface detail. |
| `app/laptop-*.ts(x)`, `app/latitude-5410.ts` | Laptop lab, Latitude 5410 reference geometry, teardown, lessons, troubleshooting. |
| `app/task-manager-*` | Task Manager practice. |
| `app/course-*`, `app/coffee-lesson.ts`, `app/student-progress.ts` | Learning path, assessment and progress kept in `localStorage`. |
| `app/habesha.tsx/.css` | Tigrinya welcome, Ge'ez font, tibeb patterns. |
| `app/base.css` | Page base: colours, resets, focus ring, reduced motion (kept from the original explorer). |
| `public/models/` | Reviewed laptop GLBs converted in CI (see `MODEL_ASSET_MANIFEST.md`). |
| `public/sw.js` | Clean-up worker only: removes the paused offline cache from browsers that installed it. |

## The take-apart timeline

One value, 0–100, drives the inspection model. `TEARDOWN` in `app/pc-teardown.ts` gives each step a window:

`cover 0–8 → drive cage 8–15 → card 15–26 → memory 26–36 → SSD 36–46 → cooler 46–58 → CPU 58–68 → power supply 68–80 → motherboard 80–100`.

In the first quarter of a part's window its retainer or screws come undone (RAM clips, card bracket, SSD screw, cooler screws) through the same `setHardwareRetainers` / `setCoolerScrews` poses used in assembly practice. Then the part lifts straight up to `LIFT_HEIGHT` and moves across to its `BENCH` spot on the table. A unit test checks that every bench spot rests on the table and that no two parts, or a part and the case, overlap.

Starting the timeline lays the PC on its side and frames the bench. Tools that work on the assembled PC (tower view, cover, drive cage, Reveal CPU, Explode/Isolate selected, assembly practice) reset the timeline first.

## Conventions that matter

- **Tests import `.ts` with explicit extensions.** `npm test` uses Node's type stripping: no path aliases, no extensionless imports, anywhere a test reaches.
- **Render on demand.** The 3D scenes redraw only when something changed (a `dirty` flag, camera movement, an animation). Slow school computers and CI runners depend on this.
- **Honest labels.** The Dell models are reference models. Say what is estimated or illustrative in the UI and docs (`AGENTS.md`).
- **Line endings.** `app/globals.css` uses CRLF; keep it when editing.

## Tests

- `tests/*.test.ts` — unit tests for the pure modules (build rules, teardown, course, laptop, Task Manager, models).
- `tests/browser/*.mjs` — Playwright suites against a preview or the live site: `desk-setup`, `pc-teardown`, `build-pc`, `optiplex`, `dell-fit`, `latitude`, `learning-polish`, `course`, `visual-priorities`.
- `.github/workflows/pages.yml` builds both editions, deploys them, then runs the browser suites against the live URLs and reports each as an annotation.

Not verified automatically: classroom use on real school devices, playback speed on real GPUs (CI uses a software renderer), and teacher approval of visual accuracy and the Tigrinya text. See `docs/student-pilot.md`.
