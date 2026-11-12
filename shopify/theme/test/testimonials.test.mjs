import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wrapIndex, visibleIndexes, regionCounts } from '../src/js/testimonials.mjs';

const regions = ['west', 'north', 'south', 'east', 'west', 'north', 'south', 'east'];

test('regionCounts tallies every region plus "all"', () => {
  assert.deepEqual(regionCounts(regions), { all: 8, west: 2, north: 2, south: 2, east: 2 });
  assert.deepEqual(regionCounts(['west']), { all: 1, west: 1, north: 0, south: 0, east: 0 });
  assert.deepEqual(regionCounts([]), { all: 0, west: 0, north: 0, south: 0, east: 0 });
});

test('visibleIndexes filters cards by the active region', () => {
  assert.deepEqual(visibleIndexes(regions, 'all'), [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(visibleIndexes(regions, 'west'), [0, 4]);
  assert.deepEqual(visibleIndexes(regions, 'east'), [3, 7]);
  assert.deepEqual(visibleIndexes(regions, 'nowhere'), []);
});

test('wrapIndex steps through the visible list and wraps both ways', () => {
  assert.equal(wrapIndex(0, 1, 3), 1);
  assert.equal(wrapIndex(2, 1, 3), 0);
  assert.equal(wrapIndex(0, -1, 3), 2);
  assert.equal(wrapIndex(0, 1, 1), 0);
  assert.equal(wrapIndex(0, 1, 0), 0, 'empty list is a no-op');
});
