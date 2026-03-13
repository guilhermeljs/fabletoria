import React from 'react';

interface VerticalSeparatorProps {
  height?: string;
  className?: string;
  color?: string;
}

export const BaseVerticalSeparator: React.FC<VerticalSeparatorProps> = ({
  height = 'h-6',
  className = '',
  color = 'bg-border-main',
}) => {
  return (
    <div 
      className={`
        w-[1px] 
        ${height} 
        ${color} 
        self-center 
        ${className}
      `}
      aria-hidden="true"
    />
  );
};