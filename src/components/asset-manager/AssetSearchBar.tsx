import { BaseInput } from '../primitives/BaseInput'
import { BaseIcon } from '../primitives/BaseIcon'

interface Props {
  value: string
  onChange: (value: string) => void
}

export default function AssetSearchBar({ value, onChange }: Props) {
  return (
    <BaseInput
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search assets…"
      leftIcon={<BaseIcon name="Search" size={16} />}
      fullWidth
    />
  )
}
