// Offline mode: after one visit and "Save all labs for offline use", the lab opens and works
// with no network at all, including Build Your PC and the Laptop Lab's 3D models.
//   ATLAS_TEST_URL=http://127.0.0.1:5186/ node tests/browser/offline.mjs   (needs a production build)
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const out = 'verification/offline';
await mkdir(out, { recursive: true });
const url = process.env.ATLAS_TEST_URL || 'http://127.0.0.1:5186/';
const browser = await chromium.launch({ channel: process.env.ATLAS_BROWSER_CHANNEL || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(60000);
const errors = [];
const failedModels = [];
page.on('pageerror', error => errors.push(error.message));
page.on('requestfailed', request => { if (/\/models\//.test(request.url())) failedModels.push(request.url()); });
const shot = async name => {
  try { await page.screenshot({ path: `${out}/${name}.png`, timeout: 60000 }); console.log('Capture', name); }
  catch (error) { console.warn('Screenshot skipped', name, error.message.split('\n')[0]); }
};
// The school edition opens with a video once per session; skip it when it is shown.
const enterLab = async () => {
  const skip = page.getByRole('button', { name: /Skip intro/ });
  await page.getByRole('button', { name: /Skip intro|Build.*PC/i }).first().waitFor();
  if (await skip.count()) await skip.click();
};

try {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await enterLab();
  const card = page.locator('.offline-card');
  await card.getByText(/opens without internet/).waitFor({ timeout: 120000 });
  assert.ok(await page.evaluate(() => navigator.serviceWorker.ready.then(registration => !!registration.active)), 'Offline worker is active');

  await card.getByRole('button', { name: /Save all labs for offline use/ }).click();
  await card.getByText(/All labs are saved for offline use/).waitFor({ timeout: 240000 });
  await shot('01-saved');

  // No network at all from here on.
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await enterLab();
  await card.getByText('You are offline').waitFor();
  await card.getByText(/All labs are saved for offline use/).waitFor({ timeout: 30000 });
  await shot('02-offline-home');

  await page.getByRole('button', { name: /Build.*PC/i }).first().click();
  for (const choice of [/Intel Core i5-6500/, /Dell Q170 System Board/, /8 GB DDR4/, /M.2 2280 SSD/, /Slot-powered PCIe Card/, /Dell 240 W Power Supply/])
    await page.getByRole('button', { name: choice }).last().click();
  await page.getByRole('button', { name: /Enter interactive/ }).click();
  await page.getByRole('button', { name: 'Start assembly practice', exact: true }).click();
  await page.getByRole('button', { name: /^Seat .* in its guide$/ }).click();
  assert.equal(await page.locator('.assembly-progress-label').innerText(), '1 / 7 placed', 'Build Your PC works offline');
  await shot('03-offline-build');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await enterLab();
  await page.getByRole('button', { name: 'Laptop Lab', exact: true }).click();
  await page.getByRole('button', { name: 'Inside', exact: true }).click();
  await page.waitForTimeout(6000);
  await shot('04-offline-laptop');
  assert.deepEqual(failedModels, [], 'Every laptop model loads from the saved copy');

  assert.deepEqual(errors, [], 'No uncaught browser errors');
  console.log('PASS offline: worker active, full pack saved, lab, Build Your PC and Laptop Lab work with no network.');
} finally {
  await browser.close();
}
