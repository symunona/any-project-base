import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native'
import { useState } from 'react'
import { useAuth } from '@any-project-base/commons'
import { supabase } from '@any-project-base/commons/lib/supabase'

export default function SettingsScreen() {
  const { user } = useAuth()
  const [darkMode, setDarkMode] = useState(user?.settings.dark_mode ?? false)

  const toggleDark = async (val: boolean) => {
    setDarkMode(val)
    await supabase.from('users').update({ settings: { ...user?.settings, dark_mode: val } }).eq('id', user?.id)
  }

  const signOut = async () => { await supabase.auth.signOut() }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.label}>{user?.name ?? user?.email}</Text>

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Dark mode</Text>
        <Switch value={darkMode} onValueChange={(v) => { void toggleDark(v) }} trackColor={{ true: '#6366f1' }} />
      </View>

      <TouchableOpacity style={styles.signOut} onPress={() => { void signOut() }}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f8f9fa' },
  title:     { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  label:     { color: '#6b7280', marginBottom: 24 },
  row:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderColor: '#e5e7eb' },
  rowLabel:  { fontSize: 16 },
  signOut:   { marginTop: 32, padding: 14, backgroundColor: '#ef4444', borderRadius: 8, alignItems: 'center' },
  signOutText: { color: '#fff', fontWeight: '700' },
})
