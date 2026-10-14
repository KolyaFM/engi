import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createMobileSmokeFixtures} from '../scripts/mobile-smoke-fixtures.mjs';

const out='artifacts/desktop-layout';await mkdir(out,{recursive:true});
await createMobileSmokeFixtures();
execFileSync(process.execPath,['--import','tsx','scripts/build-engi-pack.mjs','artifacts/mobile-smoke-fixtures/a','artifacts/mobile-smoke-fixtures/a.engi'],{windowsHide:true,stdio:'pipe'});
const browser=await chromium.launch({headless:true,executablePath:process.env.ENGI_BROWSER_PATH});
const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),errors=[],report=[];
page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(20000);
const bounds=locator=>locator.evaluate(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});
try{
 await page.goto(process.env.ENGI_TEST_URL??'http://127.0.0.1:5173/engi/');await page.locator('.feed-home').waitFor();
 await page.getByRole('button',{name:'Настройки',exact:true}).click();await page.getByRole('button',{name:'Импортировать пакет',exact:true}).click();
 await page.locator('input[type=file]').setInputFiles('artifacts/mobile-smoke-fixtures/a.engi');await page.getByRole('button',{name:'Импортировать',exact:true}).click();
 await page.getByRole('button',{name:'Колоды',exact:true}).click();await page.locator('.deck-select').waitFor();
 // Only this disposable browser context is seeded; personal IndexedDB is never opened.
 await page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts'),decks=await db.decks.toArray(),members=await db.deckMembers.toArray(),base=decks[0];for(let n=1;n<6;n++){const id='layout-'+n;await db.decks.put({...base,id,name:'Тестовая колода '+(n+1)});await db.deckMembers.bulkPut(members.filter(m=>m.deckId===base.id).map(m=>({...m,deckId:id})));}});
 await page.reload();await page.locator('.deck-select').nth(5).waitFor();
 await page.evaluate(()=>{document.querySelector('style[data-vite-dev-id$="/desktop.css"]').sheet.disabled=true;});
 await page.screenshot({path:out+'/before.png',fullPage:true});
 await page.evaluate(()=>{document.querySelector('style[data-vite-dev-id$="/desktop.css"]').sheet.disabled=false;});
 for(const [width,height,columns]of [[393,852,2],[1024,768,3],[1440,900,4],[1920,1080,4],[2560,1440,4]]){
  await page.setViewportSize({width,height});
  const tile=await bounds(page.locator('.deck-select').first()),button=await bounds(page.getByRole('button',{name:'Начать обучение',exact:true}));
  assert.equal(await page.locator('.deck-cover-grid').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length),columns);
  if(width>=900){assert(tile.width<=251&&tile.height<=320);assert(button.width<=281);}
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));report.push({width,height,tile,button});
  await page.screenshot({path:out+'/decks-'+width+'.png',fullPage:true});
 }
 await page.setViewportSize({width:1440,height:900});
 await page.locator('.deck-properties-button').first().click();await page.waitForFunction(()=>document.querySelector('.deck-property-sheet')?.getAnimations().every(a=>a.playState==='finished'));const sheet=await bounds(page.locator('.deck-property-sheet'));
 assert(sheet.width<=521&&sheet.y>=31&&sheet.y+sheet.height<=869);await page.screenshot({path:out+'/properties.png'});
 await page.getByRole('button',{name:'Закрыть выбор свойств',exact:true}).click();
 await page.getByRole('button',{name:'Статистика',exact:true}).click();await page.locator('.statistics-growth').waitFor();
 const growth=await bounds(page.locator('.statistics-growth')),activity=await bounds(page.locator('.statistics-activity'));assert(activity.x>growth.x+growth.width);
 await page.screenshot({path:out+'/statistics.png',fullPage:true});await page.getByRole('button',{name:'Колоды',exact:true}).click();
 await page.getByRole('button',{name:'Настройки',exact:true}).click();assert((await bounds(page.locator('.study-preferences'))).width<=681);
 await page.screenshot({path:out+'/settings.png',fullPage:true});await page.getByRole('button',{name:'Колоды',exact:true}).click();
 const selected=page.locator('.deck-select').first();if(await selected.getAttribute('aria-pressed')!=='true')await selected.click();
 await page.getByRole('button',{name:'Начать обучение',exact:true}).click();await page.locator('#object-intro-heading').waitFor();
 await page.waitForFunction(()=>document.querySelector('.learning22-screen')?.getAnimations({subtree:true}).every(a=>a.playState==='finished'));
 assert((await bounds(page.locator('.learning22-portrait'))).height<=241);await page.screenshot({path:out+'/intro.png'});
 await page.getByRole('button',{name:'Закончить знакомство',exact:true}).click();
 for(const format of ['choice','match','sort']){
  await page.evaluate(async format=>{
   const {db}=await import('/engi/src/db/engi-db.ts'),{getBundle,learningRow}=await import('/engi/src/db/repositories.ts'),{canonicalTargets}=await import('/engi/src/lib/engi/questions/recipe-factory.ts'),{triagedMemory}=await import('/engi/src/lib/engi/learning/bootstrap.ts');
   const b=await getBundle(db);await db.learningState.bulkPut(canonicalTargets(b).map(i=>learningRow({...triagedMemory(i,'red','layout',0),status:'review',bootstrap:undefined})));
   const {trainerService}=await import('/engi/src/services/trainer-service.ts'),session=await trainerService.startGoalFeed('all',format,'practice');
   if(!session.tasks.length)throw Error('No '+format+' task');
   const reactModule=await import('/engi/node_modules/.vite/deps/react.js'),React=reactModule.default??reactModule,domModule=await import('/engi/node_modules/.vite/deps/react-dom_client.js'),{createRoot}=domModule.default??domModule,{StudyFeed}=await import('/engi/src/components/study/StudyFeed.tsx');
   const node=document.createElement('div');document.body.append(node);window.layoutRoot=createRoot(node);window.layoutRoot.render(React.createElement(StudyFeed,{initial:session,onExit:()=>{window.layoutRoot.unmount();node.remove();}}));
  },format);
  await page.locator('.study-feed.state-ready').waitFor();await page.locator('.challenge-intro').waitFor({state:'detached'});
  for(const [width,height]of [[1024,768],[1440,900],[2560,1440]]){
   await page.setViewportSize({width,height});
   const current=await bounds(page.locator('.study-feed .feed-current'));assert(current.width<=(format==='sort'?1121:641));
   if(format==='match'){await page.locator('.matching-pairs').waitFor();assert((await bounds(page.locator('.matching-object').first())).height<=141);}
   if(format==='sort'){await page.locator('.chronology-card').waitFor();const action=await bounds(page.locator('.chronology-floating-action'));assert(action.width<=593&&action.y+action.height<=Math.min(height,860));}
   await page.screenshot({path:out+'/'+format+'-'+width+'.png'});
  }
  await page.setViewportSize({width:1440,height:900});await page.getByRole('button',{name:'Выйти из практики',exact:true}).click();
 }
 assert.deepEqual(errors,[]);await writeFile(out+'/report.json',JSON.stringify({report,sheet,growth,activity,errors},null,2));console.log('Desktop and mobile layout checks passed');
}catch(e){await page.screenshot({path:out+'/failure.png',fullPage:true}).catch(()=>{});throw e;}
finally{await context.close();await browser.close();}
