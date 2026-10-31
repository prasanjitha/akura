# Akuru — Sinhala Unicode to Legacy

Next.js App Router app with instant Unicode → DL-Manel conversion, a read-only output textarea, clipboard copy with fallback, clear, and expandable input. Responsive red/white design inspired by the supplied reference.

## Run

```sh
npm install
npm run dev
```

Open http://localhost:3000. `npm test` checks conversion fixtures; `npm run build` produces static output in `out/` for hosting.

## Encoding

The supported targets are **FMBasuru** for video editors and **DL-Manel** for rich text. The default **Video editor — FMBasuru** mode also encodes punctuation (for example, `:` → `(` and `.` → apostrophe) for a single legacy-font text layer. English words still need a separate text layer with an English font. Colon and period were visually verified with the installed FMBasuru font; other legacy fonts may differ.

Choose **Word / rich text — English + Sinhala** for the preservation behavior below. English, numbers, all punctuation (including `:` and `.`), emoji, URLs, and whitespace remain unchanged. Only Sinhala runs are converted and normalized.

**Keep line space** is selected by default. Select **Remove line space** to join lines and blank paragraphs with a single space in the converted output and copied text, including rich-text copy. The original input stays unchanged, and switching back restores its line breaks.

The Copy button writes both plain text and HTML to the clipboard. HTML assigns DL-Manel to Sinhala runs and Arial to everything else. Install DL-Manel on your device, then paste with **Keep Source Formatting** into an app that supports rich text. This also prevents full stops from displaying as ග: their original dots use Arial, while the legacy dot for ග uses DL-Manel. No font file is bundled.

A plain textarea or plain-text paste cannot carry multiple fonts. In apps that discard clipboard formatting, apply DL-Manel only to Sinhala runs; applying it to the entire paragraph also changes how English and symbols look. If rich clipboard writing is unavailable, the app copies plain text and displays a notice. Unsupported Sinhala characters remain visible and trigger a warning. Verify uncommon combinations before print production.

The conversion library is [Open-SL/sinhala-unicode-converter](https://github.com/Open-SL/sinhala-unicode-converter), package `sinhala-unicode-coverter` (MIT), based on UCSC Language Technology Research Laboratory conversion rules. The wrapper normalizes Unicode and repairs several mappings. All conversion happens locally without transmitting the text.

An optional WebMCP `convert_sinhala_text` tool shares the UI's converter and input state in supported browsers.

## Chrome extension

The `extension/` folder contains **Akura — Sinhala Legacy Copy**. Highlight Sinhala
text on a webpage, click **Copy legacy**, and paste using FMBasuru. It includes
an enable switch and a Remove line space setting. See [installation and usage](extension/README.md).

Run `npm run build:extension` after changing the shared converter. Run
`npm run package:extension` to create `dist/akura-extension.zip`.
