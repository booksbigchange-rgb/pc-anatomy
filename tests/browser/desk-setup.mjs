// Computer Lab desk setup: the realistic room loads, ports can be connected by a 3D click
// or the port buttons with the same checks, and the full setup completes.
//   ATLAS_TEST_URL=http://127.0.0.1:5186/ node tests/browser/desk-setup.mjs
import { chromium } from 'playwright';
import * as T from 'three';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const out = 'verification/desk-setup';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: process.env.ATLAS_BROWSER_CHANNEL || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(30000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const shot = async name => {
  try { await page.locator('.lab-stage canvas').screenshot({ path: `${out}/${name}.png`, timeout: 90000 }); console.log('Capture', name); }
  catch (error) { console.warn('Screenshot skipped', name, error.message.split('\n')[0]); }
};
const feedback = () => page.locator('.lab-lesson p').innerText();

try {
  await page.goto(process.env.ATLAS_TEST_URL || 'http://127.0.0.1:5186/', { waitUntil: 'domcontentloaded' });
  const skip = page.getByRole('button', { name: /Skip intro/ });
  await page.getByRole('button', { name: /Skip intro|Connections/ }).first().waitFor();
  if (await skip.count()) await skip.click();
  await page.waitForTimeout(2500);
  assert.match(await page.locator('.lab-next').innerText(), /OptiPlex 7040 reference model, interior estimated/);
  // Habesha touches: a Tigrinya welcome in Ge'ez with its own font, and the tibeb band under the top bar.
  const welcome = page.locator('.lab-welcome [lang="ti"]');
  assert.equal(await welcome.innerText(), 'እንቋዕ ብደሓን መጻእኩም');
  assert.ok(await page.evaluate(() => document.fonts.load("700 20px 'Noto Sans Ethiopic'", 'እንቋዕ').then(faces => faces.length > 0)), 'The bundled Ge\'ez font loads');
  assert.match(await page.evaluate(() => getComputedStyle(document.querySelector('.lab-topbar'), '::after').backgroundImage), /svg/, 'Tibeb band under the top bar');
  await shot('01-explore');

  await page.getByRole('button', { name: 'Connections', exact: true }).first().click();
  await page.waitForTimeout(1200);
  assert.match(await page.locator('.lab-detail h2').innerText(), /Keyboard → USB/);
  await shot('02-no-signal');

  // Buttons use the same checks as 3D clicks: wrong type, then right type but wrong socket.
  await page.getByRole('button', { name: 'Rear HDMI', exact: true }).click();
  assert.match(await feedback(), /needs a USB connection/);
  await page.getByRole('button', { name: 'Front USB 2', exact: true }).click();
  assert.match(await feedback(), /right kind of port/);

  // A direct 3D click on the glowing front USB port connects the keyboard.
  const rect = await page.locator('.lab-stage canvas').boundingBox();
  const camera = new T.PerspectiveCamera(42, rect.width / rect.height, 0.1, 100);
  camera.position.set(11.5, 7.6, 13.4);
  camera.lookAt(0.75, 1.7, 0.35);
  camera.updateMatrixWorld();
  let connected = false;
  // Front USB 1 sits on the tower front at about (3.95, 3.24, 1.3); search a small area around it.
  search: for (let dy = -0.12; dy <= 0.12; dy += 0.04)
    for (let dx = -0.15; dx <= 0.15; dx += 0.03) {
      const q = new T.Vector3(3.95 + dx, 3.24 + dy, 1.3).project(camera);
      await page.mouse.click(rect.x + ((q.x + 1) * rect.width) / 2, rect.y + ((1 - q.y) * rect.height) / 2);
      if (/Correct/.test(await feedback())) { connected = true; break search; }
    }
  assert.ok(connected, 'The front USB port on the tower can be clicked in 3D');
  assert.match(await page.locator('.lab-detail h2').innerText(), /Mouse → USB/);

  for (const name of ['Front USB 2', 'Rear HDMI', 'Rear Ethernet', 'Power inlet']) await page.getByRole('button', { name, exact: true }).click();
  assert.equal(await page.locator('.lab-detail h2').innerText(), 'Setup connected!');
  await page.waitForTimeout(800);
  await shot('03-connected-desktop');
  await page.getByRole('button', { name: /Practise again/ }).click();
  assert.match(await page.locator('.lab-detail h2').innerText(), /Keyboard → USB/);

  assert.deepEqual(errors, [], 'No uncaught browser errors');
  console.log('PASS desk setup: realistic room, honest model note, 3D and button connections, completion and reset.');
} finally {
  await browser.close();
}
