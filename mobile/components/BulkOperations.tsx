import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/theme';
import { useSlideAnimation } from '@/hooks/useAnimations';

interface BulkOperationsProps<T> {
    items: T[];
    selectedIds: Set<string>;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    onDelete: (ids: string[]) => void;
    onMove?: (ids: string[], folderId: string) => void;
    onFavorite: (ids: string[], favorite: boolean) => void;
    onCancel: () => void;
    getItemId: (item: T) => string;
}

export function BulkOperationsBar<T>({
    items,
    selectedIds,
    onSelectAll,
    onDeselectAll,
    onDelete,
    onMove,
    onFavorite,
    onCancel,
    getItemId,
}: BulkOperationsProps<T>) {
    const isVisible = selectedIds.size > 0;
    const { transform, opacity } = useSlideAnimation(isVisible, 'up', 60, 200);

    const handleDelete = useCallback(() => {
        Alert.alert(
            'Delete Items',
            `Are you sure you want to delete ${selectedIds.size} item(s)?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => onDelete(Array.from(selectedIds))
                },
            ]
        );
    }, [selectedIds, onDelete]);

    const handleFavorite = useCallback(() => {
        onFavorite(Array.from(selectedIds), true);
    }, [selectedIds, onFavorite]);

    const handleUnfavorite = useCallback(() => {
        onFavorite(Array.from(selectedIds), false);
    }, [selectedIds, onFavorite]);

    if (!isVisible) return null;

    return (
        <Animated.View style={[styles.container, { transform, opacity }]}>
            <View style={styles.left}>
                <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
                    <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.countText}>{selectedIds.size} selected</Text>
            </View>

            <View style={styles.actions}>
                {selectedIds.size < items.length ? (
                    <TouchableOpacity style={styles.actionButton} onPress={onSelectAll}>
                        <Ionicons name="checkbox-outline" size={20} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.actionButton} onPress={onDeselectAll}>
                        <Ionicons name="square-outline" size={20} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.actionButton} onPress={handleFavorite}>
                    <Ionicons name="star-outline" size={20} color={COLORS.primary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={handleUnfavorite}>
                    <Ionicons name="star" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>

                {onMove && (
                    <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="folder-outline" size={20} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete}>
                    <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

interface SelectableItemProps {
    selected: boolean;
    selectionMode: boolean;
    onSelect: () => void;
    onLongPress: () => void;
    children: React.ReactNode;
}

export function SelectableItem({
    selected,
    selectionMode,
    onSelect,
    onLongPress,
    children
}: SelectableItemProps) {
    return (
        <TouchableOpacity
            onPress={selectionMode ? onSelect : undefined}
            onLongPress={onLongPress}
            delayLongPress={500}
            style={[styles.selectableItem, selected && styles.selectedItem]}
        >
            {selectionMode && (
                <View style={styles.checkbox}>
                    <Ionicons
                        name={selected ? 'checkbox' : 'square-outline'}
                        size={24}
                        color={selected ? COLORS.primary : COLORS.textSecondary}
                    />
                </View>
            )}
            <View style={styles.itemContent}>{children}</View>
        </TouchableOpacity>
    );
}

/**
 * Hook for managing bulk selection state
 */
export function useBulkSelection<T>(items: T[], getItemId: (item: T) => string) {
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const toggleSelection = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
                if (next.size === 0) setSelectionMode(false);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const selectAll = useCallback(() => {
        setSelectedIds(new Set(items.map(getItemId)));
    }, [items, getItemId]);

    const deselectAll = useCallback(() => {
        setSelectedIds(new Set());
        setSelectionMode(false);
    }, []);

    const enterSelectionMode = useCallback((firstId: string) => {
        setSelectionMode(true);
        setSelectedIds(new Set([firstId]));
    }, []);

    const cancelSelection = useCallback(() => {
        setSelectionMode(false);
        setSelectedIds(new Set());
    }, []);

    return {
        selectionMode,
        selectedIds,
        toggleSelection,
        selectAll,
        deselectAll,
        enterSelectionMode,
        cancelSelection,
    };
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.m,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.m,
    },
    closeButton: {
        padding: SPACING.xs,
    },
    countText: {
        ...TYPOGRAPHY.h3,
        fontSize: 16,
    } as any,
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.s,
    },
    actionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    deleteButton: {
        backgroundColor: `${COLORS.danger}20`,
    },
    selectableItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectedItem: {
        backgroundColor: `${COLORS.primary}10`,
    },
    checkbox: {
        marginRight: SPACING.m,
    },
    itemContent: {
        flex: 1,
    },
});
