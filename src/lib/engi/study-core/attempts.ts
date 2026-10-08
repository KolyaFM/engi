import { gradeResponse, validateContract, type GoalResult, type TaskContract } from './contracts';
export type Attempt = {
  id: string; taskId: string; startedAt: string;
  phase: 'open' | 'submitted' | 'skipped' | 'stale';
  ineligibleGoalIds: string[];
  hintedGoalIds?: string[];
  firstAnswer?: unknown;
  submittedAt?: string;
  results?: (GoalResult & { credit: boolean; acquisitionCredit?:boolean;acquisitionStageBefore?:string;acquisitionStageAfter?:string; repairEligible?:boolean })[];
  matchedAnswers?: Record<string,string>;
  pairHistory?: MatchingPair[];
};
export type MatchingPair = {id:string;responseKey:string;answer:string;correct:boolean;at:string};
export function startAttempt(contract: TaskContract, id: string, now: Date, blockedGoalIds: string[] = []): Attempt {
  validateContract(contract);
  const shown = new Set(contract.shownClaims.flatMap(c => c.revealsGoalIds));
  if (contract.response.kind === 'mapping' && contract.response.bijective && contract.primaryGoals.some(g => shown.has(g.id))) {
    contract.primaryGoals.forEach(g => shown.add(g.id));
  }
  return { id, taskId: contract.id, startedAt: now.toISOString(), phase: 'open', ineligibleGoalIds: [...new Set([
    ...blockedGoalIds, ...shown
  ])] };
}
/** Hint effects are sticky for this attempt, even if the player waits afterwards. */
export function revealHint(attempt: Attempt, contract: TaskContract, claimKey: string): Attempt {
  if (attempt.taskId !== contract.id || attempt.phase !== 'open') throw Error('Attempt is not open');
  const claim = contract.hintClaims.find(c => c.key === claimKey);
  if (!claim) throw Error('Unknown hint');
  const affected = new Set(claim.revealsGoalIds);
  // One-to-one matching lets the player infer other assignments by elimination.
  if (contract.response.kind === 'mapping' && contract.response.bijective && contract.primaryGoals.some(g => affected.has(g.id))) {
    contract.primaryGoals.forEach(g => affected.add(g.id));
  }
  return { ...attempt, hintedGoalIds:[...new Set([...attempt.hintedGoalIds??[],...affected])],ineligibleGoalIds: [...new Set([...attempt.ineligibleGoalIds, ...affected])] };
}
export function submitAttempt(attempt: Attempt, contract: TaskContract, answer: unknown, now: Date,
  currentRevisions: Record<string, string>, automaticGoalIds: string[] = []): Attempt {
  if (attempt.taskId !== contract.id) throw Error('Wrong task');
  if (attempt.phase !== 'open') return structuredClone(attempt);
  if (!Number.isFinite(now.getTime()) || now.getTime() < new Date(attempt.startedAt).getTime()) throw Error('Invalid submission time');
  if (Object.entries(contract.contentRevisions).some(([key, revision]) => currentRevisions[key] !== revision)) {
    return { ...attempt, phase: 'stale', submittedAt: now.toISOString(), results: [] };
  }
  const shown=new Set(contract.shownClaims.flatMap(c=>c.revealsGoalIds));
  const results = gradeResponse(contract, answer).map(r => ({ ...r, credit: contract.intent!=='repair'&&!contract.practice &&
    !attempt.ineligibleGoalIds.includes(r.goalId) && !automaticGoalIds.includes(r.goalId),
    ...(contract.intent==='repair'?{repairEligible:!attempt.hintedGoalIds?.includes(r.goalId)&&!shown.has(r.goalId)&&!automaticGoalIds.includes(r.goalId)}:{}) }));
  return { ...attempt, phase: 'submitted', firstAnswer: structuredClone(answer), submittedAt: now.toISOString(), results };
}
