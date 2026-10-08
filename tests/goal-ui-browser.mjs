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
 await check('first new object is automatically tested after a ten-second intro pause',async page=>{
  await page.evaluate(async()=>{const {resetLearningProgress}=await import('/engi/src/services/learning-service.ts'),{db}=await import('/engi/src/db/engi-db.ts');await resetLearningProgress();await db.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:1}});});
  await page.reload();await page.locator('.feed-home').waitFor();await start(page);await page.getByRole('button',{name:'Готово',exact:true}).waitFor();
  const before=Date.now(),first=(await current(page)).s;await page.getByRole('button',{name:'Готово',exact:true}).click();await page.locator('.learning22-stop').waitFor();
  await page.getByRole('button',{name:'Добавить новых карточек: 1',exact:true}).waitFor();
  await page.locator('.study-feed.state-ready').waitFor({timeout:15000});const {t}=await current(page);assert.equal(t.items[0].entityId,first.intro.entityId);assert(Date.now()-before<15000);
  assert.equal(await page.getByText('Exposure episode is immutable',{exact:true}).count(),0);
 });
 await check('extra new-card button displays and adds the configured daily batch',async page=>{
  await page.evaluate(async()=>{
   const {trainerService}=await import('/engi/src/services/trainer-service.ts'),{db}=await import('/engi/src/db/engi-db.ts');
   await db.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:10}});
   for(const e of (await trainerService.getGoalSnapshot()).goalCatalog.filter(e=>e.goal.skill==='recognition'))await db.appMeta.put({key:'studyCore:memory:'+e.goal.id,value:{goalId:e.goal.id,goal:e.goal,lastCorrect:true,card:{due:new Date('2099-01-01'),stability:10,difficulty:5,elapsed_days:0,scheduled_days:0,reps:1,lapses:0,state:2,learning_steps:0,last_review:new Date()},independentAttempts:1,independentSuccesses:1}});
  });
  await page.reload();await page.locator('.feed-home').waitFor();await start(page);await page.locator('.learning22-stop').waitFor();
  await page.getByRole('button',{name:'Добавить новых карточек: 10',exact:true}).click();
  await page.waitForFunction(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');return (await db.appMeta.get('newLearning'))?.value.extraBudget===10;});
  assert.equal(await page.evaluate(async()=>{const {trainerService}=await import('/engi/src/services/trainer-service.ts');return (await trainerService.getDayPlan()).newBudget;}),20);
 });
 await check('reset then Done survives a delayed intro heartbeat without changing its owner',async page=>{
  await page.evaluate(async()=>{
   const {resetLearningProgress}=await import('/engi/src/services/learning-service.ts');await resetLearningProgress();
  });
  await start(page);await page.getByRole('button',{name:'Готово',exact:true}).waitFor();
  const first=(await current(page)).s;assert(first.intro);
  await page.waitForFunction(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');return (await db.appMeta.where('key').startsWith('studyCore:episode:').count())>0;});
  const opened=await page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');return (await db.appMeta.where('key').startsWith('studyCore:episode:').toArray())[0].value;});
  await page.getByRole('button',{name:'Готово',exact:true}).click();
  await page.waitForFunction(async old=>{const {db}=await import('/engi/src/db/engi-db.ts');const s=(await db.activeSessions.where('status').equals('active').toArray()).at(-1);return s?.intro&&s.intro.entityId!==old;},first.intro.entityId);
  await page.waitForFunction(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');const episodes=await db.appMeta.where('key').startsWith('studyCore:episode:').toArray();return episodes.some(r=>r.value.endedAt)&&episodes.some(r=>!r.value.endedAt);});
  const late=await page.evaluate(async({sid,episode})=>{const {trainerService}=await import('/engi/src/services/trainer-service.ts');return trainerService.observeIntroVisibility(sid,episode,'refresh');},{sid:first.id,episode:opened.id});assert.equal(late.attemptId,opened.attemptId);
  assert.equal(await page.getByText('Exposure episode is immutable',{exact:true}).count(),0);
  assert(await page.getByRole('button',{name:'Готово',exact:true}).isEnabled());
  await page.getByRole('button',{name:'Готово',exact:true}).click();
  assert.equal(await page.getByText('Exposure episode is immutable',{exact:true}).count(),0);
 });
 await check('home availability refreshes automatically when a reinforcement deadline arrives',async page=>{
  await page.evaluate(async()=>{
   const {trainerService}=await import('/engi/src/services/trainer-service.ts'),{db}=await import('/engi/src/db/engi-db.ts');
   const snapshot=await trainerService.getGoalSnapshot(),entries=snapshot.goalCatalog.filter(e=>e.goal.skill==='recognition');
   for(const [n,e] of entries.entries())await db.appMeta.put({key:'studyCore:memory:'+e.goal.id,value:{goalId:e.goal.id,goal:e.goal,lastCorrect:true,card:{due:n===0?new Date(Date.now()+4000):new Date('2099-01-01'),stability:10,difficulty:5,elapsed_days:0,scheduled_days:0,reps:1,lapses:0,state:n===0?3:2,learning_steps:0,last_review:new Date()},independentAttempts:1,independentSuccesses:1}});
  });
  await page.reload();await page.locator('.feed-home').waitFor();
  const block=page.locator('.day-plan-counts>div').nth(1);await block.getByText('Доступно сейчас: 0',{exact:true}).waitFor();await block.getByText('Доступно сейчас: 1',{exact:true}).waitFor();
 });
 await check('daily new-card setting persists, refreshes the home plan and supports zero',async page=>{
  await page.getByRole('button',{name:'Настройки',exact:true}).click();
  const input=page.getByLabel('Новых карточек в день',{exact:true});await input.waitFor();await page.waitForFunction(()=>!document.querySelector('#daily-new-cards').disabled);
  await input.fill('12');await page.getByRole('button',{name:'Сохранить',exact:true}).click();await page.getByText('Сохранено',{exact:true}).waitFor();
  assert.equal(await page.evaluate(async()=>{const {trainerService}=await import('/engi/src/services/trainer-service.ts');return (await trainerService.getDayPlan()).newBudget;}),12);
  await page.getByRole('button',{name:'Учиться',exact:true}).click();assert.equal(await page.locator('.day-plan-counts>div').nth(2).locator('strong').textContent(),'0 / 12');
  await page.reload();await page.locator('.feed-home').waitFor();await page.getByRole('button',{name:'Настройки',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#daily-new-cards')?.value==='12');
  await input.fill('-1');await page.getByRole('button',{name:'Сохранить',exact:true}).click();await page.getByText('Укажите целое число от 0 до 100',{exact:true}).waitFor();
  await input.fill('0');await page.getByRole('button',{name:'Сохранить',exact:true}).click();await page.getByText('Сохранено',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Учиться',exact:true}).click();assert.equal(await page.locator('.day-plan-counts>div').nth(2).locator('strong').textContent(),'0 / 0');
  await start(page);await page.locator('.learning22-stop').waitFor();assert.equal((await current(page)).s.tasks.length,0);
 });
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
  await page.locator('.study-feed.state-ready').waitFor();assert.equal((await current(page)).s.completedCount,0);
  assert.equal(await page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');return !!await db.appMeta.get('newLearning');}),false);
 });
 await check('blue header counts available reinforcement, excluding an exposed overdue goal',async page=>{
  await page.evaluate(async()=>{
   const {trainerService}=await import('/engi/src/services/trainer-service.ts'),{db}=await import('/engi/src/db/engi-db.ts');
   const snapshot=await trainerService.getGoalSnapshot(),entries=snapshot.goalCatalog.filter(e=>e.goal.skill==='recognition');
   for(const [n,e] of entries.entries())await db.appMeta.put({key:'studyCore:memory:'+e.goal.id,value:{goalId:e.goal.id,goal:e.goal,lastCorrect:n!==0,card:{due:n===0?new Date(Date.now()-1000):new Date('2099-01-01'),stability:10,difficulty:5,elapsed_days:0,scheduled_days:0,reps:1,lapses:n===0?1:0,state:n===0?3:2,learning_steps:0,last_review:new Date()},independentAttempts:1,independentSuccesses:n===0?0:1}});
   await db.appMeta.put({key:'studyCore:exposure:'+entries[0].goal.id,value:{goalId:entries[0].goal.id,lastVisibleAt:new Date().toISOString(),episodeId:'recent-feedback'}});
   const plan=(await db.appMeta.get('studyCore:dayPlan')).value;delete plan.mistakes;await db.appMeta.put({key:'studyCore:dayPlan',value:plan});await db.appMeta.delete('studyCore:mistakeEpisodes');
  });
  await start(page);await page.locator('.study-feed.state-ready').waitFor();assert.equal((await current(page)).t.intent,'repair');
  await page.getByLabel('Закрепить: 0',{exact:true}).waitFor();await page.getByRole('button',{name:'Неразобранные ошибки: 1',exact:true}).waitFor();
  const pending=await page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');return (await db.appMeta.get('studyCore:dayPlan')).value.reinforce.filter(r=>r.status==='pending').length;});assert.equal(pending,1);
 });
 await check('three mistakes drain seamlessly without a waiting screen or extra budget',async page=>{
  await page.evaluate(async()=>{
   const {trainerService}=await import('/engi/src/services/trainer-service.ts'),{db}=await import('/engi/src/db/engi-db.ts');
   const snapshot=await trainerService.getGoalSnapshot(),entries=snapshot.goalCatalog.filter(e=>e.goal.skill==='recognition'),due=new Date(Date.now()+86400000);
   for(const [n,e] of entries.entries())await db.appMeta.put({key:'studyCore:memory:'+e.goal.id,value:{goalId:e.goal.id,goal:e.goal,lastCorrect:n>=3,card:{due:n<3?due:new Date('2099-01-01'),stability:10,difficulty:5,elapsed_days:0,scheduled_days:0,reps:1,lapses:n<3?1:0,state:n<3?3:2,learning_steps:0,last_review:new Date(Date.now()-1000)},independentAttempts:1,independentSuccesses:n<3?0:1}});
   // Simulate a saved plan from before the mistake ledger existed.
   const plan=(await db.appMeta.get('studyCore:dayPlan')).value;delete plan.mistakes;await db.appMeta.put({key:'studyCore:dayPlan',value:plan});
   await db.appMeta.delete('studyCore:mistakeEpisodes');
  });
  await start(page);const seen=new Set();
  for(let remaining=3;remaining>0;remaining--){
   await page.locator('.study-feed.state-ready').waitFor();assert.equal(await page.locator('.learning22-stop').count(),0);
   const {t}=await current(page);assert.equal(t.intent,'repair');seen.add(t.items[0].factId);
   await page.getByRole('button',{name:`Неразобранные ошибки: ${remaining}`,exact:true}).waitFor();
   if(t.recipe.format==='recall_reveal'){await page.locator('.revealed-answer').waitFor();await page.getByRole('button',{name:'Вспомнил',exact:true}).click();}
   else await page.getByRole('button',{name:t.options.find(o=>o.id===t.items[0].answerId).name,exact:true}).click();
   await page.waitForFunction(async count=>{const {db}=await import('/engi/src/db/engi-db.ts');return (await db.appMeta.get('studyCore:dayPlan')).value.mistakes.length===count;},remaining-1);
   if(remaining>1){await page.waitForFunction(id=>document.querySelector('.feed-current')?.getAttribute('data-task-id')!==id,t.id);if(remaining===2){await page.reload();await page.getByRole('button',{name:'Продолжить с прошлого места',exact:true}).click();}}
  }
  assert.equal(seen.size,3);
  await page.waitForFunction(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');return (await db.appMeta.get('studyCore:dayPlan')).value.mistakes.length===0;});
  assert.equal(await page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');return !!await db.appMeta.get('newLearning');}),false);
 });
}finally{await browser.close();}
