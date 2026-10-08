import {simulateSelector,selectorScenarios} from '../tests/goal-selector-simulation.ts';
process.stdout.write(JSON.stringify({days:12,stepSeconds:15,seeds:[0,1,2],results:selectorScenarios.flatMap(s=>[0,1,2].flatMap(seed=>['current','variety','limited','priority','guarded','struggling','balanced'].map(p=>simulateSelector({...s,seed},p))))},null,2)+'\n');
