import {simulateSelector,selectorScenarios} from '../tests/goal-selector-simulation.ts';
const results=selectorScenarios.flatMap(s=>['previous','fixed','current'].map(policy=>simulateSelector(s,policy)));
process.stdout.write(JSON.stringify({days:12,stepSeconds:15,results},null,2)+'\n');
