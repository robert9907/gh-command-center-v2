/**
 * templateEngine.ts
 *
 * Variable replacement engine for GH AEO county landing pages.
 *
 * Supported syntax:
 *   {{field}}                           — simple field lookup
 *   {{arrayField[N]}}                   — array index lookup
 *   {{#each arrayField}}...{{/each}}    — block iteration
 *
 * LIVE PAGE AWARENESS:
 * When iterating neighboring_counties, the engine checks each county
 * against the LIVE_COUNTY_SLUGS registry in livePages.ts.
 * - Live counties  → rendered as <a href="...">County</a>
 * - Unlive counties → rendered as plain text (no broken links)
 *
 * This prevents 404s in the neighboring counties block, which is
 * critical for AEO — AI engines treat broken links as a trust signal.
 */

import { getLiveCountyUrl } from './livePages';

export interface CountyData {
  county: string;
  state: string;
  state_abbr: string;
  health_system: string;
  hospitals: string[];
  specialties: string[];
  neighboring_counties: string[];
  metro_area: string;
  population: string;
  cities: string[];
}

export class TemplateRenderError extends Error {
  constructor(message: string, public variable?: string) {
    super(message);
    this.name = 'TemplateRenderError';
  }
}

function getField(data: CountyData, name: string): unknown {
  if (name === 'county_slug') {
    return data.county.toLowerCase().replace(/\s+/g, '-');
  }
  if (!(name in data)) return undefined;
  return (data as unknown as Record<string, unknown>)[name];
}

/**
 * Render {{#each arrayField}}...{{/each}} blocks.
 *
 * Special behavior for neighboring_counties:
 * Each item is checked against LIVE_COUNTY_SLUGS.
 * If live  → {{this_slug}} and {{this}} render normally (template uses them to build <a> tags)
 * If dead  → the entire block body is replaced with plain county name text,
 *            wrapped in a <span> so AI crawlers still see the county name
 *            but no broken link is output.
 */
function renderEachBlocks(template: string, data: CountyData): string {
  const eachRegex = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;

  return template.replace(eachRegex, (_match, arrayName: string, body: string) => {
    const arr = getField(data, arrayName);
    if (!Array.isArray(arr)) {
      throw new TemplateRenderError(
        `{{#each ${arrayName}}} — field is not an array (got ${typeof arr})`,
        arrayName
      );
    }

    const isNeighborBlock = arrayName === 'neighboring_counties';

    return arr
      .map((item) => {
        if (item === undefined || item === null) {
          throw new TemplateRenderError(
            `{{this}} — array item is null or undefined`,
            'this'
          );
        }
        const itemStr = String(item);
        const itemSlug = itemStr.toLowerCase().replace(/\s+/g, '-');

        // Live-page gate for neighboring counties
        if (isNeighborBlock) {
          const liveUrl = getLiveCountyUrl(itemSlug);
          if (!liveUrl) {
            // County page doesn't exist yet — render as plain text, no link
            return `<span style="color: var(--text-secondary); padding: 8px 16px; background: var(--surface); border: 1px solid var(--border-light); border-radius: var(--radius-sm); font-size: 15px;">${itemStr}</span>\n                    `;
          }
          // County is live — render normally using template body
        }

        return body
          .replace(/\{\{this_slug\}\}/g, () => itemSlug)
          .replace(/\{\{this\}\}/g, () => itemStr);
      })
      .join('');
  });
}

function renderArrayIndexes(template: string, data: CountyData): string {
  const arrayIndexRegex = /\{\{(\w+)\[(\d+)\]\}\}/g;

  return template.replace(arrayIndexRegex, (_match, name: string, indexStr: string) => {
    const arr = getField(data, name);
    if (!Array.isArray(arr)) {
      throw new TemplateRenderError(
        `{{${name}[${indexStr}]}} — field "${name}" is not an array (got ${typeof arr})`,
        `${name}[${indexStr}]`
      );
    }
    const index = parseInt(indexStr, 10);
    if (index < 0 || index >= arr.length) {
      throw new TemplateRenderError(
        `{{${name}[${indexStr}]}} — index ${index} out of bounds (array has ${arr.length} items)`,
        `${name}[${indexStr}]`
      );
    }
    const val = arr[index];
    if (val === undefined || val === null) {
      throw new TemplateRenderError(
        `{{${name}[${indexStr}]}} — element is null or undefined`,
        `${name}[${indexStr}]`
      );
    }
    return String(val);
  });
}

function renderSimpleVars(template: string, data: CountyData): string {
  const varRegex = /\{\{(\w+)\}\}/g;

  return template.replace(varRegex, (_match, name: string) => {
    if (name === 'this' || name === 'this_slug') {
      throw new TemplateRenderError(
        `{{${name}}} found outside of an {{#each}} block`,
        name
      );
    }

    const val = getField(data, name);
    if (val === undefined || val === null) {
      throw new TemplateRenderError(
        `Unresolved template variable: {{${name}}}`,
        name
      );
    }

    if (Array.isArray(val)) {
      return val.join(', ');
    }

    if (typeof val === 'object') {
      throw new TemplateRenderError(
        `{{${name}}} resolved to an object — not supported`,
        name
      );
    }

    return String(val);
  });
}

export function renderTemplate(template: string, data: CountyData): string {
  let output = renderEachBlocks(template, data);
  output = renderArrayIndexes(output, data);
  output = renderSimpleVars(output, data);
  return output;
}

/**
 * AEO 3.0 county landing page — Apple-quality template.
 *
 * Section order:
 *   1. Dark hero (navy gradient, county + state, headline, CTA)
 *   2. Trust strip (broker credentials)
 *   3. 2×2 question grid
 *   4. Comparison: Medicare.gov Plan Finder vs Working With Rob
 *   5. Scenarios: Turning 65, Lost employer coverage, Moving to county
 *   6. Honesty / "What I won't do" (NEPQ-style transparency)
 *   7. Neighboring county grid (live-page gated by templateEngine)
 *   8. EEAT block (Expertise, Experience, Authoritativeness, Trust)
 */
export const TEMPLATE_HTML: string = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Medicare Advantage Plans in {{county}} County, {{state_abbr}} | Rob Simm, Local Broker</title>
    <meta name="description" content="Compare Medicare Advantage plans in {{county}} County, {{state}} with a licensed local broker. No cost, no pressure. Verify your doctors and prescriptions. Call (828) 761-3326.">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        :root {
            --navy: #0A1628;
            --navy-light: #16263F;
            --ink: #1D1D1F;
            --ink-soft: #6E6E73;
            --bg: #FFFFFF;
            --surface: #FBFBFD;
            --border: #D2D2D7;
            --border-light: #E5E5EA;
            --accent: #0071E3;
            --accent-hover: #0077ED;
            --accent-tint: #F0F8FF;
            --success: #10B981;
            --success-tint: #D1FAE5;
            --success-ink: #065F46;
            --danger: #DC2626;
            --danger-tint: #FEE2E2;
            --danger-ink: #991B1B;
            --radius-sm: 8px;
            --radius-md: 12px;
            --radius-lg: 20px;
            --radius-pill: 980px;
            --shadow-sm: 0 1px 3px rgba(0,0,0,0.04);
            --shadow-md: 0 8px 24px rgba(0,0,0,0.06);
            --shadow-lg: 0 16px 40px rgba(0,0,0,0.08);
        }

        html { scroll-behavior: smooth; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif;
            font-size: 17px;
            line-height: 1.6;
            color: var(--ink);
            background: var(--bg);
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        .container {
            max-width: 1080px;
            margin: 0 auto;
            padding: 0 24px;
        }

        section { padding: 96px 0; }
        section.alt { background: var(--surface); }

        .section-eyebrow {
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--accent);
            margin-bottom: 12px;
        }

        h2 {
            font-size: clamp(30px, 4vw, 44px);
            font-weight: 700;
            line-height: 1.1;
            letter-spacing: -0.02em;
            margin-bottom: 20px;
            color: var(--ink);
        }

        .section-lead {
            font-size: 19px;
            line-height: 1.5;
            color: var(--ink-soft);
            max-width: 720px;
            margin-bottom: 56px;
        }

        /* CTA */
        .cta-primary {
            display: inline-block;
            background: var(--accent);
            color: #FFFFFF !important;
            padding: 18px 36px;
            border-radius: var(--radius-pill);
            font-size: 18px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
            box-shadow: 0 4px 12px rgba(0,113,227,0.25);
        }

        .cta-primary:hover {
            background: var(--accent-hover);
            transform: translateY(-1px);
            box-shadow: 0 8px 24px rgba(0,113,227,0.35);
        }

        /* 1. HERO */
        .hero {
            background: linear-gradient(180deg, var(--navy) 0%, var(--navy-light) 100%);
            color: #FFFFFF;
            padding: 112px 0 88px;
            text-align: center;
        }

        .hero-eyebrow {
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: rgba(255,255,255,0.7);
            margin-bottom: 16px;
        }

        .hero h1 {
            font-size: clamp(36px, 6vw, 64px);
            font-weight: 700;
            line-height: 1.04;
            letter-spacing: -0.025em;
            margin-bottom: 20px;
            color: #FFFFFF;
            max-width: 880px;
            margin-left: auto;
            margin-right: auto;
        }

        .hero-lead {
            font-size: clamp(18px, 2vw, 22px);
            line-height: 1.5;
            color: rgba(255,255,255,0.82);
            max-width: 680px;
            margin: 0 auto 40px;
        }

        .hero-meta {
            margin-top: 24px;
            font-size: 14px;
            color: rgba(255,255,255,0.6);
        }

        /* 2. TRUST STRIP */
        .trust-strip {
            background: var(--bg);
            border-bottom: 1px solid var(--border-light);
            padding: 24px 0;
        }

        .trust-strip-inner {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            align-items: center;
            gap: 12px 28px;
            font-size: 14px;
            font-weight: 500;
            color: var(--ink-soft);
            text-align: center;
        }

        .trust-dot {
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: var(--border);
            display: inline-block;
        }

        /* 3. QUESTION GRID */
        .question-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
        }

        .question-card {
            background: var(--bg);
            border: 1px solid var(--border-light);
            border-radius: var(--radius-lg);
            padding: 36px;
            transition: all 0.2s ease;
        }

        .question-card:hover {
            border-color: var(--border);
            box-shadow: var(--shadow-md);
            transform: translateY(-2px);
        }

        .question-num {
            font-size: 13px;
            font-weight: 600;
            color: var(--accent);
            margin-bottom: 12px;
            letter-spacing: 0.04em;
        }

        .question-card h3 {
            font-size: 22px;
            font-weight: 600;
            line-height: 1.3;
            letter-spacing: -0.01em;
            margin-bottom: 12px;
            color: var(--ink);
        }

        .question-card p {
            font-size: 16px;
            color: var(--ink-soft);
            line-height: 1.55;
        }

        /* 4. COMPARISON */
        .comparison {
            display: grid;
            grid-template-columns: 1fr 1fr;
            border: 1px solid var(--border-light);
            border-radius: var(--radius-lg);
            overflow: hidden;
            background: var(--bg);
        }

        .compare-col {
            padding: 44px 36px;
        }

        .compare-col.diy {
            background: var(--surface);
            border-right: 1px solid var(--border-light);
        }

        .compare-col.broker {
            background: linear-gradient(180deg, var(--accent-tint) 0%, #FFFFFF 100%);
        }

        .compare-tag {
            display: inline-block;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            padding: 4px 10px;
            border-radius: var(--radius-pill);
            margin-bottom: 16px;
        }

        .compare-tag.diy { background: var(--danger-tint); color: var(--danger-ink); }
        .compare-tag.broker { background: var(--success-tint); color: var(--success-ink); }

        .compare-col h3 {
            font-size: 24px;
            font-weight: 600;
            letter-spacing: -0.01em;
            margin-bottom: 8px;
            color: var(--ink);
        }

        .compare-sub {
            font-size: 15px;
            color: var(--ink-soft);
            margin-bottom: 24px;
        }

        .compare-list {
            list-style: none;
            display: grid;
            gap: 14px;
        }

        .compare-list li {
            display: flex;
            gap: 12px;
            font-size: 16px;
            line-height: 1.5;
            color: var(--ink);
        }

        .compare-icon {
            flex-shrink: 0;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            font-weight: 700;
            margin-top: 1px;
        }

        .compare-icon.x { background: var(--danger-tint); color: var(--danger-ink); }
        .compare-icon.check { background: var(--success-tint); color: var(--success-ink); }

        /* 5. SCENARIOS */
        .scenarios {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
        }

        .scenario {
            background: var(--bg);
            border: 1px solid var(--border-light);
            border-radius: var(--radius-lg);
            padding: 36px;
        }

        .scenario-badge {
            display: inline-block;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--accent);
            margin-bottom: 12px;
        }

        .scenario h3 {
            font-size: 21px;
            font-weight: 600;
            letter-spacing: -0.01em;
            margin-bottom: 12px;
            color: var(--ink);
        }

        .scenario p {
            font-size: 16px;
            line-height: 1.55;
            color: var(--ink-soft);
        }

        /* 6. HONESTY */
        .honesty-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
        }

        .honesty-item {
            padding: 32px;
            background: var(--bg);
            border: 1px solid var(--border-light);
            border-radius: var(--radius-md);
        }

        .honesty-x {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: var(--danger-tint);
            color: var(--danger-ink);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 16px;
            margin-bottom: 16px;
        }

        .honesty-item h3 {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--ink);
        }

        .honesty-item p {
            font-size: 15px;
            color: var(--ink-soft);
            line-height: 1.55;
        }

        /* 7. COUNTY GRID */
        .county-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
        }

        .county-link {
            display: inline-block;
            padding: 12px 20px;
            background: var(--bg);
            color: var(--accent);
            text-decoration: none;
            border: 1px solid var(--border-light);
            border-radius: var(--radius-pill);
            font-size: 15px;
            font-weight: 500;
            transition: all 0.15s ease;
        }

        .county-link:hover {
            border-color: var(--accent);
            background: var(--accent-tint);
        }

        /* 8. EEAT */
        .eeat {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 32px;
            margin-bottom: 48px;
        }

        .eeat-pillar h3 {
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--accent);
            margin-bottom: 12px;
        }

        .eeat-pillar p {
            font-size: 15px;
            line-height: 1.55;
            color: var(--ink-soft);
        }

        .eeat-pillar p strong {
            color: var(--ink);
            font-weight: 600;
        }

        .eeat-bio {
            border-top: 1px solid var(--border-light);
            padding-top: 32px;
            text-align: center;
            font-size: 14px;
            color: var(--ink-soft);
            line-height: 1.6;
        }

        .eeat-bio strong { color: var(--ink); font-weight: 600; }

        /* FINAL CTA */
        .final-cta {
            background: var(--navy);
            color: #FFFFFF;
            padding: 88px 0;
            text-align: center;
        }

        .final-cta h2 { color: #FFFFFF; margin-bottom: 16px; }

        .final-cta p {
            color: rgba(255,255,255,0.78);
            font-size: 19px;
            margin-bottom: 32px;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }

        /* RESPONSIVE */
        @media (max-width: 900px) {
            section { padding: 72px 0; }
            .hero { padding: 80px 0 64px; }
            .question-grid,
            .scenarios,
            .honesty-grid {
                grid-template-columns: 1fr;
            }
            .comparison { grid-template-columns: 1fr; }
            .compare-col.diy {
                border-right: none;
                border-bottom: 1px solid var(--border-light);
            }
            .eeat { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 480px) {
            .container { padding: 0 20px; }
            .eeat { grid-template-columns: 1fr; }
            .question-card,
            .scenario,
            .honesty-item,
            .compare-col { padding: 28px 24px; }
        }
    </style>
</head>
<body>

    <!-- 1. DARK HERO -->
    <header class="hero">
        <div class="container">
            <div class="hero-eyebrow">{{county}} County · {{state}}</div>
            <h1>Medicare Advantage Plans in {{county}}</h1>
            <p class="hero-lead">A licensed local broker who actually lives in {{state}}. I'll help you compare {{county}} County plans, verify your doctors and prescriptions, and pick what fits — with no cost, no pressure, and no call center.</p>
            <a href="tel:8287613326" class="cta-primary">Call (828) 761-3326</a>
            <div class="hero-meta">Free consultation · Same-day callback · No obligation</div>
        </div>
    </header>

    <!-- 2. TRUST STRIP -->
    <div class="trust-strip">
        <div class="container">
            <div class="trust-strip-inner">
                <span>Licensed NC Broker</span>
                <span class="trust-dot"></span>
                <span>NPN #10447418</span>
                <span class="trust-dot"></span>
                <span>12+ Years Experience</span>
                <span class="trust-dot"></span>
                <span>No Cost to You</span>
            </div>
        </div>
    </div>

    <!-- 3. QUESTION GRID -->
    <section>
        <div class="container">
            <div class="section-eyebrow">What folks in {{county}} ask me</div>
            <h2>The questions worth asking before you enroll.</h2>
            <p class="section-lead">Most {{county}} County residents I talk to come in with the same four questions. Here's what they're really getting at — and why a 30-minute call usually clears all of it up.</p>
            <div class="question-grid">
                <div class="question-card">
                    <div class="question-num">01</div>
                    <h3>What does Medicare cost in {{county}}?</h3>
                    <p>{{county}} County has $0-premium Advantage plans available, but premium isn't the real cost. Your max out-of-pocket and Rx tiers matter more — we walk through your actual numbers, not the brochure.</p>
                </div>
                <div class="question-card">
                    <div class="question-num">02</div>
                    <h3>Which plans cover my medications?</h3>
                    <p>Every plan has a different formulary. I check each of your prescriptions against the {{state_abbr}} plans available in {{county}} County so you don't get hit with a tier-4 surprise next February.</p>
                </div>
                <div class="question-card">
                    <div class="question-num">03</div>
                    <h3>Is my doctor in-network?</h3>
                    <p>{{health_system}} contracts vary plan-by-plan. I verify each of your providers — primary, specialists, hospitals — before we ever pick a plan. No assumptions.</p>
                </div>
                <div class="question-card">
                    <div class="question-num">04</div>
                    <h3>What extra benefits are available?</h3>
                    <p>Dental, vision, hearing, OTC cards, fitness, transportation. Some sound great on paper and never get used. I'll tell you which ones {{county}} clients actually use, and which ones aren't worth chasing.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- 4. COMPARISON -->
    <section class="alt">
        <div class="container">
            <div class="section-eyebrow">Two ways to do this</div>
            <h2>Medicare.gov on your own vs. a 30-minute call with me.</h2>
            <p class="section-lead">The Plan Finder is a great tool — if you already know what you're looking at. Most of my {{county}} clients didn't, and missed things that mattered.</p>
            <div class="comparison">
                <div class="compare-col diy">
                    <span class="compare-tag diy">DIY</span>
                    <h3>Medicare.gov Plan Finder</h3>
                    <p class="compare-sub">Free. Comprehensive. Built for people who already speak Medicare.</p>
                    <ul class="compare-list">
                        <li><span class="compare-icon x">×</span><span>Sort 30+ plans by premium with no easy way to compare what really matters.</span></li>
                        <li><span class="compare-icon x">×</span><span>Type in every prescription one at a time — and hope you spelled each one right.</span></li>
                        <li><span class="compare-icon x">×</span><span>Network checks send you to each carrier's site to look up doctors yourself.</span></li>
                        <li><span class="compare-icon x">×</span><span>If something goes wrong next year, you're back on hold with the carrier.</span></li>
                    </ul>
                </div>
                <div class="compare-col broker">
                    <span class="compare-tag broker">Local broker</span>
                    <h3>Working With Rob</h3>
                    <p class="compare-sub">Free. Local. The same person every year — not a call center.</p>
                    <ul class="compare-list">
                        <li><span class="compare-icon check">✓</span><span>I narrow 30+ plans down to the 2–3 that actually fit you, and explain why.</span></li>
                        <li><span class="compare-icon check">✓</span><span>I run your full Rx list against each plan's formulary before we pick.</span></li>
                        <li><span class="compare-icon check">✓</span><span>I confirm your doctors and {{health_system}} providers are in-network.</span></li>
                        <li><span class="compare-icon check">✓</span><span>If something changes — claim issue, plan exit, doctor leaves network — call me, not a 1-800.</span></li>
                    </ul>
                </div>
            </div>
        </div>
    </section>

    <!-- 5. SCENARIOS -->
    <section>
        <div class="container">
            <div class="section-eyebrow">Real situations from {{county}}</div>
            <h2>You're probably in one of these.</h2>
            <p class="section-lead">Most people who reach out aren't shopping for fun. They're at a transition point. Here are the three that come up most in {{county}} County.</p>
            <div class="scenarios">
                <div class="scenario">
                    <div class="scenario-badge">Scenario 01</div>
                    <h3>Turning 65</h3>
                    <p>Your Initial Enrollment Period is a 7-month window around your 65th birthday. We'll figure out Original Medicare + Supplement vs. Advantage, lock in your Part D, and avoid late-enrollment penalties that follow people for life.</p>
                </div>
                <div class="scenario">
                    <div class="scenario-badge">Scenario 02</div>
                    <h3>Lost employer coverage</h3>
                    <p>Retiring, laid off, or coming off a spouse's plan? You have a Special Enrollment Period — usually 8 months — but the rules are tight. I'll make sure you don't accidentally trigger a Part B late penalty.</p>
                </div>
                <div class="scenario">
                    <div class="scenario-badge">Scenario 03</div>
                    <h3>Moving to {{county}}</h3>
                    <p>A move into or out of {{county}} County triggers a Special Enrollment Period. Your old plan probably doesn't cover {{health_system}} the same way. Let's get you set up with a plan that works where you actually live now.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- 6. HONESTY -->
    <section class="alt">
        <div class="container">
            <div class="section-eyebrow">Plain talk</div>
            <h2>What I won't do.</h2>
            <p class="section-lead">There's a reason Medicare has a reputation. Call centers. Scary mailers. "Limited-time" pressure. None of that lives here.</p>
            <div class="honesty-grid">
                <div class="honesty-item">
                    <div class="honesty-x">×</div>
                    <h3>No pressure</h3>
                    <p>If a plan isn't right for you, I'll say so. If you want a week to think about it, take a week. The worst plan is the one you got pushed into.</p>
                </div>
                <div class="honesty-item">
                    <div class="honesty-x">×</div>
                    <h3>No call center</h3>
                    <p>You get my cell. The same person who enrolled you handles your questions in March, your appeals in July, and your renewal in October. Every year.</p>
                </div>
                <div class="honesty-item">
                    <div class="honesty-x">×</div>
                    <h3>No bait-and-switch</h3>
                    <p>I won't quote one plan and enroll you in another. You see the actual plan name, premium, MOOP, and formulary before anything is signed. In writing.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- 7. COUNTY GRID -->
    <section>
        <div class="container">
            <div class="section-eyebrow">Nearby help</div>
            <h2>Help in counties next to {{county}}.</h2>
            <p class="section-lead">I serve {{county}} County and the surrounding {{metro_area}} area. If you're closer to one of these counties, here's where to find local help.</p>
            <div class="county-grid">
                {{#each neighboring_counties}}<a href="https://generationhealth.me/medicare-agents-in-{{this_slug}}-county-nc/" class="county-link">{{this}} County</a>{{/each}}
            </div>
        </div>
    </section>

    <!-- 8. EEAT BLOCK -->
    <section class="alt">
        <div class="container">
            <div class="section-eyebrow">Why this page</div>
            <h2>A real broker. Real credentials. {{state}}-based.</h2>
            <p class="section-lead">Medicare is too important to leave to whoever sent you the slickest mailer. Here's what stands behind every plan recommendation on this page.</p>
            <div class="eeat">
                <div class="eeat-pillar">
                    <h3>Expertise</h3>
                    <p><strong>Licensed health insurance broker</strong> in {{state}}. AHIP-certified annually. Specialized in Medicare Advantage, Medicare Supplement, and Part D plans for {{county}} County and the {{metro_area}} area.</p>
                </div>
                <div class="eeat-pillar">
                    <h3>Experience</h3>
                    <p><strong>12+ years</strong> placing Medicare coverage for {{state_abbr}} families. Hundreds of {{county}} County clients across {{cities}} who renew with me every year.</p>
                </div>
                <div class="eeat-pillar">
                    <h3>Authoritativeness</h3>
                    <p><strong>NPN #10447418.</strong> Appointed with every major Medicare carrier serving {{county}} County, including the plans most {{health_system}} providers contract with.</p>
                </div>
                <div class="eeat-pillar">
                    <h3>Trust</h3>
                    <p><strong>No cost to you.</strong> Carriers pay brokers a flat, regulated commission — same whether you enroll through me, a call center, or directly. The advice is yours; the price doesn't change.</p>
                </div>
            </div>
            <div class="eeat-bio">
                <strong>Robert Simm</strong> · Licensed {{state_abbr}} Medicare Broker · NPN #10447418<br>
                Serving {{county}} County, the {{metro_area}} area, and {{state}} statewide.
            </div>
        </div>
    </section>

    <!-- FINAL CTA -->
    <section class="final-cta">
        <div class="container">
            <h2>30 minutes. No cost. No pressure.</h2>
            <p>Get a real answer about your Medicare options in {{county}} County, {{state_abbr}}.</p>
            <a href="tel:8287613326" class="cta-primary">Call (828) 761-3326</a>
        </div>
    </section>

</body>
</html>`;

/**
 * Render the AEO 3.0 county landing page for the given county data.
 * Convenience wrapper around renderTemplate(TEMPLATE_HTML, countyData).
 */
export function generateCountyPage(countyData: CountyData): string {
  return renderTemplate(TEMPLATE_HTML, countyData);
}
