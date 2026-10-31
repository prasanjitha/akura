// Runs in Chrome's isolated content-script world. Never reads the clipboard.
globalThis.AkuraClipboard = {
  async write(text) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // HTTP pages and some embedded frames cannot use the async Clipboard API.
    }
    const active = document.activeElement;
    const selection = window.getSelection();
    const ranges = Array.from({ length: selection?.rangeCount || 0 }, (_, i) => selection.getRangeAt(i).cloneRange());
    const start = active?.selectionStart;
    const end = active?.selectionEnd;
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;top:0;left:-9999px;width:1px;height:1px;opacity:0;';
    document.documentElement.append(field);
    let copied = false;
    try {
      field.focus({ preventScroll: true });
      field.select();
      copied = document.execCommand('copy');
    } finally {
      field.remove();
      active?.focus({ preventScroll: true });
      if (typeof start === 'number' && typeof end === 'number') active.setSelectionRange(start, end);
      if (selection) {
        selection.removeAllRanges();
        for (const range of ranges) selection.addRange(range);
      }
    }
    if (!copied) throw new Error('Copy unavailable');
  },
};
