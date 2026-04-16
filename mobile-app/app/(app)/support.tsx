import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { useState } from 'react'
import { fetchApi } from '@any-project-base/commons'
import { config } from '@any-project-base/commons'

export default function SupportScreen() {
  const [body, setBody] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const send = async () => {
    if (!body.trim()) return
    setLoading(true)
    try {
      await fetchApi(`${config.apiUrl}/support`, {
        method: 'POST', body: JSON.stringify({ body }),
      })
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Message sent!</Text>
        <Text style={styles.text}>We'll reply by email as soon as possible.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => { setSent(false); setBody('') }}>
          <Text style={styles.btnText}>Send another</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Support</Text>
      <TextInput
        style={styles.textarea}
        value={body}
        onChangeText={setBody}
        placeholder="Describe your issue…"
        multiline
        numberOfLines={6}
      />
      <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={() => { void send() }} disabled={loading}>
        <Text style={styles.btnText}>{loading ? '…' : 'Send'}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f8f9fa' },
  title:     { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  text:      { color: '#6b7280', marginBottom: 24 },
  textarea:  { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, fontSize: 16, minHeight: 120, textAlignVertical: 'top', marginBottom: 16, backgroundColor: '#fff' },
  btn:       { backgroundColor: '#6366f1', borderRadius: 8, padding: 14, alignItems: 'center' },
  btnText:   { color: '#fff', fontWeight: '700', fontSize: 16 },
})
