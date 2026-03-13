import React from 'react';

interface BaseBackdropProps {
  onClick?: () => void;
  isOpen: boolean;
  blur?: boolean;
  dim?: boolean;
  children?: React.ReactNode;
  zIndex?: number;
}

export const BaseBackdrop: React.FC<BaseBackdropProps> = ({
  onClick,
  isOpen,
  blur = true,
  dim = true,
  children,
  zIndex = 10,
}) => {
  if (!isOpen) return null;

  const backdropClasses = `
    fixed inset-0 
    transition-all duration-200
    ${dim ? 'bg-black/50' : 'bg-transparent'}
    ${blur ? 'backdrop-blur-sm' : ''}
    pointer-events-auto
  `.trim();

  return (
    <div 
      className={backdropClasses} 
      style={{ zIndex }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
