// Toast notification component
"use client";

import React from 'react';
import { useToasts } from '@/lib/toast';

export function ToastContainer() {
  const { toasts, removeToast } = useToasts();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            max-w-sm p-4 rounded-lg shadow-lg border transition-all duration-300 ease-in-out
            ${getToastStyles(toast.type)}
          `}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0">
                {getToastIcon(toast.type)}
              </div>
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 flex-shrink-0 text-text-secondary hover:text-text-primary transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function getToastStyles(type: string): string {
  switch (type) {
    case 'success':
      return 'bg-surface border-success/30 text-success';
    case 'error':
      return 'bg-surface border-danger/30 text-danger';
    case 'warning':
      return 'bg-surface border-warning/30 text-warning';
    case 'info':
      return 'bg-surface border-primary/30 text-primary';
    default:
      return 'bg-surface border-border text-text-primary';
  }
}

function getToastIcon(type: string): React.ReactNode {
  switch (type) {
    case 'success':
      return (
        <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'error':
      return (
        <svg className="w-5 h-5 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    case 'warning':
      return (
        <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    case 'info':
      return (
        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return null;
  }
}