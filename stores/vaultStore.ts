import { create } from 'zustand';
import { DecryptedVaultItem } from '@/types';

interface VaultState {
  items: DecryptedVaultItem[];
  selectedItem: DecryptedVaultItem | null;
  searchQuery: string;
  filterType: 'all' | 'password' | 'note' | 'card' | 'apikey';
  isLocked: boolean;
  lastActivity: number;
  setItems: (items: DecryptedVaultItem[]) => void;
  addItem: (item: DecryptedVaultItem) => void;
  updateItem: (id: string, item: Partial<DecryptedVaultItem>) => void;
  deleteItem: (id: string) => void;
  setSelectedItem: (item: DecryptedVaultItem | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterType: (type: 'all' | 'password' | 'note' | 'card' | 'apikey') => void;
  setLocked: (locked: boolean) => void;
  updateActivity: () => void;
}

export const useVaultStore = create<VaultState>((set) => ({
  items: [],
  selectedItem: null,
  searchQuery: '',
  filterType: 'all',
  isLocked: false,
  lastActivity: Date.now(),
  setItems: (items) => set({ items }),
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  updateItem: (id, updatedItem) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...updatedItem } : item
      ),
    })),
  deleteItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),
  setSelectedItem: (selectedItem) => set({ selectedItem }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilterType: (filterType) => set({ filterType }),
  setLocked: (isLocked) => set({ isLocked }),
  updateActivity: () => set({ lastActivity: Date.now() }),
}));
