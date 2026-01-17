import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, ActivityIndicator, Animated } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { IntruderCapture, IntruderCaptureRef } from '@/components/IntruderCapture';

export default function UnlockScreen() {
    const {
        unlockWithPassword,
        unlockWithBiometrics,
        biometricsEnabled,
        isAuthenticated,
        isLoading: authLoading
    } = useAuthStore();

    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [shakeAnim] = useState(new Animated.Value(0));

    // Intruder detection
    const [failedAttempts, setFailedAttempts] = useState(0);
    const intruderRef = useRef<IntruderCaptureRef>(null);

    useEffect(() => {
        if (isAuthenticated) {
            router.replace('/(tabs)');
        }
    }, [isAuthenticated]);

    useEffect(() => {
        // Auto-prompt biometrics on load (only on native platforms)
        if (biometricsEnabled && Platform.OS !== 'web' && !authLoading) {
            setTimeout(() => {
                handleBiometricUnlock();
            }, 500);
        }
    }, [biometricsEnabled, authLoading]);

    const shake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const handleBiometricUnlock = async () => {
        setIsLoading(true);
        setError('');
        try {
            const success = await unlockWithBiometrics();
            if (!success) {
                setError('Biometric unlock failed');
                // Optional: count biometric failures too?
            } else {
                setFailedAttempts(0);
            }
        } catch (e) {
            setError('Biometric unlock failed');
        }
        setIsLoading(false);
    };

    const handlePasswordUnlock = async () => {
        if (!password.trim()) {
            setError('Please enter your password');
            shake();
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            const success = await unlockWithPassword(password);
            if (!success) {
                setError('Incorrect password');
                setPassword('');
                shake();

                // Intruder logic
                const newCount = failedAttempts + 1;
                setFailedAttempts(newCount);
                if (newCount >= 3) {
                    // Silently capture intruder
                    intruderRef.current?.capture();
                }
            } else {
                setFailedAttempts(0);
            }
        } catch (e) {
            setError('Failed to unlock');
            shake();
        }
        setIsLoading(false);
    };

    const showBiometrics = biometricsEnabled && Platform.OS !== 'web';

    return (
        <View style={styles.container}>
            {/* Hidden Camera for Intruder Detection */}
            <IntruderCapture ref={intruderRef} />

            <View style={styles.iconContainer}>
                <Ionicons name="lock-closed" size={80} color={COLORS.primary} />
            </View>

            <Text style={styles.title}>Unlock Vault</Text>

            {showBiometrics && (
                <TouchableOpacity
                    style={styles.biometricButton}
                    onPress={handleBiometricUnlock}
                    disabled={isLoading}
                    activeOpacity={0.7}
                >
                    <Ionicons name="finger-print" size={48} color={COLORS.primary} />
                    <Text style={styles.biometricText}>Tap to unlock with biometrics</Text>
                </TouchableOpacity>
            )}

            <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or use password</Text>
                <View style={styles.dividerLine} />
            </View>

            <Animated.View style={[styles.inputContainer, { transform: [{ translateX: shakeAnim }] }]}>
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
                    onSubmitEditing={handlePasswordUnlock}
                    returnKeyType="go"
                    editable={!isLoading}
                />
                <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                >
                    <Ionicons
                        name={showPassword ? "eye-off" : "eye"}
                        size={22}
                        color={COLORS.textSecondary}
                    />
                </TouchableOpacity>
            </Animated.View>

            {error ? (
                <View style={styles.errorContainer}>
                    <Ionicons name="warning" size={16} color={COLORS.danger} />
                    <Text style={styles.error}>{error}</Text>
                </View>
            ) : null}

            <TouchableOpacity
                style={[
                    styles.primaryButton,
                    (!password.trim() || isLoading) && styles.buttonDisabled
                ]}
                onPress={handlePasswordUnlock}
                disabled={!password.trim() || isLoading}
                activeOpacity={0.8}
            >
                {isLoading ? (
                    <ActivityIndicator color="#FFF" size="small" />
                ) : (
                    <View style={styles.buttonContent}>
                        <Ionicons name="log-in-outline" size={20} color="#FFF" />
                        <Text style={styles.primaryButtonText}>Unlock</Text>
                    </View>
                )}
            </TouchableOpacity>

            <Text style={styles.hint}>
                Forgot your password? Unfortunately, it cannot be recovered.
            </Text>
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
        marginBottom: SPACING.xl,
    },
    biometricButton: {
        alignItems: 'center',
        padding: SPACING.xl,
        backgroundColor: COLORS.card,
        borderRadius: BORDER_RADIUS.l,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: SPACING.l,
    },
    biometricText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: SPACING.m,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: SPACING.l,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.border,
    },
    dividerText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        paddingHorizontal: SPACING.m,
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
    hint: {
        fontSize: 12,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: SPACING.xl,
    },
});

