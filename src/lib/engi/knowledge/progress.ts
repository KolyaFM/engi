import type {Snapshot} from '../types';
import {canonicalTargets} from '../questions/recipe-factory';
import {retention} from '../engine';
import {scopedGoals,summarizeGoals} from './goal-progress';
export function progress(s:Snapshot,tag='all'){
 if(s.goalCatalog)return summarizeGoals(s,scopedGoals(s,tag));
 const units=canonicalTargets(s.bundle,tag),ids=new Set(units.map(i=>i.targetId)),all=s.memories.filter(m=>!m.legacyOf&&ids.has(m.id)),mem=all.filter(m=>m.status!=='suspended'),covered=mem.filter(m=>m.attempts>0),known=new Set(all.map(m=>m.id));
 return {total:mem.length,available:units.length,new:units.filter(i=>!known.has(i.targetId)).length,suspended:all.filter(m=>m.status==='suspended').length,covered:covered.length,retention:covered.length?Math.round(covered.reduce((n,m)=>n+retention(m),0)/covered.length*100):null,week:covered.filter(m=>m.card.stability>=7).length,month:covered.filter(m=>m.card.stability>=30).length,quarter:covered.filter(m=>m.card.stability>=90).length,due:mem.filter(m=>new Date(m.card.due).getTime()<=Date.now()).length};
}
