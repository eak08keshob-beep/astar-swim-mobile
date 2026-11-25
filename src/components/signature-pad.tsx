import { useMemo, useRef, useState } from 'react'
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { colors, radius, space, type } from '../lib/theme'

export type Signature = { width: number; height: number; strokes: number[][] }

const HEIGHT = 180

function toPath(strokes: number[][]) {
  return strokes
    .map((s) => {
      const pts: string[] = []
      for (let i = 0; i < s.length; i += 2) pts.push(`${s[i].toFixed(1)} ${s[i + 1].toFixed(1)}`)
      if (pts.length === 1) pts.push(pts[0])
      return `M${pts[0]} L${pts.slice(1).join(' ')}`
    })
    .join(' ')
}

export function SignaturePad({
  onChange,
  onDrawingChange,
}: {
  onChange: (signature: Signature | null) => void
  onDrawingChange?: (drawing: boolean) => void
}) {
  const [width, setWidth] = useState(0)
  const [strokes, setStrokes] = useState<number[][]>([])
  const current = useRef<number[][]>([])
  const widthRef = useRef(0)
  const handlers = useRef({ onChange, onDrawingChange })
  handlers.current = { onChange, onDrawingChange }

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          handlers.current.onDrawingChange?.(true)
          const { locationX, locationY } = e.nativeEvent
          current.current = [...current.current, [locationX, locationY]]
          setStrokes(current.current)
        },
        onPanResponderMove: (e) => {
          const { locationX, locationY } = e.nativeEvent
          const all = current.current
          const last = all[all.length - 1]
          if (!last || last.length > 1000) return
          const x = Math.min(Math.max(locationX, 0), widthRef.current)
          const y = Math.min(Math.max(locationY, 0), HEIGHT)
          current.current = [...all.slice(0, -1), [...last, x, y]]
          setStrokes(current.current)
        },
        onPanResponderRelease: () => {
          handlers.current.onDrawingChange?.(false)
          const all = current.current
          const points = all.reduce((n, s) => n + s.length / 2, 0)
          handlers.current.onChange(points >= 6 ? { width: widthRef.current, height: HEIGHT, strokes: all } : null)
        },
        onPanResponderTerminate: () => handlers.current.onDrawingChange?.(false),
      }),
    [],
  )

  const clear = () => {
    current.current = []
    setStrokes([])
    onChange(null)
  }

  return (
    <View style={{ gap: space.sm }}>
      <View
        style={styles.pad}
        onLayout={(e) => {
          widthRef.current = e.nativeEvent.layout.width
          setWidth(e.nativeEvent.layout.width)
        }}
        accessible
        accessibilityLabel="Signature area. Draw your signature with your finger."
        {...responder.panHandlers}
      >
        {width > 0 ? (
          <Svg width={width} height={HEIGHT} pointerEvents="none">
            <Path
              d={toPath(strokes)}
              stroke={colors.text}
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ) : null}
        {strokes.length === 0 ? (
          <Text style={[type.small, styles.hint]} pointerEvents="none">
            Sign here with your finger
          </Text>
        ) : null}
        <View style={styles.baseline} pointerEvents="none" />
      </View>
      <Pressable accessibilityRole="button" onPress={clear} hitSlop={8} style={{ alignSelf: 'flex-end' }}>
        <Text style={styles.clear}>Clear signature</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  pad: {
    height: HEIGHT,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  hint: { position: 'absolute', top: space.md, left: space.md },
  baseline: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    bottom: 40,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  clear: { color: colors.primary, fontWeight: '600', fontSize: 14 },
})
