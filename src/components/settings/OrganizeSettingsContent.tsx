import { useSettingsStore } from '../../stores/settings-store'
import { BaseText } from '../primitives/BaseText'
import { BaseInput } from '../primitives/BaseInput'

export function OrganizeSettingsContent() {
  const settings = useSettingsStore()

  return (
    <div className="space-y-tk-6">
      <header>
        <BaseText as="h3" size="lg" weight="semibold">Organize Button</BaseText>
        <BaseText size="sm" variant="dim" className="block mt-tk-1">
          Configure how the canvas auto-layout behaves.
        </BaseText>
      </header>

      <div className="space-y-tk-4">
        <BaseInput 
          label="Horizontal Ratio (px/char)"
          type="number" 
          value={settings.organizeRatio} 
          onChange={(e) => settings.setOrganizeRatio(Number(e.target.value))}
        />

        <BaseInput 
          label="Maximum Width (px)"
          type="number" 
          value={settings.organizeMaxWidth} 
          onChange={(e) => settings.setOrganizeMaxWidth(Number(e.target.value))}
        />

        <div className="grid grid-cols-2 gap-tk-4">
          <BaseInput 
            label="Horizontal Gap"
            type="number" 
            value={settings.organizeHGap} 
            onChange={(e) => settings.setOrganizeHGap(Number(e.target.value))}
          />
          <BaseInput 
            label="Vertical Gap"
            type="number" 
            value={settings.organizeVGap} 
            onChange={(e) => settings.setOrganizeVGap(Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  )
}
