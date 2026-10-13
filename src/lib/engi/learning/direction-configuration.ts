import type {Bundle,Memory} from '../types';
import {canonicalTargets} from '../questions/recipe-factory';
import {triagedMemory} from './bootstrap';
/** Legacy learning rows configure permissions, not FSRS. Do not copy goal-memory evidence. */
export function directionConfiguration(b:Bundle,rows:Memory[],enabled=true):Memory[]{
 if(!enabled)return rows;
 const existing=new Map(rows.filter(m=>!m.legacyOf).map(m=>[m.id,m]));
 if(!rows.some(m=>/:(forward|reverse)$/.test(m.id)&&!existing.has(m.id.replace(/:(forward|reverse)$/,m.id.endsWith(':reverse')?':forward':':reverse'))))return rows;
 const extra:Memory[]=[];
 for(const item of canonicalTargets(b))if(item.factId&&!existing.has(item.targetId)){
  const other=existing.get(item.targetId.replace(/:(forward|reverse)$/,item.targetId.endsWith(':reverse')?':forward':':reverse'));if(!other)continue;
  const row=triagedMemory(item,other.initialFamiliarity??'red','',0);
  if(other.status==='suspended'){row.status='suspended';row.suspendedFrom=other.suspendedFrom;}
  extra.push(row);
 }
 return extra.length?[...rows,...extra]:rows;
}
