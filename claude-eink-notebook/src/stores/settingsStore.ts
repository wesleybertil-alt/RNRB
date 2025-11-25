import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings } from '../types';

interface SettingsState extends Settings {
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  setMaxTokens: (tokens: number) => void;
  isConfigured: () => boolean;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      apiKey: '',
      model: 'claude-sonnet-4-20250514',
      maxTokens: 4096,
      theme: 'light' as const,
      setApiKey: (apiKey) => set({ apiKey }),
      setModel: (model) => set({ model }),
      setMaxTokens: (maxTokens) => set({ maxTokens }),
      isConfigured: () => get().apiKey.length > 0,
    }),
    { name: 'settings-storage' }
  )
);
