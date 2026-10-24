// Local-only reproduction: raw snapshots contain personal progress and stay ignored.
import 'fake-indexeddb/auto';
import {test,mock} from 'node:test';import assert from 'node:assert/strict';import {readFile,writeFile} from 'node:fs/promises';
import {EngiDB} from '../src/db/engi-db';import {createTrainerService} from '../src/services/trainer-service';
import {knowledgeMistakeKey} from '../src/lib/engi/study-core/mistakes';
test('saved real feed does not loop timed repairs after remembered or early-revealed answers',async()=>{
 const snapshot=JSON.parse(await readFile(process.env.ENGI_SNAPSHOT??'artifacts/local-session-capture.json','utf8')),d=new EngiDB('snapshot-replay-'+crypto.randomUUID()),at=Date.parse(snapshot.at),screens:any[]=[];
 mock.timers.enable({apis:['Date'],now:at});
 try{
  await d.transaction('rw',d.tables,async()=>{for(const [name,rows]of Object.entries(snapshot.tables))if((rows as any[]).length)await d.table(name).bulkPut(rows as any[])});
  const svc=createTrainerService(d);let s=(await d.activeSessions.where('status').equals('active').toArray()).at(-1)!;const original=s.tasks[s.currentPosition],originalKey=knowledgeMistakeKey(original.studyContract!.primaryGoals[0]);
  s=(await svc.getResumableSession({endless:true}))!;assert.notEqual(s.tasks[s.currentPosition]?.id,original.id,'resume must replace the already saved looping repair when an objective alternative exists');
  for(let turn=0;turn<36;turn++){
   mock.timers.setTime(at+turn*8000);
   if(s.intro){s=await svc.completeIntro(s.id);continue;}if(s.exhausted){s=await svc.refreshGoalFeed(s.id);continue;}
   const q=s.tasks[s.currentPosition];assert(q);screens.push({turn,id:q.id,format:q.recipe.format,intent:q.intent,reason:q.reason,objects:q.items.map(i=>i.entityId),targets:q.items.map(i=>i.targetId)});
   if(turn>0&&q.intent==='repair')assert.notEqual(q.recipe.format,'recall_reveal','mixed repair must use an available objective check instead of returning the timer');
   const r=q.studyContract!.response;
   if(r.kind==='practice-view'){s=await svc.advanceFeed(s.id,true,q.id);continue;}
   if(r.kind==='self-report'){await svc.saveInteraction(s.id,q.id,{revealed:true,earlyReveal:true,recallElapsedMs:1000});await svc.observeVisibility(s.id,q.id,'early-answer','early:'+q.id,'start');await svc.answer({sessionId:s.id,taskId:q.id,answer:true});}
   else if(r.kind==='mapping'){for(const binding of r.bindings.filter(b=>!b.support))await svc.answerMatchPair({sessionId:s.id,taskId:q.id,entityId:binding.responseKey,answerId:binding.expected,requestId:crypto.randomUUID()});}
   else if('expected'in r)await svc.answer({sessionId:s.id,taskId:q.id,answer:r.expected});else throw Error('Unsupported response');
   s=await svc.advanceFeed(s.id,false,q.id);
   if(turn%7===0)s=(await svc.getResumableSession({endless:true}))!;
  }
  assert(screens.length>=20);assert.equal((await d.appMeta.get('studyCore:mistakeEpisodes'))!.value.episodes.find((e:any)=>e.key===originalKey).status,'resolved','the actual recurring error must be resolved by a correct objective repair');console.log('Replay:',JSON.stringify({screens:screens.length,timers:screens.filter(t=>t.format==='recall_reveal').length,repairs:screens.filter(t=>t.intent==='repair').length}));
 }finally{await writeFile('artifacts/local-session-replay.json',JSON.stringify(screens,null,2));mock.timers.reset();d.close();await d.delete();}
});
