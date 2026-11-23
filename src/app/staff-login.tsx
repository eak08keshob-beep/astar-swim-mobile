import Ionicons from '@expo/vector-icons/Ionicons'
import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
  BackHandler,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { WebView, type WebViewNavigation } from 'react-native-webview'
import { BASE_URL } from '../lib/api'
import { useSession } from '../lib/session'
import { colors, space } from '../lib/theme'
import { getStaffLastUrl, setActiveRole, setStaffLastUrl } from '../lib/user-role'

const STAFF_PORTAL_URL = `${BASE_URL}/staff-login`

export default function StaffLoginScreen() {
  const insets = useSafeAreaInsets()
  const webViewRef = useRef<WebView>(null)
  const { token } = useSession()
  const [canGoBack, setCanGoBack] = useState(false)
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)

  // Ensure active role is set to staff upon mounting the staff portal screen
  useEffect(() => {
    setActiveRole('staff').catch(() => {})
    getStaffLastUrl().then((savedUrl) => {
      if (savedUrl && !savedUrl.includes('/sign-out')) {
        setCurrentUrl(savedUrl)
      } else {
        setCurrentUrl(STAFF_PORTAL_URL)
      }
    })
  }, [])

  const handleBackToParent = async () => {
    // When returning to parent app, switch active role to parent (if signed in) or null
    const nextRole = token ? 'parent' : null
    await setActiveRole(nextRole)
    if (token) {
      router.replace('/(tabs)')
    } else {
      router.replace('/welcome')
    }
  }

  // Handle hardware back button on Android: navigate back in WebView history or exit to parent app
  useEffect(() => {
    if (Platform.OS !== 'android') return

    const onBackPress = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack()
        return true
      }
      handleBackToParent()
      return true
    }

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress)
    return () => sub.remove()
  }, [canGoBack, token])

  const onNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack)
    if (navState.url) {
      // Keep active role pinned to staff while navigating inside staff portal
      if (navState.url.includes('astarswimmanagement.com') || navState.url.includes('localhost')) {
        setActiveRole('staff').catch(() => {})
        if (!navState.url.includes('/staff-login') && !navState.url.includes('/sign-out')) {
          setStaffLastUrl(navState.url).catch(() => {})
        }
      }
    }
  }

  const topInset = Math.max(insets.top, StatusBar.currentHeight ?? 0, 24)

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={true} />

      {/* Safe Area Header with clean padding below device status bar icons */}
      <View style={[styles.headerContainer, { paddingTop: topInset }]}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to Parent App"
            onPress={handleBackToParent}
            hitSlop={12}
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
            <Text style={styles.backButtonText}>Parent App</Text>
          </Pressable>

          <View style={styles.titleContainer}>
            <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
            <Text style={styles.headerTitle} numberOfLines={1}>
              Staff Portal
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reload page"
            onPress={() => webViewRef.current?.reload()}
            hitSlop={12}
            style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="reload" size={18} color={colors.muted} />
          </Pressable>
        </View>
      </View>

      {/* In-App WebView - Seamless rendering with persistent cookies and session */}
      <View style={styles.webViewContainer}>
        {currentUrl ? (
          <WebView
            ref={webViewRef}
            source={{ uri: currentUrl }}
            style={styles.webView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            sharedCookiesEnabled={true}
            thirdPartyCookiesEnabled={true}
            cacheEnabled={true}
            incognito={false}
            allowsBackForwardNavigationGestures={true}
            applicationNameForUserAgent="AStarSwimSchools-MobileApp/1.0.7"
            onNavigationStateChange={onNavigationStateChange}
          />
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  header: {
    height: 52,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  actionButton: {
    padding: space.xs,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
})
