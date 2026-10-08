import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,executablePath:process.env.ENGI_BROWSER_PATH||undefined});
const url=process.env.ENGI_TEST_URL??'http://127.0.0.1:5174/engi/';
try{
 for(const format of ['choice','match','recall_reveal']){
  const context=await browser.newContext({viewport:{width:393,height:852},hasTouch:true,isMobile:true}),page=await context.newPage();
  page.setDefaultTimeout(16000);
  try{
   await page.goto(url);await page.locator('.feed-home').waitFor();
   await page.evaluate(async()=>{
    const {db}=await import('/engi/src/db/engi-db.ts'),{putBundle}=await import('/engi/src/db/repositories.ts'),{resetLearningProgress}=await import('/engi/src/services/learning-service.ts'),{mediaStore}=await import('/engi/src/media/media-store.ts');
    const b={entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[],entityTypes:[{id:'subject',name:'Объект'},{id:'answer',name:'Ответ'}],properties:[{id:'rel',name:'Автор',valueKind:'entity',cardinality:'one',learnable:true,subjectTypes:['subject'],targetTypes:['answer']}]};
    for(let n=0;n<6;n++){
     b.entities.push({id:'s'+n,type:'subject',name:'Объект '+n,aliases:[],externalIds:{}},{id:'a'+n,type:'answer',name:'Автор '+n,aliases:[],externalIds:{}});
     b.facts.push({id:'f'+n,entityId:'s'+n,key:'rel',valueKind:'entity',valueEntityId:'a'+n,verification:'user_confirmed',source:{kind:'manual',name:'Test'}});
     const canvas=document.createElement('canvas');canvas.width=120;canvas.height=180;const ctx=canvas.getContext('2d');ctx.fillStyle=['red','blue','green','orange','purple','teal'][n];ctx.fillRect(0,0,120,180);
     const blob=await new Promise(resolve=>canvas.toBlob(resolve)),hash=String(n+1).repeat(64);await mediaStore.put(hash,blob);
     b.media.push({id:'m'+n,entityId:'s'+n,role:'primary',primary:true,url:'engi-media://'+hash,license:'CC0'});
    }
    await putBundle(db,b);await resetLearningProgress(db);await db.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:10}});
   });
   await page.reload();await page.getByLabel('Формат',{exact:true}).selectOption(format);await page.getByRole('button',{name:'Начать',exact:true}).tap();
   while(await page.locator('.study-feed').count()===0){
    const previous=await page.locator('#object-intro-heading').textContent();await page.getByRole('button',{name:'Готово',exact:true}).tap();
    await page.waitForFunction(old=>document.querySelector('.study-feed')||document.querySelector('#object-intro-heading')?.textContent!==old&&!document.querySelector('.learning22-primary')?.disabled,previous);
   }
   await page.locator('.study-feed.state-ready').waitFor();
   const first=await page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');return (await db.activeSessions.where('status').equals('active').toArray()).at(-1).tasks[0];});
   await page.waitForFunction(t=>{const images=[...document.querySelectorAll('.feed-current img')];return document.querySelector('.feed-current')?.dataset.taskId===t.id&&(!t.readyAt||Date.now()>=new Date(t.readyAt).getTime()+300)&&(t.recipe.cue!=='image'||images.length>0)&&images.every(i=>i.complete&&i.naturalWidth>0);},first);
   if(!await page.locator('.feed-option,.matching-tile,.recall-thinking button').first().isEnabled()){
    await page.waitForTimeout(500);console.log(await page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');return {now:Date.now(),sessions:(await db.activeSessions.toArray()).map(s=>({id:s.id,status:s.status,pos:s.currentPosition,taskId:s.tasks[0]?.id,readyAt:s.tasks[0]?.readyAt})),uiTask:document.querySelector('.feed-current')?.dataset.taskId,state:document.querySelector('.study-feed')?.className,images:[...document.querySelectorAll('.feed-current img')].map(i=>({complete:i.complete,width:i.naturalWidth})),disabled:[...document.querySelectorAll('.feed-option,.matching-tile,.recall-thinking button')].map(i=>i.disabled),text:document.querySelector('.feed-current')?.textContent};}));
   }
   const candidates=page.locator('.feed-option,.matching-tile,.recall-thinking button');assert(await candidates.count());
   assert.equal(await candidates.first().isEnabled(),true,`${format}: first question must accept taps without scrolling`);
   const initialScroll=await page.locator('.feed-viewport').evaluate(el=>el.scrollTop);assert.equal(initialScroll,0);
   const button=candidates.first(),box=await button.boundingBox();
   const hit=await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.closest('button')?.className,{x:box.x+box.width/2,y:box.y+box.height/2});assert(hit,`${format}: the visible button must receive touch hit testing`);
   await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
   await page.waitForFunction(()=>document.querySelector('.matching-tile.selected,.revealed-answer,.answer-correct,.answer-wrong')||!document.querySelector('.study-feed.state-ready'));
   console.log(`PASS first ${format} question accepts touch after introduction without scrolling`);
  }finally{await context.close();}
 }
}finally{await browser.close();}
