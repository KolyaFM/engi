import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EngiDB} from '../src/db/engi-db';
import {saveKnowledge, saveTag, archiveTag, attachEntityTag, detachEntityTag} from '../src/services/knowledge-service';
import {
  getDeckList,
  getDeckEntities,
  getDeckTypes,
  filterDeckEntities,
  progressForEntities,
  UNTAGGED_TAG_ID,
} from '../src/lib/engi/knowledge/decks';
import {canonicalTargets} from '../src/lib/engi/questions/recipe-factory';
import {triagedMemory} from '../src/lib/engi/learning/bootstrap';
import {learningRow} from '../src/db/repositories';
import type {Bundle, Snapshot} from '../src/lib/engi/types';

function fixtureBundle(): Bundle {
  return {
    entities: [
      {id: 'e1', type: 'person', name: 'Персона 1', aliases: [], externalIds: {}},
      {id: 'e2', type: 'person', name: 'Персона 2', aliases: [], externalIds: {}},
      {id: 'e3', type: 'artwork', name: 'Картина 1', aliases: [], externalIds: {}},
    ],
    facts: [],
    media: [],
    tags: [
      {id: 'deck-1', name: 'Колода 1'},
    ],
    entityTags: [
      {entityId: 'e1', tagId: 'deck-1'},
    ],
    properties: [],
    entityTypes: [
      {id: 'person', name: 'Человек'},
      {id: 'artwork', name: 'Картина'},
    ],
    missing: [],
    unresolved: [],
  };
}

test('deck integration: tag creation, entity assignment and untagged inbox separation', async () => {
  const d = new EngiDB('deck-integration-' + crypto.randomUUID());
  try {
    await saveKnowledge(fixtureBundle(), d);

    // Initial state: 1 tagged deck, 2 untagged entities
    const b1: Bundle = await d.transaction('r', [d.entities, d.facts, d.tags, d.entityTags, d.media, d.propertyDefinitions, d.entityTypes], async () => {
      return {
        ...fixtureBundle(),
        entities: await d.entities.toArray(),
        tags: await d.tags.toArray(),
        entityTags: await d.entityTags.toArray(),
      };
    });
    const s1: Snapshot = {bundle: b1, memories: [], events: []};
    const decks1 = getDeckList(s1);
    assert.equal(decks1.length, 2);
    assert.equal(decks1.find(d => d.id === 'deck-1')?.entityCount, 1);
    assert.equal(decks1.find(d => d.id === UNTAGGED_TAG_ID)?.entityCount, 2);

    // Create a new deck
    await saveTag({id: 'deck-2', name: 'Колода 2'}, d);
    // Move e2 into deck-2
    await attachEntityTag('e2', 'deck-2', d);

    const b2: Bundle = await d.transaction('r', [d.entities, d.facts, d.tags, d.entityTags, d.media, d.propertyDefinitions, d.entityTypes], async () => {
      return {
        ...fixtureBundle(),
        entities: await d.entities.toArray(),
        tags: await d.tags.toArray(),
        entityTags: await d.entityTags.toArray(),
      };
    });
    const s2: Snapshot = {bundle: b2, memories: [], events: []};
    const decks2 = getDeckList(s2);
    assert.equal(decks2.length, 3);
    assert.equal(decks2.find(d => d.id === 'deck-2')?.entityCount, 1);
    assert.equal(decks2.find(d => d.id === UNTAGGED_TAG_ID)?.entityCount, 1);

    // Remove e1 from deck-1
    await detachEntityTag('e1', 'deck-1', d);
    const b3: Bundle = await d.transaction('r', [d.entities, d.facts, d.tags, d.entityTags], async () => {
      return {
        ...fixtureBundle(),
        entities: await d.entities.toArray(),
        tags: await d.tags.toArray(),
        entityTags: await d.entityTags.toArray(),
      };
    });
    const deck1Entities = getDeckEntities(b3, 'deck-1');
    assert.equal(deck1Entities.length, 0);

    // Archive deck-2
    await archiveTag('deck-2', d);
    const b4: Bundle = await d.transaction('r', [d.entities, d.facts, d.tags, d.entityTags], async () => {
      return {
        ...fixtureBundle(),
        entities: await d.entities.toArray(),
        tags: await d.tags.toArray(),
        entityTags: await d.entityTags.toArray(),
      };
    });
    const s4: Snapshot = {bundle: b4, memories: [], events: []};
    const decks4 = getDeckList(s4);
    assert.equal(decks4.some(d => d.id === 'deck-2'), false);
    // All 3 entities should now be untagged
    assert.equal(decks4.find(d => d.id === UNTAGGED_TAG_ID)?.entityCount, 3);
  } finally {
    d.close();
    await d.delete();
  }
});

function fullFixture(): Bundle {
  return {
    entities: [
      {id: 'p1', type: 'person', name: 'Клод Моне', aliases: ['Моне'], externalIds: {}},
      {id: 'p2', type: 'person', name: 'Джордж Вашингтон', aliases: ['Вашингтон'], externalIds: {}},
      {id: 'p3', type: 'person', name: 'Джон Адамс', aliases: ['Адамс'], externalIds: {}},
      {id: 'u1', type: 'person', name: 'Неразобранный деятель', aliases: [], externalIds: {}},
    ],
    facts: [
      {id: 'f1', entityId: 'p1', key: 'custom_party_text', valueKind: 'text', valueText: 'Либерал', verification: 'verified', source: {name: 'test',kind:'manual'}},
      {id: 'f2', entityId: 'p2', key: 'presidency_start', valueKind: 'date', dateStart: '1789-01-01', dateEnd: '1789-12-31', datePrecision: 'year', verification: 'verified', source: {name: 'test',kind:'manual'}},
      {id: 'f3', entityId: 'p3', key: 'presidency_start', valueKind: 'date', dateStart: '1797-01-01', dateEnd: '1797-12-31', datePrecision: 'year', verification: 'verified', source: {name: 'test',kind:'manual'}},
      {id: 'f4', entityId: 'u1', key: 'custom_party_text', valueKind: 'text', valueText: 'Независимый', verification: 'verified', source: {name: 'test',kind:'manual'}},
    ],
    media: [
      {id: 'm1', entityId: 'p1', role: 'portrait', url: 'engi-media://ca0df2c95aa144c1d0ff2ff3c8f967fdc1de9ef0c4120b3726416701b519d619', sourceUrl:'https://example.org/image', license: 'cc'},
      {id: 'm2', entityId: 'p2', role: 'portrait', url: 'engi-media://29c1b289e7522195b362e44f54e05470b69ad20540ab60a18a05e5bf6951f13d', sourceUrl:'https://example.org/image', license: 'cc'},
      {id: 'm3', entityId: 'p3', role: 'portrait', url: 'engi-media://153812ae5fea0b73a011bf28bd7cea93644437c3fe3260b7b2d7e1e2f9f46bde', sourceUrl:'https://example.org/image', license: 'cc'},
    ],
    tags: [
      {id: 'parent-art', name: 'Искусство'},
      {id: 'deck-art', name: 'Живопись', parentId: 'parent-art'},
      {id: 'deck-presidents', name: 'Президенты США'},
    ],
    entityTags: [
      {entityId: 'p1', tagId: 'deck-art'},
      {entityId: 'p2', tagId: 'deck-presidents'},
      {entityId: 'p3', tagId: 'deck-presidents'},
    ],
    properties: [
      {id: 'custom_party_text', name: 'Партия (текст)', valueKind: 'text', cardinality: 'one', learnable: true, learning: {choice: 'on',recallReveal:'on'}},
      {id: 'presidency_start', name: 'Начало президентства', valueKind: 'date', cardinality: 'one', learnable: true, learning: {choice: 'on'}},
    ],
    entityTypes: [
      {id: 'person', name: 'Человек'},
    ],
    missing: [],
    unresolved: [],
  };
}

test('deck integration: parent-child hierarchy populates childTagIds in deck catalog', () => {
  const b = fullFixture();
  const s: Snapshot = {bundle: b, memories: [], events: []};
  const decks = getDeckList(s);
  const parentArt = decks.find(d => d.id === 'parent-art');
  assert(parentArt);
  assert.deepEqual(parentArt.childTagIds, ['deck-art']);
  const childDeck = decks.find(d => d.id === 'deck-art');
  assert(childDeck);
  assert.equal(childDeck.parentId, 'parent-art');
});

test('deck integration: per-deck and untagged metrics isolation', () => {
  const b = fullFixture();
  const presTargets = canonicalTargets(b, 'deck-presidents');
  assert.equal(presTargets.length, 4);
  assert(presTargets.every(t => t.entityId === 'p2' || t.entityId === 'p3'));

  const artTargets = canonicalTargets(b, 'deck-art');
  assert.equal(artTargets.length, 2);
  assert.equal(artTargets[0].entityId === 'p1', true);

  const untagged = getDeckEntities(b, UNTAGGED_TAG_ID);
  assert.equal(untagged.length, 1);
  assert.equal(untagged[0].id, 'u1');

  const s: Snapshot = {bundle: b, memories: [], events: []};
  const untaggedStats = progressForEntities(s, new Set(['u1']));
  assert.equal(untaggedStats.available, 1);
  assert.equal(untaggedStats.covered, 0);
  assert.equal(untaggedStats.new, 1);
});

test('deck integration: multi-deck entity assignment maintains single memory state in database', async () => {
  const d = new EngiDB('deck-multi-' + crypto.randomUUID());
  try {
    await saveKnowledge(fullFixture(), d);

    // Assign p1 to both deck-art and deck-presidents
    await attachEntityTag('p1', 'deck-presidents', d);

    const b = await d.transaction('r', [d.entities, d.facts, d.tags, d.entityTags, d.propertyDefinitions, d.entityTypes], async () => {
      return {
        ...fullFixture(),
        entities: await d.entities.toArray(),
        tags: await d.tags.toArray(),
        entityTags: await d.entityTags.toArray(),
      };
    });

    const artEntities = getDeckEntities(b, 'deck-art');
    const presEntities = getDeckEntities(b, 'deck-presidents');
    assert(artEntities.some(e => e.id === 'p1'));
    assert(presEntities.some(e => e.id === 'p1'));

    const unitId = 'ku:fact:f1:forward';
    const item = canonicalTargets(b, 'all').find(i => i.targetId === unitId)!;
    const mem = triagedMemory(item, 'green', 'test-session', 0);
    await d.learningState.put(learningRow(mem));

    const s: Snapshot = {
      bundle: b,
      memories: [(await d.learningState.get(unitId))!.payload],
      events: [],
    };
    const decks = getDeckList(s);
    const artDeck = decks.find(dk => dk.id === 'deck-art')!;
    assert.equal(artDeck.stats.covered, 0);
    assert.equal(artDeck.stats.new, 1);
  } finally {
    d.close();
    await d.delete();
  }
});

test('deck integration: search and category type filtering inside deck view', () => {
  const b = fullFixture();
  const presEntities = getDeckEntities(b, 'deck-presidents');
  assert.equal(presEntities.length, 2);

  const searched = filterDeckEntities(presEntities, b, 'Адамс', 'all');
  assert.equal(searched.length, 1);
  assert.equal(searched[0].id, 'p3');

  const types = getDeckTypes(presEntities, b);
  assert.equal(types.length, 1);
  assert.equal(types[0].id, 'person');
});