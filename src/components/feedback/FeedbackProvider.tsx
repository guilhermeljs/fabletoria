import React, { createContext, useContext, useMemo, useState } from 'react'
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
  children?: React.ReactNode
}

export const FeedbackProvider: React.FC<FeedbackProviderProps> = ({
  defaultOpen = false,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen)

  const value = useMemo(
    () => ({
      open,
      openFeedback: () => setOpen(true),
      closeFeedback: () => setOpen(false),
    }),
    [open],
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
            placeholder: 'Tell us what you think...'
          }
        ]}
        onClose={value.closeFeedback}
        onSubmit={() => {
          value.closeFeedback()
        }}
      />
    </FeedbackContext.Provider>
  )
}
