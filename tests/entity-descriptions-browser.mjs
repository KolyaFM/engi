import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:process.env.ENGI_BROWSER_PATH});
try{
 const context=await browser.newContext({viewport:{width:393,height:852}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(15000);
 await page.goto(process.env.ENGI_TEST_URL??'http://127.0.0.1:5173/engi/');await page.locator('.feed-home').waitFor();
 await page.evaluate(async()=>{
  const reactModule=await import('/engi/node_modules/.vite/deps/react.js'),domModule=await import('/engi/node_modules/.vite/deps/react-dom_client.js'),React=reactModule.default??reactModule,createRoot=domModule.createRoot??domModule.default.createRoot;
  const {db}=await import('/engi/src/db/engi-db.ts'),{getBundle}=await import('/engi/src/db/repositories.ts');
  const {prepareDeclarativePack,commitDeclarativeImport,planDeclarativeImport}=await import('/engi/src/services/declarative-pack.ts');
  const p=await prepareDeclarativePack(await(await fetch('/engi/artifacts/us-history-5.engi')).blob(),db);const plan=planDeclarativeImport(p);if(plan.issues.length)throw Error('Ambiguous test pack');await commitDeclarativeImport(p,{},db);
  const {trainerService}=await import('/engi/src/services/trainer-service.ts');
  const {StudyFeed}=await import('/engi/src/components/study/StudyFeed.tsx');
  document.querySelector('#root').style.display='none';const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
  window.descriptionTest={React,root,db,getBundle,trainerService,deckId:plan.deckId};
  window.mountFeed=async(format)=>{let s=await trainerService.startGoalFeed(plan.deckId,format,'daily',{endless:true});window.descriptionTest.sessionId=s.id;root.render(React.createElement(StudyFeed,{key:s.id,initial:s,onExit:()=>{}}));};
  window.learningState=async()=>({memories:await db.learningState.toArray(),core:(await db.appMeta.toArray()).filter(r=>r.key.startsWith('studyCore:memory:')||r.key==='studyCore:learningLifecycle'||r.key.includes('mistakeEpisodes')).sort((a,b)=>a.key.localeCompare(b.key)),attempts:(await db.appMeta.toArray()).filter(r=>r.key.startsWith('studyCore:attempt:')).map(r=>({id:r.key,ineligible:r.value.ineligibleGoalIds,hinted:r.value.hintedGoalIds})).sort((a,b)=>a.id.localeCompare(b.id))});
  await window.mountFeed('choice');
 });
 await page.locator('#object-intro-heading').waitFor();
 assert.equal(await page.locator('.learning22-summary').count(),0);
 const title=await page.locator('#object-intro-heading').textContent();
 const opener=page.getByRole('button',{name:`Описание: ${title}`,exact:true});
 const before=await page.evaluate(()=>window.learningState());await opener.click();
 await page.getByRole('dialog').waitFor();assert.equal(await page.getByRole('dialog').getByRole('heading').textContent(),title);
 assert((await page.locator('#entity-description-text').textContent()).length>400);
 assert.equal(await page.getByRole('dialog').locator('button').count(),1);
 const centered=await page.getByRole('button',{name:'Закрыть описание'}).evaluate(button=>{const a=button.getBoundingClientRect(),b=button.querySelector('svg').getBoundingClientRect();return Math.abs(a.x+a.width/2-b.x-b.width/2)<.5&&Math.abs(a.y+a.height/2-b.y-b.height/2)<.5;});assert(centered,'Close icon must be centered in its circle');
 await page.screenshot({path:'artifacts/history-description-mobile.png'});
 await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);
 assert.equal(await opener.evaluate(n=>n===document.activeElement),true);
 assert.deepEqual(await page.evaluate(()=>window.learningState()),before);
 // Follow the actual intro flow until the first multiple-choice task.
 for(let n=0;n<8;n++){
  if(await page.locator('.feed-option').count())break;
  await page.getByRole('button',{name:'Готово',exact:true}).click();
  await page.waitForFunction(()=>!!document.querySelector('.feed-option')||!!document.querySelector('#object-intro-heading')&&!document.querySelector('.learning22-action:disabled'));
 }
 await page.locator('.feed-option').first().waitFor();await page.locator('.feed-option:not(:disabled)').first().waitFor();
 const task=await page.evaluate(async()=>{const {db,sessionId}=window.descriptionTest,s=await db.activeSessions.get(sessionId);return s.tasks[s.currentPosition];});
 const cueTitle=await page.locator('.feed-cue h1').textContent(),question=await page.locator('.feed-actions h2').textContent();
 if(task.recipe.direction!=='reverse')assert(!question.includes(task.items[0].name),'Do not repeat the object name in the question');
 for(const width of [320,393,1365]){
  await page.setViewportSize({width,height:852});
  const layout=await page.locator('.feed-cue').evaluate(node=>{const a=node.querySelector('h1').getBoundingClientRect(),b=node.querySelector('.entity-description-button').getBoundingClientRect();return {gap:b.left-a.right,within:b.right<=node.getBoundingClientRect().right};});assert(layout.gap>=15&&layout.within,'Info button must have its own space: '+JSON.stringify(layout));
 }
 await page.setViewportSize({width:393,height:852});await page.screenshot({path:'artifacts/history-question-spacing.png'});
 const eligibleBefore=await page.evaluate(()=>window.learningState());await page.locator('.feed-cue .entity-description-button').click();
 await page.waitForTimeout(3200);await page.getByRole('button',{name:'Закрыть описание'}).click();
 assert.deepEqual(await page.evaluate(()=>window.learningState()),eligibleBefore);
 await page.locator('.feed-option').filter({hasText:task.items[0].answer}).click();
 await page.waitForFunction(async id=>{const {db}=window.descriptionTest;return !!await db.reviewEvents.get(id);},task.id);
 const outcome=await page.evaluate(async id=>{const {db}=window.descriptionTest;return (await db.appMeta.get('studyCore:attempt:'+id))?.value;},task.id);
 assert(outcome.results.some(r=>r.correct&&(r.credit||r.acquisitionCredit)),JSON.stringify(outcome));assert.equal(outcome.hintedGoalIds?.length??0,0);
 const latency=await page.evaluate(async id=>{const {db}=window.descriptionTest;return (await db.reviewEvents.get(id)).payload.metadata.firstAttemptLatencyMs;},task.id);assert(latency<3000,'Reading time must not increase answer latency: '+latency);
 // Mount group mechanics with real imported items; info must not select, flip or drag.
 await page.evaluate(async()=>{
  const {React,root,getBundle,db}=window.descriptionTest,b=await getBundle(db);
  const {recipes,eligible}=await import('/engi/src/lib/engi/questions/recipe-factory.ts');
  const {EntityDescriptionProvider}=await import('/engi/src/components/study/EntityDescription.tsx');
  const {MatchingPairsCard}=await import('/engi/src/components/study/MatchingPairsCard.tsx');
  const {SortChallengeCard}=await import('/engi/src/components/study/SortChallengeCard.tsx');
  const {SelfCheckCard}=await import('/engi/src/components/study/SelfCheckCard.tsx');
  const {ConveyorCard}=await import('/engi/src/components/study/ConveyorCard.tsx');
  window.groupEvents=[];
  window.mountGroup=kind=>{
   const recipe=recipes(b).find(r=>r.tag===window.descriptionTest.deckId&&r.format===(kind==='sort'?'sort':'match'));
   const items=eligible(b,recipe).slice(0,kind==='sort'?5:4),task={id:'group-'+kind,recipe,items,options:items.map(i=>({id:i.answerId,name:i.answer})),answerSet:items.map(i=>i.answerId),level:'direct'};
   const noop=()=>{},track=event=>()=>{window.groupEvents.push(event);return Promise.resolve();};
   const props={task,busy:false,feedback:null,onPersist:track('persist'),onSubmit:track('submit'),onNext:track('next'),onMediaReady:noop,onMediaFail:noop,onPair:track('pair'),onComplete:track('complete'),onReveal:track('reveal')};
   root.render(React.createElement(EntityDescriptionProvider,{key:kind},React.createElement(kind==='sort'?SortChallengeCard:kind==='self_check'?SelfCheckCard:kind==='conveyor'?ConveyorCard:MatchingPairsCard,props)));
  };
  window.mountGroup('sort');
 });
 for(const kind of ['sort','match','self_check','conveyor']){
  console.log('Checking',kind);
  await page.evaluate(k=>window.mountGroup(k),kind);await page.locator(({sort:'.chronology-card',match:'.matching-pairs',self_check:'.self-check-card',conveyor:'.feed-conveyor'})[kind]).waitFor();await page.locator('.entity-description-button').first().waitFor();
  const order=await page.locator('[data-item]').evaluateAll(nodes=>nodes.map(n=>n.dataset.item));
  await page.locator('.entity-description-button').first().click();await page.getByRole('dialog').waitFor().catch(async e=>{await page.screenshot({path:'artifacts/history-description-failure.png'});console.log(await page.locator('body').innerText(),errors);throw e;});await page.getByRole('button',{name:'Закрыть описание'}).click();
  assert.deepEqual(await page.evaluate(()=>window.groupEvents),[]);
  assert.deepEqual(await page.locator('[data-item]').evaluateAll(nodes=>nodes.map(n=>n.dataset.item)),order);
  assert.equal(await page.locator('.matching-tile.selected,.self-check-tile.is-flipped,.sort-drag-overlay').count(),0);
  if(kind==='sort')await page.screenshot({path:'artifacts/history-chronology-info.png'});
  for(const viewport of [{width:320,height:736},{width:1365,height:900}]){await page.setViewportSize(viewport);await page.locator('.entity-description-button').first().click();await page.getByRole('dialog').waitFor();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.getByRole('button',{name:'Закрыть описание'}).click();}
  await page.setViewportSize({width:393,height:852});
 }
 // Recall timer stays paused and resumes with its state intact.
 await page.evaluate(async()=>{await window.mountFeed('recall_reveal');});
 for(let n=0;n<8;n++){
  if(await page.locator('.recall-time-track').count())break;
  if(await page.locator('#object-intro-heading').count())await page.getByRole('button',{name:'Готово',exact:true}).click();
  await page.waitForTimeout(200);
 }
 await page.locator('.recall-time-track').waitFor();await page.locator('.feed-cue .entity-description-button').click();
 await page.waitForTimeout(5200);assert.equal(await page.locator('.revealed-answer').count(),0);
 await page.getByRole('button',{name:'Закрыть описание'}).click();assert.equal(await page.locator('.recall-time-track').count(),1);
 await page.locator('.revealed-answer').waitFor();
 assert.deepEqual(errors,[]);await context.close();console.log('Descriptions: archive import, intro, credited choice, four group formats, focus and paused recall passed.');
}finally{await browser.close();}
