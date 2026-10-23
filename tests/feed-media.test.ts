import {test} from 'node:test';import assert from 'node:assert/strict';
import {taskMediaSources,proposalMediaPreview,introMediaSources} from '../src/services/feed-media';
import type {Task} from '../src/lib/engi/types';
import 'fake-indexeddb/auto';
import {EngiDB} from '../src/db/engi-db';
import {putBundle} from '../src/db/repositories';
import {createTrainerService} from '../src/services/trainer-service';
test('intro warmup includes the displayed hero and enabled image properties only',()=>{
 const b={media:[{id:'hero',entityId:'e',role:'primary',url:'hero'},{id:'flag',entityId:'e',role:'flag',url:'flag'},{id:'other',entityId:'other',role:'primary',url:'other'},{id:'disabled',entityId:'e',role:'flag',url:'disabled'}],facts:[{id:'f',valueKind:'image',valueMediaId:'flag'}]} as any;
 assert.deepEqual(introMediaSources(b,'e',[{factId:'f'}] as any),['hero','flag']);
});
test('preview includes cue, answer properties, image options and all group members with a strict budget',()=>{
 const task={items:[{image:'map',answerImage:'flag'},{image:'portrait'}],options:[{image:'flag'},{image:'answer'}]} as Task;
 assert.deepEqual(taskMediaSources(task),['map','flag','portrait','answer']);
 assert(proposalMediaPreview(Array.from({length:100},()=>task)).length<=12);
});
test('structural media preview is read-only, bounded and does not consume randomness',async()=>{
 const db=new EngiDB('preview-'+crypto.randomUUID());try{
  await putBundle(db,{entities:Array.from({length:6},(_,n)=>({id:'e'+n,name:'E'+n,type:'person',aliases:[],externalIds:{}})),media:Array.from({length:6},(_,n)=>({id:'m'+n,entityId:'e'+n,role:'primary',url:'https://example.test/'+n+'.png',license:'Test'})),facts:[],tags:[],entityTags:[],missing:[],unresolved:[]});
  const svc=createTrainerService(db);let s=await svc.startGoalFeed('all','mixed','daily',{endless:true});for(let n=0;n<6&&s.intro;n++)s=await svc.completeIntro(s.id);
  assert(s.tasks.length);const before=JSON.stringify(await Promise.all([db.appMeta.toArray(),db.activeSessions.toArray(),db.learningState.toArray(),db.reviewEvents.toArray()]));
  const random=Math.random;let calls=0;Math.random=()=>{calls++;return .5;};try{const sources=await svc.previewFeedMedia(s.id);assert(sources.length<=12);assert(sources.every(s=>s.startsWith('https://example.test/')));assert.equal(calls,0);assert((await svc.preloadMedia(s.id)).length>0);}finally{Math.random=random;}
  assert.equal(JSON.stringify(await Promise.all([db.appMeta.toArray(),db.activeSessions.toArray(),db.learningState.toArray(),db.reviewEvents.toArray()])),before);
 }finally{db.close();await db.delete();}
});
