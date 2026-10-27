import 'fake-indexeddb/auto';
import {test} from 'node:test';import assert from 'node:assert/strict';
import {dateValue,buildImportPlan} from '../src/lib/engi/import/semantic-merge';
import {parseV3} from '../src/lib/engi/import/schema-v3';
import {formatDateFact,yearInterval} from '../src/lib/engi/questions/date-interval';
import {buildIntervalScale,intervalAxisTicks} from '../src/lib/engi/questions/interval-scale';
import {factValue} from '../src/lib/engi/knowledge/properties';
import {canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {composeUnit} from '../src/lib/engi/session/composer';import {triagedMemory} from '../src/lib/engi/learning/bootstrap';
import {compileTaskContract} from '../src/lib/engi/study-core/compiler';
import type {Bundle,Fact} from '../src/lib/engi/types';
import {formatHistoricalYear,historicalYear,toYearIndex,dateOrderKey} from '../src/lib/engi/historical-date';
import {orderingValues} from '../src/lib/engi/questions/ordering';
import {nearbyNumericDistractors} from '../src/lib/engi/questions/numeric-distractors';
import {buildLearningChronology} from '../src/services/learning-chronology';
import {buildIntervalGroup} from '../src/services/interval-group-composition';
import {valueCue} from '../src/lib/engi/questions/value-cue';
import {buildEndpointTask} from '../src/services/interval-composition';
import {EngiDB} from '../src/db/engi-db';import {putBundle,getBundle} from '../src/db/repositories';
import {exportBackup,restoreBackup} from '../src/services/backup-service';
import {ZipWriter,BlobWriter,TextReader,configure} from '@zip.js/zip.js';import {importPackDirect} from '../src/services/pack-service';
import {validateImport} from '../src/lib/engi/validate';
const fact=(value:unknown):Fact=>({id:'f',entityId:'e',key:'period',valueKind:'date',...dateValue(value),verification:'verified',source:{kind:'manual',name:'Test'}});
test('historical dates default to CE and preserve legacy date storage and fingerprints',()=>{
 for(const year of [1,44,99,100,1144,2026]){const legacy=dateValue(String(year).padStart(4,'0'));assert.deepEqual(dateValue({year}),legacy);assert.deepEqual(dateValue({year,era:'CE'}),legacy);}
 assert.equal(factValue(fact('1144')),factValue(fact({year:1144})));
 assert.equal(dateValue('0044-02').dateEnd,'0044-02-29');
});
test('BCE-only and cross-era ranges normalize to continuous chronological years',()=>{
 const ancient=fact({start:{year:100,era:'BCE'},end:{year:44,era:'BCE'}}),cross=fact({start:{year:27,era:'BCE'},end:14});
 assert.deepEqual(yearInterval(ancient),{start:-99,end:-43});assert.deepEqual(yearInterval(cross),{start:-26,end:14});
 assert.equal(formatDateFact(ancient),'100–44 до н. э.');assert.equal(formatDateFact(cross),'27 до н. э. — 14 н. э.');
 assert.equal(formatDateFact(fact({year:1,era:'BCE'})),'1 до н. э.');assert.equal(formatDateFact(fact({year:1})),'1');
 assert.notEqual(factValue(fact({year:44,era:'BCE'})),factValue(fact({year:44})));
});
test('era dates reject invalid years, ambiguous syntax and reversed ranges',()=>{
 for(const value of [{year:0},{year:-44},{year:1.5},{year:44,era:null},{year:44,era:'BC'},{year:44,era:'BCE',month:3},{start:{year:44,era:'BCE'},end:{year:100,era:'BCE'}},{start:14,end:{year:27,era:'BCE'}},'0000',-44])assert.throws(()=>dateValue(value),JSON.stringify(value));
 const approximate=fact({start:{year:100,era:'BCE'},end:{year:44,era:'BCE'},approximate:true});assert.equal(yearInterval(approximate),undefined);
});
test('period scale accepts BCE and the boundary year without inserting a missing calendar year',()=>{
 const scale=buildIntervalScale([{id:'a',start:-6,end:-3},{id:'b',start:-2,end:2},{id:'c',start:0,end:0}],'dated',300);assert(scale);
 assert(intervalAxisTicks(scale.min,scale.max,300).length>=2);
 const ticks=intervalAxisTicks(-10,25,300);assert(ticks.some(y=>y<=0));assert(ticks.some(y=>y>=1));
});
test('derived start at 1 BCE is an available exact question and does not disclose the whole period',()=>{
 const f=fact({start:{year:1,era:'BCE'},end:14}),b:Bundle={entities:[{id:'e',name:'Период',type:'event',aliases:[],externalIds:{}}],facts:[f],properties:[{id:'period',name:'Период',valueKind:'date',cardinality:'one',learnable:true,learning:{reverse:false,periodStart:{name:'Начало'}}}],media:[],tags:[],entityTags:[],missing:[],unresolved:[]};
 const start=canonicalTargets(b).find(i=>i.dateEdge);assert(start);assert.equal(start.year,0);assert.equal(start.answer,'1 до н. э.');
 const q=composeUnit(b,triagedMemory(start,'red','',0),'all','choice')!;assert(q);assert(q.options.some(o=>o.name==='1 до н. э.'));assert(!q.options.some(o=>/^0(?:\s|$)/.test(o.name)));
 assert.equal(compileTaskContract(b,q).primaryGoals[0].precision,'period-start-year');
});
test('historical syntax remains a v3 package extension and does not create new identities on CE reimport',()=>{
 const pkg=(value:unknown)=>parseV3({schemaVersion:3,name:'Test',properties:[{name:'Дата',valueType:'date'}],entities:[{name:'Event',type:'Событие',facts:[{property:'Дата',value,source:{kind:'manual',name:'Test'},verification:'verified'}]}]});
 const empty:Bundle={entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[]},old=buildImportPlan(pkg('0044'),empty,{},'old'),next=buildImportPlan(pkg({year:44}),old.bundle,{},'new');
 assert.deepEqual(next.issues,[]);assert.deepEqual(next.bundle.facts,old.bundle.facts);assert.deepEqual(next.resetFactIds,[]);
});
const historicalBundle=(values:unknown[]):Bundle=>({entities:values.map((_,n)=>({id:'e'+n,name:'Event '+n,type:'event',aliases:[],externalIds:{}})),facts:values.map((v,n)=>({...fact(v),id:'f'+n,entityId:'e'+n})),properties:[{id:'period',name:'Период',valueKind:'date',cardinality:'one',learnable:true,learning:{reverse:true,sort:'on'}}],media:[],tags:[],entityTags:[],missing:[],unresolved:[]});
test('year coordinates round trip and preserve the historical 1 BCE to 1 CE transition',()=>{
 for(const era of ['BCE','CE'] as const)for(const year of [1,2,44,100,9999])assert.deepEqual(historicalYear(toYearIndex(year,era)),{year,era});
 assert.equal(toYearIndex(1)-toYearIndex(1,'BCE'),1);
 assert(dateOrderKey(fact({year:2,era:'BCE'}))<dateOrderKey(fact({year:1,era:'BCE'})));
 assert(!/\b0\b/.test(formatHistoricalYear(0)));assert.equal(formatDateFact(fact({year:44,era:'BCE',approximate:true})),'Около 44 до н. э.');
});
test('nearby years cross eras without zero and can put the correct year at every rank',()=>{
 const b=historicalBundle([{year:1,era:'BCE'},1,2]),item=canonicalTargets(b).find(i=>i.factId==='f0'&&!i.valueCue)!;
 const q=composeUnit(b,triagedMemory(item,'red','',0),'all','choice')!;assert(q);
 for(const r of [0,.26,.51,.76]){const wrong=nearbyNumericDistractors(b,item,q.recipe,()=>r)!;assert.equal(wrong.length,3);assert(wrong.every(o=>o.id!=='0'&&!/^0\s/.test(o.name)));assert(wrong.every(o=>o.name===o.id));}
 assert.notEqual(valueCue(b,b.facts[0])!.key,valueCue(b,b.facts[1])!.key);
});
test('ordering and contextual chronology use actual BCE chronology and do not reverse BCE numbers',()=>{
 const b=historicalBundle([{year:100,era:'BCE'},{year:44,era:'BCE'},{year:1,era:'BCE'},1]);
 const proposals=canonicalTargets(b).filter(i=>!i.valueCue).map(i=>{const q=composeUnit(b,triagedMemory(i,'red','',0),'all','choice')!;return {recipe:q.recipe,items:q.items,goals:compileTaskContract(b,q).primaryGoals};});
 const q=buildLearningChronology(b,proposals,[],[],0)!;assert(q);const c=compileTaskContract(b,q);assert(c.response.kind==='order');assert.deepEqual(c.response.expected,['e3','e2','e1','e0']);
 assert(orderingValues([b.facts[0]])!.max<orderingValues([b.facts[1]])!.min);assert(orderingValues([b.facts[2]])!.max<orderingValues([b.facts[3]])!.min);
});
test('period tasks and endpoint choices preserve eras in both answers and evidence',()=>{
 const b=historicalBundle([{start:{year:10,era:'BCE'},end:{year:5,era:'BCE'}},{start:{year:7,era:'BCE'},end:3},{start:1,end:8}]),proposals=canonicalTargets(b).filter(i=>!i.valueCue).map(i=>{const q=composeUnit(b,triagedMemory(i,'red','',0),'all','choice')!;return {recipe:q.recipe,items:q.items,goals:compileTaskContract(b,q).primaryGoals};});
 const group=buildIntervalGroup(b,proposals,[],300)!;assert(group);assert.equal(compileTaskContract(b,group).primaryGoals.length,3);
 const i=canonicalTargets(b).find(i=>i.factId==='f1'&&!i.valueCue)!,exact=composeUnit(b,triagedMemory(i,'red','',0),'all','choice')!;
 const endpoint=buildEndpointTask(b,exact,undefined,[])!;assert(endpoint);assert.match(endpoint.items[0].answer,/до н\. э\./);assert.equal(compileTaskContract(b,endpoint).primaryGoals.length,1);assert(endpoint.options.every(o=>!/^0(?:\s|$)/.test(o.name)));
});
test('BCE backups preserve eras and use a version that old apps cannot silently downgrade',async()=>{
 const a=new EngiDB('historical-backup-a-'+crypto.randomUUID()),b=new EngiDB('historical-backup-b-'+crypto.randomUUID());try{
  const content=historicalBundle([{year:44,era:'BCE'},{start:{year:27,era:'BCE'},end:14},1144]);await putBundle(a,content);
  const backup=await exportBackup(a);assert.equal(backup.schemaVersion,4);await restoreBackup(JSON.parse(JSON.stringify(backup)),b);assert.deepEqual((await getBundle(b)).facts,content.facts);
 }finally{a.close();b.close();await a.delete();await b.delete();}
});
test('legacy raw-fact packages cannot carry BCE data under an old format version',async()=>{
 configure({useWebWorkers:false});const d=new EngiDB('legacy-bce-'+crypto.randomUUID());try{
  const content=historicalBundle([{year:44,era:'BCE'}]);content.facts[0].source={kind:'url',name:'Test',url:'https://example.org/test'};
  const w=new ZipWriter(new BlobWriter());await w.add('manifest.json',new TextReader(JSON.stringify({format:'engi-pack',schemaVersion:2,packId:'bce-legacy',packVersion:1,name:'Test',createdAt:new Date().toISOString(),files:[]})));await w.add('bundle.json',new TextReader(JSON.stringify(content)));
  const blob=await w.close();await assert.rejects(()=>importPackDirect(blob,()=>{},d),/schemaVersion 3/);assert.equal(await d.facts.count(),0);
 }finally{d.close();await d.delete();}
});
test('a year-precision fact cannot hide an endpoint in another era',()=>{
 const b=historicalBundle([{year:44,era:'BCE'}]);delete b.facts[0].dateEndEra;
 const empty:Bundle={entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[]};
 assert.throws(()=>validateImport(b,empty,true));assert.equal(orderingValues(b.facts),undefined);
});
