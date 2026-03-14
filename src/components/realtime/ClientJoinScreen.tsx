import { useEffect, useState } from 'react'
import { useRealtimeStore, getOfferFromUrl } from '../../stores/realtime-store'
import { copyToClipboard } from '../../lib/clipboard'

/**
 * Full-screen overlay shown when the app is opened via a share link.
 *
 * States:
 *   preparing     → "Conectando…" spinner
 *   waiting-answer → shows the answer code the user must send back to the host
 *   connecting    → "Estabelecendo conexão…" (host accepted the answer, ICE in progress)
 *   connected     → handled in App.tsx (this screen unmounts)
 *   failed        → error message
 *   disconnected  → connection lost message
 */
export default function ClientJoinScreen() {
  const clientStatus = useRealtimeStore((s) => s.clientStatus)
  const answerCode = useRealtimeStore((s) => s.answerCode)
  const clientError = useRealtimeStore((s) => s.clientError)
  const joinAsClient = useRealtimeStore((s) => s.joinAsClient)

  const [codeCopied, setCodeCopied] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)

  useEffect(() => {
    const offer = getOfferFromUrl()
    if (!offer) {
      setInitError('Link inválido: código de conexão não encontrado.')
      return
    }

    joinAsClient(offer).catch(() => {
      // Error is surfaced via the store's clientError field
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopyCode = () => {
    if (!answerCode) return
    copyToClipboard(answerCode).then(() => {
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    })
  }

  const displayError = initError ?? clientError

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <div className="flex flex-col items-center gap-tk-6 w-full max-w-md px-tk-6">
        {/* App wordmark */}
        <div className="text-text-dim text-tk-xs tracking-widest uppercase select-none">
          Fabletoria
        </div>

        {/* ── preparing ──────────────────────────────────────────────────── */}
        {(clientStatus === 'preparing' || clientStatus === 'idle') && !displayError && (
          <div className="flex flex-col items-center gap-tk-3">
            <span className="text-4xl animate-spin text-text-dim">◌</span>
            <p className="text-text-main text-tk-lg font-medium">Conectando…</p>
            <p className="text-text-dim text-tk-sm text-center">
              Processando o convite, aguarde um momento.
            </p>
          </div>
        )}

        {/* ── waiting for host to accept ─────────────────────────────────── */}
        {clientStatus === 'waiting-answer' && answerCode && (
          <>
            <div className="flex flex-col items-center gap-tk-2 text-center">
              <p className="text-text-main text-tk-lg font-medium">Pronto para conectar</p>
              <p className="text-text-dim text-tk-sm">
                Envie o código abaixo para quem te enviou o link.
                <br />
                Ele precisa colar esse código para aceitar sua conexão.
              </p>
            </div>

            {/* Answer code input (read-only with copy button) */}
            <div className="w-full flex flex-col gap-tk-2">
              <p className="text-text-dim text-tk-xs text-center uppercase tracking-wider">
                Seu código de confirmação
              </p>
              <div className="flex items-center gap-tk-2">
                <input
                  readOnly
                  value={answerCode}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="flex-1 h-10 px-tk-3 text-tk-xs bg-bg-surface border border-border-main rounded-tk-md text-text-main truncate focus:outline-none select-all font-mono"
                />
                <button
                  onClick={handleCopyCode}
                  title="Copiar código"
                  className="flex items-center justify-center w-10 h-10 rounded-tk-md bg-bg-surface border border-border-main text-text-dim hover:text-text-main hover:bg-bg-header transition-colors shrink-0"
                >
                  {codeCopied ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                </button>
              </div>
              {codeCopied && (
                <p className="text-text-dim text-tk-xs text-center">Código copiado!</p>
              )}
            </div>

            <p className="text-text-dim text-tk-xs text-center">
              Aguardando o host aceitar sua conexão…
            </p>
          </>
        )}

        {/* ── ICE connecting ─────────────────────────────────────────────── */}
        {clientStatus === 'connecting' && (
          <>
            <span className="text-4xl animate-spin text-text-dim">◌</span>
            <p className="text-text-main text-tk-lg font-medium">Estabelecendo conexão…</p>
            <p className="text-text-dim text-tk-sm text-center">
              Negociação em andamento.
            </p>
          </>
        )}

        {/* ── disconnected ───────────────────────────────────────────────── */}
        {clientStatus === 'disconnected' && (
          <>
            <p className="text-text-main text-tk-lg font-medium">Conexão encerrada</p>
            <p className="text-text-dim text-tk-sm text-center">
              A conexão com o host foi perdida. Reabra o link para tentar novamente.
            </p>
          </>
        )}

        {/* ── error / failed ─────────────────────────────────────────────── */}
        {(clientStatus === 'failed' || displayError) && (
          <>
            <p className="text-status-error text-tk-lg font-medium">Falha na conexão</p>
            <p className="text-text-dim text-tk-sm text-center">
              {displayError ?? 'Ocorreu um erro inesperado. Tente reabrir o link.'}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
