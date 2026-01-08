import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '@/theme';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';

interface OfflineStatusBarProps {
    compact?: boolean;
}

export function OfflineStatusBar({ compact = false }: OfflineStatusBarProps) {
    const { isOnline, pendingCount, refresh, processQueue } = useOfflineStatus();

    if (isOnline && pendingCount === 0) {
        return null; // Don't show when fully synced
    }

    if (compact) {
        return (
            <View style={styles.compactContainer}>
                <View style={[styles.dot, isOnline ? styles.dotOnline : styles.dotOffline]} />
                {pendingCount > 0 && (
                    <Text style={styles.compactText}>{pendingCount}</Text>
                )}
            </View>
        );
    }

    return (
        <View style={[styles.container, !isOnline && styles.containerOffline]}>
            <View style={styles.content}>
                <Ionicons
                    name={isOnline ? 'cloud-outline' : 'cloud-offline-outline'}
                    size={20}
                    color={isOnline ? COLORS.success : COLORS.danger}
                />
                <View style={styles.textContainer}>
                    <Text style={styles.title}>
                        {isOnline ? 'Online' : 'Offline'}
                    </Text>
                    {pendingCount > 0 && (
                        <Text style={styles.subtitle}>
                            {pendingCount} pending change{pendingCount !== 1 ? 's' : ''}
                        </Text>
                    )}
                </View>
            </View>

            {pendingCount > 0 && isOnline && (
                <TouchableOpacity style={styles.syncButton} onPress={processQueue}>
                    <Ionicons name="sync" size={18} color={COLORS.primary} />
                    <Text style={styles.syncText}>Sync Now</Text>
                </TouchableOpacity>
            )}

            {!isOnline && (
                <TouchableOpacity style={styles.retryButton} onPress={refresh}>
                    <Ionicons name="refresh" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
            )}
        </View>
    );
}

// Sync status indicator for item cards
export function SyncStatusBadge({ status }: { status: 'synced' | 'pending' | 'error' }) {
    if (status === 'synced') return null;

    const config = {
        pending: { icon: 'time-outline' as const, color: COLORS.primary, label: 'Pending' },
        error: { icon: 'alert-circle-outline' as const, color: COLORS.danger, label: 'Error' },
    };

    const { icon, color, label } = config[status];

    return (
        <View style={[styles.badge, { backgroundColor: `${color}20` }]}>
            <Ionicons name={icon} size={12} color={color} />
            <Text style={[styles.badgeText, { color }]}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.card,
        padding: SPACING.m,
        marginHorizontal: SPACING.l,
        marginBottom: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    containerOffline: {
        borderColor: COLORS.danger,
        backgroundColor: `${COLORS.danger}10`,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.m,
    },
    textContainer: {
        gap: 2,
    },
    title: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: '600',
    },
    subtitle: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    syncButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        padding: SPACING.s,
        backgroundColor: `${COLORS.primary}20`,
        borderRadius: BORDER_RADIUS.s,
    },
    syncText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '600',
    },
    retryButton: {
        padding: SPACING.s,
    },
    compactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    dotOnline: {
        backgroundColor: COLORS.success,
    },
    dotOffline: {
        backgroundColor: COLORS.danger,
    },
    compactText: {
        color: COLORS.textSecondary,
        fontSize: 10,
        fontWeight: '600',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '600',
    },
});
