import type {Bundle} from '../lib/engi/types';
import {canonicalTargets} from '../lib/engi/questions/recipe-factory';
export const SELECTED_DECKS='__selected_decks__';
/** An ephemeral learning scope, never a stored deck or a change to the knowledge graph. */
export function deckStudyScope(bundle:Bundle,deckIds?:string[]):Bundle{
 if(deckIds===undefined)return bundle;
 const ids=new Set(deckIds),decks=(bundle.decks??[]).filter(d=>ids.has(d.id)&&!d.archived),targets=decks.flatMap(d=>canonicalTargets(bundle,d.id));
 return {...bundle,studyScope:{id:SELECTED_DECKS,entityIds:[...new Set((bundle.deckMembers??[]).filter(m=>!m.archived&&decks.some(d=>d.id===m.deckId)).map(m=>m.entityId))],targetIds:[...new Set(targets.map(i=>i.targetId))]}};
}
