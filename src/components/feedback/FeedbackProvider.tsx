import React, { createContext, useContext, useMemo, useState } from 'react'
import { useSettingsStore } from '../../stores/settings-store'
import { FeedbackModal } from './FeedbackModal'

interface FeedbackContextValue {
  open: boolean
  openFeedback: () => void
  closeFeedback: () => void
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null)

export const useFeedback = () => {
  const ctx = useContext(FeedbackContext)
  if (!ctx) throw new Error('useFeedback must be used within a FeedbackProvider')
  return ctx
}

export interface FeedbackProviderProps {
  defaultOpen?: boolean
  modalId?: string
  children?: React.ReactNode
}

export const FeedbackProvider: React.FC<FeedbackProviderProps> = ({
  defaultOpen = false,
  modalId = 'default-feedback',
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen)
  const hasDismissed = useSettingsStore((s) => s.hasDismissedFeedbackModalId(modalId))
  const addDismissed = useSettingsStore((s) => s.addDismissedFeedbackModalId)

  React.useEffect(() => {
    if (open && hasDismissed) {
      setOpen(false)
    }
  }, [hasDismissed, open])

  const value = useMemo(
    () => ({
      open,
      openFeedback: () => {
        if (hasDismissed) return
        setOpen(true)
      },
      closeFeedback: () => setOpen(false),
    }),
    [hasDismissed, open],
  )

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <FeedbackModal
        open={open}
        title="We need your feedback"
        description="There's something you felt off, any problem or any feature request?"
        fields={[
          {
            name: 'feedback',
            label: 'Feedback',
            type: 'textarea',
            placeholder: 'Tell us what you think...',
            maxLength: 512
          }
        ]}
        onClose={value.closeFeedback}
        onSubmit={() => {
          addDismissed(modalId)
          value.closeFeedback()
        }}
      />
    </FeedbackContext.Provider>
  )
}
