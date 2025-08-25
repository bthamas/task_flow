import { create } from 'zustand';
import { Project, Client, FilterType } from '@/types';

interface AppState {
  // UI State
  sidebarOpen: boolean;
  currentProject: Project | null;
  currentClient: Client | null;
  
  // Filters and Search
  searchTerm: string;
  activeFilter: FilterType;
  
  // Actions
  setSidebarOpen: (open: boolean) => void;
  setCurrentProject: (project: Project | null) => void;
  setCurrentClient: (client: Client | null) => void;
  setSearchTerm: (term: string) => void;
  setActiveFilter: (filter: FilterType) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  currentProject: null,
  currentClient: null,
  searchTerm: '',
  activeFilter: 'all',
  
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCurrentProject: (project) => set({ currentProject: project }),
  setCurrentClient: (client) => set({ currentClient: client }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  setActiveFilter: (filter) => set({ activeFilter: filter }),
}));
