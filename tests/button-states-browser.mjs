import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,executablePath:process.env.ENGI_BROWSER_PATH});
try{
 for(const scale of [1,2]){
  const context=await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:scale}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.ENGI_TEST_URL??'http://127.0.0.1:5176/engi/');await page.locator('.feed-home').waitFor();
  await page.evaluate(async()=>{
   await import('/engi/src/components/study/study-feed.css');
   const R=await import('/engi/node_modules/.vite/deps/react.js'),C=await import('/engi/node_modules/.vite/deps/react-dom_client.js'),React=R.default??R,{createRoot}=C.default??C,{SurfaceButton}=await import('/engi/src/ui/SurfaceButton.tsx');
   const host=document.createElement('div');host.style.cssText='position:fixed;inset:0;z-index:1000;background:#f6f3ee;padding:24px';document.body.append(host);const root=createRoot(host);
   window.renderButtons=state=>root.render(React.createElement('section',{className:'study-feed',style:{position:'relative',inset:'auto',width:'100%',height:'auto',minHeight:0,display:'grid',gap:16}},React.createElement(SurfaceButton,{className:'matching-tile matching-answer '+state,style:{height:124},'aria-pressed':state==='selected'},React.createElement('span',null,'Иллинойс')),React.createElement(SurfaceButton,{className:'matching-tile matching-object is-image selected',style:{height:160}},React.createElement('img',{alt:'Карта',src:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='130' height='100'%3E%3Crect width='130' height='100' fill='%23dae2e7'/%3E%3C/svg%3E"}))));window.renderButtons('idle');
  });
  const answer=page.locator('.matching-answer');await answer.locator('.control-face').waitFor();
  for(const fallback of [false,true]){
   if(fallback)await page.evaluate(async()=>{const {installContinuousCorners}=await import('/engi/src/ui/continuous-corners.ts');window.cleanupButtons=installContinuousCorners(true);});
   for(const [state,color]of [['selected','rgb(154, 137, 184)'],['correct','rgb(134, 180, 154)'],['incorrect','rgb(206, 149, 141)']]){
    await page.evaluate(state=>window.renderButtons(state),state);
    const layer=state==='selected'?'selection':state==='correct'?'success':'error';
    await page.waitForFunction(({layer,color})=>{const el=document.querySelector('.matching-answer .control-'+layer);return getComputedStyle(el).opacity==='1'&&getComputedStyle(el.querySelector('path')).stroke===color;},{layer,color});
    const visual=await answer.evaluate(el=>({mask:getComputedStyle(el).maskImage,shadow:getComputedStyle(el).boxShadow,animation:getComputedStyle(el).animationName,stroke:getComputedStyle(el.querySelector('.control-face')).strokeWidth,fallback:el.classList.contains('g2-fallback')}));
    assert.deepEqual(visual,{mask:'none',shadow:'none',animation:'none',stroke:'1px',fallback:false});
   }
   await page.evaluate(()=>window.renderButtons('selected'));await page.waitForTimeout(200);
   const before=await answer.locator('.control-face').getAttribute('d'),box=await answer.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
   assert.equal(await answer.evaluate(el=>getComputedStyle(el).transform),'none');assert.equal(await answer.locator('.control-face').getAttribute('d'),before);assert.equal(await answer.locator('.control-focus').evaluate(el=>getComputedStyle(el).opacity),'0');await page.mouse.up();
   await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');assert.equal(await answer.locator('.control-focus').evaluate(el=>getComputedStyle(el).opacity),'1');
   await page.locator('.matching-object').click();await page.waitForTimeout(200);if(fallback&&scale===2)await page.screenshot({path:'artifacts/button-states-g2.png'});
   if(fallback)await page.evaluate(()=>window.cleanupButtons());
  }
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await answer.locator('.control-selection').evaluate(el=>getComputedStyle(el).transitionDuration),'0s');assert.deepEqual(errors,[]);await context.close();
 }
 console.log('PASS single unclipped G2 surface at DPR 1/2, stable 1px stroke, pointer press, keyboard focus, fallback isolation and reduced motion');
}finally{await browser.close();}

