# 02 — BigChange PC Hardware Atlas Technical Requirements

Status: CURRENT ARCHITECTURE + RELEASE REQUIREMENTS.

## Platform
Static single-page web application.
React 19, strict TypeScript, Vite 8, Tailwind 4 and Three.js directly. Do not introduce react-three-fiber without an explicit architecture decision.
Minimum documented Node version: 22.13.

Entry path: index.html → app/main.tsx → app/page.tsx. The 3D engine is dynamically imported so the interface can paint before the Three.js chunk arrives.

## Core architecture
The detailed explorer uses four joined layers:
1. lib/levels.ts — scale hierarchy/navigation metadata.
2. lib/concepts + manifest — educational catalogue.
3. lib/models/builders — geometry tied to concepts.
4. shared Three.js runtime/scene + React application UI.

The globally unique concept ID is the join between catalogue, geometry, search, selection and detail. Navigation is application state rather than URL routing.

## 3D/content rules
Core PC Anatomy geometry is procedural TypeScript/Three.js.
Physical geometry uses documented millimetre conversion conventions.
Rendered instructional objects belong to concepts except explicit context scenery.
External school CAD assets must be pinned/reviewed, converted before runtime to local GLB, pass provenance/license/size/geometry gates, and retain a procedural fallback.
Student browsers must not depend on third-party model hosts at runtime.

## Hosting/deployment
Production output is dist/ and requires no backend.
GitHub Pages builds use Vite base /pc-anatomy/.
Deployment must include all static assets and any school models.
A configured base path is not proof of a successful deployment; the final URL requires a live smoke test.

## Quality commands
npm run check
npm run lint
npm test
npm run build

Repository documentation describes 61 Node tests covering catalogue integrity, geometry, GPU structures, airflow, case behavior and comparison behavior. CI runs dependency install, typecheck, lint, tests and production build on pushes/PRs.

## Browser/performance requirements
- Chromium-class browser with JavaScript/WebGL.
- Chromebook is a required classroom target.
- Responsive layouts should support phone/tablet, but real touch/pinch and the complete small-device matrix remain unverified until explicitly tested.
- Major 3D visual changes require browser/screenshot review in addition to automated tests.
- Do not claim lint/build from an environment unable to execute its platform-native binaries.

## Accessibility/classroom requirements
Controls used by beginners should have understandable labels/affordances.
English fallback must remain available.
Hebrew requires RTL-safe UI.
Tigrinya classroom content requires native-speaker review.
No student PII may be added to the public static bundle.

## Security
Dependency advisories are release-gate items. A feature PR may pass feature tests while the security audit remains open; those statuses must be reported separately.

## Integration boundaries
Current static explorer has no required backend/database integration. Future authentication, named student progress, teacher dashboards, payments or identity-linked analytics require a separate backend/security/privacy design before implementation.
