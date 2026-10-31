import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import vm from 'node:vm';
import { toLegacy } from '../lib/convert.mjs';

const extension = new URL('../extension/', import.meta.url);
const bundle = await readFile(new URL('converter.js', extension), 'utf8');
const context = vm.createContext({});
vm.runInContext(bundle, context);

test('packaged converter matches website for Sinhala, punctuation, and line spacing', () => {
  const fixtures = ['සිංහල', 'ශ්‍රී ලංකා.', 'උදේ 6:58යි.', 'ඛෙ ඳෙ ෆේ ක්‍ෂ', 'සිංහල.\n\nHello 3.14! 👨‍👩‍👧‍👦', 'කො කෝ කෞ'.normalize('NFD'), '', '\n \r\n'];
  for (let code = 0x0d80; code <= 0x0dff; code++) fixtures.push(String.fromCodePoint(code));
  for (const input of fixtures) {
    for (const removeLineSpace of [true, false]) {
      assert.equal(context.AkuraConverter.toLegacy(input, 'legacy', { removeLineSpace }), toLegacy(input, 'legacy', { removeLineSpace }));
    }
  }
});

test('line removal keeps sentence boundary and does not collapse spaces within a line', () => {
  for (const newline of ['\n', '\r\n', '\r', '\u0085', '\u2028', '\u2029']) {
    const input = `\nසිංහල.  ${newline}${newline}\tශ්‍රී  ලංකා.\n`;
    assert.equal(context.AkuraConverter.toLegacy(input, 'legacy', { removeLineSpace: true }), "isxy,' Y%S  ,xld'");
    assert.equal(context.AkuraConverter.toLegacy(input, 'legacy'), toLegacy(input, 'legacy'));
  }
});

test('extension manifest references existing local files and only required permissions', async () => {
  const manifest = JSON.parse(await readFile(new URL('manifest.json', extension), 'utf8'));
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions, ['storage', 'clipboardWrite']);
  const files = [manifest.action.default_popup, ...Object.values(manifest.icons), ...manifest.content_scripts.flatMap(script => script.js)];
  for (const file of files) await access(new URL(file, extension));
  for (const script of manifest.content_scripts.flatMap(script => script.js)) {
    const source = await readFile(new URL(script, extension), 'utf8');
    new vm.Script(source, { filename: script });
    assert.doesNotMatch(source, /\b(?:fetch|eval|XMLHttpRequest)\s*\(/u);
  }
});
