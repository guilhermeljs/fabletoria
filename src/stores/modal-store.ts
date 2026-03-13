import { create } from 'zustand';

export type ModalType = 'Settings' | 'AssetManager' | 'Confirm' | string;

export interface ModalInstance {
  id: string;
  type: ModalType;
  props?: Record<string, any> | undefined;
}

interface ModalState {
  modalStack: ModalInstance[];
  isOpen: boolean;
  openModal: (type: ModalType, props?: Record<string, any>) => void;
  closeModal: (id?: string) => void;
  closeAllModals: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  modalStack: [],
  isOpen: false,
  openModal: (type, props) => set((state) => {
    const id = crypto.randomUUID();
    return {
      modalStack: [...state.modalStack, { id, type, props }],
      isOpen: true,
    };
  }),
  closeModal: (id) => set((state) => {
    const newStack = id 
      ? state.modalStack.filter((m) => m.id !== id)
      : state.modalStack.slice(0, -1);
    return {
      modalStack: newStack,
      isOpen: newStack.length > 0,
    };
  }),
  closeAllModals: () => set({ modalStack: [], isOpen: false }),
}));
