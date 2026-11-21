'use client';
import { useEffect, useRef } from 'react';
import { readAddress, writeAddress, type Address } from '@/lib/url-state';

/** Which changes deserve their own Back-button entry: a new scale or step. */
function pageOf(address: Address) {
  if (address.kind === 'lesson')
    return `lesson:${address.lesson}:${address.step}`;
  if (address.kind === 'view') return `scale:${address.scene.level}`;
  if (address.kind === 'lab') return `lab:${address.lab}`;
  return 'home';
}

/**
 * Keep the address bar in step with what is on screen, and follow Back and
 * Forward. A new screen — the School home, a lab, a scale or a lesson step —
 * is a history entry; anything finer (the slider, a selection, the camera
 * view) replaces the current one, so Back does not walk through every frame
 * of a disassembly. Writes wait for the stage to settle: browsers throttle
 * history calls, and a dive or the Auto playback would otherwise make one
 * per frame.
 */
export function useAddress({
  address,
  settling,
  onAddress,
}: {
  /** What the address bar should say for the screen now showing. */
  address: Address;
  /** A dive or playback is running; write once it stops. */
  settling: boolean;
  onAddress: (address: Address) => void;
}) {
  const search = writeAddress(address);
  const page = pageOf(address);
  const shownPage = useRef(page);

  useEffect(() => {
    if (settling) return;
    const timer = setTimeout(() => {
      if (location.search !== search) {
        const url = location.pathname + search + location.hash;
        try {
          if (page !== shownPage.current) history.pushState(null, '', url);
          else history.replaceState(null, '', url);
        } catch {
          // A browser that refuses the write leaves the old address; the
          // view itself is unaffected.
        }
      }
      shownPage.current = page;
    }, 250);
    return () => clearTimeout(timer);
  }, [page, search, settling]);

  const follow = useRef(onAddress);
  useEffect(() => {
    follow.current = onAddress;
  });
  useEffect(() => {
    const pop = () => {
      const next = readAddress(location.search);
      shownPage.current = pageOf(next);
      follow.current(next);
    };
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, []);
}
