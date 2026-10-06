import type {Memory} from '../types';
import {retention} from '../engine';
export function difficultyStage(m?:Memory):1|2|3|4{
 if(!m||m.status==='triaged'||m.status==='learning'||m.lastOutcome===false)return 1;
 const r=retention(m),s=m.card.stability;
 if(s<7||r<.7)return 1;
 if(s<30||r<.85||Number(m.latencyEmaMs??0)>6000)return 2;
 return s>=90&&r>=.9&&Number(m.latencyEmaMs??0)<=4000?4:3;
}
export function currentMastery(m?:Memory){
 if(m?.status==='suspended')return {color:'suspended',label:'★ Не учу'};
 if(!m||!m.attempts)return {color:m?.initialFamiliarity??'red',label:'Нужна первая проверка'};
 if(m.lastOutcome===false||!m.firstSuccessAt)return {color:'red',label:'Нужно укрепить'};
 if(m.status==='learning'||m.card.stability<7)return {color:'orange',label:'Учусь'};
 if(m.card.stability<30||retention(m)<.85)return {color:'yellow',label:'Помню'};
 return {color:'green',label:m.card.stability>=180?'Закреплено':`Закреплено ${m.card.stability>=90?'90':m.card.stability>=30?'30':'7'}д+`};
}
