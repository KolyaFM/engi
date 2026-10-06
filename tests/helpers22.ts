import type {EngiDB} from '../src/db/engi-db';
import {getBundle,learningRow} from '../src/db/repositories';
import {canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {triagedMemory} from '../src/lib/engi/learning/bootstrap';
/** Real due states let storage/review regressions bypass the independent Intro UI. */
export async function prepareDue(d:EngiDB){
 for(const item of canonicalTargets(await getBundle(d))){const old=await d.learningState.get(item.targetId),m=old?.payload??triagedMemory(item,'red','',0);m.card.due=new Date(Date.now()-1000);if(m.bootstrap)m.bootstrap.sessionId=undefined;await d.learningState.put(learningRow(m))}
}
