# 3D Asset Intake Manifest

This file records assets before they are allowed into the student-facing build.

## Framework Laptop 13 — realistic exterior candidate

| Field | Value |
| --- | --- |
| Owner / creator | Framework Computer Inc. |
| Official repository | https://github.com/FrameworkComputer/Framework-Laptop-13 |
| Source file | `Framework Laptop 13 CAD.stp` |
| Pinned source commit | `e5bd4da7a14611935891c867dc40ae83ea8f6297` |
| Git blob SHA | `5222d190375f14f182363d80b84c4211375bee9b` |
| Source bytes | 21,301,844 |
| License | CC BY 4.0 |
| Intended use | Realistic Laptop Lab exterior geometry |
| Runtime networking | None; converted asset must be committed locally |
| Status | Approved and integrated in the student-facing Laptop Lab |

### Required conversion gates

1. Download only from the pinned official GitHub commit.
2. Convert STEP to a browser-friendly GLB in CI; no CAD parser ships to student browsers.
3. Apply neutral Big Change materials.
4. Keep the resulting GLB under 15 MB and approximately 150k triangles or fewer.
5. Verify sane physical bounds before accepting the output.
6. Check for visible trademarks/logos and remove or obscure them before release.
7. Retain creator, source, license and modification notice in project credits.
8. Keep procedural fallbacks for resilience if a local CAD-derived part cannot load.

### Derived open-laptop exterior shells

The same pinned official assembly is split in CI into three lightweight local GLBs used by the interactive open laptop:

- `framework-laptop-13-input-cover.glb` — 85,852 bytes, 4,280 faces; preserves the real keyboard and trackpad openings.
- `framework-laptop-13-display-bezel.glb` — 83,960 bytes, 4,158 faces; preserves the real display opening and lower camera/sensor cutouts.
- `framework-laptop-13-top-cover.glb` — 194,984 bytes, 9,706 faces; preserves the real formed display-shell geometry.

All three are derived from the already-approved `Framework Laptop 13 CAD.stp`, use neutral Big Change materials at runtime, are served locally, and make no third-party network requests.

### Attribution draft

> Framework Laptop 13 CAD © Framework Computer Inc., licensed under CC BY 4.0. Converted and optimized for the Big Change Computer Lab. Source: FrameworkComputer/Framework-Laptop-13.

This attribution is for the CAD-derived geometry only and does not imply endorsement by Framework Computer.


## Framework Laptop 13 battery — realistic internal asset

| Field | Value |
| --- | --- |
| Owner / creator | Framework Computer Inc. |
| Official repository | https://github.com/FrameworkComputer/Framework-Laptop-13 |
| Source file | `Battery/FWKNAQ9_G01_20210911.stp` |
| Git blob SHA | `16ce561192960c9aa0e8f0fdcd957482cd187042` |
| Source bytes | 11,516,814 |
| License | CC BY 4.0 |
| Converted GLB | 894,752 bytes |
| Output faces | 44,816 |
| Output vertices | 22,247 |
| Physical extents | 240.013 × 101.053 × 7.679 mm |
| Intended use | Realistic Laptop Lab internal battery |
| Runtime networking | None; asset is committed locally |
| Status | Approved for Realistic Laptop Internals V1 |

The converted battery uses neutral classroom materials and omits product artwork. Big Change modifies the source only for web conversion, optimization, orientation and materials.


## KiCad laptop board connectors — realistic internal detail

| Field | Value |
| --- | --- |
| Owner / creator | KiCad project / library contributors |
| Official repository | https://github.com/KiCad/kicad-packages3D |
| Pinned source commit | `b8b3cfdfad88ba66f21002b3de51dc6f7d55ba5a` |
| License | CC BY-SA 4.0 with KiCad library exception |
| Runtime networking | None; converted assets are committed locally |
| Status | Approved for Realistic Laptop Internals V1 |

Converted STEP models currently used:

- 10-pin JST GH battery connector — 30,868 bytes
- 4-pin JST GH fan/speaker connector — 16,308 bytes
- 41-pin Molex FFC/FPC display connector — 32,872 bytes
- 51-pin Molex FFC/FPC input-cover connector — 38,392 bytes
- 15-pin TE FFC/FPC audio connector — 19,584 bytes

All source files are downloaded from the pinned KiCad commit, converted in CI to neutral-material GLBs, and loaded locally in the Laptop Lab. The procedural connectors remain as runtime fallbacks if a converted asset is unavailable.


## Framework Laptop 13 service parts — teardown detail

| Field | Value |
| --- | --- |
| Owner / creator | Framework Computer Inc. |
| Official repository | https://github.com/FrameworkComputer/Framework-Laptop-13 |
| Pinned source commit | `9680262347b80efe2314673bf1f26eb955165fca` |
| License | CC BY 4.0 |
| Runtime networking | None; converted assets are committed locally |
| Status | Integrated into Laptop Anatomy teardown |

Converted local GLBs:

- Display assembly with cable bracket — 1,801,232 bytes, 89,822 faces
- Left hinge assembly — 270,440 bytes, 13,578 faces
- Right hinge assembly — 290,768 bytes, 14,592 faces
- Webcam module — 439,560 bytes, 21,831 faces

The parts are converted from the official STEP files to optimized neutral-material GLBs. The display/hinge/webcam assembly is kept mechanically grouped in Laptop Anatomy and separates late in the teardown rather than exploding randomly.


## Framework Laptop 13 mainboard mechanical outline

| Field | Value |
| --- | --- |
| Owner / creator | Framework Computer Inc. |
| Official repository | https://github.com/FrameworkComputer/Framework-Laptop-13 |
| Source file | `Mainboard/2D/fw_main_pcb_generic_2_w_fan_2.dxf` |
| Pinned source commit | `57a01b214c70c924dcd60006c7fd4d753e94e86f` |
| Git blob SHA | `4269a2ae1e934b397d9dd21f8d9044f199156dad` |
| License | CC BY 4.0 |
| Trace method | Closed LINE/ARC mechanical-view cycle |
| Source cycle | 166 edges / 537 flattened trace points |
| Mechanical bounds | 233.3 × 105.83 mm |
| Converted GLB | 22,228 bytes |
| Output geometry | 1,060 faces / 532 vertices |
| Runtime networking | None |
| Status | Approved for Laptop Anatomy motherboard outline |

The DXF contains multiple views, dimensions and annotation geometry. Big Change isolates the left mechanical view and traces the large closed LINE/ARC cycle rather than polygonizing the entire drawing sheet. The resulting silhouette is extruded to a representative 1.2 mm board thickness and replaces the procedural board shell when the local GLB loads successfully.
