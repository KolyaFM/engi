import type {Snapshot} from '../types';
import {canonicalTargets} from '../questions/recipe-factory';
import {progress} from './progress';
export function localDay(now=new Date()){return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`}
export function todayLearning(s:Snapshot,now=new Date()){
 const day=localDay(now);if(s.dailyLearning?.day===day)return {retrievals:s.dailyLearning.retrievals,stability30Gains:s.dailyLearning.stability30Gains};
 const events=s.events.filter(e=>localDay(new Date(e.timestamp))===day&&e.level==='direct'&&typeof e.payload?.score==='number'&&(!s.goalCatalog||e.payload.memoryModel==='goals'&&e.payload.targets?.some((t:{independent:boolean})=>t.independent)));
 const gains=new Set(events.flatMap(e=>(e.payload.metadata?.stabilityTransitions??[]).filter((t:any)=>t.before<30&&t.after>=30).map((t:any)=>t.targetId)));
 return {retrievals:events.length,stability30Gains:gains.size};
}
export type ReturnHook={kind:'due'|'confusion'|'new'|'collection';count:number;title:string;detail:string;action:string;tag:string;mode:string};
export function returnHook(s:Snapshot):ReturnHook|null{
 const p=progress(s);if(p.due)return {kind:'due',count:p.due,title:`${Math.min(6,p.due)} знаний особенно нуждаются в повторении`,detail:'Короткая практика поможет удержать уже знакомое.',action:'Повторить',tag:'all',mode:'daily'};
 if(s.goalCatalog)return p.new?{kind:'new',count:p.new,title:'Есть знания для первой проверки',detail:'Узнавание и воспроизведение учитываются отдельно.',action:'Продолжить',tag:'all',mode:'daily'}:null;
 const targets=canonicalTargets(s.bundle),known=new Set(s.memories.map(m=>m.id));
 for(const m of s.memories){const target=targets.find(t=>t.targetId===m.id),confusion=Object.entries(m.confusions).sort((a,b)=>b[1]-a[1]).find(([,n])=>n>=.2);if(!target||!confusion)continue;
  const wrong=s.bundle.entities.find(e=>e.id===confusion[0]&&!e.archived)?.name??confusion[0];return {kind:'confusion',count:1,title:`${target.answer} и ${wrong}`,detail:'Эта связь ещё путается. Попробуем различить похожее.',action:'Различить',tag:'all',mode:'practice'};
 }
 for(const tag of s.bundle.tags.filter(t=>!t.archived)){const q=progress(s,tag.id),left=q.total-q.covered;if(q.covered>0&&left>0&&left<=4)return {kind:'collection',count:left,title:`В «${tag.name}» осталось открыть ${left} знаний`,detail:`Уже знакомо ${q.covered} из ${q.total}.`,action:'Продолжить подборку',tag:tag.id,mode:'explore'}}
 const freshEntities=new Set(targets.filter(t=>!known.has(t.targetId)&&!targets.some(x=>x.entityId===t.entityId&&known.has(x.targetId))).map(t=>t.entityId));const daily=s.newLearning?.day===localDay()?s.newLearning:undefined;const budget=Math.max(0,3+(daily?.extraBudget??0)-(daily?.introducedEntityIds.length??0));const count=Math.min(budget,freshEntities.size);
 return count?{kind:'new',count,title:`${count} новых объектов готовы к открытию`,detail:'Сначала попробуйте вспомнить — затем познакомимся с новым.',action:'Открыть новое',tag:'all',mode:'explore'}:null;
}
