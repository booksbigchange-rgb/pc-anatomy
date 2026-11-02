'use client';
import { useEffect, useReducer, useRef, useState } from 'react';
import { ArrowLeft, Check, HardDrive, Power, Usb } from 'lucide-react';
import AcademyLogo from './academy-logo';
import {
  INSTALL_ORDER, KEYBOARDS, LANGUAGES, START, TIMEZONES, accountProblems, installReducer, installStage,
  type InstallStep, type Port,
} from './os-install';
import { nextAttempt, readProgress, saveProgress } from './student-progress';
import './os-installer.css';

const STEP_LABEL: Record<InstallStep, string> = {
  usb: 'Plug in the installer', firmware: 'Start the PC', 'no-os': 'Start the PC', 'boot-menu': 'Boot menu',
  language: 'Language and keyboard', disk: 'Choose the disk', account: 'Create your account', timezone: 'Time zone',
  installing: 'Install', restart: 'Restart', 'installer-again': 'Restart', login: 'Sign in', desktop: 'First start-up',
};
const PORTS: { id: Port; label: string }[] = [
  { id: 'front-usb', label: 'Front USB port' }, { id: 'rear-usb', label: 'Rear USB port' },
  { id: 'hdmi', label: 'HDMI port' }, { id: 'ethernet', label: 'Ethernet port' },
];
/** The step list shows where the learner is; the no-OS and installer-again screens count as their parent step. */
const listStep = (step: InstallStep) => (step === 'no-os' ? 'firmware' : step === 'installer-again' ? 'restart' : step);

/**
 * Install an operating system: a simulated installer for Lab OS, a made-up teaching OS. Opened
 * after the power-on test in Build a PC, or from My learning path. Nothing typed here is saved;
 * only the number of attempts and mistakes goes to the learning path.
 */
export default function OsInstaller({ onExit, backLabel = 'Back', drive = 'M.2 2280 SSD', overlay = false }: { onExit: () => void; backLabel?: string; drive?: string; overlay?: boolean }) {
  const [state, dispatch] = useReducer(installReducer, START);
  const [attempt, setAttempt] = useState(0);
  const [form, setForm] = useState({ name: '', username: '', computer: 'lab-pc-01', password: '', confirm: '' });
  const [language, setLanguage] = useState<string>(LANGUAGES[0]);
  const [keyboard, setKeyboard] = useState<string>(KEYBOARDS[0]);
  const [timezone, setTimezone] = useState<string>(TIMEZONES[0]);
  const [backedUp, setBackedUp] = useState(false);
  const [signIn, setSignIn] = useState('');
  const savedFor = useRef(-1);

  // Pressing F12 on the start-up screen opens the boot menu, like on a real PC.
  useEffect(() => {
    if (state.step !== 'firmware') return;
    const key = (event: KeyboardEvent) => { if (event.key === 'F12') { event.preventDefault(); dispatch({ type: 'boot-menu' }); } };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [state.step]);

  // The progress bar fills in about eight seconds (quicker with reduced motion).
  useEffect(() => {
    if (state.step !== 'installing') return;
    const quick = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setInterval(() => dispatch({ type: 'progress', amount: quick ? 0.25 : 0.025 }), 200);
    return () => window.clearInterval(timer);
  }, [state.step]);

  // Reaching the desktop records one finished attempt on the learning path (never the account details).
  useEffect(() => {
    if (state.step !== 'desktop' || savedFor.current === attempt) return;
    savedFor.current = attempt;
    saveProgress({ osInstall: nextAttempt(readProgress().osInstall, state.mistakes) });
  }, [state.step, state.mistakes, attempt]);

  const again = () => {
    dispatch({ type: 'reset' });
    setAttempt(value => value + 1);
    setForm({ name: '', username: '', computer: 'lab-pc-01', password: '', confirm: '' });
    setBackedUp(false); setSignIn('');
  };
  const problems = accountProblems(form);
  const current = INSTALL_ORDER.indexOf(listStep(state.step));

  return (
    <main className={'os-lab' + (overlay ? ' os-lab-overlay' : '')}>
      <header className="os-topbar">
        <button type="button" onClick={onExit}><ArrowLeft size={16} /> {backLabel}</button>
        <AcademyLogo />
        <div><h1>Install an operating system</h1><p>Lab OS · a simulated installer for practice</p></div>
      </header>
      <section className="os-screen" aria-label="Computer screen">
        {state.step === 'usb' && <div className="os-desk">
          <h2><Usb size={22} /> Plug in the installer USB stick</h2>
          <p>Lab OS comes on a USB stick. Choose where to plug it in.</p>
          <div className="os-choices">{PORTS.map(port => <button key={port.id} type="button" aria-pressed={state.usbIn === port.id} onClick={() => dispatch({ type: 'insert', port: port.id })}>{port.label}</button>)}</div>
          <button type="button" className="os-primary" onClick={() => dispatch({ type: 'power' })}><Power size={18} /> Press the power button</button>
        </div>}
        {state.step === 'firmware' && <div className="os-firmware">
          <p className="os-brand">BigChange Lab PC</p>
          <pre>{`Checking hardware…\nCPU ............ OK\nMemory ......... OK\nStorage: ${drive} ... found\nUSB: Lab OS installer ... found`}</pre>
          <p className="os-prompt">Press F12 for the boot menu</p>
          <div className="os-choices"><button type="button" onClick={() => dispatch({ type: 'boot-menu' })}>F12 · Boot menu</button><button type="button" onClick={() => dispatch({ type: 'wait' })}>Wait</button></div>
        </div>}
        {state.step === 'no-os' && <div className="os-firmware">
          <p className="os-error">No operating system found on the drive.</p>
          <pre>{`Tried: ${drive} (empty)\nInsert installation media and restart.`}</pre>
          <button type="button" onClick={() => dispatch({ type: 'restart' })}>Restart</button>
        </div>}
        {state.step === 'boot-menu' && <div className="os-firmware">
          <p className="os-brand">Boot menu · choose a start-up device</p>
          <div className="os-list">
            <button type="button" onClick={() => dispatch({ type: 'boot', device: 'ssd' })}><HardDrive size={16} /> {drive} (empty)</button>
            <button type="button" onClick={() => dispatch({ type: 'boot', device: 'usb' })}><Usb size={16} /> USB: Lab OS installer</button>
            <button type="button" onClick={() => dispatch({ type: 'boot', device: 'network' })}>Network start-up</button>
          </div>
        </div>}
        {(state.step === 'language' || state.step === 'installer-again') && <div className="os-installer">
          <h2>Welcome to the Lab OS installer</h2>
          {state.step === 'installer-again'
            ? <><p className="os-warn">The installer opened again, because the PC started from the USB stick.</p><button type="button" className="os-primary" onClick={() => dispatch({ type: 'reboot', removeUsb: true })}>Remove the USB stick and restart</button></>
            : <>
              <label>Language<select value={language} onChange={event => setLanguage(event.target.value)}>{LANGUAGES.map(item => <option key={item}>{item}</option>)}</select></label>
              <label>Keyboard layout<select value={keyboard} onChange={event => setKeyboard(event.target.value)}>{KEYBOARDS.map(item => <option key={item}>{item}</option>)}</select></label>
              <p className="os-note">This practice stays in English. On a real computer, the whole system would switch to the language you choose.</p>
              <button type="button" className="os-primary" onClick={() => dispatch({ type: 'language', language, keyboard })}>Continue</button>
            </>}
        </div>}
        {state.step === 'disk' && <div className="os-installer">
          <h2>Where should Lab OS go?</h2>
          <div className="os-disk"><HardDrive size={22} /><div><strong>{drive}</strong><span>New drive · empty</span></div></div>
          <p><strong>Erase disk and install Lab OS.</strong> Everything on this drive will be deleted.</p>
          <label className="os-check"><input type="checkbox" checked={backedUp} onChange={event => setBackedUp(event.target.checked)} /> I checked: nothing important is on this drive, or it is backed up somewhere else.</label>
          <button type="button" className="os-primary" onClick={() => dispatch({ type: 'erase', confirmed: backedUp })}>Erase and install</button>
        </div>}
        {state.step === 'account' && <form className="os-installer" onSubmit={event => { event.preventDefault(); dispatch({ type: 'account', ...form }); }}>
          <h2>Who will use this computer?</h2>
          <p className="os-note">Practice only. Nothing you type here is saved. Do not use a real password.</p>
          <label>Your name<input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} autoComplete="off" /></label>
          <label>Computer name<input value={form.computer} onChange={event => setForm({ ...form, computer: event.target.value })} autoComplete="off" /></label>
          <label>Username<input value={form.username} onChange={event => setForm({ ...form, username: event.target.value })} autoComplete="off" autoCapitalize="none" /></label>
          <label>Password<input type="password" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} autoComplete="new-password" /></label>
          <label>Type the password again<input type="password" value={form.confirm} onChange={event => setForm({ ...form, confirm: event.target.value })} autoComplete="new-password" /></label>
          <ul className="os-rules" aria-label="Account rules">{['At least 8 characters', 'Not your name or username', 'Both passwords the same'].map((rule, index) => {
            const met = index === 0 ? form.password.length >= 8 : index === 1 ? form.password.length >= 8 && !problems.some(item => item.includes('do not use your name')) : !!form.password && form.password === form.confirm;
            return <li key={rule} className={met ? 'met' : ''}>{met ? <Check size={14} /> : '·'} {rule}</li>;
          })}</ul>
          <button type="submit" className="os-primary">Continue</button>
        </form>}
        {state.step === 'timezone' && <div className="os-installer">
          <h2>Where are you?</h2>
          <label>Time zone<select value={timezone} onChange={event => setTimezone(event.target.value)}>{TIMEZONES.map(item => <option key={item} value={item}>{item.replace('_', ' ').replace('/', ' / ')}</option>)}</select></label>
          <p className="os-note">The clock and calendar use this time zone.</p>
          <button type="button" className="os-primary" onClick={() => dispatch({ type: 'timezone', timezone })}>Install now</button>
        </div>}
        {state.step === 'installing' && <div className="os-installer">
          <h2>Installing Lab OS</h2>
          <progress max={1} value={state.progress} aria-label="Installation progress" />
          <p className="os-stage">{installStage(state.progress)}</p>
          <p className="os-note">While you wait: the OS is copied from the USB stick to the SSD because the SSD is much faster and stays inside the PC.</p>
        </div>}
        {state.step === 'restart' && <div className="os-installer">
          <h2>Installation complete</h2>
          <p>Lab OS is now on the {drive}.</p>
          <div className="os-choices">
            <button type="button" className="os-primary" onClick={() => dispatch({ type: 'reboot', removeUsb: true })}>Remove the USB stick and restart</button>
            <button type="button" onClick={() => dispatch({ type: 'reboot', removeUsb: false })}>Restart now</button>
          </div>
        </div>}
        {state.step === 'login' && <form className="os-login" onSubmit={event => { event.preventDefault(); dispatch({ type: 'login', password: signIn }); setSignIn(''); }}>
          <div className="os-avatar" aria-hidden="true">{state.account?.name.slice(0, 1).toUpperCase()}</div>
          <h2>{state.account?.name}</h2>
          <p>{state.account?.username} · {state.account?.computer}</p>
          <label>Password<input type="password" value={signIn} onChange={event => setSignIn(event.target.value)} autoComplete="off" /></label>
          <button type="submit" className="os-primary">Sign in</button>
        </form>}
        {state.step === 'desktop' && <div className="os-desktop">
          <section className="os-window" aria-label="Welcome to Lab OS">
            <h2>Welcome to Lab OS</h2>
            <p>Installed on the {drive} · {state.language} · {state.keyboard} keyboard · {state.timezone.replace('_', ' ')}</p>
            <h3>What you did</h3>
            <ul>
              <li>Started the PC from the installer USB stick using the boot menu</li>
              <li>Erased the empty SSD and copied the OS onto it</li>
              <li>Made an account with a strong password</li>
              <li>Removed the USB stick so the PC starts from the SSD</li>
            </ul>
            <p><strong>{state.mistakes === 0 ? 'No mistakes.' : `${state.mistakes} mistake${state.mistakes === 1 ? '' : 's'} found and fixed.`}</strong> Saved to your learning path.</p>
            <div className="os-choices"><button type="button" onClick={again}>Practise again</button><button type="button" className="os-primary" onClick={onExit}>Done</button></div>
          </section>
          <div className="os-taskbar" aria-hidden="true"><span>Lab OS</span><span>Files</span><span>Browser</span><span>Settings</span></div>
        </div>}
      </section>
      <aside className="os-coach" aria-live="polite">
        <p className="os-eyebrow">INSTALL COACH</p>
        <output className={state.wrong ? 'wrong' : ''}>{state.feedback}</output>
        <ol className="os-steps">{INSTALL_ORDER.map((step, index) => <li key={step} className={index < current ? 'done' : index === current ? 'current' : ''}>{index < current ? <Check size={14} /> : <span>{index + 1}</span>} {STEP_LABEL[step]}</li>)}</ol>
        <p className="os-mistakes">Mistakes so far: {state.mistakes}</p>
        <p className="os-note">Simulated installer for learning. Real installers look different and have more choices, but follow the same steps.</p>
      </aside>
    </main>
  );
}
