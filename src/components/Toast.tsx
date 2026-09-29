import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 max-w-md w-full pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} removeToast={removeToast} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; removeToast: (id: string) => void }> = ({ toast, removeToast }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, removeToast]);

  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200';
      case 'error':
        return 'bg-red-950/95 border-red-500/50 text-red-200';
      case 'warning':
        return 'bg-amber-950/95 border-amber-500/50 text-amber-200';
      case 'info':
      default:
        return 'bg-slate-900/95 border-blue-500/50 text-blue-200';
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-400 shrink-0" />;
    }
  };

  return (
    <div className={`pointer-events-auto flex items-start space-x-3 p-4 rounded-2xl border shadow-xl backdrop-blur-md transition-all animate-bounce-short ${getStyles()}`}>
      {getIcon()}
      <div className="flex-1 text-xs sm:text-sm font-medium leading-relaxed">
        {toast.message}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-slate-400 hover:text-white transition-colors p-1"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
