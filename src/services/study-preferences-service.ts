import {db,type EngiDB} from '../db/engi-db';
import {DEFAULT_NEW_GOALS_PER_DAY} from '../lib/engi/study-core/day-plan';
export type StudyPreferences={sound:boolean;accessibleRecall:boolean;newCardsPerDay:number};
export const DEFAULT_PREFERENCES:StudyPreferences={sound:false,accessibleRecall:false,newCardsPerDay:DEFAULT_NEW_GOALS_PER_DAY};
export const MAX_NEW_CARDS_PER_DAY=100;
export function validDailyLimit(value:unknown):value is number{return typeof value==='number'&&Number.isInteger(value)&&value>=0&&value<=MAX_NEW_CARDS_PER_DAY;}
export async function readStudyPreferences(d:EngiDB=db):Promise<StudyPreferences>{
 const value=(await d.appMeta.get('studyPreferences'))?.value;
 return {sound:value?.sound===true,accessibleRecall:value?.accessibleRecall===true,newCardsPerDay:validDailyLimit(value?.newCardsPerDay)?value.newCardsPerDay:DEFAULT_PREFERENCES.newCardsPerDay};
}
export async function saveStudyPreferences(next:StudyPreferences,d:EngiDB=db){
 if(!validDailyLimit(next.newCardsPerDay))throw Error(`Укажите целое число от 0 до ${MAX_NEW_CARDS_PER_DAY}`);
 await d.appMeta.put({key:'studyPreferences',value:next});return next;
}
