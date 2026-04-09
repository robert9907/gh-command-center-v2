'use client';
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

function Dashboard() {
  const { activeTab, setActiveTab, theme, toggleTheme } = useAppState();
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
