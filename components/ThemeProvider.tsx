'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { currentTheme } = useAppStore();

  useEffect(() => {
    // Remove existing theme classes
    document.documentElement.classList.remove('theme-default', 'theme-glass');
    
    // Add current theme class
    document.documentElement.classList.add(`theme-${currentTheme}`);
  }, [currentTheme]);

  return <>{children}</>;
}
