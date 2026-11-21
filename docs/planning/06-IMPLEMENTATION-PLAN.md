# 06 — BigChange PC Hardware Atlas Implementation Plan

Status: ACTIVE PLAN. A milestone is not DONE until its stated gate is evidenced.

## Status vocabulary
PLANNED = requirement exists.
IMPLEMENTED = code exists.
VALIDATED = required checks passed in the relevant branch.
MERGED = validated change is in the school baseline.
DEPLOYED = merged baseline is verified at the intended public preview/production URL.
APPROVED = required human/classroom review is complete.

These words are not interchangeable.

## M0 — Baseline truth and stabilization
Deliverable: establish bigchange-school as the documented school baseline; record architecture, build commands, deployment base and known open risks.
Gate: repository state and docs agree; typecheck/tests/build evidence exists for baseline; deployment target is explicitly verified rather than inferred.
Status: PARTIAL.

## M1 — Visual Fidelity Phase 1: lighting/materials
Deliverable: improved lighting, tone mapping, shadows, material response and depth across explorer, OptiPlex assembly, Laptop Lab and Computer Lab.
Gate: automated checks + browser screenshots/flow review.
Status: VALIDATED ON OPEN PR #5; NOT MERGED. Security-audit advisories are separate open work.

## M2 — Visual Fidelity Phase 2: geometry realism
Deliverable: recognizable OptiPlex bezel/grille and sheet metal; improved motherboard components and cable routing; improved Latitude chassis/keyboard/surface/service details.
Gate: before/after screenshot review, no intersections/regressions, component picking and teardown still pass, Chromebook performance budget remains acceptable.
Status: PLANNED / OPEN.

## M3 — Interaction and assembly truth
Deliverable: selection, focus, isolate, hide, disassembly and school assembly exercises accurately communicate component ownership and installation/removal order. Where Build Your PC choices are intended to alter installed 3D hardware, that linkage must be verified end-to-end before being claimed.
Gate: automated interaction tests plus browser flow for major school exercises.
Status: PARTIAL; no blanket completion claim.

## M4 — Student learning layer
Deliverable: beginner explanations, guided tasks, whole-device Computer Lab, Laptop Lab and detailed explorer handoff; clear Student/Technical progression where present.
Gate: classroom-readable copy, no dead ends in primary flows, teacher review.
Status: PARTIAL / EXISTING FEATURES REQUIRE FORMAL FLOW SIGN-OFF.

## M5 — Multilingual foundation
Deliverable: English fallback, Eritrean Tigrinya, Hebrew, RTL behavior, translated search/detail learning text and terminology rules.
Gate: typecheck/lint/tests/build + browser review + native-speaker review of student-facing Tigrinya + Hebrew/RTL classroom check.
Status: VALIDATED AUTOMATION ON OPEN PR #4; HUMAN LANGUAGE APPROVAL AND MERGE REMAIN OPEN.

## M6 — Device/browser classroom QA
Deliverable: verified Chromebook classroom flow plus responsive tablet/phone behavior.
Gate: defined browser/device matrix; real touch/pinch test; clean-console audit across representative scales; performance acceptance on classroom-class hardware.
Status: OPEN. Repository architecture explicitly says real touch/pinch and full tablet/small-phone matrix are not verified.

## M7 — Security/dependency gate
Deliverable: review/remediate inherited dependency advisories without destabilizing the school build.
Gate: security audit passes or each remaining advisory has documented risk acceptance/mitigation.
Status: OPEN; PR #4/#5 report inherited advisories involving source-map-js and tinypool/oxfmt.

## M8 — Deployment/release
Deliverable: school baseline containing approved visual, multilingual and classroom work deployed at the intended GitHub Pages/public location.
Gate: correct base path, assets load, no white/404 page, primary flows smoke-tested from deployed URL, release commit recorded.
Status: NOT YET VERIFIED AS FINAL RELEASE.

## Sign-off rule
Every milestone receives explicit evidence and sign-off. Failed or unavailable checks are recorded as such; they are never converted to PASS. Open feature branches are not production. A successful automated test does not replace human visual/language/classroom review where the milestone requires it.
