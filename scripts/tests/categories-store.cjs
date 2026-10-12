const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const channels = new Map();
let queries = 0, removed = 0;
const supabase = {
  from(table) {
    queries++;
    return { select: () => ({ order: async () => ({ data: table === 'categories'
      ? [{ slug: 'fitness', name_ro: 'Fitness', name_ru: 'Фитнес', active: true }]
      : [] }) }) };
  },
  channel(name) {
    if (channels.has(name)) return channels.get(name);
    const channel = {
      subscribed: false, handlers: [],
      on(event, filter, callback) {
        if (this.subscribed) throw Error('cannot add callbacks after subscribe');
        this.handlers.push(callback); return this;
      },
      subscribe() { this.subscribed = true; return this; },
    };
    channels.set(name, channel); return channel;
  },
  // Deliberately retain the old channel to reproduce asynchronous teardown.
  removeChannel() { removed++; return Promise.resolve('ok'); },
};
const out = {};
new Function('require', 'exports', ts.transpileModule(
  fs.readFileSync('src/lib/categories-store.ts', 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }
).outputText)(name => name === './supabase' ? { supabase } : { categories: [] }, out);
(async () => {
  let pageUpdates = 0, searchUpdates = 0;
  const closePage = out.subscribeCategories(() => pageUpdates++);
  let closeSearch = out.subscribeCategories(() => searchUpdates++);
  await out.refetchCategories();
  assert.equal(channels.size, 1);
  assert.equal(queries, 2);
  assert.equal(pageUpdates, 1); assert.equal(searchUpdates, 1);
  assert.equal(out.getCategoriesSnapshot()[0].id, 'fitness');
  closeSearch();
  assert.equal(removed, 0);
  closeSearch = out.subscribeCategories(() => searchUpdates++);
  assert.equal(channels.size, 1);
  await [...channels.values()][0].handlers[0]();
  assert.equal(pageUpdates, 2); assert.equal(searchUpdates, 2);
  closePage(); assert.equal(removed, 0);
  closeSearch(); assert.equal(removed, 1);
  const closeRemount = out.subscribeCategories(() => {});
  await out.refetchCategories();
  assert.equal(channels.size, 2);
  closeRemount(); assert.equal(removed, 2);
  console.log('PASS: page + search share data/channel; reopen, updates and immediate remount are safe.');
})().catch(error => { console.error(error); process.exitCode = 1; });
