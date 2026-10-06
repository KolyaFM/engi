import {difficultyStage} from '../learning/mastery';
import type {Bundle,Item,Memory,Task} from '../types';
import {indexes} from '../indexes';
import {normalize,shuffle} from '../engine';
export function distractors(b:Bundle,target:Item,pool:Item[],memory:Memory|undefined,recent:Task[]){const ix=indexes(b);const labels=new Set([target.answer,...target.aliases].map(normalize));const tags=ix.tagsByEntity.get(target.entityId)??new Set();const exposure=new Map<string,number>();for(const t of recent.slice(-4))for(const o of t.options)exposure.set(o.id,(exposure.get(o.id)??0)+1);
 const unique=new Map<string,Item>();for(const i of pool){if(i.answerId===target.answerId||[i.answer,...i.aliases].some(x=>labels.has(normalize(x))))continue;if(ix.entityById.get(i.answerId)&&ix.entityById.get(target.answerId)&&ix.entityById.get(i.answerId)!.type!==ix.entityById.get(target.answerId)!.type)continue;if(!unique.has(normalize(i.answer)))unique.set(normalize(i.answer),i)}
 const stage=difficultyStage(memory);const score=(i:Item)=>{const overlap=[...ix.tagsByEntity.get(i.entityId)??[]].filter(t=>tags.has(t)).length;return (memory?.confusions[i.answerId]??0)*4+(stage>=3?overlap*3:stage===2?overlap: -overlap*2)-(exposure.get(i.answerId)??0)*2};return shuffle([...unique.values()]).sort((a,c)=>score(c)-score(a)).slice(0,3).map(i=>({id:i.answerId,name:i.answer}));
}

