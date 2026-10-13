import type {Bundle} from '../lib/engi/types';
import {createDeckStudyCatalog,type DeckStudyCatalog} from './deck-study-catalog';
import type {DeckPropertySettings} from './deck-property-settings';
export const SELECTED_DECKS='__selected_decks__';
/** Compile deck targets once, then cheaply union any selected subset. */
export function createDeckTargetIndex(bundle:Bundle,settings?:DeckPropertySettings){
 const catalog=createDeckStudyCatalog(bundle);return {targetsFor:(deckIds:string[])=>catalog.targetsFor(deckIds,settings)};
}
/** An ephemeral learning scope, never a stored deck or a change to the knowledge graph. */
export function deckStudyScope(bundle:Bundle,deckIds?:string[],settings?:DeckPropertySettings,catalog?:DeckStudyCatalog):Bundle{
 if(deckIds===undefined)return bundle;
 const ids=new Set((bundle.decks??[]).filter(d=>deckIds.includes(d.id)&&!d.archived).map(d=>d.id)),targets=(catalog??createDeckStudyCatalog(bundle)).targetsFor(deckIds,settings);
 return {...bundle,studyScope:{id:SELECTED_DECKS,entityIds:[...new Set((bundle.deckMembers??[]).filter(m=>!m.archived&&ids.has(m.deckId)).map(m=>m.entityId))],targetIds:[...targets]}};
}
