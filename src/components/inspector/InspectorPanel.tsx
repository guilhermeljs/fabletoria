import { useUIStore } from '../../stores/ui-store'
import { useProjectStore } from '../../stores/project-store'
import TiptapEditor from './TiptapEditor'
import VariationFieldEditor from './VariationFieldEditor'

export default function InspectorPanel() {
  const selection = useUIStore((s) => s.selection)
  const singleSelectedNodeId = useUIStore((s) => s.singleSelectedNodeId)
  const singleSelectedVariationId = useUIStore((s) => s.singleSelectedVariationId)

  const storyNode = useProjectStore((s) => (singleSelectedNodeId ? s.nodes[singleSelectedNodeId] : null))
  const variation = useProjectStore((s) => (singleSelectedVariationId ? s.variations[singleSelectedVariationId] : null))
  const updateNodeTitle = useProjectStore((s) => s.updateNodeTitle)
  const updateNodeContent = useProjectStore((s) => s.updateNodeContent)
  const updateVariationDefaultContent = useProjectStore((s) => s.updateVariationDefaultContent)
  const updateVariationDefaultTitle = useProjectStore((s) => s.updateVariationDefaultTitle)

  // Multiple objects selected
  if (selection.length > 1) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
        <div className="text-4xl opacity-30">⊞</div>
        <p className="text-sm text-zinc-400">
          {selection.length} objects selected
        </p>
        <p className="text-xs text-zinc-600">
          Select only one to inspect it
        </p>
      </div>
    )
  }

  // Single variation selected (from Explorer, not through a node)
  if (singleSelectedVariationId && !singleSelectedNodeId) {
    return (
      <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Variation</span>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">Title</label>
          <input
            type="text"
            value={variation?.defaultTitle ?? ''}
            onChange={(e) => updateVariationDefaultTitle(singleSelectedVariationId, e.target.value)}
            placeholder="Node title..."
            className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>

        <TiptapEditor
          key={singleSelectedVariationId}
          value={variation?.defaultContent ?? ''}
          onChange={(content) => updateVariationDefaultContent(singleSelectedVariationId, content)}
        />

        <VariationFieldEditor variationId={singleSelectedVariationId} />
      </div>
    )
  }

  // Nothing selected
  if (!singleSelectedNodeId || !storyNode) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
        <div className="text-4xl opacity-30">◎</div>
        <p className="text-sm text-zinc-500">
          Select a node to edit its content
        </p>
        <p className="text-xs text-zinc-600">
          Right-click the canvas to add a story piece
        </p>
      </div>
    )
  }

  // Single node selected
  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Story Piece</span>
        {storyNode.variationId && (
          <span className="text-xs text-violet-400 bg-violet-950 px-2 py-0.5 rounded-full">
            Variation
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-500">Title</label>
        <input
          type="text"
          value={storyNode.title ?? ''}
          onChange={(e) => updateNodeTitle(singleSelectedNodeId, e.target.value)}
          placeholder="Node title..."
          className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-violet-500 transition-colors"
        />
      </div>

      <TiptapEditor
        key={singleSelectedNodeId}
        value={storyNode.content ?? ''}
        onChange={(content) => updateNodeContent(singleSelectedNodeId, content)}
      />

      {storyNode.variationId && (
        <VariationFieldEditor variationId={storyNode.variationId} />
      )}
    </div>
  )
}
