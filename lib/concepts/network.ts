import { concept, physical, type Concept, type Entry } from '../concept.ts';
import type { SourceId } from '../sources.ts';

/**
 * Networks: a home network as a root of its own, and three scales below the
 * motherboard's network controller — the controller itself, the frame its
 * MAC builds, and the cable its jack takes.
 *
 * Field sizes and behaviour come from the IETF RFCs that define them. The
 * controller follows TI's DP83867 PHY datasheet as a worked example: this
 * board's controller is a Realtek 2.5 Gb part (ASUS manual), whose internal
 * layout is not published in anything cited here, and the accuracy notes say
 * so. Ids are prefixed `nic`, `frame`, `cable` and `net`.
 */

const controller =
  'Teaching model of a wired Ethernet controller. The split into a MAC and a PHY, the transformer between PHY and jack, and the link and activity lights follow TI’s DP83867 PHY datasheet. This board’s Realtek 2.5 Gb controller may combine these in one chip; its internal layout is not shown in any source cited here.';
const frameNote =
  'Field sizes and contents are from the RFCs cited. Block lengths are not to scale with the number of bytes in each field.';
const homeNote =
  'Teaching diagram of a typical home network. Devices and links are representative, not a particular product, and nothing is to scale.';

type Part = Omit<Entry, 'representationType' | 'physicalAccuracy'> & {
  sources: SourceId[];
};
const diagram = (note: string, e: Part) =>
  concept({ ...e, physicalAccuracy: note, representationType: 'logical' });
const hardware = (e: Part) =>
  concept({ ...e, physicalAccuracy: physical, representationType: 'physical' });

export const networkConcepts: Concept[] = [
  // ── The network controller ───────────────────────────────────────────────
  diagram(controller, {
    id: 'nicmac',
    name: 'MAC (media access controller)',
    shortName: 'MAC',
    category: 'Board',
    parent: 'lan',
    level: 'nic',
    open: 'frame',
    description:
      'The digital half of the controller. It builds the Ethernet frames the computer sends and checks the ones it receives.',
    purpose:
      'Puts this computer’s 48-bit Ethernet address on everything it sends, and keeps only the frames meant for it.',
    quantity: '1 per controller',
    specifications: {
      Address: '48-bit Ethernet address',
      Builds: 'Ethernet frames',
    },
    sources: ['dp83867', 'rfc894'],
    searchTerms: ['mac', 'media access', 'ethernet address'],
  }),
  diagram(controller, {
    id: 'nicmii',
    name: 'MAC–PHY interface',
    shortName: 'MII',
    category: 'Board',
    parent: 'lan',
    level: 'nic',
    description:
      'The link between the digital MAC and the analogue PHY, defined by the Ethernet standard so parts from different makers fit together.',
    purpose:
      'Carries bits between the two halves. TI’s DP83867 PHY supports the MII, GMII and RGMII versions of it.',
    quantity: '1 link',
    specifications: { Versions: 'MII · GMII · RGMII' },
    sources: ['dp83867'],
    searchTerms: ['mii', 'rgmii', 'gmii'],
  }),
  diagram(controller, {
    id: 'nicphy',
    name: 'PHY (physical layer transceiver)',
    shortName: 'PHY',
    category: 'Board',
    parent: 'lan',
    level: 'nic',
    description:
      'The analogue half. It turns bits into electrical signals on the cable’s twisted pairs and turns the signals that arrive back into bits.',
    purpose:
      'Does the hard electrical work, including cancelling crosstalk: interference between neighbouring wire pairs.',
    quantity: '1 per controller',
    specifications: {
      'DP83867 speeds': '10 · 100 · 1000 Mb/s',
      'This board': 'Realtek 2.5 Gb Ethernet',
    },
    sources: ['dp83867', 'mainboardmanual'],
    searchTerms: ['phy', 'transceiver', 'crosstalk'],
  }),
  diagram(controller, {
    id: 'nicmagnetics',
    name: 'Magnetics (transformer)',
    shortName: 'Magnetics',
    category: 'Power',
    parent: 'lan',
    level: 'nic',
    description:
      'A small transformer between the PHY and the jack. The PHY connects to the twisted-pair cable through it.',
    purpose:
      'Passes the signal on while keeping the cable electrically isolated from the board.',
    quantity: '1 per port',
    specifications: { Kind: 'External transformer' },
    sources: ['dp83867', 'mainboardmanual'],
    searchTerms: ['magnetics', 'transformer', 'isolation'],
  }),
  diagram(controller, {
    id: 'nicjack',
    name: 'RJ45 jack',
    shortName: 'RJ45 jack',
    category: 'Board',
    parent: 'lan',
    level: 'nic',
    open: 'cable',
    description: 'The socket on the rear I/O where the network cable plugs in.',
    purpose:
      'Connects the eight wires of the cable to the controller, through the magnetics.',
    quantity: '1 on this board',
    specifications: { Port: '1 × 2.5 Gb Ethernet' },
    sources: ['dp83867', 'mainboardmanual'],
    searchTerms: ['rj45', 'jack', 'ethernet port', 'socket'],
  }),
  diagram(controller, {
    id: 'nicled',
    name: 'Link and activity lights',
    shortName: 'LEDs',
    category: 'Board',
    parent: 'lan',
    level: 'nic',
    description:
      'Small lights driven by the PHY: one shows that a link is established, another flickers when data is sent or received.',
    purpose:
      'The first thing to check when a computer says it has no network: is the cable plugged in at both ends, and is the link light on?',
    quantity: '2 shown',
    specifications: { Shows: 'Link · activity' },
    sources: ['dp83867'],
    searchTerms: ['led', 'link light', 'activity'],
  }),

  // ── An Ethernet frame ────────────────────────────────────────────────────
  diagram(frameNote, {
    id: 'frameeth',
    name: 'Ethernet header',
    shortName: 'Ethernet',
    category: 'Board',
    parent: 'nicmac',
    level: 'frame',
    description:
      'The outermost layer: the 48-bit Ethernet addresses of the receiver and the sender, and a type field saying what is inside.',
    purpose:
      'Gets the frame across one network link, from this computer to the router. A type of hexadecimal 0800 means “an IP packet is inside”.',
    quantity: '1 per frame',
    specifications: {
      Addresses: '48-bit, receiver and sender',
      'Type for IP': '0800 (hexadecimal)',
      'Data field': '46 to 1500 bytes',
    },
    sources: ['rfc894', 'rfc1122'],
    searchTerms: ['ethernet frame', 'mac address', 'link layer'],
  }),
  diagram(frameNote, {
    id: 'frameip',
    name: 'IP header',
    shortName: 'IP',
    category: 'Compute',
    parent: 'nicmac',
    level: 'frame',
    description:
      'The middle layer: the 32-bit IP addresses of the sender and the final destination, and a time to live.',
    purpose:
      'Gets the packet across the whole internet. Each router reads the destination address and passes the packet one step closer.',
    quantity: '1 per packet',
    specifications: {
      Addresses: '32-bit, source and destination',
      'Time to live': 'Reduced at each router; at 0 the packet is dropped',
    },
    sources: ['rfc791', 'rfc1122'],
    searchTerms: ['ip', 'ip address', 'internet protocol', 'ttl'],
  }),
  diagram(frameNote, {
    id: 'frametcp',
    name: 'TCP header',
    shortName: 'TCP',
    category: 'Memory',
    parent: 'nicmac',
    level: 'frame',
    description:
      'The inner layer: 16-bit port numbers that say which program the data is for, and a sequence number.',
    purpose:
      'Makes the delivery reliable and in order. Sequence numbers let the receiver put pieces back in order and ask again for any that were lost.',
    quantity: '1 per segment',
    specifications: {
      Ports: '16-bit, source and destination',
      'Sequence number': '32-bit',
    },
    sources: ['rfc9293', 'rfc1122'],
    searchTerms: ['tcp', 'port', 'sequence', 'transport layer'],
  }),
  diagram(frameNote, {
    id: 'framedata',
    name: 'Data',
    shortName: 'Data',
    category: 'Storage',
    parent: 'nicmac',
    level: 'frame',
    description:
      'What is actually being sent: a piece of a web page, a message, part of a video.',
    purpose:
      'Large files are cut into many pieces, each travelling in its own frame. On Ethernet, the IP packet in one frame can be at most 1500 bytes.',
    quantity: '1 piece per frame',
    specifications: { 'Largest IP packet on Ethernet': '1500 bytes' },
    sources: ['rfc894'],
    searchTerms: ['data', 'payload'],
  }),

  // ── The cable ────────────────────────────────────────────────────────────
  hardware({
    id: 'cableplug',
    name: 'RJ45 plug',
    shortName: 'Plug',
    category: 'Board',
    parent: 'nicjack',
    level: 'cable',
    description:
      'The clear plastic plug on the end of the cable, with a springy latch underneath.',
    purpose:
      'Holds the eight wires in a fixed order so each one meets the right contact in the jack, and clicks in place.',
    quantity: '1 per cable end',
    specifications: { Wires: '8' },
    sources: ['dp83867'],
    searchTerms: ['rj45', 'plug', 'connector'],
  }),
  hardware({
    id: 'cablecontact',
    name: 'Contacts',
    shortName: 'Contact',
    category: 'Board',
    parent: 'nicjack',
    level: 'cable',
    description: 'Eight gold-coloured contacts across the top of the plug.',
    purpose:
      'Each contact connects one of the eight wires to the matching contact in the jack.',
    quantity: '8 per plug',
    specifications: { Count: '8' },
    sources: ['dp83867'],
    searchTerms: ['contact', 'pin'],
  }),
  hardware({
    id: 'cablepair',
    name: 'Twisted pairs',
    shortName: 'Twisted pair',
    category: 'Board',
    parent: 'nicjack',
    level: 'cable',
    description:
      'Four pairs of insulated copper wires, each pair twisted together. Standard Ethernet cable has eight wires in four pairs.',
    purpose:
      'Gigabit Ethernet sends data on all four pairs at once. With only two pairs connected, a gigabit link cannot be made.',
    quantity: '4 pairs · 8 wires',
    specifications: { Pairs: '4', Wires: '8' },
    sources: ['dp83867'],
    searchTerms: ['twisted pair', 'wire', 'copper'],
  }),
  hardware({
    id: 'cablejacket',
    name: 'Jacket',
    shortName: 'Jacket',
    category: 'Chassis',
    parent: 'nicjack',
    level: 'cable',
    description:
      'The outer plastic sleeve that holds the four pairs together. Cables are sold in categories such as CAT5e and CAT6.',
    purpose:
      'Holds the four pairs together and protects them. Cables are sold by category, usually printed on the jacket.',
    quantity: '1 per cable',
    specifications: { Categories: 'e.g. CAT5, CAT5e, CAT6' },
    sources: ['dp83867'],
    searchTerms: ['jacket', 'cat5', 'cat6', 'cable'],
  }),

  // ── A home network ───────────────────────────────────────────────────────
  diagram(homeNote, {
    id: 'homenet',
    name: 'Home network',
    shortName: 'Home network',
    category: 'Board',
    parent: null,
    level: 'homenet',
    open: 'homenet',
    description:
      'The computers, phones and router in one home, and the path from them out to the rest of the internet.',
    purpose:
      'Shows where a computer’s network controller sits in the bigger picture, and what happens to data after it leaves the cable.',
    quantity: '1 example network',
    specifications: { Shows: 'Devices · router · provider · internet' },
    sources: ['rfc1918', 'rfc3022'],
    searchTerms: ['network', 'home network', 'lan', 'internet'],
  }),
  diagram(homeNote, {
    id: 'netpc',
    name: 'Your computer',
    shortName: 'Computer',
    category: 'Compute',
    parent: 'homenet',
    level: 'homenet',
    description:
      'The desktop PC from the explorer. Its motherboard has both wired Ethernet and Wi-Fi.',
    purpose:
      'Sends requests, such as “give me this web page”, and receives the answers.',
    quantity: '1',
    specifications: {
      Wired: '2.5 Gb Ethernet',
      'Wi-Fi': 'Wi-Fi 6E (802.11 a/b/g/n/ac/ax)',
    },
    sources: ['mainboardmanual'],
    searchTerms: ['computer', 'pc', 'device'],
  }),
  diagram(homeNote, {
    id: 'netdevices',
    name: 'Other devices',
    shortName: 'Phones',
    category: 'Compute',
    parent: 'homenet',
    level: 'homenet',
    description: 'Phones, laptops and anything else on the same home network.',
    purpose:
      'Each gets its own private address from a range set aside for home and office networks, such as 192.168.x.x.',
    quantity: 'Any number',
    specifications: { 'Private ranges': '10.x · 172.16–31.x · 192.168.x' },
    sources: ['rfc1918'],
    searchTerms: ['phone', 'laptop', 'device'],
  }),
  diagram(homeNote, {
    id: 'netcable',
    name: 'Ethernet cable',
    shortName: 'Cable',
    category: 'Board',
    parent: 'homenet',
    level: 'homenet',
    description: 'The wired link from the computer to the router.',
    purpose: 'Eight wires in four twisted pairs carry the signal.',
    quantity: '1 link',
    specifications: { Wires: '8, in 4 twisted pairs' },
    sources: ['dp83867'],
    searchTerms: ['cable', 'wired'],
  }),
  diagram(homeNote, {
    id: 'netwifi',
    name: 'Wi-Fi',
    shortName: 'Wi-Fi',
    category: 'Board',
    parent: 'homenet',
    level: 'homenet',
    description:
      'A radio link between devices and the router, defined by the 802.11 family of standards.',
    purpose:
      'Carries the same data as a cable, without the cable. The computer in the explorer supports 802.11 a/b/g/n/ac/ax, sold as Wi-Fi 6E.',
    quantity: 'Shared by every wireless device',
    specifications: { Standards: '802.11 a/b/g/n/ac/ax' },
    sources: ['mainboardmanual'],
    searchTerms: ['wifi', 'wi-fi', 'wireless', '802.11'],
  }),
  diagram(homeNote, {
    id: 'netrouter',
    name: 'Router',
    shortName: 'Router',
    category: 'Board',
    parent: 'homenet',
    level: 'homenet',
    description:
      'The box that joins the home network to the internet provider.',
    purpose:
      'Translates between the private addresses inside the home and the one public address the provider gives it. This is called NAT.',
    quantity: '1',
    specifications: { Job: 'Network address translation (NAT)' },
    sources: ['rfc3022', 'rfc1918'],
    searchTerms: ['router', 'nat', 'gateway'],
  }),
  diagram(homeNote, {
    id: 'netisp',
    name: 'Internet provider',
    shortName: 'Provider',
    category: 'Board',
    parent: 'homenet',
    level: 'homenet',
    description:
      'The company whose line connects the home to the rest of the internet.',
    purpose:
      'Gives the router a globally unique public address, the one the rest of the internet sees.',
    quantity: '1',
    specifications: { Gives: 'A public IP address' },
    sources: ['rfc3022'],
    searchTerms: ['isp', 'provider'],
  }),
  diagram(homeNote, {
    id: 'netinternet',
    name: 'The internet',
    shortName: 'Internet',
    category: 'Board',
    parent: 'homenet',
    level: 'homenet',
    description:
      'Many networks joined by routers. A packet is passed from router to router until it reaches the address it is for.',
    purpose:
      'Each router lowers the packet’s time to live by at least one. If it reaches zero, the packet is dropped, so a lost packet cannot circle forever.',
    quantity: 'Countless routers',
    specifications: { Addresses: '32-bit IP addresses' },
    sources: ['rfc791'],
    searchTerms: ['internet', 'routing'],
  }),
  diagram(homeNote, {
    id: 'netdns',
    name: 'DNS server',
    shortName: 'DNS',
    category: 'Storage',
    parent: 'homenet',
    level: 'homenet',
    description:
      'A server that looks up names. It turns a name like example.com into the IP address of the computer behind it.',
    purpose:
      'Lets people use names while computers use numbers. The look-up happens before the web page is asked for.',
    quantity: 'Many, worldwide',
    specifications: { Turns: 'Names into addresses' },
    sources: ['rfc1034'],
    searchTerms: ['dns', 'domain name', 'lookup'],
  }),
  diagram(homeNote, {
    id: 'netserver',
    name: 'Web server',
    shortName: 'Server',
    category: 'Storage',
    parent: 'homenet',
    level: 'homenet',
    description:
      'A computer that stores a website and answers requests for its pages.',
    purpose:
      'Sends the page back in many packets. TCP on the receiving computer puts them back in order.',
    quantity: '1 in this example',
    specifications: { Delivery: 'Reliable and in order, over TCP' },
    sources: ['rfc9293'],
    searchTerms: ['server', 'website', 'web'],
  }),
];
