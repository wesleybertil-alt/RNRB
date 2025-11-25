import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Mode } from '../types';

interface ModeState {
  current: Mode;
  setMode: (mode: Mode) => void;
}

export const useModeStore = create<ModeState>()(
  persist(
    (set) => ({
      current: 'draft',
      setMode: (mode) => set({ current: mode }),
    }),
    { name: 'mode-storage' }
  )
);

export const MODE_CONFIG: Record<Mode, {
  placeholder: string;
  accentStyle: string;
  label: string;
}> = {
  draft: {
    placeholder: 'Think freely...',
    accentStyle: 'border-l-0',
    label: 'Draft'
  },
  research: {
    placeholder: 'Verify...',
    accentStyle: 'border-l-2 border-black',
    label: 'Research'
  },
  synthesis: {
    placeholder: 'Connect...',
    accentStyle: 'border-l-4 border-black',
    label: 'Synthesis'
  },
  writing: {
    placeholder: 'Craft...',
    accentStyle: 'border-l-0',
    label: 'Writing'
  }
};
