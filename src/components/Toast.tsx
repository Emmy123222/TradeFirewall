'use client';

import React from 'react';
import { useToast, ToastMessage, ToastType } from '@/lib/toast';

interface ToastItemProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const getToastStyles = (type: ToastType): string => {
    const baseStyles = "flex items-center p-4 mb-3 rounded-lg shadow-lg max-w-sm w-full transition-all duration-300 ease-in-out border";
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-surface border-success/30 text-success`;
      case 'error':
        return `${baseStyles} bg-surface border-danger/30 text-danger`;
      case 'warning':
        return `${baseStyles} bg-surface border-warning/30 text-warning`;
      case 'info':
        return `${baseStyles} bg-surface border-primary/30 text-primary`;
      default:
        return `${baseStyles} bg-surface border-border text-text-primary`;
    }
  };

  const getIcon = (type: ToastType): string => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '•';
    }
  };

  return (
    <div className={getToastStyles(toast.type)}>
      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-current bg-opacity-10 text-sm font-bold mr-3">
        {getIcon(toast.type)}
      </div>
      <div className="flex-1 text-sm font-medium text-text-primary">
        {toast.message}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 ml-3 text-text-secondary hover:text-text-primary transition-colors"
        aria-label="Close notification"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={removeToast}
        />
      ))}
    </div>
  );
}

export default ToastContainer;