import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {ZipWriter,BlobWriter,TextReader,BlobReader,configure} from '@zip.js/zip.js';
import {chromium} from 'playwright';

// This fixture is imported through the production UI and its real worker.
const png=await readFile(new URL('../public/icon-192.png',import.meta.url));
const hash=createHash('sha256').update(png).digest('hex');
const bundle={entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[],entityTypes:[{id:'offline-s',name:'Объект'},{id:'offline-a',name:'Автор'}],properties:[{id:'offline-author',name:'Автор',valueKind:'entity',subjectTypes:['offline-s'],targetTypes:['offline-a'],cardinality:'one',learnable:true}]};
for(let i=0;i<8;i++){
 bundle.entities.push({id:'offline-s'+i,type:'offline-s',name:'Объект '+i,aliases:[],externalIds:{}},{id:'offline-a'+i,type:'offline-a',name:'Автор '+i,aliases:[],externalIds:{}});
 bundle.facts.push({id:'offline-f'+i,entityId:'offline-s'+i,key:'offline-author',valueKind:'entity',valueEntityId:'offline-a'+i,verification:'verified',source:{kind:'url',name:'Проверочный набор',url:'https://example.org/fixture/'+i}});
 bundle.media.push({id:'offline-m'+i,entityId:'offline-s'+i,role:'primary',primary:true,url:'media/example.png',sourceUrl:'https://example.org/fixture/'+i,license:'Test fixture'});
}
const manifest={format:'engi-pack',schemaVersion:2,packId:'offline.acceptance',packVersion:1,name:'Проверка офлайн',createdAt:new Date().toISOString(),files:[{path:'media/example.png',bytes:png.length,sha256:hash,mime:'image/png'}]};
configure({useWebWorkers:false});const writer=new ZipWriter(new BlobWriter());
await writer.add('manifest.json',new TextReader(JSON.stringify(manifest)));await writer.add('bundle.json',new TextReader(JSON.stringify(bundle)));await writer.add('media/example.png',new BlobReader(new Blob([png],{type:'image/png'})),{level:0});
const pack=Buffer.from(await (await writer.close()).arrayBuffer());
const browser=await chromium.launch({headless:true,executablePath:process.env.ENGI_BROWSER_PATH||undefined});
const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true});const page=await context.newPage();page.setDefaultTimeout(10000);
const workers=[];page.on('worker',worker=>workers.push(worker.url()));
async function snapshot(){return page.evaluate(async()=>{const d=await new Promise((resolve,reject)=>{const r=indexedDB.open('engi');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});try{return await new Promise((resolve,reject)=>{const tx=d.transaction(['activeSessions','reviewEvents','installedPacks','learningState','appMeta'],'readonly'),out={};for(const name of tx.objectStoreNames){const r=tx.objectStore(name).getAll();r.onsuccess=()=>out[name]=r.result}tx.oncomplete=()=>resolve(out);tx.onerror=()=>reject(tx.error)})}finally{d.close()}})}
try{
 await page.goto(process.env.ENGI_PRODUCTION_URL??'http://127.0.0.1:4173/engi/');await page.waitForSelector('.feed-home');
 await page.evaluate(()=>{window.__toastHistory=[];new MutationObserver(()=>{for(const toast of document.querySelectorAll('[data-sonner-toast]'))if(!window.__toastHistory.includes(toast.textContent))window.__toastHistory.push(toast.textContent)}).observe(document.body,{childList:true,subtree:true})});
 await page.locator('input[type=file]').setInputFiles({name:'offline.engi',mimeType:'application/zip',buffer:pack});
 await page.getByText('Пакет импортирован',{exact:true}).waitFor();
 assert.equal((await snapshot()).installedPacks.length,1);assert(workers.some(url=>url.includes('/assets/')&&url.endsWith('.js')),'Production import must create its real bundled worker');
 await page.evaluate(async()=>{await navigator.serviceWorker.ready});await page.reload();await page.waitForSelector('.feed-home');
 assert(await page.evaluate(()=>!!navigator.serviceWorker.controller));await context.setOffline(true);await page.reload();await page.waitForSelector('.feed-home');await page.waitForFunction(()=>document.querySelector('.home-art img')?.naturalWidth>0);
 await page.getByLabel('Формат',{exact:true}).selectOption('choice');await page.getByRole('button',{name:'Начать',exact:true}).click();
 const introIds=[];
 for(let n=0;n<3;n++){
  await page.locator('#object-intro-heading').waitFor();const intro=(await snapshot()).activeSessions.find(s=>s.status==='active').intro;assert(intro);introIds.push(intro.entityId);
  await page.waitForFunction(()=>document.querySelector('.learning22-portrait')?.naturalWidth>0);
  const green=page.getByRole('button',{name:/: Знаю хорошо$/});const count=await green.count();assert(count>=2);
  for(let i=0;i<count;i++){await green.nth(i).click();await page.waitForFunction(()=>document.querySelector('.learning22-screen')?.getAttribute('aria-busy')==='false')}
  await page.getByRole('button',{name:'Готово',exact:true}).click();
  await page.waitForFunction(previous=>document.querySelector('#object-intro-heading')?.textContent!==previous,'Объект '+intro.entityId.replace('offline-s',''));
 }
 await page.locator('#stop-study-heading').waitFor();const introduced=await snapshot();assert.equal(new Set(introIds).size,3);assert.equal(introduced.reviewEvents.length,0);assert.equal(introduced.appMeta.find(row=>row.key==='newLearning').value.introducedEntityIds.length,3);assert(introduced.learningState.every(row=>row.payload.card.reps===0));
 const nextDay=await page.evaluate(()=>Date.now()+2*86400000);await page.clock.setFixedTime(new Date(nextDay));await page.reload();await page.locator('.feed-home').waitFor();
 await page.getByLabel('Формат',{exact:true}).selectOption('choice');await page.getByRole('button',{name:'Начать',exact:true}).click();await page.waitForSelector('.study-feed.state-ready');
 const s=(await snapshot()).activeSessions.find(s=>s.status==='active'),task=s.tasks[s.currentPosition];
 if(task.recipe.cue==='image'&&task.items[0].image)await page.waitForFunction(()=>document.querySelector('.feed-cue img')?.naturalWidth>0);
 const correct=task.options.find(o=>o.id===task.items[0].answerId);await page.getByRole('button',{name:correct.name,exact:true}).click();
 await page.waitForFunction(id=>document.querySelector('.feed-current')?.getAttribute('data-task-id')!==id,task.id);
 assert.equal((await snapshot()).reviewEvents.length,1);const resumeTask=(await snapshot()).activeSessions.find(s=>s.status==='active').tasks[0].id;await page.reload();await page.getByRole('button',{name:'Продолжить с прошлого места'}).click();await page.waitForSelector('.study-feed.state-ready');assert.equal((await snapshot()).reviewEvents.length,1);assert.equal(await page.locator('.feed-current').getAttribute('data-task-id'),resumeTask);
 assert(await page.evaluate(async hash=>!!(await (await caches.open('engi-media-v1')).match(new URL('/__engi_media__/'+hash,location.origin))),hash));
 console.log('PASS production worker import, service-worker offline reload, cached image, Intro triage/budget, next-day due review and exact resume');
}catch(error){console.error(await page.evaluate(()=>window.__toastHistory));console.error((await page.locator('body').innerText()).slice(-2200));throw error}finally{await context.close();await browser.close()}
