import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { encryptData, decryptData, generateIV, arrayBufferToBase64, base64ToArrayBuffer, base64ToUint8Array } from '@/crypto';
import { API_URL } from '@/utils/constants';
import {
    VaultItemType,
    BaseVaultItem,
    DecryptedVaultItem,
    Folder
} from '@/types/vault';

interface VaultState {
    items: DecryptedVaultItem[];
    folders: Folder[];
    isLoading: boolean;
    searchQuery: string;
    filterType: VaultItemType | 'all';
    filterFolder: string | null;
    showFavoritesOnly: boolean;

    setSearchQuery: (query: string) => void;
    setFilterType: (type: VaultItemType | 'all') => void;
    setFilterFolder: (folderId: string | null) => void;
    setShowFavoritesOnly: (show: boolean) => void;
    toggleFavorite: (itemId: string) => void;

    getFilteredItems: () => DecryptedVaultItem[];
    fetchItems: (userId: string, masterKey: string) => Promise<void>;
    addItem: (userId: string, itemType: VaultItemType, title: string, data: any, masterKey: string, folder?: string) => Promise<void>;
    deleteItem: (itemId: string, userId: string) => Promise<void>;
    sync: (userId: string, masterKey: string) => Promise<void>;

    addFolder: (name: string, icon?: string) => Promise<void>;
    deleteFolder: (folderId: string) => Promise<void>;
    loadFolders: () => Promise<void>;
}

const FOLDERS_KEY = 'secure_vault_folders';

async function encryptVaultData(data: any, masterKey: string): Promise<{ encryptedData: string; iv: string }> {
    const iv = generateIV();
    const encrypted = await encryptData(JSON.stringify(data), masterKey, iv);
    return {
        encryptedData: encrypted,
        iv: arrayBufferToBase64(iv.buffer as ArrayBuffer)
    };
}

async function decryptVaultData(encryptedData: string, ivString: string, masterKey: string): Promise<any> {
    const iv = base64ToUint8Array(ivString);
    const decrypted = await decryptData(encryptedData, masterKey, iv);
    return JSON.parse(decrypted);
}

export const useVaultStore = create<VaultState>((set, get) => ({
    items: [],
    folders: [],
    isLoading: false,
    searchQuery: '',
    filterType: 'all',
    filterFolder: null,
    showFavoritesOnly: false,

    setSearchQuery: (query) => set({ searchQuery: query }),
    setFilterType: (type) => set({ filterType: type }),
    setFilterFolder: (folderId) => set({ filterFolder: folderId }),
    setShowFavoritesOnly: (show) => set({ showFavoritesOnly: show }),

    toggleFavorite: (itemId) => {
        const items = get().items.map(item =>
            item.id === itemId ? { ...item, isFavorite: !item.isFavorite } : item
        );
        set({ items });
    },

    getFilteredItems: () => {
        const { items, searchQuery, filterType, filterFolder, showFavoritesOnly } = get();

        return items.filter(item => {
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesTitle = item.title.toLowerCase().includes(query);
                const matchesTags = item.tags?.some(tag => tag.toLowerCase().includes(query));
                if (!matchesTitle && !matchesTags) return false;
            }
            if (filterType !== 'all' && item.itemType !== filterType) return false;
            if (filterFolder && item.folder !== filterFolder) return false;
            if (showFavoritesOnly && !item.isFavorite) return false;
            return true;
        });
    },

    fetchItems: async (userId, masterKey) => {
        set({ isLoading: true });
        try {
            await get().loadFolders();

            const cached = await AsyncStorage.getItem(`vault_${userId}`);
            if (cached) {
                const encryptedItems: BaseVaultItem[] = JSON.parse(cached);
                const decryptedItems = await Promise.all(
                    encryptedItems.map(async (item) => {
                        try {
                            const data = await decryptVaultData(item.encryptedData, item.iv, masterKey);
                            return {
                                ...item,
                                decrypted: data,
                                isFavorite: item.isFavorite ?? false,
                                tags: item.tags ?? [],
                                syncStatus: item.syncStatus ?? 'synced'
                            } as DecryptedVaultItem;
                        } catch (e) {
                            console.warn('Failed to decrypt item', item.id);
                            return null;
                        }
                    })
                );
                set({ items: decryptedItems.filter(Boolean) as DecryptedVaultItem[] });
            }

            await get().sync(userId, masterKey);
        } catch (e) {
            console.error(e);
        } finally {
            set({ isLoading: false });
        }
    },

    sync: async (userId, masterKey) => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const res = await fetch(`${API_URL}/api/vault?userId=${userId}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                const encryptedItems: BaseVaultItem[] = data.items || [];

                await AsyncStorage.setItem(`vault_${userId}`, JSON.stringify(encryptedItems));

                const decryptedItems = await Promise.all(
                    encryptedItems.map(async (item) => {
                        try {
                            const decryptedData = await decryptVaultData(item.encryptedData, item.iv, masterKey);
                            return {
                                ...item,
                                decrypted: decryptedData,
                                isFavorite: item.isFavorite ?? false,
                                tags: item.tags ?? [],
                                syncStatus: 'synced' as const
                            } as DecryptedVaultItem;
                        } catch (e) { return null; }
                    })
                );
                set({ items: decryptedItems.filter(Boolean) as DecryptedVaultItem[] });
            }
        } catch (e) {
            console.log('Sync failed, using cache', e);
        }
    },

    addItem: async (userId, itemType, title, data, masterKey, folder) => {
        const { encryptedData, iv } = await encryptVaultData(data, masterKey);

        const newItem: BaseVaultItem = {
            id: `local_${Date.now()}`,
            itemType,
            title,
            folder,
            isFavorite: false,
            tags: [],
            encryptedData,
            iv,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            syncStatus: 'pending',
        };

        const decryptedItem = { ...newItem, decrypted: data } as DecryptedVaultItem;
        set({ items: [...get().items, decryptedItem] });

        const cached = await AsyncStorage.getItem(`vault_${userId}`);
        const items = cached ? JSON.parse(cached) : [];
        items.push(newItem);
        await AsyncStorage.setItem(`vault_${userId}`, JSON.stringify(items));

        try {
            const res = await fetch(`${API_URL}/api/vault`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, itemType, title, encryptedData, iv, folder })
            });

            if (res.ok) {
                await get().sync(userId, masterKey);
            }
        } catch (e) {
            console.log('Failed to sync new item', e);
        }
    },

    deleteItem: async (itemId, userId) => {
        set({ items: get().items.filter(i => i.id !== itemId) });

        const cached = await AsyncStorage.getItem(`vault_${userId}`);
        if (cached) {
            const items = JSON.parse(cached).filter((i: any) => i.id !== itemId);
            await AsyncStorage.setItem(`vault_${userId}`, JSON.stringify(items));
        }
    },

    addFolder: async (name, icon) => {
        const newFolder: Folder = {
            id: `folder_${Date.now()}`,
            name,
            icon,
            createdAt: new Date().toISOString(),
        };
        const folders = [...get().folders, newFolder];
        set({ folders });
        await AsyncStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    },

    deleteFolder: async (folderId) => {
        const folders = get().folders.filter(f => f.id !== folderId);
        set({ folders });
        await AsyncStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    },

    loadFolders: async () => {
        try {
            const stored = await AsyncStorage.getItem(FOLDERS_KEY);
            if (stored) {
                set({ folders: JSON.parse(stored) });
            }
        } catch (e) {
            console.error('Failed to load folders', e);
        }
    },
}));
