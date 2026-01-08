import { View, Text, Switch, TouchableOpacity, StyleSheet, ScrollView, Modal, Pressable } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore, AutoLockTime } from '@/store/settingsStore';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

const AUTO_LOCK_OPTIONS: { label: string; value: AutoLockTime }[] = [
    { label: '30 seconds', value: '30s' },
    { label: '1 minute', value: '1m' },
    { label: '5 minutes', value: '5m' },
    { label: '10 minutes', value: '10m' },
    { label: 'Never', value: 'never' },
];

export default function SettingsScreen() {
    const { logout, biometricsEnabled, enableBiometrics } = useAuthStore();
    const { autoLockTime, setAutoLockTime, screenshotProtection, setScreenshotProtection, emailAlerts, setEmailAlerts, biometricReprompt, setBiometricReprompt } = useSettingsStore();
    const [showAutoLockModal, setShowAutoLockModal] = useState(false);
    const [localBioState, setLocalBioState] = useState(biometricsEnabled);

    const toggleBiometrics = async (value: boolean) => {
        if (value) {
            const success = await enableBiometrics();
            if (success) setLocalBioState(true);
        } else {
            setLocalBioState(false);
        }
    };

    const getAutoLockLabel = () => {
        const option = AUTO_LOCK_OPTIONS.find(o => o.value === autoLockTime);
        return option?.label || '1 minute';
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Settings</Text>
            </View>

            {/* Security Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Security</Text>

                <View style={styles.row}>
                    <View style={styles.rowContent}>
                        <Ionicons name="finger-print" size={24} color={COLORS.primary} />
                        <Text style={styles.rowLabel}>Biometric Unlock</Text>
                    </View>
                    <Switch
                        value={localBioState}
                        onValueChange={toggleBiometrics}
                        trackColor={{ false: COLORS.border, true: COLORS.primary }}
                        thumbColor="#FFF"
                    />
                </View>

                <TouchableOpacity style={styles.row} onPress={() => setShowAutoLockModal(true)}>
                    <View style={styles.rowContent}>
                        <Ionicons name="timer-outline" size={24} color={COLORS.textPrimary} />
                        <Text style={styles.rowLabel}>Auto-Lock Timer</Text>
                    </View>
                    <View style={styles.rowRight}>
                        <Text style={styles.rowValue}>{getAutoLockLabel()}</Text>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                    </View>
                </TouchableOpacity>

                <View style={styles.row}>
                    <View style={styles.rowContent}>
                        <Ionicons name="eye-off-outline" size={24} color={COLORS.textPrimary} />
                        <Text style={styles.rowLabel}>Screenshot Protection</Text>
                    </View>
                    <Switch
                        value={screenshotProtection}
                        onValueChange={setScreenshotProtection}
                        trackColor={{ false: COLORS.border, true: COLORS.primary }}
                        thumbColor="#FFF"
                    />
                </View>

                <View style={styles.row}>
                    <View style={styles.rowContent}>
                        <Ionicons name="hand-left-outline" size={24} color={COLORS.textPrimary} />
                        <Text style={styles.rowLabel}>Biometric Re-prompt</Text>
                    </View>
                    <Switch
                        value={biometricReprompt}
                        onValueChange={setBiometricReprompt}
                        trackColor={{ false: COLORS.border, true: COLORS.primary }}
                        thumbColor="#FFF"
                    />
                </View>

                <TouchableOpacity style={styles.row}>
                    <View style={styles.rowContent}>
                        <Ionicons name="people-outline" size={24} color={COLORS.textPrimary} />
                        <Text style={styles.rowLabel}>Emergency Access</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Data Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Data</Text>

                <TouchableOpacity style={styles.row}>
                    <View style={styles.rowContent}>
                        <Ionicons name="download-outline" size={24} color={COLORS.textPrimary} />
                        <Text style={styles.rowLabel}>Export Vault</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.row}>
                    <View style={styles.rowContent}>
                        <Ionicons name="folder-outline" size={24} color={COLORS.textPrimary} />
                        <Text style={styles.rowLabel}>Manage Folders</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Notifications Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notifications</Text>

                <View style={styles.row}>
                    <View style={styles.rowContent}>
                        <Ionicons name="mail-outline" size={24} color={COLORS.textPrimary} />
                        <Text style={styles.rowLabel}>Email Alerts</Text>
                    </View>
                    <Switch
                        value={emailAlerts}
                        onValueChange={setEmailAlerts}
                        trackColor={{ false: COLORS.border, true: COLORS.primary }}
                        thumbColor="#FFF"
                    />
                </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>

            <Text style={styles.version}>v1.0.0 (Build 42)</Text>

            {/* Auto-Lock Modal */}
            <Modal visible={showAutoLockModal} transparent animationType="fade">
                <Pressable style={styles.modalOverlay} onPress={() => setShowAutoLockModal(false)}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Auto-Lock Timer</Text>
                        {AUTO_LOCK_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={styles.modalOption}
                                onPress={() => {
                                    setAutoLockTime(option.value);
                                    setShowAutoLockModal(false);
                                }}
                            >
                                <Text style={[
                                    styles.modalOptionText,
                                    autoLockTime === option.value && styles.modalOptionSelected
                                ]}>
                                    {option.label}
                                </Text>
                                {autoLockTime === option.value && (
                                    <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </Pressable>
            </Modal>
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
        paddingTop: 60,
    },
    header: {
        marginBottom: SPACING.xl,
    },
    headerTitle: {
        ...TYPOGRAPHY.h1,
    } as any,
    userEmail: {
        ...TYPOGRAPHY.body,
        color: COLORS.textSecondary,
        marginTop: SPACING.s,
    } as any,
    section: {
        backgroundColor: COLORS.card,
        borderRadius: BORDER_RADIUS.l,
        padding: SPACING.m,
        marginBottom: SPACING.l,
    },
    sectionTitle: {
        ...TYPOGRAPHY.label,
        marginBottom: SPACING.m,
        marginLeft: SPACING.s,
        textTransform: 'uppercase',
    } as any,
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    rowContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.m,
    },
    rowRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.s,
    },
    rowLabel: {
        ...TYPOGRAPHY.body,
    } as any,
    rowValue: {
        ...TYPOGRAPHY.body,
        color: COLORS.textSecondary,
    } as any,
    logoutButton: {
        marginTop: SPACING.l,
        backgroundColor: COLORS.card,
        padding: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.danger,
    },
    logoutText: {
        color: COLORS.danger,
        fontSize: 16,
        fontWeight: 'bold',
    },
    version: {
        textAlign: 'center',
        color: COLORS.textSecondary,
        marginTop: SPACING.xl,
        fontSize: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: COLORS.card,
        borderRadius: BORDER_RADIUS.l,
        padding: SPACING.l,
        width: '80%',
        maxWidth: 320,
    },
    modalTitle: {
        ...TYPOGRAPHY.h3,
        marginBottom: SPACING.l,
        textAlign: 'center',
    } as any,
    modalOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalOptionText: {
        ...TYPOGRAPHY.body,
    } as any,
    modalOptionSelected: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
});

