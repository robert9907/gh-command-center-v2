'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2, Check, Copy, RefreshCw, Search, Settings, Image, Send, X, Download } from 'lucide-react';
import { clusters } from '@/data/clusters';
import { getFromStorage, saveToStorage } from '@/lib/utils';
import { useAppState } from '@/lib/AppState';

const LS_STUDIO_DONE = 'gh-cc-studio-completed';
const LS_CLAUDE_KEY = 'gh-cc-pb-apikey';
const LS_IDEOGRAM_KEY = 'gh-cc-dalle-key';

const VOICE = `You are Rob Simm, independent Medicare/ACA broker in Durham, NC. NC License #10447418, AHIP Certified. You talk like a knowledgeable neighbor — straight, warm, local. No 1-800 call center energy. You simplify Medicare by making people picture real situations. You use NEPQ: open with an emotional situation question, then give Rob's real answer, then a soft CTA. Always mention Durham or North Carolina. Phone: (828) 761-3326. Website: generationhealth.me.`;

const PLATFORMS = [
  { id: 'fb', label: 'Facebook', icon: '👥', color: '#1877F2', charLimit: 2000, tone: "NEPQ story format. Open with an emotional situation question the reader is already living (e.g. 'Did your neighbor tell you...'). Two short paragraphs of Rob's voice. Close with soft CTA and phone number. Scroll-stopper energy. 150-250 words." },
  { id: 'gmb', label: 'Google Business', icon: '📍', color: '#34A853', charLimit: 1500, tone: 'Short, local, punchy. One sentence on the topic, one sentence establishing Rob as the Durham neighbor who has the answer, phone number, link to the page. Under 150 words. No hashtags.' },
  { id: 'li', label: 'LinkedIn', icon: '💼', color: '#0A66C2', charLimit: 1300, tone: "Professional credibility. Open with a Medicare fact or stat relevant to the topic. Build to Rob's expertise angle. Close with an insight question that invites engagement. More polished than Facebook but still Rob's voice. 120-180 words." },
  { id: 'nd', label: 'Nextdoor', icon: '🏘️', color: '#8DB600', charLimit: 1200, tone: 'Rob sharing Medicare knowledge as a neighbor. Hyper-local — mention Durham or Wake County. Genuinely helpful, zero sales pressure. Short. Ask a real question. Contact info at end. Sounds like a neighbor posting in the neighborhood feed, not an ad. Under 120 words.' },
] as const;

const IMAGE_PROMPT = "Clean professional Medicare consultation setting. Generation Health teal color palette (#0D9488). Modern, trustworthy, local feel. Two people in conversation - a professional advisor and a client - indoors, warm lighting, clean modern office or living room. No elderly people. No beach scenes. No dogs. No babies. No stock photo clichés. Apple-quality healthcare aesthetic. Dignified, human, real.";

const IMAGE_CHAT_SYSTEM = `You are the creative director for GenerationHealth.me, a Medicare insurance brokerage in Durham, NC. Your job is to craft Ideogram image prompts based on the user's description.

BRAND GUIDELINES:
- Colors: Teal (#0D9488), Carolina Blue (#4B9CD3), Midnight (#1A2332), White
- Feel: Professional, trustworthy, warm, approachable — Apple-quality healthcare aesthetic
- Setting: Modern offices, warm lighting, clean interiors
- People: Diverse, dignified, real-looking (not stock photo clichés)
- NEVER: Elderly stereotypes, beach scenes, dogs, babies, clip art, cartoons
- Style: Photorealistic, shallow depth of field, natural lighting

WORKFLOW:
1. The user describes what they want in plain English
2. You respond conversationally — acknowledge their idea, suggest improvements, keep it brief (2-3 sentences max)
3. End EVERY response with a clearly marked prompt block:

---PROMPT---
[Your optimized Ideogram prompt here, 1-3 sentences]
---END---

Keep prompts under 200 words. Always include brand color references.`;

type PlatformId = 'fb' | 'gmb' | 'li' | 'nd';
interface StudioPage { name: string; slug: string; clusterId: string; clusterName: string; idx: number; key: string; pipelineId?: string; isAeoPipeline?: boolean }
interface ChatMsg { role: 'user' | 'assistant'; content: string; imageUrl?: string }

export default function ContentStudioPanel() {
  const { aeoPipeline, setAeoPipeline } = useAppState();

  // ── State ──
  const [completed, setCompleted] = useState<string[]>(() => getFromStorage(LS_STUDIO_DONE, []));
  const [selectedPage, setSelectedPage] = useState<StudioPage | null>(null);
  const [posts, setPosts] = useState<Record<PlatformId, string>>({ fb: '', gmb: '', li: '', nd: '' });
  const [generating, setGenerating] = useState(false);
  const [regenPlatform, setRegenPlatform] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [claudeKey, setClaudeKey] = useState(() => getFromStorage(LS_CLAUDE_KEY, ''));
  const [ideogramKey, setIdeogramKey] = useState(() => { try { return localStorage.getItem(LS_IDEOGRAM_KEY) || ''; } catch { return ''; } });
  const [copied, setCopied] = useState<string | null>(null);

  // ── Image state ──
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [showImagePrompt, setShowImagePrompt] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // ── Persist ──
  useEffect(() => { saveToStorage(LS_STUDIO_DONE, completed); }, [completed]);
  useEffect(() => { saveToStorage(LS_CLAUDE_KEY, claudeKey); }, [claudeKey]);
  useEffect(() => { try { localStorage.setItem(LS_IDEOGRAM_KEY, ideogramKey); } catch {} }, [ideogramKey]);

  // ── Page list ──
  const allPages = useMemo(() => {
    const pages: StudioPage[] = [];
    // AEO pipeline pages first (priority)
    aeoPipeline.filter((p) => !p.socialDone).forEach((p) => {
      pages.push({ name: `🎯 ${p.title}`, slug: p.slug, clusterId: 'aeo-pipeline', clusterName: 'AEO Attack', idx: 0, key: `aeo-${p.slug}`, pipelineId: p.id, isAeoPipeline: true });
    });
    // Cluster pages
    clusters.forEach((c) => {
      c.posts.forEach((p, i) => {
        if (p.slug) pages.push({ name: p.name, slug: p.slug, clusterId: c.id, clusterName: c.name, idx: i, key: `${c.id}-${i}` });
      });
    });
    return pages;
  }, [aeoPipeline]);

  const completedSet = useMemo(() => new Set(completed), [completed]);
  const activePages = useMemo(() => allPages.filter((p) => !completedSet.has(p.key)), [allPages, completedSet]);
  const donePages = useMemo(() => allPages.filter((p) => completedSet.has(p.key)), [allPages, completedSet]);
  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return activePages;
    const q = searchQuery.toLowerCase();
    return activePages.filter((p) => (p.name || '').toLowerCase().includes(q) || (p.slug || '').toLowerCase().includes(q));
  }, [activePages, searchQuery]);
  const pct = allPages.length > 0 ? Math.round((donePages.length / allPages.length) * 100) : 0;

  const getTopic = useCallback(() => {
    if (!selectedPage) return '';
    return (selectedPage.slug || '').replace(/-/g, ' ').replace(/\bnc\b/gi, 'North Carolina');
  }, [selectedPage]);

  // ── Generate post for one platform ──
  const generatePlatform = useCallback(async (platformId: PlatformId) => {
    const key = claudeKey;
    if (!key) { alert('Add your Claude API key in Settings.'); return; }
    if (!selectedPage) return;
    const plat = PLATFORMS.find((p) => p.id === platformId);
    if (!plat) return;
    const topic = getTopic();
    try {
      const sys = `${VOICE}\n\nWRITE A ${plat.label.toUpperCase()} POST:\n${plat.tone}\n\nReturn ONLY the post text — no labels, no platform name, no quotes around it. Just the post ready to copy-paste.`;
      const usr = `Write a ${plat.label} post promoting this page: "${topic}"\nURL: generationhealth.me/${selectedPage.slug}`;
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 500, system: sys, messages: [{ role: 'user', content: usr }] }),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error.message);
      const txt = data.content?.[0]?.text || '';
      setPosts((prev) => ({ ...prev, [platformId]: txt }));
    } catch (e) {
      setPosts((prev) => ({ ...prev, [platformId]: `Error: ${e instanceof Error ? e.message : String(e)}` }));
    }
  }, [claudeKey, selectedPage, getTopic]);

  // ── Generate image via Ideogram ──
  const generateImage = useCallback(async () => {
    if (!ideogramKey) return;
    const topic = getTopic();
    setImageLoading(true);
    try {
      const prompt = `${IMAGE_PROMPT} Context: Medicare page about '${topic}'.`;
      const resp = await fetch('https://generationhealth.me/tools/generate-image-ideogram.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, apiKey: ideogramKey, aspect_ratio: 'ASPECT_1_1', style_type: 'REALISTIC', model: 'V_2' }),
      });
      const data = await resp.json();
      const url = data.data?.[0]?.url || '';
      if (url) setImageUrl(url);
    } catch (e) { console.error('Image gen error:', e); }
    setImageLoading(false);
  }, [ideogramKey, getTopic]);

  // ── Generate all platforms + image ──
  const generateAll = useCallback(async () => {
    if (!selectedPage) return;
    setGenerating(true);
    try {
      await Promise.all([
        ...PLATFORMS.map((p) => generatePlatform(p.id)),
        ideogramKey ? generateImage() : Promise.resolve(),
      ]);
    } catch (e) { console.error(e); }
    setGenerating(false);
  }, [selectedPage, generatePlatform, generateImage, ideogramKey]);

  // ── Regen single platform ──
  const regenSingle = useCallback(async (platformId: PlatformId) => {
    setRegenPlatform(platformId);
    await generatePlatform(platformId);
    setRegenPlatform(null);
  }, [generatePlatform]);

  // ── Mark done ──
  const markDone = useCallback(() => {
    if (!selectedPage) return;
    setCompleted((prev) => prev.includes(selectedPage.key) ? prev : [...prev, selectedPage.key]);
    if (selectedPage.isAeoPipeline && selectedPage.pipelineId) {
      setAeoPipeline((prev) => prev.map((p) => p.id === selectedPage.pipelineId ? { ...p, socialDone: true, socialDoneAt: new Date().toISOString() } : p));
    }
    setSelectedPage(null);
    setPosts({ fb: '', gmb: '', li: '', nd: '' });
    setImageUrl(null);
    setChatMsgs([]);
  }, [selectedPage, setAeoPipeline]);

  // ── Image chat ──
  const sendImageChat = useCallback(async (userMsg: string) => {
    if (!userMsg.trim()) return;
    if (!claudeKey) { alert('Add Claude API key in Settings.'); return; }
    if (!ideogramKey) { alert('Add Ideogram API key in Settings.'); return; }
    const topic = getTopic();
    const newMsgs: ChatMsg[] = [...chatMsgs, { role: 'user', content: userMsg }];
    setChatMsgs(newMsgs);
    setChatInput('');
    setChatLoading(true);
    try {
      const apiMsgs = newMsgs.filter((m) => m.content !== '[IMAGE_GENERATED]').map((m) => ({ role: m.role, content: m.content }));
      if (newMsgs.length === 1) apiMsgs[0].content = `Page topic: '${topic}'\n\nUser request: ${apiMsgs[0].content}`;
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': claudeKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 600, system: IMAGE_CHAT_SYSTEM, messages: apiMsgs }),
      });
      const data = await resp.json();
      const assistantText = data.content?.[0]?.text || "Sorry, couldn't process that.";
      let updated: ChatMsg[] = [...newMsgs, { role: 'assistant', content: assistantText }];
      setChatMsgs(updated);
      // Extract prompt and generate image
      const promptMatch = assistantText.match(/---PROMPT---\s*([\s\S]*?)\s*---END---/);
      if (promptMatch?.[1]) {
        setImageLoading(true);
        try {
          const imgResp = await fetch('https://generationhealth.me/tools/generate-image-ideogram.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: promptMatch[1].trim(), apiKey: ideogramKey, aspect_ratio: 'ASPECT_1_1', style_type: 'REALISTIC', model: 'V_2' }),
          });
          const imgData = await imgResp.json();
          const url = imgData.data?.[0]?.url || '';
          if (url) { setImageUrl(url); updated = [...updated, { role: 'assistant', content: '[IMAGE_GENERATED]', imageUrl: url }]; setChatMsgs(updated); }
        } catch (ie) { console.error('Ideogram error:', ie); }
        setImageLoading(false);
      }
    } catch (e) { setChatMsgs((prev) => [...prev, { role: 'assistant', content: `Error: ${e instanceof Error ? e.message : String(e)}` }]); }
    setChatLoading(false);
  }, [chatMsgs, claudeKey, ideogramKey, getTopic]);

  // ── Copy helper ──
  const copyPost = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const inputCls = "w-full px-3 py-2 rounded-lg border border-white/[0.12] bg-white/[0.04] text-white text-xs outline-none";

  // ══════════════════════════════════════
  // RENDER — 3 PANEL LAYOUT
  // ══════════════════════════════════════
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📣</span>
          <div>
            <h2 className="font-display text-xl font-bold text-white">Content Studio</h2>
            <p className="text-xs text-gh-text-muted mt-0.5">{donePages.length} / {allPages.length} URLs promoted · Facebook · GMB · LinkedIn · Nextdoor</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress */}
          <div className="w-48">
            <div className="flex justify-between text-[10px] text-gh-text-muted mb-1">
              <span>Promotion Progress</span>
              <span className={`font-extrabold ${pct >= 80 ? 'text-emerald-400' : pct >= 40 ? 'text-nc-gold' : 'text-red-400'}`}>{pct}%</span>
            </div>
            <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-teal-600 to-emerald-400 transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <button onClick={() => setShowSettings(!showSettings)} className="w-9 h-9 rounded-xl border border-white/[0.08] flex items-center justify-center text-gh-text-muted hover:text-white" title="Settings">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings */}
      {showSettings && (
        <div className="card p-4 space-y-3">
          <div className="text-[10px] font-bold text-gh-text-muted uppercase tracking-widest">API Keys</div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] font-bold text-gh-text-muted block mb-1">Claude (post generation)</label><input type="password" value={claudeKey} onChange={(e) => setClaudeKey(e.target.value)} placeholder="sk-ant-..." className={inputCls} /></div>
            <div><label className="text-[10px] font-bold text-gh-text-muted block mb-1">Ideogram (image generation)</label><input type="password" value={ideogramKey} onChange={(e) => setIdeogramKey(e.target.value)} placeholder="sk-..." className={inputCls} /></div>
          </div>
        </div>
      )}

      {/* 3-panel grid */}
      <div className="grid grid-cols-12 gap-4" style={{ minHeight: '70vh' }}>

        {/* ═══ LEFT — URL Queue (3 cols) ═══ */}
        <div className="col-span-3 card flex flex-col overflow-hidden">
          <div className="p-3 border-b border-white/[0.06]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gh-text-faint" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search pages..." className="w-full pl-8 pr-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.04] text-white text-xs outline-none" />
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-gh-text-muted">
              <span>{filteredPages.length} to promote</span>
              <span className="text-emerald-400">{donePages.length} done</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
            {filteredPages.length === 0 && <div className="p-8 text-center text-xs text-gh-text-faint">All pages promoted! 🎉</div>}
            {filteredPages.map((p) => (
              <button key={p.key} onClick={() => { setSelectedPage(p); setPosts({ fb: '', gmb: '', li: '', nd: '' }); setImageUrl(null); setChatMsgs([]); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-[11px] transition-colors ${selectedPage?.key === p.key ? 'bg-carolina/20 text-carolina' : p.isAeoPipeline ? 'bg-nc-gold/[0.05] text-nc-gold hover:bg-nc-gold/10' : 'text-gh-text-soft hover:bg-white/[0.04]'}`}>
                <div className="font-medium truncate">{p.name}</div>
                <div className="text-[9px] text-gh-text-faint truncate">/{p.slug}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ═══ CENTER — Post Generator (6 cols) ═══ */}
        <div className="col-span-6 flex flex-col gap-3 overflow-y-auto max-h-[80vh]">
          {selectedPage ? (
            <>
              {/* Page header + Generate All */}
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-bold text-white">{selectedPage.name}</div>
                    <div className="text-[10px] text-gh-text-faint">generationhealth.me/{selectedPage.slug}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={markDone} className="px-3 py-1.5 rounded-xl text-[10px] font-bold border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                      <Check className="w-3 h-3 inline mr-1" />Mark Done
                    </button>
                    <button onClick={generateAll} disabled={generating || !claudeKey} className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-600 to-blue-600 text-white disabled:opacity-40 hover:brightness-110">
                      {generating ? <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating...</span> : '🚀 Generate All Posts'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Platform posts */}
              {PLATFORMS.map((plat) => (
                <div key={plat.id} className="card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{plat.icon}</span>
                      <span className="text-xs font-bold" style={{ color: plat.color }}>{plat.label}</span>
                      {posts[plat.id] && <span className="text-[9px] text-gh-text-faint">{posts[plat.id].length} chars</span>}
                    </div>
                    <div className="flex gap-1.5">
                      {!posts[plat.id] ? (
                        <button onClick={() => generatePlatform(plat.id)} disabled={generating || !claudeKey} className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-white/10 text-gh-text-soft hover:bg-white/[0.04] disabled:opacity-40">Generate</button>
                      ) : (
                        <>
                          <button onClick={() => regenSingle(plat.id)} disabled={!!regenPlatform} className="px-2 py-1 rounded-lg text-[10px] font-bold border border-white/10 text-gh-text-faint hover:bg-white/[0.04] disabled:opacity-40">
                            {regenPlatform === plat.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : <RefreshCw className="w-3 h-3 inline" />}
                          </button>
                          <button onClick={() => copyPost(posts[plat.id], plat.id)} className="px-2 py-1 rounded-lg text-[10px] font-bold border border-white/10 text-gh-text-soft hover:bg-white/[0.04]">
                            {copied === plat.id ? <Check className="w-3 h-3 inline text-emerald-400" /> : <Copy className="w-3 h-3 inline" />}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {posts[plat.id] ? (
                    <div className="text-xs text-gh-text-soft leading-relaxed whitespace-pre-wrap bg-white/[0.02] rounded-lg p-3 border border-white/[0.06]">{posts[plat.id]}</div>
                  ) : (
                    <div className="text-[10px] text-gh-text-faint italic py-2">Click Generate or Generate All to create this post</div>
                  )}
                </div>
              ))}
            </>
          ) : (
            <div className="flex-1 card flex items-center justify-center" style={{ minHeight: '60vh' }}>
              <div className="text-center">
                <div className="text-4xl mb-3">📣</div>
                <div className="text-sm text-gh-text-muted mb-1">Select a page from the queue</div>
                <div className="text-[10px] text-gh-text-faint">Generate AI posts for all 4 platforms in one click</div>
              </div>
            </div>
          )}
        </div>

        {/* ═══ RIGHT — Image Generator (3 cols) ═══ */}
        <div className="col-span-3 card flex flex-col overflow-hidden">
          <div className="p-3 border-b border-white/[0.06]">
            <div className="text-[10px] font-bold text-gh-text-muted uppercase tracking-widest flex items-center gap-2">
              <Image className="w-3.5 h-3.5" />Image Studio
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Generated image */}
            {imageUrl && (
              <div className="space-y-2">
                <img src={imageUrl} alt="Generated" className="w-full rounded-xl" />
                <div className="flex gap-1.5">
                  <a href={imageUrl} download="gh-post.png" className="flex-1 py-1.5 rounded-lg text-[10px] font-bold border border-white/10 text-gh-text-soft hover:bg-white/[0.04] text-center">
                    <Download className="w-3 h-3 inline mr-1" />1:1
                  </a>
                </div>
              </div>
            )}

            {imageLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
              </div>
            )}

            {/* Auto-generate button */}
            {selectedPage && !imageUrl && !imageLoading && (
              <button onClick={generateImage} disabled={!ideogramKey} className="w-full py-3 rounded-xl text-xs font-bold border border-teal-500/30 bg-teal-500/10 text-teal-400 disabled:opacity-40 hover:bg-teal-500/20">
                {ideogramKey ? '🎨 Auto-Generate Image' : 'Add Ideogram key in Settings'}
              </button>
            )}

            {/* Image prompt toggle */}
            <button onClick={() => setShowImagePrompt(!showImagePrompt)} className="text-[10px] text-gh-text-faint hover:text-carolina">
              {showImagePrompt ? 'Hide' : 'Show'} image prompt
            </button>
            {showImagePrompt && (
              <div className="text-[10px] text-gh-text-faint bg-white/[0.03] rounded-lg p-2 leading-relaxed">{IMAGE_PROMPT}</div>
            )}

            {/* Image chat */}
            {selectedPage && (
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-gh-text-muted uppercase tracking-widest">Image Chat</div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {chatMsgs.map((msg, i) => (
                    msg.content === '[IMAGE_GENERATED]' ? (
                      <div key={i} className="text-[10px] text-emerald-400 text-center py-1">Image generated ✓</div>
                    ) : (
                      <div key={i} className={`text-[10px] rounded-lg p-2 ${msg.role === 'user' ? 'bg-carolina/10 text-carolina ml-4' : 'bg-white/[0.04] text-gh-text-soft mr-4'}`}>
                        {msg.content}
                      </div>
                    )
                  ))}
                  {chatLoading && <div className="flex items-center gap-1 text-[10px] text-gh-text-faint"><Loader2 className="w-3 h-3 animate-spin" />Thinking...</div>}
                </div>
                <div className="flex gap-1.5">
                  <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !chatLoading && sendImageChat(chatInput)}
                    placeholder="Describe the image you want..." className="flex-1 px-2.5 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] text-white text-[10px] outline-none" />
                  <button onClick={() => sendImageChat(chatInput)} disabled={chatLoading || !chatInput.trim()} className="px-2.5 py-1.5 rounded-lg bg-teal-600 text-white disabled:opacity-40">
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {!selectedPage && (
              <div className="text-center py-8 text-gh-text-faint">
                <Image className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <div className="text-[10px]">Select a page to generate images</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
