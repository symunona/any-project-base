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

const UNAUTHED: AuthState = { user: null, role: null, isAdmin: false, isSupport: false, loading: false }

async function resolveSession(session: Session | null): Promise<AuthState> {
  if (!session) return UNAUTHED

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (error || !data) return UNAUTHED

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
    let cancelled = false

    const init = async () => {
      try {
        // Race getSession against a timeout — stale/invalid cookies can cause
        // the Supabase client to hang indefinitely waiting for a token refresh.
        const result = await Promise.race([
          supabase.auth.getSession(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('auth_timeout')), 4000),
          ),
        ])
        if (!cancelled) setState(await resolveSession(result.data.session))
      } catch {
        // Timed out or hard error — clear stale session, proceed unauthenticated
        if (!cancelled) {
          void supabase.auth.signOut()
          setState(UNAUTHED)
        }
      }
    }

    void init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION' || cancelled) return
        setState(await resolveSession(session))
      },
    )

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  return state
}
