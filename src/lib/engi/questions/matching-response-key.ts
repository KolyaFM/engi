import type {Item,Task} from '../types';
/** Old saved mappings use entity IDs; guided intervals address a particular fact. */
export function matchingResponseKey(task:Task,item:Item){return task.intervalExercise?.kind==='bands'&&task.intervalExercise.interaction==='quiz'?item.targetId:item.entityId;}
