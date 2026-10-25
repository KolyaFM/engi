import type {Bundle,Fact} from '../types';
import {indexes} from '../indexes';
import {yearInterval} from './date-interval';
/** Opt-in derived goal: source fact remains the only stored value. */
export function periodStart(b:Bundle,f:Fact){
 const p=indexes(b).propertyById.get(f.key),range=yearInterval(f);
 if(!p?.learnable||p.archived||p.cardinality!=='one'||!p.learning?.periodStart||!range||f.learnable===false)return;
 return {year:range.start,...p.learning.periodStart};
}
export const periodStartSourceTarget=(id:string)=>id.endsWith(':start:forward')?id.slice(0,-':start:forward'.length)+':forward':undefined;
export const periodStartTarget=(factId:string)=>`ku:fact:${factId}:start:forward`;
