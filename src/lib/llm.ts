// ═══════════════════════════════════════════════════
// LLM Query Functions — Citation Monitor
// Each function queries one AI and returns the response
// ═══════════════════════════════════════════════════

export interface LLMResult {
  llm: 'claude' | 'chatgpt' | 'perplexity' | 'gemini';
  success: boolean;
  response?: string;
  error?: string;
}

export async function queryClaude(query: string, apiKey: string): Promise<LLMResult> {
  if (!apiKey) return { llm: 'claude', success: false, error: 'No API key' };
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: query }],
      }),
    });
    const data = await resp.json();
    if (data.error) throw new Error(data.error.message);
    const text = data.content?.[0]?.text || '';
    return { llm: 'claude', success: true, response: text };
  } catch (e: unknown) {
    return { llm: 'claude', success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function queryChatGPT(query: string, apiKey: string): Promise<LLMResult> {
  if (!apiKey) return { llm: 'chatgpt', success: false, error: 'No API key' };
  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: query }], max_tokens: 1500 }),
    });
    const data = await resp.json();
    if (data.error) throw new Error(data.error.message);
    return { llm: 'chatgpt', success: true, response: data.choices?.[0]?.message?.content || '' };
  } catch (e: unknown) {
    return { llm: 'chatgpt', success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function queryPerplexity(query: string, apiKey: string): Promise<LLMResult> {
  if (!apiKey) return { llm: 'perplexity', success: false, error: 'No API key' };
  try {
    const resp = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'llama-3.1-sonar-large-128k-online', messages: [{ role: 'user', content: query }], max_tokens: 1500 }),
    });
    const data = await resp.json();
    if (data.error) throw new Error(data.error.message);
    return { llm: 'perplexity', success: true, response: data.choices?.[0]?.message?.content || '' };
  } catch (e: unknown) {
    return { llm: 'perplexity', success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function queryGemini(query: string, apiKey: string): Promise<LLMResult> {
  if (!apiKey) return { llm: 'gemini', success: false, error: 'No API key' };
  try {
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: query }] }], generationConfig: { maxOutputTokens: 1500 } }),
    });
    const data = await resp.json();
    if (data.error) throw new Error(data.error.message);
    return { llm: 'gemini', success: true, response: data.candidates?.[0]?.content?.parts?.[0]?.text || '' };
  } catch (e: unknown) {
    return { llm: 'gemini', success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Detect if a response cites GenerationHealth
 */
export function detectCitation(text: string): { cited: boolean; type: 'url' | 'name' | 'phone' | null; match: string | null } {
  const lower = text.toLowerCase();
  // URL
  if (lower.includes('generationhealth.me')) return { cited: true, type: 'url', match: 'generationhealth.me' };
  // Names
  for (const name of ['Rob Simm', 'Robert Simm', 'GenerationHealth', 'Generation Health']) {
    if (lower.includes(name.toLowerCase())) return { cited: true, type: 'name', match: name };
  }
  // Phone
  for (const phone of ['828-761-3326', '8287613326', '(828) 761-3326', '828.761.3326']) {
    if (text.includes(phone)) return { cited: true, type: 'phone', match: phone };
  }
  return { cited: false, type: null, match: null };
}
