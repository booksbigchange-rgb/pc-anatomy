import { useEffect, useRef, useState } from 'react';
import AcademyLogo from './academy-logo';
import './school-opening.css';

const sessionKey = 'bigchange-school-opening-v1';
export function needsSchoolOpening() {
  try { return sessionStorage.getItem(sessionKey) !== 'seen'; }
  catch { return true; }
}

export default function SchoolOpening({ onEnter }: { onEnter: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [status, setStatus] = useState('');
  const [reducedMotion] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const enter = () => {
    try { sessionStorage.setItem(sessionKey, 'seen'); } catch { /* Entry works without storage. */ }
    onEnter();
  };
  useEffect(() => {
    if (reducedMotion) return;
    void video.current?.play().catch(() => setStatus(current => current || 'Press Play to watch, or enter the lab.'));
  }, [reducedMotion]);
  return <main className="school-opening" aria-label="Welcome to BigChange Academy">
    <header><AcademyLogo /><h1>Welcome to BigChange Academy</h1></header>
    <video ref={video} src={`${import.meta.env.BASE_URL}bigchange-school-intro.mp4`}
      poster={`${import.meta.env.BASE_URL}bigchange-school-logo.png`}
      aria-label="BigChange Academy opening animation" autoPlay={!reducedMotion}
      muted={muted} playsInline controls preload={reducedMotion ? 'none' : 'auto'}
      onEnded={enter} onError={() => setStatus('The animation could not load. You can still enter the lab.')} >
      <track kind="captions" src={`${import.meta.env.BASE_URL}bigchange-school-intro.vtt`} srcLang="en" label="English" />
    </video>
    <footer>
      <button type="button" onClick={() => setMuted(value => !value)} aria-pressed={!muted}>{muted ? 'Sound on' : 'Sound off'}</button>
      <button type="button" className="school-enter" onClick={enter}>Skip intro · Enter lab →</button>
    </footer>
    <output aria-live="polite">{status || 'Explore. Build. Learn.'}</output>
  </main>;
}
