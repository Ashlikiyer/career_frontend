import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, X, AlertTriangle, Info } from 'lucide-react';

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast styles configuration
const toastStyles = {
  success: {
    bg: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    icon: CheckCircle,
    iconColor: 'text-white',
  },
  error: {
    bg: 'bg-gradient-to-r from-red-500 to-rose-500',
    icon: X,
    iconColor: 'text-white',
  },
  warning: {
    bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
    icon: AlertTriangle,
    iconColor: 'text-white',
  },
  info: {
    bg: 'bg-gradient-to-r from-blue-500 to-indigo-500',
    icon: Info,
    iconColor: 'text-white',
  },
};

// Individual Toast Component
const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  const style = toastStyles[toast.type];
  const Icon = style.icon;

  useEffect(() => {
    const timeout = setTimeout(() => {
      onClose();
    }, toast.duration || 4000);

    return () => clearTimeout(timeout);
  }, [toast.duration, onClose]);

  return (
    <div
      className={`${style.bg} rounded-xl shadow-2xl p-4 min-w-[320px] max-w-[420px] text-white transform transition-all duration-300 animate-slide-in`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          <Icon className={`w-4 h-4 ${style.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{toast.title}</p>
          {toast.message && (
            <p className="text-white/80 text-xs mt-0.5 line-clamp-2">{toast.message}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {/* Progress bar */}
      <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
        <div 
          className="h-full bg-white/60 rounded-full animate-shrink"
          style={{ animationDuration: `${toast.duration || 4000}ms` }}
        />
      </div>
    </div>
  );
};

// Toast Provider Component
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => hideToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Custom Hook
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return {
    ...context,
    success: (title: string, message?: string, duration?: number) =>
      context.showToast({ type: 'success', title, message, duration }),
    error: (title: string, message?: string, duration?: number) =>
      context.showToast({ type: 'error', title, message, duration }),
    warning: (title: string, message?: string, duration?: number) =>
      context.showToast({ type: 'warning', title, message, duration }),
    info: (title: string, message?: string, duration?: number) =>
      context.showToast({ type: 'info', title, message, duration }),
  };
};

export default ToastProvider;
