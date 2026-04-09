// ═══════════════════════════════════════════════════════════════════════════
// queryDeduplication.ts
// ═══════════════════════════════════════════════════════════════════════════
// Removes near-duplicate QueryCandidates. Two queries are considered
// duplicates if their normalized forms are identical.
//
// Normalization steps:
//   1. Lowercase
//   2. Strip punctuation
//   3. Expand common abbreviations (NC → north carolina)
//   4. Remove stopwords (the, a, in, at, of, for, to, ...)
//   5. Sort remaining tokens alphabetically
//
// So these all collapse to the same key:
//   "Medicare broker Durham NC"
//   "Medicare broker in Durham, North Carolina"
//   "Durham NC Medicare broker"
//   "the Medicare broker Durham NC"
//
// When duplicates are found, the candidate with the highest intentScore
// wins. Ties are broken by most recent dateAdded.
// ═══════════════════════════════════════════════════════════════════════════

import type { QueryCandidate } from './seedExpansion';

const STOPWORDS = new Set([
  'a', 'an', 'the',
  'in', 'on', 'at', 'of', 'for', 'to', 'from', 'with', 'by', 'into',
  'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'and', 'or', 'but',
  'my', 'your', 'our', 'their', 'his', 'her',
  'me', 'i', 'you', 'we', 'they',
  'this', 'that', 'these', 'those',
  'do', 'does', 'did',
  'can', 'could', 'would', 'should', 'will',
  'near', // "near Durham" and "Durham" should dedupe
]);

// Abbreviation expansion — applied BEFORE stopword removal.
const ABBREVIATIONS: Array<[RegExp, string]> = [
  [/\bnc\b/gi, 'north carolina'],
  [/\bn\.c\.\b/gi, 'north carolina'],
  [/\bn c\b/gi, 'north carolina'],
  [/\bmapd\b/gi, 'medicare advantage prescription drug'],
  [/\bma\b(?=\s|$)/gi, 'medicare advantage'], // "MA plan" → "medicare advantage plan"
  [/\bpdp\b/gi, 'prescription drug plan'],
  [/\baep\b/gi, 'annual enrollment period'],
  [/\bsep\b/gi, 'special enrollment period'],
  [/\bicep\b/gi, 'initial coverage election period'],
  [/\bo ?e ?p\b/gi, 'open enrollment period'],
  [/\blis\b/gi, 'low income subsidy'],
  [/\bmsp\b/gi, 'medicare savings program'],
  [/\bqmb\b/gi, 'qualified medicare beneficiary'],
  [/\bslmb\b/gi, 'specified low income medicare beneficiary'],
];

/**
 * Normalize a query string to a canonical form for duplicate detection.
 * Exported for testing and for any caller that wants to check membership
 * against an already-normalized set.
 */
export function normalizeQuery(query: string): string {
  if (!query) return '';

  let s = query.toLowerCase();

  // Expand abbreviations before punctuation strip (so "n.c." works).
  for (const [pattern, replacement] of ABBREVIATIONS) {
    s = s.replace(pattern, replacement);
  }

  // Strip punctuation — keep only letters, digits, and whitespace.
  s = s.replace(/[^a-zA-Z0-9\s]/g, ' ');

  // Collapse whitespace.
  s = s.replace(/\s+/g, ' ').trim();

  // Tokenize, drop stopwords, sort alphabetically.
  const tokens = s
    .split(' ')
    .filter((t) => t.length > 0 && !STOPWORDS.has(t));

  tokens.sort();

  return tokens.join(' ');
}

/**
 * Pick the "winner" between two candidate queries that normalize to the
 * same key. Higher intentScore wins; ties broken by most recent dateAdded.
 */
function pickWinner(a: QueryCandidate, b: QueryCandidate): QueryCandidate {
  if (a.intentScore !== b.intentScore) {
    return a.intentScore > b.intentScore ? a : b;
  }
  // Tie on score — prefer most recent.
  const aDate = Date.parse(a.dateAdded) || 0;
  const bDate = Date.parse(b.dateAdded) || 0;
  return bDate > aDate ? b : a;
}

/**
 * Merge non-winner metadata INTO the winner. Specifically:
 *   - competitors arrays are unioned
 *   - if the loser has upvotes and the winner doesn't, copy them
 *   - citationStatus: keep whichever has more non-null values
 */
function mergeMetadata(
  winner: QueryCandidate,
  loser: QueryCandidate
): QueryCandidate {
  // Union competitors.
  const compSet = new Set<string>([...winner.competitors, ...loser.competitors]);

  // Copy upvotes if winner doesn't have them.
  const upvotes =
    typeof winner.upvotes === 'number'
      ? winner.upvotes
      : loser.upvotes;

  // Pick citation status with more tested LLMs.
  const countTested = (s: QueryCandidate['citationStatus']) =>
    Object.values(s).filter((v) => v !== null).length;
  const citationStatus =
    countTested(winner.citationStatus) >= countTested(loser.citationStatus)
      ? winner.citationStatus
      : loser.citationStatus;

  return {
    ...winner,
    competitors: Array.from(compSet),
    ...(upvotes !== undefined ? { upvotes } : {}),
    citationStatus,
  };
}

/**
 * Remove near-duplicate queries from an array. Groups by normalized key,
 * keeps the highest-intent candidate from each group, and merges
 * competitor/upvote/citation metadata from the losers into the winner.
 *
 * Returns candidates in the same order their winners first appeared in
 * the input (stable dedup).
 */
export function deduplicateQueries(
  queries: QueryCandidate[]
): QueryCandidate[] {
  const groups = new Map<string, QueryCandidate>();
  const orderKeys: string[] = [];

  for (const q of queries) {
    const key = normalizeQuery(q.query);
    if (!key) continue; // skip empty-after-normalize

    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, q);
      orderKeys.push(key);
    } else {
      const winner = pickWinner(existing, q);
      const loser = winner === existing ? q : existing;
      groups.set(key, mergeMetadata(winner, loser));
    }
  }

  return orderKeys.map((k) => groups.get(k)!);
}
