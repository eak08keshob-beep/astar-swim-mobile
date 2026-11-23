import Ionicons from '@expo/vector-icons/Ionicons'
import { Tabs } from 'expo-router'
import { useEffect } from 'react'
import type { ColorValue } from 'react-native'
import type { Summary } from '../../lib/api'
import { registerForPush, useNotificationRouting } from '../../lib/push'
import { useSession } from '../../lib/session'
import { colors } from '../../lib/theme'
import { useApi } from '../../lib/use-api'

type IconName = keyof typeof Ionicons.glyphMap

const icon =
  (active: IconName, inactive: IconName) =>
  ({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) => (
    <Ionicons name={focused ? active : inactive} color={color as string} size={size} />
  )

export default function TabsLayout() {
  const { token } = useSession()
  const { data: summary } = useApi<Summary>('/me')

  useNotificationRouting()

  useEffect(() => {
    if (token) registerForPush(token)
  }, [token])

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border, height: 64, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text, fontWeight: '700', fontSize: 18 },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', headerShown: false, tabBarIcon: icon('home', 'home-outline') }} />
      <Tabs.Screen name="swimmers" options={{ title: 'Swimmers', tabBarIcon: icon('people', 'people-outline') }} />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: icon('chatbubble-ellipses', 'chatbubble-ellipses-outline'),
          tabBarBadge: summary?.unreadCount ? summary.unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.danger },
        }}
      />
      <Tabs.Screen name="payments" options={{ title: 'Payments', tabBarIcon: icon('wallet', 'wallet-outline') }} />
      <Tabs.Screen name="records" options={{ title: 'Records', tabBarIcon: icon('document-text', 'document-text-outline') }} />
    </Tabs>
  )
}
