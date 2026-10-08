import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EngiDB} from '../src/db/engi-db';
import {readStudyPreferences,saveStudyPreferences,DEFAULT_PREFERENCES} from '../src/services/study-preferences-service';
import {exportBackup,restoreBackup} from '../src/services/backup-service';
test('daily preference defaults old settings safely and rejects invalid limits without writing',async()=>{
 const d=new EngiDB('preferences-'+crypto.randomUUID());try{
  assert.deepEqual(await readStudyPreferences(d),DEFAULT_PREFERENCES);
  await d.appMeta.put({key:'studyPreferences',value:{sound:true}});assert.deepEqual(await readStudyPreferences(d),{...DEFAULT_PREFERENCES,sound:true});
  for(const value of [-1,1.5,101,NaN,Infinity])await assert.rejects(saveStudyPreferences({...DEFAULT_PREFERENCES,newCardsPerDay:value},d));
  assert.deepEqual((await d.appMeta.get('studyPreferences'))!.value,{sound:true});
  await saveStudyPreferences({...DEFAULT_PREFERENCES,newCardsPerDay:0},d);assert.equal((await readStudyPreferences(d)).newCardsPerDay,0);
 }finally{d.close();await d.delete();}
});
test('daily preference survives serialized backup and retains the other practice settings',async()=>{
 const d=new EngiDB('preferences-backup-'+crypto.randomUUID()),target=new EngiDB('preferences-restored-'+crypto.randomUUID());try{
  const preferences={sound:true,accessibleRecall:true,newCardsPerDay:12};await saveStudyPreferences(preferences,d);
  await restoreBackup(JSON.parse(JSON.stringify(await exportBackup(d))),target);assert.deepEqual(await readStudyPreferences(target),preferences);
 }finally{d.close();target.close();await d.delete();await target.delete();}
});
