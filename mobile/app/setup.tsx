import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, ActivityIndicator, Animated } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function SetupScreen() {
    const { setupWithPassword, enableBiometrics, biometricsAvailable, isAuthenticated } = useAuthStore();

    const [step, setStep] = useState<'password' | 'biometrics'>('password');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [shakeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        if (isAuthenticated) {
            router.replace('/(tabs)');
        }
    }, [isAuthenticated]);

    const shake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const showError = (msg: string) => {
        setError(msg);
        shake();
    };

    const handlePasswordSubmit = async () => {
        setError('');

        if (password.length < 6) {
            showError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        try {
            const success = await setupWithPassword(password);
            if (success) {
                if (biometricsAvailable && Platform.OS !== 'web') {
                    setStep('biometrics');
                } else {
                    router.replace('/(tabs)');
                }
            } else {
                showError('Failed to set up vault');
            }
        } catch (e) {
            showError('Failed to set up vault');
        }
        setIsLoading(false);
    };

    const handleEnableBiometrics = async () => {
        setIsLoading(true);
        await enableBiometrics();
        setIsLoading(false);
        router.replace('/(tabs)');
    };

    const handleSkipBiometrics = () => {
        router.replace('/(tabs)');
    };

    const passwordsMatch = password && password === confirmPassword;
    const isPasswordValid = password.length >= 6;

    if (step === 'biometrics') {
        return (
            <View style={styles.container}>
                <View style={styles.iconContainer}>
                    <Ionicons name="finger-print" size={80} color={COLORS.primary} />
                </View>

                <Text style={styles.title}>Enable Biometrics?</Text>
                <Text style={styles.subtitle}>
                    Unlock your vault quickly and securely with fingerprint or Face ID
                </Text>

                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleEnableBiometrics}
                    disabled={isLoading}
                    activeOpacity={0.8}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <View style={styles.buttonContent}>
                            <Ionicons name="finger-print" size={22} color="#FFF" />
                            <Text style={styles.primaryButtonText}>Enable Biometrics</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} onPress={handleSkipBiometrics}>
                    <Text style={styles.secondaryButtonText}>Skip for now</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Ionicons name="shield-checkmark" size={80} color={COLORS.primary} />
            </View>

            <Text style={styles.title}>Set Up SecureVault</Text>
            <Text style={styles.subtitle}>
                Create a master password to protect your vault. This password is stored only on your device.
            </Text>

            <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                <View style={styles.inputContainer}>
                    <Ionicons name="key-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Master Password"
                        placeholderTextColor={COLORS.textSecondary}
                        value={password}
                        onChangeText={(text) => {
                            setPassword(text);
                            if (error) setError('');
                        }}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isLoading}
                    />
                    <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Confirm Password"
                        placeholderTextColor={COLORS.textSecondary}
                        value={confirmPassword}
                        onChangeText={(text) => {
                            setConfirmPassword(text);
                            if (error) setError('');
                        }}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isLoading}
                    />
                </View>
            </Animated.View>

            <View style={styles.requirements}>
                <View style={styles.requirementRow}>
                    <Ionicons
                        name={isPasswordValid ? "checkmark-circle" : "ellipse-outline"}
                        size={18}
                        color={isPasswordValid ? '#00CC88' : COLORS.textSecondary}
                    />
                    <Text style={[styles.requirement, isPasswordValid && styles.requirementMet]}>
                        At least 6 characters
                    </Text>
                </View>
                <View style={styles.requirementRow}>
                    <Ionicons
                        name={passwordsMatch ? "checkmark-circle" : "ellipse-outline"}
                        size={18}
                        color={passwordsMatch ? '#00CC88' : COLORS.textSecondary}
                    />
                    <Text style={[styles.requirement, passwordsMatch && styles.requirementMet]}>
                        Passwords match
                    </Text>
                </View>
            </View>

            {error ? (
                <View style={styles.errorContainer}>
                    <Ionicons name="warning" size={16} color={COLORS.danger} />
                    <Text style={styles.error}>{error}</Text>
                </View>
            ) : null}

            <TouchableOpacity
                style={[styles.primaryButton, (!isPasswordValid || !passwordsMatch || isLoading) && styles.buttonDisabled]}
                onPress={handlePasswordSubmit}
                disabled={!isPasswordValid || !passwordsMatch || isLoading}
                activeOpacity={0.8}
            >
                {isLoading ? (
                    <ActivityIndicator color="#FFF" />
                ) : (
                    <View style={styles.buttonContent}>
                        <Ionicons name="arrow-forward" size={20} color="#FFF" />
                        <Text style={styles.primaryButtonText}>Continue</Text>
                    </View>
                )}
            </TouchableOpacity>

            <View style={styles.warningBox}>
                <Ionicons name="warning" size={18} color="#FFCC00" />
                <Text style={styles.warning}>
                    If you forget your password, your vault cannot be recovered
                </Text>
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
    iconContainer: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: SPACING.m,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.xl,
        lineHeight: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: BORDER_RADIUS.m,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: SPACING.m,
    },
    inputIcon: {
        marginLeft: SPACING.m,
    },
    input: {
        flex: 1,
        padding: SPACING.m,
        color: COLORS.textPrimary,
        fontSize: 16,
    },
    eyeButton: {
        padding: SPACING.m,
    },
    requirements: {
        marginBottom: SPACING.l,
    },
    requirementRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.s,
        marginBottom: SPACING.xs,
    },
    requirement: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    requirementMet: {
        color: '#00CC88',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
        marginBottom: SPACING.m,
    },
    error: {
        color: COLORS.danger,
        fontSize: 14,
    },
    primaryButton: {
        backgroundColor: COLORS.primary,
        padding: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 50,
        marginBottom: SPACING.m,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.s,
    },
    primaryButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    secondaryButton: {
        padding: SPACING.m,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: COLORS.textSecondary,
        fontSize: 16,
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.s,
        marginTop: SPACING.l,
        padding: SPACING.m,
        backgroundColor: 'rgba(255, 204, 0, 0.1)',
        borderRadius: BORDER_RADIUS.m,
    },
    warning: {
        fontSize: 12,
        color: '#FFCC00',
        flex: 1,
    },
});
