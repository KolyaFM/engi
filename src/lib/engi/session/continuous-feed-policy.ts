import {FIRST_CHECK_BACKLOG_LIMIT} from '../study-core/acquisition';
export function shouldIntroduce(work:{firstChecks:number;firstCheckObjects:number;actionsSinceIntro:number;hasReady:boolean;onlyLastObject:boolean}){
 const capacity=work.firstChecks<FIRST_CHECK_BACKLOG_LIMIT||work.firstCheckObjects<3;
 return capacity&&(!work.hasReady||work.onlyLastObject||work.actionsSinceIntro>=3);
}
export function chooseWorkLane(due:boolean,first:boolean,dueStreak:number):'due'|'first'{return due&&(!first||dueStreak<2)?'due':'first';}
export function dueTurnsSinceFirstCheck(reasons:string[]){return reasons.slice(reasons.lastIndexOf('bootstrap')+1).filter(reason=>reason==='due'||reason==='confirmation').length;}
/** Stable tie breaking changes each selection and can be reproduced from a trace. */
export function selectionTie(seed:string){let h=2166136261;for(const c of seed)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
