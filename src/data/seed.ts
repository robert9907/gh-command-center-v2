import { WeeklyMetrics, DailyAdsMetrics, ConversionTargets } from '@/types';

// ── Weekly Performance Data (from v1 Command Center) ──
export const perfData: WeeklyMetrics[] = [
  { weekOf: "2025-08-18", users: 5, organic: 1, chatgpt: 2, direct: 2, social: 0, impressions: 120, clicks: 6, calls: 0, bookings: 0, gbpViews: 0, keywords: {}, aiCited: 0, aiMentioned: 0, aiNotFound: 0 },
  { weekOf: "2025-09-01", users: 4, organic: 1, chatgpt: 1, direct: 2, social: 0, impressions: 89, clicks: 11, calls: 0, bookings: 0, gbpViews: 0, keywords: {}, aiCited: 0, aiMentioned: 0, aiNotFound: 0 },
  { weekOf: "2025-09-08", users: 5, organic: 1, chatgpt: 2, direct: 2, social: 0, impressions: 125, clicks: 11, calls: 0, bookings: 0, gbpViews: 0, keywords: {}, aiCited: 0, aiMentioned: 0, aiNotFound: 0 },
  { weekOf: "2025-09-22", users: 6, organic: 1, chatgpt: 2, direct: 3, social: 0, impressions: 150, clicks: 11, calls: 0, bookings: 0, gbpViews: 0, keywords: {}, aiCited: 0, aiMentioned: 0, aiNotFound: 0 },
  { weekOf: "2025-10-06", users: 6, organic: 1, chatgpt: 2, direct: 3, social: 0, impressions: 138, clicks: 7, calls: 0, bookings: 0, gbpViews: 0, keywords: {}, aiCited: 0, aiMentioned: 0, aiNotFound: 0 },
  { weekOf: "2025-10-13", users: 12, organic: 3, chatgpt: 4, direct: 6, social: 1, impressions: 299, clicks: 9, calls: 0, bookings: 0, gbpViews: 0, keywords: {}, aiCited: 0, aiMentioned: 0, aiNotFound: 0 },
  { weekOf: "2025-10-27", users: 31, organic: 7, chatgpt: 10, direct: 15, social: 1, impressions: 777, clicks: 7, calls: 0, bookings: 0, gbpViews: 0, keywords: {}, aiCited: 0, aiMentioned: 0, aiNotFound: 0 },
  { weekOf: "2025-11-03", users: 34, organic: 8, chatgpt: 11, direct: 16, social: 1, impressions: 837, clicks: 13, calls: 0, bookings: 0, gbpViews: 0, keywords: {}, aiCited: 0, aiMentioned: 0, aiNotFound: 0 },
  { weekOf: "2025-11-10", users: 32, organic: 8, chatgpt: 11, direct: 15, social: 1, impressions: 804, clicks: 22, calls: 0, bookings: 0, gbpViews: 0, keywords: {}, aiCited: 0, aiMentioned: 0, aiNotFound: 0 },
  { weekOf: "2025-11-17", users: 53, organic: 13, chatgpt: 17, direct: 25, social: 2, impressions: 1317, clicks: 5, calls: 0, bookings: 0, gbpViews: 0, keywords: {}, aiCited: 0, aiMentioned: 0, aiNotFound: 0 },
  { weekOf: "2025-11-24", users: 73, organic: 17, chatgpt: 24, direct: 35, social: 3, impressions: 1806, clicks: 19, calls: 0, bookings: 0, gbpViews: 0, keywords: {}, aiCited: 0, aiMentioned: 0, aiNotFound: 0 },
  { weekOf: "2025-12-01", users: 58, organic: 14, chatgpt: 19, direct: 27, social: 2, impressions: 1434, clicks: 21, calls: 0, bookings: 0, gbpViews: 0, keywords: {}, aiCited: 0, aiMentioned: 0, aiNotFound: 0 },
  { weekOf: "2025-12-08", users: 64, organic: 15, chatgpt: 21, direct: 30, social: 3, impressions: 1581, clicks: 12, calls: 0, bookings: 0, gbpViews: 0, keywords: {}, aiCited: 0, aiMentioned: 0, aiNotFound: 0 },
  { weekOf: "2025-12-15", users: 64, organic: 15, chatgpt: 21, direct: 30, social: 3, impressions: 1581, clicks: 19, calls: 0, bookings: 0, gbpViews: 0, keywords: {}, aiCited: 0, aiMentioned: 0, aiNotFound: 0 },
  { weekOf: "2025-12-22", users: 85, organic: 20, chatgpt: 28, direct: 40, social: 4, impressions: 2113, clicks: 7, calls: 0, bookings: 0, gbpViews: 0, keywords: {}, aiCited: 0, aiMentioned: 0, aiNotFound: 0 },
  { weekOf: "2025-12-29", users: 97, organic: 23, chatgpt: 32, direct: 46, social: 4, impressions: 2418, clicks: 13, calls: 0, bookings: 0, gbpViews: 0, keywords: {}, aiCited: 0, aiMentioned: 0, aiNotFound: 0 },
  { weekOf: "2026-01-05", users: 119, organic: 29, chatgpt: 39, direct: 57, social: 5, impressions: 2962, clicks: 22, calls: 0, bookings: 0, gbpViews: 0, keywords: {}, aiCited: 0, aiMentioned: 0, aiNotFound: 0 },
  { weekOf: "2026-01-12", users: 126, organic: 30, chatgpt: 41, direct: 60, social: 5, impressions: 3120, clicks: 20, calls: 0, bookings: 0, gbpViews: 0, keywords: {}, aiCited: 0, aiMentioned: 0, aiNotFound: 0 },
  { weekOf: "2026-01-19", users: 139, organic: 33, chatgpt: 46, direct: 66, social: 6, impressions: 3458, clicks: 23, calls: 0, bookings: 0, gbpViews: 0, keywords: {}, aiCited: 0, aiMentioned: 0, aiNotFound: 0 },
  { weekOf: "2026-01-26", users: 123, organic: 29, chatgpt: 40, direct: 59, social: 5, impressions: 3060, clicks: 17, calls: 0, bookings: 0, gbpViews: 0, keywords: {}, aiCited: 0, aiMentioned: 0, aiNotFound: 0 },
  { weekOf: "2026-02-02", users: 128, organic: 31, chatgpt: 42, direct: 61, social: 5, impressions: 3189, clicks: 26, calls: 0, bookings: 0, gbpViews: 0, keywords: {}, aiCited: 0, aiMentioned: 0, aiNotFound: 0 },
  { weekOf: "2026-02-09", users: 93, organic: 22, chatgpt: 31, direct: 44, social: 4, impressions: 2321, clicks: 41, calls: 0, bookings: 0, gbpViews: 0, keywords: {}, aiCited: 0, aiMentioned: 0, aiNotFound: 0 },
];

// ── Sample Daily Ads Data (manually entered / placeholder) ──
export const sampleAdsData: DailyAdsMetrics[] = [
  { date: "2026-04-01", spend: 22.50, clickToCalls: 3, formLeads: 1, quoteRequests: 0, costPerCall: 7.50, costPerLead: 22.50, cpa: 5.63, budget: 25 },
  { date: "2026-04-02", spend: 24.80, clickToCalls: 4, formLeads: 2, quoteRequests: 1, costPerCall: 6.20, costPerLead: 12.40, cpa: 3.54, budget: 25 },
  { date: "2026-04-03", spend: 18.30, clickToCalls: 2, formLeads: 0, quoteRequests: 0, costPerCall: 9.15, costPerLead: 0, cpa: 9.15, budget: 25 },
];

// ── Conversion Rate Targets ──
export const conversionTargets: ConversionTargets = {
  medicareClickToCall: { min: 15, max: 25 },
  formPages: { min: 8, max: 15 },
  landingPage: { min: 5 },
};

// ── Negative Keywords (from project instructions) ──
export const defaultNegativeKeywords = [
  'jobs', 'free insurance', 'medicaid', 'cheap quotes',
  'call center', 'agent equity group', 'training', 'license lookup',
];
