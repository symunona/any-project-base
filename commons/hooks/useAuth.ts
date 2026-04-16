import { useState, useEffect } from 'react'
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

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    isAdmin: false,
    isSupport: false,
    loading: true,
  })

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session) {
          setState({ user: null, role: null, isAdmin: false, isSupport: false, loading: false })
          return
        }

        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (error || !data) {
          setState({ user: null, role: null, isAdmin: false, isSupport: false, loading: false })
          return
        }

        const user = data as unknown as User
        const role = user.role as Role
        setState({
          user,
          role,
          isAdmin: role === 'admin',
          isSupport: role === 'support' || role === 'admin',
          loading: false,
        })
      },
    )

    return () => { subscription.unsubscribe() }
  }, [])

  return state
}
