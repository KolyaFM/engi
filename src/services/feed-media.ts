import type {Task} from '../lib/engi/types';
type MediaTask=Pick<Task,'items'> & Partial<Pick<Task,'options'>>;
export function taskMediaSources(task:MediaTask){return [...new Set([...task.items.flatMap(i=>[i.image,i.answerImage]),...(task.options??[]).map(o=>o.image)].filter((s):s is string=>!!s))];}
export function proposalMediaPreview(tasks:readonly MediaTask[]){return [...new Set(tasks.slice(0,3).flatMap(taskMediaSources))].slice(0,12);}
