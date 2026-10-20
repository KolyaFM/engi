import {useEffect,useLayoutEffect,useRef,useState,type CSSProperties} from 'react';
import type {Task,Item} from '../../lib/engi/types';
import type {InteractionDraft} from '../../db/engi-db';
import {matchingResponseKey} from '../../lib/engi/questions/matching-response-key';
import {intervalAxisTicks} from '../../lib/engi/questions/interval-scale';
import {SurfaceButton} from '../../ui/SurfaceButton';

export function IntervalBandsCard({task,progress,busy,onPair,onComplete,onMediaReady}:{task:Task;progress?:InteractionDraft['matching'];busy:boolean;onPair:(pair:{entityId:string;responseKey?:string;answerId:string},requestId:string)=>Promise<{correct:boolean;complete:boolean}>;onComplete:()=>void;onMediaReady:(ready:boolean)=>void;onMediaFail:()=>void}){
 const exercise=task.intervalExercise;if(exercise?.kind!=='bands')throw Error('Missing interval scale');const scale=exercise.scale;
 const key=(i:Item)=>matchingResponseKey(task,i),label=(i:Item)=>i.interval?.propertyLabel??task.recipe.label??'Период';
 const [localMatched,setMatched]=useState<Record<string,string>>({}),[pending,setPending]=useState(false),[status,setStatus]=useState(''),[wrong,setWrong]=useState<string>(),[inspect,setInspect]=useState<string>(),[plotWidth,setPlotWidth]=useState(280);
 const alive=useRef(true),lock=useRef(false),request=useRef<{responseKey:string;answerId:string;id:string}|undefined>(undefined);
 const records=useRef<HTMLDivElement>(null),axis=useRef<HTMLDivElement>(null),positions=useRef(new Map<string,number>()),scrollToNext=useRef(false);
 const supports=new Set(scale.bands.filter(v=>v.support).map(v=>v.id));
 const matched={...Object.fromEntries(task.items.filter(i=>supports.has(i.answerId)).map(i=>[key(i),i.answerId])),...progress?.matched,...localMatched};
 const remaining=task.items.filter(i=>!matched[key(i)]),found=task.items.filter(i=>matched[key(i)]===i.answerId),complete=remaining.length===0;
 const current=remaining[0],activeBand=complete?inspect:current?.answerId,active=scale.bands.find(v=>v.id===activeBand);
 const position=(year:number)=>(year-scale.min)/(scale.max-scale.min)*100,color=(index:number)=>`var(--interval-color-${index%5})`;
 const ticks=intervalAxisTicks(scale.min,scale.max,plotWidth);
 const tickSpacing=ticks.length>1?(ticks[1]-ticks[0])/(scale.max-scale.min)*plotWidth:plotWidth;
 const tickFontSize=Math.min(14,tickSpacing/(Math.max(...ticks.map(year=>String(year).length))*0.62+0.3));
 useEffect(()=>{alive.current=true;onMediaReady(true);return()=>{alive.current=false}},[]);
 useLayoutEffect(()=>{const el=axis.current;if(!el)return;const measure=()=>setPlotWidth(el.clientWidth),observer=new ResizeObserver(measure);measure();observer.observe(el);return()=>observer.disconnect();},[]);
 useLayoutEffect(()=>{
  const el=records.current;if(!el)return;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches,next=new Map<string,number>();
  el.querySelectorAll<HTMLElement>('[data-record]').forEach(node=>{const id=node.dataset.record!,top=node.offsetTop,old=positions.current.get(id);next.set(id,top);if(!reduced&&old!==undefined&&old!==top)node.animate(node.classList.contains('interval-found-row')?[{opacity:0},{opacity:1}]:[{transform:`translateY(${old-top}px)`},{transform:'translateY(0)'}],{duration:180,easing:'cubic-bezier(.22,1,.36,1)'});});positions.current=next;
  if(scrollToNext.current){el.scrollTop=0;scrollToNext.current=false;}
 },[remaining.length]);
 async function check(item:Item){
  if(lock.current||busy||!current||complete)return;lock.current=true;setPending(true);setWrong(undefined);setStatus('');
  const responseKey=key(current),answerId=item.answerId;
  if(request.current?.responseKey!==responseKey||request.current.answerId!==answerId)request.current={responseKey,answerId,id:crypto.randomUUID()};
  try{const result=await onPair({entityId:current.entityId,responseKey,answerId},request.current.id);if(!alive.current)return;request.current=undefined;
   if(result.correct){setMatched(old=>({...old,[responseKey]:answerId}));setStatus('');scrollToNext.current=true;}else setWrong(key(item));
  }catch{if(alive.current)setStatus('Не удалось сохранить ответ.');}
  finally{if(alive.current){setPending(false);lock.current=false;}}
 }
 return <section className="interval-bands" aria-label="Сопоставление периодов" aria-busy={pending}>
  <div className="interval-stage">
   <div className="interval-heading"><h2>Какой это период?</h2></div>
   <div className="interval-chart" role="img" aria-label={`Общая временная шкала: ${scale.min}–${scale.max}. ${scale.bands.length} периодов.`}>
    <div className="interval-axis" ref={axis} style={{fontSize:tickFontSize}}>{ticks.map((year,n)=><span key={year} className={n===0?'first':n===ticks.length-1?'last':''} style={{left:position(year)+'%',top:0}}>{year}</span>)}</div>
    <div className="interval-plot">
     <div className="interval-grid" aria-hidden="true">{ticks.map(year=><i key={year} style={{left:position(year)+'%'}}/>)}</div>
     {scale.bands.map(band=><div key={band.id} className={`interval-band-row ${activeBand===band.id?'is-active':''}`} data-active-band={activeBand===band.id?band.id:undefined} style={{'--band-color':color(band.colorIndex)} as CSSProperties} aria-hidden="true"><span className="interval-band-indicator">›</span><span className="interval-band-bar" style={{left:position(band.start)+'%',width:(position(band.end+1)-position(band.start))+'%'}}/></div>)}
    </div>
   </div>
   {active&&<div className="interval-current" aria-live="polite"><span className="interval-color-key" style={{background:color(active.colorIndex)}} aria-hidden="true"/><strong className="interval-current-years">{active.start}–{active.end}</strong></div>}
  </div>
  <div className="interval-records" ref={records}>
   <div className="interval-answers" role="group" aria-label="Варианты ответа">{remaining.map(item=><div key={key(item)} data-record={key(item)}><SurfaceButton className={`interval-answer ${wrong===key(item)?'is-wrong':''}`} aria-label={`${item.name} — ${label(item)}`} disabled={busy||pending} onClick={()=>void check(item)}><strong>{item.name}</strong><span>{label(item)}</span></SurfaceButton></div>)}</div>
   {found.length>0&&<div className="interval-found">{found.map(item=>{const band=scale.bands.find(b=>b.id===item.answerId)!;return <button key={key(item)} data-record={key(item)} type="button" className={`interval-found-row ${supports.has(item.answerId)?'is-support':''}`} aria-label={`Посмотреть: ${item.name} — ${label(item)}`} aria-pressed={complete&&inspect===band.id} onClick={()=>{if(complete)setInspect(inspect===band.id?undefined:band.id)}}><span className="interval-color-key" style={{background:color(band.colorIndex)}} aria-hidden="true"/><span><strong>{item.name}</strong><small>{label(item)} · <span className="interval-found-years">{band.start}–{band.end}</span>{supports.has(item.answerId)?' · Опора':''}</small></span></button>})}</div>}
  </div>
  <p className="interval-status" role="status">{status}</p>
  {complete&&<SurfaceButton className="button primary interval-continue" disabled={pending||busy} onClick={onComplete}>Продолжить</SurfaceButton>}
 </section>;
}
