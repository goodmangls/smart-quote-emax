import React, { useCallback, useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    },
    [onCancel]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      cancelRef.current?.focus();
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, handleKeyDown]);

  if (!open) return null;

  const confirmColors =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500/50'
      : 'bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500/50';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-sm p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${variant === 'danger' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
            <AlertTriangle className={`w-5 h-5 ${variant === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="confirm-title" className="text-sm font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {message}
            </p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors ${confirmColors}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
