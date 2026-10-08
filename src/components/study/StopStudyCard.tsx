import './learning22.css';
import {useEffect,useState} from 'react';

export type StopStudyCardProps={
 onMore:()=>void;
 onPractice:()=>void;
 onExit:()=>void;
 busy?:boolean;
 error?:string;
 waitingUntil?:string;
 onRefresh?:()=>void;
 dailyPending?:boolean;
};

export function StopStudyCard({onMore,onPractice,onExit,busy=false,error,waitingUntil,onRefresh,dailyPending=false}:StopStudyCardProps){
 const [now,setNow]=useState(Date.now());
 const waiting=waitingUntil&&Number.isFinite(new Date(waitingUntil).getTime())?new Date(waitingUntil):undefined;
 useEffect(()=>{if(!waitingUntil)return;setNow(Date.now());const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer)},[waitingUntil]);
 const seconds=waiting?Math.max(0,Math.ceil((waiting.getTime()-now)/1000)):0;
 return <main className="learning22-screen learning22-stop" aria-labelledby="stop-study-heading" aria-busy={busy}>
  <div className="learning22-scroll">
   <section className="learning22-content learning22-stop-content">
    <span className="learning22-complete" aria-hidden="true">✓</span>
    <h1 id="stop-study-heading">{waiting?'Следующая проверка после паузы':dailyPending?'В этой практике пока нет доступных заданий':'Готово на сейчас ✓'}</h1>
    <p className="learning22-summary">Сейчас нет вопросов, которые стоит задавать без нарушения интервалов.</p>
    <p className="learning22-help">{dailyPending&&!waiting?'В плане дня остались цели. Попробуйте другую подборку или разные форматы.':'Новые знания получат проверку после паузы. Можно спокойно закончить или продолжить, если хочется.'}</p>
    {waiting&&<p role="status">{seconds>0?`Следующая проверка: ${waiting.toLocaleString('ru-RU')} · осталось ${seconds<60?`${seconds} сек.`:`${Math.ceil(seconds/60)} мин.`}`:'Можно продолжить повторение'}</p>}
    <div className="learning22-stop-actions">
     {waiting&&onRefresh&&<button type="button" className="learning22-action learning22-primary" onClick={onRefresh} disabled={busy||seconds>0}>Продолжить повторение</button>}
     <button type="button" className="learning22-action learning22-primary" onClick={onMore} disabled={busy}>Открыть ещё 2 объекта</button>
     <button type="button" className="learning22-action" onClick={onPractice} disabled={busy}>Свободная практика</button>
     <button type="button" className="learning22-action learning22-quiet" onClick={onExit} disabled={busy}>Закончить</button>
    </div>
    {error&&<p className="learning22-error" role="alert">{error}</p>}
    <p className="learning22-status" role="status">{busy?'Подождите немного…':''}</p>
   </section>
  </div>
 </main>;
}
