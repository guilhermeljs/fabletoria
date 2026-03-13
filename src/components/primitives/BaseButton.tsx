import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning' | 'info';
type ButtonSize = 'sm' | 'md' | 'lg';

interface BaseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
  fullWidth?: boolean;
  active?: boolean;
}

export const BaseButton: React.FC<BaseButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  fullWidth = false,
  active = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-tk-md font-medium transition-transform duration-150 ease-out focus:outline-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer';
  
  const sizeClasses = {
    sm: 'px-tk-2 py-tk-1 text-tk-xs',
    md: 'px-tk-4 py-tk-2 text-tk-sm',
    lg: 'px-tk-6 py-tk-3 text-tk-base',
  };
  
  const variantClasses = {
    primary: 'bg-brand-primary text-white hover:bg-brand-primary/90',
    secondary: 'bg-bg-surface text-text-main border border-border-main hover:bg-bg-header',
    ghost: 'bg-transparent text-text-dim hover:text-text-main hover:bg-bg-surface',
    danger: 'bg-status-error text-white hover:bg-status-error/90',
    success: 'bg-status-success text-white hover:bg-status-success/90',
    warning: 'bg-status-warning text-black hover:bg-status-warning/90',
    info: 'bg-status-info text-white hover:bg-status-info/90',
  };
  const activeClasses = active ? 'bg-bg-header text-text-main' : '';

  const finalClassName = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${activeClasses}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim();

  return (
    <button
      className={`${finalClassName} active:scale-93`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="mr-tk-2 animate-spin">◌</span>
      )}
      {!isLoading && leftIcon && <span className="mr-tk-2">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-tk-2">{rightIcon}</span>}
    </button>
  );
};
