import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const url=process.env.ENGI_TEST_URL??'http://127.0.0.1:5182/engi/';
const browser=await chromium.launch({headless:true,executablePath:process.env.ENGI_BROWSER_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const cases=[];
function check(name,run){cases.push({name,run})}
async function mount(page,{failReveal=false,elapsed=0}={}){
 await page.goto(url);
 await page.clock.install({time:new Date('2026-10-06T12:00:00Z')});
 await page.clock.pauseAt(new Date('2026-10-06T12:00:01Z'));
 await page.evaluate(async({failReveal,elapsed})=>{
  const reactModule=await import('/engi/node_modules/.vite/deps/react.js');const React=reactModule.default??reactModule;
  const clientModule=await import('/engi/node_modules/.vite/deps/react-dom_client.js');const {createRoot}=clientModule.default??clientModule;
  const {RecallRevealCard}=await import('/engi/src/components/study/RecallRevealCard.tsx');
  const host=document.createElement('div');document.body.replaceChildren(host);
  window.__recall={writes:[],grades:[],failReveal,paused:false,busy:false};
  const root=createRoot(host);
  const task={id:'isolated-recall',recipe:{label:'Вспомните ответ'},items:[{answer:'Проверенный ответ'}]};
  window.__renderRecall=()=>root.render(React.createElement(RecallRevealCard,{task,cue:null,draft:{recallElapsedMs:elapsed},paused:window.__recall.paused,busy:window.__recall.busy,reducedMotion:true,accessible:true,onPersist:async delta=>{window.__recall.writes.push(delta);if(delta.revealed&&window.__recall.failReveal){window.__recall.failReveal=false;throw Error('Temporary write failure')}},onSubmit:value=>window.__recall.grades.push(value)}));
  window.__renderRecall();
 },{failReveal,elapsed});
 await page.locator('.recall-thinking').waitFor();
}
async function state(page){return page.evaluate(()=>window.__recall)}
async function reveal(page){await page.getByRole('button',{name:'Показать сейчас',exact:true}).click();await page.locator('.revealed-answer').waitFor()}
async function swipe(page,dx){const box=await page.locator('.recall-swipe').boundingBox();const x=box.x+box.width/2,y=box.y+20;await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx,y,{steps:12});await page.mouse.up()}

check('Early reveal freezes actual elapsed, never grades, and swipe grades only after reveal',async page=>{
 await mount(page);await swipe(page,150);assert.deepEqual((await state(page)).grades,[]);
 await page.clock.runFor(1234);await reveal(page);
 const before=await state(page),delta=before.writes.find(v=>v.revealed);
 assert.deepEqual(delta,{revealed:true,earlyReveal:true,recallElapsedMs:1234});assert.deepEqual(before.grades,[]);
 await page.clock.runFor(9000);assert.deepEqual((await state(page)).writes,before.writes);
 await swipe(page,-150);assert.deepEqual((await state(page)).grades,[false]);
});
check('Automatic reveal still takes exactly five seconds and requires a grade',async page=>{
 await mount(page);await page.clock.runFor(4999);assert.equal(await page.locator('.revealed-answer').count(),0);
 await page.clock.runFor(1);await page.locator('.revealed-answer').waitFor();
 assert.deepEqual((await state(page)).writes.find(v=>v.revealed),{revealed:true,recallElapsedMs:5000});assert.deepEqual((await state(page)).grades,[]);
});
check('Early reveal write failure retries its original elapsed and early flag',async page=>{
 await mount(page,{failReveal:true});await page.clock.runFor(1234);await page.getByRole('button',{name:'Показать сейчас'}).click();
 assert.equal(await page.locator('.revealed-answer').count(),0);await page.clock.runFor(500);await page.locator('.revealed-answer').waitFor();
 const writes=(await state(page)).writes.filter(v=>v.revealed);assert.equal(writes.length,2);assert.deepEqual(writes[0],writes[1]);assert.equal(writes[1].recallElapsedMs,1234);assert.equal(writes[1].earlyReveal,true);
});
check('Pause, hidden time, and busy interactions preserve the remaining active time',async page=>{
 await mount(page,{elapsed:1000});await page.clock.runFor(734);
 await page.evaluate(()=>{window.__recall.paused=true;window.__renderRecall()});assert(await page.getByRole('button',{name:'Показать сейчас'}).isDisabled());await page.clock.runFor(10000);
 assert.equal(await page.locator('.revealed-answer').count(),0);
 await page.evaluate(()=>{window.__recall.paused=false;window.__renderRecall()});await page.clock.runFor(100);
 await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'))});await page.clock.runFor(10000);
 await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});document.dispatchEvent(new Event('visibilitychange'))});
 await reveal(page);assert.equal((await state(page)).writes.find(v=>v.revealed).recallElapsedMs,1834);
});
check('Busy blocks early reveal and grading',async page=>{
 await mount(page);await page.evaluate(()=>{window.__recall.busy=true;window.__renderRecall()});
 assert(await page.getByRole('button',{name:'Показать сейчас'}).isDisabled());await page.clock.runFor(1000);
 await page.evaluate(()=>{window.__recall.busy=false;window.__renderRecall()});await reveal(page);
 await page.evaluate(()=>{window.__recall.busy=true;window.__renderRecall()});await swipe(page,150);
 assert.deepEqual((await state(page)).grades,[]);assert(await page.getByRole('button',{name:'Вспомнил',exact:true}).isDisabled());
});
let failed=0;
try{for(const {name,run} of cases){const page=await browser.newPage({viewport:{width:393,height:852}});page.setDefaultTimeout(2500);try{await run(page);console.log('PASS '+name)}catch(error){failed++;console.error('FAIL '+name+'\n'+error.stack)}finally{await page.close()}}}finally{await browser.close()}
if(failed)process.exitCode=1;



