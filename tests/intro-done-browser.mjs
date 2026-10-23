import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
const packs=(process.env.ENGI_PERF_PACKS??'').split(',').filter(Boolean);
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:393,height:852}});
try{
 await page.goto(process.env.ENGI_TEST_URL??'http://127.0.0.1:5182/engi/');await page.locator('.feed-home').waitFor();const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:Number(process.env.ENGI_PERF_CPU??1)});
 const result=await page.evaluate(async(packs)=>{
  const root='/engi/',[{db},{putBundle},{trainerService},{StudyFeed},R,C]=await Promise.all(['src/db/engi-db.ts','src/db/repositories.ts','src/services/trainer-service.ts','src/components/study/StudyFeed.tsx','node_modules/.vite/deps/react.js','node_modules/.vite/deps/react-dom_client.js'].map(p=>import(root+p)));
  const b={entities:Array.from({length:50},(_,n)=>({id:'e'+n,name:'Object '+n,type:'thing',aliases:[],externalIds:{}})),facts:Array.from({length:500},(_,n)=>({id:'f'+n,entityId:'e'+Math.floor(n/10),key:'p'+n%10,valueKind:'number',valueNumber:n,verification:'verified',source:{name:'Test'}})),properties:Array.from({length:10},(_,n)=>({id:'p'+n,name:'Number '+n,valueKind:'number',cardinality:'one',learnable:true,learning:{reverse:false,sort:'off',timeline:'off',missing:'off'}})),media:[],tags:[],entityTags:[],missing:[],unresolved:[]};
  const {prepareDeclarativePack,commitDeclarativeImport}=await import('/engi/src/services/declarative-pack.ts');for(const file of packs){const blob=await(await fetch('/engi/artifacts/'+file+'.engi')).blob();await commitDeclarativeImport(await prepareDeclarativePack(blob,db),{},db);}if(!packs.length)await putBundle(db,b);const {feedPerformance}=await import('/engi/src/services/feed-performance.ts');
  let feedbackReady=false,planReads=0;const getFeedback=trainerService.getFeedback,getDayPlan=trainerService.getDayPlan;trainerService.getFeedback=async(...args)=>{await new Promise(r=>setTimeout(r,30));const result=await getFeedback(...args);feedbackReady=true;return result};trainerService.getDayPlan=(...args)=>{if(!feedbackReady)throw Error('Counters requested before incoming task readiness');planReads++;return getDayPlan(...args)};
  let s=await trainerService.startGoalFeed('all','mixed','daily',{endless:true});
  const host=document.createElement('div');document.body.replaceChildren(host);const react=(C.default??C).createRoot(host);react.render((R.default??R).createElement(StudyFeed,{initial:s,onExit:()=>{}}));
  const ready=()=>{const sheet=document.querySelector('.learning22-card-sheet');return sheet&&getComputedStyle(sheet).visibility==='visible'};
  await new Promise(resolve=>{const check=()=>ready()?resolve():requestAnimationFrame(check);check()});
  const results=[];for(let n=0;n<2;n++){
   await new Promise(r=>setTimeout(r,400));feedPerformance.start();const previous=document.querySelector('.learning22-card-sheet'),start=performance.now();
   const before=(await db.activeSessions.where('status').equals('active').toArray()).at(-1),done=[...document.querySelectorAll('button')].find(b=>b.textContent==='Готово');done.click();done.click();if(document.body.textContent.includes('Сохраняем выбор'))throw Error('Unwanted saving label');
   await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Done transition stuck')),15000);const check=()=>{const sheet=document.querySelector('.learning22-card-sheet'),task=document.querySelector('.study-feed.state-ready .feed-task-content:not([hidden])');if(sheet&&sheet!==previous&&getComputedStyle(sheet).visibility==='visible'||task){clearTimeout(timeout);requestAnimationFrame(resolve)}else requestAnimationFrame(check)};check()});
   const after=(await db.activeSessions.where('status').equals('active').toArray()).at(-1);if(after.completedCount!==before.completedCount+1)throw Error('Done must complete exactly one introduction');results.push({ms:performance.now()-start,stages:feedPerformance.report()});feedPerformance.stop();if(!document.querySelector('.learning22-card-sheet'))break;
  }if(document.querySelector('.feed-current')){await new Promise(r=>setTimeout(r,150));if(!planReads)throw Error('Visible task counters never refreshed');}if(document.querySelector('.feed-error')?.textContent)throw Error(document.querySelector('.feed-error').textContent);react.unmount();return results;
 },packs);
 assert(result.length>0);console.log(JSON.stringify(result));await mkdir('artifacts',{recursive:true});await writeFile('artifacts/intro-latency-'+(process.env.ENGI_PERF_LABEL??'current')+'.json',JSON.stringify(result,null,2));
}finally{await browser.close();}
