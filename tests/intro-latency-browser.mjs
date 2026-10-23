import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:393,height:852}});
try{
 await page.goto(process.env.ENGI_TEST_URL??'http://127.0.0.1:5182/engi/');await page.locator('.feed-home').waitFor();
 const result=await page.evaluate(async()=>{
  const root='/engi/',[{db},{putBundle},{trainerService},{StudyFeed},R,C]=await Promise.all(['src/db/engi-db.ts','src/db/repositories.ts','src/services/trainer-service.ts','src/components/study/StudyFeed.tsx','node_modules/.vite/deps/react.js','node_modules/.vite/deps/react-dom_client.js'].map(p=>import(root+p)));
  const b={entities:Array.from({length:50},(_,n)=>({id:'e'+n,name:'Object '+n,type:'thing',aliases:[],externalIds:{}})),facts:Array.from({length:500},(_,n)=>({id:'f'+n,entityId:'e'+Math.floor(n/10),key:'p'+n%10,valueKind:'number',valueNumber:n,verification:'verified',source:{name:'Test'}})),properties:Array.from({length:10},(_,n)=>({id:'p'+n,name:'Number '+n,valueKind:'number',cardinality:'one',learnable:true,learning:{reverse:false,sort:'off',timeline:'off',missing:'off'}})),media:[],tags:[],entityTags:[],missing:[],unresolved:[]};
  await putBundle(db,b);const host=document.createElement('div');document.body.replaceChildren(host);const react=(C.default??C).createRoot(host),samples=[];
  const getDayPlan=trainerService.getDayPlan;let planReads=0;trainerService.getDayPlan=(...args)=>{planReads++;return getDayPlan(...args)};
  for(let n=0;n<6;n++){
   const started=performance.now(),s=await trainerService.startGoalFeed('all','mixed','daily',{endless:true}),selected=performance.now();
   if(!trainerService.introPresentation(s))throw Error('Selector returned an unprepared introduction');
   const previous=document.querySelector('.learning22-card-sheet');react.render((R.default??R).createElement(StudyFeed,{key:n,initial:s,onExit:()=>{}}));
   await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Intro did not become visible')),10000);const check=()=>{const sheet=document.querySelector('.learning22-card-sheet');if(sheet&&sheet!==previous&&getComputedStyle(sheet).visibility==='visible'){clearTimeout(timeout);requestAnimationFrame(resolve)}else requestAnimationFrame(check)};requestAnimationFrame(check)});
   samples.push({selectionMs:selected-started,renderMs:performance.now()-selected});
  }
  if(planReads)throw Error('Hidden day plan must not compete with intro rendering: '+planReads);
  const know=document.querySelector('.learning22-choice.is-known')??[...document.querySelectorAll('button')].find(b=>b.textContent==='Знаю');know.click();
  await new Promise(r=>setTimeout(r,150));if(!document.querySelector('#object-intro-heading'))throw Error('Saving a familiarity selection must preserve the prepared intro');
  const restored=(await db.activeSessions.where('status').equals('active').toArray()).at(-1),previous=document.querySelector('.learning22-card-sheet');
  react.render((R.default??R).createElement(StudyFeed,{key:'restored',initial:restored,onExit:()=>{}}));
  await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Restored intro did not become visible')),10000);const check=()=>{const sheet=document.querySelector('.learning22-card-sheet');if(sheet&&sheet!==previous&&getComputedStyle(sheet).visibility==='visible'){clearTimeout(timeout);resolve()}else requestAnimationFrame(check)};requestAnimationFrame(check)});
  if(!document.querySelector('.learning22-choice.is-known[aria-pressed=true]'))throw Error('Restored familiarity selection was lost');
  react.unmount();return samples;
 });
 assert.equal(result.length,6);console.log(JSON.stringify(result));await mkdir('artifacts',{recursive:true});await writeFile('artifacts/intro-latency-'+(process.env.ENGI_PERF_LABEL??'current')+'.json',JSON.stringify(result,null,2));
}finally{await browser.close();}
