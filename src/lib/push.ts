import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { mutate } from 'swr'
import { api } from './api'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export const pushSupported = Platform.OS !== 'web' && Device.isDevice

export type PushState = 'unsupported' | 'granted' | 'denied' | 'undetermined'

/** Asks for notification permission and sends this device's push token to the school. */
export async function registerForPush(sessionToken: string): Promise<PushState> {
  if (!pushSupported) return 'unsupported'
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Messages and reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 200, 120, 200],
        lightColor: '#1D5BB0',
      })
    }
    let { status } = await Notifications.getPermissionsAsync()
    if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status
    if (status !== 'granted') return status === 'denied' ? 'denied' : 'undetermined'

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId
    if (!projectId) return 'granted'
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId })
    await api('/push-token', { token: sessionToken, method: 'POST', body: { token: data, platform: Platform.OS } })
    return 'granted'
  } catch {
    return 'undetermined'
  }
}

/** Current permission without prompting, so the app can offer a friendly opt-in card. */
export function usePushState() {
  const [state, setState] = useState<PushState>(pushSupported ? 'undetermined' : 'unsupported')
  useEffect(() => {
    if (!pushSupported) return
    Notifications.getPermissionsAsync()
      .then(({ status }) => setState(status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined'))
      .catch(() => {})
  }, [])
  return [state, setState] as const
}

function openFromNotification(data: Record<string, unknown> | undefined) {
  const screen = data?.screen
  const id = typeof data?.id === 'number' ? data.id : Number(data?.messageId)
  if (screen === 'message' || (!screen && id)) router.push(`/message/${id}`)
  else if (screen === 'messages') router.navigate('/messages')
  else if (screen === 'swimmers') router.navigate('/swimmers')
  else if (screen === 'payments') router.navigate('/payments')
  else router.navigate('/')
}

const refreshEverything = () => mutate(() => true)

/** Opens the right screen when a parent taps a notification, and refreshes data when one arrives. */
export function useNotificationRouting() {
  useEffect(() => {
    // Notification APIs are native-only; calling them in the web preview throws.
    if (!pushSupported) return

    const handleTap = (response: Notifications.NotificationResponse) => {
      refreshEverything()
      openFromNotification(response.notification.request.content.data)
    }

    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!response) return
        handleTap(response)
        return Notifications.clearLastNotificationResponseAsync()
      })
      .catch(() => {})

    const tapSub = Notifications.addNotificationResponseReceivedListener(handleTap)
    const receivedSub = Notifications.addNotificationReceivedListener(refreshEverything)
    return () => {
      tapSub.remove()
      receivedSub.remove()
    }
  }, [])
}
