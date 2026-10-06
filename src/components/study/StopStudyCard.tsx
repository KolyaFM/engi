import './learning22.css';

export type StopStudyCardProps={
 onMore:()=>void;
 onPractice:()=>void;
 onExit:()=>void;
 busy?:boolean;
 error?:string;
};

export function StopStudyCard({onMore,onPractice,onExit,busy=false,error}:StopStudyCardProps){
 return <main className="learning22-screen learning22-stop" aria-labelledby="stop-study-heading" aria-busy={busy}>
  <div className="learning22-scroll">
   <section className="learning22-content learning22-stop-content">
    <span className="learning22-complete" aria-hidden="true">✓</span>
    <h1 id="stop-study-heading">Готово на сейчас ✓</h1>
    <p className="learning22-summary">Сейчас нет вопросов, которые стоит задавать без нарушения интервалов.</p>
    <p className="learning22-help">Новые знания получат проверку после паузы. Можно спокойно закончить или продолжить, если хочется.</p>
    <div className="learning22-stop-actions">
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
