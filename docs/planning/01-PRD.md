# 01 — BigChange PC Hardware Atlas Product Requirements Document

Status: PLANNING BASELINE. This describes the intended school product and separates required outcomes from implementation status.

## Product
BigChange PC Hardware Atlas is an interactive 3D hardware-learning environment. It should let a student begin with recognizable whole devices, inspect components spatially, learn what they do, take systems apart, and progress toward installation/assembly understanding.

## Primary users
- Students learning computer hardware, including non-native English speakers.
- Teachers guiding classroom exercises.
- Chromebook users are a required classroom audience.

## Core student outcomes
A student should be able to:
1. Recognize a desktop/laptop and its major components.
2. Select a component and understand its name, purpose and basic specifications.
3. Focus, isolate/hide and inspect hardware without losing context.
4. Use staged disassembly/exploded views to understand removal order and relationships.
5. Move from whole-device school labs into deeper component scales.
6. Search for hardware and reach the correct learning context.
7. Compare supported same-category hardware where comparison is available.
8. Practice connection/assembly tasks where the school layer provides them.

## Required product areas
### Detailed PC explorer
3D desktop PC exploration, scale navigation, selection, detail, search, focus, isolate/hide, airflow where applicable, disassembly timeline and deeper subsystem exploration.

### Computer Lab
Whole-desktop context and connection practice before deeper component exploration.

### Laptop Lab
Exterior/interior learning, guided lesson and staged service teardown including cable/component dependencies.

### Assembly/build learning
Students should understand what fits where and how parts are installed. Any feature described as Build Your PC must not claim that chosen parts alter the installed 3D machine unless that linkage is verified end-to-end.

### Multilingual learning
English is the technical fallback. Planned school support includes Eritrean Tigrinya and Hebrew; Hebrew needs RTL behavior and Tigrinya student-facing wording requires native-speaker classroom review before approval.

## Non-goals/current boundaries
- The current product is not a student-record system.
- It does not require a backend merely to run the explorer.
- Procedural/educational geometry must not be described as photoreal CAD where it is not.
- Logical processor/GPU diagrams are educational architecture diagrams, not transistor/mask layouts.
- Named products are not claims of exact internal service schematics unless sources support that precision.

## Definition of done for a learning component
Where applicable, a component must render, be identifiable/selectable, preserve correct concept ownership, support the intended focus/isolate/disassembly behavior, show appropriate educational content/sources, avoid obvious physical conflicts, pass applicable automated checks, and survive required browser/classroom review.

## Product-level release criteria
The school release is not DONE until required milestone work is merged into the chosen school baseline, the intended deployment is reachable without white/404 failures, primary classroom flows are smoke-tested from the deployed build, required language review is complete, required device/browser QA is complete, and unresolved security advisories have either been remediated or explicitly risk-accepted.
