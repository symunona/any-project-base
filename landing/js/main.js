// Landing page — lang detection, lang pref save, dark mode, shared interactivity.

const SUPPORTED_LOCALES = ['en', 'es', 'ko']
const DEFAULT_LOCALE = 'en'

function detectLocale() {
  // Check cookie/localStorage first
  const saved = localStorage.getItem('lang') || getCookie('lang')
  if (saved && SUPPORTED_LOCALES.includes(saved)) return saved
  // Browser language
  const browser = (navigator.language || '').split('-')[0]
  return SUPPORTED_LOCALES.includes(browser) ? browser : DEFAULT_LOCALE
}

function getCookie(name) {
  return document.cookie.split(';').map(c => c.trim())
    .find(c => c.startsWith(name + '='))?.split('=')[1] ?? null
}

function saveLangPref(lang) {
  localStorage.setItem('lang', lang)
  document.cookie = `lang=${lang}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
}

function redirectToLocale() {
  const locale = detectLocale()
  const path = window.location.pathname

  // Already on a locale page — mark active, save pref
  const match = path.match(/^\/(en|es|ko)(\/|$)/)
  if (match) {
    saveLangPref(match[1])
    markActiveLang(match[1])
    return
  }

  // On root — redirect if non-default locale
  if (path === '/' && locale !== DEFAULT_LOCALE) {
    window.location.replace(`/${locale}/`)
    return
  }

  saveLangPref(DEFAULT_LOCALE)
  markActiveLang(DEFAULT_LOCALE)
}

function markActiveLang(lang) {
  document.querySelectorAll('.lang-selector a').forEach(a => {
    a.classList.toggle('active', a.dataset.lang === lang)
  })
}

// Lang selector click handler
document.addEventListener('DOMContentLoaded', () => {
  redirectToLocale()

  document.querySelectorAll('.lang-selector a').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault()
      const lang = a.dataset.lang
      saveLangPref(lang)
      window.location.href = lang === DEFAULT_LOCALE ? '/' : `/${lang}/`
    })
  })
})
