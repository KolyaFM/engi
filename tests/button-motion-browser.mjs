import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,executablePath:process.env.ENGI_BROWSER_PATH});
try{
 const page=await browser.newPage({viewport:{width:393,height:852},deviceScaleFactor:2});await page.goto(process.env.ENGI_TEST_URL??'http://127.0.0.1:5176/engi/');await page.locator('.feed-home').waitFor();
 await page.evaluate(async()=>{
  await import('/engi/src/components/study/study-feed.css');const R=await import('/engi/node_modules/.vite/deps/react.js'),C=await import('/engi/node_modules/.vite/deps/react-dom_client.js'),React=R.default??R,{createRoot}=C.default??C,{SurfaceButton}=await import('/engi/src/ui/SurfaceButton.tsx');
  const host=document.createElement('div');document.body.replaceChildren(host);const root=createRoot(host);
  window.renderMotion=selected=>root.render(React.createElement('section',{className:'study-feed',style:{padding:20,display:'grid',gridTemplateColumns:'1fr 1fr',alignContent:'start',gap:12}},...Array.from({length:8},(_,n)=>React.createElement(SurfaceButton,{key:n,className:'matching-tile '+(n===selected?'selected':''),style:{height:120}},React.createElement('span',null,'Объект '+n)))));window.renderMotion(-1);
 });await page.locator('.control-face').first().waitFor();await page.waitForTimeout(300);
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});const events=[];cdp.on('Tracing.dataCollected',e=>events.push(...e.value));await cdp.send('Tracing.start',{categories:'devtools.timeline',transferMode:'ReportEvents'});
 await page.evaluate(async()=>{for(let n=0;n<8;n++){window.renderMotion(n);await new Promise(r=>setTimeout(r,220));}});
 const ended=new Promise(r=>cdp.once('Tracing.tracingComplete',r));await cdp.send('Tracing.end');await ended;
 const paints=events.filter(e=>e.name==='Paint'),layouts=events.filter(e=>e.name==='Layout');console.log(JSON.stringify({cpuSlowdown:4,changes:8,paints:paints.length,paintMs:+(paints.reduce((n,e)=>n+(e.dur??0),0)/1000).toFixed(2),layouts:layouts.length}));
 if(!process.env.ENGI_MOTION_BASELINE){assert(paints.length<=80,'Colour transition must not repaint on every frame');assert(layouts.length<=2,'Colour changes must not recalculate layout');}
}finally{await browser.close();}
