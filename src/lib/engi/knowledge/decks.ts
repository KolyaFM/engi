import type {Bundle, Entity, Snapshot} from '../types';
import {indexes} from '../indexes';
import {progress} from './progress';
import {canonicalTargets} from '../questions/recipe-factory';
import {retention} from '../engine';
import {entityTypes} from './properties';

export const UNTAGGED_TAG_ID = '__untagged__';

export type DeckStats = {
  total: number;
  available: number;
  new: number;
  suspended: number;
  covered: number;
  retention: number | null;
  due: number;
};

export type DeckCategory = 'in_progress' | 'completed' | 'unlearned';

export type DeckInfo = {
  id: string;
  name: string;
  isUntagged: boolean;
  parentId?: string;
  childTagIds: string[];
  entityCount: number;
  learnedEntityCount: number;
  startedEntityCount: number;
  category: DeckCategory;
  sampleImages: string[];
  stats: DeckStats;
};

export function getUntaggedEntities(bundle: Bundle): Entity[] {
  if(bundle.decks){const activeIds=new Set(bundle.decks.filter(d=>!d.archived).map(d=>d.id));const members=new Set((bundle.deckMembers??[]).filter(m=>!m.archived&&activeIds.has(m.deckId)).map(m=>m.entityId));return bundle.entities.filter(e=>!e.archived&&!members.has(e.id));}
  const activeTagIds = new Set(bundle.tags.filter(t => !t.archived).map(t => t.id));
  const taggedEntityIds = new Set(
    bundle.entityTags
      .filter(et => !et.archived && activeTagIds.has(et.tagId))
      .map(et => et.entityId)
  );
  return bundle.entities.filter(e => !e.archived && !taggedEntityIds.has(e.id));
}

export function getDeckSampleImages(bundle: Bundle, entityIds: string[], limit = 3): string[] {
  const ix = indexes(bundle);
  const images: string[] = [];
  for (const id of entityIds) {
    if (images.length >= limit) break;
    const list = ix.mediaByEntity.get(id) ?? [];
    const valid = list.find(m => !m.archived && m.learningExemplar !== false && m.url);
    if (valid && !images.includes(valid.url)) {
      images.push(valid.url);
    }
  }
  if (images.length < limit) {
    for (const id of entityIds) {
      if (images.length >= limit) break;
      const list = ix.mediaByEntity.get(id) ?? [];
      for (const m of list) {
        if (images.length >= limit) break;
        if (!m.archived && m.learningExemplar !== false && m.url && !images.includes(m.url)) {
          images.push(m.url);
        }
      }
    }
  }
  return images;
}

export function progressForEntities(s: Snapshot, entityIds: Set<string>): DeckStats {
  const allUnits = canonicalTargets(s.bundle, 'all');
  const units = allUnits.filter(u => entityIds.has(u.entityId));
  const ids = new Set(units.map(i => i.targetId));
  const all = s.memories.filter(m => !m.legacyOf && ids.has(m.id));
  const mem = all.filter(m => m.status !== 'suspended');
  const covered = mem.filter(m => m.attempts > 0);
  const known = new Set(all.map(m => m.id));
  return {
    total: mem.length,
    available: units.length,
    new: units.filter(i => !known.has(i.targetId)).length,
    suspended: all.filter(m => m.status === 'suspended').length,
    covered: covered.length,
    retention: covered.length ? Math.round(covered.reduce((n, m) => n + retention(m), 0) / covered.length * 100) : null,
    due: mem.filter(m => new Date(m.card.due).getTime() <= Date.now()).length,
  };
}

export function getDeckList(s: Snapshot): DeckInfo[] {
  const b = s.bundle;
  const ix = indexes(b);
  const activeTags = (b.decks??b.tags).filter(t => !t.archived);

  const childrenMap = new Map<string, string[]>();
  for (const t of activeTags) {
    if (t.parentId) {
      const arr = childrenMap.get(t.parentId) ?? [];
      arr.push(t.id);
      childrenMap.set(t.parentId, arr);
    }
  }

  const decks: DeckInfo[] = activeTags.map(tag => {
    const memberEntities = ix.entitiesByScope.get(tag.id) ?? [];
    const entityIds = memberEntities.map(e => e.id);
    const p = progress(s, tag.id);
    const counts = calculateDeckEntityCounts(entityIds, s,tag.id);
    return {
      id: tag.id,
      name: tag.name,
      isUntagged: false,
      parentId: tag.parentId,
      childTagIds: childrenMap.get(tag.id) ?? [],
      entityCount: memberEntities.length,
      learnedEntityCount: counts.learnedCount,
      startedEntityCount: counts.startedCount,
      category: counts.category,
      sampleImages: getDeckSampleImages(b, entityIds, 3),
      stats: {
        total: p.total,
        available: p.available,
        new: p.new,
        suspended: p.suspended,
        covered: p.covered,
        retention: p.retention,
        due: p.due,
      },
    };
  });

  const untagged = getUntaggedEntities(b);
  if (untagged.length > 0) {
    const untaggedIds = untagged.map(e => e.id);
    const p = progressForEntities(s, new Set(untaggedIds));
    const counts = calculateDeckEntityCounts(untaggedIds, s,UNTAGGED_TAG_ID);
    decks.push({
      id: UNTAGGED_TAG_ID,
      name: 'Неразобранное',
      isUntagged: true,
      childTagIds: [],
      entityCount: untagged.length,
      learnedEntityCount: counts.learnedCount,
      startedEntityCount: counts.startedCount,
      category: counts.category,
      sampleImages: getDeckSampleImages(b, untaggedIds, 3),
      stats: p,
    });
  }

  return decks;
}

export function getDeckEntities(bundle: Bundle, deckId: string): Entity[] {
  if (deckId === UNTAGGED_TAG_ID) {
    return getUntaggedEntities(bundle);
  }
  const ix = indexes(bundle);
  return ix.entitiesByScope.get(deckId) ?? [];
}

export function getDeckTypes(entities: Entity[], bundle: Bundle): { id: string; name: string }[] {
  const allTypes = entityTypes(bundle);
  const typeMap = new Map(allTypes.map(t => [t.id, t.name]));
  const seenTypes = new Set(entities.map(e => e.type));
  return [...seenTypes].map(id => ({
    id,
    name: typeMap.get(id) ?? id,
  }));
}

export function filterDeckEntities(
  entities: Entity[],
  bundle: Bundle,
  query: string,
  typeFilter = 'all'
): Entity[] {
  const ix = indexes(bundle);
  const q = query.trim().toLowerCase().replace(/ё/g, 'е');
  return entities.filter(e => {
    if (typeFilter !== 'all' && e.type !== typeFilter) return false;
    if (!q) return true;
    const searchString = ix.searchByEntity.get(e.id);
    if (searchString && searchString.includes(q)) return true;
    return [e.name, ...(e.aliases ?? [])].some(n =>
      n.toLowerCase().replace(/ё/g, 'е').includes(q)
    );
  });
}

export type EntityMasterySummary = {
  color: 'unseen' | 'red' | 'orange' | 'yellow' | 'green' | 'suspended';
  mark: string;
  label: string;
};

export function getEntityLearningStatus(entityId: string, snapshot: Snapshot,scope='all'): 'learned' | 'in_progress' | 'unlearned' {
  const b = snapshot.bundle;
  const units=canonicalTargets(b,scope).filter(i=>i.factId?b.facts.find(f=>f.id===i.factId)?.entityId===entityId:i.entityId===entityId);
  const eligibleIds=new Set(units.map(i=>i.targetId));
  const entityFactIds = new Set(b.facts.filter(f => f.entityId === entityId && !f.archived).map(f => f.id));
  const memories = snapshot.memories.filter(m => {
    if (m.legacyOf||!eligibleIds.has(m.id)) return false;
    if (m.id.startsWith(`ku:entity:${entityId}:`)) return true;
    for (const factId of entityFactIds) {
      if (m.id.startsWith(`ku:fact:${factId}:`)) return true;
    }
    return false;
  });

  if (memories.length === 0) return 'unlearned';

  const active = memories.filter(m => m.status !== 'suspended');
  if (active.length === 0) return 'unlearned';

  const allLearned = units.length>0&&units.every(i=>memories.some(m=>m.id===i.targetId))&&active.every(
    m => (m.attempts ?? 0) > 0 && !!m.firstSuccessAt && m.lastOutcome !== false && (m.card?.stability ?? 0) >= 7
  );
  if (allLearned) return 'learned';

  const anyStarted = active.some(
    m => (m.attempts ?? 0) > 0 || m.status === 'learning' || m.status === 'triaged' || m.lastOutcome !== undefined
  );
  if (anyStarted) return 'in_progress';

  return 'unlearned';
}

export function calculateDeckEntityCounts(entityIds: string[], snapshot: Snapshot,scope='all'): {
  learnedCount: number;
  startedCount: number;
  category: DeckCategory;
} {
  let learnedCount = 0;
  let startedCount = 0;
  for (const id of entityIds) {
    const status = getEntityLearningStatus(id, snapshot,scope);
    if (status === 'learned') {
      learnedCount++;
      startedCount++;
    } else if (status === 'in_progress') {
      startedCount++;
    }
  }

  let category: DeckCategory = 'unlearned';
  if (entityIds.length > 0 && learnedCount === entityIds.length) {
    category = 'completed';
  } else if (startedCount > 0 || learnedCount > 0) {
    category = 'in_progress';
  } else {
    category = 'unlearned';
  }

  return {learnedCount, startedCount, category};
}

export function getEntityMasterySummary(entityId: string, snapshot: Snapshot): EntityMasterySummary {
  const b = snapshot.bundle;
  const entityFactIds = new Set(b.facts.filter(f => f.entityId === entityId && !f.archived).map(f => f.id));
  const memories = snapshot.memories.filter(m => {
    if (m.legacyOf) return false;
    if (m.id.startsWith(`ku:entity:${entityId}:`)) return true;
    for (const factId of entityFactIds) {
      if (m.id.startsWith(`ku:fact:${factId}:`)) return true;
    }
    return false;
  });

  if (memories.length === 0) return {color: 'unseen', mark: '⚪', label: 'Не начато'};
  if (memories.every(m => m.status === 'suspended')) return {color: 'suspended', mark: '★', label: '★ Не учу'};

  const active = memories.filter(m => m.status !== 'suspended');
  if (active.some(m => m.lastOutcome === false || (!m.firstSuccessAt && m.attempts > 0))) {
    return {color: 'red', mark: '🔴', label: 'Ошибки'};
  }
  const now = Date.now();
  if (active.some(m => new Date(m.card.due).getTime() <= now)) {
    return {color: 'orange', mark: '⏳', label: 'Пора повторить'};
  }
  if (active.every(m => m.card.stability >= 30)) {
    return {color: 'green', mark: '🟢', label: 'Закреплено'};
  }
  if (active.some(m => m.card.stability >= 7)) {
    return {color: 'yellow', mark: '🟡', label: 'Помню'};
  }
  return {color: 'orange', mark: '🟠', label: 'Учусь'};
}