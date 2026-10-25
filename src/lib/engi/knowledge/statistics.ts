import type {LearningGoal} from '../study-core/goals';
import {dayBoundary} from '../study-core/day-plan';

/** A learned fact is one achievement even if its revision or testing direction changes. */
export const statisticsKey=(g:LearningGoal)=>JSON.stringify([g.knowledge.kind,g.knowledge.key,...(g.precision==='period-start-year'?[g.precision]:[])]);
export type StatisticsProperty={key:string;entityId:string;name:string;objectName:string;deckIds:string[];image?:string};
export type StatisticsInput={now:Date;properties:StatisticsProperty[];completions:{key:string;at?:string}[];learning:string[];known:string[];
 answers:{id:string;key:string;at:string;correct:boolean;scheduled:boolean}[];
 activity:{id:string;at:string;keys?:string[]}[];repairs:{id:string;key:string;at:string}[]};
export type StatisticsDay={day:string;mastered:number;gained:number;reviewed:number;checked:number;correct:number;repaired:number;tasks:number;gainedKeys:string[]};
export function buildStatistics(input:StatisticsInput,deckId?:string){
 const properties=new Map(input.properties.filter(p=>!deckId||p.deckIds.includes(deckId)).map(p=>[p.key,p]));
 const accepted=(key:string)=>properties.has(key),today=dayBoundary(input.now).day;
 const completed=new Map<string,string|undefined>();
 for(const row of input.completions){if(!accepted(row.key))continue;const at=row.at&&Number.isFinite(Date.parse(row.at))?row.at:undefined;
  if(!completed.has(row.key)||at&&(!completed.get(row.key)||Date.parse(at)<Date.parse(completed.get(row.key)!)))completed.set(row.key,at);
 }
 const dated=[...completed].flatMap(([key,at])=>at?[{key,day:dayBoundary(new Date(at)).day}]:[]);
 const answers=input.answers.filter(a=>accepted(a.key)&&a.scheduled&&Number.isFinite(Date.parse(a.at))&&new Date(a.at)<=input.now).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)||a.id.localeCompare(b.id));
 const activity=input.activity.filter(a=>!deckId||a.keys?.some(accepted)),repairs=input.repairs.filter(a=>accepted(a.key));
 const days=new Map<string,StatisticsDay>();
 const get=(at:string)=>{const day=dayBoundary(new Date(at)).day;if(day>today)return undefined;let row=days.get(day);if(!row){row={day,mastered:0,gained:0,reviewed:0,checked:0,correct:0,repaired:0,tasks:0,gainedKeys:[]};days.set(day,row);}return row;};
 for(const c of dated){const row=get(c.day+'T12:00:00');if(row){row.gained++;row.gainedKeys.push(c.key);}}
 const first=new Set<string>();for(const a of answers){const row=get(a.at);if(!row)continue;const key=JSON.stringify([row.day,a.key]);if(first.has(key))continue;first.add(key);row.reviewed++;row.checked++;row.correct+=Number(a.correct);}
 const screens=new Set<string>();for(const a of activity){if(screens.has(a.id)||!Number.isFinite(Date.parse(a.at)))continue;const row=get(a.at);if(row){screens.add(a.id);row.tasks++;}}
 const episodes=new Set<string>();for(const a of repairs){if(episodes.has(a.id)||!Number.isFinite(Date.parse(a.at)))continue;const row=get(a.at);if(row){episodes.add(a.id);row.repaired++;}}
 const start=new Date(input.now);start.setHours(12,0,0,0);start.setDate(start.getDate()-29);
 for(const day of days.keys())if(day<dayBoundary(start).day)start.setTime(new Date(day+'T12:00:00').getTime());
 const sequence:StatisticsDay[]=[];let cumulative=[...completed.values()].filter(at=>!at).length;
 for(const date=new Date(start);dayBoundary(date).day<=today;date.setDate(date.getDate()+1)){const row=get(date.toISOString())!;cumulative+=row.gained;row.mastered=cumulative;sequence.push(row);}
 const known=new Set(input.known.filter(accepted));
 const historyStart=[...days.values()].filter(d=>d.gained||d.tasks||d.checked||d.repaired).map(d=>d.day).sort()[0];
 return {historyStart,mastered:completed.size,total:properties.size,learning:new Set(input.learning.filter(k=>accepted(k)&&!completed.has(k)&&!known.has(k))).size,known:known.size,
  properties:[...properties.values()],days:sequence,today:sequence.at(-1)!,completedKeys:[...completed.keys()]};
}
