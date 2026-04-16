import { View, Text, StyleSheet } from 'react-native'
import { config } from '@any-project-base/commons'

export default function BillingScreen() {
  if (config.pricingModel === 'none') {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Billing not enabled for this project.</Text>
      </View>
    )
  }
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Billing</Text>
      <Text style={styles.text}>Plan details and credits go here.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f8f9fa' },
  title:     { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  text:      { color: '#6b7280' },
})
