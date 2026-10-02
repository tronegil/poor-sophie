// The frontend service worker's alert handlers (frontend/public/sw.js), run in
// a VM with a fake `self`. Lives here because backend/ is where `npm test` runs.
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function loadWorker() {
  const code = fs.readFileSync(path.resolve(__dirname, '../../frontend/public/sw.js'), 'utf8');
  const listeners = {}, shown = [], opened = [];
  const state = { windows: [] };
  const self = {
    location: { origin: 'https://app.example' },
    addEventListener: (type, fn) => { listeners[type] = fn; },
    registration: { showNotification: async (title, opts) => { shown.push({ title, ...opts }); } },
    clients: { matchAll: async () => state.windows, openWindow: async url => { opened.push(url); }, claim: async () => {} },
    skipWaiting: () => {},
  };
  vm.runInNewContext(code, { self, caches: {}, fetch: () => {}, URL, console });
  const fire = async (type, ev) => { let p; listeners[type]({ ...ev, waitUntil: x => { p = x; }, respondWith: () => {} }); await p; };
  return { fire, shown, opened, state };
}

test('a push shows the alert with its link', async () => {
  const w = loadWorker();
  await w.fire('push', { data: { json: () => ({ title: 'Rolig avgang: Hjem → Tau', body: 'lør. 14:00 · 2,1 Behagelig', url: '/boats/b1/passage?trip=t1', tag: 'trip-t1' }) } });
  assert.equal(w.shown[0].title, 'Rolig avgang: Hjem → Tau');
  assert.equal(w.shown[0].data.url, '/boats/b1/passage?trip=t1');
  assert.equal(w.shown[0].tag, 'trip-t1');
  await w.fire('push', { data: null });
  assert.equal(w.shown[1].title, 'Kvalmeindeks');
});

test('tapping the alert opens the passage, reusing an open window', async () => {
  const w = loadWorker();
  const close = () => {};
  await w.fire('notificationclick', { notification: { close, data: { url: '/boats/b1/passage?trip=t1' } } });
  assert.deepEqual(w.opened, ['https://app.example/boats/b1/passage?trip=t1']);
  let navigated = null, focused = false;
  w.state.windows = [{ url: 'https://app.example/', navigate: async u => { navigated = u; return { focus: () => { focused = true; } }; } }];
  await w.fire('notificationclick', { notification: { close, data: { url: '/x' } } });
  assert.equal(navigated, 'https://app.example/x');
  assert.ok(focused);
});
