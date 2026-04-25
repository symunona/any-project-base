// Source of truth — all keys defined here. Other locale files must match this structure exactly.
// Record<keyof ..., string> keeps key checking but allows translated (non-English) string values.
export type Messages = Record<keyof typeof messages, string>

export const messages = {
  'Common.save':    'Save',
  'Common.cancel':  'Cancel',
  'Common.delete':  'Delete',
  'Common.confirm': 'Confirm',
  'Common.loading': 'Loading…',
  'Common.saved':   'Saved',
  'Common.error':   'Something went wrong',
  'Errors.generic':       'Something went wrong. Please try again.',
  'Errors.unauthorized':  'You are not authorized to do this.',
  'Errors.notFound':      'Not found.',
  'Errors.credits':       'Out of credits. Upgrade your plan.',
  'Auth.signIn':          'Sign in',
  'Auth.signOut':         'Sign out',
  'Auth.email':           'Email',
  'Auth.password':        'Password',
  'Auth.forgotPassword':  'Forgot password?',
  'Nav.dashboard':        'Dashboard',
  'Nav.settings':         'Settings',
  'Nav.billing':          'Billing',
  'Nav.support':          'Support',
  'Dashboard.title':      'Dashboard',
  'Profile.title':        'Profile',
  'Profile.name':         'Name',
  'Profile.email':        'Email',
  'Billing.title':        'Billing',
  'Support.title':        'Support',
  'Support.newMessage':   'New message',
  'Support.send':         'Send',
} as const
