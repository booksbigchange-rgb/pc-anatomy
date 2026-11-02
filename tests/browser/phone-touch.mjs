// Phone with touch: controls are at least 44 px tall, and in Build a PC the current step's message
// and actions sit in a bar under the model.
//   ATLAS_TEST_URL=http://127.0.0.1:5186/ node tests/browser/phone-touch.mjs
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const out = 'verification/phone-touch';
await mkdir(out, { recursive: true });
const url = process.env.ATLAS_TEST_URL || 'http://127.0.0.1:5186/';
const browser = await chromium.launch({ channel: process.env.ATLAS_BROWSER_CHANNEL || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
page.setDefaultTimeout(30000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const shot = async name => { try { await page.screenshot({ path: `${out}/${name}.png`, timeout: 60000 }); } catch (error) { console.warn('Screenshot skipped', name, error.message.split('\n')[0]); } };

/** Visible controls shorter than 44 px (sliders count by their tap height). */
const small = () => page.evaluate(() => {
  const found = [];
  for (const el of document.querySelectorAll('main button, main select, main input[type=range]')) {
    const r = el.getBoundingClientRect();
    if (!r.width || !el.checkVisibility({ contentVisibilityAuto: true, visibilityProperty: true })) continue;
    if (r.height < 43.5) found.push(`${(el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 30)} (${Math.round(r.width)}×${Math.round(r.height)})`);
  }
  return found;
});

async function home() {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Skip intro|Connections/ }).first().waitFor({ timeout: 60000 });
  const skip = page.getByRole('button', { name: /Skip intro/ });
  if (await skip.count()) await skip.click();
}

try {
  const report = {};
  await home();
  report.home = await small();
  await page.locator('header').first().getByRole('button', { name: 'Explore inside the PC', exact: true }).click();
  await page.getByRole('region', { name: 'PC teardown timeline' }).waitFor({ timeout: 60000 });
  report['Explore inside the PC'] = await small();
  await shot('01-explore');
  await home();
  await page.locator('header').first().getByRole('button', { name: 'Build a PC', exact: true }).click();
  for (const name of ['Intel Core i5-6500', 'Dell Q170 System Board', '8 GB DDR4', 'M.2 2280 SSD', 'Slot-powered PCIe Card', 'Dell 240 W Power Supply']) await page.getByRole('button', { name: new RegExp(name) }).last().click();
  report['Build a PC picker'] = await small();
  await page.getByRole('button', { name: /Enter interactive/ }).click();
  await page.getByRole('button', { name: 'Start assembly practice', exact: true }).click();
  await page.waitForTimeout(1500);
  report['Build a PC assembly'] = await small();
  for (const [screen, list] of Object.entries(report)) console.log(`${screen}: ${list.length} controls under 44 px${list.length ? ' — ' + list.slice(0, 6).join(', ') : ''}`);
  for (const [screen, list] of Object.entries(report)) assert.deepEqual(list, [], `${screen}: every control is at least 44 px tall on a touch phone`);

  // The action bar: visible under the model, with the coach message and a Seat button that works.
  const bar = page.locator('.assembly-mobile-bar');
  assert.ok(await bar.isVisible(), 'Action bar shows on the phone');
  assert.equal(await page.locator('.assembly-stage-coach').isVisible(), false, 'The overlay coach box is replaced by the bar');
  const box = await bar.boundingBox();
  assert.ok(box.y + box.height <= 845 && box.y > 600, 'The bar sits at the bottom of the screen');
  assert.match(await bar.innerText(), /motherboard/i);
  await shot('02-assembly-bar');
  await bar.getByRole('button', { name: /Seat motherboard/ }).click();
  await page.waitForTimeout(800);
  assert.match(await page.locator('.assembly-progress-label').innerText(), /1 \/ 7 placed/, 'Seat in the bar installs the part');
  // The CPU needs turning first: the bar offers Turn, and a wrong seat is explained in the bar.
  await page.locator('.assembly-step').filter({ hasText: 'Intel Core i5-6500' }).click();
  assert.ok(await bar.getByRole('button', { name: 'Turn 180°' }).isVisible(), 'Turn shows for a part that needs turning');
  await bar.getByRole('button', { name: /Seat CPU/ }).click();
  assert.match(await bar.innerText(), /direction|Turn/i, 'The reason appears in the bar');
  await bar.getByRole('button', { name: 'Turn 180°' }).click();
  await bar.getByRole('button', { name: /Seat CPU/ }).click();
  await page.waitForTimeout(800);
  assert.match(await page.locator('.assembly-progress-label').innerText(), /2 \/ 7 placed/);
  await shot('03-assembly-after-seat');

  assert.deepEqual(errors, [], 'No uncaught browser errors');
  console.log('PASS phone touch: 44 px controls on home, Explore inside the PC and Build a PC; action bar with message, Turn and Seat.');
} finally {
  await browser.close();
}
