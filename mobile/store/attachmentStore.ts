import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { encryptData, decryptData, generateIV, arrayBufferToBase64, base64ToArrayBuffer, base64ToUint8Array } from '@/crypto';

// Dynamic import for native-only file system
let FileSystem: any = null;
let DocumentPicker: any = null;

if (Platform.OS !== 'web') {
    FileSystem = require('expo-file-system');
    DocumentPicker = require('expo-document-picker');
}

export interface SecureFile {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    encryptedUri: string;
    iv: string;
    linkedItemId?: string;
    createdAt: string;
}

interface AttachmentState {
    files: SecureFile[];
    isLoading: boolean;

    loadFiles: () => Promise<void>;
    pickAndEncryptFile: (masterKey: string, linkedItemId?: string) => Promise<SecureFile | null>;
    decryptAndViewFile: (file: SecureFile, masterKey: string) => Promise<string | null>;
    deleteFile: (fileId: string) => Promise<void>;
}

const FILES_KEY = 'secure_vault_files';

export const useAttachmentStore = create<AttachmentState>((set, get) => ({
    files: [],
    isLoading: false,

    loadFiles: async () => {
        set({ isLoading: true });
        try {
            // On native, ensure directory exists
            if (Platform.OS !== 'web' && FileSystem) {
                const FILES_DIR = `${FileSystem.documentDirectory}secure_files/`;
                try {
                    const dirInfo = await FileSystem.getInfoAsync(FILES_DIR);
                    if (!dirInfo.exists) {
                        await FileSystem.makeDirectoryAsync(FILES_DIR, { intermediates: true });
                    }
                } catch (e) {
                    console.log('Directory check skipped', e);
                }
            }

            const stored = await AsyncStorage.getItem(FILES_KEY);
            if (stored) {
                set({ files: JSON.parse(stored) });
            }
        } catch (e) {
            console.error('Failed to load files', e);
        } finally {
            set({ isLoading: false });
        }
    },

    pickAndEncryptFile: async (masterKey, linkedItemId) => {
        try {
            if (Platform.OS === 'web' || !DocumentPicker || !FileSystem) {
                console.log('File operations not supported on web');
                return null;
            }

            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets?.[0]) {
                return null;
            }

            const pickedFile = result.assets[0];
            const FILES_DIR = `${FileSystem.documentDirectory}secure_files/`;

            // Read file content
            const fileContent = await FileSystem.readAsStringAsync(pickedFile.uri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            // Encrypt the content
            const iv = generateIV();
            const encrypted = await encryptData(fileContent, masterKey, iv);

            // Save encrypted file
            const fileId = `file_${Date.now()}`;
            const encryptedUri = `${FILES_DIR}${fileId}.enc`;
            await FileSystem.writeAsStringAsync(encryptedUri, encrypted, {
                encoding: FileSystem.EncodingType.UTF8,
            });

            const newFile: SecureFile = {
                id: fileId,
                name: pickedFile.name,
                mimeType: pickedFile.mimeType || 'application/octet-stream',
                size: pickedFile.size || 0,
                encryptedUri,
                iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
                linkedItemId,
                createdAt: new Date().toISOString(),
            };

            const files = [...get().files, newFile];
            set({ files });
            await AsyncStorage.setItem(FILES_KEY, JSON.stringify(files));

            return newFile;
        } catch (e) {
            console.error('Failed to pick and encrypt file', e);
            return null;
        }
    },

    decryptAndViewFile: async (file, masterKey) => {
        try {
            if (Platform.OS === 'web' || !FileSystem) {
                console.log('File viewing not supported on web');
                return null;
            }

            // Read encrypted content
            const encryptedContent = await FileSystem.readAsStringAsync(file.encryptedUri, {
                encoding: FileSystem.EncodingType.UTF8,
            });

            // Decrypt
            const iv = base64ToUint8Array(file.iv);
            const decrypted = await decryptData(encryptedContent, masterKey, iv);

            // Save to temp file for viewing
            const tempUri = `${FileSystem.cacheDirectory}${file.name}`;
            await FileSystem.writeAsStringAsync(tempUri, decrypted, {
                encoding: FileSystem.EncodingType.Base64,
            });

            return tempUri;
        } catch (e) {
            console.error('Failed to decrypt file', e);
            return null;
        }
    },

    deleteFile: async (fileId) => {
        try {
            if (Platform.OS !== 'web' && FileSystem) {
                const file = get().files.find(f => f.id === fileId);
                if (file) {
                    await FileSystem.deleteAsync(file.encryptedUri, { idempotent: true });
                }
            }

            const files = get().files.filter(f => f.id !== fileId);
            set({ files });
            await AsyncStorage.setItem(FILES_KEY, JSON.stringify(files));
        } catch (e) {
            console.error('Failed to delete file', e);
        }
    },
}));
