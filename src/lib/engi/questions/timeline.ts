import type {Item,Task} from '../types';

/** One scale per complete property/category pool, never per selected answer. */
export function timelineContext(pool:Item[]):NonNullable<Task['timeline']> {
 const values=pool.map(i=>i.year).filter((v):v is number=>Number.isFinite(v));
 if(!values.length)return {min:1,max:2100,initial:1050};
 const low=Math.min(...values),high=Math.max(...values);
 const span=Math.max(100,high-low),margin=Math.max(25,span*.15);
 const unit=span>1000?100:span>300?50:25;
 const min=Math.max(1,Math.floor((low-margin)/unit)*unit),max=Math.ceil((high+margin)/unit)*unit;
 const midpoint=Math.round((min+max)/2),hits=(value:number)=>values.filter(year=>Math.abs(year-value)<=15).length;
 // A tightly clustered chronology must still require an intentional estimate.
 // Select from this shared scale, never from the currently displayed item.
 const initial=hits(midpoint)<values.length/2?midpoint:hits(min)<=hits(max)?min:max;
 return {min,max,initial};
}
export function isDiscrete(task:Task){return ['choice','match','categorize','missing'].includes(task.recipe.format)}
export function discreteAnswer(task:Task){return task.recipe.format==='missing'?[...task.items].sort((a,b)=>a.year!-b.year!)[1]?.entityId:task.items[0].answerId}
