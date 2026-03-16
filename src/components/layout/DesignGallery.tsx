import React from 'react'
import { BaseText } from '../primitives/BaseText'
import { BaseButton } from '../primitives/BaseButton'
import { BaseIcon } from '../primitives/BaseIcon'
import { BaseInput } from '../primitives/BaseInput'
import { BaseBadge } from '../primitives/BaseBadge'

export const DesignGallery: React.FC = () => {
  return (
    <div className="p-tk-12 bg-bg-main min-h-screen text-text-main overflow-y-auto">
      <header className="mb-tk-12">
        <BaseText as="h1" size="2xl" weight="bold">
          Design System Gallery
        </BaseText>
        <BaseText variant="dim">Primitive components for Fabletoria</BaseText>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-tk-12">
        {/* Typography */}
        <section className="space-y-tk-4 p-tk-6 border border-border-main rounded-tk-lg bg-bg-surface">
          <BaseText as="h2" size="lg" weight="semibold" className="mb-tk-4 block">
            Typography
          </BaseText>
          <div className="space-y-tk-2">
            <BaseText size="2xl" as="div">
              Heading 2XL
            </BaseText>
            <BaseText size="xl" as="div">
              Heading XL
            </BaseText>
            <BaseText size="lg" as="div">
              Heading LG
            </BaseText>
            <BaseText size="base" as="div">
              Base Text
            </BaseText>
            <BaseText size="sm" as="div">
              Small Text
            </BaseText>
            <BaseText size="xs" as="div">
              Extra Small Text
            </BaseText>
          </div>
          <div className="pt-tk-4 space-y-tk-2">
            <BaseText variant="primary" as="div">
              Primary Text
            </BaseText>
            <BaseText variant="success" as="div">
              Success Text
            </BaseText>
            <BaseText variant="warning" as="div">
              Warning Text
            </BaseText>
            <BaseText variant="error" as="div">
              Error Text
            </BaseText>
            <BaseText variant="dim" as="div">
              Dimmed Text
            </BaseText>
          </div>
        </section>

        {/* Buttons */}
        <section className="space-y-tk-4 p-tk-6 border border-border-main rounded-tk-lg bg-bg-surface">
          <BaseText as="h2" size="lg" weight="semibold" className="mb-tk-4 block">
            Buttons
          </BaseText>
          <div className="flex flex-wrap gap-tk-4">
            <BaseButton variant="primary">Primary</BaseButton>
            <BaseButton variant="secondary">Secondary</BaseButton>
            <BaseButton variant="ghost">Ghost</BaseButton>
            <BaseButton variant="danger">Danger</BaseButton>
          </div>
          <div className="flex flex-wrap gap-tk-4 items-center">
            <BaseButton size="sm" variant="primary">
              Small
            </BaseButton>
            <BaseButton size="md" variant="primary">
              Medium
            </BaseButton>
            <BaseButton size="lg" variant="primary">
              Large
            </BaseButton>
          </div>
          <div className="flex flex-wrap gap-tk-4">
            <BaseButton variant="primary" leftIcon={<BaseIcon name="Plus" size={16} />}>
              With Icon
            </BaseButton>
            <BaseButton variant="secondary" isLoading>
              Loading
            </BaseButton>
            <BaseButton variant="secondary" disabled>
              Disabled
            </BaseButton>
          </div>
        </section>

        {/* Icons */}
        <section className="space-y-tk-4 p-tk-6 border border-border-main rounded-tk-lg bg-bg-surface">
          <BaseText as="h2" size="lg" weight="semibold" className="mb-tk-4 block">
            Icons (Lucide)
          </BaseText>
          <div className="flex flex-wrap gap-tk-6">
            <BaseIcon name="Home" />
            <BaseIcon name="Settings" className="text-brand-primary" />
            <BaseIcon name="Trash" className="text-status-error" />
            <BaseIcon name="Check" className="text-status-success" />
            <BaseIcon name="AlertTriangle" className="text-status-warning" />
            <BaseIcon name="Info" className="text-status-info" />
            <BaseIcon name="ArrowRight" />
            <BaseIcon name="Lock" />
            <BaseIcon name="Unlock" />
            <BaseIcon name="File" />
          </div>
        </section>

        {/* Inputs */}
        <section className="space-y-tk-4 p-tk-6 border border-border-main rounded-tk-lg bg-bg-surface">
          <BaseText as="h2" size="lg" weight="semibold" className="mb-tk-4 block">
            Inputs
          </BaseText>
          <div className="space-y-tk-4">
            <BaseInput label="Default Input" placeholder="Type something..." />
            <BaseInput
              label="With Icon"
              placeholder="Search..."
              leftIcon={<BaseIcon name="Search" size={16} />}
            />
            <BaseInput label="With Error" placeholder="Type..." error="This field is required" />
            <BaseInput label="Disabled" placeholder="Cannot type" disabled />
          </div>
        </section>

        {/* Badges */}
        <section className="space-y-tk-4 p-tk-6 border border-border-main rounded-tk-lg bg-bg-surface">
          <BaseText as="h2" size="lg" weight="semibold" className="mb-tk-4 block">
            Badges
          </BaseText>
          <div className="flex flex-wrap gap-tk-2">
            <BaseBadge>Default</BaseBadge>
            <BaseBadge variant="primary">Primary</BaseBadge>
            <BaseBadge variant="success">Success</BaseBadge>
            <BaseBadge variant="warning">Warning</BaseBadge>
            <BaseBadge variant="error">Error</BaseBadge>
            <BaseBadge variant="info">Info</BaseBadge>
          </div>
          <div className="flex flex-wrap gap-tk-2">
            <BaseBadge rounded variant="primary">
              Rounded
            </BaseBadge>
            <BaseBadge size="xs" variant="default">
              Extra Small
            </BaseBadge>
            <BaseBadge size="sm" variant="default">
              Small
            </BaseBadge>
            <BaseBadge size="md" variant="default">
              Medium
            </BaseBadge>
          </div>
        </section>
      </div>
    </div>
  )
}
