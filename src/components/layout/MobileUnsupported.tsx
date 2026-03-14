import React, { useEffect, useState } from 'react'
import { Smartphone } from 'lucide-react'
import { BaseButton } from '../primitives/BaseButton'
import { isElectron } from '../../lib/platform'
import { BaseText } from '../primitives/BaseText'

const MOBILE_MAX_DIMENSION = 720

export function MobileUnsupportedOverlay() {
  const [isMobile, setIsMobile] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (isElectron()) return // do not show in desktop app

    const update = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      setIsMobile(width <= MOBILE_MAX_DIMENSION || height <= MOBILE_MAX_DIMENSION)
    }

    update()
    window.addEventListener('resize', update)

    return () => window.removeEventListener('resize', update)
  }, [])

  if (!isMobile || dismissed) return null

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/90">
      <div className="max-w-md w-full p-tk-6 shadow-elevation-5">
        <div className="flex items-center justify-center flex-col gap-tk-3">
          <Smartphone className="h-20 w-20" />
          <BaseText as="h1" weight="bold" size="xl">
            Mobile not supported
          </BaseText>

          <BaseText as="p" variant="dim" className='text-center'>
            Fabletoria still doesn't support mobile devices. You can proceed at your own risk. There
            will be bugs.
          </BaseText>
          <p className="mt-tk-2 text-sm opacity-80 text-center"></p>
          <BaseButton variant="ghost" size="lg" onClick={() => setDismissed(true)}>
            PROCEED
          </BaseButton>
        </div>
      </div>
    </div>
  )
}
