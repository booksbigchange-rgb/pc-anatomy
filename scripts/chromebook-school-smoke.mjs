import { chromium } from '@playwright/test';

const baseURL = process.env.BASE_URL ?? 'http://127.0.0.1:4173';
const browser = await chromium.launch({
  headless: true,
  args: ['--use-angle=swiftshader', '--disable-dev-shm-usage'],
});
const context = await browser.newContext({
  viewport: { width: 1366, height: 768 },
  deviceScaleFactor: 1,
  reducedMotion: 'reduce',
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push('pageerror: ' + error.message));
page.on('console', msg => {
  if (msg.type() === 'error') errors.push('console: ' + msg.text());
});

const step = async (label, fn) => {
  try {
    await fn();
    console.log('PASS ' + label);
  } catch (error) {
    console.error('FAIL ' + label);
    throw error;
  }
};

await step('Computer Lab loads at Chromebook classroom viewport', async () => {
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.getByText('Big Change Computer Lab').waitFor();
  await page.getByRole('button', { name: 'Laptop Lab' }).waitFor();
});

await step('Computer Lab has a keyboard-accessible connection path', async () => {
  const connections = page.getByRole('button', { name: 'Connections' }).first();
  await connections.focus();
  await page.keyboard.press('Enter');
  const fallback = page.getByRole('button', { name: /keyboard-accessible alternative/i });
  await fallback.waitFor();
  await fallback.focus();
  await page.keyboard.press('Enter');
  await page.getByText(/Correct — Keyboard → USB is connected/i).waitFor();
});

await step('Laptop Lab loads and exposes keyboard connection alternative', async () => {
  await page.getByRole('button', { name: 'Laptop Lab' }).click();
  await page.getByText('Big Change Laptop Lab').waitFor();
  await page.getByRole('button', { name: 'Connections' }).click();
  const fallback = page.getByRole('button', { name: /Connect .*keyboard-accessible alternative/i });
  await fallback.waitFor();
  await fallback.focus();
  await page.keyboard.press('Enter');
  await page.getByText(/Correct — .* is connected/i).waitFor();
});

await step('Laptop teardown exposes non-canvas cable controls', async () => {
  await page.getByRole('button', { name: /Desktop setup/i }).click();
  await page.getByRole('button', { name: 'Laptop Lab' }).click();
  await page.getByRole('button', { name: /Inside/i }).click();
  const slider = page.getByRole('slider', { name: 'Laptop teardown progress' });
  await slider.fill('30');
  const battery = page.getByRole('button', { name: /Unplug Battery cable/i });
  await battery.waitFor();
  await battery.focus();
  await page.keyboard.press('Enter');
  await page.getByRole('region', { name: /Keyboard-accessible internal cable controls/i }).getByText(/Battery cable unplugged/i).waitFor();
});

await step('PC Build carries chosen parts into interactive installation and exposes a non-drag path', async () => {
  await page.getByRole('button', { name: /Desktop setup/i }).click();
  await page.getByRole('button', { name: 'Build a PC' }).click();

  for (const part of [
    'Intel Core i5-6500',
    'Dell Q170 System Board',
    '8 GB DDR4',
    'M.2 2280 SSD',
    'Slot-powered PCIe Card',
    'Dell 240 W Power Supply',
  ]) {
    await page.getByRole('button', { name: part }).last().click();
  }

  const enter = page.getByRole('button', { name: /Enter interactive 3D installation/i });
  await enter.waitFor();
  if (await enter.isDisabled()) throw new Error('Build choices did not produce an enabled installation flow.');
  await enter.click();

  await page.getByRole('button', { name: 'Start assembly practice' }).click();
  await page.getByRole('button', { name: /Seat .* in its guide/i }).waitFor();
});

await step('No fatal browser errors during core smoke path', async () => {
  const fatal = errors.filter(message =>
    !message.includes('favicon') &&
    !message.includes('Failed to load resource')
  );
  if (fatal.length) throw new Error(fatal.join('\n'));
});

await page.screenshot({ path: 'artifacts/chromebook-school-smoke.png', fullPage: true });
await browser.close();
