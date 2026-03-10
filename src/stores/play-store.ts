import { create } from 'zustand'
import type { EntityId } from '../lib/types'
import { useProjectStore } from './project-store'

interface PlayState {
  isActive: boolean
  narrativeId: EntityId | null
  startNodeId: EntityId | null
  currentNodeId: EntityId | null
  history: EntityId[]

  start: (narrativeId: EntityId, startNodeId: EntityId) => void
  choose: (connectionId: EntityId) => void
  restart: () => void
  exit: () => void
}

export const usePlayStore = create<PlayState>()((set, get) => ({
  isActive: false,
  narrativeId: null,
  startNodeId: null,
  currentNodeId: null,
  history: [],

  start(narrativeId, startNodeId) {
    set({
      isActive: true,
      narrativeId,
      startNodeId,
      currentNodeId: startNodeId,
      history: []
    })
  },

  choose(connectionId) {
    const connection = useProjectStore.getState().connections[connectionId]
    if (!connection) return
    const { currentNodeId } = get()
    if (currentNodeId === null) return
    set((s) => ({
      history: [...s.history, currentNodeId],
      currentNodeId: connection.targetNodeId
    }))
  },

  restart() {
    const { startNodeId } = get()
    if (startNodeId === null) return
    set({ currentNodeId: startNodeId, history: [] })
  },

  exit() {
    set({
      isActive: false,
      narrativeId: null,
      startNodeId: null,
      currentNodeId: null,
      history: []
    })
  }
}))
