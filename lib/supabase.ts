import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { KeyVerifier, User, VaultItem, VaultItemType } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export interface StoredUser extends User {
  salt: string;
  keyVerifier: KeyVerifier | null;
}

export interface VaultItemInput {
  itemType: VaultItemType;
  encryptedData: string;
  iv: string;
}

type SupabaseUserRow = {
  id: string;
  email: string;
  salt: string;
  created_at: string;
  verifier_encrypted_data: string | null;
  verifier_iv: string | null;
};

type SupabaseVaultItemRow = {
  id: string;
  user_id: string;
  item_type: VaultItemType;
  encrypted_data: string;
  iv: string;
  created_at: string;
  updated_at: string;
};

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function toUser(row: SupabaseUserRow): StoredUser {
  return {
    id: row.id,
    email: row.email,
    salt: row.salt,
    createdAt: row.created_at,
    keyVerifier: row.verifier_encrypted_data && row.verifier_iv
      ? { encryptedData: row.verifier_encrypted_data, iv: row.verifier_iv }
      : null,
  };
}

function toVaultItem(row: SupabaseVaultItemRow): VaultItem {
  return {
    id: row.id,
    userId: row.user_id,
    itemType: row.item_type,
    encryptedData: row.encrypted_data,
    iv: row.iv,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Helper function to determine if we should use mock DB
export function shouldUseMockDB() {
  return !supabaseUrl || !supabaseKey;
}

// Only initialize Supabase if credentials are provided
export const supabase = shouldUseMockDB()
  ? null
  : createClient(supabaseUrl, supabaseKey);

class SupabaseDB {
  constructor(private readonly client: SupabaseClient) {}

  async register(email: string, salt: string, keyVerifier: KeyVerifier): Promise<StoredUser> {
    const { data, error } = await this.client
      .from('users')
      .insert({
        email,
        salt,
        verifier_encrypted_data: keyVerifier.encryptedData,
        verifier_iv: keyVerifier.iv,
      })
      .select('id,email,salt,created_at,verifier_encrypted_data,verifier_iv')
      .single<SupabaseUserRow>();

    if (error) {
      if (error.code === '23505') {
        throw new Error('User already exists');
      }
      throw new Error(error.message || 'Failed to create user');
    }

    return toUser(data);
  }

  async login(email: string): Promise<StoredUser> {
    const { data, error } = await this.client
      .from('users')
      .select('id,email,salt,created_at,verifier_encrypted_data,verifier_iv')
      .eq('email', email)
      .maybeSingle<SupabaseUserRow>();

    if (error) {
      throw new Error(error.message || 'Login failed');
    }

    if (!data) {
      throw new Error('User not found');
    }

    return toUser(data);
  }

  async updateUserSalt(userId: string, salt: string, keyVerifier: KeyVerifier): Promise<StoredUser> {
    const { data, error } = await this.client
      .from('users')
      .update({
        salt,
        verifier_encrypted_data: keyVerifier.encryptedData,
        verifier_iv: keyVerifier.iv,
      })
      .eq('id', userId)
      .select('id,email,salt,created_at,verifier_encrypted_data,verifier_iv')
      .maybeSingle<SupabaseUserRow>();

    if (error) {
      throw new Error(error.message || 'Failed to update account');
    }

    if (!data) {
      throw new Error('User not found');
    }

    return toUser(data);
  }

  async deleteUser(userId: string): Promise<void> {
    const { data, error } = await this.client
      .from('users')
      .delete()
      .eq('id', userId)
      .select('id');

    if (error) {
      throw new Error(error.message || 'Failed to delete account');
    }

    if (!data || data.length === 0) {
      throw new Error('User not found');
    }
  }

  async getVaultItems(userId: string): Promise<VaultItem[]> {
    const { data, error } = await this.client
      .from('vault_items')
      .select('id,user_id,item_type,encrypted_data,iv,created_at,updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(error.message || 'Failed to fetch vault items');
    }

    return (data as SupabaseVaultItemRow[]).map(toVaultItem);
  }

  async getVaultItem(userId: string, itemId: string): Promise<VaultItem> {
    const { data, error } = await this.client
      .from('vault_items')
      .select('id,user_id,item_type,encrypted_data,iv,created_at,updated_at')
      .eq('user_id', userId)
      .eq('id', itemId)
      .maybeSingle<SupabaseVaultItemRow>();

    if (error) {
      throw new Error(error.message || 'Failed to fetch vault item');
    }

    if (!data) {
      throw new Error('Item not found');
    }

    return toVaultItem(data);
  }

  async addVaultItem(userId: string, item: VaultItemInput): Promise<VaultItem> {
    const now = new Date().toISOString();
    const { data, error } = await this.client
      .from('vault_items')
      .insert({
        user_id: userId,
        item_type: item.itemType,
        encrypted_data: item.encryptedData,
        iv: item.iv,
        created_at: now,
        updated_at: now,
      })
      .select('id,user_id,item_type,encrypted_data,iv,created_at,updated_at')
      .single<SupabaseVaultItemRow>();

    if (error) {
      throw new Error(error.message || 'Failed to create vault item');
    }

    return toVaultItem(data);
  }

  async updateVaultItem(userId: string, itemId: string, updates: Partial<VaultItemInput>): Promise<VaultItem> {
    const { data, error } = await this.client
      .from('vault_items')
      .update({
        ...(updates.encryptedData ? { encrypted_data: updates.encryptedData } : {}),
        ...(updates.iv ? { iv: updates.iv } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('id', itemId)
      .select('id,user_id,item_type,encrypted_data,iv,created_at,updated_at')
      .maybeSingle<SupabaseVaultItemRow>();

    if (error) {
      throw new Error(error.message || 'Failed to update vault item');
    }

    if (!data) {
      throw new Error('Item not found');
    }

    return toVaultItem(data);
  }

  async deleteVaultItem(userId: string, itemId: string): Promise<void> {
    const { data, error } = await this.client
      .from('vault_items')
      .delete()
      .eq('user_id', userId)
      .eq('id', itemId)
      .select('id');

    if (error) {
      throw new Error(error.message || 'Failed to delete vault item');
    }

    if (!data || data.length === 0) {
      throw new Error('Item not found');
    }
  }
}

// Mock database for development without Supabase
class MockDB {
  private users: Map<string, StoredUser> = new Map();
  private vaultItems: Map<string, VaultItem[]> = new Map();

  private getUserById(userId: string): StoredUser {
    const user = Array.from(this.users.values()).find((entry) => entry.id === userId);
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async register(email: string, salt: string, keyVerifier: KeyVerifier): Promise<StoredUser> {
    if (this.users.has(email)) {
      throw new Error('User already exists');
    }

    const user: StoredUser = {
      id: createId(),
      email,
      salt,
      keyVerifier,
      createdAt: new Date().toISOString(),
    };

    this.users.set(email, user);
    this.vaultItems.set(user.id, []);
    return user;
  }

  async login(email: string): Promise<StoredUser> {
    const user = this.users.get(email);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async updateUserSalt(userId: string, salt: string, keyVerifier: KeyVerifier): Promise<StoredUser> {
    const user = this.getUserById(userId);
    const updated = { ...user, salt, keyVerifier };
    this.users.set(user.email, updated);
    return updated;
  }

  async deleteUser(userId: string): Promise<void> {
    const user = this.getUserById(userId);
    this.users.delete(user.email);
    this.vaultItems.delete(userId);
  }

  async getVaultItems(userId: string): Promise<VaultItem[]> {
    this.getUserById(userId);
    return this.vaultItems.get(userId) || [];
  }

  async getVaultItem(userId: string, itemId: string): Promise<VaultItem> {
    this.getUserById(userId);
    const item = (this.vaultItems.get(userId) || []).find((entry) => entry.id === itemId);
    if (!item) {
      throw new Error('Item not found');
    }

    return item;
  }

  async addVaultItem(userId: string, item: VaultItemInput): Promise<VaultItem> {
    this.getUserById(userId);
    const items = this.vaultItems.get(userId) || [];
    const now = new Date().toISOString();
    const newItem: VaultItem = {
      ...item,
      id: createId(),
      userId,
      createdAt: now,
      updatedAt: now,
    };

    items.push(newItem);
    this.vaultItems.set(userId, items);
    return newItem;
  }

  async updateVaultItem(userId: string, itemId: string, updates: Partial<VaultItemInput>): Promise<VaultItem> {
    this.getUserById(userId);
    const items = this.vaultItems.get(userId) || [];
    const index = items.findIndex((item) => item.id === itemId);
    if (index === -1) {
      throw new Error('Item not found');
    }

    items[index] = {
      ...items[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.vaultItems.set(userId, items);
    return items[index];
  }

  async deleteVaultItem(userId: string, itemId: string): Promise<void> {
    this.getUserById(userId);
    const items = this.vaultItems.get(userId) || [];
    if (!items.some((item) => item.id === itemId)) {
      throw new Error('Item not found');
    }

    this.vaultItems.set(
      userId,
      items.filter((item) => item.id !== itemId)
    );
  }
}

export const mockDB = new MockDB();
export const vaultDB = supabase ? new SupabaseDB(supabase) : mockDB;
