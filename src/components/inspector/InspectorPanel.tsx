import { useUIStore } from '../../stores/ui-store'
import { useProjectStore } from '../../stores/project-store'
import TiptapEditor from './TiptapEditor'
import VariationFieldEditor from './VariationFieldEditor'
import { BaseText } from '../primitives/BaseText'
import { BaseIcon } from '../primitives/BaseIcon'
import { BaseInput } from '../primitives/BaseInput'

export default function InspectorPanel() {
  const selection = useUIStore((s) => s.selection)
  const singleSelectedNodeId = useUIStore((s) => s.singleSelectedNodeId)
  const singleSelectedVariationId = useUIStore((s) => s.singleSelectedVariationId)

  const storyNode = useProjectStore((s) =>
    singleSelectedNodeId ? s.nodes[singleSelectedNodeId] : null
  )
  const variation = useProjectStore((s) =>
    singleSelectedVariationId ? s.variations[singleSelectedVariationId] : null
  )
  const updateNodeTitle = useProjectStore((s) => s.updateNodeTitle)
  const updateNodeContent = useProjectStore((s) => s.updateNodeContent)
  const updateVariationDefaultContent = useProjectStore((s) => s.updateVariationDefaultContent)
  const updateVariationDefaultTitle = useProjectStore((s) => s.updateVariationDefaultTitle)

  // Multiple objects selected
  if (selection.length > 1) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-tk-3 p-tk-6 text-center text-text-dim">
        <BaseIcon name="Copy" size={32} className="opacity-50" />
        <BaseText size="sm" variant="dim">
          {selection.length} objects selected
        </BaseText>
        <BaseText size="xs" variant="dim">
          Select only one to inspect it
        </BaseText>
      </div>
    )
  }

  // Single variation selected (from Explorer, not through a node)
  if (singleSelectedVariationId && !singleSelectedNodeId) {
    return (
      <div className="flex flex-col gap-tk-6 p-tk-4 h-full overflow-y-auto">
        <BaseText size="xs" weight="semibold" variant="dim" className="uppercase tracking-wider">
          Variation Defaults
        </BaseText>

        <BaseInput
          label="Default Title"
          value={variation?.defaultTitle ?? ''}
          onChange={(e) => updateVariationDefaultTitle(singleSelectedVariationId, e.target.value)}
          size="sm"
          placeholder="Default node title..."
        />

        <TiptapEditor
          key={`${singleSelectedVariationId}-content`}
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
      <div className="flex flex-col items-center justify-center h-full gap-tk-3 p-tk-6 text-center text-text-dim">
        <BaseIcon name="MousePointerSquareDashed" size={32} className="opacity-50" />
        <BaseText size="sm" variant="dim">
          Select a node to edit its content
        </BaseText>
        <BaseText size="xs" variant="dim">
          Right-click the canvas to add a story piece
        </BaseText>
      </div>
    )
  }

  // Single node selected
  return (
    <div className="flex flex-col gap-tk-6 p-tk-4 h-full overflow-y-auto">
      <BaseText size="xs" weight="semibold" variant="dim" className="uppercase tracking-wider">
        Story Piece
      </BaseText>

      <BaseInput
        label="Title"
        value={storyNode.title ?? ''}
        onChange={(e) => updateNodeTitle(singleSelectedNodeId, e.target.value)}
        placeholder="Node title..."
        disabled={!!storyNode.variationId}
        size="sm"
      />

      <TiptapEditor
        key={singleSelectedNodeId}
        value={storyNode.content ?? ''}
        onChange={(content) => updateNodeContent(singleSelectedNodeId, content)}
      />

      {storyNode.variationId && (
        <div className="border-t border-border-main pt-tk-4">
          <VariationFieldEditor variationId={storyNode.variationId} />
        </div>
      )}
    </div>
  )
}
