import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {ZipWriter,BlobWriter,TextReader,configure} from '@zip.js/zip.js';
configure({useWebWorkers:false});
const browser=await chromium.launch({executablePath:process.env.ENGI_BROWSER_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const url=process.env.ENGI_TEST_URL??'http://127.0.0.1:5173/engi/';
const ref=(name,type='Человек')=>({name,type}),source={kind:'manual',name:'Синтетический тест'},fact=(property,value)=>({property,value,source,verification:'user_confirmed'});
const first={schemaVersion:3,name:'Соавторы',entities:[ref('Автор А'),ref('Автор Б'),ref('Автор В'),{...ref('Книга','Книга'),completeProperties:['Автор'],facts:[fact('Автор',ref('Автор А')),fact('Автор',ref('Автор Б'))]}],deck:{name:'Соавторы',members:[ref('Книга','Книга')],learning:{properties:['Автор'],imageRecognition:false}}};
const second={schemaVersion:3,name:'Новая книга',entities:[ref('Автор А'),{...ref('Новая книга','Книга'),facts:[fact('Автор',ref('Автор А'))]}],deck:{name:'Новая книга',members:[ref('Новая книга','Книга')],learning:{properties:['Автор'],imageRecognition:false}}};
async function archive(pkg){const w=new ZipWriter(new BlobWriter());await w.add('bundle.json',new TextReader(JSON.stringify(pkg)));return Buffer.from(await (await w.close()).arrayBuffer())}
async function importUI(page,pkg){await page.getByRole('button',{name:'Импорт',exact:true}).click();await page.locator('input[type=file]').first().setInputFiles({name:'test.engi',mimeType:'application/zip',buffer:await archive(pkg)});await page.getByRole('region',{name:'Проверка импорта'}).waitFor();await page.getByRole('button',{name:'Импортировать',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('[aria-label="Проверка импорта"]'))}
await mkdir('artifacts',{recursive:true});
const errors=[];
for(const viewport of [{width:1365,height:900},{width:390,height:844}]){
 const context=await browser.newContext({viewport});const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));await page.goto(url);await page.locator('.feed-home').waitFor();await importUI(page,first);await importUI(page,second);
 const counts=await page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');return {entities:await db.entities.count(),decks:await db.decks.count(),tags:await db.tags.count()}});assert.deepEqual(counts,{entities:5,decks:2,tags:0});
 await importUI(page,first);const repeated=await page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');return {entities:await db.entities.count(),decks:await db.decks.count()}});assert.deepEqual(repeated,{entities:5,decks:2});
 await page.getByRole('button',{name:'Знания',exact:true}).click();await page.getByRole('tab',{name:/Колоды/}).click();await page.locator('.deck-card').first().waitFor();await page.screenshot({path:`artifacts/v3-catalog-${viewport.width}.png`,fullPage:true});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 // Test deck settings through the user-facing control.
 await page.getByRole('button',{name:/^Колода: Соавторы/}).click();await page.getByRole('button',{name:'Настроить колоду',exact:true}).click();await page.getByRole('dialog',{name:'Настройки колоды'}).waitFor();assert.equal(await page.getByText('Узнавание по изображениям',{exact:true}).count(),1);await page.screenshot({path:`artifacts/v3-settings-${viewport.width}.png`,fullPage:true});await page.getByRole('button',{name:'Сохранить',exact:true}).click();
 // Make the two units due and exercise the actual multiselect UI and review transaction.
 await page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts'),{getBundle,learningRow}=await import('/engi/src/db/repositories.ts'),{canonicalTargets}=await import('/engi/src/lib/engi/questions/recipe-factory.ts'),{triagedMemory}=await import('/engi/src/lib/engi/learning/bootstrap.ts');const b=await getBundle(db),deck=b.decks.find(d=>d.name==='Соавторы');for(const i of canonicalTargets(b,deck.id)){const m=triagedMemory(i,'red','',0);m.card.due=new Date(0);await db.learningState.put(learningRow(m))}});
 await page.getByRole('button',{name:'Учить эту тему',exact:true}).click();await page.getByText('Можно выбрать несколько вариантов.').waitFor();await page.getByRole('button',{name:/Автор А/}).click();await page.screenshot({path:`artifacts/v3-multi-${viewport.width}.png`,fullPage:true});await page.getByRole('button',{name:'Проверить',exact:true}).click();await page.getByRole('button',{name:'Дальше',exact:true}).waitFor();const result=await page.evaluate(async()=>{const {db}=await import('/engi/src/db/engi-db.ts');const e=(await db.reviewEvents.toArray())[0];return e.payload.targets.map(t=>t.correct)});assert.deepEqual(result.sort(),[false,true]);await context.close();
}
assert.deepEqual(errors,[]);await browser.close();console.log('v3 UI passed: desktop + 390px, import preview, repeat import, deck settings, multiselect per-fact progress');
