const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const code = ts.transpileModule(fs.readFileSync('src/app/contexts/adminTheme.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
function setup(storage, denyStorage = false) {
  const events = new EventTarget();
  let read, notifyCount = 0;
  const out = {};
  vm.runInNewContext(code, {
    exports: out, Event,
    window: events,
    localStorage: {
      getItem: key => { if (denyStorage) throw Error('blocked'); return storage.get(key) || null; },
      setItem: (key, value) => { if (denyStorage) throw Error('blocked'); storage.set(key, value); },
    },
    require: () => ({ useSyncExternalStore(subscribe, snapshot) {
      read = snapshot;
      subscribe(() => { notifyCount++; });
      return snapshot();
    } }),
  });
  return { api: out, read: () => read(), notifications: () => notifyCount, events };
}
const saved = new Map();
const first = setup(saved);
assert.equal(first.api.useAdminTheme(), 'light');
first.api.setAdminTheme('dark');
assert.equal(first.read(), 'dark');
assert.equal(first.notifications(), 1);
assert.equal(saved.get('sporto-admin-theme'), 'dark');
assert.equal(setup(saved).api.useAdminTheme(), 'dark', 'choice survives remount/reload');
first.api.setAdminTheme('light');
assert.equal(first.read(), 'light');
const blocked = setup(new Map(), true);
blocked.api.useAdminTheme();
blocked.api.setAdminTheme('dark');
assert.equal(blocked.read(), 'dark', 'storage restrictions must not disable switching');
saved.set('sporto-admin-theme', 'dark');
const event = new Event('storage');
event.key = 'sporto-admin-theme';
first.events.dispatchEvent(event);
assert.equal(first.read(), 'dark', 'other tabs update the selected theme');
console.log('PASS: theme changes notify subscribers, persist across mounts, sync tabs, and work without storage.');
