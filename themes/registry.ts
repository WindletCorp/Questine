import type { ThemeContract } from './contract';
import defaultTheme from './default';

type ThemeLoader = () => Promise<{ default: ThemeContract }>;

export const themeRegistry: Record<string, ThemeContract | ThemeLoader> = {
  'default': defaultTheme,
  'cyberpunk': () => import('./cyberpunk'),
};

export type ThemeId = keyof typeof themeRegistry;

export async function resolveTheme(id: string): Promise<ThemeContract> {
  const entry = themeRegistry[id];
  if (!entry) {
    console.warn(`Theme "${id}" not found, falling back to default`);
    return defaultTheme;
  }
  
  if (typeof entry !== 'function') {
    return entry;
  }

  try {
    const module = await entry();
    return module.default;
  } catch (err) {
    console.error(`Failed to load theme "${id}":`, err);
    return defaultTheme;
  }
}
