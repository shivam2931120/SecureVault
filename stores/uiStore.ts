import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  currentPage: string;
  toast: {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    visible: boolean;
  } | null;
  modal: {
    type: 'delete' | 'generator' | 'add' | null;
    data?: any;
  };
  setSidebarOpen: (open: boolean) => void;
  setCurrentPage: (page: string) => void;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  hideToast: () => void;
  openModal: (type: 'delete' | 'generator' | 'add', data?: any) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  currentPage: 'vault',
  toast: null,
  modal: { type: null },
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  showToast: (message, type) =>
    set({ toast: { message, type, visible: true } }),
  hideToast: () => set({ toast: null }),
  openModal: (type, data) => set({ modal: { type, data } }),
  closeModal: () => set({ modal: { type: null } }),
}));
