import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const INTRUDER_KEY = 'intruder_alerts';

export interface IntruderAlert {
    id: string;
    timestamp: number;
    imageUri: string;
}

interface IntruderState {
    intruders: IntruderAlert[];
    loadIntruders: () => Promise<void>;
    addIntruder: (imageUri: string) => Promise<void>;
    deleteIntruder: (id: string) => Promise<void>;
    clearIntruders: () => Promise<void>;
}

export const useIntruderStore = create<IntruderState>((set, get) => ({
    intruders: [],

    loadIntruders: async () => {
        try {
            const json = await AsyncStorage.getItem(INTRUDER_KEY);
            if (json) {
                set({ intruders: JSON.parse(json) });
            }
        } catch (e) {
            console.error('Failed to load intruders', e);
        }
    },

    addIntruder: async (imageUri: string) => {
        try {
            const newIntruder: IntruderAlert = {
                id: Date.now().toString(),
                timestamp: Date.now(),
                imageUri,
            };

            const updated = [newIntruder, ...get().intruders];
            set({ intruders: updated });
            await AsyncStorage.setItem(INTRUDER_KEY, JSON.stringify(updated));
        } catch (e) {
            console.error('Failed to add intruder', e);
        }
    },

    deleteIntruder: async (id: string) => {
        try {
            const intruder = get().intruders.find((i: IntruderAlert) => i.id === id);
            if (intruder) {
                await FileSystem.deleteAsync(intruder.imageUri, { idempotent: true });
            }

            const updated = get().intruders.filter((i: IntruderAlert) => i.id !== id);
            set({ intruders: updated });
            await AsyncStorage.setItem(INTRUDER_KEY, JSON.stringify(updated));
        } catch (e) {
            console.error('Failed to delete intruder', e);
        }
    },

    clearIntruders: async () => {
        try {
            const { intruders } = get();
            for (const intruder of intruders) {
                await FileSystem.deleteAsync(intruder.imageUri, { idempotent: true });
            }
            set({ intruders: [] });
            await AsyncStorage.removeItem(INTRUDER_KEY);
        } catch (e) {
            console.error('Failed to clear intruders', e);
        }
    }
}));
