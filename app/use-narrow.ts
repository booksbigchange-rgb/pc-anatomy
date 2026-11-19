'use client';
import { useSyncExternalStore } from 'react';

/**
 * Whether the stage is in its phone and tablet arrangement: the rail is a
 * drawer and the detail panel competes with the stage for room. Matches the
 * breakpoints in workbench.css where the rail collapses.
 */
const query = '(max-width: 900px), (max-height: 500px)';

function subscribe(change: () => void) {
  const list = matchMedia(query);
  list.addEventListener('change', change);
  return () => list.removeEventListener('change', change);
}

export function useNarrow() {
  return useSyncExternalStore(
    subscribe,
    () => matchMedia(query).matches,
    () => false,
  );
}
