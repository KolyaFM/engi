import {useMemo,useState} from 'react';
import type {PreparedImport} from '../../services/declarative-pack';
import {planDeclarativeImport} from '../../services/declarative-pack';
import type {ImportDecisions} from '../../lib/engi/import/semantic-merge';
export function ImportPreview({prepared,busy,onCommit,onCancel}:{prepared:PreparedImport;busy:boolean;onCommit:(decisions:ImportDecisions)=>void;onCancel:()=>void}){
 const [decisions,setDecisions]=useState<ImportDecisions>(prepared.decisions);
 const result=useMemo(()=>{try{return {plan:planDeclarativeImport(prepared,decisions),error:''}}catch(e){return {plan:undefined,error:(e as Error).message}}},[prepared,decisions]);
 // Resolved choices stay visible so users can correct a previous selection.
 const [seen,setSeen]=useState<ReturnType<typeof planDeclarativeImport>['issues']>([]);
 const issues=[...new Map([...seen,...result.plan?.issues??[]].map(i=>[i.key,i])).values()];
 function choose(key:string,value:string){setSeen(issues);setDecisions({...decisions,[key]:value})}
 return <section aria-label="Проверка импорта"><h3>{prepared.pkg.name}</h3>{result.plan&&<p>Новых объектов: {result.plan.stats.newEntities} · Найдено в базе: {result.plan.stats.matchedEntities} · Новых фактов: {result.plan.stats.newFacts} · Уже известных: {result.plan.stats.existingFacts}</p>}
 <p className="muted">Проверьте сопоставление. Изменения будут сохранены после нажатия «Импортировать».</p>
 {issues.map(i=><section className="edit-fact" key={i.key}><strong>{i.label}</strong><p>{i.detail}</p><select aria-label={i.label} disabled={busy} value={decisions[i.key]??''} onChange={e=>choose(i.key,e.target.value)}><option value="">Выберите решение…</option>{i.options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></section>)}
 {result.error&&<p role="alert">{result.error}</p>}
 <div className="import-buttons"><button className="button primary" disabled={busy||!result.plan||result.plan.issues.length>0} onClick={()=>onCommit(decisions)}>Импортировать</button><button className="button outline" disabled={busy} onClick={onCancel}>Отмена</button></div></section>
}
