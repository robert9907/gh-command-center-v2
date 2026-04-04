'use client';

import { useState } from 'react';
import { AppProvider, useAppState } from '@/lib/AppState';
import Header from '@/components/layout/Header';
import PerformancePanel from '@/components/performance/PerformancePanel';
import KeywordWarRoom from '@/components/keywords/KeywordWarRoom';
import ArchitecturePanel from '@/components/architecture/ArchitecturePanel';
import OptimizePanel from '@/components/optimize/OptimizePanel';
import CitationMonitorPanel from '@/components/citation/CitationMonitorPanel';
import ContentStudioPanel from '@/components/studio/ContentStudioPanel';
import IndexingPanel from '@/components/indexing/IndexingPanel';
import PageBuilderPanel from '@/components/pagebuilder/PageBuilderPanel';
import PageTrackerPanel from '@/components/shared/PageTrackerPanel';

function Dashboard() {
  const { activeTab, setActiveTab, theme, toggleTheme, pageTracker } = useAppState();
  const [trackerOpen, setTrackerOpen] = useState(false);
  const actionableCount = pageTracker.filter((p) => p.status !== 'done' && p.status !== 'cited' && !(p.type === 'existing' && p.status === 'indexed')).length;

  return (
    <div className="min-h-screen">
      <Header activeTab={activeTab} onTabChange={setActiveTab} theme={theme} onToggleTheme={toggleTheme} onTrackerToggle={() => setTrackerOpen(!trackerOpen)} trackerCount={actionableCount} />
      <main className="max-w-[1400px] mx-auto px-6 py-8">
        {activeTab === 'performance' && <PerformancePanel />}
        {activeTab === 'keywords' && <KeywordWarRoom />}
        {activeTab === 'architecture' && <ArchitecturePanel />}
        {activeTab === 'optimize' && <OptimizePanel />}
        {activeTab === 'citationMonitor' && <CitationMonitorPanel />}
        {activeTab === 'studio' && <ContentStudioPanel />}
        {activeTab === 'indexing' && <IndexingPanel />}
        {activeTab === 'pageBuilder' && <PageBuilderPanel />}
      </main>
      <PageTrackerPanel open={trackerOpen} onClose={() => setTrackerOpen(false)} />
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
