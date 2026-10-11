# Multilingual Foundation Plan

## Goal

Add multilingual teaching support to PC Anatomy without changing the 3D model architecture.

Initial language plan:

- English — default and fallback
- Eritrean Tigrinya — first translated teaching language
- Hebrew — optional additional language with right-to-left UI support

## Current content inventory

The app currently has roughly 164 hardware/architecture concepts across the concept manifests, plus user-facing interface strings in the React UI.

Translation work must cover two layers:

1. **Interface text** — buttons, search, labels, actions, dialogs, navigation.
2. **Learning content** — component name, short name, description, purpose, quantity, specification labels/values, physical-accuracy notes, category names, level names, and beginner explanations.

## Translation policy

- Keep standard hardware abbreviations visible: CPU, GPU, RAM, SSD, NVMe, PSU, PCIe, HDMI, USB.
- Translate the explanation, not the industry-standard acronym.
- Prefer simple classroom language over literal word-for-word translation.
- English remains available beside translated terminology where useful.
- Eritrean Tigrinya content should be reviewed for natural classroom wording before release.
- Hebrew uses right-to-left layout; English and Tigrinya remain left-to-right.
- Missing translations always fall back to English.

## Suggested teaching pattern

Each selected component should eventually support:

- Standard term
- Simple explanation
- What it does
- Why it matters
- Everyday analogy
- Optional deeper technical explanation
- Optional audio/read-aloud

Example structure:

CPU
- Standard term: CPU
- Simple explanation: beginner-friendly explanation in the selected language
- Why it matters: connects the part to a task the student already understands

## Implementation stages

### Phase 1 — foundation
- Add locale metadata and direction support.
- Centralize interface strings.
- Add English fallback.
- Add language switcher.
- Preserve current behavior and URLs.

### Phase 2 — component content
- Move concept teaching text into locale-aware content records.
- Translate the highest-value beginner components first:
  CPU, GPU, RAM, motherboard, SSD/NVMe, PSU, cooling, case, ports.
- Add translation-completeness checks.

### Phase 3 — classroom layer
- Add Simple / Learn More modes.
- Add analogy and “why it matters” fields.
- Add multilingual quizzes and guided lessons.
- Add optional read-aloud/audio where practical.

### Phase 4 — Hebrew / RTL hardening
- Verify mirrored layout where appropriate.
- Keep 3D controls and technical diagrams spatially consistent.
- Test mixed Hebrew + Latin acronyms.

## Validation rules

Before merging a language release:

- Build passes.
- Existing 3D interactions are unchanged.
- Every visible UI key has an English value.
- Missing translated keys fall back to English.
- Tigrinya glyphs render correctly.
- Hebrew layout switches to RTL without breaking the viewer.
- Technical acronyms remain recognizable.
- Search can match both English technical terms and translated teaching terms.

## Content priority

Translate in this order:

1. Top bar, search, system visibility, detail panel actions.
2. PC-level beginner components.
3. Motherboard + storage.
4. CPU + cooling.
5. GPU.
6. Deep GPU/silicon architecture.

This keeps the first multilingual release useful to beginner students without waiting for all deep technical content to be translated.
