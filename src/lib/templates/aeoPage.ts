/**
 * aeoPage.ts
 *
 * AEO 3.0 county landing page template.
 * Confirmed design spec: April 9, 2026.
 *
 * Template variables:
 *   {{county}}              — county name e.g. "Durham"
 *   {{county_slug}}         — kebab slug e.g. "durham"
 *   {{health_system}}       — e.g. "Duke Health"
 *   {{hospitals[0]}}        — primary hospital
 *   {{hospitals[1]}}        — secondary hospital
 *   {{specialties[0]}}      — cancer specialty
 *   {{specialties[1]}}      — cardiac specialty
 *   {{#each neighboring_counties}}...{{/each}} — county pill loop
 *
 * Related guides (8 pills) and county pills (7) are injected
 * dynamically by injectRelatedGuides() in PageGenerationModal.tsx
 * via the WordPress REST API at generation time.
 *
 * Placeholders:
 *   [RELATED-GUIDE-1] through [RELATED-GUIDE-8]
 *   [COUNTY-PILLS]
 */
export const AEO_PAGE_TEMPLATE: string = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Medicare Broker {{county}} NC: Which Plans Actually Cover Your {{health_system}} Doctors?</title>
<meta name="description" content="I check family history and health risks — then find the plan that covers what you might need next year, not just today. Rob Simm, NC Medicare broker serving {{county}} County.">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:-apple-system,'SF Pro Text',BlinkMacSystemFont,sans-serif;background:#fff;color:#1d1d1f;font-size:15px;line-height:1.6;-webkit-font-smoothing:antialiased;}
a{text-decoration:none;}
/* ── Header ── */
.gh-header{background:#fff;border-bottom:1px solid #e5e5ea;padding:12px 24px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;}
.gh-logo-wrap{display:flex;flex-direction:column;gap:2px;}
.gh-logo-top{display:flex;align-items:center;gap:8px;}
.gh-logo-badge{background:#0071e3;padding:4px 10px;border-radius:5px;font-weight:700;font-size:15px;color:#fff;letter-spacing:-0.02em;}
.gh-logo-div{width:1px;height:16px;background:#e5e5ea;}
.gh-logo-name{font-size:14px;font-weight:600;color:#1d1d1f;}
.gh-logo-sub{font-size:9px;color:#aeaeb2;text-transform:uppercase;letter-spacing:0.5px;}
.gh-phone{font-size:14px;font-weight:700;color:#0071e3 !important;background:#EFF6FF !important;padding:10px 20px !important;border-radius:100px !important;border:2px solid #0071e3 !important;white-space:nowrap !important;text-decoration:none !important;display:inline-block !important;}
/* ── Hero ── */
.hero{background:#0d2f5e;padding:60px 24px 56px;text-align:center;}
.hero-eyebrow{font-size:10px;font-weight:700;color:#83f0f9 !important;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:22px;}
.hero-h1{font-family:-apple-system,'SF Pro Display',sans-serif;font-size:clamp(32px,5vw,52px);font-weight:700;line-height:1.06;letter-spacing:-0.03em;color:#fff !important;margin-bottom:18px;max-width:720px;margin-left:auto;margin-right:auto;}
.hero-sub{font-size:17px;font-weight:400;color:rgba(255,255,255,0.65) !important;margin-bottom:42px;max-width:460px;margin-left:auto;margin-right:auto;line-height:1.6;}
/* ── Split pill — desktop (side by side) ── */
.split-pill{display:inline-flex;border-radius:100px;overflow:hidden;background:#fff;}
.pill-left{background:#fff;padding:16px 28px;text-align:left;min-width:220px;}
.pill-left-q{font-size:9px;font-weight:700;color:#0d2f5e;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:5px;}
.pill-left-a{font-size:15px;font-weight:700;color:#0d2f5e;line-height:1.2;}
.pill-right{background:#83f0f9;padding:16px 28px;text-align:center;min-width:180px;display:flex;flex-direction:column;align-items:center;justify-content:center;}
.pill-right-top{font-size:14px;font-weight:700;color:#0d2f5e;margin-bottom:3px;}
.pill-right-num{font-size:15px;font-weight:700;color:#0d2f5e;letter-spacing:-0.01em;}
/* ── Trust strip ── */
.trust-strip{background:#fff;border-bottom:1px solid #f0f0f0;padding:15px 24px;display:flex;justify-content:center;align-items:center;flex-wrap:wrap;gap:4px;}
.trust-item{font-size:12px;color:#6e6e73;display:flex;align-items:center;gap:6px;padding:0 10px;}
.trust-bullet{color:#1d1d1f;font-size:7px;}
/* ── Sections ── */
.section-light{padding:64px 24px;background:#f5f5f7;}
.section-white{padding:64px 24px;background:#fff;}
.section-dark{background:#020c1b;padding:64px 24px;}
.inner{max-width:860px;margin:0 auto;}
.section-label{font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#0071e3;margin-bottom:12px;}
.section-label-seafoam{font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#83f0f9;margin-bottom:12px;}
.section-h2{font-family:-apple-system,'SF Pro Display',sans-serif;font-size:clamp(22px,3vw,32px);font-weight:700;letter-spacing:-0.02em;color:#1d1d1f;margin-bottom:10px;max-width:600px;}
.section-h2-white{font-family:-apple-system,'SF Pro Display',sans-serif;font-size:clamp(22px,3vw,32px);font-weight:700;letter-spacing:-0.02em;color:#fff;margin-bottom:32px;}
.section-intro{font-size:15px;color:#6e6e73;margin-bottom:32px;max-width:560px;}
/* ── Fear grid ── */
.fear-grid{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#d2d2d7;border-radius:16px;overflow:hidden;}
.fear-card{background:#fff;padding:32px 28px;}
.fear-num{font-size:40px;font-weight:700;color:#e5e5ea;letter-spacing:-0.04em;margin-bottom:14px;font-family:-apple-system,'SF Pro Display',sans-serif;line-height:1;}
.fear-q{font-size:15px;font-weight:600;color:#1d1d1f;line-height:1.4;margin-bottom:8px;}
.fear-sub{font-size:13px;color:#6e6e73;line-height:1.5;}
/* ── Comparison table ── */
.compare-table{width:100%;border-collapse:collapse;table-layout:fixed;}
.compare-table th{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;padding:12px 18px;border-bottom:1px solid rgba(255,255,255,0.12);text-align:left;width:33.33%;}
.compare-table th:first-child{color:rgba(255,255,255,0.4);}
.compare-table th:nth-child(2){color:rgba(255,255,255,0.4);}
.compare-table th:nth-child(3){color:#83f0f9;}
.compare-table td{padding:16px 18px;border-bottom:1px solid rgba(255,255,255,0.07);font-size:14px;line-height:1.5;vertical-align:top;width:33.33%;}
.compare-table td:first-child{font-weight:600;color:#fff;}
.compare-table td:nth-child(2){font-weight:500;color:#fff;}
.compare-table td:nth-child(3){font-weight:900;color:#fff;}
.compare-table tr:last-child td{border-bottom:none;}
/* ── Scenario cards ── */
.scenario-cards{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.scenario-card{background:#0d2f5e;border-radius:16px;padding:28px 24px;}
.scenario-tag{font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:12px;}
.scenario-tag-wrong{color:#f87171;}
.scenario-tag-right{color:#4ade80;}
.scenario-amount{font-size:40px;font-weight:700;letter-spacing:-0.03em;margin-bottom:10px;font-family:-apple-system,'SF Pro Display',sans-serif;line-height:1;}
.scenario-amount-wrong{color:#f87171;}
.scenario-amount-right{color:#4ade80;}
.scenario-desc{font-size:13px;color:rgba(255,255,255,0.6);line-height:1.6;}
/* ── Honesty section ── */
.honesty-h2{font-family:-apple-system,'SF Pro Display',sans-serif;font-size:clamp(20px,3vw,28px);font-weight:700;color:#1d1d1f;margin-bottom:16px;letter-spacing:-0.02em;max-width:600px;margin-left:auto;margin-right:auto;text-align:center;}
.honesty-body{font-size:15px;color:#6e6e73;line-height:1.7;max-width:560px;margin:0 auto;text-align:center;}
/* ── Pills ── */
.pills-wrap{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;}
.block-h3{font-size:13px;font-weight:600;color:#6e6e73;text-align:center;margin-bottom:16px;text-transform:uppercase;letter-spacing:0.08em;}
.guide-pill{font-size:13px;color:#0071e3;padding:7px 16px;background:#f5f5f7;border-radius:100px;border:0.5px solid #d2d2d7;}
.county-pill{font-size:13px;color:#1d1d1f;padding:7px 16px;background:#f5f5f7;border-radius:100px;border:0.5px solid #d2d2d7;}
.county-pill-all{font-size:13px;color:#fff !important;padding:7px 16px;background:#0071e3;border-radius:100px;font-weight:600;}
/* ── Credentials ── */
.creds-section{padding:32px 24px;border-top:0.5px solid #e5e5ea;text-align:center;}
.creds-name{font-size:16px;font-weight:600;color:#1d1d1f;margin-bottom:6px;}
.creds-line{font-size:12px;color:#6e6e73;margin-bottom:4px;}
.creds-verify{color:#0071e3;}
.eeat-stamp{font-size:11px;color:#aeaeb2;margin-top:16px;padding-top:16px;border-top:0.5px solid #e5e5ea;}
/* ── Final CTA ── */
.final-cta{background:#0d2f5e;padding:72px 24px;text-align:center;}
.final-h2{font-family:-apple-system,'SF Pro Display',sans-serif;font-size:clamp(24px,3.5vw,40px);font-weight:700;color:#fff;margin-bottom:10px;letter-spacing:-0.02em;}
.final-sub{font-size:15px;color:rgba(255,255,255,0.5);margin-bottom:36px;font-weight:400;}
.final-micro{font-size:11px;color:rgba(255,255,255,0.3);margin-top:20px;letter-spacing:0.06em;text-transform:uppercase;}
/* ── Responsive ── */
@media(max-width:640px){
  /* Split pill — mobile: stacked slim pill, wrapper does all rounding */
  .split-pill{display:flex !important;flex-direction:column !important;border-radius:30px !important;overflow:hidden !important;width:calc(100% - 28px) !important;max-width:400px !important;margin-left:auto !important;margin-right:auto !important;}
  .pill-left{border-radius:0 !important;padding:7px 20px !important;text-align:center !important;min-width:0 !important;display:flex !important;align-items:center !important;justify-content:center !important;gap:8px !important;}
  .pill-left-q{font-size:9px !important;font-weight:700 !important;color:#8a8a8e !important;text-transform:uppercase !important;letter-spacing:0.1em !important;margin-bottom:0 !important;}
  .pill-left-divider{display:inline-block !important;width:1px !important;height:12px !important;background:#e5e5ea !important;margin:0 !important;}
  .pill-left-a{font-size:12px !important;font-weight:700 !important;color:#0d2f5e !important;line-height:1.2 !important;}
  .pill-right{border-radius:0 !important;padding:11px 20px !important;min-width:0 !important;}
  .pill-right-top{font-size:11px !important;letter-spacing:0.1em !important;text-transform:uppercase !important;margin-bottom:2px !important;}
  .pill-right-num{font-size:17px !important;}

  .fear-grid{grid-template-columns:1fr;}
  .scenario-cards{grid-template-columns:1fr;}
  .compare-table{font-size:12px;}
  .compare-table th,.compare-table td{padding:10px 10px;}
  .trust-strip{gap:2px;}
  .trust-item{padding:0 6px;font-size:11px;}
}
@media(max-width:640px){
  .final-cta-desktop{display:none !important;}
  .final-cta-mobile{display:block !important;}
}
</style>
</head>
<body>
<header style="background:#fff !important;border-bottom:1px solid #e5e5ea !important;padding:12px 20px !important;display:flex !important;align-items:center !important;justify-content:space-between !important;position:sticky !important;top:0 !important;z-index:100 !important;">
  <div style="display:flex;flex-direction:column;gap:1px;">
    <div style="background:#0071e3 !important;padding:4px 10px !important;border-radius:5px !important;font-weight:700 !important;font-size:14px !important;color:#fff !important;letter-spacing:-0.02em !important;display:inline-block !important;width:fit-content !important;">GH.me</div>
    <div style="font-size:13px !important;font-weight:600 !important;color:#1d1d1f !important;margin-top:2px !important;">GenerationHealth.me</div>
    <div style="font-size:9px !important;color:#aeaeb2 !important;text-transform:uppercase !important;letter-spacing:0.5px !important;">Independent Medicare Broker</div>
  </div>
  <a href="tel:8287613326" style="font-size:14px !important;font-weight:700 !important;color:#0071e3 !important;background:#EFF6FF !important;padding:10px 18px !important;border-radius:100px !important;border:2px solid #0071e3 !important;white-space:nowrap !important;text-decoration:none !important;flex-shrink:0 !important;">(828) 761-3326</a>
</header>
<div class="hero">
  <div class="hero-eyebrow" style="color:#83f0f9 !important;">Medicare Broker &middot; {{county}} NC</div>
  <h1 class="hero-h1" style="color:#fff !important;">Which plans actually cover your {{health_system}} doctors?</h1>
  <p class="hero-sub" style="color:rgba(255,255,255,0.65) !important;">I check family history and health risks &mdash; then find the plan that covers what you might need next year, not just today.</p>
  <div class="split-pill">
    <div class="pill-left">
      <div class="pill-left-q">{{health_system}} covered?</div>
      <span class="pill-left-divider"></span>
      <div class="pill-left-a">Your specialist might not be.</div>
    </div>
    <a href="tel:8287613326" class="pill-right" style="text-decoration:none;">
      <div class="pill-right-top">Safe Bet. Call Rob.</div>
      <div class="pill-right-num">(828) 761-3326</div>
    </a>
  </div>
</div>
<div class="trust-strip">
  <div class="trust-item"><span class="trust-bullet">&#8226;</span> Licensed &middot; NC #10447418</div>
  <div class="trust-item"><span class="trust-bullet">&#8226;</span> Independent &middot; All Carriers</div>
  <div class="trust-item"><span class="trust-bullet">&#8226;</span> No SSN Required</div>
  <div class="trust-item"><span class="trust-bullet">&#8226;</span> $0 Cost to Compare</div>
  <div class="trust-item"><span class="trust-bullet">&#8226;</span> 500+ NC Families Helped</div>
</div>
<div class="section-light">
  <div class="inner">
    <div class="section-label">What you're really asking</div>
    <div class="section-h2">You're not confused about Medicare. You have questions nobody's answering.</div>
    <p class="section-intro">The questions people call me about &mdash; before they realize Medicare.gov can't answer them.</p>
    <div class="fear-grid">
      <div class="fear-card">
        <div class="fear-num">01</div>
        <div class="fear-q">Will my plan cover {{specialties[0]}}?</div>
        <div class="fear-sub">Not the hospital. Your specific oncologist. That's what matters.</div>
      </div>
      <div class="fear-card">
        <div class="fear-num">02</div>
        <div class="fear-q">Will I get hit with a $15,000 surprise bill?</div>
        <div class="fear-sub">In-network hospital, out-of-network anesthesiologist. It happens constantly.</div>
      </div>
      <div class="fear-card">
        <div class="fear-num">03</div>
        <div class="fear-q">What if my $15/month medication becomes $180/month?</div>
        <div class="fear-sub">Plans move drugs between tiers mid-year. Nobody warns you.</div>
      </div>
      <div class="fear-card">
        <div class="fear-num">04</div>
        <div class="fear-q">What if my {{health_system}} cardiologist stops taking my plan?</div>
        <div class="fear-sub">Provider directories are 6 months out of date. I call to verify before you enroll.</div>
      </div>
    </div>
  </div>
</div>
<div class="section-dark">
  <div class="inner">
    <div class="section-label-seafoam">The difference</div>
    <div class="section-h2-white">Medicare.gov vs working with Rob</div>
    <table class="compare-table">
      <thead>
        <tr>
          <th>What you need</th>
          <th>Medicare.gov</th>
          <th>Rob Simm</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Coverage info</td>
          <td>Shows "{{health_system}} in-network" &mdash; that's it</td>
          <td>I tell you if your specific {{health_system}} oncologist is covered</td>
        </tr>
        <tr>
          <td>Network knowledge</td>
          <td>Doesn't know {{hospitals[0]}} vs {{hospitals[1]}} can be on different contracts</td>
          <td>I know which plans cover which {{health_system}} facilities</td>
        </tr>
        <tr>
          <td>Family history</td>
          <td>Doesn't ask</td>
          <td>I ask about cancer, heart disease, diabetes &mdash; then architect coverage around future risk</td>
        </tr>
        <tr>
          <td>Provider verification</td>
          <td>Can't verify if your {{health_system}} specialist accepts MAPD referrals</td>
          <td>I call {{health_system}} and verify before you enroll</td>
        </tr>
        <tr>
          <td>Ongoing support</td>
          <td>You're on your own</td>
          <td>I answer my phone when you call next year</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
<div class="section-white">
  <div class="inner">
    <div class="section-label">Real scenario &middot; 2025</div>
    <div class="section-h2">The difference between right and wrong was $35,500.</div>
    <p class="section-intro">Client A picked Humana Gold Plus. $0 premium. Sounded good. Then came the breast cancer diagnosis.</p>
    <div class="scenario-cards">
      <div class="scenario-card">
        <div class="scenario-tag scenario-tag-wrong">Wrong plan</div>
        <div class="scenario-amount scenario-amount-wrong">$38,000</div>
        <div class="scenario-desc">Out-of-pocket maximum after {{specialties[0]}} radiation was not in-network. She found out after the first appointment.</div>
      </div>
      <div class="scenario-card">
        <div class="scenario-tag scenario-tag-right">Right plan</div>
        <div class="scenario-amount scenario-amount-right">$2,500</div>
        <div class="scenario-desc">Switched to Aetna Medicare Eagle during a Special Enrollment Period. Cancer diagnosis qualifies. {{specialties[0]}} &mdash; in-network.</div>
      </div>
    </div>
  </div>
</div>
<div class="section-light">
  <div class="inner" style="text-align:center;">
    <div class="section-label" style="text-align:center;">Why I don't lie to you</div>
    <div class="honesty-h2">I get paid the same whether you pick Humana, Aetna, or UnitedHealthcare.</div>
    <p class="honesty-body">I get paid the same whether you pick a $0 premium plan or a $150 premium plan. Zero financial incentive to sell you the wrong plan. Call centers get bonuses for enrolling X people in Plan A. I don't. My incentive is to tell you the truth so you refer your friends.</p>
  </div>
</div>
<div class="section-white" style="padding-top:48px;padding-bottom:32px;border-top:0.5px solid #e5e5ea;">
  <div class="inner">
    <div class="block-h3">Related Medicare guides</div>
    <div class="pills-wrap">
      [RELATED-GUIDE-1]
      [RELATED-GUIDE-2]
      [RELATED-GUIDE-3]
      [RELATED-GUIDE-4]
      [RELATED-GUIDE-5]
      [RELATED-GUIDE-6]
      [RELATED-GUIDE-7]
      [RELATED-GUIDE-8]
    </div>
  </div>
</div>
<div class="section-white" style="padding-top:0;padding-bottom:48px;">
  <div class="inner">
    <div style="padding-top:32px;border-top:0.5px solid #e5e5ea;">
      <div class="block-h3">Get help in nearby NC counties</div>
      <div class="pills-wrap">
        [COUNTY-PILLS]
        <a class="county-pill-all" href="https://generationhealth.me/medicare-broker-nc-google-ads/" style="color:#fff !important;background:#0071e3 !important;">All NC Counties &rarr;</a>
      </div>
    </div>
  </div>
</div>
<div class="creds-section">
  <div class="inner">
    <div class="creds-name">Robert Simm, Licensed Medicare Broker</div>
    <div class="creds-line">NC License #10447418 &middot; NPN #10447418 &middot; AHIP Certified</div>
    <div class="creds-line">12+ Years Experience &middot; 500+ NC Families Helped &middot; 2731 Meridian Pkwy, Durham NC 27713</div>
    <div class="creds-line">&#9733;&#9733;&#9733;&#9733;&#9733; 5.0 Rating &middot; 20+ Google Reviews &middot; <a class="creds-verify" href="https://www.ncdoi.gov/consumers/verify-license">Verify License &rarr;</a></div>
    <div class="eeat-stamp">Last Updated: April 2026 &nbsp;|&nbsp; Reviewed By: Robert Simm, Licensed Medicare Broker, NC #10447418 &nbsp;|&nbsp; Next Review: October 2026</div>
  </div>
</div>
<div class="final-cta" style="background:#0d2f5e !important;padding:72px 24px !important;">
  <div class="inner">
    <!-- Desktop: 2-column 35/65 layout -->
    <div class="final-cta-desktop" style="display:grid;grid-template-columns:35% 1fr;gap:48px;align-items:start;max-width:960px;margin:0 auto;">
      <div style="text-align:left;">
        <div style="font-family:-apple-system,'SF Pro Display',sans-serif;font-size:clamp(22px,3vw,28px) !important;font-weight:700 !important;color:#fff !important;line-height:1.15 !important;letter-spacing:-0.02em !important;margin-bottom:10px !important;">10 minutes. You&#39;ll know exactly where you stand.</div>
        <div style="font-size:13px !important;color:rgba(255,255,255,0.45) !important;line-height:1.6 !important;margin-top:10px !important;">Rob Simm &middot; Licensed NC Medicare Broker &middot; NPN #10447418</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <a href="tel:8287613326" style="display:flex !important;flex-direction:column !important;align-items:center !important;justify-content:center !important;padding:18px 28px !important;background:#83f0f9 !important;border-radius:100px !important;text-decoration:none !important;">
          <div style="font-size:10px !important;font-weight:700 !important;color:#0d2f5e !important;letter-spacing:0.1em !important;text-transform:uppercase !important;margin-bottom:3px !important;">Call Rob directly</div>
          <div style="font-size:20px !important;font-weight:700 !important;color:#0d2f5e !important;letter-spacing:-0.01em !important;">(828) 761-3326</div>
          <div style="font-size:11px !important;color:rgba(13,47,94,0.55) !important;margin-top:2px !important;">Mon&ndash;Fri 9am&ndash;7pm &middot; Sat 12pm&ndash;4pm</div>
        </a>
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="flex:1;height:1px;background:rgba(255,255,255,0.08);"></div>
          <div style="font-size:10px !important;color:rgba(255,255,255,0.25) !important;letter-spacing:0.08em !important;text-transform:uppercase !important;">or</div>
          <div style="flex:1;height:1px;background:rgba(255,255,255,0.08);"></div>
        </div>
        <a href="sms:8287613326" style="display:flex !important;align-items:center !important;justify-content:center !important;padding:15px 28px !important;background:rgba(255,255,255,0.06) !important;border:1.5px solid rgba(255,255,255,0.18) !important;border-radius:100px !important;color:#fff !important;font-size:14px !important;font-weight:600 !important;text-decoration:none !important;">Text Us</a>
        <a href="https://calendly.com/robert-generationhealth/new-meeting" style="display:flex !important;align-items:center !important;justify-content:center !important;padding:15px 28px !important;background:rgba(255,255,255,0.06) !important;border:1.5px solid rgba(255,255,255,0.18) !important;border-radius:100px !important;color:#fff !important;font-size:14px !important;font-weight:600 !important;text-decoration:none !important;">Book a Free Call</a>
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="flex:1;height:1px;background:rgba(255,255,255,0.08);"></div>
          <div style="font-size:10px !important;color:rgba(255,255,255,0.25) !important;letter-spacing:0.08em !important;text-transform:uppercase !important;">compare plans</div>
          <div style="flex:1;height:1px;background:rgba(255,255,255,0.08);"></div>
        </div>
        <a href="https://www.sunfirematrix.com/app/consumer/medicareadvocates/10447418/#/" style="display:flex !important;align-items:center !important;justify-content:center !important;padding:15px 28px !important;background:rgba(131,240,249,0.08) !important;border:1.5px solid rgba(131,240,249,0.25) !important;border-radius:100px !important;color:#83f0f9 !important;font-size:14px !important;font-weight:600 !important;text-decoration:none !important;">Compare Medicare Plans &mdash; SunFire &rarr;</a>
        <div style="font-size:10px !important;font-weight:700 !important;color:rgba(255,255,255,0.45) !important;text-align:center !important;letter-spacing:0.07em !important;text-transform:uppercase !important;margin-top:4px !important;">No pressure &middot; No sales pitch &middot; Your data never sold</div>
      </div>
    </div>
    <!-- Mobile: stacked layout -->
    <div class="final-cta-mobile" style="display:none;max-width:480px;margin:0 auto;">
      <div style="font-family:-apple-system,'SF Pro Display',sans-serif;font-size:22px !important;font-weight:700 !important;color:#fff !important;line-height:1.2 !important;letter-spacing:-0.02em !important;margin-bottom:8px !important;text-align:center !important;">10 minutes. You&#39;ll know where you stand.</div>
      <div style="font-size:13px !important;color:rgba(255,255,255,0.45) !important;text-align:center !important;margin-bottom:24px !important;line-height:1.5 !important;">Rob Simm &middot; Licensed NC Medicare Broker &middot; NPN #10447418</div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <a href="tel:8287613326" style="display:flex !important;flex-direction:column !important;align-items:center !important;padding:16px 20px !important;background:#83f0f9 !important;border-radius:100px !important;text-decoration:none !important;">
          <div style="font-size:10px !important;font-weight:700 !important;color:#0d2f5e !important;letter-spacing:0.1em !important;text-transform:uppercase !important;margin-bottom:3px !important;">Call Rob directly</div>
          <div style="font-size:19px !important;font-weight:700 !important;color:#0d2f5e !important;">(828) 761-3326</div>
        </a>
        <a href="sms:8287613326" style="display:flex !important;align-items:center !important;justify-content:center !important;padding:14px 20px !important;background:rgba(255,255,255,0.06) !important;border:1.5px solid rgba(255,255,255,0.18) !important;border-radius:100px !important;color:#fff !important;font-size:14px !important;font-weight:600 !important;text-decoration:none !important;">Text Us</a>
        <a href="https://calendly.com/robert-generationhealth/new-meeting" style="display:flex !important;align-items:center !important;justify-content:center !important;padding:14px 20px !important;background:rgba(255,255,255,0.06) !important;border:1.5px solid rgba(255,255,255,0.18) !important;border-radius:100px !important;color:#fff !important;font-size:14px !important;font-weight:600 !important;text-decoration:none !important;">Book a Free Call</a>
        <a href="https://www.sunfirematrix.com/app/consumer/medicareadvocates/10447418/#/" style="display:flex !important;align-items:center !important;justify-content:center !important;padding:14px 20px !important;background:rgba(131,240,249,0.08) !important;border:1.5px solid rgba(131,240,249,0.25) !important;border-radius:100px !important;color:#83f0f9 !important;font-size:14px !important;font-weight:600 !important;text-decoration:none !important;">Compare Plans &mdash; SunFire &rarr;</a>
      </div>
      <div style="font-size:10px !important;font-weight:700 !important;color:rgba(255,255,255,0.45) !important;text-align:center !important;letter-spacing:0.07em !important;text-transform:uppercase !important;margin-top:14px !important;">No pressure &middot; No sales pitch &middot; Your data never sold</div>
    </div>
  </div>
</div>
</body>
</html>
`;
