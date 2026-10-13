import assert from 'node:assert/strict';
import {test} from 'node:test';
import {emptyBundle} from '../src/db/repositories';
import {parseV3} from '../src/lib/engi/import/schema-v3';
import {buildImportPlan} from '../src/lib/engi/import/semantic-merge';
import {questionPrompt} from '../src/lib/engi/questions/question-templates';

const pkg=(reverse?:string)=>parseV3({schemaVersion:3,name:'Штаты',entities:[],properties:[{name:'Год вступления в Союз',valueType:'date',promptTemplates:{forward:'В каком году штат {subject} вступил в Союз?',...(reverse?{reverse}:{})}}]});
const reverse='Какой штат вступил в Союз в этом году?';
test('updated pack adds reverse wording to an existing property without changing identity or removing other templates',()=>{
 const initial=buildImportPlan(pkg(),emptyBundle()).bundle,p=initial.properties!.find(p=>p.name==='Год вступления в Союз')!;
 p.promptTemplates!.sort='Расставьте штаты по году вступления в Союз.';
 const next=buildImportPlan(pkg(reverse),initial).bundle.properties!.find(x=>x.id===p.id)!;
 assert.equal(next.id,p.id);assert.equal(next.promptTemplates?.reverse,reverse);assert.equal(next.promptTemplates?.sort,p.promptTemplates?.sort);
 assert.equal(questionPrompt(next,'1816','choice','reverse'),reverse);
 assert.equal(initial.properties!.find(x=>x.id===p.id)!.promptTemplates?.reverse,undefined);
});
test('pack update preserves user-authored templates and an import without templates does not erase them',()=>{
 const current=buildImportPlan(pkg(reverse),emptyBundle()).bundle,p=current.properties!.find(p=>p.name==='Год вступления в Союз')!;
 p.userModified=true;p.promptTemplates!.reverse='Мой вопрос';
 assert.equal(buildImportPlan(pkg('Другой вопрос'),current).bundle.properties!.find(x=>x.id===p.id)!.promptTemplates?.reverse,'Мой вопрос');
 const noTemplates=parseV3({schemaVersion:3,name:'Штаты',entities:[],properties:[{name:p.name,valueType:'date'}]});
 assert.equal(buildImportPlan(noTemplates,current).bundle.properties!.find(x=>x.id===p.id)!.promptTemplates?.reverse,'Мой вопрос');
});
test('pack reverse wording takes priority; standard presidential wording precedes the generic fallback',()=>{
 const p={id:'presidency_start',name:'Вступление в должность',valueKind:'date' as const,cardinality:'one' as const,learnable:true};
 assert.equal(questionPrompt(p,'1961','choice','reverse'),'Какой президент вступил в должность в этом году?');
 assert.equal(questionPrompt({...p,promptTemplates:{reverse:'Вопрос из пакета'}},'1961','choice','reverse'),'Вопрос из пакета');
 assert.match(questionPrompt({...p,id:'custom'},'1961','choice','reverse'),/Какому объекту/);
});
