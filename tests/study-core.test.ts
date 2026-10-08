import 'fake-indexeddb/auto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { State } from 'ts-fsrs';
import { defineGoal, type LearningGoal } from '../src/lib/engi/study-core/goals';
import { gradeResponse, validateContract, type TaskContract } from '../src/lib/engi/study-core/contracts';
import { startAttempt, revealHint, submitAttempt } from '../src/lib/engi/study-core/attempts';
import { updateGoalMemories } from '../src/lib/engi/study-core/memory';
import { EngiDB } from '../src/db/engi-db';
import { createStudyCoreService } from '../src/services/study-core-service';
const now = new Date('2026-10-08T02:00:00Z');
const goal = (key = 'author', kind: LearningGoal['knowledge']['kind'] = 'fact') => defineGoal({
  knowledge: { kind, key }, skill: 'recognition', direction: 'forward', cueRole: 'subject', precision: 'value', revision: 'v1'
});
function contract(goals = [goal()]): TaskContract {
  return { id: 'task-1', primaryGoals: goals, supportGoalIds: [], actionFamily: 'select', visibleEntities: ['painting', 'a', 'b'],
    shownClaims: [], hintClaims: [], feedbackClaims: [], contentRevisions: Object.fromEntries(goals.map(g => [g.semanticKey, g.revision])),
    response: { kind: 'choice', goalId: goals[0].id, options: ['a','b'], expected: 'a' }, practice: false };
}
function mapping() {
  const goals = [goal('a'), goal('b'), goal('c')], c = contract(goals);
  c.actionFamily = 'match'; c.response = { kind: 'mapping', options: ['A','B','C'], bijective: true,
    bindings: goals.map((g, i) => ({ responseKey: String(i), goalId: g.id, expected: ['A','B','C'][i] })) };
  return c;
}
async function database(run: (service: ReturnType<typeof createStudyCoreService>, db: EngiDB) => Promise<void>) {
  const db = new EngiDB('study-core-' + crypto.randomUUID());
  try { await run(createStudyCoreService(db), db); } finally { db.close(); await db.delete(); }
}
test('goal identity excludes UI, media and deck, separates skill, direction, cue, precision and revision', () => {
  const g = goal(); assert.equal(goal().id, g.id);
  for (const change of [{ skill: 'recall' as const }, { direction: 'reverse' as const }, { cueRole: 'image' }, { precision: 'year' }, { revision: 'v2' }]) {
    assert.notEqual(defineGoal({ ...g, ...change }).id, g.id);
  }
  assert.equal(defineGoal({ ...g, revision: 'v2' }).semanticKey, g.semanticKey);
  assert.notEqual(goal('x:y').id, goal('x').id);
});
test('choice distractor names are not disclosures; explicit caption only blocks the disclosed goal', () => {
  const c = contract(); assert.equal(startAttempt(c, 'attempt', now).ineligibleGoalIds.length, 0);
  c.shownClaims = [{ key: 'name-caption', revision: 'v1', revealsGoalIds: ['name-goal'] }];
  const a = submitAttempt(startAttempt(c, 'attempt', now), c, 'a', now, c.contentRevisions);
  assert.equal(a.results![0].credit, true); assert.deepEqual(a.ineligibleGoalIds, ['name-goal']);
});
test('first submission is immutable and correction does not change its Again', () => {
  const c = contract(), a = submitAttempt(startAttempt(c, 'a', now), c, 'b', now, c.contentRevisions);
  assert.deepEqual(submitAttempt(a, c, 'a', now, c.contentRevisions), a);
  assert.equal(a.results![0].correct, false);
});
test('matching grades participants separately and rejects incomplete or duplicate placement', () => {
  const c = mapping(); assert.deepEqual(gradeResponse(c, {0:'A',1:'C',2:'B'}).map(r => r.correct), [true,false,false]);
  assert.throws(() => gradeResponse(c, {0:'A',1:'B'}));
  assert.throws(() => gradeResponse(c, {0:'A',1:'B',2:'B'}));
  assert.throws(() => gradeResponse(c, {0:'A',1:'B',2:'C',3:'D'}));
});
test('matching hint blocks the inferable group permanently and automatic last pair receives no credit', () => {
  const c = mapping(); c.hintClaims = [{key:'pair',revision:'v1',revealsGoalIds:[c.primaryGoals[0].id]}];
  const hinted = revealHint(startAttempt(c,'a',now),c,'pair');
  const later = new Date(now.getTime()+600000);
  assert(submitAttempt(hinted,c,{0:'A',1:'B',2:'C'},later,c.contentRevisions).results!.every(r => !r.credit));
  const ordinary = submitAttempt(startAttempt(c,'b',now),c,{0:'A',1:'B',2:'C'},now,c.contentRevisions,[c.primaryGoals[2].id]);
  assert.deepEqual(ordinary.results!.map(r=>r.credit),[true,true,false]);
});
test('categorization permits shared categories; a hint only blocks its affected target', () => {
  const c = mapping(); c.actionFamily='categorize'; c.response={...c.response as Extract<TaskContract['response'],{kind:'mapping'}>,bijective:false};
  c.hintClaims=[{key:'one',revision:'v1',revealsGoalIds:[c.primaryGoals[0].id]}];
  const a=submitAttempt(revealHint(startAttempt(c,'a',now),c,'one'),c,{0:'A',1:'A',2:'C'},now,c.contentRevisions);
  assert.deepEqual(a.results!.map(r=>r.credit),[false,true,true]);
});
test('full set is one aggregate result, never a collection of per-value successes', () => {
  const g=goal('painting:authors','complete-set'),c=contract([g]);c.actionFamily='select-set';
  c.response={kind:'set',goalId:g.id,options:['a','b','c'],expected:['a','b'],complete:true};
  assert.deepEqual(gradeResponse(c,['a']).map(r=>r.correct),[false]);
  assert.deepEqual(gradeResponse(c,['b','a']).map(r=>r.correct),[true]);
  assert.equal(gradeResponse(c,['a','b','c'])[0].correct,false);
  assert.throws(()=>gradeResponse(c,['a','a']));
  assert.throws(()=>validateContract({...c,response:{...c.response,complete:false} as any}));
});
test('sorting grades only declared pair relations and never exact dates or transitive pairs', () => {
  const g=goal('A-before-B','order-relation'),c=contract([g]);c.actionFamily='order';
  c.response={kind:'order',entities:['A','B','C'],expected:['A','B','C'],relations:[{goalId:g.id,before:'A',after:'B'}]};
  const result=gradeResponse(c,['C','A','B']);assert.equal(result.length,1);assert.equal(result[0].correct,true);
  assert.throws(()=>validateContract({...c,primaryGoals:[goal('date')]}));
  c.primaryGoals=[];c.contentRevisions={};c.response.relations=[];c.practice=true;
  assert.deepEqual(gradeResponse(c,['C','B','A']),[]);
});
test('exact-year scale accepts only exact answer; approximate practice has no credit', () => {
  const c=contract();c.actionFamily='place-date';c.response={kind:'number',goalId:c.primaryGoals[0].id,expected:1800,tolerance:0,min:1700,max:1900};
  assert.equal(gradeResponse(c,1801)[0].correct,false);
  c.response.tolerance=15;assert.throws(()=>validateContract(c));c.practice=true;
  assert.equal(submitAttempt(startAttempt(c,'a',now),c,1801,now,c.contentRevisions).results![0].credit,false);
});
test('stale supporting content invalidates the attempt without grading user failure', () => {
  const c=contract();c.contentRevisions['caption']='v1';const a=startAttempt(c,'a',now);
  const submitted=submitAttempt(a,c,'b',now,{...c.contentRevisions,caption:'v2'});
  assert.equal(submitted.phase,'stale');assert.deepEqual(submitted.results,[]);assert.deepEqual(updateGoalMemories([],submitted),[]);
});
test('support goals cannot be credited, primary goals cannot have multiple outcomes', () => {
  const c=contract();c.supportGoalIds=[c.primaryGoals[0].id];assert.throws(()=>validateContract(c));
  const m=mapping();(m.response as Extract<TaskContract['response'],{kind:'mapping'}>).bindings[1].goalId=m.primaryGoals[0].id;
  assert.throws(()=>validateContract(m));
});
test('self report stays labeled and belongs to a separate recall goal', () => {
  const g=defineGoal({...goal(),skill:'recall'}),c=contract([g]);c.actionFamily='recall';c.response={kind:'self-report',goalId:g.id};
  assert.equal(gradeResponse(c,true)[0].selfReported,true);assert.throws(()=>gradeResponse(c,'yes'));
});
test('FSRS runs real short steps: new Again is not a mature lapse; Good is not instant graduation', () => {
  const c=contract();const failed=submitAttempt(startAttempt(c,'f',now),c,'b',now,c.contentRevisions);
  const failure=updateGoalMemories([],failed)[0];assert.equal(failure.card.state,State.Learning);assert.equal(failure.card.lapses,0);assert.equal(failure.card.reps,1);
  const good=submitAttempt(startAttempt(c,'g',now),c,'a',now,c.contentRevisions),first=updateGoalMemories([],good)[0];
  assert.equal(first.card.state,State.Learning);assert.equal(first.card.due.getTime()-now.getTime(),600000);
  const later=first.card.due,second=submitAttempt(startAttempt(c,'g2',later),c,'a',later,c.contentRevisions);
  assert.equal(updateGoalMemories([first],second)[0].card.state,State.Review);
});
test('practice, hints and auto-correction leave FSRS untouched', () => {
  const c=contract();c.practice=true;const a=submitAttempt(startAttempt(c,'a',now),c,'a',now,c.contentRevisions);
  assert.deepEqual(updateGoalMemories([],a),[]);
});
test('transaction serializes concurrent answers and restored service cannot double-commit', () => database(async(s,db)=>{
  const c=contract();await s.setContentRevisions(c.contentRevisions);await s.open(c,'a',now);
  const [a,b]=await Promise.all([s.submit('a','b',now),s.submit('a','a',now)]);assert.deepEqual(a,b);
  assert.equal((await s.memory(c.primaryGoals[0].id))!.independentAttempts,1);
  const resumed=createStudyCoreService(db);assert.deepEqual(await resumed.submit('a','a',now),a);
  assert.equal((await resumed.memory(c.primaryGoals[0].id))!.independentAttempts,1);
}));
test('failed persistence rolls back all participants and attempt, allowing one safe retry', () => database(async(s,db)=>{
  const c=mapping();await s.setContentRevisions(c.contentRevisions);await s.open(c,'a',now);
  const fail=(primaryKey: unknown)=>{if(typeof primaryKey==='string'&&primaryKey.startsWith('studyCore:memory:'))throw Error('disk-failure');};
  db.appMeta.hook('creating',fail);await assert.rejects(s.submit('a',{0:'A',1:'B',2:'C'},now));db.appMeta.hook('creating').unsubscribe(fail);
  for(const g of c.primaryGoals)assert.equal(await s.memory(g.id),undefined);
  const retry=await s.submit('a',{0:'A',1:'B',2:'C'},now);assert.equal(retry.phase,'submitted');
  for(const g of c.primaryGoals)assert.equal((await s.memory(g.id))!.independentAttempts,1);
}));
test('content changes between open and submit are saved as stale, never Again', () => database(async(s)=>{
  const c=contract();await s.setContentRevisions(c.contentRevisions);await s.open(c,'a',now);
  await s.setContentRevisions({[c.primaryGoals[0].semanticKey]:'v2'});
  assert.equal((await s.submit('a','b',now)).phase,'stale');assert.equal(await s.memory(c.primaryGoals[0].id),undefined);
}));
test('skip and invalid response do not update memory; reusing task IDs with another answer fails', () => database(async(s)=>{
  const c=contract();await s.setContentRevisions(c.contentRevisions);await s.open(c,'a',now);
  await assert.rejects(s.submit('a','unknown',now));await s.skip('a');
  assert.equal((await s.submit('a','a',now)).phase,'skipped');assert.equal(await s.memory(c.primaryGoals[0].id),undefined);
  await assert.rejects(s.open({...c,response:{...c.response,expected:'b'} as any},'b',now));
}));

test('all matching permutations for groups 2–6 give one result per explicitly tested link', () => {
  let cases=0;
  function permutations<T>(values:T[]):T[][] {return values.length?values.flatMap((v,i)=>permutations(values.filter((_,j)=>i!==j)).map(t=>[v,...t])):[[]];}
  for(let n=2;n<=6;n++){
    const goals=Array.from({length:n},(_,i)=>goal('link-'+i)),options=goals.map((_,i)=>String(i)),c=contract(goals);
    c.actionFamily='match';c.response={kind:'mapping',options,bijective:true,bindings:goals.map((g,i)=>({goalId:g.id,responseKey:String(i),expected:String(i)}))};
    let correctSum=0;const all=permutations(options);
    for(const p of all){const results=gradeResponse(c,Object.fromEntries(p.map((v,i)=>[String(i),v])));assert.equal(results.length,n);
      assert.deepEqual(results.map(r=>r.correct),p.map((v,i)=>v===String(i)));correctSum+=results.filter(r=>r.correct).length;cases++;}
    assert.equal(correctSum,all.length); // Expected fixed points of a uniform permutation = 1.
  }
  assert.equal(cases,872);
});
test('shown matching assignments block inferable answers, not just the visibly given pair',()=>{
  const c=mapping();c.shownClaims=[{key:'given-pair',revision:'v1',revealsGoalIds:[c.primaryGoals[0].id]}];
  assert.equal(startAttempt(c,'a',now).ineligibleGoalIds.length,3);
});
test('an options task cannot claim unaided recall and forged goal IDs are rejected',()=>{
  const g=defineGoal({...goal(),skill:'recall'});assert.throws(()=>validateContract(contract([g])));
  const c=contract();c.primaryGoals[0]={...c.primaryGoals[0],id:'forged'};assert.throws(()=>validateContract(c));
});
test('task instances cannot be reopened under another attempt ID',()=>database(async s=>{
  const c=contract();await s.setContentRevisions(c.contentRevisions);await s.open(c,'a',now);
  await s.submit('a','b',now);await assert.rejects(s.open(c,'another-attempt',now));
}));
test('a fresh task shares goal memory but early repetition does not increment FSRS',()=>database(async s=>{
  const c=contract();await s.setContentRevisions(c.contentRevisions);await s.open(c,'a',now);await s.submit('a','a',now);
  const early={...c,id:'early-task'};await s.open(early,'early',now);await s.submit('early','a',now);
  assert.equal((await s.memory(c.primaryGoals[0].id))!.independentAttempts,1);
  const later=(await s.memory(c.primaryGoals[0].id))!.card.due,newTask={...c,id:'later-task'};
  await s.open(newTask,'later',new Date(later));await s.submit('later','a',new Date(later));
  assert.equal((await s.memory(c.primaryGoals[0].id))!.independentAttempts,2);
}));
test('recognition and recall do not overwrite each other and recall preserves self-report marker',()=>database(async s=>{
  const c=contract(),recall=defineGoal({...c.primaryGoals[0],skill:'recall'}),r=contract([recall]);
  r.id='recall-task';r.actionFamily='recall';r.response={kind:'self-report',goalId:recall.id};
  await s.setContentRevisions({...c.contentRevisions,...r.contentRevisions});await s.open(c,'a',now);await s.submit('a','a',now);
  await s.open(r,'r',now);const a=await s.submit('r',false,now);assert.equal(a.results![0].selfReported,true);
  assert.equal((await s.memory(c.primaryGoals[0].id))!.independentSuccesses,1);
  assert.equal((await s.memory(recall.id))!.independentSuccesses,0);
}));
test('FSRS review failure enters relearning; successful delayed repair graduates again',()=>{
  const c=contract();let memory=updateGoalMemories([],submitAttempt(startAttempt(c,'a',now),c,'a',now,c.contentRevisions))[0];
  let when=memory.card.due;memory=updateGoalMemories([memory],submitAttempt(startAttempt(c,'b',when),c,'a',when,c.contentRevisions))[0];
  assert.equal(memory.card.state,State.Review);when=memory.card.due;
  memory=updateGoalMemories([memory],submitAttempt(startAttempt(c,'c',when),c,'b',when,c.contentRevisions))[0];
  assert.equal(memory.card.state,State.Relearning);assert.equal(memory.card.lapses,1);assert.equal(memory.card.due.getTime()-when.getTime(),600000);
  when=memory.card.due;memory=updateGoalMemories([memory],submitAttempt(startAttempt(c,'d',when),c,'a',when,c.contentRevisions))[0];
  assert.equal(memory.card.state,State.Review);assert.equal(memory.card.lapses,1);
});
test('resetting learning removes new core attempts and memories while retaining unrelated settings',()=>database(async(s,db)=>{
  const {resetLearningProgress}=await import('../src/services/learning-service');
  const c=contract();await s.setContentRevisions(c.contentRevisions);await s.open(c,'a',now);await s.submit('a','a',now);
  await db.appMeta.put({key:'studyPreferences',value:{sound:true}});await resetLearningProgress(db);
  assert.equal(await s.memory(c.primaryGoals[0].id),undefined);
  assert.equal(await db.appMeta.where('key').startsWith('studyCore:').count(),0);
  assert.deepEqual((await db.appMeta.get('studyPreferences'))!.value,{sound:true});
}));
test('concurrent different screens for the same goal cannot perform two early FSRS updates',()=>database(async s=>{
  const c=contract(),other={...c,id:'second-screen'};await s.setContentRevisions(c.contentRevisions);
  await s.open(c,'a',now);await s.open(other,'b',now);
  const [a,b]=await Promise.all([s.submit('a','a',now),s.submit('b','a',now)]);
  assert.equal(Number(a.results![0].credit)+Number(b.results![0].credit),1);
  assert.equal((await s.memory(c.primaryGoals[0].id))!.independentAttempts,1);
}));
test('backup restores new core memory and immutable attempts without duplicate reviews',()=>database(async(s,db)=>{
  const {exportBackup,restoreBackup}=await import('../src/services/backup-service');
  const c=contract();await s.setContentRevisions(c.contentRevisions);await s.open(c,'a',now);await s.submit('a','a',now);
  const backup=JSON.parse(JSON.stringify(await exportBackup(db)));
  const target=new EngiDB('study-core-restored-'+crypto.randomUUID());
  try{
    await restoreBackup(backup,target);const restored=createStudyCoreService(target);
    assert.equal((await restored.memory(c.primaryGoals[0].id))!.independentAttempts,1);
    await restored.submit('a','b',now);assert.equal((await restored.memory(c.primaryGoals[0].id))!.independentAttempts,1);
    const later=new Date((await restored.memory(c.primaryGoals[0].id))!.card.due),second={...c,id:'after-restore'};
    await restored.open(second,'later',later);await restored.submit('later','a',later);
    assert.equal((await restored.memory(c.primaryGoals[0].id))!.card.state,State.Review);
  }finally{target.close();await target.delete();}
}));
