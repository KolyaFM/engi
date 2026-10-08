/** Internal identities only. These definitions never belong in a .engi pack. */
export type GoalDefinition = {
  knowledge: { kind: 'fact' | 'complete-set' | 'identity' | 'order-relation'; key: string };
  skill: 'recognition' | 'recall';
  direction: 'forward' | 'reverse';
  cueRole: string;
  precision: string;
  revision: string;
};
export type LearningGoal = GoalDefinition & { id: string; semanticKey: string };
const encode = (fields: string[]) => JSON.stringify(fields);
export function defineGoal(definition: GoalDefinition): LearningGoal {
  const fields = [definition.knowledge.kind, definition.knowledge.key, definition.skill,
    definition.direction, definition.cueRole, definition.precision];
  if ([...fields, definition.revision].some(field => !field.trim())) throw Error('Incomplete goal definition');
  const semanticKey = encode(fields);
  return { ...structuredClone(definition), semanticKey, id: `goal:${encode([...fields, definition.revision])}` };
}
