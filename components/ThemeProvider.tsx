'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { currentTheme } = useAppStore();

  useEffect(() => {
    console.log(`🎨 ThemeProvider: Applying theme: ${currentTheme}`);
    
    // Remove existing theme classes
    document.documentElement.classList.remove(
      'theme-default', 
      'theme-glass', 
      'theme-dark', 
      'theme-sunset', 
      'theme-ocean', 
      'theme-forest'
    );
    
    // Add current theme class
    document.documentElement.classList.add(`theme-${currentTheme}`);
    
    console.log(`🎨 ThemeProvider: HTML classes after change:`, document.documentElement.className);
  }, [currentTheme]);

  return <>{children}</>;
}
