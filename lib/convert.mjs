import converter from 'sinhala-unicode-coverter/lib/cjs/index.js';

const sinhalaRun = /([\u0D80-\u0DFF][\u0D80-\u0DFF\u200C\u200D]*)/gu;
const isSinhala = /^[\u0D80-\u0DFF]/u;

function convertRun(run) {
  return run.normalize('NFC').split(/(ඛෙ|ඳෙ|ෆේ|ක්‍ෂ)/u).map(part => {
    const fixes = { 'ඛෙ': 'fL', 'ඳෙ': 'f|', 'ෆේ': 'f*a', 'ක්‍ෂ': 'Ì' };
    return fixes[part] ?? converter.unicodeToDlManel(part);
  }).join('');
}

export function legacyRuns(text, { removeLineSpace = false } = {}) {
  if (typeof text !== 'string') throw new TypeError('Text must be a string');
  if (removeLineSpace) {
    // Collapse line breaks and their surrounding whitespace, preserving spaces
    // within each line. Blank lines at the edges should not add a space.
    text = text.replace(/[\s\u0085]*[\r\n\u0085\u2028\u2029][\s\u0085]*/gu, (match, offset) =>
      offset === 0 || offset + match.length === text.length ? '' : ' '
    );
  }
  // Only normalize Sinhala. Preserve English, punctuation, emoji and whitespace
  // exactly, including dots in URLs and decimals and joiners in emoji sequences.
  return text.split(sinhalaRun).filter(Boolean).map(part => ({
    legacy: isSinhala.test(part),
    text: isSinhala.test(part) ? convertRun(part) : part,
  }));
}

// Verified against the installed FMBasuru font; its colon is at `(`,
// unlike the DL-Manel library's bullet mapping.
const basuruPunctuation = {
  '.': "'", ',': '"', ':': '(', ';': '¦', '!': 'æ', '?': '@',
  '(': '^', ')': '&', '%': ']', '/': '$', '+': '¬', '-': '-', '=': '}',
};
export function toLegacy(text, mode = 'mixed', options) {
  return legacyRuns(text, options).map(run => run.legacy || mode !== 'legacy'
    ? run.text
    : run.text.replace(/[.,:;!?()%/+\-=]/g, symbol => basuruPunctuation[symbol])
  ).join('');
}

const escapeHtml = text => text.replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

export function toLegacyHtml(text, options) {
  const spans = legacyRuns(text, options).map(run => {
    const font = run.legacy ? 'DL-Manel' : 'Arial, sans-serif';
    return `<span style="font-family: ${font}; white-space: pre-wrap;">${escapeHtml(run.text)}</span>`;
  });
  return `<div style="white-space: pre-wrap;">${spans.join('')}</div>`;
}
