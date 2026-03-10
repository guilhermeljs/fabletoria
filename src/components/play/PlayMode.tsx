import { usePlayStore } from '../../stores/play-store'
import { useProjectStore } from '../../stores/project-store'
import { resolveContent, resolveTitle } from '../../lib/interpolation'

export default function PlayMode() {
  const isActive = usePlayStore((s) => s.isActive)
  const currentNodeId = usePlayStore((s) => s.currentNodeId)
  const choose = usePlayStore((s) => s.choose)
  const restart = usePlayStore((s) => s.restart)
  const exit = usePlayStore((s) => s.exit)

  const nodes = useProjectStore((s) => s.nodes)
  const connections = useProjectStore((s) => s.connections)
  const variations = useProjectStore((s) => s.variations)

  if (!isActive) return null

  const currentNode = currentNodeId ? nodes[currentNodeId] : null

  const currentVariation = currentNode?.variationId ? variations[currentNode.variationId] : undefined

  let html = ''
  if (currentNode) {
    try {
      const parsed = JSON.parse(currentNode.content) as object
      const { html: resolved } = resolveContent(parsed, variations, currentVariation?.values)
      html = resolved
    } catch {
      html = '<p>Unable to render content.</p>'
    }
  }

  const outgoingConnections = Object.values(connections).filter(
    (c) => c?.sourceNodeId === currentNodeId
  ).filter(Boolean) as NonNullable<typeof connections[string]>[]

  const isEndState = outgoingConnections.length === 0

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col">
      {/* Exit button — always visible */}
      <div className="flex justify-end p-4 shrink-0">
        <button
          onClick={exit}
          className="px-4 py-1.5 text-sm text-zinc-400 border border-zinc-700 rounded-lg hover:border-zinc-500 hover:text-zinc-200 transition-colors"
        >
          ✕ Exit
        </button>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-16 overflow-y-auto">
        <div className="w-full max-w-2xl">
          {/* Node content */}
          <div
            className="narrative-content text-lg text-zinc-100 leading-relaxed mb-10"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {/* Choice buttons or end state */}
          {isEndState ? (
            <div className="flex flex-col items-center gap-4">
              <p className="text-zinc-500 text-sm italic">— The End —</p>
              <div className="flex gap-3">
                <button
                  onClick={restart}
                  className="px-5 py-2 text-sm border border-zinc-600 text-zinc-300 rounded-lg hover:border-violet-500 hover:text-violet-300 transition-colors"
                >
                  ↺ Restart
                </button>
                <button
                  onClick={exit}
                  className="px-5 py-2 text-sm bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
                >
                  ✕ Exit
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {outgoingConnections.map((connection, index) => (
                <button
                  key={connection.id}
                  onClick={() => choose(connection.id)}
                  className="w-full text-left px-5 py-3 border border-zinc-700 rounded-lg text-zinc-300 hover:border-violet-500 hover:text-violet-200 hover:bg-violet-950/30 transition-all"
                >
                  {(() => {
                    const targetNode = nodes[connection.targetNodeId]
                    const targetVariation = targetNode?.variationId ? variations[targetNode.variationId] : undefined
                    return resolveTitle(targetNode?.title ?? '', targetVariation?.values) || `Choice ${index + 1}`
                  })()}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
