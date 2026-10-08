import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,executablePath:process.env.ENGI_BROWSER_PATH||undefined});
const context=await browser.newContext({viewport:{width:393,height:852},reducedMotion:'reduce'}),page=await context.newPage();
page.setDefaultTimeout(7000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const url=process.env.ENGI_TEST_URL??'http://127.0.0.1:5173/engi/';
async function current(){return page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');const s=(await db.activeSessions.where('status').equals('active').toArray()).at(-1);return {task:s.tasks[0],interaction:s.interaction};});}
async function resume(){await page.reload();await page.getByRole('button',{name:'Продолжить с прошлого места',exact:true}).click();await page.locator('.study-feed.state-ready').waitFor();}
async function gradeAndAdvance(id){await page.getByRole('button',{name:'Вспомнил',exact:true}).click();await page.waitForFunction(old=>{const node=document.querySelector('.feed-current');return node&&node.getAttribute('data-task-id')!==old&&document.querySelector('.study-feed.state-ready');},id);}
try{
 await page.goto(url);await page.locator('.feed-home').waitFor();
 await page.evaluate(async()=>{
  const {saveKnowledge}=await import('/engi/src/services/knowledge-service.ts'),{db}=await import('/engi/src/db/engi-db.ts');
  const b={entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[],entityTypes:[{id:'subject',name:'Объект'},{id:'answer',name:'Ответ'}],properties:[{id:'rel',name:'Автор',valueKind:'entity',cardinality:'one',learnable:true,subjectTypes:['subject'],targetTypes:['answer']}]};
  for(let n=0;n<6;n++){b.entities.push({id:'s'+n,type:'subject',name:'Объект '+n,aliases:[],externalIds:{}},{id:'a'+n,type:'answer',name:'Автор '+n,aliases:[],externalIds:{}});b.facts.push({id:'f'+n,entityId:'s'+n,key:'rel',valueKind:'entity',valueEntityId:'a'+n,verification:'user_confirmed',source:{kind:'manual',name:'Тест'}});}
  await saveKnowledge(b);
  const {canonicalTargets}=await import('/engi/src/lib/engi/questions/recipe-factory.ts'),{triagedMemory}=await import('/engi/src/lib/engi/learning/bootstrap.ts'),{learningRow}=await import('/engi/src/db/repositories.ts');
  for(const item of canonicalTargets(b))await db.learningState.put(learningRow(triagedMemory(item,'red','',0)));
 });
 await page.reload();await page.getByLabel('Формат',{exact:true}).selectOption('recall_reveal');await page.getByRole('button',{name:'Начать',exact:true}).click();await page.locator('.study-feed.state-ready').waitFor();
 assert.equal(await page.locator('.revealed-answer').count(),0);
 const first=(await current()).task;await page.getByRole('button',{name:'Показать сейчас',exact:true}).click();await page.locator('.revealed-answer').waitFor();
 assert.equal((await current()).interaction.revealed,true);
 await gradeAndAdvance(first.id);
 // The next card must not inherit the previous card's revealed state or elapsed time.
 assert.equal(await page.locator('.revealed-answer').count(),0,'new recall task must hide its answer');
 await page.getByRole('progressbar',{name:'Время вспомнить'}).waitFor();assert.equal((await current()).interaction?.revealed,undefined);
 const second=(await current()).task;
 await page.locator('.revealed-answer').waitFor();assert.equal((await current()).interaction.revealed,true);
 assert.equal((await current()).interaction.recallElapsedMs,5000);
 // Reloading this same task should restore its own saved reveal and allow grading.
 await resume();await page.locator('.revealed-answer').waitFor();assert.equal((await current()).task.id,second.id);
 await gradeAndAdvance(second.id);
 assert.equal(await page.locator('.revealed-answer').count(),0);
 await page.getByRole('progressbar',{name:'Время вспомнить'}).waitFor();
 // A partially elapsed same-task draft resumes the countdown instead of revealing early.
 const third=(await current()).task;
 await page.getByRole('button',{name:'Подробнее о вопросе'}).click();
 await page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');const s=(await db.activeSessions.where('status').equals('active').toArray()).at(-1);s.interaction={taskId:s.tasks[0].id,attemptSequence:[],recallElapsedMs:1000};await db.activeSessions.put(s);});
 await resume();assert.equal((await current()).task.id,third.id);assert.equal(await page.locator('.revealed-answer').count(),0);
 await page.getByRole('progressbar',{name:'Время вспомнить'}).waitFor();
 assert(Number(await page.getByRole('progressbar',{name:'Время вспомнить'}).getAttribute('aria-valuenow'))<=4);
 await page.getByRole('button',{name:'Показать сейчас',exact:true}).click();await page.locator('.revealed-answer').waitFor();await gradeAndAdvance(third.id);
 assert.equal(await page.locator('.feed-error').count(),0);assert.deepEqual(errors,[]);
 console.log('PASS recall feed: fresh timer after early and automatic reveal, saved reveal resumes and grades, partial countdown resumes');
}finally{await context.close();await browser.close();}
