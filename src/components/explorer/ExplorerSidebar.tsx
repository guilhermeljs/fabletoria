import NarrativeList from './NarrativeList'
import ComponentTree from './ComponentTree'

export default function ExplorerSidebar() {
  return (
    <aside className="flex flex-col w-60 shrink-0 bg-zinc-950 border-r border-zinc-800 overflow-y-auto">
      <NarrativeList />
      <div className="border-t border-zinc-800 mt-2" />
      <ComponentTree />
    </aside>
  )
}
