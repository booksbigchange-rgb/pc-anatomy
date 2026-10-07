# 05 — BigChange PC Hardware Atlas Data / Content Schema

Status: CURRENT-STATE SCHEMA. The application is presently static; this document does not invent a database.

## Data boundary
The current explorer does not require a server database or student account store. Educational content, hierarchy, source references and model relationships live in the repository and ship with the static application. If future work introduces student names, progress, assessment records or authentication, that data must receive a separate privacy/access design before implementation.

## Core entities
### LevelDef
Represents an exploration scale. Key relationships: id, parent scale, concept, physical/logical kind, phases, spread, menu/branch metadata, optional alternative/submenu/comparison metadata.

### Concept
Globally unique id joining educational content to geometry and interaction. A concept belongs to a scale and includes parent/category/representation information, description, purpose, quantity, specifications, accuracy statement and source IDs. IDs are global; duplicate IDs are invalid.

### Source
A citable reference keyed by source id. Technical claims should explicitly identify appropriate sources. Source existence can be tested automatically; appropriateness still requires human review.

### Geometry / Piece
Builders attach rendered objects to concept IDs. A Piece contains its object, base/exploded/inventory positions, concept identity, instance information and visibility. Rendered instructional hardware should not be anonymous.

### ExplorerState
Runtime-only viewing state: current level, disassembly amount, visible categories, hidden IDs, selection, isolation, camera view, airflow preference and revision counters. Navigation is state-driven rather than URL-route driven.

### Translation
Locale-specific interface/learning text keyed to stable application/concept identifiers. English is fallback. Current multilingual feature work adds Tigrinya and Hebrew/RTL. Translated acronyms should preserve recognizable technical terms where appropriate.

### ExternalModelAsset
School-lab CAD-derived asset with provenance, source blob/version, license review, dimensions, geometry/size gates, local output path and release status. Assets are converted before classroom runtime and served locally. A procedural fallback is required.

## Relationship summary
Level 1—N Concepts.
Concept parent/child relationships form the educational hierarchy.
Concept ID 1—N rendered Piece instances.
Concept N—N Sources through source IDs.
Concept 1—N locale translations where translations exist.
School lab component 0—1 approved external model asset, with procedural fallback.
ExplorerState references levels/concepts but is transient.

## Access and permissions
Current public static build: shipped catalogue/model data is readable by every visitor. There is no current student-private database in this schema.
Repository write access controls changes to canonical educational content and approved assets.
External assets may enter the classroom build only after provenance/license/geometry review.
Future student records MUST NOT be placed into this public static content path.

## Integrity rules
- Globally unique concept IDs.
- Parent links resolve and contain no cycles.
- Every explorable scale has geometry/content and remains reachable.
- Rendered instructional objects map to concepts except explicit context scenery.
- Referenced source IDs resolve.
- Physical accuracy statements must not imply unsupported product-level precision.
- Translation absence falls back safely to English.
- Asset provenance/license review is mandatory before release.
- No personally identifiable student data in public static bundles.

## Future-data gate
Before adding accounts, saved progress, quizzes tied to named students, teacher dashboards, payments, analytics tied to identity, or cloud synchronization, create a separate backend/security/privacy schema defining retention, roles, authorization, deletion and breach boundaries. This is a release blocker, not an optional cleanup task.
