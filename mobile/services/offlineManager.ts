import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SyncQueueItem {
    id: string;
    action: 'create' | 'update' | 'delete';
    itemType: string;
    itemId: string;
    data?: any;
    timestamp: number;
    retryCount: number;
}

interface OfflineState {
    isOnline: boolean;
    lastSyncTime: number;
    pendingCount: number;
}

const SYNC_QUEUE_KEY = 'secure_vault_sync_queue';
const OFFLINE_STATE_KEY = 'secure_vault_offline_state';

class OfflineManager {
    private queue: SyncQueueItem[] = [];
    private isOnline: boolean = true;
    private listeners: Set<(state: OfflineState) => void> = new Set();

    async initialize(): Promise<void> {
        // Load queue from storage
        const stored = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
        if (stored) {
            this.queue = JSON.parse(stored);
        }

        // Check initial online status
        this.checkConnectivity();
    }

    async checkConnectivity(): Promise<boolean> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            await fetch('https://www.google.com/generate_204', {
                method: 'HEAD',
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            this.setOnline(true);
            return true;
        } catch {
            this.setOnline(false);
            return false;
        }
    }

    private setOnline(online: boolean): void {
        const wasOnline = this.isOnline;
        this.isOnline = online;

        // If coming back online, process queue
        if (!wasOnline && online) {
            this.processQueue();
        }

        this.notifyListeners();
    }

    async addToQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
        const queueItem: SyncQueueItem = {
            ...item,
            id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            retryCount: 0,
        };

        this.queue.push(queueItem);
        await this.saveQueue();
        this.notifyListeners();

        // Try to process immediately if online
        if (this.isOnline) {
            this.processQueue();
        }
    }

    async processQueue(): Promise<void> {
        if (!this.isOnline || this.queue.length === 0) return;

        const itemsToProcess = [...this.queue];

        for (const item of itemsToProcess) {
            try {
                await this.processSyncItem(item);
                // Remove from queue on success
                this.queue = this.queue.filter(q => q.id !== item.id);
            } catch (error) {
                // Increment retry count
                const queueItem = this.queue.find(q => q.id === item.id);
                if (queueItem) {
                    queueItem.retryCount++;
                    // Remove if too many retries
                    if (queueItem.retryCount > 5) {
                        this.queue = this.queue.filter(q => q.id !== item.id);
                        console.error('Sync item failed after 5 retries:', item);
                    }
                }
            }
        }

        await this.saveQueue();
        this.notifyListeners();
    }

    private async processSyncItem(item: SyncQueueItem): Promise<void> {
        const API_URL = 'http://10.0.2.2:3000'; // TODO: Use from constants

        switch (item.action) {
            case 'create':
                await fetch(`${API_URL}/api/vault`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item.data),
                });
                break;

            case 'update':
                await fetch(`${API_URL}/api/vault/${item.itemId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item.data),
                });
                break;

            case 'delete':
                await fetch(`${API_URL}/api/vault/${item.itemId}`, {
                    method: 'DELETE',
                });
                break;
        }
    }

    private async saveQueue(): Promise<void> {
        await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.queue));
    }

    getState(): OfflineState {
        return {
            isOnline: this.isOnline,
            lastSyncTime: this.queue.length > 0 ? Math.min(...this.queue.map(q => q.timestamp)) : Date.now(),
            pendingCount: this.queue.length,
        };
    }

    getQueue(): SyncQueueItem[] {
        return [...this.queue];
    }

    subscribe(listener: (state: OfflineState) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        const state = this.getState();
        this.listeners.forEach(listener => listener(state));
    }

    async clearQueue(): Promise<void> {
        this.queue = [];
        await this.saveQueue();
        this.notifyListeners();
    }
}

export const offlineManager = new OfflineManager();
