import { create } from "zustand";

interface UIState {
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  feedSort: "latest" | "trending" | "top";
  setFeedSort: (sort: "latest" | "trending" | "top") => void;
}

export const useUIStore = create<UIState>((set) => ({
  searchOpen: false,
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  mobileNavOpen: false,
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
  feedSort: "trending",
  setFeedSort: (feedSort) => set({ feedSort }),
}));

export interface FeedFilters {
  company?: string;
  role?: string;
  location?: string;
  difficulty?: string;
  interviewType?: string;
  outcome?: string;
}

interface FilterState {
  filters: FeedFilters;
  setFilter: (key: keyof FeedFilters, value?: string) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  filters: {},
  setFilter: (key, value) =>
    set((state) => {
      const next = { ...state.filters };
      if (!value) delete next[key];
      else next[key] = value;
      return { filters: next };
    }),
  resetFilters: () => set({ filters: {} }),
}));
