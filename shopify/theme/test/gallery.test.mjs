import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextIndex, advanceProgress, swipeDirection, AUTOPLAY_DURATION_MS, TICK_MS } from '../src/js/gallery.mjs';

test('nextIndex wraps in both directions', () => {
  assert.equal(nextIndex(0, 3, 1), 1);
  assert.equal(nextIndex(2, 3, 1), 0);
  assert.equal(nextIndex(0, 3, -1), 2);
  assert.equal(nextIndex(1, 1, 1), 0);
  assert.equal(nextIndex(0, 0, 1), 0, 'no images is a no-op');
});

test('autoplay timing matches ProductGallery.tsx (3500 ms slide, 50 ms tick)', () => {
  assert.equal(AUTOPLAY_DURATION_MS, 3500);
  assert.equal(TICK_MS, 50);
});

test('advanceProgress fills the bar and signals the next slide at 100%', () => {
  const step = (TICK_MS / AUTOPLAY_DURATION_MS) * 100;
  assert.deepEqual(advanceProgress(0), { progress: step, next: false });
  const almost = 100 - step / 2;
  assert.deepEqual(advanceProgress(almost), { progress: 0, next: true });
  // 70 ticks of 50 ms = one 3500 ms slide.
  let p = 0;
  let ticks = 0;
  for (;;) {
    ticks += 1;
    const r = advanceProgress(p);
    if (r.next) break;
    p = r.progress;
  }
  assert.equal(ticks, 70);
});

test('swipeDirection needs more than 50px of horizontal travel', () => {
  assert.equal(swipeDirection(200, 120), 1, 'swipe left → next');
  assert.equal(swipeDirection(120, 200), -1, 'swipe right → previous');
  assert.equal(swipeDirection(200, 160), 0);
  assert.equal(swipeDirection(200, 150), 0, 'exactly 50px is not enough');
});
