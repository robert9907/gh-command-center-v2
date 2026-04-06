// ═══════════════════════════════════════════════════════════════════════════
// intentClassifier.ts
// ═══════════════════════════════════════════════════════════════════════════
// Scores QueryCandidates 1-10 for buyer intent and assigns a category.
//
// Scoring model (base = 5):
//   +3   query contains a high-intent keyword (broker, agent, help, enroll...)
//   +2   query contains a specific NC county OR city
//   +2   query contains an urgency signal (turning 65, deadline, lost coverage)
//   +1   query has upvotes > 20 (Reddit-only)
//   -1   query starts with question word AND has no high-intent keyword
//   clamped to [1, 10]
//
// Category detection runs in this order (first match wins):
//   1. Pattern match against specific-category keywords (ACA, savings,
//      decisions, authority)
//   2. Location check: specific county/city → county_city
//   3. Location check: mentions NC broadly → regional
//   4. Fallback → local_decisions
// ═══════════════════════════════════════════════════════════════════════════

import type {
  QueryCandidate,
  QueryCategory,
  IntentLevel,
} from './seedExpansion';

// ── High-intent signals ─────────────────────────────────────────────────────
//
// NOTE: these are matched with word boundaries (\b...\b), NOT raw
// substring, to avoid false positives like "enroll" matching "enrollment"
// or "help" matching "helpline". A query like "turning 65 enrollment
// period" must NOT score as high-intent just because "enroll" appears
// as a prefix inside "enrollment".

const HIGH_INTENT_KEYWORDS = [
  'broker',
  'brokers',
  'agent',
  'agents',
  'advisor',
  'advisors',
  'help',
  'enroll', // matches "enroll" only, not "enrollment"
  'sign up',
  'signup',
  'find',
  'finding',
  'need',
  'needs',
  'needed',
  'looking for',
  'hire',
  'consultation',
  'appointment',
  'near me',
];

const URGENCY_KEYWORDS = [
  'deadline',
  'turning 65',
  'turn 65',
  'lost coverage',
  'losing coverage',
  'retiring',
  'retirement',
  'need help now',
  'urgent',
  'immediately',
  'asap',
  'last day',
  'last chance',
  'cobra ending',
  'fired',
  'laid off',
  'new diagnosis',
  'just diagnosed',
  'sep',
  'special enrollment',
];

// ── NC geography — counties, cities, regions (kept strictly separate) ──────
//
// Keeping these in distinct arrays matters: "Wake" is both a county name
// and part of words like "awake" / "wakeup", and "Orange" / "Union" /
// "Wake" all need word-boundary matching to avoid false positives.
// The location-detection helpers below use \b...\b regexes.

export const NC_COUNTIES: string[] = [
  'Alamance', 'Alexander', 'Alleghany', 'Anson', 'Ashe', 'Avery', 'Beaufort',
  'Bertie', 'Bladen', 'Brunswick', 'Buncombe', 'Burke', 'Cabarrus', 'Caldwell',
  'Camden', 'Carteret', 'Caswell', 'Catawba', 'Chatham', 'Cherokee', 'Chowan',
  'Clay', 'Cleveland', 'Columbus', 'Craven', 'Cumberland', 'Currituck', 'Dare',
  'Davidson', 'Davie', 'Duplin', 'Durham', 'Edgecombe', 'Forsyth', 'Franklin',
  'Gaston', 'Gates', 'Graham', 'Granville', 'Greene', 'Guilford', 'Halifax',
  'Harnett', 'Haywood', 'Henderson', 'Hertford', 'Hoke', 'Hyde', 'Iredell',
  'Jackson', 'Johnston', 'Jones', 'Lee', 'Lenoir', 'Lincoln', 'Macon',
  'Madison', 'Martin', 'McDowell', 'Mecklenburg', 'Mitchell', 'Montgomery',
  'Moore', 'Nash', 'New Hanover', 'Northampton', 'Onslow', 'Orange', 'Pamlico',
  'Pasquotank', 'Pender', 'Perquimans', 'Person', 'Pitt', 'Polk', 'Randolph',
  'Richmond', 'Robeson', 'Rockingham', 'Rowan', 'Rutherford', 'Sampson',
  'Scotland', 'Stanly', 'Stokes', 'Surry', 'Swain', 'Transylvania', 'Tyrrell',
  'Union', 'Vance', 'Wake', 'Warren', 'Washington', 'Watauga', 'Wayne',
  'Wilkes', 'Wilson', 'Yadkin', 'Yancey',
];

// Cities → counties mapping. Only cities big enough to appear in real
// consumer queries. Extend as needed.
export const CITY_TO_COUNTY: Record<string, string> = {
  // Triangle
  'Raleigh': 'Wake',
  'Cary': 'Wake',
  'Apex': 'Wake',
  'Morrisville': 'Wake',
  'Wake Forest': 'Wake',
  'Holly Springs': 'Wake',
  'Fuquay-Varina': 'Wake',
  'Garner': 'Wake',
  'Durham': 'Durham',
  'Chapel Hill': 'Orange',
  'Carrboro': 'Orange',
  'Hillsborough': 'Orange',
  'Pittsboro': 'Chatham',
  'Siler City': 'Chatham',
  // Piedmont Triad
  'Greensboro': 'Guilford',
  'High Point': 'Guilford',
  'Winston-Salem': 'Forsyth',
  'Winston Salem': 'Forsyth',
  'Kernersville': 'Forsyth',
  'Burlington': 'Alamance',
  'Graham': 'Alamance', // note: also a county name, handled in city match
  // Charlotte Metro
  'Charlotte': 'Mecklenburg',
  'Matthews': 'Mecklenburg',
  'Huntersville': 'Mecklenburg',
  'Cornelius': 'Mecklenburg',
  'Concord': 'Cabarrus',
  'Kannapolis': 'Cabarrus',
  'Gastonia': 'Gaston',
  'Monroe': 'Union',
  // Mountains
  'Asheville': 'Buncombe',
  'Hendersonville': 'Henderson',
  'Boone': 'Watauga',
  // Coast
  'Wilmington': 'New Hanover',
  'Jacksonville': 'Onslow',
  'New Bern': 'Craven',
  'Greenville': 'Pitt',
  'Fayetteville': 'Cumberland',
};

export const NC_CITIES: string[] = Object.keys(CITY_TO_COUNTY);

export const NC_REGIONS: string[] = [
  'Triangle',
  'Research Triangle',
  'Piedmont Triad',
  'Piedmont',
  'Triad',
  'Charlotte Metro',
  'Charlotte Region',
  'Sandhills',
  'Outer Banks',
  'Crystal Coast',
  'Western NC',
  'Western North Carolina',
  'Eastern NC',
  'Eastern North Carolina',
  'Coastal NC',
];

// ── Category patterns (specific categories only) ────────────────────────────
//
// NOTE (per brief modification #6): county_city and regional are NOT in
// this array. They are derived from location detection AFTER pattern
// matching fails to find a specific category.

interface CategoryPattern {
  category: QueryCategory;
  patterns: RegExp[];
}

const CATEGORY_PATTERNS: CategoryPattern[] = [
  {
    category: 'aca',
    patterns: [
      /\baca\b/i,
      /\bobamacare\b/i,
      /\baffordable care act\b/i,
      /\bhealth(care)?\.gov\b/i,
      /\bmarketplace\b.*\b(health|insurance|plan)/i,
      /\bhealth insurance\b(?!.*\bmedicare\b)/i, // "health insurance" but not "medicare health insurance"
      /\bpremium tax credit\b/i,
      /\bsubsid/i,
    ],
  },
  {
    category: 'savings_programs',
    patterns: [
      /\bextra help\b/i,
      /\blis\b/i, // Low Income Subsidy
      /\blow[- ]income subsidy\b/i,
      /\bmedicare savings program\b/i,
      /\bmsp\b/i,
      /\bqmb\b/i, // Qualified Medicare Beneficiary
      /\bslmb\b/i,
      /\bmedicaid\b/i,
      /\bdual eligible\b/i,
      /\blis eligib/i,
    ],
  },
  {
    category: 'authority_builders',
    patterns: [
      /\badvantage vs (medigap|supplement)/i,
      /\bmedigap vs advantage\b/i,
      /\bsupplement vs advantage\b/i,
      /\bpart [abcd]\b.*\bexplain/i,
      /\bhow (does|do) medicare\b/i,
      /\bwhat is (a )?medicare\b/i,
      /\bmedicare basics\b/i,
      /\bplan [a-n] vs plan [a-n]\b/i,
      /\bcompare medicare\b/i,
      /\bmedicare guide\b/i,
    ],
  },
  {
    category: 'local_decisions',
    patterns: [
      /\bturning 65\b/i,
      /\bturn 65\b/i,
      /\benrollment (period|deadline)\b/i,
      /\baep\b/i, // Annual Enrollment Period
      /\bsep\b/i,
      /\bspecial enrollment\b/i,
      /\bopen enrollment\b/i,
      /\blost (my )?coverage\b/i,
      /\blosing (my )?coverage\b/i,
      /\bretir(e|ing|ement)\b/i,
      /\bpart d penalty\b/i,
      /\blate enrollment penalty\b/i,
      /\bcoverage gap\b/i,
      /\bdonut hole\b/i,
    ],
  },
];

// ── Location detection helpers (word-boundary safe) ────────────────────────

/**
 * Escape a string for safe use inside a RegExp.
 */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build a \b...\b regex for a location name. Handles multi-word names like
 * "New Hanover" and "Winston-Salem" correctly.
 */
function buildLocationRegex(name: string): RegExp {
  return new RegExp(`\\b${escapeRegex(name)}\\b`, 'i');
}

/**
 * Find the first NC county named in a query. Returns the canonical county
 * name (e.g. "Durham") or null. Uses word boundaries so "awake" doesn't
 * match "Wake".
 */
export function extractCounty(query: string): string | null {
  // City match takes precedence — it's more specific and maps back to county.
  for (const city of NC_CITIES) {
    if (buildLocationRegex(city).test(query)) {
      return CITY_TO_COUNTY[city];
    }
  }
  // Then direct county match.
  for (const county of NC_COUNTIES) {
    if (buildLocationRegex(county).test(query)) {
      return county;
    }
  }
  return null;
}

/**
 * True if the query mentions any NC region or contains "NC" / "North Carolina"
 * without naming a specific county or city.
 */
function mentionsNCBroadly(query: string): boolean {
  for (const region of NC_REGIONS) {
    if (buildLocationRegex(region).test(query)) return true;
  }
  if (/\b(nc|north carolina)\b/i.test(query)) return true;
  return false;
}

// ── Category detection ─────────────────────────────────────────────────────

/**
 * Assign a QueryCategory to a raw query string. Order matters:
 *   1. Specific category pattern match (aca / savings / authority / local_decisions)
 *   2. Specific county or city mentioned → county_city
 *   3. NC mentioned broadly → regional
 *   4. Fallback → local_decisions
 */
export function categorizeQuery(query: string): QueryCategory {
  if (!query) return 'local_decisions';

  // Step 1: specific category patterns.
  for (const { category, patterns } of CATEGORY_PATTERNS) {
    if (patterns.some((p) => p.test(query))) {
      return category;
    }
  }

  // Step 2: specific location → county_city.
  if (extractCounty(query)) {
    return 'county_city';
  }

  // Step 3: broad NC mention → regional.
  if (mentionsNCBroadly(query)) {
    return 'regional';
  }

  // Step 4: fallback.
  return 'local_decisions';
}

// ── Intent scoring ─────────────────────────────────────────────────────────

/**
 * True if the query contains any high-intent keyword, matched with word
 * boundaries so "enroll" doesn't match inside "enrollment".
 */
function hasHighIntentKeyword(lower: string): boolean {
  for (const kw of HIGH_INTENT_KEYWORDS) {
    // Multi-word phrases like "sign up" / "looking for" — use literal
    // substring match (the spaces already act as word boundaries).
    if (kw.includes(' ')) {
      if (lower.includes(kw)) return true;
      continue;
    }
    // Single words — use \b...\b boundary.
    const re = new RegExp(`\\b${kw}\\b`, 'i');
    if (re.test(lower)) return true;
  }
  return false;
}

/**
 * True if the query contains any urgency signal.
 */
function hasUrgencySignal(lower: string): boolean {
  return URGENCY_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * True if the query starts with a question word (how/what/when/why/where/which/who).
 */
function startsWithQuestionWord(lower: string): boolean {
  return /^(how|what|when|why|where|which|who|can|do|does|is|are|should)\b/.test(
    lower.trim()
  );
}

/**
 * Calculate intent score 1-10 for a query.
 *
 *   base   = 5
 *   +3     high-intent keyword
 *   +2     specific NC county or city mentioned
 *   +2     urgency signal
 *   +1     upvotes > 20
 *   -1     starts with question word AND lacks high-intent keyword
 *   clamp to [1, 10]
 */
export function calculateIntentScore(query: string, upvotes?: number): number {
  if (!query) return 1;
  const lower = query.toLowerCase();

  let score = 5;

  const highIntent = hasHighIntentKeyword(lower);
  if (highIntent) score += 3;

  // Location specificity: county or city (regions don't count — too vague).
  if (extractCounty(query)) score += 2;

  if (hasUrgencySignal(lower)) score += 2;

  if (typeof upvotes === 'number' && upvotes > 20) score += 1;

  // Question-word penalty: only if the query ALSO lacks a high-intent keyword.
  // "Where can I find a Medicare broker?" keeps its score because "broker"
  // is a high-intent keyword.
  if (startsWithQuestionWord(lower) && !highIntent) {
    score -= 1;
  }

  return Math.max(1, Math.min(10, score));
}

/**
 * Map a numeric score to a qualitative intent level.
 *   score >= 8  → high
 *   score >= 5  → medium
 *   score <  5  → low
 */
export function scoreToLevel(score: number): IntentLevel {
  if (score >= 8) return 'high';
  if (score >= 5) return 'medium';
  return 'low';
}

// ── Main entry point ───────────────────────────────────────────────────────

/**
 * Reclassify an array of QueryCandidates. Overwrites each candidate's
 * intent, intentScore, category, and (when detected) county fields.
 *
 * This is idempotent — safe to call on queries that have already been
 * classified. Non-destructive to other fields (citationStatus, competitors,
 * upvotes, dateAdded, id, source all preserved).
 */
export function classifyIntent(queries: QueryCandidate[]): QueryCandidate[] {
  return queries.map((q) => {
    const score = calculateIntentScore(q.query, q.upvotes);
    const level = scoreToLevel(score);
    const category = categorizeQuery(q.query);
    const county = extractCounty(q.query);

    return {
      ...q,
      intent: level,
      intentScore: score,
      category,
      ...(county ? { county } : {}),
    };
  });
}
