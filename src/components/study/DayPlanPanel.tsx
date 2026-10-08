import {useEffect,useRef,useState} from 'react';
import {dayPlanSummary,dayBoundary,type GoalDayPlan} from '../../lib/engi/study-core/day-plan';
import './day-plan.css';
export function DayPlanPanel({plan,compact=false,inline=false,onExpired,onHelpChange}:{plan?:GoalDayPlan;compact?:boolean;inline?:boolean;onExpired?:()=>void;onHelpChange?:(open:boolean)=>void}){
 const [now,setNow]=useState(Date.now()),[showMistakes,setShowMistakes]=useState(false),requested=useRef<string|undefined>(undefined);
 const requestedAvailability=useRef<string|undefined>(undefined);
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer)},[]);
 const currentDay=dayBoundary(new Date(now)).day;
 useEffect(()=>{onHelpChange?.(showMistakes&&(plan?.mistakes?.length??0)>0)},[showMistakes,plan?.mistakes?.length,onHelpChange]);
 useEffect(()=>{if(plan&&plan.day!==currentDay&&requested.current!==currentDay){requested.current=currentDay;onExpired?.();}else if(plan?.day===currentDay)requested.current=undefined;},[currentDay,plan?.day,onExpired]);
 useEffect(()=>{const at=plan?.nextAvailabilityAt;if(at&&new Date(at).getTime()<=now&&requestedAvailability.current!==at){requestedAvailability.current=at;onExpired?.();}},[now,plan?.nextAvailabilityAt,onExpired]);
 if(!plan)return null;
 const p=dayPlanSummary(plan,now),expired=plan.day!==currentDay,mistakes=plan.mistakes?.length??0;
 if(inline)return <section className="day-plan-inline" aria-label="Доступные задания в этой практике">
  {[{key:'repeat',label:'Повторить',value:plan.available?.repeat??p.repeat.ready},{key:'reinforce',label:'Закрепить',value:plan.available?.reinforce??p.reinforce.ready},{key:'new',label:'Новое',value:plan.available?.new??Math.min(p.new.left,p.admission.available)}].map(({key,label,value})=><span key={key} className={`day-plan-number ${key}`} aria-label={`${label}: ${value}`} title={`${label}: ${value} · доступно сейчас`}><strong>{value}</strong></span>)}
  {mistakes>0&&<button type="button" className="day-plan-mistakes" aria-label={`Неразобранные ошибки: ${mistakes}`} aria-expanded={showMistakes} title="Неразобранные ошибки" onClick={()=>setShowMistakes(v=>!v)}>{mistakes}</button>}
  {mistakes>0&&showMistakes&&<div className="day-plan-mistakes-help" role="status"><strong>Ошибки · {mistakes}</strong><p>Столько знаний ещё нужно разобрать в этой подборке. Повторные промахи не увеличивают число.</p><p>Первый верный ответ в новом задании закрывает ошибку. Исправление внутри той же карточки и ответ с подсказкой требуют ещё одной проверки.</p><small>Ошибки разбираются вместе с обучением и сохраняются между днями. Разбор не переносит плановые проверки памяти.</small><button type="button" onClick={()=>setShowMistakes(false)}>Понятно</button></div>}
 </section>;
 return <section className={`day-plan ${compact?'day-plan-compact':''}`} aria-label="План на сегодня">
  {!compact&&<h2>{expired?'Обновляем план дня…':`План на сегодня · ${plan.scopeLabel??'все подборки'}`}</h2>}
  <div className="day-plan-counts">{[{label:'Повторить',value:p.repeat,ready:plan.available?.repeat??p.repeat.ready},{label:'Закрепить',value:p.reinforce,ready:plan.available?.reinforce??p.reinforce.ready},{label:'Новое',value:p.new,ready:plan.available?.new??Math.min(p.new.left,p.admission.available)}].map(({label,value:v,ready})=><div key={label}><span>{label}</span><strong>{compact?ready:`${v.done} / ${v.total}`}</strong>{!compact&&<><small>В плане осталось: {v.left}</small><small>Доступно сейчас: {ready}</small></>}</div>)}</div>
  {!expired&&p.new.left>0&&p.admission.held&&<p role="status">Новое на паузе: в первом обучении {p.admission.active} целей при лимите {p.admission.limit}. Сначала закрепите их по сроку.</p>}
  {!compact&&!expired&&<><p>{p.completed?'План на сегодня выполнен':p.nextAt?`Следующая проверка по сроку: ${new Date(p.nextAt).toLocaleString('ru-RU')}`:'Продолжайте самостоятельные проверки'}</p>
   <small>Считаем проверяемые знания, а не экраны: одно задание может проверить несколько знаний. Пара, полученная исключением, требует отдельной самостоятельной проверки. Верхние числа в ленте показывают доступное сейчас.</small>
   {mistakes>0&&<p className="day-plan-errors-summary">Неразобранные ошибки: {mistakes}. Разберём их в ленте, даже если доступное обучение уже закончится. Они сохраняются между днями.</p>}
   {(p.repeat.excluded+p.reinforce.excluded)>0&&<p>Исключено из плана: {p.repeat.excluded+p.reinforce.excluded}</p>}
   {(p.repeat.deferred+p.reinforce.deferred)>0&&<p>Следующие шаги перенесены на другой день: {p.repeat.deferred+p.reinforce.deferred}</p>}
  </>}
 </section>;
}
