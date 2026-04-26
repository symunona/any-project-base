import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, fetchWithToken } from '../lib/supabase'
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

/**
 * Fetches the public.users row using an explicit access token.
 * Uses fetchWithToken (plain fetch in supabase.ts) to bypass supabase.from()
 * which re-enters the GoTrueClient lock — causing a deadlock when called from
 * inside an onAuthStateChange callback where the lock is already held by the
 * GoTrueClient initialisation task.
 */
async function resolveSession(session: Session | null): Promise<AuthState> {
  if (!session) return UNAUTHED

  const data = await fetchWithToken<User>(
    'users',
    session.access_token,
    { 'id': `eq.${session.user.id}`, 'limit': '1' },
  )
  if (!data) return UNAUTHED

  const user = data as User
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
        // Race the entire auth resolution (getSession + DB lookup) against a
        // timeout. Stale/invalid cookies or a slow PostgREST can cause either
        // step to hang indefinitely.
        const authState = await Promise.race([
          (async () => {
            const { data } = await supabase.auth.getSession()
            return resolveSession(data.session)
          })(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('auth_timeout')), 4000),
          ),
        ])
        if (!cancelled) setState(authState)
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
        const authState = await resolveSession(session)
        if (!cancelled) setState(authState)
      },
    )

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  return state
}
