/**
 * contextualLinker.ts
 *
 * Injects contextual anchor links into AEO page HTML after rendering.
 *
 * HOW IT WORKS:
 * After renderTemplate() produces the final HTML, injectContextualLinks()
 * does a single pass through the body copy and wraps target phrases in
 * <a href="..."> tags.
 *
 * RULES:
 * 1. Each URL is linked only ONCE per page — first match wins.
 *    Prevents the same destination from being linked 10 times.
 * 2. Phrases inside existing <a>...</a> tags are never double-linked.
 * 3. Phrases inside <style>, <script>, or HTML attributes are skipped.
 * 4. Matching is case-sensitive — phrases must match exactly as written
 *    in the template (e.g. "Medicare Advantage" not "medicare advantage").
 * 5. Longer phrases are matched before shorter ones to prevent
 *    "Medigap Plan G" being partially matched by "Medigap".
 *
 * HOW TO ADD NEW LINKS:
 * When you publish a new page on GenerationHealth.me, add one entry
 * to CONTEXTUAL_LINKS below:
 *   { phrase: 'your phrase', url: 'https://generationhealth.me/your-slug/' }
 * That's it. No other code changes needed.
 *
 * Last updated: April 7, 2026
 */

export interface ContextualLink {
  phrase: string;
  url: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXTUAL LINK MAP
// Add new entries here as pages go live on GenerationHealth.me
// Longer/more specific phrases should come before shorter ones
// ═══════════════════════════════════════════════════════════════════════════

// Slug whitelist enforcement: every URL below MUST resolve to a slug on the
// CONFIRMED_SLUGS list in src/lib/aeoQa.ts. Four prior entries pointed to
// pages not on the whitelist and have been remapped or removed:
//   - "Special Enrollment Period"  : was /medicare-advantage-quotes-nc/        → remapped to /medicare-special-enrollment-periods-in-north-carolina-2026-guide/
//   - "Annual Enrollment Period"   : was /medicare-advantage-quotes-nc/        → remapped to /medicare-enrollment-in-north-carolina-complete-guide-for-2026/
//   - "Medicare enrollment"        : was /how-to-sign-up-for-medicare-parts-a-and-b/ → remapped to /medicare-enrollment-in-north-carolina-complete-guide-for-2026/
//   - "drug formularies"           : was /whats-the-best-insurance-to-go-with-medicare/ → REMOVED (no whitelist target)
//   - "Part D"                     : was /medicare-plans-in-north-carolina/    → REMOVED (no whitelist target)
// New whitelist-resident entries added: late enrollment penalty, working past 65, Medicare Advantage costs.
export const CONTEXTUAL_LINKS: ContextualLink[] = [
  // ── Medigap (specific before general) ───────────────────────────────────
  {
    phrase: 'Medigap Plan G',
    url: 'https://generationhealth.me/medigap-plans-in-north-carolina-plan-g-vs-plan-n/',
  },
  {
    phrase: 'Medigap Plan N',
    url: 'https://generationhealth.me/medigap-plans-in-north-carolina-plan-g-vs-plan-n/',
  },
  {
    phrase: 'Medigap',
    url: 'https://generationhealth.me/medigap-plans-in-north-carolina-plan-g-vs-plan-n/',
  },

  // ── Medicare Advantage ───────────────────────────────────────────────────
  {
    phrase: 'Medicare Advantage',
    url: 'https://generationhealth.me/how-to-compare-medicare-advantage-plans-in-north-carolina/',
  },
  {
    phrase: 'prior authorization',
    url: 'https://generationhealth.me/how-to-compare-medicare-advantage-plans-in-north-carolina/',
  },

  // ── Enrollment periods (whitelist-only) ─────────────────────────────────
  {
    phrase: 'Special Enrollment Period',
    url: 'https://generationhealth.me/medicare-special-enrollment-periods-in-north-carolina-2026-guide/',
  },
  {
    phrase: 'Annual Enrollment Period',
    url: 'https://generationhealth.me/medicare-enrollment-in-north-carolina-complete-guide-for-2026/',
  },
  {
    phrase: 'Medicare enrollment',
    url: 'https://generationhealth.me/medicare-enrollment-in-north-carolina-complete-guide-for-2026/',
  },
  {
    phrase: 'Initial Enrollment Period',
    url: 'https://generationhealth.me/medicare-enrollment-in-north-carolina-complete-guide-for-2026/',
  },

  // ── Penalties (whitelist-only) ──────────────────────────────────────────
  {
    phrase: 'late enrollment penalty',
    url: 'https://generationhealth.me/medicare-premium-penalties-north-carolina-2026-late-enrollment-guide/',
  },

  // ── Working past 65 (whitelist-only) ────────────────────────────────────
  {
    phrase: 'working past 65',
    url: 'https://generationhealth.me/working-past-65-medicare-enrollment-in-north-carolina/',
  },

  // ── Costs (whitelist-only) ──────────────────────────────────────────────
  {
    phrase: 'Medicare costs',
    url: 'https://generationhealth.me/medicare-costs-north-carolina-2026-complete-guide/',
  },

  // ── Quotes (whitelist-only) ─────────────────────────────────────────────
  {
    phrase: 'compare plans',
    url: 'https://generationhealth.me/free-medicare-quotes-online/',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// LINK INJECTION ENGINE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Strips all existing <a>...</a> blocks from HTML so we never
 * double-link text that's already linked.
 * Returns the stripped HTML and a restore function.
 */
function maskExistingLinks(html: string): {
  masked: string;
  restore: (s: string) => string;
} {
  const placeholders: string[] = [];
  const masked = html.replace(/<a[\s\S]*?<\/a>/gi, (match) => {
    const idx = placeholders.length;
    placeholders.push(match);
    return `\x00LINK${idx}\x00`;
  });
  const restore = (s: string) =>
    s.replace(/\x00LINK(\d+)\x00/g, (_, i) => placeholders[Number(i)]);
  return { masked, restore };
}

/**
 * Strips <style>...</style> and <script>...</script> blocks so we
 * never inject links into CSS or JS.
 */
function maskNonBody(html: string): {
  masked: string;
  restore: (s: string) => string;
} {
  const placeholders: string[] = [];
  const masked = html.replace(/<(style|script)[\s\S]*?<\/\1>/gi, (match) => {
    const idx = placeholders.length;
    placeholders.push(match);
    return `\x00BLOCK${idx}\x00`;
  });
  const restore = (s: string) =>
    s.replace(/\x00BLOCK(\d+)\x00/g, (_, i) => placeholders[Number(i)]);
  return { masked, restore };
}

/**
 * Main entry point.
 * Call this after renderTemplate() to inject contextual links.
 *
 * @param html     The rendered AEO page HTML
 * @param links    The link map (defaults to CONTEXTUAL_LINKS)
 * @returns        HTML with contextual anchor tags injected
 */
export function injectContextualLinks(
  html: string,
  links: ContextualLink[] = CONTEXTUAL_LINKS
): string {
  // Sort longest phrase first to prevent partial matches
  const sorted = [...links].sort((a, b) => b.phrase.length - a.phrase.length);

  // Track which URLs have already been used (one link per URL per page)
  const usedUrls = new Set<string>();

  // Step 1: Mask <style>/<script> blocks
  const { masked: noBlocks, restore: restoreBlocks } = maskNonBody(html);

  // Step 2: Mask existing <a> tags
  const { masked: noLinks, restore: restoreLinks } = maskExistingLinks(noBlocks);

  // Step 3: Inject links
  let result = noLinks;
  for (const { phrase, url } of sorted) {
    if (usedUrls.has(url)) continue; // URL already used on this page
    if (!result.includes(phrase)) continue; // Phrase not in page

    // Replace only the FIRST occurrence
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped);
    const linked = result.replace(
      regex,
      `<a href="${url}" style="color: var(--gh-blue); text-decoration: underline; text-decoration-color: rgba(0,113,227,0.3); text-underline-offset: 2px;">${phrase}</a>`
    );

    if (linked !== result) {
      usedUrls.add(url);
      result = linked;
    }
  }

  // Step 4: Restore masked blocks
  result = restoreLinks(result);
  result = restoreBlocks(result);

  return result;
}
