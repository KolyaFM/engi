import {useHorizontalSwipe} from './useHorizontalSwipe';
import {useEffect,useMemo,useRef,useState} from 'react';
import type {SessionRow} from '../../db/engi-db';
import type {Bundle,Familiarity,Fact} from '../../lib/engi/types';
import {questionPrompt} from '../../lib/engi/questions/question-templates';
import {canonicalTargets} from '../../lib/engi/questions/recipe-factory';
import {properties,textValue} from '../../lib/engi/knowledge/properties';
import {KnowledgeImage} from '../knowledge/KnowledgeImage';
import './learning22.css';


function formatIntroValue(fact:Fact|undefined,fallback:string,bundle:Bundle):string{
 if(!fact)return fallback;
 if(fact.valueKind==='date'){
  const y1=fact.dateStart?.slice(0,4),y2=fact.dateEnd?.slice(0,4);
  const circa=fact.datePrecision==='circa'?'Около ':'';
  if(fact.datePrecision==='year'&&y1)return `${circa}${y1} год`;
  if(y1&&y2&&y1===y2)return `${circa}${y1} год`;
  if(y1&&y2)return `${circa}${y1} — ${y2} гг.`;
 }
 return textValue(fact,bundle);
}

function getIdentityInfo(type?:string):{label:string;text:string}{
 if(type==='person')return {label:'Портрет',text:'Портрет'};
 if(type==='artwork')return {label:'Узнать картину',text:'Узнать картину'};
 if(type==='building'||type==='landmark')return {label:'Узнать сооружение',text:'Узнать сооружение'};
 if(type==='event')return {label:'Узнать событие',text:'Узнать событие'};
 return {label:'Узнать по фото',text:'Узнать по фото'};
}

export type ObjectIntroCardProps={
 intro:NonNullable<SessionRow['intro']>;
 bundle:Bundle;
 onChoose:(unitId:string,color:Familiarity)=>Promise<void>;
 onDone:(selections:Record<string,Familiarity>,animate?:boolean)=>Promise<void>;
 onExit:()=>void;
 busy?:boolean;
 error?:string;
};

export function ObjectIntroCard({intro,bundle,onChoose,onDone,onExit,busy=false,error}:ObjectIntroCardProps){
 const [saving,setSaving]=useState(false),[saveError,setSaveError]=useState('');
 const [selections,setSelections]=useState(intro.selections);
 const writes=useRef<Promise<void>>(Promise.resolve()),latestSelections=useRef(intro.selections),exiting=useRef(false);
 useEffect(()=>{latestSelections.current=intro.selections;setSelections(intro.selections);setSwipeOffset(0);setSwiping(false)},[intro.entityId]);
 const entity=bundle.entities.find(e=>e.id===intro.entityId);
 const items=useMemo(()=>{const ids=new Set(intro.unitIds);return canonicalTargets(bundle).filter(i=>ids.has(i.targetId))},[bundle,intro.unitIds.join('|')]);
 const propertyById=useMemo(()=>new Map(properties(bundle).map(p=>[p.id,p])),[bundle]);
 const mediaList=useMemo(()=>bundle.media.filter(m=>m.entityId===intro.entityId&&!m.archived&&m.learningExemplar!==false&&['primary','portrait','photo','image','artwork','painting'].includes(m.role)),[bundle,intro.entityId]);
 const image=mediaList.find(m=>m.primary||m.role==='primary')??mediaList[0];
 const disabled=busy||saving;
 const displayError=error||saveError;
 const [swipeOffset,setSwipeOffset]=useState(0),[swiping,setSwiping]=useState(false);
 const swipe=useHorizontalSwipe({disabled:disabled||exiting.current,onOffset:setSwipeOffset,onDragging:setSwiping,onSwipe:side=>{setSwipeOffset((side===1?1:-1)*window.innerWidth*1.3);void finish(Object.fromEntries(items.map(item=>[item.targetId,side===1?'green':'red'])),true);}});

 const rotation=Math.max(-10,Math.min(10,swipeOffset/20));
 const stampOpacity=Math.min(1,Math.max(0,(Math.abs(swipeOffset)-15)/60));

 const learnableFactIds=new Set(items.map(i=>i.factId).filter((id):id is string=>Boolean(id)));
 const contextFacts=bundle.facts.filter(f=>f.entityId===intro.entityId&&!f.archived&&!learnableFactIds.has(f.id));
 const entityTags=bundle.entityTags.filter(t=>t.entityId===intro.entityId&&!t.archived);
 const tagById=new Map(bundle.tags.map(t=>[t.id,t]));
 const tags=entityTags.map(t=>tagById.get(t.tagId)?.name).filter((name):name is string=>Boolean(name));
 const entityType=bundle.entityTypes?.find(t=>t.id===entity?.type)?.name??entity?.type;

 async function choose(unitId:string,color:Familiarity){
  if(disabled||exiting.current)return;
  latestSelections.current={...latestSelections.current,[unitId]:color};setSelections(latestSelections.current);setSaveError('');
  // Draft writes are ordered, but do not block or dim the card's controls.
  const write=writes.current.catch(()=>{}).then(()=>onChoose(unitId,color));writes.current=write;
  try{await write}catch{if(!exiting.current)setSaveError('Не удалось сохранить выбор. Попробуйте ещё раз.')}
 }

 async function finish(next:Record<string,Familiarity>=latestSelections.current,animate=false){
  if(disabled||exiting.current)return;
  exiting.current=true;setSaving(true);setSaveError('');
  try{await writes.current.catch(()=>{});await onDone(next,animate)}catch{exiting.current=false;setSwipeOffset(0);setSaveError('Не удалось сохранить выбор. Попробуйте ещё раз.');}
  finally{setSaving(false)}
 }
 return <main
  className="learning22-screen"
  aria-labelledby="object-intro-heading"
  aria-busy={disabled}
  {...swipe}
 >
  <div
   className={`learning22-card-sheet ${swiping?'is-swiping':''}`}
   style={{
    transform:swipeOffset!==0?`translateX(${swipeOffset}px) rotate(${rotation}deg)`:undefined,
    transition:swiping?'none':'transform 220ms cubic-bezier(.22,1,.36,1)',
   }}
  >
   <button type="button" className="learning22-close" onClick={onExit} disabled={disabled} aria-label="Закончить знакомство">✕</button>
   {swipeOffset>15&&<div className="learning22-stamp learning22-stamp-know" style={{opacity:stampOpacity,transform:`rotate(-10deg) scale(${0.85+stampOpacity*0.15})`}} aria-hidden="true">ЗНАЮ</div>}
   {swipeOffset<-15&&<div className="learning22-stamp learning22-stamp-plan" style={{opacity:stampOpacity,transform:`rotate(10deg) scale(${0.85+stampOpacity*0.15})`}} aria-hidden="true">В ПЛАН</div>}
   <div className="learning22-scroll">
    <section className={`learning22-content ${!image?'no-hero':''}`}>
    {image?(
     <div className="learning22-hero-wrap">
      <KnowledgeImage src={image.url} alt={entity?.name??'Изображение объекта'} className="learning22-portrait"/>
     </div>
    ):(
     <div className="learning22-hero-badge" aria-hidden="true">
      <span>{entity?.name?.trim()?.[0]?.toUpperCase()??'★'}</span>
     </div>
    )}

    <div className="learning22-header-block">
     <div className="learning22-badges-strip">
      {entityType&&<span className="learning22-badge">{entityType}</span>}
      {tags.map((tag,idx)=><span key={'t-'+idx} className="learning22-badge">{tag}</span>)}
     </div>
     <h1 id="object-intro-heading">{entity?.name??'Знакомство с объектом'}</h1>
     {entity?.summary&&<p className="learning22-summary">{entity.summary}</p>}
    </div>

    <div className="learning22-section">
     <div className="learning22-properties">
      {items.map(item=>{
       const fact=bundle.facts.find(f=>f.id===item.factId);
       const reverse=item.targetId.endsWith(':reverse');
       const isIdentity=!fact||item.targetId.includes(':visual_identity');
       const identityInfo=isIdentity?getIdentityInfo(entity?.type):undefined;
       const label=isIdentity?identityInfo!.label:reverse?questionPrompt(fact?propertyById.get(fact.key):undefined,item.name,'choice','reverse'):fact?propertyById.get(fact.key)?.name??fact.key:'Портрет';
       const selected=selections[item.targetId]??intro.selections[item.targetId]??'red';
       const known=selected==='green'||selected==='suspended';
       const val=isIdentity?identityInfo!.text:formatIntroValue(fact,item.answer,bundle);
       return <div className={`learning22-property ${known?'is-known':''}`} key={item.targetId}>
        <div className="learning22-prop-meta">
         {!isIdentity&&<span className="learning22-prop-label">{label}</span>}
         <span className="learning22-value">{val}</span>
        </div>
        <div className="learning22-controls" role="group" aria-label={`Знакомство: ${label}`}>
         <button type="button" className={`learning22-choice ${!known?'is-selected':''}`} aria-label={`${label}: Не знаю`} aria-pressed={!known} disabled={disabled} onClick={()=>void choose(item.targetId,'red')}>Не знаю</button>
         <button type="button" className={`learning22-choice ${known?'is-selected is-known':''}`} aria-label={`${label}: Знаю`} aria-pressed={known} disabled={disabled} onClick={()=>void choose(item.targetId,'green')}>Знаю</button>
        </div>       </div>;
      })}
     </div>
    </div>

    {!intro.newProperty&&contextFacts.length>0&&(
     <div className="learning22-section learning22-context-block">
      <h2 className="learning22-section-title">Справочная информация</h2>
      <div className="learning22-chips">
       {contextFacts.map(fact=>{
        const p=propertyById.get(fact.key);
        const label=p?.name??fact.key;
        const val=formatIntroValue(fact,textValue(fact,bundle),bundle);
        return <span key={fact.id} className="learning22-chip">
         <span className="learning22-chip-muted">{label}:</span> {val}
        </span>;
       })}
      </div>
     </div>
    )}
   </section>
  </div>
   <footer className="learning22-footer">
    {displayError&&<p className="learning22-error" role="alert">{displayError}</p>}
    <button type="button" className="learning22-action learning22-primary" onClick={()=>void finish()} disabled={disabled}>Готово</button>
    <span className="learning22-status" role="status">{saving?'Сохраняем выбор…':''}</span>
   </footer>
  </div>
 </main>;
}
