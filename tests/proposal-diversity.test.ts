import {test} from 'node:test';
import assert from 'node:assert/strict';
import {presentationFamily,proposalDiversityPenalty} from '../src/services/proposal-diversity';
import {defineGoal} from '../src/lib/engi/study-core/goals';
import type {Recipe,Item,Task} from '../src/lib/engi/types';
import type {GoalProposal} from '../src/services/goal-proposals';

function proposal(format:Recipe['format'],count=1):GoalProposal{return {recipe:{format} as Recipe,items:Array.from({length:count},(_,n)=>({entityId:'e'+n}) as Item),goals:Array.from({length:count},(_,n)=>defineGoal({knowledge:{kind:'fact',key:'f'+n},skill:'recognition',direction:'forward',cueRole:'subject',precision:'value',revision:'1'})),...(count>1?{group:true}:{})};}
function past(p:GoalProposal):Task{return {...p,id:'previous',options:[],reason:'due',studyContract:{primaryGoals:p.goals}} as unknown as Task;}

test('atomic mapping aliases share choice history; real pairs and conveyor remain distinct',()=>{
 const choices=['choice','match','categorize'].map(format=>proposal(format as Recipe['format']));assert(choices.every(p=>presentationFamily(p)==='choice'));
 for(const p of choices)assert.equal(proposalDiversityPenalty(p,[past(choices[0])]),15);
 assert.equal(presentationFamily(proposal('match',3)),'match');assert.equal(presentationFamily({...proposal('categorize',3),presentation:'conveyor'}),'conveyor');
 const image={...choices[0],recipe:{...choices[0].recipe,answerPresentation:'image' as const}};assert.equal(presentationFamily(image),'image-choice');
 assert(proposalDiversityPenalty(proposal('match',3),[past(choices[0])])<proposalDiversityPenalty(choices[0],[past(choices[0])]));
});

test('adding members does not multiply directional repetition; repeated group interaction is still penalized',()=>{
 const group=proposal('match',3),single=proposal('choice'),history=[past({...group,recipe:{format:'sort'} as Recipe})];
 // Subtract the existing -2 group preference to compare the directional component.
 assert.equal(proposalDiversityPenalty(group,history)+2,proposalDiversityPenalty(single,history));
 assert(proposalDiversityPenalty(group,[past(group)])>proposalDiversityPenalty(group,history));
 const reverse={...group,goals:group.goals.map(g=>({...g,direction:'reverse' as const}))};assert.equal(proposalDiversityPenalty(group,history)-proposalDiversityPenalty(reverse,history),4);
});
