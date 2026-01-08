import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AutoLockTime = '30s' | '1m' | '5m' | '10m' | 'never';

interface SettingsState {
    autoLockTime: AutoLockTime;
    screenshotProtection: boolean;
    emailAlerts: boolean;
    biometricReprompt: boolean;
    lastActivityTime: number;
    isLocked: boolean;

    setAutoLockTime: (time: AutoLockTime) => Promise<void>;
    setScreenshotProtection: (enabled: boolean) => Promise<void>;
    setEmailAlerts: (enabled: boolean) => Promise<void>;
    setBiometricReprompt: (enabled: boolean) => Promise<void>;
    updateLastActivity: () => void;
    checkAndLock: () => boolean;
    lock: () => void;
    unlock: () => void;
    loadSettings: () => Promise<void>;
}

const SETTINGS_KEY = 'secure_vault_settings';

const getAutoLockMs = (time: AutoLockTime): number => {
    switch (time) {
        case '30s': return 30 * 1000;
        case '1m': return 60 * 1000;
        case '5m': return 5 * 60 * 1000;
        case '10m': return 10 * 60 * 1000;
        case 'never': return Infinity;
    }
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
    autoLockTime: '1m',
    screenshotProtection: true,
    emailAlerts: false,
    biometricReprompt: true,
    lastActivityTime: Date.now(),
    isLocked: false,

    setAutoLockTime: async (time) => {
        set({ autoLockTime: time });
        await saveSettings(get());
    },

    setScreenshotProtection: async (enabled) => {
        set({ screenshotProtection: enabled });
        await saveSettings(get());
    },

    setEmailAlerts: async (enabled) => {
        set({ emailAlerts: enabled });
        await saveSettings(get());
    },

    setBiometricReprompt: async (enabled) => {
        set({ biometricReprompt: enabled });
        await saveSettings(get());
    },

    updateLastActivity: () => {
        set({ lastActivityTime: Date.now() });
    },

    checkAndLock: () => {
        const { autoLockTime, lastActivityTime, isLocked } = get();
        if (isLocked) return true;

        const timeout = getAutoLockMs(autoLockTime);
        if (timeout === Infinity) return false;

        const elapsed = Date.now() - lastActivityTime;
        if (elapsed >= timeout) {
            set({ isLocked: true });
            return true;
        }
        return false;
    },

    lock: () => {
        set({ isLocked: true });
    },

    unlock: () => {
        set({ isLocked: false, lastActivityTime: Date.now() });
    },

    loadSettings: async () => {
        try {
            const stored = await AsyncStorage.getItem(SETTINGS_KEY);
            if (stored) {
                const settings = JSON.parse(stored);
                set({
                    autoLockTime: settings.autoLockTime || '1m',
                    screenshotProtection: settings.screenshotProtection ?? true,
                    emailAlerts: settings.emailAlerts ?? false,
                    biometricReprompt: settings.biometricReprompt ?? true,
                });
            }
        } catch (e) {
            console.error('Failed to load settings', e);
        }
    },
}));

async function saveSettings(state: SettingsState) {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({
        autoLockTime: state.autoLockTime,
        screenshotProtection: state.screenshotProtection,
        emailAlerts: state.emailAlerts,
        biometricReprompt: state.biometricReprompt,
    }));
}
