// ═══════════════════════════════════════════════════════════════════════════
// seedExpansion.ts
// ═══════════════════════════════════════════════════════════════════════════
// Takes 10 seed queries, expands each into 5 natural-language variations via
// the Claude API, and returns QueryCandidate objects ready for the Citation
// Monitor queue.
//
// This file is the SOURCE OF TRUTH for the shared types used across Chats
// 2/3/4/5 (QueryCandidate, QuerySource, QueryCategory, CitationStatus,
// IntentLevel). Re-export from here; do not redefine downstream.
// ═══════════════════════════════════════════════════════════════════════════

// ── Shared types ────────────────────────────────────────────────────────────

export type QuerySource =
  | 'seed_expansion'
  | 'reddit'
  | 'medicare_gov'
  | 'ehealth'
  | 'competitor'
  | 'manual';

export type QueryCategory =
  | 'county_city'
  | 'regional'
  | 'local_decisions'
  | 'aca'
  | 'savings_programs'
  | 'authority_builders';

export type IntentLevel = 'high' | 'medium' | 'low';

export interface CitationStatus {
  claude: boolean | null;
  chatgpt: boolean | null;
  perplexity: boolean | null;
  gemini: boolean | null;
}

export interface QueryCandidate {
  id: string;
  query: string;
  source: QuerySource;
  intent: IntentLevel;
  intentScore: number; // 1-10
  category: QueryCategory;
  county?: string;
  dateAdded: string;
  upvotes?: number;
  citationStatus: CitationStatus;
  competitors: string[];
}

// ── Seed query type (input to expansion) ────────────────────────────────────

export interface SeedQuery {
  query: string;
  category: QueryCategory;
  priority: number; // 1-5
}

// ── API credentials (single source of truth for all LLM callers) ───────────
//
// Used by citationTester.ts and any other module that needs to call the
// LLM APIs directly from the browser. Stored in localStorage under
// 'gh-cc-cm-apikeys'.

export interface APIKeys {
  claude?: string;
  chatgpt?: string;
  perplexity?: string;
  gemini?: string;
}

// ── Claude API call ─────────────────────────────────────────────────────────

const CLAUDE_MODEL = 'claude-sonnet-4-5';
const CLAUDE_ENDPOINT = 'https://api.anthropic.com/v1/messages';

/**
 * Build the expansion prompt for a single seed query. Asks Claude for 5
 * natural-language variations that a real person might type or say.
 */
function buildExpansionPrompt(seedQuery: string): string {
  return `Given this Medicare query: "${seedQuery}"

Generate 5 natural language variations that real people might ask when searching for the same information. Use conversational language, not SEO keywords.

Requirements:
- Keep the core intent the same
- Vary the phrasing naturally
- Include location variants if applicable (Durham, Wake County, Triangle, etc.)
- Use both question and statement formats
- No marketing jargon

Examples of GOOD variations:
- Original: "Medicare broker Durham NC"
- Variations:
  1. independent Medicare broker near Durham
  2. Medicare agent Durham County North Carolina
  3. best Medicare broker in Durham NC
  4. find Medicare broker Durham area
  5. Medicare help Durham NC

Return only the query variations, one per line, numbered 1-5. No preamble, no commentary.`;
}

/**
 * Parse Claude's numbered-list response into a clean array of variation
 * strings. Tolerates "1. foo", "1) foo", "1 - foo", stray whitespace, and
 * leading/trailing blank lines.
 */
function parseVariations(text: string): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    // Strip numeric prefixes: "1.", "1)", "1 -", "1:"
    .map((line) => line.replace(/^\d+\s*[.)\-:]\s*/, '').trim())
    // Strip leading/trailing quote characters Claude sometimes wraps them in
    .map((line) => line.replace(/^["'`]+|["'`]+$/g, '').trim())
    .filter((line) => line.length > 0 && line.length < 200);
}

/**
 * Call Claude to generate 5 variations for one seed. Returns [] on failure
 * so a single broken seed doesn't kill the whole batch.
 */
async function generateVariations(
  seedQuery: string,
  apiKey: string
): Promise<string[]> {
  try {
    const resp = await fetch(CLAUDE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        // Required for direct browser calls to api.anthropic.com — without
        // this header the request is rejected with a CORS-like error.
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 500,
        messages: [
          { role: 'user', content: buildExpansionPrompt(seedQuery) },
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      console.error(
        `[seedExpansion] Claude API ${resp.status} for "${seedQuery}": ${errText}`
      );
      return [];
    }

    const data = await resp.json();
    if (data.error) {
      console.error(`[seedExpansion] Claude error for "${seedQuery}":`, data.error);
      return [];
    }

    const text: string = data.content?.[0]?.text || '';
    return parseVariations(text);
  } catch (err) {
    console.error(`[seedExpansion] Fetch failed for "${seedQuery}":`, err);
    return [];
  }
}

// ── ID generator ────────────────────────────────────────────────────────────

/**
 * Build a stable-ish id from a query string. Lowercase, alphanumerics +
 * dashes only, capped at 60 chars, with a short random suffix to avoid
 * collisions if two seeds expand into the same variation.
 */
function makeQueryId(query: string, source: QuerySource): string {
  const slug = query
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${source}-${slug}-${suffix}`;
}

// ── Main entry point ────────────────────────────────────────────────────────

/**
 * Expand an array of seed queries into a flat array of QueryCandidate
 * objects. For each seed, the original is kept AND 5 variations are added,
 * so 10 seeds → 60 candidates.
 *
 * Candidates are returned with:
 *   - intent: 'medium', intentScore: 5   (placeholder; reclassified later
 *     by intentClassifier.classifyIntent)
 *   - category: the seed's category (original and variations inherit the
 *     parent seed's category)
 *   - citationStatus: all null (untested)
 *
 * @param seeds     10 seed queries
 * @param apiKey    Claude API key (sk-ant-...)
 * @param onProgress  Optional callback fired once per seed as expansion
 *                    completes. 1-indexed: onProgress(1, 10), onProgress(2, 10)...
 */
export async function expandSeedQueries(
  seeds: SeedQuery[],
  apiKey: string,
  onProgress?: (current: number, total: number) => void
): Promise<QueryCandidate[]> {
  if (!apiKey) {
    throw new Error('expandSeedQueries: Claude API key is required');
  }

  const out: QueryCandidate[] = [];
  const now = new Date().toISOString();

  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];
    const variations = await generateVariations(seed.query, apiKey);

    // Keep original + up to 5 variations = 6 queries per seed.
    const queries = [seed.query, ...variations].slice(0, 6);

    for (const q of queries) {
      out.push({
        id: makeQueryId(q, 'seed_expansion'),
        query: q,
        source: 'seed_expansion',
        intent: 'medium',
        intentScore: 5,
        category: seed.category,
        dateAdded: now,
        citationStatus: {
          claude: null,
          chatgpt: null,
          perplexity: null,
          gemini: null,
        },
        competitors: [],
      });
    }

    // 1-indexed progress report.
    onProgress?.(i + 1, seeds.length);

    // Throttle: respect Claude rate limits (Tier 1 is 50 RPM = ~1200ms/req).
    if (i < seeds.length - 1) {
      await new Promise((r) => setTimeout(r, 1200));
    }
  }

  return out;
}
