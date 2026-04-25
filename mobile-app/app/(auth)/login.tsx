import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@any-project-base/commons/lib/supabase'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const signIn = async () => {
    setLoading(true)
    setError(null)
    const { error: e } = await supabase.auth.signInWithPassword({ email, password })
    if (e) { setError(e.message); setLoading(false) }
    else router.replace('/')
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in</Text>

      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={() => { void signIn() }} disabled={loading}>
        <Text style={styles.btnText}>{loading ? '…' : 'Sign in'}</Text>
      </TouchableOpacity>

      {/* DevLogin renders on non-prod — mobile native version */}
      {Platform.OS !== 'web' && <DevLoginNative />}
    </View>
  )
}

// Mobile DevLogin — mirrors commons DevLogin logic using native UI
function DevLoginNative() {
  const router = useRouter()
  const DEV_USERS = [
    { label: 'Admin',   email: 'admin@dev.local' },
    { label: 'Support', email: 'support@dev.local' },
    { label: 'User',    email: 'user@dev.local' },
  ]

  const devLogin = async (email: string) => {
    const { fetchApi } = await import('@any-project-base/commons/api/fetchApi')
    const { config } = await import('@any-project-base/commons')
    const { url } = await fetchApi<{ url: string }>(`${config.apiUrl}/dev-login`, {
      method: 'POST', body: JSON.stringify({ email }),
    })
    const Linking = (await import('expo-linking')).default
    await Linking.openURL(url)
  }

  return (
    <View style={styles.devBox}>
      <Text style={styles.devLabel}>DEV LOGIN</Text>
      {DEV_USERS.map(u => (
        <TouchableOpacity key={u.email} style={styles.devBtn} onPress={() => { void devLogin(u.email) }}>
          <Text style={styles.devBtnText}>▶ {u.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title:     { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 32 },
  input:     { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  error:     { color: '#ef4444', fontSize: 13, marginBottom: 8 },
  btn:       { backgroundColor: '#6366f1', borderRadius: 8, padding: 14, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText:   { color: '#fff', fontWeight: '700', fontSize: 16 },
  devBox:    { marginTop: 32, padding: 16, backgroundColor: '#f9fafb', borderRadius: 8 },
  devLabel:  { fontSize: 11, fontWeight: '700', color: '#6b7280', marginBottom: 8, textTransform: 'uppercase' },
  devBtn:    { padding: 10, backgroundColor: '#fff', borderRadius: 6, marginBottom: 6, borderWidth: 1, borderColor: '#e5e7eb' },
  devBtnText:{ fontSize: 14, fontWeight: '500' },
})
