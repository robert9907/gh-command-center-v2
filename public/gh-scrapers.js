/**
 * GH Command Center - AEO Scrapers
 * Baked into index.html as plain JS (no imports, no TypeScript).
 *
 * Exposes: window.GHScrapers = { runAll, scrapeReddit, scrapeMedicareGov, scrapeEhealth, scrapeCompetitors }
 *
 * Reddit runs direct from browser (permissive CORS).
 * medicare.gov + ehealth.com + competitors route through PHP proxy at:
 *   https://generationhealth.me/tools/scrape-proxy.php?url=...
 *
 * Each scraper returns QueryCandidate objects compatible with the
 * Citation Monitor v2.0 / AEO Pipeline schema.
 */
(function () {
  'use strict';

  const PROXY_URL = 'https://generationhealth.me/tools/scrape-proxy.php';
  const REQUEST_DELAY_MS = 1000;

  // -------------------------------------------------------------------------
  // Shared helpers
  // -------------------------------------------------------------------------

  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  function emptyCitationStatus() {
    return { claude: null, chatgpt: null, perplexity: null, gemini: null };
  }

  function makeCandidate({ id, query, source, intent, intentScore, category, upvotes }) {
    return {
      id,
      query,
      source,
      intent,
      intentScore,
      category,
      dateAdded: new Date().toISOString(),
      ...(upvotes !== undefined ? { upvotes } : {}),
      citationStatus: emptyCitationStatus(),
      competitors: [],
    };
  }

  function cleanText(s) {
    if (!s) return '';
    return s.replace(/\s+/g, ' ').trim();
  }

  function isPlausibleQuery(text) {
    if (!text) return false;
    const t = text.trim();
    return t.length >= 10 && t.length <= 160;
  }

  // Dedupe by normalized query text (keeps first occurrence)
  function dedupe(candidates) {
    const seen = new Set();
    const out = [];
    for (const c of candidates) {
      const key = c.query.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(c);
    }
    return out;
  }

  // Fetch HTML through the PHP proxy
  async function fetchViaProxy(targetUrl) {
    const proxied = `${PROXY_URL}?url=${encodeURIComponent(targetUrl)}`;

    try {
      const res = await fetch(proxied);

      if (!res.ok) {
        throw new Error(`Proxy HTTP ${res.status} for ${targetUrl}`);
      }

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Proxy returned non-JSON (${contentType || 'none'})`);
      }

      const data = await res.json();

      if (!data.ok) {
        throw new Error(`Proxy error: ${data.error || 'unknown'}`);
      }

      if (typeof data.html !== 'string') {
        throw new Error(`Proxy returned invalid HTML (type: ${typeof data.html})`);
      }

      return data.html;
    } catch (err) {
      if (err.message.includes('Failed to fetch')) {
        throw new Error(`Proxy unreachable. Check ${PROXY_URL} exists and has CORS headers.`);
      }
      throw err;
    }
  }

  function parseHTML(html) {
    if (!html || typeof html !== 'string') {
      throw new Error('Invalid HTML input');
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // DOMParser inserts <parsererror> on catastrophic failure
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      console.warn('[parseHTML] DOMParser error (continuing anyway):', parseError.textContent.slice(0, 100));
    }

    return doc;
  }

  // -------------------------------------------------------------------------
  // 1. Reddit scraper (direct fetch, Reddit JSON API is CORS-friendly)
  // -------------------------------------------------------------------------

  const REDDIT_SUBS = ['Medicare', 'HealthInsurance', 'personalfinance', 'NorthCarolina'];
  const REDDIT_KEYWORDS = [
    'medicare', 'medicaid', 'health insurance', 'turning 65',
    'enrollment', 'part d', 'part b', 'medigap', 'advantage plan',
  ];

  async function fetchSubredditPosts(subreddit) {
    const url = `https://www.reddit.com/r/${subreddit}/top.json?t=month&limit=100`;
    try {
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'GHCommandCenter/1.0 (Medicare broker research)',
        },
      });
      if (!res.ok) {
        console.warn(`[reddit] r/${subreddit} HTTP ${res.status}`);
        return [];
      }
      const data = await res.json();
      const children = data?.data?.children || [];
      return children.map((c) => ({
        id: c.data.id,
        title: c.data.title,
        upvotes: c.data.ups,
        subreddit: c.data.subreddit,
        created: new Date(c.data.created_utc * 1000).toISOString(),
        url: c.data.permalink,
      }));
    } catch (err) {
      console.warn(`[reddit] r/${subreddit} failed:`, err.message);
      return [];
    }
  }

  function cleanRedditTitle(title) {
    let t = title || '';
    t = t.replace(/^(ELI5|TIL|PSA|Question|Help|Advice needed|Update|Rant)\s*[:\-]\s*/i, '');
    t = t.replace(/\s+/g, ' ').trim();
    return t;
  }

  async function scrapeReddit() {
    const allPosts = [];
    for (const sub of REDDIT_SUBS) {
      const posts = await fetchSubredditPosts(sub);
      allPosts.push(...posts);
      await delay(REQUEST_DELAY_MS);
    }

    const filtered = allPosts.filter((p) => {
      const lower = p.title.toLowerCase();
      return REDDIT_KEYWORDS.some((kw) => lower.includes(kw));
    });

    const candidates = filtered.map((p) =>
      makeCandidate({
        id: `reddit-${p.id}`,
        query: cleanRedditTitle(p.title),
        source: 'reddit',
        intent: 'medium',
        intentScore: 5,
        category: 'local_decisions',
        upvotes: p.upvotes,
      })
    ).filter((c) => isPlausibleQuery(c.query));

    return dedupe(candidates);
  }

  // -------------------------------------------------------------------------
  // 2. medicare.gov scraper (via proxy)
  // -------------------------------------------------------------------------

  const MEDICARE_GOV_PAGES = [
    'https://www.medicare.gov/basics/get-started-with-medicare',
    'https://www.medicare.gov/basics/get-started-with-medicare/sign-up/when-can-i-sign-up-for-medicare',
    'https://www.medicare.gov/basics/costs/medicare-costs',
    'https://www.medicare.gov/health-drug-plans/health-plans/your-coverage-options',
    'https://www.medicare.gov/health-drug-plans/part-d',
  ];

  async function extractMedicareGovQueries(pageUrl) {
    const html = await fetchViaProxy(pageUrl);
    const doc = parseHTML(html);
    const out = [];
    const slug = pageUrl.replace(/\W+/g, '-').slice(0, 60);

    // Schema.org Question microdata
    doc.querySelectorAll('[itemtype*="Question"]').forEach((faq, idx) => {
      const q = cleanText(
        faq.querySelector('[itemprop="name"], h2, h3')?.textContent
      );
      if (isPlausibleQuery(q)) {
        out.push(makeCandidate({
          id: `medicare-gov-${slug}-faq-${idx}`,
          query: q,
          source: 'medicare_gov',
          intent: 'low',
          intentScore: 4,
          category: 'authority_builders',
        }));
      }
    });

    // Headings phrased as questions
    doc.querySelectorAll('h1, h2, h3').forEach((h, idx) => {
      const text = cleanText(h.textContent);
      if (text.includes('?') && isPlausibleQuery(text)) {
        out.push(makeCandidate({
          id: `medicare-gov-${slug}-h-${idx}`,
          query: text,
          source: 'medicare_gov',
          intent: 'low',
          intentScore: 3,
          category: 'authority_builders',
        }));
      }
    });

    return out;
  }

  async function scrapeMedicareGov() {
    const all = [];
    for (const url of MEDICARE_GOV_PAGES) {
      try {
        const queries = await extractMedicareGovQueries(url);
        all.push(...queries);
      } catch (err) {
        console.warn(`[medicare.gov] ${url} failed:`, err.message);
      }
      await delay(REQUEST_DELAY_MS);
    }
    return dedupe(all);
  }

  // -------------------------------------------------------------------------
  // 3. ehealth.com scraper (via proxy)
  // -------------------------------------------------------------------------

  const EHEALTH_PAGES = [
    'https://www.ehealthinsurance.com/medicare',
    'https://www.ehealthinsurance.com/medicare/medicare-advantage',
    'https://www.ehealthinsurance.com/medicare/supplement-insurance',
    'https://www.ehealthinsurance.com/medicare/part-d',
  ];

  async function extractEhealthQueries(pageUrl) {
    const html = await fetchViaProxy(pageUrl);
    const doc = parseHTML(html);
    const out = [];
    const slug = pageUrl.replace(/\W+/g, '-').slice(0, 60);

    // Page title minus site suffix
    const rawTitle = cleanText(doc.querySelector('title')?.textContent);
    if (rawTitle) {
      const title = rawTitle.replace(/\s*[\|\-–]\s*eHealth.*$/i, '').trim();
      if (isPlausibleQuery(title)) {
        out.push(makeCandidate({
          id: `ehealth-${slug}-title`,
          query: title,
          source: 'ehealth',
          intent: 'medium',
          intentScore: 6,
          category: 'authority_builders',
        }));
      }
    }

    // H1 / H2 headings
    doc.querySelectorAll('h1, h2').forEach((h, idx) => {
      const text = cleanText(h.textContent);
      if (isPlausibleQuery(text)) {
        out.push(makeCandidate({
          id: `ehealth-${slug}-h-${idx}`,
          query: text,
          source: 'ehealth',
          intent: 'medium',
          intentScore: 5,
          category: 'authority_builders',
        }));
      }
    });

    // FAQ-flavored containers
    doc.querySelectorAll('[class*="faq" i], [class*="question" i], [class*="accordion" i]')
      .forEach((el, idx) => {
        // Prefer a heading inside the FAQ block if present
        const inner = el.querySelector('h2, h3, h4, [class*="title" i], [class*="question" i]');
        const text = cleanText((inner || el).textContent);
        if (text.includes('?') && isPlausibleQuery(text)) {
          out.push(makeCandidate({
            id: `ehealth-${slug}-faq-${idx}`,
            query: text,
            source: 'ehealth',
            intent: 'low',
            intentScore: 4,
            category: 'authority_builders',
          }));
        }
      });

    return out;
  }

  async function scrapeEhealth() {
    const all = [];
    for (const url of EHEALTH_PAGES) {
      try {
        const queries = await extractEhealthQueries(url);
        all.push(...queries);
      } catch (err) {
        console.warn(`[ehealth] ${url} failed:`, err.message);
      }
      await delay(REQUEST_DELAY_MS);
    }
    return dedupe(all);
  }

  // -------------------------------------------------------------------------
  // 4. Competitor scraper (via proxy, requires URL list)
  // -------------------------------------------------------------------------
  //
  // Takes an array of competitor URLs. Auto-discovery via Google search is
  // blocked without an API key — pass URLs in explicitly, or maintain a list
  // in the Command Center's Citation Monitor settings.

  async function extractCompetitorQueries(pageUrl) {
    const html = await fetchViaProxy(pageUrl);
    const doc = parseHTML(html);
    const out = [];
    const slug = pageUrl.replace(/\W+/g, '-').slice(0, 60);

    const h1 = cleanText(doc.querySelector('h1')?.textContent);
    if (isPlausibleQuery(h1)) {
      out.push(makeCandidate({
        id: `competitor-${slug}-h1`,
        query: h1,
        source: 'competitor',
        intent: 'high',
        intentScore: 7,
        category: 'county_city',
      }));
    }

    doc.querySelectorAll('h2').forEach((h, idx) => {
      const text = cleanText(h.textContent);
      if (isPlausibleQuery(text)) {
        out.push(makeCandidate({
          id: `competitor-${slug}-h2-${idx}`,
          query: text,
          source: 'competitor',
          intent: 'medium',
          intentScore: 6,
          category: 'authority_builders',
        }));
      }
    });

    return out;
  }

  async function scrapeCompetitors(competitorUrls) {
    const urls = Array.isArray(competitorUrls) ? competitorUrls : [];
    if (urls.length === 0) {
      console.info('[competitors] no URLs provided, skipping');
      return [];
    }

    const all = [];
    for (const url of urls) {
      try {
        const queries = await extractCompetitorQueries(url);
        all.push(...queries);
      } catch (err) {
        console.warn(`[competitors] ${url} failed:`, err.message);
      }
      await delay(REQUEST_DELAY_MS);
    }
    return dedupe(all);
  }

  // -------------------------------------------------------------------------
  // Orchestrator
  // -------------------------------------------------------------------------

  async function runAll(options = {}) {
    const { competitorUrls = [] } = options;
    console.log('[GHScrapers] starting all scrapers...');

    const results = await Promise.allSettled([
      scrapeReddit(),
      scrapeMedicareGov(),
      scrapeEhealth(),
      scrapeCompetitors(competitorUrls),
    ]);

    const labels = ['Reddit', 'medicare.gov', 'ehealth.com', 'Competitors'];
    const all = [];

    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        console.log(`[GHScrapers] ✓ ${labels[i]}: ${r.value.length} queries`);
        all.push(...r.value);
      } else {
        console.error(`[GHScrapers] ✗ ${labels[i]} failed:`, r.reason);
      }
    });

    const deduped = dedupe(all);
    console.log(`[GHScrapers] total after dedupe: ${deduped.length} queries`);
    return deduped;
  }

  // -------------------------------------------------------------------------
  // Export to window
  // -------------------------------------------------------------------------

  window.GHScrapers = {
    runAll,
    scrapeReddit,
    scrapeMedicareGov,
    scrapeEhealth,
    scrapeCompetitors,
  };
})();
