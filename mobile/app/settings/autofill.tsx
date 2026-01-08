import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/theme';
import { autofillService } from '@/services/autofillService';

export default function AutofillSettingsScreen() {
    const [settings, setSettings] = useState({
        enabled: false,
        matchByDomain: true,
        saveNewCredentials: true,
        showNotifications: true,
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const loaded = await autofillService.getSettings();
        setSettings(loaded);
    };

    const updateSetting = async (key: string, value: boolean) => {
        const updated = { ...settings, [key]: value };
        setSettings(updated);
        await autofillService.updateSettings({ [key]: value });
    };

    const openAutofillSettings = () => {
        if (Platform.OS === 'android') {
            // Open Android autofill settings
            Linking.openSettings();
        } else {
            Alert.alert(
                'iOS Autofill',
                'To enable autofill on iOS:\n\n1. Open Settings\n2. Go to Passwords\n3. Enable AutoFill Passwords\n4. Select SecureVault',
                [{ text: 'OK' }]
            );
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Ionicons name="key" size={40} color={COLORS.primary} />
                </View>
                <Text style={styles.title}>Autofill</Text>
                <Text style={styles.subtitle}>
                    Automatically fill passwords in browsers and apps
                </Text>
            </View>

            {/* Enable Autofill */}
            <View style={styles.section}>
                <View style={styles.mainToggle}>
                    <View style={styles.toggleContent}>
                        <Ionicons name="flash" size={24} color={settings.enabled ? COLORS.primary : COLORS.textSecondary} />
                        <View style={styles.toggleText}>
                            <Text style={styles.toggleTitle}>Enable Autofill</Text>
                            <Text style={styles.toggleSubtitle}>
                                Fill passwords automatically
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={settings.enabled}
                        onValueChange={(v) => updateSetting('enabled', v)}
                        trackColor={{ false: COLORS.border, true: COLORS.primary }}
                        thumbColor="#FFF"
                    />
                </View>

                <TouchableOpacity style={styles.setupButton} onPress={openAutofillSettings}>
                    <Ionicons name="settings-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.setupButtonText}>Open System Autofill Settings</Text>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Matching Options */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Matching</Text>

                <View style={styles.setting}>
                    <View style={styles.settingContent}>
                        <Text style={styles.settingTitle}>Match by Domain</Text>
                        <Text style={styles.settingSubtitle}>
                            e.g., accounts.google.com matches google.com
                        </Text>
                    </View>
                    <Switch
                        value={settings.matchByDomain}
                        onValueChange={(v) => updateSetting('matchByDomain', v)}
                        trackColor={{ false: COLORS.border, true: COLORS.primary }}
                        thumbColor="#FFF"
                        disabled={!settings.enabled}
                    />
                </View>
            </View>

            {/* Behavior Options */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Behavior</Text>

                <View style={styles.setting}>
                    <View style={styles.settingContent}>
                        <Text style={styles.settingTitle}>Save New Credentials</Text>
                        <Text style={styles.settingSubtitle}>
                            Prompt to save when you log in manually
                        </Text>
                    </View>
                    <Switch
                        value={settings.saveNewCredentials}
                        onValueChange={(v) => updateSetting('saveNewCredentials', v)}
                        trackColor={{ false: COLORS.border, true: COLORS.primary }}
                        thumbColor="#FFF"
                        disabled={!settings.enabled}
                    />
                </View>

                <View style={styles.setting}>
                    <View style={styles.settingContent}>
                        <Text style={styles.settingTitle}>Show Notifications</Text>
                        <Text style={styles.settingSubtitle}>
                            Notify when credentials are autofilled
                        </Text>
                    </View>
                    <Switch
                        value={settings.showNotifications}
                        onValueChange={(v) => updateSetting('showNotifications', v)}
                        trackColor={{ false: COLORS.border, true: COLORS.primary }}
                        thumbColor="#FFF"
                        disabled={!settings.enabled}
                    />
                </View>
            </View>

            {/* Info */}
            <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color={COLORS.textSecondary} />
                <Text style={styles.infoText}>
                    Autofill requires biometric authentication each time to ensure your passwords remain secure.
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
    header: {
        alignItems: 'center',
        padding: SPACING.xl,
        paddingTop: SPACING.xl * 2,
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
        ...TYPOGRAPHY.h1,
        marginBottom: SPACING.s,
    } as any,
    subtitle: {
        ...TYPOGRAPHY.body,
        color: COLORS.textSecondary,
        textAlign: 'center',
    } as any,
    section: {
        marginHorizontal: SPACING.l,
        marginBottom: SPACING.l,
        backgroundColor: COLORS.card,
        borderRadius: BORDER_RADIUS.m,
        overflow: 'hidden',
    },
    sectionTitle: {
        ...TYPOGRAPHY.label,
        textTransform: 'uppercase',
        padding: SPACING.m,
        paddingBottom: 0,
    } as any,
    mainToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    toggleContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.m,
        flex: 1,
    },
    toggleText: {
        flex: 1,
    },
    toggleTitle: {
        ...TYPOGRAPHY.body,
        fontWeight: '600',
    } as any,
    toggleSubtitle: {
        ...TYPOGRAPHY.small,
        color: COLORS.textSecondary,
    } as any,
    setupButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
        gap: SPACING.m,
    },
    setupButtonText: {
        flex: 1,
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    setting: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    settingContent: {
        flex: 1,
        marginRight: SPACING.m,
    },
    settingTitle: {
        ...TYPOGRAPHY.body,
    } as any,
    settingSubtitle: {
        ...TYPOGRAPHY.small,
        color: COLORS.textSecondary,
        marginTop: 2,
    } as any,
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginHorizontal: SPACING.l,
        marginBottom: SPACING.xl,
        padding: SPACING.m,
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.m,
        gap: SPACING.s,
    },
    infoText: {
        flex: 1,
        ...TYPOGRAPHY.small,
        color: COLORS.textSecondary,
    } as any,
});
