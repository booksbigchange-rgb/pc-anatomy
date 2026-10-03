# School branding branch

Branch: bigchange-school-branding, based on 0dd71bb.

Uses the supplied BIGCHANGE_source.mp4 (five seconds, 480 x 480) and transparent school logo unchanged. Opening plays muted once per tab, offers sound and Skip, enters the lab on completion, respects reduced motion, and keeps entry available if video fails. Logo crops transparent padding through CSS only.

Browser checks passed: metadata/playback, sound toggle, Skip, session reload, reduced-motion autoplay disabled, media-error entry, ended transition. Desktop and phone captures reviewed in output/playwright.

The branch and both media files are on GitHub. School preview workflow builds this branch at /pc-anatomy/school/ and rebuilds bigchange-school at the original root URL in the same Pages artifact. It validates school entry before deployment and both version markers afterward.

Share URL after successful deployment: https://booksbigchange-rgb.github.io/pc-anatomy/school/

GitHub Pages serves one artifact per repository. A later deployment using the older bigchange-school-only workflow replaces this combined artifact; run the school preview workflow again to restore both URLs, or consolidate both publishing workflows before the next main release.
