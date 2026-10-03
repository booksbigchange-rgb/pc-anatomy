# Visual review fixes

- Phone home: labelled wrapping activity buttons with independent accessible names.
- Phone laptop: parts list in its own scrolling row; model and camera buttons no longer underneath it.
- Laptop: fit the automatic camera to visible service geometry at each stage/viewport change; respect manual orbit. Camera fit no longer stops at the old maximum distance.
- Guided cables: labelled unplug controls update the same state and gates as cable clicks.
- Desktop: auto-frame isolated modules; explain how to reveal the SSD behind the drive cage.
- Older explorer: simplify the phone header to prevent byline/action collisions. Local startup reached 34 visible parts with no page errors. Software-rendered phone screenshot capture remained slow; real-device performance is not approved by this result.
- Motherboard: paired component banks, controller pins and illustrative silkscreen; slightly brighter environment and fill light.
- Logos: current decoded screenshots show the selected shield correctly; no artwork change needed.

Verification: 117 unit tests passed; laptop guided lesson, local explode/rotation, troubleshooting, quiz and external connections passed; desktop seven-part placement and power-on passed. New visual-priority browser checks cover phone labels/bounds and panel overlap, plus teardown captures and explorer startup. CI and live release evidence must be checked for the published commit.

These remain teaching models with estimated internal proportions, not measured manufacturer CAD. Physical device/touch and classroom pilot checks remain separate.
