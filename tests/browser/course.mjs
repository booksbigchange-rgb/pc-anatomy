import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('verification/course', { recursive: true });
const browser = await chromium.launch({ channel: process.env.ATLAS_BROWSER_CHANNEL || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(20000);
const errors = []; page.on('pageerror', error => errors.push(error.message));
const click = async name => page.getByRole('button', { name, exact: true }).click();
const shot = async name => { await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(200); return page.screenshot({ path: `verification/course/${name}.png` }); };
try {
  await page.goto(process.env.ATLAS_TEST_URL || 'http://127.0.0.1:5186/');
  await click('My learning path');
  await shot('01-learning-path');
  await click('How parts work together');
  await click('RAM'); assert.match(await page.locator('.course-lab output').innerText(), /Try again/);
  for (const [i, answer] of ['SSD', 'RAM', 'CPU', 'SSD', 'It is cleared without power'].entries()) {
    await click(answer); await click(i === 4 ? 'Finish photo practice' : 'Next step');
  }
  assert.match(await page.locator('.course-lab').innerText(), /Photo saved/);
  await click('OS and files');
  await click('Power on'); await click('Sign in'); await click('Open Notes');
  await page.getByRole('textbox', { name: 'My note' }).fill('BigChange lesson'); await click('Save note');
  await page.getByRole('textbox', { name: 'My note' }).fill('Unsaved edit');
  await click('Shut down'); await click('Power on'); await click('Sign in'); await click('Open saved note');
  assert.equal(await page.getByRole('textbox', { name: 'My note' }).inputValue(), 'BigChange lesson');
  await click('Move note to Recycle Bin'); await click('Restore note');
  assert.match(await page.locator('.course-lab').innerText(), /OS practice completed/);
  await shot('02-os-files');
  await click('Final knowledge check');
  const answers = ['Speaker', 'RAM', 'SSD', 'Shut down and unplug power', 'Check its type and notch direction', 'Disk activity', 'Manages apps, files and hardware access', 'Check the display cable and input'];
  for (const [i, answer] of answers.entries()) { await click(answer); if (i < 7) await click('Next question'); }
  assert.match(await page.locator('.course-result').innerText(), /7 \/ 8 correct/);
  const downloadPromise = page.waitForEvent('download'); await click('Download my results'); const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), 'bigchange-my-learning.json');
  await shot('03-final-review');
  await page.reload(); await click('My learning path');
  assert.match(await page.getByRole('region', { name: 'Learning path' }).innerText(), /7 \/ 8 correct/);
  assert.equal(await page.getByText('✓ Practice completed', { exact: true }).count(), 2);
  await page.setViewportSize({ width: 390, height: 844 }); await shot('04-phone-path');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  // Keyboard navigation and visible focus must reach the active section.
  await page.getByRole('button', { name: 'OS and files', exact: true }).focus(); await page.keyboard.press('Enter');
  assert.equal(await page.getByRole('button', { name: 'OS and files', exact: true }).getAttribute('aria-current'), 'page');
  await click('Final knowledge check');
  await page.evaluate(()=>{ Storage.prototype.setItem = () => { throw Error('Storage unavailable'); }; });
  await click('Start a fresh attempt');
  assert.match(await page.getByRole('alert').innerText(), /could not save/);
  assert.deepEqual(errors, []);
  await writeFile('verification/course/result.json', JSON.stringify({ passed: true, errors, checks: ['data route correction', 'saved file survives shutdown', 'delete/restore', 'assessment mistakes and review', 'progress reload', 'download', 'phone layout', 'keyboard navigation'] }, null, 2));
  console.log('PASS course: data flow, OS, assessment, persistence, export, phone and keyboard.');
} catch (error) { await shot('failure'); throw error; } finally { await browser.close(); }
