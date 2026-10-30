# Version 1 finish line

Complete beginner hardware learning release. Preserve the existing desktop, laptop, assembly, Task Manager and troubleshooting activities.

Priority order:

1. Clear course navigation, honest saved learning results, final assessment and review feedback.
2. Practical hardware data-flow and operating-system basics using lightweight simulations.
3. Phone and keyboard access, storage failure handling, and regression coverage.
4. Build, CI, Pages and visual checks of the exact public version.

Release limits: interior geometry is estimated; no real OS is installed; no real device telemetry or repair certification. Actual student-device and classroom acceptance remain external checks documented in student-pilot.md. These cannot be replaced by automated tests.

Scope excludes measured CAD remodelling, account systems, teacher dashboards, paid services, exhaustive OS simulation and physical insertion force.

## Delivered learning scope

- Six-step learning path links existing labs, saved PC/Task Manager results and the latest laptop quiz score.
- Five-step photo route practises storage, RAM, CPU processing, saving and power-off behavior.
- Virtual OS practice manages one note through sign-in, app editing, saved storage, shutdown, reopening, deletion and restoration.
- Eight-question assessment records first answers, gives explanations, shows mistakes and allows a fresh attempt.
- Results export as JSON without student names. Storage errors are shown; clearing browser data removes local results.
- Results and final answers resume. Live assembly position, laptop guide position and the virtual OS desktop do not resume.

## Acceptance evidence

Automated course tests cover OS startup gates, saved-versus-unsaved data, delete/restore, malformed progress, unavailable storage, assessment scoring, browser persistence, export, keyboard and phone layout. Existing hardware regressions remain required on the published commit. Classroom pilot and teacher visual accuracy approval remain uncollected.

## Version 1.1 — feels real (October 2026)

Goal: the first screen and the build practice should look and behave like real equipment, without claiming exact Dell geometry.

Delivered:

- **Desk setup.** The system unit is the same OptiPlex 7040 reference tower used in Build Your PC, upright and scaled to the desk. Port targets sit on its own front USB and rear HDMI and Ethernet connectors; the power inlet is low on the rear, where the power supply sits. The embedded CC0 low-poly tower was removed. The monitor shows a desktop when it has a signal and "No signal" with an amber power light until HDMI and power are connected. Dark keycaps, wood-grain desk, whiteboard, skirting, room reflections, and cables in real colours with moulded plugs.
- **Connections without a mouse.** The port list is now buttons that run the same checks as a 3D click.
- **Build Your PC motion.** Seated parts glide from the tray in a short arc into their socket. RAM clips and the card bracket swing closed and the SSD screw turns as it drives down. At power-on the fans spin up (and coast down at shutdown) and the case power button lights. Opening the case while the PC is on is refused.
- **Start-up screen.** Test power-on shows a simulated POST screen line by line: CPU, memory, storage, CPU fan and display. A failed check stops at the failing line with a plain-English reason.

Evidence: `tests/browser/desk-setup.mjs` (room, honest model note, 3D and button connections, completion, reset) and `tests/browser/build-pc.mjs` (now also: POST screen on pass and fail, fans spinning while on, cover refused while on). Both run against the live preview after each deploy.

Limits: fans, retainers and the POST screen are teaching animations, not timing or electrical simulation. No real operating system starts.

Update (October 2026): the power-supply fan now spins with the others at power-on, and each cooler corner screw drives down and turns as its corner is fastened (order 1 → 3 → 2 → 4 still enforced). `tests/optiplex.test.ts` checks the four separate screws and both fan rotors.

## Habesha touches (October 2026)

Chosen with the project owner: Tigrinya for Ge'ez text, tibeb patterns, coffee-ceremony objects and a welcome sign. English stays the teaching language.

- **Welcome:** "እንቋዕ ብደሓን መጻእኩም · Welcome" opens the Computer Lab panel and is written on the classroom whiteboard, beside a teacher's sketch of keyboard → CPU → screen. Text is marked `lang="ti"`. The open-licence Noto Sans Ethiopic font is bundled; the board repaints once it loads so it never shows empty boxes.
- **Tibeb:** a woven-border band (cream cloth, indigo edges, red and green diamonds, gold crosses) under the top bar of every lab, and a tibeb runner along the back of the desk.
- **Coffee ceremony:** a clay jebena on a woven ring and six sini cups on a wooden rekebot tray beside the keyboard; a banded woven mesob stands in front of the desk. These are decoration only and cannot be selected.
- **Other fix found on the way:** the system unit now stands on the desk top instead of sinking into it.

Review needed: a Tigrinya-speaking teacher should confirm the welcome wording and spelling before classroom use. No flags or national symbols are used, so the room fits both Eritrean and Ethiopian learners.

Evidence: `tests/browser/desk-setup.mjs` also checks the Tigrinya welcome, its language tag, that the Ge'ez font loads and that the tibeb band is drawn.

## Coffee ceremony lesson (October 2026)

"My learning path" has a seventh activity, **Coffee ceremony computer**. Students follow six ceremony steps and match each to the computer part that does the same job: green beans → input, roasting → CPU, grinding → CPU (many small steps), brewing in the jebena → RAM, serving the sini cups → output, keeping beans in a jar → SSD (storage). A wrong choice gives a hint; a right one explains the comparison. Finishing records a result on the learning path (now 7 results).

Wording: English, with jebena and sini, which Tigrinya and Amharic speakers share. Round names such as abol are left out because they differ between languages. The lesson says plainly that it is a comparison to help remember, not an exact model.

Evidence: `tests/coffee-lesson.test.ts` (answers, coverage of input/CPU/RAM/output/storage, feedback) and the course browser check (wrong answer, all six steps, result kept after reload).

## Offline mode (October 2026)

The lab works without internet after one visit, for schools with weak or no connection.

- **Saved automatically on the first visit:** the app itself (code, styles, fonts, icons, the no-JavaScript guide), about 4 MB. The Computer Lab, Build Your PC, Task Manager and the lessons then open offline.
- **Saved on request:** "Save all labs for offline use" in the Computer Lab panel downloads every 3D laptop model and the school intro video (about 14 MB) with progress. Models opened online are also kept as they are used.
- Pages always try the network first, so a new release appears when online; the saved copy is used only when the network fails. Each release replaces the saved app; models are refreshed in the background.
- The main lab and the school edition keep separate saved copies and do not interfere.
- Learning progress was already stored in the browser and is unchanged.

How it works: `public/sw.js` (service worker) and a build step in `vite.config.ts` that writes `offline-manifest.json` (app files, model pack and its size). Only the published build registers the worker.

Evidence: `tests/browser/offline.mjs` saves everything, switches the browser fully offline, and checks the lab, Build Your PC and every Laptop Lab model load with no errors. It runs against the live site after each release.

Limits: a browser must visit once with internet; clearing browser data removes the saved copy; very old browsers without service workers still need internet.
