import {test} from 'node:test';
import assert from 'node:assert/strict';
import {selectGoalCandidate,DUE_BURST,FAIR_WAIT,type SelectionCandidate,type GoalSelectorState} from '../src/lib/engi/session/goal-selector';
import {simulateSelector,selectorScenarios} from './goal-selector-simulation';
const day='2026-10-08';
function candidate(id:string,kind:SelectionCandidate['kind']='due',format='choice',object=id):SelectionCandidate{return {key:id+format,goalIds:[id],objectIds:[object],format,kind,overdueMs:0,mistake:false};}
test('empty selection does not invent a decision or age goals',()=>{
 const prior=selectGoalCandidate([candidate('a')],undefined,day).state;assert.deepEqual(selectGoalCandidate([],prior,day).state,prior);
});
test('when available, the next task changes both object and format',()=>{
 const first=selectGoalCandidate([candidate('a')],undefined,day);
 const pool=[candidate('b'),candidate('a','due','recall'),candidate('c','due','recall')];
 const next=selectGoalCandidate(pool,first.state,day);assert.equal(pool[next.index].goalIds[0],'c');
});
test('narrow pools fall back rather than blocking a sole goal or fixed format',()=>{
 let state=selectGoalCandidate([candidate('a')],undefined,day).state;
 let pool=[candidate('a'),candidate('b')],r=selectGoalCandidate(pool,state,day);assert.equal(pool[r.index].goalIds[0],'b');state=r.state;
 pool=[candidate('b')];r=selectGoalCandidate(pool,state,day);assert.equal(r.index,0);
});
test('new goals get an opportunity within four selections even under permanent due backlog',()=>{
 const pool=[candidate('d'),candidate('n','new')];let state:GoalSelectorState|undefined;
 const sequence:string[]=[];for(let i=0;i<40;i++){const r=selectGoalCandidate(pool,state,day);state=r.state;sequence.push(pool[r.index].kind);}
 assert.equal(sequence.join(','),Array.from({length:10},()=>['due','due','due','new']).flat().join(','));
 assert.equal(DUE_BURST,3);
});
test('heavy debt lengthens the burst but still offers new work within twelve eligible selections',()=>{
 const pool=[...Array.from({length:100},(_,i)=>candidate('d'+i)),candidate('n','new')];let state:GoalSelectorState|undefined,firstNew=-1;
 for(let i=0;i<12;i++){const r=selectGoalCandidate(pool,state,day,{newSlotsLeft:3});state=r.state;assert.equal(r.burst,11);if(pool[r.index].kind==='new'){firstNew=i;break;}}
 assert.equal(firstNew,11);
 // Formats must not inflate the number of due goals used to set this burst.
 const small=[candidate('d'),...Array.from({length:100},()=>({...candidate('d'),key:crypto.randomUUID()})),candidate('n','new')];
 assert.equal(selectGoalCandidate(small,undefined,day,{newSlotsLeft:3}).burst,3);
});
test('fair waiting overrides diversity and urgency for a continuously eligible goal',()=>{
 const state:GoalSelectorState={version:1,day,decisions:12,dueStreak:0,wait:{a:FAIR_WAIT,b:0},recent:[{objectIds:['a'],format:'choice'}]};
 const pool=[candidate('a'),{...candidate('b','due','recall'),overdueMs:864000000,mistake:true}];
 const r=selectGoalCandidate(pool,state,day);assert.equal(r.index,0);assert.equal(r.reason,'fairness');assert.equal(r.features!.wait,1);
});
test('bounded adversarial pools: every continuously eligible goal is selected despite permanent urgent competitors',()=>{
 for(let count=2;count<=40;count++){
  const pool=Array.from({length:count},(_,i)=>({...candidate('g'+i,'due',i%2?'recall':'choice','o'+(i%5)),overdueMs:i===0?864000000:0,mistake:i===0}));
  pool.push(candidate('new','new'));let state:GoalSelectorState|undefined;const last=Array(pool.length).fill(-1),maxGap=Array(pool.length).fill(0);
  const bound=12*(FAIR_WAIT+pool.length);
  for(let step=0;step<bound*2;step++){const r=selectGoalCandidate(pool,state,day);state=r.state;maxGap[r.index]=Math.max(maxGap[r.index],step-last[r.index]);last[r.index]=step;
   for(let i=0;i<last.length;i++)assert(step-last[i]<=bound,`pool=${count}, goal=${i}, step=${step}`);
  }
  assert(last.every(v=>v>=0));assert(maxGap.every(v=>v<=bound));
 }
});
test('presentation multiplicity never multiplies a goal waiting tick',()=>{
 const a=candidate('a'),b=candidate('b'),pool=[a,b,...Array.from({length:50},()=>({...b,key:crypto.randomUUID()}))];
 const r=selectGoalCandidate(pool,undefined,day);assert.equal(r.state.wait.a,0);assert.equal(r.state.wait.b,1);
 assert.equal(Object.keys(r.state.wait).length,2);
});
test('removed goals are pruned, reappearance starts at zero, and day rollover resets the selector',()=>{
 const one=selectGoalCandidate([candidate('a'),candidate('b')],undefined,day).state;
 const two=selectGoalCandidate([candidate('a')],one,day).state;assert(!('b' in two.wait));
 const reset=selectGoalCandidate([candidate('a')],two,'2026-10-09');assert.equal(reset.state.decisions,1);assert.equal(reset.state.dueStreak,1);
});
test('mistake priority wins on otherwise identical features, and practice has a separate fallback class',()=>{
 const pool=[candidate('a'),{...candidate('b'),mistake:true}],r=selectGoalCandidate(pool,undefined,day);assert.equal(r.index,1);
 assert.equal(selectGoalCandidate([candidate('p','practice')],r.state,day).index,0);
});
test('near-oldest waiting alternatives can change format, but substantially younger goals cannot displace the oldest',()=>{
 const state:GoalSelectorState={version:1,day,decisions:13,dueStreak:0,wait:{a:13,b:12},recent:[{objectIds:['a'],format:'choice'}]},pool=[candidate('a'),candidate('b','due','recall')];
 let r=selectGoalCandidate(pool,state,day);assert.equal(r.index,1);assert.equal(r.reason,'fairness');
 state.wait.a=16;r=selectGoalCandidate(pool,state,day);assert.equal(r.index,0);
});
test('day rollover preserves recent proposals for diversity while resetting daily counters and waiting ages',()=>{
 const previous=selectGoalCandidate([candidate('a')],undefined,day).state,pool=[candidate('a'),candidate('b','due','recall')];
 const r=selectGoalCandidate(pool,previous,'2026-10-09');assert.equal(r.index,1);assert.equal(r.state.decisions,1);assert.equal(r.state.wait.a,1);
});
test('ready reinforcement wins over review when their other features match',()=>{
 const pool=[candidate('old'),{...candidate('learn'),reinforcement:true}];assert.equal(selectGoalCandidate(pool,undefined,day).index,1);
});
test('48 multi-seed baseline / production simulations obey deadlines and concurrent first-learning capacity',()=>{
 for(const size of [64,256])for(const profile of ['steady','short','irregular','errors'] as const)for(const seed of [0,1,2]){
  const old=simulateSelector({size,profile,seed},'current'),next=simulateSelector({size,profile,seed},'balanced');
  assert.equal(old.early,0);assert.equal(next.early,0);assert(next.newAdmitted<=3*next.visitedDays);assert(next.maxFirstLearning<=3);assert(next.answers>0);
 }
});
test('36 FSRS simulations preserve eligibility and budgets across debt, short visits and repeated errors',()=>{
 for(const scenario of selectorScenarios){
  const old=simulateSelector(scenario,'previous'),fixed=simulateSelector(scenario,'fixed'),current=simulateSelector(scenario,'current');
  assert.equal(old.early,0);assert.equal(fixed.early,0);assert.equal(current.early,0);
  assert(current.newAdmitted<=3*current.visitedDays);assert(old.newAdmitted<=3*old.visitedDays);
  assert(current.answers>0);assert(current.newAdmitted>0);
 }
});

