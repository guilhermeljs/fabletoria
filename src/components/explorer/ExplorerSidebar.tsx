import NarrativeList from './NarrativeList'
import ComponentTree from './ComponentTree'

export default function ExplorerSidebar() {
  return (
    <aside className="flex flex-col w-60 shrink-0 bg-bg-main border-r border-border-main overflow-y-auto">
      <NarrativeList />
      <div className="border-t border-border-main mt-tk-2" />
      <ComponentTree />
    </aside>
  )
}
