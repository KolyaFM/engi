import type {Snapshot} from '../types';
import {canonicalTargets} from '../questions/recipe-factory';
import {retention} from '../engine';
export function progress(s:Snapshot,tag='all'){const targets=new Set(canonicalTargets(s.bundle,tag).map(i=>i.targetId));const mem=s.memories.filter(m=>targets.has(m.id));const covered=mem.filter(m=>m.firstSuccessAt);return {total:targets.size,covered:covered.length,retention:covered.length?Math.round(covered.reduce((n,m)=>n+retention(m),0)/covered.length*100):null,week:covered.filter(m=>m.card.stability>=7).length,month:covered.filter(m=>m.card.stability>=30).length,quarter:covered.filter(m=>m.card.stability>=90).length,due:mem.filter(m=>new Date(m.card.due).getTime()<=Date.now()).length}}
