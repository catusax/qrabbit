# QRabbit

[中文文档 (Chinese README)](README.zh-CN.md)

## Overview

QRabbit is a browser QR toolkit with three core features:

- Popup: edit any URL/text and generate a QR code in real time.
- Context menu: right-click an image and scan QR code content.
- Sidebar: view the current page QR and all decoded QR results found from page images.

## Development & Build

```bash
# Development mode
npm run dev

# Production build
npm run build

# Preview build output
npm run preview
```

Browser targets (Chromium by default):

```bash
# Chrome
npm run dev -- --browser=chrome

# Edge
npm run dev -- --browser=edge

# Firefox
npm run dev -- --browser=firefox
```

## Usage

1. **Generate QR in Popup**
    - Open the extension popup.
    - Edit or paste a URL/text.
    - The QR code updates instantly.

2. **Scan image QR via context menu**
    - Right-click an image on any webpage.
    - Select the extension scan menu item.
    - View the decoded QR result on the page.

3. **Use Sidebar for page and scan results**
    - Open the extension sidebar.
    - Check current page URL and QR code.
    - Review decoded QR results collected from page images.
