import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import type {Task} from '../../lib/engi/types';
import {KnowledgeImage} from '../knowledge/KnowledgeImage';
import {moveOrder,orderPositions} from '../../lib/engi/questions/order-feedback';
type Props={task:Task;initialOrder?:string[];initialCheckedOrder?:string[];initialDirtySlots?:number[];feedback:any;busy:boolean;onPersist:(order:string[],checked?:string[],dirty?:number[])=>void;onSubmit:(order:string[])=>void;onNext:()=>void;onMediaReady?:(ready:boolean)=>void;onMediaFail?:()=>void};
export function SortChallengeCard({task,initialOrder,initialCheckedOrder,initialDirtySlots,feedback,busy,onPersist,onSubmit,onNext,onMediaReady,onMediaFail}:Props){
 const expected=[...task.items].sort((a,b)=>a.year!-b.year!).map(i=>i.entityId);
 const [order,setOrder]=useState(initialOrder??task.items.map(i=>i.entityId)),[checked,setChecked]=useState(initialCheckedOrder),[dragging,setDragging]=useState<string>(),[drop,setDrop]=useState<number>(),[floating,setFloating]=useState<{top:number;left:number;width:number;height:number;image?:string;name:string;landing?:boolean}>(),[dirty,setDirty]=useState<number[]>(initialDirtySlots??[]),[zoom,setZoom]=useState<string>();
 const list=useRef<HTMLDivElement>(null),drag=useRef<{id:string;from:number;to:number;startY:number;y:number;active:boolean;box:DOMRect;image?:string;centers:number[];original:string[]} | null>(null),frame=useRef<number>(0),loaded=useRef(new Set<string>()),landingTimer=useRef<ReturnType<typeof setTimeout>>(undefined);
 const images=task.recipe.cue==='image'?task.items.filter(i=>!!i.image):[];
 const positions=checked&&feedback?orderPositions(checked,expected):order.map(()=>false),complete=!!feedback&&(checked?positions.every(Boolean):feedback.score===1);
 useEffect(()=>{onMediaReady?.(!images.length);return()=>{cancelAnimationFrame(frame.current);clearTimeout(landingTimer.current)}},[task.id]);
 // Older saved screens may contain feedback but no sorting draft.
 useEffect(()=>{if(feedback&&!checked){const chosen=Array.isArray(feedback.chosen)?feedback.chosen:order;setChecked(chosen);if(!initialOrder)setOrder(chosen);onPersist(initialOrder??chosen,chosen);}},[feedback]);
 function commit(next:string[]){const changed=next.map((id,n)=>id!==order[n]?n:-1).filter(n=>n>=0),nextDirty=[...new Set([...dirty,...changed])];setOrder(next);setDirty(nextDirty);onPersist(next,undefined,nextDirty);}
 function move(id:string,to:number){commit(moveOrder(order,id,to,positions));}
 function target(y:number){const rows=[...list.current!.querySelectorAll<HTMLElement>('[data-slot]')],available=rows.filter((_,n)=>!positions[n]);return available.reduce((best,row)=>{const box=row.getBoundingClientRect(),distance=Math.abs(y-box.top-box.height/2);return distance<best.distance?{to:Number(row.dataset.slot),distance}:best},{to:drag.current!.from,distance:Infinity}).to;}
 function tick(){const g=drag.current;if(!g?.active)return;const viewport=list.current?.closest('.feed-viewport');if(viewport){const box=viewport.getBoundingClientRect(),speed=g.y<box.top+55?-9:g.y>box.bottom-65?9:0;if(speed)viewport.scrollTop+=speed;g.to=target(g.y);setDrop(g.to);}frame.current=requestAnimationFrame(tick);}
 function clear(){cancelAnimationFrame(frame.current);drag.current=null;setDragging(undefined);setDrop(undefined);setFloating(undefined);}
 function updateFloat(){const g=drag.current;if(!g?.active)return;setFloating({top:g.box.top+g.y-g.startY,left:g.box.left,width:g.box.width,height:g.box.height,image:g.image,name:task.items.find(i=>i.entityId===g.id)!.name});}
 function finish(cancel=false){const g=drag.current;cancelAnimationFrame(frame.current);drag.current=null;if(!g)return;
  if(!g.active){clear();if(g.image&&!cancel)setZoom(g.id);return;}
  const next=cancel?g.original:moveOrder(g.original,g.id,g.to,positions),to=next.indexOf(g.id),rows=[...list.current!.querySelectorAll<HTMLElement>('[data-slot]')],box=rows[to].querySelector<HTMLElement>('.sort-row')!.getBoundingClientRect();
  if(!cancel)commit(next);setDrop(undefined);setFloating({top:rows[to].getBoundingClientRect().top,left:g.box.left,width:g.box.width,height:box.height,image:g.image,name:task.items.find(i=>i.entityId===g.id)!.name,landing:true});
  landingTimer.current=setTimeout(()=>clear(),window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:180);
 }
 function check(){setDirty([]);setChecked([...order]);onPersist(order,[...order],[]);if(!feedback)onSubmit(order);}
 const preview=dragging&&drop!==undefined?moveOrder(order,dragging,drop,positions):order;
 const count=positions.filter(Boolean).length;
 return <section className="chronology-card" onPointerMove={e=>{const g=drag.current;if(!g)return;g.y=e.clientY;if(!g.active&&Math.abs(g.y-g.startY)>7){g.active=true;setDragging(g.id);frame.current=requestAnimationFrame(tick);}if(g.active){updateFloat();g.to=target(g.y);setDrop(g.to);}}} onPointerUp={e=>{finish();try{e.currentTarget.releasePointerCapture(e.pointerId)}catch{}}} onPointerCancel={()=>finish(true)} onLostPointerCapture={()=>{if(drag.current)finish(true)}} onKeyDown={e=>{if(e.key==='Escape'&&drag.current){e.preventDefault();finish(true);}}}>
  <div ref={list} className={`feed-sort chronology-list ${drag.current?.active?'is-sorting':''}`} role="list" aria-label="Порядок событий от раннего к позднему">
   {order.map((id,n)=>{const item=task.items.find(i=>i.entityId===id)!,image=task.recipe.cue==='image'?item.image:undefined,correct=positions[n],wrong=!!feedback&&!!checked&&!correct&&!dirty.includes(n)&&preview[n]===order[n];const visual=preview.indexOf(id),g=drag.current,shift=g?.active&&id!==dragging?g.centers[visual]-g.centers[n]:0;
    return <div className={`chronology-slot ${drop===n?'is-drop-target':''}`} data-slot={n} role="listitem" key={n}>
     <div className={`sort-row ${image?'has-image':''} ${dragging===id?'is-placeholder':''} ${correct?'is-correct':wrong?'is-wrong':''}`} style={shift?{transform:`translateY(${shift}px)`}:undefined} data-item={id} role="button" tabIndex={busy||(!image&&(complete||correct))?-1:0} aria-disabled={busy||(!image&&(complete||correct))} aria-label={`${item.name}, место ${n+1}${correct?', верно':wrong?', неверно':''}`} aria-describedby="chronology-keyboard-help"
      onKeyDown={e=>{if(!busy&&image&&(e.key==='Enter'||e.key===' ')){e.preventDefault();setZoom(id);return;}if(busy||complete||correct||dragging)return;if(['ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const direction=e.key==='ArrowUp'?-1:1;let to=n+direction;while(to>=0&&to<order.length&&positions[to])to+=direction;move(id,to);requestAnimationFrame(()=>list.current?.querySelector<HTMLElement>(`[data-item="${id}"]`)?.focus());}else if(image&&(e.key==='Enter'||e.key===' ')){e.preventDefault();setZoom(id);}}}
      onPointerDown={e=>{if(busy||dragging||!e.isPrimary||e.button!==0)return;if(complete||correct){if(image)setZoom(id);return;}const source=e.currentTarget,box=source.getBoundingClientRect();drag.current={id,from:n,to:n,startY:e.clientY,y:e.clientY,active:false,box,image:source.querySelector('img')?.src,original:[...order],centers:[...list.current!.querySelectorAll('[data-slot]')].map(row=>{const r=row.getBoundingClientRect();return r.top+r.height/2;})};e.currentTarget.closest('.chronology-card')!.setPointerCapture(e.pointerId);}}>
      <div className="sort-content">{image?<KnowledgeImage src={image} alt={item.name} onReady={()=>{loaded.current.add(id);if(images.every(i=>loaded.current.has(i.entityId)))onMediaReady?.(true);}} onFail={onMediaFail}/>:<strong>{item.name}</strong>}</div>
     </div>
     <div className={`sort-position ${correct?'is-correct':wrong?'is-wrong':''}`}><div><span className="sort-mark" aria-hidden="true">{correct?'✓':wrong?'×':''}</span><span className="sort-rank">{n+1}</span></div><span className="sort-year">{complete?item.year:''}</span></div>
    </div>;
   })}
  </div>
  <span id="chronology-keyboard-help" className="sr-only">Перемещайте карточку стрелками вверх и вниз. Enter открывает изображение.</span>
  <div className={`sort-status ${complete?'is-complete':''}`} role="status">{complete?'Всё верно':feedback&&checked?`${count} из ${order.length} на месте`:''}</div>
  <button className="button primary sort-submit" disabled={busy||!!dragging} onClick={complete?onNext:check}>{complete?'Продолжить':feedback?'Проверить снова':'Проверить'}</button>
  {floating&&createPortal(<div className={`sort-drag-overlay ${floating.landing?'is-landing':''}`} aria-hidden="true" style={{top:floating.top,left:floating.left,width:floating.width,height:floating.height}}><div className="sort-content">{floating.image?<img src={floating.image} alt=""/>:<strong>{floating.name}</strong>}</div></div>,document.body)}
  {zoom&&<div className="overlay sort-image-dialog" onPointerDown={e=>e.stopPropagation()}><section className="editor-panel" role="dialog" aria-modal="true" aria-label="Просмотр изображения"><button className="icon-button" autoFocus aria-label="Закрыть изображение" onClick={()=>setZoom(undefined)} onKeyDown={e=>{if(e.key==='Escape')setZoom(undefined);if(e.key==='Tab')e.preventDefault();}}>×</button><KnowledgeImage src={task.items.find(i=>i.entityId===zoom)?.image} alt="Изображение для хронологии"/></section></div>}
 </section>;
}
