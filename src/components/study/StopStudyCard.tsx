import './learning22.css';
import {useEffect,useRef,useState} from 'react';

export type StopStudyCardProps={
 onMore:()=>void;
 onPractice:()=>void;
 onExit:()=>void;
 busy?:boolean;
 error?:string;
 waitingUntil?:string;
 onRefresh?:()=>void;
 onRetryMistakes?:()=>void;
 dailyPending?:boolean;
 mistakes?:number;
 unavailableMistakes?:number;
 newCardsPerDay?:number;
};

export function StopStudyCard({onMore,onPractice,onExit,busy=false,error,waitingUntil,onRefresh,onRetryMistakes,dailyPending=false,mistakes=0,unavailableMistakes=0,newCardsPerDay=3}:StopStudyCardProps){
 const [now,setNow]=useState(Date.now());
 const requested=useRef<string|undefined>(undefined);
 const waiting=waitingUntil&&Number.isFinite(new Date(waitingUntil).getTime())?new Date(waitingUntil):undefined;
 useEffect(()=>{if(!waitingUntil)return;setNow(Date.now());const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer)},[waitingUntil]);
 const seconds=waiting?Math.max(0,Math.ceil((waiting.getTime()-now)/1000)):0;
 useEffect(()=>{if(waiting&&seconds===0&&!busy&&!error&&onRefresh&&requested.current!==waitingUntil){requested.current=waitingUntil;onRefresh();}},[waitingUntil,seconds,busy,error,onRefresh]);
 return <main className="learning22-screen learning22-stop" aria-labelledby="stop-study-heading" aria-busy={busy}>
  <div className="learning22-scroll">
   <section className="learning22-content learning22-stop-content">
    <span className="learning22-complete" aria-hidden="true">{mistakes?'↻':'✓'}</span>
    <h1 id="stop-study-heading">{mistakes?'Продолжим разбор ошибок':waiting?'Следующая проверка после паузы':dailyPending?'В этой практике пока нет доступных заданий':'Готово на сейчас ✓'}</h1>
    <p className="learning22-summary">Сейчас нет вопросов, которые стоит задавать без нарушения интервалов.</p>
    <p className="learning22-help">{mistakes?`Неразобранных ошибок: ${mistakes}. Они сохранятся, пока вы не ответите самостоятельно правильно.`:dailyPending&&!waiting?'В плане дня остались цели. Попробуйте другую подборку или разные форматы.':'Новые знания получат проверку после паузы. Можно спокойно закончить или продолжить, если хочется.'}</p>
    {mistakes>0&&<p className="learning22-help">Для этих знаний пока не удалось построить корректное задание. Проверьте содержание или выберите другую подборку.</p>}
    {unavailableMistakes>0&&<p className="learning22-help" role="status">Недоступны для разбора: {unavailableMistakes}. Проверьте изображения и содержание этих знаний. Ошибки сохранены.</p>}
    {waiting&&<p role="status">{seconds>0?`Продолжим автоматически через ${seconds<60?`${seconds} сек.`:`${Math.ceil(seconds/60)} мин.`}`:'Можно продолжить повторение'}</p>}
    <div className="learning22-stop-actions">
     {unavailableMistakes>0&&onRetryMistakes&&<button type="button" className="learning22-action learning22-primary" onClick={onRetryMistakes} disabled={busy}>Повторить разбор ошибок</button>}
     {waiting&&onRefresh&&<button type="button" className="learning22-action learning22-primary" onClick={onRefresh} disabled={busy||seconds>0}>Продолжить повторение</button>}
     <button type="button" className={`learning22-action ${mistakes?'':'learning22-primary'}`} onClick={onMore} disabled={busy||newCardsPerDay===0}>Добавить новых карточек: {newCardsPerDay}</button>
     <button type="button" className="learning22-action" onClick={onPractice} disabled={busy}>Свободная практика</button>
     <button type="button" className="learning22-action learning22-quiet" onClick={onExit} disabled={busy}>Закончить</button>
    </div>
    {error&&<p className="learning22-error" role="alert">{error}</p>}
    <p className="learning22-status" role="status">{busy?'Подождите немного…':''}</p>
   </section>
  </div>
 </main>;
}
