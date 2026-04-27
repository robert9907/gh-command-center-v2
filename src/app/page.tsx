'use client';

import { useEffect } from 'react';
import { AppProvider, useAppState } from '@/lib/AppState';
import Header from '@/components/layout/Header';
import PerformancePanel from '@/components/performance/PerformancePanel';
import KeywordWarRoom from '@/components/keywords/KeywordWarRoom';
import ArchitecturePanel from '@/components/architecture/ArchitecturePanel';
import OptimizePanel from '@/components/optimize/OptimizePanel';
import CitationMonitorPanel from '@/components/citation/CitationMonitorPanel';
import ContentStudioPanel from '@/components/studio/ContentStudioPanel';
import IndexingPanel from '@/components/indexing/IndexingPanel';
import FunnelDashboard from '@/components/funnel/FunnelDashboard';
import dynamic from 'next/dynamic';
import type { TabId } from '@/types';

const PageBuilderPanel = dynamic(() => import('@/components/pagebuilder/PageBuilderPanel'), { ssr: false });

const VALID_TABS: ReadonlyArray<TabId> = [
  'architecture', 'optimize', 'pageBuilder', 'citationMonitor', 'studio',
  'keywords', 'indexing', 'performance', 'funnel',
];

function Dashboard() {
  const { activeTab, setActiveTab, theme, toggleTheme } = useAppState();

  // Honor ?tab=funnel from the OAuth callback redirect.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const t = sp.get('tab');
    if (t && (VALID_TABS as readonly string[]).includes(t)) {
      setActiveTab(t as TabId);
    }
  }, [setActiveTab]);

  return (
    <div className="min-h-screen">
      <Header activeTab={activeTab} onTabChange={setActiveTab} theme={theme} onToggleTheme={toggleTheme} />
      <main className={activeTab === 'pageBuilder'
        ? 'overflow-hidden'
        : 'max-w-[1400px] mx-auto px-6 py-8'}>
        {activeTab === 'performance' && <PerformancePanel />}
        {activeTab === 'keywords' && <KeywordWarRoom />}
        {activeTab === 'architecture' && <ArchitecturePanel />}
        {activeTab === 'optimize' && <OptimizePanel />}
        {activeTab === 'citationMonitor' && <CitationMonitorPanel />}
        {activeTab === 'studio' && <ContentStudioPanel />}
        {activeTab === 'indexing' && <IndexingPanel />}
        {activeTab === 'pageBuilder' && <PageBuilderPanel />}
        {activeTab === 'funnel' && <FunnelDashboard />}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <Dashboard />
    </AppProvider>
  );
}
