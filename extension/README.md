# Akura — Sinhala Legacy Copy

Highlight Sinhala text on a webpage, then click **Copy legacy**. Paste into your
editor and apply the **FMBasuru** font. This is an installable Chrome Manifest V3
extension, independent of the Next.js website or a running development server.

## Install locally

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode**.
3. Click **Load unpacked** and select this `extension` folder (the folder containing
   `manifest.json`, not the repository root).
4. Pin **Akura — Sinhala Legacy Copy** from Chrome's extensions menu if desired.
5. Refresh webpages that were already open, including ChatGPT.
6. Highlight Sinhala text and click the red **Copy legacy** button below it.

If using the ZIP, extract it first and load the extracted folder. To update a local
installation, click **Reload** on its extension card, then refresh the webpage.

Chrome's installation guide: https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked

## Settings and behavior

- Click the extension's toolbar icon for settings.
- **Enable selection button** defaults to on. Turning it off hides the button on
  existing pages immediately; Chrome's own extension switch disables it entirely.
- **Remove line space** defaults to off. Enable it to replace line breaks and blank
  paragraphs with one space, preserving spaces inside each line.
- Mouse and keyboard text selections work in ordinary page text, text inputs,
  textareas, and normal contenteditable fields. Password inputs are excluded.
- Click **×**, press Escape, scroll, or begin another selection to dismiss the button.
- The page's text stays unchanged. Copying happens only when you click the button.
- Clipboard failures offer selectable legacy text for manual Ctrl+C / ⌘C.
- English words require their own English font/text layer, just as in the website's
  FMBasuru mode. The extension does not install or bundle FMBasuru itself.

## Permissions and limits

`storage` saves only the two preferences locally. `clipboardWrite` allows copying
the converted selection; the extension never reads your clipboard. Content scripts
run on HTTP/HTTPS webpages so the selection button can appear automatically.
There are no network requests, analytics, external scripts, or stored selections.

Chrome blocks content scripts on its internal pages and the Chrome Web Store.
The built-in PDF viewer, images, canvas-based editors, and text inside closed
shadow roots are not supported. The extension only sees selectable webpage text;
it does not perform OCR. Existing tabs must be refreshed after installation.

## Development

From the repository root:

```sh
npm ci
npm run build:extension
npm test
npm run package:extension
```

The generated converter and icons are checked in, so a GitHub checkout is ready
for **Load unpacked**. `build:extension` bundles the website's `lib/convert.mjs`
with the installed translator locally; no remote code or dynamic evaluation is
used. The ZIP is written to `dist/akura-extension.zip`.

For a local UI smoke test, serve the repository on localhost and open
`tests/fixtures/extension.html`. This harness mocks only extension storage; verify
actual Chrome installation and permissions separately with **Load unpacked**.
