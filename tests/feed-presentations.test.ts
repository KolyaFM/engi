import {test} from 'node:test';import assert from 'node:assert/strict';
import {buildPresentationCandidates,rankPresentationCandidates,materializePresentationChoice,earliestDueCohort} from '../src/services/feed-presentations';
import type {GoalProposal} from '../src/services/goal-proposals';
import type {Task} from '../src/lib/engi/types';
const proposal=(id:string):GoalProposal=>({recipe:{id,format:'choice',cue:'name',answerKey:'p',memoryKey:'p',diagnostic:false},items:[],goals:[]});
test('candidate budgets allocate every interaction before filling any one kind',()=>{
 const ps=Array.from({length:1000},(_,n)=>proposal('r'+n));ps.push({...proposal('recall'),recipe:{...proposal('r').recipe,format:'recall_reveal'}});
 const cs=buildPresentationCandidates(ps,[]);assert(cs.length<=96);assert(cs.filter(c=>c.interaction.kind==='atomic-choice').length<=8);assert(cs.some(c=>c.interaction.family==='recall'));
 assert.deepEqual(rankPresentationCandidates(cs,[],{seed:'s',format:'mixed'}),rankPresentationCandidates(cs,[],{seed:'s',format:'mixed'}));
});
test('object rotation cannot turn optional recall into the only fallback while objective work is valid',()=>{
 const a=proposal('objective'),b={...proposal('recall'),recipe:{...proposal('recall').recipe,format:'recall_reveal' as const}};
 const candidates=buildPresentationCandidates([a,b],[]),history=[{...b,id:'r',reason:'game'},...Array.from({length:2},(_,n)=>({...a,id:'a'+n,reason:'game'}))] as Task[];
 const result=materializePresentationChoice(candidates,history,{seed:'s',format:'mixed',prefer:c=>c.interaction.family==='recall'},c=>({task:{...c.proposal!,options:c.proposal!.options??[],id:c.proposal!.recipe.id,reason:'game'},safe:true}));
 assert.equal(result.task?.id,'objective');
});
test('failed alternatives cannot block a playable repeated interaction forever',()=>{
 const a=proposal('objective'),b={...proposal('group'),items:[{} as never,{} as never,{} as never],recipe:{...proposal('group').recipe,format:'match' as const}};
 const candidates=buildPresentationCandidates([a,b],[]),history=Array.from({length:3},(_,n)=>({...a,id:'a'+n,reason:'game'})) as Task[];
 const result=materializePresentationChoice(candidates,history,{seed:'s',format:'mixed'},c=>c.interaction.family==='group'?undefined:{task:{...a,options:[],id:'valid',reason:'game'},safe:true});
 assert.equal(result.task?.id,'valid');assert(result.attempts<=8);
});
test('format weights cannot replace a much more overdue obligation',()=>{
 const rows=[{id:'old',at:1000},{id:'new',at:121000},{id:'same-minute',at:59000}];
 assert.deepEqual(earliestDueCohort(rows,r=>r.at).map(r=>r.id),['old','same-minute']);
});
test('format-run preference does not force repeating an object instead of fresh objective work',()=>{
 const a=proposal('fresh'),b={...proposal('group'),items:[{} as never,{} as never,{} as never],recipe:{...proposal('group').recipe,format:'match' as const}},history=Array.from({length:3},(_,n)=>({...a,id:'a'+n,reason:'game'})) as Task[];
 const result=materializePresentationChoice(buildPresentationCandidates([a,b],[]),history,{seed:'s',format:'mixed',prefer:c=>c.proposal?.recipe.id==='fresh'},c=>({task:{...c.proposal!,options:c.proposal!.options??[],id:c.proposal!.recipe.id,reason:'game'},safe:true}));assert.equal(result.task?.id,'fresh');assert(!result.ranking.find(r=>r.candidate.proposal?.recipe.id==='fresh')?.blocked,'trace must describe the actual admitted choice');
});
