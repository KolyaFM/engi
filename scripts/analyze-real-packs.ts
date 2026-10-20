import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {basename,resolve} from 'node:path';
import {mock} from 'node:test';
import {EngiDB} from '../src/db/engi-db';
import {getBundle} from '../src/db/repositories';
import {prepareDeclarativePack,commitDeclarativeImport,type PreparedImport} from '../src/services/declarative-pack';
import {createTrainerService} from '../src/services/trainer-service';
import {createDeckStudyCatalog} from '../src/services/deck-study-catalog';
import {readDeckPropertySettings,saveDeckStudySelection} from '../src/services/deck-property-settings';
import {startStudyTrace,studyTraceReport,stopStudyTrace} from '../src/services/study-selection-trace';
import {presentationFamily} from '../src/services/proposal-diversity';
import {valueOwners} from '../src/lib/engi/questions/value-cue';
import {groupContext} from '../src/services/group-affinity';
import type {Task} from '../src/lib/engi/types';

const paths=process.argv.slice(2).map(path=>resolve(path));if(!paths.length)throw Error('Pass one or more .engi file paths');
const folder=process.env.ENGI_PACK_REPORT_DIR??'artifacts/real-packs';await mkdir(folder,{recursive:true});
// Separate process + fake-indexeddb + memory-only media cache; no browser/user DB.
const media=new Map<string,Response>();Object.defineProperty(globalThis,'caches',{configurable:true,value:{open:async()=>({match:async(key:string)=>media.get(key)?.clone(),put:async(key:string,response:Response)=>{media.set(key,response.clone());},delete:async(key:string)=>media.delete(key)})}});
const prepared:PreparedImport[]=[],inventory=[];const staging=new EngiDB('real-pack-validation');
try{for(const path of paths){const p=await prepareDeclarativePack(new Blob([await readFile(path)]),staging);assert(p,'Expected a v3 pack');prepared.push(p);inventory.push({file:basename(path),name:p.pkg.name,objects:p.pkg.entities.length,images:p.files.length,bytes:p.files.reduce((sum,f)=>sum+f.bytes,0),properties:p.pkg.properties.map(p=>({name:p.name,valueType:p.valueType,subjectTypes:p.subjectTypes,questions:p.promptTemplates,learning:p.learning}))});console.log('Validated',basename(path),p.pkg.entities.length,p.files.length);}}finally{staging.close();await staging.delete();}
await writeFile(folder+'/inventory.json',JSON.stringify(inventory,null,2));
const at=Date.parse('2026-10-14T09:00:00Z'),random=Math.random,uuid=crypto.randomUUID,reports:any[]=[];
mock.timers.enable({apis:['Date'],now:at});let serial=0,seed=41;
Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};crypto.randomUUID=()=>`00000000-0000-4000-8000-${(++serial).toString(16).padStart(12,'0')}`;
try{
 const combinations=prepared.map((_,n)=>[n]);if(prepared.length>1)combinations.push(prepared.map((_,n)=>n));
 const profiles=(process.env.ENGI_PACK_PROFILES??'novice,partial,returning,extended').split(',');assert(profiles.every(p=>['novice','partial','returning','extended'].includes(p)));
 for(const packs of combinations)for(const profile of profiles){
  seed=41;serial=0;mock.timers.setTime(at);const label=packs.map(n=>basename(paths[n],'.engi')).join('+'),d=new EngiDB('real-pack-'+label+'-'+profile);let phase='import';const stats:any={packs:packs.map(n=>basename(paths[n])),profile,steps:0,formats:{},byProperty:{},errorsInjected:0,declaredKnown:0,restarts:0,checkpoints:[]};
  try{
   for(const n of packs)await commitDeclarativeImport({...prepared[n],current:await getBundle(d),seed:crypto.randomUUID()},prepared[n].decisions,d);
   const bundle=await getBundle(d),deckIds=bundle.decks!.filter(d=>!d.archived).map(d=>d.id),catalog=createDeckStudyCatalog(bundle),disabled:string[]=[];
   if(profile==='partial')for(const deck of deckIds){const options=catalog.optionsFor(deck),off=options.filter(o=>o.kind==='property').at(-1);if(off){await saveDeckStudySelection(d,deck,options.filter(o=>o.defaultEnabled&&o.id!==off.id).map(o=>o.id));disabled.push(off.label);}}
   const targets=catalog.targetsFor(deckIds,await readDeckPropertySettings(d));stats.disabled=disabled;stats.enabledTargets=targets.size;
   const svc=createTrainerService(d);startStudyTrace(d,1000);let s=await svc.startGoalFeed('all','mixed','daily',{endless:true,deckIds}),question=0;const known=new Set<string>();phase='learning';
   async function play(steps:number,offset:number,inject:boolean,drain=false){for(let n=0;n<steps;n++){
    if(drain&&!(await svc.getDayPlan('all','mixed',deckIds)).workload?.mistakes)return;
    mock.timers.setTime(at+offset+(n+1)*20000);stats.steps++;assert(!s.exhausted,`Stopped with remaining selected content at ${stats.steps}`);
    if(s.intro){assert(s.intro.unitIds.every(id=>targets.has(id)),'Disabled property reintroduced');let selections:Record<string,'red'|'green'>|undefined;
     if(profile==='partial'){const units=[...new Set(s.intro.unitIds.map(id=>id.replace(/:(forward|reverse)$/,'')))];selections=Object.fromEntries(s.intro.unitIds.map(id=>{const familiar=units.indexOf(id.replace(/:(forward|reverse)$/,''))%3===0;if(familiar)known.add(id);return[id,familiar?'green':'red'];}));stats.declaredKnown+=Object.values(selections).filter(v=>v==='green').length;}
     s=await svc.completeIntro(s.id,selections?{entityId:s.intro.entityId,introId:s.intro.introId,selections}:undefined);continue;
    }
    const q=s.tasks[0];assert(q);const family=presentationFamily(q);stats.formats[family]=(stats.formats[family]??0)+1;stats.byProperty[q.recipe.label??q.recipe.answerKey]=(stats.byProperty[q.recipe.label??q.recipe.answerKey]??0)+1;question++;
    assert(q.items.every(i=>!known.has(i.targetId)),'Declared-known property returned');
    if(q.studyContract?.primaryGoals.length)for(const item of q.items.filter(i=>!q.contextual?.supportTargetIds.includes(i.targetId)))assert(targets.has(item.targetId),'Disabled or outside-deck property was graded');
    if(q.items.length>1&&['match','categorize'].includes(q.recipe.format)&&!q.contextual){const context=groupContext(bundle),signatures=new Set(q.items.map(i=>context.signature(i,q.recipe)));assert.equal(signatures.size,1,'Mixed entities in a mapping group');if(q.recipe.format==='match'||q.presentation==='conveyor')assert(q.items.length>=3);if(q.presentation==='conveyor')assert(q.items.length<=6);}
    if(q.recipe.format==='sort')assert(q.items.length>=3&&q.items.length<=5);
    const response=q.studyContract!.response;if(response.kind==='choice'&&q.items[0].valueCue){const owners=valueOwners(bundle,q.items[0].valueCue.key);assert(!q.options.some(o=>o.id!==response.expected&&owners.has(o.id)),'Reverse question contains another correct answer');}
    await svc.observeVisibility(s.id,q.id,'question','q:'+q.id,'start');const memory=await d.appMeta.where('key').startsWith('studyCore:memory:').toArray();
    if(q.recipe.format==='self_check'){for(const item of q.items)await svc.observeVisibility(s.id,q.id,`card-reveal:${item.entityId}`,'flip:'+q.id+':'+item.entityId,'start');s=await svc.advanceFeed(s.id,true,q.id);}
    else{
     if(q.recipe.format==='recall_reveal'){await svc.saveInteraction(s.id,q.id,{revealed:true,recallElapsedMs:5000});await svc.observeVisibility(s.id,q.id,'answer-reveal','answer:'+q.id,'start');}
     if(response.kind==='mapping'){for(const binding of response.bindings.filter(b=>!b.support))await svc.answerMatchPair({sessionId:s.id,taskId:q.id,entityId:binding.responseKey,answerId:binding.expected,requestId:crypto.randomUUID()});}
     else{const expected='expected' in response?response.expected:response.kind==='self-report'?true:undefined;assert.notEqual(expected,undefined,response.kind);
      if(inject&&response.kind==='choice'&&question%5===0&&stats.errorsInjected<8){const wrong=q.options.find(o=>o.id!==response.expected)!;await svc.answer({sessionId:s.id,taskId:q.id,answer:wrong.id});stats.errorsInjected++;}
      await svc.answer({sessionId:s.id,taskId:q.id,answer:expected});
     }
     await svc.observeVisibility(s.id,q.id,'question','q:'+q.id,'end');s=await svc.advanceFeed(s.id,false,q.id);
    }
    if(q.intent==='practice')assert.deepEqual(await d.appMeta.where('key').startsWith('studyCore:memory:').toArray(),memory,'Practice changed FSRS');
    if(n%20===19){s=(await createTrainerService(d).getResumableSession({endless:true}))!;stats.restarts++;assert(s);}
   }}
   if(profile==='returning'){await play(90,0,false);stats.checkpoints.push({phase:'before-break',workload:(await svc.getDayPlan('all','mixed',deckIds)).workload});mock.timers.setTime(at+7*86400000);s=(await svc.getResumableSession({endless:true}))!;assert(s);await play(60,7*86400000,true);}else await play(profile==='extended'?160:70,0,profile==='novice');
   if(profile==='novice'||profile==='returning'){stats.errorsBeforeDrain=(await svc.getDayPlan('all','mixed',deckIds)).workload?.mistakes??0;const before=stats.steps;await play(100,profile==='returning'?7*86400000+60*20000:70*20000,false,true);stats.drainSteps=stats.steps-before;assert.equal((await svc.getDayPlan('all','mixed',deckIds)).workload?.mistakes,0,'Correct continuation must resolve remaining errors');}
   const plan=await svc.getDayPlan('all','mixed',deckIds),ledger=(await d.appMeta.get('studyCore:learningLifecycle'))!.value,trace=studyTraceReport(d);stats.workload=plan.workload;stats.introduced=ledger.cards.length;stats.dailyIntroductions=ledger.cards.filter((c:any)=>c.source==='daily').length;stats.extraIntroductions=ledger.cards.filter((c:any)=>c.source==='extra').length;stats.completedProperties=ledger.units.filter((u:any)=>u.stage==='completed').length;stats.resolvedErrors=((await d.appMeta.get('studyCore:mistakeEpisodes'))?.value.episodes??[]).filter((e:any)=>e.status==='resolved').length;stats.groupOpportunities=trace.filter(e=>e.kind==='selection'&&(e.decision as any)?.checks.matching.status==='generated').length;
   reports.push({stats,trace});console.log(JSON.stringify(stats));await writeFile(folder+'/'+reports.length+'.json',JSON.stringify({stats,trace},null,2));
  }catch(error){stats.failure={phase,message:(error as Error).message,stack:(error as Error).stack};const state={mistakes:(await d.appMeta.get('studyCore:mistakeEpisodes'))?.value,lifecycle:(await d.appMeta.get('studyCore:learningLifecycle'))?.value,memories:await d.appMeta.where('key').startsWith('studyCore:memory:').toArray(),exposures:await d.appMeta.where('key').startsWith('studyCore:exposure:').toArray()};reports.push({stats,state,trace:studyTraceReport(d)});await writeFile(folder+'/'+reports.length+'.json',JSON.stringify(reports.at(-1),null,2));console.log('FAILED',label,profile,(error as Error).message);}
  finally{stopStudyTrace(d);d.close();await d.delete();}
 }
}finally{mock.timers.reset();Math.random=random;crypto.randomUUID=uuid;await writeFile(folder+'/summary.json',JSON.stringify({inventory,scenarios:reports.map(r=>r.stats)},null,2));}
if(reports.some(r=>r.stats.failure))process.exitCode=1;
