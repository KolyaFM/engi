import {useEffect,useRef,useState} from 'react';
import {dayPlanSummary,dayBoundary,type GoalDayPlan} from '../../lib/engi/study-core/day-plan';
import './day-plan.css';
export function DayPlanPanel({plan,compact=false,onExpired}:{plan?:GoalDayPlan;compact?:boolean;onExpired?:()=>void}){
 const [now,setNow]=useState(Date.now()),requested=useRef<string|undefined>(undefined);
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer)},[]);
 const currentDay=dayBoundary(new Date(now)).day;
 useEffect(()=>{if(plan&&plan.day!==currentDay&&requested.current!==currentDay){requested.current=currentDay;onExpired?.();}else if(plan?.day===currentDay)requested.current=undefined;},[currentDay,plan?.day,onExpired]);
 if(!plan)return null;
 const p=dayPlanSummary(plan,now),expired=plan.day!==currentDay;
 return <section className={`day-plan ${compact?'day-plan-compact':''}`} aria-label="План на сегодня">
  {!compact&&<h2>{expired?'Обновляем план дня…':'План на сегодня · все подборки'}</h2>}
  <div className="day-plan-counts">{[['Повторить',p.repeat],['Закрепить',p.reinforce],['Новое',p.new]].map(([label,value])=>{const v=value as {done:number;total:number;left:number};return <div key={label as string}><span>{label as string}</span><strong>{compact?v.left:`${v.done} / ${v.total}`}</strong>{!compact&&<small>Осталось: {v.left}</small>}</div>})}</div>
  {!expired&&p.new.left>0&&p.admission.held&&<p role="status">Новое на паузе: в первом обучении {p.admission.active} целей при лимите {p.admission.limit}. Сначала закрепите их по сроку.</p>}
  {!compact&&!expired&&<><p>{p.completed?'План на сегодня выполнен':p.nextAt?`Следующая проверка по сроку: ${new Date(p.nextAt).toLocaleString('ru-RU')}`:'Продолжайте самостоятельные проверки'}</p>
   <small>Новое — первые самостоятельные проверки целей. Ошибка или оставшийся шаг обучения переходят в «Закрепить».</small>
   {(p.repeat.excluded+p.reinforce.excluded)>0&&<p>Исключено из плана: {p.repeat.excluded+p.reinforce.excluded}</p>}
   {(p.repeat.deferred+p.reinforce.deferred)>0&&<p>Следующие шаги перенесены на другой день: {p.repeat.deferred+p.reinforce.deferred}</p>}
  </>}
 </section>;
}
