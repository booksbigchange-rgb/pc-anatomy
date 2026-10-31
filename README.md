# BigChange Academy Computer Lab

A browser-based computer hardware lab for beginner students. Everything runs in the browser with three.js; there is no backend and no account.

- **Live (original lab):** https://booksbigchange-rgb.github.io/pc-anatomy/
- **Live (school edition):** https://booksbigchange-rgb.github.io/pc-anatomy/school/

## What students can do

- **Computer Lab (desk setup).** Connect a keyboard, mouse, monitor, network and power to an OptiPlex 7040 reference tower, by clicking the ports in 3D or with the port buttons.
- **Explore inside the PC.** Inspect the OptiPlex 7040 reference model: select parts, isolate or lift one out, explore the motherboard sockets and case ports, and use **Take apart** — press **Auto** or drag the timeline to remove every part in service order (cover, drive cage, card, memory, SSD, cooler, CPU, power supply, motherboard) and lay it out on the bench. **Reset** puts it back together.
- **Build a PC.** Choose compatible parts, then assemble them: orient, seat and secure each part, apply thermal paste, fasten the cooler, connect cables, close the case and pass a simulated power-on self-test.
- **Laptop Lab.** Dell Latitude 5410 reference laptop: teardown timeline, guided lesson, connections, troubleshooting and a knowledge check.
- **Task Manager.** Practise reading CPU, memory, disk and network use.
- **Learning path.** A seven-step course with the photo route, virtual OS practice, the coffee ceremony lesson and a final assessment. Results stay in the browser.

## Accuracy

The Dell models are **reference models, not exact replicas**. Outside dimensions follow Dell's published documents; interior positions, surfaces and the optional expansion card are estimated or illustrative. The take-apart order is a simplified teaching sequence based on Dell's manual, not a repair guide. No real operating system runs and no real device is measured. See `docs/` and `THIRD_PARTY_REVIEW.md` for sources and limits.

## Run it

Node.js 22.13 or newer.

```bash
npm install
npm run dev        # development server
npm run build      # type-check and production build into dist/
npm start          # preview the production build
```

## Checks

```bash
npm run check      # TypeScript
npm run lint       # oxlint
npm test           # unit tests (node --test)
```

Browser suites live in `tests/browser/*.mjs` and run against a preview server, for example:

```bash
ATLAS_TEST_URL=http://127.0.0.1:5186/ node tests/browser/pc-teardown.mjs
```

GitHub Actions runs the checks on every push and runs the browser suites against the published site after each deploy. See [ARCHITECTURE.md](ARCHITECTURE.md) for where the code lives and [docs/publishing.md](docs/publishing.md) for publishing.

## Credits

This project started as a fork of [**PC Anatomy**](https://github.com/Yoosseph/pc-anatomy) by **Yoseph**, an open-source 3D PC explorer released under the MIT License. Its take-apart timeline (Auto, named phases, slider and reset) inspired the one in Explore inside the PC, and its playback hook and page base styles are still used here. The original explorer itself was retired from this lab in October 2026; it remains in this repository's git history and in Yoseph's repository.

Released under the [MIT License](LICENSE). The original copyright notice is kept. Third-party models, fonts and references are listed in [THIRD_PARTY_REVIEW.md](THIRD_PARTY_REVIEW.md) and [MODEL_ASSET_MANIFEST.md](MODEL_ASSET_MANIFEST.md).

Product and company names (Dell, OptiPlex, Latitude, Intel and others) identify the hardware being taught. This lab is not affiliated with or endorsed by those companies.
