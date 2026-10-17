export type IntervalEvidence={goalId:string;revision:string;lastExerciseAt?:string;lastDisclosureAt?:string;lastEdge?:'start'|'end';start?:{correct:boolean;at:string};end?:{correct:boolean;at:string};failedContextAt?:string;attemptIds:string[]};
export function intervalAvailableAt(e:IntervalEvidence|undefined){return e?Math.max(e.lastExerciseAt?Date.parse(e.lastExerciseAt)+60000:0,e.lastDisclosureAt?Date.parse(e.lastDisclosureAt)+60000:0):0;}
export function recordIntervalEvidence(previous:IntervalEvidence|undefined,input:{taskId:string;goalId:string;revision:string;kind:'start'|'end'|'context';correct:boolean;at:string}):IntervalEvidence{
 const base=previous?.revision===input.revision&&previous.goalId===input.goalId?previous:{goalId:input.goalId,revision:input.revision,attemptIds:[]};
 if(base.attemptIds.includes(input.taskId))return structuredClone(base);
 return {...base,lastExerciseAt:input.at,lastEdge:input.kind==='context'?base.lastEdge:input.kind,...(input.kind==='context'?(!input.correct?{failedContextAt:input.at}:{}):{[input.kind]:{correct:input.correct,at:input.at}}),attemptIds:[...base.attemptIds,input.taskId].slice(-20)};
}
