import Ionicons from '@expo/vector-icons/Ionicons'
import { useRef, type ReactNode } from 'react'
import { Animated, PanResponder, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { colors, radius } from '../lib/theme'

const ACTION_WIDTH = 96

/** Swipe left to reveal Delete; a long swipe deletes straight away. */
export function SwipeToDelete({ children, onDelete, label }: { children: ReactNode; onDelete: () => void; label: string }) {
  const { width } = useWindowDimensions()
  const translateX = useRef(new Animated.Value(0)).current
  const offset = useRef(0)

  const settle = (to: number) => {
    offset.current = to
    Animated.spring(translateX, { toValue: to, useNativeDriver: false, bounciness: 0, speed: 20 }).start()
  }

  const remove = () => {
    Animated.timing(translateX, { toValue: -width, duration: 180, useNativeDriver: false }).start(() => onDelete())
  }

  const responder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, g) => {
        translateX.setValue(Math.min(0, offset.current + g.dx))
      },
      onPanResponderRelease: (_, g) => {
        const x = offset.current + g.dx
        if (x < -width * 0.45 || g.vx < -1.2) remove()
        else if (x < -ACTION_WIDTH / 2) settle(-ACTION_WIDTH)
        else settle(0)
      },
      onPanResponderTerminate: () => settle(offset.current),
    }),
  ).current

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Delete ${label}`}
        onPress={remove}
        style={styles.action}
      >
        <Ionicons name="trash-outline" size={22} color={colors.onPrimary} />
        <Text style={styles.actionText}>Delete</Text>
      </Pressable>
      <Animated.View
        {...responder.panHandlers}
        accessibilityActions={[{ name: 'delete', label: 'Delete' }]}
        onAccessibilityAction={(e) => e.nativeEvent.actionName === 'delete' && remove()}
        style={{ transform: [{ translateX }] }}
      >
        {children}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.danger },
  action: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: ACTION_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionText: { color: colors.onPrimary, fontSize: 13, fontWeight: '700' },
})
