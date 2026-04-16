import { View, Text, StyleSheet } from 'react-native'
import { config } from '@any-project-base/commons'

// Demo dashboard — LLM chat goes here (same logic as web, native UI)
export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>
        LLM chat demo goes here.{'\n'}
        Pricing: {config.pricingModel}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f8f9fa' },
  title:     { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle:  { color: '#6b7280', lineHeight: 22 },
})
