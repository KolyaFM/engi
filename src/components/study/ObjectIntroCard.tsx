import {useRef,useState} from 'react';
import type {SessionRow} from '../../db/engi-db';
import type {Bundle,Familiarity} from '../../lib/engi/types';
import {questionPrompt} from '../../lib/engi/questions/question-templates';
import {canonicalTargets} from '../../lib/engi/questions/recipe-factory';
import {properties,textValue} from '../../lib/engi/knowledge/properties';
import {hashFromUrl} from '../../media/media-store';
import {KnowledgeImage} from '../knowledge/KnowledgeImage';
import './learning22.css';

const familiarityOptions:{color:Familiarity;symbol:string;label:string}[]=[
 {color:'red',symbol:'🔴',label:'Не знаю'},
 {color:'orange',symbol:'🟠',label:'Знакомо, но не уверен'},
 {color:'yellow',symbol:'🟡',label:'Скорее знаю'},
 {color:'green',symbol:'🟢',label:'Знаю хорошо'},
 {color:'suspended',symbol:'★',label:'Не учить'},
];

export type ObjectIntroCardProps={
 intro:NonNullable<SessionRow['intro']>;
 bundle:Bundle;
 onChoose:(unitId:string,color:Familiarity)=>Promise<void>;
 onDone:()=>void;
 onExit:()=>void;
 busy?:boolean;
 error?:string;
};

export function ObjectIntroCard({intro,bundle,onChoose,onDone,onExit,busy=false,error}:ObjectIntroCardProps){
 const [saving,setSaving]=useState(false),[saveError,setSaveError]=useState('');
 const writeLock=useRef(false);
 const entity=bundle.entities.find(e=>e.id===intro.entityId);
 const unitIds=new Set(intro.unitIds);
 const items=canonicalTargets(bundle).filter(i=>unitIds.has(i.targetId));
 const propertyById=new Map(properties(bundle).map(p=>[p.id,p]));
 const image=bundle.media.find(m=>m.entityId===intro.entityId&&!m.archived&&
  (m.primary||m.role==='primary')&&m.learningExemplar!==false&&
  ['primary','portrait','photo','image','artwork','painting'].includes(m.role)&&!!hashFromUrl(m.url));
 const disabled=busy||saving;
 const displayError=error||saveError;

 async function choose(unitId:string,color:Familiarity){
  if(busy||writeLock.current)return;
  writeLock.current=true;setSaving(true);setSaveError('');
  try{await onChoose(unitId,color)}
  catch{setSaveError('Не удалось сохранить выбор. Попробуйте ещё раз.')}
  finally{writeLock.current=false;setSaving(false)}
 }

 return <main className="learning22-screen" aria-labelledby="object-intro-heading" aria-busy={disabled}>
  <header className="learning22-header">
   <button type="button" className="learning22-close" onClick={onExit} disabled={disabled} aria-label="Закончить знакомство">×</button>
   <span>{intro.newProperty?'НОВОЕ СВОЙСТВО':'НОВЫЙ ОБЪЕКТ'}</span>
  </header>
  <div className="learning22-scroll">
   <section className="learning22-content">
    {!intro.newProperty&&image&&<KnowledgeImage src={image.url} alt={entity?.name??'Изображение объекта'} className="learning22-portrait"/>}
    <h1 id="object-intro-heading">{entity?.name??'Знакомство с объектом'}</h1>
    {!intro.newProperty&&entity?.summary&&<p className="learning22-summary">{entity.summary}</p>}
    <p className="learning22-help">Отметьте, насколько знакомо каждое свойство. Выбор сохраняется сразу.</p>
    <details className="learning22-legend">
     <summary>Что означают цвета и ★</summary>
     <ul>{familiarityOptions.map(option=><li key={option.color}><span aria-hidden="true">{option.symbol}</span> {option.label}</li>)}</ul>
    </details>
    <div className="learning22-properties">
     {items.map(item=>{
      const fact=bundle.facts.find(f=>f.id===item.factId);
      const reverse=item.targetId.endsWith(':reverse');
      const label=reverse?questionPrompt(fact?propertyById.get(fact.key):undefined,item.name,'choice','reverse'):fact?propertyById.get(fact.key)?.name??fact.key:'Портрет → имя';
      const selected=intro.selections[item.targetId]??'red';
      const selectedLabel=familiarityOptions.find(option=>option.color===selected)!.label;
      return <fieldset className="learning22-property" key={item.targetId} disabled={disabled}>
       <legend>{label}</legend>
       <p className="learning22-value">{fact&&!reverse?textValue(fact,bundle):item.answer}</p>
       <div className="learning22-colors">
        {familiarityOptions.map(option=><button type="button" key={option.color}
         className={`learning22-color learning22-color-${option.color}`}
         aria-label={`${label}: ${option.label}`} title={option.label}
         aria-pressed={selected===option.color}
         onClick={()=>void choose(item.targetId,option.color)}>
         <span aria-hidden="true">{option.symbol}</span>
         {selected===option.color&&<span className="learning22-selected" aria-hidden="true">✓</span>}
        </button>)}
       </div>
       <p className="learning22-selected-label">{selectedLabel}</p>
      </fieldset>;
     })}
    </div>
   </section>
  </div>
  <footer className="learning22-footer">
   {displayError&&<p className="learning22-error" role="alert">{displayError}</p>}
   <button type="button" className="learning22-action learning22-primary" onClick={onDone} disabled={disabled||!!displayError}>Готово</button>
   <span className="learning22-status" role="status">{saving?'Сохраняем выбор…':''}</span>
  </footer>
 </main>;
}
