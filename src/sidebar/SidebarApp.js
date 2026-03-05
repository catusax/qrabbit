import {sendRuntimeMessage} from '../shared/runtime.js'
import {generateQrDataUrl} from '../shared/qr.js'
import {getI18nMessage} from '../shared/i18n.js'

export default function createSidebarApp() {
  // Sidebar renders into the static #root container from sidebar/index.html.
  const root = document.getElementById('root')
  if (!root) return

  // Resolve all UI strings via i18n keys for bilingual support.
  document.title = getI18nMessage('sidebarPanelTitle', 'QRabbit Sidebar')

  const sidebarAppTitle = getI18nMessage('sidebarAppTitle', 'QRabbit')
  const sidebarRefresh = getI18nMessage('sidebarRefresh', 'Refresh')
  const sidebarRefreshing = getI18nMessage('sidebarRefreshing', 'Refreshing...')
  const sidebarSectionCurrent = getI18nMessage('sidebarSectionCurrent', 'Current page')
  const sidebarSectionResults = getI18nMessage('sidebarSectionResults', 'QR scan results from page images')
  const sidebarNoPageUrl = getI18nMessage('sidebarNoPageUrl', 'No page URL available')
  const sidebarCannotGenerate = getI18nMessage('sidebarCannotGenerate', 'Unable to generate QR code for current page')
  const sidebarNoResults = getI18nMessage('sidebarNoResults', 'No recognizable QR code found')
  const sidebarNoDecodedText = getI18nMessage('sidebarNoDecodedText', 'No decoded text')
  const sidebarLoading = getI18nMessage('sidebarLoading', 'Loading...')
  const sidebarScanning = getI18nMessage('sidebarScanning', 'Scanning images on this page...')
  const sidebarLoadFailed = getI18nMessage('sidebarLoadFailed', 'Load failed, please try again')

  root.innerHTML = `
    <main class="sidebar_app">
      <header class="sidebar_header">
        <h1 class="sidebar_title">${sidebarAppTitle}</h1>
        <button type="button" class="sidebar_refresh" id="sidebar-refresh">${sidebarRefresh}</button>
      </header>

      <section class="sidebar_section">
        <h2 class="sidebar_section_title">${sidebarSectionCurrent}</h2>
        <div class="sidebar_current" id="sidebar-current"></div>
      </section>

      <section class="sidebar_section">
        <h2 class="sidebar_section_title">${sidebarSectionResults}</h2>
        <div class="sidebar_results" id="sidebar-results"></div>
      </section>
    </main>
  `

  const currentContainer = root.querySelector('#sidebar-current')
  const resultsContainer = root.querySelector('#sidebar-results')
  const refreshButton = root.querySelector('#sidebar-refresh')
  if (!currentContainer || !resultsContainer || !refreshButton) return

  // Render the current active page QR block.
  function renderCurrent(url, qrDataUrl) {
    const safeUrl = url || sidebarNoPageUrl
    if (!qrDataUrl) {
      currentContainer.innerHTML = `
        <p class="sidebar_text">${safeUrl}</p>
        <p class="sidebar_empty">${sidebarCannotGenerate}</p>
      `
      return
    }

    currentContainer.innerHTML = `
      <p class="sidebar_text">${safeUrl}</p>
      <img class="sidebar_qr" src="${qrDataUrl}" alt="Current page QR code" />
    `
  }

  function renderScanned(scannedList) {
    if (!Array.isArray(scannedList) || scannedList.length === 0) {
      resultsContainer.innerHTML = `<p class="sidebar_empty">${sidebarNoResults}</p>`
      return
    }

    resultsContainer.innerHTML = ''
    for (const item of scannedList) {
      const card = document.createElement('article')
      card.className = 'sidebar_card'

      const textLine = document.createElement('p')
      textLine.className = 'sidebar_text'
      textLine.textContent = item?.text || sidebarNoDecodedText

      card.appendChild(textLine)

      const qrImage = document.createElement('img')
      qrImage.className = 'sidebar_qr'
      qrImage.alt = 'Decoded text QR code'
      card.appendChild(qrImage)

      resultsContainer.appendChild(card)

      generateQrDataUrl(item?.text || '')
        .then((dataUrl) => {
          qrImage.src = dataUrl
        })
        .catch(() => {
          qrImage.remove()
        })
    }
  }

  async function loadSidebarData() {
    // Provide immediate loading feedback while background scans images.
    refreshButton.disabled = true
    refreshButton.textContent = sidebarRefreshing
    currentContainer.innerHTML = `<p class="sidebar_empty">${sidebarLoading}</p>`
    resultsContainer.innerHTML = `<p class="sidebar_empty">${sidebarScanning}</p>`

    try {
      const data = await sendRuntimeMessage({type: 'getSidebarData'})
      const currentUrl = typeof data?.currentPage?.url === 'string' ? data.currentPage.url : ''
      const currentQrDataUrl = currentUrl ? await generateQrDataUrl(currentUrl) : ''
      renderCurrent(currentUrl, currentQrDataUrl)
      renderScanned(data?.scanned || [])
    } catch (_error) {
      renderCurrent('', '')
      resultsContainer.innerHTML = `<p class="sidebar_empty">${sidebarLoadFailed}</p>`
    } finally {
      refreshButton.disabled = false
      refreshButton.textContent = sidebarRefresh
    }
  }

  refreshButton.addEventListener('click', () => {
    loadSidebarData()
  })

  loadSidebarData()
}

