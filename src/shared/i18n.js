export function getI18nMessage(key, fallback = '', substitutions) {
  // Firefox-style global first.
  try {
    if (typeof browser !== 'undefined' && browser.i18n?.getMessage) {
      const value = browser.i18n.getMessage(key, substitutions)
      if (value) return value
    }
  } catch (_error) {}

  // Chromium-style global fallback.
  try {
    if (typeof chrome !== 'undefined' && chrome.i18n?.getMessage) {
      const value = chrome.i18n.getMessage(key, substitutions)
      if (value) return value
    }
  } catch (_error) {}

  // Safe default when key is missing.
  return fallback || key
}