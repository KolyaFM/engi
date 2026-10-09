import {chronologyOrder} from './questions/order-feedback';
import {BUILTIN_PROPERTIES} from './knowledge/properties';
export {recipes,eligible,canonicalTargets} from './questions/recipe-factory';
import {fsrs,createEmptyCard,Rating,type Card} from 'ts-fsrs';
import type {Memory,Task,Item,Format} from './types';
export const scheduler=fsrs({request_retention:0.9,enable_fuzz:false});
export const FACT_TYPES=Object.fromEntries(BUILTIN_PROPERTIES.map(p=>[p.id,{valueKind:p.valueKind,subject:p.subjectTypes??[],target:p.targetTypes}]));
export function shuffle<T>(a:T[]):T[]{const out=[...a];for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out}
export function normalize(s:string){return s.toLowerCase().replace(/ё/g,'е').replace(/[^\p{L}\p{N}]/gu,'')}
export function hydrate(m:Memory):Card{return {...m.card,due:new Date(m.card.due),last_review:m.card.last_review?new Date(m.card.last_review):undefined}}
export function retention(m:Memory){return m.firstSuccessAt?scheduler.get_retrievability(hydrate(m),new Date(),false):0}
export function preflight(t:Task){
 const a=t.items;if(!a.length)return false;
 if(t.recipe.format==='multi_choice'&&(!t.answerSet?.length||t.answerSet.some(id=>!t.options.some(o=>o.id===id))||!t.options.some(o=>!t.answerSet!.includes(o.id))))return false;
 if(t.recipe.format==='match'&&!t.recipe.feed&&(a.length<3||new Set(a.map(i=>i.answerId)).size!==a.length))return false;
 if(['sort','timeline','missing'].includes(t.recipe.format)&&!(t.recipe.feed&&t.recipe.format==='timeline'&&a.length===1)&&(a.length<3||new Set(a.map(i=>i.year)).size!==a.length))return false;
 if(['sort','timeline','missing'].includes(t.recipe.format)){if(a.some(i=>!Number.isFinite(i.year)))return false;const sorted=[...a].sort((x,y)=>x.year!-y.year!);for(let i=1;i<sorted.length;i++)if(sorted[i-1].year!>=sorted[i].year!)return false}
 if(t.recipe.format==='categorize'&&(t.recipe.feed?t.options.length<2:new Set(a.map(i=>i.answerId)).size<2))return false;
 if(t.recipe.format==='choice'&&(t.options.length<(t.discrimination?2:3)||t.options.filter(o=>o.id===a[0].answerId).length!==1))return false;
 if(new Set(t.options.map(o=>normalize(o.name))).size!==t.options.length||new Set(t.options.map(o=>o.id)).size!==t.options.length)return false;
 if(['choice','match','categorize'].includes(t.recipe.format)&&t.items.some(i=>t.options.some(o=>o.id!==i.answerId&&[i.answer,...i.aliases].some(a=>normalize(a)===normalize(o.name)))))return false;
 return true;
}
export function assess(t:Task,answer:any){
 const fmt=t.recipe.format,evidence:{item:Item;correct:boolean;chosen?:string;level:string}[]=[];
 if(fmt==='self_check')return {score:0,evidence:[],expected:[]};
 if(fmt==='multi_choice'){if(!Array.isArray(answer)||new Set(answer).size!==answer.length||answer.some(id=>typeof id!=='string'||!t.options.some(o=>o.id===id)))throw Error('Выберите варианты из списка');const selected=new Set(answer),extra=answer.some(id=>!t.answerSet!.includes(id));for(const item of t.items)evidence.push({item,correct:selected.has(item.answerId)&&!extra,chosen:extra?answer.find(id=>!t.answerSet!.includes(id)):undefined,level:'direct'});const right=t.answerSet!.filter(id=>selected.has(id)).length,score=extra?0:right/t.answerSet!.length;return {score,evidence,expected:t.answerSet};}
 if(fmt==='timeline'){
  if(!answer||typeof answer!=='object')throw Error('Укажите годы');
  const scores=t.items.map(i=>Math.abs(Number(answer[i.entityId])-i.year!)<=15?1:0);
  return {score:scores.reduce<number>((a,b)=>a+b,0)/scores.length,evidence:[],expected:t.items.map(i=>({id:i.entityId,answer:i.answer,year:i.year}))};
 }
 if(['sort','missing'].includes(fmt)){
  const expected=fmt==='sort'?chronologyOrder(t):[...t.items].sort((a,b)=>a.year!-b.year!).map(i=>i.entityId);
  if(fmt==='missing')return {score:answer===expected[1]?1:0,evidence:[],expected};
  if(!Array.isArray(answer)||answer.length!==t.items.length||new Set(answer).size!==t.items.length||!expected.every(x=>answer.includes(x)))throw Error('Заполните все позиции');
  const correct=answer.filter((id,n)=>id===expected[n]).length;
  return {score:correct/expected.length,evidence:[],expected};
 }
 for(const item of t.items){const val=['match','categorize'].includes(fmt)?(typeof answer==='object'?answer?.[item.entityId]:answer):answer;const ok=fmt==='recall_reveal'?val===true:val===item.answerId;evidence.push({item,correct:ok,chosen:String(val??''),level:t.recipe.evidence?.level??'direct'})}
 return {score:evidence.filter(e=>e.correct).length/evidence.length,evidence,expected:t.items.map(i=>({id:i.entityId,answer:i.answer,year:i.year}))};
}
export function updateMemory(old:Memory|undefined,item:Item,correct:boolean,chosen:string|undefined,confidence='medium',fmt:Format='choice'){
 const now=new Date(),m=old??{id:item.targetId,card:createEmptyCard(now),attempts:0,correct:0,confusions:{}};
 if(!old&&!correct)return undefined;
 const next=scheduler.next(old?hydrate(old):createEmptyCard(now),now,correct?Rating.Good:Rating.Again).card;
 return {...m,card:next,attempts:m.attempts+1,correct:m.correct+Number(correct),firstSuccessAt:m.firstSuccessAt??(correct?now.toISOString():undefined),confusions:!correct&&chosen?{...m.confusions,[chosen]:(m.confusions[chosen]||0)+1}:{...m.confusions}};
}
