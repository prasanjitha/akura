import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../extension/popup.js', import.meta.url), 'utf8');

test('popup restores saved preferences and persists individual toggles', async () => {
  const controls = Object.fromEntries(['#enabled', '#remove-line-space', '#status'].map(id => [id, {
    disabled: true, checked: false, textContent: '', addEventListener(_, fn) { this.change = fn; },
  }]));
  const writes = [];
  const context = vm.createContext({ document: { querySelector: id => controls[id] }, chrome: { storage: { local: {
    get: async () => ({ enabled: false, removeLineSpace: true }),
    set: async value => writes.push(JSON.parse(JSON.stringify(value))),
  } } } });
  vm.runInContext(source, context);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(controls['#enabled'].checked, false);
  assert.equal(controls['#remove-line-space'].checked, true);
  assert.equal(controls['#enabled'].disabled, false);
  controls['#enabled'].checked = true;
  await controls['#enabled'].change();
  assert.deepEqual(writes, [{ enabled: true }]);
  context.chrome.storage.local.set = async () => { throw new Error('Storage failed'); };
  controls['#remove-line-space'].checked = false;
  await controls['#remove-line-space'].change();
  assert.equal(controls['#remove-line-space'].checked, true);
  assert.match(controls['#status'].textContent, /Could not save/u);
  assert.equal(controls['#remove-line-space'].disabled, false);
});
