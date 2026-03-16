import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useSettingsStore } from '../../stores/settings-store'
import { FeedbackModal } from './FeedbackModal'
import type { FeedbackFieldConfig, FeedbackFieldError } from './FeedbackModal'

const GENERAL_API = import.meta.env.VITE_GENERAL_API as string

const VALID_FIELD_TYPES = new Set(['input', 'email', 'textarea', 'select'])

interface FeedbackTemplate {
  id: string
  title: string
  fields: FeedbackFieldConfig[]
  description?: string
}

function isValidTemplate(t: unknown): t is FeedbackTemplate {
  if (!t || typeof t !== 'object') return false
  const obj = t as Record<string, unknown>
  if (typeof obj.id !== 'string' || !obj.id) return false
  if (typeof obj.title !== 'string' || !obj.title) return false
  if (!Array.isArray(obj.fields) || obj.fields.length === 0) return false
  return obj.fields.every((f: unknown) => {
    if (!f || typeof f !== 'object') return false
    const field = f as Record<string, unknown>
    if (typeof field.name !== 'string' || !field.name) return false
    if (typeof field.label !== 'string' || !field.label) return false
    if (!VALID_FIELD_TYPES.has(field.type as string)) return false
    if (field.type === 'select') {
      if (!Array.isArray(field.options) || field.options.length === 0) return false
      return field.options.every((o: unknown) => {
        if (!o || typeof o !== 'object') return false
        const opt = o as Record<string, unknown>
        return (
          (typeof opt.value === 'string' || typeof opt.value === 'number') &&
          typeof opt.label === 'string'
        )
      })
    }
    return true
  })
}

interface FeedbackContextValue {
  open: boolean
  openFeedback: () => void
  closeFeedback: () => void
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export const useFeedback = () => {
  const ctx = useContext(FeedbackContext)
  if (!ctx) throw new Error('useFeedback must be used within a FeedbackProvider')
  return ctx
}

export interface FeedbackProviderProps {
  children?: React.ReactNode
}

export const FeedbackProvider: React.FC<FeedbackProviderProps> = ({ children }) => {
  const dismissedIds = useSettingsStore((s) => s.dismissedFeedbackModalIds ?? [])
  const isLoading = useSettingsStore((s) => s.isLoading)
  const addDismissed = useSettingsStore((s) => s.addDismissedFeedbackModalId)
  const getFingerprint = useSettingsStore((s) => s.getFingerprint)

  const [templates, setTemplates] = useState<FeedbackTemplate[]>([])
  const [manuallyClosed, setManuallyClosed] = useState(false)
  const [submitErrors, setSubmitErrors] = useState<FeedbackFieldError[]>([])

  useEffect(() => {
    if (isLoading) return

    const fetchFeedbacks = () =>
      fetch(`${GENERAL_API}/feedbacks`, {
        headers: { 'x-fingerprint': getFingerprint() }
      })
        .then((res) => res.json())
        .then((data: unknown) => {
          if (!Array.isArray(data)) return
          const valid = data.filter(isValidTemplate)
          if (valid.length > 0) setTemplates(valid)
        })
        .catch(() => {
          /* silently ignore fetch failures */
        })

    fetchFeedbacks()
    const interval = setInterval(fetchFeedbacks, 1 * 60 * 1000)
    return () => clearInterval(interval)
  }, [isLoading, getFingerprint])

  const pending = useMemo(
    () => templates?.filter((t) => !dismissedIds.includes(t.id)),
    [templates, dismissedIds]
  )

  const current = manuallyClosed ? null : (pending[0] ?? null)
  const open = current !== null

  const closeFeedback = () => setManuallyClosed(true)

  const handleSubmit = async (values: Record<string, string | number>) => {
    if (!current) return
    setSubmitErrors([])

    const res = await fetch(`${GENERAL_API}/feedback/answer/${current.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-fingerprint': getFingerprint() },
      body: JSON.stringify(values)
    })

    if (res.status === 400) {
      const body = await res.json().catch(() => ({}))
      if (body.errors) {
        setSubmitErrors(body.errors)
      }
      return
    }

    addDismissed(current.id)
    setSubmitErrors([])

    // If there are more pending after dismissing this one, keep open
    const remaining = pending.filter((t) => t.id !== current.id)
    if (remaining.length === 0) {
      setManuallyClosed(true)
    }
  }

  // Reset manuallyClosed when new pending items arrive (e.g. after templates load)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (pending.length > 0) setManuallyClosed(false)
  }, [pending.length])

  // Reset errors when current changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSubmitErrors([])
  }, [current?.id])

  const value = useMemo(
    () => ({
      open,
      openFeedback: () => {
        if (pending.length === 0) return
        setManuallyClosed(false)
      },
      closeFeedback
    }),
    [open, pending.length]
  )

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      {current && (
        <FeedbackModal
          open={open}
          title={current.title}
          fields={current.fields}
          description={current.description || ''}
          errors={submitErrors}
          onClose={closeFeedback}
          onSubmit={handleSubmit}
        />
      )}
    </FeedbackContext.Provider>
  )
}
