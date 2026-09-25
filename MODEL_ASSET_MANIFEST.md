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
| Status | Approved for conversion; not yet approved for student-facing release |

### Required conversion gates

1. Download only from the pinned official GitHub commit.
2. Convert STEP to a browser-friendly GLB in CI; no CAD parser ships to student browsers.
3. Apply neutral Big Change materials.
4. Keep the resulting GLB under 15 MB and approximately 150k triangles or fewer.
5. Verify sane physical bounds before accepting the output.
6. Check for visible trademarks/logos and remove or obscure them before release.
7. Retain creator, source, license and modification notice in project credits.
8. Keep the current procedural laptop as the fallback until the replacement passes visual review.

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
