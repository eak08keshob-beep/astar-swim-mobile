import Ionicons from '@expo/vector-icons/Ionicons'
import { useState } from 'react'
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { Card, EmptyState, ErrorText, Loading, Pill, Screen, SectionLabel } from '../../components/ui'
import { type AccidentRecord, BASE_URL, type Records, type SignedDocument } from '../../lib/api'
import { shortDate } from '../../lib/format'
import { colors, space, type } from '../../lib/theme'
import { useApi } from '../../lib/use-api'

function timeOf(value: string) {
  // Accident times are stored as the wall-clock time staff entered, encoded as UTC.
  return new Date(value).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
}

function OpenPdf({ path, label }: { path: string; label: string }) {
  const [error, setError] = useState<string | null>(null)
  return (
    <View style={{ gap: space.xs }}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={label}
        onPress={() => {
          setError(null)
          Linking.openURL(`${BASE_URL}${path}`).catch(() => setError('Could not open the PDF on this device.'))
        }}
        style={({ pressed }) => [styles.pdfButton, pressed && { opacity: 0.7 }]}
      >
        <Ionicons name="document-text-outline" size={16} color={colors.primary} />
        <Text style={styles.pdfText}>View PDF</Text>
      </Pressable>
      <ErrorText message={error} />
    </View>
  )
}

function Detail({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <View style={{ gap: 2 }}>
      <Text style={type.small}>{label}</Text>
      <Text style={type.body}>{value}</Text>
    </View>
  )
}

function AccidentCard({ accident }: { accident: AccidentRecord }) {
  const signed = Boolean(accident.parentSignedAt)
  return (
    <Card style={{ gap: space.md }}>
      <View style={styles.row}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={type.heading}>{accident.swimmerName}</Text>
          <Text style={type.small}>
            {shortDate(accident.occurredAt)} at {timeOf(accident.occurredAt)} · {accident.reference}
          </Text>
        </View>
        <Pill label={signed ? 'Signed' : 'Awaiting signature'} tone={signed ? 'blue' : 'gold'} />
      </View>
      <Detail label="Where" value={accident.location} />
      <Detail label="What happened" value={accident.description} />
      <Detail label="Treatment given" value={accident.treatment} />
      <OpenPdf path={accident.pdfPath} label={`View accident report ${accident.reference} as PDF`} />
    </Card>
  )
}

function DocumentRow({ doc, last }: { doc: SignedDocument; last: boolean }) {
  return (
    <View style={[styles.docRow, !last && styles.divider]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={type.body}>{doc.title}</Text>
        <Text style={type.small}>
          {doc.swimmerName} · Signed by {doc.signatureName} on {shortDate(doc.signedAt)}
        </Text>
      </View>
      <OpenPdf path={doc.pdfPath} label={`View ${doc.title} for ${doc.swimmerName} as PDF`} />
    </View>
  )
}

export default function RecordsScreen() {
  const { data, error, isValidating, mutate } = useApi<Records>('/records')
  if (!data && !error) return <Loading />

  return (
    <Screen refreshing={isValidating} onRefresh={() => mutate()}>
      <ErrorText message={error?.message} />

      <SectionLabel>Signed documents</SectionLabel>
      {data?.documents.length === 0 ? (
        <EmptyState title="No signed documents" body="Forms you sign with the school, like enrolment and consent forms, appear here." />
      ) : data ? (
        <Card style={{ paddingVertical: space.xs }}>
          {data.documents.map((d, i) => (
            <DocumentRow key={`${d.swimmerId}-${d.kind}`} doc={d} last={i === data.documents.length - 1} />
          ))}
        </Card>
      ) : null}

      <SectionLabel>Accident reports</SectionLabel>
      {data?.accidents.length === 0 ? (
        <EmptyState title="No accident reports" body="If your swimmer is ever involved in an incident, the report appears here." />
      ) : (
        data?.accidents.map((a) => <AccidentCard key={a.id} accident={a} />)
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    alignSelf: 'flex-start',
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  pdfText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
})
