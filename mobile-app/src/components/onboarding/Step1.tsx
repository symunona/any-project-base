import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useOnboarding } from './useOnboarding'

const OPTIONS = [
  'Building a product',
  'Personal project',
  'Learning / exploring',
  'For a client',
  'Other',
]

export function Step1({ onSelect }: { onSelect: (value: string) => Promise<void> }) {
  const { skip } = useOnboarding()

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What brings you here?</Text>
      <Text style={styles.subtitle}>Helps us tailor your experience.</Text>
      {OPTIONS.map((opt) => (
        <TouchableOpacity key={opt} style={styles.option} onPress={() => { void onSelect(opt) }}>
          <Text style={styles.optionText}>{opt}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity onPress={() => { void skip() }}>
        <Text style={styles.skip}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container:   { flex: 1, padding: 32, backgroundColor: '#f8f9fa' },
  title:       { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle:    { color: '#6b7280', marginBottom: 32 },
  option:      { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 16, marginBottom: 12, backgroundColor: '#fff' },
  optionText:  { fontSize: 16, color: '#111827' },
  skip:        { marginTop: 16, color: '#9ca3af', textAlign: 'center' },
})
