import {acquisitionBlocks,applyAcquisitionEvidence} from './acquisition-evidence-service';
import type { EngiDB } from '../db/engi-db';
import { startAttempt, revealHint, submitAttempt, type Attempt } from '../lib/engi/study-core/attempts';
import { validateContract, type TaskContract } from '../lib/engi/study-core/contracts';
import { updateGoalMemories, type GoalMemory } from '../lib/engi/study-core/memory';
import { observeEpisode, blockedByExposure,INTRO_DISCLOSURE_COOLDOWN_MS, type ExposureEntry, type ExposureEpisode } from '../lib/engi/study-core/exposure';
const key = (kind: string, id: string) => `studyCore:${kind}:${id}`;
/** Separate namespace until the feed can produce complete, revision-aware contracts. */
export function createStudyCoreService(db: EngiDB, options: {applyMemory?: boolean;lifecycle?:boolean} = {}) {
  async function currentRevisions(contract: TaskContract) {
    const keys = Object.keys(contract.contentRevisions);
    const rows = await db.appMeta.bulkGet(keys.map(k => key('revision', k)));
    return Object.fromEntries(keys.map((k, i) => [k, rows[i]?.value]));
  }
  return {
    /** Called by the trusted content compiler, never by an answer payload. */
    async setContentRevisions(revisions: Record<string, string>) {
      if (Object.values(revisions).some(v => !v)) throw Error('Empty content revision');
      await db.transaction('rw', db.appMeta, async () => {
        await db.appMeta.bulkPut(Object.entries(revisions).map(([id, value]) => ({ key: key('revision', id), value })));
      });
    },
    async open(contract: TaskContract, attemptId: string, now = new Date(), blockedGoalIds: string[] = []) {
      validateContract(contract);
      return db.transaction('rw', db.appMeta, async () => {
        const existing = await db.appMeta.get(key('attempt', attemptId));
        if (existing) {
          if (existing.value.taskId !== contract.id) throw Error('Attempt ID already belongs to another task');
          const stored = await db.appMeta.get(key('contract', contract.id));
          if (JSON.stringify(stored?.value) !== JSON.stringify(contract)) throw Error('Task contract is immutable');
          return existing.value as Attempt;
        }
        const stored = await db.appMeta.get(key('contract', contract.id));
        if (stored && JSON.stringify(stored.value) !== JSON.stringify(contract)) throw Error('Task contract is immutable');
        const owner = await db.appMeta.get(key('taskAttempt', contract.id));
        if (owner && owner.value !== attemptId) throw Error('A task instance only has one initial attempt');
        const revisions = await currentRevisions(contract);
        if (Object.entries(contract.contentRevisions).some(([id, rev]) => revisions[id] !== rev)) throw Error('Task content is stale');
        const memories = await db.appMeta.bulkGet(contract.primaryGoals.map(g => key('memory', g.id)));
        const acquisition=options.lifecycle?await acquisitionBlocks(db,contract.primaryGoals.map(g=>g.id),now):undefined;
        const notDue = memories.filter(r => r && !acquisition?.active.has(r.value.goalId) && new Date(r.value.card.due) > now).map(r => r!.value.goalId as string);
        const exposureRows = await db.appMeta.bulkGet(contract.primaryGoals.map(g => key('exposure', g.id)));
        const exposed = [...blockedByExposure(exposureRows.filter(r => !!r&&!acquisition?.active.has(r.value.goalId)).map(r => r!.value as ExposureEntry), now)];
        const attempt = startAttempt(contract, attemptId, now, [...blockedGoalIds, ...notDue, ...exposed,...acquisition?.blocked??[]]);
        await db.appMeta.bulkPut([{ key: key('contract', contract.id), value: structuredClone(contract) },
          { key: key('taskAttempt', contract.id), value: attemptId },
          { key: key('openAttempt', attemptId), value: attemptId },
          { key: key('attempt', attemptId), value: attempt }]);
        return attempt;
      });
    },
    async observe(attemptId: string, phase: 'question'|'feedback'|'matched-pairs'|'answer-reveal'|'early-answer'|'details'|'source', episodeId: string,
      event: 'start'|'refresh'|'end', now=new Date()) {
      return db.transaction('rw', db.appMeta, async()=>{
        const row=await db.appMeta.get(key('attempt',attemptId));
        if(!row)throw Error('Attempt not found');
        const contract=(await db.appMeta.get(key('contract',row.value.taskId)))!.value as TaskContract;
        if((phase==='answer-reveal'||phase==='early-answer')&&contract.response.kind!=='self-report')throw Error('Not a recall task');
        if(phase==='feedback'&&row.value.phase!=='submitted')throw Error('Feedback is not available');
        let claims=phase==='question'?contract.shownClaims:phase==='details'?contract.hintClaims.filter(c=>c.key.startsWith('details:')):
          phase==='source'?contract.hintClaims.filter(c=>c.key==='source'):contract.feedbackClaims;
        const correct=contract.response.kind==='order'?JSON.stringify(row.value.firstAnswer)===JSON.stringify(contract.response.expected):
          (row.value.results?.length?row.value.results.every((r:{correct:boolean})=>r.correct):true);
        claims=claims.filter(c=>c.when!=='incorrect'||!correct);
        const old=(await db.appMeta.get(key('episode',episodeId)))?.value as ExposureEpisode|undefined;
        // A heartbeat/cleanup reports the screen originally opened, not a newly graded screen.
        if(old&&event!=='start'&&old.attemptId===attemptId&&old.phase===phase)claims=old.claims;
        if(phase==='matched-pairs'){
          const rule=contract.response;
          if(rule.kind!=='mapping')throw Error('Not a matching task');
          const solved=rule.bindings.filter(b=>row.value.matchedAnswers?.[b.responseKey]===b.expected).map(b=>b.goalId);
          claims=old?.claims??claims.filter(c=>c.revealsGoalIds.some(id=>solved.includes(id)));
        }
        const episode=observeEpisode(old,{id:episodeId,attemptId,phase,claims},now,event);
        // An old heartbeat cannot reopen a closed episode or extend its pause.
        if(old?.endedAt)return old;
        await db.appMeta.put({key:key('episode',episodeId),value:episode});
        const ids=[...new Set(claims.flatMap(c=>c.revealsGoalIds))];
        for(const id of ids){
          const entry=(await db.appMeta.get(key('exposure',id)))?.value as ExposureEntry|undefined;
          if(!entry||new Date(entry.lastVisibleAt)<=new Date(episode.lastVisibleAt))await db.appMeta.put({key:key('exposure',id),value:{goalId:id,lastVisibleAt:episode.lastVisibleAt,episodeId,...(contract.practice&&contract.id.startsWith('intro:')?{cooldownMs:INTRO_DISCLOSURE_COOLDOWN_MS}:{})}});
        }
        const open=await db.appMeta.where('key').startsWith(key('openAttempt','')).toArray();
        for(const owner of open){
          const active=await db.appMeta.get(key('attempt',owner.value));
          if(!active||active.value.phase!=='open')continue;
          // Normal reveal happens after recall and permits labeled self-report.
          if(owner.value===attemptId&&phase!=='early-answer'&&phase!=='details'&&phase!=='source')continue;
          const activeContract=(await db.appMeta.get(key('contract',active.value.taskId)))!.value as TaskContract;
          let affected=ids.filter(id=>activeContract.primaryGoals.some(g=>g.id===id));
          if(owner.value===attemptId&&phase==='early-answer')affected=activeContract.primaryGoals.map(g=>g.id);
          if(activeContract.response.kind==='mapping'&&activeContract.response.bijective&&affected.length)affected=activeContract.primaryGoals.map(g=>g.id);
          if(affected.length)await db.appMeta.put({key:active.key,value:{...active.value,...(owner.value===attemptId?{hintedGoalIds:[...new Set([...active.value.hintedGoalIds??[],...affected])]}:{}),ineligibleGoalIds:[...new Set([...active.value.ineligibleGoalIds,...affected])]}});
        }
        return episode;
      });
    },
    async hint(attemptId: string, claimKey: string) {
      return db.transaction('rw', db.appMeta, async () => {
        const row = await db.appMeta.get(key('attempt', attemptId));
        if (!row) throw Error('Attempt not found');
        const contract = (await db.appMeta.get(key('contract', row.value.taskId)))?.value as TaskContract;
        const attempt = revealHint(row.value, contract, claimKey);
        await db.appMeta.put({ key: row.key, value: attempt });
        return attempt;
      });
    },
    async submit(attemptId: string, answer: unknown, now = new Date(), automaticGoalIds: string[] = []) {
      return db.transaction('rw', db.appMeta, async () => {
        const row = await db.appMeta.get(key('attempt', attemptId));
        if (!row) throw Error('Attempt not found');
        if(row.value.pairHistory)throw Error('Проверяйте пары по одной');
        if (row.value.phase !== 'open') return row.value as Attempt;
        const contract = (await db.appMeta.get(key('contract', row.value.taskId)))?.value as TaskContract;
        let attempt = submitAttempt(row.value, contract, answer, now, await currentRevisions(contract), automaticGoalIds);
        const ids = contract.primaryGoals.map(g => g.id);
        const rows = await db.appMeta.bulkGet(ids.map(id => key('memory', id)));
        const previous = rows.filter(r => !!r).map(r => r!.value as GoalMemory);
        // Another open screen may have reviewed the same goal in the meantime.
        const awaitActive=options.lifecycle?(await acquisitionBlocks(db,ids,now)).active:new Map();
        const notDue = new Set(previous.filter(m => new Date(m.card.due) > now).map(m => m.goalId));
        if (attempt.results) attempt = { ...attempt, results: attempt.results.map(r => ({ ...r, credit: r.credit && (!notDue.has(r.goalId)||!!options.lifecycle&&awaitActive.has(r.goalId)) })) };
        const lifecycle=options.lifecycle?await applyAcquisitionEvidence(db,attempt,contract,previous):undefined;if(lifecycle)attempt=lifecycle.attempt;
        const graduated=new Set(lifecycle?.graduated.map(m=>m.goalId));
        const memories = [...updateGoalMemories(previous,{...attempt,results:attempt.results?.filter(r=>!graduated.has(r.goalId))}),...lifecycle?.graduated??[]];
        const credited = new Set(attempt.results?.filter(r => r.credit).map(r => r.goalId));
        // Attempt and every eligible memory transition succeed or roll back together.
        await db.appMeta.bulkPut([
          ...(options.applyMemory===false?[]:memories.filter(m => credited.has(m.goalId)).map(m => ({ key: key('memory', m.goalId), value: {...m,goal:contract.primaryGoals.find(g=>g.id===m.goalId)} }))),
          { key: row.key, value: attempt }
        ]);
        await db.appMeta.delete(key('openAttempt',attemptId));
        return attempt;
      });
    },
    async submitPair(attemptId:string,responseKey:string,answer:string,requestId:string,now=new Date()){
      return db.transaction('rw',db.appMeta,async()=>{
        const row=await db.appMeta.get(key('attempt',attemptId));
        if(!row)throw Error('Attempt not found');
        const previous=row.value as Attempt,contract=(await db.appMeta.get(key('contract',previous.taskId)))!.value as TaskContract,rule=contract.response;
        if(rule.kind!=='mapping')throw Error('Not a matching task');
        const replay=previous.pairHistory?.find(p=>p.id===requestId);
        if(replay){if(replay.responseKey!==responseKey||replay.answer!==answer)throw Error('Request ID already used');return {attempt:previous,pair:replay,firstResult:undefined};}
        if(previous.phase!=='open')throw Error('Attempt is not open');
        if(!requestId||requestId.length>200||!Number.isFinite(now.getTime())||now.getTime()<new Date(previous.startedAt).getTime())throw Error('Invalid pair request');
        const binding=rule.bindings.find(b=>b.responseKey===responseKey),matched={...previous.matchedAnswers};
        if(!binding||!rule.options.includes(answer))throw Error('Unknown matching tile');
        if(matched[responseKey]||rule.bijective&&Object.values(matched).includes(answer))throw Error('Пара уже найдена');
        const revisions=await currentRevisions(contract);
        if(Object.entries(contract.contentRevisions).some(([id,rev])=>revisions[id]!==rev))throw Error('Task content is stale');
        const pair={id:requestId,responseKey,answer,correct:answer===binding.expected,at:now.toISOString()};
        const memory=(await db.appMeta.get(key('memory',binding.goalId)))?.value as GoalMemory|undefined;const acquisition=options.lifecycle?await acquisitionBlocks(db,[binding.goalId],now):undefined;
          let firstResult:NonNullable<Attempt['results']>[number]|undefined=binding.support||previous.results?.some(r=>r.goalId===binding.goalId)?undefined:{goalId:binding.goalId,correct:pair.correct,selfReported:false,
            credit:!contract.contextual&&!contract.practice&&!previous.ineligibleGoalIds.includes(binding.goalId)&&(!rule.bijective||rule.exhaustive===false||Object.keys(matched).length<rule.bindings.length-1)&&(!memory||acquisition?.active.has(binding.goalId)||new Date(memory.card.due)<=now)};
        if(pair.correct)matched[responseKey]=answer;
        const complete=Object.keys(matched).length===rule.bindings.length;
        let attempt:Attempt={...previous,matchedAnswers:matched,pairHistory:[...previous.pairHistory??[],pair],
          firstAnswer:{...previous.firstAnswer as Record<string,string>,...(firstResult?{[responseKey]:answer}:{})},
          results:[...previous.results??[],...(firstResult?[firstResult]:[])],phase:complete?'submitted':'open',...(complete?{submittedAt:now.toISOString()}:{})};
        let graduated:GoalMemory[]=[];if(firstResult&&options.lifecycle){const evidence=await applyAcquisitionEvidence(db,{...attempt,id:attempt.id+':pair:'+responseKey,phase:'submitted',submittedAt:now.toISOString(),results:[firstResult]},contract,memory?[memory]:[]);firstResult=evidence.attempt.results![0];graduated=evidence.graduated;attempt.results=attempt.results!.map(r=>r.goalId===binding.goalId?firstResult!:r);}
        if(firstResult?.credit&&options.applyMemory!==false){
          const updated=graduated[0]??updateGoalMemories(memory?[memory]:[],{...attempt,id:attempt.id+':pair:'+responseKey,phase:'submitted',submittedAt:now.toISOString(),results:[firstResult]})[0];
          await db.appMeta.put({key:key('memory',binding.goalId),value:{...updated,goal:contract.primaryGoals.find(g=>g.id===binding.goalId)}});
        }
        await db.appMeta.put({key:row.key,value:attempt});
        if(complete)await db.appMeta.delete(key('openAttempt',attemptId));
        return {attempt,pair,firstResult};
      });
    },
    async skip(attemptId: string) {
      return db.transaction('rw', db.appMeta, async () => {
        const row = await db.appMeta.get(key('attempt', attemptId));
        if (!row) throw Error('Attempt not found');
        if (row.value.phase !== 'open') return row.value as Attempt;
        const attempt: Attempt = { ...row.value, phase: 'skipped' };
        await db.appMeta.put({ key: row.key, value: attempt });
        await db.appMeta.delete(key('openAttempt',attemptId));
        return attempt;
      });
    },
    async memory(goalId: string): Promise<GoalMemory | undefined> {
      return (await db.appMeta.get(key('memory', goalId)))?.value;
    }
  };
}
