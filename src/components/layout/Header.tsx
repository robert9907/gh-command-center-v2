'use client';

import { useState } from 'react';
import { Sun, Moon, Bell } from 'lucide-react';
import { TabId, TabConfig } from '@/types';

const tabs: TabConfig[] = [
  { id: 'architecture', label: 'Architecture' },
  { id: 'optimize', label: 'Optimize' },
  { id: 'pageBuilder', label: 'Page Builder', icon: '📄' },
  { id: 'citationMonitor', label: 'Citation Monitor', icon: '🎯' },
  { id: 'studio', label: 'Content Studio', icon: '📣' },
  { id: 'keywords', label: 'Keyword War Room' },
  { id: 'indexing', label: 'Indexing', icon: '✏️' },
  { id: 'performance', label: 'Performance' },
  { id: 'funnel', label: 'Funnel', icon: '📊' },
];

interface HeaderProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export default function Header({ activeTab, onTabChange, theme, onToggleTheme }: HeaderProps) {
  const [bellOpen, setBellOpen] = useState(false);
  const isDark = theme === 'dark';

  return (
    <header className="border-b border-white/[0.08] bg-white/[0.02] backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-6 py-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-shrink-0">
            <div className="text-[10px] font-extrabold tracking-[0.15em] text-nc-gold uppercase mb-1">GenerationHealth.me</div>
            <h1 className="font-display text-2xl font-bold text-white leading-none">Command Center</h1>
            <p className="text-xs text-gh-text-muted mt-1">SEO + AEO + GEO · v2.0 · Next.js</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <nav className="flex gap-1 bg-white/[0.04] rounded-2xl p-1.5 flex-wrap">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { onTabChange(tab.id); setBellOpen(false); }}
                  className={activeTab === tab.id ? 'nav-tab-active' : 'nav-tab-inactive'}
                >
                  {tab.icon && <span className="mr-1.5 text-xs">{tab.icon}</span>}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </nav>
            <button onClick={onToggleTheme} className="p-2 rounded-xl bg-white/[0.04] text-gh-text-muted hover:bg-white/[0.08] transition-colors" title={isDark ? 'Light mode' : 'Dark mode'}>
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={() => setBellOpen(!bellOpen)} className="p-2 rounded-xl bg-white/[0.04] text-gh-text-muted hover:bg-white/[0.08] transition-colors relative">
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
