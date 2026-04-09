// ============================================================================
// /lib/citationTester.ts
//
// Client-side LLM citation testing for the GH Command Center.
// Tests QueryCandidates across Claude, ChatGPT, Perplexity, and Gemini via
// direct browser → API calls. Detects whether GenerationHealth.me is cited
// in each response and extracts competitor mentions.
//
// Key design decisions:
//  - All 4 LLMs tested in PARALLEL for a single query (fast)
//  - Queries processed SEQUENTIALLY with 1500ms delay (rate-limit safe)
//  - API failures → citationStatus = null (distinct from false = not cited)
//  - Mutates-by-return: returns a new array of QueryCandidates, does not
//    touch localStorage itself (caller persists to gh-cc-query-queue-v3)
// ============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
//
// Shared types are imported from seedExpansion.ts (single source of truth
// across Chats 2/3/4/5). Only citationTester-specific types are defined
// locally below.

import type {
  QueryCandidate,
  APIKeys,
  CitationStatus,
} from './seedExpansion';

export type { QueryCandidate, APIKeys, CitationStatus };

export type LLMProvider = 'claude' | 'chatgpt' | 'perplexity' | 'gemini';

export type ProgressCallback = (
  current: number,
  total: number,
  queryText: string
) => void;

// Internal result from a single LLM call
interface LLMResult {
  provider: LLMProvider;
  text: string | null; // null = API error
  error?: string;
}

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

/**
 * GenerationHealth signals. If any of these appear in an LLM response,
 * we count it as a citation. Case-insensitive except where phone digits
 * are concerned (we strip non-digits before comparing).
 */
const GH_SIGNALS = {
  domains: ['generationhealth.me'],
  brands: ['generationhealth.me', 'generation health', 'generationhealth'],
  people: ['rob simm', 'robert simm'],
  // Phone digits only — matches (828) 761-3326, 828-761-3326, 8287613326, etc.
  phoneDigits: '8287613326',
};

/**
 * Known competitors — surface mentions so Rob can see who's winning each
 * query. Kept as [displayName, regex-safe match token, ...aliases].
 * Lowercased comparison.
 */
const COMPETITORS: Array<{ name: string; patterns: string[] }> = [
  { name: 'eHealth', patterns: ['ehealth', 'ehealthinsurance'] },
  { name: 'Medicare.gov', patterns: ['medicare.gov'] },
  { name: 'SHIP', patterns: ['ship program', 'state health insurance assistance'] },
  { name: 'GoHealth', patterns: ['gohealth'] },
  { name: 'SelectQuote', patterns: ['selectquote', 'select quote'] },
  { name: 'HealthMarkets', patterns: ['healthmarkets'] },
  { name: 'Boomer Benefits', patterns: ['boomer benefits'] },
  { name: 'Medicare Advocates', patterns: ['medicare advocates'] },
  { name: 'AARP', patterns: ['aarp'] },
  { name: 'NerdWallet', patterns: ['nerdwallet'] },
  { name: 'Forbes', patterns: ['forbes'] },
  { name: 'ValuePenguin', patterns: ['valuepenguin'] },
  { name: 'Humana', patterns: ['humana.com'] },
  { name: 'UnitedHealthcare', patterns: ['uhc.com', 'unitedhealthcare.com'] },
];

/**
 * Returns true if `text` contains any GenerationHealth signal.
 * Empty / null input → false.
 */
export function detectCitation(text: string | null | undefined): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();

  for (const d of GH_SIGNALS.domains) {
    if (lower.includes(d)) return true;
  }
  for (const b of GH_SIGNALS.brands) {
    if (lower.includes(b)) return true;
  }
  for (const p of GH_SIGNALS.people) {
    if (lower.includes(p)) return true;
  }

  // Phone: strip non-digits and search
  const digitsOnly = text.replace(/\D/g, '');
  if (digitsOnly.includes(GH_SIGNALS.phoneDigits)) return true;

  return false;
}

/**
 * Returns a de-duplicated list of competitor display names found in the text.
 */
export function detectCompetitors(text: string | null | undefined): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const found = new Set<string>();

  for (const comp of COMPETITORS) {
    for (const pattern of comp.patterns) {
      if (lower.includes(pattern)) {
        found.add(comp.name);
        break;
      }
    }
  }

  return Array.from(found);
}

// ---------------------------------------------------------------------------
// LLM API callers
//
// Each caller returns the response text as a plain string, or throws on
// failure. The orchestrator catches and maps to { text: null, error }.
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT =
  'You are a helpful assistant answering a Medicare-related question for a consumer. ' +
  'Provide a clear, useful answer. When you reference specific sources, brokers, websites, ' +
  'or organizations, name them explicitly so the user can follow up.';

async function callClaude(query: string, apiKey: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: query }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Claude API ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = Array.isArray(data.content)
    ? data.content
        .filter((b: any) => b.type === 'text')
        .map((b: any) => b.text)
        .join('\n')
    : '';

  return text;
}

async function callChatGPT(query: string, apiKey: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: query },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`OpenAI API ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

async function callPerplexity(query: string, apiKey: string): Promise<string> {
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'sonar',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: query },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Perplexity API ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const message = data?.choices?.[0]?.message?.content ?? '';
  // Perplexity returns citations as a separate array — flatten into the
  // text we scan so domain mentions in citations count as hits.
  const citations: string[] = Array.isArray(data?.citations) ? data.citations : [];
  return citations.length ? `${message}\n\nCitations:\n${citations.join('\n')}` : message;
}

async function callGemini(query: string, apiKey: string): Promise<string> {
  const model = 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: query }] }],
      generationConfig: { maxOutputTokens: 1024 },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Gemini API ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  return parts.map((p: any) => p.text ?? '').join('\n');
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

/**
 * Tests a single query across all 4 LLMs in parallel.
 * Returns updated citationStatus + aggregated competitors list.
 */
async function testSingleQuery(
  query: string,
  apiKeys: APIKeys
): Promise<{ status: CitationStatus; competitors: string[] }> {
  const tasks: Array<Promise<LLMResult>> = [
    apiKeys.claude
      ? callClaude(query, apiKeys.claude)
          .then((text) => ({ provider: 'claude' as const, text }))
          .catch((e) => ({ provider: 'claude' as const, text: null, error: String(e) }))
      : Promise.resolve({ provider: 'claude' as const, text: null, error: 'no api key' }),

    apiKeys.chatgpt
      ? callChatGPT(query, apiKeys.chatgpt)
          .then((text) => ({ provider: 'chatgpt' as const, text }))
          .catch((e) => ({ provider: 'chatgpt' as const, text: null, error: String(e) }))
      : Promise.resolve({ provider: 'chatgpt' as const, text: null, error: 'no api key' }),

    apiKeys.perplexity
      ? callPerplexity(query, apiKeys.perplexity)
          .then((text) => ({ provider: 'perplexity' as const, text }))
          .catch((e) => ({ provider: 'perplexity' as const, text: null, error: String(e) }))
      : Promise.resolve({ provider: 'perplexity' as const, text: null, error: 'no api key' }),

    apiKeys.gemini
      ? callGemini(query, apiKeys.gemini)
          .then((text) => ({ provider: 'gemini' as const, text }))
          .catch((e) => ({ provider: 'gemini' as const, text: null, error: String(e) }))
      : Promise.resolve({ provider: 'gemini' as const, text: null, error: 'no api key' }),
  ];

  const results = await Promise.all(tasks);

  const status: CitationStatus = {
    claude: null,
    chatgpt: null,
    perplexity: null,
    gemini: null,
  };

  const competitorSet = new Set<string>();

  for (const r of results) {
    if (r.text === null) {
      // API error → null (already defaulted, but explicit for clarity)
      status[r.provider] = null;
      if (r.error) {
        // eslint-disable-next-line no-console
        console.warn(`[citationTester] ${r.provider} failed:`, r.error);
      }
      continue;
    }

    status[r.provider] = detectCitation(r.text);
    for (const c of detectCompetitors(r.text)) competitorSet.add(c);
  }

  return { status, competitors: Array.from(competitorSet) };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const DELAY_BETWEEN_QUERIES_MS = 1500;

/**
 * Main entry point. Tests each candidate sequentially (with a 1.5s delay
 * between queries to stay under rate limits), running all 4 LLMs in parallel
 * within each query. Returns a new array of updated candidates.
 *
 * The input array is NOT mutated — callers should replace their state with
 * the returned array and persist to `gh-cc-query-queue-v3`.
 */
export async function testCitations(
  candidates: QueryCandidate[],
  apiKeys: APIKeys
): Promise<QueryCandidate[]> {
  return batchTestWithProgress(candidates, apiKeys, () => {});
}

/**
 * Same as testCitations but fires `onProgress` after each query completes.
 * `current` is 1-indexed (i.e. after query #1 finishes, current=1).
 */
export async function batchTestWithProgress(
  queries: QueryCandidate[],
  apiKeys: APIKeys,
  onProgress: ProgressCallback
): Promise<QueryCandidate[]> {
  const updated: QueryCandidate[] = [];
  const total = queries.length;

  for (let i = 0; i < total; i++) {
    const candidate = queries[i];

    let next: QueryCandidate;
    try {
      const { status, competitors } = await testSingleQuery(candidate.query, apiKeys);

      // Merge competitors with any existing ones (union, de-duped)
      const mergedCompetitors = Array.from(
        new Set([...(candidate.competitors || []), ...competitors])
      );

      next = {
        ...candidate,
        citationStatus: status,
        competitors: mergedCompetitors,
        lastTested: new Date().toISOString(),
      };
    } catch (err) {
      // Should be unreachable — testSingleQuery catches per-provider — but
      // guard against unexpected throws so one bad query doesn't kill the batch.
      // eslint-disable-next-line no-console
      console.error(`[citationTester] unexpected error on "${candidate.query}":`, err);
      next = {
        ...candidate,
        citationStatus: {
          claude: null,
          chatgpt: null,
          perplexity: null,
          gemini: null,
        },
        lastTested: new Date().toISOString(),
      };
    }

    updated.push(next);

    try {
      onProgress(i + 1, total, candidate.query);
    } catch {
      // progress callback errors are not fatal
    }

    // Delay between queries, but not after the last one
    if (i < total - 1) {
      await sleep(DELAY_BETWEEN_QUERIES_MS);
    }
  }

  return updated;
}
