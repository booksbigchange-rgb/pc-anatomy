# Latitude 5410 teaching model

The Laptop Lab defaults to an original Latitude 5410 reference model. Framework Laptop 13 remains a separate selectable model with its existing licensed CAD and attribution. Dell mode does not load Framework or service-realistic GLBs.

## Reference and fidelity

Exterior dimensions: 323.05 × 216 mm, 21.18 mm rear height; 14-inch 16:9 screen. Scale: 40 mm per scene unit. The service scene represents the underside of a 68 Wh configuration, with two populated SODIMMs. Its component contours, positions, PCB details, and materials are estimated teaching geometry, not manufacturer CAD or manufacturing measurements. The staged teardown is an educational layout, not a substitute for Dell's service procedure.

Primary references:

- [Dell Latitude 5410 service manual](https://dl.dell.com/content/manual18434818-latitude-5410-service-manual.pdf?language=en-us): base cover, eight captive screws, battery disconnect, memory, storage, cooling, and system board service.
- [Dell CRU teardown guide](https://www.dell.com/support/kbdoc/en-us/000133667/latitude-5410-teardown-removal-guide-for-customer-replaceable-units-crus), including battery and cooling illustrations at supportkb.dell.com.
- Dell Latitude 5410 Setup and Specifications: dimensions and left/right port maps.

Observed configuration details were cross-checked against [LaptopMedia's original 68 Wh teardown photography](https://laptopmedia.com/highlights/inside-dell-latitude-14-5410-disassembly-and-upgrade-options/). Keyboard/pointing-stick/button layout was compared against published product imagery. Reference imagery is used for review only and is not bundled into the application.

## Preserved behavior

Exterior/closed/service views; left/right/top/reset camera presets; guided service sequence; three cable disconnection gates; staged teardown and reset; visible-port picking with chassis occlusion; SSD, RAM, and Wi-Fi local extraction; selection, focus, isolation; four external connection exercises; troubleshooting; knowledge assessment; Task Manager.

The CPU is soldered to and moves with the system board. It is never registered as a removable teardown part. DIMM sockets, M.2 connectors, and mounts remain on the board during local module extraction. Framework asset replacements are disabled in Dell mode. The existing guided cable click restriction was corrected so guided cable gates can actually be completed.

## Verification

Run `npm test`, `npm run check`, `npm run lint`, and `npm run build`. `tests/latitude.test.ts` checks chassis envelope, port sides, soldered CPU ownership, and local upgrade independence. `tests/browser/latitude.mjs` exercises the actual application in Chromium and saves screenshots and results. Candidate and live workflows use the same browser script. Live verification also checks `version.json` against the deployed commit and runs the existing OptiPlex interaction test.
