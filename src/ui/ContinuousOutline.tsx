import {useLayoutEffect,useRef,useState} from 'react';
import {continuousCornerPath} from './continuous-corners';
/** Foreground frame: images and gradients cannot paint over the selected edge. */
export function ContinuousOutline(){
 const ref=useRef<SVGSVGElement>(null),[size,setSize]=useState({width:0,height:0,radius:24});
 useLayoutEffect(()=>{const parent=ref.current?.parentElement;if(!parent)return;const update=()=>{const width=parent.offsetWidth,height=parent.offsetHeight,radius=parseFloat(getComputedStyle(parent).borderTopLeftRadius)||24;setSize(old=>old.width===width&&old.height===height&&old.radius===radius?old:{width,height,radius});};update();const observer=new ResizeObserver(update);observer.observe(parent);return()=>observer.disconnect();},[]);
 return <svg ref={ref} className="deck-outline" viewBox={`0 0 ${size.width} ${size.height}`} aria-hidden="true" focusable="false">{size.width>2&&size.height>2&&<path transform="translate(1 1)" d={continuousCornerPath(size.width-2,size.height-2,size.radius-1)} fill="none" stroke="currentColor" strokeWidth="2"/>}</svg>;
}
