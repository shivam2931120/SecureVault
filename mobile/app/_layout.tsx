import { useEffect, useRef, useState } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppState, AppStateStatus, View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useScreenProtection } from '@/hooks/useScreenProtection';
import { COLORS } from '@/theme';

export default function RootLayout() {
    const { initialize, isSetupComplete, isAuthenticated, isLoading, lock } = useAuthStore();
    const { loadSettings, updateLastActivity, checkAndLock, isLocked, unlock } = useSettingsStore();
    const appState = useRef(AppState.currentState);
    const segments = useSegments();

    // Enable screenshot protection
    useScreenProtection();

    useEffect(() => {
        initialize();
        loadSettings();
    }, []);

    // Navigation based on auth state
    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(tabs)';

        if (!isSetupComplete) {
            // First time user - go to setup
            router.replace('/setup');
        } else if (!isAuthenticated && inAuthGroup) {
            // Logged out but trying to access tabs - go to unlock
            router.replace('/unlock');
        } else if (isAuthenticated && !inAuthGroup && segments[0] !== 'setup') {
            // Authenticated and not in tabs - go to tabs
            router.replace('/(tabs)');
        }
    }, [isSetupComplete, isAuthenticated, isLoading, segments]);

    // Auto-lock on app state change
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
                // App going to background - record time
                updateLastActivity();
            } else if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                // App coming to foreground - check if should lock
                if (checkAndLock() && isAuthenticated) {
                    lock();
                    router.replace('/unlock');
                }
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [isAuthenticated]);

    // Redirect to unlock if locked
    useEffect(() => {
        if (isLocked && isAuthenticated) {
            lock();
            router.replace('/unlock');
        }
    }, [isLocked, isAuthenticated]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
                <StatusBar style="light" backgroundColor={COLORS.background} />
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            <StatusBar style="light" backgroundColor={COLORS.background} />
            <Stack
                screenOptions={{
                    headerStyle: {
                        backgroundColor: COLORS.background,
                    },
                    headerTintColor: COLORS.textPrimary,
                    headerShadowVisible: false,
                    contentStyle: {
                        backgroundColor: COLORS.background,
                    },
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                }}
            >
                <Stack.Screen
                    name="setup"
                    options={{
                        headerShown: false,
                        gestureEnabled: false
                    }}
                />
                <Stack.Screen
                    name="unlock"
                    options={{
                        headerShown: false,
                        gestureEnabled: false
                    }}
                />
                <Stack.Screen
                    name="(tabs)"
                    options={{
                        headerShown: false,
                        gestureEnabled: false
                    }}
                />
            </Stack>
        </View>
    );
}
