import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,executablePath:process.env.ENGI_BROWSER_PATH||undefined});
const url=process.env.ENGI_TEST_URL??'http://127.0.0.1:5173/engi/';
async function seed(page){
 await page.goto(url);await page.locator('.feed-home').waitFor();
 await page.evaluate(async()=>{
  const {saveKnowledge}=await import('/engi/src/services/knowledge-service.ts'),{db}=await import('/engi/src/db/engi-db.ts');
  const b={entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[],entityTypes:[{id:'subject',name:'Объект'},{id:'answer',name:'Ответ'}],properties:[{id:'rel',name:'Автор',valueKind:'entity',cardinality:'one',learnable:true,subjectTypes:['subject'],targetTypes:['answer']}]};
  for(let n=0;n<8;n++){b.entities.push({id:'s'+n,type:'subject',name:'Объект '+n,aliases:[],externalIds:{}},{id:'a'+n,type:'answer',name:'Автор '+n,aliases:[],externalIds:{}});b.facts.push({id:'f'+n,entityId:'s'+n,key:'rel',valueKind:'entity',valueEntityId:'a'+n,verification:'user_confirmed',source:{kind:'manual',name:'Личное знание'}});}
  await saveKnowledge(b);
  const {canonicalTargets}=await import('/engi/src/lib/engi/questions/recipe-factory.ts'),{triagedMemory}=await import('/engi/src/lib/engi/learning/bootstrap.ts'),{learningRow}=await import('/engi/src/db/repositories.ts');
  for(const item of canonicalTargets(b)){const m=triagedMemory(item,'red','',0);m.card.due=new Date('2099-01-01');await db.learningState.put(learningRow(m));}
 });await page.reload();await page.locator('.feed-home').waitFor();
}
async function start(page){await page.getByLabel('Формат',{exact:true}).selectOption('choice');await page.getByRole('button',{name:'Начать',exact:true}).click();}
async function current(page){return page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');const s=(await db.activeSessions.where('status').equals('active').toArray()).at(-1);return {s,t:s.tasks[0]};});}
async function check(name,run){const context=await browser.newContext({viewport:{width:393,height:852}}),page=await context.newPage();page.setDefaultTimeout(6000);try{await seed(page);await run(page);console.log('PASS '+name);}finally{await context.close();}}
try{
 await check('main button uses goals; wrong answer survives reload and correction updates only once',async page=>{
  await start(page);await page.locator('.study-feed.state-ready').waitFor();const {s,t}=await current(page);assert.equal(s.memoryModel,'goals');
  const wrong=t.options.find(o=>o.id!==t.items[0].answerId);await page.getByRole('button',{name:wrong.name,exact:true}).click();
  await page.waitForFunction(async id=>{const {db}=await import('/engi/src/db/engi-db.ts');return !!await db.appMeta.get('studyCore:reviewReceipt:'+id);},t.id);
  await page.reload();await page.getByRole('button',{name:'Продолжить с прошлого места',exact:true}).click();await page.locator('.study-feed.state-ready').waitFor();
  assert(await page.locator('.answer-wrong').isDisabled());assert((await page.locator('.answer-wrong').textContent()).includes(wrong.name));
  await page.getByRole('button',{name:t.options.find(o=>o.id===t.items[0].answerId).name,exact:true}).click();
  await page.waitForFunction(async id=>{const {db}=await import('/engi/src/db/engi-db.ts');return !!await db.reviewEvents.get(id);},t.id);
  const data=await page.evaluate(async goalId=>{const {db}=await import('/engi/src/db/engi-db.ts');return {m:(await db.appMeta.get('studyCore:memory:'+goalId)).value,old:await db.learningState.toArray()};},t.studyContract.primaryGoals[0].id);
  assert.equal(data.m.independentAttempts,1);assert.equal(data.m.card.reps,1);assert(data.old.every(r=>r.payload.attempts===0));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 });
 await check('waiting screen resumes without buying extra new-object budget',async page=>{
  await page.evaluate(async()=>{
   const {trainerService}=await import('/engi/src/services/trainer-service.ts'),{db}=await import('/engi/src/db/engi-db.ts');
   const snapshot=await trainerService.getGoalSnapshot(),due=new Date(Date.now()+4000);
   for(const e of snapshot.goalCatalog.filter(e=>e.goal.skill==='recognition'))await db.appMeta.put({key:'studyCore:memory:'+e.goal.id,value:{goalId:e.goal.id,goal:e.goal,card:{due,stability:10,difficulty:5,elapsed_days:0,scheduled_days:0,reps:1,lapses:0,state:2,learning_steps:0,last_review:new Date()},independentAttempts:1,independentSuccesses:1}});
  });
  await start(page);await page.getByRole('heading',{name:'Следующая проверка после паузы',exact:true}).waitFor();
  const button=page.getByRole('button',{name:'Продолжить повторение',exact:true});await page.waitForFunction(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent==='Продолжить повторение');return b&&!b.disabled;});
  await button.click();await page.locator('.study-feed.state-ready').waitFor();assert.equal((await current(page)).s.completedCount,0);
  assert.equal(await page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');return !!await db.appMeta.get('newLearning');}),false);
 });
}finally{await browser.close();}
