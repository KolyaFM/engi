import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {EngiDB} from '../src/db/engi-db';
import {getBundle} from '../src/db/repositories';
import {prepareDeclarativePack,planDeclarativeImport,commitDeclarativeImport} from '../src/services/declarative-pack';
import {canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {triagedMemory} from '../src/lib/engi/learning/bootstrap';
import {composeUnit} from '../src/lib/engi/session/composer';
import {preflight} from '../src/lib/engi/engine';
const cache=new Map<string,Response>();Object.defineProperty(globalThis,'caches',{configurable:true,value:{open:async()=>({match:async(k:string)=>cache.get(k)?.clone(),put:async(k:string,r:Response)=>{cache.set(k,r.clone())},delete:async(k:string)=>cache.delete(k)}),delete:async()=>{cache.clear();return true}}});
const root='/workspace/scratch/73fdfe31e28a/engi-test-packs/';
const d=new EngiDB('generated-packs-'+crypto.randomUUID());
const slugs=['01-base','02-shared-authors','03-coauthors','04-homonym','05-date-conflict','06-date-scope','07-unverified'];
const counts=[10,12,14,15,15,15,16];const results=[];
try{
 for(const [n,slug] of slugs.entries()){
  const p=await prepareDeclarativePack(new Blob([await readFile(root+slug+'.engi')]),d);assert(p);
  let plan=planDeclarativeImport(p);const seen=[];
  for(let pass=0;plan.issues.length&&pass<8;pass++){
   for(const i of plan.issues){seen.push({kind:i.kind,label:i.label,detail:i.detail});
    if(slug==='04-homonym'&&i.kind==='entity')p.decisions[i.key]='new';
    else if(slug==='05-date-conflict'&&i.kind==='entity')p.decisions[i.key]=i.options.find(o=>o.value!=='new')!.value;
    else if(slug==='05-date-conflict'&&i.kind==='fact')p.decisions[i.key]='keep';
    else throw Error(slug+' unexpected issue '+JSON.stringify(i));
   }plan=planDeclarativeImport(p);
  }
  assert.equal(plan.issues.length,0);await commitDeclarativeImport(p,p.decisions,d);
  const b=await getBundle(d);assert.equal(b.entities.length,counts[n]);assert.equal(b.entities.filter(e=>e.type==='person').length,4);assert.equal(b.decks!.length,n+1);
  const targets=canonicalTargets(b,plan.deckId);if(slug==='07-unverified')assert.equal(targets.length,0);
  if(slug==='06-date-scope')assert.equal(targets.length,4);
  if(slug==='03-coauthors'){
   assert.equal(targets.length,5);
   for(const target of targets){const unit=composeUnit(b,triagedMemory(target,'red','',0),plan.deckId);assert(unit);assert.equal(unit.recipe.format,'multi_choice');assert(preflight(unit));}
  }
  if(slug==='05-date-conflict')assert.equal(b.facts.find(f=>f.entityId===b.entities.find(e=>e.name==='Тестовая картина «Квадрат»')!.id&&f.key==='creation_date'&&!f.archived)!.dateStart,'2001-01-01');
  results.push({file:slug+'.engi',entities:b.entities.length,decks:b.decks!.length,learningTargets:targets.length,decisions:seen});
 }
 const before=await getBundle(d);const p=await prepareDeclarativePack(new Blob([await readFile(root+'01-base.engi')]),d);assert(p);const plan=planDeclarativeImport(p);
 assert.equal(plan.issues.length,0);assert.equal(plan.stats.newEntities,0);assert.equal(plan.stats.newFacts,0);
 await commitDeclarativeImport(p,p.decisions,d);const after=await getBundle(d);assert.equal(after.entities.length,before.entities.length);assert.equal(after.facts.length,before.facts.length);assert.equal(after.media.length,before.media.length);assert.equal(after.decks!.length,before.decks!.length);
 await writeFile(root+'verification.json',JSON.stringify({status:'passed',schemaVersion:3,checks:['ZIP and image hashes','sequential import','shared authors and alias','multiple correct answers and preflight','homonym separation','date conflict kept existing','date-only scope','unverified facts excluded','repeat import without duplicates'],results},null,2)+'\n');
 console.log(JSON.stringify(results,null,2));console.log('ALL PACK CHECKS PASSED');
}finally{d.close();await d.delete()}
