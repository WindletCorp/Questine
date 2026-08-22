'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useThemeStore } from '../lib/stores/theme-store';
import { initThemeFromInventory } from './hooks';
import type { ThemeContract } from './contract';
import defaultTheme from './default';
import { useAuth } from '../components/providers/auth-provider';

interface ThemeContextValue {
  theme: ThemeContract;
  themeId: string;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: defaultTheme,
  themeId: 'default',
  isLoading: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const themeId = useThemeStore((s) => s.themeId);
  const theme = useThemeStore((s) => s.theme);
  const isLoading = useThemeStore((s) => s.isLoading);
  const setThemeId = useThemeStore((s) => s.setThemeId);

  useEffect(() => {
    let isMounted = true;
    
    async function loadInitialTheme() {
      if (user) {
        const initialThemeId = await initThemeFromInventory(user.id);
        if (isMounted) {
          await setThemeId(initialThemeId);
        }
      }
    }
    
    loadInitialTheme();
    
    return () => {
      isMounted = false;
    };
  }, [user, setThemeId]);
  
  // Re-check when a sync completes (as shop items might have changed)
  useEffect(() => {
    let isMounted = true;
    const handleSync = async () => {
        if (user) {
            const currentThemeId = await initThemeFromInventory(user.id);
            if (isMounted) {
                // Only update if it actually changed to avoid unnecessary re-renders
                if (currentThemeId !== useThemeStore.getState().themeId) {
                   await setThemeId(currentThemeId);
                }
            }
        }
    };
    window.addEventListener("sync-completed", handleSync);
    return () => {
        isMounted = false;
        window.removeEventListener("sync-completed", handleSync);
    };
  }, [user, setThemeId]);

  const value = useMemo(() => ({
    theme,
    themeId,
    isLoading,
  }), [theme, themeId, isLoading]);

  return (
    <ThemeContext.Provider value={value}>
      {isLoading ? <theme.shell.LoadingState /> : (
        <theme.shell.AppShell>
          {children}
        </theme.shell.AppShell>
      )}
    </ThemeContext.Provider>
  );
}

export const useThemeContext = () => useContext(ThemeContext);
