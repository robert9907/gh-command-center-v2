/**
 * aeoQa.ts
 *
 * Citation Monitor Q&A AEO page engine — clean rewrite per AEO 9/10 spec.
 *
 *   generateAEOContent(...)  — calls Claude API with a strict system prompt
 *                              that enforces "answer directly in first 40
 *                              words, use 2026 figures, no hedging."
 *
 *   buildAEOPageHtml(...)    — assembles the full HTML widget. Output order:
 *      1. JSON-LD @graph (FAQPage, MedicalWebPage+speakable, Article,
 *         Person, LocalBusiness, BreadcrumbList, Review×3, SpecialAnnouncement)
 *      2. Canonical + Open Graph meta tags
 *      3. Trust strip
 *      4. H1 (passed in verbatim — DO NOT MUTATE; matches the LLM citation
 *         monitoring query exactly)
 *      5. Direct Answer block (specific numbers, no hedging)
 *      6. Journey picker
 *      7. Question-shaped H2 sections (each opens with direct answer)
 *      8. Inline contextual links (handled by injectContextualLinks caller)
 *      9. Mid-page CTA
 *     10. 5 county-specific mistakes (question-shaped H3s)
 *     11. <details>/<summary> FAQ accordion
 *     12. Full author card
 *     13. Related guides (whitelist-only)
 *     14. CMS compliance disclaimer
 *     15. Bottom CTA
 *
 * Author rules: Rob Simm, NPN #10447418, (828) 761-3326, Durham NC 27713.
 */

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface AeoSection {
  /** Natural-language question. Becomes an <h2>. */
  h2: string;
  /** Direct answer (≤40 words, specific numbers). Renders first paragraph. */
  answer: string;
  /** Body content after the direct answer. May contain <strong>, <em>, <p>. */
  body: string;
}

export interface AeoCompareTable {
  /** Question-shaped table title. Becomes a section H2. */
  title: string;
  /** Question-shaped column headers — first cell is the row-label column. */
  columns: string[];
  /** Each row: cells aligned to columns. */
  rows: string[][];
  /** "Rob's take" insight rendered below the table. */
  brokerInsight: string;
}

export interface AeoMistake {
  /** Question-shaped H3 (e.g. "Why do Wake County families miss the 8-month SEP?"). */
  h3: string;
  body: string;
}

export interface AeoFaqItem {
  q: string;
  a: string;
}

export interface AeoContent {
  /** 2-3 sentences answering the H1 directly with specific numbers. */
  directAnswer: string;
  /** Question-shaped sections (4-6). */
  sections: AeoSection[];
  /** Comparison table — at least one is required by the spec. */
  compareTable: AeoCompareTable;
  /** Warning/alert block (penalty or deadline language). */
  warning: string;
  /** Expert tip block (broker-specific, county-specific). */
  expertTip: string;
  /** 5 county-specific mistakes with question-shaped H3s. */
  mistakes: AeoMistake[];
  /** ≥5 FAQ Q/A pairs. Must match FAQPage schema exactly. */
  faq: AeoFaqItem[];
}

export interface AeoQueryInput {
  query: string;
  intent: 'urgency' | 'fear' | 'confusion' | 'validation' | 'trust' | string;
  emotion?: string;
  county?: string;
}

export interface BuildAeoOptions {
  /** Slug for the published page (no leading slash). */
  slug: string;
  /** The raw LLM query — used verbatim as the H1. */
  query: string;
  intent: string;
  /** County name for local CTAs. Defaults to "Wake". */
  county?: string;
  /** ISO date strings for visible + schema timestamps. */
  datePublished?: string;
  dateModified?: string;
  /** Toggles preserved from the legacy panel. */
  deployOpts?: { website: boolean; schema: boolean; embed: boolean; compareTable: boolean };
}

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

export const NPN = '10447418';
export const PHONE_DISPLAY = '(828) 761-3326';
export const PHONE_TEL = '8287613326';
export const BRAND_DOMAIN = 'generationhealth.me';
export const BRAND_URL = `https://${BRAND_DOMAIN}`;
export const ORIGIN_ADDRESS = '2731 Meridian Pkwy, Durham NC 27713';

/** 2026 Medicare figures — the only numbers the model is allowed to use. */
export const MEDICARE_2026 = {
  partBPremium: '$202.90/month',
  partBDeductible: '$283',
  partADeductible: '$1,736 per benefit period',
  partDOOPCap: '$2,100/year',
  insulinCap: '$35/month',
  maOOPMax: '$9,350',
  hdPlanGDeductible: '$2,870',
  mspIncomeLimit: '$1,816/month individual',
  lisIncomeLimit: '$22,590/year individual',
  partBLatePenalty: '10% per 12-month period delayed, for life',
  partDLatePenalty: '1% of national base premium per month delayed',
  medigapOEP: '6-month window starting when you turn 65 AND enroll in Part B',
  iep: '7-month window (3 months before 65th birthday month, birthday month, 3 months after)',
  sepEmployer: '8 months after employment/coverage ends',
  employerSizeThreshold: '20+ employees = employer primary; <20 = Medicare primary',
};

/** The ONLY internal slugs the engine is allowed to link to. */
export const CONFIRMED_SLUGS: readonly string[] = [
  'medicare-enrollment-in-north-carolina-complete-guide-for-2026',
  'medicare-costs-north-carolina-2026-complete-guide',
  'how-to-compare-medicare-advantage-plans-in-north-carolina',
  'medigap-plans-in-north-carolina-plan-g-vs-plan-n',
  'working-past-65-medicare-enrollment-in-north-carolina',
  'free-medicare-quotes-online',
  'medicare-special-enrollment-periods-in-north-carolina-2026-guide',
  'medicare-premium-penalties-north-carolina-2026-late-enrollment-guide',
  'medicare-agents-in-durham-county-nc',
  'medicare-agents-in-wake-county-nc',
  'medicare-agents-in-orange-county-nc',
  'medicare-agents-in-guilford-county-nc',
  'medicare-agents-in-forsyth-county-nc',
  'medicare-agents-in-buncombe-county-nc',
  'medicare-agents-in-mecklenburg-north-carolina',
  'medicare-advantage-plans-in-wake-county-nc',
  'medicare-advantage-plans-in-guilford-county-nc',
  'medicare-advantage-plans-in-forsyth-county-nc',
  'medicare-advantage-plans-in-buncombe-county-nc',
  'medicare-nc',
  'medicare-aca-plans-raleigh-durham-nc',
  'medicare-broker-durham-nc',
  'best-medicare-plans-in-durham-county-nc',
  'medicare-help-wake-county-nc',
];

export function isWhitelistedSlug(slugOrUrl: string): boolean {
  const cleaned = slugOrUrl
    .replace(/^https?:\/\/[^/]+/, '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
  return CONFIRMED_SLUGS.includes(cleaned);
}

export function whitelistedUrl(slug: string): string {
  const clean = slug.replace(/^\/+|\/+$/g, '');
  if (!CONFIRMED_SLUGS.includes(clean)) {
    throw new Error(`[aeoQa] Slug "${slug}" is not on the confirmed whitelist`);
  }
  return `${BRAND_URL}/${clean}/`;
}

/** CMS-required Medicare disclaimer — verbatim per spec. */
export const CMS_DISCLAIMER = `We do not offer every plan available in your area. Please contact Medicare.gov or 1-800-MEDICARE (1-800-633-4227) for information on all of your options. GenerationHealth.me and Robert Simm are independent agents not affiliated with or endorsed by the U.S. government or the federal Medicare program. This is a solicitation of insurance. A licensed agent may contact you. Information on this page is for educational purposes only and should not be considered legal or financial advice. Plan availability, premiums, and benefits vary by location and carrier.`;

/** Three real client reviews surfaced in Review schema. */
export const REVIEWS: ReadonlyArray<{ author: string; rating: number; date: string; body: string }> = [
  {
    author: 'Linda M.',
    rating: 5,
    date: '2026-02-14',
    body: 'Rob caught that my husband would have lost his Duke oncologist on the plan another agent recommended. He spent an hour calling Duke directly to verify before we enrolled. I would never have thought to ask.',
  },
  {
    author: 'James W.',
    rating: 5,
    date: '2026-01-08',
    body: 'I delayed Medicare past 65 because I was still working. Three other agents told me I was fine. Rob actually checked my employer size — only 12 employees, so Medicare was primary. He saved me from a permanent 10% penalty.',
  },
  {
    author: 'Patricia O.',
    rating: 5,
    date: '2025-11-22',
    body: 'My Part D plan moved my $15 medication to a $180/month tier mid-year. Rob ran a Plan Finder analysis the same day and switched me during open enrollment. He still answers his phone in February.',
  },
];

const INTENT_FRAMING: Record<string, { opening: string; cta_tone: string; emotional_hook: string }> = {
  urgency: {
    opening: 'Lead with IMMEDIACY. The reader is running out of time. Open with a time-anchored fact ("You have X days...") followed by the specific deadline math.',
    cta_tone: 'Call now — I can walk you through this in 15 minutes',
    emotional_hook: 'Acknowledge the deadline, then give the exact rule that controls it.',
  },
  fear: {
    opening: 'Lead with REASSURANCE. The reader is afraid they will lose something. Open with a concrete protection ("You will not lose...") followed by the rule that guarantees it.',
    cta_tone: 'Let me check your specific situation — no cost, no pressure',
    emotional_hook: 'Replace fear with a cited rule and a number.',
  },
  confusion: {
    opening: 'Lead with CLARITY. The reader has read 10 explanations. Open with the plain-English answer in one sentence, then back it up with the specific numbers and thresholds.',
    cta_tone: 'Still confused? I explain this in plain English every day — call me',
    emotional_hook: 'Be the explanation that finally lands.',
  },
  validation: {
    opening: 'Lead with CONFIRMATION or CORRECTION. Open with "Yes, that\'s correct..." or "Actually, that changed in 2026..." followed by the source rule.',
    cta_tone: 'Want me to double-check your specific plan? Takes 5 minutes',
    emotional_hook: 'Confirm what is right; correct what is wrong; cite the rule.',
  },
  trust: {
    opening: 'Lead with LOCAL AUTHORITY. Open with "In my 12 years helping NC families..." then the specific rule. Personal, county-specific.',
    cta_tone: `I'm right here in NC — call me directly at ${PHONE_DISPLAY}`,
    emotional_hook: 'They want a real person, not a 1-800 number.',
  },
};

const INTENT_BANNERS: Record<string, { icon: string; bg: string; bg2: string; border: string; color: string }> = {
  urgency: { icon: '⏰', bg: 'rgba(248,113,113,0.08)', bg2: 'rgba(248,113,113,0.03)', border: 'rgba(248,113,113,0.2)', color: '#F87171' },
  fear: { icon: '😟', bg: 'rgba(251,191,36,0.08)', bg2: 'rgba(251,191,36,0.03)', border: 'rgba(251,191,36,0.2)', color: '#FBBF24' },
  confusion: { icon: '🤔', bg: 'rgba(96,165,250,0.08)', bg2: 'rgba(96,165,250,0.03)', border: 'rgba(96,165,250,0.2)', color: '#60A5FA' },
  validation: { icon: '✅', bg: 'rgba(167,139,250,0.08)', bg2: 'rgba(167,139,250,0.03)', border: 'rgba(167,139,250,0.2)', color: '#A78BFA' },
  trust: { icon: '🤝', bg: 'rgba(74,222,128,0.08)', bg2: 'rgba(74,222,128,0.03)', border: 'rgba(74,222,128,0.2)', color: '#4ADE80' },
};

// ═══════════════════════════════════════════════════════════════════════════
// HTML helpers
// ═══════════════════════════════════════════════════════════════════════════

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJsonString(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\t/g, ' ');
}

function isoDate(d: Date = new Date()): string {
  return d.toISOString().split('T')[0];
}

function addMonths(d: Date, n: number): Date {
  const out = new Date(d);
  out.setMonth(out.getMonth() + n);
  return out;
}

function humanDate(d: Date): string {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ═══════════════════════════════════════════════════════════════════════════
// Schema graph
// ═══════════════════════════════════════════════════════════════════════════

interface SchemaInputs {
  url: string;
  title: string;
  description: string;
  datePublished: string;
  dateModified: string;
  faq: AeoFaqItem[];
  directAnswer: string;
  county: string;
}

function buildSchemaGraph(s: SchemaInputs): string {
  const breadcrumbItems = [
    { name: 'Home', item: BRAND_URL },
    { name: 'Medicare in NC', item: `${BRAND_URL}/medicare-nc/` },
    { name: s.title, item: s.url },
  ];

  const reviewSchemas = REVIEWS.map((r) => ({
    '@type': 'Review',
    itemReviewed: { '@id': `${s.url}#org` },
    author: { '@type': 'Person', name: r.author },
    datePublished: r.date,
    reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
    reviewBody: r.body,
  }));

  const faqMainEntity = s.faq.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: f.a,
      author: { '@id': `${s.url}#author` },
    },
  }));

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'MedicalWebPage',
      '@id': `${s.url}#webpage`,
      url: s.url,
      name: s.title,
      description: s.description,
      datePublished: s.datePublished,
      dateModified: s.dateModified,
      inLanguage: 'en-US',
      isPartOf: { '@id': `${BRAND_URL}/#website` },
      author: { '@id': `${s.url}#author` },
      publisher: { '@id': `${s.url}#org` },
      breadcrumb: { '@id': `${s.url}#breadcrumbs` },
      audience: { '@type': 'PeopleAudience', suggestedMinAge: 64 },
      about: {
        '@type': 'MedicalCondition',
        name: 'Medicare enrollment and coverage',
      },
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['.aeo-direct-answer', '.aeo-faq summary', '.aeo-faq .aeo-faq-a'],
      },
    },
    {
      '@type': 'Article',
      '@id': `${s.url}#article`,
      headline: s.title,
      description: s.description,
      datePublished: s.datePublished,
      dateModified: s.dateModified,
      author: { '@id': `${s.url}#author` },
      publisher: { '@id': `${s.url}#org` },
      mainEntityOfPage: { '@id': `${s.url}#webpage` },
      articleBody: s.directAnswer,
    },
    {
      '@type': 'FAQPage',
      '@id': `${s.url}#faq`,
      url: s.url,
      author: { '@id': `${s.url}#author` },
      datePublished: s.datePublished,
      dateModified: s.dateModified,
      mainEntity: faqMainEntity,
    },
    {
      '@type': 'Person',
      '@id': `${s.url}#author`,
      name: 'Robert Simm',
      jobTitle: 'Licensed Medicare Broker',
      telephone: PHONE_DISPLAY,
      email: 'robert@generationhealth.me',
      url: BRAND_URL,
      hasCredential: [
        { '@type': 'EducationalOccupationalCredential', credentialCategory: 'license', name: `NC License #${NPN}` },
        { '@type': 'EducationalOccupationalCredential', credentialCategory: 'certification', name: 'AHIP Certified' },
      ],
      address: { '@type': 'PostalAddress', streetAddress: '2731 Meridian Pkwy', addressLocality: 'Durham', addressRegion: 'NC', postalCode: '27713', addressCountry: 'US' },
      worksFor: { '@id': `${s.url}#org` },
    },
    {
      '@type': ['LocalBusiness', 'InsuranceAgency'],
      '@id': `${s.url}#org`,
      name: 'GenerationHealth.me',
      legalName: 'Robert Jason Simm',
      url: BRAND_URL,
      telephone: PHONE_DISPLAY,
      email: 'robert@generationhealth.me',
      areaServed: { '@type': 'State', name: 'North Carolina' },
      address: { '@type': 'PostalAddress', streetAddress: '2731 Meridian Pkwy', addressLocality: 'Durham', addressRegion: 'NC', postalCode: '27713', addressCountry: 'US' },
      priceRange: '$0 (no broker fee)',
      review: reviewSchemas,
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: 5.0,
        reviewCount: REVIEWS.length,
        bestRating: 5,
      },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${s.url}#breadcrumbs`,
      itemListElement: breadcrumbItems.map((b, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: b.name,
        item: b.item,
      })),
    },
    ...reviewSchemas.map((r, i) => ({ ...r, '@id': `${s.url}#review-${i + 1}` })),
    {
      '@type': 'SpecialAnnouncement',
      '@id': `${s.url}#announcement`,
      name: '2026 Medicare Cost Changes',
      text: `In 2026, the standard Part B premium is ${MEDICARE_2026.partBPremium}, the Part B deductible is ${MEDICARE_2026.partBDeductible}, and the Part D out-of-pocket cap is ${MEDICARE_2026.partDOOPCap} per year. Insulin costs are capped at ${MEDICARE_2026.insulinCap}.`,
      datePosted: s.datePublished,
      expires: '2026-12-31',
      category: 'https://www.wikidata.org/wiki/Q12131',
      announcementLocation: { '@id': `${s.url}#org` },
    },
  ];

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
}

// ═══════════════════════════════════════════════════════════════════════════
// CSS
// ═══════════════════════════════════════════════════════════════════════════

const CSS = `
*{margin:0;padding:0;box-sizing:border-box;}
.aeo-trust{background:linear-gradient(135deg,#0F2440,#1A2332);padding:16px 24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;}
.aeo-trust-logo{font-family:Fraunces,Georgia,serif;font-size:20px;font-weight:700;color:#fff;text-decoration:none;}
.aeo-trust-logo span{color:#14B8A6;}.aeo-trust-logo .dot{color:#6B7B8D;}
.aeo-trust-creds{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.aeo-cred{font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:4px 10px;border-radius:4px;}
.aeo-cred--gold{background:rgba(255,199,44,0.15);color:#FFC72C;}
.aeo-cred--teal{background:rgba(20,184,166,0.15);color:#14B8A6;}
.aeo-cred--muted{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);}
.aeo-trust-phone{display:inline-flex;align-items:center;gap:8px;padding:10px 22px;border-radius:100px;background:rgba(255,255,255,0.08);border:1.5px solid rgba(20,184,166,0.4);color:#14B8A6;font-size:15px;font-weight:700;text-decoration:none;}
.aeo-header{max-width:800px;margin:0 auto;padding:48px 24px 24px;text-align:left;}
.aeo-h1{font-family:Fraunces,Georgia,serif;font-size:clamp(28px,4vw,40px);font-weight:700;line-height:1.15;color:#1A2332;margin-bottom:14px;}
.aeo-meta{font-size:12px;color:#6B7B8D;display:flex;flex-wrap:wrap;gap:14px;}
.aeo-meta strong{color:#1A2332;font-weight:600;}
.aeo-direct-answer{max-width:800px;margin:0 auto 28px;padding:24px 28px;background:linear-gradient(135deg,#F0FDFA,#CCFBF1);border-left:4px solid #14B8A6;border-radius:12px;font-size:17px;line-height:1.65;color:#0F2440;font-weight:500;}
.aeo-direct-answer .aeo-da-label{display:inline-block;background:#0D9488;color:#fff;font-size:10px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;padding:4px 10px;border-radius:4px;margin-bottom:10px;}
.aeo-direct-answer .aeo-da-cta{display:block;margin-top:14px;font-size:14px;font-weight:600;color:#0D9488;}
.aeo-direct-answer .aeo-da-cta a{color:#0D9488;text-decoration:underline;}
.aeo-section{max-width:800px;margin:0 auto;padding:24px;}
.aeo-section h2{font-family:Fraunces,Georgia,serif;font-size:clamp(22px,3vw,28px);font-weight:700;color:#0F2440;margin-bottom:14px;line-height:1.25;letter-spacing:-0.01em;}
.aeo-section .aeo-section-answer{font-size:16px;line-height:1.7;color:#1A2332;margin-bottom:14px;font-weight:500;}
.aeo-section .aeo-section-body{font-size:15px;line-height:1.7;color:#3A4756;}
.aeo-section .aeo-section-body p{margin-bottom:12px;}
.aeo-warning{max-width:800px;margin:8px auto;padding:18px 22px;background:linear-gradient(135deg,rgba(248,113,113,0.08),rgba(248,113,113,0.03));border-left:4px solid #DC2626;border-radius:10px;font-size:15px;line-height:1.6;color:#1A2332;}
.aeo-warning .aeo-w-label{display:inline-block;background:#DC2626;color:#fff;font-size:10px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;padding:4px 10px;border-radius:4px;margin-bottom:8px;}
.aeo-tip{max-width:800px;margin:8px auto;padding:18px 22px;background:linear-gradient(135deg,rgba(96,165,250,0.08),rgba(96,165,250,0.03));border-left:4px solid #2563EB;border-radius:10px;font-size:15px;line-height:1.6;color:#1A2332;}
.aeo-tip .aeo-t-label{display:inline-block;background:#2563EB;color:#fff;font-size:10px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;padding:4px 10px;border-radius:4px;margin-bottom:8px;}
.aeo-compare{max-width:800px;margin:24px auto;padding:0 24px;}
.aeo-compare-title{font-family:Fraunces,Georgia,serif;font-size:24px;font-weight:700;color:#0F2440;margin-bottom:16px;}
.aeo-compare-table{width:100%;border-collapse:separate;border-spacing:0;border-radius:12px;overflow:hidden;border:1px solid #E8ECF0;}
.aeo-compare-table th{background:#0F2440;color:#fff;font-size:13px;font-weight:700;padding:14px 18px;text-align:left;}
.aeo-compare-table td{padding:12px 18px;font-size:14px;border-bottom:1px solid #F3F5F7;}
.aeo-compare-table tr:last-child td{border-bottom:none;}
.aeo-compare-table td:first-child{font-weight:600;color:#1A2332;background:#F8FAFC;}
.aeo-compare-insight{margin-top:16px;padding:14px 18px;background:linear-gradient(135deg,#F0FDFA,#CCFBF1);border-radius:10px;font-size:14px;color:#1A2332;line-height:1.6;}
.aeo-compare-insight strong{color:#0D9488;}
.aeo-mistakes{max-width:800px;margin:24px auto;padding:0 24px;}
.aeo-mistakes h2{font-family:Fraunces,Georgia,serif;font-size:clamp(22px,3vw,28px);font-weight:700;color:#0F2440;margin-bottom:18px;}
.aeo-mistake{padding:18px 0;border-top:1px solid #E8ECF0;}
.aeo-mistake h3{font-family:Fraunces,Georgia,serif;font-size:18px;font-weight:600;color:#0F2440;margin-bottom:8px;}
.aeo-mistake p{font-size:15px;line-height:1.65;color:#3A4756;}
.aeo-faq{max-width:800px;margin:24px auto;padding:0 24px;}
.aeo-faq h2{font-family:Fraunces,Georgia,serif;font-size:clamp(22px,3vw,28px);font-weight:700;color:#0F2440;margin-bottom:18px;}
.aeo-faq details{border:1px solid #E8ECF0;border-radius:10px;margin-bottom:8px;background:#fff;}
.aeo-faq details[open]{border-color:#14B8A6;box-shadow:0 1px 4px rgba(20,184,166,0.1);}
.aeo-faq summary{cursor:pointer;padding:16px 20px;font-size:15px;font-weight:600;color:#0F2440;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:12px;}
.aeo-faq summary::-webkit-details-marker{display:none;}
.aeo-faq summary::after{content:'+';font-size:22px;font-weight:300;color:#0D9488;}
.aeo-faq details[open] summary::after{content:'−';}
.aeo-faq .aeo-faq-a{padding:0 20px 18px;font-size:14px;line-height:1.7;color:#3A4756;}
.aeo-author{max-width:800px;margin:24px auto;padding:24px;border:1px solid #E8ECF0;border-radius:14px;background:#fff;display:grid;grid-template-columns:88px 1fr;gap:18px;align-items:start;}
.aeo-author-photo{width:88px;height:88px;border-radius:50%;background:linear-gradient(135deg,#14B8A6,#0D9488);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:28px;font-family:Fraunces,Georgia,serif;}
.aeo-author-name{font-size:18px;font-weight:700;color:#0F2440;}
.aeo-author-title{font-size:13px;color:#6B7B8D;margin-bottom:8px;}
.aeo-author-bio{font-size:14px;line-height:1.65;color:#3A4756;margin-bottom:10px;}
.aeo-author-row{font-size:12px;color:#3A4756;line-height:1.7;}
.aeo-author-row strong{color:#0F2440;}
.aeo-related{max-width:800px;margin:24px auto;padding:0 24px;}
.aeo-related h2{font-family:Fraunces,Georgia,serif;font-size:20px;font-weight:700;color:#0F2440;margin-bottom:14px;}
.aeo-related-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;}
.aeo-related-grid a{display:block;padding:12px 14px;border:1px solid #E8ECF0;border-radius:10px;font-size:13px;font-weight:600;color:#0D9488;text-decoration:none;background:#fff;}
.aeo-mid-cta,.aeo-bottom-cta{max-width:800px;margin:24px auto;padding:24px 28px;background:linear-gradient(135deg,#0F2440,#1A2332);border-radius:14px;color:#fff;text-align:center;}
.aeo-bottom-cta{background:linear-gradient(135deg,#0D9488,#14B8A6);}
.aeo-mid-cta h3,.aeo-bottom-cta h3{font-family:Fraunces,Georgia,serif;font-size:22px;font-weight:700;margin-bottom:6px;}
.aeo-mid-cta p,.aeo-bottom-cta p{font-size:14px;color:rgba(255,255,255,0.7);margin-bottom:16px;}
.aeo-bottom-cta p{color:rgba(255,255,255,0.85);}
.aeo-cta-btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}
.aeo-cta-btn{display:inline-flex;align-items:center;gap:8px;padding:12px 24px;border-radius:100px;font-size:14px;font-weight:700;text-decoration:none;}
.aeo-cta-btn--teal{background:#14B8A6;color:#fff;}
.aeo-cta-btn--white{background:#fff;color:#0D9488;}
.aeo-cta-btn--ghost{background:rgba(255,255,255,0.1);color:#fff;border:1.5px solid rgba(255,255,255,0.2);}
.aeo-disclaimer{max-width:800px;margin:0 auto;padding:24px;border-top:1px solid #E8ECF0;}
.aeo-disclaimer p{font-size:11px;line-height:1.7;color:#6B7B8D;}
.aeo-disclaimer strong{color:#3A4756;}
.aeo-footer-meta{max-width:800px;margin:0 auto;padding:0 24px 24px;font-size:11px;color:#6B7B8D;line-height:1.7;}
.aeo-footer-meta a{color:#0D9488;text-decoration:none;}
@media(max-width:640px){.aeo-trust{padding:12px 16px;}.aeo-trust-creds{display:none;}.aeo-author{grid-template-columns:1fr;text-align:center;}.aeo-author-photo{margin:0 auto;}}
`.trim();

// ═══════════════════════════════════════════════════════════════════════════
// Body composition
// ═══════════════════════════════════════════════════════════════════════════

function renderTrustStrip(): string {
  return `<div class="aeo-trust"><a href="${BRAND_URL}" class="aeo-trust-logo">Generation<span>Health</span><span class="dot">.me</span></a><div class="aeo-trust-creds"><span class="aeo-cred aeo-cred--gold">NC #${NPN}</span><span class="aeo-cred aeo-cred--muted">NPN #${NPN}</span><span class="aeo-cred aeo-cred--teal">AHIP Certified</span></div><a href="tel:${PHONE_TEL}" class="aeo-trust-phone">📞 ${PHONE_DISPLAY}</a></div>`;
}

function renderHeader(query: string, datePublished: string, dateModified: string): string {
  return `<div class="aeo-header"><h1 class="aeo-h1">${escapeHtml(query)}</h1><div class="aeo-meta"><span><strong>Published:</strong> ${humanDate(new Date(datePublished))}</span><span><strong>Last Updated:</strong> ${humanDate(new Date(dateModified))}</span><span><strong>Reviewed by:</strong> Robert Simm, NC #${NPN}</span></div></div>`;
}

function renderDirectAnswer(directAnswer: string, county: string): string {
  return `<div class="aeo-direct-answer"><span class="aeo-da-label">Direct Answer</span><div>${escapeHtml(directAnswer)}</div><span class="aeo-da-cta">For your specific situation in ${escapeHtml(county)} County, call Rob Simm at <a href="tel:${PHONE_TEL}">${PHONE_DISPLAY}</a> — free, no obligation.</span></div>`;
}

function renderJourneyPicker(): string {
  return `<div class="aeo-mid-cta"><h3>Pick how you want to move forward — your pace.</h3><p>Plan Match takes 3 minutes. A 15-minute call is also same-week.</p><div class="aeo-cta-btns"><a href="${BRAND_URL}/free-medicare-quotes-online/" class="aeo-cta-btn aeo-cta-btn--teal">⚖️ Plan Match · 3 min</a><a href="https://calendly.com/robert-generationhealth/new-meeting" class="aeo-cta-btn aeo-cta-btn--ghost">📅 Book a 15-min Call</a><a href="tel:${PHONE_TEL}" class="aeo-cta-btn aeo-cta-btn--ghost">📞 ${PHONE_DISPLAY}</a></div></div>`;
}

function renderSection(s: AeoSection): string {
  return `<section class="aeo-section"><h2>${escapeHtml(s.h2)}</h2><p class="aeo-section-answer">${escapeHtml(s.answer)}</p><div class="aeo-section-body">${s.body}</div></section>`;
}

function renderWarning(text: string): string {
  return `<div class="aeo-warning"><span class="aeo-w-label">⚠ Penalty Warning</span><div>${escapeHtml(text)}</div></div>`;
}

function renderExpertTip(text: string, county: string): string {
  return `<div class="aeo-tip"><span class="aeo-t-label">💡 Broker Tip · ${escapeHtml(county)} County</span><div>${escapeHtml(text)}</div></div>`;
}

function renderCompareTable(t: AeoCompareTable): string {
  const head = t.columns.map((c) => `<th>${escapeHtml(c)}</th>`).join('');
  const rows = t.rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
    .join('');
  return `<section class="aeo-compare"><h2 class="aeo-compare-title">${escapeHtml(t.title)}</h2><table class="aeo-compare-table"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>${t.brokerInsight ? `<div class="aeo-compare-insight"><strong>Rob's take:</strong> ${escapeHtml(t.brokerInsight)}</div>` : ''}</section>`;
}

function renderMistakes(mistakes: AeoMistake[], county: string): string {
  const items = mistakes
    .map((m) => `<div class="aeo-mistake"><h3>${escapeHtml(m.h3)}</h3><p>${escapeHtml(m.body)}</p></div>`)
    .join('');
  return `<section class="aeo-mistakes"><h2>What are the biggest Medicare mistakes in ${escapeHtml(county)} County?</h2>${items}</section>`;
}

function renderFaq(faq: AeoFaqItem[]): string {
  const items = faq
    .map(
      (f) => `<details><summary>${escapeHtml(f.q)}</summary><div class="aeo-faq-a">${escapeHtml(f.a)}</div></details>`
    )
    .join('');
  return `<section class="aeo-faq"><h2>Frequently asked questions</h2>${items}</section>`;
}

function renderAuthorCard(): string {
  return `<aside class="aeo-author" itemscope itemtype="https://schema.org/Person">
<div class="aeo-author-photo">RS</div>
<div>
<div class="aeo-author-name" itemprop="name">Robert Simm</div>
<div class="aeo-author-title" itemprop="jobTitle">Licensed Medicare Broker · NC #${NPN} · NPN #${NPN}</div>
<p class="aeo-author-bio">Independent Medicare broker serving North Carolina families since 2014. AHIP certified. I check family history and provider networks before recommending a plan, and I answer my own phone the next year when something changes.</p>
<div class="aeo-author-row"><strong>Phone:</strong> <a href="tel:${PHONE_TEL}">${PHONE_DISPLAY}</a></div>
<div class="aeo-author-row"><strong>Hours:</strong> Mon–Fri 9 AM–7 PM ET · Saturday by appointment</div>
<div class="aeo-author-row"><strong>Office:</strong> ${ORIGIN_ADDRESS}</div>
<div class="aeo-author-row"><strong>License verification:</strong> <a href="https://sbs.naic.org/solar-external-lookup/" target="_blank" rel="noopener">NAIC SBS lookup →</a></div>
</div>
</aside>`;
}

function renderRelatedGuides(currentSlug: string): string {
  // Pick 6-8 from whitelist, excluding current.
  const labels: Record<string, string> = {
    'medicare-enrollment-in-north-carolina-complete-guide-for-2026': 'Medicare Enrollment in NC — 2026 Guide',
    'medicare-costs-north-carolina-2026-complete-guide': 'Medicare Costs in NC — 2026',
    'how-to-compare-medicare-advantage-plans-in-north-carolina': 'Compare Medicare Advantage Plans (NC)',
    'medigap-plans-in-north-carolina-plan-g-vs-plan-n': 'Medigap Plan G vs Plan N',
    'working-past-65-medicare-enrollment-in-north-carolina': 'Working Past 65 — NC Enrollment',
    'free-medicare-quotes-online': 'Free Medicare Quotes',
    'medicare-special-enrollment-periods-in-north-carolina-2026-guide': 'Special Enrollment Periods (NC 2026)',
    'medicare-premium-penalties-north-carolina-2026-late-enrollment-guide': 'Late Enrollment Penalties (NC 2026)',
  };
  const picks = Object.keys(labels)
    .filter((s) => s !== currentSlug)
    .slice(0, 8)
    .map((slug) => `<a href="${whitelistedUrl(slug)}">${escapeHtml(labels[slug])}</a>`)
    .join('');
  return `<section class="aeo-related"><h2>Related guides on GenerationHealth.me</h2><div class="aeo-related-grid">${picks}</div></section>`;
}

function renderBottomCta(): string {
  return `<div class="aeo-bottom-cta"><h3>10 minutes. You'll know where you stand.</h3><p>Rob Simm · Licensed NC Medicare Broker · NPN #${NPN}</p><div class="aeo-cta-btns"><a href="tel:${PHONE_TEL}" class="aeo-cta-btn aeo-cta-btn--white">📞 Call ${PHONE_DISPLAY}</a><a href="${whitelistedUrl('free-medicare-quotes-online')}" class="aeo-cta-btn aeo-cta-btn--white">⚖️ Plan Match Free</a><a href="https://calendly.com/robert-generationhealth/new-meeting" class="aeo-cta-btn aeo-cta-btn--ghost">📅 Schedule a Call</a></div></div>`;
}

function renderDisclaimerFooter(datePublished: string, dateModified: string): string {
  const nextReview = humanDate(addMonths(new Date(dateModified), 6));
  return `<div class="aeo-disclaimer"><p><strong>Compliance disclaimer:</strong> ${escapeHtml(CMS_DISCLAIMER)}</p></div><div class="aeo-footer-meta"><div><strong>Last Updated:</strong> ${humanDate(new Date(dateModified))} · <strong>Published:</strong> ${humanDate(new Date(datePublished))} · <strong>Next Review:</strong> ${nextReview}</div><div><strong>Reviewed By:</strong> Robert Simm, Licensed Medicare Broker, NC #${NPN}</div><div>© 2026 GenerationHealth.me · <a href="${BRAND_URL}">${BRAND_DOMAIN}</a></div></div>`;
}

function renderHeadMeta(opts: BuildAeoOptions, title: string, description: string, url: string): string {
  return [
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:type" content="article">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:site_name" content="GenerationHealth.me">`,
    `<meta property="og:image" content="${BRAND_URL}/og-default.png">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`,
    `<meta name="author" content="Robert Simm">`,
    `<meta name="article:published_time" content="${opts.datePublished || isoDate()}">`,
    `<meta name="article:modified_time" content="${opts.dateModified || isoDate()}">`,
  ].join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// Public: buildAEOPageHtml
// ═══════════════════════════════════════════════════════════════════════════

export function buildAEOPageHtml(content: AeoContent, opts: BuildAeoOptions): string {
  const slug = opts.slug.replace(/^\/+|\/+$/g, '');
  const url = `${BRAND_URL}/${slug}/`;
  const datePublished = opts.datePublished || isoDate();
  const dateModified = opts.dateModified || isoDate();
  const county = opts.county || 'Wake';

  const title = opts.query;
  const description =
    content.directAnswer.length > 155
      ? content.directAnswer.slice(0, 152).trim() + '…'
      : content.directAnswer;

  const schemaJson = buildSchemaGraph({
    url,
    title,
    description,
    datePublished,
    dateModified,
    faq: content.faq,
    directAnswer: content.directAnswer,
    county,
  });

  const sectionsHtml = content.sections.map(renderSection).join('\n');

  const widget = [
    `<!-- AEO Q&A page · ${slug} · generated ${datePublished} -->`,
    `<script type="application/ld+json">${schemaJson.replace(/<\/script>/gi, '<\\/script>')}<\/script>`,
    renderHeadMeta(opts, title, description, url),
    `<style>${CSS}</style>`,
    renderTrustStrip(),
    renderHeader(opts.query, datePublished, dateModified),
    renderDirectAnswer(content.directAnswer, county),
    renderJourneyPicker(),
    sectionsHtml,
    renderWarning(content.warning),
    renderExpertTip(content.expertTip, county),
    opts.deployOpts?.compareTable === false ? '' : renderCompareTable(content.compareTable),
    renderMistakes(content.mistakes, county),
    renderFaq(content.faq),
    renderAuthorCard(),
    renderRelatedGuides(slug),
    renderBottomCta(),
    renderDisclaimerFooter(datePublished, dateModified),
  ]
    .filter(Boolean)
    .join('\n\n');

  return widget;
}

// ═══════════════════════════════════════════════════════════════════════════
// Public: generateAEOContent (Claude API)
// ═══════════════════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `You are a Medicare content expert writing for GenerationHealth.me. You are writing the ACTUAL ANSWER to a Medicare question for a page that will be cited by AI engines (ChatGPT, Perplexity, Google AI Overviews, Gemini).

CRITICAL RULES:
1. ANSWER THE QUESTION DIRECTLY in the first 40 words of every answer. No hedging. No "it depends." No "call us." State the specific facts, rules, numbers, and thresholds.
2. Every answer must include SPECIFIC NUMBERS — dollar amounts, percentages, time periods, dates, thresholds.
3. Every answer must be SELF-CONTAINED — it must make complete sense without reading any other section on the page.
4. Use ONLY these confirmed 2026 Medicare figures:
   - Part B premium: ${MEDICARE_2026.partBPremium}
   - Part B deductible: ${MEDICARE_2026.partBDeductible}
   - Part A deductible: ${MEDICARE_2026.partADeductible}
   - Part D OOP cap: ${MEDICARE_2026.partDOOPCap}
   - Insulin cap: ${MEDICARE_2026.insulinCap}
   - MA OOP max: ${MEDICARE_2026.maOOPMax}
   - HD Plan G deductible: ${MEDICARE_2026.hdPlanGDeductible}
   - MSP income limit: ${MEDICARE_2026.mspIncomeLimit}
   - LIS income limit: ${MEDICARE_2026.lisIncomeLimit}
   - Part B late penalty: ${MEDICARE_2026.partBLatePenalty}
   - Part D late penalty: ${MEDICARE_2026.partDLatePenalty}
   - Medigap open enrollment: ${MEDICARE_2026.medigapOEP}
   - IEP: ${MEDICARE_2026.iep}
   - SEP after employer coverage: ${MEDICARE_2026.sepEmployer}
   - Employer size threshold: ${MEDICARE_2026.employerSizeThreshold}
5. After stating the facts, ADD ONE SENTENCE with a local broker CTA: "For your specific situation in [County] County, call Rob Simm at ${PHONE_DISPLAY} — free, no obligation." (only in the directAnswer field — do NOT repeat it in every section)
6. Write H2 headings as NATURAL-LANGUAGE QUESTIONS that match how real people ask AI engines. Examples: "When exactly do I need to enroll in Medicare if I'm still working?", "What does Medicare cost in Wake County in 2026?". NEVER write generic labels like "The direct answer", "The numbers", "The difference".
7. Do NOT use generic filler like "Medicare can be confusing" or "navigating Medicare is complex." Start with the answer.
8. The compareTable.title and compareTable.columns must be QUESTION-SHAPED. The first column header is the row-label question (e.g. "What's the question?"). Subsequent columns are the options being compared.
9. The warning field must reference a specific PENALTY or DEADLINE relevant to the query (use exact 2026 figures).
10. The expertTip field must contain BROKER-SPECIFIC, COUNTY-SPECIFIC insight that a generic article cannot give. Reference the county name explicitly.
11. Each mistakes[].h3 must be a question, county-specific (reference the county name).
12. Each faq[].q must be a natural-language question. Each faq[].a must answer directly with specific numbers in the first sentence.

Author context: Rob Simm, NC License #${NPN}, ${PHONE_DISPLAY}, ${ORIGIN_ADDRESS}.

OUTPUT FORMAT — return JSON only, no markdown fences, exactly matching this shape:
{
  "directAnswer": "2-3 sentence direct answer with 2026 figures + local CTA",
  "sections": [
    { "h2": "natural-language question", "answer": "≤40-word direct answer with numbers", "body": "<p>HTML body…</p>" }
  ],
  "compareTable": {
    "title": "natural-language question",
    "columns": ["question-shaped column 1", "option A", "option B"],
    "rows": [["row-label", "value A", "value B"]],
    "brokerInsight": "1-2 sentences"
  },
  "warning": "specific penalty/deadline language with 2026 figures",
  "expertTip": "broker-specific, county-specific insight",
  "mistakes": [{ "h3": "county-specific question", "body": "answer" }],
  "faq": [{ "q": "natural-language question", "a": "direct answer with numbers" }]
}

Required: ≥4 sections, ≥1 compareTable (with ≥3 rows), ≥5 mistakes, ≥5 faq items.`;

export interface GenerateOptions {
  /** Anthropic API key (sk-ant-...) */
  claudeKey: string;
  /** Model override; defaults to claude-sonnet-4-5 */
  model?: string;
  /** Optional progress callback (0..100). */
  onProgress?: (pct: number) => void;
}

export async function generateAEOContent(
  input: AeoQueryInput,
  { claudeKey, model = 'claude-sonnet-4-5', onProgress }: GenerateOptions
): Promise<AeoContent> {
  if (!claudeKey) {
    throw new Error('[aeoQa] Claude API key required');
  }

  const framing = INTENT_FRAMING[input.intent] || INTENT_FRAMING.confusion;
  const county = input.county || 'Wake';

  const userMessage = `Generate AEO content for this query:

QUERY: "${input.query}"
INTENT: ${input.intent.toUpperCase()}
EMOTION: "${input.emotion || 'unknown'}"
COUNTY: ${county}

INTENT FRAMING:
${framing.opening}

Emotional hook: ${framing.emotional_hook}
Suggested CTA tone: ${framing.cta_tone}

Output JSON only — no markdown, no commentary.`;

  onProgress?.(20);

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': claudeKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 6000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  onProgress?.(70);

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`[aeoQa] Claude API error ${resp.status}: ${txt.slice(0, 300)}`);
  }

  const data = await resp.json();
  const raw = data?.content?.[0]?.text;
  if (!raw) throw new Error('[aeoQa] Empty response from Claude');

  const cleaned = raw.replace(/```json\s*|\s*```/g, '').trim();

  let parsed: AeoContent;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`[aeoQa] Failed to parse model JSON: ${(e as Error).message}\n\nRaw: ${cleaned.slice(0, 500)}`);
  }

  validateAeoContent(parsed);

  onProgress?.(100);
  return parsed;
}

// ═══════════════════════════════════════════════════════════════════════════
// Validation — runs the spec checklist against generated content
// ═══════════════════════════════════════════════════════════════════════════

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export function validateAeoContent(c: AeoContent): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!c.directAnswer || c.directAnswer.split(/\s+/).length < 25) {
    errors.push('directAnswer is missing or shorter than 25 words');
  }
  if (/\bit depends\b/i.test(c.directAnswer || '')) {
    errors.push('directAnswer must not lead with "it depends"');
  }
  if (!/[$0-9]/.test(c.directAnswer || '')) {
    warnings.push('directAnswer contains no numbers — spec requires specific figures');
  }
  if (!Array.isArray(c.sections) || c.sections.length < 4) {
    errors.push('sections must contain at least 4 entries');
  }
  c.sections?.forEach((s, i) => {
    if (!/\?$/.test(s.h2)) errors.push(`sections[${i}].h2 must end with a question mark`);
    if (s.answer && s.answer.split(/\s+/).length > 60) {
      warnings.push(`sections[${i}].answer is longer than 60 words — spec asks for ≤40`);
    }
  });
  if (!c.compareTable || !Array.isArray(c.compareTable.rows) || c.compareTable.rows.length < 3) {
    errors.push('compareTable must contain at least 3 rows');
  }
  if (!c.warning) errors.push('warning block is required');
  if (!c.expertTip) errors.push('expertTip block is required');
  if (!Array.isArray(c.mistakes) || c.mistakes.length < 5) {
    errors.push('mistakes must contain at least 5 entries');
  }
  if (!Array.isArray(c.faq) || c.faq.length < 5) {
    errors.push('faq must contain at least 5 entries');
  }
  c.faq?.forEach((f, i) => {
    if (!/\?$/.test(f.q)) errors.push(`faq[${i}].q must end with a question mark`);
  });

  return { ok: errors.length === 0, errors, warnings };
}

/**
 * Validates the rendered HTML widget against the spec checklist.
 * Used as a post-build sanity check before deploy.
 */
export function validateAeoHtml(html: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!/<script[^>]*application\/ld\+json/i.test(html)) {
    errors.push('Missing JSON-LD schema block');
  }
  for (const t of ['MedicalWebPage', 'FAQPage', 'Article', 'BreadcrumbList', 'SpecialAnnouncement']) {
    if (!html.includes(t)) errors.push(`Schema graph missing @type ${t}`);
  }
  if (!/rel="canonical"/i.test(html)) errors.push('Missing canonical tag');
  if (!/property="og:title"/i.test(html)) errors.push('Missing Open Graph og:title');
  if (!/aeo-direct-answer/.test(html)) errors.push('Missing Direct Answer block');
  if (!/<details/.test(html)) errors.push('FAQ must use <details>/<summary>');
  if (!/aeo-warning/.test(html)) errors.push('Missing warning block');
  if (!/aeo-tip/.test(html)) errors.push('Missing expert tip block');
  if (!/aeo-author/.test(html)) errors.push('Missing full author card');
  if (!html.includes(CMS_DISCLAIMER.slice(0, 60))) errors.push('Missing CMS compliance disclaimer');
  const phoneCount = (html.match(/\(828\) 761-3326/g) || []).length;
  if (phoneCount < 4) errors.push(`Phone number must appear ≥4 times (found ${phoneCount})`);
  if (!html.includes('© 2026')) errors.push('Missing © 2026 footer');

  // Slug whitelist enforcement
  const linkRe = new RegExp(`href="${BRAND_URL.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}/([^"#?/]+)/?"`, 'g');
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(html)) !== null) {
    const slug = m[1];
    if (!CONFIRMED_SLUGS.includes(slug)) {
      errors.push(`Link to non-whitelisted slug: ${slug}`);
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

// Suppress "declared but unused" for escapeJsonString helper kept for future
// schema work where stringify() isn't usable.
void escapeJsonString;
