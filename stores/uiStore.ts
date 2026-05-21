import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface UIState {
  sidebarOpen: boolean;
  currentPage: string;
  toast: {
    message: string;
    type: ToastType;
    visible: boolean;
  } | null;
  setSidebarOpen: (open: boolean) => void;
  setCurrentPage: (page: string) => void;
  showToast: (message: string, type: ToastType) => void;
  hideToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  currentPage: 'vault',
  toast: null,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  showToast: (message, type) =>
    set({ toast: { message, type, visible: true } }),
  hideToast: () => set({ toast: null }),
}));
