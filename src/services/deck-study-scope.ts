import type {Bundle} from '../lib/engi/types';
import {compositionContext} from '../lib/engi/session/composer';
export const SELECTED_DECKS='__selected_decks__';
/** Compile deck targets once, then cheaply union any selected subset. */
export function createDeckTargetIndex(bundle:Bundle){
 const byDeck=new Map((bundle.decks??[]).filter(d=>!d.archived).map(d=>[d.id,new Set<string>()]));
 const context=compositionContext(bundle);
 for(const recipe of context.recipes){
  const targets=recipe.tag&&byDeck.get(recipe.tag);
  if(!targets||!recipe.countsTowardMastery)continue;
  for(const item of context.pools.get(recipe)??[])targets.add(item.targetId);
 }
 return {targetsFor(deckIds:string[]){const targets=new Set<string>();for(const id of deckIds)for(const target of byDeck.get(id)??[])targets.add(target);return targets;}};
}
/** An ephemeral learning scope, never a stored deck or a change to the knowledge graph. */
export function deckStudyScope(bundle:Bundle,deckIds?:string[]):Bundle{
 if(deckIds===undefined)return bundle;
 const ids=new Set((bundle.decks??[]).filter(d=>deckIds.includes(d.id)&&!d.archived).map(d=>d.id)),targets=createDeckTargetIndex(bundle).targetsFor(deckIds);
 return {...bundle,studyScope:{id:SELECTED_DECKS,entityIds:[...new Set((bundle.deckMembers??[]).filter(m=>!m.archived&&ids.has(m.deckId)).map(m=>m.entityId))],targetIds:[...targets]}};
}
