# Big Change Computer Lab — implementation plan

This branch turns the PC Anatomy engine into a broader classroom computer lab while preserving the upstream MIT license and keeping the original 3-D hardware explorer intact.

## Product path

1. **Whole computer setup** — desktop, monitor, keyboard and mouse in one interactive scene.
2. **Ports and connections** — USB, HDMI/DisplayPort, Ethernet, audio and power.
3. **Laptop** — exterior controls first, then safe/licensed internal components.
4. **Guided lessons** — simple step-by-step classroom tours.
5. **PC assembly challenge** — place components in the correct order and location.
6. **Troubleshooting** — diagnose missing cables, missing parts, no-display and cooling problems.
7. **Assessment and progress** — short challenges, quiz items and local progress.

## Architecture rule

PC Anatomy remains the detailed internal-hardware engine. The new Computer Lab is a higher-level scene that students enter first. Selecting the system unit moves into the existing PC explorer rather than duplicating its internal hardware.

## Fast-path rules

- Prefer original procedural Three.js geometry for basic classroom peripherals.
- Import external 3-D assets only after license and provenance review.
- Reimplement useful interaction patterns natively instead of merging unrelated frameworks.
- Keep the school edition static-first: no accounts or backend are required for core learning.
- Preserve upstream license/credit and document any additional donor code or assets.

## Current milestone

### Milestone A — Whole Computer

- [x] Big Change school branch
- [x] Student / technical explanation mode
- [x] GitHub Pages preview
- [x] Whole-computer scene foundation
- [x] Procedural monitor, system unit, keyboard and mouse
- [x] Click-to-select learning cards
- [x] Enter the detailed PC explorer from the system unit
- [x] Add classroom-visible USB, HDMI, Ethernet and power targets to the desktop scene
- [x] Add keyboard, mouse and monitor cable connection feedback
- [ ] Add guided “Meet the Computer” lesson

### Milestone B — Connections

- [x] USB keyboard/mouse
- [x] HDMI monitor connection
- [x] Ethernet
- [x] Power
- [ ] Headphones/audio
- [x] Correct/incorrect port feedback

### Milestone C — Laptop

- [x] Use original procedural laptop geometry while external assets remain under review
- [x] Exterior: display, keyboard, trackpad, webcam and starter port geometry
- [x] Interior foundation: battery, motherboard, SSD, Wi-Fi, cooling and speakers
- [ ] Laptop-specific guided lesson and port connection activity

### Milestone D — Build and Troubleshoot

- [ ] Assembly state model
- [ ] Snap targets and placement validation
- [ ] Installation order
- [ ] Troubleshooting scenarios
- [ ] Assessment hooks
