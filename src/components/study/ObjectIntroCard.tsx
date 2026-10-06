import {useEffect,useRef,useState} from 'react';
import type {SessionRow} from '../../db/engi-db';
import type {Bundle,Familiarity,Fact} from '../../lib/engi/types';
import {questionPrompt} from '../../lib/engi/questions/question-templates';
import {canonicalTargets} from '../../lib/engi/questions/recipe-factory';
import {properties,textValue} from '../../lib/engi/knowledge/properties';
import {KnowledgeImage} from '../knowledge/KnowledgeImage';
import './learning22.css';

const gaugeLevels:{color:Familiarity;label:string;text:string;step:number}[]=[
 {color:'red',label:'Не знаю',text:'В план',step:1},
 {color:'orange',label:'Знакомо, но не уверен',text:'Смутно',step:2},
 {color:'yellow',label:'Скорее знаю',text:'Знакомо',step:3},
 {color:'green',label:'Знаю хорошо',text:'Знаю',step:4},
];

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

export type ObjectIntroCardProps={
 intro:NonNullable<SessionRow['intro']>;
 bundle:Bundle;
 onChoose:(unitId:string,color:Familiarity)=>Promise<void>;
 onChooseAll?:(selections:Record<string,Familiarity>)=>Promise<void>;
 onDone:()=>void;
 onExit:()=>void;
 busy?:boolean;
 error?:string;
};

export function ObjectIntroCard({intro,bundle,onChoose,onChooseAll,onDone,onExit,busy=false,error}:ObjectIntroCardProps){
 const [saving,setSaving]=useState(false),[saveError,setSaveError]=useState('');
 const [selections,setSelections]=useState(intro.selections);
 const writeLock=useRef(false),pendingChoice=useRef<{unitId:string;color:Familiarity}|null>(null),activeDrag=useRef<{unitId:string;color:Familiarity}|null>(null);
 useEffect(()=>{setSelections(intro.selections)},[intro.selections]);
 const entity=bundle.entities.find(e=>e.id===intro.entityId);
 const unitIds=new Set(intro.unitIds);
 const items=canonicalTargets(bundle).filter(i=>unitIds.has(i.targetId));
 const propertyById=new Map(properties(bundle).map(p=>[p.id,p]));
 const mediaList=bundle.media.filter(m=>m.entityId===intro.entityId&&!m.archived&&m.learningExemplar!==false&&['primary','portrait','photo','image','artwork','painting'].includes(m.role));
 const image=mediaList.find(m=>m.primary||m.role==='primary')??mediaList[0];
 const disabled=busy||saving;
 const displayError=error||saveError;
 const [swipeOffset,setSwipeOffset]=useState(0),[swiping,setSwiping]=useState(false);
 const swipeGesture=useRef<{x:number;y:number;time:number;width:number;dx:number;dy:number;locked?:boolean}|null>(null);
 const tippedRef=useRef(false);

 function handlePointerDown(e:React.PointerEvent){
  if(disabled||!e.isPrimary)return;
  if((e.target as HTMLElement).closest('button,input,textarea,select,.learning22-gauge'))return;
  tippedRef.current=false;
  swipeGesture.current={x:e.clientX,y:e.clientY,time:Date.now(),width:e.currentTarget.getBoundingClientRect().width,dx:0,dy:0};
 }
 function handlePointerMove(e:React.PointerEvent){
  const g=swipeGesture.current;if(!g)return;
  g.dx=e.clientX-g.x;g.dy=e.clientY-g.y;
  const absX=Math.abs(g.dx),absY=Math.abs(g.dy);
  if(!g.locked){
   if(absX>10&&absX>absY*1.3){g.locked=true;e.currentTarget.setPointerCapture(e.pointerId);setSwiping(true)}
   else if(absY>10){swipeGesture.current=null;return}
  }
  if(g.locked){
   setSwipeOffset(Math.max(-g.width*.35,Math.min(g.width*.35,g.dx)));
   const threshold=Math.min(100,g.width*.22);
   if(absX>=threshold&&!tippedRef.current){tippedRef.current=true;try{navigator.vibrate?.(8)}catch{}}
   else if(absX<threshold){tippedRef.current=false}
  }
 }
 function handlePointerUp(){
  const g=swipeGesture.current;swipeGesture.current=null;setSwiping(false);setSwipeOffset(0);
  if(!g||!g.locked)return;
  const distance=Math.abs(g.dx),duration=Math.max(20,Date.now()-g.time),velocity=distance/duration;
  if(distance>=g.width*.22||(distance>=45&&velocity>=.45)){
   try{navigator.vibrate?.(12)}catch{}
   if(g.dx>0)void chooseAll('green');else void chooseAll('red');
  }
 }

 const rotation=Math.max(-10,Math.min(10,swipeOffset/20));
 const stampOpacity=Math.min(1,Math.max(0,(Math.abs(swipeOffset)-15)/60));

 const learnableFactIds=new Set(items.map(i=>i.factId).filter((id):id is string=>Boolean(id)));
 const contextFacts=bundle.facts.filter(f=>f.entityId===intro.entityId&&!f.archived&&!learnableFactIds.has(f.id));
 const entityTags=bundle.entityTags.filter(t=>t.entityId===intro.entityId&&!t.archived);
 const tagById=new Map(bundle.tags.map(t=>[t.id,t]));
 const tags=entityTags.map(t=>tagById.get(t.tagId)?.name).filter((name):name is string=>Boolean(name));
 const entityType=bundle.entityTypes?.find(t=>t.id===entity?.type)?.name??entity?.type;

 async function choose(unitId:string,color:Familiarity){
  setSelections(prev=>({...prev,[unitId]:color}));
  if(busy)return;
  if(writeLock.current){pendingChoice.current={unitId,color};return}
  writeLock.current=true;setSaving(true);setSaveError('');
  try{
   await onChoose(unitId,color);
   while(pendingChoice.current){
    const next=pendingChoice.current;
    pendingChoice.current=null;
    await onChoose(next.unitId,next.color);
   }
  }catch{setSaveError('Не удалось сохранить выбор. Попробуйте ещё раз.')}
  finally{writeLock.current=false;setSaving(false)}
 }

 function stepFromPointer(clientX:number,target:HTMLElement):Familiarity{
  const rect=target.getBoundingClientRect();
  const ratio=Math.max(0,Math.min(1,(clientX-rect.left)/rect.width));
  if(ratio<0.28)return 'red';
  if(ratio<0.53)return 'orange';
  if(ratio<0.78)return 'yellow';
  return 'green';
 }
 function handleGaugePointerDown(e:React.PointerEvent<HTMLDivElement>,unitId:string,isSuspended:boolean){
  if(disabled||isSuspended)return;
  e.currentTarget.setPointerCapture(e.pointerId);
  const color=stepFromPointer(e.clientX,e.currentTarget);
  activeDrag.current={unitId,color};
  setSelections(prev=>({...prev,[unitId]:color}));
 }
 function handleGaugePointerMove(e:React.PointerEvent<HTMLDivElement>,unitId:string){
  if(!activeDrag.current||activeDrag.current.unitId!==unitId)return;
  const color=stepFromPointer(e.clientX,e.currentTarget);
  if(color!==activeDrag.current.color){
   activeDrag.current.color=color;
   setSelections(prev=>({...prev,[unitId]:color}));
   try{navigator.vibrate?.(5)}catch{}
  }
 }
 function handleGaugePointerUp(e:React.PointerEvent<HTMLDivElement>,unitId:string){
  if(!activeDrag.current||activeDrag.current.unitId!==unitId)return;
  const color=activeDrag.current.color;
  activeDrag.current=null;
  void choose(unitId,color);
 }

 async function chooseAll(color:Familiarity){
  if(disabled||writeLock.current)return;
  writeLock.current=true;setSaving(true);setSaveError('');
  try{
   const nextSelections:Record<string,Familiarity>={};
   for(const item of items)nextSelections[item.targetId]=color;
   if(onChooseAll){
    await onChooseAll(nextSelections);
   }else{
    for(const item of items)await onChoose(item.targetId,color);
   }
  }catch{
   setSaveError('Не удалось сохранить выбор. Попробуйте ещё раз.');
  }finally{
   writeLock.current=false;setSaving(false);
  }
 }

 return <main
  className="learning22-screen"
  aria-labelledby="object-intro-heading"
  aria-busy={disabled}
  onPointerDown={handlePointerDown}
  onPointerMove={handlePointerMove}
  onPointerUp={handlePointerUp}
  onPointerCancel={handlePointerUp}
 >
  <button type="button" className="learning22-close" onClick={onExit} disabled={disabled} aria-label="Закончить знакомство">✕</button>
  {swipeOffset>15&&<div className="learning22-stamp learning22-stamp-know" style={{opacity:stampOpacity,transform:`rotate(-10deg) scale(${0.85+stampOpacity*0.15})`}} aria-hidden="true">ЗНАЮ</div>}
  {swipeOffset<-15&&<div className="learning22-stamp learning22-stamp-plan" style={{opacity:stampOpacity,transform:`rotate(10deg) scale(${0.85+stampOpacity*0.15})`}} aria-hidden="true">В ПЛАН</div>}
  <div className="learning22-scroll">
   <section
    className={`learning22-content ${!image||intro.newProperty?'no-hero':''}`}
    style={{
     transform:swipeOffset!==0?`translateX(${swipeOffset}px) rotate(${rotation}deg)`:undefined,
     transition:swiping?'none':'transform 260ms cubic-bezier(0.175, 0.885, 0.32, 1.15)',
    }}
   >
    {!intro.newProperty&&(image?(
     <div className="learning22-hero-wrap">
      <KnowledgeImage src={image.url} alt={entity?.name??'Изображение объекта'} className="learning22-portrait"/>
     </div>
    ):(
     <div className="learning22-hero-badge" aria-hidden="true">
      <span>{entity?.name?.trim()?.[0]?.toUpperCase()??'★'}</span>
     </div>
    ))}

    <div className="learning22-header-block">
     <div className="learning22-badges-strip">
      {entityType&&<span className="learning22-badge">{entityType}</span>}
      {tags.map((tag,idx)=><span key={'t-'+idx} className="learning22-badge">{tag}</span>)}
     </div>
     <h1 id="object-intro-heading">{entity?.name??'Знакомство с объектом'}</h1>
     {!intro.newProperty&&entity?.summary&&<p className="learning22-summary">{entity.summary}</p>}
    </div>

    <div className="learning22-section">
     <div className="learning22-properties">
      {items.map(item=>{
       const fact=bundle.facts.find(f=>f.id===item.factId);
       const reverse=item.targetId.endsWith(':reverse');
       const isIdentity=!fact||item.targetId.includes(':visual_identity');
       const label=isIdentity?'Портрет':reverse?questionPrompt(fact?propertyById.get(fact.key):undefined,item.name,'choice','reverse'):fact?propertyById.get(fact.key)?.name??fact.key:'Портрет';
       const selected=selections[item.targetId]??intro.selections[item.targetId]??'red';
       const isSuspended=selected==='suspended';
       const currentGauge=gaugeLevels.find(g=>g.color===selected)??gaugeLevels[0];
       const val=isIdentity?'Портрет':formatIntroValue(fact,item.answer,bundle);
       return <div className={`learning22-property ${isSuspended?'is-suspended':''}`} key={item.targetId}>
        <div className="learning22-prop-meta">
         {!isIdentity&&<span className="learning22-prop-label">{label}</span>}
         <span className="learning22-value">{val}</span>
        </div>
        <div className="learning22-controls">
         <div
          className={`learning22-gauge learning22-gauge-${selected}`}
          role="group"
          aria-label={`Уровень для ${label}`}
          onPointerDown={e=>handleGaugePointerDown(e,item.targetId,isSuspended)}
          onPointerMove={e=>handleGaugePointerMove(e,item.targetId)}
          onPointerUp={e=>handleGaugePointerUp(e,item.targetId)}
          onPointerCancel={e=>handleGaugePointerUp(e,item.targetId)}
         >
          {gaugeLevels.map(level=>{
           const isActive=!isSuspended&&currentGauge.step>=level.step;
           const isTarget=selected===level.color;
           return <button type="button" key={level.color}
            className={`learning22-gauge-bar learning22-gauge-bar-${level.step} ${isActive?'is-active':''}`}
            aria-label={`${label}: ${level.label}`}
            aria-pressed={isTarget}
            disabled={disabled}
            onClick={e=>{e.stopPropagation();void choose(item.targetId,level.color)}}/>;
          })}
         </div>
         <div className="learning22-ctrl-div" aria-hidden="true"/>
         <button type="button"
          className={`learning22-suspend-btn ${isSuspended?'is-active':''}`}
          aria-label={`${label}: Не учить`}
          aria-pressed={isSuspended}
          disabled={disabled}
          onClick={()=>void choose(item.targetId,isSuspended?'red':'suspended')}>
          ✕
         </button>
        </div>
       </div>;
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
   <button type="button" className="learning22-action learning22-primary" onClick={onDone} disabled={disabled||!!displayError}>Готово</button>
   <span className="learning22-status" role="status">{saving?'Сохраняем выбор…':''}</span>
  </footer>
 </main>;
}
