/** Two cubic segments per corner. Straight joins have zero curvature; the
 * middle join has equal tangents and curvature (G2), rather than a circular arc. */
export function continuousCornerPath(width:number,height:number,radius:number){
 const r=Math.min(radius,width/2,height/2),q=r/4,f=(v:number)=>Number(v.toFixed(3));
 const point=(x:number,y:number)=>`${f(x)} ${f(y)}`;
 return `M ${point(r,0)} H ${f(width-r)} C ${point(width-r+q,0)} ${point(width-r+2*q,0)} ${point(width-q,q)} C ${point(width,r-2*q)} ${point(width,r-q)} ${point(width,r)} V ${f(height-r)} C ${point(width,height-r+q)} ${point(width,height-r+2*q)} ${point(width-q,height-q)} C ${point(width-r+2*q,height)} ${point(width-r+q,height)} ${point(width-r,height)} H ${f(r)} C ${point(r-q,height)} ${point(r-2*q,height)} ${point(q,height-q)} C ${point(0,height-r+2*q)} ${point(0,height-r+q)} ${point(0,height-r)} V ${f(r)} C ${point(0,r-q)} ${point(0,r-2*q)} ${point(q,q)} C ${point(r-2*q,0)} ${point(r-q,0)} ${point(r,0)} Z`;
}
/** Shared fallback for browsers without native corner-shape; no library and
 * no per-component geometry. Only rounded application surfaces are observed. */
export function installContinuousCorners(forceFallback=false){
 if(!forceFallback&&CSS.supports('corner-shape','squircle'))return ()=>{};
 const selectors='*';
 const tracked=new Set<HTMLElement>(),last=new WeakMap<HTMLElement,string>(),frames=new WeakMap<HTMLElement,SVGSVGElement>();
 function update(el:HTMLElement){if(!el.isConnected||el.classList.contains('continuous-control'))return;const style=getComputedStyle(el),radius=parseFloat(style.borderTopLeftRadius),w=el.offsetWidth,h=el.offsetHeight;if(!radius||!w||!h||Math.abs(w-h)<1&&radius>=Math.min(w,h)/2)return;
  const border={width:parseFloat(style.borderTopWidth)||0},color=style.borderTopColor;
  const key=[w,h,radius,color,border.width].join(':');if(last.get(el)===key&&(!frames.has(el)||frames.get(el)?.isConnected))return;last.set(el,key);
  el.style.setProperty('--g2-border-color',color);
  const path=continuousCornerPath(w,h,radius),svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><path d="${path}" fill="white"/></svg>`;
  el.style.setProperty('--g2-mask',`url("data:image/svg+xml,${encodeURIComponent(svg)}")`);el.classList.add('g2-fallback');
  if(border.width&&!['INPUT','SELECT','TEXTAREA','IMG'].includes(el.tagName)){let frame=frames.get(el);if(!frame?.isConnected){frame=document.createElementNS('http://www.w3.org/2000/svg','svg');frame.setAttribute('aria-hidden','true');frame.classList.add('g2-border-frame');el.append(frame);frames.set(el,frame);}if(style.position==='static'){el.style.position='relative';el.dataset.g2Relative='true';}frame.style.cssText=`position:absolute;left:${-border.width}px;top:${-border.width}px;width:${w}px;height:${h}px;pointer-events:none;z-index:5`;frame.setAttribute('viewBox',`0 0 ${w} ${h}`);const inset=Math.max(1,border.width/2);frame.innerHTML=`<path transform="translate(${inset} ${inset})" d="${continuousCornerPath(w-2*inset,h-2*inset,Math.max(0,radius-inset))}" fill="none" stroke="${color}" stroke-width="${border.width}"/>`;}
 }
 const resize=new ResizeObserver(entries=>entries.forEach(entry=>update(entry.target as HTMLElement)));
 function scan(root:Element){const candidates=[root,...root.querySelectorAll(selectors)];for(const node of candidates){if(!(node instanceof HTMLElement)||node.classList.contains('continuous-control')||!parseFloat(getComputedStyle(node).borderTopLeftRadius))continue;if(!tracked.has(node)){tracked.add(node);resize.observe(node);}update(node);}}
 scan(document.body);
 const mutation=new MutationObserver(records=>{for(const record of records){for(const node of record.addedNodes)if(node instanceof Element)scan(node);if(record.type==='attributes'&&record.attributeName==='class'&&record.target instanceof HTMLElement)scan(record.target);}for(const el of tracked)if(!el.isConnected){resize.unobserve(el);tracked.delete(el);}});
 mutation.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','aria-pressed','data-state','disabled']});
 const refresh=(event:Event)=>{if(event.target instanceof HTMLElement)update(event.target.closest('button,input,select,textarea')??event.target);};
 for(const event of ['pointerover','pointerout','focusin','focusout'])document.addEventListener(event,refresh);
 return ()=>{mutation.disconnect();resize.disconnect();for(const event of ['pointerover','pointerout','focusin','focusout'])document.removeEventListener(event,refresh);for(const el of tracked){frames.get(el)?.remove();el.classList.remove('g2-fallback');el.style.removeProperty('--g2-mask');el.style.removeProperty('--g2-border-color');if(el.dataset.g2Relative){el.style.removeProperty('position');delete el.dataset.g2Relative;}}};
}

