import { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAttachmentStore, SecureFile } from '@/store/attachmentStore';
import { useAuthStore } from '@/store/authStore';
import * as Sharing from 'expo-sharing';

export default function FilesScreen() {
    const { files, isLoading, loadFiles, pickAndEncryptFile, decryptAndViewFile, deleteFile } = useAttachmentStore();
    const { masterKey } = useAuthStore();

    useEffect(() => {
        loadFiles();
    }, []);

    const handleAddFile = async () => {
        if (!masterKey) {
            Alert.alert('Error', 'Please log in first');
            return;
        }
        const result = await pickAndEncryptFile(masterKey);
        if (result) {
            Alert.alert('Success', `${result.name} has been encrypted and saved`);
        }
    };

    const handleViewFile = async (file: SecureFile) => {
        if (!masterKey) return;

        if (Platform.OS === 'web') {
            Alert.alert('Info', 'File viewing is only available on mobile devices');
            return;
        }

        const uri = await decryptAndViewFile(file, masterKey);
        if (uri) {
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    dialogTitle: `View ${file.name}`,
                    mimeType: file.mimeType,
                });
            } else {
                Alert.alert('Info', 'File decrypted to: ' + uri);
            }
        } else {
            Alert.alert('Error', 'Failed to decrypt file');
        }
    };

    const handleDeleteFile = (file: SecureFile) => {
        Alert.alert(
            'Delete File',
            `Are you sure you want to delete "${file.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteFile(file.id)
                },
            ]
        );
    };

    const formatSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileIcon = (mimeType: string): string => {
        if (mimeType.startsWith('image/')) return 'image-outline';
        if (mimeType.startsWith('video/')) return 'videocam-outline';
        if (mimeType.startsWith('audio/')) return 'musical-notes-outline';
        if (mimeType.includes('pdf')) return 'document-text-outline';
        return 'document-outline';
    };

    const renderItem = ({ item }: { item: SecureFile }) => (
        <TouchableOpacity style={styles.fileItem} onPress={() => handleViewFile(item)}>
            <View style={styles.iconContainer}>
                <Ionicons name={getFileIcon(item.mimeType) as any} size={24} color={COLORS.primary} />
            </View>
            <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.fileMeta}>
                    {formatSize(item.size)} • {new Date(item.createdAt).toLocaleDateString()}
                </Text>
            </View>
            <TouchableOpacity onPress={() => handleDeleteFile(item)} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Secure Files</Text>
                <TouchableOpacity style={styles.uploadButton} onPress={handleAddFile}>
                    <Ionicons name="add" size={24} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={files}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="folder-open-outline" size={64} color={COLORS.border} />
                            <Text style={styles.emptyText}>No encrypted files</Text>
                            <Text style={styles.emptySubtext}>Tap + to add your first secure file</Text>
                        </View>
                    }
                />
            )}
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
        marginBottom: SPACING.l,
    },
    headerTitle: {
        ...TYPOGRAPHY.h1,
    } as any,
    uploadButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.card,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: SPACING.m,
        gap: SPACING.m,
    },
    fileItem: {
        backgroundColor: COLORS.card,
        padding: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.m,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: `${COLORS.primary}20`,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fileInfo: {
        flex: 1,
    },
    fileName: {
        ...TYPOGRAPHY.h3,
        fontSize: 16,
    } as any,
    fileMeta: {
        ...TYPOGRAPHY.small,
        color: COLORS.textSecondary,
        marginTop: 2,
    } as any,
    deleteButton: {
        padding: SPACING.s,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
        gap: SPACING.m,
    },
    emptyText: {
        ...TYPOGRAPHY.h3,
        color: COLORS.textSecondary,
    } as any,
    emptySubtext: {
        ...TYPOGRAPHY.body,
        color: COLORS.textSecondary,
    } as any,
});
