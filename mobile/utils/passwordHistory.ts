import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PasswordHistoryEntry {
    password: string;
    changedAt: string;
}

export interface ItemPasswordHistory {
    itemId: string;
    history: PasswordHistoryEntry[];
}

const HISTORY_KEY = 'password_history';
const MAX_HISTORY_PER_ITEM = 10;

/**
 * Add a password to history when it changes
 */
export async function addPasswordToHistory(itemId: string, password: string): Promise<void> {
    try {
        const stored = await AsyncStorage.getItem(HISTORY_KEY);
        const allHistory: Record<string, PasswordHistoryEntry[]> = stored ? JSON.parse(stored) : {};

        const itemHistory = allHistory[itemId] || [];

        // Don't add if it's the same as the most recent
        if (itemHistory.length > 0 && itemHistory[0].password === password) {
            return;
        }

        // Add new entry at the beginning
        itemHistory.unshift({
            password,
            changedAt: new Date().toISOString(),
        });

        // Keep only last N entries
        if (itemHistory.length > MAX_HISTORY_PER_ITEM) {
            itemHistory.splice(MAX_HISTORY_PER_ITEM);
        }

        allHistory[itemId] = itemHistory;
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(allHistory));
    } catch (e) {
        console.error('Failed to add password to history', e);
    }
}

/**
 * Get password history for an item
 */
export async function getPasswordHistory(itemId: string): Promise<PasswordHistoryEntry[]> {
    try {
        const stored = await AsyncStorage.getItem(HISTORY_KEY);
        if (!stored) return [];

        const allHistory: Record<string, PasswordHistoryEntry[]> = JSON.parse(stored);
        return allHistory[itemId] || [];
    } catch (e) {
        console.error('Failed to get password history', e);
        return [];
    }
}

/**
 * Clear history for an item (when item is deleted)
 */
export async function clearPasswordHistory(itemId: string): Promise<void> {
    try {
        const stored = await AsyncStorage.getItem(HISTORY_KEY);
        if (!stored) return;

        const allHistory: Record<string, PasswordHistoryEntry[]> = JSON.parse(stored);
        delete allHistory[itemId];
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(allHistory));
    } catch (e) {
        console.error('Failed to clear password history', e);
    }
}

/**
 * Get all items with password changes in the last N days
 */
export async function getRecentPasswordChanges(days: number = 30): Promise<{ itemId: string; lastChanged: string }[]> {
    try {
        const stored = await AsyncStorage.getItem(HISTORY_KEY);
        if (!stored) return [];

        const allHistory: Record<string, PasswordHistoryEntry[]> = JSON.parse(stored);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);

        const recent: { itemId: string; lastChanged: string }[] = [];

        for (const [itemId, history] of Object.entries(allHistory)) {
            if (history.length > 0) {
                const lastChanged = new Date(history[0].changedAt);
                if (lastChanged >= cutoff) {
                    recent.push({ itemId, lastChanged: history[0].changedAt });
                }
            }
        }

        return recent.sort((a, b) => new Date(b.lastChanged).getTime() - new Date(a.lastChanged).getTime());
    } catch (e) {
        console.error('Failed to get recent password changes', e);
        return [];
    }
}
