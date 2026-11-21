# OptiPlex reference model candidate

Candidate branch: `optiplex-reference-model`. This is original reference-based teaching geometry, with estimated interior dimensions and an illustrative graphics card. It is not measured Dell CAD. Inspect the exact rendered commit before publishing.

## Source and scale

Dell OptiPlex 7040 Mini Tower owner manual:
https://dl.dell.com/topicspdf/optiplex-7040-desktop_owners-manual_en-us.pdf

Documented envelope: height 350 mm, width 154 mm, depth 274 mm. The model is laid on its right side for servicing; 60 mm equals one scene unit. Hardware positions and surface details are estimated from the reference, not measured CAD.

The catalog uses a sixth-generation Intel/LGA1151 and Q170 training configuration, one DDR4-2133 module, M.2 2280 storage, OEM 240 W PSU and an illustrative small PCIe card. No retail GPU compatibility or price estimate is asserted. Selected names carry into the practice scene. Cooling is a seventh practice step.

## Implemented candidate behavior

The picker contains a live Three.js model. Inspection supports a removable cover, independently hinged drive cage, front/rear/top views, selection, isolation and a selected-component exploded view. The cage automatically closes under the side cover and stays open during practice. Metal surfaces occlude direct component picking. Practice preserves sequential dragging and returns misplaced or cancelled parts to the tray. Completing placement does not claim cable connection or a functional powered computer.

## Required verification

1. Implementation: type checking, lint, unit tests, production build and source review.
2. Behavior: `tests/browser/optiplex.mjs` exercises picker choices, cover/views, drive cage open/close, blocked selection through closed metal, SSD explosion/isolation, unsuccessful placement, all seven drag installations, practice restart and picker reset. Its screenshots and result are uploaded by `optiplex-visual-check.yml`.
3. Appearance/delivery: manually compare the rendered candidate with the exact Mini Tower references, including front port positions, grille, rear connectors, PSU bay, board topology, chassis thickness and open drive cage. Review screenshots before merging. After deployment, verify the deployed commit and delivered browser result separately.

The Latitude 5410 replacement is not part of this candidate; existing Framework assets must not be renamed Dell.

## Reference review corrections

The first rendered study placed the PSU at the top, which failed comparison with the manual. The corrected candidate moves the PSU to the lower rear, raises the board and related mounts, and replaces the solid front grille field with an open geometric lattice. The front drive door now has stamped panels, folded cage sides, an optical assembly, blue tool-free caddy rails and release tabs, and a long-edge hinge. The rear now uses a continuous formed sheet with through openings, a CPU grille, an I/O shield and detailed socket contacts, expansion brackets and a fitted PSU bay. Exterior skins use a matte black finish. Curved fan blades replace straight blocks. Rear port order was checked against Dell’s Mini Tower quick-start guide, including HDMI, DisplayPort, serial, PS/2, four USB 3.0, two USB 2.0, Ethernet and line-out. Optional VGA is not fitted in this configuration.

The reference comparison used Dell’s own Mini Tower manual, retrieved from its Origin Storage mirror when dl.dell.com returned 403. In that revision, cover/bezel drawings are on pages 8–10, PSU on pages 18–19, and board topology on page 28.

Inspection now starts upright and offers Service view for the bench orientation. Rendering updates when hardware, cover, selection or camera changes, rather than continuously repainting an idle scene; static surfaces remain batched by material.


Additional Dell reference: https://dl.dell.com/manuals/all-products/esuprt_desktop/esuprt_optiplex_desktop/optiplex-7040-desktop_setup%20guide_ar-ae.pdf (page 2 rear/front port map).
