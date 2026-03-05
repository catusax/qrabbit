import jsQR from 'jsqr'
import {getI18nMessage} from './shared/i18n.js'

const MENU_ID_SCAN_IMAGE_QR = 'scan-image-qr'

const isFirefoxLike =
  import.meta.env.EXTENSION_PUBLIC_BROWSER === 'firefox' ||
  import.meta.env.EXTENSION_PUBLIC_BROWSER === 'gecko-based'

const contextMenuScan = getI18nMessage('contextMenuScan', 'Scan QR Code')
const contentScanFailedFallback = getI18nMessage('contentScanFailedFallback', 'No QR code detected')
const backgroundScanFailed = getI18nMessage('backgroundScanFailed', 'Scan failed')

// Return the active tab in the current window.
function getActiveTab() {
  return new Promise((resolve) => {
    try {
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        resolve((tabs && tabs[0]) || null)
      })
    } catch (error) {
      console.error(error)
      resolve(null)
    }
  })
}

// Send a message to a content script running in a specific tab.
function sendMessageToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    if (!tabId) {
      resolve(null)
      return
    }

    try {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        const runtimeError = chrome.runtime.lastError
        if (runtimeError) {
          reject(new Error(runtimeError.message || 'Failed to send message to tab'))
          return
        }
        resolve(response)
      })
    } catch (error) {
      reject(error)
    }
  })
}

// Fetch and decode QR text from any image URL, including data:image URLs.
async function decodeQrFromImageUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return null

  let bitmap = null
  let canvas = null
  let ctx = null
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) return null

    const imageBlob = await response.blob()
    bitmap = await createImageBitmap(imageBlob)

    if (!bitmap.width || !bitmap.height) return null

    if (typeof OffscreenCanvas !== 'undefined') {
      canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
      ctx = canvas.getContext('2d', {willReadFrequently: true})
    } else if (typeof document !== 'undefined') {
      canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      ctx = canvas.getContext('2d', {willReadFrequently: true})
    } else {
      return null
    }

    if (!ctx) return null

    ctx.drawImage(bitmap, 0, 0)
    const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height)
    const decoded = jsQR(imageData.data, imageData.width, imageData.height)
    return decoded?.data || null
  } catch (error) {
    throw error
  } finally {
    bitmap?.close?.()
  }
}

// Normalize payload shape and return unique, non-empty image URLs.
function normalizeImageUrls(payload) {
  const raw =
    Array.isArray(payload) ? payload : Array.isArray(payload?.imageUrls) ? payload.imageUrls : []

  return [...new Set(raw.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean))]
}

// Open extension sidebar in a browser-compatible way.
async function openSidebarForActiveTab() {
  try {
    if (isFirefoxLike) {
      await browser.sidebarAction.open()
      return
    }

    if (!chrome.sidePanel?.open) return
    const activeTab = await getActiveTab()
    if (!activeTab?.id) return
    await chrome.sidePanel.open({tabId: activeTab.id})
  } catch (error) {
    console.error(error)
  }
}

// Ensure image context menu exists for both install and startup flows.
function ensureImageContextMenu() {
  try {
    chrome.contextMenus.remove(MENU_ID_SCAN_IMAGE_QR, () => {
      chrome.contextMenus.create(
        {
          id: MENU_ID_SCAN_IMAGE_QR,
          title: contextMenuScan,
          contexts: ['image'],
        },
        () => {
          const runtimeError = chrome.runtime.lastError
          if (!runtimeError) return

          const message = runtimeError.message || ''
          if (!/duplicate|exists|already/i.test(message)) {
            console.warn(runtimeError)
          }
        },
      )
    })
  } catch (error) {
    console.error(error)
  }
}

chrome.runtime.onInstalled.addListener(() => {
  ensureImageContextMenu()
})

chrome.runtime.onStartup.addListener(() => {
  ensureImageContextMenu()
})

ensureImageContextMenu()

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info?.menuItemId !== MENU_ID_SCAN_IMAGE_QR || !info?.srcUrl) return
  if (!tab?.id) return

  try {
    const text = await decodeQrFromImageUrl(info.srcUrl)
    if (!text) {
      await sendMessageToTab(tab.id, {
        type: 'showScanResult',
        payload: {
          ok: false,
          error: contentScanFailedFallback,
          srcUrl: info.srcUrl,
        },
      })
      return
    }

    await sendMessageToTab(tab.id, {
      type: 'showScanResult',
      payload: {
        ok: true,
        text,
        srcUrl: info.srcUrl,
      },
    })
  } catch (error) {
    await sendMessageToTab(tab.id, {
      type: 'showScanResult',
      payload: {
        ok: false,
        error: error?.message || backgroundScanFailed,
        srcUrl: info.srcUrl,
      },
    })
  }
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message?.type) return

  if (message.type === 'openSidebar') {
    openSidebarForActiveTab()
    return
  }

  if (message.type === 'getActivePageInfo') {
    ;(async () => {
      try {
        const activeTab = await getActiveTab()
        sendResponse({
          url: activeTab?.url || '',
          title: activeTab?.title || '',
          tabId: activeTab?.id ?? null,
        })
      } catch (error) {
        sendResponse({url: '', title: '', tabId: null})
      }
    })()
    return true
  }

  if (message.type === 'getSidebarData') {
    ;(async () => {
      try {
        const activeTab = await getActiveTab()
        const currentPage = {
          url: activeTab?.url || '',
          title: activeTab?.title || '',
        }

        if (!activeTab?.id) {
          sendResponse({currentPage, scanned: []})
          return
        }

        let pageImagePayload = null
        try {
          pageImagePayload = await sendMessageToTab(activeTab.id, {type: 'collectPageImageUrls'})
        } catch (error) {
          pageImagePayload = null
        }

        const imageUrls = normalizeImageUrls(pageImagePayload)
        const scanned = []

        for (const imageUrl of imageUrls) {
          try {
            const text = await decodeQrFromImageUrl(imageUrl)
            if (text) {
              scanned.push({imageUrl, text})
            }
          } catch (error) {
            console.warn('Failed to decode image URL:', imageUrl, error)
          }
        }

        sendResponse({currentPage, scanned})
      } catch (error) {
        sendResponse({
          currentPage: {url: '', title: ''},
          scanned: [],
        })
      }
    })()

    return true
  }
})
