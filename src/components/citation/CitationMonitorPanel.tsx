'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2, Check, X, Key, Play, FileText, Eye, Copy, Zap, Star } from 'lucide-react';
import { CM_QUERIES, CM_CATEGORIES, CM_COMPETITORS, CM_DETECTION } from '@/data/citation-queries';
import { queryClaude, queryChatGPT, queryPerplexity, queryGemini, type LLMResult } from '@/lib/llm';
import { getFromStorage, saveToStorage } from '@/lib/utils';
import { useAppState, type AeoPipelineEntry } from '@/lib/AppState';

const LS_CM_DATA = 'gh-cc-citation-monitor';
const LS_CLAUDE_KEY = 'gh-cc-pb-apikey';
const LS_CM_KEYS = 'gh-cc-cm-apikeys';

interface ScanResult { queryId: string; llm: string; cited: boolean; snippet?: string; competitors?: string[]; error?: string }
interface CMData { results: ScanResult[]; lastScan: string | null; totalScans: number }
interface AeoQA { id: string; question: string; answer: string; aeoScore: number; dagger?: string }
interface CompareTable { title: string; options: string[]; recommended: number | null; rows: Array<{ feature: string; values: string[]; goodIndex: number | null }>; brokerInsight: string }

function detectCitationLocal(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  if (lower.includes(CM_DETECTION.url)) return true;
  for (const name of CM_DETECTION.names) { if (lower.includes(name.toLowerCase())) return true; }
  for (const phone of CM_DETECTION.phone) { if (text.includes(phone)) return true; }
  return false;
}

function detectCompetitors(text: string): string[] {
  const found: string[] = [];
  const lower = text.toLowerCase();
  CM_COMPETITORS.forEach((c) => { if (c.patterns.some((p) => lower.includes(p))) found.push(c.name); });
  return found;
}

// ═══════════════════════════════════════════════════
// AEO PAGE BUILDER v2.2 CSS (inline)
// ═══════════════════════════════════════════════════
const AEO_CSS = `*{margin:0;padding:0;box-sizing:border-box}.aeo-trust{background:linear-gradient(135deg,#0D9488 0%,#14B8A6 100%);padding:16px 24px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.aeo-trust-brand{display:flex;align-items:center;gap:14px}.aeo-trust-logo{font-family:"Fraunces",Georgia,serif;font-size:20px;font-weight:700;color:#fff;text-decoration:none}.aeo-trust-divider{width:1px;height:28px;background:rgba(255,255,255,0.15)}.aeo-trust-advisor{display:flex;align-items:center;gap:10px}.aeo-trust-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#14B8A6,#0D9488);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:13px}.aeo-trust-name{font-size:13px;font-weight:700;color:#fff}.aeo-trust-title{font-size:11px;color:rgba(255,255,255,0.6)}.aeo-trust-creds{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.aeo-cred{font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:4px 10px;border-radius:4px;background:rgba(255,199,44,0.15);color:#FFC72C}.aeo-trust-phone{display:flex;align-items:center;gap:8px;padding:10px 22px;border-radius:100px;background:#fff;border:none;color:#0D9488;font-size:15px;font-weight:700;text-decoration:none;flex-shrink:0}.aeo-header{max-width:800px;margin:0 auto;padding:48px 24px 32px;text-align:center}.aeo-h1{font-family:"Fraunces",Georgia,serif;font-size:clamp(28px,4vw,42px);font-weight:700;line-height:1.15;color:#1A2332;margin-bottom:12px}.aeo-subtitle{font-size:16px;color:#6B7B8D;line-height:1.6;max-width:600px;margin:0 auto}.aeo-update-strip{margin-top:20px;padding:12px 20px;background:#F8FAFC;border-radius:10px;font-size:12px;color:#6B7B8D;display:inline-flex;align-items:center;gap:12px;flex-wrap:wrap}.aeo-update-strip strong{color:#1A2332}.aeo-qa-list{max-width:800px;margin:0 auto;padding:0 24px}.aeo-qa-item{margin-bottom:32px}.aeo-question{display:flex;align-items:flex-start;gap:12px;margin-bottom:12px}.aeo-q-icon{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#0D9488,#14B8A6);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:12px;flex-shrink:0;margin-top:2px}.aeo-q-text{font-family:"Fraunces",Georgia,serif;font-size:20px;font-weight:600;color:#1A2332;line-height:1.3}.aeo-answer-block{background:linear-gradient(135deg,#F0FDFA,#CCFBF1);border-left:4px solid #14B8A6;border-radius:12px;padding:20px 24px;margin-left:40px}.aeo-answer-text{font-size:15px;line-height:1.7;color:#1A2332;margin-bottom:12px}.aeo-answer-attr{display:flex;align-items:center;gap:8px;font-size:12px;color:#0D9488;font-weight:600}.aeo-attr-avatar{width:22px;height:22px;border-radius:50%;background:#0D9488;color:#fff;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800}.aeo-nepq-dagger{margin-top:14px;padding-top:12px;border-top:1px solid rgba(20,184,166,0.15);font-size:14px;font-weight:600;font-style:italic;color:#0F2440;line-height:1.5}.aeo-nepq-dagger a{color:#0D9488;font-weight:700;text-decoration:none;font-style:normal}.aeo-mid-cta{max-width:800px;margin:8px auto 40px;padding:0 24px}.aeo-mid-cta-inner{background:linear-gradient(135deg,#0D9488,#14B8A6);border-radius:16px;padding:28px 32px;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap}.aeo-mid-cta-text h3{font-family:"Fraunces",Georgia,serif;font-size:20px;font-weight:700;color:#fff;margin-bottom:6px}.aeo-mid-cta-text p{font-size:13px;color:rgba(255,255,255,0.6)}.aeo-mid-cta-actions{display:flex;gap:10px;flex-shrink:0;flex-wrap:wrap}.aeo-btn-call{display:inline-flex;align-items:center;gap:8px;padding:12px 24px;border-radius:100px;background:#14B8A6;color:#fff;font-size:14px;font-weight:700;text-decoration:none}.aeo-btn-schedule{display:inline-flex;align-items:center;gap:8px;padding:12px 24px;border-radius:100px;background:rgba(255,255,255,0.1);border:1.5px solid rgba(255,255,255,0.2);color:#fff;font-size:14px;font-weight:600;text-decoration:none}.aeo-compare{max-width:800px;margin:16px auto 40px;padding:0 24px}.aeo-compare-title{font-family:"Fraunces",Georgia,serif;font-size:24px;font-weight:700;color:#1A2332;margin-bottom:4px}.aeo-compare-sub{font-size:13px;color:#6B7B8D;margin-bottom:20px}.aeo-compare-table{width:100%;border-collapse:separate;border-spacing:0;border-radius:12px;overflow:hidden;border:1px solid #E8ECF0}.aeo-compare-table thead th{background:#0D9488;color:#fff;font-size:13px;font-weight:700;padding:14px 18px;text-align:left}.aeo-compare-table tbody td{padding:12px 18px;font-size:14px;border-bottom:1px solid #F3F5F7}.aeo-compare-table tbody tr:last-child td{border-bottom:none}.aeo-compare-table tbody td:first-child{font-weight:600;color:#1A2332;background:#F8FAFC}.aeo-compare-insight{margin-top:16px;padding:16px 20px;background:linear-gradient(135deg,#F0FDFA,#CCFBF1);border-radius:10px;font-size:14px;color:#1A2332;line-height:1.6;font-style:italic}.aeo-compare-insight strong{font-style:normal}.aeo-bottom-cta{background:linear-gradient(135deg,#0D9488,#14B8A6);padding:48px 24px;text-align:center;margin-top:32px}.aeo-bottom-cta h3{font-family:"Fraunces",Georgia,serif;font-size:clamp(22px,3vw,30px);font-weight:700;color:#fff;margin-bottom:8px}.aeo-bottom-cta p{font-size:15px;color:rgba(255,255,255,0.85);margin-bottom:24px}.aeo-bottom-cta-actions{display:flex;justify-content:center;gap:14px;flex-wrap:wrap}.aeo-bottom-btn{display:inline-flex;align-items:center;gap:8px;padding:14px 32px;border-radius:100px;font-size:16px;font-weight:700;text-decoration:none}.aeo-bottom-btn--white{background:#fff;color:#0D9488}.aeo-bottom-btn--ghost{background:rgba(255,255,255,0.15);color:#fff;border:1.5px solid rgba(255,255,255,0.3)}.aeo-footer{max-width:800px;margin:0 auto;padding:32px 24px;text-align:center;font-size:11px;color:#6B7B8D;line-height:1.8}.aeo-footer a{color:#4B9CD3;text-decoration:none}@media(max-width:640px){.aeo-trust{padding:12px 16px}.aeo-mid-cta-inner{flex-direction:column;text-align:center}.aeo-answer-block{margin-left:0}}`;

// Build AEO page HTML from Q&As + optional compare table
function buildAEOPageHtml(qas: AeoQA[], compareTable: CompareTable | null, slug: string): string {
  const today = new Date().toISOString().split('T')[0];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const d = new Date();
  const dateStr = `${months[d.getMonth()]} ${d.getFullYear()}`;
  let title = (slug || 'faq').replace(/-/g, ' ').replace(/\bfaq\b/gi, '').trim().split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  if (!title) title = 'Medicare FAQ';

  const halfIdx = Math.ceil(qas.length / 2);
  const buildQAHtml = (items: AeoQA[]) => items.map((qa, idx) => {
    const attr = idx % 2 === 0 ? '<div class="aeo-answer-attr"><div class="aeo-attr-avatar">RS</div>\u2014 Rob Simm, GenerationHealth.me \u00b7 (828) 761-3326</div>' : '';
    const dagger = qa.dagger ? `<div class="aeo-nepq-dagger">${qa.dagger} <a href="tel:828-761-3326">Find out in 5 minutes \u2192</a></div>` : '';
    return `<div class="aeo-qa-item"><div class="aeo-question"><div class="aeo-q-icon">Q</div><div class="aeo-q-text">${qa.question}</div></div><div class="aeo-answer-block"><div class="aeo-answer-text">${qa.answer}</div>${attr}${dagger}</div></div>`;
  }).join('\n');

  const trustStrip = `<div class="aeo-trust"><div class="aeo-trust-brand"><a href="https://generationhealth.me" class="aeo-trust-logo">Generation<span>Health</span><span>.me</span></a><div class="aeo-trust-divider"></div><div class="aeo-trust-advisor"><div class="aeo-trust-avatar">RS</div><div><div class="aeo-trust-name">Rob Simm</div><div class="aeo-trust-title">Your Licensed NC Medicare Advisor</div></div></div></div><div class="aeo-trust-creds"><span class="aeo-cred">NC #10447418</span><span class="aeo-cred">NPN #10447418</span><span class="aeo-cred">AHIP Certified</span></div><a href="tel:828-761-3326" class="aeo-trust-phone">\ud83d\udcde (828) 761-3326</a></div>`;
  const header = `<div class="aeo-header"><h1 class="aeo-h1">${title}:<br>Your Questions Answered</h1><p class="aeo-subtitle">Direct answers to the most common questions, updated for 2026.</p><div class="aeo-update-strip"><strong>Last Updated:</strong> ${dateStr} \u00b7 <strong>Reviewed by:</strong> Rob Simm, Licensed Medicare Broker \u00b7 <strong>${qas.length} Questions</strong></div></div>`;
  const midCta = `<div class="aeo-mid-cta"><div class="aeo-mid-cta-inner"><div class="aeo-mid-cta-text"><h3>Ready to talk? I'm here right now.</h3><p>15 minutes. No pressure. Real answers for your specific situation.</p></div><div class="aeo-mid-cta-actions"><a href="tel:828-761-3326" class="aeo-btn-call">\ud83d\udcde Call Now</a><a href="https://www.sunfirematrix.com/app/consumer/medicareadvocates/10447418/#/" class="aeo-btn-call" style="background:#4B9CD3;">\u2696\ufe0f Compare Plans</a><a href="https://calendly.com/robert-generationhealth/new-meeting" class="aeo-btn-schedule">\ud83d\udcc5 Schedule</a></div></div></div>`;

  let compareHtml = '';
  if (compareTable) {
    const headerCells = `<th>Feature</th>${compareTable.options.map((o) => `<th>${o}</th>`).join('')}`;
    const rows = compareTable.rows.map((r) => `<tr><td>${r.feature}</td>${r.values.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('');
    compareHtml = `<div class="aeo-compare"><h2 class="aeo-compare-title">${compareTable.title}</h2><div class="aeo-compare-sub">Updated for 2026 \u00b7 North Carolina</div><table class="aeo-compare-table"><thead><tr>${headerCells}</tr></thead><tbody>${rows}</tbody></table>${compareTable.brokerInsight ? `<div class="aeo-compare-insight"><strong>Rob's take:</strong> ${compareTable.brokerInsight}</div>` : ''}</div>`;
  }

  const faqSchema = qas.map((qa) => `{"@type":"Question","name":"${qa.question.replace(/"/g, '\\"')}","acceptedAnswer":{"@type":"Answer","text":"${qa.answer.replace(/"/g, '\\"')}","author":{"@id":"https://generationhealth.me/#author"}}}`).join(',');
  const bottomCta = `<div class="aeo-bottom-cta"><h3>Need Help with ${title}?</h3><p>I help Durham and Wake County residents navigate these decisions \u2014 at no cost to you.</p><div class="aeo-bottom-cta-actions"><a href="tel:828-761-3326" class="aeo-bottom-btn aeo-bottom-btn--white">\ud83d\udcde Call (828) 761-3326</a><a href="https://www.sunfirematrix.com/app/consumer/medicareadvocates/10447418/#/" class="aeo-bottom-btn aeo-bottom-btn--white" style="color:#4B9CD3;">\u2696\ufe0f Compare Plans Free</a><a href="https://calendly.com/robert-generationhealth/new-meeting" class="aeo-bottom-btn aeo-bottom-btn--ghost">\ud83d\udcc5 Schedule a Call</a></div></div>`;
  const footer = `<div class="aeo-footer"><p><strong>GenerationHealth.me</strong> is operated by Robert Jason Simm, NPN #10447418. Licensed in North Carolina. We do not offer every plan available in your area. Please contact <a href="https://medicare.gov">Medicare.gov</a> or 1-800-MEDICARE for information on all of your options. Not affiliated with or endorsed by the federal Medicare program.</p></div>`;

  return `<!-- AEO Page v2.2: ${slug} \u00b7 Generated ${today} -->\n<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"FAQPage","@id":"https://generationhealth.me/${slug}/#faqpage","name":"${title}: Your Questions Answered","url":"https://generationhealth.me/${slug}","author":{"@id":"https://generationhealth.me/#author"},"datePublished":"${today}","dateModified":"${today}","mainEntity":[${faqSchema}]}]}<\/script>\n\n<style>${AEO_CSS}</style>\n\n${trustStrip}\n${header}\n<div class="aeo-qa-list">${buildQAHtml(qas.slice(0, halfIdx))}</div>\n${midCta}\n<div class="aeo-qa-list">${buildQAHtml(qas.slice(halfIdx))}</div>\n${compareHtml}\n${bottomCta}\n${footer}`;
}

// ═══════════════════════════════════════════════════
// CITATION MONITOR PANEL
// ═══════════════════════════════════════════════════
export default function CitationMonitorPanel() {
  const { addToPipeline } = useAppState();

  // ── API Keys ──
  const [claudeKey, setClaudeKey] = useState(() => getFromStorage(LS_CLAUDE_KEY, ''));
  const [cmKeys, setCmKeys] = useState<Record<string, string>>(() => getFromStorage(LS_CM_KEYS, {}));
  const getKey = (llm: string) => cmKeys[llm] || (llm === 'claude' ? claudeKey : '');
  const setKey = (llm: string, val: string) => { const k = { ...cmKeys, [llm]: val }; setCmKeys(k); saveToStorage(LS_CM_KEYS, k); if (llm === 'claude' && !cmKeys.claude) { setClaudeKey(val); saveToStorage(LS_CLAUDE_KEY, val); } };

  // ── Scan state ──
  const [cmData, setCmData] = useState<CMData>(() => getFromStorage(LS_CM_DATA, { results: [], lastScan: null, totalScans: 0 }));
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState('');
  const [scanCount, setScanCount] = useState(0);
  const [scanTotal, setScanTotal] = useState(0);
  const [showKeys, setShowKeys] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // ── AEO state ──
  const [aeoQuery, setAeoQuery] = useState<string | null>(null);
  const [aeoQAs, setAeoQAs] = useState<AeoQA[]>([]);
  const [aeoCompare, setAeoCompare] = useState<CompareTable | null>(null);
  const [aeoGenerating, setAeoGenerating] = useState(false);
  const [aeoProgress, setAeoProgress] = useState(0);
  const [aeoHtml, setAeoHtml] = useState('');
  const [aeoPreview, setAeoPreview] = useState(false);
  const [aeoCopied, setAeoCopied] = useState(false);

  useEffect(() => { saveToStorage(LS_CM_DATA, cmData); }, [cmData]);

  // ── Stats ──
  const stats = useMemo(() => {
    const byQuery: Record<string, ScanResult[]> = {};
    cmData.results.forEach((r) => { if (!byQuery[r.queryId]) byQuery[r.queryId] = []; byQuery[r.queryId].push(r); });
    const queriesChecked = Object.keys(byQuery).length;
    const cited = Object.values(byQuery).filter((rs) => rs.some((r) => r.cited)).length;
    const winRate = queriesChecked > 0 ? Math.round((cited / queriesChecked) * 100) : 0;
    const coverage = Math.round((queriesChecked / CM_QUERIES.length) * 100);
    const cats = new Set(CM_QUERIES.map((q) => q.category));
    const coveredCats = new Set(CM_QUERIES.filter((q) => byQuery[q.id]?.some((r) => r.cited)).map((q) => q.category));
    const authorityScore = Math.round((winRate / 100 * 0.4 + (coveredCats.size / cats.size) * 0.3 + 0.5 * 0.3) * 100);
    return { queriesChecked, cited, winRate, coverage, authorityScore, total: CM_QUERIES.length };
  }, [cmData.results]);

  const queryResults = useMemo(() => {
    const map: Record<string, Record<string, ScanResult>> = {};
    cmData.results.forEach((r) => { if (!map[r.queryId]) map[r.queryId] = {}; map[r.queryId][r.llm] = r; });
    return map;
  }, [cmData.results]);

  const filteredQueries = useMemo(() => {
    let qs = categoryFilter ? CM_QUERIES.filter((q) => q.category === categoryFilter) : CM_QUERIES;
    // Sort: priority first, then lost → partial → won
    return [...qs].sort((a, b) => {
      if (a.priority && !b.priority) return -1;
      if (!a.priority && b.priority) return 1;
      const aRes = queryResults[a.id]; const bRes = queryResults[b.id];
      const aCited = aRes ? Object.values(aRes).filter((r) => r.cited).length : -1;
      const bCited = bRes ? Object.values(bRes).filter((r) => r.cited).length : -1;
      return aCited - bCited;
    });
  }, [categoryFilter, queryResults]);

  // ── Scan ──
  const runFullScan = useCallback(async () => {
    const llms: Array<{ id: string; fn: (q: string, k: string) => Promise<LLMResult>; key: string }> = [];
    if (getKey('claude')) llms.push({ id: 'claude', fn: queryClaude, key: getKey('claude') });
    if (getKey('chatgpt')) llms.push({ id: 'chatgpt', fn: queryChatGPT, key: getKey('chatgpt') });
    if (getKey('perplexity')) llms.push({ id: 'perplexity', fn: queryPerplexity, key: getKey('perplexity') });
    if (getKey('gemini')) llms.push({ id: 'gemini', fn: queryGemini, key: getKey('gemini') });
    if (llms.length === 0) { alert('Add at least one API key.'); setShowKeys(true); return; }
    setScanning(true); const total = CM_QUERIES.length * llms.length; setScanTotal(total); setScanCount(0);
    const newResults: ScanResult[] = []; let count = 0;
    for (const q of CM_QUERIES) {
      for (const llm of llms) {
        count++; setScanCount(count); setScanProgress(`${llm.id}: "${q.query.slice(0, 30)}..."`);
        try {
          const result = await llm.fn(q.query, llm.key);
          const cited = result.success ? detectCitationLocal(result.response || '') : false;
          const competitors = result.success ? detectCompetitors(result.response || '') : [];
          newResults.push({ queryId: q.id, llm: llm.id, cited, snippet: result.response?.slice(0, 200), competitors });
        } catch { newResults.push({ queryId: q.id, llm: llm.id, cited: false }); }
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
    setCmData({ results: newResults, lastScan: new Date().toISOString(), totalScans: cmData.totalScans + 1 });
    setScanning(false); setScanProgress('');
  }, [cmData.totalScans, cmKeys, claudeKey]);

  // ── AEO Content Generation ──
  const generateAEO = useCallback(async (queryText: string) => {
    const key = getKey('claude');
    if (!key) { alert('Add Claude API key first.'); return; }
    setAeoQuery(queryText); setAeoGenerating(true); setAeoProgress(10); setAeoQAs([]); setAeoCompare(null); setAeoHtml('');
    try {
      setAeoProgress(30);
      const systemPrompt = `You are an AEO (Answer Engine Optimization) content specialist for GenerationHealth.me.\n\nGenerate content optimized for LLM citation. Create:\n\n1. 8 Q&A PAIRS - Each answer should:\n- Start with a direct, factual answer\n- Include specific numbers, dates, or facts\n- Be 2-4 sentences maximum\n- Include North Carolina-specific details when relevant\n- Use 2026 Medicare figures: Part B premium $202.90/mo, Part B deductible $283, Part A deductible $1,736, Part D OOP cap $2,100, insulin cap $35/mo, MA OOP max $9,350\n\n2. COMPARISON TABLE (if topic involves comparing options):\n- 2-3 options being compared\n- 6-8 comparison rows with specific facts\n- Clear recommendation if applicable\n- Broker insight\n\nAuthor: Rob Simm, Licensed NC Medicare Broker (NPN #10447418), Phone: (828) 761-3326, Durham NC\n\nOUTPUT FORMAT (JSON only, no markdown):\n{"qas":[{"question":"text","answer":"text","aeoScore":85}],"compareTable":{"title":"","options":["A","B"],"recommended":0,"rows":[{"feature":"","values":["",""],"goodIndex":0}],"brokerInsight":""}}\n\nIf no comparison needed, set compareTable to null.`;
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4000, system: systemPrompt, messages: [{ role: 'user', content: `Generate AEO-optimized content for: "${queryText}"\n\nInclude both Q&As and a comparison table if the topic involves comparing plans, costs, or options.` }] }),
      });
      setAeoProgress(70);
      const data = await resp.json();
      if (data.error) throw new Error(data.error.message);
      const txt = (data.content?.[0]?.text || '{}').replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(txt);
      const qas: AeoQA[] = (parsed.qas || []).map((qa: { question: string; answer: string; aeoScore?: number }, i: number) => ({
        id: `qa-${i + 1}`, question: qa.question, answer: qa.answer, aeoScore: qa.aeoScore || 85,
      }));
      setAeoQAs(qas);
      setAeoCompare(parsed.compareTable || null);
      // Build HTML
      const slug = queryText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const html = buildAEOPageHtml(qas, parsed.compareTable || null, slug);
      setAeoHtml(html);
      setAeoProgress(100);
    } catch (e) {
      alert('AEO generation failed: ' + (e instanceof Error ? e.message : String(e)));
    }
    setAeoGenerating(false);
  }, [cmKeys, claudeKey]);

  // ── Deploy to pipeline ──
  const deployToPipeline = useCallback((queryText: string) => {
    const slug = queryText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const q = CM_QUERIES.find((x) => x.query === queryText);
    const entry: AeoPipelineEntry = { id: `aeo-${q?.id || 'custom'}-${Date.now()}`, queryId: q?.id || 'custom', query: queryText, title: queryText.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), slug, html: aeoHtml || undefined, deployedAt: new Date().toISOString() };
    addToPipeline(entry);
    alert(`Deployed to AEO pipeline: "${queryText}"\nSlug: /${slug}\n\nGo to Content Studio to promote, then Indexing to submit.`);
  }, [addToPipeline, aeoHtml]);

  // ── Preview in new window ──
  const openPreview = useCallback(() => {
    if (!aeoHtml) return;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>AEO Preview</title><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Fraunces:wght@400;600;700;800&display=swap" rel="stylesheet"><style>body{margin:0;font-family:"DM Sans",sans-serif;}</style></head><body>${aeoHtml}</body></html>`);
      win.document.close();
    }
  }, [aeoHtml]);

  const inputCls = "w-full px-3 py-2 rounded-lg border border-white/[0.12] bg-white/[0.04] text-white text-xs outline-none";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-white flex items-center gap-2"><span>🎯</span> Citation Monitor</h2>
          <p className="text-xs text-gh-text-muted mt-1">{stats.total} queries · 7 categories · Local-first v2.0 · AEO v2.2 builder</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowKeys(!showKeys)} className="px-3 py-2 rounded-xl text-xs font-semibold border border-white/10 text-gh-text-muted"><Key className="w-3 h-3 inline mr-1" />API Keys</button>
          <button onClick={runFullScan} disabled={scanning} className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-500 to-blue-500 text-white disabled:opacity-50">
            {scanning ? <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" />{scanCount}/{scanTotal}</span> : <span className="flex items-center gap-1.5"><Play className="w-3 h-3" />Run Full Scan</span>}
          </button>
        </div>
      </div>

      {/* Scan progress */}
      {scanning && (
        <div className="card p-4">
          <div className="flex justify-between text-xs mb-2"><span className="text-gh-text-soft">{scanProgress}</span><span className="font-bold text-white">{Math.round((scanCount / scanTotal) * 100)}%</span></div>
          <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden"><div className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all" style={{ width: `${(scanCount / scanTotal) * 100}%` }} /></div>
        </div>
      )}

      {/* API Keys */}
      {showKeys && (
        <div className="card p-5 space-y-3">
          <div className="text-[11px] font-bold text-gh-text-muted uppercase tracking-widest">API Keys</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(['claude', 'chatgpt', 'perplexity', 'gemini'] as const).map((llm) => (
              <div key={llm}><label className="text-[10px] font-bold text-gh-text-muted block mb-1 capitalize">{llm}</label><input type="password" value={getKey(llm)} onChange={(e) => setKey(llm, e.target.value)} placeholder={llm === 'claude' ? 'sk-ant-...' : llm === 'chatgpt' ? 'sk-...' : llm === 'perplexity' ? 'pplx-...' : 'AI...'} className={inputCls} /></div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[{ label: 'AUTHORITY', value: stats.authorityScore, color: '#4B9CD3' }, { label: 'WIN RATE', value: `${stats.winRate}%`, color: stats.winRate > 0 ? '#4ADE80' : '#6B7B8D' }, { label: 'CITED', value: `${stats.cited}/${stats.total}`, color: stats.cited > 0 ? '#4ADE80' : '#6B7B8D' }, { label: 'COVERAGE', value: `${stats.coverage}%`, color: '#A78BFA' }, { label: 'SCANS', value: cmData.totalScans, color: '#FFC72C' }].map((s) => (
          <div key={s.label} className="card p-3 text-center"><div className="text-xl font-extrabold tabular-nums" style={{ color: String(s.color) }}>{s.value}</div><div className="text-[10px] font-semibold text-gh-text-muted uppercase tracking-wider mt-0.5">{s.label}</div></div>
        ))}
      </div>

      {/* Category filters */}
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setCategoryFilter(null)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${!categoryFilter ? 'bg-white/[0.12] text-white' : 'bg-white/[0.04] text-gh-text-muted'}`}>All ({CM_QUERIES.length})</button>
        {CM_CATEGORIES.map((cat) => (
          <button key={cat.id} onClick={() => setCategoryFilter(categoryFilter === cat.id ? null : cat.id)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all" style={{ background: categoryFilter === cat.id ? `${cat.color}25` : 'rgba(255,255,255,0.04)', color: categoryFilter === cat.id ? cat.color : '#6B7B8D' }}>
            {cat.name} ({cat.count})
          </button>
        ))}
      </div>

      {/* AEO Generation Panel */}
      {aeoQuery && (
        <div className="card p-5 space-y-4 border-2 border-teal-500/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">AEO Content Factory</div>
              <div className="text-sm font-bold text-white mt-1">&quot;{aeoQuery}&quot;</div>
            </div>
            <button onClick={() => { setAeoQuery(null); setAeoQAs([]); setAeoCompare(null); setAeoHtml(''); }} className="p-1.5 text-gh-text-faint hover:text-white"><X className="w-4 h-4" /></button>
          </div>

          {aeoGenerating && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs"><span className="text-gh-text-soft">Generating AEO content...</span><span className="text-teal-400 font-bold">{aeoProgress}%</span></div>
              <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden"><div className="h-2 rounded-full bg-teal-500 transition-all" style={{ width: `${aeoProgress}%` }} /></div>
            </div>
          )}

          {aeoQAs.length > 0 && (
            <>
              <div className="text-[10px] font-bold text-gh-text-muted uppercase">{aeoQAs.length} Q&As Generated {aeoCompare ? '+ Comparison Table' : ''}</div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {aeoQAs.map((qa) => (
                  <div key={qa.id} className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <div className="text-xs font-bold text-white">{qa.question}</div>
                    <div className="text-[10px] text-gh-text-soft mt-1 line-clamp-2">{qa.answer}</div>
                    <div className="text-[9px] text-teal-400 mt-1">AEO Score: {qa.aeoScore}</div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 flex-wrap">
                <button onClick={openPreview} className="px-3 py-2 rounded-xl text-[11px] font-bold border border-teal-500/30 text-teal-400 hover:bg-teal-500/10"><Eye className="w-3 h-3 inline mr-1" />Preview Page</button>
                <button onClick={() => { navigator.clipboard.writeText(aeoHtml); setAeoCopied(true); setTimeout(() => setAeoCopied(false), 2000); }} className="px-3 py-2 rounded-xl text-[11px] font-bold border border-white/10 text-gh-text-soft hover:bg-white/[0.04]">
                  {aeoCopied ? <><Check className="w-3 h-3 inline text-emerald-400" /> Copied</> : <><Copy className="w-3 h-3 inline mr-1" />Copy HTML</>}
                </button>
                <button onClick={() => aeoQuery && deployToPipeline(aeoQuery)} className="px-3 py-2 rounded-xl text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-500">
                  <Zap className="w-3 h-3 inline mr-1" />Deploy to Pipeline
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Query Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead><tr>
            {['#', 'QUERY', 'CAT', 'CLAUDE', 'CHATGPT', 'PERPLEXITY', 'GEMINI', 'COMPETITORS', ''].map((h) => (
              <th key={h} className="px-2.5 py-2 text-[10px] font-bold text-gh-text-muted uppercase tracking-wider border-b border-white/[0.06] text-left whitespace-nowrap">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filteredQueries.map((q, qi) => {
              const results = queryResults[q.id] || {};
              const cat = CM_CATEGORIES.find((c) => c.id === q.category);
              const citedCount = Object.values(results).filter((r) => r.cited).length;
              const scanned = Object.keys(results).length > 0;
              const allComps = new Set<string>();
              Object.values(results).forEach((r) => r.competitors?.forEach((c) => allComps.add(c)));
              return (
                <tr key={q.id} className={`border-b border-white/[0.04] hover:bg-white/[0.02] ${q.priority ? 'bg-nc-gold/[0.02]' : ''}`}>
                  <td className="px-2.5 py-2.5 text-xs text-gh-text-faint tabular-nums">{qi + 1}{q.priority && <Star className="w-2.5 h-2.5 inline ml-1 text-nc-gold" />}</td>
                  <td className="px-2.5 py-2.5"><div className="text-xs font-medium text-white">{q.query}</div></td>
                  <td className="px-2.5 py-2.5"><span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${cat?.color || '#6B7B8D'}18`, color: cat?.color || '#6B7B8D' }}>{cat?.name?.split(' ').slice(0, 2).join(' ')}</span></td>
                  {(['claude', 'chatgpt', 'perplexity', 'gemini'] as const).map((llm) => {
                    const r = results[llm]; if (!r) return <td key={llm} className="px-2.5 py-2.5 text-center"><span className="text-[10px] text-gh-text-faint">—</span></td>;
                    return <td key={llm} className="px-2.5 py-2.5 text-center">{r.cited ? <Check className="w-3.5 h-3.5 text-emerald-400 inline" /> : <X className="w-3.5 h-3.5 text-red-400 inline" />}</td>;
                  })}
                  <td className="px-2.5 py-2.5"><div className="flex flex-wrap gap-1">{Array.from(allComps).slice(0, 3).map((c) => <span key={c} className="text-[9px] bg-white/[0.06] text-gh-text-muted px-1.5 py-0.5 rounded">{c}</span>)}</div></td>
                  <td className="px-2.5 py-2.5">
                    <div className="flex gap-1">
                      {scanned && citedCount === 0 && (
                        <button onClick={() => generateAEO(q.query)} disabled={aeoGenerating} className="px-2 py-1 rounded text-[10px] font-bold border border-red-400/30 text-red-400 hover:bg-red-400/10 disabled:opacity-40">Attack →</button>
                      )}
                      {scanned && citedCount > 0 && citedCount < 4 && (
                        <button onClick={() => generateAEO(q.query)} disabled={aeoGenerating} className="px-2 py-1 rounded text-[10px] font-bold border border-amber-400/30 text-amber-400 hover:bg-amber-400/10 disabled:opacity-40">Defend →</button>
                      )}
                      {!scanned && (
                        <button onClick={() => generateAEO(q.query)} disabled={aeoGenerating} className="px-2 py-1 rounded text-[10px] font-bold border border-teal-500/30 text-teal-400 hover:bg-teal-500/10 disabled:opacity-40">+ AEO</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {cmData.lastScan && <div className="text-[11px] text-gh-text-faint text-center">Last scan: {new Date(cmData.lastScan).toLocaleString()}</div>}
    </div>
  );
}
