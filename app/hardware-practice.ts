import type { HardwareId } from '../lib/optiplex-7040.ts';

export const ORIENTED_PARTS: HardwareId[] = ['cpu', 'ram', 'ssd', 'gpu'];
export const RETAINERS = {
  ram: 'Close RAM clips',
  ssd: 'Fasten SSD screw',
  gpu: 'Secure expansion bracket',
} as const;
export type Retainer = keyof typeof RETAINERS;
export function placementProblem(id: HardwareId, aligned: boolean) {
  return ORIENTED_PARTS.includes(id) && !aligned
    ? 'Wrong direction. Turn the part to match the guide. Never force it.' : null;
}
export function fasteningProblems(fastened: Retainer[]) {
  return (Object.keys(RETAINERS) as Retainer[]).filter(id => !fastened.includes(id)).map(id => RETAINERS[id] + '.');
}
export const PART_JOBS: Record<HardwareId, { job: string; example: string; connection: string }> = {
  motherboard: { job: 'The main board. It connects all the parts so they can work together.', example: 'When you open an app, the CPU, RAM and SSD talk to each other through the motherboard.', connection: 'Screws onto standoffs in the case. Gets power from the power supply.' },
  cpu: { job: 'The CPU follows instructions and does calculations.', example: 'When you make a video, the CPU does a lot of the work.', connection: 'Sits in the CPU socket. The cooler sits on top of it.' },
  cooler: { job: 'The cooler takes heat away from the CPU.', example: 'If the fan stops, the CPU gets hot and the computer slows down.', connection: 'Sits on the CPU with thermal paste. Its fan plugs into the CPU fan header.' },
  ram: { job: 'RAM helps the computer keep several apps open.', example: 'Many browser tabs need more RAM. When the power goes off, RAM forgets everything.', connection: 'Clips into a DDR4 memory slot on the motherboard.' },
  ssd: { job: 'The SSD stores files even when the computer is off.', example: 'Your saved photos and apps live on the SSD.', connection: 'Plugs into the M.2 socket. One small screw holds it down.' },
  gpu: { job: 'The expansion card adds a feature. This one helps make the picture on the screen.', example: 'Games and 3D models need graphics power. This card is a training example.', connection: 'Pushes into the PCIe slot. The monitor cable plugs into its back.' },
  psu: { job: 'The power supply changes wall power into safe power for the parts.', example: 'If the board power cable is not plugged in, the computer will not start.', connection: 'Wall socket on one side. Power cables to the motherboard on the other.' },
};

export type FaultCase = {
  id: string; title: string; symptom: string;
  test: string; evidence: string; fix: string; retest: string;
};
export const PC_FAULTS: FaultCase[] = [
  { id: 'display', title: 'No picture', symptom: 'The PC fans run, but the monitor shows No signal.', test: 'Inspect the monitor connection and input', evidence: 'The simulated monitor cable is disconnected from the graphics output.', fix: 'Reconnect the monitor cable and select its input', retest: 'The monitor receives a signal and shows the simulated POST screen.' },
  { id: 'heat', title: 'Hot and slow', symptom: 'The PC becomes hot during heavy work. The CPU fan does not spin.', test: 'Inspect the CPU fan connection', evidence: 'The simulated CPU fan lead is unplugged. The heatsink is seated.', fix: 'Power off, unplug, and reconnect the CPU fan lead', retest: 'The simulated fan spins and temperature falls during the same workload.' },
  { id: 'memory', title: 'Too many tabs', symptom: 'The lesson slows down when many browser tabs are open.', test: 'Compare RAM use with the open apps', evidence: 'Simulated RAM demand is 92%. Browser tabs use most of it.', fix: 'Close unneeded tabs while keeping the lesson open', retest: 'Simulated RAM demand is 48%, and the lesson responds normally.' },
  { id: 'storage', title: 'SSD not detected', symptom: 'The PC reaches POST, but its storage check finds no SSD.', test: 'Inspect the SSD connection with power unplugged', evidence: 'The simulated SSD is loose and its contacts are outside the M.2 socket.', fix: 'Reseat the SSD and secure its mounting screw', retest: 'The simulated POST storage check detects the SSD. Saved data is not erased.' },
];
export const LAPTOP_FAULT_FOLLOWUPS: Record<string, Omit<FaultCase, 'id' | 'title' | 'symptom'>> = {
  'battery-runtime': { test: 'Check battery health and charging status', evidence: 'The simulated battery is detected but cannot hold a charge.', fix: 'Arrange replacement of the failed battery', retest: 'With the replacement battery, the simulated laptop stays on without its charger.' },
  overheating: { test: 'Inspect airflow and the cooling fan', evidence: 'The simulated fan spins, but dust blocks the cooling outlet.', fix: 'Power off, unplug, and clear the blocked cooling outlet', retest: 'Airflow returns and simulated temperature drops under the same workload.' },
  multitasking: { test: 'Compare RAM use with the open apps', evidence: 'The simulated apps need more RAM than is available. No memory fault is reported.', fix: 'Close unneeded apps while keeping the lesson open', retest: 'RAM demand falls and the simulated lesson responds normally.' },
  storage: { test: 'Check whether the SSD is detected', evidence: 'The simulated SSD is loose in its socket and is not detected.', fix: 'Power off, unplug, and reseat the SSD', retest: 'The simulated storage check detects the SSD without erasing its files.' },
  wireless: { test: 'Check Wi-Fi settings and adapter status', evidence: 'The simulated adapter is detected and healthy. Wi-Fi is switched off.', fix: 'Turn Wi-Fi on and reconnect to the network', retest: 'The simulated network list appears and the connection succeeds.' },
  'black-display': { test: 'Inspect the display cable with power unplugged', evidence: 'The simulated display cable is loose at the motherboard connector.', fix: 'Reseat and secure the display cable', retest: 'The simulated built-in screen shows a picture when power is restored.' },
};

export type Diagnosis = { inspected: boolean; fixed: boolean; verified: boolean; feedback: string };
export const EMPTY_DIAGNOSIS: Diagnosis = { inspected: false, fixed: false, verified: false, feedback: 'Choose a test before changing anything.' };
export function diagnose(state: Diagnosis, action: 'test' | 'fix' | 'verify', correct: boolean, scenario: FaultCase): Diagnosis {
  if (action === 'test') return { ...EMPTY_DIAGNOSIS, inspected: correct, feedback: correct ? scenario.evidence : 'That test does not explain this symptom. Choose a more relevant test.' };
  if (!state.inspected) return { ...state, feedback: 'Collect evidence with a test first.' };
  if (action === 'fix') return { ...state, fixed: correct, verified: false, feedback: correct ? 'Fix applied in the simulation. Run the same check again.' : 'That change does not address the evidence. Try another fix.' };
  return state.fixed ? { ...state, verified: true, feedback: scenario.retest } : { ...state, feedback: 'The fault is still present. Apply a fix that matches the evidence.' };
}
