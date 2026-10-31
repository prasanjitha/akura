import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../extension/clipboard.js', import.meta.url), 'utf8');

test('clipboard uses async write without reading or altering the page', async () => {
  let written;
  const context = vm.createContext({ navigator: { clipboard: { writeText: async text => { written = text; } } } });
  vm.runInContext(source, context);
  await context.AkuraClipboard.write("isxy,'");
  assert.equal(written, "isxy,'");
});

for (const succeeds of [true, false]) {
  test(`clipboard fallback restores input and selection after ${succeeds ? 'success' : 'failure'}`, async () => {
    const events = [];
    const active = { selectionStart: 2, selectionEnd: 9, focus: () => events.push('focus restored'), setSelectionRange: (a, b) => events.push([a, b]) };
    const savedRange = {};
    const selection = { rangeCount: 1, getRangeAt: () => ({ cloneRange: () => savedRange }), removeAllRanges: () => events.push('clear ranges'), addRange: range => assert.equal(range, savedRange) };
    const field = { style: {}, setAttribute() {}, focus() {}, select() {}, remove: () => events.push('field removed') };
    const context = vm.createContext({
      navigator: { clipboard: { writeText: async () => { throw new Error('Blocked'); } } },
      window: { getSelection: () => selection },
      document: { activeElement: active, createElement: () => field, documentElement: { append() {} }, execCommand: command => { assert.equal(command, 'copy'); return succeeds; } },
    });
    vm.runInContext(source, context);
    if (succeeds) await context.AkuraClipboard.write("Y%S ,xld'");
    else await assert.rejects(context.AkuraClipboard.write("Y%S ,xld'"), /Copy unavailable/u);
    assert.equal(field.value, "Y%S ,xld'");
    assert.deepEqual(events, ['field removed', 'focus restored', [2, 9], 'clear ranges']);
  });
}
