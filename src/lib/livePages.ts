/**
 * livePages.ts
 *
 * Registry of county AEO pages confirmed LIVE on WordPress.
 *
 * PURPOSE: Prevents neighboring counties block from linking to 404s.
 * Each entry maps a county slug to its exact live URL.
 * Counties not in this map render as plain text — no broken links.
 *
 * WHY A MAP (not a Set + formula):
 * County URLs are not perfectly consistent. Some follow
 * /medicare-agents-in-{slug}-county-nc/ but others were published
 * with different patterns (e.g. Mecklenburg uses -north-carolina
 * instead of -county-nc). The map stores the exact URL per county.
 *
 * HOW TO UPDATE: When you publish a new county page on WordPress,
 * add one entry: 'slug' => 'exact-url-path'
 * Copy the URL directly from the browser bar after publishing.
 *
 * Last updated: April 7, 2026
 */

export const LIVE_COUNTY_URLS: ReadonlyMap<string, string> = new Map([
  // slug                    exact live URL
  ['durham',    'https://generationhealth.me/medicare-agents-in-durham-county-nc/'],
  ['wake',      'https://generationhealth.me/medicare-agents-in-wake-county-nc/'],
  ['orange',    'https://generationhealth.me/medicare-agents-in-orange-county-nc/'],
  ['guilford',  'https://generationhealth.me/medicare-agents-in-guilford-county-nc/'],
  ['forsyth',   'https://generationhealth.me/medicare-agents-in-forsyth-county-nc/'],
  ['buncombe',  'https://generationhealth.me/medicare-agents-in-buncombe-county-nc/'],
  ['mecklenburg', 'https://generationhealth.me/medicare-agents-in-mecklenburg-north-carolina/'],
  // ── Add new counties below as pages go live ──────────────────────────
  // ['cabarrus',   'https://generationhealth.me/medicare-agents-in-cabarrus-county-nc/'],
  // ['chatham',    'https://generationhealth.me/medicare-agents-in-chatham-county-nc/'],
  // ['alamance',   'https://generationhealth.me/medicare-agents-in-alamance-county-nc/'],
  // ['henderson',  'https://generationhealth.me/medicare-agents-in-henderson-county-nc/'],
  // ['new-hanover','https://generationhealth.me/medicare-agents-in-new-hanover-county-nc/'],
]);

/**
 * Returns the exact live URL for a county slug, or null if not live.
 * slug = lowercase, hyphens for spaces ("new-hanover", "mecklenburg")
 */
export function getLiveCountyUrl(slug: string): string | null {
  return LIVE_COUNTY_URLS.get(slug) ?? null;
}

/**
 * Check if a county name (Title Case) has a live page.
 */
export function isCountyLive(countyName: string): boolean {
  const slug = countyName.toLowerCase().replace(/\s+/g, '-');
  return LIVE_COUNTY_URLS.has(slug);
}
