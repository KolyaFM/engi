import {ensureLifecycle,lifecycleProjection} from './learning-lifecycle-service';
import type {EngiDB} from '../db/engi-db';
import {getSnapshot} from '../db/repositories';
import {buildGoalCatalog} from './goal-catalog';
import {ensureDayPlan} from './day-plan-service';
import {studyAvailability} from './study-availability-service';
import {studyWorkload} from '../lib/engi/study-core/workload';
export async function getGoalSnapshot(db:EngiDB,lifecycle=false){
 const s=await getSnapshot(db),catalog=buildGoalCatalog(s.bundle,s.memories);
 if(lifecycle)await db.transaction('rw',db.appMeta,db.learningState,()=>ensureLifecycle(db,catalog));
 const rows=await db.appMeta.bulkGet(catalog.map(e=>'studyCore:memory:'+e.goal.id));
 const goalMemories=rows.filter(r=>!!r).map(r=>r!.value),dayPlan=await ensureDayPlan(db,catalog,goalMemories);
 const availability=await studyAvailability(db,s.bundle,s.memories,dayPlan,goalMemories);dayPlan.available=availability.counts;dayPlan.nextAvailabilityAt=availability.nextAt;
 const exposed=await db.appMeta.bulkGet(catalog.map(e=>'studyCore:exposure:'+e.goal.id));dayPlan.workload=studyWorkload(dayPlan,goalMemories,exposed.filter(r=>!!r).map(r=>r!.value.goalId),new Set(catalog.filter(e=>!e.suspended).map(e=>e.goal.id)));
 const daily=(await db.appMeta.get('studyCore:dailyLearning'))?.value;
 return {...s,dailyLearning:daily,goalCatalog:catalog,goalMemories,dayPlan:await lifecycleProjection(db,catalog,goalMemories,dayPlan)};
}
