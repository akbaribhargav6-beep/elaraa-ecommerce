import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countdownParts, nextRemaining, START_SECONDS } from '../src/js/countdown.mjs';

test('countdownParts zero-pads hours, minutes and seconds', () => {
  assert.deepEqual(countdownParts(3661), { hours: '01', mins: '01', secs: '01' });
  assert.deepEqual(countdownParts(0), { hours: '00', mins: '00', secs: '00' });
  assert.deepEqual(countdownParts(36000 + 59 * 60 + 59), { hours: '10', mins: '59', secs: '59' });
});

test('the decorative clock starts at 08:42:19 like FeaturedLuxuryDeal.tsx', () => {
  assert.equal(START_SECONDS, 8 * 3600 + 42 * 60 + 19);
  assert.deepEqual(countdownParts(START_SECONDS), { hours: '08', mins: '42', secs: '19' });
});

test('nextRemaining ticks down and loops back to the start at zero', () => {
  assert.equal(nextRemaining(10), 9);
  assert.equal(nextRemaining(1), 0);
  assert.equal(nextRemaining(0), START_SECONDS);
  assert.equal(nextRemaining(-5), START_SECONDS);
});
