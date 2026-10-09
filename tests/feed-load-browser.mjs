import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({headless:true,executablePath:process.env.ENGI_BROWSER_PATH});
try{
 const page=await browser.newPage({viewport:{width:393,height:852}});await page.goto(process.env.ENGI_TEST_URL??'http://127.0.0.1:5176/engi/');await page.locator('.feed-home').waitFor();
 await page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts'),{prepareDeclarativePack,commitDeclarativeImport}=await import('/engi/src/services/declarative-pack.ts');await commitDeclarativeImport(await prepareDeclarativePack(await(await fetch('/engi/artifacts/usa-50-states-v3-flags-as-properties.engi')).blob(),db),{},db);});
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});const start=Date.now();await page.reload();await page.locator('.deck-cover-grid').waitFor();const reloadMs=Date.now()-start;
 const report=await page.evaluate(async()=>{
  const {trainerService}=await import('/engi/src/services/trainer-service.ts'),{db}=await import('/engi/src/db/engi-db.ts'),{feedPerformance}=await import('/engi/src/services/feed-performance.ts');
  const timed=async fn=>{const at=performance.now(),result=await fn();return {ms:Math.round(performance.now()-at),result};};
  feedPerformance.start();const snapshot=await timed(()=>trainerService.getGoalSnapshot(true));const homeStages=feedPerformance.report();feedPerformance.start();
  const deckIds=(await db.decks.toArray()).filter(d=>!d.archived).map(d=>d.id),start=await timed(()=>trainerService.startGoalFeed('all','mixed','daily',{endless:true,deckIds}));const startStages=feedPerformance.report();let session=start.result;const steps=[];
  for(let n=0;n<12;n++){feedPerformance.start();const intro=!!session.intro;const next=await timed(()=>intro?trainerService.completeIntro(session.id):trainerService.advanceFeed(session.id,true));session=next.result;const plan=await timed(()=>trainerService.getDayPlan(session.tag,'mixed',deckIds));steps.push({intro,ms:next.ms,planMs:plan.ms,next:session.intro?'intro':session.tasks[0]?.recipe.format,stages:feedPerformance.report()});}
  feedPerformance.stop();return {snapshotMs:snapshot.ms,homeStages,startMs:start.ms,startStages,steps};
 });
 await page.evaluate(()=>{window.engiPerformance.start();const button=[...document.querySelectorAll('button')].find(b=>b.textContent==='Начать обучение');button.addEventListener('pointerdown',()=>{window.userStartedAt=performance.now();},{once:true});window.userReady=new Promise(resolve=>{const observer=new MutationObserver(()=>{const ready=document.querySelector('.study-feed.state-ready .feed-task-content:not([hidden])');if(ready&&window.userStartedAt){observer.disconnect();resolve(Math.round(performance.now()-window.userStartedAt));}});observer.observe(document.body,{subtree:true,childList:true,attributes:true});});});
 const uiAt=Date.now();await page.getByRole('button',{name:'Начать обучение',exact:true}).click();await page.locator('.study-feed.state-ready').waitFor();await page.locator('.feed-task-content').waitFor({state:'visible'});const uiStartMs=Date.now()-uiAt,userReadyMs=await page.evaluate(()=>window.userReady),uiStages=await page.evaluate(()=>{const report=window.engiPerformance.report();window.engiPerformance.stop();return report;});
 const detail={cpuSlowdown:4,reloadMs,uiStartMs,userReadyMs,uiStages,...report};await writeFile('artifacts/feed-load-profile.json',JSON.stringify(detail,null,2));
 assert.equal(report.homeStages.filter(s=>s.stage==='proposals').length,0);
 assert(report.steps.filter(s=>!s.intro).every(s=>!s.stages.some(p=>p.stage==='candidates')),'Unchanged content must not recompile question structure between tasks');
 const range=items=>({min:Math.min(...items),max:Math.max(...items),median:[...items].sort((a,b)=>a-b)[Math.floor(items.length/2)]});
 console.log(JSON.stringify({cpuSlowdown:4,reloadMs,userReadyMs,startMs:report.startMs,ordinarySteps:range(report.steps.filter(s=>!s.intro).map(s=>s.ms)),introSteps:range(report.steps.filter(s=>s.intro).map(s=>s.ms)),counters:range(report.steps.map(s=>s.planMs)),profile:'artifacts/feed-load-profile.json'}));
}finally{await browser.close();}
