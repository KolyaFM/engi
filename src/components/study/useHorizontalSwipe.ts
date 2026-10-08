import {useEffect,useRef} from 'react';
import type {PointerEvent as ReactPointerEvent} from 'react';
/** One owner per touch gesture: horizontal dismissal or vertical scrolling. */
export function useHorizontalSwipe({disabled,onOffset,onDragging,onSwipe}:{disabled:boolean;onOffset:(x:number)=>void;onDragging:(v:boolean)=>void;onSwipe:(side:0|1)=>void}){
 const gesture=useRef<{pointer:number;x:number;y:number;dx:number;width:number;axis?:'x'|'y';start:number;scroll?:HTMLElement;scrollTop:number;lastY:number;lastAt:number;velocity:number;allowSwipe:boolean}|undefined>(undefined),frame=useRef(0),momentum=useRef(0),pending=useRef(0),suppressClick=useRef(false);
 useEffect(()=>()=>{cancelAnimationFrame(frame.current);cancelAnimationFrame(momentum.current)},[]);
 function reset(){cancelAnimationFrame(frame.current);frame.current=0;gesture.current=undefined;onDragging(false);onOffset(0);}
 function end(e:ReactPointerEvent,cancel=false){const g=gesture.current;gesture.current=undefined;cancelAnimationFrame(frame.current);frame.current=0;onDragging(false);try{e.currentTarget.releasePointerCapture(e.pointerId)}catch{}if(!g)return;
  if(g.axis)suppressClick.current=true;
  if(!cancel&&g.axis==='x'){g.dx=e.clientX-g.x;const speed=Math.abs(g.dx)/Math.max(20,performance.now()-g.start);if(Math.abs(g.dx)>=Math.min(90,g.width*.22)||(Math.abs(g.dx)>=45&&speed>=.45)){onSwipe(g.dx<0?0:1);return;}}
  onOffset(0);
  if(!cancel&&g.axis==='y'&&g.scroll&&performance.now()-g.lastAt<80){let velocity=Math.max(-1.4,Math.min(1.4,g.velocity)),last=performance.now();const scroll=g.scroll;const tick=(now:number)=>{const elapsed=Math.min(32,now-last);last=now;const before=scroll.scrollTop;scroll.scrollTop+=velocity*elapsed;velocity*=Math.pow(.92,elapsed/16);if(Math.abs(velocity)>.025&&scroll.scrollTop!==before)momentum.current=requestAnimationFrame(tick);};momentum.current=requestAnimationFrame(tick);}
 }
 return {
  onPointerDown:(e:ReactPointerEvent<HTMLElement>)=>{if(disabled||!e.isPrimary||e.button!==0)return;const interactive=!!(e.target as HTMLElement).closest('button,input,textarea,select,a');suppressClick.current=false;cancelAnimationFrame(momentum.current);reset();const scroll=(e.target as HTMLElement).closest<HTMLElement>('.learning22-scroll,.feed-viewport')??e.currentTarget.querySelector<HTMLElement>('.learning22-scroll');gesture.current={pointer:e.pointerId,x:e.clientX,y:e.clientY,dx:0,width:e.currentTarget.getBoundingClientRect().width,start:performance.now(),scroll:scroll??undefined,scrollTop:scroll?.scrollTop??0,lastY:e.clientY,lastAt:performance.now(),velocity:0,allowSwipe:!interactive};if(!interactive)try{e.currentTarget.setPointerCapture(e.pointerId)}catch{}},
  onPointerMove:(e:ReactPointerEvent)=>{const g=gesture.current;if(!g||g.pointer!==e.pointerId)return;g.dx=e.clientX-g.x;const dy=e.clientY-g.y,x=Math.abs(g.dx),y=Math.abs(dy),now=performance.now();if(!g.axis){if(Math.max(x,y)<8)return;if(x>y*1.15&&g.allowSwipe)g.axis='x';else if(y>x*1.15)g.axis='y';else if(Math.max(x,y)>18)g.axis=x>y&&g.allowSwipe?'x':'y';if(g.axis==='x')onDragging(true);}
   if(g.axis==='y'&&g.scroll){g.scroll.scrollTop=g.scrollTop-dy;const dt=now-g.lastAt;if(dt>0)g.velocity=(g.lastY-e.clientY)/dt;g.lastY=e.clientY;g.lastAt=now;}
   if(g.axis==='x'){pending.current=g.dx;if(!frame.current)frame.current=requestAnimationFrame(()=>{frame.current=0;onOffset(pending.current);});}
  },
  onClickCapture:(e:React.MouseEvent)=>{if(suppressClick.current){e.preventDefault();e.stopPropagation();suppressClick.current=false;}},
  onPointerUp:(e:ReactPointerEvent)=>end(e),onPointerCancel:(e:ReactPointerEvent)=>end(e,true),onLostPointerCapture:()=>{if(gesture.current)reset();}
 };
}
