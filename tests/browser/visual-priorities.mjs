import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const dir='verification/visual-priorities';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:process.env.ATLAS_BROWSER_CHANNEL||undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
const shot=async name=>{await page.waitForTimeout(800);await page.screenshot({path:`${dir}/${name}.png`});};
try{
 await page.goto(process.env.ATLAS_TEST_URL||'http://127.0.0.1:5186/');
 for(const name of ['My learning path','Task Manager','Build a PC','Laptop Lab','Explore inside the PC']){const button=page.locator('header').getByRole('button',{name,exact:true});assert.equal(await button.locator('span').isVisible(),true,`${name} must have visible text`);const box=await button.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=391,`${name} must fit phone width`);}
 await shot('01-phone-home');
 await page.getByRole('button',{name:'Laptop Lab',exact:true}).click();await page.getByRole('button',{name:'Inside',exact:true}).click();
 const parts=await page.locator('.laptop-parts').boundingBox(),stage=await page.locator('.laptop-stage').boundingBox();assert.ok(parts.y+parts.height<=stage.y+1,'Parts panel must not cover model');
 await shot('02-phone-laptop');await page.setViewportSize({width:1440,height:900});
 for(const value of ['18','60','78','100']){await page.getByRole('slider',{name:'Laptop teardown progress'}).fill(value);await shot(`03-teardown-${value}`);}
 await page.goto(process.env.ATLAS_TEST_URL||'http://127.0.0.1:5186/');await page.locator('header').getByRole('button',{name:'Explore inside the PC',exact:true}).click();await page.locator('.empty-scene.loading').waitFor({state:'hidden',timeout:60000});assert.match(await page.locator('body').ariaSnapshot(), /visible parts/);
 assert.deepEqual(errors,[]);await writeFile(`${dir}/result.json`,JSON.stringify({passed:true,errors,checks:['phone navigation labels and bounds','parts panel clear of laptop stage','teardown screenshots 18/60/78/100','explorer loads']},null,2));
}finally{await browser.close();}
