import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TextInput, TouchableOpacity, ScrollView, Modal, Pressable, Alert, Platform } from 'react-native';
import { useVaultStore } from '@/store/vaultStore';
import { useAuthStore } from '@/store/authStore';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/theme';
import { VaultItemType, ITEM_TYPE_META, DecryptedVaultItem } from '@/types/vault';
import { Ionicons } from '@expo/vector-icons';
import { secureCopy } from '@/utils/secureClipboard';

const FILTER_TYPES: (VaultItemType | 'all')[] = ['all', 'login', 'card', 'note', 'identity', 'apikey', 'wifi'];

export default function VaultScreen() {
    const {
        isLoading,
        fetchItems,
        getFilteredItems,
        searchQuery,
        setSearchQuery,
        filterType,
        setFilterType,
        showFavoritesOnly,
        setShowFavoritesOnly,
        toggleFavorite,
        deleteItem
    } = useVaultStore();
    const { userId, masterKey } = useAuthStore();

    const [selectedItem, setSelectedItem] = useState<DecryptedVaultItem | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const items = getFilteredItems();

    useEffect(() => {
        if (userId && masterKey) {
            fetchItems(userId, masterKey);
        }
    }, [userId, masterKey]);

    const onRefresh = () => {
        if (userId && masterKey) fetchItems(userId, masterKey);
    };

    const openItemDetail = (item: DecryptedVaultItem) => {
        setSelectedItem(item);
        setShowDetailModal(true);
        setCopiedField(null);
    };

    const closeModal = () => {
        setShowDetailModal(false);
        setSelectedItem(null);
        setCopiedField(null);
    };

    const handleCopy = async (value: string, fieldName: string) => {
        const success = await secureCopy(value);
        if (success) {
            setCopiedField(fieldName);
            setTimeout(() => setCopiedField(null), 2000);
        }
    };

    const handleDelete = () => {
        if (!selectedItem) return;

        const doDelete = async () => {
            try {
                await deleteItem(selectedItem.id, userId);
                closeModal();
            } catch (e) {
                if (Platform.OS === 'web') {
                    alert('Failed to delete item');
                } else {
                    Alert.alert('Error', 'Failed to delete item');
                }
            }
        };

        if (Platform.OS === 'web') {
            if (confirm('Delete this item? This cannot be undone.')) {
                doDelete();
            }
        } else {
            Alert.alert(
                'Delete Item',
                'Are you sure you want to delete this item? This cannot be undone.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: doDelete }
                ]
            );
        }
    };

    const getItemPreview = (item: DecryptedVaultItem): string => {
        switch (item.itemType) {
            case 'login':
                return item.decrypted?.username || item.decrypted?.url || 'No details';
            case 'card':
                const num = item.decrypted?.cardNumber || '';
                return num ? `•••• ${num.slice(-4)}` : 'No card number';
            case 'note':
                const body = item.decrypted?.body || '';
                return body.substring(0, 50) + (body.length > 50 ? '...' : '') || 'Empty note';
            case 'identity':
                return `${item.decrypted?.firstName || ''} ${item.decrypted?.lastName || ''}`.trim() || 'No name';
            case 'apikey':
                return item.decrypted?.service || 'No service';
            case 'wifi':
                return item.decrypted?.ssid || 'No SSID';
            default:
                return 'Item';
        }
    };

    const renderDetailField = (label: string, value: string | undefined, isSecret: boolean = false) => {
        if (!value) return null;
        const displayValue = isSecret ? '••••••••' : value;
        return (
            <View style={styles.detailField}>
                <Text style={styles.detailLabel}>{label}</Text>
                <View style={styles.detailValueRow}>
                    <Text style={styles.detailValue} numberOfLines={3}>{displayValue}</Text>
                    <TouchableOpacity
                        style={styles.copyButton}
                        onPress={() => handleCopy(value, label)}
                    >
                        <Ionicons
                            name={copiedField === label ? "checkmark" : "copy-outline"}
                            size={18}
                            color={copiedField === label ? '#00CC88' : COLORS.primary}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderItemDetails = () => {
        if (!selectedItem?.decrypted) return null;
        const data: any = selectedItem.decrypted; // Cast to any - switch provides runtime type safety

        switch (selectedItem.itemType) {
            case 'login':
                return (
                    <>
                        {renderDetailField('URL', data.url)}
                        {renderDetailField('Username', data.username)}
                        {renderDetailField('Password', data.password, true)}
                        {renderDetailField('TOTP Secret', data.totp, true)}
                        {renderDetailField('Notes', data.notes)}
                    </>
                );
            case 'card':
                return (
                    <>
                        {renderDetailField('Cardholder', data.cardholder)}
                        {renderDetailField('Card Number', data.cardNumber, true)}
                        {renderDetailField('Expiry', data.expiry)}
                        {renderDetailField('CVV', data.cvv, true)}
                        {renderDetailField('PIN', data.pin, true)}
                        {renderDetailField('Notes', data.notes)}
                    </>
                );
            case 'note':
                return (
                    <>
                        {renderDetailField('Content', data.body)}
                    </>
                );
            case 'identity':
                return (
                    <>
                        {renderDetailField('First Name', data.firstName)}
                        {renderDetailField('Last Name', data.lastName)}
                        {renderDetailField('Email', data.email)}
                        {renderDetailField('Phone', data.phone)}
                        {renderDetailField('Address', data.address)}
                        {renderDetailField('ID Number', data.idNumber, true)}
                        {renderDetailField('Notes', data.notes)}
                    </>
                );
            case 'apikey':
                return (
                    <>
                        {renderDetailField('Service', data.service)}
                        {renderDetailField('API Key', data.key, true)}
                        {renderDetailField('Expiry', data.expiry)}
                        {renderDetailField('Notes', data.notes)}
                    </>
                );
            case 'wifi':
                return (
                    <>
                        {renderDetailField('Network (SSID)', data.ssid)}
                        {renderDetailField('Password', data.password, true)}
                        {renderDetailField('Security', data.securityType)}
                        {renderDetailField('Notes', data.notes)}
                    </>
                );
            default:
                return null;
        }
    };

    const renderItem = ({ item }: { item: DecryptedVaultItem }) => {
        const meta = ITEM_TYPE_META[item.itemType];
        return (
            <TouchableOpacity style={styles.card} onPress={() => openItemDetail(item)}>
                <View style={[styles.iconContainer, { backgroundColor: `${meta.color}20` }]}>
                    <Ionicons name={meta.icon as any} size={24} color={meta.color} />
                </View>
                <View style={styles.content}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.subtitle}>{getItemPreview(item)}</Text>
                </View>
                <TouchableOpacity onPress={() => toggleFavorite(item.id)} style={styles.favoriteButton}>
                    <Ionicons
                        name={item.isFavorite ? "star" : "star-outline"}
                        size={20}
                        color={item.isFavorite ? COLORS.primary : COLORS.textSecondary}
                    />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    const selectedMeta = selectedItem ? ITEM_TYPE_META[selectedItem.itemType] : null;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Vault</Text>
                <TouchableOpacity
                    onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    style={[styles.favoritesButton, showFavoritesOnly && styles.favoritesButtonActive]}
                >
                    <Ionicons
                        name={showFavoritesOnly ? "star" : "star-outline"}
                        size={20}
                        color={showFavoritesOnly ? COLORS.primary : COLORS.textSecondary}
                    />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search vault..."
                    placeholderTextColor={COLORS.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                ) : null}
            </View>

            {/* Type Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
                {FILTER_TYPES.map((type) => {
                    const isActive = filterType === type;
                    const meta = type === 'all' ? { label: 'All', icon: 'apps-outline', color: COLORS.textPrimary } : ITEM_TYPE_META[type];
                    return (
                        <TouchableOpacity
                            key={type}
                            style={[styles.filterChip, isActive && { borderColor: meta.color, backgroundColor: `${meta.color}20` }]}
                            onPress={() => setFilterType(type)}
                        >
                            <Ionicons name={meta.icon as any} size={16} color={isActive ? meta.color : COLORS.textSecondary} />
                            <Text style={[styles.filterChipText, isActive && { color: meta.color }]}>{meta.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Items List */}
            <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="shield-outline" size={64} color={COLORS.border} />
                        <Text style={styles.emptyText}>
                            {searchQuery ? 'No items match your search' : 'Vault is empty'}
                        </Text>
                    </View>
                }
            />

            {/* Item Detail Modal */}
            <Modal
                visible={showDetailModal}
                animationType="slide"
                transparent={true}
                onRequestClose={closeModal}
            >
                <Pressable style={styles.modalOverlay} onPress={closeModal}>
                    <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
                        {selectedItem && selectedMeta && (
                            <>
                                {/* Modal Header */}
                                <View style={styles.modalHeader}>
                                    <View style={[styles.modalIcon, { backgroundColor: `${selectedMeta.color}20` }]}>
                                        <Ionicons name={selectedMeta.icon as any} size={28} color={selectedMeta.color} />
                                    </View>
                                    <View style={styles.modalTitleContainer}>
                                        <Text style={styles.modalTitle}>{selectedItem.title}</Text>
                                        <Text style={styles.modalType}>{selectedMeta.label}</Text>
                                    </View>
                                    <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                                        <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                                    </TouchableOpacity>
                                </View>

                                {/* Modal Body */}
                                <ScrollView style={styles.modalBody}>
                                    {renderItemDetails()}
                                </ScrollView>

                                {/* Modal Footer */}
                                <View style={styles.modalFooter}>
                                    <TouchableOpacity
                                        style={[styles.footerButton, styles.deleteButton]}
                                        onPress={handleDelete}
                                    >
                                        <Ionicons name="trash-outline" size={20} color="#FFF" />
                                        <Text style={styles.deleteButtonText}>Delete</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.footerButton, styles.favoriteBtn]}
                                        onPress={() => toggleFavorite(selectedItem.id)}
                                    >
                                        <Ionicons
                                            name={selectedItem.isFavorite ? "star" : "star-outline"}
                                            size={20}
                                            color={COLORS.primary}
                                        />
                                        <Text style={styles.favoriteBtnText}>
                                            {selectedItem.isFavorite ? 'Unfavorite' : 'Favorite'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.l,
        marginBottom: SPACING.m,
    },
    headerTitle: {
        ...TYPOGRAPHY.h1,
    } as any,
    favoritesButton: {
        padding: SPACING.s,
        borderRadius: BORDER_RADIUS.m,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    favoritesButtonActive: {
        borderColor: COLORS.primary,
        backgroundColor: `${COLORS.primary}20`,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: SPACING.l,
        marginBottom: SPACING.m,
        backgroundColor: COLORS.card,
        borderRadius: BORDER_RADIUS.m,
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.s,
        gap: SPACING.s,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchInput: {
        flex: 1,
        color: COLORS.textPrimary,
        fontSize: 16,
    },
    filterContainer: {
        paddingHorizontal: SPACING.l,
        marginBottom: SPACING.m,
        maxHeight: 45,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.xs,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginRight: SPACING.s,
        height: 32,
    },
    filterChipText: {
        color: COLORS.textSecondary,
        fontSize: 13,
    },
    list: {
        padding: SPACING.l,
        paddingBottom: 100,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: BORDER_RADIUS.m,
        padding: SPACING.m,
        marginBottom: SPACING.s,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: BORDER_RADIUS.m,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        marginLeft: SPACING.m,
    },
    title: {
        ...TYPOGRAPHY.body,
        fontWeight: '600',
    } as any,
    subtitle: {
        ...TYPOGRAPHY.small,
        color: COLORS.textSecondary,
        marginTop: 2,
    } as any,
    favoriteButton: {
        padding: SPACING.s,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        ...TYPOGRAPHY.body,
        color: COLORS.textSecondary,
        marginTop: SPACING.m,
    } as any,
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: BORDER_RADIUS.l,
        borderTopRightRadius: BORDER_RADIUS.l,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.l,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalIcon: {
        width: 50,
        height: 50,
        borderRadius: BORDER_RADIUS.m,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalTitleContainer: {
        flex: 1,
        marginLeft: SPACING.m,
    },
    modalTitle: {
        ...TYPOGRAPHY.h3,
    } as any,
    modalType: {
        ...TYPOGRAPHY.small,
        color: COLORS.textSecondary,
    } as any,
    closeButton: {
        padding: SPACING.s,
    },
    modalBody: {
        padding: SPACING.l,
        maxHeight: 400,
    },
    detailField: {
        marginBottom: SPACING.l,
    },
    detailLabel: {
        ...TYPOGRAPHY.small,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xs,
    } as any,
    detailValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.card,
        borderRadius: BORDER_RADIUS.s,
        padding: SPACING.m,
    },
    detailValue: {
        ...TYPOGRAPHY.body,
        flex: 1,
    } as any,
    copyButton: {
        padding: SPACING.s,
        marginLeft: SPACING.s,
    },
    modalFooter: {
        flexDirection: 'row',
        padding: SPACING.l,
        gap: SPACING.m,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    footerButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
        gap: SPACING.s,
    },
    deleteButton: {
        backgroundColor: COLORS.danger,
    },
    deleteButtonText: {
        color: '#FFF',
        fontWeight: '600',
    },
    favoriteBtn: {
        backgroundColor: `${COLORS.primary}20`,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    favoriteBtnText: {
        color: COLORS.primary,
        fontWeight: '600',
    },
});
