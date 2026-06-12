import { create } from 'zustand';

export type TabType = 'topology' | 'messaging' | 'reliability' | 'datalake' | 'observability';

interface ArchitectureState {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const useArchitectureStore = create<ArchitectureState>((set) => ({
  activeTab: 'topology',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
