'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Loader2, Check, Copy, Search, ChevronDown, ChevronRight, RotateCcw, Megaphone } from 'lucide-react';
import { clusters } from '@/data/clusters';
import { getFromStorage, saveToStorage } from '@/lib/utils';
import { useAppState } from '@/lib/AppState';

// ── localStorage keys ──────────────────────────────────────────────────────
const LS_STUDIO_DONE  = 'gh-cc-studio-done';
const LS_CLAUDE_KEY   = 'gh-cc-pb-apikey';
const LS_IDEOGRAM_KEY = 'gh-cc-dalle-key';
const LS_PUNCH_CHECKS = 'gh-cc-studio-punch';

// ── Rob's voice system prompt ──────────────────────────────────────────────
const VOICE = `You are Rob Simm, independent Medicare/ACA broker in Durham, NC.
NC License #10447418, AHIP Certified. 12+ years experience, 500+ families helped, 5.0 Google rating.
Phone: (828) 761-3326. Website: generationhealth.me.
Voice: knowledgeable neighbor — straight, warm, local. No 1-800 call center energy.
You simplify Medicare by making people picture real situations. You use NEPQ naturally.
Always reference Durham, Wake County, or North Carolina. Never use generic insurance clichés.`;

// ── Image chat system prompt ───────────────────────────────────────────────
const IMAGE_CHAT_SYSTEM = `You are the creative director for GenerationHealth.me, a Medicare insurance brokerage in Durham, NC. Your job is to craft Ideogram image prompts based on the user's description.

BRAND GUIDELINES:
- Colors: Teal (#0D9488), Carolina Blue (#4B9CD3), Midnight (#1A2332), White
- Feel: Professional, trustworthy, warm, approachable — Apple-quality healthcare aesthetic
- Setting: Modern offices, warm lighting, clean interiors
- People: Diverse, dignified, real-looking (not stock photo clichés)
- NEVER: Elderly stereotypes, beach scenes, dogs, babies, clip art, cartoons
- Style: Photorealistic, shallow depth of field, natural lighting
- Ideogram excels at text rendering — include branded text overlays when appropriate

WORKFLOW:
1. Acknowledge the user's idea briefly (2-3 sentences max)
2. End EVERY response with a clearly marked prompt block:

---PROMPT---
[Optimized Ideogram prompt, 1-3 sentences, specific and visual.]
---END---

3. Adjust based on feedback after seeing results
4. Always include brand color references and style cues
5. When text overlay is requested, be explicit about exact text, font style, placement`;

// ── Platforms ──────────────────────────────────────────────────────────────
const PLATFORMS = [
  { id: 'gmb',   label: 'Google Business', icon: '📍', color: '#34A853',
    tone: 'Short, local, punchy. One sentence on the topic, one sentence establishing Rob as the Durham neighbor with the answer. Phone number. Under 150 words. No hashtags. End with generationhealth.me/[slug].' },
  { id: 'fb',    label: 'Facebook',        icon: '👥', color: '#1877F2',
    tone: "NEPQ story format. Open with an emotional situation question the reader is living. Two short paragraphs of Rob's voice. Close with soft CTA and phone (828) 761-3326. 150-250 words." },
  { id: 'li',    label: 'LinkedIn',        icon: '💼', color: '#0A66C2',
    tone: "Professional credibility. Open with a Medicare fact or stat. Build to Rob's expertise angle. Close with insight question. 120-180 words." },
  { id: 'nd',    label: 'Nextdoor',        icon: '🏘️', color: '#8DB600',
    tone: 'Rob sharing Medicare knowledge as a neighbor. Hyper-local — mention Durham or Wake County. Zero sales pressure. Under 120 words. Sounds like a neighbor posting, not an ad.' },
  { id: 'sms',   label: 'SMS Text',        icon: '💬', color: '#7C3AED',
    tone: 'TEXT MESSAGE to a past client or warm prospect. Conversational, personal. MUST be under 160 characters total. Include page URL at end.' },
  { id: 'email', label: 'Email Blast',     icon: '✉️', color: '#EA580C',
    tone: "Email to Rob's Medicare prospects and clients.\nSubject line (6-8 words, compelling)\n\nBody (150-250 words, NEPQ — open with situation question, insight, soft CTA).\n\nSign off as Rob Simm, (828) 761-3326, generationhealth.me" },
];

// ── Daily punch checklist ──────────────────────────────────────────────────
const PUNCH_STEPS = [
  { id: 'copy-elementor', label: 'Copy to Elementor' },
  { id: 'publish',        label: 'Publish page' },
  { id: 'post-gmb',      label: 'Post to GMB' },
  { id: 'share-fb',      label: 'Share to Facebook' },
  { id: 'queue-sms',     label: 'Queue SMS' },
  { id: 'draft-email',   label: 'Draft email' },
  { id: 'update-crm',    label: 'Update CRM sequence' },
  { id: 'partner-kit',   label: 'Generate partner kit' },
  { id: 'referral-kit',  label: 'Generate referral kit' },
  { id: 'mark-complete', label: 'Mark complete in Command Center' },
];

// ── Image suggestion starters ──────────────────────────────────────────────
const IMAGE_STARTERS = [
  'Professional advisor helping a client review Medicare plans',
  'Warm office setting with GenerationHealth branding',
  'Senior couple feeling confident about their healthcare decision',
];

type PageEntry = {
  name: string; slug: string; key: string;
  isAeoPipeline?: boolean; pipelineId?: string;
};

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
};

export default function ContentStudioPanel() {
  const { aeoPipeline, setAeoPipeline } = useAppState();

  // ── Core state ─────────────────────────────────────────────────────────
  const [completed,     setCompleted]     = useState<string[]>(() => getFromStorage(LS_STUDIO_DONE, []));
  const [punchChecks,   setPunchChecks]   = useState<Record<string, string[]>>(() => getFromStorage(LS_PUNCH_CHECKS, {}));
  const [searchQuery,   setSearchQuery]   = useState('');
  const [selectedPage,  setSelectedPage]  = useState<PageEntry | null>(null);
  const [posts,         setPosts]         = useState<Record<string, string>>({});
  const [generating,    setGenerating]    = useState<string | null>(null);
  const [genAll,        setGenAll]        = useState(false);
  const [copiedId,      setCopiedId]      = useState<string | null>(null);
  const [punchOpen,     setPunchOpen]     = useState(true);

  // ── Image Workshop state ───────────────────────────────────────────────
  const [imageChatMsgs,    setImageChatMsgs]    = useState<ChatMessage[]>([]);
  const [imageChatInput,   setImageChatInput]   = useState('');
  const [imageChatLoading, setImageChatLoading] = useState(false);
  const [studioImage,      setStudioImage]      = useState<string | null>(null);
  const [imageLoading,     setImageLoading]     = useState(false);
  const [showSettings,     setShowSettings]     = useState(false);
  const [claudeKey,        setClaudeKey]        = useState(() => getFromStorage<string>(LS_CLAUDE_KEY, ''));
  const [ideogramKey,      setIdeogramKey]      = useState(() => getFromStorage<string>(LS_IDEOGRAM_KEY, ''));

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // ── Persist ────────────────────────────────────────────────────────────
  useEffect(() => { saveToStorage(LS_STUDIO_DONE,  completed);   }, [completed]);
  useEffect(() => { saveToStorage(LS_PUNCH_CHECKS, punchChecks); }, [punchChecks]);
  useEffect(() => { saveToStorage(LS_CLAUDE_KEY,   claudeKey);   }, [claudeKey]);
  useEffect(() => { saveToStorage(LS_IDEOGRAM_KEY, ideogramKey); }, [ideogramKey]);
  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [imageChatMsgs]);

  // ── Page list ──────────────────────────────────────────────────────────
  const allPages = useMemo<PageEntry[]>(() => {
    const pipe = aeoPipeline.filter((p) => !p.socialDone).map((p) => ({
      name: `🎯 ${p.title}`, slug: p.slug, key: `aeo-${p.slug}`, isAeoPipeline: true, pipelineId: p.id,
    }));
    const cluster = clusters.flatMap((c) =>
      c.posts.filter((p) => p.slug).map((p, i) => ({ name: p.name, slug: p.slug!, key: `${c.id}-${i}` }))
    );
    return [...pipe, ...cluster];
  }, [aeoPipeline]);

  const completedSet  = useMemo(() => new Set(completed), [completed]);
  const activePages   = useMemo(() => allPages.filter((p) => !completedSet.has(p.key)), [allPages, completedSet]);
  const donePages     = useMemo(() => allPages.filter((p) => completedSet.has(p.key)),  [allPages, completedSet]);
  const pct           = allPages.length > 0 ? Math.round((donePages.length / allPages.length) * 100) : 0;

  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return activePages.slice(0, 30);
    const q = searchQuery.toLowerCase();
    return activePages.filter((p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q));
  }, [activePages, searchQuery]);

  // ── Punch helpers ──────────────────────────────────────────────────────
  const currentChecks = selectedPage ? (punchChecks[selectedPage.key] ?? []) : [];
  const punchPct      = Math.round((currentChecks.length / PUNCH_STEPS.length) * 100);
  const readyCount    = PLATFORMS.filter((p) => posts[p.id]?.trim()).length;

  const togglePunch = useCallback((stepId: string) => {
    if (!selectedPage) return;
    setPunchChecks((prev) => {
      const cur  = prev[selectedPage.key] ?? [];
      const next = cur.includes(stepId) ? cur.filter((s) => s !== stepId) : [...cur, stepId];
      return { ...prev, [selectedPage.key]: next };
    });
  }, [selectedPage]);

  // ── Get topic from slug ────────────────────────────────────────────────
  const getTopic = useCallback(() => {
    if (!selectedPage) return '';
    return selectedPage.slug.replace(/-/g, ' ').replace(/\bnc\b/gi, 'North Carolina');
  }, [selectedPage]);

  // ── Generate single post ───────────────────────────────────────────────
  const generatePost = useCallback(async (platformId: string): Promise<void> => {
    if (!selectedPage) return;
    const key = claudeKey || getFromStorage<string>(LS_CLAUDE_KEY, '');
    if (!key) { setShowSettings(true); return; }
    const platform = PLATFORMS.find((p) => p.id === platformId)!;
    setGenerating(platformId);
    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 600,
          system: VOICE,
          messages: [{
            role: 'user',
            content: `Write a ${platform.label} post promoting: "${selectedPage.name}"\nURL: generationhealth.me/${selectedPage.slug}\n\nINSTRUCTIONS: ${platform.tone}\n\nReturn ONLY the post text — no labels, no quotes. Ready to copy-paste.`,
          }],
        }),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error.message);
      setPosts((prev) => ({ ...prev, [platformId]: data.content?.[0]?.text ?? '' }));
    } catch (e) {
      setPosts((prev) => ({ ...prev, [platformId]: 'Error: ' + (e instanceof Error ? e.message : String(e)) }));
    }
    setGenerating(null);
  }, [selectedPage, claudeKey]);

  // ── Generate all platforms in parallel ────────────────────────────────
  const generateAll = useCallback(async () => {
    if (!selectedPage) return;
    setGenAll(true);
    try {
      await Promise.all(PLATFORMS.map((p) => generatePost(p.id)));
    } finally {
      setGenAll(false);
    }
  }, [selectedPage, generatePost]);

  // ── Copy ───────────────────────────────────────────────────────────────
  const copyPost = useCallback((platformId: string) => {
    navigator.clipboard.writeText(posts[platformId] ?? '').catch(() => {});
    setCopiedId(platformId);
    setTimeout(() => setCopiedId(null), 2000);
  }, [posts]);

  // ── Select / deselect page ─────────────────────────────────────────────
  const selectPage = useCallback((p: PageEntry) => {
    setSelectedPage(p);
    setPosts({});
    setStudioImage(null);
    setImageChatMsgs([]);
  }, []);

  // ── Mark done ──────────────────────────────────────────────────────────
  const markDone = useCallback(() => {
    if (!selectedPage) return;
    setCompleted((prev) => prev.includes(selectedPage.key) ? prev : [...prev, selectedPage.key]);
    if (selectedPage.isAeoPipeline && selectedPage.pipelineId) {
      setAeoPipeline((prev) =>
        prev.map((p) => p.id === selectedPage.pipelineId
          ? { ...p, socialDone: true, socialDoneAt: new Date().toISOString() } : p)
      );
    }
    setSelectedPage(null);
    setPosts({});
    setStudioImage(null);
    setImageChatMsgs([]);
  }, [selectedPage, setAeoPipeline]);

  // ── Image Workshop: auto-generate ─────────────────────────────────────
  const generateImageAuto = useCallback(async () => {
    const dKey = ideogramKey || getFromStorage<string>(LS_IDEOGRAM_KEY, '');
    if (!dKey || !selectedPage) return;
    const topic = getTopic();
    setImageLoading(true);
    try {
      const prompt = `Clean professional Medicare consultation setting. Generation Health teal color palette (#0D9488). Modern, trustworthy, local feel. Two people in conversation — a professional advisor and a client — indoors, warm lighting, clean modern office or living room. No elderly people. No beach scenes. No dogs. No babies. No stock photo clichés. Apple-quality healthcare aesthetic. Dignified, human, real. Context: Medicare page about "${topic}".`;
      const resp = await fetch('https://generationhealth.me/tools/generate-image-ideogram.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, apiKey: dKey, aspect_ratio: 'ASPECT_1_1', style_type: 'REALISTIC', model: 'V_2' }),
      });
      const data = await resp.json();
      const url = data?.data?.[0]?.url ?? '';
      if (url) setStudioImage(url);
    } catch (e) { console.error('Image gen error:', e); }
    finally { setImageLoading(false); }
  }, [selectedPage, ideogramKey, getTopic]);

  // ── Image Workshop: chat ───────────────────────────────────────────────
  const sendImageChat = useCallback(async (userMsg: string) => {
    if (!userMsg.trim()) return;
    const cKey = claudeKey || getFromStorage<string>(LS_CLAUDE_KEY, '');
    const dKey = ideogramKey || getFromStorage<string>(LS_IDEOGRAM_KEY, '');
    if (!cKey) { setShowSettings(true); return; }
    if (!dKey) { setShowSettings(true); return; }

    const topic = getTopic();
    const newMsgs: ChatMessage[] = [...imageChatMsgs, { role: 'user', content: userMsg }];
    setImageChatMsgs(newMsgs);
    setImageChatInput('');
    setImageChatLoading(true);

    try {
      // Build API messages — inject topic context on first message
      const apiMsgs = newMsgs
        .filter((m) => m.content !== '[IMAGE_GENERATED]')
        .map((m, i) => ({
          role: m.role,
          content: i === 0 ? `Page topic: '${topic}'\n\nUser request: ${m.content}` : m.content,
        }));

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': cKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 600,
          system: IMAGE_CHAT_SYSTEM,
          messages: apiMsgs,
        }),
      });
      const data = await resp.json();
      const assistantText: string = data.content?.[0]?.text ?? 'Sorry, could not process that.';
      const withAssistant: ChatMessage[] = [...newMsgs, { role: 'assistant', content: assistantText }];
      setImageChatMsgs(withAssistant);

      // Extract prompt and call Ideogram
      const promptMatch = assistantText.match(/---PROMPT---\s*([\s\S]*?)\s*---END---/);
      if (promptMatch?.[1]) {
        setImageLoading(true);
        try {
          const imgResp = await fetch('https://generationhealth.me/tools/generate-image-ideogram.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: promptMatch[1].trim(),
              apiKey: dKey,
              aspect_ratio: 'ASPECT_1_1',
              style_type: 'REALISTIC',
              model: 'V_2',
            }),
          });
          const imgData = await imgResp.json();
          const url: string = imgData?.data?.[0]?.url ?? '';
          if (url) {
            setStudioImage(url);
            setImageChatMsgs((prev) => [...prev, { role: 'assistant', content: '[IMAGE_GENERATED]', imageUrl: url }]);
          }
        } catch (ie) { console.error('Ideogram error:', ie); }
        finally { setImageLoading(false); }
      }
    } catch (e) {
      setImageChatMsgs((prev) => [...prev, { role: 'assistant', content: 'Error: ' + (e instanceof Error ? e.message : String(e)) }]);
    } finally {
      setImageChatLoading(false);
    }
  }, [imageChatMsgs, claudeKey, ideogramKey, getTopic]);

  const keysReady = !!(claudeKey && ideogramKey);

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center text-xl">📣</div>
          <div>
            <h2 className="font-display text-xl font-bold text-white">Content Studio</h2>
            <p className="text-xs text-gh-text-muted mt-0.5">{donePages.length}/{allPages.length} URLs promoted · 6 channels · Image Workshop</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Settings gear */}
          <button
            onClick={() => setShowSettings((s) => !s)}
            title="API Keys"
            className={`w-9 h-9 rounded-xl border flex items-center justify-center text-base transition-all ${keysReady ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-white/10 bg-white/[0.03]'}`}
          >⚙️</button>
          {/* Progress */}
          <div className="min-w-[180px]">
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-gh-text-muted">Promotion progress</span>
              <span className="font-bold text-white">{pct}%</span>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#0D9488,#4ADE80)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Settings dropdown ── */}
      {showSettings && (
        <div className="card p-5 space-y-4">
          <div className="text-[11px] font-bold text-gh-text-muted uppercase tracking-widest">API Keys</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gh-text-soft mb-1.5">Claude API Key (post generation)</div>
              <input
                type="password"
                value={claudeKey}
                onChange={(e) => setClaudeKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full px-3 py-2 rounded-lg border border-white/[0.12] bg-white/[0.04] text-white text-xs outline-none"
              />
            </div>
            <div>
              <div className="text-xs text-gh-text-soft mb-1.5">Ideogram API Key (image generation)</div>
              <input
                type="password"
                value={ideogramKey}
                onChange={(e) => setIdeogramKey(e.target.value)}
                placeholder="ideogram-..."
                className="w-full px-3 py-2 rounded-lg border border-white/[0.12] bg-white/[0.04] text-white text-xs outline-none"
              />
            </div>
          </div>
          <button onClick={() => setShowSettings(false)} className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0D9488] text-white hover:opacity-90">Save & Close</button>
        </div>
      )}

      {/* ── 4-column layout: Queue | Posts | Punch List | Image Workshop ── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '210px 1fr 232px 248px', minHeight: 700 }}>

        {/* ═══ LEFT — URL Queue ═══ */}
        <div className="card flex flex-col overflow-hidden">
          <div className="p-3 border-b border-white/[0.08]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gh-text-faint" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pages..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-white/[0.12] bg-white/[0.04] text-white text-xs outline-none placeholder:text-gh-text-faint"
              />
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-gh-text-faint">
              <span>{filteredPages.length} to promote</span>
              <span className="text-emerald-400">{donePages.length} done ✅</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {filteredPages.length === 0 && <div className="p-6 text-center text-gh-text-faint text-xs">All pages promoted! 🎉</div>}
            {filteredPages.map((p) => {
              const isSel = selectedPage?.key === p.key;
              return (
                <button key={p.key} onClick={() => selectPage(p)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all ${isSel ? 'bg-carolina/20 border border-carolina/30 text-carolina' : p.isAeoPipeline ? 'text-emerald-400 hover:bg-emerald-500/[0.06]' : 'text-gh-text-soft hover:bg-white/[0.04]'}`}>
                  <div className="font-semibold truncate">{p.name.replace(/\s*\|.*$/, '')}</div>
                  <div className="text-[10px] text-gh-text-faint truncate mt-0.5">/{p.slug}</div>
                </button>
              );
            })}
            {donePages.length > 0 && (
              <div className="pt-3">
                <div className="text-[10px] font-bold text-gh-text-faint uppercase tracking-widest px-2 mb-1">Done ({donePages.length})</div>
                {donePages.slice(0, 5).map((p) => (
                  <div key={p.key} className="px-3 py-1 text-[11px] text-emerald-500/50 truncate">{p.name.replace(/\s*\|.*$/, '')}</div>
                ))}
                {donePages.length > 5 && <div className="text-[10px] text-gh-text-faint px-3">+{donePages.length - 5} more</div>}
              </div>
            )}
          </div>
        </div>

        {/* ═══ MIDDLE — Platform Posts ═══ */}
        <div className="flex flex-col gap-3 min-w-0">
          {!selectedPage ? (
            <div className="card flex-1 flex flex-col items-center justify-center gap-3 text-center p-10">
              <div className="text-4xl">📣</div>
              <div className="text-sm font-semibold text-white">Select a URL to begin</div>
              <div className="text-xs text-gh-text-muted max-w-xs">Choose any page from the queue. Generate all 6 channels — GMB, Facebook, LinkedIn, Nextdoor, SMS, and Email.</div>
            </div>
          ) : (
            <>
              {/* URL bar */}
              <div className="card p-3 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-gh-text-faint uppercase tracking-widest mb-0.5">Active Page</div>
                  <div className="text-sm font-bold text-white truncate">{selectedPage.name.replace(/\s*\|.*$/, '')}</div>
                  <div className="text-[11px] text-gh-text-muted font-mono truncate">generationhealth.me/{selectedPage.slug}</div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={generateAll} disabled={genAll}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 disabled:opacity-40 flex items-center gap-1.5">
                    {genAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Megaphone className="w-3.5 h-3.5" />}
                    Generate All
                  </button>
                  <button onClick={markDone}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" /> Mark Done
                  </button>
                </div>
              </div>

              {readyCount > 0 && (
                <div className="text-[11px] text-gh-text-muted px-1">
                  <span className="text-emerald-400 font-bold">{readyCount}/{PLATFORMS.length}</span> posts ready
                </div>
              )}

              {/* Platform grid — 2 col */}
              <div className="grid grid-cols-2 gap-3 flex-1">
                {PLATFORMS.map((platform) => (
                  <div key={platform.id} className="card p-3 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold" style={{ color: platform.color }}>{platform.icon} {platform.label}</span>
                      <div className="flex gap-1.5">
                        <button onClick={() => generatePost(platform.id)} disabled={!!generating || genAll}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-white/10 text-gh-text-soft hover:bg-white/[0.04] disabled:opacity-40 flex items-center gap-1">
                          {generating === platform.id ? <Loader2 className="w-3 h-3 animate-spin" /> : '✨'}
                          {generating === platform.id ? '' : 'Gen'}
                        </button>
                        {posts[platform.id] && (
                          <button onClick={() => copyPost(platform.id)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-white/10 text-gh-text-soft hover:bg-white/[0.04] flex items-center gap-1">
                            {copiedId === platform.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>
                    <textarea
                      value={posts[platform.id] ?? ''}
                      onChange={(e) => setPosts((prev) => ({ ...prev, [platform.id]: e.target.value }))}
                      placeholder={`${platform.icon} ${platform.label} post...`}
                      className="flex-1 min-h-[108px] px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.02] text-xs text-gh-text-soft resize-none outline-none leading-relaxed"
                    />
                    {platform.id === 'sms' && posts['sms'] && (
                      <div className={`text-[10px] mt-1 text-right font-mono ${posts['sms'].length > 160 ? 'text-red-400 font-bold' : 'text-gh-text-faint'}`}>
                        {posts['sms'].length}/160
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ═══ RIGHT A — Daily Punch List ═══ */}
        <div className="card flex flex-col overflow-hidden">
          <button onClick={() => setPunchOpen((o) => !o)}
            className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] w-full text-left">
            <div>
              <div className="text-sm font-bold text-white">📋 Daily Punch List</div>
              {selectedPage && (
                <div className="text-[10px] text-gh-text-faint mt-0.5 truncate max-w-[160px]">{selectedPage.name.replace(/\s*\|.*$/, '')}</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedPage && (
                <span className={`text-[11px] font-bold ${punchPct === 100 ? 'text-emerald-400' : 'text-gh-text-muted'}`}>
                  {currentChecks.length}/{PUNCH_STEPS.length}
                </span>
              )}
              {punchOpen ? <ChevronDown className="w-4 h-4 text-gh-text-faint" /> : <ChevronRight className="w-4 h-4 text-gh-text-faint" />}
            </div>
          </button>

          {punchOpen && (
            <div className="flex-1 overflow-y-auto flex flex-col">
              {selectedPage && (
                <div className="px-4 pt-3 pb-1">
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${punchPct}%`, background: punchPct === 100 ? '#4ADE80' : 'linear-gradient(90deg,#7C3AED,#EC4899)' }} />
                  </div>
                </div>
              )}

              {!selectedPage ? (
                <div className="flex-1 flex items-center justify-center p-6 text-center text-gh-text-faint text-xs">
                  Select a page to start your punch list
                </div>
              ) : (
                <div className="px-3 py-3 space-y-1 flex-1">
                  {PUNCH_STEPS.map((step, i) => {
                    const checked = currentChecks.includes(step.id);
                    return (
                      <button key={step.id} onClick={() => togglePunch(step.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-left transition-all ${checked ? 'bg-emerald-500/[0.08] border border-emerald-500/20 text-emerald-400' : 'hover:bg-white/[0.04] text-gh-text-soft border border-transparent'}`}>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${checked ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'}`}>
                          {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </div>
                        <span>
                          <span className="text-[10px] text-gh-text-faint mr-1 font-mono">{String(i + 1).padStart(2, '0')}</span>
                          {step.label}
                        </span>
                      </button>
                    );
                  })}

                  {punchPct === 100 && (
                    <div className="mt-3 p-3 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 text-center">
                      <div className="text-emerald-400 font-bold text-sm">🎉 All steps complete!</div>
                      <button onClick={markDone} className="mt-2 w-full px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500">
                        Mark Page Done → Next
                      </button>
                    </div>
                  )}

                  {currentChecks.length > 0 && punchPct < 100 && (
                    <button onClick={() => setPunchChecks((prev) => ({ ...prev, [selectedPage.key]: [] }))}
                      className="w-full mt-2 flex items-center justify-center gap-1.5 text-[10px] text-gh-text-faint hover:text-gh-text-muted py-1.5 rounded-lg hover:bg-white/[0.03] transition-colors">
                      <RotateCcw className="w-3 h-3" /> Reset checklist
                    </button>
                  )}
                </div>
              )}

              {/* Channel cadence footer */}
              <div className="border-t border-white/[0.08] p-4 space-y-2 mt-auto">
                <div className="text-[10px] font-bold text-gh-text-faint uppercase tracking-widest mb-2">Channel Cadence</div>
                {[
                  { label: 'GBP Post',  icon: '📍', freq: 'Daily',  color: '#34A853' },
                  { label: 'Facebook',  icon: '👥', freq: 'Daily',  color: '#1877F2' },
                  { label: 'LinkedIn',  icon: '💼', freq: '2x/wk',  color: '#0A66C2' },
                  { label: 'Nextdoor',  icon: '🏘️', freq: 'Weekly', color: '#8DB600' },
                  { label: 'SMS Queue', icon: '💬', freq: 'Weekly', color: '#7C3AED' },
                  { label: 'Email',     icon: '✉️', freq: 'Weekly', color: '#EA580C' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-xs">
                    <span className="text-gh-text-soft flex items-center gap-1.5"><span>{item.icon}</span>{item.label}</span>
                    <span className="text-[10px] font-bold" style={{ color: item.color }}>{item.freq}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ═══ RIGHT B — Image Workshop ═══ */}
        <div className="card flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0">
            <div>
              <div className="text-sm font-bold text-white">🎨 Image Workshop</div>
              <div className="text-[10px] text-gh-text-muted mt-0.5">
                {keysReady ? 'Claude + Ideogram connected' : 'Add API keys in ⚙️'}
              </div>
            </div>
            {imageChatMsgs.length > 0 && (
              <button onClick={() => { setImageChatMsgs([]); setStudioImage(null); }}
                className="text-[10px] px-2.5 py-1 rounded-lg border border-white/10 text-gh-text-faint hover:text-gh-text-soft">
                Clear
              </button>
            )}
          </div>

          {/* Chat + Image scroll area */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 min-h-0">

            {/* Current image */}
            {studioImage && (
              <div>
                <img src={studioImage} alt="Generated" className="w-full rounded-xl border border-carolina/20 block" />
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {[['1:1','Square',1,1],['4:5','Portrait',4,5],['16:9','Landscape',16,9]].map(([label, name, w, h]: any) => (
                    <button key={label} onClick={async () => {
                      const img = new Image();
                      img.crossOrigin = 'anonymous';
                      img.onload = () => {
                        const c = document.createElement('canvas');
                        const srcW = img.width, srcH = img.height;
                        const ratio = w / h;
                        let cropW, cropH, ox, oy;
                        if (srcW / srcH > ratio) { cropH = srcH; cropW = Math.round(srcH * ratio); ox = Math.round((srcW - cropW) / 2); oy = 0; }
                        else { cropW = srcW; cropH = Math.round(srcW / ratio); ox = 0; oy = Math.round((srcH - cropH) / 2); }
                        c.width = cropW; c.height = cropH;
                        c.getContext('2d')!.drawImage(img, ox, oy, cropW, cropH, 0, 0, cropW, cropH);
                        const a = document.createElement('a');
                        a.href = c.toDataURL('image/png');
                        a.download = `gh-post-${name.toLowerCase()}.png`;
                        a.click();
                      };
                      img.src = studioImage!;
                    }}
                      className="px-2 py-1.5 rounded-lg border border-white/10 text-[10px] font-bold text-gh-text-soft hover:bg-white/[0.04] text-center">
                      ⬇ {label} {name}
                    </button>
                  ))}
                  <button onClick={() => { const a = document.createElement('a'); a.href = studioImage!; a.download = `gh-post-${new Date().toISOString().slice(0, 10)}.png`; a.click(); }}
                    className="px-2 py-1.5 rounded-lg border border-carolina/30 bg-carolina/10 text-[10px] font-bold text-carolina text-center">
                    ⬇ Original
                  </button>
                </div>
              </div>
            )}

            {imageLoading && (
              <div className="h-28 rounded-xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-center">
                <div className="text-xs text-gh-text-muted flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Generating image...</div>
              </div>
            )}

            {/* Chat messages */}
            {imageChatMsgs.map((msg, i) => {
              if (msg.content === '[IMAGE_GENERATED]') return null;
              const displayText = msg.content.replace(/---PROMPT---[\s\S]*?---END---/g, '').trim() || 'Generating prompt...';
              return (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] px-3 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap
                    ${msg.role === 'user' ? 'bg-carolina/15 border border-carolina/20 text-white rounded-tr-sm' : 'bg-white/[0.05] border border-white/[0.08] text-gh-text-soft rounded-tl-sm'}`}>
                    {displayText}
                  </div>
                </div>
              );
            })}

            {imageChatLoading && (
              <div className="flex justify-start">
                <div className="px-3 py-2.5 rounded-2xl rounded-tl-sm bg-white/[0.05] border border-white/[0.08] text-xs text-gh-text-muted">🤔 Thinking...</div>
              </div>
            )}

            {/* Empty state */}
            {imageChatMsgs.length === 0 && !studioImage && !imageLoading && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-6">
                <div className="text-3xl">🎨</div>
                <div className="text-sm font-semibold text-white">Describe your image</div>
                <div className="text-[11px] text-gh-text-muted text-center max-w-[200px] leading-relaxed">
                  Tell Claude what you want. Claude crafts the prompt, Ideogram renders it. Text overlays supported.
                </div>
                <div className="space-y-1.5 w-full mt-1">
                  {IMAGE_STARTERS.map((eg) => (
                    <button key={eg} onClick={() => setImageChatInput(eg)}
                      className="w-full px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.02] text-[11px] text-gh-text-muted text-left hover:bg-white/[0.04] transition-colors leading-snug">
                      {eg}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Chat input */}
          <div className="p-3 border-t border-white/[0.08] flex gap-2 flex-shrink-0">
            <input
              value={imageChatInput}
              onChange={(e) => setImageChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !imageChatLoading) { e.preventDefault(); sendImageChat(imageChatInput); } }}
              placeholder={imageChatMsgs.length > 0 ? 'Describe changes...' : 'Describe what you want...'}
              disabled={imageChatLoading}
              className="flex-1 px-3 py-2 rounded-lg border border-white/[0.12] bg-white/[0.04] text-white text-xs outline-none placeholder:text-gh-text-faint"
            />
            <button
              onClick={() => { if (!imageChatLoading) sendImageChat(imageChatInput); }}
              disabled={imageChatLoading || !imageChatInput.trim()}
              className="px-3 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
              style={{ background: imageChatInput.trim() ? '#0D9488' : 'rgba(255,255,255,0.06)', color: imageChatInput.trim() ? '#fff' : '#6B7B8D' }}
            >
              {imageChatLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '→'}
            </button>
          </div>

          {/* Auto-generate quick action */}
          {selectedPage && ideogramKey && (
            <div className="px-3 pb-3 pt-0 flex gap-2 flex-shrink-0">
              <button onClick={generateImageAuto} disabled={imageLoading}
                className="flex-1 py-1.5 rounded-lg border border-white/10 text-[11px] font-bold text-[#0D9488] hover:bg-white/[0.03] disabled:opacity-40">
                ⚡ Auto Generate
              </button>
              <button onClick={() => { setImageChatMsgs([]); setStudioImage(null); }}
                className="py-1.5 px-3 rounded-lg border border-white/10 text-[11px] font-bold text-gh-text-muted hover:bg-white/[0.03]">
                ↺ Reset
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
