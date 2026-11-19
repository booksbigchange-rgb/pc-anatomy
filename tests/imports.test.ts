import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// `npm test` runs on Node's type stripping, which resolves no extensionless
// imports. One `from './models'` anywhere in a module's import graph makes that
// module unimportable from every test. Load every lib module so a missing
// `.ts` extension fails here instead of when someone first writes a test.
const lib = fileURLToPath(new URL('../lib/', import.meta.url));
const modules = readdirSync(lib, { recursive: true, encoding: 'utf8' })
  .filter((file) => file.endsWith('.ts'))
  .sort();

await test('every lib module loads under the test runner', async () => {
  assert.ok(modules.length > 0);
  for (const file of modules) {
    await assert.doesNotReject(
      import(new URL(`../lib/${file}`, import.meta.url).href),
      `lib/${file} cannot be imported by tests`,
    );
  }
});

await test('the scene module exposes createViewer', async () => {
  const scene = await import('../lib/scene.ts');
  assert.equal(typeof scene.createViewer, 'function');
});
