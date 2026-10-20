import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true}),page=await browser.newPage({viewport:{width:393,height:852}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{for(const kind of ['number','date']){
  await page.goto(process.env.ENGI_TEST_URL??'http://127.0.0.1:5173/engi/');await page.locator('.feed-home').waitFor();
  const expected=await page.evaluate(async kind=>(await import('/engi/tests/browser-ordering-fixture.tsx')).mountOrderingProbe(kind),kind);
  await page.getByRole('button',{name:'Проверить',exact:true}).waitFor();assert((await page.locator('.sort-year').allTextContents()).every(s=>!s));await page.getByRole('button',{name:'Проверить',exact:true}).click();await page.getByRole('button',{name:'Продолжить',exact:true}).waitFor();assert.deepEqual(await page.locator('.sort-year').allTextContents(),expected);if(kind==='number')assert(expected.some(s=>s.includes('22, 24')));
 }
 assert.deepEqual(errors,[]);console.log('PASS '+engine.name()+': generic numeric and precise-date order, complete multi-value labels after checking');
 }catch(error){console.error(JSON.stringify({engine:engine.name(),errors,body:await page.locator('body').innerText()}));throw error;}finally{await browser.close();}
}
