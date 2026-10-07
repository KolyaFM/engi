import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {EngiDB} from '../src/db/engi-db';
import {clearAllData} from '../src/services/learning-service';
import {BUILTIN_PROPERTIES,BUILTIN_TYPES} from '../src/lib/engi/knowledge/properties';

test('clearAllData wipes all user and pack data and restores built-in definitions', async () => {
  const d = new EngiDB('test-clear-db-' + Date.now());
  await d.entities.add({
    id: 'test-entity',
    type: 'person',
    name: 'Test Person',
    aliases: [],
    externalIds: {},
  });
  await d.facts.add({
    id: 'test-fact',
    entityId: 'test-entity',
    key: 'birth_date',
    valueKind: 'date',
    source: {name: 'Manual', kind: 'manual'},
    verification: 'user_confirmed',
  });
  await d.tags.add({id: 'tag-1', name: 'Tag 1'});
  await d.entityTags.add({entityId: 'test-entity', tagId: 'tag-1'});
  await d.installedPacks.add({
    packId: 'test.pack',
    packVersion: 1,
    name: 'Pack',
    createdAt: new Date().toISOString(),
    files: [],
    entityIds: ['test-entity'],
    factIds: ['test-fact'],
    mediaIds: [],
    tagIds: ['tag-1'],
    entityTags: [],
    installedAt: new Date().toISOString(),
  });
  await d.appMeta.put({key: 'dailyLearning', value: {day: '2026-10-07', retrievals: 5, stability30Gains: 1}});

  assert.equal(await d.entities.count(), 1);
  assert.equal(await d.facts.count(), 1);
  assert.equal(await d.installedPacks.count(), 1);

  await clearAllData(d);

  assert.equal(await d.entities.count(), 0);
  assert.equal(await d.facts.count(), 0);
  assert.equal(await d.tags.count(), 0);
  assert.equal(await d.entityTags.count(), 0);
  assert.equal(await d.installedPacks.count(), 0);
  assert.equal(await d.learningState.count(), 0);
  assert.equal(await d.reviewEvents.count(), 0);
  assert.equal(await d.activeSessions.count(), 0);
  assert.equal(await d.targetMappings.count(), 0);
  assert.equal(await d.appMeta.count(), 0);

  assert.equal(await d.propertyDefinitions.count(), BUILTIN_PROPERTIES.length);
  assert.equal(await d.entityTypes.count(), BUILTIN_TYPES.length);

  await d.delete();
});