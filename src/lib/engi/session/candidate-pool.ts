import type {Bundle,Memory,Snapshot,Task} from '../types';
import type {SessionRow} from '../../../db/engi-db';
import {canonicalTargets} from '../questions/recipe-factory';
import {composeUnit,composeFeed} from './composer';
import {unitDue} from '../learning/bootstrap';
import {localDay} from '../knowledge/motivation';

export function dailyNewState(value:any):NonNullable<Snapshot['newLearning']>{return value?.day===localDay()?value:{day:localDay(),introducedEntityIds:[],extraBudget:0}}
export function pickFeed(b:Bundle,memories:Memory[],s:SessionRow,newState:NonNullable<Snapshot['newLearning']>,introduced:string[]=[],newCardsPerDay?:number){
 const units=canonicalTargets(b,s.tag??'all'),unitIds=new Set(units.map(i=>i.targetId)),mem=new Map(memories.filter(m=>!m.legacyOf).map(m=>[m.id,m])),history=s.cooldown??[],completed=s.completedCount??0;
 s.repairQueue=(s.repairQueue??[]).filter(t=>t.items.every(i=>unitIds.has(i.targetId)&&mem.get(i.targetId)?.status!=='suspended'));
 const repair=s.repairQueue.find(t=>(t.retryAfter??0)<=completed&&!history.slice(-3).some(h=>h.items.some(i=>i.entityId===t.items[0].entityId)));
 if(repair){s.repairQueue=s.repairQueue!.filter(t=>t.id!==repair.id);return {task:repair}}
 const ordinary=history.filter(t=>!t.recipe.diagnostic&&!t.retryOf&&t.reason!=='intro'),blockSize=(s.ordinaryCount??0)%15,block=blockSize?ordinary.slice(-blockSize):[];
 const sameEntity=(id:string)=>history.slice(-6).some(t=>t.items.some(i=>i.entityId===id));
 const due=units.filter(i=>{const m=mem.get(i.targetId);return m&&unitDue(m,s.id,completed)});
 const known=units.filter(i=>mem.has(i.targetId)&&mem.get(i.targetId)!.status!=='suspended');
 let candidates=(s.mode==='practice'?known:due).filter(i=>!sameEntity(i.entityId));
 const unused=candidates.filter(i=>!block.some(t=>t.items.some(x=>x.entityId===i.entityId)));if(unused.length)candidates=unused;
 if(!candidates.length&&s.mode==='practice')candidates=known;
 const narrowTags=(entityId:string)=>b.entityTags.filter(t=>t.entityId===entityId&&!t.archived&&b.entityTags.filter(a=>a.tagId===t.tagId&&!a.archived).length<Math.max(8,b.entities.length*.6)).map(t=>t.tagId);
 const recentTags=ordinary.slice(-4).flatMap(t=>t.items.flatMap(i=>narrowTags(i.entityId)));
 candidates.sort((a,c)=>{const rank=(i:typeof a)=>{const m=mem.get(i.targetId)!,overdue=Math.max(0,Date.now()-new Date(m.card.due).getTime())/86400000,tagPenalty=narrowTags(i.entityId).some(id=>recentTags.filter(t=>t===id).length>=2)?10:0;return (m.status==='triaged'||m.status==='learning'?-4:0)-Math.min(overdue,20)+tagPenalty};return rank(a)-rank(c)});
 const diagnosticFormat=['timeline','sort','missing'].includes(s.format??'');
 if(!diagnosticFormat)for(const i of candidates){const m=mem.get(i.targetId)!,task=composeUnit(b,m,s.tag,s.format,history);if(task){task.practice=s.mode==='practice'&&!unitDue(m,s.id,completed);task.reason=task.practice?'practice':m.status==='triaged'||m.status==='learning'?'bootstrap':'due';return {task}}}
 const entityOf=(i:typeof units[number])=>i.factId?b.facts.find(f=>f.id===i.factId)?.entityId??i.entityId:i.entityId;
 const seenEntities=new Set([...introduced,...units.filter(i=>mem.has(i.targetId)).map(entityOf)]),newUnits=units.filter(i=>!mem.has(i.targetId));
 const budget=Math.max(0,(newCardsPerDay??(due.length>=20?1:3))+newState.extraBudget-newState.introducedEntityIds.length);
 const ownerKnown=(i:typeof units[number])=>seenEntities.has(entityOf(i));
 const first=newUnits.find(ownerKnown)??(budget>0?newUnits.find(i=>!sameEntity(entityOf(i))):undefined);
 if(first){const targetId=entityOf(first),newProperty=ownerKnown(first),items=newUnits.filter(i=>entityOf(i)===targetId);return {intro:{entityId:targetId,unitIds:items.map(i=>i.targetId),selections:Object.fromEntries(items.map(i=>[i.targetId,'red' as const])),newProperty}}}
 if(diagnosticFormat||(s.ordinaryCount??0)>=8&&ordinary.slice(-8).every(t=>!t.recipe.diagnostic)){
  const activeIds=new Set(known.map(i=>i.factId)),db={...b,facts:b.facts.filter(f=>activeIds.has(f.id))};
  for(const format of diagnosticFormat?[s.format!]:['timeline','sort','missing']){
   const task=composeFeed(db,memories,s.tag,format,'daily',history,1).find(t=>!(s.diagnosticSeen??[]).includes(t.recipe.id)&&!history.slice(-2).some(h=>h.items.some(i=>t.items.some(x=>x.entityId===i.entityId))));if(task)return {task};
  }
 }
 return {exhausted:true as const};
}
