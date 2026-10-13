import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import './entity-description.css';

type Description={name:string;summary?:string};
const Context=createContext({isOpen:false,open:(_value:Description,_opener:HTMLElement)=>{},close:()=>{}});
export const useEntityDescription=()=>useContext(Context);

// Pure presentation: no trainer, persistence, visibility episodes or hint callbacks.
export function EntityDescriptionProvider({children}:{children:ReactNode}){
 const [value,setValue]=useState<Description>();
 const opener=useRef<HTMLElement|null>(null),panel=useRef<HTMLElement|null>(null);
 const close=useCallback(()=>setValue(undefined),[]);
 const open=useCallback((next:Description,button:HTMLElement)=>{if(!next.summary?.trim())return;opener.current=button;setValue(next);},[]);
 useEffect(()=>{
  if(!value)return;
  const previous=document.body.style.overflow;document.body.style.overflow='hidden';
  panel.current?.querySelector<HTMLButtonElement>('button')?.focus();
  const key=(e:KeyboardEvent)=>{
   if(e.key==='Escape'){e.preventDefault();close();}
   if(e.key==='Tab'){e.preventDefault();panel.current?.querySelector<HTMLButtonElement>('button')?.focus();}
  };
  document.addEventListener('keydown',key);
  return()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',key);if(opener.current?.isConnected)opener.current.focus({preventScroll:true});};
 },[value,close]);
 return <Context.Provider value={{isOpen:!!value,open,close}}>{children}{value&&createPortal(
  <div className="entity-description-overlay" onClick={e=>{if(e.target===e.currentTarget)close();}}>
   <section ref={panel} className="entity-description-panel" role="dialog" aria-modal="true" aria-labelledby="entity-description-title" aria-describedby="entity-description-text">
    <div className="entity-description-heading"><h2 id="entity-description-title">{value.name}</h2><button type="button" aria-label="Закрыть описание" onClick={close}><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 7L17 17M17 7L7 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg></button></div>
    <p id="entity-description-text">{value.summary}</p>
   </section>
  </div>,document.body)}</Context.Provider>;
}

export function DescriptionButton({name,summary}:Description){
 const {open}=useEntityDescription();
 if(!summary?.trim())return null;
 return <button type="button" className="entity-description-button" aria-label={`Описание: ${name}`} onPointerDown={e=>e.stopPropagation()} onPointerUp={e=>e.stopPropagation()} onKeyDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();open({name,summary},e.currentTarget);}}><span aria-hidden="true">i</span></button>;
}
