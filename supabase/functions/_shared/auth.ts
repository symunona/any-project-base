import type { Context } from 'https://deno.land/x/hono@v4.7.7/mod.ts'
import { getAdminClient } from './db.ts'

export type AuthUser = {
  id: string
  email: string
  role: string
}

// requireAuth — returns 401 if no valid session
export async function requireAuth(c: Context): Promise<AuthUser> {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401) as never
  }

  const token = authHeader.slice(7)
  const admin = getAdminClient()

  const { data: { user }, error } = await admin.auth.getUser(token)
  if (error || !user) {
    return c.json({ error: 'Unauthorized' }, 401) as never
  }

  // Fetch role from public.users
  const { data } = await admin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  // Update last_seen on devices
  await admin
    .from('devices')
    .update({ last_seen: new Date().toISOString() })
    .eq('user_id', user.id)

  return {
    id: user.id,
    email: user.email ?? '',
    role: data?.role ?? 'user',
  }
}

// requireRole — returns 403 if role not in allowed list
export async function requireRole(
  c: Context,
  ...roles: string[]
): Promise<AuthUser> {
  const user = await requireAuth(c)
  if (!roles.includes(user.role)) {
    return c.json({ error: 'Forbidden' }, 403) as never
  }
  return user
}
