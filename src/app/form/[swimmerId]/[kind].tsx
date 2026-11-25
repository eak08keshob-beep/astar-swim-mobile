import Ionicons from '@expo/vector-icons/Ionicons'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { mutate } from 'swr'
import { type Signature, SignaturePad } from '../../../components/signature-pad'
import { Button, Card, EmptyState, ErrorText, Field, Loading } from '../../../components/ui'
import { api, type FormDefinition, type FormField, type Forms, type FormSwimmer } from '../../../lib/api'
import { shortDate } from '../../../lib/format'
import { useSession } from '../../../lib/session'
import { colors, radius, space, type } from '../../../lib/theme'
import { useApi } from '../../../lib/use-api'

function isoToUk(value: string | undefined) {
  const m = value ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null
  return m ? `${m[3]}/${m[2]}/${m[1]}` : value ?? ''
}

function ukToIso(value: string) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim())
  if (!m) return value.trim()
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
}

function initialAnswers(form: FormDefinition, swimmer: FormSwimmer) {
  const saved = swimmer.documents[form.kind]?.answers
  if (saved) return { ...saved }
  const start: Record<string, string> = {}
  if (form.kind === 'enrolment') {
    start.swimmerName = `${swimmer.firstName} ${swimmer.lastName}`.trim()
    if (swimmer.dateOfBirth) start.dateOfBirth = swimmer.dateOfBirth
  }
  return start
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.choice, selected && styles.choiceOn]}
    >
      <Text style={[styles.choiceText, selected && { color: colors.onPrimary }]}>{label}</Text>
    </Pressable>
  )
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FormField
  value: string | undefined
  onChange: (value: string) => void
}) {
  const label = field.required && field.type !== 'agree' ? `${field.label} *` : field.label
  if (field.type === 'yesno') {
    return (
      <View style={{ gap: space.sm }} accessibilityRole="radiogroup" accessibilityLabel={field.label}>
        <Text style={type.body}>{label}</Text>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Choice label="Yes" selected={value === 'yes'} onPress={() => onChange('yes')} />
          <Choice label="No" selected={value === 'no'} onPress={() => onChange('no')} />
        </View>
      </View>
    )
  }
  if (field.type === 'agree') {
    const on = value === 'on'
    return (
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: on }}
        onPress={() => onChange(on ? '' : 'on')}
        style={styles.agree}
      >
        <Ionicons name={on ? 'checkbox' : 'square-outline'} size={24} color={on ? colors.primary : colors.muted} />
        <Text style={[type.body, { flex: 1 }]}>{field.label}</Text>
      </Pressable>
    )
  }
  if (field.type === 'date') {
    return (
      <Field
        label={label}
        value={isoToUk(value)}
        onChangeText={onChange}
        placeholder="DD/MM/YYYY"
        keyboardType="numbers-and-punctuation"
      />
    )
  }
  return (
    <Field
      label={label}
      value={value ?? ''}
      onChangeText={onChange}
      multiline={field.type === 'textarea'}
      style={field.type === 'textarea' ? { minHeight: 96, textAlignVertical: 'top' } : undefined}
      autoCapitalize={field.id.toLowerCase().includes('email') ? 'none' : 'sentences'}
      keyboardType={
        field.id.toLowerCase().includes('email')
          ? 'email-address'
          : field.id.toLowerCase().includes('phone')
            ? 'phone-pad'
            : 'default'
      }
    />
  )
}

function FormBody({ form, swimmer }: { form: FormDefinition; swimmer: FormSwimmer }) {
  const { token } = useSession()
  const existing = swimmer.documents[form.kind]
  const [answers, setAnswers] = useState(() => initialAnswers(form, swimmer))
  const [signatureName, setSignatureName] = useState(existing?.signatureName ?? '')
  const [signature, setSignature] = useState<Signature | null>(null)
  const [drawing, setDrawing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setError(null)
    if (!signatureName.trim()) return setError('Enter your full name to sign.')
    if (!signature) return setError('Add your signature before submitting.')
    const payload: Record<string, string> = {}
    for (const section of form.sections) {
      for (const field of section.fields) {
        const value = answers[field.id]
        if (value) payload[field.id] = field.type === 'date' ? ukToIso(value) : value
      }
    }
    setSaving(true)
    try {
      await api(`/forms/${swimmer.id}/${form.kind}`, {
        token,
        method: 'POST',
        body: { answers: payload, signatureName: signatureName.trim(), signature },
      })
      await mutate((key) => Array.isArray(key) && (key[0] === '/forms' || key[0] === '/records'))
      router.back()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit the form. Please try again.')
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!drawing}
      >
        <View style={{ gap: space.xs }}>
          <Text style={type.title}>{form.title}</Text>
          <Text style={type.small}>
            For {swimmer.firstName} {swimmer.lastName}. {form.summary}
          </Text>
          {existing ? (
            <Text style={type.small}>
              Last signed by {existing.signatureName} on {shortDate(existing.signedAt)}. Submitting again replaces it.
            </Text>
          ) : null}
        </View>

        {form.sections.map((section) => (
          <Card key={section.title} style={{ gap: space.lg }}>
            <Text style={type.heading}>{section.title}</Text>
            {section.fields.map((field) => (
              <FieldInput
                key={field.id}
                field={field}
                value={answers[field.id]}
                onChange={(value) => setAnswers((a) => ({ ...a, [field.id]: value }))}
              />
            ))}
          </Card>
        ))}

        <Card style={{ gap: space.lg }}>
          <Text style={type.heading}>Parent / guardian signature</Text>
          <Field
            label="Your full name *"
            value={signatureName}
            onChangeText={setSignatureName}
            autoCapitalize="words"
            autoComplete="name"
          />
          <SignaturePad onChange={setSignature} onDrawingChange={setDrawing} />
        </Card>

        <ErrorText message={error} />
        <Button label="Sign and submit" onPress={submit} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default function FormScreen() {
  const { swimmerId, kind } = useLocalSearchParams<{ swimmerId: string; kind: string }>()
  const { data, error } = useApi<Forms>('/forms')
  if (!data && !error) return <Loading />

  const form = data?.forms.find((f) => f.kind === kind)
  const swimmer = data?.swimmers.find((s) => String(s.id) === swimmerId)

  return (
    <>
      <Stack.Screen options={{ title: form?.title ?? 'Form' }} />
      {form && swimmer ? (
        <FormBody key={`${swimmer.id}-${form.kind}`} form={form} swimmer={swimmer} />
      ) : (
        <View style={styles.content}>
          <ErrorText message={error?.message} />
          <EmptyState title="Form not found" body="This form isn't available for this swimmer any more." />
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl * 2 },
  choice: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  choiceOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  choiceText: { fontSize: 15, fontWeight: '700', color: colors.text },
  agree: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
})
