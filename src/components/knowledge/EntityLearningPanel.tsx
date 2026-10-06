import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import type {Item,Memory,Snapshot} from '../../lib/engi/types';
import {indexes} from '../../lib/engi/indexes';
import {canonicalTargets} from '../../lib/engi/questions/recipe-factory';
import {currentMastery} from '../../lib/engi/learning/mastery';
import {retention} from '../../lib/engi/engine';
import {textValue} from '../../lib/engi/knowledge/properties';
import {setUnitSuspended} from '../../services/learning-service';
import './entity-learning.css';

const marks:Record<string,string>={red:'🔴',orange:'🟠',yellow:'🟡',green:'🟢',suspended:'★'};
const numeric=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1});
function dateLabel(value:unknown,includeTime=false){
 if(!value)return 'Пока не было';
 const date=new Date(value as string);
 if(!Number.isFinite(date.getTime()))return 'Пока нет даты';
 return date.toLocaleString('ru-RU',includeTime?{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}:{day:'numeric',month:'long',year:'numeric'});
}
function nextLabel(memory?:Memory){
 if(memory?.status==='suspended')return 'Не запланировано';
 if(!memory)return 'После знакомства';
 const due=new Date(memory.card.due),end=new Date();end.setHours(23,59,59,999);
 if(!Number.isFinite(due.getTime()))return 'Пока нет даты';
 return due<=end?'Повторить сегодня':`Следующее: ${dateLabel(due)}`;
}

export function EntityLearningPanel({entityId,snapshot,onReload}:{entityId:string;snapshot:Snapshot;onReload:()=>void}){
 const [selectedId,setSelectedId]=useState<string>();
 const bundle=snapshot.bundle,ix=indexes(bundle),targets=canonicalTargets(bundle);
 const items=targets.filter(item=>item.factId?bundle.facts.find(f=>f.id===item.factId)?.entityId===entityId:item.entityId===entityId);
 const memories=new Map(snapshot.memories.filter(m=>!m.legacyOf).map(m=>[m.id,m]));
 function label(item:Item){
  const fact=bundle.facts.find(f=>f.id===item.factId);
  if(!fact)return 'Портрет → имя';
  const property=ix.propertyById.get(fact.key),base=property?.name??fact.key;
  if(item.targetId.endsWith(':reverse'))return property?.inverse?.name??`${base} → объект`;
  const hasVisual=items.some(other=>other.factId===item.factId&&other.targetId.endsWith(':visual'));
  return hasVisual?`${base} · ${item.targetId.endsWith(':visual')?'по изображению':'по имени'}`:base;
 }
 const selected=items.find(item=>item.targetId===selectedId);
 if(!items.length)return null;
 return <section className="entity-learning" aria-label="Обучение по свойствам">
  <h3>Обучение по свойствам</h3>
  <div className="entity-learning-list">{items.map(item=>{
   const memory=memories.get(item.targetId),mastery=currentMastery(memory);
   return <button type="button" className="entity-learning-row" key={item.targetId} onClick={()=>setSelectedId(item.targetId)} aria-haspopup="dialog">
    <strong>{label(item)}</strong>
    <span className="entity-learning-state"><span aria-hidden="true">{marks[mastery.color]}</span> {mastery.label}</span>
    {mastery.color!=='suspended'&&<small>{nextLabel(memory)}</small>}
    <span className="entity-learning-arrow" aria-hidden="true">›</span>
   </button>;
  })}</div>
  {selected&&<UnitLearningDetail key={selected.targetId} item={selected} label={label(selected)} snapshot={snapshot} memory={memories.get(selected.targetId)} onClose={()=>setSelectedId(undefined)} onReload={onReload}/>}
 </section>;
}

function UnitLearningDetail({item,label,snapshot,memory,onClose,onReload}:{item:Item;label:string;snapshot:Snapshot;memory?:Memory;onClose:()=>void;onReload:()=>void}){
 const panel=useRef<HTMLElement>(null),closeButton=useRef<HTMLButtonElement>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),lock=useRef(false);
 useEffect(()=>{
  const previous=document.activeElement as HTMLElement|null;closeButton.current?.focus();
  function keydown(event:KeyboardEvent){
   if(event.key==='Escape'){event.preventDefault();event.stopPropagation();if(!lock.current)onClose()}
   if(event.key!=='Tab')return;
   const controls=[...panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],[tabindex="0"]')??[]];
   const first=controls[0],last=controls.at(-1);
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
  }
  document.addEventListener('keydown',keydown,true);
  return()=>{document.removeEventListener('keydown',keydown,true);previous?.focus()};
 },[]);
 async function toggle(){
  if(lock.current)return;lock.current=true;setBusy(true);setError('');
  try{await setUnitSuspended(item.targetId,memory?.status!=='suspended');onReload();onClose()}
  catch(e){setError(e instanceof Error?e.message:'Не удалось сохранить. Попробуйте ещё раз.')}
  finally{lock.current=false;setBusy(false)}
 }
 const fact=snapshot.bundle.facts.find(f=>f.id===item.factId);
 const mastery=currentMastery(memory),attempts=memory?.attempts??0,errors=Math.max(0,attempts-(memory?.correct??0));
 const confusionNames=new Map(canonicalTargets(snapshot.bundle).map(target=>[target.targetId,target.answer]));
 const confusions=Object.entries(memory?.confusions??{}).filter(([,count])=>count>0).sort((a,b)=>b[1]-a[1]);
 function confusionName(value:string){
  return snapshot.bundle.entities.find(e=>e.id===value)?.name??confusionNames.get(value)??snapshot.bundle.facts.find(f=>f.id===value)?.valueText??(/^(ku:|fact:|entity:)/.test(value)?'Другой ответ':value);
 }
 return createPortal(<div className="overlay nested unit-learning-overlay" onMouseDown={event=>{if(event.target===event.currentTarget&&!busy)onClose()}}>
  <section className="editor-panel unit-learning-detail" role="dialog" aria-modal="true" aria-labelledby="unit-learning-title" ref={panel} aria-busy={busy}>
   <div className="section-heading"><h2 id="unit-learning-title">{label}</h2><button ref={closeButton} type="button" className="icon-button" onClick={onClose} disabled={busy} aria-label="Закрыть детали обучения">×</button></div>
   <p className="unit-learning-value">{fact&&!item.targetId.endsWith(':reverse')?textValue(fact,snapshot.bundle):item.answer}</p>
   <p className="entity-learning-state"><span aria-hidden="true">{marks[mastery.color]}</span> {mastery.label}</p>
   <dl className="unit-learning-metrics">
    <div><dt>Последнее повторение</dt><dd>{dateLabel(memory?.lastReviewAt??memory?.card.last_review,true)}</dd></div>
    <div><dt>Следующее повторение</dt><dd>{nextLabel(memory)}</dd></div>
    <div><dt>Устойчивость памяти</dt><dd>{memory?.firstSuccessAt?`${numeric.format(Number(memory.card.stability)||0)} дн.`:'Пока нет данных'}</dd></div>
    <div><dt>Вероятность вспомнить сейчас</dt><dd>{memory?.firstSuccessAt?`≈ ${Math.round(retention(memory)*100)}%`:'Нужна первая успешная проверка'}</dd></div>
    <div><dt>Попытки</dt><dd>{attempts}</dd></div>
    <div><dt>Ошибки</dt><dd>{errors}</dd></div>
   </dl>
   <div className="unit-learning-confusions"><h3>С чем путалось</h3>{confusions.length?<ul>{confusions.map(([value,count])=><li key={value}><span>{confusionName(value)}</span><span>{numeric.format(count)}</span></li>)}</ul>:<p className="muted">Путаницы пока нет.</p>}</div>
   <button type="button" className="button unit-learning-toggle" disabled={busy} onClick={()=>void toggle()}>{memory?.status==='suspended'?'Вернуть в обучение':'★ Не учить это свойство'}</button>
   {memory?.status==='suspended'&&<p className="muted">Свойство сохранено и исключено из обычных повторений. Его можно вернуть в любой момент.</p>}
   {error&&<p className="bad-text" role="alert">{error}</p>}
  </section>
 </div>,document.body);
}
