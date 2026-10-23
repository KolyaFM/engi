import type {FeedInteraction,FeedFamily} from '../../../services/feed-interactions';
import {selectionTie} from './continuous-feed-policy';
export type RhythmCandidate={key:string;interaction:FeedInteraction;knowledgeKeys:readonly string[];objectIds:readonly string[];need:number;knowledgeAge:number;variantPenalty:number};
export type RhythmTurn={key:string;interaction:FeedInteraction;knowledgeKeys:readonly string[];objectIds:readonly string[];optional:boolean};
const weights:Record<FeedFamily,number>={objective:45,group:25,relations:15,recall:10,'self-check':5};
export function rankRhythmCandidates(candidates:readonly RhythmCandidate[],history:readonly RhythmTurn[],options:{seed:string;format:string;allowRecallFallback:boolean}){
 const unique=[...new Map(candidates.map(c=>[c.key,c])).values()],recent=history.slice(-20),families=new Set(unique.map(c=>c.interaction.family));
 const mixed=!options.format||options.format==='mixed',gap=history.slice(-4).some(t=>t.interaction.family==='recall'),full=recent.filter(t=>t.interaction.family==='recall').length>=4;
 const recallBlocked=mixed&&!options.allowRecallFallback&&(gap||full);
 const available=new Set([...families].filter(f=>f!=='recall'||!recallBlocked)),total=[...available].reduce((sum,f)=>sum+weights[f],0)||1;
 const relevant=recent.filter(t=>available.has(t.interaction.family));
 const counts=new Map([...available].map(f=>[f,relevant.filter(t=>t.interaction.family===f).length]));
 return unique.map(c=>{
  const f=c.interaction.family,kind=c.interaction.kind,last=history.at(-1),same=last?.interaction.kind===kind;
  let blocked:'recall-gap'|'recall-window'|'format-run'|undefined;
  if(f==='recall'&&recallBlocked)blocked=gap?'recall-gap':'recall-window';
  else if(history.length>=3&&history.slice(-3).every(t=>t.interaction.kind===kind)&&unique.some(a=>a.interaction.kind!==kind&&(a.interaction.family!=='recall'||!recallBlocked)))blocked='format-run';
  const deficit=Math.max(-2,Math.min(2,(relevant.length+1)*weights[f]/total-(counts.get(f)??0)));
  const lastKind=history.map(t=>t.interaction.kind).lastIndexOf(kind),kindAge=Math.min(30,history.length-lastKind);
  const components={deficit:deficit*20,need:Math.max(0,Math.min(1,c.need))*8,age:Math.max(0,Math.min(30,c.knowledgeAge))/30*4,variant:-Math.max(0,Math.min(1,c.variantPenalty))*3,repeat:same?-8:0,kindAge:kindAge/30*2};
  return {key:c.key,score:Object.values(components).reduce((a,b)=>a+b,0),blocked,components};
 }).sort((a,b)=>Number(!!a.blocked)-Number(!!b.blocked)||b.score-a.score||selectionTie(options.seed+a.key)-selectionTie(options.seed+b.key));
}
