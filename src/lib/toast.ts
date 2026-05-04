// Toast notification utility for TradeFirewall
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

class ToastManager {
  private toasts: ToastMessage[] = [];
  private listeners: ((toasts: ToastMessage[]) => void)[] = [];

  show(type: ToastType, message: string, duration: number = 4000): string {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const toast: ToastMessage = {
      id,
      type,
      message,
      duration
    };

    this.toasts.push(toast);
    this.notifyListeners();

    // Auto-remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }

    return id;
  }

  remove(id: string): void {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notifyListeners();
  }

  clear(): void {
    this.toasts = [];
    this.notifyListeners();
  }

  getToasts(): ToastMessage[] {
    return [...this.toasts];
  }

  subscribe(listener: (toasts: ToastMessage[]) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      listener([...this.toasts]);
    });
  }

  // Convenience methods
  success(message: string, duration?: number): string {
    return this.show('success', message, duration);
  }

  error(message: string, duration?: number): string {
    return this.show('error', message, duration);
  }

  warning(message: string, duration?: number): string {
    return this.show('warning', message, duration);
  }

  info(message: string, duration?: number): string {
    return this.show('info', message, duration);
  }
}

export const toast = new ToastManager();

// React hook for using toasts in components
export function useToast() {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  React.useEffect(() => {
    const unsubscribe = toast.subscribe(setToasts);
    setToasts(toast.getToasts());
    
    return unsubscribe;
  }, []);

  return {
    toasts,
    showToast: toast.show.bind(toast),
    removeToast: toast.remove.bind(toast),
    clearToasts: toast.clear.bind(toast),
    success: toast.success.bind(toast),
    error: toast.error.bind(toast),
    warning: toast.warning.bind(toast),
    info: toast.info.bind(toast)
  };
}

// Import React for the hook
import React from 'react';