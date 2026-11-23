import Ionicons from '@expo/vector-icons/Ionicons'
import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { WebView } from 'react-native-webview'
import { BASE_URL } from '../lib/api'
import { colors, space } from '../lib/theme'

const STAFF_PORTAL_URL = `${BASE_URL}/staff-login`

export default function StaffLoginScreen() {
  const webViewRef = useRef<WebView>(null)
  const [canGoBack, setCanGoBack] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Handle hardware back button on Android to navigate back inside WebView or exit to parent app
  useEffect(() => {
    if (Platform.OS !== 'android') return

    const onBackPress = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack()
        return true
      }
      router.back()
      return true
    }

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress)
    return () => sub.remove()
  }, [canGoBack])

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Native App Header - Always allows user to return to parent app */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to Parent App"
          onPress={() => router.back()}
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

      {/* In-App WebView - Never leaves the application container */}
      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: STAFF_PORTAL_URL }}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          allowsBackForwardNavigationGestures={true}
          applicationNameForUserAgent="AStarSwimSchools-MobileApp/1.0.6"
          onNavigationStateChange={(navState) => {
            setCanGoBack(navState.canGoBack)
          }}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading Staff Portal…</Text>
            </View>
          )}
          startInLoadingState={true}
        />
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading Staff Portal…</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
  },
  loadingText: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '500',
  },
})
