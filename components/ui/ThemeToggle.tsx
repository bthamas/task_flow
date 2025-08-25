'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from './Button';
import { Palette, Sparkles, Moon, Sun, Waves, TreePine, Mountain } from 'lucide-react';

export function ThemeToggle() {
  const { currentTheme, setCurrentTheme } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleThemeChange = (theme: 'default' | 'glass' | 'dark' | 'sunset' | 'ocean' | 'forest') => {
    setCurrentTheme(theme);
    setIsOpen(false);
  };

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'default': return <Palette className="h-4 w-4" />;
      case 'glass': return <Sparkles className="h-4 w-4" />;
      case 'dark': return <Moon className="h-4 w-4" />;
      case 'sunset': return <Sun className="h-4 w-4" />;
      case 'ocean': return <Waves className="h-4 w-4" />;
      case 'forest': return <TreePine className="h-4 w-4" />;
      default: return <Palette className="h-4 w-4" />;
    }
  };

  const getThemeColor = (theme: string) => {
    switch (theme) {
      case 'default': return 'bg-gray-100 border-gray-300';
      case 'glass': return 'bg-gradient-to-br from-blue-400 to-purple-500 border-blue-300';
      case 'dark': return 'bg-gray-800 border-gray-600';
      case 'sunset': return 'bg-gradient-to-br from-orange-400 to-pink-500 border-orange-300';
      case 'ocean': return 'bg-gradient-to-br from-cyan-400 to-blue-500 border-cyan-300';
      case 'forest': return 'bg-gradient-to-br from-green-400 to-emerald-500 border-green-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const themes = [
    { id: 'default', name: 'Alapértelmezett', description: 'Klasszikus világos kinézet' },
    { id: 'glass', name: 'Glass', description: 'Üveg hatású modern design' },
    { id: 'dark', name: 'Dark', description: 'Elegáns sötét mód' },
    { id: 'sunset', name: 'Sunset', description: 'Meleg naplemente színek' },
    { id: 'ocean', name: 'Ocean', description: 'Tengeri kék árnyalatok' },
    { id: 'forest', name: 'Forest', description: 'Természetes zöld tónusok' }
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 theme-toggle-btn"
      >
        {getThemeIcon(currentTheme)}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-3 z-50">
          <div className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-600 mb-2">
            Témák
          </div>
          
          <div className="space-y-1">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id as any)}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-all duration-200 rounded-lg mx-2 ${
                  currentTheme === theme.id 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 ${getThemeColor(theme.id)} flex items-center justify-center`}>
                  {getThemeIcon(theme.id)}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{theme.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{theme.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
