import {test} from 'node:test';import assert from 'node:assert/strict';
import {rankRhythmCandidates,type RhythmCandidate,type RhythmTurn} from '../src/lib/engi/session/feed-rhythm-policy';
import type {FeedFamily} from '../src/services/feed-interactions';
const candidate=(family:FeedFamily,kind=family):RhythmCandidate=>({key:kind,interaction:{family,kind,direction:'forward',cue:'name',answer:'text'},knowledgeKeys:['g'],objectIds:['e'],need:1,knowledgeAge:5,variantPenalty:0});
function run(candidates:RhythmCandidate[],seed:string){const history:RhythmTurn[]=[];for(let n=0;n<300;n++){const chosen=rankRhythmCandidates(candidates,history,{seed:seed+n,format:'mixed'}).find(r=>!r.blocked)!;assert(chosen);const c=candidates.find(c=>c.key===chosen.key)!;history.push({...c,optional:true});}return history;}
test('weighted interactions do not amplify duplicated candidates and keep recall rare',()=>{
 const cs=[candidate('objective'),candidate('group'),candidate('relations'),candidate('recall'),candidate('self-check')];
 for(let seed=0;seed<100;seed++){const h=run(cs,String(seed));assert.deepEqual(h.map(t=>t.key),run([...cs,...Array.from({length:100},()=>cs[0])],String(seed)).map(t=>t.key));
 for(let n=0;n<h.length;n++){const recent=h.slice(Math.max(0,n-19),n+1);assert(recent.filter(t=>t.interaction.family==='recall').length<=2);if(h[n].interaction.family==='recall')assert(!h.slice(Math.max(0,n-9),n).some(t=>t.interaction.family==='recall'));}
 for(const c of cs){const positions=h.flatMap((t,n)=>t.key===c.key?[n]:[]);assert(positions.length>0,c.key);assert(positions.every((n,i)=>!i||n-positions[i-1]<=30),c.key);}}
});
test('mixed recall caps cannot be bypassed while explicit recall remains available',()=>{
 const c=candidate('recall'),history:RhythmTurn[]=[{...c,optional:true}];
 assert(rankRhythmCandidates([c],history,{seed:'s',format:'mixed'})[0].blocked);
 assert.equal(rankRhythmCandidates([c],history,{seed:'s',format:'mixed'})[0].blocked,'recall-knowledge');
 const reverse={...c,key:'other-image-and-direction',interaction:{...c.interaction,direction:'reverse' as const,cue:'image' as const}};
 assert.equal(rankRhythmCandidates([reverse],history,{seed:'s',format:'mixed'})[0].blocked,'recall-knowledge','another direction or image does not create new knowledge');
 assert(!rankRhythmCandidates([c],history,{seed:'s',format:'recall_reveal'})[0].blocked);
 assert.deepEqual(rankRhythmCandidates([],history,{seed:'s',format:'mixed'}),[]);
});
test('blocked recall is not an alternative that can suppress a playable objective format',()=>{
 const objective=candidate('objective'),recall=candidate('recall'),history:RhythmTurn[]=[{...recall,optional:true},...Array.from({length:10},()=>({...objective,optional:true}))];
 const ranked=rankRhythmCandidates([objective,recall],history,{seed:'s',format:'mixed'});
 assert.equal(ranked.find(r=>r.key===recall.key)?.blocked,'recall-knowledge');
 assert.equal(ranked.find(r=>r.key===objective.key)?.blocked,undefined);
});
