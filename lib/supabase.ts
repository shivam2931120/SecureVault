import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Helper function to determine if we should use mock DB
export function useMockDB() {
  return !supabaseUrl || !supabaseKey;
}

// Only initialize Supabase if credentials are provided
export const supabase = useMockDB() 
  ? null 
  : createClient(supabaseUrl, supabaseKey);

// Mock database for development without Supabase
class MockDB {
  private users: Map<string, any> = new Map();
  private vaultItems: Map<string, any[]> = new Map();

  async register(email: string, salt: string) {
    if (this.users.has(email)) {
      throw new Error('User already exists');
    }
    const user = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      salt,
      createdAt: new Date().toISOString(),
    };
    this.users.set(email, user);
    this.vaultItems.set(user.id, []);
    return user;
  }

  async login(email: string) {
    const user = this.users.get(email);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async getVaultItems(userId: string) {
    return this.vaultItems.get(userId) || [];
  }

  async addVaultItem(userId: string, item: any) {
    const items = this.vaultItems.get(userId) || [];
    const newItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    items.push(newItem);
    this.vaultItems.set(userId, items);
    return newItem;
  }

  async updateVaultItem(userId: string, itemId: string, updates: any) {
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

  async deleteVaultItem(userId: string, itemId: string) {
    const items = this.vaultItems.get(userId) || [];
    const filtered = items.filter((item) => item.id !== itemId);
    this.vaultItems.set(userId, filtered);
    return true;
  }
}

export const mockDB = new MockDB();
