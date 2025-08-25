'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from './Button';
import { Palette, Sparkles } from 'lucide-react';

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

  const handleThemeChange = (theme: 'default' | 'glass') => {
    setCurrentTheme(theme);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 theme-toggle-btn"
      >
        {currentTheme === 'glass' ? (
          <Sparkles className="h-4 w-4" />
        ) : (
          <Palette className="h-4 w-4" />
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
          <div className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-600">
            Témák
          </div>
          
          <button
            onClick={() => handleThemeChange('default')}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 transition-colors ${
              currentTheme === 'default' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <div className="w-4 h-4 rounded border-2 border-gray-300 bg-white dark:bg-gray-800"></div>
            <span>Alapértelmezett</span>
          </button>
          
          <button
            onClick={() => handleThemeChange('glass')}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 transition-colors ${
              currentTheme === 'glass' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <div className="w-4 h-4 rounded border-2 border-gray-300 bg-gradient-to-br from-blue-400 to-purple-500"></div>
            <span>Glass</span>
          </button>
        </div>
      )}
    </div>
  );
}
