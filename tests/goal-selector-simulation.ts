import {createEmptyCard,State} from 'ts-fsrs';
import {updateGoalMemories,type GoalMemory} from '../src/lib/engi/study-core/memory';
import {synchronizeDayPlan,applyDayAttempt,dayPlanSummary,type GoalDayPlan} from '../src/lib/engi/study-core/day-plan';
import {selectGoalCandidate,type SelectionCandidate,type GoalSelectorState,type SelectionHistory} from '../src/lib/engi/session/goal-selector';
import type {Attempt} from '../src/lib/engi/study-core/attempts';
import {DISCLOSURE_COOLDOWN_MS} from '../src/lib/engi/study-core/exposure';
import {selectGoalCandidate as baselineSelector} from './goal-selector-baseline';
import {selectGoalCandidate as experimentalSelector} from './goal-load-policies';
export type Scenario={size:number;profile:'steady'|'short'|'irregular'|'errors';seed?:number};
export function simulateSelector(scenario:Scenario,policy:'previous'|'fixed'|'current'|'guarded'|'variety'|'limited'|'priority'|'struggling'|'balanced'){
 const ids=Array.from({length:scenario.size},(_,i)=>'g'+i),start=new Date(2026,9,8,10),half=Math.floor(ids.length/2);
 let memories:GoalMemory[]=ids.slice(0,half).map((goalId,i)=>{const last=new Date(start.getTime()-86400000*(2+i%10));return {goalId,card:{...createEmptyCard(last),state:State.Review,due:last,last_review:last,stability:10,difficulty:5,reps:5},independentAttempts:5,independentSuccesses:5,lastCorrect:true};});
 let plan:GoalDayPlan|undefined,selector:GoalSelectorState|undefined,recent:SelectionHistory[]=[];
 const exposures=new Map<string,number>(),attemptCounts=new Map<string,number>();
 let answers=0,newAdmitted=0,repeatDone=0,reinforceDebt=0,objectRepeat=0,formatRepeat=0,pairs=0,idle=0,newMetDays=0,visitedDays=0,early=0,avoidableObject=0,avoidableFormat=0,heldSteps=0,maxFirstLearning=0;
 for(let day=0;day<12;day++){
  if(scenario.profile==='irregular'&&day%3!==0)continue;
  visitedDays++;let now=new Date(start.getTime()+day*86400000),steps=scenario.profile==='short'?12:scenario.profile==='irregular'?24:60;
  for(let step=0;step<steps;step++){
   plan=synchronizeDayPlan(plan,ids,memories,now);
   const known=new Map(memories.map(m=>[m.goalId,m])),pending=new Set([...plan.repeat,...plan.reinforce].filter(r=>r.status==='pending').map(r=>r.goalId));
   const newLeft=plan.newTarget-plan.newGoalIds.length,pool:SelectionCandidate[]=[];
   const learning=memories.filter(m=>m.card.state===State.Learning);
   const held=(['guarded','limited','balanced'].includes(policy)||policy==='struggling'&&learning.filter(m=>m.lastCorrect===false).length>=2)&&learning.length>=3;if(held&&newLeft>0)heldSteps++;
   for(let i=0;i<ids.length;i++){
    const id=ids[i],m=known.get(id);if(m&&!pending.has(id)||!m&&(newLeft<=0||held))continue;
    if(now.getTime()<Math.max(m?new Date(m.card.due).getTime():0,(exposures.get(id)??0)+DISCLOSURE_COOLDOWN_MS))continue;
    // Abstract format variants isolate the selector; this does not model the generator's graph coverage.
    for(const format of i%3===0?['choice']:['choice','categorize'])pool.push({key:id+format,goalIds:[id],objectIds:['o'+Math.floor(i/2)],format,kind:m?'due':'new',overdueMs:m?now.getTime()-new Date(m.card.due).getTime():0,mistake:m?.lastCorrect===false,reinforcement:!!m&&m.card.state!==State.Review});
   }
   if(!pool.length){idle++;now=new Date(now.getTime()+15000);continue;}
   let index:number;
   if(policy!=='previous'){const modern=['guarded','variety','limited','priority','struggling','balanced'].includes(policy),select=policy==='balanced'?selectGoalCandidate:modern?experimentalSelector:baselineSelector;const picked=select(pool,selector,plan.day,{newSlotsLeft:newLeft,maxDueBurst:policy==='fixed'?3:11,...(modern?{reinforcementWeight:['guarded','priority','balanced'].includes(policy)?3:0,keepHistoryAcrossDays:policy==='guarded',deferNew:policy==='guarded'}:{})});selector=picked.state;index=picked.index;}
   else{
    const rank=(c:SelectionCandidate)=>(c.kind==='due'?-10:0)-Math.min(c.overdueMs/86400000,20)+(recent.some(h=>h.objectIds.some(id=>c.objectIds.includes(id)))?5:0)+(recent.at(-1)?.format===c.format?2:0);
    index=pool.map((c,i)=>({i,score:rank(c)})).sort((a,b)=>a.score-b.score||a.i-b.i)[0].i;
   }
   const chosen=pool[index],id=chosen.goalIds[0],m=known.get(id);
   if(m&&new Date(m.card.due).getTime()>now.getTime()||now.getTime()<(exposures.get(id)??0)+DISCLOSURE_COOLDOWN_MS)early++;
   const last=recent.at(-1);if(last){pairs++;if(last.objectIds.some(o=>chosen.objectIds.includes(o))){objectRepeat++;if(pool.some(c=>c.kind===chosen.kind&&!c.objectIds.some(o=>last.objectIds.includes(o))))avoidableObject++;}if(last.format===chosen.format){formatRepeat++;if(pool.some(c=>c.kind===chosen.kind&&c.format!==last.format))avoidableFormat++;}}
   recent=[...recent,{objectIds:chosen.objectIds,format:chosen.format}].slice(-3);
   const count=(attemptCounts.get(id)??0)+1;attemptCounts.set(id,count);
   const number=Number(id.slice(1)),wrongRate=scenario.profile==='errors'?(number%5===0?85:40):20;
   const correct=(number*37+count*29+17+(scenario.seed??0)*13)%100>=wrongRate;
   const attempt:Attempt={id:policy+':'+answers,taskId:policy+':'+answers,phase:'submitted',startedAt:now.toISOString(),submittedAt:now.toISOString(),ineligibleGoalIds:[],results:[{goalId:id,correct,credit:true,selfReported:false}]};
   memories=updateGoalMemories(memories,attempt);
   // Counterfactual policies without the new admission guard retain the old unlimited first-learning rule.
   const commitPlan:GoalDayPlan=['balanced','limited','guarded'].includes(policy)?plan:{...plan,learningGoalIds:[]};
   plan=applyDayAttempt(commitPlan,attempt,memories);
   const load=memories.filter(m=>m.card.state===State.Learning).length;maxFirstLearning=Math.max(maxFirstLearning,load);
   if(['balanced','limited','guarded'].includes(policy)&&load>3)throw Error('Concurrent first-learning capacity exceeded');
   exposures.set(id,now.getTime());answers++;if(!m)newAdmitted++;
   if(plan.newGoalIds.length>3)throw Error('Simulation exceeded new budget');
   const summary=dayPlanSummary(plan,now.getTime());for(const b of [summary.repeat,summary.reinforce,summary.new])if(b.done+b.left!==b.total)throw Error('Unbalanced day plan');
   now=new Date(now.getTime()+15000);
  }
  const summary=dayPlanSummary(plan!,now.getTime());repeatDone+=summary.repeat.done;reinforceDebt+=summary.reinforce.left;if(summary.new.left===0)newMetDays++;
 }
 return {...scenario,policy,visitedDays,answers,newAdmitted,repeatDone,reinforceDebt,newMetDays,objectRepeat,formatRepeat,pairs,idle,early,avoidableObject,avoidableFormat,heldSteps,maxFirstLearning};
}
export const selectorScenarios:Scenario[]=[16,64,256].flatMap(size=>(['steady','short','irregular','errors'] as const).map(profile=>({size,profile})));

