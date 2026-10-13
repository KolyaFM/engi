import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {Bundle} from '../src/lib/engi/types';
import {EngiDB} from '../src/db/engi-db';
import {putBundle} from '../src/db/repositories';
import {createDeckStudyCatalog} from '../src/services/deck-study-catalog';
import {readDeckPropertySettings,saveDeckPropertySelection,saveDeckStudySelection} from '../src/services/deck-property-settings';
import {exportBackup,restoreBackup} from '../src/services/backup-service';
import {propertyFixture} from './fixtures/deck-properties';
test('catalog lists available properties independently of imported defaults; selected union deduplicates',()=>{
 const b=propertyFixture(),catalog=createDeckStudyCatalog(b);
 assert.deepEqual(catalog.optionsFor('a').map(o=>[o.propertyId,o.defaultEnabled]),[['other',false],['year',true]]);
 assert.equal(catalog.targetsFor(['a']).size,8);assert.equal(catalog.targetsFor(['a','b','a']).size,16);
 assert.equal(createDeckStudyCatalog(b),catalog);
});
test('mixed types expose independent property options and preserve legacy selections',()=>{
 const b=propertyFixture();b.entities[0].type='person';b.entities[1].type='person';b.properties!.forEach(p=>p.subjectTypes=undefined);
 const catalog=createDeckStudyCatalog(b),years=catalog.optionsFor('a').filter(o=>o.propertyId==='year');
 assert.equal(years.length,2);assert.equal(new Set(years.map(o=>o.id)).size,2);
 const person=years.find(o=>o.subjectType==='person')!;
 const settings={version:1 as const,revision:1,byDeck:{a:{disabledPropertyIds:[],imageRecognition:true,optionOverrides:{[person.id]:false}}}};
 const targets=catalog.targetsFor(['a'],settings);assert(!targets.has('ku:fact:year0:forward'));assert(targets.has('ku:fact:year2:forward'));
 const legacy={version:1 as const,revision:1,byDeck:{a:{disabledPropertyIds:['year'],imageRecognition:false}}};assert(![...catalog.targetsFor(['a'],legacy)].some(id=>id.includes('year')));
});
test('typed choices persist, survive backup, keep hidden choices and reject stale input atomically',async()=>{
 const d=new EngiDB('typed-settings-'+crypto.randomUUID()),restored=new EngiDB('typed-restored-'+crypto.randomUUID());try{
  const b=propertyFixture();b.entities[0].type='person';b.entities[1].type='person';b.properties!.forEach(p=>p.subjectTypes=undefined);await putBundle(d,b);
  const options=createDeckStudyCatalog(b).optionsFor('a'),selected=options.filter(o=>o.subjectType==='state').map(o=>o.id),saved=await saveDeckStudySelection(d,'a',selected);
  assert.deepEqual(await readDeckPropertySettings(d),saved);assert([...createDeckStudyCatalog(b).targetsFor(['a'],saved)].every(id=>!id.includes('0:')&&!id.includes('1:')));
  await restoreBackup(JSON.parse(JSON.stringify(await exportBackup(d))),restored);assert.deepEqual(await readDeckPropertySettings(restored),saved);
  await assert.rejects(saveDeckStudySelection(d,'a',['stale']));assert.deepEqual(await readDeckPropertySettings(d),saved);
  await d.propertyDefinitions.update('year',{archived:true});const later=await saveDeckStudySelection(d,'a',selected.filter(id=>!id.includes('year')));assert.equal(later.byDeck.a.optionOverrides![options.find(o=>o.subjectType==='person'&&o.propertyId==='year')!.id],false);
  assert.equal(await d.learningState.count(),0);
 }finally{d.close();restored.close();await d.delete();await restored.delete();}
});
test('new permissible properties default on after customization, excluded and untrusted facts stay out',()=>{
 const b=propertyFixture(),settings={version:1 as const,revision:1,byDeck:{a:{disabledPropertyIds:['year'],imageRecognition:false}}};
 b.properties!.push({id:'later',name:'Later',valueKind:'date',cardinality:'one',learnable:true});
 b.facts.push({...b.facts[0],id:'later0',key:'later'});b.decks![0].learning.excludedFactIds=['other0'];b.facts.find(f=>f.id==='other1')!.verification='ambiguous';
 const catalog=createDeckStudyCatalog(b),targets=catalog.targetsFor(['a'],settings);
 assert(targets.has('ku:fact:later0:forward'));assert(!targets.has('ku:fact:other0:forward'));assert(!targets.has('ku:fact:other1:forward'));assert(![...targets].some(id=>id.includes('year')));
});
test('main image recognition and image-valued facts are independently selectable',()=>{
 const b=propertyFixture();b.properties!.push({id:'flag',name:'Флаг',valueKind:'image',cardinality:'one',learnable:true});
 for(let n=0;n<4;n++){b.media.push({id:'map'+n,entityId:'e'+n,role:'primary',primary:true,url:'https://example.com/map'+n+'.png',license:'test'},{id:'flag'+n,entityId:'e'+n,role:'flag',url:'https://example.com/flag'+n+'.png',license:'test'});b.facts.push({id:'flag-fact'+n,entityId:'e'+n,key:'flag',valueKind:'image',valueMediaId:'flag'+n,verification:'verified',source:{name:'Test'}});}
 const catalog=createDeckStudyCatalog(b),options=catalog.optionsFor('b');assert.equal(options[0].kind,'imageRecognition');assert(options.some(o=>o.propertyId==='flag'&&o.kind==='property'));
 const flags=catalog.targetsFor(['b'],{version:1,revision:1,byDeck:{b:{disabledPropertyIds:['year','other'],imageRecognition:false}}});assert.equal(flags.size,4);assert([...flags].every(id=>id.startsWith('ku:fact:flag-fact')));
 const maps=catalog.targetsFor(['b'],{version:1,revision:2,byDeck:{b:{disabledPropertyIds:['year','other','flag'],imageRecognition:true}}});assert.equal(maps.size,4);assert([...maps].every(id=>id.startsWith('ku:entity:')));
});
test('personal property settings survive backup restoration without changing pack defaults',async()=>{
 const d=new EngiDB('property-backup-'+crypto.randomUUID()),restored=new EngiDB('property-restored-'+crypto.randomUUID());try{
  await putBundle(d,propertyFixture());const settings=await saveDeckPropertySelection(d,'a',['other'],false),backup=await exportBackup(d);await restoreBackup(JSON.parse(JSON.stringify(backup)),restored);
  assert.deepEqual(await readDeckPropertySettings(restored),settings);assert.deepEqual((await restored.decks.get('a'))!.learning.propertyIds,['year']);
 }finally{d.close();restored.close();await d.delete();await restored.delete();}
});
test('personal exclusions survive reopening, enable later properties and allow an empty scope',async()=>{
 const d=new EngiDB('property-settings-'+crypto.randomUUID());try{const b=propertyFixture();await putBundle(d,b);
  const saved=await saveDeckPropertySelection(d,'a',['other'],false);
  assert.equal(saved.revision,1);assert.deepEqual(saved.byDeck.a.disabledPropertyIds,['year']);
  assert.deepEqual(await readDeckPropertySettings(d),saved);
  assert.equal(createDeckStudyCatalog(b).targetsFor(['a'],saved).size,8);
  const empty=await saveDeckPropertySelection(d,'a',[],false);assert.equal(createDeckStudyCatalog(b).targetsFor(['a'],empty).size,0);
  assert.equal(createDeckStudyCatalog(b).targetsFor(['a','b'],empty).size,16);
  await assert.rejects(saveDeckPropertySelection(d,'a',['not-a-property'],false));
  assert.equal((await d.decks.get('a'))!.learning.propertyIds![0],'year');
 }finally{d.close();await d.delete();}
});
test('saving while a property is temporarily unavailable preserves its exclusion',async()=>{
 const d=new EngiDB('property-missing-'+crypto.randomUUID());try{await putBundle(d,propertyFixture());await saveDeckPropertySelection(d,'a',['other'],false);
  await d.propertyDefinitions.update('year',{archived:true});const saved=await saveDeckPropertySelection(d,'a',['other'],false);assert(saved.byDeck.a.disabledPropertyIds.includes('year'));
  await d.propertyDefinitions.update('year',{archived:false});const {getBundle}=await import('../src/db/repositories');assert(![...createDeckStudyCatalog(await getBundle(d)).targetsFor(['a'],saved)].some(id=>id.includes('year')));
 }finally{d.close();await d.delete();}
});
