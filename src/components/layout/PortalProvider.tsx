import React, { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface PortalProviderProps {
  children: ReactNode;
}

export const PortalProvider: React.FC<PortalProviderProps> = ({ children }) => {
  return (
    <>
      {children}
      <div id="modal-root" className="fixed inset-0 pointer-events-none z-[1000]" />
      <div id="toast-root" className="fixed bottom-0 right-0 p-4 pointer-events-none z-[2000]" />
      <div id="tooltip-root" className="fixed inset-0 pointer-events-none z-[3000]" />
      <div id="context-menu-root" className="fixed inset-0 pointer-events-none z-[4500]" />
    </>
  );
};

export const ModalPortal: React.FC<{ children: ReactNode }> = ({ children }) => {
  const el = document.getElementById('modal-root');
  if (!el) return null;
  return createPortal(children, el);
};

export const ToastPortal: React.FC<{ children: ReactNode }> = ({ children }) => {
  const el = document.getElementById('toast-root');
  if (!el) return null;
  return createPortal(children, el);
};

export const TooltipPortal: React.FC<{ children: ReactNode }> = ({ children }) => {
  const el = document.getElementById('tooltip-root');
  if (!el) return null;
  return createPortal(children, el);
};

export const ContextMenuPortal: React.FC<{ children: ReactNode }> = ({ children }) => {
  const el = document.getElementById('context-menu-root');
  if (!el) return null;
  return createPortal(children, el);
};
