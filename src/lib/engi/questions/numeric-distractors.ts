import {indexes} from '../indexes';
import type {Bundle,Item,Recipe,Task} from '../types';

/** Only exact scalar answers: never turn a date range, month, or reverse cue into a year quiz. */
export function nearbyNumericDistractors(b:Bundle,item:Item,recipe:Recipe,random=Math.random):Task['options']|undefined{
 if(recipe.format!=='choice'||recipe.direction==='reverse'||recipe.answerPresentation==='image'||!item.factId)return;
 const fact=indexes(b).factsByEntityAndKey.get(item.entityId)?.get(recipe.answerKey)?.find(f=>f.id===item.factId);
 if(!fact)return;
 let value:number,min:number,max=Number.MAX_SAFE_INTEGER,suffix='';
 if(fact.valueKind==='date'){
  if(!item.dateEdge&&(fact.datePrecision&&fact.datePrecision!=='year'||!/^\d{4}(?:-|$)/.test(fact.dateStart??'')||fact.dateEnd&&fact.dateEnd.slice(0,4)!==fact.dateStart?.slice(0,4)))return;
  value=Number(fact.dateStart!.slice(0,4));min=1;max=9999;
 }else if(fact.valueKind==='number'){
  value=fact.valueNumber!;min=value>0?1:value===0?0:Number.MIN_SAFE_INTEGER;suffix=fact.unit?' '+fact.unit:'';
 }else return;
 if(!Number.isSafeInteger(value)||value<min||value>max||item.answer!==String(value)+suffix)return;
 const lower=[1,2,3].map(delta=>value-delta).filter(n=>n>=min&&Number.isSafeInteger(n));
 const upper=[1,2,3].map(delta=>value+delta).filter(n=>n<=max&&Number.isSafeInteger(n));
 // Choose the answer's numerical rank first, rather than making it the centre every time.
 const ranks=[0,1,2,3].filter(rank=>rank<=lower.length&&3-rank<=upper.length);
 if(!ranks.length)return;
 const rank=ranks[Math.floor(random()*ranks.length)];
 function sample(values:number[],count:number){
  const remaining=[...values],result:number[]=[];
  while(result.length<count)result.push(remaining.splice(Math.floor(random()*remaining.length),1)[0]);
  return result;
 }
 return [...sample(lower,rank),...sample(upper,3-rank)].map(n=>({id:String(n)+suffix,name:String(n)+suffix}));
}
