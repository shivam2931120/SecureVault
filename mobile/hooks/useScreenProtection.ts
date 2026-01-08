import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useSettingsStore } from '@/store/settingsStore';

// Note: expo-screen-capture only works on native platforms
let ScreenCapture: any = null;
if (Platform.OS !== 'web') {
    try {
        ScreenCapture = require('expo-screen-capture');
    } catch (e) {
        console.log('expo-screen-capture not available');
    }
}

export function useScreenProtection() {
    const { screenshotProtection } = useSettingsStore();

    useEffect(() => {
        if (Platform.OS === 'web' || !ScreenCapture) return;

        const setupProtection = async () => {
            try {
                if (screenshotProtection) {
                    await ScreenCapture.preventScreenCaptureAsync();
                } else {
                    await ScreenCapture.allowScreenCaptureAsync();
                }
            } catch (e) {
                console.log('Screen capture control not available', e);
            }
        };

        setupProtection();

        return () => {
            if (ScreenCapture) {
                ScreenCapture.allowScreenCaptureAsync().catch(() => { });
            }
        };
    }, [screenshotProtection]);
}
