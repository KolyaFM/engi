import 'fake-indexeddb/auto';
import {test,mock} from 'node:test';
import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {simulateLiveStudy,type LiveScenario} from './live-study-simulation';
test('live 21-day service simulations preserve schedules, new budgets, errors, disclosures and restart accounting',async()=>{
 mock.timers.enable({apis:['Date'],now:new Date(2026,9,8,10).getTime()});
 const results:Awaited<ReturnType<typeof simulateLiveStudy>>[]=[];
 try{
  const scenarios:LiveScenario[]=[1,17].flatMap(seed=>(['steady','errors','short'] as const).map((profile,i)=>({seed,profile,days:21,size:16,limit:[3,7,3][i],format:i===0?'mixed':i===1?'choice':'recall_reveal'})));
  scenarios.push({seed:29,profile:'short',days:7,size:16,limit:0,format:'mixed'});
  scenarios.push({seed:31,profile:'steady',days:21,size:64,limit:7,format:'mixed'});
  for(const scenario of scenarios){const result=await simulateLiveStudy(scenario,at=>mock.timers.setTime(at));results.push(result);if(scenario.limit>0)assert(result.credited>0);console.log(`Live model: ${scenario.profile}/${scenario.seed}, ${result.screens} tasks, ${result.credited} independent checks, ${result.repairs} repairs`);}
  await mkdir(new URL('../artifacts/',import.meta.url),{recursive:true});await writeFile(new URL('../artifacts/live-study-simulation.json',import.meta.url),JSON.stringify({model:'Production trainer/IndexedDB + FSRS, deterministic virtual clock. Synthetic answers, not measured human retention.',results},null,2));
  const total=(key:'screens'|'credited'|'repairs'|'restarts')=>results.reduce((n,r)=>n+r[key],0);
  const rows=results.map(r=>`| ${r.profile} / ${r.seed} | ${r.days} | ${r.limit} | ${r.screens} | ${r.credited} | ${r.repairs} | ${r.repeatedLearningObjects} | ${r.remainingErrors} |`).join('\n');
  assert(results.every(r=>r.avoidableLearningRepeats===0),'learning repeated an object while an admissible alternative was available');
  await writeFile(new URL('../artifacts/live-study-simulation.md',import.meta.url),`# Проверка живой ленты обучения\n\nПрогон реального trainer service с IndexedDB, виртуальными днями и FSRS, без подмены планировщика. Ответы синтетические; оценка памяти вычисляется FSRS, это не измерение памяти человека.\n\n${results.reduce((n,r)=>n+r.days,0)} модельных дней; ${total('screens')} заданий; ${total('credited')} самостоятельных проверок; ${total('repairs')} заданий разбора; ${total('restarts')} восстановлений занятия.\n\n| Сценарий / seed | Дни | Лимит | Задания | Проверки | Разбор | Повторы объекта в обучении | Открытые ошибки |\n| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |\n${rows}\n\n## Проверяемые инварианты\n\n- Плановая проверка не происходит раньше срока FSRS.\n- Разбор ошибки не изменяет память FSRS и дневной лимит нового.\n- Повторная отправка ответа не изменяет память повторно.\n- Подсказка не получает самостоятельный зачёт.\n- Лента не завершается с доступными ошибками. Короткий визит может быть прерван пользователем до завершения.\n- Сумма самостоятельных попыток в памяти равна зачтённым ответам; новое не превышает лимит и не дублирует ID.\n- Показ вопроса, ответа, найденных пар и закрытие прошлых показов выполняются через производственный сервис.\n\n## Единицы учёта\n\nЗадание, проверяемое знание и правильный ответ — разные величины. Сопоставление из двух пар даёт одну самостоятельную проверку: последняя пара получается исключением. Полный набор значений считается одним составным знанием. Исправление первого неверного ответа не становится новой самостоятельной попыткой.\n\nJSON содержит показатели по дням, форматам и вероятности вспоминания FSRS. Повтор объекта при разборе единственной ошибки допустим; число таких возвратов не означает повторный зачёт обучения.\n`);
 }finally{mock.timers.reset();}
});
