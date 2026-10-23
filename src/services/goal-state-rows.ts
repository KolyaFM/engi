import type {EngiDB} from '../db/engi-db';
import {feedSpan} from './feed-performance';
/** Use a range for sparse catalogs and key lookups for small slices of a larger history.
 * Preserve bulkGet's order and holes.
 * No progress cache: edits, newly committed answers and other DB instances stay visible.
 */
export async function readGoalStateRows(db:EngiDB,goalIds:string[],kind:'memory'|'exposure'|'intervalEvidence'){
 if(!goalIds.length)return [];
 const end=feedSpan('state.'+kind+'.read');try{
  const prefix='studyCore:'+kind+':',range=db.appMeta.where('key').startsWith(prefix),stored=await range.count();
  if(!stored)return goalIds.map(()=>undefined);
  if(stored>goalIds.length)return await db.appMeta.bulkGet(goalIds.map(id=>prefix+id));
  const rows=await range.toArray(),byKey=new Map(rows.map(row=>[row.key,row]));
  return goalIds.map(id=>byKey.get(prefix+id));
 }finally{end();}
}
