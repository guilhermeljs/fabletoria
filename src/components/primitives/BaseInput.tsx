import React from 'react';

type InputSize = 'sm' | 'md' | 'lg';

interface BaseInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize;
  error?: string | undefined;
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  ref?: React.Ref<HTMLInputElement>;
}

export const BaseInput: React.FC<BaseInputProps> = ({
  size = 'md',
  error,
  label,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = `
    flex h-tk-10 w-full rounded-tk-md border border-border-main
    bg-bg-surface py-tk-2 text-tk-sm text-text-main
    ring-offset-bg-main file:border-0 file:bg-transparent file:text-tk-sm file:font-medium
    placeholder:text-text-dim focus-visible:outline-none
    focus-visible:ring-1 focus-visible:ring-brand-primary focus-visible:ring-offset-1
    disabled:cursor-not-allowed disabled:opacity-50
    transition-shadow duration-200 ease-in-out
    ${leftIcon ? 'pl-tk-8' : ''}
    ${rightIcon ? 'pr-tk-8' : ''}
  `;

  const sizeClasses = {
    sm: 'h-8 px-tk-2 text-tk-xs',
    md: 'h-10 px-tk-3 text-tk-sm',
    lg: 'h-12 px-tk-4 text-tk-base',
  };

  const errorClasses = error ? 'border-status-error focus-visible:ring-status-error' : '';

  const finalClassName = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${errorClasses}
    ${leftIcon ? 'pl-tk-10' : ''}
    ${rightIcon ? 'pr-tk-10' : ''}
    ${className}
  `.trim();

  return (
    <div className={`${fullWidth ? 'w-full' : 'w-auto'}`}>
      {label && (
        <label className="text-tk-sm font-medium text-text-main mb-tk-1 block">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-tk-3 top-1/2 -translate-y-1/2 text-text-dim">
            {leftIcon}
          </div>
        )}
        <input
          className={finalClassName}
          disabled={disabled}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-tk-3 top-1/2 -translate-y-1/2 text-text-dim">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="text-tk-xs text-status-error mt-tk-1">{error}</p>
      )}
    </div>
  );
};
