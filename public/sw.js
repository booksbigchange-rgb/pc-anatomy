/*
 * Offline mode is paused. This worker replaces the earlier offline worker in any browser
 * that installed it: it deletes the lab's saved files and unregisters itself. Open pages keep
 * running (no reload, so no lost work); the next visit loads straight from the network.
 */
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) if (name.startsWith('bigchange-lab:')) await caches.delete(name);
    await self.registration.unregister();
  })());
});
