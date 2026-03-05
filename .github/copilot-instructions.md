# QRabbit Copilot Project Guide

## Project goal

QRabbit is a browser extension that provides a compact QR toolkit:

- Generate QR code from current page URL (Popup).
- Scan QR codes from images via browser context menu.
- Show current page QR and scanned image-QR results in Sidebar.

## Tech stack

- Build system: Extension.js
- Language: JavaScript (ESM)
- QR generation: `qrcode`
- QR decoding: `jsqr`
- Browser targets: Chromium + Firefox (manifest keys use extension.js browser-prefixed fields)

## Key architecture

- `src/background.js`
  - Owns context menu registration and image QR decoding.
  - Handles cross-context runtime messages.
  - Aggregates sidebar data by collecting image URLs from content script and decoding in background.

- `src/content/scripts.js`
  - Injected on all pages.
  - Returns page image URLs for scanning (`collectPageImageUrls`).
  - Displays scan result panel (`showScanResult`).

- `src/popup/PopupApp.js`
  - Loads active tab URL via runtime message.
  - Generates QR in real-time while editing text.

- `src/sidebar/SidebarApp.js`
  - Requests combined sidebar data from background.
  - Renders current page QR and scanned results list.
  - Supports manual refresh.

- `src/shared/*`
  - `runtime.js`: runtime message helper.
  - `qr.js`: QR generation helper.
  - `i18n.js`: i18n message helper.

## i18n conventions

- Manifest uses `__MSG_key__` and `default_locale`.
- Locale files:
  - `src/_locales/en/messages.json` (default)
  - `src/_locales/zh_CN/messages.json`
- UI code must call `getI18nMessage(key, fallback)` instead of hardcoding display text.
- Fallback text in code should be English.

## Development commands

- `npm run dev`
- `npm run build`
- `npm run preview`
- Browser-specific dev:
  - `npm run dev -- --browser=chrome`
  - `npm run dev -- --browser=edge`
  - `npm run dev -- --browser=firefox`

## Implementation rules for future changes

- Keep changes minimal and localized.
- Prefer adding shared helpers instead of duplicating logic.
- Preserve cross-browser compatibility (`chrome` / `browser` APIs).
- When adding user-facing text, add i18n keys in both `en` and `zh_CN` locale files.
- Validate by running `npm run build` after modifications.

## Typical feature workflow

1. Add or update message types in background/content/popup/sidebar.
2. Add required i18n keys (`en` + `zh_CN`).
3. Update UI render logic.
4. Build and verify output.