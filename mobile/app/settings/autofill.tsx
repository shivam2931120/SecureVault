import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Linking, Alert } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import * as IntentLauncher from 'expo-intent-launcher';

export default function AutofillSettingsScreen() {
    const [isAndroid, setIsAndroid] = useState(Platform.OS === 'android');

    const openAutofillSettings = async () => {
        if (Platform.OS === 'android') {
            try {
                // Initial attempt: try to open specific autofill settings
                await IntentLauncher.startActivityAsync('android.settings.REQUEST_SET_AUTOFILL_SERVICE');
            } catch (e) {
                try {
                    // Fallback to general input settings
                    await IntentLauncher.startActivityAsync('android.settings.INPUT_METHOD_SETTINGS');
                } catch (e2) {
                    Alert.alert("Error", "Could not open Autofill settings directly. Please navigate to Settings -> Passwords & Accounts -> Autofill Service manually.");
                }
            }
        } else {
            // iOS instructions or linking
            Linking.openSettings();
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Ionicons name="key" size={48} color={COLORS.primary} />
                </View>
                <Text style={styles.title}>Native Autofill</Text>
                <Text style={styles.subtitle}>
                    Access your passwords directly in other apps like Chrome, Instagram, and more.
                </Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>How it works</Text>
                <View style={styles.step}>
                    <View style={styles.stepNumber}><Text style={styles.stepText}>1</Text></View>
                    <Text style={styles.stepDescription}>Enable SecureVault as your Autofill Service in system settings.</Text>
                </View>
                <View style={styles.step}>
                    <View style={styles.stepNumber}><Text style={styles.stepText}>2</Text></View>
                    <Text style={styles.stepDescription}>When you tap a password field in another app, tap "Unlock SecureVault".</Text>
                </View>
                <View style={styles.step}>
                    <View style={styles.stepNumber}><Text style={styles.stepText}>3</Text></View>
                    <Text style={styles.stepDescription}>Copy your password and it will work like magic!</Text>
                </View>

                <TouchableOpacity
                    style={styles.enableButton}
                    onPress={openAutofillSettings}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>Open Autofill Settings</Text>
                    <Ionicons name="open-outline" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
                <Ionicons name="information-circle-outline" size={24} color={COLORS.textSecondary} />
                <Text style={styles.infoText}>
                    Note: For security, SecureVault requires you to unlock the app before accessing your credentials. This ensures your data remains encrypted at rest.
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        padding: SPACING.l,
    },
    header: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: `${COLORS.primary}20`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.m,
    },
    title: {
        ...TYPOGRAPHY.h2,
        color: COLORS.textPrimary,
        marginBottom: SPACING.s,
    } as any,
    subtitle: {
        ...TYPOGRAPHY.body,
        color: COLORS.textSecondary,
        textAlign: 'center',
        paddingHorizontal: SPACING.l,
    } as any,
    card: {
        backgroundColor: COLORS.card,
        borderRadius: BORDER_RADIUS.m,
        padding: SPACING.l,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: SPACING.l,
    },
    cardTitle: {
        ...TYPOGRAPHY.h3,
        color: COLORS.textPrimary,
        marginBottom: SPACING.l,
    } as any,
    step: {
        flexDirection: 'row',
        marginBottom: SPACING.l,
        gap: SPACING.m,
    },
    stepNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    stepDescription: {
        flex: 1,
        ...TYPOGRAPHY.body,
        color: COLORS.textSecondary,
    } as any,
    enableButton: {
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.s,
        padding: SPACING.m,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.s,
        marginTop: SPACING.s,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: `${COLORS.surface}`,
        borderRadius: BORDER_RADIUS.m,
        padding: SPACING.m,
        gap: SPACING.m,
        alignItems: 'flex-start',
    },
    infoText: {
        flex: 1,
        ...TYPOGRAPHY.small,
        color: COLORS.textSecondary,
        lineHeight: 20,
    } as any,
});
