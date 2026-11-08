import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWishlist, STORAGE_KEY } from '../src/js/wishlist.mjs';

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v);
    },
    removeItem: (k) => {
      delete data[k];
    },
    _data: data,
  };
}

test('toggle adds then removes a handle and persists JSON', () => {
  const storage = memoryStorage();
  const events = [];
  const w = createWishlist({ storage, onChange: (list) => events.push([...list]) });
  assert.equal(w.has('captivate'), false);
  assert.equal(w.toggle('captivate'), true);
  assert.equal(w.has('captivate'), true);
  assert.equal(storage._data[STORAGE_KEY], JSON.stringify(['captivate']));
  assert.equal(w.toggle('captivate'), false);
  assert.deepEqual(w.list(), []);
  assert.deepEqual(events, [['captivate'], []]);
});

test('list restores from storage and ignores junk', () => {
  const w = createWishlist({ storage: memoryStorage({ [STORAGE_KEY]: '["a","b",42,null,"a"]' }) });
  assert.deepEqual(w.list(), ['a', 'b']);
  const broken = createWishlist({ storage: memoryStorage({ [STORAGE_KEY]: '{not json' }) });
  assert.deepEqual(broken.list(), []);
});

test('storage that throws (private mode) degrades to an in-memory list', () => {
  const storage = {
    get getItem() {
      throw new Error('blocked');
    },
    get setItem() {
      throw new Error('blocked');
    },
  };
  let w;
  assert.doesNotThrow(() => {
    w = createWishlist({ storage });
  });
  assert.equal(w.toggle('x'), true);
  assert.equal(w.has('x'), true);
  assert.deepEqual(w.list(), ['x']);
});

test('a window.localStorage getter that throws (site data blocked) does not break boot', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw new Error('SecurityError: access denied');
    },
  });
  try {
    let w;
    assert.doesNotThrow(() => {
      w = createWishlist();
    });
    assert.equal(w.toggle('z'), true);
    assert.deepEqual(w.list(), ['z']);
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  }
});

test('createWishlist with no storage at all still works', () => {
  const w = createWishlist({ storage: null });
  assert.equal(w.toggle('y'), true);
  assert.deepEqual(w.list(), ['y']);
});
