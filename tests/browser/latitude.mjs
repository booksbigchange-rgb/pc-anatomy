import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import * as T from 'three';
await mkdir('verification/latitude',{recursive:true});
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1800,height:1100},reducedMotion:'reduce'});
page.setDefaultTimeout(60000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const requests=[];page.on('request',r=>requests.push(r.url()));
const shot=async(name)=>{await page.waitForTimeout(800);console.log('Capture '+name);await page.screenshot({path:`verification/latitude/${name}.png`,timeout:30000});};
try{
 await page.goto(process.env.ATLAS_TEST_URL??'http://127.0.0.1:5173/');
 await page.getByRole('button',{name:'Laptop Lab',exact:true}).click();
 assert.equal(await page.getByRole('combobox',{name:'Laptop model'}).inputValue(),'latitude');
 await shot('01-open-exterior');
 await page.getByRole('button',{name:'Open exterior',exact:true}).click();
 await shot('02-closed-exterior');
 await page.getByRole('button',{name:'Closed exterior',exact:true}).click();
 await page.getByRole('button',{name:'Inside',exact:true}).click();
 await shot('03-service-layout');
 await page.getByRole('button',{name:'Top view',exact:true}).click();
 await shot('03b-top-service');
 await page.getByRole('button',{name:'Reset view',exact:true}).click();
 for(const name of ['SSD','RAM','Wi-Fi']){
  await page.locator('.laptop-part-list button').filter({hasText:name}).click();
  await page.getByRole('button',{name:'Explode part',exact:true}).click();
  await shot('04-local-'+name);
  assert.ok(await page.getByRole('button',{name:'Reset part',exact:true}).isEnabled());
  await page.getByRole('button',{name:'Isolate',exact:true}).click();
  await shot('05-isolated-'+name);
  await page.getByRole('button',{name:'Show all',exact:true}).click();
  await page.getByRole('button',{name:'Reset part',exact:true}).click();
 }
 await page.getByRole('button',{name:'Reassemble laptop',exact:true}).click();
 assert.equal(await page.getByRole('slider',{name:'Laptop teardown progress'}).inputValue(),'0');
 await shot('06-base-cover');
 const slider=page.getByRole('slider',{name:'Laptop teardown progress'});
 await slider.fill('100');await shot('07-board-out');
 await page.getByRole('button',{name:'Reassemble laptop',exact:true}).click();
 await page.getByRole('button',{name:'Guided lesson',exact:true}).click();
 await page.getByRole('button',{name:'Next →',exact:true}).click();
 assert.ok(await page.getByRole('heading',{name:'Remove the underside base cover',exact:true}).count());
 await shot('08-guided-cover');
 await page.getByRole('button',{name:'Next →',exact:true}).click();
 assert.equal(await page.getByRole('button',{name:'Complete action first',exact:true}).isEnabled(),false);
 await shot('09-cable-gate');
 const rect=await page.locator('.laptop-stage canvas').boundingBox();
 const camera=new T.PerspectiveCamera(40,rect.width/rect.height,.1,100);
 camera.position.set(9.2,8.4,11.8);camera.lookAt(0,1.15,.15);camera.updateMatrixWorld();
 const point=new T.Vector3(.68,1.15,.25).project(camera);
 await page.mouse.click(rect.x+(point.x+1)*rect.width/2,rect.y+(1-point.y)*rect.height/2);
 await page.getByRole('button',{name:'Next →',exact:true}).waitFor();
 await page.getByRole('button',{name:'Next →',exact:true}).click();
 await shot('09b-cable-action-complete');
 for(let step=3;step<11;step++){
  if(step===5||step===10){
   await page.getByRole('button',{name:'Reset view',exact:true}).click();
   await page.waitForTimeout(700);
   const t=step===5?49:89;const f=Math.min(1,Math.max(0,(t-72)/28));const e=f*f*(3-2*f);
   camera.position.lerpVectors(new T.Vector3(9.2,8.4,11.8),new T.Vector3(7.6,10.8,12.6),e);
   camera.lookAt(0,1.15,.15+e*.65);camera.updateMatrixWorld();
   const p=(step===5?new T.Vector3(-3.62,1.08,2.44):new T.Vector3(1.24,1.12,-2.0)).project(camera);
   await page.mouse.click(rect.x+(p.x+1)*rect.width/2,rect.y+(1-p.y)*rect.height/2);
   await page.getByRole('button',{name:'Next →',exact:true}).waitFor();
  }
  await page.getByRole('button',{name:'Next →',exact:true}).click();
 }
 await shot('09c-guided-complete');
 await page.getByRole('button',{name:'Finish lesson ✓',exact:true}).click();
 await page.getByRole('button',{name:'Troubleshoot',exact:true}).click();
 await page.locator('.laptop-troubleshoot-options button').filter({hasText:'M.2 SSD'}).click();
 assert.ok(await page.locator('.laptop-troubleshoot-card').innerText().then(t=>t.includes('Not quite')));
 await page.locator('.laptop-troubleshoot-options button').filter({hasText:'Battery'}).click();
 assert.ok(await page.getByRole('button',{name:'Next case →',exact:true}).isEnabled());
 await shot('10-troubleshooting');
 await page.getByRole('button',{name:'Knowledge check',exact:true}).click();
 assert.equal(await page.getByRole('button',{name:'Choose an answer',exact:true}).isEnabled(),false);
 const answers=['SSD','Battery cable','RAM / SODIMM','M.2 SSD','Heat pipes','Wi-Fi card','Motherboard','Display and display cable'];
 for(let i=0;i<answers.length;i++){
  await page.locator('.laptop-assessment-options button').filter({hasText:answers[i]}).click();
  await page.getByRole('button',{name:i===answers.length-1?'See results →':'Next question →',exact:true}).click();
 }
 await shot('11-knowledge-check');
 assert.ok((await page.locator('.laptop-assessment-card').innerText()).includes('7 / 8'));

 assert.ok(!requests.some(u=>u.includes('/models/')),'Latitude must not load Framework geometry');
 await page.getByRole('combobox',{name:'Laptop model'}).selectOption('framework');
 await shot('12-framework-retained');
 await page.getByRole('combobox',{name:'Laptop model'}).selectOption('latitude');
 await shot('13-latitude-restored');
 await page.getByRole('button',{name:'Connections',exact:true}).click();
 const portRect=await page.locator('.laptop-stage canvas').boundingBox();
 const pc=new T.PerspectiveCamera(40,portRect.width/portRect.height,.1,100);
 pc.position.set(13,3.4,.15);pc.lookAt(0,1.15,.15);pc.updateMatrixWorld();
 await page.getByRole('button',{name:'Right side',exact:true}).click();
 await page.waitForTimeout(600);
 const clickPort=async(x,z)=>{const p=new T.Vector3(x,.79,z+.2).project(pc);await page.mouse.click(portRect.x+(p.x+1)*portRect.width/2,portRect.y+(1-p.y)*portRect.height/2);await page.waitForTimeout(200);};
 await clickPort(323.05/80-.04,-1.34);
 assert.ok((await page.locator('.laptop-detail').innerText()).includes('Not quite'));
 // The opposite-side DC jack must be occluded by the chassis from this view.
 await clickPort(-323.05/80+.022,-2.15);
 assert.ok(await page.getByRole('heading',{name:'Charger → Power',exact:true}).count());
 await page.getByRole('button',{name:'Left side',exact:true}).click();await page.waitForTimeout(600);
 pc.position.set(-13,3.4,.15);pc.lookAt(0,1.15,.15);pc.updateMatrixWorld();
 await clickPort(-323.05/80+.022,-2.15);await shot('14a-left-ports');
 await page.getByRole('button',{name:'Right side',exact:true}).click();await page.waitForTimeout(600);
 pc.position.set(13,3.4,.15);pc.lookAt(0,1.15,.15);pc.updateMatrixWorld();
 for(const [x,z] of [[323.05/80-.022,-.77],[323.05/80-.022,-1.34],[323.05/80-.022,.4]])await clickPort(x,z);
 await page.getByRole('heading',{name:'Laptop connected.',exact:true}).waitFor();
 await shot('14-connections-complete');
 await page.getByRole('button',{name:'Reset connections',exact:true}).click();
 await page.getByRole('heading',{name:'Charger → Power',exact:true}).first().waitFor();
 assert.deepEqual(errors,[]);
 await writeFile('verification/latitude/result.json',JSON.stringify({passed:true,errors,checks:['default Dell model','closed exterior','underside service','SSD/RAM/WiFi explode isolate reset','reassemble','full teardown','complete guided lesson with three direct cable picks','cable safety gates','wrong/correct troubleshooting','assessment completion and review score','wrong/correct external port picks and reset','Framework retained','no substituted CAD']},null,2));
}catch(e){await shot('failure').catch(()=>{});await writeFile('verification/latitude/failure.txt',String(e.stack));throw e;}finally{await browser.close();}
