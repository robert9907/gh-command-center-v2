'use client';

import { TabId } from '@/types';

const tabMeta: Record<TabId, { title: string; description: string; icon: string }> = {
  performance: { title: 'Performance', description: '', icon: '📊' },
  architecture: {
    title: 'Architecture',
    description: 'Content clusters, pillar pages, and the full site map. Migrated from v1.',
    icon: '🏗️',
  },
  optimize: {
    title: 'Optimize',
    description: 'Page-by-page optimization tasks from the 500% Build.',
    icon: '🔧',
  },
  pageBuilder: {
    title: 'Page Builder',
    description: 'Template-driven page creation with HARD_RULES.js and assembleHTML.',
    icon: '📄',
  },
  citationMonitor: {
    title: 'Citation Monitor',
    description: 'AI citation scanning across Claude, ChatGPT, Perplexity, and Gemini.',
    icon: '🎯',
  },
  studio: {
    title: 'Content Studio',
    description: 'Social promotion, GMB posts, and content distribution pipeline.',
    icon: '📣',
  },
  keywords: {
    title: 'Keyword War Room',
    description: 'Track top 25 money keywords. GSC 28-day data, 12-week trends, position tracking.',
    icon: '🎯',
  },
  indexing: {
    title: 'Indexing',
    description: 'Track indexing status and submit pages to Google for crawling.',
    icon: '✏️',
  },
  funnel: {
    title: 'Plan Match Funnel',
    description: 'GA4 event-based funnel for the Plan Match flow with county breakdown.',
    icon: '📊',
  },
};

interface PlaceholderPanelProps {
  tabId: TabId;
}

export default function PlaceholderPanel({ tabId }: PlaceholderPanelProps) {
  const meta = tabMeta[tabId];

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="card p-12 text-center max-w-lg">
        <div className="text-5xl mb-4">{meta.icon}</div>
        <h2 className="font-display text-xl font-bold text-white mb-3">{meta.title}</h2>
        <p className="text-sm text-gh-text-muted mb-6">{meta.description}</p>
        <div className="badge-blue">
          Coming in Session 2+
        </div>
      </div>
    </div>
  );
}
