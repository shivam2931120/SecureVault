export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface VaultItem {
  id: string;
  userId: string;
  itemType: 'password' | 'note' | 'card' | 'apikey';
  encryptedData: string;
  iv: string;
  title?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DecryptedVaultItem {
  id: string;
  itemType: 'password' | 'note' | 'card' | 'apikey';
  title: string;
  username?: string;
  password?: string;
  url?: string;
  note?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCVV?: string;
  apiKey?: string;
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
