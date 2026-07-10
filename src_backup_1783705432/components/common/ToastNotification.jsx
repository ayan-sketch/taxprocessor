import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastNotification = ({ toasts, onDismiss }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getBackgroundColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-600/20 border-green-500/30';
      case 'error':
        return 'bg-red-600/20 border-red-500/30';
      case 'warning':
        return 'bg-yellow-600/20 border-yellow-500/30';
      default:
        return 'bg-blue-600/20 border-blue-500/30';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-md">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onDismiss={onDismiss}
            getIcon={getIcon}
            getBackgroundColor={getBackgroundColor}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

const Toast = ({ toast, onDismiss, getIcon, getBackgroundColor }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={`${getBackgroundColor(toast.type)} backdrop-blur-xl border rounded-xl p-4 shadow-2xl min-w-[300px]`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon(toast.type)}
        </div>
        <div className="flex-1 min-w-0">
          {toast.title && (
            <p className="font-semibold text-white mb-1">{toast.title}</p>
          )}
          <p className="text-sm text-gray-300">{toast.message}</p>
          {toast.action && (
            <button
              onClick={() => {
                toast.action.onClick();
                onDismiss(toast.id);
              }}
              className="mt-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className="flex-shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </motion.div>
  );
};

export default ToastNotification;

// Hook to use toast notifications
export const useToast = (toastNotifications, setToastNotifications) => {
  const showToast = (message, type = 'info', options = {}) => {
    const toast = {
      id: Date.now(),
      message,
      type,
      title: options.title,
      action: options.action,
      duration: options.duration || 5000,
      timestamp: Date.now()
    };
    
    setToastNotifications(prev => [...prev, toast]);
    return toast.id;
  };

  const dismissToast = (id) => {
    setToastNotifications(prev => prev.filter(toast => toast.id !== id));
  };

  const dismissAll = () => {
    setToastNotifications([]);
  };

  return {
    showToast,
    dismissToast,
    dismissAll,
    success: (message, options) => showToast(message, 'success', options),
    error: (message, options) => showToast(message, 'error', options),
    warning: (message, options) => showToast(message, 'warning', options),
    info: (message, options) => showToast(message, 'info', options)
  };
};
