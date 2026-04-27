// ═══════════════════════════════════════════════════
// GenerationHealth Command Center — Type Definitions
// ═══════════════════════════════════════════════════

// ── Performance Data (Weekly Tracking) ──
export interface WeeklyMetrics {
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
  keywords: Record<string, number>;
  aiCited: number;
  aiMentioned: number;
  aiNotFound: number;
}

// ── Daily Ads Metrics (Performance Panel) ──
export interface DailyAdsMetrics {
  date: string;
  spend: number;
  clickToCalls: number;
  formLeads: number;
  quoteRequests: number;
  costPerCall: number;
  costPerLead: number;
  cpa: number;
  budget: number;
}

// ── Google Business Profile ──
export interface GBPMetrics {
  date: string;
  calls: number;
  directions: number;
  websiteClicks: number;
  reviews: number;
}

// ── Search Console ──
export interface GSCData {
  topQueries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
  topPages: Array<{ page: string; clicks: number; impressions: number; ctr: number }>;
}

// ── Cluster / Content Architecture ──
export interface Post {
  name: string;
  slug?: string;
  status: 'done' | 'planned' | 'in-progress';
  publishDate?: string;
  hospital?: string;
}

export interface Cluster {
  id: string;
  name: string;
  type: 'pillar-cluster' | 'county-system';
  phase: number;
  status: 'done' | 'planned' | 'in-progress';
  pillar: string;
  seoValue: string;
  aeoValue: string;
  geoValue: string;
  posts: Post[];
  phase1Tasks: string[];
  templateUsed?: boolean;
  gameplanPriority?: number;
  gameplanNote?: string;
}

// ── Calendar ──
export interface CalendarTask {
  task: string;
  type: string;
  effort: string;
}

export interface CalendarWeek {
  week: number;
  dates: string;
  phase: number;
  focus: string;
  tasks: CalendarTask[];
  deliverables: string[];
}

// ── Conversion Rate Targets ──
export interface ConversionTargets {
  medicareClickToCall: { min: number; max: number };
  formPages: { min: number; max: number };
  landingPage: { min: number };
}

// ── Negative Keywords ──
export interface NegativeKeyword {
  term: string;
  addedDate: string;
  source: 'manual' | 'auto';
}

// ── Tab Navigation ──
export type TabId =
  | 'architecture'
  | 'optimize'
  | 'pageBuilder'
  | 'citationMonitor'
  | 'studio'
  | 'keywords'
  | 'indexing'
  | 'performance'
  | 'funnel';

export interface TabConfig {
  id: TabId;
  label: string;
  icon?: string;
}

// ── Trend Direction ──
export type TrendDirection = 'up' | 'down' | 'stable';

// ── Metric Card ──
export interface MetricCardData {
  label: string;
  value: string | number;
  previousValue?: string | number;
  trend: TrendDirection;
  format?: 'currency' | 'percent' | 'number';
  target?: number;
}

// ── Keyword War Room ──
export type KeywordGroup = 'medicare' | 'aca' | 'local';

export interface KeywordGroupConfig {
  id: KeywordGroup;
  label: string;
  color: string;
}

export interface TrackedKeyword {
  keyword: string;
  group: KeywordGroup;
  targetPage: string;
  targetSlug: string;
}

export interface KeywordHistoryEntry {
  date: string;
  pos: number;
  clicks: number;
  impr: number;
  ctr: number;
  variants?: number;
}

export type KeywordHistory = Record<string, KeywordHistoryEntry[]>;

export type KeywordNotes = Record<string, string>;
