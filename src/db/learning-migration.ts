import type {EngiDB} from './engi-db';
import {mergeLegacyStates} from '../lib/engi/learning/knowledge-unit';
import {learningRow,getBundle,contentTables} from './repositories';
export async function reconcileKnowledgeUnits(d:EngiDB){
 await d.transaction('rw',[...contentTables(d),d.learningState,d.targetMappings],async()=>{
  const rows=await d.learningState.toArray();if(!rows.some(r=>!r.payload.legacyOf&&!r.id.startsWith('ku:')))return;
  const merged=mergeLegacyStates(rows.map(r=>r.payload),await getBundle(d));
  for(const m of merged.states){const old=rows.find(r=>r.id===m.id);if(!old||JSON.stringify(old.payload)!==JSON.stringify(m))await d.learningState.put(learningRow(m))}
  if(merged.mappings.length)await d.targetMappings.bulkPut(merged.mappings);
 });
}
