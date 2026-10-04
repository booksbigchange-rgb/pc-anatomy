# School branding branch

Branch: bigchange-school-branding, based on 0dd71bb.

Uses the supplied BIGCHANGE_source.mp4 (five seconds, 480 x 480) and transparent school logo unchanged. Opening plays muted once per tab, offers sound and Skip, enters the lab on completion, respects reduced motion, and keeps entry available if video fails. Logo crops transparent padding through CSS only.

Browser checks passed: metadata/playback, sound toggle, Skip, session reload, reduced-motion autoplay disabled, media-error entry, ended transition. Desktop and phone captures reviewed in output/playwright.

The branch and both media files are on GitHub. School preview workflow builds this branch at /pc-anatomy/school/ and rebuilds bigchange-school at the original root URL in the same Pages artifact. It validates school entry before deployment and both version markers afterward.

Share URL after successful deployment: https://booksbigchange-rgb.github.io/pc-anatomy/school/

GitHub Pages serves one artifact per repository. Both publishing workflows now build and preserve the original root preview and the school preview together. Keep Pages Source set to GitHub Actions; branch-folder/Jekyll publishing overwrites the built app. See docs/publishing.md on bigchange-school for release settings and checks.
