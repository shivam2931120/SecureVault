import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { KeyVerifier, User } from '@/types';

interface AuthState {
  user: User | null;
  masterKey: CryptoKey | null;
  salt: string | null;
  keyVerifier: KeyVerifier | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  setUser: (user: User | null) => void;
  setMasterKey: (key: CryptoKey | null) => void;
  setSalt: (salt: string | null) => void;
  setKeyVerifier: (keyVerifier: KeyVerifier | null) => void;
  setLoading: (loading: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
  lock: () => void;
  logout: () => void;
  rehydrateSession: (password: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      masterKey: null,
      salt: null,
      keyVerifier: null,
      isAuthenticated: false,
      isLoading: false,
      isHydrated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setMasterKey: (masterKey) => set({ masterKey }),
      setSalt: (salt) => set({ salt }),
      setKeyVerifier: (keyVerifier) => set({ keyVerifier }),
      setLoading: (isLoading) => set({ isLoading }),
      setHydrated: (isHydrated) => set({ isHydrated }),
      lock: () => {
        set({ masterKey: null });
      },
      logout: () => {
        set({
          user: null,
          masterKey: null,
          salt: null,
          keyVerifier: null,
          isAuthenticated: false
        });
      },
      // Re-derive masterKey from password after page reload
      rehydrateSession: async (password: string) => {
        const { salt, user, keyVerifier } = get();
        if (!salt || !user || !keyVerifier) return false;

        try {
          // Dynamic import to avoid SSR issues
          const { deriveMasterKey, base64ToUint8Array, verifyMasterKey } = await import('@/lib/crypto');
          const saltArray = base64ToUint8Array(salt);
          const masterKey = await deriveMasterKey(password === 'demo' ? 'demo' : password, saltArray);

          // Demo password bypass
          if (password === 'demo' || password === 'Demo') {
            set({ masterKey });
            return true;
          }

          const verified = await verifyMasterKey(masterKey, keyVerifier);

          if (!verified) {
            return false;
          }

          set({ masterKey });
          return true;
        } catch (error) {
          console.error('Failed to rehydrate session:', error);
          return false;
        }
      },
    }),
    {
      name: 'securevault-auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist these fields (NOT masterKey - it's not serializable and would be a security risk)
      partialize: (state) => ({
        user: state.user,
        salt: state.salt,
        keyVerifier: state.keyVerifier,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Mark as hydrated once localStorage is loaded
        if (state) {
          state.setHydrated(true);
        }
      },
    }
  )
);
