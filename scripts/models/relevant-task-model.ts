/** Experimental task composition. Not used by the application or FSRS. */
export type Knowledge={id:string;object:string;property:string;kind:'category'|'date';value:string|number;need:'error'|'due'|'learning'|'known';availableAt:number;introduced:boolean;excluded:boolean;goal:'association'|'relative-order'|'exact-year';reviewCount?:number};
export type Format='single'|'conveyor'|'match'|'order'|'date-conveyor';
export type History={format:Format;objects:string[];need?:Knowledge['need']};
type Member=Knowledge&{role:'target'|'support'};
export type ModelTask={format:Format;anchor:string;members:Member[];categories?:string[];threshold?:number;why:string[]};
const tier=(k:Knowledge)=>({error:0,due:1,learning:2,known:3}[k.need]);
const safe=(k:Knowledge,now:number)=>k.introduced&&!k.excluded&&k.availableAt<=now;
function distinct(items:Knowledge[],anchor:Knowledge,limit:number,uniqueValues=false){const out=[anchor],objects=new Set([anchor.object]),values=new Set([anchor.value]);for(const item of items){if(out.length>=limit)break;if(objects.has(item.object)||uniqueValues&&values.has(item.value))continue;out.push(item);objects.add(item.object);values.add(item.value);}return out;}
export function selectRelevantTask(items:Knowledge[],now:number,history:History[]=[],seed=0):ModelTask|undefined{
 if(new Set(items.map(i=>i.id)).size!==items.length)throw Error('Duplicate knowledge');
 const recent=history.slice(-3),last=new Set(history.at(-1)?.objects??[]);
 const repairBurst=history.length>=2&&history.slice(-2).every(h=>h.need==='error');
 const rank=(k:Knowledge)=>(repairBurst&&k.need==='error'?3:tier(k))*100+Number(last.has(k.object))*20+recent.filter(h=>h.objects.includes(k.object)).length*3;
 const targets=items.filter(k=>safe(k,now)&&k.need!=='known').sort((a,b)=>rank(a)-rank(b)||a.availableAt-b.availableAt||a.id.localeCompare(b.id));
 const anchor=targets[0];if(!anchor)return;
 const needed=targets.filter(k=>k.property===anchor.property&&k.kind===anchor.kind);
 const supports=items.filter(k=>safe(k,now)&&k.need==='known'&&k.property===anchor.property&&k.kind===anchor.kind).sort((a,b)=>Number(last.has(a.object))-Number(last.has(b.object))||a.id.localeCompare(b.id));
 const pack=(format:Format,selected:Knowledge[],support:Knowledge[]=[],extra:Partial<ModelTask>={}):ModelTask=>({format,anchor:anchor.id,members:[...selected.map(k=>({...k,role:'target' as const})),...support.map(k=>({...k,role:'support' as const}))],why:[`anchor:${anchor.need}`,`targets:${selected.length}`,`supports:${support.length}`],...extra});
 const candidates=[pack('single',[anchor])];
 if(anchor.kind==='category'){
  const group=distinct(needed,anchor,12),categories=[...new Set(group.map(k=>String(k.value)))];
  if(categories.length===2)candidates.push(pack('conveyor',group,[],{categories}));
  else if(categories.length===1&&group.length>=2){const support=supports.find(k=>String(k.value)!==categories[0]&&!group.some(g=>g.object===k.object));if(support)candidates.push(pack('conveyor',group.slice(0,11),[support],{categories:[categories[0],String(support.value)]}));}
  if(categories.length>2)candidates.push(pack('match',group.slice(0,4)));
 }else if(anchor.goal==='relative-order'){
  const relative=needed.filter(k=>k.goal==='relative-order'&&typeof k.value==='number'&&Number.isFinite(k.value));
  const order=distinct(relative,anchor,5,true),support=order.length===2?supports.find(k=>typeof k.value==='number'&&!order.some(g=>g.object===k.object||g.value===k.value)):undefined;
  if(order.length>=3)candidates.push(pack('order',order));else if(support)candidates.push(pack('order',order,[support]));
  const group=distinct(relative,anchor,12),values=[...new Set(group.map(k=>Number(k.value)))].sort((a,b)=>a-b);
  if(group.length>=2&&values.length>=2){const i=Math.floor((values.length-1)/2),threshold=Math.ceil((values[i]+values[i+1])/2);candidates.push(pack('date-conveyor',group,[],{threshold,categories:[`<${threshold}`,`>=${threshold}`]}));}
 }
 const score=(t:ModelTask)=>-Math.min(3,t.members.filter(m=>m.role==='target').length)*10+t.members.filter(m=>m.role==='support').length*6+recent.filter(h=>h.format===t.format).length*8+Number(t.format===history.at(-1)?.format)*12+Number(t.members.length>1&&(history.at(-1)?.objects.length??0)>1)*6;
 // Equal useful choices are reproducible; sort is the initial date presentation.
 candidates.sort((a,b)=>score(a)-score(b)||Number(a.format==='date-conveyor')-Number(b.format==='date-conveyor')||a.format.localeCompare(b.format));
 return candidates[0];
}
export function applyTaskResult(items:Knowledge[],task:ModelTask,answers:Record<string,boolean>,now:number){
 const targets=task.members.filter(m=>m.role==='target');
 if(Object.keys(answers).length!==targets.length||Object.keys(answers).some(id=>!targets.some(m=>m.id===id)||typeof answers[id]!=='boolean'))throw Error('Exactly one result per target is required');
 // A served synthetic obligation is not a claim that human memory is mastered.
 return items.map(k=>Object.hasOwn(answers,k.id)?{...k,need:answers[k.id]?'known' as const:'error' as const,availableAt:now+(answers[k.id]?0:30),reviewCount:(k.reviewCount??0)+1}:k);
}
