import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function LoginScreen() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localLoading, setLocalLoading] = useState(false);

    const {
        isLoading,
        isSetupComplete,
        biometricsEnabled,
        biometricsAvailable,
        unlockWithBiometrics,
        unlockWithPassword,
        setupWithPassword,
        isAuthenticated,
        initialize
    } = useAuthStore();

    useEffect(() => {
        initialize();
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            router.replace('/(tabs)');
        }
    }, [isAuthenticated]);

    useEffect(() => {
        // Auto-prompt biometrics if setup is complete and biometrics enabled
        if (!isLoading && isSetupComplete && biometricsEnabled) {
            handleBiometricUnlock();
        }
    }, [isLoading, isSetupComplete, biometricsEnabled]);

    const handleBiometricUnlock = async () => {
        const success = await unlockWithBiometrics();
        if (!success) {
            // Will show password input
        }
    };

    const handleSubmit = async () => {
        if (!password) {
            Alert.alert('Error', 'Please enter a password');
            return;
        }

        setLocalLoading(true);
        try {
            if (isSetupComplete) {
                // Unlock existing vault
                const success = await unlockWithPassword(password);
                if (!success) {
                    Alert.alert('Error', 'Incorrect password. Please try again.');
                }
            } else {
                // First time setup
                if (password !== confirmPassword) {
                    Alert.alert('Error', 'Passwords do not match');
                    setLocalLoading(false);
                    return;
                }
                if (password.length < 8) {
                    Alert.alert('Error', 'Password must be at least 8 characters');
                    setLocalLoading(false);
                    return;
                }
                const success = await setupWithPassword(password);
                if (success) {
                    router.replace('/(tabs)');
                } else {
                    Alert.alert('Error', 'Setup failed. Please try again.');
                }
            }
        } catch (e) {
            Alert.alert('Error', 'An unexpected error occurred');
            console.error(e);
        } finally {
            setLocalLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <Ionicons name="shield-checkmark" size={64} color={COLORS.primary} />
                </View>
                <Text style={styles.title}>SecureVault</Text>
                <Text style={styles.subtitle}>
                    {isSetupComplete ? 'Enter your master password' : 'Create your master password'}
                </Text>
            </View>

            <View style={styles.form}>
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Master Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your master password"
                        placeholderTextColor={COLORS.textSecondary}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoCapitalize="none"
                    />
                </View>

                {!isSetupComplete && (
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Confirm Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm your master password"
                            placeholderTextColor={COLORS.textSecondary}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            autoCapitalize="none"
                        />
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.button, localLoading && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={localLoading}
                >
                    {localLoading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.buttonText}>
                            {isSetupComplete ? 'Unlock Vault' : 'Create Vault'}
                        </Text>
                    )}
                </TouchableOpacity>

                {isSetupComplete && biometricsEnabled && biometricsAvailable && (
                    <TouchableOpacity
                        style={styles.biometricButton}
                        onPress={handleBiometricUnlock}
                    >
                        <Ionicons name="finger-print" size={32} color={COLORS.primary} />
                        <Text style={styles.biometricText}>Use Biometrics</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: SPACING.xl,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(225, 6, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.l,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    title: {
        ...TYPOGRAPHY.h1,
        marginBottom: SPACING.s,
    },
    subtitle: {
        ...TYPOGRAPHY.body,
        color: COLORS.textSecondary,
    },
    form: {
        gap: SPACING.l,
    },
    inputContainer: {
        gap: SPACING.s,
    },
    label: {
        ...TYPOGRAPHY.label,
        fontWeight: '600',
    },
    input: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.m,
        padding: SPACING.m,
        color: COLORS.textPrimary,
        fontSize: 16,
    },
    button: {
        backgroundColor: COLORS.primary,
        padding: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
        alignItems: 'center',
        marginTop: SPACING.m,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    biometricButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.s,
        marginTop: SPACING.m,
    },
    biometricText: {
        color: COLORS.primary,
        fontWeight: '600',
    },
});
