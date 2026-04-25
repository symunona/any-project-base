// Landing page — lang detection, lang pref save, scroll effects, login resolver.
import { startOrbitLogo } from './orbit-logo.js'

const SUPPORTED_LOCALES = ['en', 'es', 'ko']
const DEFAULT_LOCALE = 'en'

function detectLocale() {
  const saved = localStorage.getItem('lang') || getCookie('lang')
  if (saved && SUPPORTED_LOCALES.includes(saved)) return saved
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

  const match = path.match(/^\/(en|es|ko)(\/|$)/)
  if (match) {
    saveLangPref(match[1])
    markActiveLang(match[1])
    return
  }

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

// Resolves the client portal URL based on current environment.
// localhost / 127.0.0.1       → http://localhost:5173 (direct Vite port)
// [project].localhost         → portal.[project].localhost (Caddy subdomain)
// [domain].tld                → portal.[domain].tld (production)
function resolvePortalUrl() {
  const { hostname, protocol } = window.location
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5173'
  }
  // Caddy localdev:  any-project-base.localhost → portal.any-project-base.localhost
  // Production:      myapp.com                  → portal.myapp.com
  return `${protocol}//portal.${hostname}`
}

document.addEventListener('DOMContentLoaded', () => {
  const orbitEl = document.getElementById('orbit-logo-hero')
  if (orbitEl) startOrbitLogo(orbitEl)

  redirectToLocale()

  // ── Lang selector ──
  document.querySelectorAll('.lang-selector a').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault()
      const lang = a.dataset.lang
      saveLangPref(lang)
      window.location.href = lang === DEFAULT_LOCALE ? '/' : `/${lang}/`
    })
  })

  // ── Sticky header scroll effect ──
  const header = document.getElementById('site-header')
  if (header) {
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 40)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll() // apply immediately in case page loads scrolled
  }

  // ── Login button URL resolution ──
  const portalUrl = resolvePortalUrl()
  document.querySelectorAll('#login-btn, #hero-login-btn, #cta-login-btn').forEach(btn => {
    btn.href = portalUrl
  })
})
