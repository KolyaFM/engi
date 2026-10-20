import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
await mkdir('artifacts/guided-intervals',{recursive:true});
for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true}),context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(process.env.ENGI_TEST_URL??'http://127.0.0.1:5173/engi/');await page.locator('.feed-home').waitFor();
  await page.evaluate(async()=>{
   await import('/engi/src/components/study/interval-exercises.css');const R=await import('/engi/node_modules/.vite/deps/react.js'),C=await import('/engi/node_modules/.vite/deps/react-dom_client.js'),React=R.default??R,{createRoot}=C.default??C;
   const {IntervalBandsCard}=await import('/engi/src/components/study/IntervalBandsCard.tsx'),{buildIntervalScale}=await import('/engi/src/lib/engi/questions/interval-scale.ts');
   const data=[['Джон Кеннеди','Президентство',1961,1963],['СССР','Период существования',1922,1991],['Война во Вьетнаме','Даты события',1955,1975],['Джон Кеннеди','Работа в Сенате',1953,1960],['Вторая мировая война','Даты события',1939,1945]];
   const scale=buildIntervalScale(data.map((d,n)=>({id:'b'+n,start:d[2],end:d[3]})),'dated',300),items=data.map(([name,propertyLabel,start,end],n)=>({entityId:n===3?'e0':'e'+n,name,targetId:'target'+n,factId:'f'+n,interval:{start,end,propertyLabel,propertyId:'p'+n},answerId:'b'+n,answer:String(n),aliases:[],sourceUrl:''}));
   document.querySelector('#root').style.display='none';const host=document.createElement('main');host.className='guided-test-host';host.style.cssText='height:100dvh;max-width:620px;margin:auto;padding:16px;box-sizing:border-box;background:#f7f4ee';document.body.append(host);const root=createRoot(host);
   window.probe={task:{id:'guided',recipe:{id:'r',format:'match',cue:'name',answerKey:'p0',memoryKey:'p0',diagnostic:false},intervalExercise:{kind:'bands',interaction:'quiz',scale},items,options:scale.bands.map(b=>({id:b.id,name:b.marker})),reason:'context'},progress:{matched:{},history:[]},completed:0,mount:0};
   window.renderGuided=()=>root.render(React.createElement(IntervalBandsCard,{key:window.probe.mount,task:window.probe.task,progress:window.probe.progress,busy:false,onMediaReady:()=>{},onMediaFail:()=>{},onComplete:()=>window.probe.completed++,onPair:async(pair,id)=>{const p=window.probe,item=p.task.items.find(i=>i.targetId===pair.responseKey),correct=item?.answerId===pair.answerId;if(correct)p.progress={...p.progress,matched:{...p.progress.matched,[pair.responseKey]:pair.answerId}};window.renderGuided();return {correct,complete:Object.keys(p.progress.matched).length===p.task.items.length};}}));window.renderGuided();
  });
  await page.getByRole('heading',{name:'Какой это период?'}).waitFor();assert.equal(await page.locator('.interval-chart button').count(),0);
  assert.equal(await page.locator('.interval-answer').count(),5);assert.equal(await page.locator('.interval-band-row').count(),5);
  assert((await page.locator('.interval-chart').boundingBox()).height<240);assert(await page.locator('.interval-current-years').innerText()==='1961–1963');
  await page.getByRole('button',{name:'СССР — Период существования',exact:true}).click();await page.getByRole('status').filter({hasText:'Попробуйте ещё раз'}).waitFor();assert.equal(await page.locator('.interval-current-years').innerText(),'1961–1963');
  await page.getByRole('button',{name:'Джон Кеннеди — Президентство',exact:true}).click();await page.locator('.interval-found-row').waitFor();assert.equal(await page.locator('.interval-answer').count(),4);assert.equal(await page.locator('.interval-current-years').innerText(),'1922–1991');
  await page.waitForTimeout(220);await page.screenshot({path:`artifacts/guided-intervals/${engine.name()}-five.png`});
  await page.setViewportSize({width:852,height:393});await page.evaluate(()=>{window.probe.mount++;window.renderGuided();});assert.equal(await page.locator('.interval-found-row').count(),1);assert.equal(await page.locator('.interval-current-years').innerText(),'1922–1991');
  await page.setViewportSize({width:393,height:852});
  for(const name of ['СССР — Период существования','Война во Вьетнаме — Даты события','Джон Кеннеди — Работа в Сенате','Вторая мировая война — Даты события'])await page.getByRole('button',{name,exact:true}).click();
  await page.getByRole('button',{name:'Продолжить',exact:true}).waitFor();await page.waitForTimeout(1100);assert.equal(await page.evaluate(()=>window.probe.completed),0,'completion must wait for the player');assert.equal(await page.locator('.interval-found-row').count(),5);
  await page.screenshot({path:`artifacts/guided-intervals/${engine.name()}-complete.png`});await page.getByRole('button',{name:'Продолжить',exact:true}).click();assert.equal(await page.evaluate(()=>window.probe.completed),1);
  await page.setViewportSize({width:320,height:568});await page.screenshot({path:`artifacts/guided-intervals/${engine.name()}-small.png`});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const tickBoxes=await page.locator('.interval-axis>span').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right};}));assert(tickBoxes.every((r,n)=>!n||r.left>=tickBoxes[n-1].right+2),'axis years must not collide on small phones');
  await page.setViewportSize({width:1440,height:900});await page.screenshot({path:`artifacts/guided-intervals/${engine.name()}-desktop.png`});assert((await page.locator('.interval-chart').boundingBox()).width<=620);
  await page.setViewportSize({width:393,height:852});await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(()=>{const p=window.probe;p.task={...p.task,id:'three',items:p.task.items.slice(0,3),intervalExercise:{...p.task.intervalExercise,scale:{...p.task.intervalExercise.scale,bands:p.task.intervalExercise.scale.bands.filter(b=>['b0','b1','b2'].includes(b.id))}}};p.progress={matched:{},history:[]};p.mount++;window.renderGuided();});
  const keyboardChoice=page.getByRole('button',{name:'Джон Кеннеди — Президентство',exact:true});await keyboardChoice.waitFor();assert.equal(await page.locator('.interval-band-row').count(),3);await keyboardChoice.focus();await keyboardChoice.press('Enter');await page.locator('.interval-found-row').waitFor();
  await page.evaluate(()=>{window.probe.task.items[1].interval.propertyLabel='Очень длинное пользовательское название периода существования государства';window.renderGuided();});
  await page.screenshot({path:`artifacts/guided-intervals/${engine.name()}-three.png`});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);console.log('PASS '+engine.name()+': five mixed periods, guided retry, persistent fact labels, rotation/remount, explicit Continue, small/desktop layout');
 }finally{await context.close();await browser.close();}
}
