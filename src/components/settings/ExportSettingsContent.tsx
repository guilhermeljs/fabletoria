import { BaseButton } from '../primitives/BaseButton'
import { BaseText } from '../primitives/BaseText'
import { useProjectStore } from '../../stores/project-store'

export function ExportSettingsContent() {
  const exportProjectAsJson = () => {
    const { narratives, nodes, connections, components, variations } = useProjectStore.getState()
    const snapshot = { narratives, nodes, connections, components, variations }
    const json = JSON.stringify(snapshot, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `narrativeflow-project-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-tk-6">
      <header>
        <BaseText as="h3" size="lg" weight="semibold">
          Export your project
        </BaseText>
        <BaseText size="sm" variant="dim" className="block mt-tk-1">
          We strongly recommend you to export and backup your projects to avoid losing data, as they
          live only in your browser.
        </BaseText>
      </header>

      <BaseButton variant="secondary" onClick={exportProjectAsJson}>
        Export as JSON
      </BaseButton>
    </div>
  )
}
