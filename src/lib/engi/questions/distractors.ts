import {answerPeers} from './answer-peers';
import type {Bundle,Item,Memory,Task} from '../types';
import {indexes} from '../indexes';
import {normalize,shuffle} from '../engine';
import {valueOwners} from './value-cue';
export function distractors(b:Bundle,target:Item,pool:Item[],memory:Memory|undefined,recent:Task[]){const ix=indexes(b);const labels=new Set([target.answer,...target.aliases].map(normalize));const exposure=new Map<string,number>();for(const t of recent.slice(-4))for(const o of t.options)exposure.set(o.id,(exposure.get(o.id)??0)+1);
 const valid=target.valueCue?valueOwners(b,target.valueCue.key):undefined;
 const unique=new Map<string,{item:Item;affinity:number}>();for(const candidate of answerPeers(b,target,pool)){const i=candidate.item;if(i.answerId===target.answerId||valid?.has(i.answerId)||[i.answer,...i.aliases].some(x=>labels.has(normalize(x))))continue;if(ix.entityById.get(i.answerId)&&ix.entityById.get(target.answerId)&&ix.entityById.get(i.answerId)!.type!==ix.entityById.get(target.answerId)!.type)continue;const key=normalize(i.answer);if(!unique.has(key)||unique.get(key)!.affinity<candidate.affinity)unique.set(key,candidate)}
 const score=(i:Item)=>(memory?.confusions[i.answerId]??0)*4-(exposure.get(i.answerId)??0)*2;return shuffle([...unique.values()]).sort((a,c)=>c.affinity-a.affinity||score(c.item)-score(a.item)).slice(0,3).map(({item:i})=>({id:i.answerId,name:i.answer}));
}

