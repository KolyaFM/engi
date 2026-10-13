import type {Bundle,Snapshot} from '../lib/engi/types';
import type {LearningLifecycle} from '../lib/engi/study-core/acquisition';
import {propertyKey} from '../lib/engi/study-core/acquisition';
import {canonicalTargets} from '../lib/engi/questions/recipe-factory';
import {createDeckTargetIndex,deckStudyScope,SELECTED_DECKS} from './deck-study-scope';
export {createDeckTargetIndex} from './deck-study-scope';
export type DeckOverview={total:number;learned:number;percent:number;learning:number;repeat:number;mistakes:number};
export function createDeckProgressIndex(s:Snapshot,lifecycle?:LearningLifecycle){
 const rows=new Map(s.memories.map(m=>[m.id,m])),byTarget=new Map<string,NonNullable<Snapshot['goalCatalog']>>();
 for(const entry of s.goalCatalog??[])for(const id of entry.targetIds){const entries=byTarget.get(id)??[];entries.push(entry);byTarget.set(id,entries);}
 const memories=new Map((s.goalMemories??[]).map(m=>[m.goalId,m])),units=new Map((lifecycle?.units??[]).map(u=>[u.goal.id,u])),mistakes=new Set((s.dayPlan?.mistakes??[]).map(m=>propertyKey(m.goal)));return {rows,memories,units,mistakes,lifecycle,entriesFor(targets:Set<string>){const entries=new Map<string,NonNullable<Snapshot['goalCatalog']>[number]>();for(const id of targets)for(const e of byTarget.get(id)??[])if(e.targetIds.every(t=>targets.has(t)))entries.set(e.goal.id,e);return [...entries.values()];}};
}
export function deckOverview(s:Snapshot,lifecycle:LearningLifecycle|undefined,deckIds:string[],now=Date.now(),index?:ReturnType<typeof createDeckTargetIndex>,progress=createDeckProgressIndex(s,lifecycle)):DeckOverview{
 const targets=index?.targetsFor(deckIds)??new Set(canonicalTargets(deckStudyScope(s.bundle,deckIds),SELECTED_DECKS).map(i=>i.targetId)),rows=progress.rows;
 const entries=progress.entriesFor(targets),known=new Set(entries.filter(e=>e.targetIds.length&&e.targetIds.every(id=>rows.get(id)?.initialFamiliarity==='green')).map(e=>propertyKey(e.goal)));
 const active=entries.filter(e=>!e.suspended),keys=new Set(active.map(e=>propertyKey(e.goal))),all=new Set([...keys,...known]),goals=new Set(active.map(e=>e.goal.id));
 const units=progress.lifecycle===lifecycle?[...goals].flatMap(id=>{const unit=progress.units.get(id);return unit?[unit]:[];}):(lifecycle?.units??[]).filter(u=>keys.has(propertyKey(u.goal))&&goals.has(u.goal.id)),learningKeys=new Set(units.filter(u=>u.stage!=='completed').map(u=>propertyKey(u.goal)));
 const learned=new Set([...known,...units.filter(u=>u.stage==='completed').map(u=>propertyKey(u.goal))]),repeat=new Set<string>();
 for(const entry of active){const memory=progress.memories.get(entry.goal.id);if(!memory)continue;const key=propertyKey(entry.goal);if(!lifecycle&&[2,3].includes(Number(memory.card.state)))learned.add(key);if(!lifecycle&&Number(memory.card.state)===1)learningKeys.add(key);if(!learningKeys.has(key)&&new Date(memory.card.due).getTime()<=now)repeat.add(key);}
 const mistakes=new Set([...keys].filter(key=>progress.mistakes.has(key)));
 return {total:all.size,learned:[...learned].filter(key=>!learningKeys.has(key)).length,percent:all.size?Math.floor([...learned].filter(key=>!learningKeys.has(key)).length/all.size*100):0,learning:learningKeys.size,repeat:repeat.size,mistakes:mistakes.size};
}
export type DeckSelection={ids:string[];lastStudied:Record<string,string>};
export const DECK_SELECTION_KEY='deckSelection';
export function cleanDeckSelection(value:unknown,s:Snapshot):DeckSelection{
 const active=new Set((s.bundle.decks??[]).filter(d=>!d.archived).map(d=>d.id)),v=value as Partial<DeckSelection>|undefined;
 return {ids:v&&Array.isArray(v.ids)?[...new Set(v.ids.filter(id=>typeof id==='string'&&active.has(id)))]:[...active],lastStudied:v?.lastStudied&&typeof v.lastStudied==='object'?Object.fromEntries(Object.entries(v.lastStudied).filter(([id,at])=>active.has(id)&&typeof at==='string'&&Number.isFinite(Date.parse(at)))):{}};
}
