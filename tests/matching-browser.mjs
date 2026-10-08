import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,executablePath:process.env.ENGI_BROWSER_PATH||undefined});
const context=await browser.newContext({viewport:{width:393,height:852}}),page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(7000);
const url=process.env.ENGI_TEST_URL??'http://127.0.0.1:5173/engi/';
try{
 await page.goto(url);await page.locator('.feed-home').waitFor();
 const task=await page.evaluate(async()=>{
  const {saveKnowledge}=await import('/engi/src/services/knowledge-service.ts'),{db}=await import('/engi/src/db/engi-db.ts');
  const b={entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[],entityTypes:[{id:'subject',name:'Объект'},{id:'answer',name:'Ответ'}],properties:[{id:'rel',name:'Автор',valueKind:'entity',cardinality:'one',learnable:true,subjectTypes:['subject'],targetTypes:['answer']}]};
  for(let n=0;n<6;n++){b.entities.push({id:'s'+n,type:'subject',name:'Картина с достаточно длинным названием '+n,aliases:[],externalIds:{}});b.facts.push({id:'f'+n,entityId:'s'+n,key:'rel',valueKind:'entity',valueEntityId:'a'+n%3,verification:'user_confirmed',source:{kind:'manual',name:'Тест'}});}
  for(let n=0;n<3;n++)b.entities.push({id:'a'+n,type:'answer',name:'Автор '+n,aliases:[],externalIds:{}});
  await saveKnowledge(b);
  const {canonicalTargets}=await import('/engi/src/lib/engi/questions/recipe-factory.ts'),{triagedMemory}=await import('/engi/src/lib/engi/learning/bootstrap.ts'),{learningRow}=await import('/engi/src/db/repositories.ts');
  for(const item of canonicalTargets(b))await db.learningState.put(learningRow(triagedMemory(item,'red','',0)));
  const {trainerService}=await import('/engi/src/services/trainer-service.ts'),{goalCandidates}=await import('/engi/src/services/goal-candidates.ts'),{groupCandidates}=await import('/engi/src/services/group-candidates.ts');
  const session=await trainerService.startGoalFeed('all','match'),atomic=goalCandidates(b,(await db.learningState.toArray()).map(r=>r.payload),'all','match');
  const task=groupCandidates(b,atomic,new Set(),3)[0];task.studyContract=undefined;session.tasks=[task];await db.activeSessions.put(session);
  await trainerService.observeVisibility(session.id,task.id,'question','setup','start');return (await db.activeSessions.get(session.id)).tasks[0];
 });
 await page.reload();await page.getByRole('button',{name:'Продолжить с прошлого места',exact:true}).click();
 await page.locator('.matching-pairs').waitFor();await page.locator('.study-feed.state-ready').waitFor();
 const left=id=>page.locator(`[data-entity-id="${id}"]`),right=id=>page.locator(`[data-answer-id="${id}"]`);
 assert.equal(await page.locator('.matching-tile.selected').count(),0);
 assert.equal(await page.getByRole('button',{name:'Проверить',exact:true}).count(),0);
 const [first,second,last]=task.items,wrong=task.options.find(o=>o.id!==first.answerId);
 // Start on the right, deselect, then change selection within the same column.
 await right(wrong.id).click();assert.equal(await right(wrong.id).getAttribute('aria-pressed'),'true');
 await right(wrong.id).click();assert.equal(await page.locator('.matching-tile.selected').count(),0);
 await left(second.entityId).click();await left(first.entityId).click();assert.equal(await page.locator('.matching-tile.selected').count(),1);
 await right(wrong.id).click();await page.locator('.matching-tile.incorrect').first().waitFor();assert.equal(await page.locator('.matching-tile.incorrect').count(),2);
 await page.waitForFunction(()=>document.querySelectorAll('.matching-tile.incorrect,.matching-tile.selected').length===0);
 const goal=task.studyContract.primaryGoals.find(g=>g.subjectId===first.entityId)??task.studyContract.primaryGoals[0];
 const memories=()=>page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');return (await db.appMeta.where('key').startsWith('studyCore:memory:').toArray()).map(r=>r.value);});
 const firstMemory=(await memories()).find(m=>m.goalId===goal.id);assert(firstMemory);assert.equal(firstMemory.independentSuccesses,0);
 // Correct the error with keyboard activation, verify green, then stable dimmed tiles.
 await right(first.answerId).focus();await page.keyboard.press('Enter');await left(first.entityId).focus();await page.keyboard.press('Space');
 await page.locator('.matching-tile.correct').first().waitFor();assert.equal(await page.locator('.matching-tile.correct').count(),2);
 assert.equal(await left(second.entityId).evaluate(el=>getComputedStyle(el).opacity),'1','Other objects stay vivid during feedback');
 assert.equal(await left(second.entityId).isEnabled(),true,'Next object can be selected during green feedback');
 await left(second.entityId).click();assert.equal(await left(second.entityId).getAttribute('aria-pressed'),'true');
 await page.locator('.matching-tile.matched').first().waitFor();assert(await left(first.entityId).isDisabled());assert.equal(await page.locator('.matching-tile.matched').count(),2);
 assert.deepEqual((await memories()).find(m=>m.goalId===goal.id),firstMemory);
 await page.reload();await page.getByRole('button',{name:'Продолжить с прошлого места',exact:true}).click();await page.locator('.matching-tile.matched').first().waitFor();
 assert(await left(first.entityId).isDisabled());assert(await right(first.answerId).isDisabled());
 await page.setViewportSize({width:320,height:736});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 const columns=await page.locator('.matching-column').evaluateAll(nodes=>nodes.map(n=>({x:n.getBoundingClientRect().x,width:n.getBoundingClientRect().width})));
 assert(columns[1].x>=columns[0].x+columns[0].width);
 await mkdir('artifacts',{recursive:true});await page.screenshot({path:'artifacts/matching-mobile.png'});
 await page.setViewportSize({width:1280,height:900});await page.screenshot({path:'artifacts/matching-desktop.png'});
 await left(second.entityId).click();await right(second.answerId).click();await page.locator('.matching-tile.correct').first().waitFor();
 await page.waitForFunction(()=>document.querySelectorAll('.matching-tile.matched').length===4);
 await right(last.answerId).click();await left(last.entityId).click();
 await page.locator('.matching-tile.correct').first().waitFor();await page.getByRole('button',{name:'Подробнее о вопросе',exact:true}).click();
 await page.getByRole('dialog',{name:'Подробности вопроса',exact:true}).waitFor();
 await page.waitForTimeout(900);assert.equal(await page.locator('.feed-current').getAttribute('data-task-id'),task.id);
 await page.getByRole('button',{name:'Закрыть подробности',exact:true}).click();
 await page.waitForFunction(async id=>{const {db}=await import('/engi/src/db/engi-db.ts');return !!(await db.reviewEvents.get(id))?.payload.feedback.matchingComplete;},task.id);
 assert.equal((await memories()).length,2);
 await page.waitForFunction(id=>document.querySelector('.feed-current')?.getAttribute('data-task-id')!==id,task.id);
 // The same interaction also works with image cues, and waits for every image.
 const imageTask=await page.evaluate(async old=>{
  const {db}=await import('/engi/src/db/engi-db.ts'),{trainerService}=await import('/engi/src/services/trainer-service.ts');
  const s=await trainerService.startGoalFeed('all','match','practice');
  const next={...old,id:crypto.randomUUID(),practice:true,studyContract:undefined,recipe:{...old.recipe,cue:'image'},items:old.items.map((item,n)=>({...item,image:'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="${['#247fb4','#dc7245','#9362bc'][n]}"/><circle cx="60" cy="60" r="${15+n*10}" fill="white"/></svg>`)}))};
  s.tasks=[next];await db.activeSessions.put(s);await trainerService.observeVisibility(s.id,next.id,'question','image-setup','start');return next;
 },task);
 await page.reload();await page.getByRole('button',{name:'Продолжить с прошлого места',exact:true}).click();
 await page.locator('.study-feed.state-ready').waitFor();await page.waitForFunction(()=>document.querySelectorAll('.matching-tile img').length===3&&[...document.querySelectorAll('.matching-tile img')].every(i=>i.complete&&i.naturalWidth>0));
 const imageItem=imageTask.items[0];await left(imageItem.entityId).click();await right(imageItem.answerId).click();await page.locator('.matching-tile.correct').first().waitFor();await page.locator('.matching-tile.matched').first().waitFor();
 await page.setViewportSize({width:320,height:736});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'artifacts/matching-images.png'});
 // Four images, two repeated authors: retain the answer until its last object.
 const four=await page.evaluate(async()=>{
  const {db}=await import('/engi/src/db/engi-db.ts'),{trainerService}=await import('/engi/src/services/trainer-service.ts'),{getBundle}=await import('/engi/src/db/repositories.ts');
  const {goalCandidates}=await import('/engi/src/services/goal-candidates.ts'),{groupCandidates}=await import('/engi/src/services/group-candidates.ts');
  const b=await getBundle(db),s=await trainerService.startGoalFeed('all','categorize','practice');
  const atomic=goalCandidates(b,(await db.learningState.toArray()).map(r=>r.payload),'all','categorize').filter(t=>['s0','s3','s1','s4'].includes(t.items[0].entityId));
  const next=groupCandidates(b,atomic,new Set(),4)[0];
  next.items=['s0','s3','s1','s4'].map(id=>atomic.find(t=>t.items[0].entityId===id&&t.recipe.direction===next.recipe.direction&&t.recipe.cue===next.recipe.cue).items[0]);
  next.options=[...new Map(next.items.map(i=>[i.answerId,{id:i.answerId,name:i.answer}])).values()];
  next.studyContract=undefined;next.practice=true;next.recipe={...next.recipe,cue:'image'};
  next.items=next.items.map((item,n)=>({...item,image:'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${n%2?120:180}" height="${n%2?180:120}"><rect width="100%" height="100%" fill="${['#247fb4','#dc7245','#9362bc','#358764'][n]}"/><circle cx="60" cy="60" r="30" fill="white"/></svg>`)}));
  s.tasks=[next];await db.activeSessions.put(s);await trainerService.observeVisibility(s.id,next.id,'question','four-images','start');return next;
 });
 assert.equal(four.items.length,4);assert.equal(four.options.length,2);
 await page.reload();await page.getByRole('button',{name:'Продолжить с прошлого места',exact:true}).click();await page.locator('.study-feed.state-ready').waitFor();
 let shortHeight;
 for(const viewport of [{width:320,height:568},{width:393,height:852},{width:852,height:393},{width:1280,height:900}]){
  await page.setViewportSize(viewport);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const layout=await page.locator('.matching-tile img').evaluateAll(images=>images.map(img=>({width:img.width,height:img.height,ratio:img.naturalWidth/img.naturalHeight,row:img.parentElement.clientHeight})));
  assert.equal(layout.length,4);
  for(const img of layout){assert(img.width>0&&img.height>=44);assert(Math.abs(img.width/img.height-img.ratio)<.03,'Image preserves its aspect ratio');assert(img.height<=img.row+1);}
  const buttons=await page.locator('.matching-answer').first().boundingBox();assert(buttons.height>=44);
  if(viewport.width===320)shortHeight=layout[0].row;
  if(viewport.width===393){assert(layout[0].row>shortHeight);await page.screenshot({path:'artifacts/matching-four-mobile.png'});}
 }
 await page.setViewportSize({width:393,height:852});
 const shared=four.items.filter(i=>i.answerId===four.items[0].answerId),other=four.items.find(i=>i.answerId!==shared[0].answerId);
 await left(shared[0].entityId).click();await right(shared[0].answerId).click();await left(shared[0].entityId).locator('..').locator('.correct').first().waitFor();
 assert(await right(shared[0].answerId).isEnabled());assert(await left(other.entityId).isEnabled());
 await left(shared[1].entityId).click();await right(shared[1].answerId).click();
 await page.waitForFunction(id=>document.querySelector(`[data-entity-id="${id}"]`)?.classList.contains('matched'),shared[1].entityId).catch(async error=>{console.log(await page.locator('.matching-pairs,.feed-error').allTextContents());console.log(await page.locator('.matching-tile').evaluateAll(nodes=>nodes.map(n=>({id:n.dataset.entityId??n.dataset.answerId,state:n.className,disabled:n.disabled}))));throw error;});
 assert(await right(shared[0].answerId).isDisabled());assert(await left(other.entityId).isEnabled());
 await page.reload();await page.getByRole('button',{name:'Продолжить с прошлого места',exact:true}).click();await page.locator('.matching-pairs').waitFor();
 assert(await left(shared[0].entityId).isDisabled());assert(await left(shared[1].entityId).isDisabled());assert(await right(shared[0].answerId).isDisabled());
 assert.deepEqual(errors,[]);console.log('PASS matching: selection, errors, rapid pairs, keyboard, reload, repeated authors, four proportional images at 320px/mobile/landscape/desktop, first-answer credit, automatic advance');
}finally{await context.close();await browser.close();}
