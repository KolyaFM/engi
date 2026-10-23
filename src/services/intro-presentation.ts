import type {SessionRow} from '../db/engi-db';
import type {Bundle,Item} from '../lib/engi/types';
import {canonicalTargets} from '../lib/engi/questions/recipe-factory';
import {feedSpan} from './feed-performance';

export type IntroPresentation={bundle:Bundle;items:Item[]};
// Presentation data belongs to this exact returned snapshot, never to persistent
// progress or a session id that could outlive a content/settings change.
const prepared=new WeakMap<SessionRow,IntroPresentation>();
export const introPresentation=(session:SessionRow)=>session.intro?prepared.get(session):undefined;
export function prepareIntroPresentation(session:SessionRow,bundle:Bundle,selectedItems?:Item[]){
 if(!session.intro)return undefined;
 const end=feedSpan('intro.presentation');try{
  const ids=new Set(session.intro.unitIds),view={bundle,items:(selectedItems??canonicalTargets(bundle)).filter(i=>ids.has(i.targetId))};
  prepared.set(session,view);return view;
 }finally{end();}
}
