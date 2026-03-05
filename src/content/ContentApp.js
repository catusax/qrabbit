import {getI18nMessage} from '../shared/i18n.js'

export default function createContentApp() {
  // Content script injects a lightweight fixed-position result panel.
  const container = document.createElement('div')
  container.className = 'content_script'

  const contentScanSuccessTitle = getI18nMessage('contentScanSuccessTitle', 'QR code recognized')
  const contentScanSuccessFallback = getI18nMessage('contentScanSuccessFallback', 'QR code content recognized')
  const contentScanFailedTitle = getI18nMessage('contentScanFailedTitle', 'QR code recognition failed')
  const contentScanFailedFallback = getI18nMessage('contentScanFailedFallback', 'No QR code detected')
  const contentCopyResult = getI18nMessage('contentCopyResult', 'Copy result')
  const contentCopied = getI18nMessage('contentCopied', 'Copied')
  const contentCopyFailed = getI18nMessage('contentCopyFailed', 'Copy failed')

  const panel = document.createElement('section')
  panel.className = 'content_result'
  panel.hidden = true

  const title = document.createElement('h3')
  title.className = 'content_result_title'

  const body = document.createElement('p')
  body.className = 'content_result_text'

  const actions = document.createElement('div')
  actions.className = 'content_result_actions'

  const copyButton = document.createElement('button')
  copyButton.type = 'button'
  copyButton.className = 'content_result_button'
  copyButton.textContent = contentCopyResult
  copyButton.hidden = true

  actions.appendChild(copyButton)
  panel.appendChild(title)
  panel.appendChild(body)
  panel.appendChild(actions)

  container.appendChild(panel)

  let toastTimer = null
  let copiedTimer = null
  let copiedText = ''

  // Copy helper uses Clipboard API first, then falls back to execCommand.
  async function copyText(text) {
    if (!text) return false

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        return true
      }
    } catch (_error) {}

    try {
      const input = document.createElement('textarea')
      input.value = text
      input.setAttribute('readonly', 'true')
      input.style.position = 'fixed'
      input.style.top = '-9999px'
      document.body.appendChild(input)
      input.select()
      const copied = document.execCommand('copy')
      input.remove()
      return copied
    } catch (_error) {
      return false
    }
  }

  copyButton.addEventListener('click', async () => {
    if (!copiedText) return

    const copied = await copyText(copiedText)
    copyButton.textContent = copied ? contentCopied : contentCopyFailed

    if (copiedTimer) clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => {
      copyButton.textContent = contentCopyResult
    }, 1400)
  })

  function showScanResult(payload) {
    // Reset timers so back-to-back scans do not overlap status transitions.
    if (toastTimer) {
      clearTimeout(toastTimer)
      toastTimer = null
    }

    if (copiedTimer) {
      clearTimeout(copiedTimer)
      copiedTimer = null
    }

    copyButton.textContent = contentCopyResult
    copiedText = ''

    const ok = Boolean(payload?.ok)
    if (ok) {
      title.textContent = contentScanSuccessTitle
      body.textContent = payload?.text || contentScanSuccessFallback
      panel.className = 'content_result content_result_success'
      copiedText = payload?.text || ''
      copyButton.hidden = !copiedText
    } else {
      title.textContent = contentScanFailedTitle
      body.textContent = payload?.error || contentScanFailedFallback
      panel.className = 'content_result content_result_error'
      copyButton.hidden = true
    }

    panel.hidden = false
    toastTimer = setTimeout(() => {
      panel.hidden = true
    }, ok ? 6500 : 4200)
  }

  container.showScanResult = showScanResult

  return container
}
