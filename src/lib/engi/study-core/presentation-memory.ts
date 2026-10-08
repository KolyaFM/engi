import {createEmptyCard,State} from 'ts-fsrs';
import type {Memory} from '../types';
import type {GoalMemory} from './memory';

/** Adapt one exact goal for presentation only; legacy progress never supplies evidence. */
export function goalPresentationMemory(configuration:Memory,memory?:GoalMemory):Memory{
 return {id:configuration.id,card:memory?.card??createEmptyCard(),
  status:configuration.status==='suspended'?'suspended':!memory?'triaged':Number(memory.card.state)===State.Review?'review':'learning',
  attempts:memory?.independentAttempts??0,correct:memory?.independentSuccesses??0,
  firstSuccessAt:memory?.independentSuccesses?new Date(memory.card.last_review??memory.card.due).toISOString():undefined,
  lastOutcome:memory?.lastCorrect,latencyEmaMs:memory?.latencyEmaMs,
  confusions:{...memory?.confusions},recentMediaIds:memory?.recentMediaIds?[...memory.recentMediaIds]:undefined};
}
