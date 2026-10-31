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

## Offline mode — paused (October 2026)

Offline mode was built and briefly published, then paused at the project owner's request.

- Browsers that installed it get a cleanup worker (`public/sw.js`) on their next visit. It deletes the lab's saved files and unregisters itself, without reloading open pages, so no work is lost. The app no longer registers a worker.
- The design is recorded in git history (commits "Let the lab work without internet after one visit" and "Check offline mode in the browser and on the live site") so it can be restored later: app shell saved on the first visit, 3D models saved on request, network-first pages, separate copies for the main lab and the school edition.

## Faster first load (October 2026)

A first visit to the main lab now downloads about 0.44 MB before the Computer Lab appears, down from about 2 MB.

- The header logo uses a 25 KB crop of the shield (`public/bigchange-logo-shield.png`, 132 × 144) instead of the 1.5 MB artwork sheet. The sheet stays in the repository unchanged and is no longer saved for offline use. The school edition already used its own small logo.
- The Laptop Lab, Build Your PC, Task Manager and the learning path load only when opened (Laptop Lab 55 KB, Build Your PC 18 KB compressed).

## Explore inside the PC — our own take-apart timeline (October 2026)

"Explore inside the PC" now opens the OptiPlex 7040 reference model (the same model as Build a PC) instead of the original PC Anatomy explorer, which was retired so the lab is one product.

- **Take apart.** A timeline under the model, in the style of the original explorer: **Auto** plays it, the named steps jump to a point, the slider scrubs, **Reset** puts the PC back together. The order follows a simplified service sequence: cover → drive cage → card → memory → SSD → cooler → CPU → power supply → motherboard. Retainers and cooler screws come undone before each part lifts out, then each part is laid on the bench in rows, clear of the case and of each other. The current step is named in plain words.
- **Our icons.** Browser-tab and home-screen icons now show the BigChange Academy shield (cropped from the supplied logo sheet) instead of PC Anatomy's chip icon. The school edition uses its own logo (the cap-and-laurel symbol alone for the small tab icons, where the words would be unreadable).
- **Retired.** The explorer screens, its procedural RTX/Ryzen/PSU catalogue, comparison mode, their tests (63 unit tests) and their unused packages were removed. The hardware guide page and pc-anatomy.com metadata went with them. Git history and Yoseph's repository keep all of it; the MIT notice and a credit stay (README, `LICENSE`, `THIRD_PARTY_REVIEW.md`).
- **Limits.** The order is a teaching sequence based on Dell's manual, not a repair guide. The socket lever, cables and screws other than the ones above are not animated. Playback speed was checked only in a software renderer in CI (3–5 frames a second), not on school computers.

Evidence: `tests/pc-teardown.test.ts` (no gaps in the timeline, service order, release before move, lift then place, bench layout on the table without overlaps) and `tests/browser/pc-teardown.mjs` (route from the Computer Lab, step names while scrubbing, step buttons, part selection while apart, reset, Auto and Pause, tools reset the timeline, practice still starts, back to the Computer Lab).
