# OptiPlex reference model candidate

Candidate branch: `optiplex-reference-model`. This is unfinished original geometry, not a verified Dell replica. Do not merge or call it a realistic model replacement until the visual comparison below passes.

## Source and scale

Dell OptiPlex 7040 Mini Tower owner manual:
https://dl.dell.com/topicspdf/optiplex-7040-desktop_owners-manual_en-us.pdf

Documented envelope: height 350 mm, width 154 mm, depth 274 mm. The model is laid on its right side for servicing; 60 mm equals one scene unit. Hardware positions and surface details are estimated from the reference, not measured CAD.

The catalog uses a sixth-generation Intel/LGA1151 and Q170 training configuration, one DDR4-2133 module, M.2 2280 storage, OEM 240 W PSU and an illustrative small PCIe card. No retail GPU compatibility or price estimate is asserted. Selected names carry into the practice scene. Cooling is a seventh practice step.

## Implemented candidate behavior

The picker contains a live Three.js model. Inspection supports a removable cover, front/rear/top views, selection, isolation and a selected-component exploded view. Practice preserves sequential dragging and returns misplaced or cancelled parts to the tray. Completing placement does not claim cable connection or a functional powered computer.

## Required verification

1. Implementation: type checking, lint, unit tests, production build and source review.
2. Behavior: `tests/browser/optiplex.mjs` exercises picker choices, cover/views, SSD explosion/isolation, unsuccessful placement, all seven drag installations, practice restart and picker reset. Its screenshots and result are uploaded by `optiplex-visual-check.yml`.
3. Appearance/delivery: manually compare the rendered candidate with the exact Mini Tower references, including front port positions, grille, rear connectors, PSU bay, board topology, chassis thickness and open drive cage. Review screenshots before merging. After deployment, verify the deployed commit and delivered browser result separately.

The Latitude 5410 replacement is not part of this candidate; existing Framework assets must not be renamed Dell.
