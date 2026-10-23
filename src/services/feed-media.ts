import type {Bundle,Item,Task} from '../lib/engi/types';
type MediaTask=Pick<Task,'items'> & Partial<Pick<Task,'options'>>;
export function taskMediaSources(task:MediaTask){return [...new Set([...task.items.flatMap(i=>[i.image,i.answerImage]),...(task.options??[]).map(o=>o.image)].filter((s):s is string=>!!s))];}
export function proposalMediaPreview(tasks:readonly MediaTask[]){return [...new Set(tasks.slice(0,3).flatMap(taskMediaSources))].slice(0,12);}
export function introMediaSources(bundle:Bundle,entityId:string,items:readonly Item[]){
 const heroes=bundle.media.filter(m=>m.entityId===entityId&&!m.archived&&m.learningExemplar!==false&&['primary','portrait','photo','image','artwork','painting'].includes(m.role));
 const hero=heroes.find(m=>m.primary||m.role==='primary')??heroes[0],ids=new Set(items.map(i=>i.factId)),mediaIds=new Set(bundle.facts.filter(f=>ids.has(f.id)&&f.valueKind==='image').map(f=>f.valueMediaId));
 return [...new Set([hero?.url,...bundle.media.filter(m=>mediaIds.has(m.id)&&!m.archived).map(m=>m.url)].filter((s):s is string=>!!s))].slice(0,12);
}
