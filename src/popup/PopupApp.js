import {sendRuntimeMessage} from '../shared/runtime.js'
import {generateQrDataUrl} from '../shared/qr.js'
import {getI18nMessage} from '../shared/i18n.js'

export default function createPopupApp() {
  // Popup mounts into the static #root container from popup/index.html.
  const root = document.getElementById('root')
  if (!root) return

  // Keep all UI labels sourced from i18n so browser locale drives language.
  document.title = getI18nMessage('popupTitle', 'QR Generator')

  const popupTitle = getI18nMessage('popupTitle', 'QR Generator')
  const popupLabel = getI18nMessage('popupLabel', 'Text or URL')
  const popupPlaceholder = getI18nMessage('popupPlaceholder', 'Enter text to generate QR code')
  const popupGenerateFailed = getI18nMessage('popupGenerateFailed', 'Failed to generate QR code')

  root.innerHTML = `
    <main class="popup_app">
      <h1 class="popup_title">${popupTitle}</h1>
      <label class="popup_label" for="popup-input">${popupLabel}</label>
      <input id="popup-input" class="popup_input" type="text" autocomplete="off" />
      <div class="popup_qr_wrap" aria-live="polite">
        <img class="popup_qr" alt="Generated QR code" hidden />
        <p class="popup_placeholder">${popupPlaceholder}</p>
      </div>
    </main>
  `

  const input = root.querySelector('#popup-input')
  const qrImage = root.querySelector('.popup_qr')
  const placeholder = root.querySelector('.popup_placeholder')

  if (!input || !qrImage || !placeholder) return

  // Prevent outdated async render results from replacing newer input states.
  let renderVersion = 0

  async function renderQr(value) {
    const currentVersion = ++renderVersion
    const text = typeof value === 'string' ? value.trim() : ''

    if (!text) {
      qrImage.hidden = true
      qrImage.removeAttribute('src')
      placeholder.textContent = popupPlaceholder
      placeholder.hidden = false
      return
    }

    try {
      const dataUrl = await generateQrDataUrl(text)
      if (currentVersion !== renderVersion) return
      qrImage.src = dataUrl
      qrImage.hidden = false
      placeholder.hidden = true
    } catch (_error) {
      if (currentVersion !== renderVersion) return
      qrImage.hidden = true
      qrImage.removeAttribute('src')
      placeholder.textContent = popupGenerateFailed
      placeholder.hidden = false
    }
  }

  input.addEventListener('input', (event) => {
    renderQr(event.target.value)
  })

  ;(async () => {
    try {
      const info = await sendRuntimeMessage({type: 'getActivePageInfo'})
      const initialText = typeof info?.url === 'string' ? info.url : ''
      input.value = initialText
      renderQr(initialText)
    } catch (_error) {
      input.value = ''
      renderQr('')
    }
  })()
}
