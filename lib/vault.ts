import { DecryptedVaultItem, VaultItem, VaultItemType } from '@/types';

export const VAULT_ITEM_TYPES: readonly VaultItemType[] = [
  'password',
  'login',
  'note',
  'card',
  'apikey',
  'identity',
  'wifi',
];

export interface VaultBackup {
  app: 'SecureVault';
  version: 1;
  exportedAt: string;
  userId: string;
  items: VaultItem[];
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isVaultItemType(value: unknown): value is VaultItemType {
  return typeof value === 'string' && VAULT_ITEM_TYPES.includes(value as VaultItemType);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isBase64(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0 || value.length % 4 !== 0) {
    return false;
  }

  return /^[A-Za-z0-9+/]+={0,2}$/.test(value);
}

export function parseTags(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    )
  );
}

export function getSearchableVaultText(item: DecryptedVaultItem): string {
  return [
    item.title,
    item.username,
    item.url,
    item.note,
    item.cardHolder,
    item.apiService,
    ...(item.tags ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function getDisplayTitle(itemData: Partial<DecryptedVaultItem>): string {
  return itemData.title?.trim() || 'Untitled Item';
}
