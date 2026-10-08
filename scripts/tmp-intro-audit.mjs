import {chromium} from 'playwright';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({headless:true,executablePath:process.env.ENGI_BROWSER_PATH});
const reports=[];
try{for(const count of [6,60,300]){const context=await browser.newContext({viewport:{width:393,height:852}}),page=await context.newPage();try{
 await page.goto('http://127.0.0.1:5175/engi/');await page.locator('.feed-home').waitFor();
 reports.push(await page.evaluate(async count=>{
  const {EngiDB}=await import('/engi/src/db/engi-db.ts'),{putBundle}=await import('/engi/src/db/repositories.ts'),{createTrainerService}=await import('/engi/src/services/trainer-service.ts'),{feedPerformance}=await import('/engi/src/services/feed-performance.ts');
  const d=new EngiDB('intro-audit-'+crypto.randomUUID()),b={entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[],entityTypes:[{id:'subject',name:'Объект'}],properties:[{id:'rel',name:'Свойство',valueKind:'entity',targetTypes:['subject'],cardinality:'one',learnable:true,subjectTypes:['subject']}]};
  for(let n=0;n<count;n++){b.entities.push({id:'s'+n,type:'subject',name:'Объект '+n,aliases:[],externalIds:{}});b.entities.push({id:'a'+n,type:'subject',name:'Значение '+n,aliases:[],externalIds:{}});b.facts.push({id:'f'+n,entityId:'s'+n,key:'rel',valueKind:'entity',valueEntityId:'a'+n,verification:'user_confirmed',source:{kind:'manual',name:'Test'}});}
  try{await putBundle(d,b);const svc=createTrainerService(d),samples=[];
   for(const color of ['green','red']){const {resetLearningProgress}=await import('/engi/src/services/learning-service.ts');await resetLearningProgress(d);let s=await svc.startGoalFeed('all','choice','daily',{endless:true});const owner=s.intro.entityId;feedPerformance.start();
    let t=performance.now();await svc.saveIntroSelections(s.id,Object.fromEntries(s.intro.unitIds.map(id=>[id,color])));const chooseMs=performance.now()-t;
    t=performance.now();s=await svc.completeIntro(s.id);const completeMs=performance.now()-t;
    const profile=feedPerformance.report();feedPerformance.stop();t=performance.now();const plan=await svc.getDayPlan('all','choice'),planMs=performance.now()-t;
    const ledger=(await d.appMeta.get('studyCore:learningLifecycle')).value,legacy=(await d.learningState.toArray()).filter(r=>r.payload.initialFamiliarity===color);
    samples.push({color,chooseMs,completeMs,planMs,units:ledger.units.filter(u=>u.entityId===owner).map(u=>({stage:u.stage,successes:u.successes})),legacyFamiliarity:legacy.map(r=>r.payload.initialFamiliarity),learning:plan.workload.learning,profile});
   }return {count,samples};
  }finally{d.close();await d.delete();}
 },count));console.log(JSON.stringify(reports.at(-1)));
 }finally{await context.close();}}writeFileSync('artifacts/intro-decision-audit.json',JSON.stringify(reports,null,2));}finally{await browser.close();}
