import {useEffect,useRef} from 'react';
import type {PointerEvent as ReactPointerEvent} from 'react';
/** One owner per gesture. Native scroll surfaces must never also be scrolled by this controller. */
export function useHorizontalSwipe({disabled,onOffset,onDragging,onSwipe,nativeScroll=false}:{disabled:boolean;onOffset:(x:number)=>void;onDragging:(v:boolean)=>void;onSwipe:(side:0|1)=>void;nativeScroll?:boolean}){
 const gesture=useRef<{pointer:number;owner:HTMLElement;x:number;y:number;dx:number;width:number;axis?:'x'|'y';start:number;scroll?:HTMLElement;scrollTop:number;lastY:number;lastAt:number;velocity:number;allowSwipe:boolean}|undefined>(undefined),frame=useRef(0),momentum=useRef(0),pending=useRef(0),suppressClick=useRef(false),touches=useRef(new Set<number>()),multitouch=useRef(false);
 const callbacks=useRef({disabled,onOffset,onDragging,onSwipe});callbacks.current={disabled,onOffset,onDragging,onSwipe};
 function reset(){const g=gesture.current;gesture.current=undefined;cancelAnimationFrame(frame.current);cancelAnimationFrame(momentum.current);frame.current=momentum.current=0;if(g?.axis)suppressClick.current=true;if(g)try{g.owner.releasePointerCapture(g.pointer)}catch{}callbacks.current.onDragging(false);callbacks.current.onOffset(0);}
 useEffect(()=>{
  const down=(e:PointerEvent)=>{if(e.pointerType!=='touch')return;/* A new primary touch also recovers missing Safari edge-gesture endings. */if(e.isPrimary){touches.current.clear();multitouch.current=false;if(gesture.current)reset();}touches.current.add(e.pointerId);if(touches.current.size>1){multitouch.current=true;if(gesture.current||momentum.current)reset();}};
  const up=(e:PointerEvent)=>{touches.current.delete(e.pointerId);if(!touches.current.size)multitouch.current=false;if(gesture.current?.pointer===e.pointerId)reset();};
  const interrupt=()=>{touches.current.clear();multitouch.current=false;if(gesture.current||momentum.current)reset();};
  const visibility=()=>{if(document.hidden)interrupt();};
  document.addEventListener('pointerdown',down,true);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);window.addEventListener('touchcancel',interrupt);window.addEventListener('blur',interrupt);window.addEventListener('pagehide',interrupt);document.addEventListener('visibilitychange',visibility);window.visualViewport?.addEventListener('resize',interrupt);
  return()=>{document.removeEventListener('pointerdown',down,true);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);window.removeEventListener('touchcancel',interrupt);window.removeEventListener('blur',interrupt);window.removeEventListener('pagehide',interrupt);document.removeEventListener('visibilitychange',visibility);window.visualViewport?.removeEventListener('resize',interrupt);cancelAnimationFrame(frame.current);cancelAnimationFrame(momentum.current);};
 },[]);
 useEffect(()=>{if(disabled&&(gesture.current||momentum.current))reset();},[disabled]);
 function end(e:ReactPointerEvent,cancel=false){const g=gesture.current;if(!g||g.pointer!==e.pointerId)return;gesture.current=undefined;cancelAnimationFrame(frame.current);frame.current=0;onDragging(false);try{g.owner.releasePointerCapture(g.pointer)}catch{}
  if(g.axis)suppressClick.current=true;
  if(!cancel&&!callbacks.current.disabled&&!multitouch.current&&g.axis==='x'){g.dx=e.clientX-g.x;const speed=Math.abs(g.dx)/Math.max(20,performance.now()-g.start);if(Math.abs(g.dx)>=Math.min(90,g.width*.22)||(Math.abs(g.dx)>=45&&speed>=.45)){onSwipe(g.dx<0?0:1);return;}}
  onOffset(0);
  if(!cancel&&!nativeScroll&&g.axis==='y'&&g.scroll&&performance.now()-g.lastAt<80){let velocity=Math.max(-1.4,Math.min(1.4,g.velocity)),last=performance.now();const scroll=g.scroll;const tick=(now:number)=>{const elapsed=Math.min(32,now-last);last=now;const before=scroll.scrollTop;scroll.scrollTop+=velocity*elapsed;velocity*=Math.pow(.92,elapsed/16);if(Math.abs(velocity)>.025&&scroll.scrollTop!==before)momentum.current=requestAnimationFrame(tick);else momentum.current=0;};momentum.current=requestAnimationFrame(tick);}
 }
 return {
  onPointerDown:(e:ReactPointerEvent<HTMLElement>)=>{if(disabled||!e.isPrimary||e.button!==0||multitouch.current)return;const interactive=!!(e.target as HTMLElement).closest('button,input,textarea,select,a');if(nativeScroll&&interactive)return;suppressClick.current=false;reset();const scroll=nativeScroll?undefined:(e.target as HTMLElement).closest<HTMLElement>('.learning22-scroll,.feed-viewport')??e.currentTarget.querySelector<HTMLElement>('.learning22-scroll');gesture.current={pointer:e.pointerId,owner:e.currentTarget,x:e.clientX,y:e.clientY,dx:0,width:e.currentTarget.getBoundingClientRect().width,start:performance.now(),scroll:scroll??undefined,scrollTop:scroll?.scrollTop??0,lastY:e.clientY,lastAt:performance.now(),velocity:0,allowSwipe:!interactive&&(e.pointerType!=='touch'||e.clientX>=24&&e.clientX<=window.innerWidth-24)};if(!interactive)try{e.currentTarget.setPointerCapture(e.pointerId)}catch{}},
  onPointerMove:(e:ReactPointerEvent)=>{const g=gesture.current;if(!g||g.pointer!==e.pointerId)return;g.dx=e.clientX-g.x;const dy=e.clientY-g.y,x=Math.abs(g.dx),y=Math.abs(dy),now=performance.now();if(!g.axis){if(Math.max(x,y)<8)return;if(x>y*1.15&&g.allowSwipe)g.axis='x';else if(y>x*1.15)g.axis='y';else if(Math.max(x,y)>18)g.axis=x>y&&g.allowSwipe?'x':'y';if(g.axis==='x')onDragging(true);}
   if(g.axis==='y'&&!nativeScroll&&g.scroll){g.scroll.scrollTop=g.scrollTop-dy;const dt=now-g.lastAt;if(dt>0)g.velocity=(g.lastY-e.clientY)/dt;g.lastY=e.clientY;g.lastAt=now;}
   if(g.axis==='x'){pending.current=g.dx;if(!frame.current)frame.current=requestAnimationFrame(()=>{frame.current=0;onOffset(pending.current);});}
  },
  onClickCapture:(e:React.MouseEvent)=>{if(suppressClick.current){e.preventDefault();e.stopPropagation();suppressClick.current=false;}},
  onPointerUp:(e:ReactPointerEvent)=>end(e),onPointerCancel:(e:ReactPointerEvent)=>end(e,true),onLostPointerCapture:(e:ReactPointerEvent)=>{if(gesture.current?.pointer===e.pointerId)reset();}
 };
}
