/**
 * relatedGuides.ts
 *
 * Static registry of confirmed-live "Related Medicare Guides" pills that
 * fill the [RELATED-GUIDE-1]..[RELATED-GUIDE-8] placeholders in AEO
 * landing pages.
 *
 * HOW TO UPDATE:
 *   - Verify the URL resolves to a published page on generationhealth.me
 *   - Append a { title, url } entry below
 *   - The AEO template has 8 slots; up to 8 entries are rendered
 *   - If fewer than 8 entries exist, leftover tokens are removed by
 *     cleanupUnresolvedRelatedGuides() in templateEngine.ts
 */

export interface RelatedGuide {
  title: string;
  url: string;
}

export const RELATED_GUIDES: ReadonlyArray<RelatedGuide> = [
  {
    title: 'Medicare Enrollment in NC – Complete 2026 Guide',
    url: 'https://generationhealth.me/medicare-enrollment-in-north-carolina-complete-guide-for-2026/',
  },
  {
    title: 'Medigap Plans in NC – Plan G vs Plan N',
    url: 'https://generationhealth.me/medigap-plans-in-north-carolina-plan-g-vs-plan-n/',
  },
  {
    title: 'Medicare Costs in NC 2026',
    url: 'https://generationhealth.me/medicare-costs-north-carolina-2026-complete-guide/',
  },
  {
    title: 'Working Past 65 – Medicare Enrollment in NC',
    url: 'https://generationhealth.me/working-past-65-medicare-enrollment-in-north-carolina/',
  },
  {
    title: 'Free Medicare Quotes Online',
    url: 'https://generationhealth.me/free-medicare-quotes-online/',
  },
  {
    title: 'Medicare Special Enrollment Periods in NC',
    url: 'https://generationhealth.me/medicare-special-enrollment-periods-in-north-carolina-2026-guide/',
  },
  {
    title: 'Medicare Premium Penalties in NC',
    url: 'https://generationhealth.me/medicare-premium-penalties-north-carolina-2026-late-enrollment-guide/',
  },
  // add more as pages go live (template has 8 slots)
];
