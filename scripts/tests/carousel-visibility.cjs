const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const exportsForTest = {};
const source = ts.transpileModule(fs.readFileSync('app/_components/carousel-visibility.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const document = new EventTarget();
document.visibilityState = 'visible';
const motion = new EventTarget();
motion.matches = false;
let observer;
class Observer {
  constructor(callback) { this.callback = callback; this.disconnected = false; observer = this; }
  observe(element) { this.element = element; }
  disconnect() { this.disconnected = true; }
  visibility(ratio) { this.callback([{ isIntersecting: ratio > 0, intersectionRatio: ratio }]); }
}
const window = { IntersectionObserver: Observer, matchMedia: () => motion };
new Function('exports', 'window', 'document', 'IntersectionObserver', source)(exportsForTest, window, document, Observer);
const states = [];
let scheduled = false;
const cleanup = exportsForTest.observeCarouselVisibility({}, active => { states.push(active); scheduled = active; });
assert.equal(scheduled, false, 'No autoplay before the first visibility result');
observer.visibility(0);
assert.deepEqual(states, []);
observer.visibility(0.5);
assert.equal(scheduled, true);
observer.visibility(0.6);
assert.deepEqual(states, [true], 'No repeated start while still visible');
document.visibilityState = 'hidden';
document.dispatchEvent(new Event('visibilitychange'));
assert.equal(scheduled, false, 'Hidden tab immediately cancels autoplay');
observer.visibility(0);
document.visibilityState = 'visible';
document.dispatchEvent(new Event('visibilitychange'));
assert.equal(scheduled, false, 'Returning to the tab must not start an offscreen carousel');
observer.visibility(0.5);
assert.equal(scheduled, true);
motion.matches = true;
motion.dispatchEvent(new Event('change'));
assert.equal(scheduled, false);
motion.matches = false;
motion.dispatchEvent(new Event('change'));
assert.equal(scheduled, true);
cleanup();
assert.equal(scheduled, false, 'Unmount cancels active playback');
assert.equal(observer.disconnected, true);
const length = states.length;
document.dispatchEvent(new Event('visibilitychange'));
motion.dispatchEvent(new Event('change'));
observer.visibility(0.5); // A callback queued before disconnect must not restart playback.
assert.equal(states.length, length, 'Unmount removes event subscriptions');
delete window.IntersectionObserver;
const fallback = [];
const cleanupFallback = exportsForTest.observeCarouselVisibility({}, active => fallback.push(active));
assert.deepEqual(fallback, [true]);
document.visibilityState = 'hidden';
document.dispatchEvent(new Event('visibilitychange'));
assert.deepEqual(fallback, [true, false]);
cleanupFallback();
console.log('PASS: offscreen pause, tab visibility, resume ordering, reduced motion, duplicate starts, unmount cleanup and observer fallback.');
