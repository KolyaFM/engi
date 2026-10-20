import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,executablePath:process.env.ENGI_BROWSER_PATH}),context=await browser.newContext({viewport:{width:393,height:852},hasTouch:true,isMobile:true}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));const url=process.env.ENGI_TEST_URL??'http://127.0.0.1:5176/engi/';
async function mount(kind){await page.goto(url);await page.locator('.feed-home').waitFor();await page.evaluate(async kind=>{
 await import('/engi/src/components/study/study-feed.css');
 const R=await import('/engi/node_modules/.vite/deps/react.js'),C=await import('/engi/node_modules/.vite/deps/react-dom_client.js'),React=R.default??R,{createRoot}=C.default??C;const host=document.createElement('div');document.body.replaceChildren(host);const root=createRoot(host);window.probe={answers:[],done:[],root};
 if(kind==='intro'){const {ObjectIntroCard}=await import('/engi/src/components/study/ObjectIntroCard.tsx'),{canonicalTargets}=await import('/engi/src/lib/engi/questions/recipe-factory.ts');const bundle={entities:[{id:'e',name:'Большая карточка',type:'event',aliases:[],externalIds:{}}],facts:Array.from({length:18},(_,n)=>({id:'f'+n,entityId:'e',key:'p'+n,valueKind:'text',valueText:'Свойство '+n,verification:'user_confirmed',source:{kind:'manual',name:'Test'}})),properties:Array.from({length:18},(_,n)=>({id:'p'+n,name:'Свойство '+n,valueKind:'text',cardinality:'one',learnable:true,subjectTypes:['event']})),media:[],tags:[],entityTags:[],missing:[],unresolved:[]};const intro={entityId:'e',unitIds:canonicalTargets(bundle).map(i=>i.targetId),selections:{},newProperty:false};root.render(React.createElement(ObjectIntroCard,{bundle,intro,onChoose:async()=>{},onDone:async selections=>{window.probe.done.push(selections);await new Promise(r=>setTimeout(r,180))},onExit:()=>{}}));}
 else if(kind.startsWith('conveyor')){const {ConveyorCard}=await import('/engi/src/components/study/ConveyorCard.tsx');const task={id:'swipe-test',...(kind==='conveyor-boundary'?{contextual:{kind:'boundary',threshold:1800,supportTargetIds:[]}}:{}),recipe:{cue:'name'},items:Array.from({length:4},(_,n)=>({entityId:'e'+n,name:'Объект '+n,answerId:n%2?'right':'left'})),options:[{id:'left',name:kind==='conveyor-boundary'?'До 1800':'Франция'},{id:'right',name:kind==='conveyor-boundary'?'С 1800':'США'}]};root.render(React.createElement('main',{className:'study-feed'},React.createElement('div',{className:'feed-viewport'},React.createElement(ConveyorCard,{task,busy:false,onPair:async(pair,id)=>{window.probe.answers.push({...pair,id});await new Promise(r=>setTimeout(r,100));if(window.probe.failNext){window.probe.failNext=false;throw Error('Temporary save failure')}return {correct:window.probe.correct??true,complete:false}},onComplete:()=>{},onMediaReady:()=>{},onMediaFail:()=>{}}))));}
 else if(kind==='recall'){const {RecallRevealCard}=await import('/engi/src/components/study/RecallRevealCard.tsx');root.render(React.createElement('main',{className:'study-feed'},React.createElement('div',{className:'feed-viewport'},React.createElement(RecallRevealCard,{task:{id:'recall-test',recipe:{label:'Вспомните'},items:[{answer:'Ответ'}]},cue:React.createElement('h1',null,'Объект'),draft:{revealed:true},paused:false,busy:false,reducedMotion:false,accessible:false,onPersist:async()=>{},onSubmit:v=>window.probe.answers.push(v)}))));}
 else{const {DayPlanPanel}=await import('/engi/src/components/study/DayPlanPanel.tsx'),{dayBoundary}=await import('/engi/src/lib/engi/study-core/day-plan.ts');window.probe.render=n=>root.render(React.createElement(DayPlanPanel,{inline:true,plan:{...dayBoundary(new Date()),newBudget:10,newTarget:0,newGoalIds:[],repeat:[],reinforce:[],processedAttemptIds:[],scopeLabel:'Test',mistakes:Array.from({length:n},(_,i)=>({id:'m'+i})),workload:{learning:1,repeat:0}}}));window.probe.render(3);}
 },kind);}
async function touch(points){const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[points[0]]});for(const p of points.slice(1)){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[p]});await page.waitForTimeout(20);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}
async function pointer(selector,type,props={}){await page.locator(selector).dispatchEvent(type,{pointerType:'touch',pointerId:1,isPrimary:true,button:0,clientX:150,clientY:250,...props});}
async function interruptions(kind,selector){
 await mount(kind);await page.locator(selector).waitFor();
 // A secondary pointer cannot finish the owner's swipe even if its down was outside this surface.
 await pointer(selector,'pointerdown');await pointer(selector,'pointermove',{clientX:250});await page.waitForTimeout(30);
 await pointer(selector,'pointerup',{pointerId:2,isPrimary:false,clientX:300});
 assert.equal(await page.evaluate(()=>window.probe.answers.length+window.probe.done.length),0,kind+': foreign pointer must not submit');
 await pointer(selector,'pointercancel');
 for(const interrupt of ['second','lost','blur','cancel']){
  await pointer(selector,'pointerdown');await pointer(selector,'pointermove',{clientX:230});await page.waitForTimeout(30);
  if(interrupt==='second')await page.locator('body').dispatchEvent('pointerdown',{pointerType:'touch',pointerId:2,isPrimary:false,button:0,clientX:320,clientY:40});
  if(interrupt==='lost')await pointer(selector,'lostpointercapture');
  if(interrupt==='blur')await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  if(interrupt==='cancel')await pointer(selector,'pointercancel');
  await pointer(selector,'pointerup',{clientX:320});
  await page.locator('body').dispatchEvent('pointerup',{pointerType:'touch',pointerId:2,isPrimary:false});
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(()=>window.probe.answers.length+window.probe.done.length),0,kind+': '+interrupt+' must not submit');
  assert(Math.abs(await page.locator(selector).evaluate(el=>new DOMMatrix(getComputedStyle(el.querySelector('.learning22-card-sheet')??el).transform).m41))<1,kind+': '+interrupt+' must reset');
 }
 await pointer(selector,'pointerdown',{clientX:8});await pointer(selector,'pointermove',{clientX:200});await pointer(selector,'pointerup',{clientX:300});
 assert.equal(await page.evaluate(()=>window.probe.answers.length+window.probe.done.length),0,kind+': screen edge belongs to browser');
 // Safari may omit the end of an edge navigation gesture. A fresh primary touch must recover.
 await pointer(selector,'pointerdown',{pointerId:7,clientX:8});
 await pointer(selector,'pointerdown',{pointerId:9,clientX:150});await pointer(selector,'pointermove',{pointerId:9,clientX:200});await page.waitForTimeout(30);
 assert(Math.abs(await page.locator(selector).evaluate(el=>new DOMMatrix(getComputedStyle(el.querySelector('.learning22-card-sheet')??el).transform).m41))>20,kind+': recover without previous pointerup');
 await pointer(selector,'pointercancel',{pointerId:9});
 // The next real touch still works after all cancellations.
 const cdp=await context.newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:160,y:250}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:220,y:250}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:220,y:250},{id:2,x:300,y:270}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:280,y:250},{id:2,x:340,y:270}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();await page.waitForTimeout(300);
 assert.equal(await page.evaluate(()=>window.probe.answers.length+window.probe.done.length),0,kind+': multitouch must cancel');
 const box=await page.locator(selector).boundingBox(),x=box.x+box.width/2,y=kind==='intro'?250:box.y+box.height/2;
 await touch([{x,y},{x:x+30,y},{x:x+100,y},{x:x+140,y}]);
 await page.waitForFunction(()=>window.probe.answers.length+window.probe.done.length===1);
}
try{
 await interruptions('intro','.learning22-screen');await interruptions('conveyor','.conveyor-object');await interruptions('recall','.recall-swipe');
 await mount('intro');await page.locator('.learning22-scroll').waitFor();await touch([{x:170,y:500},{x:180,y:450},{x:183,y:350},{x:190,y:280}]);assert(await page.locator('.learning22-scroll').evaluate(el=>el.scrollTop)>100);assert.equal(await page.evaluate(()=>window.probe.done.length),0);await page.waitForTimeout(1000);const before=await page.locator('.learning22-scroll').evaluate(el=>el.scrollTop);await touch([{x:100,y:370},{x:125,y:375},{x:190,y:395},{x:260,y:415}]);await page.waitForFunction(()=>window.probe.done.length===1);assert.equal(await page.locator('.learning22-scroll').evaluate(el=>el.scrollTop),before);assert(Object.values(await page.evaluate(()=>window.probe.done[0])).every(v=>v==='green'));await page.waitForTimeout(250);assert(await page.locator('.learning22-card-sheet').evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).m41)>300);
 await mount('intro');await page.locator('.learning22-screen').waitFor();await touch([{x:280,y:250},{x:250,y:254},{x:180,y:262},{x:110,y:280}]);await page.waitForFunction(()=>window.probe.done.length===1);assert(Object.values(await page.evaluate(()=>window.probe.done[0])).every(v=>v==='red'));
 await mount('conveyor');await page.locator('.conveyor-object').waitFor();for(const side of [0,1,0,1]){const node=page.locator('.conveyor-object'),id=await node.getAttribute('data-conveyor-id'),box=await node.boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;await touch([{x,y},{x:x+(side?25:-25),y:y+4},{x:x+(side?80:-80),y:y+20},{x:x+(side?135:-135),y:y+35}]);await page.waitForFunction(old=>document.querySelector('.conveyor-object')?.dataset.conveyorId!==old,id);}
 assert.deepEqual(await page.evaluate(()=>window.probe.answers.map(a=>a.answerId)),['left','right','left','right']);
 for(const kind of ['conveyor','conveyor-boundary']){
  await mount(kind);await page.locator('.conveyor-object').waitFor();
  const objectBox=await page.locator('.conveyor-object').boundingBox(),buttonsBox=await page.locator('.conveyor-categories').boundingBox();assert(buttonsBox.y>=objectBox.y+objectBox.height,'choices must sit below the object');
  for(const wrongSide of [1,0]){
   const node=page.locator('.conveyor-object'),id=await node.getAttribute('data-conveyor-id'),box=await node.boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;
   await page.evaluate(()=>window.probe.correct=false);
   await touch([{x,y},{x:x+(wrongSide?35:-35),y:y+4},{x:x+(wrongSide?135:-135),y:y+12}]);
   await page.locator('.conveyor-object.wrong').waitFor();await page.waitForTimeout(350);assert.equal(await node.getAttribute('data-conveyor-id'),id,'wrong swipe must not advance');
   assert.equal(await page.locator('.conveyor-status').count(),0,'no wrong-answer caption');assert.equal(await page.locator('.feed-conveyor .matching-help').count(),0,'no instruction paragraph');assert.equal(await page.locator('.conveyor-category.incorrect').count(),1);assert.equal(await page.locator('.conveyor-category.correct').count(),1);
   assert.equal(await page.locator('.conveyor-category.incorrect').getAttribute('aria-invalid'),'true');
   assert(await node.evaluate(el=>Math.abs(new DOMMatrix(getComputedStyle(el).transform).m41)<2),'rejected card returns to its place');
   await page.evaluate(()=>window.probe.correct=true);await page.locator('.conveyor-category').nth(1-wrongSide).click();
   await page.waitForFunction(old=>document.querySelector('.conveyor-object')?.dataset.conveyorId!==old,id);assert.equal(await page.locator('.conveyor-category.incorrect').count(),0);
  }
  await page.evaluate(()=>window.probe.failNext=true);const id=await page.locator('.conveyor-object').getAttribute('data-conveyor-id');
  await page.locator('.conveyor-category').first().click();await page.getByText('Не удалось сохранить ответ. Попробуйте ещё раз.',{exact:true}).waitFor();assert.equal(await page.locator('.conveyor-object').getAttribute('data-conveyor-id'),id);
  const failed=await page.evaluate(()=>window.probe.answers.at(-1).id);await page.locator('.conveyor-category').first().click();await page.waitForFunction(old=>document.querySelector('.conveyor-object')?.dataset.conveyorId!==old,id);assert.equal(await page.evaluate(()=>window.probe.answers.at(-1).id),failed,'failed writes retry the same receipt');
 }
 await mount('counter');await page.getByLabel('Неразобранные ошибки: 3',{exact:true}).waitFor();await page.evaluate(()=>window.probe.render(2));await page.getByLabel('Неразобранные ошибки: 2',{exact:true}).waitFor();assert(await page.getByLabel('Неразобранные ошибки: 2',{exact:true}).evaluate(el=>el.getAnimations().length)>0);await page.evaluate(()=>window.probe.render(0));await page.getByLabel('Неразобранные ошибки: 0',{exact:true}).waitFor();assert(await page.getByLabel('Неразобранные ошибки: 0',{exact:true}).evaluate(el=>el.getAnimations().length)>0);await context.clearCookies();assert.deepEqual(errors,[]);console.log('PASS interrupted gestures, second finger, foreign pointer, capture loss, blur, cancellation, screen edges, recovery; touch scroll/swipe direction lock, both intro sides, both conveyor sides, no return after accepted swipe, wrong category/boundary swipes retain their card, choices below card, write retry, error badge animation including zero');
}finally{await context.close();await browser.close();}
