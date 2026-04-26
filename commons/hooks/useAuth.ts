import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { User } from '../types/project.types'
import type { Role } from '../constants'

type AuthState = {
  user: User | null
  role: Role | null
  isAdmin: boolean
  isSupport: boolean
  loading: boolean
}

async function resolveSession(session: Session | null): Promise<AuthState> {
  if (!session) {
    return { user: null, role: null, isAdmin: false, isSupport: false, loading: false }
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (error || !data) {
    return { user: null, role: null, isAdmin: false, isSupport: false, loading: false }
  }

  const user = data as unknown as User
  const role = user.role as Role
  return {
    user,
    role,
    isAdmin: role === 'admin',
    isSupport: role === 'support' || role === 'admin',
    loading: false,
  }
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    isAdmin: false,
    isSupport: false,
    loading: true,
  })

  useEffect(() => {
    // getSession() reliably returns the current session without depending on
    // INITIAL_SESSION firing (which @supabase/ssr doesn't always emit in SPAs).
    supabase.auth.getSession().then(({ data: { session } }) => {
      resolveSession(session).then(setState)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Skip INITIAL_SESSION — already handled by getSession() above.
        if (event === 'INITIAL_SESSION') return
        setState(await resolveSession(session))
      },
    )

    return () => { subscription.unsubscribe() }
  }, [])

  return state
}
