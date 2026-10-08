import type {LearningGoal} from './goals';
import {knowledgeMistakeKey} from './mistakes';
import {defineGoal} from './goals';
import {z} from 'zod';
export const ACQUISITION_GAP_MS=10000;
export const ACTIVE_CARD_LIMIT=3;
export type AcquisitionUnit={key:string;entityId:string;goal:LearningGoal;stage:'first-check'|'confirmation'|'completed';successes:number;requiredSuccesses:number;availableAt:string;attemptIds:string[];lastAttemptAt?:string;completedAt?:string};
export type CardIntroduction={entityId:string;introducedAt:string;source:'daily'|'extra'|'migration'};
export type LearningLifecycle={version:1;cards:CardIntroduction[];units:AcquisitionUnit[]};
export const acquisitionKey=knowledgeMistakeKey;
export const emptyLifecycle=():LearningLifecycle=>({version:1,cards:[],units:[]});
const text=z.string().min(1),date=z.string().datetime({offset:true});
const goalSchema=z.object({id:text,semanticKey:text,knowledge:z.object({kind:z.enum(['fact','complete-set','identity','order-relation']),key:text}),skill:z.enum(['recognition','recall']),direction:z.enum(['forward','reverse']),cueRole:text,precision:text,revision:text}).refine(g=>g.id===defineGoal(g).id&&g.semanticKey===defineGoal(g).semanticKey);
export const learningLifecycleSchema=z.object({version:z.literal(1),cards:z.array(z.object({entityId:text,introducedAt:date,source:z.enum(['daily','extra','migration'])})),units:z.array(z.object({key:text,entityId:text,goal:goalSchema,stage:z.enum(['first-check','confirmation','completed']),successes:z.number().int().min(0).max(2),requiredSuccesses:z.number().int().min(1).max(2),availableAt:date,attemptIds:z.array(text),lastAttemptAt:date.optional(),completedAt:date.optional()}).refine(u=>u.key===acquisitionKey(u.goal)&&new Set(u.attemptIds).size===u.attemptIds.length&&(u.stage==='completed'?!!u.completedAt&&u.successes>=u.requiredSuccesses:u.successes<u.requiredSuccesses)))}).refine(l=>new Set(l.cards.map(c=>c.entityId)).size===l.cards.length&&new Set(l.units.map(u=>u.key)).size===l.units.length&&l.units.every(u=>l.cards.some(c=>c.entityId===u.entityId)));
/** One knowledge has one initial required skill; extra formats cannot silently add obligations. */
export function admitAcquisition(previous:LearningLifecycle,entityId:string,goals:LearningGoal[],now:Date,source:CardIntroduction['source']='daily',skill:LearningGoal['skill']='recognition'){
 const next=structuredClone(previous),grouped=new Map<string,LearningGoal>();
 for(const goal of goals){const key=acquisitionKey(goal),old=grouped.get(key);if(!old||goal.skill===skill)grouped.set(key,goal);}
 if(!next.cards.some(c=>c.entityId===entityId))next.cards.push({entityId,introducedAt:now.toISOString(),source});
 for(const [key,goal]of grouped)if(!next.units.some(u=>u.key===key))next.units.push({key,entityId,goal,stage:'first-check',successes:0,requiredSuccesses:2,availableAt:new Date(now.getTime()+ACQUISITION_GAP_MS).toISOString(),attemptIds:[]});
 return next;
}
export function advanceAcquisition(previous:LearningLifecycle,evidence:{id:string;goalId:string;at:Date;correct:boolean;eligible:boolean}){
 const next=structuredClone(previous),unit=next.units.find(u=>u.goal.id===evidence.goalId&&u.stage!=='completed');
 if(!unit||!evidence.eligible||unit.attemptIds.includes(evidence.id)||evidence.at.getTime()<new Date(unit.availableAt).getTime())return next;
 unit.attemptIds.push(evidence.id);unit.lastAttemptAt=evidence.at.toISOString();unit.successes=evidence.correct?unit.successes+1:0;
 unit.stage=unit.successes>=unit.requiredSuccesses?'completed':unit.successes?'confirmation':'first-check';
 unit.availableAt=new Date(evidence.at.getTime()+ACQUISITION_GAP_MS).toISOString();
 if(unit.stage==='completed')unit.completedAt=evidence.at.toISOString();
 return next;
}
