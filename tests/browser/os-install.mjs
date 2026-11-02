// Install an operating system: the simulated Lab OS installer from My learning path.
//   ATLAS_TEST_URL=http://127.0.0.1:5186/ node tests/browser/os-install.mjs
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const out = 'verification/os-install';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: process.env.ATLAS_BROWSER_CHANNEL || undefined });
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
page.setDefaultTimeout(30000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const shot = async name => { try { await page.screenshot({ path: `${out}/${name}.png`, timeout: 60000 }); console.log('Capture', name); } catch (error) { console.warn('Screenshot skipped', name, error.message.split('\n')[0]); } };
const lab = page.locator('.os-lab');
const coach = () => lab.locator('.os-coach output').innerText();
const press = name => lab.getByRole('button', { name, exact: true }).click();
const PASSWORD = 'Blue-river-42';

try {
  await page.goto(process.env.ATLAS_TEST_URL || 'http://127.0.0.1:5186/', { waitUntil: 'domcontentloaded' });
  const skip = page.getByRole('button', { name: /Skip intro/ });
  await page.getByRole('button', { name: /Skip intro|Connections/ }).first().waitFor();
  if (await skip.count()) await skip.click();
  await page.locator('header').getByRole('button', { name: 'My learning path', exact: true }).click();
  assert.match(await page.getByRole('region', { name: 'Learning path' }).innerText(), /\d \/ 9 results recorded/);
  const item = page.locator('.course-path li').filter({ hasText: 'Install an operating system' });
  assert.match(await item.innerText(), /Not completed yet/);
  await item.getByRole('button', { name: 'Install an OS' }).click();
  await lab.waitFor();

  // USB stick: the wrong port is explained; power needs the stick first.
  await press('Press the power button');
  assert.match(await coach(), /Plug in the installer USB stick first/);
  await press('HDMI port');
  assert.match(await coach(), /HDMI/);
  await press('Front USB port');
  await press('Press the power button');
  assert.match(await lab.locator('.os-screen').innerText(), /Press F12 for the boot menu/);
  await shot('01-firmware');
  // Waiting instead of F12 finds no OS; restart and use the F12 key on the keyboard.
  await press('Wait');
  assert.match(await coach(), /no operating system/);
  await press('Restart');
  await page.keyboard.press('F12');
  await lab.getByText('Boot menu · choose a start-up device').waitFor();
  await lab.getByRole('button', { name: /\(empty\)/ }).click();
  assert.match(await coach(), /new and empty/);
  await press('USB: Lab OS installer');

  // Installer: language, disk (backup reminder), account rules, time zone.
  await lab.getByLabel('Language').selectOption('ትግርኛ (Tigrinya)');
  await lab.getByLabel('Keyboard layout').selectOption('Tigrinya (Ge’ez)');
  await shot('02-language');
  await press('Continue');
  await press('Erase and install');
  assert.match(await coach(), /backed up/);
  await lab.getByLabel(/I checked/).check();
  await press('Erase and install');
  await lab.getByLabel('Your name').fill('Selam Tesfay');
  await lab.getByLabel('Username').fill('selam');
  await lab.getByLabel('Password', { exact: true }).fill('selam2026');
  await lab.getByLabel('Type the password again').fill('selam2026');
  await press('Continue');
  assert.match(await coach(), /do not use your name or username/);
  await lab.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await lab.getByLabel('Type the password again').fill(PASSWORD);
  assert.equal(await lab.locator('.os-rules li.met').count(), 3, 'All three password rules show as met');
  await shot('03-account');
  await press('Continue');
  await lab.getByLabel('Time zone').selectOption('Africa/Asmara');
  await press('Install now');
  assert.match(await lab.locator('.os-stage').innerText(), /Copying|drivers|boot loader|language/);
  await shot('04-installing');
  await lab.getByText('Installation complete').waitFor({ timeout: 30000 });

  // Restarting with the USB stick in opens the installer again.
  await press('Restart now');
  assert.match(await coach(), /still plugged in/);
  await press('Remove the USB stick and restart');
  await lab.getByLabel('Password').fill('blue-river-42');
  await press('Sign in');
  assert.match(await coach(), /capital letters/);
  await lab.getByLabel('Password').fill(PASSWORD);
  await press('Sign in');
  const welcome = lab.getByRole('region', { name: 'Welcome to Lab OS' });
  await welcome.waitFor();
  assert.match(await welcome.innerText(), /ትግርኛ \(Tigrinya\)/);
  assert.match(await welcome.innerText(), /6 mistakes found and fixed/);
  await shot('05-desktop');

  // Saved to the learning path, without the name or the password.
  const stored = await page.evaluate(() => JSON.stringify(localStorage));
  assert.ok(!stored.includes(PASSWORD) && !stored.includes('Selam'), 'Nothing typed in the installer is stored');
  await press('Done');
  assert.match(await item.innerText(), /✓ Lab OS installed · latest: 6 mistakes · best: 6 mistakes · 1 attempt/);

  // Phone width: no sideways scrolling.
  await item.getByRole('button', { name: 'Install an OS' }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await lab.waitFor();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'Installer fits a phone');
  await shot('06-phone');

  assert.deepEqual(errors, [], 'No uncaught browser errors');
  console.log('PASS os install: learning-path entry, USB port, boot menu (F12 key), empty SSD, backup reminder, account rules, progress, USB left in, sign-in, desktop, saved result without personal data, phone width.');
} finally {
  await browser.close();
}
