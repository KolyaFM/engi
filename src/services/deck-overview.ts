import {propertyWorkload} from '../lib/engi/knowledge/property-workload';
import type {Bundle,Snapshot} from '../lib/engi/types';
import type {LearningLifecycle} from '../lib/engi/study-core/acquisition';
import {acquisitionKey} from '../lib/engi/study-core/acquisition';
import {canonicalTargets} from '../lib/engi/questions/recipe-factory';
import {createDeckTargetIndex,deckStudyScope,SELECTED_DECKS} from './deck-study-scope';
export {createDeckTargetIndex} from './deck-study-scope';
export type DeckOverview={total:number;learned:number;percent:number;learning:number;repeat:number;mistakes:number};
export function deckOverview(s:Snapshot,lifecycle:LearningLifecycle|undefined,deckIds:string[],now=Date.now(),index?:ReturnType<typeof createDeckTargetIndex>):DeckOverview{
 const targets=index?.targetsFor(deckIds)??new Set(canonicalTargets(deckStudyScope(s.bundle,deckIds),SELECTED_DECKS).map(i=>i.targetId)),rows=new Map(s.memories.map(m=>[m.id,m]));
 const entries=(s.goalCatalog??[]).filter(e=>e.targetIds.every(id=>targets.has(id))),known=new Set(entries.filter(e=>e.targetIds.length&&e.targetIds.every(id=>rows.get(id)?.initialFamiliarity==='green')).map(e=>acquisitionKey(e.goal)));
 const active=entries.filter(e=>!e.suspended),keys=new Set(active.map(e=>acquisitionKey(e.goal))),all=new Set([...keys,...known]),goals=new Set(active.map(e=>e.goal.id));
 const units=(lifecycle?.units??[]).filter(u=>keys.has(u.key)&&goals.has(u.goal.id)),learningKeys=new Set(units.filter(u=>u.stage!=='completed').map(u=>u.key));
 const learned=new Set([...known,...units.filter(u=>u.stage==='completed').map(u=>u.key)]),repeat=new Set<string>();
 for(const memory of s.goalMemories??[]){const entry=active.find(e=>e.goal.id===memory.goalId);if(!entry)continue;const key=acquisitionKey(entry.goal);if(!lifecycle&&[2,3].includes(Number(memory.card.state)))learned.add(key);if(!lifecycle&&Number(memory.card.state)===1)learningKeys.add(key);if(!learningKeys.has(key)&&new Date(memory.card.due).getTime()<=now)repeat.add(key);}
 if(lifecycle){const projection=propertyWorkload(active,s.goalMemories??[],lifecycle,undefined,now);learningKeys.clear();for(const key of projection.learningKeys)learningKeys.add(key);repeat.clear();for(const key of projection.repeats.keys())repeat.add(key);}
 const mistakes=new Set((s.dayPlan?.mistakes??[]).filter(m=>keys.has(m.key)).map(m=>m.key));
 return {total:all.size,learned:learned.size,percent:all.size?Math.floor(learned.size/all.size*100):0,learning:learningKeys.size,repeat:repeat.size,mistakes:mistakes.size};
}
export type DeckSelection={ids:string[];lastStudied:Record<string,string>};
export const DECK_SELECTION_KEY='deckSelection';
export function cleanDeckSelection(value:unknown,s:Snapshot):DeckSelection{
 const active=new Set((s.bundle.decks??[]).filter(d=>!d.archived).map(d=>d.id)),v=value as Partial<DeckSelection>|undefined;
 return {ids:v&&Array.isArray(v.ids)?[...new Set(v.ids.filter(id=>typeof id==='string'&&active.has(id)))]:[...active],lastStudied:v?.lastStudied&&typeof v.lastStudied==='object'?Object.fromEntries(Object.entries(v.lastStudied).filter(([id,at])=>active.has(id)&&typeof at==='string'&&Number.isFinite(Date.parse(at)))):{}};
}
