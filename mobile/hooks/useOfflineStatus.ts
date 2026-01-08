import { useState, useEffect } from 'react';
import { offlineManager } from '@/services/offlineManager';

interface OfflineState {
    isOnline: boolean;
    lastSyncTime: number;
    pendingCount: number;
}

export function useOfflineStatus() {
    const [state, setState] = useState<OfflineState>({
        isOnline: true,
        lastSyncTime: Date.now(),
        pendingCount: 0,
    });

    useEffect(() => {
        // Initialize and get initial state
        offlineManager.initialize().then(() => {
            setState(offlineManager.getState());
        });

        // Subscribe to changes
        const unsubscribe = offlineManager.subscribe((newState) => {
            setState(newState);
        });

        // Check connectivity periodically
        const interval = setInterval(() => {
            offlineManager.checkConnectivity();
        }, 30000); // Every 30 seconds

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, []);

    return {
        ...state,
        refresh: () => offlineManager.checkConnectivity(),
        processQueue: () => offlineManager.processQueue(),
        clearQueue: () => offlineManager.clearQueue(),
    };
}
