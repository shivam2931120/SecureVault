import { useCallback, useEffect, useRef } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { Alert, Platform } from 'react-native';
import { useSettingsStore } from '@/store/settingsStore';

interface BiometricOptions {
    onSuccess: () => void;
    onCancel?: () => void;
    promptMessage?: string;
}

/**
 * Hook for requiring biometric re-authentication for sensitive actions
 */
export function useBiometricReprompt() {
    const { biometricReprompt } = useSettingsStore();
    const lastAuthTime = useRef<number>(0);
    const AUTH_TIMEOUT = 5 * 60 * 1000; // 5 minutes grace period

    const requireAuth = useCallback(async (options: BiometricOptions): Promise<boolean> => {
        const { onSuccess, onCancel, promptMessage = 'Authenticate to continue' } = options;

        // Skip on web
        if (Platform.OS === 'web') {
            onSuccess();
            return true;
        }

        // Check if re-prompt is enabled in settings
        if (!biometricReprompt) {
            onSuccess();
            return true;
        }

        // Check if recently authenticated
        const now = Date.now();
        if (now - lastAuthTime.current < AUTH_TIMEOUT) {
            onSuccess();
            return true;
        }

        try {
            // Check if biometrics is available
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            if (!hasHardware || !isEnrolled) {
                // No biometrics, proceed without
                onSuccess();
                return true;
            }

            // Prompt for biometric
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage,
                cancelLabel: 'Cancel',
                disableDeviceFallback: false,
            });

            if (result.success) {
                lastAuthTime.current = Date.now();
                onSuccess();
                return true;
            } else {
                onCancel?.();
                return false;
            }
        } catch (e) {
            console.error('Biometric auth error', e);
            Alert.alert('Authentication Failed', 'Please try again');
            onCancel?.();
            return false;
        }
    }, [biometricReprompt]);

    const protectedAction = useCallback(<T extends (...args: any[]) => any>(
        action: T,
        promptMessage?: string
    ): ((...args: Parameters<T>) => Promise<ReturnType<T> | void>) => {
        return async (...args: Parameters<T>): Promise<ReturnType<T> | void> => {
            return new Promise((resolve) => {
                requireAuth({
                    promptMessage,
                    onSuccess: () => {
                        const result = action(...args);
                        resolve(result);
                    },
                    onCancel: () => {
                        resolve(undefined);
                    }
                });
            });
        };
    }, [requireAuth]);

    return { requireAuth, protectedAction };
}
