# 03 — BigChange PC Hardware Atlas App Flow

Status: PRIMARY FLOWS MAPPED. Each release must verify that implemented UI still matches these flows.

## Flow A — Detailed PC exploration
Entry → PC Anatomy workbench → choose system/scale or click explorable hardware → hover/select → inspect detail → optionally focus/isolate/hide → move disassembly timeline or Auto → descend into supported deeper scale → use breadcrumb/scale navigation to return.

Success: student can reach a component, understand it and return without a dead end.
Failure handling: unsupported/non-explorable objects must not imply a deeper scale; rendering/context-loss errors must surface an error state rather than a blank unexplained stage.

## Flow B — Search
Open search → enter hardware term → matching concept → select result → application navigates to the appropriate scale/context → component/detail becomes reachable.

Success: search reaches the intended concept and preserves recognizable technical terms.
Multilingual rule: translated beginner text may assist matching, while English technical acronyms remain recognizable.

## Flow C — Disassembly
Open supported scale → slider at assembled state → drag slider or Auto → named phases progress → covers/obstructions move before dependent parts where required → inventory/exploded state → Reset returns to baseline.

Success: motion teaches removal/relationship rather than random scattering.

## Flow D — Component inspection controls
Select/right-click supported component → detail actions → Focus / Isolate / Hide as offered → stage updates → hidden component remains recoverable through the supported UI/reset/scale behavior.

Success: no action strands the student with no recovery path.

## Flow E — Computer Lab
School entry → Computer Lab → whole-desktop context → identify ports/connections → perform supported connection practice → hand off to deeper PC Anatomy learning where appropriate.

Success: beginner understands external device context before internal detail.

## Flow F — Laptop Lab
School entry → Laptop Lab → exterior/interior context → guided lesson/service mode → staged sequence: bottom cover → battery → SSD/Wi-Fi → RAM/speakers → cooling → CPU → motherboard → display/hinges → cable disconnect/reconnect where implemented → reset/return.

Success: dependencies and service order remain understandable; parts move as owned groups rather than duplicate exploded meshes.

## Flow G — Same-category comparison
Enter comparison workbench → choose supported comparison group/models A and B → view at common scale/disassembly amount → inspect catalogue-backed specification rows → swap/replace models → exit to explorer.

Responsive rule: wide layouts may show scissored A/B panes; narrow layouts use the active pane behavior defined by the comparison system.

## Flow H — Assembly/build learning
Enter assembly/build exercise → choose/identify component → determine target location/compatibility → install/remove through supported interaction → validation/feedback → continue or reset.

Critical truth rule: UI selection of a part is not equivalent to changing the installed 3D model. Any dynamic Build Your PC promise must be tested end-to-end before release wording claims it works.

## Flow I — Language selection
Open language selector → choose English/Tigrinya/Hebrew → interface/available learning text updates → missing content falls back safely to English → Hebrew uses RTL layout where required → navigation/selection state remains intact.

Approval rule: automated correctness does not constitute native-language classroom approval.

## Global error/recovery paths
- WebGL/context failure: show explicit error/retry guidance, not a silent white stage.
- Missing/unapproved external model: use approved procedural fallback.
- No search match: keep search recoverable and allow revised query.
- Hidden/isolated state confusion: Reset or scale navigation restores a known state.
- Deployment asset/base-path failure: release fails; do not accept a 404/white page as deployed.
- Invalid future private-data operation: must not be implemented in the static public-data path.
