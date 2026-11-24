import Constants from 'expo-constants'
import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { mutate } from 'swr'
import { api } from './api'
import { registerBackgroundEngine } from './background-engine'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export const pushSupported = Platform.OS !== 'web'

export type PushState = 'unsupported' | 'granted' | 'denied' | 'undetermined' | 'error'

let lastPushError: string | null = null
export const getLastPushError = () => lastPushError

function reportPushError(sessionToken: string, stage: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err)
  lastPushError = message
  api('/push-error', {
    token: sessionToken,
    method: 'POST',
    body: {
      stage,
      message: message.slice(0, 500),
      platform: Platform.OS,
      isDevice: true,
      appOwnership: Constants.appOwnership ?? null,
    },
  }).catch(() => {})
}

/** Configures high-priority notification channel for Android */
export async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Messages and reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 150, 250],
      lightColor: '#1D5BB0',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
      enableLights: true,
      bypassDnd: false,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    })
  }
}

/** Triggers system notification permission prompt (e.g. on app launch) */
export async function requestPushPermission(): Promise<boolean> {
  if (!pushSupported) return false
  try {
    await ensureNotificationChannel()
    let { status } = await Notifications.getPermissionsAsync()
    if (status !== 'granted') {
      const res = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
        android: {},
      })
      status = res.status
    }
    return status === 'granted'
  } catch {
    return false
  }
}

/** Asks for notification permission and registers device push token with backend */
export async function registerForPush(sessionToken: string): Promise<PushState> {
  if (!pushSupported) return 'unsupported'
  let stage = 'permission'
  try {
    await ensureNotificationChannel()
    let { status } = await Notifications.getPermissionsAsync()
    if (status !== 'granted') {
      const res = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
        android: {},
      })
      status = res.status
    }
    if (status !== 'granted') return status === 'denied' ? 'denied' : 'undetermined'

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId ??
      'fd2e6705-5501-4056-9959-b278d05ae7b1'

    stage = 'expo-token'
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId })
    stage = 'save-token'
    await api('/push-token', {
      token: sessionToken,
      method: 'POST',
      body: { token: data, platform: Platform.OS },
    })
    lastPushError = null
    registerBackgroundEngine().catch(() => {})
    return 'granted'
  } catch (err) {
    reportPushError(sessionToken, stage, err)
    return 'error'
  }
}

/** Current permission without prompting, so the app can offer a friendly opt-in card */
export function usePushState() {
  const [state, setState] = useState<PushState>(pushSupported ? 'undetermined' : 'unsupported')
  useEffect(() => {
    if (!pushSupported) return
    Notifications.getPermissionsAsync()
      .then(({ status }) =>
        setState(status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined'),
      )
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

/** Opens the right screen when a parent taps a notification, and refreshes data when one arrives */
export function useNotificationRouting() {
  useEffect(() => {
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
