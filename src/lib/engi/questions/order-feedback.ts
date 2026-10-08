/** Positions belong to slots, not to the movable objects. */
export function orderPositions(order:string[],expected:string[]):boolean[]{
 return order.map((id,n)=>id===expected[n]);
}
export function moveOrder(order:string[],id:string,to:number,locked:boolean[]=[]):string[]{
 const from=order.indexOf(id);
 if(from<0||locked[from]||to<0||to>=order.length||locked[to])return [...order];
 const slots=order.map((_,n)=>n).filter(n=>!locked[n]),values=slots.map(n=>order[n]);
 values.splice(slots.indexOf(from),1);values.splice(slots.indexOf(to),0,id);
 const next=[...order];slots.forEach((slot,n)=>next[slot]=values[n]);return next;
}
