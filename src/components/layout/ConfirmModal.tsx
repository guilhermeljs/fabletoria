import { BaseButton } from '../primitives/BaseButton'
import { BaseIcon } from '../primitives/BaseIcon'
import { BaseText } from '../primitives/BaseText'

interface ConfirmModalProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onClose: () => void
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <div className="bg-bg-surface border border-border-main rounded-tk-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden pointer-events-auto">
      <header className="flex items-center gap-tk-3 px-tk-5 py-tk-3 border-b border-border-main shrink-0">
        <div className="p-tk-2 rounded-tk-md text-status-error">
          <BaseIcon name="AlertTriangle" size={20} className="ml-tk-4" />
        </div>
        <BaseText size="lg" weight="semibold">
          {title}
        </BaseText>
      </header>

      <main className="p-tk-6">
        <BaseText variant="dim">{message}</BaseText>
      </main>

      <footer className="flex justify-end gap-tk-3 p-tk-2 border-t border-border-main bg-bg-header">
        <BaseButton variant="ghost" size="md" onClick={onClose}>
          {cancelLabel}
        </BaseButton>
        <BaseButton
          variant="danger"
          size="md"
          onClick={handleConfirm}
          autoFocus
          className="mr-tk-2"
        >
          {confirmLabel}
        </BaseButton>
      </footer>
    </div>
  )
}
