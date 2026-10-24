// Opt-in real saved progress replay. Snapshot and output remain local artifacts.
import {readFile,mkdir,writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';import {chromium} from 'playwright';
const snapshot=JSON.parse(await readFile(process.env.ENGI_SNAPSHOT??'artifacts/local-session-capture.json','utf8')),browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:393,height:852}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(process.env.ENGI_TEST_URL??'http://localhost:5173/engi/');await page.locator('.feed-home').waitFor();await page.clock.install({time:new Date(snapshot.at)});
 const info=await page.evaluate(async snapshot=>{
  const root=new URL('./src/',location.href).href,[{db},{trainerService},{knowledgeMistakeKey},{StudyFeed},R,C]=await Promise.all(['db/engi-db.ts','services/trainer-service.ts','lib/engi/study-core/mistakes.ts','components/study/StudyFeed.tsx','../node_modules/.vite/deps/react.js','../node_modules/.vite/deps/react-dom_client.js'].map(p=>import(root+p)));
  await db.transaction('rw',db.tables,async()=>{for(const [name,rows]of Object.entries(snapshot.tables)){await db.table(name).clear();if(rows.length)await db.table(name).bulkPut(rows)}});
  const saved=(await db.activeSessions.where('status').equals('active').toArray()).at(-1),original=saved.tasks[saved.currentPosition],errorKey=knowledgeMistakeKey(original.studyContract.primaryGoals[0]);
  const resumed=await trainerService.getResumableSession({endless:true}),q=resumed.tasks[resumed.currentPosition];if(q.id===original.id||q.recipe.format!=='choice'||q.intent!=='repair')throw Error('Saved timed repair did not become objective repair');
  const host=document.createElement('div');document.body.replaceChildren(host);window.snapshotRoot=(C.default??C).createRoot(host);window.snapshotRoot.render((R.default??R).createElement(StudyFeed,{initial:resumed,onExit:()=>{}}));
  return {taskId:q.id,errorKey,expected:q.studyContract.response.expected,index:q.options.findIndex(o=>o.id===q.studyContract.response.expected),target:q.items[0].targetId,originalId:original.id};
 },snapshot);
 await page.locator('.study-feed.state-ready .feed-option').first().waitFor();assert.equal(await page.locator('.recall-swipe').count(),0);await page.locator('.feed-option').nth(info.index).click();
 await page.waitForFunction(async({id,key})=>{const {db}=await import('/engi/src/db/engi-db.ts');return !!await db.reviewEvents.get(id)&&(await db.appMeta.get('studyCore:mistakeEpisodes')).value.episodes.find(e=>e.key===key).status==='resolved'},{id:info.taskId,key:info.errorKey});
 const result=await page.evaluate(async info=>{const {db}=await import('/engi/src/db/engi-db.ts');return {oldAttempt:(await db.appMeta.get('studyCore:attempt:'+info.originalId)).value.phase,event:(await db.reviewEvents.get(info.taskId)).payload,episode:(await db.appMeta.get('studyCore:mistakeEpisodes')).value.episodes.find(e=>e.key===info.errorKey)}},info);
 assert.equal(result.oldAttempt,'skipped');assert.equal(result.episode.status,'resolved');assert.equal(result.event.score,1);assert.equal(result.event.studyCore.attempt.results[0].repairEligible,true);assert.deepEqual(errors,[]);
 await mkdir('artifacts',{recursive:true});await writeFile('artifacts/local-repair-browser.json',JSON.stringify({info,result},null,2));console.log('PASS actual saved queue: old looping timer replaced, real objective button click accepted, original error resolved');
}finally{await browser.close();}
