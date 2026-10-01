'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Cpu, HardDrive, MemoryStick, Microchip, PackageCheck, RotateCcw, ShieldCheck, Zap } from 'lucide-react';
import AssemblyLab from './assembly-lab';

type Slot = 'cpu' | 'motherboard' | 'ram' | 'ssd' | 'gpu' | 'psu';
type Choice = { id: string; name: string; detail: string; price: number; socket?: 'AM5' | 'LGA1851'; memory?: 'DDR5'; watts?: number; draw?: number };
const ORDER: Slot[] = ['cpu','motherboard','ram','ssd','gpu','psu'];
const LABEL: Record<Slot,string> = {cpu:'CPU',motherboard:'Motherboard',ram:'Memory',ssd:'Storage',gpu:'Graphics Card',psu:'Power Supply'};
const ICON = {cpu:Cpu,motherboard:Microchip,ram:MemoryStick,ssd:HardDrive,gpu:PackageCheck,psu:Zap};
const CATALOG: Record<Slot,Choice[]> = {
 cpu:[{id:'9950x',name:'Ryzen 9 9950X',detail:'16 cores · AM5',price:599,socket:'AM5',draw:170},{id:'9700x',name:'Ryzen 7 9700X',detail:'8 cores · AM5',price:329,socket:'AM5',draw:65},{id:'285k',name:'Core Ultra 9 285K',detail:'24 cores · LGA1851',price:589,socket:'LGA1851',draw:250}],
 motherboard:[{id:'x870',name:'X870 ATX Board',detail:'AM5 · DDR5',price:289,socket:'AM5',memory:'DDR5'},{id:'b650',name:'B650 ATX Board',detail:'AM5 · DDR5',price:169,socket:'AM5',memory:'DDR5'},{id:'z890',name:'Z890 ATX Board',detail:'LGA1851 · DDR5',price:299,socket:'LGA1851',memory:'DDR5'}],
 ram:[{id:'16',name:'16 GB DDR5',detail:'2 × 8 GB · DDR5',price:59,memory:'DDR5'},{id:'32',name:'32 GB DDR5',detail:'2 × 16 GB · DDR5',price:99,memory:'DDR5'},{id:'64',name:'64 GB DDR5',detail:'2 × 32 GB · DDR5',price:179,memory:'DDR5'}],
 ssd:[{id:'1tb',name:'1 TB NVMe SSD',detail:'M.2 PCIe storage',price:79},{id:'2tb',name:'2 TB NVMe SSD',detail:'M.2 PCIe storage',price:139},{id:'sata',name:'1 TB SATA SSD',detail:'2.5-inch SATA storage',price:69}],
 gpu:[{id:'5090',name:'GeForce RTX 5090',detail:'High-end graphics · 575 W',price:1999,draw:575},{id:'9070xt',name:'Radeon RX 9070 XT',detail:'Performance graphics · 304 W',price:599,draw:304},{id:'b580',name:'Intel Arc B580',detail:'Mainstream graphics · 190 W',price:249,draw:190}],
 psu:[{id:'650',name:'650 W PSU',detail:'80 Plus rated',price:79,watts:650},{id:'850',name:'850 W PSU',detail:'80 Plus Gold',price:129,watts:850},{id:'1200',name:'1200 W PSU',detail:'80 Plus Gold',price:219,watts:1200}],
};

export default function BuildPcLab({onBack}:{onBack:()=>void}) {
 const [selected,setSelected]=useState<Partial<Record<Slot,Choice>>>({});
 const [slot,setSlot]=useState<Slot>('cpu');
 const [building,setBuilding]=useState(true);
 const issues=useMemo(()=>{const out:string[]=[];const cpu=selected.cpu,board=selected.motherboard,ram=selected.ram,gpu=selected.gpu,psu=selected.psu;if(cpu&&board&&cpu.socket!==board.socket)out.push(`${cpu.name} uses ${cpu.socket}, but ${board.name} uses ${board.socket}.`);if(board&&ram&&board.memory!==ram.memory)out.push(`${ram.name} does not match the motherboard memory type.`);if(gpu&&psu&&(psu.watts??0)<(gpu.draw??0)+250)out.push(`${psu.name} is too small for this GPU.`);return out},[selected]);
 const complete=ORDER.every(id=>selected[id]);
 const total=ORDER.reduce((s,id)=>s+(selected[id]?.price??0),0);
 const choose=(id:Slot,c:Choice)=>{setSelected(o=>({...o,[id]:c}));const next=ORDER[ORDER.indexOf(id)+1];if(next)setSlot(next)};
 if(!building) return <AssemblyLab onBack={()=>setBuilding(true)}/>;
 return <main style={{minHeight:'100vh',background:'#091116',color:'#eef7f8',fontFamily:'Inter,system-ui,sans-serif'}}>
  <header style={{height:66,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px',borderBottom:'1px solid #223239',background:'#0d171c'}}>
   <button onClick={onBack} style={button}><ArrowLeft size={16}/> Computer Lab</button><div style={{textAlign:'center'}}><b style={{fontSize:20}}>Build Your PC — 3D Lab</b><div style={{fontSize:11,color:'#79a0a7'}}>CHOOSE PARTS WHILE YOUR 3D BUILD STAYS IN VIEW</div></div><button onClick={()=>{setSelected({});setSlot('cpu')}} style={button}><RotateCcw size={15}/> Reset</button>
  </header>
  <div style={{display:'grid',gridTemplateColumns:'290px minmax(480px,1fr) 330px',height:'calc(100vh - 66px)'}}>
   <aside style={{padding:16,borderRight:'1px solid #223239',overflow:'auto',background:'#0d171c'}}><div style={eye}>YOUR COMPONENTS</div>{ORDER.map(id=>{const I=ICON[id],item=selected[id];return <button key={id} onClick={()=>setSlot(id)} style={{...slotButton,borderColor:slot===id?'#63d5df':'#273a41',background:slot===id?'#143039':'#111d22'}}><I size={18}/><span><b>{LABEL[id]}</b><small style={{display:'block',color:item?'#8fe1b1':'#718a91',marginTop:3}}>{item?.name??'Choose part'}</small></span>{item&&<CheckCircle2 size={16}/>}</button>})}<div style={{marginTop:18,paddingTop:16,borderTop:'1px solid #27383e',display:'flex',justifyContent:'space-between'}}><span>Build total</span><b>${total.toLocaleString()}</b></div></aside>
   <section style={{position:'relative',minHeight:500,background:'radial-gradient(circle at 50% 40%,#19323b 0,#0b151a 55%,#071014 100%)',overflow:'hidden'}}>
    <div style={{position:'absolute',inset:0,display:'grid',placeItems:'center',pointerEvents:'none'}}><div style={{width:'72%',height:'72%',border:'1px solid #29434b',borderRadius:28,boxShadow:'0 0 90px rgba(99,213,223,.08) inset',display:'grid',placeItems:'center'}}><div style={{textAlign:'center',maxWidth:520,padding:30}}><Microchip size={58} strokeWidth={1.2} style={{opacity:.55}}/><h2 style={{fontSize:28,margin:'15px 0 8px'}}>Your 3D workbench</h2><p style={{color:'#86a1a8',lineHeight:1.6}}>Choose the hardware around the 3D workbench. When all compatible parts are selected, continue directly into the interactive Three.js installation scene.</p><div style={{display:'flex',justifyContent:'center',gap:7,flexWrap:'wrap',marginTop:20}}>{ORDER.map(id=><span key={id} style={{padding:'7px 10px',borderRadius:20,background:selected[id]?'#14382b':'#17252b',color:selected[id]?'#9be8b7':'#718a91',fontSize:12}}>{selected[id]?.name??LABEL[id]}</span>)}</div></div></div></div>
    <div style={{position:'absolute',left:18,bottom:18,right:18,display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 15px',border:'1px solid #294048',borderRadius:13,background:'rgba(10,20,25,.88)',backdropFilter:'blur(8px)'}}><span style={{color:'#8da7ad'}}>3D assembly is part of this build flow — no separate builder page.</span><button disabled={!complete||issues.length>0} onClick={()=>setBuilding(false)} style={{...primary,opacity:complete&&issues.length===0?1:.4,cursor:complete&&issues.length===0?'pointer':'not-allowed'}}>Enter interactive 3D installation →</button></div>
   </section>
   <aside style={{padding:16,borderLeft:'1px solid #223239',overflow:'auto',background:'#0d171c'}}><div style={eye}>CHOOSE {LABEL[slot].toUpperCase()}</div><h2 style={{margin:'7px 0 5px'}}>{LABEL[slot]}</h2><p style={{fontSize:13,color:'#829ba1'}}>Select a part for your live build.</p>{CATALOG[slot].map(c=><button key={c.id} onClick={()=>choose(slot,c)} style={{width:'100%',textAlign:'left',padding:14,marginTop:10,borderRadius:12,border:selected[slot]?.id===c.id?'2px solid #63d5df':'1px solid #293c43',background:selected[slot]?.id===c.id?'#153139':'#111d22',color:'#eef7f8',cursor:'pointer'}}><b>{c.name}</b><div style={{fontSize:12,color:'#849da3',margin:'5px 0 9px'}}>{c.detail}</div><strong>${c.price}</strong></button>)}<div style={{marginTop:18}}>{issues.length===0?<div style={{padding:12,borderRadius:11,background:'#123126',color:'#9ae6b4',display:'flex',gap:8}}><ShieldCheck size={18}/> Compatible so far</div>:issues.map(x=><div key={x} style={{padding:12,borderRadius:11,background:'#38251d',color:'#ffc39e',marginBottom:8,fontSize:13}}>{x}</div>)}</div></aside>
  </div>
 </main>
}
const button={display:'flex',alignItems:'center',gap:7,background:'#152127',border:'1px solid #2c3e45',color:'#dcebed',borderRadius:10,padding:'9px 12px',cursor:'pointer'} as const;
const slotButton={width:'100%',display:'grid',gridTemplateColumns:'22px 1fr 18px',alignItems:'center',gap:10,color:'#eaf4f5',padding:'12px',border:'1px solid',borderRadius:11,marginTop:9,cursor:'pointer',textAlign:'left'} as const;
const eye={fontSize:11,fontWeight:800,letterSpacing:'.12em',color:'#63d5df'} as const;
const primary={border:0,borderRadius:10,padding:'11px 15px',fontWeight:800,background:'#63d5df',color:'#082126'} as const;