// Every screen's lowest control can be reached with the mouse wheel, at desktop and phone sizes.
// Other suites click elements, which scrolls them into view programmatically and hid a page-level
// scroll lock; this one scrolls like a person does.
//   ATLAS_TEST_URL=http://127.0.0.1:5186/ node tests/browser/scroll-reach.mjs
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const url = process.env.ATLAS_TEST_URL || 'http://127.0.0.1:5186/';
const browser = await chromium.launch({ channel: process.env.ATLAS_BROWSER_CHANNEL || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const failures = [];

/** Open the home page, skip the school opening if shown, then open a screen. */
async function open(page, screen) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Skip intro|Connections/ }).first().waitFor({ timeout: 60000 });
  const skip = page.getByRole('button', { name: /Skip intro/ });
  if (await skip.count()) await skip.click();
  const header = page.locator('header').first();
  if (screen === 'home') return;
  if (screen === 'learning path' || screen === 'coffee lesson' || screen === 'OS installer') {
    await header.getByRole('button', { name: 'My learning path', exact: true }).click();
    await page.locator('.course-lab').waitFor();
    if (screen === 'coffee lesson') await page.getByRole('navigation', { name: 'Course sections' }).getByRole('button', { name: 'Coffee ceremony' }).click();
    if (screen === 'OS installer') { await page.getByRole('button', { name: 'Install an OS' }).click(); await page.locator('.os-lab').waitFor(); }
    return;
  }
  const button = { 'Explore inside the PC': 'Explore inside the PC', 'Build a PC': 'Build a PC', 'Laptop Lab': 'Laptop Lab', 'Task Manager': 'Task Manager' }[screen];
  await header.getByRole('button', { name: button, exact: true }).click();
  await page.waitForTimeout(2500);
}

/** The lowest visible control on the page (not fixed-position, not inside the 3D canvas). */
const lowest = page => page.evaluate(() => {
  let best = null;
  for (const el of document.querySelectorAll('main button, main a[href], main input, main select, main textarea')) {
    const r = el.getBoundingClientRect();
    // Skip controls that are not really shown, such as those inside a closed <details>.
    if (!r.width || !r.height || !el.checkVisibility({ contentVisibilityAuto: true, visibilityProperty: true })) continue;
    let fixed = false;
    for (let node = el; node; node = node.parentElement) if (getComputedStyle(node).position === 'fixed') { fixed = true; break; }
    if (fixed) continue;
    if (!best || r.bottom > best.bottom) best = { bottom: r.bottom, label: (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 40) };
  }
  return best;
});

/** A point over the page that is not the 3D canvas (the wheel zooms the camera there). */
const wheelPoint = page => page.evaluate(() => {
  for (let y = innerHeight - 20; y > 40; y -= 40)
    for (const x of [innerWidth - 12, 12, innerWidth / 2]) {
      const el = document.elementFromPoint(x, y);
      if (el && el.tagName !== 'CANVAS') return { x, y };
    }
  return { x: innerWidth - 12, y: innerHeight - 20 };
});

const screens = ['home', 'learning path', 'coffee lesson', 'OS installer', 'Explore inside the PC', 'Build a PC', 'Laptop Lab', 'Task Manager'];
try {
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    page.setDefaultTimeout(30000);
    for (const screen of screens) {
      await open(page, screen);
      const target = await lowest(page);
      if (!target) continue;
      for (let i = 0; i < 14; i++) {
        const now = await lowest(page);
        if (now.bottom <= height + 1) break;
        const point = await wheelPoint(page);
        await page.mouse.move(point.x, point.y);
        await page.mouse.wheel(0, 500);
        await page.waitForTimeout(150);
      }
      const end = await lowest(page);
      const ok = end.bottom <= height + 1;
      console.log(`${ok ? 'ok  ' : 'FAIL'} ${width}x${height} ${screen}: lowest control "${end.label}" bottom ${Math.round(end.bottom)} (started ${Math.round(target.bottom)})`);
      if (!ok) failures.push(`${width}x${height} ${screen}: "${end.label}" stays at ${Math.round(end.bottom)} px`);
    }
    await page.close();
  }
  assert.deepEqual(failures, [], 'Every screen scrolls to its lowest control with the wheel');
  console.log('PASS scroll reach: every screen scrolls to its lowest control with the mouse wheel at desktop and phone sizes.');
} finally {
  await browser.close();
}
