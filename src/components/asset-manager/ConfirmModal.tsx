import { BaseButton } from '../primitives/BaseButton'
import { BaseText } from '../primitives/BaseText'

interface Props {
  title: string
  body: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export default function ConfirmModal({ title, body, confirmLabel, onConfirm, onCancel, danger }: Props) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
      <div className="bg-bg-surface border border-border-main rounded-tk-xl shadow-2xl p-tk-6 max-w-sm w-full mx-4">
        <BaseText size="sm" weight="semibold" className="mb-tk-2">
          {title}
        </BaseText>
        <BaseText size="xs" variant="dim" className="mb-tk-5">
          {body}
        </BaseText>
        <div className="flex items-center justify-end gap-tk-3">
          <BaseButton variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </BaseButton>
          <BaseButton
            variant={danger ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
          >
            {confirmLabel}
          </BaseButton>
        </div>
      </div>
    </div>
  )
}
