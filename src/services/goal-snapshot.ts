import type {EngiDB} from '../db/engi-db';
import {getSnapshot} from '../db/repositories';
import {buildGoalCatalog} from './goal-catalog';
import {ensureDayPlan} from './day-plan-service';
export async function getGoalSnapshot(db:EngiDB){
 const s=await getSnapshot(db),catalog=buildGoalCatalog(s.bundle,s.memories);
 const rows=await db.appMeta.bulkGet(catalog.map(e=>'studyCore:memory:'+e.goal.id));
 const goalMemories=rows.filter(r=>!!r).map(r=>r!.value),dayPlan=await ensureDayPlan(db,catalog,goalMemories);
 const daily=(await db.appMeta.get('studyCore:dailyLearning'))?.value;
 return {...s,dailyLearning:daily,goalCatalog:catalog,goalMemories,dayPlan};
}
