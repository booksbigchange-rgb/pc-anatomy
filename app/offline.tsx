import { useEffect, useState } from 'react';

/**
 * Offline mode: a service worker (public/sw.js) saves the app so the lab opens without
 * internet, and can save every 3D model on request. Only the published build registers it.
 */
export function registerOffline() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).catch(() => undefined);
}

type PackState =
  | { kind: 'unsupported' }
  | { kind: 'preparing' }
  | { kind: 'ready'; saved: number; total: number }
  | { kind: 'saving'; done: number; total: number }
  | { kind: 'saved'; total: number }
  | { kind: 'error'; message: string };

export function OfflineControl() {
  const supported = import.meta.env.PROD && typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  const [state, setState] = useState<PackState>(supported ? { kind: 'preparing' } : { kind: 'unsupported' });
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [packMegabytes, setPackMegabytes] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    addEventListener('online', update);
    addEventListener('offline', update);
    return () => { removeEventListener('online', update); removeEventListener('offline', update); };
  }, []);

  useEffect(() => {
    if (!supported) return;
    let live = true;
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; saved?: number; done?: number; total?: number; message?: string };
      if (!live || !data?.type) return;
      if (data.type === 'pack-status') setState(data.saved === data.total ? { kind: 'saved', total: data.total ?? 0 } : { kind: 'ready', saved: data.saved ?? 0, total: data.total ?? 0 });
      if (data.type === 'pack-progress') setState({ kind: 'saving', done: data.done ?? 0, total: data.total ?? 0 });
      if (data.type === 'pack-ready') setState({ kind: 'saved', total: data.total ?? 0 });
      if (data.type === 'pack-error') setState({ kind: 'error', message: data.message ?? 'Unknown error' });
    };
    navigator.serviceWorker.addEventListener('message', onMessage);
    void navigator.serviceWorker.ready.then(registration => registration.active?.postMessage({ type: 'pack-status' }));
    void fetch(`${import.meta.env.BASE_URL}offline-manifest.json`, { cache: 'no-store' })
      .then(response => response.json() as Promise<{ packBytes?: number }>)
      .then(manifest => { if (live && manifest.packBytes) setPackMegabytes(Math.round(manifest.packBytes / 1e6)); })
      .catch(() => undefined);
    return () => { live = false; navigator.serviceWorker.removeEventListener('message', onMessage); };
  }, [supported]);

  const savePack = () => {
    setState(previous => ({ kind: 'saving', done: 0, total: previous.kind === 'ready' ? previous.total : 0 }));
    void navigator.serviceWorker.ready.then(registration => registration.active?.postMessage({ type: 'download-pack' }));
  };

  if (state.kind === 'unsupported') return null;
  return (
    <section className="offline-card" aria-label="Offline use" aria-live="polite">
      <strong>{online ? 'Offline use' : 'You are offline'}</strong>
      {state.kind === 'preparing' && <p>Getting the lab ready to open without internet…</p>}
      {state.kind === 'ready' && <>
        <p>This lab now opens without internet. 3D laptop models saved: {state.saved} of {state.total}.</p>
        <button type="button" disabled={!online} onClick={savePack}>Save all labs for offline use{packMegabytes ? ` (${packMegabytes} MB)` : ''}</button>
        {!online && <p>Connect to the internet to save the rest.</p>}
      </>}
      {state.kind === 'saving' && <>
        <p>Saving 3D models… {state.done} of {state.total}</p>
        <progress max={state.total || 1} value={state.done} />
      </>}
      {state.kind === 'saved' && <p>✓ All labs are saved for offline use on this computer.</p>}
      {state.kind === 'error' && <>
        <p>Saving stopped: {state.message}. Check the connection and try again.</p>
        <button type="button" onClick={savePack}>Try again</button>
      </>}
    </section>
  );
}
