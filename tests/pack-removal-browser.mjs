import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:process.env.ENGI_BROWSER_PATH});
try{
 const context=await browser.newContext({viewport:{width:393,height:852}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(20000);
 await page.goto(process.env.ENGI_TEST_URL??'http://127.0.0.1:5173/engi/');await page.locator('.feed-home').waitFor();
 const packs=await page.evaluate(async()=>{
  const {db}=await import('/engi/src/db/engi-db.ts'),{prepareDeclarativePack,commitDeclarativeImport}=await import('/engi/src/services/declarative-pack.ts');
  const result=[];for(const path of ['us-history-5.engi','french-artists-6-24.engi']){const p=await prepareDeclarativePack(await(await fetch('/engi/artifacts/'+path)).blob(),db);await commitDeclarativeImport(p,{},db);result.push({id:p.packId,name:p.pkg.name});}
  const {getBundle}=await import('/engi/src/db/repositories.ts'),{associationGoal}=await import('/engi/src/lib/engi/study-core/compiler.ts'),{graduateGoalMemory}=await import('/engi/src/lib/engi/study-core/memory.ts');
  const b=await getBundle(db),owner=await db.installedPacks.get(result[0].id),f=b.facts.find(f=>f.id===owner.factIds[0]),g=associationGoal(b,f,'recognition','forward');await db.appMeta.put({key:'studyCore:memory:'+g.id,value:graduateGoalMemory(g,new Date())});
  return result;
 });
 await page.reload();await page.locator('.deck-cover-grid').waitFor();await page.getByRole('button',{name:'Настройки',exact:true}).click();await page.locator('.installed-pack-row').first().waitFor();assert.equal(await page.locator('.installed-pack-row').count(),2);
 for(const width of [320,393,1365]){await page.setViewportSize({width,height:852});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.equal(await page.locator('.installed-pack-row button').count(),2);}
 await page.setViewportSize({width:393,height:852});await page.locator('.installed-packs-panel').screenshot({path:'artifacts/pack-removal-settings.png'});
 page.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:'Удалить пакет '+packs[0].name,exact:true}).click();assert.equal(await page.locator('.installed-pack-row').count(),2);
 page.once('dialog',d=>{assert(d.message().includes('правками'));void d.accept();});await page.getByRole('button',{name:'Удалить пакет '+packs[0].name,exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.installed-pack-row').length===1);
 const remaining=await page.evaluate(async id=>{const {db}=await import('/engi/src/db/engi-db.ts');return {packs:await db.installedPacks.count(),deleted:!!await db.installedPacks.get(id),entities:await db.entities.count(),memories:await db.appMeta.where('key').startsWith('studyCore:memory:').count()};},packs[0].id);assert.equal(remaining.packs,1);assert.equal(remaining.deleted,false);assert(remaining.entities>0);assert.equal(remaining.memories,0);
 page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Удалить пакет '+packs[1].name,exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.installed-pack-row').length===0);
 const empty=await page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts'),{MEDIA_CACHE}=await import('/engi/src/media/media-store.ts');return {content:await Promise.all([db.entities.count(),db.facts.count(),db.media.count(),db.tags.count(),db.entityTags.count(),db.decks.count(),db.deckMembers.count(),db.installedPacks.count(),db.learningState.count(),db.reviewEvents.count(),db.activeSessions.count(),db.targetMappings.count()]),files:(await(await caches.open(MEDIA_CACHE)).keys()).length,pending:!!await db.appMeta.get('packRemoval:pendingMedia'),customProperties:(await db.propertyDefinitions.toArray()).filter(p=>!p.builtIn).length};});
 assert(empty.content.every(n=>n===0),JSON.stringify(empty));assert.equal(empty.files,0);assert.equal(empty.pending,false);assert.equal(empty.customProperties,0);
 await page.reload();await page.locator('.feed-home').waitFor();assert.equal(await page.locator('.deck-cover-card').count(),0);assert.deepEqual(errors,[]);await context.close();console.log('Pack deletion: cancel, two real archives, progress, all content tables and media cache passed.');
}finally{await browser.close();}
