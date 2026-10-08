import { createEmptyCard, fsrs, Rating, type Card } from 'ts-fsrs';
import type { Attempt } from './attempts';
import type {LearningGoal} from './goals';
const scheduler = fsrs({ request_retention: 0.9, enable_fuzz: false, learning_steps: ['1m', '10m'], relearning_steps: ['10m'] });
export type GoalMemory = { lastCorrect?:boolean;goal?:LearningGoal;goalId: string; card: Card; independentAttempts: number; independentSuccesses: number };
export function updateGoalMemories(previous: GoalMemory[], attempt: Attempt): GoalMemory[] {
  const memories = new Map(previous.map(m => [m.goalId, structuredClone(m)]));
  if (attempt.phase !== 'submitted') return [...memories.values()];
  const now = new Date(attempt.submittedAt!);
  for (const result of attempt.results ?? []) {
    if (!result.credit) continue;
    const old = memories.get(result.goalId);
    const card: Card = old ? { ...old.card, due: new Date(old.card.due), last_review: old.card.last_review ? new Date(old.card.last_review) : undefined } : createEmptyCard(now);
    if (card.last_review && card.last_review > now) throw Error('Attempt predates the latest review');
    const next = scheduler.next(card, now, result.correct ? Rating.Good : Rating.Again).card;
    memories.set(result.goalId, { goalId: result.goalId, card: next,lastCorrect:result.correct,
      independentAttempts: (old?.independentAttempts ?? 0) + 1,
      independentSuccesses: (old?.independentSuccesses ?? 0) + Number(result.correct) });
  }
  return [...memories.values()];
}
