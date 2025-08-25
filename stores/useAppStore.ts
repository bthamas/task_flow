import { create } from 'zustand';
import { Project, Client, FilterType } from '@/types';

export type Theme = 'default' | 'glass' | 'dark' | 'sunset' | 'ocean' | 'forest';

interface AppState {
  // UI State
  sidebarOpen: boolean;
  currentProject: Project | null;
  currentClient: Client | null;
  currentTheme: Theme;
  
  // Filters and Search
  searchTerm: string;
  activeFilter: FilterType;
  
  // Actions
  setSidebarOpen: (open: boolean) => void;
  setCurrentProject: (project: Project | null) => void;
  setCurrentClient: (client: Client | null) => void;
  setSearchTerm: (term: string) => void;
  setActiveFilter: (filter: FilterType) => void;
  setCurrentTheme: (theme: Theme) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  currentProject: null,
  currentClient: null,
  currentTheme: 'default',
  searchTerm: '',
  activeFilter: 'all',
  
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCurrentProject: (project) => set({ currentProject: project }),
  setCurrentClient: (client) => set({ currentClient: client }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  setCurrentTheme: (theme) => set({ currentTheme: theme }),
}));
