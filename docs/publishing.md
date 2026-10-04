# Publishing both computer lab previews

GitHub Pages Source must remain **GitHub Actions**. Branch-folder publishing uses Jekyll and can overwrite the built app.

Both publishing workflows include the two versions in one Pages artifact:
- Original lab: https://booksbigchange-rgb.github.io/pc-anatomy/
- School branding: https://booksbigchange-rgb.github.io/pc-anatomy/school/

The bigchange-school workflow builds its own revision at the root, fetches bigchange-school-branding, and builds it with /pc-anatomy/school/ as the base URL. It records the exact school commit and uses that revision for live browser checks.
The school workflow builds its own revision under /school/ and fetches bigchange-school for the root. Both share the pages concurrency group without cancelling an active release.

Keep both branches allowed in the github-pages environment. Do not switch Pages Source to Deploy from a branch.

Validation includes the school opening before upload, both live version markers, school playback/skip/mobile entry, and the original desktop/laptop/course browser checks. This publishing change does not alter lab interactions.
