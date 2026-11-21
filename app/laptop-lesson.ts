export type LaptopLessonPartId =
  | 'display'
  | 'keyboard'
  | 'trackpad'
  | 'battery'
  | 'motherboard'
  | 'cpu'
  | 'ram'
  | 'ssd'
  | 'fan'
  | 'wifi'
  | 'speakers';

export type LaptopLessonCableId = 'battery' | 'speaker' | 'display';

export type LaptopLessonStep = {
  id: string;
  part: LaptopLessonPartId;
  view: 'outside' | 'inside';
  explode: number;
  title: string;
  action: string;
  notice: string;
  requiredCable?: LaptopLessonCableId;
};

export const LAPTOP_LESSON_STEPS: readonly LaptopLessonStep[] = [
  {
    id: 'outside-orientation',
    part: 'display',
    view: 'outside',
    explode: 0,
    title: 'Meet the laptop',
    action: 'Drag to orbit and identify the display, keyboard and trackpad.',
    notice: 'A laptop combines the screen, controls and computer into one portable chassis.',
  },
  {
    id: 'input-cover-open',
    part: 'battery',
    view: 'inside',
    explode: 18,
    title: 'Open the service view',
    action: 'Look at the exposed internals after the Input Cover has been removed.',
    notice: 'The battery fills most of the lower chassis while the mainboard sits near the hinge.',
  },
  {
    id: 'battery-disconnect',
    part: 'battery',
    view: 'inside',
    explode: 18,
    title: 'Disconnect battery power',
    action: 'Click the battery cable in the 3D view to unplug it before battery removal.',
    notice: 'Power should be disconnected before servicing the components around the mainboard.',
    requiredCable: 'battery',
  },
  {
    id: 'battery-remove',
    part: 'battery',
    view: 'inside',
    explode: 34,
    title: 'Remove the battery',
    action: 'Notice how much chassis area becomes available once the battery is lifted away.',
    notice: 'Large laptop batteries are thin and wide so they can use the available base area.',
  },
  {
    id: 'storage',
    part: 'ssd',
    view: 'inside',
    explode: 46,
    title: 'Find the SSD',
    action: 'Locate the thin M.2 storage module and its fixed motherboard socket and standoff.',
    notice: 'The SSD is removable, while its M.2 socket and mounting hardware stay on the board.',
  },
  {
    id: 'speaker-disconnect',
    part: 'speakers',
    view: 'inside',
    explode: 49,
    title: 'Disconnect the speaker harness',
    action: 'Click the speaker cable before the speaker assembly is removed.',
    notice: 'Small wire harnesses run along the chassis edges and are held by clips and tape.',
    requiredCable: 'speaker',
  },
  {
    id: 'wireless',
    part: 'wifi',
    view: 'inside',
    explode: 50,
    title: 'Inspect wireless hardware',
    action: 'Find the small Wi-Fi card and follow its two thin antenna leads toward the hinge.',
    notice: 'The Wi-Fi card is removable, but its antenna leads remain routed through the chassis.',
  },
  {
    id: 'memory',
    part: 'ram',
    view: 'inside',
    explode: 60,
    title: 'Inspect laptop memory',
    action: 'Compare the two SODIMM modules with the sockets and retaining clips left on the board.',
    notice: 'RAM modules can be replaced independently while their sockets remain part of the mainboard.',
  },
  {
    id: 'cooling',
    part: 'fan',
    view: 'inside',
    explode: 78,
    title: 'Remove the cooling assembly',
    action: 'Follow the fan, copper fin stack, dual heat pipes and processor cold plate.',
    notice: 'Heat moves from the processor through the heat pipes and leaves through the fan exhaust.',
  },
  {
    id: 'processor',
    part: 'cpu',
    view: 'inside',
    explode: 88,
    title: 'Expose the processor',
    action: 'Find the processor package that was hidden under the cooling cold plate.',
    notice: 'The CPU executes instructions and is one of the main heat-producing components.',
  },
  {
    id: 'display-disconnect',
    part: 'display',
    view: 'inside',
    explode: 89,
    title: 'Disconnect the display path',
    action: 'Click the display cable before the display assembly separates from the chassis.',
    notice: 'The display depends on a thin routed cable that passes from the mainboard toward the hinge.',
    requiredCable: 'display',
  },
  {
    id: 'motherboard-out',
    part: 'motherboard',
    view: 'inside',
    explode: 100,
    title: 'Read the full service layout',
    action: 'Orbit the staged components and identify how each one connects back to the motherboard.',
    notice: 'The motherboard is the central connection point for power, memory, storage, cooling and I/O.',
  },
] as const;
