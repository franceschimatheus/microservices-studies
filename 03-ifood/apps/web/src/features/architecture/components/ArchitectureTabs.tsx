import React from 'react';
import { useArchitectureStore, TabType } from '../store/useArchitectureStore';

export const ArchitectureTabs = () => {
  const { activeTab, setActiveTab } = useArchitectureStore();

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'topology', label: 'Services Topology', icon: '🕸️' },
    { id: 'messaging', label: 'Event Choreography', icon: '🐇' },
    { id: 'reliability', label: 'Reliability Patterns', icon: '🛡️' },
    { id: 'datalake', label: 'Data Lake (ELT)', icon: '💾' },
    { id: 'observability', label: 'Observability Stack', icon: '📊' },
  ];

  return (
    <div className="flex flex-wrap gap-2.5 border-b border-slate-900 pb-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === tab.id
              ? 'bg-indigo-650 text-white shadow-lg shadow-indigo-950/40 border border-indigo-950'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-900/60 hover:border-slate-850'
          }`}
        >
          <span>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
};
