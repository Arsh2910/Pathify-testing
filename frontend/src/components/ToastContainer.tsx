import React from 'react';
import { useToastStore, ToastItem } from '../store/toastStore';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-[999999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: () => void }> = ({
  toast,
  onDismiss,
}) => {
  const config = {
    success: {
      icon: 'check_circle',
      iconColor: 'var(--th-primary-container)',
      border: 'color-mix(in srgb, var(--th-primary-container) 40%, transparent)',
      bg: 'color-mix(in srgb, var(--th-surface-container) 92%, var(--th-primary-container) 8%)',
    },
    error: {
      icon: 'error',
      iconColor: 'var(--th-error)',
      border: 'color-mix(in srgb, var(--th-error) 40%, transparent)',
      bg: 'color-mix(in srgb, var(--th-surface-container) 92%, var(--th-error) 8%)',
    },
    warning: {
      icon: 'warning',
      iconColor: '#f59e0b',
      border: 'rgba(245, 158, 11, 0.4)',
      bg: 'color-mix(in srgb, var(--th-surface-container) 92%, #f59e0b 8%)',
    },
    info: {
      icon: 'info',
      iconColor: 'var(--th-primary-container)',
      border: 'var(--th-outline-variant)',
      bg: 'var(--th-surface-container)',
    },
  }[toast.type];

  return (
    <div
      className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-2xl backdrop-blur-md transition-all animate-fade-in border"
      style={{
        background: config.bg,
        borderColor: config.border,
      }}
    >
      <span
        className="material-symbols-outlined shrink-0 text-xl"
        style={{ color: config.iconColor, fontSize: '20px', marginTop: '1px' }}
      >
        {config.icon}
      </span>
      <p
        className="text-xs sm:text-sm font-medium flex-1 leading-snug"
        style={{ fontFamily: 'Hanken Grotesk', color: 'var(--th-on-surface)' }}
      >
        {toast.message}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity p-0.5 rounded cursor-pointer"
        aria-label="Dismiss toast"
      >
        <span className="material-symbols-outlined text-base" style={{ fontSize: '16px' }}>
          close
        </span>
      </button>
    </div>
  );
};

export default ToastContainer;
