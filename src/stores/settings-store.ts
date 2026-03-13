import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { db } from '../lib/db'
import type { AppSettings } from '../lib/types'

interface SettingsState extends Omit<AppSettings, 'id'> {
  isLoading: boolean
  setOrganizeRatio: (val: number) => void
  setOrganizeMaxWidth: (val: number) => void
  setOrganizeHGap: (val: number) => void
  setOrganizeVGap: (val: number) => void
  resetToDefaults: () => void
  loadSettings: () => Promise<void>
}

const DEFAULT_SETTINGS: Omit<AppSettings, 'id'> = {
  organizeRatio: 2,
  organizeMaxWidth: 500,
  organizeHGap: 100,
  organizeVGap: 50
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      isLoading: true,

      setOrganizeRatio: (organizeRatio) => set({ organizeRatio }),
      setOrganizeMaxWidth: (organizeMaxWidth) => set({ organizeMaxWidth }),
      setOrganizeHGap: (organizeHGap) => set({ organizeHGap }),
      setOrganizeVGap: (organizeVGap) => set({ organizeVGap }),

      resetToDefaults: () => set({ ...DEFAULT_SETTINGS }),

      loadSettings: async () => {
        const saved = await db.settings.get('global')
        if (saved) {
          set({ ...saved, isLoading: false })
        } else {
          set({ isLoading: false })
        }
      }
    }),
    {
      name: 'fabletoria-settings',
      storage: createJSONStorage(() => ({
        getItem: async () => {
          const settings = await db.settings.get('global')
          return settings ? JSON.stringify({ state: settings }) : null
        },
        setItem: async (name, value) => {
          const parsed = JSON.parse(value)
          const { state } = parsed
          await db.settings.put({
            id: 'global',
            organizeRatio: state.organizeRatio,
            organizeMaxWidth: state.organizeMaxWidth,
            organizeHGap: state.organizeHGap,
            organizeVGap: state.organizeVGap
          })
        },
        removeItem: async () => {
          await db.settings.delete('global')
        }
      })),
      onRehydrateStorage: () => (state) => {
        if (state) state.loadSettings()
      }
    }
  )
)
