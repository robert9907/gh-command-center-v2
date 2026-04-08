'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2, Check, X, Key, Play, Eye } from 'lucide-react';
import { CM_QUERIES, CM_CATEGORIES, CM_COMPETITORS } from '@/data/citation-queries';
import { queryClaude, queryChatGPT, queryPerplexity, queryGemini, detectCitation, type LLMResult } from '@/lib/llm';
import { getFromStorage, saveToStorage } from '@/lib/utils';
import { useAppState, type AeoPipelineEntry } from '@/lib/AppState';

const LS_CM_DATA = 'gh-cc-citation-monitor';
const LS_CLAUDE_KEY = 'gh-cc-pb-apikey';
const LS_OPENAI_KEY = 'gh-cc-openai-key';
const LS_PERPLEXITY_KEY = 'gh-cc-perplexity-key';
const LS_GOOGLE_KEY = 'gh-cc-google-key';

interface ScanResult { queryId: string; llm: string; cited: boolean; citationType: string | null; match: string | null; timestamp: string; snippet?: string; competitors?: string[] }
interface CMData { results: ScanResult[]; lastScan: string | null; totalScans: number }
interface QAPair { id: string; question: string; answer: string; aeoScore: number }
interface CompareTable { title: string; options: string[]; recommended: number | null; rows: Array<{ feature: string; values: string[]; goodIndex: number | null }>; brokerInsight: string }

// Intent-driven opening patterns
const INTENT_FRAMING: Record<string, { opening: string; cta_tone: string; emotional_hook: string }> = {
  urgency: { opening: "Lead every answer with IMMEDIACY. The person is running out of time. Start with time-sensitive framing: 'You still have time...', 'Act before...'. Make the CTA feel like a lifeline.", cta_tone: "Call now — I can walk you through this in 15 minutes", emotional_hook: "This person is stressed about a deadline. Acknowledge the urgency, then reassure them." },
  fear: { opening: "Lead every answer with REASSURANCE. The person is scared they'll lose something. Start with: 'You won't lose...', 'Here's exactly what happens...'. Replace anxiety with specific facts.", cta_tone: "Let me check your specific situation — no cost, no pressure", emotional_hook: "This person is afraid they made a mistake. Calm the fear with specifics." },
  confusion: { opening: "Lead every answer with CLARITY. The person is overwhelmed. Start with: 'Here's the simple version...', 'In plain English...'. Never assume they know Medicare jargon.", cta_tone: "Still confused? I explain this in plain English every day — call me", emotional_hook: "This person has read 10 explanations and none made sense. Be the one that does." },
  validation: { opening: "Lead every answer with CONFIRMATION or CORRECTION. The person thinks they know but wants to verify. Start with: 'Yes, that's correct...', 'Actually, that changed in 2026...'.", cta_tone: "Want me to double-check your specific plan? Takes 5 minutes", emotional_hook: "This person did research but isn't 100% sure. Confirm what's right, correct what's wrong." },
  trust: { opening: "Lead every answer with CREDIBILITY and LOCAL AUTHORITY. Start with Rob's direct experience: 'In my 12 years helping Durham families...'. Make it personal and local.", cta_tone: "I'm right here in Durham — call me directly at (828) 761-3326", emotional_hook: "This person is done with websites and 1-800 numbers. They want a real person." },
};

// Intent banner config for AEO pages
const INTENT_BANNERS: Record<string, { icon: string; color: string; bg: string; bg2: string; border: string; text: string }> = {
  urgency: { icon: '⏰', color: '#F87171', bg: 'rgba(248,113,113,0.08)', bg2: 'rgba(248,113,113,0.03)', border: 'rgba(248,113,113,0.2)', text: "<strong>Need help right now?</strong> You don't have to figure this out alone. Call <a href='tel:828-761-3326' style='color:#F87171;font-weight:700;'>(828) 761-3326</a> and I'll walk you through your options in 15 minutes." },
  fear: { icon: '😟', color: '#FBBF24', bg: 'rgba(251,191,36,0.08)', bg2: 'rgba(251,191,36,0.03)', border: 'rgba(251,191,36,0.2)', text: "<strong>Worried about losing coverage?</strong> You have more options than you think. Call <a href='tel:828-761-3326' style='color:#FBBF24;font-weight:700;'>(828) 761-3326</a> and I'll check your situation in 5 minutes." },
  confusion: { icon: '🤔', color: '#60A5FA', bg: 'rgba(96,165,250,0.08)', bg2: 'rgba(96,165,250,0.03)', border: 'rgba(96,165,250,0.2)', text: "<strong>Medicare doesn't have to be confusing.</strong> I explain this in plain English every day. Call <a href='tel:828-761-3326' style='color:#60A5FA;font-weight:700;'>(828) 761-3326</a>." },
  validation: { icon: '✅', color: '#A78BFA', bg: 'rgba(167,139,250,0.08)', bg2: 'rgba(167,139,250,0.03)', border: 'rgba(167,139,250,0.2)', text: "<strong>Want to double-check your plan?</strong> Smart move. Call <a href='tel:828-761-3326' style='color:#A78BFA;font-weight:700;'>(828) 761-3326</a> and I'll verify yours in 5 minutes." },
  trust: { icon: '🤝', color: '#4ADE80', bg: 'rgba(74,222,128,0.08)', bg2: 'rgba(74,222,128,0.03)', border: 'rgba(74,222,128,0.2)', text: "<strong>Looking for someone you can trust?</strong> I'm Rob Simm — licensed, independent, right here in NC. Call <a href='tel:828-761-3326' style='color:#4ADE80;font-weight:700;'>(828) 761-3326</a>." },
};

const NEPQ_DAGGERS = [
  "What happens to your coverage if you don't act before the deadline?",
  "Are you sure the plan you're looking at covers the doctors you actually see?",
  "What if the plan you're comparing isn't actually the cheapest once you add up the real costs?",
  "When was the last time someone checked whether your current plan still covers your doctors?",
  "How much is the late enrollment penalty costing you every month — for the rest of your life?",
  "How many plans did the last person who \"helped\" you actually compare before recommending one?",
  "What if you qualify for savings you don't even know about?",
  "Are you paying more than you should because no one told you about a better option?",
];
const NEPQ_CTAS = ["Find out in 5 minutes →", "I'll check for you →", "Let me run the numbers →", "I'll verify right now →", "Let me check your options →", "I compare every option →", "I'll check in 5 minutes →", "Let's find out together →"];

const INTENT_COLORS: Record<string, { bg: string; color: string; icon: string }> = {
  urgency: { bg: 'rgba(248,113,113,0.15)', color: '#F87171', icon: '⏰' },
  fear: { bg: 'rgba(251,191,36,0.15)', color: '#FBBF24', icon: '😟' },
  confusion: { bg: 'rgba(96,165,250,0.15)', color: '#60A5FA', icon: '🤔' },
  validation: { bg: 'rgba(167,139,250,0.15)', color: '#A78BFA', icon: '✅' },
  trust: { bg: 'rgba(74,222,128,0.15)', color: '#4ADE80', icon: '🤝' },
};

function detectCompetitors(text: string): string[] {
  const found: string[] = [];
  const lower = text.toLowerCase();
  CM_COMPETITORS.forEach((c) => { if (c.patterns.some((p) => lower.includes(p))) found.push(c.name); });
  return found;
}

// ── Build AEO Page HTML v2.2 ──
function buildAEOPageHtml(qas: QAPair[], compareTable: CompareTable | null, slug: string, query: string, intent: string, deployOpts: { website: boolean; schema: boolean; embed: boolean; compareTable: boolean }): string {
  if (qas.length === 0) return '';
  const today = new Date().toISOString().split('T')[0];
  const d = new Date();
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthYear = monthNames[d.getMonth()] + ' ' + d.getFullYear();
  const title = query.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const ib = INTENT_BANNERS[intent] || INTENT_BANNERS.confusion;

  // Build Q&A blocks with attribution at 25/50/75
  const totalQAs = qas.length;
  const attrPositions: number[] = [];
  if (totalQAs >= 2) attrPositions.push(Math.round(totalQAs * 0.25) - 1);
  if (totalQAs >= 4) attrPositions.push(Math.round(totalQAs * 0.50) - 1);
  if (totalQAs >= 6) attrPositions.push(Math.round(totalQAs * 0.75) - 1);

  function buildQABlock(qa: QAPair, idx: number) {
    const hasAttr = attrPositions.includes(idx);
    const di = idx % NEPQ_DAGGERS.length;
    const attrHtml = hasAttr ? '<div class="aeo-answer-attr"><div class="aeo-attr-avatar">RS</div>— Rob Simm, GenerationHealth.me · (828) 761-3326</div>' : '';
    return `<div class="aeo-qa-item"><div class="aeo-question"><div class="aeo-q-icon">Q</div><div class="aeo-q-text">${qa.question}</div></div><div class="aeo-answer-block"><div class="aeo-answer-text">${qa.answer}</div>${attrHtml}<div class="aeo-nepq-dagger">${NEPQ_DAGGERS[di]} <a href="tel:828-761-3326">${NEPQ_CTAS[di]}</a></div></div></div>`;
  }

  const firstHalf = qas.slice(0, Math.ceil(totalQAs / 2));
  const secondHalf = qas.slice(Math.ceil(totalQAs / 2));
  const firstHalfHtml = firstHalf.map((qa, i) => buildQABlock(qa, i)).join('\n');
  const secondHalfHtml = secondHalf.map((qa, i) => buildQABlock(qa, i + firstHalf.length)).join('\n');

  // Compare table
  let compareHtml = '';
  if (compareTable && deployOpts.compareTable) {
    const ct = compareTable;
    const headerCells = '<th style="color:#14B8A6;">Feature</th>' + ct.options.map((opt) => `<th>${opt}</th>`).join('');
    const rowsHtml = ct.rows.map((row) => '<tr><td>' + row.feature + '</td>' + row.values.map((val) => `<td style="color:#0D9488;font-weight:500;">${val}</td>`).join('') + '</tr>').join('');
    compareHtml = `<div class="aeo-compare"><h2 class="aeo-compare-title">${ct.title}</h2><div class="aeo-compare-sub">Updated for 2026 · North Carolina</div><table class="aeo-compare-table"><thead><tr>${headerCells}</tr></thead><tbody>${rowsHtml}</tbody></table>${ct.brokerInsight ? `<div class="aeo-compare-insight"><strong>Rob's take:</strong> ${ct.brokerInsight}</div>` : ''}</div>`;
  }

  // Schema
  const faqSchema = qas.map((qa) => `{"@type":"Question","name":"${qa.question.replace(/"/g, '\\"')}","acceptedAnswer":{"@type":"Answer","text":"${qa.answer.replace(/"/g, '\\"')}","author":{"@id":"https://generationhealth.me/#author"}}}`).join(',');

  // CSS (v2.2)
  const css = '*{margin:0;padding:0;box-sizing:border-box;}.aeo-trust{background:linear-gradient(135deg,#0F2440 0%,#1A2332 100%);padding:16px 24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;}.aeo-trust-brand{display:flex;align-items:center;gap:14px;}.aeo-trust-logo{font-family:Fraunces,Georgia,serif;font-size:20px;font-weight:700;color:#fff;text-decoration:none;}.aeo-trust-logo span{color:#14B8A6;}.aeo-trust-logo .dot{color:#6B7B8D;font-weight:500;}.aeo-trust-divider{width:1px;height:28px;background:rgba(255,255,255,0.15);}.aeo-trust-advisor{display:flex;align-items:center;gap:10px;}.aeo-trust-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#14B8A6,#0D9488);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:13px;}.aeo-trust-name{font-size:13px;font-weight:700;color:#fff;}.aeo-trust-title{font-size:11px;color:rgba(255,255,255,0.6);}.aeo-trust-creds{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}.aeo-cred{font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:4px 10px;border-radius:4px;}.aeo-cred--gold{background:rgba(255,199,44,0.15);color:#FFC72C;}.aeo-cred--teal{background:rgba(20,184,166,0.15);color:#14B8A6;}.aeo-cred--muted{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);}.aeo-trust-phone{display:flex;align-items:center;gap:8px;padding:10px 22px;border-radius:100px;background:rgba(255,255,255,0.08);border:1.5px solid rgba(20,184,166,0.4);color:#14B8A6;font-size:15px;font-weight:700;text-decoration:none;}.aeo-header{max-width:800px;margin:0 auto;padding:48px 24px 32px;text-align:center;}.aeo-h1{font-family:Fraunces,Georgia,serif;font-size:clamp(28px,4vw,42px);font-weight:700;line-height:1.15;color:#1A2332;margin-bottom:12px;}.aeo-subtitle{font-size:16px;color:#6B7B8D;line-height:1.6;max-width:600px;margin:0 auto;}.aeo-update-strip{margin-top:20px;padding:12px 20px;background:#F8FAFC;border-radius:10px;font-size:12px;color:#6B7B8D;display:inline-flex;align-items:center;gap:12px;flex-wrap:wrap;}.aeo-update-strip strong{color:#1A2332;}.aeo-intent-banner{max-width:800px;margin:0 auto 32px;padding:0 24px;}.aeo-intent-inner{padding:16px 24px;border-radius:12px;display:flex;align-items:flex-start;gap:14px;}.aeo-intent-icon{font-size:24px;flex-shrink:0;}.aeo-intent-text{font-size:15px;color:#1A2332;font-weight:500;line-height:1.5;}.aeo-intent-text strong{font-weight:700;}.aeo-qa-list{max-width:800px;margin:0 auto;padding:0 24px;}.aeo-qa-item{margin-bottom:32px;}.aeo-question{display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;}.aeo-q-icon{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#0D9488,#14B8A6);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:12px;flex-shrink:0;}.aeo-q-text{font-family:Fraunces,Georgia,serif;font-size:20px;font-weight:600;color:#1A2332;line-height:1.3;}.aeo-answer-block{background:linear-gradient(135deg,#F0FDFA,#CCFBF1);border-left:4px solid #14B8A6;border-radius:12px;padding:20px 24px;margin-left:40px;}.aeo-answer-text{font-size:15px;line-height:1.7;color:#1A2332;margin-bottom:12px;}.aeo-answer-attr{display:flex;align-items:center;gap:8px;font-size:12px;color:#0D9488;font-weight:600;margin-bottom:12px;}.aeo-attr-avatar{width:22px;height:22px;border-radius:50%;background:#0D9488;color:#fff;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;}.aeo-nepq-dagger{margin-top:14px;padding-top:12px;border-top:1px solid rgba(20,184,166,0.15);font-size:14px;font-weight:600;font-style:italic;color:#0F2440;line-height:1.5;}.aeo-nepq-dagger a{color:#0D9488;font-weight:700;text-decoration:none;font-style:normal;}.aeo-mid-cta{max-width:800px;margin:8px auto 40px;padding:0 24px;}.aeo-mid-cta-inner{background:linear-gradient(135deg,#0F2440,#1A2332);border-radius:16px;padding:28px 32px;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;}.aeo-mid-cta-inner h3{font-family:Fraunces,Georgia,serif;font-size:20px;font-weight:700;color:#fff;margin-bottom:6px;}.aeo-mid-cta-inner p{font-size:13px;color:rgba(255,255,255,0.6);margin:0;}.aeo-mid-cta-actions{display:flex;gap:10px;flex-shrink:0;flex-wrap:wrap;}.aeo-btn-call{display:inline-flex;align-items:center;gap:8px;padding:12px 24px;border-radius:100px;background:#14B8A6;color:#fff;font-size:14px;font-weight:700;text-decoration:none;}.aeo-btn-schedule{display:inline-flex;align-items:center;gap:8px;padding:12px 24px;border-radius:100px;background:rgba(255,255,255,0.1);border:1.5px solid rgba(255,255,255,0.2);color:#fff;font-size:14px;font-weight:600;text-decoration:none;}.aeo-compare{max-width:800px;margin:16px auto 40px;padding:0 24px;}.aeo-compare-title{font-family:Fraunces,Georgia,serif;font-size:24px;font-weight:700;color:#1A2332;margin-bottom:4px;}.aeo-compare-sub{font-size:13px;color:#6B7B8D;margin-bottom:20px;}.aeo-compare-table{width:100%;border-collapse:separate;border-spacing:0;border-radius:12px;overflow:hidden;border:1px solid #E8ECF0;}.aeo-compare-table thead th{background:#0F2440;color:#fff;font-size:13px;font-weight:700;padding:14px 18px;text-align:left;}.aeo-compare-table tbody td{padding:12px 18px;font-size:14px;border-bottom:1px solid #F3F5F7;}.aeo-compare-table tbody tr:last-child td{border-bottom:none;}.aeo-compare-table tbody td:first-child{font-weight:600;color:#1A2332;background:#F8FAFC;}.aeo-compare-insight{margin-top:16px;padding:16px 20px;background:linear-gradient(135deg,#F0FDFA,#CCFBF1);border-radius:10px;font-size:14px;color:#1A2332;line-height:1.6;font-style:italic;}.aeo-compare-insight strong{font-style:normal;}.aeo-bottom-cta{background:linear-gradient(135deg,#0D9488,#14B8A6);padding:48px 24px;text-align:center;margin-top:32px;}.aeo-bottom-cta h3{font-family:Fraunces,Georgia,serif;font-size:clamp(22px,3vw,30px);font-weight:700;color:#fff;margin-bottom:8px;}.aeo-bottom-cta p{font-size:15px;color:rgba(255,255,255,0.85);margin-bottom:24px;}.aeo-bottom-cta-actions{display:flex;justify-content:center;gap:14px;flex-wrap:wrap;}.aeo-bottom-btn{display:inline-flex;align-items:center;gap:8px;padding:14px 32px;border-radius:100px;font-size:16px;font-weight:700;text-decoration:none;}.aeo-bottom-btn--white{background:#fff;color:#0D9488;}.aeo-bottom-btn--ghost{background:rgba(255,255,255,0.15);color:#fff;border:1.5px solid rgba(255,255,255,0.3);}.aeo-footer{max-width:800px;margin:0 auto;padding:32px 24px;text-align:center;font-size:11px;color:#6B7B8D;line-height:1.8;}.aeo-footer a{color:#4B9CD3;text-decoration:none;}@media(max-width:640px){.aeo-trust{padding:12px 16px;}.aeo-trust-creds{display:none;}.aeo-mid-cta-inner{flex-direction:column;text-align:center;}.aeo-answer-block{margin-left:0;}.aeo-compare-table{font-size:12px;}}';

  return `<!-- AEO Page v2.2: ${slug} · Generated ${today} -->\n` +
    `<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"FAQPage","@id":"https://generationhealth.me/${slug}/#faqpage","name":"${title}: Your Questions Answered","url":"https://generationhealth.me/${slug}","author":{"@id":"https://generationhealth.me/#author"},"datePublished":"${today}","dateModified":"${today}","mainEntity":[${faqSchema}]},{"@type":"Person","@id":"https://generationhealth.me/#author","name":"Rob Simm","jobTitle":"Licensed Medicare Broker","telephone":"(828) 761-3326","url":"https://generationhealth.me","address":{"@type":"PostalAddress","addressLocality":"Durham","addressRegion":"NC","postalCode":"27713"}}]}<\/script>\n\n` +
    `<style>${css}</style>\n\n` +
    `<div class="aeo-trust"><div class="aeo-trust-brand"><a href="https://generationhealth.me" class="aeo-trust-logo">Generation<span>Health</span><span class="dot">.me</span></a><div class="aeo-trust-divider"></div><div class="aeo-trust-advisor"><div class="aeo-trust-avatar">RS</div><div><div class="aeo-trust-name">Rob Simm</div><div class="aeo-trust-title">Your Licensed NC Medicare Advisor</div></div></div></div><div class="aeo-trust-creds"><span class="aeo-cred aeo-cred--gold">NC #10447418</span><span class="aeo-cred aeo-cred--muted">NPN #10447418</span><span class="aeo-cred aeo-cred--teal">AHIP Certified</span></div><a href="tel:828-761-3326" class="aeo-trust-phone">📞 (828) 761-3326</a></div>` +
    `<div class="aeo-header"><h1 class="aeo-h1">${title}:<br>Your Questions Answered</h1><p class="aeo-subtitle">Direct answers from a licensed NC Medicare broker — updated for 2026.</p><div class="aeo-update-strip"><strong>Last Updated:</strong> ${monthYear} &middot; <strong>Reviewed by:</strong> Rob Simm, Licensed Medicare Broker &middot; <strong>${qas.length} Questions</strong></div></div>` +
    `<div class="aeo-intent-banner"><div class="aeo-intent-inner" style="background:linear-gradient(135deg,${ib.bg},${ib.bg2});border:1px solid ${ib.border};"><span class="aeo-intent-icon">${ib.icon}</span><div class="aeo-intent-text">${ib.text}</div></div></div>` +
    `<div class="aeo-qa-list">${firstHalfHtml}</div>` +
    `<div class="aeo-mid-cta"><div class="aeo-mid-cta-inner"><div><h3>Ready to talk? I'm here right now.</h3><p>15 minutes. No pressure. Real answers for your specific situation.</p></div><div class="aeo-mid-cta-actions"><a href="tel:828-761-3326" class="aeo-btn-call">📞 Call Now</a><a href="https://www.sunfirematrix.com/app/consumer/medicareadvocates/10447418/#/" class="aeo-btn-call" style="background:#4B9CD3;">⚖️ Compare Plans</a><a href="https://calendly.com/robert-generationhealth/new-meeting" class="aeo-btn-schedule">📅 Schedule</a></div></div></div>` +
    `<div class="aeo-qa-list">${secondHalfHtml}</div>` +
    compareHtml +
    `<div class="aeo-bottom-cta"><h3>Need Medicare Help?</h3><p>I help NC residents navigate these decisions every day — at no cost to you.</p><div class="aeo-bottom-cta-actions"><a href="tel:828-761-3326" class="aeo-bottom-btn aeo-bottom-btn--white">📞 Call (828) 761-3326</a><a href="https://www.sunfirematrix.com/app/consumer/medicareadvocates/10447418/#/" class="aeo-bottom-btn aeo-bottom-btn--white" style="color:#4B9CD3;">⚖️ Compare Plans Free</a><a href="https://calendly.com/robert-generationhealth/new-meeting" class="aeo-bottom-btn aeo-bottom-btn--ghost">📅 Schedule a Call</a></div></div>` +
    `<div class="aeo-footer"><p><strong>GenerationHealth.me</strong> is operated by Robert Jason Simm, NPN #10447418. Licensed in North Carolina. We provide educational information about Medicare coverage options. We are not affiliated with or endorsed by the U.S. government or the federal Medicare program. Please contact <a href="https://medicare.gov">Medicare.gov</a> or 1-800-MEDICARE for information on all of your options.</p></div>`;
}

export default function CitationMonitorPanel() {
  const { addToPipeline } = useAppState();
  const [cmData, setCmData] = useState<CMData>(() => getFromStorage(LS_CM_DATA, { results: [], lastScan: null, totalScans: 0 }));
  const [claudeKey, setClaudeKey] = useState(() => getFromStorage(LS_CLAUDE_KEY, ''));
  const [openaiKey, setOpenaiKey] = useState(() => getFromStorage(LS_OPENAI_KEY, ''));
  const [perplexityKey, setPerplexityKey] = useState(() => getFromStorage(LS_PERPLEXITY_KEY, ''));
  const [googleKey, setGoogleKey] = useState(() => getFromStorage(LS_GOOGLE_KEY, ''));
  const [showKeys, setShowKeys] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [scanTotal, setScanTotal] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Attack mode state
  const [attackQuery, setAttackQuery] = useState<typeof CM_QUERIES[0] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [generatedQAs, setGeneratedQAs] = useState<QAPair[]>([]);
  const [compareTable, setCompareTable] = useState<CompareTable | null>(null);
  const [pageSlug, setPageSlug] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [deployOpts, setDeployOpts] = useState({ website: true, schema: true, embed: false, compareTable: true });

  useEffect(() => { saveToStorage(LS_CM_DATA, cmData); }, [cmData]);
  useEffect(() => { saveToStorage(LS_CLAUDE_KEY, claudeKey); }, [claudeKey]);
  useEffect(() => { saveToStorage(LS_OPENAI_KEY, openaiKey); }, [openaiKey]);
  useEffect(() => { saveToStorage(LS_PERPLEXITY_KEY, perplexityKey); }, [perplexityKey]);
  useEffect(() => { saveToStorage(LS_GOOGLE_KEY, googleKey); }, [googleKey]);

  const queryResults = useMemo(() => { const map: Record<string, Record<string, ScanResult>> = {}; cmData.results.forEach((r) => { if (!map[r.queryId]) map[r.queryId] = {}; map[r.queryId][r.llm] = r; }); return map; }, [cmData.results]);
  const filteredQueries = useMemo(() => categoryFilter ? CM_QUERIES.filter((q) => q.category === categoryFilter) : CM_QUERIES, [categoryFilter]);

  const stats = useMemo(() => {
    const queriesChecked = new Set(cmData.results.map((r) => r.queryId)).size;
    const cited = new Set(cmData.results.filter((r) => r.cited).map((r) => r.queryId)).size;
    const winRate = queriesChecked > 0 ? Math.round((cited / queriesChecked) * 100) : 0;
    return { queriesChecked, cited, winRate, total: CM_QUERIES.length, authorityScore: Math.round(winRate * 0.4 + Math.round((queriesChecked / CM_QUERIES.length) * 100) * 0.3 + winRate * 0.3) };
  }, [cmData.results]);

  // Full scan
  const runFullScan = useCallback(async () => {
    const llms: Array<{ id: string; fn: (q: string, k: string) => Promise<LLMResult>; key: string }> = [];
    if (claudeKey) llms.push({ id: 'claude', fn: queryClaude, key: claudeKey });
    if (openaiKey) llms.push({ id: 'chatgpt', fn: queryChatGPT, key: openaiKey });
    if (perplexityKey) llms.push({ id: 'perplexity', fn: queryPerplexity, key: perplexityKey });
    if (googleKey) llms.push({ id: 'gemini', fn: queryGemini, key: googleKey });
    if (llms.length === 0) { alert('Add at least one API key.'); return; }
    setScanning(true); const total = CM_QUERIES.length * llms.length; setScanTotal(total); setScanCount(0);
    const newResults: ScanResult[] = []; let count = 0;
    for (const q of CM_QUERIES) { for (const llm of llms) { count++; setScanCount(count); try { const result = await llm.fn(q.query, llm.key); const citation = result.success ? detectCitation(result.response || '') : { cited: false, type: null, match: null }; const competitors = result.success ? detectCompetitors(result.response || '') : []; newResults.push({ queryId: q.id, llm: llm.id, cited: citation.cited, citationType: citation.type, match: citation.match, timestamp: new Date().toISOString(), snippet: result.response?.slice(0, 200), competitors }); } catch { newResults.push({ queryId: q.id, llm: llm.id, cited: false, citationType: null, match: null, timestamp: new Date().toISOString() }); } await new Promise((r) => setTimeout(r, 1500)); } }
    setCmData({ results: newResults, lastScan: new Date().toISOString(), totalScans: cmData.totalScans + 1 });
    setScanning(false);
  }, [claudeKey, openaiKey, perplexityKey, googleKey, cmData.totalScans]);

  // Generate AEO content (intent-driven)
  const generateAEOContent = useCallback(async (q: typeof CM_QUERIES[0]) => {
    if (!claudeKey) { alert('Add Claude API key first'); return; }
    setAttackQuery(q); setGenerating(true); setGenProgress(10); setGeneratedQAs([]); setCompareTable(null);
    const slug = q.query.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 50);
    setPageSlug(slug);
    const framing = INTENT_FRAMING[q.intent] || INTENT_FRAMING.confusion;
    try {
      setGenProgress(30);
      const systemPrompt = `You are an AEO content specialist for GenerationHealth.me.\n\n═══ USER INTENT: ${q.intent.toUpperCase()} ═══\nThe person asking this is feeling: "${q.emotion}"\n\n${framing.opening}\n\nEMOTIONAL HOOK: ${framing.emotional_hook}\nCTA TONE: ${framing.cta_tone}\n\nGenerate:\n1. 8 Q&A PAIRS - Each 2-4 sentences with 2026 Medicare figures, NC-specific, NEPQ tone\n2. COMPARISON TABLE (if topic involves comparing) with broker insight\n\nAuthor: Rob Simm, NC License #10447418, Phone: (828) 761-3326, Durham NC\n\nOUTPUT FORMAT (JSON only, no markdown):\n{"qas":[{"question":"text","answer":"text","aeoScore":85}],"compareTable":{"title":"text","options":["A","B"],"recommended":0,"rows":[{"feature":"text","values":["a","b"],"goodIndex":0}],"brokerInsight":"text"} or null}`;
      setGenProgress(50);
      const resp = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': claudeKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4000, system: systemPrompt, messages: [{ role: 'user', content: `Generate AEO content for: "${q.query}"\nIntent: ${q.intent.toUpperCase()}\nEmotion: "${q.emotion}"` }] }) });
      setGenProgress(80);
      const data = await resp.json();
      const txt = data.content?.[0]?.text || '{}';
      const result = JSON.parse(txt.replace(/```json|```/g, '').trim());
      setGeneratedQAs((result.qas || []).map((qa: QAPair, i: number) => ({ ...qa, id: `qa-${i + 1}` })));
      setCompareTable(result.compareTable || null);
      setGenProgress(100);
    } catch (e) { alert('Generation error: ' + (e instanceof Error ? e.message : String(e))); setGenProgress(0); }
    setGenerating(false);
  }, [claudeKey]);

  // Deploy
  const handleDeploy = useCallback(() => {
    const html = buildAEOPageHtml(generatedQAs, compareTable, pageSlug, attackQuery?.query || '', attackQuery?.intent || 'confusion', deployOpts);
    if (!html) { alert('Generate Q&As first'); return; }
    navigator.clipboard.writeText(html);
    const entry: AeoPipelineEntry = { id: `aeo-${Date.now()}`, queryId: attackQuery?.id || '', query: attackQuery?.query || '', title: attackQuery?.query.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || '', slug: pageSlug, html, deployedAt: new Date().toISOString() };
    addToPipeline(entry);
    alert(`✅ AEO page deployed!\n\n📋 HTML copied to clipboard\n📣 Queued in Content Studio\n🚀 Queued in Indexing\n\nPaste into Elementor at: /${pageSlug}`);
  }, [generatedQAs, compareTable, pageSlug, attackQuery, deployOpts, addToPipeline]);

  const inputCls = "w-full px-3 py-2 rounded-lg border border-white/[0.12] bg-white/[0.04] text-white text-xs outline-none";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h2 className="font-display text-xl font-bold text-white flex items-center gap-2"><span>🎯</span> Citation Monitor</h2><p className="text-xs text-gh-text-muted mt-1">{stats.total} queries · 7 categories · Intent-driven AEO · Competitor tracking</p></div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowKeys(!showKeys)} className="px-3 py-2 rounded-xl text-xs font-semibold border border-white/10 text-gh-text-muted"><Key className="w-3 h-3 inline mr-1" />API Keys</button>
          <button onClick={runFullScan} disabled={scanning} className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-500 to-blue-500 text-white disabled:opacity-50">{scanning ? <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" />{scanCount}/{scanTotal}</span> : <span className="flex items-center gap-1.5"><Play className="w-3 h-3" />Run Full Scan</span>}</button>
        </div>
      </div>
      {showKeys && <div className="card p-5 space-y-3"><div className="text-[11px] font-bold text-gh-text-muted uppercase tracking-widest">API Keys</div><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label className="text-[10px] font-bold text-gh-text-muted block mb-1">Claude</label><input type="password" value={claudeKey} onChange={(e) => setClaudeKey(e.target.value)} placeholder="sk-ant-..." className={inputCls} /></div><div><label className="text-[10px] font-bold text-gh-text-muted block mb-1">ChatGPT</label><input type="password" value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} placeholder="sk-..." className={inputCls} /></div><div><label className="text-[10px] font-bold text-gh-text-muted block mb-1">Perplexity</label><input type="password" value={perplexityKey} onChange={(e) => setPerplexityKey(e.target.value)} placeholder="pplx-..." className={inputCls} /></div><div><label className="text-[10px] font-bold text-gh-text-muted block mb-1">Gemini</label><input type="password" value={googleKey} onChange={(e) => setGoogleKey(e.target.value)} placeholder="AI..." className={inputCls} /></div></div></div>}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[{ label: 'AUTHORITY', value: stats.authorityScore, color: '#4B9CD3' }, { label: 'WIN RATE', value: `${stats.winRate}%`, color: stats.winRate > 0 ? '#4ADE80' : '#6B7B8D' }, { label: 'CITED', value: `${stats.cited}/${stats.total}`, color: stats.cited > 0 ? '#4ADE80' : '#6B7B8D' }, { label: 'COVERAGE', value: `${Math.round((stats.queriesChecked / stats.total) * 100)}%`, color: '#A78BFA' }, { label: 'SCANS', value: cmData.totalScans, color: '#FFC72C' }].map((s) => (
          <div key={s.label} className="card p-3 text-center"><div className="text-xl font-extrabold tabular-nums" style={{ color: typeof s.color === 'string' ? s.color : '#fff' }}>{s.value}</div><div className="text-[10px] font-semibold text-gh-text-muted uppercase tracking-wider mt-0.5">{s.label}</div></div>
        ))}
      </div>

      {/* Categories */}
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setCategoryFilter(null)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${!categoryFilter ? 'bg-white/[0.12] text-white' : 'bg-white/[0.04] text-gh-text-muted'}`}>All ({CM_QUERIES.length})</button>
        {CM_CATEGORIES.map((cat) => (<button key={cat.id} onClick={() => setCategoryFilter(categoryFilter === cat.id ? null : cat.id)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all" style={{ background: categoryFilter === cat.id ? `${cat.color}25` : 'rgba(255,255,255,0.04)', color: categoryFilter === cat.id ? cat.color : '#6B7B8D' }}>{cat.name} ({CM_QUERIES.filter((q) => q.category === cat.id).length})</button>))}
      </div>

      {/* ═══ ATTACK MODE PANEL ═══ */}
      {attackQuery && (
        <div className="card overflow-hidden" style={{ border: '2px solid rgba(248,113,113,0.3)' }}>
          <div className="px-5 py-4" style={{ background: 'linear-gradient(135deg, rgba(248,113,113,0.15), rgba(248,113,113,0.05))' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2"><span className="text-lg">🎯</span><span className="text-sm font-bold text-red-400">Attack Mode</span></div>
              <button onClick={() => { setAttackQuery(null); setGeneratedQAs([]); }} className="px-3 py-1 rounded-lg text-[10px] border border-white/10 text-gh-text-muted">✕ Close</button>
            </div>
            <div className="text-base font-bold text-white">&ldquo;{attackQuery.query}&rdquo;</div>
            <div className="flex items-center gap-2 mt-2">
              {attackQuery.intent && <span className="text-[9px] px-2 py-1 rounded font-bold uppercase" style={{ background: INTENT_COLORS[attackQuery.intent]?.bg, color: INTENT_COLORS[attackQuery.intent]?.color }}>{INTENT_COLORS[attackQuery.intent]?.icon} {attackQuery.intent}</span>}
              <span className="text-[10px] text-gh-text-muted italic">&ldquo;{attackQuery.emotion}&rdquo;</span>
            </div>
          </div>
          {/* Progress */}
          <div className="px-5 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${genProgress >= 100 ? 'bg-emerald-600 text-white' : 'bg-white/[0.08] text-gh-text-muted'}`}>{genProgress >= 100 ? '✓' : `${genProgress}%`}</div>
              <div><div className="text-xs font-semibold text-white">{genProgress >= 100 ? `${generatedQAs.length} Q&As${compareTable ? ' + Table' : ''} Generated` : generating ? 'Generating...' : 'Ready'}</div></div>
            </div>
            <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden"><div className="h-1 rounded-full bg-emerald-500 transition-all" style={{ width: `${genProgress}%` }} /></div>
          </div>
          {/* Generated Q&As */}
          {generatedQAs.length > 0 && (
            <div className="px-5 py-3 max-h-[300px] overflow-y-auto space-y-2">
              {generatedQAs.map((qa, i) => (
                <div key={qa.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-start gap-2"><div className="w-5 h-5 rounded-full bg-carolina flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">{i + 1}</div><div className="flex-1"><div className="text-xs font-semibold text-white mb-1">{qa.question}</div><div className="text-[11px] text-gh-text-muted leading-relaxed">{qa.answer.slice(0, 150)}...</div><span className="text-[9px] px-1.5 py-0.5 rounded mt-1 inline-block" style={{ background: qa.aeoScore >= 90 ? 'rgba(74,222,128,0.15)' : 'rgba(255,199,44,0.15)', color: qa.aeoScore >= 90 ? '#4ADE80' : '#FFC72C' }}>AEO: {qa.aeoScore}</span></div></div>
                </div>
              ))}
            </div>
          )}
          {/* Deploy */}
          {generatedQAs.length > 0 && (
            <div className="px-5 py-4 bg-white/[0.02] border-t border-white/[0.06] space-y-3">
              <div className="text-[10px] text-gh-text-muted font-mono">/{pageSlug}</div>
              <div className="flex flex-wrap gap-4 text-xs">
                <label className="flex items-center gap-2 text-gh-text-soft"><input type="checkbox" checked={deployOpts.website} onChange={(e) => setDeployOpts((p) => ({ ...p, website: e.target.checked }))} className="accent-emerald-500" />Website</label>
                <label className="flex items-center gap-2 text-gh-text-soft"><input type="checkbox" checked={deployOpts.schema} onChange={(e) => setDeployOpts((p) => ({ ...p, schema: e.target.checked }))} className="accent-emerald-500" />Schema</label>
                <label className="flex items-center gap-2 text-gh-text-muted"><input type="checkbox" checked={deployOpts.embed} onChange={(e) => setDeployOpts((p) => ({ ...p, embed: e.target.checked }))} className="accent-emerald-500" />Embed</label>
                {compareTable && <label className="flex items-center gap-2 text-purple-400 font-semibold"><input type="checkbox" checked={deployOpts.compareTable} onChange={(e) => setDeployOpts((p) => ({ ...p, compareTable: e.target.checked }))} className="accent-purple-500" />📊 Table</label>}
              </div>
              <div className="flex gap-2">
                <button onClick={handleDeploy} className="flex-1 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-green-500 text-white">🚀 Deploy AEO Page</button>
                <button onClick={() => setShowPreview(true)} className="px-4 py-3 rounded-xl text-sm font-bold border border-white/10 text-gh-text-soft"><Eye className="w-4 h-4 inline mr-1" />Preview</button>
              </div>
              <button onClick={() => { if (attackQuery) generateAEOContent(attackQuery); }} className="w-full py-2 rounded-lg text-xs font-bold border border-white/10 text-gh-text-muted">Regenerate</button>
            </div>
          )}
        </div>
      )}

      {/* ═══ QUERY TABLE ═══ */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead><tr>{['#', 'QUERY', 'INTENT', 'CAT', 'CLAUDE', 'GPT', 'PPLX', 'GEMINI', 'COMPETITORS', ''].map((h) => <th key={h} className="px-2.5 py-2 text-[10px] font-bold text-gh-text-muted uppercase tracking-wider border-b border-white/[0.06] text-left whitespace-nowrap">{h}</th>)}</tr></thead>
          <tbody>
            {filteredQueries.map((q, qi) => {
              const results = queryResults[q.id] || {};
              const cat = CM_CATEGORIES.find((c) => c.id === q.category);
              const anyCited = Object.values(results).some((r) => r.cited);
              const allComps = new Set<string>();
              Object.values(results).forEach((r) => r.competitors?.forEach((c) => allComps.add(c)));
              const ic = INTENT_COLORS[q.intent] || INTENT_COLORS.confusion;
              return (
                <tr key={q.id} className={`border-b border-white/[0.04] hover:bg-white/[0.02] ${attackQuery?.id === q.id ? 'bg-red-500/[0.08]' : ''}`}>
                  <td className="px-2.5 py-2.5 text-xs text-gh-text-faint tabular-nums">{qi + 1}</td>
                  <td className="px-2.5 py-2.5"><div className="text-xs font-medium text-white">{q.query}</div><div className="text-[10px] text-gh-text-faint italic mt-0.5">{q.emotion}</div></td>
                  <td className="px-2.5 py-2.5"><span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase" style={{ background: ic.bg, color: ic.color }}>{ic.icon} {q.intent}</span></td>
                  <td className="px-2.5 py-2.5"><span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${cat?.color || '#6B7B8D'}18`, color: cat?.color || '#6B7B8D' }}>{cat?.name?.split(' ')[0]}</span></td>
                  {(['claude', 'chatgpt', 'perplexity', 'gemini'] as const).map((llm) => { const r = results[llm]; if (!r) return <td key={llm} className="px-2.5 py-2.5 text-center"><span className="text-[10px] text-gh-text-faint">—</span></td>; return <td key={llm} className="px-2.5 py-2.5 text-center">{r.cited ? <Check className="w-3.5 h-3.5 text-emerald-400 inline" /> : <X className="w-3.5 h-3.5 text-red-400 inline" />}</td>; })}
                  <td className="px-2.5 py-2.5"><div className="flex flex-wrap gap-1">{Array.from(allComps).slice(0, 2).map((c) => <span key={c} className="text-[9px] bg-white/[0.06] text-gh-text-muted px-1.5 py-0.5 rounded">{c}</span>)}</div></td>
                  <td className="px-2.5 py-2.5">{!anyCited && Object.keys(results).length > 0 && <button onClick={() => generateAEOContent(q)} className="px-2.5 py-1 rounded text-[10px] font-bold border border-red-400/30 text-red-400 hover:bg-red-400/10">Attack →</button>}{anyCited && Object.keys(results).length > 0 && Object.values(results).filter((r) => r.cited).length < Object.keys(results).length && <button onClick={() => generateAEOContent(q)} className="px-2.5 py-1 rounded text-[10px] font-bold border border-amber-400/30 text-amber-400 hover:bg-amber-400/10">Defend →</button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ═══ PREVIEW MODAL ═══ */}
      {showPreview && generatedQAs.length > 0 && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] flex flex-col p-5" onClick={() => setShowPreview(false)}>
          <div className="flex items-center justify-between px-6 py-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3"><span className="text-lg">👁️</span><div><div className="text-base font-bold text-white">AEO Page Preview</div><div className="text-xs text-gh-text-muted">/{pageSlug} · {generatedQAs.length} Q&As{compareTable ? ' + Table' : ''}</div></div></div>
            <div className="flex gap-3">
              <button onClick={(e) => { e.stopPropagation(); const html = buildAEOPageHtml(generatedQAs, compareTable, pageSlug, attackQuery?.query || '', attackQuery?.intent || 'confusion', deployOpts); navigator.clipboard.writeText(html); alert('✅ Copied!'); }} className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white">📋 Copy HTML</button>
              <button onClick={(e) => { e.stopPropagation(); setShowPreview(false); }} className="px-4 py-2 rounded-lg text-xs font-bold bg-red-500 text-white">✕ Close</button>
            </div>
          </div>
          <div className="flex-1 rounded-2xl overflow-hidden mx-auto w-full max-w-[960px] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <iframe srcDoc={`<!DOCTYPE html><html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1.0'><link href='https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Fraunces:wght@400;600;700;800&display=swap' rel='stylesheet'></head><body style='margin:0;font-family:DM Sans,sans-serif'>${buildAEOPageHtml(generatedQAs, compareTable, pageSlug, attackQuery?.query || '', attackQuery?.intent || 'confusion', deployOpts)}</body></html>`} className="w-full h-full border-none" title="AEO Preview" />
          </div>
        </div>
      )}
    </div>
  );
}
