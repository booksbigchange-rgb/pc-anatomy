# Dell fit and inspection pass

Scope: Latitude 5410 RAM fit, OptiPlex 7040 front/rear framing, and phone inspection layout. These remain estimated teaching models, not manufacturer CAD.

## Completed

- DDR4 SODIMM board envelope: 69.6 x 30 x 1.2 mm. A real cutout replaces the solid rectangular edge; the illustrative socket key remains attached to the motherboard during removal.
- Memory sockets and retainers aligned to the module centers. Contacts remain simplified, not a literal 260-pin model.
- Front and rear tower camera views fit the whole case, including after viewport resizing.
- Phone parts and view controls sit above a dedicated 420px model viewport. Notes sit below it.
- Regression checks for notch ray hits, PCB size, fixed key ownership, camera corner visibility and phone panel overlap.

## Verification

Local type check, lint, 119 unit tests and production build passed. Browser review covered RAM focus/isolate/explode/reset, 18%, 60%, 78% and 100% teardown, plus desktop/phone front and rear views. No browser exceptions occurred. CI and live deployment are tracked separately in GitHub Actions.

## Next priorities

Exterior follow-up: aligned key rows across the keyboard well, widened modifier keys and separated the split-height arrows. Added inset key tops, a touchpad border, hinge barrels and the lower chassis seam. USB-C now has a rounded capsule shell; HDMI has a tapered shell; Ethernet has visible contacts. Connector contacts and the keyboard layout remain simplified illustrations. Existing socket picking and opposite-side occlusion tests pass; a new geometry test checks row alignment and the gaps between keycaps. Browser review checks keyboard/trackpad selection and both port views.

Follow-up cooling pass: replaced rectangular rotor blocks with curved centrifugal vanes, a formed intake casing with a real opening, and a visible side fin stack. Reduced cold-plate thickness and moved its mounting arms beside the CPU contact plate. Reduced repeated motherboard passive sizes and varied their bank counts; removed invented controller labels. Intake ray checks, chassis clearance and cooling-owner movement are covered by a regression test. Assembled, 18/60/78/100% teardown and tilted cooling inspection views were reviewed. These details remain original approximations, not measured Dell CAD.

1. Motherboard component grouping, scale and clearances; replace oversized repeated details with recognisable component shapes.
2. Cooling housing, CPU contact plate, speaker housings and cable routing, retaining the existing service layout and ownership.
3. Chassis seams, port housings and keyboard details.
4. Lighting and materials after physical fit is correct.

## Free asset audit

- [Framework official Laptop 13 CAD](https://github.com/FrameworkComputer/Framework-Laptop-13): CC BY 4.0; useful for a separate Framework model and real assembly references. It is not Dell geometry.
- [KiCad official component models](https://gitlab.com/kicad/libraries/kicad-packages3D): CC BY-SA with the library exception. Suitable matching generic connectors require attribution and fit checks.
- [Poly Haven circuit board](https://polyhaven.com/a/circuit_board): CC0. Useful reference/component details; the complete board does not match Dell.
- [MacBook Three.js example](https://github.com/AnubhavChaturvedi-GitHub/macbook-pro-threejs): no usable LICENSE file found in the inspected root; not imported.

No third-party mesh was imported in this pass. A free download alone does not establish reuse permission or accurate internals. RAM dimensions were checked against DDR4 SODIMM manufacturer data; the notch and contact depiction are illustrative.
