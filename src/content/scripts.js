import createContentApp from './ContentApp.js'
import './styles.css'

export default function initial() {
  const rootDiv = document.createElement('div')
  rootDiv.setAttribute('data-extension-root', 'true')
  document.body.appendChild(rootDiv)

  // Injecting content_scripts inside a shadow dom
  // prevents conflicts with the host page's styles.
  // This way, styles from the extension won't leak into the host page.
  const shadowRoot = rootDiv.attachShadow({mode: 'open'})

  const styleElement = document.createElement('style')
  shadowRoot.appendChild(styleElement)
  fetchCSS().then((response) => (styleElement.textContent = response))

  // Render ContentApp inside shadow root
  const container = createContentApp()
  shadowRoot.appendChild(container)

  const runtimeApi = typeof browser !== 'undefined' ? browser.runtime : chrome.runtime
  const onMessage = (message, _sender, sendResponse) => {
    if (!message?.type) return

    if (message.type === 'collectPageImageUrls') {
      const imageUrls = []
      const seen = new Set()

      for (const image of Array.from(document.images)) {
        const values = [image.currentSrc, image.src]
        for (const value of values) {
          if (!value || typeof value !== 'string') continue
          const trimmed = value.trim()
          if (!trimmed || seen.has(trimmed)) continue
          seen.add(trimmed)
          imageUrls.push(trimmed)
        }
      }

      sendResponse({imageUrls})
      return
    }

    if (message.type === 'showScanResult') {
      container.showScanResult(message.payload)
      sendResponse({ok: true})
    }
  }

  runtimeApi.onMessage.addListener(onMessage)

  return () => {
    runtimeApi.onMessage.removeListener(onMessage)
    rootDiv.remove()
  }
}

async function fetchCSS() {
  const cssUrl = new URL('./styles.css', import.meta.url)
  const response = await fetch(cssUrl)
  const text = await response.text()
  return response.ok ? text : Promise.reject(text)
}
