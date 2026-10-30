/*
 * Offline support for the BigChange computer lab.
 *
 * - Install: save the app shell listed in offline-manifest.json (code, styles, fonts, icons).
 * - Pages: network first, falling back to the saved index.html when offline.
 * - Hashed assets: saved copy first (their names change when their content does).
 * - 3D models and other files: saved copy first, refreshed in the background when online.
 * - "download-pack" message: save every 3D model now, reporting progress to the page.
 *
 * Each published copy (the main lab at /pc-anatomy/ and the school edition at
 * /pc-anatomy/school/) has its own worker and caches; neither touches the other's files.
 */
const SCOPE = new URL(self.registration.scope);
const PREFIX = `bigchange-lab:${SCOPE.pathname}`;
const RUNTIME = `${PREFIX}:files`;
const IS_ROOT = !SCOPE.pathname.endsWith('/school/');

const MANIFEST = new URL('offline-manifest.json', SCOPE);
const MANIFEST_CACHE = `${PREFIX}:manifest`;

/** The latest file list: from the network when online, else the copy saved at install. */
async function manifest() {
  try {
    const response = await fetch(MANIFEST, { cache: 'no-store' });
    if (!response.ok) throw new Error(`offline manifest ${response.status}`);
    await (await caches.open(MANIFEST_CACHE)).put(MANIFEST, response.clone());
    return response.json();
  } catch (error) {
    const saved = await caches.match(MANIFEST, { ignoreVary: true });
    if (saved) return saved.json();
    throw error;
  }
}

const shellCache = version => `${PREFIX}:shell:${version}`;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const { version, shell } = await manifest();
    const cache = await caches.open(shellCache(version));
    await cache.addAll(shell.map(path => new URL(path, SCOPE)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const { version } = await manifest().catch(() => ({ version: null }));
    for (const name of await caches.keys())
      if (version && name.startsWith(`${PREFIX}:shell:`) && name !== shellCache(version)) await caches.delete(name);
    await self.clients.claim();
  })());
});

/** Only this copy's own files: the school edition under the main scope has its own worker. */
function ours(url) {
  if (url.origin !== SCOPE.origin || !url.pathname.startsWith(SCOPE.pathname)) return false;
  return !(IS_ROOT && url.pathname.startsWith(`${SCOPE.pathname}school/`));
}

// Same file, whatever headers asked for it: servers may answer with Vary: Origin.
const MATCH = { ignoreSearch: true, ignoreVary: true };

async function savedCopy(request) {
  return caches.match(request, MATCH);
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (!ours(url) || url.pathname.endsWith('/sw.js') || url.pathname.endsWith('/version.json')) return;

  if (url.pathname === MANIFEST.pathname) {
    event.respondWith(fetch(request).catch(async () => (await caches.match(MANIFEST, { ignoreVary: true })) ?? Response.error()));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        return await fetch(request);
      } catch {
        return (await caches.match(new URL('index.html', SCOPE), MATCH)) ?? Response.error();
      }
    })());
    return;
  }

  if (url.pathname.startsWith(`${SCOPE.pathname}assets/`)) {
    event.respondWith((async () => {
      const saved = await savedCopy(request);
      if (saved) return saved;
      const response = await fetch(request);
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(RUNTIME).then(cache => cache.put(request, copy)));
      }
      return response;
    })());
    return;
  }

  // Models and other public files: answer from the saved copy, refresh it when online.
  event.respondWith((async () => {
    const saved = await savedCopy(request);
    const refresh = fetch(request).then(async response => {
      if (response.ok) await (await caches.open(RUNTIME)).put(request, response.clone());
      return response;
    });
    if (saved) {
      event.waitUntil(refresh.catch(() => undefined));
      return saved;
    }
    return refresh;
  })());
});

/** Save every file in the offline pack, telling the page how far it has got. */
async function downloadPack(client) {
  const { pack } = await manifest();
  const cache = await caches.open(RUNTIME);
  let done = 0;
  for (const path of pack) {
    const url = new URL(path, SCOPE);
    if (!(await cache.match(url, MATCH))) {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${path}: ${response.status}`);
      await cache.put(url, response);
    }
    done += 1;
    client?.postMessage({ type: 'pack-progress', done, total: pack.length });
  }
  client?.postMessage({ type: 'pack-ready', total: pack.length });
}

/** Report how much of the pack is already saved. */
async function packStatus(client) {
  const { pack } = await manifest();
  const cache = await caches.open(RUNTIME);
  let saved = 0;
  for (const path of pack) if (await cache.match(new URL(path, SCOPE), MATCH)) saved += 1;
  client?.postMessage({ type: 'pack-status', saved, total: pack.length });
}

self.addEventListener('message', event => {
  const client = event.source;
  if (event.data?.type === 'download-pack')
    event.waitUntil(downloadPack(client).catch(error => client?.postMessage({ type: 'pack-error', message: String(error.message || error) })));
  if (event.data?.type === 'pack-status') event.waitUntil(packStatus(client).catch(() => undefined));
});
