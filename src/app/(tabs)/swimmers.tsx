import Ionicons from '@expo/vector-icons/Ionicons'
import * as ImagePicker from 'expo-image-picker'
import { useState } from 'react'
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { SwimmerPhoto } from '../../components/swimmer-photo'
import { Card, EmptyState, ErrorText, Loading, Pill, Screen } from '../../components/ui'
import { type Swimmer, uploadSwimmerPhoto } from '../../lib/api'
import { useSession } from '../../lib/session'
import { dayName, formatTime, shortDate } from '../../lib/format'
import { colors, space, type } from '../../lib/theme'
import { useApi } from '../../lib/use-api'

function age(dob: string | null) {
  if (!dob) return null
  const born = new Date(`${dob}T12:00:00`)
  const now = new Date()
  let years = now.getFullYear() - born.getFullYear()
  if (now < new Date(now.getFullYear(), born.getMonth(), born.getDate())) years -= 1
  return years
}

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.7,
}

function usePhotoChanger(swimmer: Swimmer, onChanged: () => void) {
  const { token } = useSession()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = async (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets[0] || !token) return
    setUploading(true)
    setError(null)
    try {
      await uploadSwimmerPhoto(swimmer.id, result.assets[0], token)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the photo. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const fromLibrary = async () => upload(await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS))

  const fromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) {
      setError('Camera access is turned off. You can allow it in Settings, or choose a photo instead.')
      return
    }
    upload(await ImagePicker.launchCameraAsync(PICKER_OPTIONS))
  }

  const choose = () => {
    if (uploading) return
    if (Platform.OS === 'web') {
      fromLibrary()
      return
    }
    Alert.alert(swimmer.photoVersion ? 'Change photo' : 'Add photo', `Choose a photo of ${swimmer.firstName}`, [
      { text: 'Take photo', onPress: fromCamera },
      { text: 'Choose from library', onPress: fromLibrary },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  return { choose, uploading, error }
}

function SwimmerCard({ swimmer, onChanged }: { swimmer: Swimmer; onChanged: () => void }) {
  const years = age(swimmer.dateOfBirth)
  const photo = usePhotoChanger(swimmer, onChanged)
  const actionLabel = swimmer.photoVersion ? 'Change photo' : 'Add photo'
  return (
    <Card style={{ gap: space.md }}>
      <View style={styles.header}>
        <Pressable
          onPress={photo.choose}
          disabled={photo.uploading}
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel} for ${swimmer.firstName}`}
          hitSlop={8}
        >
          <SwimmerPhoto swimmer={swimmer} size={56} background={colors.primary} color={colors.onPrimary} />
          {photo.uploading ? (
            <View style={styles.uploading}>
              <ActivityIndicator color={colors.onPrimary} />
            </View>
          ) : null}
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={13} color={colors.onPrimary} />
          </View>
        </Pressable>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={type.heading}>
            {swimmer.firstName} {swimmer.lastName}
          </Text>
          <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
            {swimmer.levelName ? <Pill label={swimmer.levelName} /> : null}
            {years !== null ? <Text style={type.small}>{years} years old</Text> : null}
          </View>
          <Pressable
            onPress={photo.choose}
            disabled={photo.uploading}
            accessibilityRole="button"
            style={styles.photoLink}
          >
            <Text style={styles.photoLinkText}>{photo.uploading ? 'Uploading…' : actionLabel}</Text>
          </Pressable>
        </View>
      </View>
      <ErrorText message={photo.error ?? undefined} />

      <View style={{ gap: space.sm }}>
        <Text style={type.label}>Lessons</Text>
        {swimmer.lessons.length === 0 ? (
          <Text style={type.small}>Not booked into a class yet.</Text>
        ) : (
          swimmer.lessons.map((l) => (
            <View key={l.classId} style={styles.line}>
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text style={[type.body, { flex: 1 }]}>
                {dayName(l.dayOfWeek)} {formatTime(l.startTime)}
                <Text style={type.small}>
                  {'  '}
                  {[l.name, l.location, l.instructorFirstName ? `with ${l.instructorFirstName}` : null].filter(Boolean).join(' · ')}
                </Text>
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={{ gap: space.sm }}>
        <Text style={type.label}>Badges</Text>
        {swimmer.badges.length === 0 ? (
          <Text style={type.small}>No badges yet. They&apos;ll appear here as soon as they&apos;re awarded.</Text>
        ) : (
          swimmer.badges.map((b) => (
            <View key={b.id} style={styles.line}>
              <Ionicons name="star" size={16} color={colors.gold} />
              <Text style={[type.body, { flex: 1 }]}>{b.name}</Text>
              <Text style={type.small}>{shortDate(b.awardedOn)}</Text>
            </View>
          ))
        )}
      </View>
    </Card>
  )
}

export default function Swimmers() {
  const { data, error, isValidating, mutate } = useApi<{ swimmers: Swimmer[] }>('/swimmers')
  if (!data && !error) return <Loading />

  return (
    <Screen refreshing={isValidating} onRefresh={() => mutate()}>
      <ErrorText message={error?.message} />
      {data?.swimmers.length === 0 ? (
        <EmptyState title="No swimmers yet" body="Once the school adds your swimmers, their lessons and badges show here." />
      ) : (
        data?.swimmers.map((s) => <SwimmerCard key={s.id} swimmer={s} onChanged={() => mutate()} />)
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  uploading: {
    ...StyleSheet.absoluteFill,
    borderRadius: 28,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.card,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLink: { alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' },
  photoLinkText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  line: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
})
