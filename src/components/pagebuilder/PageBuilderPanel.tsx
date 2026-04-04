'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Check, X, Upload, Zap, Copy, Loader2, Download, Play, Eye, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { ZONES, MEDICARE_CARDS, ACA_CARDS, NEPQ_CARDS, type ContentCard } from '@/data/pagebuilder';
import { scan67, type ScanResult } from '@/lib/scan67';
import { AI_SYSTEM_PROMPT } from '@/lib/ai-prompt-sys';
import { buildFullPagePrompt } from '@/lib/ai-prompt-build';
import { AI_PROMPTS } from '@/lib/ai-prompts';
import { MASTER_TEMPLATE } from '@/lib/master-template';
import { clusters } from '@/data/clusters';
import { getFromStorage, saveToStorage } from '@/lib/utils';

type PageType = 'medicare' | 'aca' | 'broker' | 'dual';
type Mode = 'build' | 'fix' | 'scan' | 'cards';
const LS_API_KEY = 'gh-cc-pb-apikey';
const LS_SAVED_HTML = 'gh-cc-saved-html';
const CAT_ORDER = ['AEO', 'SEO', 'E-E-A-T', 'CONTENT', 'VQA', 'CONV', 'COMP', 'COMPL'];

// ── Fetch live page HTML ──
async function fetchPageHTML(slug: string): Promise<string | null> {
  // Clean slug — remove leading/trailing slashes
  const cleanSlug = slug.replace(/^\/+|\/+$/g, '');
  
  // Strategy 1: WP REST API (CORS-enabled by default)
  try {
    const wpResp = await fetch(`https://generationhealth.me/wp-json/wp/v2/pages?slug=${encodeURIComponent(cleanSlug)}&_fields=content`);
    if (wpResp.ok) {
      const pages = await wpResp.json();
      if (Array.isArray(pages) && pages.length > 0 && pages[0]?.content?.rendered) {
        return pages[0].content.rendered;
      }
    }
  } catch { /* try next strategy */ }

  // Strategy 2: Try posts endpoint (some content may be posts, not pages)
  try {
    const postResp = await fetch(`https://generationhealth.me/wp-json/wp/v2/posts?slug=${encodeURIComponent(cleanSlug)}&_fields=content`);
    if (postResp.ok) {
      const posts = await postResp.json();
      if (Array.isArray(posts) && posts.length > 0 && posts[0]?.content?.rendered) {
        return posts[0].content.rendered;
      }
    }
  } catch { /* try next strategy */ }

  // Strategy 3: CORS proxy fallback for full HTML
  for (const url of [`https://generationhealth.me/${cleanSlug}/`, `https://generationhealth.me/${cleanSlug}`]) {
    try {
      const r = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
      if (r.ok) return await r.text();
    } catch { /* try next */ }
  }

  return null;
}

// ═══════════════════════════════════════════════════
// ZONE INJECTION SCRIPT — injected into preview iframe
// ═══════════════════════════════════════════════════
function buildZoneScript(zonesJson: string, appliedJson: string, activeZone: string | null): string {
  const css = `<style>
.gh-zone-box{margin:8px 0;padding:20px 24px;border-radius:10px;cursor:pointer;transition:box-shadow .2s,transform .15s;min-height:80px;display:flex;flex-direction:column;justify-content:center;}
.gh-zone-box:hover{transform:translateY(-1px);box-shadow:0 4px 20px rgba(0,0,0,.15);}
.gh-zone-active{outline:3px solid;outline-offset:2px;}
.gh-zone-lbl{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px;}
.gh-zone-cta{font-size:12px;opacity:.6;margin-top:4px;}
.gh-zone-q{font-size:14px;font-weight:700;font-style:italic;color:#1A2332;margin-bottom:8px;line-height:1.5;}
.gh-zone-a{font-size:14px;line-height:1.65;color:#3A4553;}
.gh-zone-tag{margin-top:8px;font-size:10px;font-weight:700;padding:3px 10px;border-radius:100px;display:inline-block;color:#fff;}
</style>`;

  const js = `(function(){
var ZONES=${zonesJson};
var applied=${appliedJson};
var activeZone=${JSON.stringify(activeZone)};
var BAD_ANC_CLS=['gh-hero','gh-cta-modal','gh-cta-card','gh-cta-grid','gh-float-call','gh-header','gh-author','gh-author-header','gh-author-body','gh-faq-item','gh-nepq-block','gh-tip','gh-answer','gh-warning','gh-trust-badge','gh-trust-strip','gh-related','gh-scenario-table'];
function hasBadAnc(el){var n=el.parentNode,d=0;while(n&&n.tagName&&n.tagName.toLowerCase()!=='body'&&d<12){var t=n.tagName.toLowerCase();if(['button','nav','header','footer','form'].indexOf(t)>-1)return true;if(n.classList){for(var i=0;i<BAD_ANC_CLS.length;i++){if(n.classList.contains(BAD_ANC_CLS[i]))return true;}}n=n.parentNode;d++;}return false;}
function mkBox(z){var d=document.createElement('div');d.className='gh-zone-box';d.id='ghz-'+z.id;d.style.background=z.bg;d.style.border='2px dashed '+z.border;
var lbl=document.createElement('div');lbl.className='gh-zone-lbl';lbl.style.color=z.color;lbl.textContent=z.label+' \\u2014 '+z.desc;d.appendChild(lbl);
if(applied[z.id]){var q=document.createElement('div');q.className='gh-zone-q';q.textContent='\\u201c'+applied[z.id].q+'\\u201d';d.appendChild(q);var a=document.createElement('div');a.className='gh-zone-a';a.textContent=applied[z.id].a;d.appendChild(a);var tg=document.createElement('span');tg.className='gh-zone-tag';tg.style.background=z.color;tg.textContent='\\u2713 '+applied[z.id].tag;d.appendChild(tg);d.style.border='2px solid '+z.color;}else{var ct=document.createElement('div');ct.className='gh-zone-cta';ct.style.color=z.color;ct.textContent='+ Click to assign NEPQ card';d.appendChild(ct);}
d.addEventListener('click',function(){document.querySelectorAll('.gh-zone-box').forEach(function(b){b.classList.remove('gh-zone-active');b.style.outlineColor='';});d.classList.add('gh-zone-active');d.style.outlineColor=z.color;window.parent.postMessage({type:'gh-pb-zone',zoneId:z.id},'*');});return d;}
function getHeadings(){var sel='h2,.gh-stats-strip,.gh-deadline-list,.gh-related,.gh-faq,.gh-trust-strip,.gh-last-updated,.gh-cta-modal,.gh-footer-trust';var all=Array.from(document.querySelectorAll(sel));return all.filter(function(el){if(!el||!el.parentNode)return false;if(el.offsetHeight<4)return false;return !hasBadAnc(el);});}
function init(){var headings=getHeadings();if(!headings.length){document.body.appendChild(mkBox(ZONES[0]));return;}var used=[];ZONES.forEach(function(z,i){var idx=Math.floor(i/ZONES.length*headings.length);var el=null;for(var j=idx;j<headings.length;j++){if(used.indexOf(headings[j])===-1){el=headings[j];break;}}if(!el){for(var k=idx-1;k>=0;k--){if(used.indexOf(headings[k])===-1){el=headings[k];break;}}}if(el&&el.parentNode){used.push(el);el.parentNode.insertBefore(mkBox(z),el);}else{document.body.appendChild(mkBox(z));}});}
window.addEventListener('message',function(e){if(!e||!e.data)return;if(e.data.type==='gh-pb-zone-update'){var zid=e.data.zoneId,newApp=e.data.applied||{};var box=document.getElementById('ghz-'+zid);if(!box)return;var z=null;for(var zi=0;zi<ZONES.length;zi++){if(ZONES[zi].id===zid){z=ZONES[zi];break;}}if(!z)return;while(box.firstChild)box.removeChild(box.firstChild);var lbl=document.createElement('div');lbl.className='gh-zone-lbl';lbl.style.color=z.color;lbl.textContent=z.label+' \\u2014 '+z.desc;box.appendChild(lbl);if(newApp[zid]){var q=document.createElement('div');q.className='gh-zone-q';q.textContent='\\u201c'+newApp[zid].q+'\\u201d';box.appendChild(q);var a=document.createElement('div');a.className='gh-zone-a';a.textContent=newApp[zid].a;box.appendChild(a);var tg=document.createElement('span');tg.className='gh-zone-tag';tg.style.background=z.color;tg.textContent='\\u2713 '+newApp[zid].tag;box.appendChild(tg);box.style.border='2px solid '+z.color;box.scrollIntoView({behavior:'smooth',block:'center'});}else{var ct=document.createElement('div');ct.className='gh-zone-cta';ct.style.color=z.color;ct.textContent='+ Click to assign NEPQ card';box.appendChild(ct);box.style.border='2px dashed '+z.border;}}if(e.data.type==='gh-pb-zone-scroll'){var box2=document.getElementById('ghz-'+e.data.zoneId);if(box2)box2.scrollIntoView({behavior:'smooth',block:'center'});}});
function runInit(){init();if(activeZone){var ab=document.getElementById('ghz-'+activeZone);if(ab){ab.classList.add('gh-zone-active');ab.style.outlineColor=ZONES.find(function(z){return z.id===activeZone;})?.color||'#4B9CD3';ab.scrollIntoView({behavior:'smooth',block:'center'});}}}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){setTimeout(runInit,300);});}else{setTimeout(runInit,300);}
})();`;

  // Use string concat to avoid </script> in template literal
  return css + '\n<' + 'script>' + js + '</' + 'script>';
}

// Build srcdoc for iframe preview — injects GH core CSS for proper rendering
function buildSrcdoc(rawHtml: string, applied: Record<string, { tag: string; q: string; a: string }>, activeZone: string | null): string {
  if (!rawHtml) return '<html><body style="font-family:sans-serif;padding:40px;text-align:center;color:#6B7B8D"><p>No HTML loaded — click Build Page or Fetch Live</p></body></html>';
  let html = rawHtml;

  // Extract CSS from master template (between <style> and </style>)
  let ghCss = '';
  const cssMatch = MASTER_TEMPLATE.match(/<style>([\s\S]*?)<\/style>/);
  if (cssMatch) ghCss = cssMatch[1];

  // If raw HTML has no <html> wrapper, add one with fonts + GH CSS
  if (!html.includes('<html')) {
    html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Fraunces:wght@300;400;600;700;800&display=swap" rel="stylesheet"><style>${ghCss}</style></head><body style="margin:0;font-family:'DM Sans',-apple-system,sans-serif">${html}</body></html>`;
  } else if (ghCss && !html.includes('--white:#FFF')) {
    // Has <html> but missing GH CSS — inject into <head>
    html = html.replace(/<head([^>]*)>/i, `<head$1><style>${ghCss}</style>`);
  }

  const zoneScript = buildZoneScript(JSON.stringify(ZONES), JSON.stringify(applied), activeZone);
  return html.replace(/<\/body>\s*<\/html>\s*$/i, '') + zoneScript + '\n</body></html>';
}

// ═══════════════════════════════════════════════════
// PAGE BUILDER COMPONENT
// ═══════════════════════════════════════════════════
export default function PageBuilderPanel() {
  // ── Core state ──
  const [mode, setMode] = useState<Mode>('build');
  const [pageType, setPageType] = useState<PageType>('medicare');
  const [selectedPage, setSelectedPage] = useState<{ name: string; slug: string; cluster: string } | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [apiKey, setApiKey] = useState(() => getFromStorage(LS_API_KEY, ''));

  // ── Build state ──
  const [building, setBuilding] = useState(false);
  const [buildProgress, setBuildProgress] = useState('');
  const [buildError, setBuildError] = useState<string | null>(null);
  const [pageHtml, setPageHtml] = useState(''); // the current page HTML
  const [generatedHtml, setGeneratedHtml] = useState(''); // AI output (for fix mode sections)

  // ── Scan state ──
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  // ── Zone state ──
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [zoneApplied, setZoneApplied] = useState<Record<string, { tag: string; q: string; a: string }>>({});

  // ── UI state ──
  const [copied, setCopied] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [cardTab, setCardTab] = useState<'medicare' | 'aca' | 'nepq'>('medicare');
  const [copiedCard, setCopiedCard] = useState<string | null>(null);
  const [showScanDetail, setShowScanDetail] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const saveApiKey = useCallback((key: string) => { setApiKey(key); saveToStorage(LS_API_KEY, key); }, []);

  // ── Page lists ──
  const allPages = useMemo(() => {
    const pages: Array<{ name: string; slug: string; cluster: string; status: string }> = [];
    clusters.forEach((c) => { c.posts.forEach((p) => { if (p.slug) pages.push({ name: p.name, slug: p.slug, cluster: c.name, status: p.status }); }); });
    return pages;
  }, []);
  const plannedPages = useMemo(() => allPages.filter((p) => p.status === 'planned'), [allPages]);
  const livePages = useMemo(() => allPages.filter((p) => p.status === 'done'), [allPages]);

  // ── NEPQ cards ──
  const currentCards = useMemo(() => {
    if (cardTab === 'aca') return ACA_CARDS;
    if (cardTab === 'nepq') return NEPQ_CARDS;
    return MEDICARE_CARDS;
  }, [cardTab]);
  const appliedCardIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(zoneApplied).forEach((v) => {
      const allCards = [...MEDICARE_CARDS, ...ACA_CARDS, ...NEPQ_CARDS];
      const match = allCards.find((c) => c.q === v.q && c.tag === v.tag);
      if (match) ids.add(match.id);
    });
    return ids;
  }, [zoneApplied]);
  const appliedCount = Object.keys(zoneApplied).length;

  // ── Listen for zone clicks from iframe ──
  useEffect(() => {
    function handleMsg(e: MessageEvent) {
      if (e.data?.type === 'gh-pb-zone') {
        setActiveZone(e.data.zoneId);
      }
    }
    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, []);

  // ── Scroll iframe to active zone ──
  useEffect(() => {
    if (!activeZone || !iframeRef.current?.contentWindow) return;
    setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage({ type: 'gh-pb-zone-scroll', zoneId: activeZone }, '*');
    }, 100);
  }, [activeZone]);

  // ── Grouped scan checks ──
  const groupedChecks = useMemo(() => {
    if (!scanResult) return {};
    const g: Record<string, typeof scanResult.checks> = {};
    scanResult.checks.forEach((c) => { if (!g[c.cat]) g[c.cat] = []; g[c.cat].push(c); });
    return g;
  }, [scanResult]);

  // ══════════════════════════════════════
  // BUILD PAGE — Claude generates raw HTML
  // ══════════════════════════════════════
  const handleBuildPage = useCallback(async () => {
    if (!apiKey) { setBuildError('Add your Claude API key first'); return; }
    const slug = selectedPage?.slug || customSlug;
    const title = selectedPage?.name || customTitle;
    if (!slug) { setBuildError('Enter a slug or select a page'); return; }
    setBuilding(true); setBuildError(null); setBuildProgress('Building prompt...');
    try {
      const prompt = buildFullPagePrompt(slug, pageType, title || slug.replace(/-/g, ' '));
      setBuildProgress('Calling Claude API (30-60 seconds)...');
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 16000, system: AI_SYSTEM_PROMPT, messages: [{ role: 'user', content: prompt }] }),
      });
      if (!response.ok) { const errData = await response.json(); throw new Error(errData.error?.message || `API failed: ${response.status}`); }
      setBuildProgress('Processing response...');
      const data = await response.json();
      let result = data.content?.[0]?.text || '';
      // Strip markdown fences if present
      result = result.replace(/^```(?:html|json)?\n?/gm, '').replace(/\n?```$/gm, '').trim();

      // ── Post-process: inject elements Claude often misses ──
      // Meta description
      if (!result.includes('name="description"')) {
        const titleText = (selectedPage?.name || customTitle || slug).replace(/-/g, ' ');
        result = `<meta name="description" content="${titleText} in North Carolina. Free help from Rob Simm, licensed Medicare broker in Durham NC. Call (828) 761-3326.">\n` + result;
      }
      // Compliance footer — always append if missing
      const complianceFooter = `\n<!-- COMPLIANCE FOOTER -->\n<div class="gh-footer-trust" style="max-width:800px;margin:40px auto 0;padding:32px 24px;text-align:center;font-family:'DM Sans',sans-serif;font-size:12px;color:#6B7B8D;line-height:1.8">\n<p style="margin-bottom:12px"><strong>Last updated April 2026</strong> · Reviewed by Rob Simm, NC License #10447418</p>\n<p>We do not offer every plan available in your area. Please contact <a href="https://medicare.gov" style="color:#4B9CD3">Medicare.gov</a> or 1-800-MEDICARE (1-800-633-4227) for information on all of your options. Not affiliated with or endorsed by the federal Medicare program. This content is for educational and informational purposes.</p>\n</div>`;
      if (!result.includes('not offer every plan')) result += complianceFooter;
      // Author card
      if (!result.includes('gh-author')) {
        result += `\n<div class="gh-author" style="max-width:800px;margin:40px auto;padding:32px;background:#F8FAFC;border-radius:16px;font-family:'DM Sans',sans-serif">\n<div style="display:flex;align-items:center;gap:16px;margin-bottom:16px"><div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#0D9488,#14B8A6);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:18px">RS</div><div><div style="font-size:18px;font-weight:700;color:#1A2332">Rob Simm</div><div style="font-size:13px;color:#6B7B8D">Licensed Medicare Insurance Agent · Durham, NC</div></div></div>\n<p style="font-size:14px;line-height:1.7;color:#3A4553;margin:0">NC License #10447418 · NPN #10447418 · AHIP Certified · 12+ years helping North Carolina families. 500+ families served. 5.0 Google rating from 20+ reviews. <a href="tel:828-761-3326" style="color:#4B9CD3;font-weight:600">Call (828) 761-3326</a></p>\n</div>`;
      }
      // Shimmer span
      if (!result.includes('shimmer')) {
        result = result.replace(/(class="gh-hero-btn--call")/i, '$1 ').replace(/(<a[^>]*gh-hero-btn--call[^>]*>)/i, '$1<span class="shimmer">');
      }
      // DM Sans font reference
      if (!result.includes('DM Sans')) {
        result = result.replace(/(class="gh-footer-trust")/i, '$1 style="font-family:\'DM Sans\',sans-serif"');
      }
      // Trust vs Red Flags
      if (!result.toLowerCase().includes('red flag') && !result.toLowerCase().includes('watch out') && !result.toLowerCase().includes('avoid')) {
        result = result.replace(/(<!-- NEPQ QUOTE BREAK -->)/i, '<div class="gh-tip" style="max-width:720px;padding:20px 24px;border-left:4px solid #F59E0B;background:#FFFBEB;border-radius:0 12px 12px 0;margin:24px 0"><p style="font-size:14px;font-weight:600;color:#92400E;margin:0">⚠️ Watch out for agents who only show you one company\'s plans — that\'s a red flag that they\'re captive, not independent.</p></div>\n$1');
      }
      // Case study with saved $
      if (!result.toLowerCase().includes('saved $')) {
        result = result.replace(/(<!-- NEPQ QUOTE BREAK -->)/i, '<div style="max-width:720px;padding:20px 24px;background:linear-gradient(135deg,#F0FDF4,#DCFCE7);border-radius:12px;margin:24px 0;font-size:15px;line-height:1.7;color:#1A2332"><strong>Real example:</strong> A Durham couple saved $2,400/year by switching from a Medicare Advantage HMO to Medigap Plan G + standalone Part D — after their cardiologist left the HMO network.</div>\n$1');
      }
      // Freshness signal
      if (!result.includes('Updated') && !result.includes('updated') && !result.includes('Last reviewed')) {
        result = result.replace(/(class="gh-footer-trust")/i, '$1 data-updated="true"');
        if (!result.includes('Updated')) result = result.replace(/(gh-footer-trust[^>]*>)/i, '$1\n<p style="font-size:11px;color:#6B7B8D;margin-bottom:8px"><strong>Last updated April 2026</strong></p>');
      }

      setPageHtml(result);
      setBuildProgress('Scanning...');
      const sr = scan67(result, pageType);
      setScanResult(sr);
      setShowPreview(true);
      setZoneApplied({});
      setActiveZone(ZONES[0].id);
      // Save
      if (slug) { const saved = getFromStorage<Record<string, string>>(LS_SAVED_HTML, {}); saved[slug] = result; saveToStorage(LS_SAVED_HTML, saved); }
      setBuildProgress('');
    } catch (err) { setBuildError(`Build failed: ${err instanceof Error ? err.message : String(err)}`); }
    setBuilding(false);
  }, [apiKey, selectedPage, customSlug, customTitle, pageType]);

  // ── Fetch live page ──
  const handleFetch = useCallback(async (slug: string) => {
    setFetching(true); setBuildError(null);
    const html = await fetchPageHTML(slug);
    setFetching(false);
    if (html) {
      setPageHtml(html);
      setScanResult(scan67(html, pageType));
      setShowPreview(true);
      setZoneApplied({});
      setActiveZone(ZONES[0].id);
      const saved = getFromStorage<Record<string, string>>(LS_SAVED_HTML, {}); saved[slug] = html; saveToStorage(LS_SAVED_HTML, saved);
    } else {
      setBuildError('Could not fetch page. CORS may be blocking. Try pasting HTML in Scan mode.');
    }
  }, [pageType]);

  // ── Load saved HTML ──
  const loadSaved = useCallback((slug: string) => {
    const saved = getFromStorage<Record<string, string>>(LS_SAVED_HTML, {});
    if (saved[slug]) { setPageHtml(saved[slug]); setScanResult(scan67(saved[slug], pageType)); setShowPreview(true); }
  }, [pageType]);

  // ── Apply NEPQ card to active zone ──
  const applyCard = useCallback((card: ContentCard) => {
    if (!activeZone) return;
    const newApplied = { ...zoneApplied, [activeZone]: { tag: card.tag, q: card.q, a: card.a } };
    setZoneApplied(newApplied);
    // Update zone in iframe
    setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage({ type: 'gh-pb-zone-update', zoneId: activeZone, applied: newApplied }, '*');
    }, 50);
    // Auto-advance to next empty zone
    const currentIdx = ZONES.findIndex((z) => z.id === activeZone);
    for (let i = currentIdx + 1; i < ZONES.length; i++) {
      if (!newApplied[ZONES[i].id]) { setActiveZone(ZONES[i].id); return; }
    }
  }, [activeZone, zoneApplied]);

  // ── Remove card from zone ──
  const removeFromZone = useCallback((zoneId: string) => {
    const newApplied = { ...zoneApplied };
    delete newApplied[zoneId];
    setZoneApplied(newApplied);
    setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage({ type: 'gh-pb-zone-update', zoneId, applied: newApplied }, '*');
    }, 50);
  }, [zoneApplied]);

  // ── Inject NEPQ blocks into HTML ──
  const injectNepqBlocks = useCallback(() => {
    if (!pageHtml || appliedCount === 0) return;
    const parser = new DOMParser();
    const doc = parser.parseFromString(pageHtml.includes('<html') ? pageHtml : `<html><body>${pageHtml}</body></html>`, 'text/html');
    const hSel = 'h2,.gh-stats-strip,.gh-deadline-list,.gh-related,.gh-faq,.gh-trust-strip,.gh-last-updated,.gh-cta-modal,.gh-footer-trust';
    const BAD_CLS = ['gh-hero', 'gh-cta-modal', 'gh-cta-card', 'gh-author', 'gh-author-header', 'gh-faq-item', 'gh-nepq-block', 'gh-tip', 'gh-answer', 'gh-warning', 'gh-trust-badge', 'gh-trust-strip'];
    let headings = Array.from(doc.querySelectorAll(hSel)).filter((el) => {
      let n = el.parentNode as HTMLElement | null;
      while (n && n.tagName?.toLowerCase() !== 'body') {
        if (n.classList) { for (const cls of BAD_CLS) { if (n.classList.contains(cls)) return false; } }
        n = n.parentNode as HTMLElement | null;
      }
      return true;
    });
    // Map zones to headings
    const usedIdx: number[] = [];
    const zoneHeadingMap: Record<string, number> = {};
    ZONES.forEach((z, i) => {
      if (!zoneApplied[z.id]) return;
      const idx = Math.floor(i / ZONES.length * headings.length);
      let found = -1;
      for (let j = idx; j < headings.length; j++) { if (!usedIdx.includes(j)) { found = j; break; } }
      if (found === -1) { for (let k = idx - 1; k >= 0; k--) { if (!usedIdx.includes(k)) { found = k; break; } } }
      if (found > -1) { usedIdx.push(found); zoneHeadingMap[z.id] = found; }
    });
    // Inject in reverse order
    const zonesWithHeadings = ZONES.filter((z) => zoneApplied[z.id] && zoneHeadingMap[z.id] !== undefined);
    zonesWithHeadings.slice().reverse().forEach((z) => {
      const heading = headings[zoneHeadingMap[z.id]];
      if (!heading?.parentNode) return;
      const d = zoneApplied[z.id];
      const blockHtml = `<div class="gh-nepq-block" style="padding:28px 32px;background:rgba(13,148,136,0.06);border-left:4px solid #0D9488;margin:32px 0"><p style="font-size:17px;font-weight:700;font-style:italic;color:#1A2332;margin:0 0 12px;line-height:1.6">\u201c${d.q}\u201d</p><p style="font-size:17px;line-height:1.78;color:#3A4553;margin:0">${d.a}</p></div>`;
      const blockEl = doc.createElement('div');
      blockEl.innerHTML = blockHtml;
      if (blockEl.firstChild) heading.parentNode.insertBefore(blockEl.firstChild, heading);
    });
    const body = doc.querySelector('body');
    const mergedHtml = body ? body.innerHTML : doc.documentElement.outerHTML;
    setPageHtml(mergedHtml);
    setScanResult(scan67(mergedHtml, pageType));
    setZoneApplied({});
  }, [pageHtml, zoneApplied, appliedCount, pageType]);

  // ── Copy / Download ──
  const copyHtml = useCallback(() => { navigator.clipboard.writeText(pageHtml); setCopied(true); setTimeout(() => setCopied(false), 2000); }, [pageHtml]);
  const downloadHtml = useCallback(() => {
    const s = selectedPage?.slug || customSlug || 'page';
    const b = new Blob([pageHtml], { type: 'text/html' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `${s}.html`; a.click(); URL.revokeObjectURL(u);
  }, [pageHtml, selectedPage, customSlug]);

  // ── AI section call helper ──
  const callAiSection = useCallback(async (prompt: string, label: string) => {
    if (!apiKey) return;
    setBuilding(true); setBuildProgress(`Generating ${label}...`);
    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4096, system: AI_SYSTEM_PROMPT, messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await resp.json();
      const result = (data.content?.[0]?.text || '').replace(/^```(?:html)?\n?/gm, '').replace(/\n?```$/gm, '').trim();
      setGeneratedHtml(result);
    } catch (e) { setBuildError(e instanceof Error ? e.message : String(e)); }
    setBuilding(false); setBuildProgress('');
  }, [apiKey]);

  const inputCls = "w-full px-3 py-2 rounded-lg border border-white/[0.12] bg-white/[0.04] text-white text-xs outline-none focus:border-carolina/40";
  const currentSlug = selectedPage?.slug || customSlug || '';

  // ══════════════════════════════════════
  // RENDER — 3 PANEL LAYOUT
  // ══════════════════════════════════════
  return (
    <div className="space-y-4">
      {/* ── HEADER ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-white flex items-center gap-2"><span>📄</span> Page Builder</h2>
          <p className="text-xs text-gh-text-muted mt-1">Template v5.7.2 · 67-point scanner · Raw HTML generation · NEPQ zone injection</p>
        </div>
        <div className="flex gap-2">
          {([
            { id: 'build' as Mode, label: '🚀 Build New' },
            { id: 'fix' as Mode, label: '🔧 Fix Existing' },
            { id: 'scan' as Mode, label: '🔍 Scan HTML' },
            { id: 'cards' as Mode, label: '🃏 NEPQ Cards' },
          ]).map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${mode === m.id ? 'bg-white/[0.12] text-white' : 'bg-white/[0.04] text-gh-text-muted hover:bg-white/[0.06]'}`}>{m.label}</button>
          ))}
        </div>
      </div>

      {/* ── PAGE TYPE + API KEY ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2">
          {([{ id: 'medicare' as PageType, label: 'Medicare', color: '#4B9CD3' }, { id: 'aca' as PageType, label: 'ACA', color: '#16A34A' }, { id: 'dual' as PageType, label: 'Dual', color: '#A78BFA' }, { id: 'broker' as PageType, label: 'Broker', color: '#F97316' }]).map((t) => (
            <button key={t.id} onClick={() => setPageType(t.id)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all" style={{ background: pageType === t.id ? `${t.color}25` : 'rgba(255,255,255,0.04)', color: pageType === t.id ? t.color : '#6B7B8D' }}>{t.label}</button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold text-gh-text-muted uppercase">API Key</label>
          <input type="password" value={apiKey} onChange={(e) => saveApiKey(e.target.value)} placeholder="sk-ant-api03-..." className="w-48 px-3 py-1.5 rounded-lg border border-white/[0.12] bg-white/[0.04] text-white text-xs outline-none" />
          {apiKey && <span className="text-[10px] text-emerald-400 font-bold">✓</span>}
        </div>
      </div>

      {/* ═══ BUILD / FIX MODE — 3-Panel Layout ═══ */}
      {(mode === 'build' || mode === 'fix') && (
        <div className="grid grid-cols-12 gap-4" style={{ minHeight: '70vh' }}>

          {/* ── PANEL 1: Pages + Details (3 cols) ── */}
          <div className="col-span-3 space-y-3 overflow-y-auto max-h-[80vh]">
            {/* Page list */}
            <div className="card p-3">
              <div className="text-[10px] font-bold text-gh-text-muted uppercase tracking-widest mb-2">
                {mode === 'build' ? `Planned Pages (${plannedPages.length})` : `Live Pages (${livePages.length})`}
              </div>
              <div className="space-y-0.5 max-h-[200px] overflow-y-auto">
                {(mode === 'build' ? plannedPages : livePages).map((p, i) => (
                  <button key={i} onClick={() => { setSelectedPage(p); setCustomTitle(p.name); setCustomSlug(p.slug); if (mode === 'fix') loadSaved(p.slug); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${selectedPage?.slug === p.slug ? 'bg-carolina/20 text-carolina' : 'text-gh-text-soft hover:bg-white/[0.04]'}`}>
                    <div className="font-medium truncate">{p.name}</div>
                    <div className="text-[9px] text-gh-text-faint truncate">/{p.slug}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Page details */}
            <div className="card p-3 space-y-2">
              <div className="text-[10px] font-bold text-gh-text-muted uppercase tracking-widest">Page Details</div>
              <div><label className="text-[9px] font-bold text-gh-text-muted block mb-0.5">Title</label><input value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} placeholder="Page Title" className={inputCls} /></div>
              <div><label className="text-[9px] font-bold text-gh-text-muted block mb-0.5">Slug</label><input value={customSlug} onChange={(e) => setCustomSlug(e.target.value)} placeholder="page-slug" className={inputCls} /></div>
              {mode === 'build' ? (
                <button onClick={handleBuildPage} disabled={building || !customSlug} className="w-full py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40 bg-gradient-to-r from-teal-600 to-blue-600 text-white hover:brightness-110">
                  {building ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" />{buildProgress}</span> : <span className="flex items-center justify-center gap-2"><Play className="w-3.5 h-3.5" />Build Page</span>}
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => currentSlug && handleFetch(currentSlug)} disabled={fetching || !currentSlug} className="flex-1 py-2 rounded-xl text-[11px] font-bold border border-nc-gold/30 bg-nc-gold/10 text-nc-gold disabled:opacity-40">
                    {fetching ? <Loader2 className="w-3 h-3 animate-spin inline" /> : <Zap className="w-3 h-3 inline mr-1" />}Fetch Live
                  </button>
                  <button onClick={() => { if (pageHtml) setScanResult(scan67(pageHtml, pageType)); }} disabled={!pageHtml} className="py-2 px-3 rounded-xl text-[11px] font-bold border border-teal-500/30 text-teal-400 disabled:opacity-40">
                    <RefreshCw className="w-3 h-3 inline mr-1" />Scan
                  </button>
                </div>
              )}
              {buildError && <div className="px-2 py-1.5 rounded-lg bg-red-500/10 border border-red-500/25 text-[10px] text-red-400">{buildError}</div>}
            </div>

            {/* scan67 score */}
            {scanResult && (
              <div className="card p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-gh-text-muted uppercase">scan67</span>
                  <span className={`text-lg font-extrabold ${scanResult.pct >= 80 ? 'text-emerald-400' : scanResult.pct >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{scanResult.score}/{scanResult.total}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden mb-2">
                  <div className="h-full rounded-full transition-all" style={{ width: `${scanResult.pct}%`, background: scanResult.pct >= 80 ? '#4ADE80' : scanResult.pct >= 60 ? '#FFC72C' : '#EF4444' }} />
                </div>
                <div className="text-[10px] text-gh-text-faint">{scanResult.checks.filter((c) => c.pass).length} passed · {scanResult.checks.filter((c) => !c.pass).length} failed</div>
                <button onClick={() => setShowScanDetail(!showScanDetail)} className="mt-1 text-[10px] text-carolina font-bold">{showScanDetail ? 'Hide' : 'Show'} Details</button>
                {showScanDetail && (
                  <div className="mt-2 space-y-1 max-h-[200px] overflow-y-auto">
                    {scanResult.checks.filter((c) => !c.pass).map((c) => (
                      <div key={c.id} className="flex items-center gap-1.5 text-[10px]">
                        <X className="w-3 h-3 text-red-400 flex-shrink-0" />
                        <span className="text-white truncate">{c.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI actions (fix mode) */}
            {mode === 'fix' && pageHtml && (
              <div className="card p-3 space-y-2">
                <div className="text-[10px] font-bold text-gh-text-muted uppercase tracking-widest">AI Actions</div>
                <div className="flex gap-1.5 flex-wrap">
                  <button onClick={() => scanResult && callAiSection(AI_PROMPTS.batchfix(currentSlug, pageType, pageHtml, scanResult), 'batch fix')} disabled={building || !apiKey || !scanResult} className="px-2 py-1.5 rounded-lg text-[10px] font-bold border border-red-400/30 text-red-400 hover:bg-red-400/10 disabled:opacity-40">🔧 Fix</button>
                  <button onClick={() => callAiSection(AI_PROMPTS.wordboost(currentSlug, pageType, pageHtml), 'word boost')} disabled={building || !apiKey} className="px-2 py-1.5 rounded-lg text-[10px] font-bold border border-blue-400/30 text-blue-400 hover:bg-blue-400/10 disabled:opacity-40">📝 Boost</button>
                  <button onClick={() => callAiSection(AI_PROMPTS.update2026(pageHtml), '2026 update')} disabled={building || !apiKey} className="px-2 py-1.5 rounded-lg text-[10px] font-bold border border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10 disabled:opacity-40">📅 2026</button>
                </div>
                <div className="text-[10px] font-bold text-gh-text-muted uppercase mt-2">Generate Section</div>
                <div className="flex gap-1 flex-wrap">
                  {['hero', 'instant', 'faq', 'cta', 'coststrip', 'table', 'tips', 'warnings', 'related', 'schema'].map((s) => (
                    <button key={s} onClick={() => AI_PROMPTS[s] && callAiSection(AI_PROMPTS[s](currentSlug, pageType, pageHtml, scanResult), s)} disabled={building || !apiKey} className="px-2 py-1 rounded text-[9px] font-bold border border-white/10 text-gh-text-soft hover:bg-white/[0.04] disabled:opacity-40 capitalize">{s}</button>
                  ))}
                </div>
                {building && <div className="text-[10px] text-gh-text-muted flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />{buildProgress}</div>}
              </div>
            )}

            {/* Output actions */}
            {pageHtml && (
              <div className="card p-3 space-y-2">
                <div className="flex gap-2">
                  <button onClick={copyHtml} className="flex-1 py-1.5 rounded-lg text-[10px] font-bold border border-white/10 text-gh-text-soft hover:bg-white/[0.04]">{copied ? <><Check className="w-3 h-3 inline text-emerald-400" /> Copied</> : <><Copy className="w-3 h-3 inline" /> Copy HTML</>}</button>
                  <button onClick={downloadHtml} className="py-1.5 px-3 rounded-lg text-[10px] font-bold border border-white/10 text-gh-text-soft hover:bg-white/[0.04]"><Download className="w-3 h-3 inline" /></button>
                </div>
                {appliedCount > 0 && (
                  <button onClick={injectNepqBlocks} className="w-full py-2 rounded-xl text-[11px] font-bold bg-gradient-to-r from-teal-600 to-emerald-600 text-white">
                    Inject {appliedCount} NEPQ Block{appliedCount > 1 ? 's' : ''} into Page
                  </button>
                )}
                <div className="text-[9px] text-gh-text-faint">{pageHtml.length.toLocaleString()} chars</div>
              </div>
            )}

            {/* AI generated output (fix mode sections) */}
            {generatedHtml && mode === 'fix' && (
              <div className="card p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-white">AI Output</span>
                  <button onClick={() => { navigator.clipboard.writeText(generatedHtml); }} className="text-[9px] font-bold text-carolina">Copy</button>
                </div>
                <textarea value={generatedHtml} onChange={(e) => setGeneratedHtml(e.target.value)} className="w-full h-32 px-2 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] text-[10px] text-gh-text-soft font-mono resize-y outline-none" />
              </div>
            )}
          </div>

          {/* ── PANEL 2: Live Preview with Zones (6 cols) ── */}
          <div className="col-span-6 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gh-text-muted uppercase tracking-widest">Live Preview</span>
              <div className="flex items-center gap-2">
                {activeZone && <span className="text-[10px] font-bold text-carolina">Active: {ZONES.find((z) => z.id === activeZone)?.label}</span>}
                <button onClick={() => setShowPreview(!showPreview)} className="text-[10px] font-bold text-gh-text-faint"><Eye className="w-3 h-3 inline mr-1" />{showPreview ? 'Hide' : 'Show'}</button>
              </div>
            </div>
            {showPreview && pageHtml ? (
              <iframe
                ref={iframeRef}
                srcDoc={buildSrcdoc(pageHtml, zoneApplied, activeZone)}
                className="w-full flex-1 rounded-xl border border-white/[0.08] bg-white"
                style={{ minHeight: '65vh' }}
                sandbox="allow-scripts allow-same-origin"
                title="Page Preview"
              />
            ) : (
              <div className="flex-1 card flex items-center justify-center" style={{ minHeight: '65vh' }}>
                <div className="text-center">
                  <div className="text-4xl mb-3">{mode === 'build' ? '🚀' : '🔧'}</div>
                  <div className="text-sm text-gh-text-muted mb-1">{mode === 'build' ? 'Select a page and click Build' : 'Select a page and click Fetch Live'}</div>
                  <div className="text-[10px] text-gh-text-faint">The preview will appear here with clickable NEPQ zones</div>
                </div>
              </div>
            )}
          </div>

          {/* ── PANEL 3: NEPQ Cards (3 cols) ── */}
          <div className="col-span-3 space-y-3 overflow-y-auto max-h-[80vh]">
            {/* Zone assignment summary */}
            <div className="card p-3">
              <div className="text-[10px] font-bold text-gh-text-muted uppercase tracking-widest mb-2">Zone Assignments ({appliedCount}/8)</div>
              <div className="space-y-1">
                {ZONES.map((z) => (
                  <div key={z.id} onClick={() => setActiveZone(z.id)} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-[10px] transition-colors ${activeZone === z.id ? 'bg-carolina/15 ring-1 ring-carolina/30' : 'hover:bg-white/[0.03]'}`}>
                    <div className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-extrabold text-white flex-shrink-0" style={{ background: z.color }}>{z.id.replace('z', '')}</div>
                    {zoneApplied[z.id] ? (
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-bold truncate">{zoneApplied[z.id].tag}</div>
                        <div className="text-gh-text-faint truncate">{zoneApplied[z.id].q.slice(0, 40)}...</div>
                      </div>
                    ) : (
                      <span className="text-gh-text-faint flex-1">Empty</span>
                    )}
                    {zoneApplied[z.id] && (
                      <button onClick={(e) => { e.stopPropagation(); removeFromZone(z.id); }} className="text-red-400/60 hover:text-red-400"><X className="w-3 h-3" /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Card tabs */}
            <div className="flex gap-1">
              {([{ id: 'medicare' as const, label: 'Medicare' }, { id: 'aca' as const, label: 'ACA' }, { id: 'nepq' as const, label: 'NEPQ' }]).map((t) => (
                <button key={t.id} onClick={() => setCardTab(t.id)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${cardTab === t.id ? 'bg-teal-600/20 text-teal-400' : 'bg-white/[0.04] text-gh-text-muted'}`}>{t.label}</button>
              ))}
            </div>

            {/* Card list */}
            <div className="space-y-2">
              {currentCards.map((card) => {
                const isApplied = appliedCardIds.has(card.id);
                return (
                  <div key={card.id} onClick={() => !isApplied && activeZone && applyCard(card)} className={`card p-3 space-y-1.5 transition-all ${isApplied ? 'opacity-50' : activeZone ? 'cursor-pointer hover:ring-1 hover:ring-teal-500/30' : 'opacity-70'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-teal-400">{card.tag}</span>
                      {isApplied && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <div className="text-[10px] text-gh-text-faint">{card.tagline}</div>
                    <div className="text-xs font-bold text-white leading-snug">{card.q}</div>
                    <div className="text-[10px] text-gh-text-soft leading-relaxed line-clamp-3">{card.a}</div>
                  </div>
                );
              })}
            </div>

            {!activeZone && pageHtml && (
              <div className="text-[10px] text-center text-nc-gold py-2">Click a zone in the preview to activate it, then click a card to assign</div>
            )}
          </div>
        </div>
      )}

      {/* ═══ SCAN MODE ═══ */}
      {mode === 'scan' && (
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-gh-text-muted uppercase tracking-widest">Paste HTML or upload file</span>
              <div className="flex gap-2">
                <label className="px-3 py-1.5 rounded-lg text-[11px] font-bold border border-white/10 text-gh-text-soft hover:bg-white/[0.04] cursor-pointer"><Upload className="w-3 h-3 inline mr-1" />Upload<input type="file" accept=".html,.htm" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => { const t = ev.target?.result as string; setPageHtml(t); setScanResult(scan67(t, pageType)); }; r.readAsText(f); }} className="hidden" /></label>
                <button onClick={() => { if (pageHtml) setScanResult(scan67(pageHtml, pageType)); }} disabled={!pageHtml.trim()} className="px-4 py-1.5 rounded-lg text-[11px] font-bold bg-teal-600 text-white hover:bg-teal-500 disabled:opacity-40"><Zap className="w-3 h-3 inline mr-1" />Scan</button>
              </div>
            </div>
            <textarea value={pageHtml} onChange={(e) => setPageHtml(e.target.value)} placeholder="Paste your page HTML here..." className="w-full h-32 px-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.02] text-xs text-gh-text-soft font-mono resize-none outline-none" />
          </div>
          {scanResult && (
            <div className="space-y-4">
              <div className="card p-6" style={{ background: 'linear-gradient(135deg, rgba(13,148,136,0.08), rgba(37,99,235,0.08))', border: '1px solid rgba(13,148,136,0.2)' }}>
                <div className="flex items-center justify-between">
                  <div><div className="text-sm font-bold text-white">scan67 Score</div><div className="text-xs text-gh-text-muted mt-0.5">{scanResult.checks.filter((c) => c.pass).length} passed · {scanResult.checks.filter((c) => !c.pass).length} failed</div></div>
                  <div className={`text-4xl font-extrabold ${scanResult.pct >= 80 ? 'text-emerald-400' : scanResult.pct >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{scanResult.score}/{scanResult.total}</div>
                </div>
                <div className="w-full h-3 bg-white/[0.06] rounded-full overflow-hidden mt-4"><div className="h-3 rounded-full transition-all" style={{ width: `${scanResult.pct}%`, background: scanResult.pct >= 80 ? '#4ADE80' : scanResult.pct >= 60 ? '#FFC72C' : '#EF4444' }} /></div>
              </div>
              {CAT_ORDER.map((cat) => {
                const checks = groupedChecks[cat];
                if (!checks?.length) return null;
                const passed = checks.filter((c) => c.pass).length;
                const isExp = expandedCat === cat;
                return (
                  <div key={cat} className="card overflow-hidden">
                    <div onClick={() => setExpandedCat(isExp ? null : cat)} className="px-5 py-3 cursor-pointer flex items-center justify-between">
                      <div className="flex items-center gap-3">{isExp ? <ChevronDown className="w-4 h-4 text-gh-text-muted" /> : <ChevronRight className="w-4 h-4 text-gh-text-muted" />}<span className="text-xs font-bold uppercase tracking-wider" style={{ color: checks[0].catColor }}>{cat}</span></div>
                      <span className={`text-sm font-bold ${passed === checks.length ? 'text-emerald-400' : 'text-white'}`}>{passed}/{checks.length}</span>
                    </div>
                    {isExp && (<div className="px-5 pb-4 border-t border-white/[0.04]">{checks.map((c) => (<div key={c.id} className="flex items-center gap-2.5 py-2 border-b border-white/[0.03] last:border-0">{c.pass ? <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <X className="w-4 h-4 text-red-400 flex-shrink-0" />}<span className={`text-xs ${c.pass ? 'text-gh-text-soft' : 'text-white font-medium'}`}>{c.label}</span></div>))}</div>)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ CARDS MODE ═══ */}
      {mode === 'cards' && (
        <div className="space-y-4">
          <div className="flex gap-2 mb-4">
            {([{ id: 'medicare' as const, label: 'Medicare' }, { id: 'aca' as const, label: 'ACA' }, { id: 'nepq' as const, label: 'NEPQ Sequence' }]).map((t) => (
              <button key={t.id} onClick={() => setCardTab(t.id)} className={`px-4 py-2 rounded-xl text-xs font-bold ${cardTab === t.id ? 'bg-teal-600/20 text-teal-400' : 'bg-white/[0.04] text-gh-text-muted'}`}>{t.label}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentCards.map((card) => (
              <div key={card.id} className="card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-400">{card.tag}</span>
                  <button onClick={() => { navigator.clipboard.writeText(`${card.q}\n\n${card.a}`); setCopiedCard(card.id); setTimeout(() => setCopiedCard(null), 2000); }} className="px-2 py-1 rounded text-[10px] font-bold border border-white/10 text-gh-text-faint hover:bg-white/[0.04]">{copiedCard === card.id ? <Check className="w-3 h-3 inline text-emerald-400" /> : <Copy className="w-3 h-3 inline" />}</button>
                </div>
                <div className="text-xs text-gh-text-muted">{card.tagline}</div>
                <div className="text-sm font-bold text-white leading-snug">{card.q}</div>
                <div className="text-xs text-gh-text-soft leading-relaxed">{card.a}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
