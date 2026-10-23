import {test} from 'node:test';import assert from 'node:assert/strict';
import {rankRhythmCandidates,type RhythmCandidate,type RhythmTurn} from '../src/lib/engi/session/feed-rhythm-policy';
import type {FeedFamily} from '../src/services/feed-interactions';
const candidate=(family:FeedFamily,kind=family):RhythmCandidate=>({key:kind,interaction:{family,kind,direction:'forward',cue:'name',answer:'text'},knowledgeKeys:['g'],objectIds:['e'],need:1,knowledgeAge:5,variantPenalty:0});
function run(candidates:RhythmCandidate[],seed:string){const history:RhythmTurn[]=[];for(let n=0;n<300;n++){const chosen=rankRhythmCandidates(candidates,history,{seed:seed+n,format:'mixed',allowRecallFallback:false}).find(r=>!r.blocked)!;assert(chosen);const c=candidates.find(c=>c.key===chosen.key)!;history.push({...c,optional:true});}return history;}
test('weighted interactions do not amplify duplicated candidates and keep recall rare',()=>{
 const cs=[candidate('objective'),candidate('group'),candidate('relations'),candidate('recall'),candidate('self-check')];
 for(let seed=0;seed<100;seed++){const h=run(cs,String(seed));assert.deepEqual(h.map(t=>t.key),run([...cs,...Array.from({length:100},()=>cs[0])],String(seed)).map(t=>t.key));
 for(let n=0;n<h.length;n++){const recent=h.slice(Math.max(0,n-19),n+1);assert(recent.filter(t=>t.interaction.family==='recall').length<=4);if(h[n].interaction.family==='recall')assert(!h.slice(Math.max(0,n-4),n).some(t=>t.interaction.family==='recall'));}
 for(const c of cs){const positions=h.flatMap((t,n)=>t.key===c.key?[n]:[]);assert(positions.length>0,c.key);assert(positions.every((n,i)=>!i||n-positions[i-1]<=30),c.key);}}
});
test('sparse explicit recall and named fallback remain playable without random or time',()=>{
 const c=candidate('recall'),history:RhythmTurn[]=[{...c,optional:true}];
 assert(rankRhythmCandidates([c],history,{seed:'s',format:'mixed',allowRecallFallback:false})[0].blocked);
 assert(!rankRhythmCandidates([c],history,{seed:'s',format:'mixed',allowRecallFallback:true})[0].blocked);
 assert(!rankRhythmCandidates([c],history,{seed:'s',format:'recall_reveal',allowRecallFallback:false})[0].blocked);
 assert.deepEqual(rankRhythmCandidates([],history,{seed:'s',format:'mixed',allowRecallFallback:false}),[]);
});
