import { useState } from 'react'
import { useRealtimeStore } from '../../stores/realtime-store'
import { copyToClipboard } from '../../lib/clipboard'
import type { InviteEntry } from '../../lib/webrtc/types'
import { BaseButton } from '../primitives/BaseButton'
import { BaseIcon } from '../primitives/BaseIcon'
import { BaseInput } from '../primitives/BaseInput'
import { BaseText } from '../primitives/BaseText'
import { BaseBadge } from '../primitives/BaseBadge'

interface ShareModalProps {
  onClose: () => void
}

// ── Invite row ────────────────────────────────────────────────────────────────

function statusBadge(invite: InviteEntry) {
  switch (invite.status) {
    case 'preparing':
      return <BaseBadge variant="info" rounded>Gerando…</BaseBadge>
    case 'waiting-answer':
      return <BaseBadge variant="warning" rounded>Aguardando</BaseBadge>
    case 'connecting':
      return <BaseBadge variant="info" rounded>Conectando…</BaseBadge>
    case 'connected':
      return <BaseBadge variant="success" rounded>Conectado</BaseBadge>
    case 'failed':
      return <BaseBadge variant="error" rounded>Falhou</BaseBadge>
    case 'disconnected':
      return <BaseBadge variant="default" rounded>Desconectado</BaseBadge>
  }
}

function InviteRow({ invite }: { invite: InviteEntry }) {
  const [copied, setCopied] = useState(false)

  const canCopy = invite.status === 'waiting-answer' || invite.status === 'preparing'

  const handleCopy = () => {
    if (!invite.shareLink) return
    copyToClipboard(invite.shareLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex items-center gap-tk-3 px-tk-3 py-tk-2 rounded-tk-md bg-bg-header border border-border-main">
      <span className="text-text-dim text-tk-xs font-mono shrink-0">
        #{invite.idx + 1}
      </span>

      <div className="flex-1 min-w-0">
        {statusBadge(invite)}
      </div>

      {canCopy && (
        <button
          onClick={handleCopy}
          disabled={!invite.shareLink}
          title="Copiar link de convite"
          className="flex items-center gap-tk-1 px-tk-2 py-tk-1 text-tk-xs rounded-tk-sm border border-border-main bg-bg-surface text-text-dim hover:text-text-main hover:bg-bg-header transition-colors disabled:opacity-40 disabled:pointer-events-none shrink-0"
        >
          <BaseIcon name={copied ? 'Check' : 'Clipboard'} size={12} />
          <span>{copied ? 'Copiado!' : 'Copiar link'}</span>
        </button>
      )}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export default function ShareModal({ onClose }: ShareModalProps) {
  const invites = useRealtimeStore((s) => s.invites)
  const answerError = useRealtimeStore((s) => s.answerError)
  const addInvite = useRealtimeStore((s) => s.addInvite)
  const acceptAnswer = useRealtimeStore((s) => s.acceptAnswer)
  const stopSharing = useRealtimeStore((s) => s.stopSharing)

  const [answerInput, setAnswerInput] = useState('')
  const [isAccepting, setIsAccepting] = useState(false)

  const isGenerating = invites.some((i) => i.status === 'preparing')

  const handleAddInvite = () => {
    addInvite()
  }

  const handleAccept = async () => {
    if (!answerInput.trim() || isAccepting) return
    setIsAccepting(true)
    await acceptAnswer(answerInput.trim())
    setIsAccepting(false)
    // Clear input only on success (no answerError set after await)
    if (!useRealtimeStore.getState().answerError) {
      setAnswerInput('')
    }
  }

  const handleAnswerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAccept()
  }

  const handleStopAndClose = () => {
    stopSharing()
    onClose()
  }

  return (
    <div className="bg-bg-surface border border-border-main rounded-tk-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden pointer-events-auto">
      {/* Header */}
      <header className="flex items-center justify-between px-tk-5 py-tk-4 border-b border-border-main shrink-0">
        <div className="flex items-center gap-tk-3">
          <BaseIcon name="Share2" size={18} className="text-brand-primary" />
          <BaseText size="lg" weight="semibold">Compartilhar projeto</BaseText>
        </div>
        <button
          onClick={onClose}
          className="text-text-dim hover:text-text-main transition-colors"
          title="Fechar"
        >
          <BaseIcon name="X" size={16} />
        </button>
      </header>

      <main className="p-tk-5 flex flex-col gap-tk-5">
        {/* ── Accept answer input ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-tk-2">
          <BaseText size="sm" weight="semibold">
            Cole o código de um convidado
          </BaseText>
          <BaseText size="xs" variant="dim">
            Quando um convidado abrir o link e gerar o código de confirmação, cole-o aqui para aceitar a conexão.
          </BaseText>

          <div className="flex items-start gap-tk-2">
            <div className="flex-1">
              <BaseInput
                placeholder="Cole o código de confirmação aqui…"
                value={answerInput}
                onChange={(e) => setAnswerInput(e.target.value)}
                onKeyDown={handleAnswerKeyDown}
                disabled={isAccepting}
                fullWidth
                size="md"
                error={answerError ?? undefined}
              />
            </div>
            <BaseButton
              variant="primary"
              size="md"
              onClick={handleAccept}
              disabled={!answerInput.trim() || isAccepting}
              isLoading={isAccepting}
            >
              Aceitar
            </BaseButton>
          </div>
        </div>

        {/* ── Divider ─────────────────────────────────────────────────────── */}
        <div className="border-t border-border-main" />

        {/* ── Invites list ────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-tk-3">
          <div className="flex items-center justify-between">
            <BaseText size="sm" weight="semibold">Convites</BaseText>
            <BaseButton
              variant="secondary"
              size="sm"
              onClick={handleAddInvite}
              disabled={isGenerating}
              isLoading={isGenerating}
            >
              <BaseIcon name="UserPlus" size={14} />
              <span className="ml-tk-1">Convidar</span>
            </BaseButton>
          </div>

          {invites.length === 0 ? (
            <div className="flex items-center justify-center py-tk-6 text-text-dim text-tk-sm">
              Você ainda não convidou ninguém.
            </div>
          ) : (
            <div className="flex flex-col gap-tk-2 max-h-52 overflow-y-auto">
              {invites.map((invite) => (
                <InviteRow key={invite.idx} invite={invite} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="flex items-center justify-between gap-tk-3 px-tk-5 py-tk-3 border-t border-border-main bg-bg-header">
        <BaseButton variant="ghost" size="md" onClick={onClose}>
          Fechar
        </BaseButton>
        {invites.length > 0 && (
          <BaseButton variant="danger" size="md" onClick={handleStopAndClose}>
            Encerrar compartilhamento
          </BaseButton>
        )}
      </footer>
    </div>
  )
}
