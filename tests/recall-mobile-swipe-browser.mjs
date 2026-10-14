import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,executablePath:process.env.ENGI_BROWSER_PATH});
const context=await browser.newContext({viewport:{width:393,height:852},hasTouch:true,isMobile:true}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(5000);
async function mount({revealed=true,tall=false,paused=false,busy=false}={}){
 await page.goto(process.env.ENGI_TEST_URL??'http://127.0.0.1:5173/engi/');await page.locator('.feed-home').waitFor();
 await page.evaluate(async props=>{
  await import('/engi/src/components/study/study-feed.css');
  const R=await import('/engi/node_modules/.vite/deps/react.js'),C=await import('/engi/node_modules/.vite/deps/react-dom_client.js'),React=R.default??R,{createRoot}=C.default??C;
  const {RecallRevealCard}=await import('/engi/src/components/study/RecallRevealCard.tsx');
  document.querySelector('#root').style.display='none';const host=document.createElement('div');document.body.append(host);const root=createRoot(host);window.recallProbe={answers:[],cancelled:0};
  document.addEventListener('pointercancel',()=>window.recallProbe.cancelled++);
  const cue=React.createElement('div',{className:'feed-cue',style:{height:props.tall?1000:280,maxHeight:'none'}},React.createElement('h1',null,'Объект для воспоминания'));
  root.render(React.createElement('main',{className:'study-feed'},React.createElement('div',{className:'feed-viewport'},React.createElement('div',{className:'feed-current'},React.createElement(RecallRevealCard,{task:{id:'recall-mobile',recipe:{prompt:'Что вы вспомнили?'},items:[{answer:'Ответ'}]},cue,draft:{revealed:props.revealed},paused:props.paused,busy:props.busy,reducedMotion:false,accessible:false,onPersist:async()=>{},onSubmit:v=>window.recallProbe.answers.push(v)})))));
 },{revealed,tall,paused,busy});await page.locator('.recall-swipe').waitFor();
}
async function touch(points){const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[points[0]]});for(const point of points.slice(1)){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point]});await page.waitForTimeout(35);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}
try{
 // A horizontal gesture curves downward. Once horizontal intent is established,
 // the browser must not steal it to scroll/cancel before the finger is released.
 for(const side of [-1,1]){
  await mount({tall:true});const x=196,y=250;
  await touch([{x,y},{x:x+side*10,y:y+2},{x:x+side*40,y:y+45},{x:x+side*135,y:y+100}]);
  const state=await page.evaluate(()=>window.recallProbe);assert.deepEqual(state.answers,[side===1],JSON.stringify(state));assert.equal(await page.locator('.feed-viewport').evaluate(el=>el.scrollTop),0,'horizontal swipe must not scroll');
 }
 await mount({tall:true});await touch([{x:190,y:550},{x:194,y:510},{x:200,y:400},{x:202,y:300}]);assert(await page.locator('.feed-viewport').evaluate(el=>el.scrollTop)>150);assert.deepEqual(await page.evaluate(()=>window.recallProbe.answers),[]);
 await page.waitForTimeout(1000);const scroll=await page.locator('.feed-viewport').evaluate(el=>el.scrollTop);await touch([{x:196,y:250},{x:226,y:255},{x:285,y:270},{x:336,y:300}]);assert.deepEqual(await page.evaluate(()=>window.recallProbe.answers),[true]);assert.equal(await page.locator('.feed-viewport').evaluate(el=>el.scrollTop),scroll);
 for(const options of [{revealed:false},{paused:true},{busy:true}]){await mount(options);await touch([{x:196,y:250},{x:240,y:254},{x:330,y:270}]);assert.deepEqual(await page.evaluate(()=>window.recallProbe.answers),[]);}
 await mount();await touch([{x:196,y:250},{x:210,y:251},{x:220,y:252}]);assert.deepEqual(await page.evaluate(()=>window.recallProbe.answers),[]);
 assert.deepEqual(errors,[]);console.log('PASS recall mobile: curved touch swipes both ways, scroll, swipe after scroll, disabled states and short gestures.');
}finally{await context.close();await browser.close();}
