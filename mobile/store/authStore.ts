import { create } from 'zustand';
import * as LocalAuthentication from 'expo-local-authentication';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deriveMasterKey, exportKey, importKey, generateSalt, arrayBufferToBase64, base64ToUint8Array } from '@/crypto';

const AUTH_KEYS = {
    IS_SETUP_COMPLETE: 'auth_setup_complete',
    LOCAL_PASSWORD_HASH: 'local_password_hash',
    SALT: 'local_salt',
    BIOMETRICS_ENABLED: 'biometrics_enabled',
    MASTER_KEY: 'encrypted_master_key',
    USER_ID: 'local_user_id',
};

interface AuthState {
    isSetupComplete: boolean;
    isAuthenticated: boolean;
    isLoading: boolean;
    biometricsEnabled: boolean;
    biometricsAvailable: boolean;
    masterKey: string | null; // Changed from CryptoKey to string
    userId: string;

    // Setup actions
    initialize: () => Promise<void>;
    setupWithPassword: (password: string) => Promise<boolean>;
    enableBiometrics: () => Promise<boolean>;

    // Unlock actions
    unlockWithPassword: (password: string) => Promise<boolean>;
    unlockWithBiometrics: () => Promise<boolean>;

    // Other
    lock: () => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    isSetupComplete: false,
    isAuthenticated: false,
    isLoading: true,
    biometricsEnabled: false,
    biometricsAvailable: false,
    masterKey: null,
    userId: 'local_user',

    initialize: async () => {
        set({ isLoading: true });
        try {
            // Check if setup is complete
            const setupComplete = await AsyncStorage.getItem(AUTH_KEYS.IS_SETUP_COMPLETE);
            const biometricsEnabled = await AsyncStorage.getItem(AUTH_KEYS.BIOMETRICS_ENABLED);
            const userId = await AsyncStorage.getItem(AUTH_KEYS.USER_ID) || 'local_user_' + Date.now();

            // Check biometrics availability
            let biometricsAvailable = false;
            if (Platform.OS !== 'web') {
                const hasHardware = await LocalAuthentication.hasHardwareAsync();
                const isEnrolled = await LocalAuthentication.isEnrolledAsync();
                biometricsAvailable = hasHardware && isEnrolled;
            }

            set({
                isSetupComplete: setupComplete === 'true',
                biometricsEnabled: biometricsEnabled === 'true',
                biometricsAvailable,
                userId,
                isLoading: false,
            });
        } catch (e) {
            console.error('Auth init failed', e);
            set({ isLoading: false });
        }
    },

    setupWithPassword: async (password) => {
        try {
            // Generate salt
            const salt = generateSalt();
            const saltBase64 = arrayBufferToBase64(salt.buffer as ArrayBuffer);

            // Derive master key (now returns string)
            const masterKey = await deriveMasterKey(password, salt);

            // Store key for verification
            const exportedKey = await exportKey(masterKey);

            // Generate user ID
            const userId = 'local_user_' + Date.now();

            // Save to storage
            await AsyncStorage.setItem(AUTH_KEYS.SALT, saltBase64);
            await AsyncStorage.setItem(AUTH_KEYS.MASTER_KEY, JSON.stringify(exportedKey));
            await AsyncStorage.setItem(AUTH_KEYS.USER_ID, userId);
            await AsyncStorage.setItem(AUTH_KEYS.IS_SETUP_COMPLETE, 'true');

            set({
                isSetupComplete: true,
                isAuthenticated: true,
                masterKey,
                userId,
            });

            return true;
        } catch (e) {
            console.error('Setup failed', e);
            return false;
        }
    },

    enableBiometrics: async () => {
        if (Platform.OS === 'web') return false;

        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Enable biometric unlock',
                cancelLabel: 'Cancel',
            });

            if (result.success) {
                await AsyncStorage.setItem(AUTH_KEYS.BIOMETRICS_ENABLED, 'true');
                set({ biometricsEnabled: true });
                return true;
            }
            return false;
        } catch (e) {
            console.error('Biometrics enable failed', e);
            return false;
        }
    },

    unlockWithPassword: async (password) => {
        try {
            const saltBase64 = await AsyncStorage.getItem(AUTH_KEYS.SALT);
            const storedKeyJson = await AsyncStorage.getItem(AUTH_KEYS.MASTER_KEY);
            const userId = await AsyncStorage.getItem(AUTH_KEYS.USER_ID);

            if (!saltBase64 || !storedKeyJson || !userId) {
                return false;
            }

            // Derive key from password
            const salt = base64ToUint8Array(saltBase64);
            const derivedKey = await deriveMasterKey(password, salt);

            // Verify by comparing keys
            const derivedExport = await exportKey(derivedKey);
            const storedExport = JSON.parse(storedKeyJson);

            // Compare the 'k' property (key material)
            if (derivedExport.k !== storedExport.k) {
                return false;
            }

            set({
                isAuthenticated: true,
                masterKey: derivedKey,
                userId,
            });

            return true;
        } catch (e) {
            console.error('Password unlock failed', e);
            return false;
        }
    },

    unlockWithBiometrics: async () => {
        if (Platform.OS === 'web') return false;

        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Unlock SecureVault',
                cancelLabel: 'Use Password',
            });

            if (result.success) {
                // Load the stored master key directly
                const storedKeyJson = await AsyncStorage.getItem(AUTH_KEYS.MASTER_KEY);
                const userId = await AsyncStorage.getItem(AUTH_KEYS.USER_ID);

                if (storedKeyJson && userId) {
                    const jwk = JSON.parse(storedKeyJson);
                    const masterKey = await importKey(jwk);

                    set({
                        isAuthenticated: true,
                        masterKey,
                        userId,
                    });
                    return true;
                }
            }
            return false;
        } catch (e) {
            console.error('Biometric unlock failed', e);
            return false;
        }
    },

    lock: () => {
        set({ isAuthenticated: false, masterKey: null });
    },

    logout: () => {
        set({ isAuthenticated: false, masterKey: null });
        router.replace('/');
    },
}));

