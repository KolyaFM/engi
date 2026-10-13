import type {Bundle,Fact,Item} from '../types';
import {indexes} from '../indexes';
import {trusted} from '../knowledge/properties';
const normalize=(s:string)=>s.normalize('NFKC').trim().toLocaleLowerCase().replace(/\s+/g,' ');
/** Values describe the visible cue, so identically displayed answers are never distractors. */
export function valueCue(b:Bundle,f:Fact):Item['valueCue']{
 let text:string|undefined;
 if(f.valueKind==='entity')text=indexes(b).entityById.get(f.valueEntityId??'')?.name;
 else if(f.valueKind==='text')text=f.valueText?.trim();
 else if(f.valueKind==='number'&&Number.isFinite(f.valueNumber))text=String(f.valueNumber)+(f.unit?' '+f.unit:'');
 else if(f.valueKind==='date'&&f.dateStart&&!['range','circa'].includes(f.datePrecision??''))text=f.datePrecision==='day'?f.dateStart.split('-').reverse().join('.'):f.datePrecision==='month'?f.dateStart.slice(0,7).split('-').reverse().join('.'):f.dateStart.slice(0,4);
 if(!text||text.length>180)return;
 return {text,key:JSON.stringify([f.key,normalize(text)])};
}
const cache=new WeakMap<Bundle,Map<string,Set<string>>>();
const revisions=new WeakMap<Bundle,string>();
/** Check once at a generation/validation boundary, never for each distractor. */
export function refreshValueOwners(b:Bundle){const revision=JSON.stringify([b.facts,b.entities.map(e=>[e.id,e.name,e.archived])]);if(revisions.get(b)!==revision){cache.delete(b);revisions.set(b,revision);}}
export function valueOwners(b:Bundle,key:string):ReadonlySet<string>{
 let index=cache.get(b);if(!index){index=new Map();for(const f of b.facts)if(trusted(f)&&indexes(b).entityById.has(f.entityId)){const cue=valueCue(b,f);if(!cue)continue;const owners=index.get(cue.key)??new Set();owners.add(f.entityId);index.set(cue.key,owners);}cache.set(b,index);}
 return index.get(key)??new Set();
}
