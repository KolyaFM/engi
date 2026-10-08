import type {Task} from '../types';
/** Match/category in today's one-item feed use ChoiceCard, so they are one interaction. */
export function interactionFamily(task:Task){
 const format=task.recipe.format;
 if(['choice','missing'].includes(format)||['match','categorize'].includes(format)&&task.items.length===1)return 'choice';
 return format;
}

