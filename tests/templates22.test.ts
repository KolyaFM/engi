import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {ZipWriter,BlobWriter,TextReader,configure} from '@zip.js/zip.js';
import {EngiDB} from '../src/db/engi-db';
import {emptyBundle,getBundle} from '../src/db/repositories';
import {saveProperty} from '../src/services/knowledge-service';
import {importPack} from '../src/services/pack-service';
import {exportBackup,restoreBackup} from '../src/services/backup-service';
import {propertySchema,validateImport} from '../src/lib/engi/validate';
import type {PropertyDefinition} from '../src/lib/engi/types';

const property=(id='birth_date',name='Дата рождения'):PropertyDefinition=>({id,name,valueKind:'date',cardinality:'one',learnable:true});
const custom:PropertyDefinition={...property('director','Режиссёр'),valueKind:'entity',origin:'user',promptTemplates:{forward:'Кто снял фильм «{subject}»?',reverse:'Какой фильм снял {subject}?',timeline:'Когда вышел фильм «{subject}»?',sort:'Расположите фильмы по дате выхода.'}};

test('import validation preserves all custom question templates',()=>{
 const b={...emptyBundle(),properties:[custom]};
 assert.deepEqual(validateImport(JSON.parse(JSON.stringify(b)),emptyBundle()).properties![0].promptTemplates,custom.promptTemplates);
});

test('templates must be bounded plain strings with recognized placeholders',()=>{
 for(const forward of [42,'x'.repeat(1001),'   ','Когда {answer}?','Когда {subject','<script>alert(1)</script>'])assert.equal(propertySchema.safeParse({...custom,promptTemplates:{forward}}).success,false,String(forward));
 assert.equal(propertySchema.safeParse({...custom,promptTemplates:{forward:'Где {subject}?'}}).success,true);
 assert.equal(propertySchema.safeParse({...custom,promptTemplates:{forward:'Кто автор?',unknown:'x'}}).success,false);
 assert.equal(propertySchema.safeParse({...custom,promptTemplates:{forward:'x'.repeat(1000)}}).success,true);
});

test('built-in and overridden prompts identify the actual property and subject',async()=>{
 const {questionPrompt}=await import('../src/lib/engi/questions/question-templates');
 assert.equal(questionPrompt(property(),'Джон Кеннеди','choice'),'Когда родился Джон Кеннеди?');
 assert.equal(questionPrompt(property('presidency_start'),'Джон Кеннеди','timeline'),'Когда Джон Кеннеди стал президентом?');
 assert.equal(questionPrompt(property('presidency_end'),'Джон Кеннеди','choice'),'Когда закончилось президентство Джон Кеннеди?');
 assert.equal(questionPrompt({...property(),promptTemplates:{forward:'В каком году родился {subject}?'}},'Джон Кеннеди','timeline'),'В каком году родился Джон Кеннеди?');
 assert.equal(questionPrompt(custom,'Психо','choice'),'Кто снял фильм «Психо»?');
 assert.equal(questionPrompt({...custom,promptTemplates:{forward:'{subject}, снова {subject}'}},'$&','recall_reveal'),'$&, снова $&');
 assert.match(questionPrompt(property('custom.date','Дата премьеры'),'Психо','choice'),/Дата премьеры.*Психо/);
 assert.notEqual(questionPrompt(undefined,'Объект','timeline'),'Когда это произошло?');
});

test('group sort and missing instructions refer to the sequence rather than one subject date',async()=>{
 const {questionPrompt}=await import('../src/lib/engi/questions/question-templates');
 for(const format of ['sort','missing'] as const){const prompt=questionPrompt(property(),'Джон Кеннеди',format);assert.match(prompt,/располож|поряд|пропущ|последоват/i);assert.doesNotMatch(prompt,/Когда родился|Джон Кеннеди/)}
 assert.equal(questionPrompt(custom,'Психо','sort'),'Расположите фильмы по дате выхода.');
});

test('reverse requires explicit enablement and a dedicated existing prompt',async()=>{
 const {questionPrompt,reversePromptAvailable}=await import('../src/lib/engi/questions/question-templates');
 assert.equal(reversePromptAvailable(custom),false);
 assert.equal(reversePromptAvailable({...custom,learning:{reverse:true}}),true);
 assert.equal(reversePromptAvailable({...custom,inverse:{enabled:true}}),true);
 assert.equal(reversePromptAvailable({...property(),learning:{reverse:true}}),false);
 assert.equal(reversePromptAvailable({...custom,learning:{reverse:false},inverse:{enabled:true}}),false);
 assert.equal(questionPrompt({...custom,learning:{reverse:true}},'Альфред Хичкок','choice','reverse'),'Какой фильм снял Альфред Хичкок?');
});

test('pack import and backup restore retain templates without source changes',async()=>{
 configure({useWebWorkers:false});
 const d=new EngiDB('templates-pack-'+crypto.randomUUID()),target=new EngiDB('templates-backup-'+crypto.randomUUID());
 try{
  const writer=new ZipWriter(new BlobWriter());
  await writer.add('manifest.json',new TextReader(JSON.stringify({format:'engi-pack',schemaVersion:2,packId:'questions',packVersion:1,name:'Вопросы',createdAt:new Date().toISOString(),files:[]})));
  await writer.add('bundle.json',new TextReader(JSON.stringify({...emptyBundle(),properties:[custom]})));
  await importPack(await writer.close(),()=>{},d);
  assert.deepEqual((await getBundle(d)).properties!.find(p=>p.id==='director')!.promptTemplates,custom.promptTemplates);
  await saveProperty({...custom,promptTemplates:{...custom.promptTemplates,forward:'Кто режиссёр фильма «{subject}»?'}},d);
  const backup=JSON.parse(JSON.stringify(await exportBackup(d)));
  await restoreBackup(backup,target);
  assert.equal((await target.propertyDefinitions.get('director'))!.promptTemplates!.forward,'Кто режиссёр фильма «{subject}»?');
 }finally{d.close();target.close();await d.delete();await target.delete()}
});
