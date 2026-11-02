/**
 * Install an operating system: a simplified, generic installer for "Lab OS", a made-up teaching
 * OS. It follows the steps every real installation shares (installer USB, boot menu, language,
 * disk, account, time zone, copying files, first start-up) without copying any real product's
 * screens. Pure rules; the screens live in os-installer.tsx.
 */
export type InstallStep =
  | 'usb' | 'firmware' | 'no-os' | 'boot-menu' | 'language' | 'disk' | 'account'
  | 'timezone' | 'installing' | 'restart' | 'installer-again' | 'login' | 'desktop';

export type Port = 'front-usb' | 'rear-usb' | 'hdmi' | 'ethernet';
export type BootDevice = 'ssd' | 'usb' | 'network';
export type Account = { name: string; username: string; computer: string; password: string };

export type InstallState = {
  step: InstallStep;
  usbIn: Port | null;
  installed: boolean;
  language: string;
  keyboard: string;
  timezone: string;
  account: Account | null;
  progress: number;
  mistakes: number;
  feedback: string;
  wrong: boolean;
};

export type InstallAction =
  | { type: 'insert'; port: Port }
  | { type: 'power' }
  | { type: 'boot-menu' }
  | { type: 'wait' }
  | { type: 'restart' }
  | { type: 'boot'; device: BootDevice }
  | { type: 'language'; language: string; keyboard: string }
  | { type: 'erase'; confirmed: boolean }
  | { type: 'account'; name: string; username: string; computer: string; password: string; confirm: string }
  | { type: 'timezone'; timezone: string }
  | { type: 'progress'; amount: number }
  | { type: 'reboot'; removeUsb: boolean }
  | { type: 'login'; password: string }
  | { type: 'reset' };

export const LANGUAGES = ['English', 'ትግርኛ (Tigrinya)', 'አማርኛ (Amharic)', 'العربية (Arabic)'] as const;
export const KEYBOARDS = ['English (US)', 'Tigrinya (Ge’ez)', 'Amharic (Ge’ez)', 'Arabic'] as const;
export const TIMEZONES = ['Africa/Asmara', 'Africa/Addis_Ababa', 'Africa/Nairobi', 'Europe/London', 'America/New_York'] as const;

/** What the installer is doing at each part of the progress bar. */
export const INSTALL_STAGES = [
  { until: 0.3, text: 'Copying Lab OS files from the USB stick to the SSD' },
  { until: 0.55, text: 'Installing drivers so the OS can use your hardware: graphics, network, sound' },
  { until: 0.8, text: 'Setting up the boot loader, so the PC knows where to find the OS when it starts' },
  { until: 1, text: 'Applying your language, keyboard, time zone and account' },
] as const;

export const installStage = (progress: number) => (INSTALL_STAGES.find(stage => progress < stage.until) ?? INSTALL_STAGES[INSTALL_STAGES.length - 1]).text;

export const START: InstallState = {
  step: 'usb', usbIn: null, installed: false, language: 'English', keyboard: 'English (US)', timezone: 'Africa/Asmara',
  account: null, progress: 0, mistakes: 0, wrong: false,
  feedback: 'The PC has no operating system yet. Plug the Lab OS installer USB stick into the PC.',
};

/** Checks for the account form; an empty list means it is fine. */
export function accountProblems(account: { name: string; username: string; computer: string; password: string; confirm: string }) {
  const problems: string[] = [];
  if (!account.name.trim()) problems.push('Type your name (it is only shown on this computer).');
  if (!/^[a-z][a-z0-9]{1,15}$/.test(account.username)) problems.push('Username: 2–16 small letters or numbers, starting with a letter.');
  if (!/^[A-Za-z0-9-]{2,20}$/.test(account.computer)) problems.push('Computer name: 2–20 letters, numbers or dashes, no spaces.');
  const password = account.password.toLowerCase();
  if (account.password.length < 8) problems.push('Password: use at least 8 characters.');
  else if ((account.username && password.includes(account.username.toLowerCase())) || account.name.trim().toLowerCase().split(/\s+/).some(part => part.length > 2 && password.includes(part)))
    problems.push('Password: do not use your name or username. Others can guess it.');
  if (account.password !== account.confirm) problems.push('The two passwords are different. Type the same password twice.');
  return problems;
}

const ok = (state: InstallState, patch: Partial<InstallState>, feedback: string): InstallState => ({ ...state, ...patch, feedback, wrong: false });
const mistake = (state: InstallState, feedback: string, patch: Partial<InstallState> = {}): InstallState => ({ ...state, ...patch, feedback, wrong: true, mistakes: state.mistakes + 1 });
const hint = (state: InstallState, feedback: string): InstallState => ({ ...state, feedback, wrong: true });

/** One student action. Actions that do not fit the current screen change nothing. */
export function installReducer(state: InstallState, action: InstallAction): InstallState {
  if (action.type === 'reset') return START;
  switch (state.step) {
    case 'usb':
      if (action.type === 'insert') {
        if (action.port === 'hdmi') return mistake(state, 'That is the HDMI port. It sends pictures to the monitor; a USB stick does not fit there. Use a USB port.');
        if (action.port === 'ethernet') return mistake(state, 'That is the network (Ethernet) port, for the network cable. Use a USB port.');
        return ok(state, { usbIn: action.port }, 'USB stick plugged in. Now press the power button.');
      }
      if (action.type === 'power') return state.usbIn ? ok(state, { step: 'firmware' }, 'The PC starts. Its firmware checks the hardware, then looks for an OS. Press F12 now to choose what to start from.') : hint(state, 'Plug in the installer USB stick first.');
      return state;
    case 'firmware':
      if (action.type === 'boot-menu') return ok(state, { step: 'boot-menu' }, 'Boot menu open. Choose the device that has the installer on it.');
      if (action.type === 'wait') {
        if (state.installed && !state.usbIn) return ok(state, { step: 'login' }, 'The PC found Lab OS on the SSD and started it. Sign in with the password you made.');
        return mistake(state, 'The PC tried the SSD first, found no operating system and stopped. Restart and press F12 to open the boot menu.', { step: 'no-os' });
      }
      return state;
    case 'no-os':
      return action.type === 'restart' ? ok(state, { step: 'firmware' }, 'Restarted. This time press F12 while the logo shows.') : state;
    case 'boot-menu':
      if (action.type !== 'boot') return state;
      if (action.device === 'ssd') return mistake(state, 'The SSD is new and empty, so there is nothing on it to start yet. Choose the USB stick with the installer.');
      if (action.device === 'network') return mistake(state, 'Network start-up needs a special server, which this classroom does not have. Choose the USB stick.');
      return ok(state, { step: 'language' }, 'The installer started from the USB stick. Nothing has been changed on the SSD yet.');
    case 'language':
      return action.type === 'language' ? ok(state, { step: 'disk', language: action.language, keyboard: action.keyboard }, 'Language and keyboard chosen. Next, decide where to install.') : state;
    case 'disk':
      if (action.type !== 'erase') return state;
      return action.confirmed
        ? ok(state, { step: 'account' }, 'The SSD will be erased and Lab OS installed on it. Next, create your account.')
        : hint(state, 'Erasing deletes everything on the drive. Tick the box only after checking that nothing important is on it, or that it is backed up. This SSD is new, so it is empty.');
    case 'account': {
      if (action.type !== 'account') return state;
      const problems = accountProblems(action);
      if (problems.length) return mistake(state, problems.join(' '));
      return ok(state, { step: 'timezone', account: { name: action.name.trim(), username: action.username, computer: action.computer, password: action.password } }, 'Account ready. Remember your password: nobody can look it up for you. Next, choose your time zone.');
    }
    case 'timezone':
      return action.type === 'timezone' ? ok(state, { step: 'installing', timezone: action.timezone, progress: 0 }, 'Installing Lab OS. Do not switch the PC off while it installs.') : state;
    case 'installing':
      if (action.type !== 'progress') return state;
      return state.progress + action.amount >= 1
        ? ok(state, { step: 'restart', progress: 1, installed: true }, 'Installation finished. Remove the installer USB stick, then restart.')
        : { ...state, progress: state.progress + action.amount };
    case 'restart':
      if (action.type !== 'reboot') return state;
      return action.removeUsb
        ? ok(state, { step: 'login', usbIn: null }, 'USB stick removed. The PC started Lab OS from the SSD. Sign in with your password.')
        : mistake(state, 'The installer started again because the USB stick was still plugged in and the PC started from it. Remove it and restart.', { step: 'installer-again' });
    case 'installer-again':
      return action.type === 'reboot' && action.removeUsb ? ok(state, { step: 'login', usbIn: null }, 'USB stick removed. Now the PC starts Lab OS from the SSD. Sign in.') : state;
    case 'login':
      if (action.type !== 'login') return state;
      return action.password === state.account?.password
        ? ok(state, { step: 'desktop' }, `Welcome, ${state.account.name}. Lab OS is installed and running from the SSD.`)
        : mistake(state, 'Wrong password. Passwords must match exactly, including capital letters. Try again.');
    default:
      return state;
  }
}

export const INSTALL_ORDER: readonly InstallStep[] = ['usb', 'firmware', 'boot-menu', 'language', 'disk', 'account', 'timezone', 'installing', 'restart', 'login', 'desktop'];
