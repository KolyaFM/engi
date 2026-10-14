import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EngiDB} from '../src/db/engi-db';
import {readGoalStateRows} from '../src/services/goal-state-rows';
import {feedPerformance} from '../src/services/feed-performance';

test('goal state range reads preserve bulk-get order, holes and duplicate IDs in sparse and dense catalogs',async()=>{
 const db=new EngiDB('goal-state-rows-'+crypto.randomUUID());
 try{
  await db.appMeta.bulkPut([{key:'studyCore:memory:b',value:{goalId:'b',card:{due:'2030-01-01'}}},{key:'studyCore:memory:a',value:{goalId:'a'}},{key:'studyCore:memory:obsolete',value:{goalId:'obsolete'}},{key:'studyCore:exposure:a',value:{goalId:'a',lastVisibleAt:'2026-10-14T09:00:00Z'}},{key:'studyCore:exposure:other-deck',value:{goalId:'other-deck'}},{key:'studyPreferences',value:{newCardsPerDay:10}}]);
  for(const kind of ['memory','exposure'] as const){
   for(const ids of [[],['b','absent','a','a'],Array.from({length:200},(_,n)=>'missing'+n)]){
    assert.deepEqual(await readGoalStateRows(db,ids,kind),await db.appMeta.bulkGet(ids.map(id=>'studyCore:'+kind+':'+id)));
   }
  }
  const dense=Array.from({length:200},(_,n)=>({key:'studyCore:memory:g'+n,value:{goalId:'g'+n}}));await db.appMeta.bulkPut(dense);
  const ids=dense.map(r=>r.value.goalId).reverse();assert.deepEqual(await readGoalStateRows(db,ids,'memory'),await db.appMeta.bulkGet(ids.map(id=>'studyCore:memory:'+id)));
  await db.transaction('rw',db.appMeta,async()=>{await db.appMeta.put({key:'studyCore:memory:a',value:{goalId:'a',updated:true}});assert.equal((await readGoalStateRows(db,['a'],'memory'))[0]?.value.updated,true);});
  const rows=await readGoalStateRows(db,['a'],'memory');rows[0]!.value.updated=false;assert.equal((await readGoalStateRows(db,['a'],'memory'))[0]?.value.updated,true,'Reads must not cache mutable progress');
 }finally{db.close();await db.delete();}
});

test('a large unseen catalog does not issue an individual lookup for each absent goal',async()=>{
 const db=new EngiDB('goal-state-misses-'+crypto.randomUUID());
 try{
  await db.appMeta.put({key:'studyCore:memory:seen',value:{goalId:'seen'}});
  const expected=Array.from({length:500},()=>undefined) as ({key:string;value:any}|undefined)[];expected.push({key:'studyCore:memory:seen',value:{goalId:'seen'}});
  const original=db.appMeta.bulkGet;db.appMeta.bulkGet=(()=>{throw Error('Per-goal lookup must not be used for unseen content');}) as typeof original;
  try{assert.deepEqual(await readGoalStateRows(db,[...Array.from({length:500},(_,n)=>'unseen'+n),'seen'],'memory'),expected);}finally{db.appMeta.bulkGet=original;}
 }finally{db.close();await db.delete();}
});

test('a small selection does not load unrelated large histories',async()=>{
 const db=new EngiDB('goal-state-small-slice-'+crypto.randomUUID());
 try{
  await db.appMeta.bulkPut(Array.from({length:200},(_,n)=>({key:'studyCore:memory:g'+n,value:{goalId:'g'+n}})));
  const original=db.appMeta.bulkGet,keys:string[][]=[];db.appMeta.bulkGet=(async ids=>{keys.push(ids as string[]);return original.call(db.appMeta,ids);}) as typeof original;
  try{assert.deepEqual(await readGoalStateRows(db,['g3','absent'],'memory'),[{key:'studyCore:memory:g3',value:{goalId:'g3'}},undefined]);assert.deepEqual(keys,[['studyCore:memory:g3','studyCore:memory:absent']]);}finally{db.appMeta.bulkGet=original;}
 }finally{db.close();await db.delete();}
});

test('fallback diagnostics finish only after the asynchronous state read completes',async()=>{
 const db=new EngiDB('goal-state-timing-'+crypto.randomUUID());
 try{
  const row={key:'studyCore:memory:a',value:{goalId:'a'}};await db.appMeta.bulkPut([row,{key:'studyCore:memory:b',value:{goalId:'b'}}]);
  let finish!:(rows:({key:string;value:any}|undefined)[])=>void,requested!:()=>void;const called=new Promise<void>(resolve=>requested=resolve),original=db.appMeta.bulkGet;
  db.appMeta.bulkGet=(()=>{requested();return new Promise(resolve=>finish=resolve);}) as unknown as typeof original;feedPerformance.start();
  try{const reading=readGoalStateRows(db,['a'],'memory');await called;const before=feedPerformance.report();finish([row]);await reading;assert.deepEqual(before,[],'Span must remain open while IndexedDB is pending');assert.deepEqual(feedPerformance.report().map(s=>s.stage),['state.memory.read']);}finally{db.appMeta.bulkGet=original;feedPerformance.stop();}
 }finally{db.close();await db.delete();}
});

test('range reads see transaction writes, respect rollbacks and refresh across database connections',async()=>{
 const name='goal-state-range-transaction-'+crypto.randomUUID(),db=new EngiDB(name),other=new EngiDB(name),ids=['a',...Array.from({length:20},(_,n)=>'unseen'+n)];
 try{
  await db.appMeta.put({key:'studyCore:memory:a',value:{goalId:'a',version:1}});
  await assert.rejects(db.transaction('rw',db.appMeta,async()=>{await db.appMeta.put({key:'studyCore:memory:a',value:{goalId:'a',version:2}});assert.equal((await readGoalStateRows(db,ids,'memory'))[0]?.value.version,2);throw Error('rollback');}),/rollback/);
  assert.equal((await readGoalStateRows(db,ids,'memory'))[0]?.value.version,1);
  await other.appMeta.put({key:'studyCore:memory:a',value:{goalId:'a',version:3}});assert.equal((await readGoalStateRows(db,ids,'memory'))[0]?.value.version,3);
 }finally{other.close();db.close();await db.delete();}
});
