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
    action: 'Drag to turn the laptop. Find the display, keyboard and trackpad.',
    notice: 'A laptop puts the screen, keyboard and computer into one case you can carry.',
  },
  {
    id: 'input-cover-open',
    part: 'battery',
    view: 'inside',
    explode: 18,
    title: 'Open the service view',
    action: 'The bottom cover is off. Look at the parts inside.',
    notice: 'The battery takes up most of the space. The motherboard sits near the hinge.',
  },
  {
    id: 'battery-disconnect',
    part: 'battery',
    view: 'inside',
    explode: 18,
    title: 'Disconnect battery power',
    action: 'Click the battery cable in the 3D view to unplug it. Do this before you take the battery out.',
    notice: 'Always unplug the power first. Then it is safe to touch the parts.',
    requiredCable: 'battery',
  },
  {
    id: 'battery-remove',
    part: 'battery',
    view: 'inside',
    explode: 34,
    title: 'Remove the battery',
    action: 'Lift the battery out. See how much space it used.',
    notice: 'Laptop batteries are thin and wide so they fit under the keyboard.',
  },
  {
    id: 'storage',
    part: 'ssd',
    view: 'inside',
    explode: 46,
    title: 'Find the SSD',
    action: 'Find the thin M.2 SSD. Find its socket and the small post that holds its screw.',
    notice: 'You can take out the SSD. The socket and the post stay on the motherboard.',
  },
  {
    id: 'speaker-disconnect',
    part: 'speakers',
    view: 'inside',
    explode: 49,
    title: 'Disconnect the speaker harness',
    action: 'Click the speaker cable to unplug it before you take out the speakers.',
    notice: 'Thin cables run along the edges. Clips and tape hold them in place.',
    requiredCable: 'speaker',
  },
  {
    id: 'wireless',
    part: 'wifi',
    view: 'inside',
    explode: 50,
    title: 'Inspect wireless hardware',
    action: 'Find the small Wi-Fi card. Follow its two thin antenna wires to the hinge.',
    notice: 'You can take out the Wi-Fi card. The antenna wires stay in the case.',
  },
  {
    id: 'memory',
    part: 'ram',
    view: 'inside',
    explode: 60,
    title: 'Inspect laptop memory',
    action: 'Look at the two RAM sticks. Then look at the sockets and clips that stay on the board.',
    notice: 'You can change the RAM sticks. The sockets are fixed to the motherboard.',
  },
  {
    id: 'cooling',
    part: 'fan',
    view: 'inside',
    explode: 78,
    title: 'Remove the cooling assembly',
    action: 'Follow the heat: CPU plate, copper heat pipes, metal fins, then the fan.',
    notice: 'Heat moves from the CPU through the heat pipes. The fan blows it out of the vent.',
  },
  {
    id: 'processor',
    part: 'cpu',
    view: 'inside',
    explode: 88,
    title: 'Expose the processor',
    action: 'Find the CPU. It was hidden under the cooling plate.',
    notice: 'The CPU follows instructions and does calculations. It makes a lot of heat.',
  },
  {
    id: 'display-disconnect',
    part: 'display',
    view: 'inside',
    explode: 89,
    title: 'Disconnect the display path',
    action: 'Click the display cable to unplug it before the screen comes off.',
    notice: 'A thin cable carries the picture from the motherboard, through the hinge, to the screen.',
    requiredCable: 'display',
  },
  {
    id: 'motherboard-out',
    part: 'motherboard',
    view: 'inside',
    explode: 100,
    title: 'Read the full service layout',
    action: 'Turn the view. For each part, find how it connects to the motherboard.',
    notice: 'The motherboard connects everything: power, RAM, SSD, cooling and ports.',
  },
] as const;
