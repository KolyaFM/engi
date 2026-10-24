// Manual real-pack regression, isolated browser/IndexedDB. No personal database.
// ENGI_RECALL_PACK is a local .engi archive; defaults to the supplied presidents pack.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const pack=process.env.ENGI_RECALL_PACK??'artifacts/presidents-usa-real-periods-v21-ordering.engi';
const archive=await readFile(pack),browser=await chromium.launch({headless:true,executablePath:process.env.ENGI_BROWSER_PATH});
const page=await browser.newPage({viewport:{width:393,height:852}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(process.env.ENGI_TEST_URL??'http://localhost:5173/engi/');await page.locator('.feed-home').waitFor();
 const report=await page.evaluate(async({bytes,trainerModule})=>{
  const root=new URL('./src/',location.href).href;
  const [{db},{prepareDeclarativePack,commitDeclarativeImport},{getBundle,learningRow},{canonicalTargets},{triagedMemory},{buildGoalCatalog},{admitAcquisition,emptyLifecycle},{trainerService},{startStudyTrace,studyTraceReport}]=await Promise.all(['db/engi-db.ts','services/declarative-pack.ts','db/repositories.ts','lib/engi/questions/recipe-factory.ts','lib/engi/learning/bootstrap.ts','services/goal-catalog.ts','lib/engi/study-core/acquisition.ts',trainerModule,'services/study-selection-trace.ts'].map(p=>import(root+p)));
  await commitDeclarativeImport(await prepareDeclarativePack(new Blob([new Uint8Array(bytes)]),db),{},db);
  const b=await getBundle(db),ids=b.entities.filter(e=>b.media.some(m=>m.entityId===e.id&&!m.archived)).slice(0,4).map(e=>e.id);
  if(ids.length!==4)throw Error('Expected at least four illustrated objects in the archive');
  await db.decks.put({id:'test-four',name:'Four real objects',learning:{imageRecognition:true}});await db.deckMembers.bulkPut(ids.map(entityId=>({deckId:'test-four',entityId})));
  const enabled=canonicalTargets(b).filter(i=>ids.includes(i.entityId)).map(i=>triagedMemory(i,'red','fixture',0));await db.learningState.bulkPut(enabled.map(learningRow));
  const catalog=buildGoalCatalog(b,enabled);let ledger=emptyLifecycle();for(const id of ids)ledger=admitAcquisition(ledger,id,catalog.filter(e=>e.entityIds.includes(id)).map(e=>e.goal),new Date());
  for(const u of ledger.units){u.stage='confirmation';u.successes=0;u.requiredSuccesses=1;u.rehearsedAt=new Date().toISOString();u.lastAttemptAt=u.rehearsedAt;u.availableAt=new Date(Date.now()+3600000).toISOString();}
  await db.appMeta.bulkPut([{key:'studyCore:learningLifecycle',value:ledger},{key:'introducedEntities',value:ids},{key:'studyPreferences',value:{newCardsPerDay:0}}]);
  startStudyTrace(db,1000);let s=await trainerService.startGoalFeed('all','mixed','daily',{endless:true,deckIds:['test-four']}),screens=[];
  for(let turn=0;turn<120;turn++){
   const q=s.tasks[s.currentPosition];if(!q||s.intro)throw Error('Expected a playable waiting-practice task');
   screens.push({id:q.id,format:q.recipe.format,reason:q.reason,intent:q.intent,objects:q.items.map(i=>i.entityId),goals:q.studyContract.primaryGoals.map(g=>g.id)});
   if(q.recipe.format==='recall_reveal')throw Error('Recall used as waiting filler at turn '+turn);
   const r=q.studyContract.response;await trainerService.observeVisibility(s.id,q.id,'question','q:'+q.id,'start');
   if(r.kind==='practice-view')s=await trainerService.advanceFeed(s.id,true,q.id);
   else{if(r.kind==='mapping'){for(const binding of r.bindings.filter(b=>!b.support))await trainerService.answerMatchPair({sessionId:s.id,taskId:q.id,entityId:binding.responseKey,answerId:binding.expected,requestId:crypto.randomUUID()});}else if('expected'in r)await trainerService.answer({sessionId:s.id,taskId:q.id,answer:r.expected});else throw Error('Unexpected response '+r.kind);s=await trainerService.advanceFeed(s.id,false,q.id);}
   if(turn%13===0)s=await trainerService.getResumableSession({endless:true});
   if(turn%29===0)s=await trainerService.startGoalFeed('all','mixed','daily',{endless:true,deckIds:['test-four']});
  }
  if(await db.appMeta.where('key').startsWith('studyCore:memory:').count())throw Error('Waiting practice raised memory');
  let explicit=await trainerService.startGoalFeed('all','recall_reveal','practice',{endless:true,deckIds:['test-four']});if(explicit.tasks[0]?.recipe.format!=='recall_reveal')throw Error('Explicit recall practice stopped working');
  const obsolete=explicit.tasks[0];await db.activeSessions.put({...explicit,mode:'daily',format:'mixed'});const resumed=await trainerService.getResumableSession({endless:true});if(resumed.tasks[0]?.recipe.format==='recall_reveal'||(await db.appMeta.get('studyCore:attempt:'+obsolete.id)).value.phase!=='skipped')throw Error('An obsolete queued filler survived reload');
  explicit=await trainerService.startGoalFeed('all','recall_reveal','practice',{endless:true,deckIds:['test-four']});
  const [R,C,{StudyFeed}]=await Promise.all([import('/engi/node_modules/.vite/deps/react.js'),import('/engi/node_modules/.vite/deps/react-dom_client.js'),import(root+'components/study/StudyFeed.tsx')]);const host=document.createElement('div');document.body.replaceChildren(host);window.testRoot=(C.default??C).createRoot(host);window.testRoot.render((R.default??R).createElement(StudyFeed,{initial:explicit,onExit:()=>{}}));
  return {screens,trace:studyTraceReport(db),explicitTaskId:explicit.tasks[0].id};
 },{bytes:[...archive],trainerModule:process.env.ENGI_RECALL_TRAINER_MODULE??'services/trainer-service.ts'});
 await page.locator('.study-feed.state-ready').waitFor();await page.locator('.recall-swipe').waitFor();
 // Use the real timer and real button, rather than calling its service callback.
 await page.getByRole('button',{name:'Вспомнил',exact:true}).waitFor({state:'visible',timeout:15000});
 await page.getByRole('button',{name:'Вспомнил',exact:true}).click();
 await page.waitForFunction(id=>document.querySelector('.feed-current')?.dataset.taskId!==id&&!!document.querySelector('.study-feed.state-ready'),report.explicitTaskId);
 // The ordinary home button must not silently resume a legacy recall-only mode.
 await page.evaluate(async()=>{window.testRoot.unmount();const {db}=await import('/engi/src/db/engi-db.ts'),{trainerService}=await import('/engi/src/services/trainer-service.ts');await trainerService.startGoalFeed('all','recall_reveal','practice',{endless:true,deckIds:['test-four']});await db.appMeta.put({key:'deckSelection',value:{ids:['test-four'],lastStudied:{}}});const [R,C,{default:App}]=await Promise.all([import('/engi/node_modules/.vite/deps/react.js'),import('/engi/node_modules/.vite/deps/react-dom_client.js'),import('/engi/src/App.tsx')]);const host=document.createElement('div');document.body.replaceChildren(host);window.testRoot=(C.default??C).createRoot(host);window.testRoot.render((R.default??R).createElement(App));});
 await page.getByRole('button',{name:'Начать обучение',exact:true}).click();await page.locator('.study-feed.state-ready').waitFor();
 const resumedFormat=await page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');return(await db.activeSessions.where('status').equals('active').toArray()).at(-1).format});assert.equal(resumedFormat,'mixed','ordinary start cannot inherit a hidden recall-only session');
 await page.getByRole('button',{name:'Выйти из практики',exact:true}).click();await page.getByRole('button',{name:'Начать обучение',exact:true}).waitFor();await page.evaluate(async()=>{const {trainerService}=await import('/engi/src/services/trainer-service.ts');await trainerService.startGoalFeed('all','mixed','practice',{endless:true,deckIds:['test-four']});});await page.getByRole('button',{name:'Начать обучение',exact:true}).click();await page.locator('.study-feed.state-ready').waitFor();const resumedMode=await page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');return(await db.activeSessions.where('status').equals('active').toArray()).at(-1).mode});assert.equal(resumedMode,'daily','ordinary start cannot stay in practice instead of learning');
 assert.equal(report.screens.length,120);assert.deepEqual(errors,[]);await mkdir('artifacts',{recursive:true});await writeFile('artifacts/recall-waiting-browser.json',JSON.stringify(report,null,2));
 console.log('PASS real pack: 120 correct waiting-practice screens, zero timed filler, resumes/new visits, no invented memory; explicit timer/button work, ordinary home start leaves old recall-only/practice modes');
}finally{await browser.close();}
