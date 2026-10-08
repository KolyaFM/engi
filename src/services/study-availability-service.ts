import type {EngiDB} from '../db/engi-db';
import type {Bundle,Memory} from '../lib/engi/types';
import type {GoalDayPlan} from '../lib/engi/study-core/day-plan';
import type {GoalMemory} from '../lib/engi/study-core/memory';
import type {ExposureEntry} from '../lib/engi/study-core/exposure';
import {goalProposalPool} from './goal-proposals';
import {admitStudyCandidates} from '../lib/engi/session/study-availability';
export async function studyAvailability(db:EngiDB,bundle:Bundle,enabled:Memory[],plan:GoalDayPlan,memories:GoalMemory[],tag='all',format='mixed'){
 const pool=goalProposalPool(bundle,enabled,tag,format),ids=[...new Set(pool.proposals.flatMap(p=>p.goals.map(g=>g.id)))],rows=await db.appMeta.bulkGet(ids.map(id=>'studyCore:exposure:'+id));
 const memory=new Map(memories.map(m=>[m.goalId,m])),exposures=new Map(rows.filter(r=>!!r).map(r=>[r!.value.goalId,r!.value as ExposureEntry]));
 const {counts,nextAt}=admitStudyCandidates(pool.proposals,p=>p.goals,plan,memory,exposures);return {counts,nextAt};
}
