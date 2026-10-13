import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,executablePath:process.env.ENGI_BROWSER_PATH}),page=await browser.newPage({viewport:{width:393,height:852}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(process.env.ENGI_TEST_URL??'http://127.0.0.1:5173/engi/');await page.locator('.feed-home').waitFor();
 const task=await page.evaluate(async()=>{
  const {db}=await import('/engi/src/db/engi-db.ts'),{prepareDeclarativePack,commitDeclarativeImport}=await import('/engi/src/services/declarative-pack.ts'),{getBundle}=await import('/engi/src/db/repositories.ts');
  const file=await(await fetch('/engi/artifacts/usa-50-states-v3-flags-as-properties.engi')).blob(),prepared=await prepareDeclarativePack(file,db);await commitDeclarativeImport(prepared,{},db);
  const {trainerService}=await import('/engi/src/services/trainer-service.ts'),{composeUnit,compositionContext}=await import('/engi/src/lib/engi/session/composer.ts'),{prepareStudyTask}=await import('/engi/src/services/study-core-bridge.ts');
  let s=await trainerService.startGoalFeed('all','choice','daily',{endless:true});const entityId=s.intro.entityId;s=await trainerService.completeIntro(s.id);
  const b=await getBundle(db),m=(await db.learningState.toArray()).find(r=>r.id===`ku:entity:${entityId}:visual_identity`).payload,ctx=compositionContext(b),narrow={...ctx,targets:new Map([[m.id,ctx.targets.get(m.id).filter(x=>x.r.answerKey==='identity'&&x.r.answerPresentation==='image')]])};
  const q=composeUnit(b,m,'all','choice',[],narrow);q.memoryModel='goals';q.learningLifecycle=1;q.intent='learn';await prepareStudyTask(db,b,q);
  s={...s,intro:undefined,tasks:[q],currentPosition:0,exhausted:false,interaction:undefined};await db.activeSessions.put(s);
  const R=await import('/engi/node_modules/.vite/deps/react.js'),C=await import('/engi/node_modules/.vite/deps/react-dom_client.js'),{StudyFeed}=await import('/engi/src/components/study/StudyFeed.tsx');const host=document.createElement('div');document.body.replaceChildren(host);window.mapRoot=(C.default??C).createRoot(host);window.mapRoot.render((R.default??R).createElement(StudyFeed,{initial:s,onExit:()=>{}}));
  return q;
 });
 await page.locator('.image-answer-options img').first().waitFor();await page.waitForFunction(()=>document.querySelectorAll('.image-answer-options img').length===4&&[...document.querySelectorAll('.image-answer-options button')].every(b=>!b.disabled));
 assert.equal(await page.locator('.feed-cue h1').innerText(),task.items[0].name);assert.equal(await page.locator('.feed-cue img').count(),0);assert.equal(await page.locator('.image-answer-options').innerText(),'');
 await page.setViewportSize({width:320,height:736});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=320));await page.waitForTimeout(400);await page.screenshot({path:'artifacts/main-image-choice-mobile.png'});
 await page.locator('.image-answer-options button').nth(task.options.findIndex(o=>o.id===task.items[0].answerId)).click();
 let submitted=false;for(let n=0;n<40&&!submitted;n++){await page.waitForTimeout(100);submitted=await page.evaluate(async id=>{const {db}=await import('/engi/src/db/engi-db.ts');const event=await db.reviewEvents.get(id);return event?.payload.feedback?.score===1;},task.id);}assert(submitted,'real map choice is submitted');assert.deepEqual(errors,[]);console.log('PASS state name, four loaded map pictures, no answer labels, 320px layout and real correct answer');
}finally{await browser.close();}
