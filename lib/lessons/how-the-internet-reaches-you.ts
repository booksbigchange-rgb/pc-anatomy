import type { Course } from './types.ts';

/**
 * The third course: how a computer's data gets to a website and back.
 *
 * Same house style as the others. Field sizes and behaviour come from the
 * RFCs that define them; the network controller lesson uses TI's DP83867 PHY
 * as its worked example and says that this board's own controller is a
 * Realtek part whose insides are not shown.
 */
export const howTheInternetReachesYou: Course = {
  id: 'how-the-internet-reaches-you',
  title: 'How the internet reaches you',
  summary:
    'Four short lessons that follow your data from the network controller, down the cable, through your home router and across the internet.',
  audience: 'High school · best after How a computer works',
  lessons: [
    {
      id: 'your-home-network',
      title: 'Your home network',
      summary:
        'Computers, the router, private addresses, Wi-Fi and the path to a website.',
      minutes: 7,
      steps: [
        {
          title: 'A network at home',
          body: [
            'This diagram is a typical home network. Inside the home are your computer, other devices and a router. Outside are your internet provider, the internet itself and the servers you visit.',
            'It is a teaching diagram: real homes differ, and nothing here is to scale.',
          ],
          scene: { level: 'homenet' },
        },
        {
          title: 'Cable or Wi-Fi',
          body: [
            'The computer from the explorer can join the network two ways: by Ethernet cable or by Wi-Fi. Its motherboard has a 2.5 Gb Ethernet port and Wi-Fi 6E.',
            'Wi-Fi is a radio link that carries the same kind of data as the cable, without the cable.',
          ],
          scene: { level: 'homenet', part: 'netwifi' },
          sources: ['mainboardmanual'],
        },
        {
          title: 'Private addresses',
          body: [
            'Every device on the network needs an address, like a house number. At home these are private addresses from ranges set aside for home and office networks, such as 192.168.x.x.',
            'Many homes use the very same private addresses. That works because private addresses are kept off the internet itself.',
          ],
          scene: { level: 'homenet', part: 'netdevices' },
          sources: ['rfc1918'],
        },
        {
          title: 'The router',
          body: [
            'The router joins your home network to your internet provider. The provider gives it one public address, the one the rest of the internet sees.',
            'When a device sends something out, the router swaps its private address for the public one, and swaps it back on the reply. This is called NAT, network address translation.',
          ],
          scene: { level: 'homenet', part: 'netrouter' },
          sources: ['rfc3022'],
        },
        {
          title: 'Finding a website',
          body: [
            'You type a name like example.com, but computers need an address. So first your computer asks a DNS server to turn the name into the website’s IP address.',
            'Then it sends its request across the internet, passed from router to router until it reaches the web server.',
          ],
          scene: { level: 'homenet', part: 'netdns' },
          sources: ['rfc1034', 'rfc791'],
        },
        {
          title: 'Check: find the router',
          body: ['Back to the whole network.'],
          scene: { level: 'homenet' },
          check: {
            kind: 'find',
            prompt: 'Click the router.',
            answers: ['netrouter'],
            hint: 'It sits at the edge of the home, between the devices and the provider.',
          },
        },
        {
          title: 'Check: names and addresses',
          body: ['One question to finish.'],
          scene: { level: 'homenet' },
          check: {
            kind: 'choice',
            prompt:
              'Which part turns a name like example.com into an IP address?',
            options: ['The router', 'A DNS server', 'The Ethernet cable'],
            answer: 1,
            explain:
              'Right. DNS looks names up and returns addresses. It happens before your computer asks the web server for the page.',
          },
        },
      ],
    },
    {
      id: 'the-network-controller',
      title: 'The network controller',
      summary:
        'The chip that turns data into signals: MAC, PHY, transformer, jack and lights.',
      minutes: 6,
      steps: [
        {
          title: 'Two halves',
          body: [
            'This is a teaching model of a wired network controller. It has a digital half, the MAC, and an analogue half, the PHY.',
            'The two halves can be separate chips. Texas Instruments’ DP83867 is a PHY on its own, and this lesson uses it as the example. The explorer’s motherboard uses a Realtek 2.5 Gb controller instead, whose insides are not shown.',
          ],
          scene: { level: 'nic' },
          sources: ['dp83867', 'mainboardmanual'],
        },
        {
          title: 'The MAC',
          body: [
            'The MAC builds the frames the computer sends and checks the frames it receives. Every frame carries the 48-bit Ethernet address of the sender and of the receiver.',
            'The MAC keeps only the frames addressed to this computer.',
          ],
          scene: { level: 'nic', part: 'nicmac' },
          sources: ['rfc894'],
        },
        {
          title: 'The PHY',
          body: [
            'The PHY turns bits into electrical signals on the wires, and turns arriving signals back into bits. The DP83867 runs at 10, 100 or 1000 megabits per second.',
            'It even cancels crosstalk, the interference that one pair of wires picks up from its neighbours.',
          ],
          scene: { level: 'nic', part: 'nicphy' },
          sources: ['dp83867'],
        },
        {
          title: 'Magnetics and the jack',
          body: [
            'Between the PHY and the RJ45 jack sits a small transformer, called the magnetics. The signal passes through it while the cable stays electrically isolated from the board.',
          ],
          scene: { level: 'nic', part: 'nicmagnetics' },
          sources: ['dp83867'],
        },
        {
          title: 'The lights',
          body: [
            'The PHY drives small lights by the jack. One shows that a link is established. Another flickers when data is sent or received.',
            'If a computer has no network, check these first. No link light means the PHY cannot see a working connection at the other end.',
          ],
          scene: { level: 'nic', part: 'nicled' },
          sources: ['dp83867'],
        },
        {
          title: 'Check: find the PHY',
          body: ['Back to the whole controller.'],
          scene: { level: 'nic' },
          check: {
            kind: 'find',
            prompt: 'Click the PHY.',
            answers: ['nicphy'],
            hint: 'It is the large block in the middle, between the MII link and the magnetics.',
          },
        },
        {
          title: 'Check: no network',
          body: ['One question to finish.'],
          scene: { level: 'nic' },
          check: {
            kind: 'choice',
            prompt:
              'A computer has no network and the link light by its jack is off. What should you check first?',
            options: [
              'The cable, at both ends',
              'The processor',
              'The amount of RAM',
            ],
            answer: 0,
            explain:
              'Right. The link light shows whether the PHY can see the other end at all. With it off, the cable or the device at the other end is the first suspect.',
          },
        },
      ],
    },
    {
      id: 'the-ethernet-cable',
      title: 'The Ethernet cable',
      summary:
        'Eight wires in four twisted pairs, and the plug that holds them.',
      minutes: 5,
      steps: [
        {
          title: 'Plug and cable',
          body: [
            'This is the end of an Ethernet cable: an RJ45 plug, with the cable’s outer jacket cut back so you can see inside. The sizes are illustrative.',
          ],
          scene: { level: 'cable' },
        },
        {
          title: 'Four twisted pairs',
          body: [
            'Inside are eight wires in four pairs, each pair twisted together. That is the standard cabling for Ethernet.',
            'Gigabit Ethernet sends data on all four pairs at once. If only two pairs are connected, a gigabit link cannot be made.',
          ],
          scene: { level: 'cable', part: 'cablepair' },
          sources: ['dp83867'],
        },
        {
          title: 'The plug',
          body: [
            'The plug holds the eight wires in a fixed order. Across its top are eight contacts, one for each wire, which meet matching contacts inside the jack.',
            'A springy latch underneath clicks into the jack to hold the plug in.',
          ],
          scene: { level: 'cable', part: 'cablecontact', focus: true },
          sources: ['dp83867'],
        },
        {
          title: 'Cable categories',
          body: [
            'The jacket holds the pairs together. Ethernet cables come in categories, such as CAT5, CAT5e and CAT6, and the category is usually printed on the jacket.',
          ],
          scene: { level: 'cable', part: 'cablejacket' },
          sources: ['dp83867'],
        },
        {
          title: 'Check: find a twisted pair',
          body: ['Look inside the cut-back cable.'],
          scene: { level: 'cable' },
          check: {
            kind: 'find',
            prompt: 'Click one of the twisted pairs.',
            answers: ['cablepair'],
            hint: 'They are the coloured and white wires coming out of the jacket into the plug.',
          },
        },
        {
          title: 'Check: how many wires?',
          body: ['One question to finish.'],
          scene: { level: 'cable' },
          check: {
            kind: 'choice',
            prompt: 'How many wires are in a standard Ethernet cable?',
            options: ['2', '4', '8'],
            answer: 2,
            explain:
              'Right. Eight wires, in four twisted pairs, and gigabit Ethernet uses all of them.',
          },
        },
      ],
    },
    {
      id: 'a-packets-layers',
      title: 'A packet’s layers',
      summary:
        'Data inside TCP, inside IP, inside Ethernet: envelopes inside envelopes.',
      minutes: 7,
      steps: [
        {
          title: 'Envelopes inside envelopes',
          body: [
            'When your computer sends something, it wraps the data in layers, like putting a letter in an envelope, then that envelope in a bigger one.',
            'Each layer adds a header with the information it needs. The brackets underneath show what each layer wraps.',
          ],
          scene: { level: 'frame' },
          sources: ['rfc1122'],
        },
        {
          title: 'The data',
          body: [
            'The data is what is actually being sent: a piece of a web page, a message, part of a video. Big things are cut into many pieces that travel separately.',
            'On Ethernet, the IP packet in one frame can be at most 1500 bytes.',
          ],
          scene: { level: 'frame', part: 'framedata' },
          sources: ['rfc894'],
        },
        {
          title: 'TCP: in order, nothing lost',
          body: [
            'The TCP header has port numbers, which say which program the data is for, such as your web browser.',
            'It also has a sequence number, so the receiver can put the pieces back in order and ask again for any that went missing. TCP makes delivery reliable and in order.',
          ],
          scene: { level: 'frame', part: 'frametcp' },
          sources: ['rfc9293'],
        },
        {
          title: 'IP: the address on the envelope',
          body: [
            'The IP header has the 32-bit IP addresses of the sender and the final destination. Every router on the way reads the destination and passes the packet one step closer.',
            'It also has a time to live. Each router lowers it, and at zero the packet is dropped, so a lost packet cannot travel forever.',
          ],
          scene: { level: 'frame', part: 'frameip' },
          sources: ['rfc791'],
        },
        {
          title: 'Ethernet: one hop at a time',
          body: [
            'The outer Ethernet header has the 48-bit Ethernet addresses of the sender and receiver on this one link, from your computer to the router. A type field of 0800 says an IP packet is inside.',
            'At each hop the Ethernet envelope is replaced, but the IP packet inside travels all the way.',
          ],
          scene: { level: 'frame', part: 'frameeth' },
          sources: ['rfc894', 'rfc791', 'rfc1122'],
        },
        {
          title: 'Check: find the IP header',
          body: ['Back to the whole frame.'],
          scene: { level: 'frame' },
          check: {
            kind: 'find',
            prompt: 'Click the IP header.',
            answers: ['frameip'],
            hint: 'It is the second block from the left, between the Ethernet and TCP headers.',
          },
        },
        {
          title: 'Check: which layer?',
          body: ['Last question of the course.'],
          scene: { level: 'frame' },
          check: {
            kind: 'choice',
            prompt:
              'A piece of a web page goes missing on the way. Which layer notices and asks for it again?',
            options: ['Ethernet', 'IP', 'TCP'],
            answer: 2,
            explain:
              'Right. TCP’s sequence numbers show which pieces arrived, so the missing one can be sent again.',
          },
        },
      ],
    },
  ],
};
