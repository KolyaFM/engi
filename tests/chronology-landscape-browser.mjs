import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({headless:true,executablePath:process.env.ENGI_BROWSER_PATH}),page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));await mkdir('artifacts/chronology-landscape',{recursive:true});
async function mount(count,image){
 await page.goto(process.env.ENGI_TEST_URL??'http://127.0.0.1:5173/engi/');await page.locator('.feed-home').waitFor();
 await page.evaluate(async({count,image})=>{
  await import('/engi/src/components/study/study-feed.css');const R=await import('/engi/node_modules/.vite/deps/react.js'),C=await import('/engi/node_modules/.vite/deps/react-dom_client.js'),React=R.default??R,{createRoot}=C.default??C,{SortChallengeCard}=await import('/engi/src/components/study/SortChallengeCard.tsx');
  const host=document.createElement('div');document.body.replaceChildren(host);const root=createRoot(host);window.persisted=[];
  const items=Array.from({length:count},(_,n)=>({entityId:'e'+n,name:'Событие '+(n+1),year:1800+n*10,image:image?'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${n%2?320:160}" height="${n%2?180:280}"><rect width="100%" height="100%" fill="${n%2?'#bcadc9':'#acc8bb'}"/></svg>`):undefined}));
  const task={id:'orientation',recipe:{format:'sort',cue:image?'image':'name'},items,options:[]};
  function Screen({feedback}){return React.createElement('main',{className:'study-feed'},React.createElement('header',{className:'feed-header'},'Хронология'),React.createElement('div',{className:'feed-viewport has-chronology'},React.createElement('div',{className:'feed-current'},React.createElement('div',{className:'feed-task-content'},React.createElement('div',{className:'feed-question'},React.createElement('div',{className:'feed-actions'},React.createElement('div',{className:'sort-heading'},React.createElement('h2',null,'Хронология')),React.createElement(SortChallengeCard,{task,busy:false,feedback,onPersist:(order,checked,dirty)=>window.persisted.push({order,checked,dirty}),onSubmit:order=>{window.submitted=order;root.render(React.createElement(Screen,{feedback:{score:1,chosen:order}}));},onNext:()=>{}})))))));}
  root.render(React.createElement(Screen,{}));
 },{count,image});await page.locator('.chronology-horizontal').waitFor();await page.waitForFunction(()=>[...document.querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth));
}
const ids=()=>page.locator('[data-item]').evaluateAll(nodes=>nodes.map(n=>n.dataset.item));
async function drag(from,to){const a=await page.locator(`[data-item="${from}"]`).boundingBox(),b=await page.locator(`[data-item="${to}"]`).boundingBox();await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:12});await page.mouse.up();await page.locator('.sort-drag-overlay').waitFor({state:'detached'});}
try{
 for(const count of [3,4,5])for(const image of [false,true]){
  await mount(count,image);
  const ranks=await page.locator('.sort-rank').evaluateAll(nodes=>nodes.sort((a,b)=>a.getBoundingClientRect().left-b.getBoundingClientRect().left).map(n=>Number(n.textContent)));assert.deepEqual(ranks,Array.from({length:count},(_,n)=>n+1));
  await drag('e0','e'+(count-1));assert.deepEqual(await ids(),[...Array.from({length:count-1},(_,n)=>'e'+(n+1)),'e0']);
  const before=await ids(),writes=await page.evaluate(()=>window.persisted.length);
  await page.setViewportSize({width:393,height:852});await page.locator('.chronology-horizontal').waitFor({state:'detached'});assert.deepEqual(await ids(),before);assert.equal(await page.evaluate(()=>window.persisted.length),writes);
  await page.setViewportSize({width:1440,height:900});await page.locator('.chronology-horizontal').waitFor();
  const first=before[0];await page.locator(`[data-item="${first}"]`).press('ArrowLeft');assert.deepEqual(await ids(),[before[1],first,...before.slice(2)]);
  const expected=Array.from({length:count},(_,n)=>'e'+(count-1-n));
  for(let index=0;index<count;index++){const current=await ids(),from=current.indexOf(expected[index]);for(let n=from;n>index;n--)await page.locator(`[data-item="${expected[index]}"]`).press('ArrowRight');}
  assert.deepEqual(await ids(),expected);await page.getByRole('button',{name:'Проверить',exact:true}).click();await page.getByText('Всё верно',{exact:true}).waitFor();assert.deepEqual(await page.evaluate(()=>window.submitted),expected);
  await page.setViewportSize({width:844,height:390});await page.locator('.chronology-horizontal').waitFor();await page.waitForFunction(()=>[...document.querySelectorAll('[data-item]')].every(e=>e.getAnimations().every(a=>a.playState==='finished')));assert.equal(await page.locator('.sort-row.is-correct').count(),count);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert(await page.locator('.sort-row img').evaluateAll(images=>images.every(img=>{const r=img.getBoundingClientRect(),p=img.closest('.chronology-slot').getBoundingClientRect();return r.left>=p.left-1&&r.right<=p.right+1&&r.top>=p.top-1&&r.bottom<=p.bottom+1;})),'image boxes stay inside horizontal cards');
  await page.screenshot({path:`artifacts/chronology-landscape/${count}-${image?'images':'text'}.png`});
  await page.setViewportSize({width:1440,height:900});
 }
 await mount(5,false);await page.getByRole('button',{name:'Проверить',exact:true}).click();await page.getByText('1 из 5 на месте',{exact:true}).waitFor();
 const locked=await ids();await page.locator('[data-item="e2"]').press('ArrowLeft');assert.deepEqual(await ids(),locked,'correct absolute slots remain locked');
 await drag('e0','e4');assert.equal((await ids())[2],'e2');assert.equal(await page.locator('.sort-row.is-wrong').count(),0,'moved wrong slots return to neutral');
 await page.setViewportSize({width:844,height:390});await mount(5,false);
 const touchA=await page.locator('[data-item="e0"]').boundingBox(),touchB=await page.locator('[data-item="e4"]').boundingBox(),cdp=await page.context().newCDPSession(page);
 await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true});
 const x=touchA.x+touchA.width/2,y=touchA.y+touchA.height/2,toX=touchB.x+touchB.width/2;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
 for(let n=1;n<=8;n++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+(toX-x)*n/8,y}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.locator('.sort-drag-overlay').waitFor({state:'detached'});
 assert.deepEqual(await ids(),['e1','e2','e3','e4','e0'],'landscape phone accepts a touch drag');await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:false});await cdp.detach();
 await page.setViewportSize({width:1440,height:900});await mount(5,true);const before=await ids(),a=await page.locator('[data-item]').first().boundingBox();await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(a.x-80,a.y+a.height/2,{steps:5});await page.locator('.sort-drag-overlay').waitFor();await page.setViewportSize({width:393,height:852});await page.locator('.sort-drag-overlay').waitFor({state:'detached'});await page.mouse.up();assert.deepEqual(await ids(),before,'rotation cancels an unfinished drag');
 assert.deepEqual(errors,[]);console.log('PASS horizontal dragging, keyboard, canonical grading, ranks, orientation preservation and cancelled drag; 3–5 text/image cards');
}catch(e){await page.screenshot({path:'artifacts/chronology-landscape/failure.png'}).catch(()=>{});throw e;}finally{await browser.close();}
