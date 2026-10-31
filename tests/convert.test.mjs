import test from 'node:test';
import assert from 'node:assert/strict';
import { toLegacy, toLegacyHtml, legacyRuns } from '../lib/convert.mjs';
test('known Sinhala phrases and reordered vowels', () => {
  assert.equal(toLegacy('ශ්‍රී ලංකා'), 'Y%S ,xld');
  assert.equal(toLegacy('සිංහල'), 'isxy,');
  assert.equal(toLegacy('කො කෝ කෞ'), 'fld flda fl!');
});
test('preserves mixed text, other punctuation and multiline whitespace', () => {
  assert.equal(toLegacy('උදේ 6:58යි.\nHello 123!'), 'Wfoa 6:58hs.\nHello 123!');
  assert.equal(toLegacy(''), '');
});
test('preserves symbols, decimals, URLs and English exactly', () => {
  const text = 'Hello: 6:58, 3.14! https://example.com/a?q=1&b=2 #tag @name (test) + 50% / \"yes\" ... 👨‍👩‍👧‍👦';
  assert.equal(toLegacy(text), text);
  assert.equal(toLegacy('ග.'), '..');
  assert.deepEqual(legacyRuns('ග.'), [{ legacy: true, text: '.' }, { legacy: false, text: '.' }]);
});
test('rich copy applies legacy font only to Sinhala and escapes markup', () => {
  const html = toLegacyHtml('ග. Toyota: <script> & 3.14\n');
  assert.ok(html.includes('font-family: DL-Manel; white-space: pre-wrap;">.</span>'));
  assert.ok(html.includes('font-family: Arial, sans-serif; white-space: pre-wrap;">. Toyota: &lt;script&gt; &amp; 3.14\n</span>'));
  assert.ok(!html.includes('<script>'));
});
test('normalizes equivalent vowel sequences and fixes upstream mappings', () => {
  assert.equal(toLegacy('කො'.normalize('NFD')), toLegacy('කො'));
  assert.equal(toLegacy('ඛෙ ඳෙ ෆේ ක්‍ෂ'), 'fL f| f*a Ì');
});
test('rejects non-string values', () => assert.throws(() => toLegacy(null), TypeError));
test('single-font mode encodes punctuation before paste into a video editor', () => {
  assert.equal(toLegacy('උදේ 6:58යි.', 'legacy'), "Wfoa 6(58hs'");
  assert.equal(toLegacy('ග.', 'legacy'), ".'");
  assert.equal(toLegacy('Hello 123', 'legacy'), 'Hello 123');
  assert.equal(toLegacy('උදේ 6:58යි.', 'mixed'), 'Wfoa 6:58hs.');
});
