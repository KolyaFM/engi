import 'fake-indexeddb/auto';import {test} from 'node:test';import assert from 'node:assert/strict';
import {intervals,intervalRecipe} from './helpers-intervals';
import {recordIntervalEvidence} from '../src/lib/engi/study-core/interval-evidence';
import {canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {compileTaskContract} from '../src/lib/engi/study-core/compiler';
import {createStudyCoreService} from '../src/services/study-core-service';
import {EngiDB} from '../src/db/engi-db';
import {recordMistakeOutcome,MISTAKE_EPISODES_KEY} from '../src/services/mistake-episodes';
import {admitAcquisition,emptyLifecycle} from '../src/lib/engi/study-core/acquisition';
import type {Task} from '../src/lib/engi/types';
import {exportBackup,restoreBackup} from '../src/services/backup-service';
import {putBundle,getBundle} from '../src/db/repositories';
test('boundary evidence is idempotent and revision scoped',()=>{const input={taskId:'t',goalId:'g',revision:'r',kind:'end' as const,correct:false,at:new Date(0).toISOString()};const a=recordIntervalEvidence(undefined,input);assert.equal(a.end?.correct,false);assert.equal(a.start,undefined);assert.deepEqual(recordIntervalEvidence(a,input),a);const b=recordIntervalEvidence(a,{...input,taskId:'t2',revision:'r2',kind:'start',correct:true});assert.equal(b.end,undefined);assert.equal(b.start?.correct,true);});
test('partial answers preserve FSRS/acquisition, open one error, and cannot resolve it',async()=>{
 const b=intervals(),i=canonicalTargets(b).find(i=>i.factId==='f0')!,t:Task={id:'endpoint',memoryModel:'goals',learningLifecycle:1,intervalExercise:{kind:'endpoint',edge:'end'},recipe:intervalRecipe,items:[{...i,interval:{start:1900,end:1905},answer:'1905',answerId:'1905'}],options:[1904,1905,1906,1907].map(y=>({id:String(y),name:String(y)})),reason:'bootstrap'};
 const c=compileTaskContract(b,t),g=c.primaryGoals[0],d=new EngiDB('interval-test-'+crypto.randomUUID());
 try{const core=createStudyCoreService(d,{lifecycle:true}),ledger=admitAcquisition(emptyLifecycle(),i.entityId,[g],new Date(0));await d.appMeta.put({key:'studyCore:learningLifecycle',value:ledger});await d.appMeta.put({key:MISTAKE_EPISODES_KEY,value:{version:1,episodes:[]}});await core.setContentRevisions(c.contentRevisions);await core.open(c,t.id,new Date(0));await core.observe(t.id,'question','endpoint-visible','start',new Date(10));const wrong=await core.submit(t.id,'1904',new Date(100));assert(wrong.results!.every(r=>!r.credit&&!r.acquisitionCredit));await recordMistakeOutcome(d,wrong,c);assert.equal((await d.appMeta.get(MISTAKE_EPISODES_KEY))!.value.episodes.length,1);
  const right={...t,id:'second'},cc=compileTaskContract(b,right);await core.open(cc,right.id,new Date(1000));const success=await core.submit(right.id,'1905',new Date(2000));await recordMistakeOutcome(d,success,cc);assert.equal((await d.appMeta.get(MISTAKE_EPISODES_KEY))!.value.episodes[0].status,'open');assert.equal(await d.appMeta.where('key').startsWith('studyCore:memory:').count(),0);assert.deepEqual((await d.appMeta.get('studyCore:learningLifecycle'))!.value,ledger);
  const evidence=(await d.appMeta.get('studyCore:intervalEvidence:'+g.id))!.value;assert.equal(evidence.end.correct,true);assert.equal(evidence.attemptIds.length,2);
  const full:Task={...t,id:'full-too-soon',intervalExercise:undefined,items:[i],options:[i.answer,...['1899–1905','1900–1906','1901–1905']].map(y=>({id:y,name:y}))},fc=compileTaskContract(b,full);await core.setContentRevisions(fc.contentRevisions);await core.open(fc,full.id,new Date(3000));const assisted=await core.submit(full.id,i.answerId,new Date(4000));assert(!assisted.results![0].acquisitionCredit,'visible boundary must block an immediate independent full check');
  const malformed={...t,items:[{...t.items[0],answerId:'1906'}]};assert.throws(()=>compileTaskContract(b,malformed));
 }finally{d.close();await d.delete();}
});
test('backup restores date boundary precision and partial evidence without creating memory',async()=>{
 const source=new EngiDB('interval-backup-'+crypto.randomUUID()),target=new EngiDB('interval-restore-'+crypto.randomUUID());
 try{const b=intervals();b.facts[0].dateBoundaryPrecision={start:'year',end:'year'};await putBundle(source,b);const evidence=recordIntervalEvidence(undefined,{taskId:'t',goalId:'g',revision:'r',kind:'end',correct:false,at:new Date().toISOString()});await source.appMeta.put({key:'studyCore:intervalEvidence:g',value:evidence});await restoreBackup(await exportBackup(source),target);assert.deepEqual((await getBundle(target)).facts.find(f=>f.id==='f0')!.dateBoundaryPrecision,{start:'year',end:'year'});assert.deepEqual((await target.appMeta.get('studyCore:intervalEvidence:g'))!.value,evidence);assert.equal(await target.appMeta.where('key').startsWith('studyCore:memory:').count(),0);}finally{source.close();target.close();await source.delete();await target.delete();}
});
