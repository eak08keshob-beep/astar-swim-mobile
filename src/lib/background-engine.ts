import * as BackgroundFetch from 'expo-background-fetch'
import * as Notifications from 'expo-notifications'
import * as SecureStore from 'expo-secure-store'
import * as TaskManager from 'expo-task-manager'
import { Platform } from 'react-native'
import { BASE_URL } from './api'
import { ensureNotificationChannel, NOTIFICATION_SOUND } from './push'

export const BACKGROUND_NOTIFICATION_TASK = 'ASTAR_BACKGROUND_NOTIFICATION_TASK'
export const BACKGROUND_FETCH_TASK = 'ASTAR_BACKGROUND_SYNC_TASK'

const LAST_NOTIFIED_KEY = 'astar.last_notified_unread'
const LAST_MESSAGE_ID_KEY = 'astar.last_notified_msg_id'

// 1. Headless Background Remote Notification Handler
// Invoked by Android when high-priority FCM notification arrives while app is backgrounded or killed
try {
  TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
    if (error) {
      return
    }
    // Headless notification received in background/terminated state
  })
} catch {
  // Task already defined or not supported on this platform
}

// 2. Battery-Friendly Background Sync Engine
// Invoked periodically by Android WorkManager / JobScheduler (every 15 min minimum) even if app is closed
try {
  TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
    if (Platform.OS === 'web') return BackgroundFetch.BackgroundFetchResult.NoData

    try {
      const token = await SecureStore.getItemAsync('astar.session')
      if (!token) {
        return BackgroundFetch.BackgroundFetchResult.NoData
      }

      // Check current user summary for unread messages
      const res = await fetch(`${BASE_URL}/api/app/me`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        return BackgroundFetch.BackgroundFetchResult.Failed
      }

      const summary = await res.json().catch(() => null)
      const unreadCount = typeof summary?.unreadCount === 'number' ? summary.unreadCount : 0

      const lastNotifiedStr = await SecureStore.getItemAsync(LAST_NOTIFIED_KEY)
      const lastNotified = lastNotifiedStr ? parseInt(lastNotifiedStr, 10) : 0

      const lastMsgIdStr = await SecureStore.getItemAsync(LAST_MESSAGE_ID_KEY)
      const lastMsgId = lastMsgIdStr ? parseInt(lastMsgIdStr, 10) : 0

      if (unreadCount > 0 && unreadCount > lastNotified) {
        await ensureNotificationChannel()

        // Attempt to fetch the latest message details to provide a rich notification
        let notificationTitle = 'A Star Swim Schools'
        let notificationBody =
          unreadCount === 1
            ? 'You have 1 new message from the swim school.'
            : `You have ${unreadCount} new messages from the swim school.`
        let targetData: Record<string, unknown> = { screen: 'messages' }
        let currentNewestId = 0

        try {
          const msgRes = await fetch(`${BASE_URL}/api/app/messages`, {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          })
          if (msgRes.ok) {
            const messages = await msgRes.json().catch(() => [])
            if (Array.isArray(messages) && messages.length > 0) {
              const unreadMsg = messages.find((m: any) => !m.readAt) || messages[0]
              if (unreadMsg && unreadMsg.id !== lastMsgId) {
                currentNewestId = unreadMsg.id
                notificationTitle = unreadMsg.subject || 'New Message'
                notificationBody = unreadMsg.body
                  ? unreadMsg.body.replace(/\s+/g, ' ').trim().slice(0, 120)
                  : 'New message from A Star Swim Schools'
                targetData = { screen: 'message', id: unreadMsg.id, messageId: unreadMsg.id }
              }
            }
          }
        } catch {
          // If messages fetch fails, fall back to summary notification
        }

        await Notifications.scheduleNotificationAsync({
          content: {
            title: notificationTitle,
            body: notificationBody,
            data: targetData,
            sound: NOTIFICATION_SOUND,
            badge: unreadCount,
          },
          trigger: null, // Instant presentation using defaultChannel ('whistle')
        })

        await SecureStore.setItemAsync(LAST_NOTIFIED_KEY, String(unreadCount))
        if (currentNewestId > 0) {
          await SecureStore.setItemAsync(LAST_MESSAGE_ID_KEY, String(currentNewestId))
        }

        return BackgroundFetch.BackgroundFetchResult.NewData
      }

      if (unreadCount === 0 && lastNotified > 0) {
        await SecureStore.setItemAsync(LAST_NOTIFIED_KEY, '0')
      }

      return BackgroundFetch.BackgroundFetchResult.NoData
    } catch {
      return BackgroundFetch.BackgroundFetchResult.Failed
    }
  })
} catch {
  // Task already defined or not supported
}

/**
 * Registers background notification and sync engines.
 * Called on app bootstrap and when a user signs in.
 */
export async function registerBackgroundEngine(): Promise<void> {
  if (Platform.OS === 'web') return

  try {
    await ensureNotificationChannel()

    // 1. Register background remote notification receiver
    try {
      const isRemoteRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK)
      if (!isRemoteRegistered) {
        await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK)
      }
    } catch {}

    // 2. Register periodic background fetch sync engine (WorkManager / JobScheduler)
    try {
      const isFetchRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK)
      if (!isFetchRegistered) {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
          minimumInterval: 15 * 60, // 15 minutes (Android standard for battery preservation)
          stopOnTerminate: false,   // Keeps running after app is closed / swiped from recents
          startOnBoot: true,        // Automatically resumes after device reboot
        })
      }
    } catch {}
  } catch (err) {
    console.warn('Background engine registration warning:', err)
  }
}

/**
 * Clears the notification badge counter tracker when user reads messages.
 */
export async function markNotificationsRead(): Promise<void> {
  if (Platform.OS === 'web') return
  try {
    await SecureStore.setItemAsync(LAST_NOTIFIED_KEY, '0')
    await Notifications.setBadgeCountAsync(0).catch(() => {})
  } catch {}
}
