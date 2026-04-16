import { Tabs } from 'expo-router'
import { useAuth } from '@any-project-base/commons'
import { Redirect } from 'expo-router'

export default function AppLayout() {
  const { user, loading } = useAuth()

  if (loading) return null
  if (!user) return <Redirect href="/(auth)/login" />

  return (
    <Tabs screenOptions={{ headerShown: true, tabBarActiveTintColor: '#6366f1' }}>
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="settings"  options={{ title: 'Settings' }} />
      <Tabs.Screen name="billing"   options={{ title: 'Billing' }} />
      <Tabs.Screen name="support"   options={{ title: 'Support' }} />
    </Tabs>
  )
}
