import { create } from 'zustand';
import type { ThemeContract } from '../../themes/contract';
import { resolveTheme } from '../../themes/registry';
import defaultTheme from '../../themes/default';

interface ThemeStore {
  themeId: string;
  theme: ThemeContract;
  isLoading: boolean;
  setThemeId: (id: string) => Promise<void>;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  themeId: 'default',
  theme: defaultTheme,
  isLoading: false,

  setThemeId: async (id: string) => {
    set({ isLoading: true });
    try {
      const resolvedTheme = await resolveTheme(id);
      set({ themeId: id, theme: resolvedTheme, isLoading: false });
    } catch (e) {
      set({ themeId: 'default', theme: defaultTheme, isLoading: false });
    }
  },
}));
