# School Readiness Audit — Classroom Beta

Status: ACTIVE. This is an implementation gate, not a planning-completeness document.

## Current verdict
Suitable for teacher-supervised classroom beta. Not yet approved for independent school-wide production use.

## Gate 1 — Chromebook performance
Status: PARTIAL / PHYSICAL DEVICE TEST STILL REQUIRED.
Automated evidence: the Chromebook classroom smoke workflow passes at a 1366×768 classroom-style viewport with device scale factor 1 and reduced-motion enabled. It exercises Computer Lab loading, the keyboard-accessible connection path, Laptop Lab loading and connection practice, non-canvas laptop cable controls, the Build Your PC part picker, transfer into interactive installation and the non-drag seat-part control. The run also completes a production build and captures browser evidence.
Still required: test on at least one real classroom Chromebook; record cold load, interaction responsiveness, assembly dragging, Laptop Lab teardown, comparison, repeated navigation, memory/GPU failures and console errors.
Pass condition: primary lesson flow remains usable on real classroom hardware without crashes, persistent blank canvas or interaction latency that prevents completion.

## Gate 2 — Accessibility
Status: PARTIAL / VERIFYING.
Implemented evidence:
- global visible keyboard focus baseline;
- reduced-motion baseline for students who request it;
- main explorer concepts reachable through Systems and Search without clicking the 3D canvas;
- labeled disassembly slider and semantic camera/tool controls;
- Computer Lab connection challenge has a keyboard-accessible Connect highlighted port alternative;
- PC Build has a Seat part button as an alternative to precision dragging, plus button controls for orientation, retainers, cooling, cabling and power-on;
- Laptop Lab external connection practice has a keyboard-accessible Connect highlighted port alternative;
- Laptop teardown exposes keyboard-accessible battery/speaker/display cable controls at the correct teardown stages;
- Laptop troubleshooting exposes component-choice buttons, so the answer is not canvas-only;
- lesson/feedback regions already use live/semantic output in several activities.
Still required before PASS:
- end-to-end keyboard-only browser walkthrough of every required classroom activity;
- focus-order and screen-reader spot checks;
- contrast review at classroom brightness;
- verify no required task depends exclusively on color, mouse precision or motion.
Pass condition: a student can complete required learning without depending exclusively on mouse precision, color or motion.

## Gate 3 — Student usability
Status: OPEN / TEST PROTOCOL READY.
Human test protocol: docs/planning/CLASSROOM-USABILITY-TEST.md.
Test 5–10 students with no developer guidance on the core Computer Lab, PC explorer, Laptop Lab, Build PC and Task Manager flow. Record completion, wrong turns, teacher interventions and confusing labels.
Pass condition: the protocol's completion/intervention thresholds pass and no repeated dead ends remain.

## Gate 4 — Visual/geometry fidelity
Status: PARTIAL.
Lighting/material improvements exist on PR #5 but remain separate from geometry-fidelity completion.
Pass condition: recognizable OptiPlex and Latitude silhouettes/service features, no obvious assembly intersections, and browser visual review.

## Gate 5 — Language classroom review
Status: OPEN / REVIEW CHECKLIST READY.
Human review checklist: docs/planning/LANGUAGE-CLASSROOM-REVIEW.md.
Automated multilingual work is not native-speaker approval.
Pass condition: native/fluent review of student-facing Tigrinya; Hebrew/RTL classroom review; fallback to English remains safe.

## Gate 6 — Security/dependencies
Status: PASS ON SCHOOL-READINESS-BETA.
Evidence: the inherited development-dependency advisories were remediated on the beta branch. The refreshed dependency set uses oxfmt 0.72.0, tinypool 2.2.0 and source-map-js 1.2.2. The dependency-refresh validation run passed the high-severity audit, typecheck, lint, tests and production build.
Pass condition: findings remediated or explicitly documented/risk-accepted.

## Gate 7 — Deployment
Status: OPEN.
Pass condition: approved work merged to the school baseline; production/GitHub Pages URL loads without 404/white screen; all static assets load; primary classroom flow smoke-tested from the deployed URL; release commit recorded.

## Release decision vocabulary
BETA = supervised classroom use permitted.
SCHOOL-READY = all seven gates pass with evidence.
Do not use SCHOOL-READY for a branch that merely builds or passes unit tests.
