# AEO 3.0 Port — Deploy Instructions

**Build:** `gh-aeo3-port-apr6.tar.gz`
**Target repo:** `gh-command-center-v2` (Next.js 14)
**What it does:** Replaces the legacy Citation Monitor with AEO 3.0 — 4-tab container (Queue / Generate / Scrape / Settings), 100 NC county bundle, template engine, validator, LLM citation tester, scrapers. Integrates with existing AEO Pipeline tracker via `addToPipeline`.

---

## Files in this package

**New files (won't collide with anything):**

```
src/lib/templateEngine.ts          — template rendering engine
src/lib/validator.ts               — 11-rule output validator
src/lib/countyLoader.ts            — browser-safe county loader
src/lib/seedExpansion.ts           — Claude-powered seed expansion + SHARED TYPES
src/lib/intentClassifier.ts        — intent scoring + category/county detection
src/lib/queryDeduplication.ts      — near-duplicate collapse
src/lib/citationTester.ts          — 4-LLM citation testing
src/lib/templates/aeoPage.ts       — 1,073-line HTML template as TS string
src/data/counties.ts               — all 100 NC counties bundled
src/components/citation/QueueManagerPanel.tsx   — Claude-powered seed expansion UI
src/components/citation/QueryRow.tsx             — queue row w/ badges and actions
src/components/citation/PageGenerationModal.tsx  — 4-step page generation workflow
public/gh-scrapers.js              — window.GHScrapers IIFE
```

**Files REPLACED (overwrites existing):**

```
src/app/layout.tsx                              — adds <Script src="/gh-scrapers.js">
src/components/citation/CitationMonitorPanel.tsx — new 4-tab AEO 3.0 version
```

**Files NOT touched:** everything else. Page Builder, Indexing, Performance, Keyword War Room, Architecture, Optimize, Content Studio, AppState, Header, Page Tracker — all untouched. Your daily driver stays intact.

---

## Deploy steps

### 1. Extract into your local repo

```bash
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/Command\ Center\ V2.2/gh-command-center-v2

# Extract — will overlay cleanly, replacing the two files above and adding the rest
tar -xzf ~/Downloads/gh-aeo3-port-apr6.tar.gz

# Verify the new files landed
ls src/lib/templateEngine.ts src/lib/citationTester.ts src/data/counties.ts public/gh-scrapers.js
```

### 2. Smoke test locally

```bash
# No new dependencies — everything uses existing react + lucide-react
npm run dev
```

Open `http://localhost:3000`. Expected behavior:

1. Dashboard loads as normal
2. Click **Citation Monitor** tab in nav
3. New 4-tab UI renders: Queue / Generate / Scrape / Settings (AEO 3.0 badge in header)
4. Queue tab shows empty state with "Head to the Generate tab to expand seeds"
5. Go to **Settings** tab, paste your Claude API key, click **Save Keys** (green SET badge appears)
6. Go to **Generate** tab, click **Generate 60 Queries** button
7. Watch the progress bar, wait ~2 minutes
8. Queue populates with ~60 classified queries, sorted by intent score
9. Click **Generate Page** icon on a high-intent query with a county (e.g., "Medicare broker Durham NC")
10. 4-step modal runs: Detect → Load → Generate → Validate
11. Click **Download HTML** → county page downloads + entry appears in your existing AEO Pipeline tracker tab

### 3. Deploy to Vercel

```bash
git add src/ public/
git status  # confirm only the expected files changed
git commit -m "feat: AEO 3.0 Citation Monitor — 100 counties, 4-LLM testing, scrapers"
git push origin main
```

Vercel auto-deploys. Check the deployment logs — should build clean with zero errors.

---

## Architecture notes

**Type system:** `seedExpansion.ts` is the single source of truth for shared types (`QueryCandidate`, `APIKeys`, `CitationStatus`, `QuerySource`, `QueryCategory`, `IntentLevel`). Every downstream module imports from there. Don't redefine these locally.

**AppState integration:** `PageGenerationModal` calls `useAppState().addToPipeline(entry)` on both download and copy-to-clipboard. Generated pages appear in your existing AEO Pipeline tracker tab automatically. No duplicate state.

**Storage keys:**
- `gh-cc-query-queue-v3` — the query queue (Citation Monitor)
- `gh-cc-cm-apikeys` — LLM API keys (Claude / ChatGPT / Perplexity / Gemini)
- Existing keys (performance, page tracker, AEO pipeline, etc.) — untouched

**Scrapers:** `public/gh-scrapers.js` loads via `<Script strategy="beforeInteractive">` in `layout.tsx`. Routes Medicare.gov, eHealth, and competitor scrapes through `https://generationhealth.me/tools/scrape-proxy.php` (already deployed on your WordPress). Reddit scrapes directly.

**Phone number:** Validator rule #9 enforces `(828) 761-3326` exactly. If a generated page ever shows `3324` or any other variant, validation will fail and the Download button will be disabled.

---

## Cleanup (after you've confirmed it works in production)

Safe to delete from your Desktop:
- `cc-v2-full-fix.tar.gz` (and duplicates)
- `cc-v3-complete.tar.gz`
- `aeo3-integrated.tar.gz`, `aeo3-integrated (1).tar.gz`
- Loose `index.html`

Safe to delete from your repo (dead code, not blocking anything):
- `src/data/citation-queries.ts` — only used by the old Citation Monitor, now unreferenced

---

## If something breaks

**"Module not found: @/lib/seedExpansion"** or similar — the tarball didn't extract into the right folder. Make sure you ran `tar -xzf` from the repo root (where `package.json` lives), not from inside `src/`.

**"useAppState must be used within AppProvider"** — this would only happen if `src/app/page.tsx` got modified, which it shouldn't have. Check git status.

**"window.GHScrapers is not defined" in Scrape tab** — the `<Script>` tag didn't load. Open DevTools → Network → filter "gh-scrapers" — should be 200 OK. If it's 404, verify `public/gh-scrapers.js` exists.

**Everything else** — paste the error into the next chat and I'll fix it.
