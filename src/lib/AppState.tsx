'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { getFromStorage, saveToStorage } from '@/lib/utils';
import { scan67 } from '@/lib/scan67';
import type { TabId } from '@/types';

// ── AEO Pipeline Entry ──
export interface AeoPipelineEntry {
  id: string;
  queryId: string;
  query: string;
  title: string;
  slug: string;
  html?: string;
  deployedAt?: string;
  socialDone?: boolean;
  socialDoneAt?: string;
  indexedAt?: string;
}

// ── Page Status Tracker Entry ──
export interface PageTrackerEntry {
  id: string;
  slug: string;
  title: string;
  type: 'existing' | 'aeo';
  status: string;
  addedAt: string;
  updatedAt?: string;
}

// ── Daily KPI ──
export interface DailyKPI {
  date: string;
  adsSpend?: number;
  clickToCall?: number;
  gbpCalls?: number;
  formLeads?: number;
  cpa?: number;
}

// ── Performance Goals ──
export interface PerfGoals {
  impressions: number;
  clicks: number;
  calls: number;
}

// ── Projection Levers ──
export interface ProjLevers {
  pagesPublished: number;
  builderOptimized: number;
  backlinks: number;
  aeoImprovement: number;
  adsbudget: number;
}

export interface WeeklyPerfEntry {
  weekOf: string;
  users: number;
  organic: number;
  chatgpt: number;
  direct: number;
  social: number;
  impressions: number;
  clicks: number;
  calls: number;
  bookings: number;
  gbpViews: number;
}

// ── localStorage keys ──
const LS_PIPELINE = 'gh-cc-aeo-pipeline';
const LS_THEME = 'gh-cc-theme';
const LS_SAVED_HTML = 'gh-cc-saved-html';
const LS_FOCUS_CLUSTER = 'gh-cc-focus-cluster';
const LS_DAILY_KPI = 'gh-cc-dailykpi';
const LS_PERF_GOALS = 'gh-cc-perf-goals';
const LS_PROJ_LEVERS = 'gh-cc-proj-levers';
const LS_GSC_DATA = 'gh-cc-gsc-data';
const LS_AEO_SCORES = 'gh-cc-aeo-scores';
const LS_WEEKLY_PERF = 'gh-cc-weekly-perf';
const LS_GA4_TOKEN = 'gh-cc-ga4-token';
const LS_CM_ATTRIBUTIONS = 'gh-cc-cm-attributions';
const LS_PAGE_TRACKER = 'gh-cc-page-tracker';

// ── Context ──
interface AppState {
  // Tab navigation
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  navigateToTab: (tab: TabId, payload?: Record<string, string>) => void;
  navPayload: Record<string, string>;

  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // AEO Pipeline (shared: Citation Monitor → Content Studio → Indexing)
  aeoPipeline: AeoPipelineEntry[];
  setAeoPipeline: React.Dispatch<React.SetStateAction<AeoPipelineEntry[]>>;
  addToPipeline: (entry: AeoPipelineEntry) => void;

  // Focus cluster
  focusClusterId: string | null;
  setFocusClusterId: (id: string | null) => void;

  // Saved HTML per page
  savedHTML: Record<string, string>;
  setSavedHTML: React.Dispatch<React.SetStateAction<Record<string, string>>>;

  // fetchAndScanPage
  fetchAndScanPage: (slug: string) => Promise<{ success: boolean; html?: string; scan?: ReturnType<typeof scan67> }>;

  // Daily KPIs
  dailyKPIs: Record<string, DailyKPI>;
  setDailyKPI: (date: string, kpi: DailyKPI) => void;

  // Performance goals
  perfGoals: PerfGoals;
  setPerfGoals: React.Dispatch<React.SetStateAction<PerfGoals>>;

  // Projection levers
  projLevers: ProjLevers;
  setProjLevers: React.Dispatch<React.SetStateAction<ProjLevers>>;

  // GSC data
  gscData: Record<string, unknown> | null;
  setGscData: React.Dispatch<React.SetStateAction<Record<string, unknown> | null>>;

  // AEO scores
  aeoScores: Array<{ date: string; score: number }>;
  setAeoScores: React.Dispatch<React.SetStateAction<Array<{ date: string; score: number }>>>;

  // Editable weekly performance data
  weeklyPerfData: WeeklyPerfEntry[];
  addWeeklyPerf: (entry: WeeklyPerfEntry) => void;

  // GA4 token
  ga4Token: string | null;
  setGa4Token: React.Dispatch<React.SetStateAction<string | null>>;

  // Citation Monitor attributions
  cmAttributions: Record<string, string[]>;
  setCmAttributions: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;

  // Page Status Tracker
  pageTracker: PageTrackerEntry[];
  addPageToTracker: (entry: PageTrackerEntry) => void;
  updatePageStatus: (id: string, status: string) => void;
  removePageFromTracker: (id: string) => void;

  // Task completion state (shared across Architecture + Optimize)
  taskDone: Record<string, number>;
  taskIsDone: (id: string) => boolean;
  taskToggle: (id: string) => void;
  taskNotes: Record<string, string>;
  taskGetNote: (id: string) => string;
  taskSetNote: (id: string, value: string) => void;
  taskRecentId: string | null;
}

const AppContext = createContext<AppState | null>(null);

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be inside AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabId>('performance');
  const [navPayload, setNavPayload] = useState<Record<string, string>>({});
  const [theme, setTheme] = useState<'dark' | 'light'>(() => getFromStorage(LS_THEME, 'dark') as 'dark' | 'light');
  const [aeoPipeline, setAeoPipeline] = useState<AeoPipelineEntry[]>(() => getFromStorage(LS_PIPELINE, []));
  const [focusClusterId, setFocusClusterIdRaw] = useState<string | null>(() => getFromStorage(LS_FOCUS_CLUSTER, null));
  const [savedHTML, setSavedHTML] = useState<Record<string, string>>({});
  const [dailyKPIs, setDailyKPIs] = useState<Record<string, DailyKPI>>(() => getFromStorage(LS_DAILY_KPI, {}));
  const [perfGoals, setPerfGoals] = useState<PerfGoals>(() => getFromStorage(LS_PERF_GOALS, { impressions: 5000, clicks: 50, calls: 10 }));
  const [projLevers, setProjLevers] = useState<ProjLevers>(() => getFromStorage(LS_PROJ_LEVERS, { pagesPublished: 0, builderOptimized: 0, backlinks: 0, aeoImprovement: 0, adsbudget: 0 }));
  const [gscData, setGscData] = useState<Record<string, unknown> | null>(() => getFromStorage(LS_GSC_DATA, null));
  const [aeoScores, setAeoScores] = useState<Array<{ date: string; score: number }>>(() => getFromStorage(LS_AEO_SCORES, []));
  const [weeklyPerfData, setWeeklyPerfData] = useState<WeeklyPerfEntry[]>(() => getFromStorage(LS_WEEKLY_PERF, []));
  const [ga4Token, setGa4Token] = useState<string | null>(() => getFromStorage(LS_GA4_TOKEN, null));
  const [cmAttributions, setCmAttributions] = useState<Record<string, string[]>>(() => getFromStorage(LS_CM_ATTRIBUTIONS, {}));
  const [pageTracker, setPageTracker] = useState<PageTrackerEntry[]>(() => getFromStorage(LS_PAGE_TRACKER, []));

  // Task completion state (was in useTaskState hook — now shared via context)
  const [taskDone, setTaskDone] = useState<Record<string, number>>(() => getFromStorage('gh-cc-done', {}));
  const [taskNotes, setTaskNotes] = useState<Record<string, string>>(() => getFromStorage('gh-cc-notes', {}));
  const [taskRecentId, setTaskRecentId] = useState<string | null>(null);

  // Persist all shared state
  useEffect(() => { saveToStorage(LS_PIPELINE, aeoPipeline); }, [aeoPipeline]);
  useEffect(() => { saveToStorage(LS_THEME, theme); }, [theme]);
  useEffect(() => { saveToStorage(LS_FOCUS_CLUSTER, focusClusterId); }, [focusClusterId]);
  useEffect(() => { saveToStorage(LS_DAILY_KPI, dailyKPIs); }, [dailyKPIs]);
  useEffect(() => { saveToStorage(LS_PERF_GOALS, perfGoals); }, [perfGoals]);
  useEffect(() => { saveToStorage(LS_PROJ_LEVERS, projLevers); }, [projLevers]);
  useEffect(() => { if (gscData) saveToStorage(LS_GSC_DATA, gscData); }, [gscData]);
  useEffect(() => { saveToStorage(LS_AEO_SCORES, aeoScores); }, [aeoScores]);
  useEffect(() => { saveToStorage(LS_WEEKLY_PERF, weeklyPerfData); }, [weeklyPerfData]);
  useEffect(() => { if (ga4Token) saveToStorage(LS_GA4_TOKEN, ga4Token); }, [ga4Token]);
  useEffect(() => { saveToStorage(LS_CM_ATTRIBUTIONS, cmAttributions); }, [cmAttributions]);
  useEffect(() => { saveToStorage(LS_PAGE_TRACKER, pageTracker); }, [pageTracker]);
  useEffect(() => { saveToStorage('gh-cc-done', taskDone); }, [taskDone]);
  useEffect(() => { saveToStorage('gh-cc-notes', taskNotes); }, [taskNotes]);

  // Theme class on body
  useEffect(() => {
    document.body.classList.toggle('light', theme === 'light');
    document.body.classList.toggle('dark', theme === 'dark');
    // Clean up old bloated savedHTML from localStorage
    try { localStorage.removeItem('gh-cc-saved-html'); } catch { /* ignore */ }
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme((t) => t === 'dark' ? 'light' : 'dark'), []);

  const navigateToTab = useCallback((tab: TabId, payload?: Record<string, string>) => {
    if (payload) setNavPayload(payload);
    setActiveTab(tab);
  }, []);

  const addToPipeline = useCallback((entry: AeoPipelineEntry) => {
    setAeoPipeline((prev) => {
      if (prev.find((e) => e.id === entry.id)) return prev;
      return [...prev, entry];
    });
  }, []);

  const setFocusClusterId = useCallback((id: string | null) => setFocusClusterIdRaw(id), []);

  const setDailyKPI = useCallback((date: string, kpi: DailyKPI) => {
    setDailyKPIs((prev) => ({ ...prev, [date]: kpi }));
  }, []);

  const addWeeklyPerf = useCallback((entry: WeeklyPerfEntry) => {
    setWeeklyPerfData((prev) => {
      const exists = prev.find((e) => e.weekOf === entry.weekOf);
      if (exists) return prev.map((e) => e.weekOf === entry.weekOf ? entry : e);
      return [...prev, entry].sort((a, b) => a.weekOf.localeCompare(b.weekOf));
    });
  }, []);

  // fetchAndScanPage — shared function used by Optimize + Page Builder
  const fetchAndScanPage = useCallback(async (slug: string) => {
    const cleanSlug = slug.replace(/^\/+|\/+$/g, '');
    const pageUrl = `https://generationhealth.me/${cleanSlug}/`;

    // Strategy 1: Direct fetch (works if WP has CORS headers)
    try {
      const resp = await fetch(pageUrl, { mode: 'cors' });
      if (resp.ok) {
        const html = await resp.text();
        if (html.length > 500) {
          setSavedHTML((prev) => ({ ...prev, [cleanSlug]: html }));
          const result = scan67(html);
          return { success: true, html, scan: result };
        }
      }
    } catch { /* CORS blocked — expected */ }

    // Strategy 2: corsproxy.io (reliable CORS proxy)
    try {
      const proxyResp = await fetch(`https://corsproxy.io/?${encodeURIComponent(pageUrl)}`);
      if (proxyResp.ok) {
        const html = await proxyResp.text();
        if (html.length > 500) {
          setSavedHTML((prev) => ({ ...prev, [cleanSlug]: html }));
          const result = scan67(html);
          return { success: true, html, scan: result };
        }
      }
    } catch { /* try next */ }

    // Strategy 3: allorigins fallback
    try {
      const r = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(pageUrl)}`);
      if (r.ok) {
        const html = await r.text();
        if (html.length > 500) {
          setSavedHTML((prev) => ({ ...prev, [cleanSlug]: html }));
          const result = scan67(html);
          return { success: true, html, scan: result };
        }
      }
    } catch { /* try next */ }

    // Strategy 4: WP REST API (content only — last resort)
    try {
      const wpResp = await fetch(`https://generationhealth.me/wp-json/wp/v2/pages?slug=${encodeURIComponent(cleanSlug)}&_fields=content`);
      if (wpResp.ok) {
        const wpPages = await wpResp.json();
        if (Array.isArray(wpPages) && wpPages.length > 0 && wpPages[0]?.content?.rendered) {
          const html = wpPages[0].content.rendered;
          setSavedHTML((prev) => ({ ...prev, [cleanSlug]: html }));
          const result = scan67(html);
          return { success: true, html, scan: result };
        }
      }
    } catch { /* exhausted */ }

    console.warn(`[fetchAndScanPage] All strategies failed for: ${cleanSlug}`);
    return { success: false };
  }, []);

  // Page tracker callbacks
  const addPageToTracker = useCallback((entry: PageTrackerEntry) => {
    setPageTracker((prev) => {
      if (prev.find((e) => e.id === entry.id)) return prev;
      return [...prev, entry];
    });
  }, []);

  const updatePageStatus = useCallback((id: string, status: string) => {
    setPageTracker((prev) => prev.map((e) => e.id === id ? { ...e, status, updatedAt: new Date().toISOString() } : e));
  }, []);

  const removePageFromTracker = useCallback((id: string) => {
    setPageTracker((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // Task state callbacks
  const taskIsDone = useCallback((id: string) => !!taskDone[id], [taskDone]);
  const taskToggle = useCallback((id: string) => {
    setTaskDone((prev) => {
      const next = { ...prev };
      if (next[id]) { delete next[id]; } else { next[id] = Date.now(); }
      return next;
    });
    setTaskRecentId(id);
    setTimeout(() => setTaskRecentId(null), 1200);
  }, []);
  const taskGetNote = useCallback((id: string) => taskNotes[id] || '', [taskNotes]);
  const taskSetNote = useCallback((id: string, value: string) => {
    setTaskNotes((prev) => ({ ...prev, [id]: value }));
  }, []);

  return (
    <AppContext.Provider value={{
      activeTab, setActiveTab, navigateToTab, navPayload,
      theme, toggleTheme,
      aeoPipeline, setAeoPipeline, addToPipeline,
      focusClusterId, setFocusClusterId,
      savedHTML, setSavedHTML,
      fetchAndScanPage,
      dailyKPIs, setDailyKPI,
      perfGoals, setPerfGoals,
      projLevers, setProjLevers,
      gscData, setGscData,
      aeoScores, setAeoScores,
      weeklyPerfData, addWeeklyPerf,
      ga4Token, setGa4Token,
      cmAttributions, setCmAttributions,
      pageTracker, addPageToTracker, updatePageStatus, removePageFromTracker,
      taskDone, taskIsDone, taskToggle, taskNotes, taskGetNote, taskSetNote, taskRecentId,
    }}>
      {children}
    </AppContext.Provider>
  );
}
