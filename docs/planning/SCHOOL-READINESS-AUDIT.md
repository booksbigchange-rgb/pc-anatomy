# School Readiness Audit — Classroom Beta

Status: ACTIVE. This is an implementation gate, not a planning-completeness document.

## Current verdict
Suitable for teacher-supervised classroom beta. Not yet approved for independent school-wide production use.

## Gate 1 — Chromebook performance
Status: OPEN.
Evidence already present: static SPA, lazy-loaded viewer engine, local assets/fallbacks, WebGL acceleration warning.
Still required: test on at least one classroom-class Chromebook; record cold load, interaction responsiveness, assembly dragging, Laptop Lab teardown, comparison, repeated navigation, memory/GPU failures and console errors.
Pass condition: primary lesson flow remains usable without crashes, persistent blank canvas or interaction latency that prevents completion.

## Gate 2 — Accessibility
Status: PARTIAL / OPEN.
Positive evidence: labeled search/about/system controls, pressed/expanded states, labeled disassembly slider, dialog primitives, error alert in viewer, chart accessible label, keyboard shortcuts in explorer.
Gaps requiring verification/fixes:
- full keyboard-only walkthrough of every school lab;
- 3D selection has no proven non-pointer equivalent;
- focus order and focus visibility across all labs;
- screen-reader announcements for lesson/mission feedback;
- reduced-motion behavior for animated/pulsing/automatic 3D UI;
- contrast audit;
- accessible alternatives where precision dragging is required.
Pass condition: a student can complete required learning without depending exclusively on mouse precision, color or motion.

## Gate 3 — Student usability
Status: OPEN.
Test 5–10 students with no developer guidance on: connect desktop, find RAM, explain RAM, remove/inspect SSD, enter Build PC, correct one deliberate error, open Task Manager mission, return to Computer Lab.
Record completion, wrong turns, teacher interventions and confusing labels.
Pass condition: no repeated dead ends; core flow is discoverable without developer explanation.

## Gate 4 — Visual/geometry fidelity
Status: PARTIAL.
Lighting/material improvements exist on PR #5 but remain separate from geometry-fidelity completion.
Pass condition: recognizable OptiPlex and Latitude silhouettes/service features, no obvious assembly intersections, and browser visual review.

## Gate 5 — Language classroom review
Status: OPEN.
Automated multilingual work is not native-speaker approval.
Pass condition: native-speaker review of student-facing Tigrinya; Hebrew/RTL classroom review; fallback to English remains safe.

## Gate 6 — Security/dependencies
Status: OPEN.
CI includes npm audit at high severity plus typecheck, lint, tests and build. Known inherited audit findings remain release-gate items.
Pass condition: findings remediated or explicitly documented/risk-accepted.

## Gate 7 — Deployment
Status: OPEN.
Pass condition: approved work merged to the school baseline; production/GitHub Pages URL loads without 404/white screen; all static assets load; primary classroom flow smoke-tested from the deployed URL; release commit recorded.

## Release decision vocabulary
BETA = supervised classroom use permitted.
SCHOOL-READY = all seven gates pass with evidence.
Do not use SCHOOL-READY for a branch that merely builds or passes unit tests.
