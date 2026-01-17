import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useIntruderStore, IntruderAlert } from '@/store/intruderStore';

export default function IntruderAlertsScreen() {
    const { intruders, loadIntruders, deleteIntruder, clearIntruders } = useIntruderStore();

    useEffect(() => {
        loadIntruders();
    }, []);

    const handleDelete = (id: string) => {
        Alert.alert(
            "Delete Record",
            "Are you sure you want to delete this intruder alert?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => deleteIntruder(id) }
            ]
        );
    };

    const handleClearAll = () => {
        Alert.alert(
            "Clear All",
            "Are you sure you want to delete all intruder alerts?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Clear", style: "destructive", onPress: () => clearIntruders() }
            ]
        );
    };

    const renderItem = ({ item }: { item: IntruderAlert }) => (
        <View style={styles.card}>
            <Image source={{ uri: item.imageUri }} style={styles.image} />
            <View style={styles.info}>
                <Text style={styles.date}>
                    {new Date(item.timestamp).toLocaleDateString()}
                </Text>
                <Text style={styles.time}>
                    {new Date(item.timestamp).toLocaleTimeString()}
                </Text>
                <Text style={styles.label}>Unauthorized Attempt</Text>
            </View>
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id)}
            >
                <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Intruder Alerts',
                    headerStyle: { backgroundColor: COLORS.background },
                    headerTintColor: COLORS.textPrimary,
                    headerRight: () => intruders.length > 0 ? (
                        <TouchableOpacity onPress={handleClearAll}>
                            <Text style={styles.clearText}>Clear All</Text>
                        </TouchableOpacity>
                    ) : null
                }}
            />

            {intruders.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIcon}>
                        <Ionicons name="shield-checkmark-outline" size={64} color={COLORS.success} />
                    </View>
                    <Text style={styles.emptyTitle}>No Intruders Detected</Text>
                    <Text style={styles.emptyText}>
                        Your vault is secure. Any failed unlock attempts (&gt;3) will be recorded here.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={intruders}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    list: {
        padding: SPACING.m,
        gap: SPACING.m,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: COLORS.card,
        borderRadius: BORDER_RADIUS.m,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
        height: 100,
    },
    image: {
        width: 100,
        height: '100%',
        backgroundColor: '#000',
    },
    info: {
        flex: 1,
        padding: SPACING.m,
        justifyContent: 'center',
    },
    date: {
        ...TYPOGRAPHY.h4,
        color: COLORS.textPrimary,
    } as any,
    time: {
        ...TYPOGRAPHY.small,
        color: COLORS.textSecondary,
    } as any,
    label: {
        ...TYPOGRAPHY.small,
        color: COLORS.danger,
        marginTop: SPACING.s,
        fontWeight: 'bold',
    } as any,
    deleteButton: {
        padding: SPACING.m,
        justifyContent: 'center',
        alignItems: 'center',
    },
    clearText: {
        color: COLORS.danger,
        fontSize: 16,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.xl,
    },
    emptyIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: `${COLORS.success}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.l,
    },
    emptyTitle: {
        ...TYPOGRAPHY.h2,
        color: COLORS.textPrimary,
        marginBottom: SPACING.m,
    } as any,
    emptyText: {
        ...TYPOGRAPHY.body,
        color: COLORS.textSecondary,
        textAlign: 'center',
    } as any,
});
