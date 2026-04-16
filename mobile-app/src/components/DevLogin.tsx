import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Linking } from 'react-native'
import { config } from '@any-project-base/commons'
import { fetchApi } from '@any-project-base/commons'

const SEED_USERS = [
  { label: 'Admin',         email: 'admin@dev.local' },
  { label: 'Support',       email: 'support@dev.local' },
  { label: 'User',          email: 'user@dev.local' },
  { label: 'No Credits',    email: 'user-nocredits@dev.local' },
  { label: 'Subscribed',    email: 'user-sub@dev.local' },
]

export function DevLogin() {
  if (config.appEnv === 'prod') return null

  const loginAs = async (email: string) => {
    const res = await fetchApi(`${config.apiUrl}/dev-login`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    }) as { magic_link: string }
    await Linking.openURL(res.magic_link)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Dev login</Text>
      <View style={styles.row}>
        {SEED_USERS.map((u) => (
          <TouchableOpacity key={u.email} style={styles.btn} onPress={() => { void loginAs(u.email) }}>
            <Text style={styles.btnText}>{u.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginTop: 32, padding: 16, borderWidth: 1, borderColor: '#fbbf24', borderRadius: 8, backgroundColor: '#fffbeb' },
  label:     { fontSize: 12, color: '#92400e', fontWeight: '700', marginBottom: 8 },
  row:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  btn:       { backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fbbf24', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  btnText:   { fontSize: 13, color: '#92400e' },
})
