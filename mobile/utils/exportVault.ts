import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { encryptData, generateIV, arrayBufferToBase64 } from '@/crypto';

// Dynamic import for native-only modules
let FileSystem: any = null;
let Sharing: any = null;

if (Platform.OS !== 'web') {
    FileSystem = require('expo-file-system');
    Sharing = require('expo-sharing');
}

interface ExportOptions {
    format: 'json' | 'csv';
    encrypted: boolean;
    masterKey?: string;  // String-based key for expo-crypto
}

export async function exportVault(userId: string, options: ExportOptions): Promise<boolean> {
    try {
        // Get vault data from storage
        const cached = await AsyncStorage.getItem(`vault_${userId}`);
        if (!cached) {
            throw new Error('No vault data found');
        }

        const items = JSON.parse(cached);
        let content: string;
        let filename: string;
        let mimeType: string;

        if (options.format === 'json') {
            if (options.encrypted && options.masterKey) {
                // Export as encrypted JSON
                const iv = generateIV();
                const encrypted = await encryptData(cached, options.masterKey, iv);
                content = JSON.stringify({
                    encrypted: true,
                    data: encrypted,  // Already a base64 string from encryptData
                    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
                    exportedAt: new Date().toISOString(),
                    itemCount: items.length,
                });
                filename = `securevault_export_encrypted_${Date.now()}.json`;
            } else {
                // Export as plain JSON (warning: unencrypted)
                content = JSON.stringify({
                    encrypted: false,
                    items: items,
                    exportedAt: new Date().toISOString(),
                    itemCount: items.length,
                }, null, 2);
                filename = `securevault_export_${Date.now()}.json`;
            }
            mimeType = 'application/json';
        } else {
            // CSV export (unencrypted for migration purposes)
            const headers = ['id', 'itemType', 'title', 'createdAt', 'folder', 'isFavorite'];
            const rows = items.map((item: any) =>
                headers.map(h => JSON.stringify(item[h] || '')).join(',')
            );
            content = [headers.join(','), ...rows].join('\n');
            filename = `securevault_export_${Date.now()}.csv`;
            mimeType = 'text/csv';
        }

        // On web, use download instead of file system
        if (Platform.OS === 'web') {
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            return true;
        }

        // Native: Write to temp file and share
        if (!FileSystem || !Sharing) {
            console.log('File system not available');
            return false;
        }

        const fileUri = `${FileSystem.cacheDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, content, {
            encoding: FileSystem.EncodingType.UTF8,
        });

        // Share the file
        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri, {
                mimeType,
                dialogTitle: 'Export Vault',
            });
            return true;
        } else {
            console.log('Sharing not available');
            return false;
        }
    } catch (e) {
        console.error('Export failed', e);
        return false;
    }
}
