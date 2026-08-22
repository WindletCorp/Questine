import { useEffect } from 'react';
import { useThemeStore } from '../lib/stores/theme-store';
import { getLocalEquippedByCategory, getLocalShopItems } from '../lib/local-db/shop';
import { useThemeContext } from './provider';
import type { ThemeContract } from './contract';

export function useEquippedTheme() {
  const themeId = useThemeStore((s) => s.themeId);
  return themeId;
}

export function useThemePage<K extends keyof ThemeContract['pages']>(pageName: K): ThemeContract['pages'][K] {
  const { theme } = useThemeContext();
  return theme.pages[pageName];
}

export async function initThemeFromInventory(userId: string): Promise<string> {
  try {
    const equipped = await getLocalEquippedByCategory(userId, 'theme');
    if (!equipped) return 'default';
    
    // We need to find the theme_id from preview_data in shop_items
    const shopItems = await getLocalShopItems();
    const shopItem = shopItems.find(item => item.id === equipped.item_id);
    
    if (shopItem && shopItem.preview_data && typeof shopItem.preview_data === 'object' && 'theme_id' in shopItem.preview_data) {
       return (shopItem.preview_data as any).theme_id;
    }
    
    return 'default';
  } catch (err) {
    console.error("Failed to init theme from inventory", err);
    return 'default';
  }
}
