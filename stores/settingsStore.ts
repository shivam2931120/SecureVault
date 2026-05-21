import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SettingsState {
  autoLockTimeout: number;
  setAutoLockTimeout: (minutes: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      autoLockTimeout: 15,
      setAutoLockTimeout: (autoLockTimeout) => set({ autoLockTimeout }),
    }),
    {
      name: 'securevault-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
