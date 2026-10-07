import 'fake-indexeddb/auto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
  getUntaggedEntities,
  getDeckSampleImages,
  getDeckList,
  getDeckEntities,
  getDeckTypes,
  filterDeckEntities,
  UNTAGGED_TAG_ID,
} from '../src/lib/engi/knowledge/decks';
import {EngiDB} from '../src/db/engi-db';
import {saveKnowledge, attachEntityTag, detachEntityTag, archiveTag} from '../src/services/knowledge-service';
import type {Bundle, Snapshot} from '../src/lib/engi/types';

function fixture(): Bundle {
  return {
    entities: [
      {id: 'e1', type: 'person', name: 'Джон Кеннеди', aliases: ['Кеннеди'], externalIds: {}},
      {id: 'e2', type: 'person', name: 'Джордж Вашингтон', aliases: ['Вашингтон'], externalIds: {}},
      {id: 'e3', type: 'artwork', name: 'Мона Лиза', aliases: ['Джоконда'], externalIds: {}},
      {id: 'e4', type: 'artwork', name: 'Звёздная ночь', aliases: [], externalIds: {}},
      {id: 'e5', type: 'event', name: 'Неразобранное событие', aliases: [], externalIds: {}},
    ],
    facts: [],
    media: [
      {id: 'm1', entityId: 'e1', role: 'portrait', url: 'engi-media://1111', license: 'cc', primary: true},
      {id: 'm2', entityId: 'e2', role: 'portrait', url: 'engi-media://2222', license: 'cc', primary: true},
      {id: 'm3', entityId: 'e3', role: 'artwork', url: 'engi-media://3333', license: 'cc', primary: true},
      {id: 'm4', entityId: 'e3', role: 'detail', url: 'engi-media://4444', license: 'cc'},
    ],
    tags: [
      {id: 'tag-presidents', name: 'Президенты США'},
      {id: 'tag-art', name: 'Живопись'},
    ],
    entityTags: [
      {entityId: 'e1', tagId: 'tag-presidents'},
      {entityId: 'e2', tagId: 'tag-presidents'},
      {entityId: 'e3', tagId: 'tag-art'},
      {entityId: 'e4', tagId: 'tag-art', archived: true},
    ],
    properties: [],
    entityTypes: [
      {id: 'person', name: 'Человек'},
      {id: 'artwork', name: 'Картина'},
      {id: 'event', name: 'Событие'},
    ],
    missing: [],
    unresolved: [],
  };
}

test('getUntaggedEntities returns entities without active tags and skips tagged or archived ones', () => {
  const b = fixture();
  const untagged = getUntaggedEntities(b);
  assert.equal(untagged.length, 2);
  assert.deepEqual(untagged.map(e => e.id).sort(), ['e4', 'e5']);
});

test('getDeckSampleImages returns up to limit distinct valid images', () => {
  const b = fixture();
  const images = getDeckSampleImages(b, ['e1', 'e2', 'e3'], 3);
  assert.equal(images.length, 3);
  assert.equal(images[0], 'engi-media://1111');
  assert.equal(images[1], 'engi-media://2222');
  assert.equal(images[2], 'engi-media://3333');
});

test('getDeckList builds tag decks and automatically includes untagged pseudo-deck', () => {
  const b = fixture();
  const snapshot: Snapshot = {
    bundle: b,
    memories: [],
    events: [],
  };
  const decks = getDeckList(snapshot);
  assert.equal(decks.length, 3);
  const presidents = decks.find(d => d.id === 'tag-presidents');
  assert(presidents);
  assert.equal(presidents.entityCount, 2);
  assert.equal(presidents.learnedEntityCount, 0);
  assert.equal(presidents.category, 'unlearned');
  assert.equal(presidents.isUntagged, false);

  const untagged = decks.find(d => d.id === UNTAGGED_TAG_ID);
  assert(untagged);
  assert.equal(untagged.name, 'Неразобранное');
  assert.equal(untagged.isUntagged, true);
  assert.equal(untagged.entityCount, 2);
  assert.equal(untagged.category, 'unlearned');
});

test('getDeckEntities returns deck members or untagged members based on deckId', () => {
  const b = fixture();
  const artEntities = getDeckEntities(b, 'tag-art');
  assert.equal(artEntities.length, 1);
  assert.equal(artEntities[0].id, 'e3');

  const untaggedEntities = getDeckEntities(b, UNTAGGED_TAG_ID);
  assert.equal(untaggedEntities.length, 2);
  assert.deepEqual(untaggedEntities.map(e => e.id).sort(), ['e4', 'e5']);
});

test('getDeckTypes and filterDeckEntities filter items cleanly by type and search query', () => {
  const b = fixture();
  const allEntities = b.entities;
  const types = getDeckTypes(allEntities, b);
  assert.equal(types.length, 3);

  const filteredByType = filterDeckEntities(allEntities, b, '', 'artwork');
  assert.equal(filteredByType.length, 2);

  const filteredByQuery = filterDeckEntities(allEntities, b, 'Джоконда');
  assert.equal(filteredByQuery.length, 1);
  assert.equal(filteredByQuery[0].id, 'e3');
});

test('attachEntityTag and detachEntityTag update membership in database', async () => {
  const d = new EngiDB('deck-tag-test-' + crypto.randomUUID());
  try {
    await saveKnowledge(fixture(), d);

    await attachEntityTag('e5', 'tag-presidents', d);
    let untagged = getUntaggedEntities(await d.transaction('r', [d.entities, d.entityTags, d.tags], async () => {
      const [entities, entityTags, tags] = await Promise.all([d.entities.toArray(), d.entityTags.toArray(), d.tags.toArray()]);
      return {...fixture(), entities, entityTags, tags};
    }));
    assert.equal(untagged.some(e => e.id === 'e5'), false);

    await detachEntityTag('e5', 'tag-presidents', d);
    untagged = getUntaggedEntities(await d.transaction('r', [d.entities, d.entityTags, d.tags], async () => {
      const [entities, entityTags, tags] = await Promise.all([d.entities.toArray(), d.entityTags.toArray(), d.tags.toArray()]);
      return {...fixture(), entities, entityTags, tags};
    }));
    assert.equal(untagged.some(e => e.id === 'e5'), true);

    await archiveTag('tag-presidents', d);
    const archivedTag = await d.tags.get('tag-presidents');
    assert.equal(archivedTag?.archived, true);
  } finally {
    d.close();
    await d.delete();
  }
});