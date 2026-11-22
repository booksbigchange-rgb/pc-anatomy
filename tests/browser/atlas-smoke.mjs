import { chromium } from 'playwright';
import assert from 'node:assert/strict';

/**
 * A quick live check of the school's own screens: the School home, a lesson
 * opened from its link, and the teacher page. The lab checks beside this
 * file cover the labs; this covers what they do not.
 *
 *   ATLAS_TEST_URL=https://…/pc-anatomy/atlas/ node tests/browser/atlas-smoke.mjs
 */
const base = process.env.ATLAS_TEST_URL || 'http://127.0.0.1:5173/';
const at = (search) => new URL(search, base).toString();

const browser = await chromium.launch({
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.setDefaultTimeout(60000);
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));

try {
  await page.goto(base);
  await page
    .getByRole('heading', {
      name: 'Learn how technology works by taking it apart.',
    })
    .waitFor();
  const subjects = await page.locator('.school-subject h2').allInnerTexts();
  assert.deepEqual(subjects, [
    'Computers',
    'Inside the chip',
    'Networks and the internet',
  ]);

  await page.goto(at('?lesson=meet-the-machine&step=2'));
  await page
    .getByRole('heading', { name: 'The motherboard', level: 3 })
    .waitFor();
  await page.locator('.viewport[data-level="pc"]').waitFor();
  assert.match(
    await page.locator('.lesson-count').innerText(),
    /Step 2 of 10/i,
  );

  await page.goto(at('?teach'));
  await page
    .getByRole('heading', {
      name: 'Lessons, answer keys and links for your class.',
    })
    .waitFor();
  assert.equal(await page.locator('.teach-lesson').count(), 15);

  assert.deepEqual(errors, [], 'no uncaught page errors');
  console.log('atlas smoke: passed');
} finally {
  await browser.close();
}
