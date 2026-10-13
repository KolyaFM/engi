import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({headless:true,executablePath:process.env.ENGI_BROWSER_PATH});
await mkdir('artifacts',{recursive:true});
try{
 for(const viewport of [{width:393,height:852},{width:1365,height:900}]){
  const context=await browser.newContext({viewport}),page=await context.newPage(),errors=[];page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.ENGI_TEST_URL??'http://127.0.0.1:5173/engi/');await page.locator('.feed-home').waitFor();
  await page.getByRole('button',{name:'Статистика',exact:true}).click();await page.locator('.statistics-hero').waitFor();assert.equal(await page.getByRole('heading',{name:'Статистика',exact:true}).count(),1);assert.equal(await page.getByRole('button',{name:'Посмотреть освоенные свойства'}).textContent(),'0');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.getByRole('button',{name:'Колоды',exact:true}).click();
  const expected=await page.evaluate(async()=>{
   const {db}=await import('/engi/src/db/engi-db.ts'),{prepareDeclarativePack,commitDeclarativeImport}=await import('/engi/src/services/declarative-pack.ts'),{trainerService}=await import('/engi/src/services/trainer-service.ts'),{admitAcquisition,emptyLifecycle,propertyKey}=await import('/engi/src/lib/engi/study-core/acquisition.ts'),{graduateGoalMemory}=await import('/engi/src/lib/engi/study-core/memory.ts');
   for(const file of ['usa-50-states-v3-flags-as-properties.engi','french-artists-6-24.engi'])await commitDeclarativeImport(await prepareDeclarativePack(await(await fetch('/engi/artifacts/'+file)).blob(),db),{},db);
   const snapshot=await trainerService.getGoalSnapshot(true),all=[...new Map(snapshot.goalCatalog.filter(e=>!e.suspended&&e.goal.direction==='forward'&&e.goal.skill==='recognition').map(e=>[propertyKey(e.goal),e])).values()];
   let lifecycle=emptyLifecycle();const now=new Date();let mastered=0,learning=0;
   for(const [n,entry]of all.slice(0,65).entries()){
    const entityId=entry.goal.knowledge.kind==='identity'?entry.goal.knowledge.key:snapshot.bundle.facts.find(f=>f.id===entry.goal.knowledge.key)?.entityId??entry.entityIds[0];
    const at=new Date(now);at.setDate(at.getDate()-Math.floor(n/3));lifecycle=admitAcquisition(lifecycle,entityId,[entry.goal],at,'daily');const unit=lifecycle.units.find(u=>u.goal.id===entry.goal.id);
    if(n<55){unit.stage='completed';unit.successes=2;unit.completedAt=at.toISOString();await db.appMeta.put({key:'studyCore:memory:'+entry.goal.id,value:graduateGoalMemory(entry.goal,at)});mastered++;}else learning++;
   }
   await db.appMeta.put({key:'studyCore:learningLifecycle',value:lifecycle});
   for(let n=0;n<10;n++){const entry=all[n],g=entry.goal;await db.reviewEvents.put({id:'statistics-review-'+n,timestamp:now.toISOString(),recipe:'test',level:'direct',targetIds:[g.id],payload:{studyCore:{attempt:{submittedAt:now.toISOString(),results:[{goalId:g.id,correct:n!==2,credit:true}]}},metadata:{stabilityTransitions:[{targetId:g.id,before:3,after:4}]}}});}
   return {mastered,learning};
  });
  await page.reload();await page.locator('.deck-cover-grid').waitFor();await page.getByRole('button',{name:'Статистика',exact:true}).click();await page.locator('.statistics-hero').waitFor();
  assert.equal(await page.getByRole('button',{name:'Посмотреть освоенные свойства'}).textContent(),String(expected.mastered));assert.equal(await page.locator('.statistics-deck').count(),2);assert.equal(await page.locator('.statistics-calendar-day').count(),30);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:`artifacts/statistics-${viewport.width}.png`,fullPage:true});
  await page.getByRole('button',{name:'7 дней',exact:true}).click();assert.equal(await page.getByRole('button',{name:'7 дней',exact:true}).getAttribute('aria-pressed'),'true');await page.getByRole('button',{name:'Всё',exact:true}).click();await page.locator('.statistics-calendar-day').last().click();await page.getByRole('dialog').waitFor();assert(await page.getByRole('dialog').getByText('Первые ответы без ошибок').count());await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);
  await page.getByRole('button',{name:'Посмотреть освоенные свойства'}).click();await page.getByRole('dialog').waitFor();assert.equal(await page.locator('.statistics-property-list>div').count(),expected.mastered);await page.getByRole('button',{name:'Закрыть подробности'}).click();assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('aria-label')),'Посмотреть освоенные свойства');
  const options=await page.locator('.statistics-filter option').evaluateAll(nodes=>nodes.map(n=>n.value));await page.getByLabel('Колода для статистики').selectOption(options[1]);assert.equal(await page.locator('.statistics-deck').count(),1);await page.getByLabel('Колода для статистики').selectOption('');
  if(viewport.width===393){await page.setViewportSize({width:320,height:736});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'artifacts/statistics-320.png',fullPage:true});}
  await page.getByRole('button',{name:'Колоды',exact:true}).click();await page.getByRole('button',{name:'Статистика',exact:true}).click();await page.locator('.statistics-hero').waitFor();assert.equal(await page.getByRole('button',{name:'Посмотреть освоенные свойства'}).textContent(),String(expected.mastered));assert.deepEqual(errors,[]);await context.close();
 }
 console.log('PASS statistics: empty, real packs, property mastery, history, chart, calendar, details, filters, reopen, 320px/mobile/desktop');
}finally{await browser.close();}
