// ═══════════════════════════════════════════════════
// Architecture + Optimize shared config data
// Extracted from v1 Command Center source
// ═══════════════════════════════════════════════════

export interface Phase {
  id: number;
  label: string;
  weeks: string;
  color: string;
  active: boolean;
}

export interface StdTask {
  id: string;
  label: string;
}

export interface OptItem {
  id: string;
  label: string;
  cat: string;
}

export const PHASES: Phase[] = [
  { id: 1, label: 'Phase 1 — Foundation', weeks: 'Weeks 1-3', color: '#0D9488', active: true },
  { id: 2, label: 'Phase 2 — Content Expansion', weeks: 'Weeks 4-7', color: '#2563EB', active: false },
  { id: 3, label: 'Phase 3 — Authority & AI Visibility', weeks: 'Weeks 8-12', color: '#7C3AED', active: false },
];

export const STD_TASKS: StdTask[] = [
  { id: 'instant-answer', label: 'Add instant-answer block (first 100 words)' },
  { id: 'faq-schema', label: 'Add FAQ schema (JSON-LD)' },
  { id: 'comparison-table', label: 'Add structured comparison table' },
  { id: 'definition-format', label: 'Definition-style formatting for key terms' },
  { id: 'source-citations', label: 'Add source citations (Medicare.gov, CMS.gov)' },
  { id: 'authority-signals', label: 'Author byline, updated date, NAP, license' },
  { id: 'charts-visuals', label: 'Add charts/visual data' },
  { id: 'branded-graphics', label: 'Add branded graphics (not stock)' },
  { id: 'fb-promotion', label: 'Facebook promotion' },
  { id: 'gmb-post', label: 'Google Business Profile post' },
];

export const OPT_ITEMS: OptItem[] = [
  { id: 'opt-instant', label: 'Instant answer block (first 100 words)', cat: 'AEO' },
  { id: 'opt-faq', label: 'FAQ schema (JSON-LD)', cat: 'AEO' },
  { id: 'opt-citations', label: 'Source citations (Medicare.gov, CMS.gov)', cat: 'E-E-A-T' },
  { id: 'opt-author', label: 'Author byline + updated date', cat: 'E-E-A-T' },
  { id: 'opt-charts', label: 'Charts/visuals added', cat: 'Content' },
  { id: 'opt-graphics', label: 'Branded graphics (not stock)', cat: 'Content' },
  { id: 'opt-tables', label: 'Comparison tables', cat: 'AEO' },
  { id: 'opt-fb', label: 'Facebook promoted', cat: 'Promo' },
  { id: 'opt-gmb', label: 'GMB post created', cat: 'Promo' },
  { id: 'opt-fresh', label: '2026 freshness update done', cat: 'GEO' },
  { id: 'opt-junk', label: 'No orphaned content after footer', cat: 'Clean' },
  { id: 'opt-functional', label: 'No CSS click-blocking issues', cat: 'Functional' },
];

export const PRIORITY_ORDER = ['Very High', 'High', 'Medium-High', 'Medium'];

export function getPriorityScore(cluster: { seoValue: string; aeoValue: string; geoValue: string }): number {
  const seo = PRIORITY_ORDER.indexOf(cluster.seoValue);
  const aeo = PRIORITY_ORDER.indexOf(cluster.aeoValue);
  const geo = PRIORITY_ORDER.indexOf(cluster.geoValue);
  return (seo === -1 ? 99 : seo) + (aeo === -1 ? 99 : aeo) + (geo === -1 ? 99 : geo);
}

export const CAT_COLORS: Record<string, string> = {
  'AEO': '#60A5FA',
  'E-E-A-T': '#FFC72C',
  'Content': '#2DD4BF',
  'GEO': '#A78BFA',
  'Promo': '#FB923C',
  'Clean': '#6B7B8D',
  'Functional': '#6B7B8D',
  'SEO': '#34D399',
};
