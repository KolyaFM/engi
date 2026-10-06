import {createEmptyCard,type Card,Rating} from 'ts-fsrs';
import {scheduler,hydrate} from '../engine';
import type {Familiarity,Memory,Item} from '../types';
export const DAY=86400000;
export const BOOTSTRAP={red:{delay:3,days:[1,1,1]},orange:{delay:5,days:[2,3]},yellow:{delay:5,days:[3,7]},green:{delay:8,days:[7]}} as const;
export function triagedMemory(item:Item,color:Familiarity,sessionId:string,completed:number,now=new Date()):Memory{
 const card=createEmptyCard<Card>(now);card.due=new Date(now.getTime()+DAY);
 return {id:item.targetId,card,attempts:0,correct:0,confusions:{},status:color==='suspended'?'suspended':'triaged',initialFamiliarity:color,triagedAt:now.toISOString(),objectiveReviews:0,bootstrap:{successes:0,sessionId,probeAfterCards:completed+(color==='suspended'?0:BOOTSTRAP[color].delay)}};
}
export function reviewLearning(old:Memory,item:Item,correct:boolean,objective:boolean,repair:boolean,practice:boolean,latency:number,now=new Date()){
 const m=structuredClone(old),unscheduled=repair||practice;
 if(Number.isFinite(latency))m.latencyEmaMs=m.latencyEmaMs===undefined?latency:m.latencyEmaMs*.7+latency*.3;
 if(unscheduled)return {memory:m,fsrsUpdated:false};
 m.attempts++;m.correct+=Number(correct);m.objectiveReviews=(m.objectiveReviews??0)+Number(objective);m.lastReviewAt=now.toISOString();m.lastOutcome=correct;if(!correct)m.lastFailureAt=now.toISOString();
 m.firstSuccessAt??=correct?now.toISOString():undefined;
 if(m.status==='review'||!m.status){m.card=scheduler.next(hydrate(m),now,correct?Rating.Good:Rating.Again).card;m.status='review';return {memory:m,fsrsUpdated:true}}
 const plan=m.lastFailureAt?'red':m.initialFamiliarity==='suspended'?'red':m.initialFamiliarity??'red';
 const successes=correct&&objective?(m.bootstrap?.successes??0)+1:correct?(m.bootstrap?.successes??0):0;
 let fsrsUpdated=false;
 // Initial failed exposure is a probe, not a lapse of established memory.
 if(correct&&objective||m.card.reps>0){m.card=scheduler.next(hydrate(m),now,correct?Rating.Good:Rating.Again).card;fsrsUpdated=true}
 const intervals=BOOTSTRAP[plan].days,days=correct&&objective?intervals[Math.min(Math.max(0,successes-1),intervals.length-1)]:1;
 m.card.due=new Date(now.getTime()+days*DAY);m.card.scheduled_days=days;m.bootstrap={successes,probeAfterCards:0};m.status=correct&&objective&&successes>=intervals.length?'review':'learning';
 return {memory:m,fsrsUpdated};
}
export function unitDue(m:Memory,sessionId:string,completed:number,now=Date.now()){
 if(m.legacyOf||m.status==='suspended')return false;
 if(m.status==='triaged'&&m.bootstrap?.sessionId===sessionId&&completed>=m.bootstrap.probeAfterCards)return true;
 return new Date(m.card.due).getTime()<=now;
}
