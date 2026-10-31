'use client';
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { toLegacy, toLegacyHtml } from '../lib/convert.mjs';

function Icon({ name, ...props }) {
  const paths = { copy: <><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>, arrow: <><path d="M12 4v16m-6-6 6 6 6-6"/></>, expand: <><path d="M14 4h6v6M20 4l-7 7M10 20H4v-6m0 6 7-7"/></>, check:<path d="m5 12 4 4L19 6"/>, clear:<><path d="m6 6 12 12M6 18 18 6"/></> };
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
export default function Home() {
  const [text, setText] = useState('');
  const [mode, setMode] = useState('legacy');
  const [removeLineSpace, setRemoveLineSpace] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const outputRef = useRef(null);
  const timer = useRef(null);
  const output = toLegacy(text, mode, { removeLineSpace });
  const unsupported = /[\u0D80-\u0DFF]/u.test(output);
  function update(value) { setText(value); setCopied(false); setError(''); clearTimeout(timer.current); }
  function clearInput() { update(''); inputRef.current?.focus(); }
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      Promise.resolve(context.registerTool({ name: 'convert_sinhala_text', description: 'Set the Unicode input and convert it to Sinhala legacy text for FMBasuru.', inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: true }, execute(input) {
        if (!input || typeof input.text !== 'string') throw new TypeError('A text string is required');
        flushSync(() => update(input.text));
        return { legacyText: toLegacy(input.text, mode, { removeLineSpace }), font: mode === 'legacy' ? 'FMBasuru' : 'DL-Manel', mode };
      } }, { signal: lifecycle.signal })).catch(() => {});
    } catch { /* Conversion remains available without experimental browser APIs. */ }
    return () => lifecycle.abort();
  }, [mode, removeLineSpace]);
  async function copy() {
    try {
      let formatted = false;
      if (mode === 'mixed' && navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
        try {
          await navigator.clipboard.write([new ClipboardItem({
            'text/plain': new Blob([output], { type: 'text/plain' }),
            'text/html': new Blob([toLegacyHtml(text, { removeLineSpace })], { type: 'text/html' }),
          })]);
          formatted = true;
        } catch { /* Still offer plain-text copy if HTML copying is unavailable. */ }
      }
      if (!formatted) {
        if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(output);
        else { outputRef.current.focus(); outputRef.current.select(); if (!document.execCommand('copy')) throw new Error('Clipboard unavailable'); }
      }
      setCopied(true); setError(formatted || mode === 'legacy' ? '' : 'Plain text ලෙස copy වුණා. Paste කළ පසු Sinhala කොටසට පමණක් DL-Manel font එක යොදන්න.'); clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2200);
    } catch { outputRef.current.focus(); outputRef.current.select(); setError('Copy කරන්න බැරි වුණා. තෝරා ඇති text එක Ctrl+C / ⌘C මගින් copy කරන්න.'); }
  }
  return <div className="app-shell">
    <header className="header"><a className="brand" href="/" aria-label="Akuru home"><span className="brand-mark">අ</span><span>akuru<span className="brand-dot">.</span></span></a><span className="header-note">SINHALA FONT CONVERTER</span></header>
    <main>
      <div className="intro"><div className="eyebrow"><span className="tiny-line"/> UNICODE → LEGACY</div><h1>ඔබේ අකුරු, ඔබට අවශ්‍ය ලෙස<span>.</span></h1><p>Unicode text එක ලියන්න. Legacy text එක එසැණින් ලබාගන්න.</p></div>
      <div className="workspace-heading"><h2>Font converter</h2><span className="live-label"><span/> Converts as you type</span></div>
      <section className={`editor input-editor ${expanded ? 'expanded' : ''}`} aria-labelledby="unicode-label">
        <div className="editor-top"><label id="unicode-label" htmlFor="unicode-input">UNICODE FONT</label><span className="editor-kind">Your original text</span><button className="icon-button" onClick={() => setExpanded(!expanded)} aria-label={expanded ? 'Shrink text area' : 'Expand text area'} aria-pressed={expanded}><Icon name="expand"/></button></div>
        <textarea id="unicode-input" ref={inputRef} placeholder="ඔබේ සිංහල Unicode text එක මෙතැන ලියන්න…" value={text} onChange={event => update(event.target.value)} spellCheck={false}/>
        <div className="editor-bottom"><span>සිංහලෙන් ලියන්න හෝ paste කරන්න</span><div><span>{Array.from(text).length.toLocaleString()} characters</span><button className="clear-button" disabled={!text} onClick={clearInput}><Icon name="clear" width="16" height="16"/>Clear</button></div></div>
      </section>
      <div className="connector"><span className="connector-icon"><Icon name="arrow"/></span><span>Automatically converted</span></div>
      <div className="output-mode"><label htmlFor="output-mode">Paste කරන app එක</label><select id="output-mode" value={mode} onChange={event => { setMode(event.target.value); setCopied(false); setError(''); }}><option value="legacy">Video editor — FMBasuru</option><option value="mixed">Word / rich text — English + Sinhala</option></select></div>
      <fieldset className="line-space-options" aria-describedby="line-space-help">
        <legend>Line spacing</legend>
        <div className="line-space-choices">
          <label><input type="radio" name="line-spacing" value="keep" checked={!removeLineSpace} onChange={() => { setRemoveLineSpace(false); update(text); }}/>Keep line space</label>
          <label><input type="radio" name="line-spacing" value="remove" checked={removeLineSpace} onChange={() => { setRemoveLineSpace(true); update(text); }}/>Remove line space</label>
        </div>
        <p id="line-space-help">Remove line space තේරුවාම පේළි එකතු කර, ඒ අතර එක space එකක් තබයි.</p>
      </fieldset>
      <section className="editor output-editor" aria-labelledby="legacy-label">
        <div className="editor-top"><label id="legacy-label" htmlFor="legacy-output">LEGACY FONT</label><span className="font-badge">{mode === 'legacy' ? 'FMBasuru' : 'DL-Manel'}</span><button className={`copy-button ${copied ? 'copied' : ''}`} disabled={!output} onClick={copy}><Icon name={copied ? 'check' : 'copy'}/>{copied ? 'Copied!' : 'Copy text'}</button></div>
        <textarea id="legacy-output" ref={outputRef} value={output} readOnly placeholder="Converted legacy text will appear here…" spellCheck={false} aria-describedby="font-help"/>
        <div className="editor-bottom"><span>{output ? 'Ready to copy' : 'Waiting for your text'}</span><span>LEGACY ENCODING</span></div>
      </section>
      <div role="status" aria-live="polite" className={error || unsupported ? 'status visible' : 'status'}>{error || (unsupported ? 'සමහර දුර්ලභ අකුරු convert වී නැහැ. Copy කිරීමට පෙර පරීක්ෂා කරන්න.' : copied ? 'Legacy text copied to clipboard.' : '')}</div>
      <aside id="font-help"><span className="info-icon">i</span>{mode === 'legacy' ? <p>Video editor එකේ FMBasuru font එක තෝරන්න. : සහ . ඇතුළු punctuation එකත් ඒ font එකට convert වේ.<br/><span>English words සඳහා වෙනම text layer එකක් සහ English font එකක් භාවිත කරන්න. එකම legacy font එකකින් English අකුරු නිවැරදිව පෙන්වන්න බැහැ.</span></p> : <p>Copy කර <strong>Keep Source Formatting</strong> සමඟ paste කරන්න. DL-Manel font එක install වී තිබිය යුතුයි.<br/><span>English සහ symbols වෙනස් නොවේ. මේ mode එකට paste කරන app එකේ rich-text support අවශ්‍යයි.</span></p>}</aside>
    </main>
    <footer><span>අකුරෙන් අකුරට.</span><span>All conversion happens in your browser. Your text stays with you.</span></footer>
  </div>;
}
