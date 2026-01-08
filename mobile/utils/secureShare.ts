import AsyncStorage from '@react-native-async-storage/async-storage';
import { encryptData, generateIV, arrayBufferToBase64 } from '@/crypto';

export interface ShareLink {
    id: string;
    itemId: string;
    itemTitle: string;
    encryptedData: string;
    iv: string;
    shareKey: string; // One-time password for decryption
    expiresAt: string;
    maxViews: number;
    viewCount: number;
    createdAt: string;
}

const SHARES_KEY = 'secure_vault_shares';

// Generate a random share key
function generateShareKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    for (let i = 0; i < 8; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
}

export async function createSecureShare(
    itemId: string,
    itemTitle: string,
    itemData: any,
    masterKey: string,  // String-based key for expo-crypto
    expiryHours: number = 24,
    maxViews: number = 1
): Promise<ShareLink | null> {
    try {
        const iv = generateIV();
        const encrypted = await encryptData(JSON.stringify(itemData), masterKey, iv);

        const shareLink: ShareLink = {
            id: `share_${Date.now()}`,
            itemId,
            itemTitle,
            encryptedData: encrypted,  // Already a base64 string from encryptData
            iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
            shareKey: generateShareKey(),
            expiresAt: new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString(),
            maxViews,
            viewCount: 0,
            createdAt: new Date().toISOString(),
        };

        // Save locally (in production, this would also sync to a backend)
        const stored = await AsyncStorage.getItem(SHARES_KEY);
        const shares: ShareLink[] = stored ? JSON.parse(stored) : [];
        shares.push(shareLink);
        await AsyncStorage.setItem(SHARES_KEY, JSON.stringify(shares));

        return shareLink;
    } catch (e) {
        console.error('Failed to create secure share', e);
        return null;
    }
}

export async function getActiveShares(): Promise<ShareLink[]> {
    try {
        const stored = await AsyncStorage.getItem(SHARES_KEY);
        if (!stored) return [];

        const shares: ShareLink[] = JSON.parse(stored);
        const now = new Date();

        // Filter out expired shares
        const active = shares.filter(s => {
            const expires = new Date(s.expiresAt);
            return expires > now && s.viewCount < s.maxViews;
        });

        // Update storage if any expired
        if (active.length !== shares.length) {
            await AsyncStorage.setItem(SHARES_KEY, JSON.stringify(active));
        }

        return active;
    } catch (e) {
        console.error('Failed to get shares', e);
        return [];
    }
}

export async function revokeShare(shareId: string): Promise<void> {
    try {
        const stored = await AsyncStorage.getItem(SHARES_KEY);
        if (!stored) return;

        const shares: ShareLink[] = JSON.parse(stored);
        const updated = shares.filter(s => s.id !== shareId);
        await AsyncStorage.setItem(SHARES_KEY, JSON.stringify(updated));
    } catch (e) {
        console.error('Failed to revoke share', e);
    }
}

// Format share for display
export function formatShareLink(share: ShareLink): string {
    return `SecureVault Share\nItem: ${share.itemTitle}\nCode: ${share.shareKey}\nExpires: ${new Date(share.expiresAt).toLocaleString()}\n\nOpen the SecureVault app and enter this code to view.`;
}
