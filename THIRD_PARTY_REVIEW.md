# Third-party and school-safety review

The school edition treats public GitHub availability as **insufficient permission to reuse**. Code and assets enter this repository only after license/provenance review.

## Approved foundation

### Yoosseph/pc-anatomy

- License: MIT.
- Role: upstream foundation.
- Usage: codebase and procedural Three.js hardware.
- Requirement: retain MIT notice and upstream attribution.

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
