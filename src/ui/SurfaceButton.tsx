import {useLayoutEffect,useRef,useState,type ButtonHTMLAttributes} from 'react';
import {continuousCornerPath} from './continuous-corners';
/** Static coloured surfaces crossfade by opacity; geometry never animates. */
export function SurfaceButton({children,className='',...props}:ButtonHTMLAttributes<HTMLButtonElement>){
 const ref=useRef<HTMLButtonElement>(null),[shape,setShape]=useState('');
 useLayoutEffect(()=>{
  const el=ref.current;if(!el)return;
  const update=()=>{const {width,height}=el.getBoundingClientRect(),radius=parseFloat(getComputedStyle(el).borderTopLeftRadius)||18;if(width>1&&height>1)setShape(continuousCornerPath(width-1,height-1,Math.max(0,radius-.5)));};
  update();const observer=new ResizeObserver(update);observer.observe(el);return()=>observer.disconnect();
 },[]);
 return <button {...props} ref={ref} className={`${className} continuous-control`}>
  <svg className="control-surface" aria-hidden="true" focusable="false"><path className="control-focus" transform="translate(.5 .5)" d={shape} vectorEffect="non-scaling-stroke"/><path className="control-face" transform="translate(.5 .5)" d={shape} vectorEffect="non-scaling-stroke"/></svg>
  {['selection','success','error'].map(state=><svg key={state} className={`control-layer control-${state}`} aria-hidden="true" focusable="false"><path transform="translate(.5 .5)" d={shape} vectorEffect="non-scaling-stroke"/></svg>)}
  {children}
 </button>;
}
