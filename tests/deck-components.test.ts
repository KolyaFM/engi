import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pluralObjects, pluralSubtags} from '../src/lib/engi/knowledge/labels';
import type {DeckInfo} from '../src/lib/engi/knowledge/decks';

test('pluralSubtags correctly formats sub-tag badges in Russian', () => {
  assert.equal(pluralSubtags(1), '+1 подтег');
  assert.equal(pluralSubtags(2), '+2 подтега');
  assert.equal(pluralSubtags(4), '+4 подтега');
  assert.equal(pluralSubtags(5), '+5 подтегов');
  assert.equal(pluralSubtags(6), '+6 подтегов');
  assert.equal(pluralSubtags(11), '+11 подтегов');
  assert.equal(pluralSubtags(21), '+21 подтег');
  assert.equal(pluralSubtags(22), '+22 подтега');
});

test('pluralObjects correctly inflects Russian numerals', () => {
  assert.equal(pluralObjects(0), '0 объектов');
  assert.equal(pluralObjects(1), '1 объект');
  assert.equal(pluralObjects(2), '2 объекта');
  assert.equal(pluralObjects(4), '4 объекта');
  assert.equal(pluralObjects(5), '5 объектов');
  assert.equal(pluralObjects(11), '11 объектов');
  assert.equal(pluralObjects(12), '12 объектов');
  assert.equal(pluralObjects(14), '14 объектов');
  assert.equal(pluralObjects(21), '21 объект');
  assert.equal(pluralObjects(22), '22 объекта');
  assert.equal(pluralObjects(25), '25 объектов');
});

test('deck data structures conform to DeckCard specifications', () => {
  const sampleDeck: DeckInfo = {
    id: 'tag-1',
    name: 'Живопись',
    isUntagged: false,
    childTagIds: ['tag-2'],
    entityCount: 15,
    sampleImages: ['engi-media://1', 'engi-media://2', 'engi-media://3'],
    learnedEntityCount: 5,
    startedEntityCount: 8,
    category: 'in_progress',
    stats: {
      total: 10,
      available: 12,
      new: 2,
      suspended: 0,
      covered: 8,
      retention: 85,
      due: 3,
    },
  };

  assert.equal(sampleDeck.childTagIds.length, 1);
  assert.equal(sampleDeck.sampleImages.length, 3);
  assert.equal(sampleDeck.stats.due, 3);
  assert.equal(sampleDeck.learnedEntityCount, 5);
  assert.equal(sampleDeck.category, 'in_progress');
});

test('deck in_progress with zero learned items reflects active in-progress status instead of unstarted', () => {
  const activeDeck: DeckInfo = {
    id: 'tag-art',
    name: 'Живопись',
    isUntagged: false,
    childTagIds: [],
    entityCount: 12,
    learnedEntityCount: 0,
    startedEntityCount: 3,
    category: 'in_progress',
    sampleImages: [],
    stats: {
      total: 12,
      available: 12,
      new: 9,
      suspended: 0,
      covered: 3,
      retention: null,
      due: 1,
    },
  };

  assert.equal(activeDeck.category, 'in_progress');
  assert.equal(activeDeck.learnedEntityCount, 0);
  assert.equal(activeDeck.startedEntityCount, 3);
});