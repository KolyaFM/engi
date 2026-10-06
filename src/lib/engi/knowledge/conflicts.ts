import type {Bundle,Origin} from '../types';
export type ConflictTable='entities'|'facts'|'media'|'tags'|'properties'|'entityTypes';
export function upstreamFingerprint(value:any):string{
 const {origin,originPackId,originPackVersion,userModified,upstreamConflict,upstreamValue,upstreamAcknowledged,...content}=value;
 const canonical=(v:any):any=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
 return JSON.stringify(canonical(content));
}
export function packConflicts(b:Bundle){return (['entities','facts','media','tags','properties','entityTypes'] as const).flatMap(table=>(b[table]??[]).filter(row=>row.upstreamConflict&&row.upstreamValue).map(row=>({table,row:row as Origin&{id:string},upstream:row.upstreamValue as any})))}
