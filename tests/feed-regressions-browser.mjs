import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
import {ZipReader,BlobReader,TextWriter,configure} from '@zip.js/zip.js';
configure({useWebWorkers:false});
const packs=[];
for(const path of process.argv.slice(2)){
 const reader=new ZipReader(new BlobReader(new Blob([await readFile(path)])));
 try{const entry=(await reader.getEntries()).find(e=>e.filename==='bundle.json');assert(entry&&!entry.directory);packs.push(JSON.parse(await entry.getData(new TextWriter())));}finally{await reader.close();}
}
await mkdir('artifacts/feed-regressions',{recursive:true});
const url=process.env.ENGI_TEST_URL??'http://127.0.0.1:5173/engi/';
for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true}),context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 async function swipe(side,y){
  const points=[{x:196,y},{x:196+side*25,y:y+2},{x:196+side*70,y:y+4},{x:196+side*140,y:y+8}];
  if(engine===chromium){const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[points[0]]});for(const p of points.slice(1)){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[p]});await page.waitForTimeout(35);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}
  else{await page.evaluate(async points=>{const target=document.elementFromPoint(points[0].x,points[0].y);for(let n=0;n<points.length;n++){target.dispatchEvent(new PointerEvent(n?'pointermove':'pointerdown',{bubbles:true,pointerId:19,isPrimary:true,pointerType:'touch',button:0,buttons:1,clientX:points[n].x,clientY:points[n].y}));await new Promise(r=>setTimeout(r,35));}target.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:19,isPrimary:true,pointerType:'touch',button:0,clientX:points.at(-1).x,clientY:points.at(-1).y}));},points);}
 }
 try{
  await page.goto(url);await page.locator('.feed-home').waitFor();
  if(packs.length&&engine===chromium){
   const report=await page.evaluate(async packs=>{
    const {parseV3}=await import('/engi/src/lib/engi/import/schema-v3.ts'),{buildImportPlan}=await import('/engi/src/lib/engi/import/semantic-merge.ts');
    const {recipes,eligible}=await import('/engi/src/lib/engi/questions/recipe-factory.ts'),{composeUnit,compositionContext}=await import('/engi/src/lib/engi/session/composer.ts'),{triagedMemory}=await import('/engi/src/lib/engi/learning/bootstrap.ts');
    const report=[];
    for(let n=0;n<packs.length;n++){
     const pkg=parseV3(packs[n]),media=Object.fromEntries(pkg.entities.flatMap(e=>e.images.map(i=>[i.file,'https://example.test/'+i.file])));
     const {bundle:b}=buildImportPlan(pkg,{entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[]},media,'browser-pack-'+n),ctx=compositionContext(b);
     const numeric=recipes(b).filter(r=>!r.tag&&r.format==='choice'&&r.direction==='forward'&&b.properties.some(p=>p.id===r.answerKey&&['date','number'].includes(p.valueKind)));
     const properties=[];
     for(const r of numeric){
      const pool=eligible(b,r),history=[],samples=[];
      for(let j=0;j<12;j++){const item=pool[j%pool.length],m=triagedMemory(item,'red','test',0),task=composeUnit(b,m,'all','choice',structuredClone(history),ctx);if(!task)throw Error('No numeric task');if(!task.numericChoiceMode)throw Error('Numeric property did not enable nearby answers');if(j&&task.numericChoiceMode===history.at(-1).numericChoiceMode)throw Error('Numeric modes did not alternate');if(task.numericChoiceMode==='nearby'&&!task.options.every(o=>Math.abs(Number(o.name)-Number(item.answer))<=3))throw Error('Neighbour out of range');history.push(task);samples.push({mode:task.numericChoiceMode,answer:task.items[0].answer,options:task.options.map(o=>o.name)});}
      properties.push({name:b.properties.find(p=>p.id===r.answerKey).name,samples});
     }
     if(!properties.length)throw Error('No numeric choice properties in '+pkg.name);
     report.push({pack:pkg.name,properties});
    }
    return report;
   },packs);
   await writeFile('artifacts/feed-regressions/real-pack-numbers.json',JSON.stringify(report,null,2));
   console.log('PASS real packs: '+report.map(r=>r.properties.length+' numeric properties').join(', '));
  }
  await page.evaluate(async()=>{
   const R=await import('/engi/node_modules/.vite/deps/react.js'),C=await import('/engi/node_modules/.vite/deps/react-dom_client.js'),React=R.default??R,{createRoot}=C.default??C;
   const {StudyFeed}=await import('/engi/src/components/study/StudyFeed.tsx');
   // Use the same service module URL as the component, including Vite's HMR version.
   const source=await(await fetch('/engi/src/components/study/StudyFeed.tsx')).text(),servicePath=source.match(/from\s*["']([^"']*services\/trainer-service\.ts[^"']*)["']/)[1];
   const {trainerService}=await import(servicePath);
   const image='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="240"><rect width="200" height="240" fill="lavender"/></svg>');
   const task=n=>({id:'recall-'+n,recipe:{id:'r',format:'recall_reveal',cue:n%2?'name':'image',answerKey:'identity',memoryKey:'identity',diagnostic:false,prompt:'Кто это?'},items:[{entityId:'e'+n,name:'Объект '+n,answer:'Ответ '+n,answerId:'e'+n,targetId:'u'+n,aliases:[],sourceUrl:'',...(n%2?{}:{image})}],options:[],reason:'due'});
   const session={id:'isolated-recall-feed',tasks:[task(0)],currentPosition:0,status:'active',format:'recall_reveal',interaction:{taskId:'recall-0',revealed:true,recallElapsedMs:5000,attemptSequence:[]}};
   window.feedProbe={answers:[],session};
   window.feedEvents=[];for(const name of ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture'])document.addEventListener(name,e=>{window.feedEvents.push({event:name,x:e.clientX,y:e.clientY,target:e.target.className,ready:document.querySelector('.recall-swipe')?.className});});
   trainerService.getFeedback=async()=>null;trainerService.preloadMedia=async()=>[];trainerService.observeVisibility=async()=>{};
   trainerService.saveInteraction=async(_sid,id,delta)=>({taskId:id,attemptSequence:[],...delta});
   trainerService.answer=async input=>{window.feedProbe.answers.push(input.answer);return {feedback:{score:input.answer?1:0}}};
   trainerService.advanceFeed=async()=>{const n=window.feedProbe.answers.length;return {...session,tasks:[task(n)],interaction:{taskId:'recall-'+n,revealed:true,recallElapsedMs:5000,attemptSequence:[]}}};
   document.querySelector('#root').style.display='none';const host=document.createElement('div');document.body.append(host);createRoot(host).render(React.createElement(StudyFeed,{initial:session,onExit:()=>{}}));
  });
  for(const [n,side] of [1,-1,1,-1].entries()){
   await page.locator('.study-feed.state-ready .recall-swipe.is-swipe-ready').waitFor();
   await page.waitForTimeout(300);
   // This blank area is inside the game viewport, below the visible question.
   const surface=await page.evaluate(()=>document.elementFromPoint(196,700)?.closest('.recall-swipe')!==null);
   assert(surface,'the blank lower half must belong to the swipe surface');
   await swipe(side,[220,700,700,220][n]);
   await page.waitForFunction(n=>window.feedProbe.answers.length===n,n+1);
   await page.waitForFunction(n=>document.querySelector('.feed-current')?.dataset.taskId==='recall-'+n,n+1);
  }
  assert.deepEqual(await page.evaluate(()=>window.feedProbe.answers),[true,false,true,false]);
  await page.locator('.study-feed.state-ready .recall-swipe.is-swipe-ready').waitFor();await page.waitForTimeout(300);
  await page.screenshot({path:`artifacts/feed-regressions/recall-${engine.name()}.png`});
  assert.deepEqual(errors,[]);console.log('PASS '+engine.name()+': full feed recall, image/text, both swipe directions, repeated tasks, lower-screen gestures');
 }catch(e){await page.screenshot({path:`artifacts/feed-regressions/failure-${engine.name()}.png`});console.error(engine.name(),JSON.stringify(await page.evaluate(()=>({answers:window.feedProbe?.answers,events:window.feedEvents,state:document.querySelector('.study-feed')?.className,card:document.querySelector('.recall-swipe')?.outerHTML,errors:[...document.querySelectorAll('.feed-error')].map(e=>e.textContent)}))));throw e;}finally{await context.close();await browser.close();}
}
