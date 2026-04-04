import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext);

let nextId = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((type: ToastType, message: string) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[300] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  error: <XCircle className="w-4 h-4 text-red-500" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-500" />,
  info: <Info className="w-4 h-4 text-jways-500" />,
};

const BG: Record<ToastType, string> = {
  success: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30',
  error: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30',
  warning: 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30',
  info: 'border-jways-200 dark:border-jways-800 bg-jways-50 dark:bg-jways-900/30',
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: number) => void }> = ({ toast: t, onDismiss }) => (
  <div
    className={`pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm max-w-sm animate-in slide-in-from-right fade-in ${BG[t.type]}`}
    role="alert"
  >
    {ICONS[t.type]}
    <span className="text-sm text-gray-800 dark:text-gray-200 flex-1">{t.message}</span>
    <button
      onClick={() => onDismiss(t.id)}
      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
      aria-label="Dismiss"
    >
      <X className="w-3.5 h-3.5" />
    </button>
  </div>
);
