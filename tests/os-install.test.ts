import test from 'node:test';
import assert from 'node:assert/strict';
import { START, accountProblems, installReducer, installStage, type InstallAction, type InstallState } from '../app/os-install.ts';

const run = (actions: InstallAction[], state: InstallState = START) => actions.reduce(installReducer, state);
const goodAccount = { type: 'account', name: 'Selam Tesfay', username: 'selam', computer: 'lab-pc-01', password: 'Blue-river-42', confirm: 'Blue-river-42' } as const;
const perfect: InstallAction[] = [
  { type: 'insert', port: 'front-usb' }, { type: 'power' }, { type: 'boot-menu' }, { type: 'boot', device: 'usb' },
  { type: 'language', language: 'English', keyboard: 'English (US)' }, { type: 'erase', confirmed: true }, goodAccount,
  { type: 'timezone', timezone: 'Africa/Asmara' }, { type: 'progress', amount: 0.6 }, { type: 'progress', amount: 0.6 },
  { type: 'reboot', removeUsb: true }, { type: 'login', password: 'Blue-river-42' },
];

void test('a careful student reaches the desktop with no mistakes', () => {
  const end = run(perfect);
  assert.equal(end.step, 'desktop');
  assert.equal(end.mistakes, 0);
  assert.equal(end.installed, true);
  assert.equal(end.usbIn, null);
  assert.match(end.feedback, /Welcome, Selam Tesfay/);
});

void test('each common mistake is explained, counted, and can be fixed', () => {
  let s = run([{ type: 'insert', port: 'hdmi' }]);
  assert.equal(s.mistakes, 1); assert.match(s.feedback, /HDMI/); assert.equal(s.usbIn, null);
  s = run([{ type: 'power' }], s);
  assert.equal(s.step, 'usb', 'Power without the stick waits for it'); assert.equal(s.mistakes, 1);
  s = run([{ type: 'insert', port: 'rear-usb' }, { type: 'power' }, { type: 'wait' }], s);
  assert.equal(s.step, 'no-os'); assert.equal(s.mistakes, 2); assert.match(s.feedback, /F12/);
  s = run([{ type: 'restart' }, { type: 'boot-menu' }, { type: 'boot', device: 'ssd' }], s);
  assert.equal(s.step, 'boot-menu'); assert.equal(s.mistakes, 3); assert.match(s.feedback, /empty/);
  s = run([{ type: 'boot', device: 'usb' }, { type: 'language', language: 'ትግርኛ (Tigrinya)', keyboard: 'Tigrinya (Ge’ez)' }, { type: 'erase', confirmed: false }], s);
  assert.equal(s.step, 'disk'); assert.equal(s.mistakes, 3, 'Not ticking the backup box is a reminder, not a mistake'); assert.match(s.feedback, /backed up/);
  s = run([{ type: 'erase', confirmed: true }, { ...goodAccount, password: 'selam1234', confirm: 'selam1234' }], s);
  assert.equal(s.step, 'account'); assert.equal(s.mistakes, 4); assert.match(s.feedback, /name or username/);
  s = run([goodAccount, { type: 'timezone', timezone: 'Africa/Addis_Ababa' }, { type: 'progress', amount: 1 }, { type: 'reboot', removeUsb: false }], s);
  assert.equal(s.step, 'installer-again'); assert.equal(s.mistakes, 5); assert.match(s.feedback, /still plugged in/);
  s = run([{ type: 'reboot', removeUsb: true }, { type: 'login', password: 'blue-river-42' }], s);
  assert.equal(s.step, 'login'); assert.equal(s.mistakes, 6); assert.match(s.feedback, /capital letters/);
  s = run([{ type: 'login', password: 'Blue-river-42' }], s);
  assert.equal(s.step, 'desktop');
  assert.equal(s.language, 'ትግርኛ (Tigrinya)'); assert.equal(s.timezone, 'Africa/Addis_Ababa');
});

void test('account rules: username, computer name, password length, guessable and mismatched passwords', () => {
  assert.deepEqual(accountProblems({ name: 'Selam', username: 'selam', computer: 'lab-pc', password: 'Blue-river-42', confirm: 'Blue-river-42' }), []);
  const all = accountProblems({ name: ' ', username: 'Selam!', computer: 'my pc', password: 'short', confirm: 'other' });
  assert.equal(all.length, 5);
  assert.match(accountProblems({ name: 'Selam Tesfay', username: 'st', computer: 'pc1', password: 'tesfay2026', confirm: 'tesfay2026' }).join(' '), /name or username/);
});

void test('actions that do not fit the screen change nothing; the progress bar names each stage', () => {
  assert.equal(installReducer(START, { type: 'login', password: 'x' }), START);
  const installing = run(perfect.slice(0, 8));
  assert.equal(installing.step, 'installing');
  const half = run([{ type: 'progress', amount: 0.4 }], installing);
  assert.equal(half.step, 'installing'); assert.ok(Math.abs(half.progress - 0.4) < 1e-9);
  assert.match(installStage(0.1), /Copying/);
  assert.match(installStage(0.4), /drivers/);
  assert.match(installStage(0.7), /boot loader/);
  assert.match(installStage(0.95), /language/);
});

void test('Practise again starts from the beginning', () => {
  const end = run(perfect);
  assert.deepEqual(installReducer(end, { type: 'reset' }), START);
});
