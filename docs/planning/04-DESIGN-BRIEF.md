# 04 — BigChange PC Hardware Atlas Design Brief

Status: BASELINE APPROVED FOR PLANNING. This document distinguishes implemented visuals from the target quality bar.

## Audience and design objective
The school experience is for students learning computer hardware, including non-native English speakers and Chromebook users. The interface must make hardware recognizable before asking students to read technical detail. Visual hierarchy must support whole-device context, component selection, disassembly, isolation, comparison, and guided lessons.

## Existing visual system to preserve
- Dark 3D workbench with the hardware as the dominant visual object.
- Direct Three.js rendering with shared stage/runtime.
- Consistent selection identity through concept IDs.
- Desktop explorer, Computer Lab, Laptop Lab and comparison workbench remain visually related.
- Physical scales use hardware-style lighting; logical chip scales use flatter diagram lighting.
- Airflow is contextual scenery rather than selectable geometry.
- School CAD assets must remain local/audited and have procedural fallbacks.

## Target quality bar
### A. Geometry fidelity
A student should identify the device/component from silhouette and major physical features before reading its label. OptiPlex work must prioritize front bezel/grille, chassis sheet metal, motherboard component shapes, slots/connectors, cable routing and realistic fit. Latitude work must prioritize chassis, keyboard, hinges, service layout and surface detail.

### B. Materials and lighting
Metal, PCB, plastic, glass, rubber and gold contacts must read as different materials without overexposure. Lighting should improve depth and edge separation, not wash surfaces out. Reflections and shadows must remain performant on school hardware.

### C. Interaction clarity
Selected, hovered, isolated and hidden states must be visually distinguishable. Exploded motion must communicate how a part is removed rather than simply scatter objects. Covers leave first where they physically obstruct service.

### D. Classroom readability
Important controls need text/icon affordances rather than unexplained glyphs. Beginner learning text must be short and scannable. English remains the technical fallback. Hebrew requires correct RTL behavior. Tigrinya student-facing language requires native-speaker classroom review before it is considered approved.

### E. Responsive/performance
Desktop is the primary authoring/reference layout. Chromebook is a required classroom target. Phone/tablet layouts must remain usable, but real touch/pinch and the complete small-device matrix are NOT currently verified and must not be marked passed.

## Visual acceptance gates
1. Recognizable silhouette and major service features.
2. No obvious part intersections in assembled or teardown states.
3. Correct component ownership/picking.
4. Selection/isolation/explode states remain understandable.
5. Text and controls remain legible at classroom Chromebook widths.
6. No material/lighting change may silently break interaction.
7. Screenshots/browser review required for major visual changes.
8. Lighting/material pass and geometry-fidelity pass are signed off separately.

## Current status
PR #5 reports successful typecheck, lint, tests, production build and browser/visual verification for its lighting/material work. It remains open and does not complete the geometry-fidelity target. Therefore Visual Fidelity Phase 1 may be treated as validated on its feature branch; Visual Fidelity Phase 2 remains open.
