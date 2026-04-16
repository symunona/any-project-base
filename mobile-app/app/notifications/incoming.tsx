import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'

export default function IncomingNotificationScreen() {
  const { title, body, data } = useLocalSearchParams<{ title: string; body: string; data: string }>()
  const router = useRouter()

  const parsed = data ? (() => { try { return JSON.parse(data) as Record<string, unknown> } catch { return {} } })() : {}

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title ?? 'Notification'}</Text>
      <Text style={styles.body}>{body ?? ''}</Text>
      {parsed['url'] && typeof parsed['url'] === 'string' && (
        <TouchableOpacity style={styles.btn} onPress={() => { router.push(parsed['url'] as never) }}>
          <Text style={styles.btnText}>Open</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.back} onPress={() => { router.replace('/(app)/dashboard') }}>
        <Text style={styles.backText}>Go to Dashboard</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 32, justifyContent: 'center', backgroundColor: '#f8f9fa' },
  title:     { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  body:      { fontSize: 16, color: '#374151', marginBottom: 32, lineHeight: 24 },
  btn:       { backgroundColor: '#6366f1', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 12 },
  btnText:   { color: '#fff', fontWeight: '700', fontSize: 16 },
  back:      { padding: 14, alignItems: 'center' },
  backText:  { color: '#6b7280', fontSize: 15 },
})
