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
<link rel="canonical" href="https://generationhealth.me/medicare-agents-in-{{county_slug}}-county-nc/">
<meta property="og:type" content="article">
<meta property="og:title" content="Medicare Broker {{county}} NC: Which Plans Actually Cover Your {{health_system}} Doctors?">
<meta property="og:description" content="Independent NC Medicare broker. I verify which plans actually cover your specific {{health_system}} doctors — by name — before you enroll.">
<meta property="og:url" content="https://generationhealth.me/medicare-agents-in-{{county_slug}}-county-nc/">
<meta property="og:site_name" content="GenerationHealth.me">
<meta property="og:image" content="https://generationhealth.me/og-default.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Medicare Broker {{county}} NC: Which Plans Actually Cover Your {{health_system}} Doctors?">
<meta name="twitter:description" content="Independent NC Medicare broker. I verify which plans actually cover your specific {{health_system}} doctors — by name — before you enroll.">
<meta name="author" content="Robert Simm">
<meta name="article:published_time" content="2026-04-09">
<meta name="article:modified_time" content="2026-05-03">
<script type="application/ld+json">
{"@context":"https://schema.org","@graph":[
{"@type":"MedicalWebPage","@id":"https://generationhealth.me/medicare-agents-in-{{county_slug}}-county-nc/#webpage","url":"https://generationhealth.me/medicare-agents-in-{{county_slug}}-county-nc/","name":"Medicare Broker {{county}} NC: Which Plans Actually Cover Your {{health_system}} Doctors?","description":"Independent NC Medicare broker. I verify which plans actually cover your specific {{health_system}} doctors — by name — before you enroll.","datePublished":"2026-04-09","dateModified":"2026-05-03","inLanguage":"en-US","isPartOf":{"@id":"https://generationhealth.me/#website"},"author":{"@id":"https://generationhealth.me/#author"},"publisher":{"@id":"https://generationhealth.me/#org"},"breadcrumb":{"@id":"https://generationhealth.me/medicare-agents-in-{{county_slug}}-county-nc/#breadcrumbs"},"audience":{"@type":"PeopleAudience","suggestedMinAge":64},"about":{"@type":"MedicalCondition","name":"Medicare enrollment and coverage"},"speakable":{"@type":"SpeakableSpecification","cssSelector":[".aeo-direct-answer",".aeo-faq summary",".aeo-faq .aeo-faq-a"]}},
{"@type":"Article","@id":"https://generationhealth.me/medicare-agents-in-{{county_slug}}-county-nc/#article","headline":"Medicare Broker {{county}} NC: Which Plans Actually Cover Your {{health_system}} Doctors?","description":"Independent NC Medicare broker serving {{county}} County. Verifies provider networks before enrollment.","datePublished":"2026-04-09","dateModified":"2026-05-03","author":{"@id":"https://generationhealth.me/#author"},"publisher":{"@id":"https://generationhealth.me/#org"},"mainEntityOfPage":{"@id":"https://generationhealth.me/medicare-agents-in-{{county_slug}}-county-nc/#webpage"},"articleBody":"In {{county}} County, plans that cover your {{health_system}} doctors depend on the network type. HMO and PPO Medicare Advantage plans negotiate separately with each {{health_system}} hospital and provider group. Original Medicare with a Medigap supplement covers any provider that accepts Medicare, including every {{health_system}} doctor in NC."},
{"@type":"FAQPage","@id":"https://generationhealth.me/medicare-agents-in-{{county_slug}}-county-nc/#faq","url":"https://generationhealth.me/medicare-agents-in-{{county_slug}}-county-nc/","author":{"@id":"https://generationhealth.me/#author"},"datePublished":"2026-04-09","dateModified":"2026-05-03","mainEntity":[
{"@type":"Question","name":"Will my {{health_system}} doctor stay in-network if I switch plans?","acceptedAnswer":{"@type":"Answer","text":"Network status is set per plan, per year. A {{health_system}} oncologist in-network with a Medicare Advantage HMO this year may not be covered next year if the carrier renegotiates. Original Medicare with a Medigap supplement (Plan G or Plan N) covers any provider that accepts Medicare — every {{health_system}} doctor in NC qualifies. Verify each specialist by name before enrolling.","author":{"@id":"https://generationhealth.me/#author"}}},
{"@type":"Question","name":"What's the difference between Medicare Advantage and Original Medicare in {{county}} County?","acceptedAnswer":{"@type":"Answer","text":"Medicare Advantage (Part C) replaces Original Medicare with a private network and a $9,350 in-network out-of-pocket maximum in 2026. Original Medicare plus Medigap Plan G has a $283 Part B deductible and then 0% coinsurance on Medicare-approved services with no network restriction. In {{county}} County, Advantage plans typically cost $0/month premium but route through specific {{health_system}} contracts; Medigap costs $120-$180/month but covers any provider nationwide.","author":{"@id":"https://generationhealth.me/#author"}}},
{"@type":"Question","name":"Do I need to change Medicare plans every year?","acceptedAnswer":{"@type":"Answer","text":"No, but you should review every fall. Carriers change formularies, copays, and provider networks each January. The Annual Enrollment Period runs October 15–December 7. If your {{health_system}} doctor leaves the network or your medication moves to a higher tier, you have until December 7 to switch without penalty.","author":{"@id":"https://generationhealth.me/#author"}}},
{"@type":"Question","name":"What if my medication moves to a higher tier mid-year?","acceptedAnswer":{"@type":"Answer","text":"Carriers can move drugs between tiers mid-year and they don't always warn you. The 2026 Part D out-of-pocket cap is $2,100/year, and insulin is capped at $35/month — but a non-insulin tier change can still spike a $15 medication to $180/month. You can switch plans during AEP (Oct 15–Dec 7) or with a qualifying Special Enrollment Period.","author":{"@id":"https://generationhealth.me/#author"}}},
{"@type":"Question","name":"How much does it cost to work with a Medicare broker in {{county}} County?","acceptedAnswer":{"@type":"Answer","text":"$0. Independent Medicare brokers are paid by the carrier you enroll with — never by you. Your premium is identical whether you enroll directly with the carrier, through Medicare.gov, or through a broker. The difference is that a local broker verifies provider networks by name and answers the phone next year when something changes.","author":{"@id":"https://generationhealth.me/#author"}}},
{"@type":"Question","name":"What is a Special Enrollment Period and do I qualify?","acceptedAnswer":{"@type":"Answer","text":"A Special Enrollment Period (SEP) lets you change Medicare plans outside of AEP because of a qualifying life event: moving, losing employer coverage, qualifying for Extra Help, a 5-star plan in your area, or a chronic condition diagnosis. The SEP after losing employer coverage is 8 months long. Most other SEPs run 60 days from the qualifying event.","author":{"@id":"https://generationhealth.me/#author"}}}
]},
{"@type":"Person","@id":"https://generationhealth.me/#author","name":"Robert Simm","jobTitle":"Licensed Medicare Broker","telephone":"(828) 761-3326","email":"robert@generationhealth.me","url":"https://generationhealth.me","hasCredential":[{"@type":"EducationalOccupationalCredential","credentialCategory":"license","name":"NC License #10447418"},{"@type":"EducationalOccupationalCredential","credentialCategory":"certification","name":"AHIP Certified"}],"address":{"@type":"PostalAddress","streetAddress":"2731 Meridian Pkwy","addressLocality":"Durham","addressRegion":"NC","postalCode":"27713","addressCountry":"US"},"worksFor":{"@id":"https://generationhealth.me/#org"}},
{"@type":["LocalBusiness","InsuranceAgency"],"@id":"https://generationhealth.me/#org","name":"GenerationHealth.me","legalName":"Robert Jason Simm","url":"https://generationhealth.me","telephone":"(828) 761-3326","email":"robert@generationhealth.me","areaServed":{"@type":"State","name":"North Carolina"},"address":{"@type":"PostalAddress","streetAddress":"2731 Meridian Pkwy","addressLocality":"Durham","addressRegion":"NC","postalCode":"27713","addressCountry":"US"},"priceRange":"$0 (no broker fee)","aggregateRating":{"@type":"AggregateRating","ratingValue":5.0,"reviewCount":3,"bestRating":5},"review":[
{"@type":"Review","@id":"https://generationhealth.me/medicare-agents-in-{{county_slug}}-county-nc/#review-1","itemReviewed":{"@id":"https://generationhealth.me/#org"},"author":{"@type":"Person","name":"Linda M."},"datePublished":"2026-02-14","reviewRating":{"@type":"Rating","ratingValue":5,"bestRating":5},"reviewBody":"Rob caught that my husband would have lost his {{health_system}} oncologist on the plan another agent recommended. He spent an hour calling {{health_system}} directly to verify before we enrolled. I would never have thought to ask."},
{"@type":"Review","@id":"https://generationhealth.me/medicare-agents-in-{{county_slug}}-county-nc/#review-2","itemReviewed":{"@id":"https://generationhealth.me/#org"},"author":{"@type":"Person","name":"James W."},"datePublished":"2026-01-08","reviewRating":{"@type":"Rating","ratingValue":5,"bestRating":5},"reviewBody":"I delayed Medicare past 65 because I was still working. Three other agents told me I was fine. Rob actually checked my employer size — only 12 employees, so Medicare was primary. He saved me from a permanent 10% penalty."},
{"@type":"Review","@id":"https://generationhealth.me/medicare-agents-in-{{county_slug}}-county-nc/#review-3","itemReviewed":{"@id":"https://generationhealth.me/#org"},"author":{"@type":"Person","name":"Patricia O."},"datePublished":"2025-11-22","reviewRating":{"@type":"Rating","ratingValue":5,"bestRating":5},"reviewBody":"My Part D plan moved my $15 medication to a $180/month tier mid-year. Rob ran a Plan Finder analysis the same day and switched me during open enrollment. He still answers his phone in February."}
]},
{"@type":"BreadcrumbList","@id":"https://generationhealth.me/medicare-agents-in-{{county_slug}}-county-nc/#breadcrumbs","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://generationhealth.me"},{"@type":"ListItem","position":2,"name":"Medicare in NC","item":"https://generationhealth.me/medicare-nc/"},{"@type":"ListItem","position":3,"name":"Medicare Agents in {{county}} County","item":"https://generationhealth.me/medicare-agents-in-{{county_slug}}-county-nc/"}]},
{"@type":"SpecialAnnouncement","@id":"https://generationhealth.me/medicare-agents-in-{{county_slug}}-county-nc/#announcement","name":"2026 Medicare Cost Changes","text":"In 2026, the standard Part B premium is $202.90/month, the Part B deductible is $283, and the Part D out-of-pocket cap is $2,100/year. Insulin costs are capped at $35/month. The Medicare Advantage in-network out-of-pocket maximum is $9,350.","datePosted":"2026-04-09","expires":"2026-12-31","category":"https://www.wikidata.org/wiki/Q12131","announcementLocation":{"@id":"https://generationhealth.me/#org"}}
]}
</script>
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
/* ── Direct Answer block ── */
.aeo-direct-answer{max-width:560px;margin:0 auto 24px;padding:22px 26px;background:linear-gradient(135deg,#F0FDFA,#CCFBF1);border-left:4px solid #14B8A6;border-radius:14px;color:#0F2440;text-align:left;}
.aeo-da-label{display:inline-block;background:#0D9488;color:#fff;font-size:10px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;padding:4px 10px;border-radius:4px;margin-bottom:10px;}
.aeo-da-text{font-size:15px;line-height:1.6;font-weight:500;margin-bottom:10px;}
.aeo-da-cta{font-size:13px;color:#0D9488;font-weight:600;}
.aeo-da-cta a{color:#0D9488;text-decoration:underline;}
/* ── Warning block ── */
.aeo-warning{max-width:860px;margin:24px auto;padding:18px 22px;background:linear-gradient(135deg,rgba(248,113,113,0.08),rgba(248,113,113,0.03));border-left:4px solid #DC2626;border-radius:10px;font-size:14px;line-height:1.6;color:#1A2332;}
.aeo-w-label{display:inline-block;background:#DC2626;color:#fff;font-size:10px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;padding:4px 10px;border-radius:4px;margin-bottom:8px;}
/* ── Expert tip block ── */
.aeo-tip{max-width:860px;margin:24px auto;padding:18px 22px;background:linear-gradient(135deg,rgba(96,165,250,0.08),rgba(96,165,250,0.03));border-left:4px solid #2563EB;border-radius:10px;font-size:14px;line-height:1.6;color:#1A2332;}
.aeo-t-label{display:inline-block;background:#2563EB;color:#fff;font-size:10px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;padding:4px 10px;border-radius:4px;margin-bottom:8px;}
/* ── FAQ accordion ── */
.aeo-faq{max-width:860px;margin:0 auto;padding:0 24px;}
.aeo-faq h2{font-family:-apple-system,'SF Pro Display',sans-serif;font-size:clamp(22px,3vw,28px);font-weight:700;color:#1d1d1f;margin-bottom:16px;letter-spacing:-0.02em;}
.aeo-faq details{border:1px solid #E8ECF0;border-radius:10px;margin-bottom:8px;background:#fff;}
.aeo-faq details[open]{border-color:#14B8A6;box-shadow:0 1px 4px rgba(20,184,166,0.1);}
.aeo-faq summary{cursor:pointer;padding:14px 18px;font-size:14px;font-weight:600;color:#0F2440;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:12px;}
.aeo-faq summary::-webkit-details-marker{display:none;}
.aeo-faq summary::after{content:'+';font-size:22px;font-weight:300;color:#0D9488;}
.aeo-faq details[open] summary::after{content:'\\2212';}
.aeo-faq .aeo-faq-a{padding:0 18px 16px;font-size:14px;line-height:1.7;color:#3A4756;}
/* ── Full author card ── */
.aeo-author-full{max-width:860px;margin:24px auto;padding:24px;border:1px solid #E8ECF0;border-radius:14px;background:#fff;display:grid;grid-template-columns:88px 1fr;gap:20px;align-items:start;}
.aeo-author-photo{width:88px;height:88px;border-radius:50%;background:linear-gradient(135deg,#14B8A6,#0D9488);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:28px;}
.aeo-author-name{font-size:18px;font-weight:700;color:#0F2440;}
.aeo-author-title{font-size:13px;color:#6B7B8D;margin-bottom:8px;}
.aeo-author-bio{font-size:14px;line-height:1.65;color:#3A4756;margin-bottom:10px;}
.aeo-author-row{font-size:12px;color:#3A4756;line-height:1.7;}
.aeo-author-row strong{color:#0F2440;}
/* ── CMS compliance disclaimer ── */
.aeo-disclaimer{max-width:860px;margin:0 auto;padding:24px;border-top:1px solid #e5e5ea;}
.aeo-disclaimer p{font-size:11px;line-height:1.7;color:#6B7B8D;}
.aeo-disclaimer p strong{color:#3A4756;}
.aeo-footer-meta{max-width:860px;margin:0 auto;padding:0 24px 24px;font-size:11px;color:#6B7B8D;line-height:1.7;text-align:center;}
.aeo-footer-meta a{color:#0D9488;text-decoration:none;}
/* ── Responsive ── */
@media(max-width:640px){
  .fear-grid{grid-template-columns:1fr;}
  .scenario-cards{grid-template-columns:1fr;}
  .compare-table{font-size:12px;}
  .compare-table th,.compare-table td{padding:10px 10px;}
  .trust-strip{gap:2px;}
  .trust-item{padding:0 6px;font-size:11px;}
  .aeo-author-full{grid-template-columns:1fr;text-align:center;}
  .aeo-author-photo{margin:0 auto;}
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
  <div class="aeo-direct-answer" style="background:linear-gradient(135deg,#F0FDFA,#CCFBF1) !important;border-left:4px solid #14B8A6 !important;color:#0F2440 !important;">
    <span class="aeo-da-label" style="background:#0D9488 !important;color:#fff !important;">Direct Answer</span>
    <p class="aeo-da-text" style="color:#0F2440 !important;">Plans that cover your {{health_system}} doctors in {{county}} County depend on the network type. HMO and PPO Medicare Advantage plans negotiate separately with each {{health_system}} hospital and provider group, so &ldquo;in-network&rdquo; on Medicare.gov doesn&rsquo;t guarantee your specific {{health_system}} oncologist or cardiologist accepts the plan. Original Medicare with a Medigap supplement (Plan G or Plan N) covers any provider that accepts Medicare &mdash; which means every {{health_system}} doctor in NC. Provider directories run 4&ndash;6 months stale, so verify each specialist by name with both the carrier and {{health_system}} billing before you enroll.</p>
    <div class="aeo-da-cta" style="color:#0D9488 !important;">For your specific situation in {{county}} County, call Rob Simm at <a href="tel:8287613326" style="color:#0D9488 !important;">(828) 761-3326</a> &mdash; free, no obligation.</div>
  </div>
  <div style="max-width:560px !important;margin:0 auto !important;padding:0 8px !important;text-align:left !important;">
    <p style="font-size:18px !important;font-weight:600 !important;color:#ffffff !important;margin:0 0 20px !important;line-height:1.5 !important;text-align:center !important;">Now pick how you want to move forward &mdash; your pace.</p>
    <a href="javascript:void(0)" class="pm-pill-trigger" data-product="medicare" style="display:block !important;background:#67e8f9 !important;border-radius:16px !important;padding:28px 32px !important;text-align:center !important;text-decoration:none !important;margin-bottom:12px !important;cursor:pointer !important;transition:opacity 0.2s !important;">
      <div style="font-size:11px !important;font-weight:800 !important;letter-spacing:0.12em !important;text-transform:uppercase !important;color:rgba(0,0,0,0.55) !important;margin-bottom:6px !important;">PLAN MATCH &middot; 3 MINUTES</div>
      <div style="font-size:22px !important;font-weight:700 !important;color:#0a3040 !important;letter-spacing:-0.01em !important;">Let's start with <em>you</em>.</div>
    </a>
    <div id="gh-calendly-wrap" style="margin-bottom:20px !important;">
      <div onclick="(function(el){var p=el.closest('#gh-calendly-wrap').querySelector('#gh-cb-panel');var a=el.querySelector('.gh-cb-arrow');if(p.style.display==='none'||!p.style.display){p.style.display='block';a.textContent='&#9652;';}else{p.style.display='none';a.textContent='&#9662;';}})(this)" style="display:block !important;background:transparent !important;border:2px solid #67e8f9 !important;border-radius:16px !important;padding:28px 32px !important;text-align:center !important;cursor:pointer !important;transition:opacity 0.2s !important;position:relative !important;">
        <div style="font-size:11px !important;font-weight:800 !important;letter-spacing:0.12em !important;text-transform:uppercase !important;color:rgba(255,255,255,0.6) !important;margin-bottom:6px !important;">15-MIN CALL &middot; SAME-WEEK SLOTS</div>
        <div style="font-size:22px !important;font-weight:700 !important;color:#ffffff !important;letter-spacing:-0.01em !important;">Book on Calendly <span class="gh-cb-arrow" style="font-size:16px !important;margin-left:6px !important;color:#ffffff !important;">&#9662;</span></div>
      </div>
      <div id="gh-cb-panel" style="display:none;background:#0a3040 !important;border:2px solid #67e8f9 !important;border-top:none !important;border-radius:0 0 16px 16px !important;padding:24px 32px !important;margin-top:-2px !important;">
        <form id="ghCallbackForm" action="https://formsubmit.co/robert@generationhealth.me" method="POST" style="margin:0 !important;">
          <input type="hidden" name="_subject" value="New Callback Request from AEO Page">
          <input type="hidden" name="_captcha" value="false">
          <input type="hidden" name="_template" value="table">
          <input type="hidden" name="_next" value="https://generationhealth.me">
          <input type="hidden" name="Type" value="Callback Request &mdash; AEO Page">
          <div style="display:grid !important;grid-template-columns:1fr 1fr !important;gap:12px !important;margin-bottom:12px !important;">
            <div>
              <label for="ghCbFirst" style="display:block !important;font-size:12px !important;font-weight:600 !important;color:rgba(255,255,255,0.7) !important;margin-bottom:4px !important;">First name</label>
              <input id="ghCbFirst" name="First Name" required autocomplete="given-name" style="width:100% !important;padding:10px 12px !important;border:1.5px solid #d1d5db !important;border-radius:8px !important;font-size:15px !important;font-family:inherit !important;outline:none !important;background:#fff !important;">
            </div>
            <div>
              <label for="ghCbLast" style="display:block !important;font-size:12px !important;font-weight:600 !important;color:rgba(255,255,255,0.7) !important;margin-bottom:4px !important;">Last name</label>
              <input id="ghCbLast" name="Last Name" required autocomplete="family-name" style="width:100% !important;padding:10px 12px !important;border:1.5px solid #d1d5db !important;border-radius:8px !important;font-size:15px !important;font-family:inherit !important;outline:none !important;background:#fff !important;">
            </div>
          </div>
          <div style="margin-bottom:12px !important;">
            <label for="ghCbPhone" style="display:block !important;font-size:12px !important;font-weight:600 !important;color:rgba(255,255,255,0.7) !important;margin-bottom:4px !important;">Phone number</label>
            <input id="ghCbPhone" name="Phone" type="tel" required inputmode="tel" autocomplete="tel" placeholder="(555) 555-5555" style="width:100% !important;padding:10px 12px !important;border:1.5px solid #d1d5db !important;border-radius:8px !important;font-size:15px !important;font-family:inherit !important;outline:none !important;background:#fff !important;">
          </div>
          <div style="margin-bottom:12px !important;">
            <label for="ghCbTime" style="display:block !important;font-size:12px !important;font-weight:600 !important;color:rgba(255,255,255,0.7) !important;margin-bottom:4px !important;">Best time to call</label>
            <select id="ghCbTime" name="Best Time" style="width:100% !important;padding:10px 12px !important;border:1.5px solid #d1d5db !important;border-radius:8px !important;font-size:15px !important;font-family:inherit !important;outline:none !important;background:#fff !important;">
              <option value="Morning (9am-12pm)">Morning (9am&ndash;12pm)</option>
              <option value="Afternoon (12pm-4pm)">Afternoon (12pm&ndash;4pm)</option>
              <option value="Evening (4pm-7pm)">Evening (4pm&ndash;7pm)</option>
              <option value="Anytime" selected>Anytime</option>
            </select>
          </div>
          <button type="submit" style="width:100% !important;padding:14px !important;background:#67e8f9 !important;color:#0a3040 !important;border:none !important;border-radius:10px !important;font-size:16px !important;font-weight:700 !important;cursor:pointer !important;letter-spacing:-0.01em !important;">Request Callback</button>
        </form>
      </div>
    </div>
    <p style="text-align:center !important;font-size:15px !important;color:rgba(255,255,255,0.7) !important;margin:0 !important;">Prefer to just talk? <a href="tel:8287613326" style="color:#67e8f9 !important;font-weight:700 !important;text-decoration:none !important;">(828) 761-3326</a></p>
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
    <h2 class="section-h2">What questions are people in {{county}} County actually asking before they enroll in Medicare?</h2>
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
    <h2 class="section-h2-white">What's the difference between Medicare.gov and a local Medicare broker in {{county}} County?</h2>
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
<div class="aeo-tip">
  <span class="aeo-t-label">&#128161; Broker Tip &middot; {{county}} County</span>
  <div>{{hospitals[0]}} and {{hospitals[1]}} can be on entirely different Medicare Advantage contracts even though they share the {{health_system}} brand. Before you enroll, give me the names of every specialist you see &mdash; primary care, cardiologist, oncologist, endocrinologist &mdash; and I&rsquo;ll call each one&rsquo;s billing office directly to verify they accept the plan. Provider directories on Medicare.gov run 4&ndash;6 months stale.</div>
</div>
<div class="section-white">
  <div class="inner">
    <div class="section-label">Real scenario &middot; 2025</div>
    <h2 class="section-h2">What does picking the wrong Medicare plan in {{county}} County actually cost?</h2>
    <p class="section-intro">Client A picked Humana Gold Plus. $0 premium. Sounded good. Then came the breast cancer diagnosis. The difference between right and wrong was $35,500.</p>
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
<div class="aeo-warning">
  <span class="aeo-w-label">&#9888; Penalty &amp; Deadline Warning</span>
  <div>If you delay Medicare Part B without creditable employer coverage, you&rsquo;ll pay a <strong>10% lifetime penalty for every 12 months you delayed</strong> &mdash; added to your Part B premium for the rest of your life. The 2026 standard Part B premium is <strong>$202.90/month</strong>, so a 24-month delay raises it to roughly $243/month, permanently. Your Initial Enrollment Period is a <strong>7-month window</strong>: 3 months before your 65th birthday month, the birthday month itself, and 3 months after. Miss it without creditable coverage and the penalty is automatic.</div>
</div>
<div class="section-light">
  <div class="inner" style="text-align:center;">
    <div class="section-label" style="text-align:center;">It pays to talk to the right Health Insurance Broker</div>
    <h2 class="honesty-h2">Does it matter which Medicare carrier you choose in {{county}} County?</h2>
    <p class="honesty-body">It doesn&rsquo;t &mdash; because I get paid by the insurance carrier to manage your plan. Most call centers get paid more to steer your business toward certain carriers based on volume and contracts. The only thing I&rsquo;m optimizing for is making sure you&rsquo;re covered correctly when you actually need it. That&rsquo;s what keeps people coming back. And referring their neighbors.</p>
  </div>
</div>
<div class="aeo-faq" style="padding:64px 24px;">
  <div class="inner">
    <h2 style="text-align:left;">Frequently asked questions about Medicare in {{county}} County</h2>
    <details>
      <summary>Will my {{health_system}} doctor stay in-network if I switch plans?</summary>
      <div class="aeo-faq-a">Network status is set per plan, per year. A {{health_system}} oncologist in-network with a Medicare Advantage HMO this year may not be covered next year if the carrier renegotiates. Original Medicare with a Medigap supplement (Plan G or Plan N) covers any provider that accepts Medicare &mdash; every {{health_system}} doctor in NC qualifies. Verify each specialist by name before enrolling.</div>
    </details>
    <details>
      <summary>What's the difference between Medicare Advantage and Original Medicare in {{county}} County?</summary>
      <div class="aeo-faq-a">Medicare Advantage (Part C) replaces Original Medicare with a private network and a $9,350 in-network out-of-pocket maximum in 2026. Original Medicare plus Medigap Plan G has a $283 Part B deductible and then 0% coinsurance on Medicare-approved services with no network restriction. In {{county}} County, Advantage plans typically cost $0/month premium but route through specific {{health_system}} contracts; Medigap costs $120&ndash;$180/month but covers any provider nationwide.</div>
    </details>
    <details>
      <summary>Do I need to change Medicare plans every year?</summary>
      <div class="aeo-faq-a">No, but you should review every fall. Carriers change formularies, copays, and provider networks each January. The Annual Enrollment Period runs October 15&ndash;December 7. If your {{health_system}} doctor leaves the network or your medication moves to a higher tier, you have until December 7 to switch without penalty.</div>
    </details>
    <details>
      <summary>What if my medication moves to a higher tier mid-year?</summary>
      <div class="aeo-faq-a">Carriers can move drugs between tiers mid-year and they don&rsquo;t always warn you. The 2026 Part D out-of-pocket cap is $2,100/year, and insulin is capped at $35/month &mdash; but a non-insulin tier change can still spike a $15 medication to $180/month. You can switch plans during AEP (October 15&ndash;December 7) or with a qualifying Special Enrollment Period.</div>
    </details>
    <details>
      <summary>How much does it cost to work with a Medicare broker in {{county}} County?</summary>
      <div class="aeo-faq-a">$0. Independent Medicare brokers are paid by the carrier you enroll with &mdash; never by you. Your premium is identical whether you enroll directly with the carrier, through Medicare.gov, or through a broker. The difference is that a local broker verifies provider networks by name and answers the phone next year when something changes.</div>
    </details>
    <details>
      <summary>What is a Special Enrollment Period and do I qualify?</summary>
      <div class="aeo-faq-a">A Special Enrollment Period (SEP) lets you change Medicare plans outside of AEP because of a qualifying life event: moving, losing employer coverage, qualifying for Extra Help, a 5-star plan in your area, or a chronic condition diagnosis. The SEP after losing employer coverage is 8 months long. Most other SEPs run 60 days from the qualifying event.</div>
    </details>
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
        <a class="county-pill-all" href="https://generationhealth.me/medicare-nc/" style="color:#fff !important;background:#0071e3 !important;">All NC Counties &rarr;</a>
      </div>
    </div>
  </div>
</div>
<aside class="aeo-author-full" itemscope itemtype="https://schema.org/Person">
  <div class="aeo-author-photo">RS</div>
  <div>
    <div class="aeo-author-name" itemprop="name">Robert Simm</div>
    <div class="aeo-author-title" itemprop="jobTitle">Licensed Medicare Broker &middot; NC #10447418 &middot; NPN #10447418 &middot; AHIP Certified</div>
    <p class="aeo-author-bio">Independent Medicare broker serving North Carolina families since 2014. AHIP certified. 12+ years of experience and 500+ NC families helped. I check family history and verify provider networks by name before recommending a plan, and I answer my own phone the next year when something changes.</p>
    <div class="aeo-author-row"><strong>Phone:</strong> <a href="tel:8287613326">(828) 761-3326</a></div>
    <div class="aeo-author-row"><strong>Email:</strong> <a href="mailto:robert@generationhealth.me">robert@generationhealth.me</a></div>
    <div class="aeo-author-row"><strong>Hours:</strong> Mon&ndash;Fri 9 AM&ndash;7 PM ET &middot; Saturday by appointment</div>
    <div class="aeo-author-row"><strong>Office:</strong> 2731 Meridian Pkwy, Durham NC 27713</div>
    <div class="aeo-author-row">&#9733;&#9733;&#9733;&#9733;&#9733; 5.0 Rating &middot; 20+ Google Reviews</div>
    <div class="aeo-author-row"><strong>License verification:</strong> <a href="https://sbs.naic.org/solar-external-lookup/" target="_blank" rel="noopener">NAIC SBS lookup &rarr;</a></div>
  </div>
</aside>
<div class="final-cta" style="background:#0d2f5e !important;padding:72px 24px !important;">
  <div class="inner">
    <!-- Universal CTA — single layout for all screen sizes -->
    <div style="max-width:480px !important;margin:0 auto !important;width:100% !important;box-sizing:border-box !important;">
      <div style="font-family:-apple-system,'SF Pro Display',sans-serif !important;font-size:22px !important;font-weight:700 !important;color:#fff !important;line-height:1.2 !important;letter-spacing:-0.02em !important;margin-bottom:8px !important;text-align:center !important;">10 minutes. You&#39;ll know where you stand.</div>
      <div style="font-size:13px !important;color:rgba(255,255,255,0.45) !important;text-align:center !important;margin-bottom:24px !important;line-height:1.5 !important;">Rob Simm &middot; Licensed NC Medicare Broker &middot; NPN #10447418</div>
      <p style="font-size:18px !important;font-weight:600 !important;color:#ffffff !important;margin:0 0 20px !important;line-height:1.5 !important;text-align:center !important;">Now pick how you want to move forward &mdash; your pace.</p>
      <a href="javascript:void(0)" class="pm-pill-trigger" data-product="medicare" style="display:block !important;background:#67e8f9 !important;border-radius:16px !important;padding:28px 32px !important;text-align:center !important;text-decoration:none !important;margin-bottom:12px !important;cursor:pointer !important;transition:opacity 0.2s !important;">
        <div style="font-size:11px !important;font-weight:800 !important;letter-spacing:0.12em !important;text-transform:uppercase !important;color:rgba(0,0,0,0.55) !important;margin-bottom:6px !important;">PLAN MATCH &middot; 3 MINUTES</div>
        <div style="font-size:22px !important;font-weight:700 !important;color:#0a3040 !important;letter-spacing:-0.01em !important;">Let's start with <em>you</em>.</div>
      </a>
      <div id="gh-calendly-wrap-footer" style="margin-bottom:20px !important;text-align:left !important;">
        <div onclick="(function(el){var p=el.closest('#gh-calendly-wrap-footer').querySelector('#gh-cb-panel-footer');var a=el.querySelector('.gh-cb-arrow');if(p.style.display==='none'||!p.style.display){p.style.display='block';a.textContent='&#9652;';}else{p.style.display='none';a.textContent='&#9662;';}})(this)" style="display:block !important;background:transparent !important;border:2px solid #67e8f9 !important;border-radius:16px !important;padding:28px 32px !important;text-align:center !important;cursor:pointer !important;transition:opacity 0.2s !important;position:relative !important;">
          <div style="font-size:11px !important;font-weight:800 !important;letter-spacing:0.12em !important;text-transform:uppercase !important;color:rgba(255,255,255,0.6) !important;margin-bottom:6px !important;">15-MIN CALL &middot; SAME-WEEK SLOTS</div>
          <div style="font-size:22px !important;font-weight:700 !important;color:#ffffff !important;letter-spacing:-0.01em !important;">Book on Calendly <span class="gh-cb-arrow" style="font-size:16px !important;margin-left:6px !important;color:#ffffff !important;">&#9662;</span></div>
        </div>
        <div id="gh-cb-panel-footer" style="display:none;background:#0a3040 !important;border:2px solid #67e8f9 !important;border-top:none !important;border-radius:0 0 16px 16px !important;padding:24px 32px !important;margin-top:-2px !important;">
          <form id="ghCallbackFormFooter" action="https://formsubmit.co/robert@generationhealth.me" method="POST" style="margin:0 !important;">
            <input type="hidden" name="_subject" value="New Callback Request from AEO Page Footer">
            <input type="hidden" name="_captcha" value="false">
            <input type="hidden" name="_template" value="table">
            <input type="hidden" name="_next" value="https://generationhealth.me">
            <input type="hidden" name="Type" value="Callback Request &mdash; AEO Page Footer">
            <div style="display:grid !important;grid-template-columns:1fr 1fr !important;gap:12px !important;margin-bottom:12px !important;">
              <div>
                <label for="ghCbFirstFooter" style="display:block !important;font-size:12px !important;font-weight:600 !important;color:rgba(255,255,255,0.7) !important;margin-bottom:4px !important;">First name</label>
                <input id="ghCbFirstFooter" name="First Name" required autocomplete="given-name" style="width:100% !important;padding:10px 12px !important;border:1.5px solid #d1d5db !important;border-radius:8px !important;font-size:15px !important;font-family:inherit !important;outline:none !important;background:#fff !important;">
              </div>
              <div>
                <label for="ghCbLastFooter" style="display:block !important;font-size:12px !important;font-weight:600 !important;color:rgba(255,255,255,0.7) !important;margin-bottom:4px !important;">Last name</label>
                <input id="ghCbLastFooter" name="Last Name" required autocomplete="family-name" style="width:100% !important;padding:10px 12px !important;border:1.5px solid #d1d5db !important;border-radius:8px !important;font-size:15px !important;font-family:inherit !important;outline:none !important;background:#fff !important;">
              </div>
            </div>
            <div style="margin-bottom:12px !important;">
              <label for="ghCbPhoneFooter" style="display:block !important;font-size:12px !important;font-weight:600 !important;color:rgba(255,255,255,0.7) !important;margin-bottom:4px !important;">Phone number</label>
              <input id="ghCbPhoneFooter" name="Phone" type="tel" required inputmode="tel" autocomplete="tel" placeholder="(555) 555-5555" style="width:100% !important;padding:10px 12px !important;border:1.5px solid #d1d5db !important;border-radius:8px !important;font-size:15px !important;font-family:inherit !important;outline:none !important;background:#fff !important;">
            </div>
            <div style="margin-bottom:12px !important;">
              <label for="ghCbTimeFooter" style="display:block !important;font-size:12px !important;font-weight:600 !important;color:rgba(255,255,255,0.7) !important;margin-bottom:4px !important;">Best time to call</label>
              <select id="ghCbTimeFooter" name="Best Time" style="width:100% !important;padding:10px 12px !important;border:1.5px solid #d1d5db !important;border-radius:8px !important;font-size:15px !important;font-family:inherit !important;outline:none !important;background:#fff !important;">
                <option value="Morning (9am-12pm)">Morning (9am&ndash;12pm)</option>
                <option value="Afternoon (12pm-4pm)">Afternoon (12pm&ndash;4pm)</option>
                <option value="Evening (4pm-7pm)">Evening (4pm&ndash;7pm)</option>
                <option value="Anytime" selected>Anytime</option>
              </select>
            </div>
            <button type="submit" style="width:100% !important;padding:14px !important;background:#67e8f9 !important;color:#0a3040 !important;border:none !important;border-radius:10px !important;font-size:16px !important;font-weight:700 !important;cursor:pointer !important;letter-spacing:-0.01em !important;">Request Callback</button>
          </form>
        </div>
      </div>
      <p style="text-align:center !important;font-size:15px !important;color:rgba(255,255,255,0.7) !important;margin:0 !important;">Prefer to just talk? <a href="tel:8287613326" style="color:#67e8f9 !important;font-weight:700 !important;text-decoration:none !important;">(828) 761-3326</a></p>
      <div style="font-size:10px !important;font-weight:700 !important;color:rgba(255,255,255,0.45) !important;text-align:center !important;letter-spacing:0.07em !important;text-transform:uppercase !important;margin-top:14px !important;">No pressure &middot; No sales pitch &middot; Your data never sold</div>
    </div>
  </div>
</div>
<div class="aeo-disclaimer">
  <p><strong>Compliance disclaimer:</strong> We do not offer every plan available in your area. Please contact Medicare.gov or 1-800-MEDICARE (1-800-633-4227) for information on all of your options. GenerationHealth.me and Robert Simm are independent agents not affiliated with or endorsed by the U.S. government or the federal Medicare program. This is a solicitation of insurance. A licensed agent may contact you. Information on this page is for educational purposes only and should not be considered legal or financial advice. Plan availability, premiums, and benefits vary by location and carrier.</p>
</div>
<div class="aeo-footer-meta">
  <div><strong>Published:</strong> April 9, 2026 &middot; <strong>Last Updated:</strong> May 3, 2026 &middot; <strong>Next Review:</strong> November 3, 2026</div>
  <div><strong>Reviewed By:</strong> Robert Simm, Licensed Medicare Broker, NC #10447418</div>
  <div>&copy; 2026 GenerationHealth.me &middot; <a href="https://generationhealth.me">generationhealth.me</a></div>
</div>
</body>
</html>
`;
