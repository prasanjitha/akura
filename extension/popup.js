const enabled = document.querySelector('#enabled');
const removeLineSpace = document.querySelector('#remove-line-space');
const status = document.querySelector('#status');
chrome.storage.local.get({ enabled: true, removeLineSpace: false }).then(settings => {
  enabled.checked = settings.enabled;
  removeLineSpace.checked = settings.removeLineSpace;
  enabled.disabled = removeLineSpace.disabled = false;
}).catch(() => { status.textContent = 'Could not load settings. Reopen the extension.'; });

for (const [control, key] of [[enabled, 'enabled'], [removeLineSpace, 'removeLineSpace']]) {
  control.addEventListener('change', async () => {
    control.disabled = true;
    try {
      await chrome.storage.local.set({ [key]: control.checked });
      status.textContent = '';
    } catch {
      control.checked = !control.checked;
      status.textContent = 'Could not save settings. Please try again.';
    } finally { control.disabled = false; }
  });
}
