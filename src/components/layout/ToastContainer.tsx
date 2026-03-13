import React from 'react';
import { useNotificationStore, Toast } from '../../stores/notification-store';
import { ToastPortal } from './PortalProvider';
import { BaseText } from '../primitives/BaseText';
import { BaseIcon, IconName } from '../primitives/BaseIcon';
import { BaseButton } from '../primitives/BaseButton';

const ToastItem: React.FC<{ toast: Toast }> = ({ toast }) => {
  const { removeToast } = useNotificationStore();

  const variantIcons: Record<string, IconName> = {
    info: 'Info',
    success: 'CheckCircle',
    warning: 'AlertTriangle',
    error: 'AlertCircle',
  };

  const variantColors: Record<string, string> = {
    info: 'text-status-info',
    success: 'text-status-success',
    warning: 'text-status-warning',
    error: 'text-status-error',
  };

  const IconName: IconName = variantIcons[toast.type] || "Info";

  return (
    <div 
      className="
        flex items-start gap-tk-3 p-tk-4 min-w-[300px] max-w-md 
        bg-bg-surface border border-border-main rounded-tk-md shadow-xl 
        animate-in slide-in-from-right-full duration-300 pointer-events-auto
      "
    >
      <div className={variantColors[toast.type]}>
        <BaseIcon name={IconName} size={20} />
      </div>
      
      <div className="flex-1">
        <BaseText size="sm" weight="medium" className="block mb-tk-1">
          {toast.message}
        </BaseText>
      </div>

      <BaseButton 
        variant="ghost" 
        size="sm" 
        className="-mt-tk-2 -mr-tk-2 p-tk-1 min-w-0 h-auto"
        onClick={() => removeToast(toast.id)}
      >
        <BaseIcon name="X" size={16} />
      </BaseButton>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts } = useNotificationStore();

  if (toasts.length === 0) return null;

  return (
    <ToastPortal>
      <div className="flex flex-col-reverse gap-tk-2">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </div>
    </ToastPortal>
  );
};
