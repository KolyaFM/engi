import type {Task,Format} from '../lib/engi/types';
export type FeedFamily='objective'|'group'|'relations'|'recall'|'self-check';
export type FeedInteraction={family:FeedFamily;kind:string;direction:'forward'|'reverse';cue:'image'|'name';answer:'image'|'text';numeric?:'nearby'|'related'};
export const FEED_FORMAT_POLICY:Record<Format,'supported'|'explicit-only'>={choice:'supported',multi_choice:'supported',recall_reveal:'supported',match:'supported',categorize:'supported',sort:'supported',self_check:'supported',timeline:'explicit-only',missing:'explicit-only'};
export function classifyFeedInteraction(t:Pick<Task,'recipe'|'items'|'presentation'|'intervalExercise'> & Partial<Pick<Task,'numericChoiceMode'|'contextual'>>):FeedInteraction{
 let family:FeedFamily='objective',kind:string='atomic-choice';
 if(t.intervalExercise){family='relations';kind=t.intervalExercise.kind==='bands'?'period-bands':'period-'+t.intervalExercise.edge;}
 else if(t.presentation==='conveyor'){family='group';kind=t.contextual?.kind==='boundary'?'boundary-conveyor':'category-conveyor';}
 else if(t.recipe.format==='self_check'){family='self-check';kind='flip-grid';}
 else if(t.recipe.format==='recall_reveal'){family='recall';kind='recall';}
 else if(t.recipe.format==='sort'){family='relations';kind=t.recipe.orderingKind==='number'?'order-number':'order-date';}
 else if(t.recipe.format==='timeline'){family='relations';kind='legacy-timeline';}
 else if(t.recipe.format==='multi_choice')kind='multi-choice';
 else if(t.items.length>1&&['match','categorize'].includes(t.recipe.format)){family='group';kind=t.recipe.format==='match'?'match':'category';}
 return {family,kind,direction:t.recipe.direction??'forward',cue:t.recipe.cue,answer:t.recipe.answerPresentation==='image'?'image':'text',numeric:t.numericChoiceMode};
}
