import { chromium } from 'playwright';
import * as T from 'three';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('verification/optiplex', { recursive: true });
const browser = await chromium.launch({
  channel: process.env.ATLAS_BROWSER_CHANNEL || undefined,
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.setDefaultTimeout(15000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const shot = async (name) => {
  await page.waitForTimeout(450);
  console.log(`Capture ${name}`);
  await page.screenshot({
    path: `verification/optiplex/${name}.png`,
    timeout: 30000,
  });
};
try {
  await page.goto(process.env.ATLAS_TEST_URL ?? 'http://127.0.0.1:5173/');
  await page.getByRole('button', { name: /Build.*PC/i }).click();
  await page
    .getByRole('button', { name: 'Fit side cover', exact: true })
    .waitFor();
  await shot('01-parts-picker');
  assert.equal(
    await page.getByRole('button', { name: /Enter interactive/ }).isEnabled(),
    false,
  );
  for (const choice of [
    /Intel Core i5-6500/,
    /Dell Q170 System Board/,
    /8 GB DDR4/,
    /M.2 2280 SSD/,
    /Slot-powered PCIe Card/,
    /Dell 240 W Power Supply/,
  ]) {
    await page.getByRole('button', { name: choice }).last().click();
  }
  await page.getByRole('button', { name: /Enter interactive/ }).click();
  await shot('02-open-case');
  await page.getByRole('button', {name: 'Close drive cage', exact: true}).click();
  assert.equal(await page.getByRole('button', {name: 'Open drive cage', exact: true}).getAttribute('aria-pressed'), 'false');
  await shot('02b-cage-closed');
  await page.getByRole('button', {name: 'Open drive cage', exact: true}).click();
  await shot('02c-cage-open');
  await page
    .getByRole('button', { name: 'Fit side cover', exact: true })
    .click();
  await shot('03-closed-case');
  await page.getByRole('button', { name: 'Front', exact: true }).click();
  await shot('04-front');
  await page.getByRole('button', { name: 'Rear', exact: true }).click();
  await shot('05-rear');
  await page
    .getByRole('button', { name: 'Remove side cover', exact: true })
    .click();
  await page.getByRole('button', { name: 'Service view', exact: true }).click();
  await page.getByRole('button', { name: 'Top', exact: true }).click();
  await shot('06-top');
  // Verify direct object picking, not only the component dropdown.
  await page
    .getByRole('combobox', { name: 'Select component' })
    .selectOption('ram');
  const pickRect = await page.locator('.assembly-stage canvas').boundingBox();
  assert.ok(pickRect);
  const pickCamera = new T.PerspectiveCamera(
    38,
    pickRect.width / pickRect.height,
    0.1,
    100,
  );
  pickCamera.position.set(2.5, 17, 0.01);
  pickCamera.lookAt(2.5, 1.1, 0);
  pickCamera.updateMatrixWorld();
  await page.getByRole('button', {name:'Close drive cage',exact:true}).click();
  await page.waitForTimeout(200);
  const blockedPoint = new T.Vector3(3.64, 3.02, -.3).project(pickCamera);
  await page.mouse.click(pickRect.x + (blockedPoint.x+1)*pickRect.width/2, pickRect.y+(1-blockedPoint.y)*pickRect.height/2);
  assert.equal(await page.getByRole('combobox', {name:'Select component'}).inputValue(),'ram','Clicking a closed metal cage must not select the SSD underneath');
  await page.getByRole('button', {name:'Open drive cage',exact:true}).click();
  await page.waitForTimeout(200);
  const coolerPoint = new T.Vector3(1.48, 1.82, -1.68).project(pickCamera);
  await page.mouse.click(
    pickRect.x + ((coolerPoint.x + 1) * pickRect.width) / 2,
    pickRect.y + ((1 - coolerPoint.y) * pickRect.height) / 2,
  );
  await page.waitForTimeout(200);
  assert.equal(
    await page.getByRole('combobox', { name: 'Select component' }).inputValue(),
    'cooler',
    'Clicking the fan must select its complete cooling assembly',
  );

  // Fixed motherboard targets are individually identifiable, by list and direct picking.
  for (const target of ['CPU socket', 'Memory slots', 'Expansion slots', 'M.2 storage socket', 'SATA ports', 'Clock battery']) {
    await page.getByRole('button', {name:target,exact:true}).click();
    assert.equal(await page.locator('.assembly-detail h2').innerText(), target);
    assert.equal(await page.getByRole('button', {name:'Explode selected',exact:true}).isEnabled(), false, 'Fixed board targets cannot be removed independently');
  }
  await page.getByRole('button', {name:'Memory slots',exact:true}).click();
  const batteryPoint = new T.Vector3(3.34, .85, -.09).project(pickCamera);
  await page.mouse.click(pickRect.x + (batteryPoint.x+1)*pickRect.width/2, pickRect.y+(1-batteryPoint.y)*pickRect.height/2);
  assert.equal(await page.locator('.assembly-detail h2').innerText(), 'Clock battery', 'Direct battery pick must identify its holder');
  await shot('06b-board-learning-target');
  await page
    .getByRole('combobox', { name: 'Select component' })
    .selectOption('ssd');
  await page
    .getByRole('button', { name: 'Explode selected', exact: true })
    .click();
  assert.equal(
    await page
      .getByRole('button', { name: 'Return selected', exact: true })
      .getAttribute('aria-pressed'),
    'true',
  );
  await shot('07-ssd-exploded');
  await page
    .getByRole('button', { name: 'Isolate selected', exact: true })
    .click();
  await shot('08-ssd-isolated');
  await page.getByRole('button', { name: 'Show all', exact: true }).click();
  await page
    .getByRole('button', { name: 'Return selected', exact: true })
    .click();
  await page.getByText('Practise troubleshooting',{exact:true}).click();
  await page.getByRole('button',{name:'Inspect the CPU fan connection',exact:true}).click();
  assert.match(await page.locator('.fault-practice output').innerText(), /does not explain/);
  await page.getByRole('button',{name:'Inspect the monitor connection and input',exact:true}).click();
  await page.getByRole('button',{name:'Reconnect the monitor cable and select its input',exact:true}).click();
  await page.getByRole('button',{name:'3. Run the check again',exact:true}).click();
  assert.match(await page.locator('.fault-practice').innerText(), /Verified: the simulated fault is resolved/);
  await shot('08b-diagnosis-verified');
  await page
    .getByRole('button', { name: 'Start assembly practice', exact: true })
    .click();
  await page.waitForTimeout(1600);
  await shot('09-practice-start');
  const rect = await page.locator('.assembly-stage canvas').boundingBox();
  assert.ok(rect && rect.height > 300);
  const camera = new T.PerspectiveCamera(
    38,
    rect.width / rect.height,
    0.1,
    100,
  );
  camera.position.set(8.65, 12, 11);
  camera.lookAt(0.15, 1.1, 0);
  camera.updateMatrixWorld();
  const screen = (v) => {
    const p = v.clone().project(camera);
    return {
      x: rect.x + ((p.x + 1) * rect.width) / 2,
      y: rect.y + ((1 - p.y) * rect.height) / 2,
    };
  };
  /** @type {Array<[string, [number,number,number], [number,number,number]]>} */
  const steps = [
    ['motherboard', [-3.15, 0.75, 0], [2.08, 0.76, -0.7]],
    ['cpu', [-5.2, 0.82, 2.3], [1.48, 0.93, -1.68]],
    ['cooler', [-4.8, 1.01, -2.2], [1.48, 1.08, -1.68]],
    ['ram', [-3.5, 1.14, 2.8], [2.91, 1.11, -1.63]],
    ['ssd', [-2.3, 0.85, 2.8], [3.64, 0.92, -0.3]],
    ['gpu', [-2.15, 1.27, -2.45], [1.66, 1.52, 0.07]],
    ['psu', [-4.9, 1.2, -0.5], [1.33, 1.37, 2.05]],
  ];
  for (let i = 0; i < steps.length; i++) {
    if (i === 2) await page.getByRole('button', { name: 'Apply thermal paste', exact: true }).click();
    const [id, start, target] = steps[i],
      origin = new T.Vector3(...start),
      dest = new T.Vector3(...target),
      from = screen(origin);
    if ([1,3,4,5].includes(i)) {
      await page.mouse.click(from.x,from.y);
      assert.match(await page.locator('.assembly-feedback').innerText(), /Wrong direction/);
      await page.getByRole('button',{name:'Turn part 180°',exact:true}).click();
    }
    const ray = new T.Raycaster();
    ray.setFromCamera(
      new T.Vector2(
        ((from.x - rect.x) / rect.width) * 2 - 1,
        -((from.y - rect.y) / rect.height) * 2 + 1,
      ),
      camera,
    );
    const intersection = new T.Vector3();
    ray.ray.intersectPlane(
      new T.Plane(new T.Vector3(0, 1, 0), -target[1]),
      intersection,
    );
    const offset = origin.clone().sub(intersection);
    const drop = dest.clone().sub(offset);
    drop.y = target[1];
    const to = screen(drop);
    if (i === 0) {
      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      await page.mouse.move(from.x + 35, from.y + 45, { steps: 8 });
      await page.mouse.up();
      await page.getByText(/missed its mounting guide/).waitFor();
      assert.match(
        await page.locator('.assembly-progress-label').innerText(),
        /^0 \/ 7/,
      );
    }
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 24 });
    await page.mouse.up();
    await page.waitForTimeout(250);
    assert.equal(
      await page.locator('.assembly-progress-label').innerText(),
      `${i + 1} / 7 placed`,
      `${id} must install by dragging`,
    );
  }
  await shot('10-completed-placement');
  await page.getByRole('button',{name:'Test power-on',exact:true}).click();
  assert.match(await page.locator('.assembly-wiring').innerText(), /Close RAM clips/);
  for (const name of ['Close RAM clips','Fasten SSD screw','Secure expansion bracket']) await page.getByRole('button',{name,exact:true}).click();
  await page.getByRole('button', { name: 'Corner 2', exact: true }).click();
  assert.match(await page.locator('.assembly-feedback').innerText(), /Choose corner 1/);
  await page.getByRole('button', { name: 'Test power-on', exact: true }).click();
  assert.match(await page.locator('.assembly-wiring').innerText(), /Fasten the cooler/);
  for (const corner of [1, 3, 2, 4]) await page.getByRole('button', { name: `Corner ${corner}`, exact: true }).click();
  await page.getByRole('button', { name: 'Test power-on', exact: true }).click();
  assert.ok((await page.locator('.assembly-wiring').innerText()).includes('Connect PSU'));
  await page.getByRole('combobox', { name: 'Choose PC cable' }).selectOption('board-power');
  await page.getByRole('button', { name: 'CPU fan header', exact: true }).click();
  assert.ok((await page.locator('.assembly-feedback').innerText()).includes('Wrong socket'));
  for (const [id, target] of [['board-power', 'Board power socket'], ['cpu-power', 'CPU power socket'], ['fan', 'CPU fan header'], ['switch', 'Power-button header'], ['display', 'Graphics display output'], ['mains', 'PSU AC inlet']]) {
    await page.getByRole('combobox', { name: 'Choose PC cable' }).selectOption(id);
    await page.getByRole('button', { name: target, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Close drive cage', exact: true }).click();
  await page.getByRole('button', { name: 'Fit side cover', exact: true }).click();
  await page.getByRole('button', { name: 'Test power-on', exact: true }).click();
  await page.getByText('✓ POST passed', { exact: true }).waitFor();
  await shot('11-power-on-passed');
  assert.equal(await page.getByRole('combobox', { name: 'Choose PC cable' }).isEnabled(), false);
  await page.getByRole('button', { name: 'Shut down PC', exact: true }).click();
  await page
    .getByRole('button', { name: 'Restart practice', exact: false })
    .click();
  assert.equal(
    await page.locator('.assembly-progress-label').innerText(),
    '0 / 7 placed',
  );
  await page.getByRole('button', { name: 'Parts picker', exact: true }).click();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  assert.equal(
    await page.getByRole('button', { name: /Enter interactive/ }).isEnabled(),
    false,
  );
  assert.deepEqual(errors, []);
  console.log(
    'PASS: catalogue, live canvas, cover, views, select, explode/isolate, failed placement, all seven drags, restart and reset; no page exceptions.',
  );
  await writeFile(
    'verification/optiplex/result.json',
    JSON.stringify({ passed: true, errors }, null, 2),
  );
} catch (error) {
  await shot('failure');
  await writeFile(
    'verification/optiplex/result.json',
    JSON.stringify({ passed: false, error: String(error), errors }, null, 2),
  );
  throw error;
} finally {
  await browser.close();
}

