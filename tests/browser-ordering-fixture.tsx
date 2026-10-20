import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {SortChallengeCard} from '../src/components/study/SortChallengeCard';
import {composeFeed} from '../src/lib/engi/session/composer';
import type {Bundle} from '../src/lib/engi/types';
import '../src/components/study/study-feed.css';
export function mountOrderingProbe(kind:'number'|'date'){
 const b:Bundle={entities:[0,1,2,3].map(n=>({id:'e'+n,name:'Объект '+n,type:'custom',aliases:[],externalIds:{}})),facts:[0,1,2,3].map(n=>({id:'f'+n,entityId:'e'+n,key:'p',valueKind:kind,...(kind==='number'?{valueNumber:n===0?22:n+25}:{dateStart:`2020-0${n+1}-01`,dateEnd:`2020-0${n+1}-01`,datePrecision:'day' as const}),verification:'verified',source:{name:'Test'}})),properties:[{id:'p',name:'Custom',valueKind:kind,cardinality:'many',learnable:true,learning:{forward:false,reverse:false,sort:'on'}}],media:[],tags:[],entityTags:[],missing:[],unresolved:[]};
 if(kind==='number')b.facts.push({...b.facts[0],id:'second',valueNumber:24});
 const task=composeFeed(b,[],'all','sort','practice')[0];task.items.sort((a,b)=>b.year!-a.year!);
 const expected=task.items.map(i=>i.ordering!.label),host=document.createElement('main');host.className='study-feed';document.body.replaceChildren(host);
 function Screen(){const [feedback,setFeedback]=useState<{score:number;chosen:string[]}>();return <SortChallengeCard task={task} busy={false} feedback={feedback} onPersist={()=>{}} onSubmit={chosen=>{if(JSON.stringify(chosen)!==JSON.stringify(task.items.map(i=>i.entityId)))throw Error('Unexpected order');setFeedback({score:1,chosen});}} onNext={()=>{}}/>;}
 createRoot(host).render(<Screen/>);return expected;
}
