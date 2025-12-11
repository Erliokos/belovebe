import { create } from 'zustand';
import { UserFilters } from '../types';

interface AppState {
  activeTab: 'feed' | 'responses' | 'my-tasks' | 'profile';
  isFiltersModalOpen: boolean;
  filters: UserFilters;
  filtersLoaded: boolean;
  setActiveTab: (tab: 'feed' | 'responses' | 'my-tasks' | 'profile') => void;
  setFiltersModalOpen: (open: boolean) => void;
  setFilters: (filters: UserFilters) => void;
  setFiltersLoaded: (loaded: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'feed',
  isFiltersModalOpen: false,
  filters: {
    selectedCategories: [],
    selectedCountries: [],
    selectedCities: [],
    worldwideMode: false,
  },
  filtersLoaded: false,
  setActiveTab: (activeTab) => set({ activeTab }),
  setFiltersModalOpen: (isFiltersModalOpen) => set({ isFiltersModalOpen }),
  setFilters: (filters) => set({ filters }),
  setFiltersLoaded: (filtersLoaded) => set({ filtersLoaded }),
}));

