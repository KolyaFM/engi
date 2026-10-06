import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
const url=process.env.ENGI_TEST_URL??'http://127.0.0.1:5173/engi/';
const browser=await chromium.launch({headless:true,executablePath:process.env.ENGI_BROWSER_PATH||undefined});let passed=0,failed=0;
const scenarios=[];
const check=(name,run)=>scenarios.push({name,run});
async function seed(page){
 await page.goto(url);await page.waitForSelector('.feed-home');
 await page.evaluate(async()=>{
  const {saveKnowledge}=await import('/engi/src/services/knowledge-service.ts');
  const b={entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[],entityTypes:[{id:'sample',name:'Объект'},{id:'author',name:'Автор'}],properties:[{id:'author-link',name:'Автор',valueKind:'entity',subjectTypes:['sample'],targetTypes:['author'],cardinality:'one',learnable:true},{id:'date',name:'Дата',valueKind:'date',subjectTypes:['sample'],cardinality:'one',learnable:true}]};
  for(let i=0;i<8;i++){b.entities.push({id:'s'+i,type:'sample',name:'Объект '+i,summary:'Короткий факт об объекте.',aliases:[],externalIds:{}},{id:'a'+i,type:'author',name:'Автор '+i,aliases:[],externalIds:{}});b.facts.push({id:'f'+i,entityId:'s'+i,key:'author-link',valueKind:'entity',valueEntityId:'a'+i,verification:'user_confirmed',source:{kind:'manual',name:'Личное знание'}},{id:'d'+i,entityId:'s'+i,key:'date',valueKind:'date',dateStart:(1800+i*25)+'-01-01',dateEnd:(1800+i*25)+'-12-31',datePrecision:'year',verification:'user_confirmed',source:{kind:'manual',name:'Личное знание'}})}
  await saveKnowledge(b);
 });await page.reload();await page.waitForSelector('.feed-home');
}
async function start(page,format){await page.getByLabel('Формат',{exact:true}).selectOption(format);await page.getByRole('button',{name:'Начать',exact:true}).click();await page.waitForSelector('.feed-question');await page.waitForSelector('.study-feed.state-ready')}
async function current(page){return page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');const s=(await db.activeSessions.where('status').equals('active').toArray()).at(-1);return {session:s,task:s.tasks[s.currentPosition],events:await db.reviewEvents.toArray()}})}
async function drag(page,dx){const box=await page.locator('.recall-swipe').boundingBox();assert(box);const x=box.x+box.width*.5,y=box.y+box.height*.45;await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx,y,{steps:12});await page.mouse.up()}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function freezeClock(page){const time=new Date('2026-10-06T12:00:00Z');await page.clock.install({time});await page.clock.pauseAt(new Date(time.getTime()+1000))}

check('Choice wrong stays local; resume preserves disabled red options; final result is one event',async page=>{
 await start(page,'choice');const {task}=await current(page),correct=task.options.find(o=>o.id===task.items[0].answerId),wrongs=task.options.filter(o=>o.id!==correct.id);
 await page.getByRole('button',{name:wrongs[0].name,exact:true}).click();await sleep(200);
 assert.equal((await current(page)).events.length,0);
 assert.equal(await page.locator('.answer-correct').count(),0);
 assert(await page.getByRole('button',{name:correct.name,exact:true}).isEnabled());
 assert.equal(await page.locator('.feed-feedback').count(),0);
 await page.reload();await page.getByRole('button',{name:'Продолжить с прошлого места'}).click();await page.waitForSelector('.feed-question');
 assert.equal(await page.locator('.answer-wrong').count(),1);
 await page.getByRole('button',{name:wrongs[1].name,exact:true}).click();await sleep(150);
 await page.getByRole('button',{name:correct.name,exact:true}).click();
 await page.locator('.encoding-moment').waitFor();
 const result=(await current(page)).events[0];assert.equal(result.payload.score,0);assert.equal(result.payload.metadata.attemptCount,3);assert.equal(result.payload.feedback.encoding,true);
});

check('Twenty first-try answers auto-advance with twenty taps and goal does not stop feed',async page=>{
 await start(page,'choice');for(let i=0;i<20;i++){const {task}=await current(page);await page.locator(`[data-task-id="${task.id}"]`).waitFor();const correct=task.options.find(o=>o.id===task.items[0].answerId);await page.getByRole('button',{name:correct.name,exact:true}).click();await page.waitForFunction(id=>document.querySelector('.feed-current')?.getAttribute('data-task-id')!==id,task.id)}
 assert.equal((await current(page)).events.length,20);assert.equal(await page.locator('.study-feed').count(),1);assert.equal(await page.locator('.study-feed input[type="text"]').count(),0);
});

check('Timeline pointer release and arrows do not submit; Confirm submits one diagnostic event',async page=>{
 await start(page,'timeline');const slider=page.getByRole('slider');await slider.focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowLeft');
 const box=await slider.boundingBox();await page.mouse.click(box.x+box.width*.2,box.y+box.height*.5);await sleep(150);
 assert.equal((await current(page)).events.length,0);await page.getByRole('button',{name:'Подтвердить',exact:true}).click();await sleep(150);
 const events=(await current(page)).events;assert.equal(events.length,1);assert.equal(events[0].payload.fsrsEnabled,false);assert.equal(await page.locator('.timeline-result').count(),1);
});

check('Recall stays hidden until 5000ms; pre-reveal gesture ignored; short drag springs back',async page=>{
 await freezeClock(page);await start(page,'recall_reveal');const id=(await current(page)).task.id;
 await drag(page,140);assert.equal((await current(page)).events.length,0);assert.equal(await page.locator('.revealed-answer').count(),0);
 await page.clock.runFor(4999);assert.equal(await page.locator('.revealed-answer').count(),0);
 await page.clock.runFor(1);await page.waitForSelector('.revealed-answer');
 await drag(page,20);assert.equal((await current(page)).events.length,0);await page.clock.runFor(240);
 await drag(page,150);await sleep(150);const events=(await current(page)).events;assert.equal(events.length,1);assert.equal(events[0].id,id);assert.equal(events[0].payload.score,1);
});

check('Recall miss after reveal is one failed pretest and no keyboard answer',async page=>{
 await freezeClock(page);await start(page,'recall_reveal');await page.clock.runFor(5000);await page.waitForSelector('.revealed-answer');await drag(page,-150);await sleep(150);
 const events=(await current(page)).events;assert.equal(events.length,1);assert.equal(events[0].payload.score,0);assert.equal(events[0].payload.fsrsEnabled,false);assert.equal(await page.locator('.study-feed input:not([type=range])').count(),0);
});

check('Reduced motion offers compact accessible Recall controls after reveal',async page=>{
 await page.emulateMedia({reducedMotion:'reduce'});await freezeClock(page);await start(page,'recall_reveal');assert.equal(await page.getByRole('button',{name:'Вспомнил',exact:true}).count(),0);
 await page.clock.runFor(5000);await page.getByRole('button',{name:'Вспомнил',exact:true}).click();await sleep(150);assert.equal((await current(page)).events.length,1);
});

check('Recall pauses while details are open and resumes with thinking time intact',async page=>{
 await freezeClock(page);await start(page,'recall_reveal');await page.clock.runFor(2000);await page.getByRole('button',{name:'Подробнее о вопросе'}).click();await page.clock.runFor(10000);assert.equal(await page.locator('.revealed-answer').count(),0);
 await page.getByRole('button',{name:'Закрыть подробности'}).click();await page.clock.runFor(2999);assert.equal(await page.locator('.revealed-answer').count(),0);await page.clock.runFor(1);await page.waitForSelector('.revealed-answer');
});

check('All seven feed formats have no typed answer and fit phone width',async page=>{
 for(const fmt of ['choice','recall_reveal','match','categorize','missing','timeline','sort']){
  if(fmt==='categorize')await page.evaluate(async()=>{const {saveKnowledge}=await import('/engi/src/services/knowledge-service.ts');const {db}=await import('/engi/src/db/engi-db.ts');const facts=await db.facts.where('key').equals('author-link').toArray();await saveKnowledge({facts:facts.map((f,i)=>({...f,valueEntityId:'a'+(i%3)}))})});
  if(await page.locator('.study-feed').count()){await page.getByRole('button',{name:'Выйти из практики'}).click();await page.waitForSelector('.feed-home')}
  await start(page,fmt);assert.equal(await page.locator('.study-feed input[type=text],.study-feed input:not([type])').count(),0);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 if(process.env.ENGI_SCREENSHOTS){await mkdir(process.env.ENGI_SCREENSHOTS,{recursive:true});await page.screenshot({path:process.env.ENGI_SCREENSHOTS+'/sort-phone.png'})}
});

check('Recall reload restores active thinking time rather than starting over',async page=>{
 await freezeClock(page);await start(page,'recall_reveal');await page.clock.runFor(2000);
 const before=await current(page);assert.equal(before.session.interaction.recallElapsedMs,2000);
 await page.reload();await page.getByRole('button',{name:'Продолжить с прошлого места'}).click();await page.waitForSelector('.study-feed.state-ready');
 assert.equal((await current(page)).task.id,before.task.id);await page.clock.runFor(2999);assert.equal(await page.locator('.revealed-answer').count(),0);await page.clock.runFor(1);await page.waitForSelector('.revealed-answer');
});

check('Recall ignores time spent in a hidden document',async page=>{
 await freezeClock(page);await start(page,'recall_reveal');await page.clock.runFor(2000);
 await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'))});
 await page.clock.runFor(10000);assert.equal(await page.locator('.revealed-answer').count(),0);
 await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});document.dispatchEvent(new Event('visibilitychange'))});
 await page.clock.runFor(2999);assert.equal(await page.locator('.revealed-answer').count(),0);await page.clock.runFor(1);await page.waitForSelector('.revealed-answer');
});

check('Recall recovers from a failed reveal write without another thinking interval',async page=>{
 await freezeClock(page);await start(page,'recall_reveal');
 await page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');const fail=mods=>{if(mods.interaction?.revealed||mods['interaction.revealed']){window.__revealWriteFailed=true;db.activeSessions.hook('updating').unsubscribe(fail);throw Error('Temporary reveal write failure')}};db.activeSessions.hook('updating',fail)});
 await page.clock.runFor(5000);await page.locator('.feed-error').waitFor();assert(await page.evaluate(()=>window.__revealWriteFailed));assert.equal(await page.locator('.revealed-answer').count(),0);
 await page.clock.runFor(500);await page.waitForSelector('.revealed-answer');assert.equal((await current(page)).session.interaction.recallElapsedMs,5000);
});

try{for(const scenario of scenarios.filter(s=>!process.env.ENGI_TEST_FILTER||s.name.includes(process.env.ENGI_TEST_FILTER))){const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true});const page=await context.newPage();page.setDefaultTimeout(4000);try{await seed(page);await scenario.run(page);passed++;console.log('PASS '+scenario.name)}catch(e){failed++;console.error('FAIL '+scenario.name+'\n'+e.stack);console.error((await page.locator('.study-feed').textContent().catch(()=>''))?.slice(0,2000))}finally{await context.close()}}}finally{await browser.close()}
console.log(JSON.stringify({browserAcceptance:{passed,failed}}));if(failed)process.exitCode=1;
