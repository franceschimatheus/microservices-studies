'use client';

import React from 'react';
import Link from 'next/link';

import { useArchitectureStore } from '@/features/architecture/store/useArchitectureStore';
import { ArchitectureTabs } from '@/features/architecture/components/ArchitectureTabs';
import { TopologyTab } from '@/features/architecture/components/TopologyTab';
import { MessagingTab } from '@/features/architecture/components/MessagingTab';
import { ReliabilityTab } from '@/features/architecture/components/ReliabilityTab';
import { DataLakeTab } from '@/features/architecture/components/DataLakeTab';
import { ObservabilityTab } from '@/features/architecture/components/ObservabilityTab';

export default function AdminArchitecturePage() {
  const { activeTab } = useArchitectureStore();

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-6">
          <div>
            <Link 
              href="/admin"
              className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold flex items-center gap-1.5 cursor-pointer mb-2 transition-all"
            >
              ← Back to Main Console
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
              Platform System Explanation
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Deep dive into the distributed microservices architecture, asynchronous flows, database design, and reliability engines.
            </p>
          </div>
        </div>

        {/* Custom Premium Tabs Navigation */}
        <ArchitectureTabs />

        {/* Tab Contents */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-950/80 border border-slate-900 rounded-3xl p-8 shadow-xl min-h-[500px]">
          {activeTab === 'topology' && <TopologyTab />}
          {activeTab === 'messaging' && <MessagingTab />}
          {activeTab === 'reliability' && <ReliabilityTab />}
          {activeTab === 'datalake' && <DataLakeTab />}
          {activeTab === 'observability' && <ObservabilityTab />}
        </div>

    </div>
  );
}
