/** Read-only pack inspection; all study writes use disposable fake IndexedDB databases. */
import 'fake-indexeddb/auto';
import {mock} from 'node:test';
import {readFileSync,writeFileSync} from 'node:fs';
import {EngiDB} from '../src/db/engi-db';
import {prepareDeclarativePack,planDeclarativeImport} from '../src/services/declarative-pack';
import {getBundle,putBundle,learningRow} from '../src/db/repositories';
import {recipes,eligible,canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {triagedMemory} from '../src/lib/engi/learning/bootstrap';
import {buildGoalCatalog} from '../src/services/goal-catalog';
import {createTrainerService} from '../src/services/trainer-service';
import {graduateGoalMemory} from '../src/lib/engi/study-core/memory';
import {discreteAnswer} from '../src/lib/engi/questions/timeline';
const packPath=process.argv[2]??'C:/Users/KolyaFM/Downloads/usa-50-states-v3-fixed.engi';
const inspection=new EngiDB('chronology-pack-inspection-'+crypto.randomUUID());
const file=new Blob([new Uint8Array(readFileSync(packPath))]);
let bundle:any,deckId:string|undefined;const reports:any[]=[];
try{const prepared=await prepareDeclarativePack(file,inspection);if(!prepared)throw Error('Expected v3 pack');const plan=planDeclarativeImport(prepared);if(plan.issues.length)throw Error(JSON.stringify(plan.issues));bundle=plan.bundle;deckId=plan.deckId;
 const dates=bundle.facts.filter((f:any)=>f.valueKind==='date'),diagnostics=recipes(bundle).filter(r=>r.diagnostic);
 const report={name:prepared.pkg.name,imageFilesValidated:prepared.files.length,dateFacts:dates.length,uniqueYears:new Set(dates.map((f:any)=>f.dateStart.slice(0,4))).size,datePrecision:[...new Set(dates.map((f:any)=>f.datePrecision))],dateProperties:bundle.properties.filter((p:any)=>p.valueKind==='date'),recipes:diagnostics.map(r=>({format:r.format,scope:r.tag??'all',pool:eligible(bundle,r).length})),deckId};reports.push({inspection:report});console.log(JSON.stringify(report));
}finally{inspection.close();await inspection.delete();}
for(const scenario of [{name:'fresh-mixed-10s',format:'mixed',seconds:10,seed:false,count:500},{name:'learned-mixed',format:'mixed',seconds:10,seed:true,count:200},{name:'learned-timeline',format:'timeline',seconds:10,seed:true,count:80}]){
 const d=new EngiDB('chronology-pack-simulation-'+crypto.randomUUID()),initial=new Date(2026,9,8,10).getTime();mock.timers.enable({apis:['Date'],now:initial});
 try{await putBundle(d,bundle);await d.appMeta.put({key:'studyPreferences',value:{newCardsPerDay:scenario.seed?0:10}});
  if(scenario.seed){for(const item of canonicalTargets(bundle))await d.learningState.put(learningRow(triagedMemory(item,'red','seed',0)));await d.appMeta.put({key:'introducedEntities',value:[...new Set(canonicalTargets(bundle).map(i=>i.entityId))]});const cat=buildGoalCatalog(bundle,(await d.learningState.toArray()).map(r=>r.payload));for(const e of cat.filter(e=>e.goal.skill==='recognition')){const m=graduateGoalMemory(e.goal,new Date(initial-86400000));m.card.due=new Date(initial+86400000);await d.appMeta.put({key:'studyCore:memory:'+e.goal.id,value:m});}}
  const svc=createTrainerService(d);let s=await svc.startGoalFeed(deckId??'all',scenario.format,'daily',{endless:true});const counts:Record<string,number>={},screens:any[]=[];let firstChronology:number|undefined;
  for(let n=0;n<scenario.count;n++){mock.timers.setTime(initial+n*scenario.seconds*1000);const ledger=(await d.appMeta.get('studyCore:learningLifecycle'))?.value;
   if(s.intro){counts.intro=(counts.intro??0)+1;screens.push({screen:n,format:'intro',firstChecks:ledger?.units.filter((u:any)=>u.stage==='first-check').length});s=await svc.completeIntro(s.id);continue;}
   const t=s.tasks[0];if(!t){counts.exhausted=(counts.exhausted??0)+1;break;}counts[t.recipe.format]=(counts[t.recipe.format]??0)+1;
   if((t.recipe.diagnostic||t.contextual)&&firstChronology===undefined)firstChronology=n;if(t.contextual?.kind==='boundary')counts.boundary=(counts.boundary??0)+1;
   screens.push({screen:n,format:t.recipe.format,reason:t.reason,firstChecks:ledger?.units.filter((u:any)=>u.stage==='first-check').length,completedDates:ledger?.units.filter((u:any)=>u.stage==='completed'&&bundle.facts.some((f:any)=>f.id===u.goal.knowledge.key&&f.valueKind==='date')).length});
   if(t.recipe.format==='recall_reveal')await svc.saveInteraction(s.id,t.id,{revealed:true,recallElapsedMs:5000});
   if(['match','categorize'].includes(t.recipe.format)&&t.items.length>1){for(const item of t.items)await svc.answerMatchPair({sessionId:s.id,taskId:t.id,entityId:item.entityId,answerId:item.answerId,requestId:crypto.randomUUID()});}
   else{const answer=t.recipe.format==='sort'?t.studyContract!.response.expected:t.recipe.format==='timeline'?{[t.items[0].entityId]:t.items[0].year}:t.recipe.format==='recall_reveal'?true:t.recipe.format==='multi_choice'?t.answerSet:discreteAnswer(t);await svc.answer({sessionId:s.id,taskId:t.id,answer});}
   s=await svc.advanceFeed(s.id,false,t.id);
  }const chronology=(counts.timeline??0)+(counts.sort??0)+(counts.missing??0)+(counts.boundary??0),summary={...scenario,counts,firstChronology,firstChronologyMinutes:firstChronology===undefined?null:firstChronology*scenario.seconds/60,chronology,totalScreens:screens.length,sharePercent:100*chronology/screens.length};reports.push({summary,screens});console.log(JSON.stringify(summary));
 }finally{d.close();await d.delete();mock.timers.reset();}
}
writeFileSync('artifacts/usa-states-chronology-audit.json',JSON.stringify(reports,null,2));
