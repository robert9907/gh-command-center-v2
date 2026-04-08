import { TrackedKeyword, KeywordGroupConfig, KeywordHistory } from '@/types';

// ── Keyword Groups (from v1 source) ──
export const KEYWORD_GROUPS: KeywordGroupConfig[] = [
  { id: 'medicare', label: 'Medicare', color: '#4B9CD3' },
  { id: 'aca', label: 'ACA', color: '#16A34A' },
  { id: 'local', label: 'Local', color: '#F97316' },
];

// ── Default 25 Keywords (from live Command Center as of 4/3/2026) ──
export const DEFAULT_KEYWORDS: TrackedKeyword[] = [
  // Medicare (15)
  { keyword: 'free medicare quotes', group: 'medicare', targetPage: 'Free Medicare Quotes Online', targetSlug: '/free-medicare-quotes-online' },
  { keyword: 'medicare savings program north carolina', group: 'medicare', targetPage: 'NC Medicare Savings Programs', targetSlug: '/north-carolina-medicare-savings-programs-2026-eligibility-savings-guide' },
  { keyword: 'medicare part d north carolina', group: 'medicare', targetPage: 'Part D in NC', targetSlug: '/medicare-part-d-in-north-carolina' },
  { keyword: 'medicare quotes', group: 'medicare', targetPage: 'Free Medicare Quote', targetSlug: '/free-medicare-quote' },
  { keyword: 'medicare advantage changes 2026', group: 'medicare', targetPage: '2026 MA Changes', targetSlug: '/2026-medicare-advantage-changes-what-you-need-to-know-before-you-enroll' },
  { keyword: 'medicare part b required documents', group: 'medicare', targetPage: 'Medicare Part B Documents', targetSlug: '/what-documents-do-you-need-to-sign-up-for-medicare' },
  { keyword: 'medicare advantage plans north carolina', group: 'medicare', targetPage: 'Compare MA Plans NC', targetSlug: '/how-to-compare-medicare-advantage-plans-in-north-carolina' },
  { keyword: 'how to sign up for medicare part b', group: 'medicare', targetPage: 'Sign Up for Medicare A & B', targetSlug: '/how-to-sign-up-for-medicare-parts-a-and-b-2026-step-by-step-guide' },
  { keyword: 'medicare plans north carolina', group: 'medicare', targetPage: 'NC Medicare Plans 2026', targetSlug: '/medicare-plans-in-north-carolina' },
  { keyword: 'medigap plan g vs plan n', group: 'medicare', targetPage: 'Medigap G vs N', targetSlug: '/medigap-plans-in-north-carolina-plan-g-vs-plan-n' },
  { keyword: 'medicare enrollment north carolina', group: 'medicare', targetPage: 'NC Medicare Enrollment', targetSlug: '/medicare-enrollment-in-north-carolina-complete-guide-for-2026' },
  { keyword: 'medicare part d out of pocket cap 2026', group: 'medicare', targetPage: 'Part D OOP Cap', targetSlug: '/2026-medicare-part-d-2100-out-of-pocket-cap' },
  { keyword: 'medicare costs 2026', group: 'medicare', targetPage: 'NC Medicare Costs 2026', targetSlug: '/medicare-costs-north-carolina-2026-complete-guide' },
  { keyword: 'medicare supplement quotes', group: 'medicare', targetPage: 'Medigap Quotes NC', targetSlug: '/medigap-quotes-nc' },
  { keyword: 'medicare broker near me', group: 'medicare', targetPage: 'Health Insurance Brokers Near Me', targetSlug: '/health-insurance-brokers-near-me' },
  // ACA (5)
  { keyword: 'aca health insurance north carolina', group: 'aca', targetPage: 'NC ACA Plans', targetSlug: '/north-carolina-aca-health-insurance-plans' },
  { keyword: 'health insurance marketplace nc', group: 'aca', targetPage: 'NC Marketplace', targetSlug: '/north-carolina-health-insurance-marketplace' },
  { keyword: 'cheap health insurance north carolina', group: 'aca', targetPage: 'Cheap Insurance NC', targetSlug: '/cheap-health-insurance-north-carolina' },
  { keyword: 'health insurance broker near me', group: 'aca', targetPage: 'Brokers Near Me', targetSlug: '/health-insurance-brokers-near-me' },
  { keyword: 'self employed health insurance nc', group: 'aca', targetPage: 'Self-Employed NC', targetSlug: '/self-employed-health-insurance-north-carolina' },
  // Local (5)
  { keyword: 'medicare broker durham nc', group: 'local', targetPage: 'Medicare Broker Durham', targetSlug: '/medicare-broker-durham-nc' },
  { keyword: 'medicare agent near me north carolina', group: 'local', targetPage: 'Medicare Agent Near Me NC', targetSlug: '/medicare-agent-near-me-in-north-carolina' },
  { keyword: 'medicare help wake county nc', group: 'local', targetPage: 'Wake County Medicare', targetSlug: '/medicare-agents-in-wake-county-nc' },
  { keyword: 'medicare agents durham county', group: 'local', targetPage: 'Durham County Medicare', targetSlug: '/medicare-agents-in-durham-county-nc' },
  { keyword: 'insurance broker raleigh durham', group: 'local', targetPage: 'NC Brokers Guide', targetSlug: '/north-carolina-health-insurance-brokers-guide-2026' },
];

// ── Sample History (from screenshot: 4/3/2026 pull) ──
export const SAMPLE_KEYWORD_HISTORY: KeywordHistory = {
  'free medicare quotes': [
    { date: '2026-03-06', pos: 18.2, clicks: 3, impr: 28, ctr: 10.7 },
    { date: '2026-03-13', pos: 15.1, clicks: 5, impr: 33, ctr: 15.2 },
    { date: '2026-03-20', pos: 14.0, clicks: 6, impr: 37, ctr: 16.2 },
    { date: '2026-03-27', pos: 13.8, clicks: 6, impr: 39, ctr: 15.4 },
    { date: '2026-04-03', pos: 13.3, clicks: 7, impr: 41, ctr: 17.1 },
  ],
  'medicare savings program north carolina': [
    { date: '2026-03-20', pos: 24.1, clicks: 0, impr: 8, ctr: 0 },
    { date: '2026-03-27', pos: 23.4, clicks: 0, impr: 9, ctr: 0 },
    { date: '2026-04-03', pos: 22.7, clicks: 0, impr: 10, ctr: 0 },
  ],
  'medicare part d north carolina': [
    { date: '2026-03-13', pos: 28.2, clicks: 0, impr: 3, ctr: 0 },
    { date: '2026-03-20', pos: 28.5, clicks: 0, impr: 3, ctr: 0 },
    { date: '2026-03-27', pos: 30.1, clicks: 0, impr: 4, ctr: 0 },
    { date: '2026-04-03', pos: 29.5, clicks: 0, impr: 4, ctr: 0 },
  ],
  'medicare quotes': [
    { date: '2026-03-06', pos: 52.3, clicks: 4, impr: 210, ctr: 1.9 },
    { date: '2026-03-13', pos: 50.1, clicks: 5, impr: 245, ctr: 2.0 },
    { date: '2026-03-20', pos: 49.2, clicks: 6, impr: 267, ctr: 2.2 },
    { date: '2026-03-27', pos: 48.5, clicks: 6, impr: 280, ctr: 2.1 },
    { date: '2026-04-03', pos: 47.7, clicks: 7, impr: 288, ctr: 2.4 },
  ],
  'medicare advantage changes 2026': [
    { date: '2026-03-27', pos: 49.2, clicks: 0, impr: 2, ctr: 0 },
    { date: '2026-04-03', pos: 48.0, clicks: 0, impr: 2, ctr: 0 },
  ],
  'medicare part b required documents': [
    { date: '2026-03-27', pos: 57.1, clicks: 0, impr: 3, ctr: 0 },
    { date: '2026-04-03', pos: 55.5, clicks: 0, impr: 4, ctr: 0 },
  ],
  'medicare advantage plans north carolina': [
    { date: '2026-03-13', pos: 62.4, clicks: 0, impr: 95, ctr: 0 },
    { date: '2026-03-20', pos: 61.0, clicks: 0, impr: 108, ctr: 0 },
    { date: '2026-03-27', pos: 60.2, clicks: 0, impr: 118, ctr: 0 },
    { date: '2026-04-03', pos: 59.5, clicks: 0, impr: 122, ctr: 0 },
  ],
  'how to sign up for medicare part b': [
    { date: '2026-03-20', pos: 72.0, clicks: 0, impr: 38, ctr: 0 },
    { date: '2026-03-27', pos: 69.5, clicks: 0, impr: 42, ctr: 0 },
    { date: '2026-04-03', pos: 68.2, clicks: 0, impr: 45, ctr: 0 },
  ],
};
