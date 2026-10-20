import 'fake-indexeddb/auto';
import {test,mock} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseV3} from '../src/lib/engi/import/schema-v3';
import {buildImportPlan} from '../src/lib/engi/import/semantic-merge';
import {EngiDB} from '../src/db/engi-db';
import {putBundle} from '../src/db/repositories';
import {createTrainerService} from '../src/services/trainer-service';

test('fresh periods pack offers timeline bands during fast phone play without waiting for exact review dates',async()=>{
 const pkg=parseV3(JSON.parse(await readFile(new URL('../examples/periods-demo/bundle.json',import.meta.url),'utf8'))),empty={entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[]};
 const b=buildImportPlan(pkg,empty,{},'fast').bundle,d=new EngiDB('interval-fast-'+crypto.randomUUID()),at=Date.UTC(2026,9,20,9),random=Math.random;let seed=41,firstBand=-1,bands=0;
 Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};mock.timers.enable({apis:['Date'],now:at});
 try{await putBundle(d,b);const svc=createTrainerService(d);let s=await svc.startGoalFeed('all','mixed','daily',{endless:true,presentationWidth:393});
  for(let n=0;n<400;n++){
   mock.timers.setTime(at+(n+1)*2000);assert(!s.exhausted);
   if(s.intro){s=await svc.completeIntro(s.id);continue;}
   const q=s.tasks[s.currentPosition],r=q.studyContract!.response;
   if(q.intervalExercise?.kind==='bands'){bands++;if(firstBand<0)firstBand=n;assert(q.items.length>=3);assert.equal(q.intent,'learn');}
   if(q.recipe.format==='self_check'){s=await svc.advanceFeed(s.id,true,q.id);continue;}
   if(r.kind==='mapping'){for(const v of r.bindings.filter(v=>!v.support))await svc.answerMatchPair({sessionId:s.id,taskId:q.id,entityId:v.responseKey,answerId:v.expected,requestId:crypto.randomUUID()});}
   else if('expected'in r)await svc.answer({sessionId:s.id,taskId:q.id,answer:r.expected});
   else throw Error('Unexpected response '+r.kind);
   if(q.intervalExercise){await svc.observeVisibility(s.id,q.id,'feedback','feedback:'+q.id,'start');await svc.observeVisibility(s.id,q.id,'feedback','feedback:'+q.id,'end');}
   s=await svc.advanceFeed(s.id,false,q.id);
  }
  assert(bands>0,'timeline bands must not starve when answers take two seconds');assert(firstBand<35,'bands should appear during initial learning');
  const ledger=(await d.appMeta.get('studyCore:learningLifecycle'))!.value;assert(ledger.units.every((u:{stage:string})=>u.stage==='completed'),'partial exercises must not keep postponing exact learning completion');
 }finally{mock.timers.reset();Math.random=random;d.close();await d.delete();}
});
