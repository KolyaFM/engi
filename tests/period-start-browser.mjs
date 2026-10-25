import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
const pkg=JSON.parse(await readFile('examples/period-starts/bundle.json','utf8'));
const browser=await chromium.launch({headless:true,executablePath:process.env.ENGI_BROWSER_PATH}),errors=[];
await mkdir('artifacts/period-start',{recursive:true});
try{
 for(const viewport of [{width:393,height:852},{width:1440,height:900}]){
  const context=await browser.newContext({viewport}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.ENGI_TEST_URL??'http://127.0.0.1:5183/engi/');await page.locator('.feed-home').waitFor();
  await page.evaluate(async pkg=>{
   const {parseV3}=await import('/engi/src/lib/engi/import/schema-v3.ts'),{buildImportPlan}=await import('/engi/src/lib/engi/import/semantic-merge.ts'),{db}=await import('/engi/src/db/engi-db.ts'),{putBundle}=await import('/engi/src/db/repositories.ts'),{createTrainerService}=await import('/engi/src/services/trainer-service.ts');
   const b=buildImportPlan(parseV3(pkg),{entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[]},{},'period-browser').bundle;
   await putBundle(db,b);window.periodBundle=b;const svc=createTrainerService(db);let s=await svc.startGoalFeed('all','choice','daily',{endless:true});
   // If the random first object is a point event, accept it and get a ranged object.
   if(!s.intro.unitIds.some(id=>id.endsWith(':start:forward')))s=await svc.completeIntro(s.id,{entityId:s.intro.entityId,selections:s.intro.selections});
   window.periodSession=s;window.periodService=svc;
   await import('/engi/src/components/study/study-feed.css');const R=await import('/engi/node_modules/.vite/deps/react.js'),C=await import('/engi/node_modules/.vite/deps/react-dom_client.js');window.React=R.default??R;
   const host=document.createElement('div');document.body.replaceChildren(host);window.periodRoot=(C.default??C).createRoot(host);
   const {ObjectIntroCard}=await import('/engi/src/components/study/ObjectIntroCard.tsx');
   window.periodRoot.render(window.React.createElement(ObjectIntroCard,{intro:s.intro,bundle:b,onChoose:(id,color)=>svc.saveIntroSelection(s.id,id,color),onDone:async selections=>{window.afterIntro=await svc.completeIntro(s.id,{entityId:s.intro.entityId,selections});},onExit:()=>{}}));
  },pkg);
  await page.locator('.learning22-properties').waitFor();assert.equal(await page.locator('.learning22-property').count(),1,'source range appears once');
  await page.waitForFunction(()=>/\d{4}–\d{4}/.test(document.querySelector('.learning22-value')?.textContent??''));assert.match(await page.locator('.learning22-value').textContent(),/\d{4}–\d{4}/);assert.equal(await page.locator('.learning22-prop-label').filter({hasText:/Начало/}).count(),0);
  await page.getByRole('button',{name:/: Знаю$/}).click();await page.getByRole('button',{name:'Готово',exact:true}).click();await page.waitForFunction(()=>!!window.afterIntro);
  const states=await page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');return Promise.all(window.periodSession.intro.unitIds.map(async id=>(await db.learningState.get(id)).payload.status));});assert(states.every(s=>s==='suspended'));
  for(const image of [false,true]){
   await page.evaluate(async image=>{
    const {canonicalTargets}=await import('/engi/src/lib/engi/questions/recipe-factory.ts'),{composeUnit}=await import('/engi/src/lib/engi/session/composer.ts'),{triagedMemory}=await import('/engi/src/lib/engi/learning/bootstrap.ts'),{compileTaskContract}=await import('/engi/src/lib/engi/study-core/compiler.ts'),{buildLearningChronology}=await import('/engi/src/services/learning-chronology.ts'),{SortChallengeCard}=await import('/engi/src/components/study/SortChallengeCard.tsx');
    const b=window.periodBundle,proposals=canonicalTargets(b).filter(i=>i.dateEdge||b.facts.find(f=>f.id===i.factId)?.datePrecision==='year').map(i=>{const q=composeUnit(b,triagedMemory(i,'red','',0),'all','choice');return {recipe:q.recipe,items:q.items,goals:compileTaskContract(b,q).primaryGoals};});
    const task=buildLearningChronology(b,proposals,[],[],0);window.periodTask=task;window.periodContract=compileTaskContract(b,task);
    if(image){task.recipe.cue='image';task.items=task.items.map((i,n)=>({...i,image:'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="240"><rect width="160" height="240" fill="${n%2?'#bcadc9':'#acc8bb'}"/></svg>`)}));}
    const R=window.React,root=window.periodRoot;
    function Screen({feedback}){return R.createElement('main',{className:'study-feed'},R.createElement('header',{className:'feed-header'},'Хронология'),R.createElement('div',{className:'feed-viewport has-chronology'},R.createElement('div',{className:'feed-current'},R.createElement('div',{className:'feed-task-content'},R.createElement('div',{className:'feed-question'},R.createElement('div',{className:'feed-actions'},R.createElement('div',{className:'sort-heading'},R.createElement('h2',null,'Хронология')),R.createElement(SortChallengeCard,{key:task.id,task,busy:false,feedback,onPersist:()=>{},onSubmit:order=>{window.orderAnswer=order;root.render(R.createElement(Screen,{feedback:{score:1,chosen:order}}));},onNext:()=>{}})))))));}
    root.render(R.createElement(Screen,{}));
   },image);
   await page.locator('.chronology-card').waitFor();assert.equal(await page.locator('.sort-date-label').count(),5);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   const expected=await page.evaluate(()=>window.periodContract.response.expected);
   for(let index=0;index<expected.length;index++){
    const ids=await page.locator('[data-item]').evaluateAll(rows=>rows.map(r=>r.dataset.item));
    for(let n=ids.indexOf(expected[index]);n>index;n--)await page.locator(`[data-item="${expected[index]}"]`).press(viewport.width>viewport.height?'ArrowRight':'ArrowUp');
   }
   assert.deepEqual(await page.locator('[data-item]').evaluateAll(rows=>rows.map(r=>r.dataset.item)),expected,'keyboard reaches correct order');await page.getByRole('button',{name:'Проверить',exact:true}).click();await page.getByText('Всё верно',{exact:true}).waitFor();
   assert.equal(await page.locator('.sort-year').filter({hasText:/\d{4}/}).count(),5);
   assert(await page.locator('.sort-date-label').evaluateAll(nodes=>nodes.every(e=>{const r=e.getBoundingClientRect(),p=e.closest('.sort-row').getBoundingClientRect();return r.top>=p.top&&r.bottom<=p.bottom&&r.width<=p.width;})),'labels fit within cards');
   await page.screenshot({path:`artifacts/period-start/${viewport.width}-${image?'images':'text'}.png`});
  }
  await context.close();
 }
 assert.deepEqual(errors,[]);console.log('PASS period intro deduplication, familiar selection, 5 mixed starts/dates, ordering and year reveal; mobile/desktop text/images');
}finally{await browser.close();}
