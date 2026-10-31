// Explore inside the PC: the OptiPlex take-apart timeline (Auto, named steps, scrubber, reset).
//   ATLAS_TEST_URL=http://127.0.0.1:5186/ node tests/browser/pc-teardown.mjs
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const out = 'verification/pc-teardown';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: process.env.ATLAS_BROWSER_CHANNEL || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(30000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
// Screenshots are evidence, not assertions: a slow hosted renderer can time out while the page still works.
const shot = async name => {
  try { await page.locator('.assembly-stage').screenshot({ path: `${out}/${name}.png`, timeout: 90000 }); console.log('Capture', name); }
  catch (error) { console.warn('Screenshot skipped', name, error.message.split('\n')[0]); }
};
const timeline = page.getByRole('region', { name: 'PC teardown timeline' });
const slider = page.getByRole('slider', { name: 'Take the PC apart' });
const stage = () => timeline.locator('.pc-teardown-label span').innerText();
const percent = async () => Number((await timeline.locator('output').innerText()).replace('%', ''));

try {
  await page.goto(process.env.ATLAS_TEST_URL || 'http://127.0.0.1:5186/', { waitUntil: 'domcontentloaded' });
  const skip = page.getByRole('button', { name: /Skip intro/ });
  await page.getByRole('button', { name: /Skip intro|Connections/ }).first().waitFor();
  if (await skip.count()) await skip.click();
  await page.locator('header').getByRole('button', { name: 'Explore inside the PC', exact: true }).click();
  await timeline.waitFor({ timeout: 60000 });
  assert.match(await page.locator('.assembly-topbar').innerText(), /Computer Lab/, 'Back button returns to the Computer Lab');
  assert.equal(await page.locator('.workbench').count(), 0, 'The retired explorer is gone');
  assert.equal(await stage(), 'Drag or play');
  const phases = await timeline.locator('.pc-teardown-phases button').allInnerTexts();
  assert.deepEqual(phases.map(text => text.trim().toUpperCase()), ['ASSEMBLED', 'COVER', 'DRIVE CAGE', 'CARD', 'MEMORY', 'SSD', 'COOLER', 'CPU', 'POWER', 'BOARD']);
  await shot('01-open');

  // Scrubbing names the step in service order.
  for (const [value, expected] of [[4, /^Cover:/], [20, /^Card:/], [50, /^Cooler:/], [63, /^CPU:/], [100, /All parts laid out/]]) {
    await slider.fill(String(value));
    await page.waitForTimeout(600);
    assert.match(await stage(), expected, `Step at ${value}%`);
    assert.equal(await percent(), value);
    if (value === 4 || value === 50 || value === 100) await shot(`02-at-${value}`);
  }
  // Phase buttons jump to the end of a step and mark it.
  await timeline.getByRole('button', { name: 'Memory', exact: true }).click();
  assert.equal(await percent(), 36);
  assert.equal(await timeline.getByRole('button', { name: 'Memory', exact: true }).getAttribute('aria-pressed'), 'true');
  // A part can still be selected and read about while the PC is apart.
  await page.locator('.assembly-step-list').getByRole('button', { name: /Power Supply/ }).click();
  assert.match(await page.locator('.assembly-detail h2').innerText(), /Power Supply/);

  // Reset puts it back together; Auto plays forward and Pause stops it.
  await timeline.getByRole('button', { name: /Reassemble/ }).click();
  assert.equal(await percent(), 0);
  assert.equal(await stage(), 'Assembled');
  await timeline.getByRole('button', { name: 'Take the PC apart automatically' }).click();
  await page.waitForFunction(() => Number(document.querySelector('.pc-teardown output')?.textContent?.replace('%', '')) > 0, null, { timeout: 60000 });
  await timeline.getByRole('button', { name: 'Pause automatic teardown' }).click();
  const paused = await percent();
  await page.waitForTimeout(1200);
  assert.equal(await percent(), paused, 'Pause stops the teardown');
  assert.ok(paused > 0 && paused < 100);

  // Other inspection tools work on the assembled PC, so they reset the timeline.
  await page.getByRole('button', { name: 'Explode selected' }).click();
  assert.equal(await percent(), 0);
  assert.equal(await stage(), 'Drag or play');
  // Assembly practice still starts from here, and hides the timeline.
  await page.getByRole('button', { name: 'Start assembly practice' }).click();
  assert.equal(await timeline.count(), 0);

  // Back to the Computer Lab.
  await page.getByRole('button', { name: /Computer Lab/ }).click();
  await page.locator('header').getByRole('button', { name: 'Explore inside the PC', exact: true }).waitFor();

  assert.deepEqual(errors, [], 'No uncaught browser errors');
  console.log('PASS pc teardown: route, service-order steps, phase buttons, reset, auto/pause, tool reset, practice, back.');
} finally {
  await browser.close();
}
