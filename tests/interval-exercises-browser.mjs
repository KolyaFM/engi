import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';import {chromium,webkit} from 'playwright';
await mkdir('artifacts/interval-browser',{recursive:true});
for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true}),context=await browser.newContext({viewport:{width:393,height:852},hasTouch:true,isMobile:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{await page.goto(process.env.ENGI_TEST_URL??'http://127.0.0.1:5173/engi/');await page.locator('.feed-home').waitFor();
 // Exercise the actual persistence/service/StudyFeed path, not only a component fixture.
 await page.goto(process.env.ENGI_TEST_URL??'http://127.0.0.1:5173/engi/');await page.locator('.feed-home').waitFor();
 await page.evaluate(async()=>{
  const {db}=await import('/engi/src/db/engi-db.ts'),{putBundle}=await import('/engi/src/db/repositories.ts'),{canonicalTargets}=await import('/engi/src/lib/engi/questions/recipe-factory.ts'),{triagedMemory}=await import('/engi/src/lib/engi/learning/bootstrap.ts'),{learningRow}=await import('/engi/src/db/repositories.ts');
  const {associationGoal}=await import('/engi/src/lib/engi/study-core/compiler.ts'),{emptyLifecycle,admitAcquisition}=await import('/engi/src/lib/engi/study-core/acquisition.ts'),{createTrainerService}=await import('/engi/src/services/trainer-service.ts');
  const b={entities:[0,1,2,3].map(n=>({id:'event'+n,type:'event',name:'Событие '+n,aliases:[],externalIds:{}})),facts:[0,1,2,3].map(n=>({id:'fact'+n,entityId:'event'+n,key:'period',valueKind:'date',dateStart:(1900+n*20)+'-01-01',dateEnd:(1905+n*20)+'-12-31',datePrecision:'range',source:{kind:'manual',name:'test'},verification:'verified'})),properties:[{id:'period',name:'Период',valueKind:'date',cardinality:'one',learnable:true}],media:[],tags:[],entityTags:[],missing:[],unresolved:[]};
  await putBundle(db,b);const enabled=canonicalTargets(b).map(i=>triagedMemory(i,'red','s',0));await db.learningState.bulkPut(enabled.map(learningRow));let ledger=emptyLifecycle();for(const f of b.facts)ledger=admitAcquisition(ledger,f.entityId,[associationGoal(b,f,'recognition')],new Date());await db.appMeta.put({key:'studyCore:learningLifecycle',value:ledger});await db.appMeta.put({key:'introducedEntities',value:b.entities.map(e=>e.id)});
  const svc=createTrainerService(db);let session=await svc.startGoalFeed('all','mixed','daily',{endless:true});
  // The weighted feed need not start with an endpoint. Reach it through the real
  // selector before checking this screen's UI; no hardcoded forced-format cycle.
  for(let n=0;n<30&&session.tasks[0]?.intervalExercise?.kind!=='endpoint';n++){
   const task=session.tasks[0],r=task.studyContract.response;if(task.recipe.format==='self_check'){session=await svc.advanceFeed(session.id,true,task.id);continue;}
   if(r.kind==='self-report'){await svc.saveInteraction(session.id,task.id,{revealed:true,recallElapsedMs:5000});await svc.answer({sessionId:session.id,taskId:task.id,answer:true});}
   else await svc.answer({sessionId:session.id,taskId:task.id,answer:r.kind==='mapping'?Object.fromEntries(r.bindings.filter(b=>!b.support).map(b=>[b.responseKey,b.expected])):r.expected});
   session=await svc.advanceFeed(session.id,false,task.id);
  }
  if(session.tasks[0]?.intervalExercise?.kind!=='endpoint')throw Error('endpoint was never selected in 30 opportunities');window.actualIntervalSession=session;
  const R=await import('/engi/node_modules/.vite/deps/react.js'),C=await import('/engi/node_modules/.vite/deps/react-dom_client.js'),React=R.default??R,{createRoot}=C.default??C,{StudyFeed}=await import('/engi/src/components/study/StudyFeed.tsx');document.querySelector('#root').style.display='none';const host=document.createElement('div');document.body.append(host);window.actualRoot=createRoot(host);window.actualRoot.render(React.createElement(StudyFeed,{initial:session,onExit:()=>{}}));
  window.actualBandSetup=async()=>{const {goalProposalPool}=await import('/engi/src/services/goal-proposals.ts'),{buildIntervalGroup}=await import('/engi/src/services/interval-group-composition.ts'),{prepareStudyTask}=await import('/engi/src/services/study-core-bridge.ts');const task=buildIntervalGroup(b,goalProposalPool(b,enabled,'all','choice').proposals,[],[],288);await prepareStudyTask(db,b,task);const next={...session,tasks:[task],intro:undefined,interaction:undefined};await db.activeSessions.put(next);window.actualIntervalSession=next;window.actualRoot.render(React.createElement(StudyFeed,{key:task.id,initial:next,onExit:()=>{}}));};
 });
 await page.locator('.study-feed.state-ready .interval-endpoint').waitFor();const expected=await page.evaluate(()=>window.actualIntervalSession.tasks[0].items[0].answerId);await page.locator('.feed-option').filter({hasText:expected}).click();
 await page.waitForFunction(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');return !!(await db.reviewEvents.get(window.actualIntervalSession.tasks[0].id));});
 await page.evaluate(()=>window.actualBandSetup());await page.locator('.study-feed.state-ready .interval-bands').waitFor();
 const pairs=await page.evaluate(()=>window.actualIntervalSession.tasks[0].items.map(i=>({name:i.name,label:i.interval.propertyLabel})));
 await page.getByRole('button',{name:pairs[1].name+' — '+pairs[1].label,exact:true}).click();await page.locator('.interval-answer.is-wrong').waitFor();assert.equal(await page.locator('.interval-status').innerText(),'','wrong answers use button feedback without a retry message');assert.equal(await page.locator('.interval-found-row').count(),0,'a wrong answer must retain the active question');
 for(const pair of pairs){await page.getByRole('button',{name:pair.name+' — '+pair.label,exact:true}).click();await page.waitForTimeout(100);}
 await page.waitForFunction(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');return !!(await db.reviewEvents.get(window.actualIntervalSession.tasks[0].id));});await page.getByRole('button',{name:'Продолжить',exact:true}).waitFor();await page.waitForTimeout(1100);assert.equal(await page.locator('.interval-found-row').count(),pairs.length);
 await page.screenshot({path:`artifacts/interval-browser/${engine.name()}-actual.png`});
 await page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');const saved=await db.activeSessions.get(window.actualIntervalSession.id);const {StudyFeed}=await import('/engi/src/components/study/StudyFeed.tsx'),R=await import('/engi/node_modules/.vite/deps/react.js'),React=R.default??R;window.actualRoot.render(React.createElement(StudyFeed,{key:'restored',initial:saved,onExit:()=>{}}));});
 await page.locator('.study-feed.state-feedback .interval-bands').waitFor();await page.waitForTimeout(600);assert.equal(await page.locator('.interval-found-row').count(),pairs.length);assert(!(await page.getByRole('button',{name:'Продолжить',exact:true}).isDisabled()));
 assert.deepEqual(errors,[]);console.log('PASS '+engine.name()+': real StudyFeed endpoint and guided bands, persisted answers, restored completion waits for Continue');
 }finally{await context.close();await browser.close();}
}
