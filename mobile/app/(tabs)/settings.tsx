import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { OfflineStatusBar } from '@/components/OfflineStatusBar';

interface SettingItemProps {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    danger?: boolean;
    rightContent?: React.ReactNode;
}

function SettingItem({ icon, title, subtitle, onPress, danger, rightContent }: SettingItemProps) {
    return (
        <TouchableOpacity style={styles.settingItem} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.iconContainer, danger && { backgroundColor: `${COLORS.danger}20` }]}>
                <Ionicons name={icon as any} size={22} color={danger ? COLORS.danger : COLORS.primary} />
            </View>
            <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, danger && { color: COLORS.danger }]}>{title}</Text>
                {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
            </View>
            {rightContent || <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />}
        </TouchableOpacity>
    );
}

export default function SettingsScreen() {
    const { logout, biometricsEnabled, enableBiometrics } = useAuthStore();
    const { pendingCount } = useOfflineStatus();

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Offline Status */}
            <OfflineStatusBar />

            {/* Account Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account</Text>
                <View style={styles.card}>
                    <View style={styles.profileRow}>
                        <View style={styles.avatar}>
                            <Ionicons name="person" size={28} color={COLORS.primary} />
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>Local Vault</Text>
                            <Text style={styles.profileEmail}>Encrypted on this device</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Security Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Security</Text>
                <View style={styles.card}>
                    <SettingItem
                        icon="finger-print"
                        title="Biometric Unlock"
                        subtitle={biometricsEnabled ? 'Enabled' : 'Tap to enable'}
                        onPress={() => !biometricsEnabled && enableBiometrics()}
                        rightContent={
                            <View style={[styles.badge, biometricsEnabled && styles.badgeActive]}>
                                <Text style={[styles.badgeText, biometricsEnabled && styles.badgeTextActive]}>
                                    {biometricsEnabled ? 'On' : 'Off'}
                                </Text>
                            </View>
                        }
                    />
                    <SettingItem
                        icon="timer-outline"
                        title="Auto-Lock"
                        subtitle="Lock after 5 minutes"
                        onPress={() => { }}
                    />
                    <SettingItem
                        icon="warning-outline"
                        title="Intruder Alerts"
                        subtitle="View unauthorized access attempts"
                        onPress={() => router.push('/settings/intruders')}
                        danger={false} // Maybe make it danger if there are unread? Too complex for now
                    />
                    <SettingItem
                        icon="key"
                        title="Autofill"
                        subtitle="Fill passwords in apps"
                        onPress={() => router.push('/settings/autofill')}
                    />
                </View>
            </View>

            {/* Data Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Data</Text>
                <View style={styles.card}>
                    <SettingItem
                        icon="cloud-upload-outline"
                        title="Export Vault"
                        subtitle="Encrypted backup"
                        onPress={() => { }}
                    />
                    <SettingItem
                        icon="cloud-download-outline"
                        title="Import Data"
                        subtitle="From other managers"
                        onPress={() => { }}
                    />
                    {pendingCount > 0 && (
                        <SettingItem
                            icon="sync-outline"
                            title="Sync Queue"
                            subtitle={`${pendingCount} pending`}
                            onPress={() => { }}
                            rightContent={
                                <View style={styles.pendingBadge}>
                                    <Text style={styles.pendingText}>{pendingCount}</Text>
                                </View>
                            }
                        />
                    )}
                </View>
            </View>

            {/* Emergency Access */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Emergency</Text>
                <View style={styles.card}>
                    <SettingItem
                        icon="people-outline"
                        title="Emergency Access"
                        subtitle="Set trusted contacts"
                        onPress={() => { }}
                    />
                </View>
            </View>

            {/* About Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>
                <View style={styles.card}>
                    <SettingItem
                        icon="document-text-outline"
                        title="Documentation"
                        subtitle="View app guide"
                        onPress={() => { }}
                    />
                    <SettingItem
                        icon="information-circle-outline"
                        title="Version"
                        subtitle="1.0.0 (Build 1)"
                        onPress={() => { }}
                        rightContent={null}
                    />
                </View>
            </View>

            {/* Danger Zone */}
            <View style={styles.section}>
                <View style={styles.card}>
                    <SettingItem
                        icon="log-out-outline"
                        title="Lock Vault"
                        onPress={logout}
                        danger
                    />
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>SecureVault</Text>
                <Text style={styles.footerSubtext}>Zero-Knowledge Encryption</Text>
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
        paddingTop: 60,
        paddingBottom: 100,
    },
    section: {
        marginBottom: SPACING.l,
    },
    sectionTitle: {
        ...TYPOGRAPHY.label,
        textTransform: 'uppercase',
        marginHorizontal: SPACING.l,
        marginBottom: SPACING.s,
    } as any,
    card: {
        marginHorizontal: SPACING.l,
        backgroundColor: COLORS.card,
        borderRadius: BORDER_RADIUS.m,
        overflow: 'hidden',
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
        gap: SPACING.m,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: `${COLORS.primary}20`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        ...TYPOGRAPHY.h3,
    } as any,
    profileEmail: {
        ...TYPOGRAPHY.small,
        color: COLORS.textSecondary,
    } as any,
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
        gap: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: `${COLORS.primary}20`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        ...TYPOGRAPHY.body,
        fontWeight: '500',
    } as any,
    settingSubtitle: {
        ...TYPOGRAPHY.small,
        color: COLORS.textSecondary,
        marginTop: 2,
    } as any,
    badge: {
        paddingHorizontal: SPACING.s,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: COLORS.surface,
    },
    badgeActive: {
        backgroundColor: `${COLORS.success}20`,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    badgeTextActive: {
        color: COLORS.success,
    },
    pendingBadge: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    pendingText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
    },
    footer: {
        alignItems: 'center',
        marginTop: SPACING.xl,
        marginBottom: SPACING.xl,
    },
    footerText: {
        ...TYPOGRAPHY.body,
        color: COLORS.textSecondary,
    } as any,
    footerSubtext: {
        ...TYPOGRAPHY.small,
        color: COLORS.textSecondary,
        opacity: 0.6,
    } as any,
});
