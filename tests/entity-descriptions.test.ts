import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyBundle} from '../src/db/repositories';
import {parseV3} from '../src/lib/engi/import/schema-v3';
import {buildImportPlan} from '../src/lib/engi/import/semantic-merge';
import {entityRevision,factRevision} from '../src/lib/engi/study-core/compiler';
import {eligible,recipes} from '../src/lib/engi/questions/recipe-factory';
import {validateImport} from '../src/lib/engi/validate';
import {readFileSync} from 'node:fs';

const pkg=(description:string)=>parseV3({schemaVersion:3,name:'События',properties:[{name:'Год события',valueType:'date',promptTemplates:{reverse:'Какое событие произошло в этом году?'}}],entities:[{name:'Событие',type:'Событие',description,facts:[{property:'Год события',value:1803,source:{kind:'manual',name:'Тест'},verification:'user_confirmed'}]}]});
test('object descriptions accept plain text up to 4000 characters',()=>{
 assert.equal(pkg('а'.repeat(4000)).entities[0].description?.length,4000);
 assert.throws(()=>pkg('а'.repeat(4001)));
 const {bundle}=buildImportPlan(pkg('а'.repeat(4000)),emptyBundle());
 assert.equal(validateImport(bundle,emptyBundle()).entities[0].summary?.length,4000);
});
test('five-event pack imports without ambiguity and supports both directions and chronology',()=>{
 const p=parseV3(JSON.parse(readFileSync(new URL('../examples/us-history-5/bundle.json',import.meta.url),'utf8')));
 const plan=buildImportPlan(p,emptyBundle());assert.deepEqual(plan.issues,[]);
 assert.equal(plan.bundle.deckMembers?.length,5);assert.equal(plan.bundle.facts.length,9);
 assert.equal(plan.bundle.entities.filter(e=>e.summary).length,5);
 assert(plan.bundle.entities.filter(e=>e.summary).every(e=>e.summary!.length>400));
 const all=recipes(plan.bundle).filter(r=>r.tag===plan.deckId);
 assert(all.some(r=>r.format==='sort'&&eligible(plan.bundle,r).length===5));
 assert(all.some(r=>r.format==='match'));
 assert(all.some(r=>r.direction==='reverse'&&r.format==='choice'));
 assert(plan.bundle.facts.every(f=>!!f.source.url));
 assert(p.properties.every(p=>!p.promptTemplates?.forward?.includes('{subject}')));
});
test('description update preserves object/fact IDs and memory revisions',()=>{
 const first=buildImportPlan(pkg('Первый текст'),emptyBundle(),{},'first');
 const next=buildImportPlan(pkg('Обновлённый текст'),first.bundle,{},'next');
 const e=first.bundle.entities[0],f=first.bundle.facts[0];
 assert.equal(next.bundle.entities[0].summary,'Обновлённый текст');
 assert.equal(next.bundle.entities[0].id,e.id);
 assert.equal(next.bundle.facts[0].id,f.id);
 assert.deepEqual(next.resetFactIds,[]);
 assert.equal(entityRevision(first.bundle,e.id),entityRevision(next.bundle,e.id));
 assert.equal(factRevision(first.bundle,f),factRevision(next.bundle,next.bundle.facts[0]));
});
test('reimport preserves personal descriptions',()=>{
 const first=buildImportPlan(pkg('Из пакета'),emptyBundle());
 first.bundle.entities[0].summary='Личный текст';first.bundle.entities[0].userModified=true;
 assert.equal(buildImportPlan(pkg('Новый текст'),first.bundle).bundle.entities[0].summary,'Личный текст');
 first.bundle.entities[0].userModified=false;first.bundle.entities[0].origin='user';
 assert.equal(buildImportPlan(pkg('Новый текст'),first.bundle).bundle.entities[0].summary,'Личный текст');
});
test('reverse questions carry object descriptions without a separate knowledge target',()=>{
 const {bundle}=buildImportPlan(pkg('Описание события'),emptyBundle());
 const r=recipes(bundle).find(r=>r.direction==='reverse')!;assert(r);
 assert.equal(eligible(bundle,r)[0].summary,'Описание события');
});
