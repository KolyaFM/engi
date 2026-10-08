import { defineGoal, type LearningGoal } from './goals';
export type Claim = { key: string; revision: string; revealsGoalIds: string[]; when?: 'incorrect' };
export type Binding = { responseKey: string; goalId: string; expected: string };
export type ResponseRule =
  | { kind: 'choice'; goalId: string; options: string[]; expected: string }
  | { kind: 'mapping'; bindings: Binding[]; options: string[]; bijective: boolean }
  | { kind: 'set'; goalId: string; options: string[]; expected: string[]; complete: true }
  | { kind: 'order'; entities: string[]; expected: string[]; relations: { goalId: string; before: string; after: string }[] }
  | { kind: 'number'; goalId: string; expected: number; tolerance: number; min: number; max: number }
  | { kind: 'practice-choice'; options: string[]; expected: string }
  | { kind: 'practice-number'; expected: number; tolerance: number; min: number; max: number }
  | { kind: 'self-report'; goalId: string };
export type TaskContract = {
  intent?: 'learn'|'repair'|'practice';
  repairEpisodeIds?: string[];
  id: string;
  primaryGoals: LearningGoal[];
  supportGoalIds: string[];
  actionFamily: 'select' | 'match' | 'categorize' | 'select-set' | 'order' | 'place-date' | 'recall';
  visibleEntities: string[];
  shownClaims: Claim[];
  hintClaims: Claim[];
  feedbackClaims: Claim[];
  contentRevisions: Record<string, string>;
  response: ResponseRule;
  practice: boolean;
};
const unique = (values: string[]) => new Set(values).size === values.length;
const permutation = (values: string[], expected: string[]) => unique(values) && values.length === expected.length && values.every(v => expected.includes(v));
export function validateContract(contract: TaskContract): void {
  const ids = contract.primaryGoals.map(g => g.id), rule = contract.response;
  if (!contract.id || !unique(ids) || !unique(contract.visibleEntities)) throw Error('Invalid contract identity');
  if (contract.supportGoalIds.some(id => ids.includes(id))) throw Error('Support cannot receive primary credit');
  for (const goal of contract.primaryGoals) {
    const canonical = defineGoal(goal);
    if (goal.id !== canonical.id || goal.semanticKey !== canonical.semanticKey) throw Error('Noncanonical goal identity');
    if (contract.contentRevisions[goal.semanticKey] !== goal.revision) throw Error('Missing goal revision');
  }
  const requiredAction = { choice: 'select', 'practice-choice': 'select', set: 'select-set', order: 'order', number: 'place-date', 'practice-number': 'place-date', 'self-report': 'recall' } as const;
  if (rule.kind === 'mapping') {
    if (contract.actionFamily !== (rule.bijective ? 'match' : 'categorize')) throw Error('Mapping action mismatch');
  } else if (contract.actionFamily !== requiredAction[rule.kind]) throw Error('Response action mismatch');
  let graded: string[] = [];
  if (rule.kind === 'choice' || rule.kind === 'practice-choice') {
    if (!unique(rule.options) || rule.options.length < 2 || !rule.options.includes(rule.expected)) throw Error('Ambiguous choice');
    if (rule.kind === 'choice') graded = [rule.goalId];
    else if (!contract.practice) throw Error('Untracked choice must be practice');
  } else if (rule.kind === 'mapping') {
    if (!rule.bindings.length || !unique(rule.bindings.map(b => b.responseKey)) || !unique(rule.options) || rule.bindings.some(b => !rule.options.includes(b.expected))) throw Error('Invalid mapping');
    if (rule.bijective && (!unique(rule.bindings.map(b => b.expected)) || rule.options.length !== rule.bindings.length)) throw Error('Mapping is not bijective');
    graded = rule.bindings.map(b => b.goalId);
  } else if (rule.kind === 'set') {
    if (rule.complete !== true || !unique(rule.expected) || !unique(rule.options) || !rule.expected.length || rule.expected.some(v => !rule.options.includes(v))) throw Error('Incomplete set');
    if (contract.primaryGoals.find(g => g.id === rule.goalId)?.knowledge.kind !== 'complete-set') throw Error('Set requires an aggregate goal');
    graded = [rule.goalId];
  } else if (rule.kind === 'order') {
    if (rule.entities.length < 2 || !permutation(rule.expected, rule.entities)) throw Error('Invalid order');
    for (const relation of rule.relations) {
      if (!rule.entities.includes(relation.before) || !rule.entities.includes(relation.after) || rule.expected.indexOf(relation.before) >= rule.expected.indexOf(relation.after)) throw Error('Inconsistent relation');
      if (contract.primaryGoals.find(g => g.id === relation.goalId)?.knowledge.kind !== 'order-relation') throw Error('Sorting cannot grade dates');
    }
    graded = rule.relations.map(r => r.goalId);
  } else if (rule.kind === 'number' || rule.kind === 'practice-number') {
    if (![rule.expected, rule.tolerance, rule.min, rule.max].every(Number.isFinite) || rule.tolerance < 0 || rule.min > rule.expected || rule.max < rule.expected) throw Error('Invalid number scale');
    if (rule.tolerance !== 0 && !contract.practice) throw Error('Approximate scale is practice until a precision contract exists');
    if (rule.kind === 'number') graded = [rule.goalId];
    else if (!contract.practice) throw Error('Untracked number must be practice');
  } else graded = [rule.goalId];
  if (rule.kind === 'self-report' && contract.primaryGoals.find(g => g.id === rule.goalId)?.skill !== 'recall') throw Error('Self report requires a recall goal');
  if (['choice', 'mapping', 'set'].includes(rule.kind) && contract.primaryGoals.some(g => g.skill !== 'recognition')) throw Error('Options cannot test unaided recall');
  if (!unique(graded) || !permutation(graded, ids)) throw Error('Exactly one grading rule per primary goal is required');
  if (!ids.length && !contract.practice) throw Error('Untracked tasks must be practice');
}
export type GoalResult = { goalId: string; correct: boolean; selfReported: boolean };
/** Called on the first submitted complete answer, not intermediate drag operations. */
export function gradeResponse(contract: TaskContract, answer: unknown): GoalResult[] {
  validateContract(contract);
  const rule = contract.response;
  const result = (goalId: string, correct: boolean, selfReported = false) => ({ goalId, correct, selfReported });
  if (rule.kind === 'choice' || rule.kind === 'practice-choice') {
    if (typeof answer !== 'string' || !rule.options.includes(answer)) throw Error('Unknown choice');
    return rule.kind === 'choice' ? [result(rule.goalId, answer === rule.expected)] : [];
  }
  if (rule.kind === 'mapping') {
    if (!answer || typeof answer !== 'object' || Array.isArray(answer)) throw Error('Submit the complete mapping');
    const values = answer as Record<string, unknown>, keys = rule.bindings.map(b => b.responseKey);
    if (!permutation(Object.keys(values), keys) || keys.some(k => typeof values[k] !== 'string' || !rule.options.includes(values[k] as string))) throw Error('Submit the complete mapping');
    if (rule.bijective && !unique(Object.values(values) as string[])) throw Error('Each option must be placed once');
    return rule.bindings.map(b => result(b.goalId, values[b.responseKey] === b.expected));
  }
  if (rule.kind === 'set') {
    if (!Array.isArray(answer) || answer.some(v => typeof v !== 'string' || !rule.options.includes(v)) || !unique(answer)) throw Error('Invalid selection');
    return [result(rule.goalId, permutation(answer, rule.expected))];
  }
  if (rule.kind === 'order') {
    if (!Array.isArray(answer) || !permutation(answer, rule.entities)) throw Error('Submit the complete order');
    return rule.relations.map(r => result(r.goalId, answer.indexOf(r.before) < answer.indexOf(r.after)));
  }
  if (rule.kind === 'number' || rule.kind === 'practice-number') {
    if (typeof answer !== 'number' || !Number.isFinite(answer) || answer < rule.min || answer > rule.max) throw Error('Invalid scale position');
    return rule.kind === 'number' ? [result(rule.goalId, Math.abs(answer - rule.expected) <= rule.tolerance)] : [];
  }
  if (typeof answer !== 'boolean') throw Error('Invalid self-report');
  return [result(rule.goalId, answer, true)];
}
