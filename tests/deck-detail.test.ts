import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
  getEntityMasterySummary,
  getDeckEntities,
  getDeckTypes,
  filterDeckEntities,
  UNTAGGED_TAG_ID,
} from '../src/lib/engi/knowledge/decks';
import type {Bundle, Snapshot} from '../src/lib/engi/types';

function fixture(): Snapshot {
  const b: Bundle = {
    entities: [
      {id: 'p1', type: 'person', name: 'Клод Моне', aliases: ['Моне'], externalIds: {}},
      {id: 'p2', type: 'person', name: 'Огюст Ренуар', aliases: [], externalIds: {}},
      {id: 'a1', type: 'artwork', name: 'Кувшинки', aliases: [], externalIds: {}},
      {id: 'un1', type: 'event', name: 'Парижский салон', aliases: [], externalIds: {}},
    ],
    facts: [
      {id: 'f1', entityId: 'a1', key: 'created_by', valueKind: 'entity', valueEntityId: 'p1', verification: 'verified', source: {name: 'test'}},
    ],
    media: [
      {id: 'm1', entityId: 'p1', role: 'portrait', url: 'engi-media://p1', license: 'cc'},
    ],
    tags: [
      {id: 'tag-art', name: 'Импрессионизм'},
    ],
    entityTags: [
      {entityId: 'p1', tagId: 'tag-art'},
      {entityId: 'p2', tagId: 'tag-art'},
      {entityId: 'a1', tagId: 'tag-art'},
    ],
    properties: [
      {id: 'created_by', name: 'Автор', valueKind: 'entity', cardinality: 'one', learnable: true},
    ],
    entityTypes: [
      {id: 'person', name: 'Художник'},
      {id: 'artwork', name: 'Картина'},
      {id: 'event', name: 'Событие'},
    ],
    missing: [],
    unresolved: [],
  };

  return {
    bundle: b,
    memories: [
      {
        id: 'ku:fact:f1:forward',
        card: {stability: 45, due: new Date(Date.now() + 86400000).toISOString()},
        attempts: 3,
        correct: 3,
        confusions: {},
        firstSuccessAt: new Date().toISOString(),
        status: 'review',
      },
    ],
    events: [],
  };
}

test('getEntityMasterySummary accurately classifies unseen vs active memory', () => {
  const s = fixture();
  const unseenSummary = getEntityMasterySummary('p2', s);
  assert.equal(unseenSummary.color, 'unseen');
  assert.equal(unseenSummary.mark, '⚪');

  const artworkSummary = getEntityMasterySummary('a1', s);
  assert.equal(artworkSummary.color, 'green');
  assert.equal(artworkSummary.mark, '🟢');
  assert.equal(artworkSummary.label, 'Закреплено');
});

test('getDeckEntities distinguishes tagged deck items from untagged inbox items', () => {
  const s = fixture();
  const artEntities = getDeckEntities(s.bundle, 'tag-art');
  assert.equal(artEntities.length, 3);
  assert.deepEqual(artEntities.map(e => e.id).sort(), ['a1', 'p1', 'p2']);

  const untagged = getDeckEntities(s.bundle, UNTAGGED_TAG_ID);
  assert.equal(untagged.length, 1);
  assert.equal(untagged[0].id, 'un1');
});

test('getDeckTypes lists types specifically present in the provided entity collection', () => {
  const s = fixture();
  const artEntities = getDeckEntities(s.bundle, 'tag-art');
  const deckTypes = getDeckTypes(artEntities, s.bundle);
  assert.equal(deckTypes.length, 2);
  assert.deepEqual(deckTypes.map(t => t.name).sort(), ['Картина', 'Художник']);
});

test('filterDeckEntities filters by combined text and category type', () => {
  const s = fixture();
  const artEntities = getDeckEntities(s.bundle, 'tag-art');

  const filteredByType = filterDeckEntities(artEntities, s.bundle, '', 'artwork');
  assert.equal(filteredByType.length, 1);
  assert.equal(filteredByType[0].id, 'a1');

  const filteredByName = filterDeckEntities(artEntities, s.bundle, 'Моне', 'all');
  assert.equal(filteredByName.length, 1);
  assert.equal(filteredByName[0].id, 'p1');
});

test('child tags of parent deck are accurately resolved for hierarchical navigation', () => {
  const b: Bundle = {
    entities: [
      {id: 'e1', type: 'person', name: 'Эйнштейн', aliases: [], externalIds: {}},
      {id: 'e2', type: 'person', name: 'Пастернак', aliases: [], externalIds: {}},
    ],
    facts: [],
    media: [],
    tags: [
      {id: 'nobel', name: 'Нобелевские лауреаты'},
      {id: 'nobel-physics', name: 'Физика', parentId: 'nobel'},
      {id: 'nobel-lit', name: 'Литература', parentId: 'nobel'},
    ],
    entityTags: [
      {entityId: 'e1', tagId: 'nobel-physics'},
      {entityId: 'e2', tagId: 'nobel-lit'},
    ],
    properties: [],
    entityTypes: [{id: 'person', name: 'Человек'}],
    missing: [],
    unresolved: [],
  };

  const childTags = b.tags.filter(t => !t.archived && t.parentId === 'nobel');
  assert.equal(childTags.length, 2);
  assert.deepEqual(childTags.map(t => t.name).sort(), ['Литература', 'Физика']);
});