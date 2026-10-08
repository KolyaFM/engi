import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,executablePath:process.env.ENGI_BROWSER_PATH||undefined});
const context=await browser.newContext({viewport:{width:393,height:852},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
page.setDefaultTimeout(16000);page.on('pageerror',e=>errors.push(e.message));
const url=process.env.ENGI_TEST_URL??'http://127.0.0.1:5174/engi/';
async function current(){return page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');return (await db.activeSessions.where('status').equals('active').toArray()).at(-1);});}
try{
 await page.goto(url);await page.locator('.feed-home').waitFor();
 await page.evaluate(async()=>{
  const {saveKnowledge}=await import('/engi/src/services/knowledge-service.ts'),{resetLearningProgress}=await import('/engi/src/services/learning-service.ts'),{db}=await import('/engi/src/db/engi-db.ts');
  const b={entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[],entityTypes:[{id:'s',name:'Объект'},{id:'a',name:'Ответ'}],properties:['author','country'].map(id=>({id,name:id,valueKind:'entity',cardinality:'one',learnable:true,subjectTypes:['s'],targetTypes:['a']}))};
  for(let n=0;n<6;n++){b.entities.push({id:'s'+n,name:'Объект '+n,type:'s',aliases:[],externalIds:{}},{id:'a'+n,name:'Ответ '+n,type:'a',aliases:[],externalIds:{}});for(const key of ['author','country'])b.facts.push({id:key+n,entityId:'s'+n,key,valueKind:'entity',valueEntityId:'a'+n,verification:'user_confirmed',source:{kind:'manual',name:'Test'}});}
  await saveKnowledge(b);await resetLearningProgress();await db.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:1}});
 });
 await page.reload();await page.locator('.feed-home').waitFor();await page.getByLabel('Формат',{exact:true}).selectOption('choice');await page.getByRole('button',{name:'Начать',exact:true}).click();
 while(await page.locator('.feed-current').count()===0){const old=await page.locator('#object-intro-heading').textContent();await page.getByRole('button',{name:'Готово',exact:true}).click();await page.waitForFunction(name=>document.querySelector('.feed-current')||document.querySelector('#object-intro-heading')?.textContent!==name&&!document.querySelector('.learning22-primary')?.disabled,old);}
 await page.locator('.study-feed.state-ready').waitFor();let session=await current(),first=session.tasks[0];assert.equal(first.intent,'learn');assert.equal(first.readyAt,undefined);
 assert.equal(await page.locator('.day-plan-inline strong').count(),3);assert.equal(await page.locator('.day-plan-inline .new').count(),0);
 assert.equal(await page.locator('.day-plan-inline .repeat').evaluate(el=>getComputedStyle(el).color),'rgb(36, 116, 79)');
 const firstOption=first.options.find(o=>o.id===first.items[0].answerId).name;
 let button=page.getByRole('button',{name:firstOption,exact:true});await button.waitFor();assert.equal(await button.isEnabled(),true);assert.equal(await page.locator('.feed-learning-pause').count(),0);await button.click();
 console.log('PASS first question is immediately playable without a pause or stop screen');
 await page.waitForFunction(async old=>{const {db}=await import('/engi/src/db/engi-db.ts');return (await db.activeSessions.where('status').equals('active').toArray()).at(-1)?.tasks[0]?.id!==old;},first.id);
 let drained=false;
 for(let n=0;n<18;n++){
  await page.locator('.study-feed.state-ready, .learning22-card-sheet').first().waitFor();session=await current();
  if(session.intro){await page.getByRole('button',{name:'Готово',exact:true}).click();continue;}
  const task=session.tasks[0];assert(task);button=page.getByRole('button',{name:task.options.find(o=>o.id===task.items[0].answerId).name,exact:true});await button.click();
  drained=await page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');const l=(await db.appMeta.get('studyCore:learningLifecycle')).value;return l.units.some(u=>u.stage==='completed');});
  if(drained)break;
  await page.waitForFunction(async old=>{const {db}=await import('/engi/src/db/engi-db.ts');return (await db.activeSessions.where('status').equals('active').toArray()).at(-1)?.tasks[0]?.id!==old;},task.id);
 }
 assert.equal(drained,false,'fast answers cannot graduate confirmations before five minutes');
 // Advance only isolated test data deadlines; no five-minute sleep or personal data.
 await page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');const row=await db.appMeta.get('studyCore:learningLifecycle');for(const u of row.value.units)if(u.stage==='confirmation'){u.lastAttemptAt=new Date(Date.now()-301000).toISOString();u.availableAt=new Date(Date.now()-1000).toISOString();}await db.appMeta.put(row);for(const ex of await db.appMeta.where('key').startsWith('studyCore:exposure:').toArray())await db.appMeta.put({...ex,value:{...ex.value,lastVisibleAt:new Date(Date.now()-301000).toISOString()}});});
 for(let n=0;n<12&&!drained;n++){
  await page.locator('.study-feed.state-ready, .learning22-card-sheet').first().waitFor();session=await current();
  if(session.intro){await page.getByRole('button',{name:'Готово',exact:true}).click();continue;}
  const task=session.tasks[0];button=page.getByRole('button',{name:task.options.find(o=>o.id===task.items[0].answerId).name,exact:true});await button.click();
  drained=await page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');return (await db.appMeta.get('studyCore:learningLifecycle')).value.units.some(u=>u.stage==='completed');});
  if(!drained)await page.waitForFunction(async old=>{const {db}=await import('/engi/src/db/engi-db.ts');return (await db.activeSessions.where('status').equals('active').toArray()).at(-1)?.tasks[0]?.id!==old;},task.id);
 }
 assert(drained);assert.equal(await page.locator('.learning22-stop').count(),0);assert.deepEqual(errors,[]);
 await page.screenshot({path:'artifacts/learning-lifecycle-mobile.png',fullPage:true});console.log('PASS immediate answers preserve learning; elapsed confirmations complete properties');
 await page.setViewportSize({width:320,height:740});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);console.log('PASS 320px layout');
 await page.evaluate(async()=>{const {resetLearningProgress}=await import('/engi/src/services/learning-service.ts');await resetLearningProgress();});await page.reload();
 await page.getByLabel('Формат',{exact:true}).selectOption('recall_reveal');await page.getByRole('button',{name:'Начать',exact:true}).click();
 while(await page.locator('.feed-current').count()===0){const old=await page.locator('#object-intro-heading').textContent();await page.getByRole('button',{name:'Готово',exact:true}).click();await page.waitForFunction(name=>document.querySelector('.feed-current')||document.querySelector('#object-intro-heading')?.textContent!==name&&!document.querySelector('.learning22-primary')?.disabled,old);}
 assert.equal(await page.locator('.feed-learning-pause').count(),0);
 await page.getByRole('progressbar',{name:'Время вспомнить'}).waitFor();assert(Number(await page.getByRole('progressbar',{name:'Время вспомнить'}).getAttribute('aria-valuenow'))>=4);assert.equal(await page.locator('.revealed-answer').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS recall thinking starts immediately with the answer hidden');
}finally{await context.close();await browser.close();}
