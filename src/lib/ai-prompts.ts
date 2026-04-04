// @ts-nocheck
// 32 AI Prompt Functions — section-by-section generation
import { buildFullPagePrompt } from './ai-prompt-build';

export const AI_PROMPTS: Record<string, (...args: any[]) => string> = {

// ─── PAGE BUILDING (10) ───────────────────────────────────────────────────

fullpage:function(s,t,h,scan,pages,title){return buildFullPagePrompt(s,t,title);},

hero:function(s,t){return "Generate a complete hero section for:\nSLUG: "+s+"\nPAGE TYPE: "+t+"\n\nOutput the full <section class=\"gh-hero\"> including:\n- gh-eyebrow with county + 2026 + No SSN Required\n- h1.gh-h1 with gh-h1-line1 (white) and gh-h1-line2 (blue)\n- p.gh-hero-sub (NEPQ subtitle, max 22 words, name the pain)\n- gh-hero-actions with call button (tel:828-761-3326) and compare button\n- gh-creds strip (License #10447418, AHIP Certified, 5.0 rating, phone)\n\nInclude the phone SVG icon. NEPQ tone: consequence-first.";},

instant:function(s,t){return "Generate an instant answer block:\nSLUG: "+s+"\nPAGE TYPE: "+t+"\n\nOutput:\n<div class=\"gh-answer\">\n  <span class=\"gh-answer-label\">Quick Answer</span>\n  <p>[2-4 sentences answering the primary question. Include 2026 figures. AI-citable format. Lead with the problem fact, not the service.]</p>\n</div>\n\nThis must be speakable by AI assistants. Use specific numbers.";},

faq:function(s,t){return "Generate 6 FAQs with schema:\nSLUG: "+s+"\nPAGE TYPE: "+t+"\n\nOutput TWO things:\n\n1. JSON-LD FAQPage schema:\n<script type=\"application/ld+json\">\n{\"@context\":\"https://schema.org\",\"@type\":\"FAQPage\",\"mainEntity\":[...]}\n<\/script>\n\n2. HTML FAQ section:\n<div class=\"gh-faq\">\n  <h2>Common Questions About [Topic]</h2>\n  [6 details.gh-faq-item with summary.gh-faq-q and div.gh-faq-a]\n</div>\n\nQuestions should be what real people ask. Answers 2-3 sentences with 2026 figures.";},

cta:function(s,t){var link=t==="aca"?"https://www.healthsherpa.com/?_agent_id=robert-simm":"https://www.sunfirematrix.com/app/consumer/medicareadvocates/10447418/";return "Generate a CTA modal:\nSLUG: "+s+"\nPAGE TYPE: "+t+"\nCOMPARE LINK: "+link+"\nCALENDLY: https://calendly.com/robert-generationhealth/new-meeting\n\nOutput:\n<div class=\"gh-cta-modal\">\n  <div class=\"gh-cta-hd\">\n    <h2>[Vision headline - what does it look like when this goes right?]</h2>\n    <p>Licensed · Independent · All Carriers · Your Data Never Sold</p>\n  </div>\n  <div class=\"gh-cta-grid\">\n    <div class=\"gh-cta-card\">\n      <h3>Compare Plans Side by Side</h3>\n      <p>[Value prop]</p>\n      <a href=\"[COMPARE LINK]\" class=\"gh-ghost gh-ghost--primary gh-ghost--compare\">Compare Plans →</a>\n    </div>\n    <div class=\"gh-cta-card\">\n      <h3>Talk to Rob Directly</h3>\n      <p>[Vision bridge - doctors verified, drugs priced, no strangers]</p>\n      <a href=\"tel:828-761-3326\" class=\"gh-ghost gh-ghost--call\">📞 Call 828-761-3326</a>\n      <a href=\"sms:828-761-3326\" class=\"gh-ghost gh-ghost--text\">💬 Text Us</a>\n      <a href=\"https://calendly.com/robert-generationhealth/new-meeting\" class=\"gh-ghost gh-ghost--sched\">📅 Book a Call</a>\n    </div>\n  </div>\n</div>\n\nNEPQ tone: vision bridge, not sales pitch.";},

related:function(s,t,h,scan,pages){var pageList=(pages||[]).slice(0,20).join(", ");return "Generate 4-6 related links:\nSLUG: "+s+"\nPAGE TYPE: "+t+"\nEXISTING PAGES: "+pageList+"\n\nOutput:\n<div class=\"gh-related\">\n  <h3>Related Guides</h3>\n  <div class=\"gh-related-grid\">\n    <a href=\"https://generationhealth.me/[slug]/\" class=\"gh-rlink\">[Link Text]</a>\n    [4-6 total links]\n  </div>\n</div>\n\nOnly link to pages that exist. Match the page type context.";},

coststrip:function(s,t){var figures=t==="aca"?"Subsidy Cliff: $62,600 (400% FPL), CSR Cutoff: $39,125 (250% FPL), Bronze Deductible: ~$7,500, OOP Max: $10,600":"Part B Premium: $202.90/mo, Part D Cap: $2,100, MA OOP Max: $9,350, Part B Deductible: $283";return "Generate a 2026 cost strip:\nSLUG: "+s+"\nPAGE TYPE: "+t+"\nFIGURES: "+figures+"\n\nOutput:\n<div class=\"gh-costs\">\n  <div class=\"gh-costs-hd\">\n    <h3>2026 "+(t==="aca"?"ACA Marketplace":"Medicare")+" Figures — North Carolina</h3>\n    <p>Source: "+(t==="aca"?"HHS.gov":"CMS.gov")+"</p>\n  </div>\n  <div class=\"gh-costs-grid\">\n    [4 gh-cost-box elements with gh-cost-label, gh-cost-val, gh-cost-note]\n  </div>\n  <div class=\"gh-costs-src\"><p>Source citation with .gov link</p></div>\n</div>";},

table:function(s,t){return "Generate a comparison table:\nSLUG: "+s+"\nPAGE TYPE: "+t+"\n\nInfer what to compare from the slug. Use 2026 data.\n\nOutput options:\n\nA) Side-by-side cards:\n<div class=\"gh-comparison\">\n  <div class=\"gh-comparison-card\"><h3>[Option A]</h3>[gh-comp-item rows]</div>\n  <div class=\"gh-comparison-card\"><h3>[Option B]</h3>[gh-comp-item rows]</div>\n</div>\n\nB) HTML table:\n<table class=\"gh-compare-table\">...</table>\n\nInclude specific dollar amounts and 2026 figures.";},

tips:function(s,t){return "Generate an expert tip block:\nSLUG: "+s+"\nPAGE TYPE: "+t+"\n\nOutput:\n<div class=\"gh-tip\">\n  <div class=\"gh-tip-header\">💡 Expert Tip from Rob Simm</div>\n  <p>[First-person practical insight. Something you wouldn't find on Medicare.gov or Healthcare.gov. 2-4 sentences. Specific to this topic.]</p>\n</div>\n\nMake it genuinely useful insider knowledge.";},

warnings:function(s,t){return "Generate a warning/alert box:\nSLUG: "+s+"\nPAGE TYPE: "+t+"\n\nDetermine if amber (deadline/penalty) or red (critical/irreversible) is appropriate.\n\nAmber:\n<div class=\"gh-warning\">\n  <div class=\"gh-warning-header\">⚠️ [Warning Title]</div>\n  <p>[Warning body - cite specific dates or dollar amounts]</p>\n</div>\n\nRed:\n<div class=\"gh-alert-critical\">\n  <div class=\"gh-warning-header\">🚨 [Alert Title]</div>\n  <p>[Alert body - high stakes, irreversible]</p>\n</div>";},

// ─── ZONE CARDS / NEPQ (3) ───────────────────────────────────────────────

zonecards:function(s,t){return "Generate 8 custom NEPQ zone cards for:\nSLUG: "+s+"\nPAGE TYPE: "+t+"\n\nFor each zone (Z1-Z8), provide:\n- Zone ID\n- NEPQ Stage (Problem Awareness, Solution Awareness, Harvest, Committing)\n- Tag (category label)\n- Tagline (brief context)\n- Question (Q) - what the reader is thinking\n- Answer (A) - NEPQ-toned response\n\nFormat as JSON array:\n[\n  {\"zone\":\"Z1\",\"stage\":\"Problem Awareness\",\"tag\":\"Hidden Cost\",\"tagline\":\"What they don't tell you\",\"q\":\"Am I paying too much?\",\"a\":\"Here's what most people discover too late...\"}\n]\n\nMake each card specific to the page topic. Use 2026 figures.";},

zoneorder:function(s,t,h){return "Analyze optimal zone placement:\nSLUG: "+s+"\nPAGE TYPE: "+t+"\nPAGE HTML: "+(h?h.substring(0,1500):"[None provided]")+"\n\nRecommend which NEPQ stage should go at which scroll depth:\n\n- Z1-Z2 (top 25%): Usually Problem Awareness\n- Z3-Z4 (25-50%): Usually Solution Awareness\n- Z5-Z6 (50-75%): Usually Harvest\n- Z7-Z8 (bottom 25%): Usually Committing\n\nOutput reasoning for each zone placement based on page content flow.";},

tonescore:function(h){return "Score this content for NEPQ tone:\n\n"+(h?h.substring(0,3000):"[No content provided]")+"\n\nRate 1-10 on:\n1. Consequence-first (vs feature-first)\n2. Question-driven (vs statement-driven)\n3. Specificity (uses real numbers, dates, scenarios)\n4. Local relevance (NC, Durham, Wake references)\n5. Warmth without jargon\n\nProvide overall score and specific rewrites for weak sections.";},

// ─── SCANNER & FIXES (4) ─────────────────────────────────────────────────

batchfix:function(s,t,h,scanResults){var fails=scanResults&&scanResults.checks?scanResults.checks.filter(function(c){return !c.pass;}).map(function(c){return c.label;}):[]; return "Fix these scanner failures:\nSLUG: "+s+"\nPAGE TYPE: "+t+"\nFAILED CHECKS:\n"+fails.join("\n")+"\n\nFor each failure, output the HTML patch to fix it. Use correct 2026 figures and GH template classes.";},

wordboost:function(s,t,h){return "Expand this content to 1,500+ words:\nSLUG: "+s+"\nPAGE TYPE: "+t+"\n\nCURRENT CONTENT:\n"+(h?h.substring(0,4000):"[No content]")+"\n\nAdd:\n- More scenarios and examples\n- NC-specific angles (Durham, Wake, Research Triangle)\n- 2026 figures throughout\n- Expert tips from Rob\n- Common questions people ask\n\nMaintain NEPQ tone. Output the expanded sections.";},

update2026:function(h){return "Update all figures to 2026:\n\n"+(h?h.substring(0,5000):"[No content]")+"\n\nCORRECT 2026 MEDICARE:\n- Part B premium: $202.90/month (was $185 in 2025)\n- Part B deductible: $283\n- Part A deductible: $1,736\n- Part D OOP cap: $2,100 (NEW for 2026)\n- MA OOP max: $9,350\n- Insulin cap: $35/month\n\nCORRECT 2026 ACA:\n- Subsidy cliff: $62,600 (400% FPL, single)\n- CSR threshold: $39,125 (250% FPL)\n- OOP max: $10,600\n\nOutput find/replace pairs and updated HTML.";},

missinggen:function(s,t,h,scanResults){var missing=scanResults&&scanResults.checks?scanResults.checks.filter(function(c){return !c.pass;}).map(function(c){return c.id;}):[]; return "Generate missing elements:\nSLUG: "+s+"\nPAGE TYPE: "+t+"\nMISSING: "+missing.join(", ")+"\n\nGenerate HTML for each missing element using GH template classes. Include:\n- .gh-answer block if missing\n- FAQPage schema if missing\n- HowTo schema or <ol> if missing\n- Internal links if needed\n- .gov source citations if needed\n- Phone 828-761-3326 if missing\n- SunFire/HealthSherpa links if missing";},

// ─── SEO & LINKING (4) ───────────────────────────────────────────────────

intlinks:function(s,t,h,scan,pages){var pageList=(pages||[]).join("\n");return "Generate internal links:\nSLUG: "+s+"\nPAGE TYPE: "+t+"\n\nAVAILABLE PAGES:\n"+pageList+"\n\nCURRENT CONTENT:\n"+(h?h.substring(0,2000):"[None]")+"\n\nSuggest 4-8 internal links with:\n1. Anchor text\n2. Target URL\n3. Where to place in content\n4. Why it's relevant\n\nOutput as HTML: <a href=\"https://generationhealth.me/[slug]/\" class=\"gh-inline\">[anchor]</a>";},

schema:function(s,t,title){var pageTitle=title||s.replace(/-/g," ").replace(/\\b\\w/g,function(l){return l.toUpperCase();});return "Generate JSON-LD schema:\nSLUG: "+s+"\nPAGE TYPE: "+t+"\nTITLE: "+pageTitle+"\n\nOutput <script type=\"application/ld+json\"> with @graph containing:\n- LocalBusiness (GenerationHealth)\n- Person (Robert Simm with credentials)\n- Article or MedicalWebPage\n- Service (Medicare/ACA advisory)\n- FAQPage (if FAQs exist)\n- BreadcrumbList\n- Review (3 reviews from Google)\n\nUse correct 2026 date and all contact info.";},

cannibal:function(s,t,h,scan,pages){var pageList=(pages||[]).join("\n");return "Cannibalization analysis:\nSLUG: "+s+"\nPAGE TYPE: "+t+"\n\nEXISTING PAGES:\n"+pageList+"\n\nAnalyze:\n1. Which existing pages target similar keywords?\n2. Risk level (Low/Medium/High)\n3. Which page should be the primary?\n4. Recommendations (merge, differentiate, redirect)\n\nBe specific about keyword overlap.";},

redirects:function(oldSlug,newSlug){return "Generate redirect rules:\nOLD: "+oldSlug+"\nNEW: "+newSlug+"\n\nOutput:\n1. .htaccess rule\n2. WordPress PHP redirect\n3. Rank Math/Yoast redirect format\n4. Any internal links that need updating";},

// ─── CONTENT STRATEGY (5) ────────────────────────────────────────────────

gapanalysis:function(s,t){return "Competitor gap analysis:\nSLUG: "+s+"\nPAGE TYPE: "+t+"\n\nAnalyze what top-ranking pages for this topic typically include that GenerationHealth might be missing:\n\n1. Content sections competitors have\n2. Questions they answer\n3. Tables/comparisons they include\n4. Local angles (NC-specific)\n5. Trust signals\n\nFor each gap, suggest specific content to add with GH template classes.";},

cluster:function(s,t){return "Cluster planning:\nPILLAR: "+s+"\nPAGE TYPE: "+t+"\n\nDesign a content cluster with:\n1. Pillar page (comprehensive guide)\n2. 6-10 supporting posts (specific subtopics)\n3. Internal linking structure\n4. Keyword targets for each\n\nFormat:\nPILLAR: [slug] - [title] - [primary keyword]\nSUPPORT:\n- [slug] - [title] - [keyword] → links to pillar\n- [slug] - [title] - [keyword] → links to pillar";},

calendar:function(t){return "Seasonal content calendar for "+(t||"Medicare")+"\n\nGenerate a 12-month content calendar with:\n\nKEY PERIODS:\n- AEP (Oct 15 - Dec 7): Medicare Annual Enrollment\n- OEP (Jan 1 - Mar 31): Medicare Open Enrollment\n- ACA OEP (Nov 1 - Jan 15): ACA Open Enrollment\n- SEP triggers: Year-round special enrollment\n\nFor each month, suggest:\n1. Primary content focus\n2. Blog posts to publish\n3. Pages to update\n4. GBP posts to schedule";},

pagedetect:function(s){return "Detect page type:\nSLUG: "+s+"\n\nRules:\n- MEDICARE: medicare, medigap, part-d, part-a, part-b, advantage, plan-g, plan-n, supplement, 65\n- ACA: aca, marketplace, subsidy, bronze, silver, gold, platinum, obamacare, healthcare-gov\n- DUAL: health-insurance (without aca/medicare), broker, agent, individual, self-employed, family\n- BROKER: finding broker, how to choose, compare brokers\n\nOutput JSON:\n{\"pageType\":\"medicare|aca|dual|broker\",\"confidence\":0.95,\"reasoning\":\"...\",\"primaryAudience\":\"...\",\"suggestedKeywords\":[]}";},

keywords:function(s,t){return "Keyword suggestions:\nSLUG: "+s+"\nPAGE TYPE: "+t+"\n\nGenerate:\n1. Primary keyword (what to rank for)\n2. Secondary keywords (3-5)\n3. Long-tail variations (5-8)\n4. Question keywords (what people ask)\n5. Local variations (NC, Durham, Wake)\n\nFor each, estimate search intent and competition level.";},

// ─── COMPLIANCE & QA (3) ─────────────────────────────────────────────────

stale:function(h){return "Stale content check:\n\n"+(h?h.substring(0,5000):"[No content]")+"\n\nFind:\n1. Outdated figures (2025 or earlier)\n2. Expired dates\n3. Old enrollment periods\n4. Incorrect premiums/deductibles\n\nFor each, provide the stale content and the correct 2026 replacement.";},

phonecheck:function(h){return "Phone number validation:\n\n"+(h?h:"[No content]")+"\n\nCORRECT: (828) 761-3326 or 828-761-3326\nWRONG: 761-3324, 3324, or any other number\n\nFind all phone numbers and flag any that are incorrect.";},

dupecheck:function(s,t,h,scan,pages){var pageList=(pages||[]).join("\n");return "Duplicate content check:\nSLUG: "+s+"\n\nEXISTING PAGES:\n"+pageList+"\n\nAnalyze:\n1. Pages with very similar titles\n2. Pages targeting the same keyword\n3. Pages with overlapping content angles\n4. Recommendations: merge, differentiate, or delete\n\nFlag any that should be consolidated.";},

// ─── VISUAL (3) ──────────────────────────────────────────────────────────

svginfo:function(s,t){var figures=t==="aca"?"Subsidy amounts by income level, metal tier comparison, deductible ranges":"Part B premium history, MA vs Medigap costs, Part D coverage phases";return "Generate an SVG infographic:\nSLUG: "+s+"\nPAGE TYPE: "+t+"\nDATA OPTIONS: "+figures+"\n\nOutput clean SVG with:\n- Width 600px max\n- Colors: #4B9CD3 (blue), #0D9488 (teal), #FFC72C (gold), #16A34A (green)\n- 2026 data\n- Clear labels\n- class=\"gh-chart\" on wrapper\n\nMake it scannable and informative.";},

comparecharts:function(s,t){var comparison=t==="aca"?"Bronze vs Silver vs Gold (premiums, deductibles, OOP max)":"Medicare Advantage vs Medigap (costs by age, coverage gaps, flexibility)";return "Generate a comparison chart:\nSLUG: "+s+"\nPAGE TYPE: "+t+"\nCOMPARISON: "+comparison+"\n\nOutput SVG bar chart or comparison graphic showing:\n- Clear labels\n- 2026 figures\n- Visual hierarchy (winner obvious)\n- GH brand colors\n\nWrap in <div class=\"gh-chart\">...</div>";},

costgraphics:function(s,t){return "Generate cost breakdown graphic:\nSLUG: "+s+"\nPAGE TYPE: "+t+"\n\nCreate SVG showing total annual cost breakdown:\n"+(t==="aca"?"- Premium (monthly × 12)\n- Deductible\n- Copays/coinsurance estimate\n- OOP max scenario":"- Part B premium ($202.90 × 12)\n- Part D premium (varies)\n- Medigap premium (if applicable)\n- Deductibles\n- Copays")+"\n\nShow stacked bar or waterfall chart. Use GH colors. Include total annual cost.";},

};
