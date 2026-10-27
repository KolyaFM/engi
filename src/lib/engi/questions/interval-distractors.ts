import {formatHistoricalRange,MIN_YEAR_INDEX} from '../historical-date';
import {indexes} from '../indexes';
import type {Bundle,Item,Recipe,Task} from '../types';
import {yearInterval} from './date-interval';
export function intervalDistractors(b:Bundle,item:Item,r:Recipe,random=Math.random):Task['options']|undefined{
 if(r.format!=='choice'||r.direction==='reverse'||r.answerPresentation==='image')return;
 const f=indexes(b).factsByEntityAndKey.get(item.entityId)?.get(r.answerKey)?.find(f=>f.id===item.factId),range=f&&yearInterval(f);if(!range)return;
 const candidates:{start:number;end:number}[]=[];
 for(let a=-3;a<=3;a++)for(let z=-3;z<=3;z++){const start=range.start+a,end=range.end+z;if((a||z)&&start>=MIN_YEAR_INDEX&&end<=9999&&start<=end)candidates.push({start,end});}
 const chosen:typeof candidates=[];
 while(chosen.length<3&&candidates.length)chosen.push(candidates.splice(Math.floor(random()*candidates.length),1)[0]);
 if(chosen.length<3)return;
 return chosen.map(p=>({id:formatHistoricalRange(p.start,p.end),name:formatHistoricalRange(p.start,p.end)}));
}
