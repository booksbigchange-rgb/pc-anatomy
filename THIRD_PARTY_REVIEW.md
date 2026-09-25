# Third-party and school-safety review

The school edition treats public GitHub availability as **insufficient permission to reuse**. Code and assets enter this repository only after license/provenance review.

## Approved foundation

### Yoosseph/pc-anatomy

- License: MIT.
- Role: upstream foundation.
- Usage: codebase and procedural Three.js hardware.
- Requirement: retain MIT notice and upstream attribution.

## Approved visual assets

### Skywolf Game Studios / CC0Tree — Computer Tower

- Source: https://github.com/SkywolfGameStudios/CC0Tree
- Asset: `Assets/SM_ComputerTower.fbx`
- License: CC0 1.0 Universal.
- Decision: **approved and integrated**.
- Usage: exterior system-unit shell in the Big Change Computer Lab.
- Integration: vendored into the repository as base64 so the classroom build makes no runtime request to a third-party host.
- Big Change keeps its own teaching ports, selection state, connection exercises and internal PC Anatomy explorer; the CC0 model is visual geometry only.

### MrEliptik / Office Low Poly Pack

- Source: https://mreliptik.itch.io/office-low-poly-pack
- License: CC0 1.0 Universal as stated by the author.
- Relevant assets: laptop, keyboard, mouse, monitor, ultrawide monitor, Mini PC, PC, speakers and desk props.
- Decision: **approved as a visual candidate**, but no file is copied until the original download is acquired directly from the author page and the included archive is inspected.
- Note: the author states the keyboard layout is not intended to be completely realistic, so any keyboard legends must be replaced or omitted for classroom accuracy.

### KayKit Furniture Bits

- Source: https://github.com/KayKit-Game-Assets/KayKit-Furniture-Bits-1.0
- License: CC0 1.0 Universal.
- Decision: **approved for optional classroom environment props**.
- Usage target: chairs, lamps and room dressing only; core computer teaching objects stay purpose-built so ports and interaction targets remain accurate.

### Poly Haven

- Source: https://polyhaven.com
- License: CC0 for its asset library.
- Decision: **approved for optional lighting/material resources** after individual asset-size review.
- Usage rule: prefer small, local files; do not add a runtime dependency on the Poly Haven API.

## Donor review

### Vincexodus/PCBUILD3R

- License: MIT.
- Decision: **interaction reference only for now**.
- Useful pattern: draggable 3-D parts with explicit snap targets and success feedback.
- Do not import:
  - Angular application architecture
  - backend/auth/session logic
  - user/order/review data models
  - database dumps
  - email service integration
  - third-party 3-D assets until each asset's provenance/license is independently verified
- Implementation rule: reproduce the small placement/snap concept natively in the Big Change Three.js architecture.

### PC Digital Twin

- Root license not confirmed during initial review.
- Decision: reference-only; no copied code or assets.

### macbook-pro-threejs

- Root license not confirmed during initial review.
- Decision: reference-only; no copied code or assets.

## Student privacy / network policy

The core learning experience must work without student accounts, email, payments or cloud databases.

The school branch does not intentionally require analytics for learning functionality. Any telemetry or third-party network service must be separately reviewed before school deployment.

## Asset rule

Every external model, texture, sound or image must record:

1. original source URL,
2. creator/owner,
3. license,
4. whether modification and redistribution are allowed,
5. required attribution,
6. where the asset is used in Big Change Computer Lab.

If any of those are unclear, the asset stays out of the repository.
