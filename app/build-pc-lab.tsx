'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Cpu, HardDrive, MemoryStick, Microchip, PackageCheck, Play, RotateCcw, ShieldCheck, Zap } from 'lucide-react';
import AssemblyLab from './assembly-lab';

type Slot = 'cpu' | 'motherboard' | 'ram' | 'ssd' | 'gpu' | 'psu';
type Choice = { id: string; name: string; detail: string; price: number; socket?: 'AM5' | 'LGA1851'; memory?: 'DDR5'; watts?: number; draw?: number };

const ORDER: Slot[] = ['cpu', 'motherboard', 'ram', 'ssd', 'gpu', 'psu'];
const LABEL: Record<Slot, string> = { cpu: 'CPU', motherboard: 'Motherboard', ram: 'Memory', ssd: 'Storage', gpu: 'Graphics Card', psu: 'Power Supply' };
const ICON = { cpu: Cpu, motherboard: Microchip, ram: MemoryStick, ssd: HardDrive, gpu: PackageCheck, psu: Zap };

const CATALOG: Record<Slot, Choice[]> = {
  cpu: [
    { id: '9950x', name: 'Ryzen 9 9950X', detail: '16 cores · AM5', price: 599, socket: 'AM5', draw: 170 },
    { id: '9700x', name: 'Ryzen 7 9700X', detail: '8 cores · AM5', price: 329, socket: 'AM5', draw: 65 },
    { id: '285k', name: 'Core Ultra 9 285K', detail: '24 cores · LGA1851', price: 589, socket: 'LGA1851', draw: 250 },
  ],
  motherboard: [
    { id: 'x870', name: 'X870 ATX Board', detail: 'AM5 · DDR5', price: 289, socket: 'AM5', memory: 'DDR5' },
    { id: 'b650', name: 'B650 ATX Board', detail: 'AM5 · DDR5', price: 169, socket: 'AM5', memory: 'DDR5' },
    { id: 'z890', name: 'Z890 ATX Board', detail: 'LGA1851 · DDR5', price: 299, socket: 'LGA1851', memory: 'DDR5' },
  ],
  ram: [
    { id: '16', name: '16 GB DDR5', detail: '2 × 8 GB · DDR5', price: 59, memory: 'DDR5' },
    { id: '32', name: '32 GB DDR5', detail: '2 × 16 GB · DDR5', price: 99, memory: 'DDR5' },
    { id: '64', name: '64 GB DDR5', detail: '2 × 32 GB · DDR5', price: 179, memory: 'DDR5' },
  ],
  ssd: [
    { id: '1tb', name: '1 TB NVMe SSD', detail: 'M.2 PCIe storage', price: 79 },
    { id: '2tb', name: '2 TB NVMe SSD', detail: 'M.2 PCIe storage', price: 139 },
    { id: 'sata', name: '1 TB SATA SSD', detail: '2.5-inch SATA storage', price: 69 },
  ],
  gpu: [
    { id: '5090', name: 'GeForce RTX 5090', detail: 'High-end graphics · 575 W', price: 1999, draw: 575 },
    { id: '9070xt', name: 'Radeon RX 9070 XT', detail: 'Performance graphics · 304 W', price: 599, draw: 304 },
    { id: 'b580', name: 'Intel Arc B580', detail: 'Mainstream graphics · 190 W', price: 249, draw: 190 },
  ],
  psu: [
    { id: '650', name: '650 W PSU', detail: '80 Plus rated', price: 79, watts: 650 },
    { id: '850', name: '850 W PSU', detail: '80 Plus Gold', price: 129, watts: 850 },
    { id: '1200', name: '1200 W PSU', detail: '80 Plus Gold', price: 219, watts: 1200 },
  ],
};

export default function BuildPcLab({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState<Partial<Record<Slot, Choice>>>({});
  const [slot, setSlot] = useState<Slot>('cpu');
  const [assemble, setAssemble] = useState(false);

  const issues = useMemo(() => {
    const out: string[] = [];
    const cpu = selected.cpu, board = selected.motherboard, ram = selected.ram, gpu = selected.gpu, psu = selected.psu;
    if (cpu && board && cpu.socket !== board.socket) out.push(`${cpu.name} uses ${cpu.socket}, but ${board.name} uses ${board.socket}.`);
    if (board && ram && board.memory !== ram.memory) out.push(`${ram.name} does not match the motherboard memory type.`);
    if (gpu && psu && (psu.watts ?? 0) < (gpu.draw ?? 0) + 250) out.push(`${psu.name} is too small for this GPU. Allow headroom for the rest of the PC.`);
    return out;
  }, [selected]);

  const complete = ORDER.every((id) => selected[id]);
  const total = ORDER.reduce((sum, id) => sum + (selected[id]?.price ?? 0), 0);
  const choose = (id: Slot, choice: Choice) => {
    setSelected((old) => ({ ...old, [id]: choice }));
    const next = ORDER[ORDER.indexOf(id) + 1];
    if (next) setSlot(next);
  };

  if (assemble) return <AssemblyLab onBack={() => setAssemble(false)} />;

  return (
    <main style={{minHeight:'100vh',background:'#0e151a',color:'#eef7f8',fontFamily:'Inter,system-ui,sans-serif',padding:'22px'}}>
      <header style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,maxWidth:1400,margin:'0 auto 24px'}}>
        <button onClick={onBack} style={buttonStyle}><ArrowLeft size={16}/> Computer Lab</button>
        <div style={{textAlign:'center'}}><strong style={{fontSize:20}}>Build Your PC</strong><div style={{fontSize:12,color:'#91a8ad'}}>CHOOSE → CHECK → BUILD IN 3D → BOOT</div></div>
        <button onClick={() => {setSelected({});setSlot('cpu')}} style={buttonStyle}><RotateCcw size={15}/> Reset</button>
      </header>

      <div style={{display:'grid',gridTemplateColumns:'minmax(190px,260px) minmax(360px,1fr) minmax(260px,340px)',gap:18,maxWidth:1400,margin:'0 auto'}}>
        <aside style={panelStyle}>
          <div style={eyebrow}>YOUR BUILD</div>
          {ORDER.map((id) => { const I=ICON[id]; const item=selected[id]; return <button key={id} onClick={()=>setSlot(id)} style={{...slotStyle,borderColor:slot===id?'#65d6df':'#28383e',background:slot===id?'#142c31':'#121c21'}}><I size={18}/><span style={{textAlign:'left'}}><b>{LABEL[id]}</b><small style={{display:'block',color:item?'#8fe1b1':'#789096',marginTop:3}}>{item?.name ?? 'Choose a part'}</small></span>{item&&<CheckCircle2 size={16}/>}</button>})}
        </aside>

        <section style={panelStyle}>
          <div style={eyebrow}>STEP {ORDER.indexOf(slot)+1} OF {ORDER.length}</div>
          <h1 style={{margin:'6px 0'}}>Choose {LABEL[slot]}</h1>
          <p style={{color:'#91a8ad',marginTop:0}}>Pick a component. The lab checks whether your choices can work together.</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:12,marginTop:22}}>
            {CATALOG[slot].map((choice)=><button key={choice.id} onClick={()=>choose(slot,choice)} style={{textAlign:'left',padding:18,borderRadius:14,border:selected[slot]?.id===choice.id?'2px solid #65d6df':'1px solid #2a3b41',background:selected[slot]?.id===choice.id?'#153036':'#111b20',color:'#eef7f8',cursor:'pointer'}}><strong style={{fontSize:16}}>{choice.name}</strong><div style={{color:'#91a8ad',margin:'7px 0 18px'}}>{choice.detail}</div><b>${choice.price}</b></button>)}
          </div>
        </section>

        <aside style={panelStyle}>
          <div style={eyebrow}>BUILD CHECK</div>
          <h2 style={{margin:'7px 0 12px'}}>Compatibility</h2>
          {!complete && <p style={{color:'#91a8ad'}}>Choose all six main parts to finish your build.</p>}
          {issues.length===0 ? <div style={{padding:14,borderRadius:12,background:'#123126',color:'#9ae6b4',display:'flex',gap:9}}><ShieldCheck size={20}/><span>No compatibility problems found so far.</span></div> : issues.map((x)=><div key={x} style={{padding:14,borderRadius:12,background:'#38251d',color:'#ffc39e',marginBottom:8}}>{x}</div>)}
          <div style={{borderTop:'1px solid #29383e',marginTop:20,paddingTop:18,display:'flex',justifyContent:'space-between'}}><span>Estimated build</span><strong>${total.toLocaleString()}</strong></div>
          <button disabled={!complete||issues.length>0} onClick={()=>setAssemble(true)} style={{width:'100%',marginTop:20,padding:'14px 16px',border:0,borderRadius:12,display:'flex',justifyContent:'center',alignItems:'center',gap:9,fontWeight:800,cursor:complete&&issues.length===0?'pointer':'not-allowed',background:complete&&issues.length===0?'#65d6df':'#26353a',color:complete&&issues.length===0?'#082126':'#70868c'}}><Play size={17}/> Start 3D assembly</button>
          <p style={{fontSize:12,lineHeight:1.5,color:'#6f858b'}}>Training prices are illustrative. Compatibility rules are intentionally simplified for classroom learning.</p>
        </aside>
      </div>
    </main>
  );
}

const panelStyle = {background:'#101a1f',border:'1px solid #24343a',borderRadius:16,padding:18} as const;
const buttonStyle = {display:'flex',alignItems:'center',gap:7,background:'#152127',border:'1px solid #2c3e45',color:'#dcebed',borderRadius:10,padding:'9px 12px',cursor:'pointer'} as const;
const slotStyle = {width:'100%',display:'grid',gridTemplateColumns:'22px 1fr 18px',alignItems:'center',gap:10,color:'#eaf4f5',padding:'12px',border:'1px solid',borderRadius:11,marginTop:9,cursor:'pointer'} as const;
const eyebrow = {fontSize:11,fontWeight:800,letterSpacing:'0.12em',color:'#65d6df'} as const;
