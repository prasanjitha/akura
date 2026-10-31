(() => {
  const defaults = { enabled: true, removeLineSpace: false };
  let settings = { ...defaults, enabled: false };
  let selectedText = '';
  let timer;
  let busy = false;
  let host;
  let root;
  let copyButton;
  let status;
  let manual;
  const hasSinhala = text => /[\u0D80-\u0DFF]/u.test(text);

  function hide() {
    if (host) host.style.setProperty('display', 'none', 'important');
    selectedText = '';
  }

  function createToolbar() {
    host = document.createElement('akura-legacy-toolbar');
    host.style.cssText = 'all:initial!important;position:fixed!important;z-index:2147483647!important;display:none!important;';
    root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `
      <style>
        :host{color-scheme:light}
        *{box-sizing:border-box}
        .panel{font:13px/1.5 Arial,sans-serif;color:#25272b;background:#fff;border:1px solid #e9d7d8;border-radius:12px;padding:8px;box-shadow:0 6px 28px #0003;width:248px;max-width:calc(100vw - 16px)}
        .row{display:flex;align-items:center;gap:6px}
        button{font:600 13px/1.4 Arial,sans-serif;cursor:pointer;border:0;border-radius:7px;min-height:38px}
        .copy{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:9px 12px;background:#dc2025;color:white}
        .copy:hover{background:#b81c21}.copy:disabled{opacity:.65;cursor:wait}
        .close{background:#f4f4f5;color:#62646b;width:32px;font-size:20px;font-weight:400}
        button:focus-visible,textarea:focus-visible{outline:3px solid #ec9699;outline-offset:2px}
        p{margin:6px 4px 0;font:11px/1.5 Arial,sans-serif;color:#65676e}
        textarea{width:100%;margin-top:8px;min-height:85px;font:13px/1.5 monospace;border:1px solid #ddd;border-radius:5px;padding:6px;resize:vertical;color:#25272b;background:#fff}
        [hidden]{display:none!important}
      </style>
      <section class="panel" aria-label="Akura Sinhala legacy copy">
        <div class="row">
          <button class="copy" type="button" aria-label="Copy legacy text"><span aria-hidden="true">අ</span><span class="label">Copy legacy</span></button>
          <button class="close" type="button" aria-label="Dismiss Akura">×</button>
        </div>
        <p role="status" aria-live="polite">FMBasuru · Unicode → Legacy</p>
        <textarea hidden readonly aria-label="Legacy text for manual copy"></textarea>
      </section>`;
    copyButton = root.querySelector('.copy');
    status = root.querySelector('[role="status"]');
    manual = root.querySelector('textarea');
    // Keep the page selection when clicking the toolbar with a mouse.
    root.addEventListener('pointerdown', event => {
      if (event.target.closest('button')) event.preventDefault();
    });
    copyButton.addEventListener('click', copy);
    root.querySelector('.close').addEventListener('click', hide);
    document.body.append(host);
  }

  function readSelection() {
    const active = document.activeElement;
    if (active instanceof HTMLTextAreaElement || active instanceof HTMLInputElement) {
      // Do not inspect passwords or fields without text-selection support.
      if (active instanceof HTMLInputElement && !['text', 'search', 'url', 'tel'].includes(active.type)) return null;
      if (active.selectionStart === null || active.selectionEnd === null) return null;
      return { text: active.value.slice(active.selectionStart, active.selectionEnd), rect: active.getBoundingClientRect() };
    }
    const selection = window.getSelection();
    if (!selection?.rangeCount || selection.isCollapsed) return null;
    const range = selection.getRangeAt(selection.rangeCount - 1);
    const rects = range.getClientRects();
    return { text: selection.toString(), rect: rects[rects.length - 1] || range.getBoundingClientRect() };
  }

  function refresh() {
    if (busy || (host && document.activeElement === host)) return;
    if (!settings.enabled) return hide();
    const selection = readSelection();
    if (!selection || !hasSinhala(selection.text)) return hide();
    const { text, rect } = selection;
    if (!rect || rect.bottom < 0 || rect.top > innerHeight) return hide();
    if (!host) createToolbar();
    selectedText = text;
    copyButton.querySelector('.label').textContent = 'Copy legacy';
    status.textContent = settings.removeLineSpace ? 'FMBasuru · Remove line space on' : 'FMBasuru · Unicode → Legacy';
    manual.hidden = true;
    manual.value = '';
    host.style.setProperty('display', 'block', 'important');
    const panel = root.querySelector('.panel').getBoundingClientRect();
    const left = Math.max(8, Math.min(rect.left, innerWidth - panel.width - 8));
    const top = rect.bottom + panel.height + 12 <= innerHeight ? rect.bottom + 8 : Math.max(8, rect.top - panel.height - 8);
    host.style.setProperty('left', `${left}px`, 'important');
    host.style.setProperty('top', `${top}px`, 'important');
  }

  async function copy() {
    if (busy || !settings.enabled || !selectedText) return;
    clearTimeout(timer);
    const output = AkuraConverter.toLegacy(selectedText, 'legacy', settings);
    busy = true;
    copyButton.disabled = true;
    try {
      await AkuraClipboard.write(output);
      copyButton.querySelector('.label').textContent = 'Copied!';
      status.textContent = hasSinhala(output) ? 'Copied. Some Sinhala letters could not be converted.' : 'Paste using the FMBasuru font.';
    } catch {
      manual.value = output;
      manual.hidden = false;
      status.textContent = 'Copy blocked here. Select below and press Ctrl+C / ⌘C.';
      const panel = root.querySelector('.panel').getBoundingClientRect();
      host.style.setProperty('top', `${Math.max(8, Math.min(panel.top, innerHeight - panel.height - 8))}px`, 'important');
      manual.focus({ preventScroll: true });
      manual.select();
    } finally {
      copyButton.disabled = false;
      // Ignore selection events caused by clipboard fallback focus restoration.
      setTimeout(() => { busy = false; }, 0);
    }
  }

  function schedule() {
    if (busy) return;
    clearTimeout(timer);
    timer = setTimeout(refresh, 100);
  }
  document.addEventListener('selectionchange', schedule);
  document.addEventListener('pointerup', event => { if (event.target !== host) schedule(); });
  document.addEventListener('keyup', event => {
    if (event.key === 'Escape') { clearTimeout(timer); hide(); }
    else if (event.key !== 'Tab' && event.target !== host) schedule();
  });
  document.addEventListener('pointerdown', event => {
    if (event.target !== host) { clearTimeout(timer); hide(); }
  });
  window.addEventListener('scroll', event => {
    if (event.target !== host) { clearTimeout(timer); hide(); }
  }, true);
  window.addEventListener('resize', hide);
  chrome.storage.local.get(defaults).then(value => { settings = value; refresh(); }).catch(() => {});
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    for (const key of Object.keys(defaults)) {
      if (changes[key]) settings[key] = changes[key].newValue ?? defaults[key];
    }
    if (!settings.enabled) hide();
    else refresh();
  });
})();
