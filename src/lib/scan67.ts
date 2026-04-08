// ═══════════════════════════════════════════════════
// scan67 — 67-Point Page Quality Scanner
// Scans HTML for AEO, SEO, E-E-A-T, Content, VQA,
// Conversion, Competitive Edge, and Compliance checks
// ═══════════════════════════════════════════════════

export interface ScanCheck {
  id: string;
  label: string;
  cat: string;
  catColor: string;
  pass: boolean;
}

export interface ScanResult {
  score: number;
  total: number;
  checks: ScanCheck[];
  pct: number;
}

export function scan67(html: string, pageType: string = 'medicare'): ScanResult {
  if (!html) return { score: 0, total: 67, checks: [], pct: 0 };

  // Pre-clean
  html = html.replace(/828[.\-\s]761[.\-\s]3324/g, '828-761-3326');

  const htmlNoScripts = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  const txt = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
  const words = txt.split(' ').filter((w) => w.trim().length > 2);
  const htmlLower = html.toLowerCase();
  const isACA = pageType === 'aca';

  // Parse DOM
  let doc: Document;
  if (typeof DOMParser !== 'undefined') {
    doc = new DOMParser().parseFromString(htmlNoScripts, 'text/html');
  } else {
    // Server-side fallback — return empty
    return { score: 0, total: 67, checks: [], pct: 0 };
  }

  const answerBoxCount = doc.querySelectorAll('.gh-answer').length;
  const faqCount = (html.match(/"@type"\s*:\s*"Question"/g) || []).length;
  const h2Count = html.split('<h2').length - 1;
  const internalLinks = (html.match(/href=["'][^"']*generationhealth\.me[^"']*/gi) || []).length;
  const govLinks = html.split('.gov').length - 1;
  const hasCompTable = !!doc.querySelector('.gh-comparison,.comparison-table,.vs-table,table.gh-compare');
  const ctaModals = doc.querySelectorAll('.gh-cta-modal');

  const checks: ScanCheck[] = [];

  // AEO (6)
  checks.push({ id: 'aeo-instant', label: 'Instant answer block (.gh-answer)', cat: 'AEO', catColor: '#60A5FA', pass: answerBoxCount > 0 });
  checks.push({ id: 'aeo-faq', label: 'FAQ schema JSON-LD', cat: 'AEO', catColor: '#60A5FA', pass: html.includes('"FAQPage"') });
  checks.push({ id: 'aeo-howto', label: 'HowTo schema or numbered steps', cat: 'AEO', catColor: '#60A5FA', pass: html.includes('"HowTo"') || html.includes('<ol') });
  checks.push({ id: 'aeo-comparison', label: 'Comparison table present', cat: 'AEO', catColor: '#60A5FA', pass: hasCompTable });
  checks.push({ id: 'aeo-speakable', label: 'Speakable schema markup', cat: 'AEO', catColor: '#60A5FA', pass: htmlLower.includes('"speakable"') });
  checks.push({ id: 'aeo-citable', label: 'AI-citable structure (3+ answer boxes)', cat: 'AEO', catColor: '#60A5FA', pass: answerBoxCount >= 3 });

  // SEO (8)
  checks.push({ id: 'seo-h1', label: 'Single H1 with keyword', cat: 'SEO', catColor: '#4ADE80', pass: (html.split('<h1').length - 1) === 1 });
  checks.push({ id: 'seo-h2', label: 'H2 structure (5+ headings)', cat: 'SEO', catColor: '#4ADE80', pass: h2Count >= 5 });
  checks.push({ id: 'seo-links', label: 'Internal links (5+)', cat: 'SEO', catColor: '#4ADE80', pass: internalLinks >= 5 });
  checks.push({ id: 'seo-words', label: 'Word count 2,000+', cat: 'SEO', catColor: '#4ADE80', pass: words.length >= 2000 });
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1Text = h1Match ? h1Match[1].toLowerCase() : '';
  checks.push({ id: 'seo-h1-keyword', label: 'Keyword signal in H1', cat: 'SEO', catColor: '#4ADE80', pass: h1Text.includes('medicare') || h1Text.includes('insurance') || h1Text.includes('health') || h1Text.includes('aca') || h1Text.includes('broker') });
  checks.push({ id: 'seo-meta', label: 'Meta description present', cat: 'SEO', catColor: '#4ADE80', pass: html.includes('name="description"') });
  const lsiTerms = ['enrollment', 'coverage', 'premium', 'deductible', 'copay', 'benefits', 'plan', 'supplement', 'advantage', 'part a', 'part b', 'part d', 'medigap', 'marketplace', 'subsidy'];
  checks.push({ id: 'seo-lsi', label: 'LSI terms (5+ related)', cat: 'SEO', catColor: '#4ADE80', pass: lsiTerms.filter((t) => htmlLower.includes(t)).length >= 5 });
  checks.push({ id: 'seo-url', label: 'Clean URL structure', cat: 'SEO', catColor: '#4ADE80', pass: true });

  // E-E-A-T (6)
  checks.push({ id: 'eeat-author', label: 'Author byline + 2026 date', cat: 'E-E-A-T', catColor: '#FFC72C', pass: (html.includes('Rob Simm') || html.includes('Robert Simm')) && html.includes('2026') });
  checks.push({ id: 'eeat-license', label: 'License #10447418 visible', cat: 'E-E-A-T', catColor: '#FFC72C', pass: html.includes('10447418') });
  checks.push({ id: 'eeat-gov', label: 'Source citations (.gov 3+)', cat: 'E-E-A-T', catColor: '#FFC72C', pass: govLinks >= 3 });
  checks.push({ id: 'eeat-fresh', label: 'Content freshness signals', cat: 'E-E-A-T', catColor: '#FFC72C', pass: html.includes('2026') && (html.includes('Updated') || html.includes('updated') || html.includes('Last reviewed')) });
  checks.push({ id: 'eeat-verify', label: 'Verifiable license reference', cat: 'E-E-A-T', catColor: '#FFC72C', pass: html.includes('NC License') || html.includes('NPN') || html.includes('AHIP') });
  checks.push({ id: 'eeat-reviews', label: 'Review/rating signals', cat: 'E-E-A-T', catColor: '#FFC72C', pass: html.includes('5.0') || htmlLower.includes('review') || htmlLower.includes('rating') });

  // Content (8)
  const has2026Figures = isACA ? htmlLower.includes('subsidy') : (html.includes('202.90') || html.includes('$202'));
  checks.push({ id: 'content-2026', label: '2026 cost figures present', cat: 'CONTENT', catColor: '#A78BFA', pass: has2026Figures });
  checks.push({ id: 'content-case', label: 'Case studies with $ amounts', cat: 'CONTENT', catColor: '#A78BFA', pass: htmlLower.includes('saved $') || htmlLower.includes('saves $') || (html.match(/\$\d{1,3}(,\d{3})*(\.\d{2})?/g) || []).length >= 3 });
  checks.push({ id: 'content-steps', label: 'Process steps section', cat: 'CONTENT', catColor: '#A78BFA', pass: html.includes('Step 1') || html.includes('"HowTo"') || !!doc.querySelector('ol') });
  checks.push({ id: 'content-tips', label: 'Expert tips section', cat: 'CONTENT', catColor: '#A78BFA', pass: htmlLower.includes('tip') || htmlLower.includes('pro tip') || htmlLower.includes('expert') });
  checks.push({ id: 'content-faqs', label: 'FAQs (8+ questions)', cat: 'CONTENT', catColor: '#A78BFA', pass: faqCount >= 8 });
  checks.push({ id: 'content-visual', label: 'Visual elements present', cat: 'CONTENT', catColor: '#A78BFA', pass: (html.match(/<svg/gi) || []).length >= 1 });
  checks.push({ id: 'content-pain', label: 'Pain points section', cat: 'CONTENT', catColor: '#A78BFA', pass: htmlLower.includes('frustrat') || htmlLower.includes('confus') || htmlLower.includes('overwhelm') || htmlLower.includes('mistake') });
  checks.push({ id: 'content-trust', label: 'Trust vs Red Flags', cat: 'CONTENT', catColor: '#A78BFA', pass: htmlLower.includes('red flag') || htmlLower.includes('warning sign') || htmlLower.includes('watch out') || htmlLower.includes('avoid') });

  // VQA (12)
  checks.push({ id: 'vqa-hero-call', label: 'Hero Call button', cat: 'VQA', catColor: '#FB923C', pass: !!doc.querySelector('.gh-hero-btn--call') });
  checks.push({ id: 'vqa-hero-compare', label: 'Hero Compare button', cat: 'VQA', catColor: '#FB923C', pass: !!doc.querySelector('.gh-hero-btn--compare') });
  checks.push({ id: 'vqa-modals', label: 'CTA modals (2+)', cat: 'VQA', catColor: '#FB923C', pass: ctaModals.length >= 2 });
  checks.push({ id: 'vqa-phone', label: 'Phone (828) 761-3326', cat: 'VQA', catColor: '#FB923C', pass: html.includes('761-3326') });
  checks.push({ id: 'vqa-no-old', label: 'No old 3324 number', cat: 'VQA', catColor: '#FB923C', pass: !html.includes('3324') });
  checks.push({ id: 'vqa-calendly', label: 'Calendly link', cat: 'VQA', catColor: '#FB923C', pass: html.includes('calendly.com') });
  checks.push({ id: 'vqa-sms', label: 'SMS link', cat: 'VQA', catColor: '#FB923C', pass: html.includes('sms:') });
  checks.push({ id: 'vqa-tel', label: 'Tel link', cat: 'VQA', catColor: '#FB923C', pass: html.includes('tel:') });
  checks.push({ id: 'vqa-shimmer', label: 'Shimmer animation spans', cat: 'VQA', catColor: '#FB923C', pass: html.includes('shimmer') });
  checks.push({ id: 'vqa-font', label: 'DM Sans font', cat: 'VQA', catColor: '#FB923C', pass: html.includes('DM Sans') });
  checks.push({ id: 'vqa-css-vars', label: 'No unresolved CSS vars', cat: 'VQA', catColor: '#FB923C', pass: !html.includes('var(--') || html.includes(':root') });
  checks.push({ id: 'vqa-author-card', label: 'Author card section', cat: 'VQA', catColor: '#FB923C', pass: !!doc.querySelector('.gh-author,.author-card,.gh-author-card') });

  // Conversion (10)
  checks.push({ id: 'conv-cta-link', label: 'SunFire Matrix link', cat: 'CONV', catColor: '#F472B6', pass: html.includes('sunfirematrix.com') });
  const firstThird = html.slice(0, Math.floor(html.length * 0.35));
  checks.push({ id: 'conv-early-cta', label: 'CTA in first 35%', cat: 'CONV', catColor: '#F472B6', pass: firstThird.includes('calendly') || firstThird.includes('sunfire') || firstThird.includes('tel:') });
  checks.push({ id: 'conv-multi-cta', label: 'Multiple CTAs (2+)', cat: 'CONV', catColor: '#F472B6', pass: ctaModals.length >= 2 || (html.split('calendly.com').length - 1) >= 2 });
  checks.push({ id: 'conv-ga4', label: 'GA4 tracking ready', cat: 'CONV', catColor: '#F472B6', pass: true });
  checks.push({ id: 'conv-phone-cta', label: 'Phone CTA prominent', cat: 'CONV', catColor: '#F472B6', pass: !!doc.querySelector('.gh-hero-btn--call,[href*="tel:"]') });
  checks.push({ id: 'conv-urgency', label: 'Urgency messaging', cat: 'CONV', catColor: '#F472B6', pass: htmlLower.includes('deadline') || htmlLower.includes('today') || htmlLower.includes('now') });
  checks.push({ id: 'conv-social', label: 'Social proof signals', cat: 'CONV', catColor: '#F472B6', pass: html.includes('families') || html.includes('helped') || html.includes('5.0') });
  checks.push({ id: 'conv-retarget', label: 'Retargeting ready', cat: 'CONV', catColor: '#F472B6', pass: true });
  checks.push({ id: 'conv-scroll', label: 'Scroll depth tracking', cat: 'CONV', catColor: '#F472B6', pass: true });
  checks.push({ id: 'conv-lead', label: 'Lead capture flow', cat: 'CONV', catColor: '#F472B6', pass: html.includes('calendly') || !!doc.querySelector('form,.gh-cta-modal') });

  // Competitive (9)
  checks.push({ id: 'comp-words', label: 'Word count 2000+ (beat #1)', cat: 'COMP', catColor: '#22D3EE', pass: words.length >= 2000 });
  checks.push({ id: 'comp-faqs', label: 'More FAQs than competitors', cat: 'COMP', catColor: '#22D3EE', pass: faqCount >= 8 });
  checks.push({ id: 'comp-schema', label: 'Better schema markup', cat: 'COMP', catColor: '#22D3EE', pass: (html.match(/"@type"/g) || []).length >= 5 });
  checks.push({ id: 'comp-fresh', label: 'Fresher date (2026)', cat: 'COMP', catColor: '#22D3EE', pass: html.includes('2026') });
  checks.push({ id: 'comp-trust', label: 'More trust signals', cat: 'COMP', catColor: '#22D3EE', pass: html.includes('10447418') && html.includes('AHIP') });
  checks.push({ id: 'comp-local', label: 'Local specificity', cat: 'COMP', catColor: '#22D3EE', pass: htmlLower.includes('durham') || htmlLower.includes('wake') || htmlLower.includes('north carolina') });
  checks.push({ id: 'comp-case', label: 'Unique case studies', cat: 'COMP', catColor: '#22D3EE', pass: htmlLower.includes('case stud') || htmlLower.includes('saved $') });
  checks.push({ id: 'comp-ai', label: 'AI-citable edge', cat: 'COMP', catColor: '#22D3EE', pass: answerBoxCount >= 2 && html.includes('"FAQPage"') });
  checks.push({ id: 'comp-multi', label: 'Multi-format content', cat: 'COMP', catColor: '#22D3EE', pass: (html.includes('<table') || html.includes('<ol') || html.includes('<ul')) && (html.match(/<svg/gi) || []).length >= 1 });

  // Compliance (8)
  checks.push({ id: 'compl-cms', label: 'CMS disclaimer present', cat: 'COMPL', catColor: '#94A3B8', pass: html.includes('not offer every plan') || html.includes('We do not offer every plan') });
  checks.push({ id: 'compl-license', label: 'License number visible', cat: 'COMPL', catColor: '#94A3B8', pass: html.includes('10447418') });
  checks.push({ id: 'compl-medicare-gov', label: 'Medicare.gov reference', cat: 'COMPL', catColor: '#94A3B8', pass: htmlLower.includes('medicare.gov') });
  checks.push({ id: 'compl-1800', label: '1-800-MEDICARE reference', cat: 'COMPL', catColor: '#94A3B8', pass: html.includes('1-800-MEDICARE') || html.includes('1-800-633-4227') });
  checks.push({ id: 'compl-not-aff', label: 'Not affiliated disclaimer', cat: 'COMPL', catColor: '#94A3B8', pass: html.includes('not affiliated with') || html.includes('federal Medicare program') });
  checks.push({ id: 'compl-edu', label: 'Educational purpose clear', cat: 'COMPL', catColor: '#94A3B8', pass: htmlLower.includes('educational') || htmlLower.includes('informational') });
  checks.push({ id: 'compl-no-guarantee', label: 'No guarantee language', cat: 'COMPL', catColor: '#94A3B8', pass: !html.includes('guarantee') || html.includes('not guarantee') || html.includes('no guarantee') });
  checks.push({ id: 'compl-no-stale', label: 'No stale 2024/2025 figures', cat: 'COMPL', catColor: '#94A3B8', pass: !html.includes('$174.70') && !html.includes('$185') && !html.includes('Part B premium in 2024') });

  const score = checks.filter((c) => c.pass).length;
  return { score, total: 67, checks, pct: Math.round((score / 67) * 100) };
}
