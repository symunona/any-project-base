import { useState, useEffect } from 'react'
import { config } from '../config'
import type { Messages } from './messages/en'

export type Descriptor = { id: string; message: string }

// Lazy-loaded locale bundles
const bundles: Partial<Record<string, Messages>> = {}

let currentLocale = config.defaultLocale ?? 'en'
let currentBundle: Messages | null = null

async function loadLocale(locale: string): Promise<Messages> {
  if (bundles[locale]) return bundles[locale]!
  try {
    const mod = await import(`./messages/${locale}`) as { messages: Messages }
    bundles[locale] = mod.messages
    return mod.messages
  } catch {
    // fallback to en
    const fallback = await import('./messages/en')
    bundles[locale] = fallback.messages
    return fallback.messages
  }
}

export function t(descriptor: Descriptor, params?: Record<string, string | number>): string {
  const bundle = currentBundle
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value = bundle ? (bundle as any)[descriptor.id] as string | undefined : undefined
  const text = value ?? descriptor.message

  if (!params) return text
  return Object.entries(params).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
    text,
  )
}

export function useT() {
  const [locale, setLocale] = useState(currentLocale)
  const [, setReady] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('lang')
    const target = stored ?? navigator.language.split('-')[0] ?? config.defaultLocale ?? 'en'
    const supported = config.supportedLocales ?? ['en']
    const resolved = supported.includes(target) ? target : config.defaultLocale ?? 'en'
    currentLocale = resolved

    loadLocale(resolved).then(bundle => {
      currentBundle = bundle
      setLocale(resolved)
      setReady(true)
    }).catch(() => { setReady(true) })
  }, [])

  return { t, locale }
}

// Message builder (used as descriptor reference)
export const msg = {
  Common: {
    save:    { id: 'Common.save',    message: 'Save' },
    cancel:  { id: 'Common.cancel',  message: 'Cancel' },
    delete:  { id: 'Common.delete',  message: 'Delete' },
    confirm: { id: 'Common.confirm', message: 'Confirm' },
    loading: { id: 'Common.loading', message: 'Loading…' },
    saved:   { id: 'Common.saved',   message: 'Saved' },
    error:   { id: 'Common.error',   message: 'Something went wrong' },
  },
  Errors: {
    generic:       { id: 'Errors.generic',       message: 'Something went wrong. Please try again.' },
    unauthorized:  { id: 'Errors.unauthorized',  message: 'You are not authorized to do this.' },
    notFound:      { id: 'Errors.notFound',       message: 'Not found.' },
    credits:       { id: 'Errors.credits',        message: 'Out of credits. Upgrade your plan.' },
  },
  Auth: {
    signIn:        { id: 'Auth.signIn',        message: 'Sign in' },
    signOut:       { id: 'Auth.signOut',       message: 'Sign out' },
    email:         { id: 'Auth.email',         message: 'Email' },
    password:      { id: 'Auth.password',      message: 'Password' },
    forgotPassword:{ id: 'Auth.forgotPassword',message: 'Forgot password?' },
  },
  Nav: {
    dashboard: { id: 'Nav.dashboard', message: 'Dashboard' },
    settings:  { id: 'Nav.settings',  message: 'Settings' },
    billing:   { id: 'Nav.billing',   message: 'Billing' },
    support:   { id: 'Nav.support',   message: 'Support' },
  },
  Dashboard: {
    title: { id: 'Dashboard.title', message: 'Dashboard' },
  },
  Profile: {
    title: { id: 'Profile.title', message: 'Profile' },
    name:  { id: 'Profile.name',  message: 'Name' },
    email: { id: 'Profile.email', message: 'Email' },
  },
  Billing: {
    title: { id: 'Billing.title', message: 'Billing' },
  },
  Support: {
    title:      { id: 'Support.title',      message: 'Support' },
    newMessage: { id: 'Support.newMessage', message: 'New message' },
    send:       { id: 'Support.send',       message: 'Send' },
  },
}
