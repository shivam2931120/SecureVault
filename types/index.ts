export type VaultItemType = 'password' | 'login' | 'note' | 'card' | 'apikey' | 'identity' | 'wifi';


export interface KeyVerifier {
  encryptedData: string;
  iv: string;
}

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface VaultItem {
  id: string;
  userId: string;
  itemType: VaultItemType;
  encryptedData: string;
  iv: string;
  title?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DecryptedVaultItem {
  id: string;
  itemType: VaultItemType;
  title: string;
  username?: string;
  password?: string;
  url?: string;
  note?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCVV?: string;
  cardHolder?: string;
  apiKey?: string;
  apiService?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PasswordStrength {
  score: number;
  feedback: string;
  color: string;
}

export interface SessionState {
  user: User | null;
  masterKey: CryptoKey | null;
  isLocked: boolean;
  lastActivity: number;
}
