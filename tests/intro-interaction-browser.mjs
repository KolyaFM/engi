import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({headless:true,executablePath:process.env.ENGI_BROWSER_PATH||undefined});
const url=process.env.ENGI_TEST_URL??'http://127.0.0.1:5174/engi/';
const reports=[];
try{
 for(const scenario of [{format:'choice',count:6},{format:'choice',count:60},{format:'choice',count:6,cpuRate:4}]){
  const {format,count,cpuRate=1}=scenario;
  const context=await browser.newContext({viewport:{width:393,height:852},hasTouch:true,isMobile:true}),page=await context.newPage();
  page.setDefaultTimeout(16000);
  try{
   await page.goto(url);await page.locator('.feed-home').waitFor();
   await page.evaluate(async count=>{
    const {db}=await import('/engi/src/db/engi-db.ts'),{putBundle}=await import('/engi/src/db/repositories.ts'),{resetLearningProgress}=await import('/engi/src/services/learning-service.ts'),{mediaStore}=await import('/engi/src/media/media-store.ts');
    const b={entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[],entityTypes:[{id:'subject',name:'Объект'},{id:'answer',name:'Ответ'}],properties:[{id:'rel',name:'Автор',valueKind:'entity',cardinality:'one',learnable:true,subjectTypes:['subject'],targetTypes:['answer']}]};
    for(let n=0;n<count;n++){
     b.entities.push({id:'s'+n,type:'subject',name:'Объект '+n,aliases:[],externalIds:{}},{id:'a'+n,type:'answer',name:'Автор '+n,aliases:[],externalIds:{}});
     b.facts.push({id:'f'+n,entityId:'s'+n,key:'rel',valueKind:'entity',valueEntityId:'a'+n,verification:'user_confirmed',source:{kind:'manual',name:'Test'}});
     const canvas=document.createElement('canvas');canvas.width=120;canvas.height=180;const ctx=canvas.getContext('2d');ctx.fillStyle=['red','blue','green','orange','purple','teal'][n];ctx.fillRect(0,0,120,180);
     const blob=await new Promise(resolve=>canvas.toBlob(resolve)),hash=(n+1).toString(16).padStart(64,'0');await mediaStore.put(hash,blob);
     b.media.push({id:'m'+n,entityId:'s'+n,role:'primary',primary:true,url:'engi-media://'+hash,license:'CC0'});
    }
    await putBundle(db,b);await resetLearningProgress(db);await db.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:10,accessibleRecall:true}});
   },count);
   await page.reload();await page.getByLabel('Формат',{exact:true}).selectOption(format);
   if(cpuRate!==1){const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpuRate});}
   await page.evaluate(async()=>{
    const {feedPerformance}=await import('/engi/src/services/feed-performance.ts');feedPerformance.start();
    window.introProbe={start:performance.now(),lastDone:performance.now(),samples:[]};
    let last='';window.introProbe.timer=setInterval(()=>{
     const current=document.querySelector('.feed-current');if(!current)return;
     const imgs=[...current.querySelectorAll('img')],buttons=[...current.querySelectorAll('.feed-option')];
     const sample={taskId:current.dataset.taskId,at:performance.now(),state:document.querySelector('.study-feed')?.className,imageReady:imgs.length>0&&imgs.every(i=>i.complete&&i.naturalWidth>0),buttonsReady:buttons.length>0&&buttons.every(b=>!b.disabled&&b.getClientRects().length>0),intervalPending:!!current.querySelector('.feed-learning-pause'),scrollTop:document.querySelector('.feed-viewport')?.scrollTop};
     const key=JSON.stringify({...sample,at:0});if(key!==last){last=key;window.introProbe.samples.push(sample);}
    },16);
   });
   await page.getByRole('button',{name:'Начать',exact:true}).tap();
   while(await page.locator('.feed-current').count()===0){
    const previous=await page.locator('#object-intro-heading').textContent();await page.evaluate(()=>window.introProbe.lastDone=performance.now());await page.getByRole('button',{name:'Готово',exact:true}).tap();
    await page.waitForFunction(old=>document.querySelector('.feed-current')||document.querySelector('#object-intro-heading')?.textContent!==old&&!document.querySelector('.learning22-primary')?.disabled,previous);
   }
   await page.locator('.study-feed.state-ready').waitFor();
   const first=await page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');return (await db.activeSessions.where('status').equals('active').toArray()).at(-1).tasks[0];});
   assert.equal(first.readyAt,undefined,'fresh training must have no artificial deadline');
   await page.waitForFunction(t=>{const images=[...document.querySelectorAll('.feed-current img')];return document.querySelector('.feed-current')?.dataset.taskId===t.id&&(!t.readyAt||Date.now()>=new Date(t.readyAt).getTime()+300)&&(t.recipe.cue!=='image'||images.length>0)&&images.every(i=>i.complete&&i.naturalWidth>0);},first);
   const candidates=page.locator('.feed-option,.matching-tile,.recall-thinking button,.recall-controls button');assert(await candidates.count());
   assert.equal(await candidates.first().isEnabled(),true,`${format}: first question must accept taps without scrolling`);
   assert.equal(await page.locator('.feed-learning-pause').count(),0);
   const initialScroll=await page.locator('.feed-viewport').evaluate(el=>el.scrollTop);assert.equal(initialScroll,0);
   const button=page.getByRole('button',{name:first.options.find(o=>o.id===first.items[0].answerId).name,exact:true}),box=await button.boundingBox();
   const hit=await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.closest('button')?.className,{x:box.x+box.width/2,y:box.y+box.height/2});assert(hit,`${format}: the visible button must receive touch hit testing`);
   await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
   await page.waitForFunction(id=>document.querySelector('.feed-current')?.dataset.taskId!==id&&document.querySelector('.study-feed.state-ready')&&[...document.querySelectorAll('.feed-option')].some(b=>!b.disabled),first.id);
   await page.waitForFunction(id=>window.introProbe.samples.some(s=>s.taskId!==id&&s.buttonsReady),first.id);
   const profile=await page.evaluate(async()=>{const {feedPerformance}=await import('/engi/src/services/feed-performance.ts');clearInterval(window.introProbe.timer);const {timer,...probe}=window.introProbe;return {...probe,performance:feedPerformance.report()};});
   const seen=profile.samples.find(s=>s.taskId===first.id),ready=profile.samples.find(s=>s.taskId===first.id&&s.buttonsReady),nextSeen=profile.samples.find(s=>s.taskId!==first.id),nextReady=profile.samples.find(s=>s.taskId!==first.id&&s.buttonsReady);
   reports.push({scenario,readyAt:first.readyAt,fromLastDoneToScreenMs:seen?.at-profile.lastDone,fromScreenToClickableMs:ready?.at-seen?.at,nextScreenToClickableMs:nextReady?.at-nextSeen?.at,profile});
   console.log(JSON.stringify(reports.at(-1)));
   console.log(`PASS first ${format} question accepts touch after introduction without scrolling`);
  }finally{await context.close();}
 }
 writeFileSync('artifacts/intro-readiness-profile.json',JSON.stringify(reports,null,2));
}finally{await browser.close();}
