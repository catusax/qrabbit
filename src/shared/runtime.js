export function sendRuntimeMessage(message) {
  return new Promise((resolve, reject) => {
    try {
      if (typeof browser !== 'undefined' && browser.runtime?.sendMessage) {
        browser.runtime
          .sendMessage(message)
          .then(resolve)
          .catch(reject)
        return
      }

      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage(message, (response) => {
          const runtimeError = chrome.runtime.lastError
          if (runtimeError) {
            reject(new Error(runtimeError.message || 'Failed to send runtime message'))
            return
          }
          resolve(response)
        })
        return
      }

      reject(new Error('No runtime messaging API available'))
    } catch (error) {
      reject(error)
    }
  })
}
