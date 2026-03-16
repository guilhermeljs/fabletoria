import React from 'react'
import { useModalStore, ModalInstance } from '../../stores/modal-store'
import { ModalPortal } from './PortalProvider'
import { BaseBackdrop } from '../primitives/BaseBackdrop'

import SettingsModal from '../settings/SettingsModal'
import AssetManagerModal from '../asset-manager/AssetManagerModal'
import ComponentSchemaModal from '../explorer/ComponentSchemaModal'
import ConfirmModal from './ConfirmModal'
import ShareModal from '../realtime/ShareModal'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MODAL_COMPONENTS: Record<string, React.FC<any>> = {
  Settings: SettingsModal,
  AssetManager: AssetManagerModal,
  ComponentSchema: ComponentSchemaModal,
  Confirm: ConfirmModal,
  Share: ShareModal
}

const ModalWrapper: React.FC<{ modal: ModalInstance; index: number }> = ({ modal, index }) => {
  const { closeModal } = useModalStore()
  const Component = MODAL_COMPONENTS[modal.type]

  if (!Component) {
    console.warn("Modal type '${modal.type}' not found in registry")
    return null
  }

  const zIndex = 1000 + index * 10

  return (
    <>
      <BaseBackdrop isOpen zIndex={zIndex} onClick={() => closeModal(modal.id)} />
      <div
        className="fixed inset-0 flex items-center justify-center pointer-events-none"
        style={{ zIndex: zIndex + 5 }}
      >
        <div className="pointer-events-auto w-full max-w-4xl flex justify-center">
          <Component {...modal.props} isOpen onClose={() => closeModal(modal.id)} />
        </div>
      </div>
    </>
  )
}

export const ModalContainer: React.FC = () => {
  const { modalStack, isOpen } = useModalStore()

  if (!isOpen) return null

  return (
    <ModalPortal>
      {modalStack.map((modal, index) => (
        <ModalWrapper key={modal.id} modal={modal} index={index} />
      ))}
    </ModalPortal>
  )
}
