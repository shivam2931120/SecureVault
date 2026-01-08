// Vault Item Types

export type VaultItemType = 'login' | 'card' | 'note' | 'identity' | 'apikey' | 'wifi';

export interface BaseVaultItem {
    id: string;
    itemType: VaultItemType;
    title: string;
    folder?: string;
    isFavorite: boolean;
    tags: string[];
    encryptedData: string;
    iv: string;
    createdAt: string;
    updatedAt: string;
    syncStatus: 'synced' | 'pending' | 'conflict';
}

// Decrypted data structures for each type
export interface LoginData {
    username?: string;
    password: string;
    url?: string;
    totp?: string;
    notes?: string;
}

export interface CardData {
    cardholder: string;
    cardNumber: string;
    expiry: string;
    cvv: string;
    pin?: string;
    notes?: string;
}

export interface NoteData {
    body: string;
}

export interface IdentityData {
    firstName: string;
    lastName: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    phone?: string;
    email?: string;
    passportNumber?: string;
    idNumber?: string;
    notes?: string;
}

export interface ApiKeyData {
    service: string;
    key: string;
    expiry?: string;
    notes?: string;
}

export interface WifiData {
    ssid: string;
    password: string;
    securityType: 'WPA2' | 'WPA3' | 'WEP' | 'Open';
    notes?: string;
}

// Combined decrypted item types
export interface DecryptedLoginItem extends BaseVaultItem {
    itemType: 'login';
    decrypted: LoginData;
}

export interface DecryptedCardItem extends BaseVaultItem {
    itemType: 'card';
    decrypted: CardData;
}

export interface DecryptedNoteItem extends BaseVaultItem {
    itemType: 'note';
    decrypted: NoteData;
}

export interface DecryptedIdentityItem extends BaseVaultItem {
    itemType: 'identity';
    decrypted: IdentityData;
}

export interface DecryptedApiKeyItem extends BaseVaultItem {
    itemType: 'apikey';
    decrypted: ApiKeyData;
}

export interface DecryptedWifiItem extends BaseVaultItem {
    itemType: 'wifi';
    decrypted: WifiData;
}

export type DecryptedVaultItem =
    | DecryptedLoginItem
    | DecryptedCardItem
    | DecryptedNoteItem
    | DecryptedIdentityItem
    | DecryptedApiKeyItem
    | DecryptedWifiItem;

// Folder type
export interface Folder {
    id: string;
    name: string;
    icon?: string;
    createdAt: string;
}

// Item type metadata for UI
export const ITEM_TYPE_META: Record<VaultItemType, { label: string; icon: string; color: string }> = {
    login: { label: 'Login', icon: 'key-outline', color: '#E10600' },
    card: { label: 'Card', icon: 'card-outline', color: '#22C55E' },
    note: { label: 'Note', icon: 'document-text-outline', color: '#3B82F6' },
    identity: { label: 'Identity', icon: 'person-outline', color: '#A855F7' },
    apikey: { label: 'API Key', icon: 'code-slash-outline', color: '#F59E0B' },
    wifi: { label: 'Wi-Fi', icon: 'wifi-outline', color: '#06B6D4' },
};
