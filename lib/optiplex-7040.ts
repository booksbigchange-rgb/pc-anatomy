/** Original reference-derived geometry. Dell's manual is a visual reference,
 * not a source of redistributed meshes. Component measurements are estimates.
 * Case envelope: 350 x 154 x 274 mm; 1 scene unit = 60 mm, laid on right side.
 */
import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
export type HardwareId = 'motherboard'|'cpu'|'cooler'|'ram'|'ssd'|'gpu'|'psu';
export type Vec3 = [number,number,number];
export const MOUNTS:Record<HardwareId,Vec3> = {
 motherboard:[2.08,.76,.5], cpu:[1.48,.93,-.48], cooler:[1.48,1.18,-.48],
 ram:[2.91,1.2,-.43], ssd:[3.12,.92,1.26], gpu:[1.88,1.37,1.66], psu:[1.33,1.37,-2.08],
};
const steel=0xa4a9ac, black=0x171a1d, blue=0x327eb2, gold=0xc9a34d;
function material(color:number){return new T.MeshStandardMaterial({color,metalness:color===steel||color===gold?.68:.12,roughness:color===steel?.38:.6});}
function box(w:number,h:number,d:number,color:number,r=.012){return new T.Mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/4,h/4,d/4)),material(color));}
function put(g:T.Group,o:T.Object3D,x=0,y=0,z=0){o.position.set(x,y,z);g.add(o);return o;}
function cyl(r:number,h:number,color:number){return new T.Mesh(new T.CylinderGeometry(r,r,h,24),material(color));}
function screw(g:T.Group,x:number,y:number,z:number){put(g,cyl(.052,.034,steel),x,y,z);put(g,box(.058,.005,.011,black,0),x,y+.019,z);put(g,box(.011,.005,.058,black,0),x,y+.019,z);}
function label(g:T.Group,text:string,w:number,d:number,x:number,y:number,z:number,color='#dee3dd'){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d')!;
 ctx.fillStyle=color;ctx.fillRect(0,0,512,128);ctx.fillStyle='#19201f';ctx.font='bold 30px monospace';ctx.fillText(text,16,49);
 ctx.font='17px monospace';ctx.fillText('PC HARDWARE ATLAS / TRAINING',16,89);
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const mesh=new T.Mesh(new T.PlaneGeometry(w,d),new T.MeshStandardMaterial({map:texture,roughness:.8}));mesh.rotation.x=-Math.PI/2;put(g,mesh,x,y,z);
}
function cable(g:T.Group,points:Vec3[],color:number,r=.024){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));g.add(new T.Mesh(new T.TubeGeometry(curve,24,r,6,false),material(color)));}
function fan(size=1.05){const g=new T.Group();const r=size*.43;
 for(const x of [-1,1])put(g,box(size*.1,.13,size,black),x*size*.45,0,0);
 for(const z of [-1,1])put(g,box(size,.13,size*.1,black),0,0,z*size*.45);
 const ring=new T.Mesh(new T.TorusGeometry(r,.035,8,36),material(black));ring.rotation.x=Math.PI/2;g.add(ring);
 for(let i=0;i<7;i++){const blade=box(r*.76,.035,r*.27,0x303638,.035);blade.position.set(Math.cos(i*Math.PI*2/7)*r*.53,0,Math.sin(i*Math.PI*2/7)*r*.53);blade.rotation.y=-i*Math.PI*2/7+.5;blade.rotation.z=.2;g.add(blade);}
 put(g,cyl(size*.12,.09,black),0,.04,0);for(const x of [-1,1])for(const z of [-1,1])screw(g,x*size*.4,.075,z*size*.4);return g;
}
function shadows(g:T.Group){g.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;}});return g;}
export function createHardware(id:HardwareId){const g=new T.Group();g.name=id;
 if(id==='motherboard'){
  put(g,box(3.6,.055,3.84,0x24614d));
  // CPU socket and retention frame, four DIMM connectors, four expansion slots.
  put(g,box(.76,.06,.76,steel),-.6,.07,-.98);put(g,box(.6,.06,.6,black),-.6,.12,-.98);
  cable(g,[[-.99,.16,-1.38],[-.98,.16,-.56],[-.19,.16,-.56],[-.18,.16,-1.3]],steel,.016);
  for(const x of [.61,.83,1.05,1.27]){put(g,box(.09,.15,2.22,black),x,.09,-.93);put(g,box(.028,.004,2.1,0x887452),x,.169,-.93);for(const z of [-2.03,.18])put(g,box(.13,.19,.12,0xdad8c9),x,.11,z);}
  for(const [z,c,w] of [[.77,blue,2.78],[1.14,black,.65],[1.52,black,2.78],[1.83,0xd8d6c4,2.5]]){
   put(g,box(w,.13,.1,c),-.18,.09,z);put(g,box(w-.09,.005,.024,black),-.18,.16,z);
  }
  // Rear I/O shielding faces the rear x edge.
  for(const [z,w,h]of [[-1.54,.42,.28],[-.99,.4,.39],[-.42,.42,.32],[.02,.32,.43]]){put(g,box(.28,h,w,steel),-1.65,h/2+.025,z);put(g,box(.014,h*.6,w*.65,black),-1.8,h/2+.025,z);}
  // VRM chokes, capacitors, chipset, power and SATA connectors.
  for(let i=0;i<8;i++){const x=-1.27+i*.17;put(g,cyl(.046,.19,black),x,.13,-1.69);put(g,cyl(.042,.014,steel),x,.231,-1.69);put(g,box(.13,.09,.15,0x747c80),x,.09,-1.44);}
  put(g,box(.53,.13,.5,0x46515b),.62,.08,.79);
  for(let x=.4;x<.87;x+=.045)put(g,box(.018,.13,.48,steel),x,.17,.79);
  put(g,cyl(.168,.04,steel),1.26,.07,.61);put(g,cyl(.186,.025,black),1.26,.03,.61);
  for(const z of [.8,1.12,1.44,1.72])put(g,box(.16,.14,.17,black),1.64,.1,z);
  put(g,box(.3,.19,.16,0xe6e2d4),1.45,.11,1.85);put(g,box(.25,.16,.15,0xe6e2d4),-.62,.1,-1.85);
  put(g,box(.13,.09,.38,black),.3,.07,.76);
  for(let i=0;i<45;i++){const x=-1.35+(i%9)*.31,z=-.25+Math.floor(i/9)*.2;put(g,box(.09,.03,.04,i%3?0xb49a63:black),x,.049,z);}
  for(const [x,z]of [[-1.55,-1.76],[1.57,-1.76],[-1.55,1.75],[1.57,1.75]])screw(g,x,.075,z);
  label(g,'Q170 / LGA1151',.86,.22,-.48,.055,.34);
 }
 if(id==='cpu'){put(g,box(.62,.06,.62,0x315445));put(g,box(.55,.05,.55,steel),0,.055,0);label(g,'Intel Core',.45,.12,0,.082,0);}
 if(id==='cooler'){
  put(g,box(1.05,.13,1.05,steel),0,0,0);for(let i=0;i<27;i++)put(g,box(.028,.5,1.02,steel),-.49+i*.038,.3,0);
  put(g,fan(1.06),0,.61,0);for(const x of [-.58,.58])for(const z of [-.58,.58]){put(g,cyl(.03,.5,steel),x,.22,z);screw(g,x,.48,z);}
  cable(g,[[.46,.62,.3],[.68,.15,.3],[.7,-.03,-.3]],black,.019);
 }
 if(id==='ram'){
  put(g,box(.042,.52,2.22,0x25543e));for(const x of [-.04,.04])for(let z=-.85;z<1;z+=.255)put(g,box(.03,.24,.2,black),x,.07,z);
  for(let z=-1.02;z<1.04;z+=.041){if(Math.abs(z+.15)<.06)continue;put(g,box(.046,.095,.025,gold,0),0,-.3,z);}
  const sticker=box(.016,.21,.75,0xe8e9df);put(g,sticker,.059,.03,.15);
 }
 if(id==='ssd'){
  put(g,box(.367,.036,1.333,0x21563c));for(const z of [-.36,.06,.42])put(g,box(.25,.05,.28,black),0,.043,z);
  for(let x=-.15;x<.17;x+=.028)put(g,box(.018,.038,.095,gold,0),x,0,-.7);
  screw(g,0,.029,.61);label(g,'M.2 NVMe',.28,.26,0,.072,.08);
 }
 if(id==='gpu'){
  // Small slot-powered teaching card; no giant modern GPU in a 240 W chassis.
  put(g,box(2.76,1.04,.045,0x2b5142));put(g,box(2.14,.73,.28,steel),.12,.03,.15);
  for(let x=-.9;x<1.13;x+=.07)put(g,box(.026,.68,.32,0x738086),x,.04,.2);
  const f=fan(.7);f.rotation.x=Math.PI/2;put(g,f,.35,.04,.39);
  put(g,box(.045,1.85,.24,steel),-1.39,.14,0);put(g,box(1.54,.1,.05,gold),-.18,-.55,0);
  for(const y of [-.18,.16,.5])put(g,box(.04,.16,.13,black),-1.42,y,0);
 }
 if(id==='psu'){
  put(g,box(2.17,1.08,1.25,steel));label(g,'240 W / OEM PSU',1.64,.67,0,.55,0);
  for(let z=-.48;z<=.49;z+=.095)for(let y=-.4;y<=.4;y+=.11)put(g,box(.006,.046,.052,black,0),-1.088,y,z);
  put(g,box(.034,.29,.37,black),-1.1,.04,0);put(g,box(.04,.035,.045,0x6cad55),-1.11,-.24,.31);
  for(let i=0;i<6;i++)cable(g,[[1.08,-.22,.2+i*.03],[1.32,-.42,.25+i*.03],[1.42,-.54,.8+i*.02]],i%2?0xd9b343:black,.018);
 }
 return shadows(g);
}
export function createChassis(){const g=new T.Group();g.name='chassis';const cx=2.5,base=.58,top=base+154/60,zmax=350/120,back=cx-274/120,front=cx+274/120;
 // Thin folded steel walls, with rear openings rather than a solid blocking wall.
 put(g,box(274/60,.075,350/60,steel),cx,base,0);
 for(const z of [-zmax,zmax]){put(g,box(274/60,154/60,.065,black),cx,(base+top)/2,z);put(g,box(274/60,.07,.13,steel),cx,top,z);}
 put(g,box(.07,154/60,.36,steel),back,(base+top)/2,-zmax+.18);
 put(g,box(.07,.1,350/60,steel),back,base+.07,0);put(g,box(.07,.1,350/60,steel),back,top-.03,0);
 for(const z of [-1.29,1.06,2.82])put(g,box(.07,154/60,.1,steel),back,(base+top)/2,z);
 // Rear ventilation, motherboard I/O, four expansion covers.
 for(let z=-1.2;z<.93;z+=.13)for(let y=1.38;y<2.85;y+=.13)put(g,box(.025,.047,.065,black,0),back,y,z);
 for(let i=0;i<4;i++){const z=1.28+i*.35;put(g,box(.06,1.68,.2,steel),back,1.62,z);for(let y=.95;y<2.25;y+=.13)put(g,box(.01,.075,.12,black),back-.04,y,z);}
 const exhaust=fan(1.23);exhaust.rotation.z=Math.PI/2;put(g,exhaust,back+.09,2.08,-.4);
 // Front bezel: perforated lower field, upper optical drive and four USB ports.
 put(g,box(.16,154/60,350/60,black,.04),front,(base+top)/2,0);
 for(let z=-.22;z<2.7;z+=.105)for(let y=base+.16;y<top-.1;y+=.105)put(g,box(.022,.047,.047,0x555a5b,.008),front+.09,y,z);
 put(g,box(.028,1.95,.16,0x4b5053),front+.096,1.89,-2.25);put(g,box(.04,.11,.045,black),front+.12,2.7,-2.25);
 for(let i=0;i<4;i++){const y=base+.5+i*.48;put(g,box(.031,.3,.15,0x747b7e),front+.098,y,-.63);put(g,box(.035,.23,.085,i>1?0x1b6895:black),front+.12,y,-.63);}
 const power=cyl(.115,.028,steel);power.rotation.z=Math.PI/2;put(g,power,front+.11,2.77,-1.55);
 const audio=cyl(.055,.035,black);audio.rotation.z=Math.PI/2;put(g,audio,front+.11,1.03,-1.04);
 // Open drive cage rails and optical assembly, release tabs.
 for(const y of [.92,2.71])put(g,box(1.05,.075,1.82,steel),front-.69,y,-1.78);
 for(const x of [front-.22,front-1.16])put(g,box(.065,1.83,.12,steel),x,1.82,-2.64);
 put(g,box(1.02,1.9,.14,steel),front-.7,1.82,-.9);
 put(g,box(.94,1.79,.13,0x747d80),front-.69,1.82,-2.24);
 put(g,box(.17,.3,.3,blue),front-1.23,2.64,-1.18);
 // Lower drive caddy and cable routing; remains clear of RAM and board mounts.
 for(const z of [1.38,2.72])put(g,box(.76,.075,.075,steel),front-.51,.82,z);
 for(const x of [front-.15,front-.86])put(g,box(.065,.4,1.35,blue),x,1.05,2.05);
 for(const [x,z] of [[.53,-1.3],[3.66,-1.3],[.53,2.25],[3.66,2.25]])put(g,cyl(.057,.12,gold),x,.69,z);
 cable(g,[[front-.3,.76,-.6],[front-.5,.72,.2],[front-.65,.73,1],[3.65,.78,1.55]],black,.045);
 const cover=new T.Group();cover.name='cover';put(cover,box(274/60,.055,350/60,black),cx,top+.035,0);
 put(cover,box(.35,.06,.48,blue),back+.32,top+.085,-2.46);
 for(let z=-.55;z<.6;z+=.11)put(cover,box(1.4,.012,.032,0x404548),1.48,top+.07,z);
 cover.visible=false;g.add(cover);return {group:shadows(g),cover};
}
