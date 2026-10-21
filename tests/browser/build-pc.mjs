// Build Your PC: picker → drag assembly → retainers → cooling → cables → POST → result → restart,
// then the same build on a phone using only buttons. Run against a served build:
//   ATLAS_TEST_URL=http://127.0.0.1:5186/ node tests/browser/build-pc.mjs
import { chromium } from 'playwright';
import * as T from 'three';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const out = 'verification/build-pc';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: process.env.ATLAS_BROWSER_CHANNEL || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(30000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
// Screenshots are evidence, not assertions: a slow software renderer may time out without the behaviour being wrong.
const shot = async name => {
  try { await page.screenshot({ path: `${out}/${name}.png`, timeout: 90000 }); console.log('Capture', name); }
  catch (error) { console.warn('Screenshot skipped', name, error.message.split('\n')[0]); }
};
const url = process.env.ATLAS_TEST_URL || 'http://127.0.0.1:5186/';

// Tray and guide positions from app/assembly-lab.tsx and lib/optiplex-7040.ts.
const PARTS = {
  motherboard: { name: 'Dell Q170 System Board', start: [-3.15, 0.75, 0], mount: [2.08, 0.76, -0.7] },
  cpu: { name: 'Intel Core i5-6500', start: [-5.2, 0.82, 2.3], mount: [1.48, 0.93, -1.68] },
  cooler: { name: 'Dell CPU Heatsink & Fan', start: [-4.8, 1.01, -2.2], mount: [1.48, 1.08, -1.68] },
  ram: { name: '8 GB DDR4', start: [-3.5, 1.14, 2.8], mount: [2.91, 1.11, -1.63] },
  ssd: { name: 'M.2 2280 SSD', start: [-2.3, 0.85, 2.8], mount: [3.64, 0.92, -0.3] },
  gpu: { name: 'Slot-powered PCIe Card', start: [-2.15, 1.27, -2.45], mount: [1.66, 1.52, 0.07] },
  psu: { name: 'Dell 240 W Power Supply', start: [-4.9, 1.2, -0.5], mount: [1.33, 1.37, 2.05] },
};
const ORDER = ['motherboard', 'cpu', 'cooler', 'ram', 'ssd', 'gpu', 'psu'];
const placed = async () => page.locator('.assembly-progress-label').innerText();
const coach = () => page.locator('.assembly-feedback');

/** The school build opens with a skippable video; the original build goes straight to the lab. */
async function open() {
  await page.goto(url);
  const skip = page.getByRole('button', { name: /Skip intro/ });
  await page.getByRole('button', { name: /Skip intro|Build.*PC/i }).first().waitFor();
  if (await skip.count()) await skip.click();
}

async function choosePartsAndEnter() {
  await page.getByRole('button', { name: /Build.*PC/i }).first().click();
  assert.match(await page.locator('.build-picker').innerText(), /Dell CPU Heatsink & Fan/, 'The cooler is part of the build and starts chosen');
  for (const id of ['cpu', 'motherboard', 'ram', 'ssd', 'gpu', 'psu']) await page.getByRole('button', { name: new RegExp(PARTS[id].name) }).last().click();
  await page.getByRole('button', { name: /Enter interactive/ }).click();
  await page.getByRole('button', { name: 'Start assembly practice', exact: true }).click();
}

try {
  await open();
  await choosePartsAndEnter();
  await page.getByRole('button', { name: 'Light graphics', exact: true }).click();
  await page.waitForTimeout(1200);
  assert.equal(await placed(), '0 / 7 placed');

  // The coach message is drawn over the 3D scene, inside the canvas area.
  const rect = await page.locator('.assembly-stage canvas').boundingBox();
  const overlay = await page.locator('.assembly-stage-coach').boundingBox();
  assert.ok(overlay && overlay.y > rect.y && overlay.y + overlay.height < rect.y + rect.height, 'Coach message must sit over the scene');

  // Every part in the list can be selected during assembly and explains itself; nothing resets.
  for (const id of ORDER) {
    await page.locator('.assembly-step').filter({ hasText: PARTS[id].name }).click();
    const notes = await page.locator('.assembly-detail').innerText();
    assert.match(notes, /Its job:/, `${id} shows its job`);
    assert.match(notes, /Example:/, `${id} shows an example`);
    assert.match(notes, /Connects to:/, `${id} shows its connection`);
    assert.match(notes, /Safety:/, `${id} shows a safety note`);
    assert.match(notes, /Status:/, `${id} shows whether it is the next step`);
    assert.equal(await placed(), '0 / 7 placed', 'Selecting a part must not change progress');
  }
  assert.match(await page.locator('.assembly-step').first().innerText(), /Next step/);

  // Keyboard users can orbit and zoom: focus the 3D view, press arrows and +, and the picture changes.
  const canvas = page.locator('.assembly-stage canvas');
  await canvas.focus();
  assert.equal(await page.evaluate(() => document.activeElement?.tagName), 'CANVAS', 'The 3D view can take keyboard focus');
  await page.waitForTimeout(400);
  const before = await canvas.screenshot({ timeout: 90000 });
  for (const key of ['ArrowLeft', 'ArrowLeft', 'ArrowUp', '+']) await page.keyboard.press(key);
  await page.waitForTimeout(800);
  const after = await canvas.screenshot({ timeout: 90000 });
  assert.ok(!before.equals(after), 'Arrow keys and + must move the camera');
  await page.getByRole('button', { name: 'Overview', exact: true }).click();
  await page.waitForTimeout(800);
  await shot('01-assembly-start');

  const camera = new T.PerspectiveCamera(38, rect.width / rect.height, 0.1, 100);
  camera.position.set(8.65, 12, 11);
  camera.lookAt(0.15, 1.1, 0);
  camera.updateMatrixWorld();
  const screen = v => { const p = v.clone().project(camera); return { x: rect.x + ((p.x + 1) * rect.width) / 2, y: rect.y + ((1 - p.y) * rect.height) / 2 }; };
  /** Drag a tray part so that its origin lands on `dest` (world), compensating for the grab offset. */
  async function drag(id, dest) {
    const { start, mount } = PARTS[id];
    const origin = new T.Vector3(...start), from = screen(origin);
    const ray = new T.Raycaster();
    ray.setFromCamera(new T.Vector2(((from.x - rect.x) / rect.width) * 2 - 1, -((from.y - rect.y) / rect.height) * 2 + 1), camera);
    const hit = new T.Vector3();
    ray.ray.intersectPlane(new T.Plane(new T.Vector3(0, 1, 0), -mount[1]), hit);
    const drop = new T.Vector3(...dest).sub(origin.clone().sub(hit));
    drop.y = mount[1];
    const to = screen(drop);
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(200);
  }
  const turn = id => page.locator('.assembly-step').filter({ hasText: PARTS[id].name }).click().then(() => page.getByRole('button', { name: 'Turn part 180°', exact: true }).click());

  // A drop close to, but not exactly on, the guide still installs: guides are forgiving.
  const nearBoard = [...PARTS.motherboard.mount]; nearBoard[0] += 0.42;
  await drag('motherboard', nearBoard);
  assert.equal(await placed(), '1 / 7 placed', 'A slightly-off motherboard drop must snap into place');

  // Wrong orientation: the CPU can be picked up and moved, but will not install.
  await drag('cpu', PARTS.cpu.mount);
  assert.match(await coach().innerText(), /Wrong direction/);
  assert.equal(await placed(), '1 / 7 placed');
  await shot('02-wrong-direction');
  await turn('cpu');
  assert.match(await page.locator('.assembly-direction').innerText(), /matches/);
  await drag('cpu', PARTS.cpu.mount);
  assert.equal(await placed(), '2 / 7 placed', 'A correctly turned CPU installs');
  // Clicking the installed CPU in the 3D scene identifies it.
  const cpuAt = screen(new T.Vector3(1.48, 1.01, -1.68));
  await page.mouse.click(cpuAt.x, cpuAt.y);
  assert.equal(await page.locator('.assembly-detail h2').innerText(), PARTS.cpu.name, 'Direct CPU click');

  // Selecting a different part after progress keeps the progress.
  await page.locator('.assembly-step').filter({ hasText: PARTS.ssd.name }).click();
  assert.equal(await placed(), '2 / 7 placed');

  // The cooler can be moved before paste, but will not install without it.
  await drag('cooler', PARTS.cooler.mount);
  assert.match(await coach().innerText(), /thermal paste/);
  assert.equal(await placed(), '2 / 7 placed');
  await page.getByRole('button', { name: 'Apply thermal paste', exact: true }).click();
  await drag('cooler', PARTS.cooler.mount);
  assert.equal(await placed(), '3 / 7 placed');
  await shot('03-cooler-on-cpu');

  // Wrong location: RAM dropped on the SSD guide is returned with an explanation.
  await turn('ram');
  await drag('ram', PARTS.ssd.mount);
  assert.match(await coach().innerText(), /That is the SSD guide/);
  assert.equal(await placed(), '3 / 7 placed');
  await drag('ram', PARTS.ram.mount);
  assert.equal(await placed(), '4 / 7 placed');
  for (const id of ['ssd', 'gpu']) { await turn(id); await drag(id, PARTS[id].mount); }
  await drag('psu', PARTS.psu.mount);
  assert.equal(await placed(), '7 / 7 placed');
  await shot('04-all-parts-placed');
  // Direct clicks from the top view identify RAM, SSD and the motherboard, and say they are removable.
  await page.getByRole('button', { name: 'Top', exact: true }).click();
  await page.waitForTimeout(1200);
  const top = new T.PerspectiveCamera(38, rect.width / rect.height, 0.1, 100);
  top.position.set(2.5, 17, 0.01); top.lookAt(2.5, 1.1, 0); top.updateMatrixWorld();
  for (const [id, point] of [['ram', [2.91, 1.37, -1.2]], ['ssd', [3.64, 0.98, -0.3]], ['motherboard', [3.6, 0.8, -1.4]]]) {
    const q = new T.Vector3(...point).project(top);
    await page.mouse.click(rect.x + ((q.x + 1) * rect.width) / 2, rect.y + ((1 - q.y) * rect.height) / 2);
    await page.waitForTimeout(250);
    assert.equal(await page.locator('.assembly-detail h2').innerText(), PARTS[id].name, `Direct ${String(id)} click`);
    assert.match(await page.locator('.assembly-detail').innerText(), /Removable part/);
  }

  // Securing, cooling order, cables, case and POST.
  await page.getByRole('button', { name: 'Test power-on', exact: true }).click();
  assert.match(await coach().innerText(), /did not start/);
  for (const name of ['Close RAM clips', 'Fasten SSD screw', 'Secure expansion bracket']) await page.getByRole('button', { name, exact: true }).click();
  await page.getByRole('button', { name: 'Corner 3', exact: true }).click();
  assert.match(await coach().innerText(), /Choose corner 1/);
  for (const corner of [1, 3, 2, 4]) await page.getByRole('button', { name: `Corner ${corner}`, exact: true }).click();
  await page.getByRole('combobox', { name: 'Choose PC cable' }).selectOption('fan');
  await page.getByRole('button', { name: 'PSU AC inlet', exact: true }).click();
  assert.match(await coach().innerText(), /Wrong socket/);
  for (const [id, target] of [['board-power', 'Board power socket'], ['cpu-power', 'CPU power socket'], ['fan', 'CPU fan header'], ['switch', 'Power-button header'], ['display', 'Graphics display output'], ['mains', 'PSU AC inlet']]) {
    await page.getByRole('combobox', { name: 'Choose PC cable' }).selectOption(id);
    await page.getByRole('button', { name: target, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Test power-on', exact: true }).click();
  assert.match(await coach().innerText(), /case is still open/);
  await page.getByRole('button', { name: 'Close drive cage', exact: true }).click();
  await page.getByRole('button', { name: 'Fit side cover', exact: true }).click();
  await page.getByRole('button', { name: 'Test power-on', exact: true }).click();
  const result = page.locator('.assembly-result');
  await result.waitFor();
  assert.match(await result.innerText(), /PC Builder/);
  assert.match(await result.innerText(), /XP/);
  assert.match(await result.innerText(), /You learned/);
  await shot('05-pc-builder-result');
  await result.getByRole('button', { name: /Restart practice/ }).click();
  assert.equal(await placed(), '0 / 7 placed');
  assert.equal(await result.count(), 0);
  assert.equal(await page.getByRole('button', { name: 'Apply thermal paste', exact: true }).isEnabled(), false, 'Restart clears paste and needs a CPU again');

  // Tablet: picker and assembly fit without sideways scrolling, and the 3D stage stays usable.
  await page.setViewportSize({ width: 820, height: 1180 });
  await open();
  await page.getByRole('button', { name: /Build.*PC/i }).first().click();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Picker fits a tablet');
  await shot('05b-tablet-picker');
  for (const id of ['cpu', 'motherboard', 'ram', 'ssd', 'gpu', 'psu']) await page.getByRole('button', { name: new RegExp(PARTS[id].name) }).last().click();
  await page.getByRole('button', { name: /Enter interactive/ }).click();
  await page.getByRole('button', { name: 'Start assembly practice', exact: true }).click();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Assembly fits a tablet');
  const tabletStage = await page.locator('.assembly-stage canvas').boundingBox();
  assert.ok(tabletStage && tabletStage.height >= 400 && tabletStage.width >= 560, 'Tablet stage stays large enough to drag parts');
  // The parts tray stays on screen: tapping the tray motherboard (camera stepped back as in the app) picks it up.
  const aspect = tabletStage.width / tabletStage.height;
  const tabletCamera = new T.PerspectiveCamera(38, aspect, 0.1, 100);
  const look = new T.Vector3(0.15, 1.1, 0);
  tabletCamera.position.set(8.65, 12, 11).sub(look).multiplyScalar(aspect < 1.03 ? 1.03 / aspect : 1).add(look);
  tabletCamera.lookAt(look); tabletCamera.updateMatrixWorld();
  for (const id of ['motherboard', 'cpu', 'ram', 'ssd']) {
    const q = new T.Vector3(...PARTS[id].start).project(tabletCamera);
    assert.ok(Math.abs(q.x) < 0.95 && Math.abs(q.y) < 0.95, `${id} tray position is inside the tablet stage`);
  }
  const trayBoard = new T.Vector3(...PARTS.motherboard.start).project(tabletCamera);
  await page.waitForTimeout(800);
  await page.mouse.click(tabletStage.x + ((trayBoard.x + 1) * tabletStage.width) / 2, tabletStage.y + ((1 - trayBoard.y) * tabletStage.height) / 2);
  assert.match(await coach().innerText(), /Motherboard picked up/, 'Tray parts can be reached on a tablet');
  await page.getByRole('button', { name: /^Seat .* in its guide$/ }).scrollIntoViewIfNeeded();
  assert.ok(await page.getByRole('button', { name: /^Seat .* in its guide$/ }).isVisible());
  await shot('05c-tablet-assembly');

  // Phone: the picker fits, and the whole build works with buttons only.
  await page.setViewportSize({ width: 390, height: 844 });
  await open();
  await choosePartsAndEnter();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'No sideways scrolling on a phone');
  const seat = () => page.getByRole('button', { name: /^Seat .* in its guide$/ }).click();
  for (const id of ORDER) {
    if (['cpu', 'ram', 'ssd', 'gpu'].includes(id)) {
      await seat();
      assert.match(await coach().innerText(), /Wrong direction/, `${id} button seat obeys direction`);
      await page.getByRole('button', { name: 'Turn part 180°', exact: true }).click();
    }
    if (id === 'cooler') {
      await seat();
      assert.match(await coach().innerText(), /thermal paste/, 'Button seat obeys the paste rule');
      await page.getByRole('button', { name: 'Apply thermal paste', exact: true }).click();
    }
    await seat();
  }
  assert.equal(await placed(), '7 / 7 placed');
  for (const name of ['Close RAM clips', 'Fasten SSD screw', 'Secure expansion bracket']) await page.getByRole('button', { name, exact: true }).click();
  for (const corner of [1, 3, 2, 4]) await page.getByRole('button', { name: `Corner ${corner}`, exact: true }).click();
  for (const [id, target] of [['board-power', 'Board power socket'], ['cpu-power', 'CPU power socket'], ['fan', 'CPU fan header'], ['switch', 'Power-button header'], ['display', 'Graphics display output'], ['mains', 'PSU AC inlet']]) {
    await page.getByRole('combobox', { name: 'Choose PC cable' }).selectOption(id);
    await page.getByRole('button', { name: target, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Close drive cage', exact: true }).click();
  await page.getByRole('button', { name: 'Fit side cover', exact: true }).click();
  await page.getByRole('button', { name: 'Test power-on', exact: true }).click();
  await result.waitFor();
  const box = await result.boundingBox();
  assert.ok(box && box.width <= 390, 'Result fits the phone width');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await result.scrollIntoViewIfNeeded();
  await shot('06-phone-result');

  assert.deepEqual(errors, [], 'No uncaught browser errors');
  console.log('Build Your PC browser checks passed');
} finally {
  await browser.close();
}
