import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  addToast: (message, type = 'info', duration = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastItem = { id, type, message, duration };

    set((state) => ({
      // Keep up to 4 toasts active at once
      toasts: [...state.toasts.slice(-3), newToast],
    }));

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  success: (msg, duration) => get().addToast(msg, 'success', duration),
  error: (msg, duration) => get().addToast(msg, 'error', duration),
  info: (msg, duration) => get().addToast(msg, 'info', duration),
  warning: (msg, duration) => get().addToast(msg, 'warning', duration),
}));

// Convenient standalone export for non-React contexts if needed
export const toast = {
  success: (msg: string, duration?: number) => useToastStore.getState().success(msg, duration),
  error: (msg: string, duration?: number) => useToastStore.getState().error(msg, duration),
  info: (msg: string, duration?: number) => useToastStore.getState().info(msg, duration),
  warning: (msg: string, duration?: number) => useToastStore.getState().warning(msg, duration),
};
