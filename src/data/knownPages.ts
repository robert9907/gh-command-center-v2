/**
 * knownPages.ts
 *
 * Source of truth for every slug currently published on generationhealth.me.
 *
 * HOW TO MAINTAIN:
 *   When you publish a new county page, add its slug here.
 *   When you unpublish a page, remove its slug here.
 *   Slugs only — no domain, no slashes.
 *
 * USED BY:
 *   templateEngine.ts — filters neighbor links and Related Guides at generation time.
 *   Nothing in this list = nothing links to it = no 404s.
 */

export const KNOWN_PAGE_SLUGS: string[] = [

  // ── Medicare Guides (statewide) ──────────────────────────────
  'medicare-enrollment-in-north-carolina',
  'compare-medicare-plans-in-north-carolina',
  'medigap-plans-in-north-carolina-plan-g-vs-plan-n',
  'medicare-cost-comparison-nc',

  // ── County Landing Pages ─────────────────────────────────────
  // Add county slugs here as you publish them.
  // Pattern: medicare-agents-in-{county-slug}-county-nc

];

export const KNOWN_PAGES: Set<string> = new Set(KNOWN_PAGE_SLUGS);

export function isPublished(slug: string): boolean {
  return KNOWN_PAGES.has(slug);
}
