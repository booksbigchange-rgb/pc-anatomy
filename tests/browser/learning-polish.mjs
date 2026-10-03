import { chromium } from 'playwright';
import * as T from 'three';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('verification/learning-polish', {recursive:true});
const browser=await chromium.launch({channel:process.env.ATLAS_BROWSER_CHANNEL || undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
page.setDefaultTimeout(20000);
const errors=[]; page.on('pageerror',error=>errors.push(error.message));
const shot=async name=>page.screenshot({path:`verification/learning-polish/${name}.png`,timeout:30000});
try {
  await page.goto(process.env.ATLAS_TEST_URL || 'http://127.0.0.1:5186/');
  await page.getByRole('button',{name:'Task Manager',exact:true}).click();
  await page.locator('.tm-app-grid button').filter({hasText:'Copy files'}).click();
  const comparison=page.getByRole('region',{name:'Effect of your last action'});
  const disk=comparison.getByRole('row').filter({hasText:'Disk'});
  assert.ok(Number.parseInt(await disk.locator('td').nth(1).innerText()) > Number.parseInt(await disk.locator('td').nth(0).innerText())+70);
  await page.getByRole('button',{name:'End Copy files',exact:true}).click();
  assert.ok(Number.parseInt(await disk.locator('td').nth(1).innerText()) < Number.parseInt(await disk.locator('td').nth(0).innerText())-70);
  await comparison.scrollIntoViewIfNeeded();
  await shot('01-task-manager-effect');
  await page.setViewportSize({width:390,height:844});
  await comparison.scrollIntoViewIfNeeded(); await shot('02-task-manager-phone');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
  await page.getByRole('button',{name:/Back to Computer Lab/}).click();
  await page.setViewportSize({width:1600,height:1000});
  await page.getByRole('button',{name:/Build.*PC/i}).click();
  for (const choice of [/Intel Core i5-6500/,/Dell Q170 System Board/,/8 GB DDR4/,/M.2 2280 SSD/,/Slot-powered PCIe Card/,/Dell 240 W Power Supply/]) await page.getByRole('button',{name:choice}).last().click();
  await page.getByRole('button',{name:/Enter interactive/}).click();
  await page.getByRole('button',{name:'Service view',exact:true}).click();
  await page.getByRole('button',{name:'Rear',exact:true}).click();
  // Port list selection must show the connection explanation.
  await page.getByRole('button',{name:'Ethernet port',exact:true}).click();
  assert.equal(await page.locator('.assembly-detail h2').innerText(),'Ethernet port');
  await page.getByRole('button',{name:'USB port',exact:true}).click();
  await page.waitForTimeout(350);
  const rect=await page.locator('.assembly-stage canvas').boundingBox();
  const camera=new T.PerspectiveCamera(38,rect.width/rect.height,.1,100);
  camera.position.set(-9,4.3,0); camera.lookAt(2.5,1.1,0); camera.updateMatrixWorld();
  const point=new T.Vector3(.13,1.2,-.6).project(camera);
  await page.mouse.click(rect.x+(point.x+1)*rect.width/2,rect.y+(1-point.y)*rect.height/2);
  assert.equal(await page.locator('.assembly-detail h2').innerText(),'Ethernet port','Direct port click must select its socket, not the shield behind it');
  await page.getByRole('button',{name:'Light graphics',exact:true}).click();
  assert.ok(await page.getByRole('button',{name:'Full graphics',exact:true}).isVisible());
  assert.ok(await page.locator('.assembly-stage canvas').isVisible());
  await page.getByText('Practise troubleshooting',{exact:true}).click();
  const cases=[
    ['0','Inspect the monitor connection and input','Reconnect the monitor cable and select its input'],
    ['1','Inspect the CPU fan connection','Power off, unplug, and reconnect the CPU fan lead'],
    ['2','Compare RAM use with the open apps','Close unneeded tabs while keeping the lesson open'],
    ['3','Inspect the SSD connection with power unplugged','Reseat the SSD and secure its mounting screw'],
  ];
  for (const [id,test,fix] of cases) {
    await page.getByRole('combobox',{name:'PC troubleshooting case'}).selectOption(id);
    const retest=page.getByRole('button',{name:'3. Run the check again',exact:true});
    assert.equal(await retest.isEnabled(),false);
    await page.getByRole('button',{name:test,exact:true}).click();
    await page.getByRole('button',{name:fix,exact:true}).click();
    await retest.click();
    assert.match(await page.locator('.fault-practice').innerText(),/Verified: the simulated fault is resolved/);
  }
  await shot('03-desktop-diagnosis');
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'USB port',exact:true}).click();
  await page.locator('.assembly-detail h2').scrollIntoViewIfNeeded();
  await shot('04-desktop-phone');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
  await page.getByRole('button',{name:'Start assembly practice',exact:true}).click();
  await page.getByRole('button',{name:/^Seat .* in its guide$/}).click();
  // Touch placement must not bypass direction or cooling preparation.
  await page.getByRole('button',{name:/^Seat .* in its guide$/}).click();
  assert.match(await page.locator('.assembly-feedback').innerText(),/Wrong direction/);
  for (const id of ['cpu','cooler','ram','ssd','gpu','psu']) {
    if (['cpu','ram','ssd','gpu'].includes(id)) await page.getByRole('button',{name:'Turn part 180°',exact:true}).click();
    if (id==='cooler') {
      await page.getByRole('button',{name:/^Seat .* in its guide$/}).click();
      assert.match(await page.locator('.assembly-feedback').innerText(),/Apply thermal paste/);
      await page.getByRole('button',{name:'Apply thermal paste',exact:true}).click();
    }
    await page.getByRole('button',{name:/^Seat .* in its guide$/}).click();
  }
  await page.getByRole('button',{name:'Test power-on',exact:true}).click();
  assert.equal(await page.locator('.assembly-boot strong').count(),0);
  for (const label of ['Close RAM clips','Fasten SSD screw','Secure expansion bracket']) await page.getByRole('button',{name:label,exact:true}).click();
  for (const corner of [1,3,2,4]) await page.getByRole('button',{name:`Corner ${corner}`,exact:true}).click();
  for (const [id,target] of [['board-power','Board power socket'],['cpu-power','CPU power socket'],['fan','CPU fan header'],['switch','Power-button header'],['display','Graphics display output'],['mains','PSU AC inlet']]) {
    await page.getByRole('combobox',{name:'Choose PC cable'}).selectOption(id);
    await page.getByRole('button',{name:target,exact:true}).click();
  }
  await page.getByRole('button',{name:'Close drive cage',exact:true}).click();
  await page.getByRole('button',{name:'Fit side cover',exact:true}).click();
  await page.getByRole('button',{name:'Test power-on',exact:true}).click();
  assert.match(await page.locator('output.assembly-boot').innerText(),/POST passed/);
  await page.locator('output.assembly-boot').scrollIntoViewIfNeeded();
  await shot('05-phone-assembly-passed');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
  assert.deepEqual(errors,[]);
  await writeFile('verification/learning-polish/result.json',JSON.stringify({passed:true,errors,checks:['before/after resource effect','phone overflow','port identification','light graphics','four desktop diagnoses and verification gates']},null,2));
  console.log('PASS learning polish: resource comparison, phone layout, ports, light graphics, diagnosis gates.');
} catch(error) {
  await shot('failure');
  await writeFile('verification/learning-polish/result.json',JSON.stringify({passed:false,error:String(error),errors},null,2));
  throw error;
} finally { await browser.close(); }
