'use client';

import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Cpu,
  HardDrive,
  MemoryStick,
  Microchip,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import AssemblyLab from './assembly-lab';

type Slot = 'cpu' | 'motherboard' | 'ram' | 'ssd' | 'gpu' | 'psu';
type Choice = {
  id: string;
  name: string;
  detail: string;
  socket?: 'LGA1151';
  memory?: 'DDR4';
  watts?: number;
  draw?: number;
};
const ORDER: Slot[] = ['cpu', 'motherboard', 'ram', 'ssd', 'gpu', 'psu'];
const LABEL: Record<Slot, string> = {
  cpu: 'CPU',
  motherboard: 'Motherboard',
  ram: 'Memory',
  ssd: 'Storage',
  gpu: 'Expansion Card',
  psu: 'Power Supply',
};
const ICON = {
  cpu: Cpu,
  motherboard: Microchip,
  ram: MemoryStick,
  ssd: HardDrive,
  gpu: PackageCheck,
  psu: Zap,
};
const CATALOG: Record<Slot, Choice[]> = {
  cpu: [
    {
      id: 'i5-6500',
      name: 'Intel Core i5-6500',
      detail: '6th generation · LGA1151 · training configuration',
      socket: 'LGA1151',
      draw: 65,
    },
  ],
  motherboard: [
    {
      id: 'q170',
      name: 'Dell Q170 System Board',
      detail: 'Proprietary 7040 MT board · LGA1151 · DDR4',
      socket: 'LGA1151',
      memory: 'DDR4',
    },
  ],
  ram: [
    {
      id: '4gb',
      name: '4 GB DDR4',
      detail: '1 × 4 GB UDIMM · 2133 MHz',
      memory: 'DDR4',
    },
    {
      id: '8gb',
      name: '8 GB DDR4',
      detail: '1 × 8 GB UDIMM · 2133 MHz',
      memory: 'DDR4',
    },
    {
      id: '16gb',
      name: '16 GB DDR4',
      detail: '1 × 16 GB UDIMM · 2133 MHz',
      memory: 'DDR4',
    },
  ],
  ssd: [
    { id: 'm2', name: 'M.2 2280 SSD', detail: '22 × 80 mm · Socket 3 storage' },
  ],
  gpu: [
    {
      id: 'training-card',
      name: 'Slot-powered PCIe Card',
      detail:
        'Illustrative training card · exact retail GPU support not asserted',
    },
  ],
  psu: [
    {
      id: 'dell240',
      name: 'Dell 240 W Power Supply',
      detail: 'OEM power supply · proprietary connectors',
      watts: 240,
    },
  ],
};

export default function BuildPcLab({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState<Partial<Record<Slot, Choice>>>({});
  const [slot, setSlot] = useState<Slot>('cpu');
  const [building, setBuilding] = useState(true);
  const issues = useMemo(() => {
    const out: string[] = [];
    const cpu = selected.cpu,
      board = selected.motherboard,
      ram = selected.ram,
      psu = selected.psu;
    if (cpu && board && cpu.socket !== board.socket)
      out.push(
        `${cpu.name} uses ${cpu.socket}, but ${board.name} uses ${board.socket}.`,
      );
    if (board && ram && board.memory !== ram.memory)
      out.push(`${ram.name} does not match the motherboard memory type.`);
    if (cpu && psu && (cpu.draw ?? 0) > psu.watts!)
      out.push(`CPU draw exceeds this power supply rating.`);
    return out;
  }, [selected]);
  const complete = ORDER.every((id) => selected[id]);

  const choose = (id: Slot, c: Choice) => {
    setSelected((o) => ({ ...o, [id]: c }));
    const next = ORDER[ORDER.indexOf(id) + 1];
    if (next) setSlot(next);
  };
  if (!building)
    return (
      <AssemblyLab
        onBack={() => setBuilding(true)}
        componentNames={Object.fromEntries(
          ORDER.map((id) => [id, selected[id]?.name]),
        )}
      />
    );
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#091116',
        color: '#eef7f8',
        fontFamily: 'Inter,system-ui,sans-serif',
      }}
    >
      <header
        style={{
          height: 66,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          borderBottom: '1px solid #223239',
          background: '#0d171c',
        }}
      >
        <button onClick={onBack} style={button}>
          <ArrowLeft size={16} /> Computer Lab
        </button>
        <div style={{ textAlign: 'center' }}>
          <b style={{ fontSize: 20 }}>Build Your PC — 3D Lab</b>
          <div style={{ fontSize: 11, color: '#79a0a7' }}>
            DELL OPTIPLEX 7040 MINI TOWER · TRAINING CONFIGURATION
          </div>
        </div>
        <button
          onClick={() => {
            setSelected({});
            setSlot('cpu');
          }}
          style={button}
        >
          <RotateCcw size={15} /> Reset
        </button>
      </header>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '290px minmax(480px,1fr) 330px',
          height: 'calc(100vh - 66px)',
        }}
      >
        <aside
          style={{
            padding: 16,
            borderRight: '1px solid #223239',
            overflow: 'auto',
            background: '#0d171c',
          }}
        >
          <div style={eye}>YOUR COMPONENTS</div>
          {ORDER.map((id) => {
            const I = ICON[id],
              item = selected[id];
            return (
              <button
                key={id}
                onClick={() => setSlot(id)}
                style={{
                  ...slotButton,
                  borderColor: slot === id ? '#63d5df' : '#273a41',
                  background: slot === id ? '#143039' : '#111d22',
                }}
              >
                <I size={18} />
                <span>
                  <b>{LABEL[id]}</b>
                  <small
                    style={{
                      display: 'block',
                      color: item ? '#8fe1b1' : '#718a91',
                      marginTop: 3,
                    }}
                  >
                    {item?.name ?? 'Choose part'}
                  </small>
                </span>
                {item && <CheckCircle2 size={16} />}
              </button>
            );
          })}
          <div
            style={{
              marginTop: 18,
              paddingTop: 16,
              borderTop: '1px solid #27383e',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: 12, color: '#a1b3ba' }}>
              Reference model in development. Internal measurements are
              estimated; the expansion card is illustrative.
            </span>
          </div>
        </aside>
        <section
          style={{
            position: 'relative',
            minHeight: 500,
            background:
              'radial-gradient(circle at 50% 40%,#19323b 0,#0b151a 55%,#071014 100%)',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, bottom: 85 }}>
            <AssemblyLab
              previewOnly
              onBack={() => {}}
              componentNames={Object.fromEntries(
                ORDER.map((id) => [id, selected[id]?.name]),
              )}
            />
          </div>
          <div
            style={{
              position: 'absolute',
              left: 18,
              bottom: 18,
              right: 18,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 15px',
              border: '1px solid #294048',
              borderRadius: 13,
              background: 'rgba(10,20,25,.88)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span style={{ color: '#8da7ad' }}>
              Choose each training part, then start assembly practice.
            </span>
            <button
              disabled={!complete || issues.length > 0}
              onClick={() => setBuilding(false)}
              style={{
                ...primary,
                opacity: complete && issues.length === 0 ? 1 : 0.4,
                cursor:
                  complete && issues.length === 0 ? 'pointer' : 'not-allowed',
              }}
            >
              Enter interactive 3D installation →
            </button>
          </div>
        </section>
        <aside
          style={{
            padding: 16,
            borderLeft: '1px solid #223239',
            overflow: 'auto',
            background: '#0d171c',
          }}
        >
          <div style={eye}>CHOOSE {LABEL[slot].toUpperCase()}</div>
          <h2 style={{ margin: '7px 0 5px' }}>{LABEL[slot]}</h2>
          <p style={{ fontSize: 13, color: '#829ba1' }}>
            Select a part for the OptiPlex training build.
          </p>
          {CATALOG[slot].map((c) => (
            <button
              key={c.id}
              onClick={() => choose(slot, c)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: 14,
                marginTop: 10,
                borderRadius: 12,
                border:
                  selected[slot]?.id === c.id
                    ? '2px solid #63d5df'
                    : '1px solid #293c43',
                background: selected[slot]?.id === c.id ? '#153139' : '#111d22',
                color: '#eef7f8',
                cursor: 'pointer',
              }}
            >
              <b>{c.name}</b>
              <div
                style={{ fontSize: 12, color: '#849da3', margin: '5px 0 9px' }}
              >
                {c.detail}
              </div>
            </button>
          ))}
          <div style={{ marginTop: 18 }}>
            {issues.length === 0 ? (
              <div
                style={{
                  padding: 12,
                  borderRadius: 11,
                  background: '#123126',
                  color: '#9ae6b4',
                  display: 'flex',
                  gap: 8,
                }}
              >
                <ShieldCheck size={18} /> Supported training choices
              </div>
            ) : (
              issues.map((x) => (
                <div
                  key={x}
                  style={{
                    padding: 12,
                    borderRadius: 11,
                    background: '#38251d',
                    color: '#ffc39e',
                    marginBottom: 8,
                    fontSize: 13,
                  }}
                >
                  {x}
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
const button = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  background: '#152127',
  border: '1px solid #2c3e45',
  color: '#dcebed',
  borderRadius: 10,
  padding: '9px 12px',
  cursor: 'pointer',
} as const;
const slotButton = {
  width: '100%',
  display: 'grid',
  gridTemplateColumns: '22px 1fr 18px',
  alignItems: 'center',
  gap: 10,
  color: '#eaf4f5',
  padding: '12px',
  border: '1px solid',
  borderRadius: 11,
  marginTop: 9,
  cursor: 'pointer',
  textAlign: 'left',
} as const;
const eye = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '.12em',
  color: '#63d5df',
} as const;
const primary = {
  border: 0,
  borderRadius: 10,
  padding: '11px 15px',
  fontWeight: 800,
  background: '#63d5df',
  color: '#082126',
} as const;
