'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Palette, Sparkles, Moon, Sun, Waves, TreePine } from 'lucide-react';

export function ThemeToggle() {
  const { currentTheme, setCurrentTheme } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themes = [
    { id: 'default', name: 'Alapértelmezett', description: 'Klasszikus világos kinézet', icon: Palette, color: '#6b7280' },
    { id: 'dark', name: 'Sötét', description: 'Elegáns sötét mód', icon: Moon, color: '#1e293b' }
  ];

  const currentThemeData = themes.find(theme => theme.id === currentTheme);
  const IconComponent = currentThemeData?.icon || Palette;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="theme-toggle-btn p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 flex items-center gap-2 text-gray-700 hover:text-gray-900"
        aria-label="Téma váltása"
      >
        <IconComponent size={20} />
        <span className="hidden sm:inline">Témák</span>
      </button>

      {isOpen && (
        <>
          {/* Overlay to prevent background clicks */}
          <div 
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Theme Dropdown */}
          <div 
            className="absolute right-0 mt-2 w-80 theme-dropdown rounded-lg overflow-hidden"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 1)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(229, 231, 235, 0.9)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)'
            }}
          >
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Téma Választás</h3>
              <p className="text-sm text-gray-600">Válaszd ki a kedvenc kinézetet</p>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    setCurrentTheme(theme.id as any);
                    setIsOpen(false);
                  }}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0 ${
                    currentTheme === theme.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: theme.color }}
                    >
                      <theme.icon size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{theme.name}</span>
                        {currentTheme === theme.id && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            Aktív
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{theme.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
