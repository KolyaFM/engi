import {formatHistoricalYear,MIN_YEAR_INDEX} from '../lib/engi/historical-date';
import {indexes} from '../lib/engi/indexes';
import {shuffle} from '../lib/engi/engine';
import type {Bundle,Task} from '../lib/engi/types';
import type {IntervalEvidence} from '../lib/engi/study-core/interval-evidence';
import {yearInterval} from '../lib/engi/questions/date-interval';
export function buildEndpointTask(b:Bundle,exact:Task,evidence:IntervalEvidence|undefined,history:Task[]):Task|undefined{
 if(exact.items.some(i=>i.dateEdge))return;
 if(exact.recipe.format!=='choice'||exact.recipe.direction==='reverse'||exact.items.length!==1||exact.intent==='repair'||exact.practice||['confirmation','due'].includes(exact.reason))return;
 const item=exact.items[0],ix=indexes(b),f=ix.factsByEntityAndKey.get(item.entityId)?.get(exact.recipe.answerKey)?.find(f=>f.id===item.factId),range=f&&yearInterval(f),p=ix.propertyById.get(exact.recipe.answerKey);
 if(!range||p?.learning?.rangeBoundary==='off'||p?.learning?.choice==='off')return;
 const last=[...history].reverse().find(t=>t.items.some(i=>i.targetId===item.targetId));if(last?.intervalExercise)return;
 const edge=evidence?.end?.correct===false?'end':evidence?.start?.correct===false?'start':evidence?.lastEdge==='start'?'end':'start';
 const answer=range[edge],min=edge==='end'?range.start:MIN_YEAR_INDEX,max=edge==='start'?range.end:9999;
 const values=[-3,-2,-1,1,2,3].map(d=>answer+d).filter(n=>n>=min&&n<=max);if(values.length<3)return;
 const wrong=shuffle(values).slice(0,3),template=edge==='start'?p?.promptTemplates?.rangeStart:p?.promptTemplates?.rangeEnd;
 return {...exact,id:crypto.randomUUID(),studyContract:undefined,studyContractIssue:undefined,numericChoiceMode:undefined,intervalExercise:{kind:'endpoint',edge},recipe:{...exact.recipe,cue:'name',answerPresentation:undefined,prompt:template?.replace(/\{subject\}/g,item.name)??(edge==='start'?'Когда начался этот период?':'Когда закончился этот период?')},items:[{...item,image:undefined,mediaId:undefined,interval:range,answer:formatHistoricalYear(answer),answerId:formatHistoricalYear(answer),aliases:[]}],options:shuffle([answer,...wrong].map(n=>({id:formatHistoricalYear(n),name:formatHistoricalYear(n)})))};
}
