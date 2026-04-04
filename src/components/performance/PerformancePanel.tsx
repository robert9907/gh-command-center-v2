'use client';

import { useState, useMemo, useCallback } from 'react';
import { ComposedChart, Bar, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Target, ArrowUpRight, ArrowDownRight, Minus, Loader2, Zap } from 'lucide-react';
import { useAppState } from '@/lib/AppState';
import { perfData as seedPerfData } from '@/data/seed';
import { calcTrend, calcPercentChange, formatNumber, formatDateLabel, getFromStorage } from '@/lib/utils';
import { startGSCAuth, getGSCClientId, captureOAuthToken, getGSCToken } from '@/lib/gsc';
import { AI_SYSTEM_PROMPT } from '@/lib/ai-prompt-sys';

const LS_API_KEY = 'gh-cc-pb-apikey';

export default function PerformancePanel() {
  const { aeoPipeline, dailyKPIs, setDailyKPI, perfGoals, setPerfGoals, projLevers, setProjLevers, navigateToTab, gscData, setGscData, aeoScores, setAeoScores, weeklyPerfData, addWeeklyPerf, ga4Token, setGa4Token } = useAppState();
  const [showKpiForm, setShowKpiForm] = useState(false);
  const [showWeeklyForm, setShowWeeklyForm] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [showLevers, setShowLevers] = useState(false);
  const [showGscConnect, setShowGscConnect] = useState(true);
  const [showAeoScores, setShowAeoScores] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState('');

  // KPI form
  const [kpiDate, setKpiDate] = useState(new Date().toISOString().split('T')[0]);
  const [kpiSpend, setKpiSpend] = useState(''); const [kpiCalls, setKpiCalls] = useState(''); const [kpiGbp, setKpiGbp] = useState(''); const [kpiLeads, setKpiLeads] = useState(''); const [kpiCpa, setKpiCpa] = useState('');

  // Weekly form
  const [wkDate, setWkDate] = useState(''); const [wkUsers, setWkUsers] = useState(''); const [wkOrganic, setWkOrganic] = useState(''); const [wkChatgpt, setWkChatgpt] = useState(''); const [wkDirect, setWkDirect] = useState(''); const [wkSocial, setWkSocial] = useState(''); const [wkImpr, setWkImpr] = useState(''); const [wkClicks, setWkClicks] = useState(''); const [wkCalls, setWkCalls] = useState(''); const [wkBookings, setWkBookings] = useState(''); const [wkGbp, setWkGbp] = useState('');

  // Merge seed + user-entered weekly data
  const allPerfData = useMemo(() => {
    const merged = [...seedPerfData];
    weeklyPerfData.forEach((w) => { if (!merged.find((m) => m.weekOf === w.weekOf)) merged.push({ ...w, keywords: {}, aiCited: 0, aiMentioned: 0, aiNotFound: 0 }); });
    return merged.sort((a, b) => a.weekOf.localeCompare(b.weekOf));
  }, [weeklyPerfData]);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : 'Good afternoon';
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  const yKPI = dailyKPIs[yesterday.toISOString().split('T')[0]];
  const todayDeployed = aeoPipeline.filter((p) => p.deployedAt?.startsWith(now.toISOString().split('T')[0])).length;
  const totalDeployed = aeoPipeline.length;
  const pendingSocial = aeoPipeline.filter((p) => !p.socialDone).length;
  const gscAge = gscData?.fetchedAt ? Math.round((now.getTime() - new Date(gscData.fetchedAt as string).getTime()) / 3600000) + 'h ago' : 'not fetched';
  const latest = allPerfData[allPerfData.length - 1];
  const latestAuthority = aeoScores.length > 0 ? aeoScores[aeoScores.length - 1].score : 0;

  const punchList = useMemo(() => {
    const items: Array<{ icon: string; text: string; tab: string }> = [];
    if (pendingSocial > 0) items.push({ icon: '📣', text: `${pendingSocial} AEO page${pendingSocial > 1 ? 's' : ''} need social promotion`, tab: 'studio' });
    if (totalDeployed === 0) items.push({ icon: '🎯', text: '0 AEO pages deployed — run Citation Monitor', tab: 'citationMonitor' });
    if (!gscData) items.push({ icon: '📊', text: 'GSC data not pulled — connect & refresh', tab: 'performance' });
    if (items.length === 0) items.push({ icon: '✅', text: 'All caught up! Attack more Citation Monitor queries.', tab: 'citationMonitor' });
    return items;
  }, [pendingSocial, totalDeployed, gscData]);

  // Projections
  const baseImpr = latest?.impressions || 0; const baseClicks = latest?.clicks || 0; const baseCalls = latest?.calls || 1;
  const totalBoost = (1 + Math.max(totalDeployed, projLevers.pagesPublished) * 0.04) * (1 + projLevers.builderOptimized * 0.025) * (1 + projLevers.backlinks * 0.06) * (1 + projLevers.aeoImprovement * 0.03);
  const adsCallBoost = 1 + projLevers.adsbudget * 0.1;
  const proj = {
    '30d': { impr: Math.round(baseImpr * 4 * totalBoost), clicks: Math.round(baseClicks * 4 * totalBoost * 1.1), calls: Math.round(baseCalls * 4 * adsCallBoost) },
    '60d': { impr: Math.round(baseImpr * 8 * totalBoost * 1.15), clicks: Math.round(baseClicks * 8 * totalBoost * 1.25), calls: Math.round(baseCalls * 8 * adsCallBoost * 1.2) },
    '90d': { impr: Math.round(baseImpr * 13 * totalBoost * 1.3), clicks: Math.round(baseClicks * 13 * totalBoost * 1.4), calls: Math.round(baseCalls * 13 * adsCallBoost * 1.4) },
  };

  const comparison = allPerfData.length >= 2 ? { current: allPerfData[allPerfData.length - 1], previous: allPerfData[allPerfData.length - 2] } : null;
  const chartData = useMemo(() => allPerfData.map((w) => ({ week: formatDateLabel(w.weekOf), users: w.users, organic: w.organic, impressions: w.impressions, clicks: w.clicks })), [allPerfData]);

  const saveKpi = useCallback(() => { setDailyKPI(kpiDate, { date: kpiDate, adsSpend: parseFloat(kpiSpend) || undefined, clickToCall: parseInt(kpiCalls) || undefined, gbpCalls: parseInt(kpiGbp) || undefined, formLeads: parseInt(kpiLeads) || undefined, cpa: parseFloat(kpiCpa) || undefined }); setShowKpiForm(false); setKpiSpend(''); setKpiCalls(''); setKpiGbp(''); setKpiLeads(''); setKpiCpa(''); }, [kpiDate, kpiSpend, kpiCalls, kpiGbp, kpiLeads, kpiCpa, setDailyKPI]);

  const saveWeekly = useCallback(() => { addWeeklyPerf({ weekOf: wkDate, users: parseInt(wkUsers) || 0, organic: parseInt(wkOrganic) || 0, chatgpt: parseInt(wkChatgpt) || 0, direct: parseInt(wkDirect) || 0, social: parseInt(wkSocial) || 0, impressions: parseInt(wkImpr) || 0, clicks: parseInt(wkClicks) || 0, calls: parseInt(wkCalls) || 0, bookings: parseInt(wkBookings) || 0, gbpViews: parseInt(wkGbp) || 0 }); setShowWeeklyForm(false); setWkDate(''); setWkUsers(''); setWkOrganic(''); setWkChatgpt(''); setWkDirect(''); setWkSocial(''); setWkImpr(''); setWkClicks(''); setWkCalls(''); setWkBookings(''); setWkGbp(''); }, [wkDate, wkUsers, wkOrganic, wkChatgpt, wkDirect, wkSocial, wkImpr, wkClicks, wkCalls, wkBookings, wkGbp, addWeeklyPerf]);

  // GSC connect
  const handleGscConnect = useCallback(() => {
    const captured = captureOAuthToken();
    if (captured) { setGa4Token(captured); return; }
    const clientId = getGSCClientId();
    if (clientId) startGSCAuth(clientId);
    else alert('No OAuth Client ID configured');
  }, [setGa4Token]);

  // GSC pull
  const [gscPulling, setGscPulling] = useState(false);
  const handleGscPull = useCallback(async () => {
    const token = ga4Token || getGSCToken();
    if (!token) { handleGscConnect(); return; }
    setGscPulling(true);
    try {
      const end = new Date(); const start = new Date(); start.setDate(end.getDate() - 28);
      const resp = await fetch('https://www.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fgenerationhealth.me%2F/searchAnalytics/query', {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0], dimensions: ['query'], rowLimit: 100 }),
      });
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        const msg = errData?.error?.message || `HTTP ${resp.status}`;
        alert(`GSC pull failed: ${msg}`);
        if (resp.status === 401 || resp.status === 403) { setGa4Token(''); localStorage.removeItem('gh-cc-ga4-token'); }
        setGscPulling(false);
        return;
      }
      const data = await resp.json();
      setGscData({ ...data, fetchedAt: new Date().toISOString(), dateRange: '28' });
    } catch (e) { alert('GSC pull failed: ' + (e instanceof Error ? e.message : String(e))); }
    setGscPulling(false);
  }, [ga4Token, handleGscConnect, setGscData, setGa4Token]);

  // AI Analysis
  const runAiAnalysis = useCallback(async () => {
    const apiKey = getFromStorage(LS_API_KEY, '');
    if (!apiKey) { alert('Add Claude API key in Page Builder first'); return; }
    setAiAnalyzing(true);
    let ctx = `GENERATION HEALTH PERFORMANCE DATA — ${new Date().toLocaleDateString()}\n\n`;
    ctx += `BUSINESS: Rob Simm, independent Medicare/ACA broker, Durham NC.\n\n`;
    ctx += `WEEKLY METRICS (last 8 weeks):\n`;
    allPerfData.slice(-8).forEach((w) => { ctx += `  Week of ${w.weekOf}: ${w.impressions} impr, ${w.clicks} clicks, ${w.users} users, ${w.calls} calls\n`; });
    ctx += `\nCURRENT: ${baseImpr} weekly impressions, ${baseClicks} weekly clicks\n`;
    ctx += `AEO Pipeline: ${totalDeployed} pages deployed, ${pendingSocial} pending social\n`;
    ctx += `Authority Score: ${latestAuthority}\n`;
    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey as string, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2000, system: 'You are an SEO and digital marketing analyst for a Medicare insurance broker in Durham, NC. Analyze the data and provide actionable recommendations. Be specific with numbers.', messages: [{ role: 'user', content: ctx + '\n\nAnalyze this data. What are the top 3 opportunities and top 3 risks? What should Rob focus on this week?' }] }),
      });
      const data = await resp.json();
      setAiResult(data.content?.[0]?.text || 'No analysis generated');
    } catch (e) { setAiResult('Analysis failed: ' + (e instanceof Error ? e.message : String(e))); }
    setAiAnalyzing(false);
  }, [allPerfData, baseImpr, baseClicks, totalDeployed, pendingSocial, latestAuthority]);

  const inputCls = "px-3 py-2 rounded-lg border border-white/[0.12] bg-white/[0.04] text-white text-xs outline-none w-full";

  return (
    <div className="space-y-6">
      {/* ═══ MORNING DASHBOARD ═══ */}
      <div className="card p-7" style={{ background: 'rgba(75,156,211,0.04)', border: '1px solid rgba(75,156,211,0.15)' }}>
        <div className="flex items-center justify-between mb-5">
          <div><div className="font-display text-xl font-bold text-white">{greeting}, Rob</div><div className="text-xs text-gh-text-muted mt-1">{dayNames[now.getDay()]}, {monthNames[now.getMonth()]} {now.getDate()}, {now.getFullYear()}</div></div>
          <div className="text-right"><div className="text-[11px] text-gh-text-muted">Authority Score</div><div className="text-3xl font-extrabold text-carolina font-display">{latestAuthority}</div></div>
        </div>
        <div className="grid grid-cols-5 gap-2.5 mb-5">
          {[{ label: 'Deployed Today', val: todayDeployed, color: '#4ADE80', icon: '📄' }, { label: 'Total AEO', val: totalDeployed, color: '#60A5FA', icon: '🎯' }, { label: 'Pending Social', val: pendingSocial, color: '#FB923C', icon: '📣' }, { label: 'Latest Users', val: latest?.users || 0, color: '#4B9CD3', icon: '👥' }, { label: 'GSC Data', val: gscAge, color: '#A78BFA', icon: '📊' }].map((s) => (
            <div key={s.label} className="text-center p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]"><div className="text-sm">{s.icon}</div><div className="text-lg font-extrabold mt-1" style={{ color: s.color }}>{s.val}</div><div className="text-[9px] font-semibold text-gh-text-muted uppercase mt-1">{s.label}</div></div>
          ))}
        </div>
        {yKPI && (yKPI.adsSpend || yKPI.clickToCall) && <div className="px-4 py-3 bg-white/[0.02] rounded-xl border border-white/[0.06] mb-4"><div className="text-[10px] font-bold text-gh-text-muted uppercase mb-2">Yesterday</div><div className="flex gap-5 flex-wrap text-xs text-gh-text-soft">{yKPI.adsSpend && <span><strong>Spend:</strong> ${yKPI.adsSpend}</span>}{yKPI.clickToCall && <span><strong>Calls:</strong> {yKPI.clickToCall}</span>}{yKPI.gbpCalls && <span><strong>GBP:</strong> {yKPI.gbpCalls}</span>}{yKPI.formLeads && <span><strong>Leads:</strong> {yKPI.formLeads}</span>}{yKPI.cpa && <span><strong>CPA:</strong> ${yKPI.cpa}</span>}</div></div>}
        <div className="text-[11px] font-bold text-gh-text-muted uppercase mb-2">Today&apos;s Action Items</div>
        {punchList.map((item, i) => <button key={i} onClick={() => navigateToTab(item.tab as any)} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-colors text-left"><span className="text-sm">{item.icon}</span><span className="text-xs text-gh-text-soft font-medium">{item.text}</span></button>)}
      </div>

      {/* ═══ ACTION BUTTONS ═══ */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setShowKpiForm(!showKpiForm)} className="px-4 py-2 rounded-xl text-xs font-bold border border-white/10 text-gh-text-soft hover:bg-white/[0.04]"><Plus className="w-3 h-3 inline mr-1" />Daily KPIs</button>
        <button onClick={() => setShowWeeklyForm(!showWeeklyForm)} className="px-4 py-2 rounded-xl text-xs font-bold border border-white/10 text-gh-text-soft hover:bg-white/[0.04]"><Plus className="w-3 h-3 inline mr-1" />Weekly Log</button>
        <button onClick={() => setShowGoals(!showGoals)} className="px-4 py-2 rounded-xl text-xs font-bold border border-white/10 text-gh-text-soft hover:bg-white/[0.04]"><Target className="w-3 h-3 inline mr-1" />Goals</button>
        <button onClick={() => setShowLevers(!showLevers)} className="px-4 py-2 rounded-xl text-xs font-bold border border-white/10 text-gh-text-soft hover:bg-white/[0.04]">📈 Projections</button>
        <button onClick={() => setShowGscConnect(!showGscConnect)} className="px-4 py-2 rounded-xl text-xs font-bold border border-carolina/30 bg-carolina/10 text-carolina">📊 GSC/GA4</button>
        <button onClick={() => setShowAeoScores(!showAeoScores)} className="px-4 py-2 rounded-xl text-xs font-bold border border-purple-400/30 bg-purple-400/10 text-purple-400">🎯 AEO Scores</button>
        <button onClick={runAiAnalysis} disabled={aiAnalyzing} className="px-4 py-2 rounded-xl text-xs font-bold border border-nc-gold/30 bg-nc-gold/10 text-nc-gold disabled:opacity-40">{aiAnalyzing ? <><Loader2 className="w-3 h-3 animate-spin inline mr-1" />Analyzing...</> : <><Zap className="w-3 h-3 inline mr-1" />AI Analysis</>}</button>
      </div>

      {/* AI Analysis result */}
      {aiResult && <div className="card p-5"><div className="text-[11px] font-bold text-nc-gold uppercase mb-3">AI Analysis</div><div className="text-xs text-gh-text-soft whitespace-pre-wrap leading-relaxed">{aiResult}</div></div>}

      {/* Daily KPI form */}
      {showKpiForm && <div className="card p-5 space-y-3"><div className="text-[11px] font-bold text-gh-text-muted uppercase tracking-widest">Log Daily KPIs</div><div className="grid grid-cols-2 md:grid-cols-6 gap-3"><div><label className="text-[10px] font-bold text-gh-text-muted block mb-1">Date</label><input type="date" value={kpiDate} onChange={(e) => setKpiDate(e.target.value)} className={inputCls} /></div><div><label className="text-[10px] font-bold text-gh-text-muted block mb-1">Ad Spend</label><input value={kpiSpend} onChange={(e) => setKpiSpend(e.target.value)} placeholder="$25" className={inputCls} /></div><div><label className="text-[10px] font-bold text-gh-text-muted block mb-1">Calls</label><input value={kpiCalls} onChange={(e) => setKpiCalls(e.target.value)} placeholder="3" className={inputCls} /></div><div><label className="text-[10px] font-bold text-gh-text-muted block mb-1">GBP</label><input value={kpiGbp} onChange={(e) => setKpiGbp(e.target.value)} placeholder="2" className={inputCls} /></div><div><label className="text-[10px] font-bold text-gh-text-muted block mb-1">Leads</label><input value={kpiLeads} onChange={(e) => setKpiLeads(e.target.value)} placeholder="1" className={inputCls} /></div><div><label className="text-[10px] font-bold text-gh-text-muted block mb-1">CPA</label><input value={kpiCpa} onChange={(e) => setKpiCpa(e.target.value)} placeholder="$8" className={inputCls} /></div></div><button onClick={saveKpi} className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white">Save</button></div>}

      {/* Weekly log form */}
      {showWeeklyForm && <div className="card p-5 space-y-3"><div className="text-[11px] font-bold text-gh-text-muted uppercase tracking-widest">Add Weekly Metrics</div><div className="grid grid-cols-3 md:grid-cols-6 gap-3"><div><label className="text-[10px] font-bold text-gh-text-muted block mb-1">Week Of</label><input type="date" value={wkDate} onChange={(e) => setWkDate(e.target.value)} className={inputCls} /></div><div><label className="text-[10px] font-bold text-gh-text-muted block mb-1">Users</label><input value={wkUsers} onChange={(e) => setWkUsers(e.target.value)} placeholder="0" className={inputCls} /></div><div><label className="text-[10px] font-bold text-gh-text-muted block mb-1">Organic</label><input value={wkOrganic} onChange={(e) => setWkOrganic(e.target.value)} placeholder="0" className={inputCls} /></div><div><label className="text-[10px] font-bold text-gh-text-muted block mb-1">ChatGPT</label><input value={wkChatgpt} onChange={(e) => setWkChatgpt(e.target.value)} placeholder="0" className={inputCls} /></div><div><label className="text-[10px] font-bold text-gh-text-muted block mb-1">Impressions</label><input value={wkImpr} onChange={(e) => setWkImpr(e.target.value)} placeholder="0" className={inputCls} /></div><div><label className="text-[10px] font-bold text-gh-text-muted block mb-1">Clicks</label><input value={wkClicks} onChange={(e) => setWkClicks(e.target.value)} placeholder="0" className={inputCls} /></div><div><label className="text-[10px] font-bold text-gh-text-muted block mb-1">Calls</label><input value={wkCalls} onChange={(e) => setWkCalls(e.target.value)} placeholder="0" className={inputCls} /></div><div><label className="text-[10px] font-bold text-gh-text-muted block mb-1">Direct</label><input value={wkDirect} onChange={(e) => setWkDirect(e.target.value)} placeholder="0" className={inputCls} /></div><div><label className="text-[10px] font-bold text-gh-text-muted block mb-1">Social</label><input value={wkSocial} onChange={(e) => setWkSocial(e.target.value)} placeholder="0" className={inputCls} /></div></div><button onClick={saveWeekly} disabled={!wkDate} className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white disabled:opacity-40">Add Week</button></div>}

      {/* Goals */}
      {showGoals && <div className="card p-5 space-y-3"><div className="text-[11px] font-bold text-gh-text-muted uppercase tracking-widest">Monthly Goals</div><div className="grid grid-cols-3 gap-3"><div><label className="text-[10px] font-bold text-gh-text-muted block mb-1">Impressions</label><input type="number" value={perfGoals.impressions} onChange={(e) => setPerfGoals((p) => ({ ...p, impressions: parseInt(e.target.value) || 0 }))} className={inputCls} /></div><div><label className="text-[10px] font-bold text-gh-text-muted block mb-1">Clicks</label><input type="number" value={perfGoals.clicks} onChange={(e) => setPerfGoals((p) => ({ ...p, clicks: parseInt(e.target.value) || 0 }))} className={inputCls} /></div><div><label className="text-[10px] font-bold text-gh-text-muted block mb-1">Calls</label><input type="number" value={perfGoals.calls} onChange={(e) => setPerfGoals((p) => ({ ...p, calls: parseInt(e.target.value) || 0 }))} className={inputCls} /></div></div></div>}

      {/* Projections */}
      {showLevers && <div className="card p-5 space-y-4"><div className="text-[11px] font-bold text-gh-text-muted uppercase tracking-widest">30/60/90 Projections</div><div className="grid grid-cols-5 gap-3"><div><label className="text-[10px] font-bold text-gh-text-muted block mb-1">Pages</label><input type="number" value={projLevers.pagesPublished} onChange={(e) => setProjLevers((p) => ({ ...p, pagesPublished: parseInt(e.target.value) || 0 }))} className={inputCls} /></div><div><label className="text-[10px] font-bold text-gh-text-muted block mb-1">Optimized</label><input type="number" value={projLevers.builderOptimized} onChange={(e) => setProjLevers((p) => ({ ...p, builderOptimized: parseInt(e.target.value) || 0 }))} className={inputCls} /></div><div><label className="text-[10px] font-bold text-gh-text-muted block mb-1">Backlinks</label><input type="number" value={projLevers.backlinks} onChange={(e) => setProjLevers((p) => ({ ...p, backlinks: parseInt(e.target.value) || 0 }))} className={inputCls} /></div><div><label className="text-[10px] font-bold text-gh-text-muted block mb-1">AEO</label><input type="number" value={projLevers.aeoImprovement} onChange={(e) => setProjLevers((p) => ({ ...p, aeoImprovement: parseInt(e.target.value) || 0 }))} className={inputCls} /></div><div><label className="text-[10px] font-bold text-gh-text-muted block mb-1">Ads $</label><input type="number" value={projLevers.adsbudget} onChange={(e) => setProjLevers((p) => ({ ...p, adsbudget: parseInt(e.target.value) || 0 }))} className={inputCls} /></div></div><div className="grid grid-cols-3 gap-3">{[{ label: '30 Days', d: proj['30d'] }, { label: '60 Days', d: proj['60d'] }, { label: '90 Days', d: proj['90d'] }].map((p) => (<div key={p.label} className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]"><div className="text-xs font-bold text-white mb-2">{p.label}</div><div className="space-y-1 text-xs"><div className="flex justify-between"><span className="text-gh-text-muted">Impressions</span><span className="font-bold text-white">{formatNumber(p.d.impr)}</span></div><div className="flex justify-between"><span className="text-gh-text-muted">Clicks</span><span className="font-bold text-white">{formatNumber(p.d.clicks)}</span></div><div className="flex justify-between"><span className="text-gh-text-muted">Calls</span><span className="font-bold text-emerald-400">{p.d.calls}</span></div></div>{perfGoals.impressions > 0 && <div className="mt-2 text-[10px] text-gh-text-faint">{Math.min(100, Math.round((p.d.impr / perfGoals.impressions) * 100))}% of goal</div>}</div>))}</div></div>}

      {/* GSC/GA4 Connect */}
      {showGscConnect && <div className="card p-5 space-y-4">
        <div className="text-[11px] font-bold text-gh-text-muted uppercase tracking-widest">GSC / GA4 Connection</div>
        <div className="flex gap-3 items-center">
          <button onClick={handleGscConnect} className="px-4 py-2 rounded-xl text-xs font-bold bg-carolina text-white">{ga4Token ? '✓ Connected — Reconnect' : 'Connect Google OAuth'}</button>
          {ga4Token && <button onClick={handleGscPull} disabled={gscPulling} className="px-4 py-2 rounded-xl text-xs font-bold border border-carolina/30 text-carolina disabled:opacity-50">
            {gscPulling ? <><Loader2 className="w-3 h-3 animate-spin inline mr-1" />Pulling...</> : 'Pull GSC Data (28d)'}
          </button>}
          {gscData?.fetchedAt ? <span className="text-[10px] text-gh-text-faint">{'Last: ' + new Date(String(gscData.fetchedAt)).toLocaleString()}</span> : null}
        </div>
        {ga4Token && <div className="text-[10px] text-emerald-400">OAuth token active</div>}

        {/* GSC Top Queries Table */}
        {(() => {
          if (!gscData?.rows || !Array.isArray(gscData.rows) || gscData.rows.length === 0) return null;
          const rows = gscData.rows as Array<{keys:string[];clicks:number;impressions:number;ctr:number;position:number}>;
          return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold text-white">{rows.length + ' Queries — Last 28 Days'}</div>
              <div className="text-[10px] text-gh-text-faint">Source: Google Search Console</div>
            </div>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full border-collapse">
                <thead className="sticky top-0"><tr>
                  {['#','QUERY','CLICKS','IMPR','CTR','POS'].map((h) => (
                    <th key={h} className="px-2.5 py-2 text-[10px] font-bold text-gh-text-muted uppercase tracking-wider border-b border-white/[0.06] text-left bg-[#0F1923] whitespace-nowrap">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {rows.map((row, i) => {
                    const posColor = row.position <= 10 ? 'text-emerald-400' : row.position <= 20 ? 'text-nc-gold' : row.position <= 50 ? 'text-amber-400' : 'text-red-400';
                    return (
                      <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                        <td className="px-2.5 py-1.5 text-[10px] text-gh-text-faint tabular-nums">{i + 1}</td>
                        <td className="px-2.5 py-1.5 text-xs text-white font-medium">{row.keys[0]}</td>
                        <td className="px-2.5 py-1.5 text-xs text-white font-bold tabular-nums">{row.clicks}</td>
                        <td className="px-2.5 py-1.5 text-xs text-gh-text-soft tabular-nums">{row.impressions}</td>
                        <td className="px-2.5 py-1.5 text-xs text-gh-text-soft tabular-nums">{(row.ctr * 100).toFixed(1)}%</td>
                        <td className={`px-2.5 py-1.5 text-xs font-bold tabular-nums ${posColor}`}>{row.position.toFixed(1)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          );
        })()}
      </div>}

      {/* AEO Scores */}
      {showAeoScores && <div className="card p-5 space-y-3"><div className="text-[11px] font-bold text-gh-text-muted uppercase tracking-widest">AEO Authority Score History</div>{aeoScores.length === 0 ? <div className="text-xs text-gh-text-faint">No scores recorded yet. Run a Citation Monitor scan to generate scores.</div> : <div className="space-y-1">{aeoScores.map((s, i) => <div key={i} className="flex justify-between text-xs py-1 border-b border-white/[0.04]"><span className="text-gh-text-muted">{s.date}</span><span className="font-bold text-carolina">{s.score}</span></div>)}</div>}</div>}

      {/* ═══ GROWTH CHART ═══ */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4"><div><h2 className="text-sm font-bold text-white">Organic Growth</h2><p className="text-[11px] text-gh-text-muted">{allPerfData.length} weeks tracked</p></div><div className="flex gap-4 text-[10px] font-semibold"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-carolina" /><span className="text-gh-text-muted">Users</span></span><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /><span className="text-gh-text-muted">Organic</span></span><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-nc-gold" /><span className="text-gh-text-muted">Impressions</span></span></div></div>
        <div className="h-64"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" /><XAxis dataKey="week" tick={{ fill: '#6B7B8D', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} interval={2} /><YAxis yAxisId="left" tick={{ fill: '#6B7B8D', fontSize: 10 }} tickLine={false} axisLine={false} /><YAxis yAxisId="right" orientation="right" tick={{ fill: '#6B7B8D', fontSize: 10 }} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ background: '#1A2840', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '11px', color: '#E8ECF0' }} /><Area yAxisId="right" type="monotone" dataKey="impressions" stroke="#FFC72C" strokeWidth={1.5} fill="rgba(255,199,44,0.08)" /><Bar yAxisId="left" dataKey="users" fill="#4B9CD3" radius={[4, 4, 0, 0]} /><Line yAxisId="left" type="monotone" dataKey="organic" stroke="#4ADE80" strokeWidth={2} dot={{ r: 2, fill: '#4ADE80' }} /></ComposedChart></ResponsiveContainer></div>
      </div>

      {/* Week-over-week */}
      {comparison && <div className="card p-5"><div className="text-sm font-bold text-white mb-3">Week-over-Week</div><div className="space-y-2">{[{ label: 'Users', cur: comparison.current.users, prev: comparison.previous.users }, { label: 'Organic', cur: comparison.current.organic, prev: comparison.previous.organic }, { label: 'Impressions', cur: comparison.current.impressions, prev: comparison.previous.impressions }, { label: 'Clicks', cur: comparison.current.clicks, prev: comparison.previous.clicks }].map((r) => { const pct = calcPercentChange(r.cur, r.prev); const trend = calcTrend(r.cur, r.prev); const Icon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus; const color = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-amber-400'; return <div key={r.label} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0"><span className="text-xs text-gh-text-soft">{r.label}</span><div className="flex items-center gap-3"><span className="text-sm font-bold text-white tabular-nums">{formatNumber(r.cur)}</span><span className={`flex items-center gap-0.5 text-[11px] font-semibold ${color}`}><Icon className="w-3 h-3" />{Math.abs(pct)}%</span></div></div>; })}</div></div>}
    </div>
  );
}
