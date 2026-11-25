import { Image } from 'expo-image'
import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { BASE_URL, type Swimmer } from '../lib/api'
import { useSession } from '../lib/session'

export function SwimmerPhoto({
  swimmer,
  size,
  background,
  color,
}: {
  swimmer: Pick<Swimmer, 'id' | 'firstName' | 'photoVersion'>
  size: number
  background: string
  color: string
}) {
  const { token } = useSession()
  const [failed, setFailed] = useState<string | null>(null)
  const shape = { width: size, height: size, borderRadius: size / 2 }
  const showPhoto = token && swimmer.photoVersion && failed !== swimmer.photoVersion

  if (showPhoto) {
    return (
      <Image
        source={{
          uri: `${BASE_URL}/api/app/swimmers/${swimmer.id}/photo?v=${swimmer.photoVersion}`,
          headers: { Authorization: `Bearer ${token}` },
          cacheKey: `swimmer-${swimmer.id}-${swimmer.photoVersion}`,
        }}
        style={[shape, { backgroundColor: background }]}
        contentFit="cover"
        transition={150}
        accessibilityLabel={`Photo of ${swimmer.firstName}`}
        onError={() => setFailed(swimmer.photoVersion)}
      />
    )
  }

  return (
    <View style={[shape, styles.fallback, { backgroundColor: background }]} accessibilityElementsHidden>
      <Text style={{ color, fontSize: size * 0.42, fontWeight: '800' }}>{swimmer.firstName[0]}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
})
