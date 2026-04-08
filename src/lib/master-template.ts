// GH Master Template v5.7.3 — THE LAW
// v5.7.3 CHANGE: CSS content escape sequences eliminated.
// All visual characters (arrows, pins, quotes) previously injected via
// CSS ::before pseudo-elements with \XXXX escape sequences are now baked
// directly into HTML markup as <span aria-hidden="true"> elements.
// This prevents Elementor from stripping or double-escaping the characters
// on paste, which caused raw escape codes (e.g. \2192) to render as
// visible text on live pages.
//
// Affected elements fixed:
//   .gh-rlink      → &#x2192; span inside each <a>
//   .gh-clink      → → span inside each <a> (was literal →, now baked in HTML)
//   .gh-col-list li → &#x2192; span inside each <li>
//   .gh-testimonial → &#x201C; span inside .gh-testimonial
//
// Claude fills placeholder values. assembleHTML does string replacement.
// This template is NEVER modified. Only placeholder values change.

export const MASTER_TEMPLATE = `<!DOCTYPE html>
<!-- ═══════════════════════════════════════════════════════════
     PAGE TYPE DETECTION — SET ONE OF THESE:
     
     <!-- PAGE-TYPE: MEDICARE -->
     <!-- PAGE-TYPE: ACA -->
     <!-- PAGE-TYPE: DUAL -->
     <!-- PAGE-TYPE: BROKER -->
     
     DETECTION LOGIC:
     1. Explicit marker above takes priority
     2. Fallback: URL pattern detection
        - DUAL if slug contains: health-insurance (without aca/medicare), 
          broker, agent (without aca/medicare)
        - ACA if slug contains: aca, marketplace
        - Medicare otherwise (default)
     
     DUAL PAGES:
     - Serve both Medicare (65+) and ACA (under 65) audiences
     - Include tri-path instant answer (AI can cite either angle)
     - Fork cards route users to Medicare or ACA sections
     - Both sections get full treatment (pain points + CTA)
     - Schema includes both Service types
     - Footer has combined Medicare + ACA disclaimer
     
     This controls: Schema, CTAs, NEPQ section, Related Guides,
     County Grid, Author Card, Footer disclaimer
     ═══════════════════════════════════════════════════════════ -->

<!-- ═══════════════════════════════════════════════════════════
     67-POINT SCAN — RULE ADDITION v5.7.3
     ───────────────────────────────────────────────────────────
     SCAN RULE: CSS CONTENT ESCAPE BLOCKER (Publish Blocker)
     
     Before Copy HTML, the scan must flag ANY occurrence of the
     pattern:  content:"\\ or content:'\\ in any <style> block.
     
     These are Unicode escape sequences (e.g. \\2192, \\1F4CD,
     \\201C) that Elementor strips or double-escapes on paste,
     causing raw escape codes to render as visible text on the
     live page (e.g. \\2192 appearing before links instead of →).
     
     THE FIX APPLIED IN v5.7.3:
     All visual characters previously injected via CSS ::before
     pseudo-elements are now baked directly into the HTML markup
     as <span aria-hidden="true"> elements with real Unicode
     characters or HTML entities. The CSS rules now use
     content:none to suppress any pseudo-element output.
     
     WHAT THIS RULE CHECKS:
     Regex:  content\\s*:\\s*["']\\\\ 
     If found anywhere in a <style> block → PUBLISH BLOCKED.
     Correct pattern is content:none or content:"" only.
     
     AFFECTED ELEMENTS (all fixed in this version):
     - .gh-rlink  → &#x2192; span inside each <a>
     - .gh-clink  → 📍 span inside each <a>  
     - .gh-col-list li → &#x2192; span inside each <li>
     - .gh-testimonial → &#x201C; span inside .gh-testimonial
     ═══════════════════════════════════════════════════════════ -->
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<!-- ═══════════════════════════════════════════════════════════
     PAGE META — UPDATE EVERY PAGE
     ═══════════════════════════════════════════════════════════ -->
<title>[PAGE TITLE] | GenerationHealth</title>
<meta name="description" content="[PAGE META DESCRIPTION — 150-160 chars. Include primary keyword, county if applicable, and a call to action.]">
<link rel="canonical" href="https://generationhealth.me/[PAGE-SLUG]">


<!-- ═══════════════════════════════════════════════════════════
     SCHEMA MARKUP — v5.7.2 (emoji entities converted to Unicode)
     @graph includes: LocalBusiness · Person · Article · MedicalWebPage
     Service · FAQPage · BreadcrumbList · Review×3
     ClaimReview · SpecialAnnouncement · speakable
     ═══════════════════════════════════════════════════════════ -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [

    {
      "@type": "LocalBusiness",
      "@id": "https://generationhealth.me/#business",
      "name": "GenerationHealth",
      "description": "Independent licensed health insurance advisory serving North Carolina. Medicare, ACA Marketplace, and supplemental coverage.",
      "url": "https://generationhealth.me",
      "telephone": "+1-828-761-3326",
      "email": "robert@generationhealth.me",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "2731 Meridian Pkwy",
        "addressLocality": "Durham",
        "addressRegion": "NC",
        "postalCode": "27713",
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 35.9132,
        "longitude": -78.9381
      },
      "areaServed": { "@type": "State", "name": "North Carolina" },
      "priceRange": "Free",
      "openingHoursSpecification": [
        { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"], "opens": "09:00", "closes": "19:00" },
        { "@type": "OpeningHoursSpecification", "dayOfWeek": "Saturday", "opens": "12:00", "closes": "16:00" }
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "5.0",
        "reviewCount": "20",
        "bestRating": "5"
      }
    },

    {
      "@type": "Person",
      "@id": "https://generationhealth.me/#author",
      "name": "Robert Simm",
      "jobTitle": "Licensed Health Insurance Advisor",
      "description": "Independent licensed Medicare and ACA advisor serving North Carolina. NC License #10447418, NPN #10447418, AHIP Certified.",
      "url": "https://generationhealth.me/about",
      "telephone": "+1-828-761-3326",
      "email": "robert@generationhealth.me",
      "knowsAbout": ["Medicare","Medicare Advantage","Medigap","Part D","ACA Marketplace","Health Insurance","North Carolina Health Insurance"],
      "hasCredential": [
        { "@type": "EducationalOccupationalCredential", "credentialCategory": "license", "name": "NC Insurance License #10447418" },
        { "@type": "EducationalOccupationalCredential", "credentialCategory": "certification", "name": "AHIP Certified" }
      ]
    },

    {
      "@type": "MedicalWebPage",
      "@id": "https://generationhealth.me/[PAGE-SLUG]/#medpage",
      "name": "[PAGE TITLE]",
      "description": "[PAGE META DESCRIPTION]",
      "url": "https://generationhealth.me/[PAGE-SLUG]",
      "author": { "@id": "https://generationhealth.me/#author" },
      "publisher": { "@id": "https://generationhealth.me/#business" },
      "datePublished": "[YYYY-MM-DD]",
      "dateModified": "[YYYY-MM-DD]",
      "medicalAudience": { "@type": "MedicalAudience", "audienceType": "Patient" },
      "about": { "@type": "MedicalCondition", "name": "[MEDICARE: Medicare Insurance Coverage | ACA: ACA Health Insurance Coverage]" },
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": [".gh-answer", ".gh-faq-a"]
      }
    },

    {
      "@type": "Article",
      "@id": "https://generationhealth.me/[PAGE-SLUG]/#article",
      "headline": "[ARTICLE HEADLINE — matches H1, max 110 chars]",
      "description": "[PAGE META DESCRIPTION]",
      "author": { "@id": "https://generationhealth.me/#author" },
      "publisher": { "@id": "https://generationhealth.me/#business" },
      "datePublished": "[YYYY-MM-DD]",
      "dateModified": "[YYYY-MM-DD]",
      "mainEntityOfPage": "https://generationhealth.me/[PAGE-SLUG]"
    },

    {
      "@type": "Service",
      "@id": "https://generationhealth.me/[PAGE-SLUG]/#service",
      "name": "[SERVICE NAME — MEDICARE: Medicare Plan Comparison in Durham County NC | ACA: ACA Plan Comparison in Durham County NC | DUAL: Health Insurance Broker Services in Durham County NC]",
      "description": "[SERVICE DESCRIPTION — what Rob does for clients on this page topic]",
      "provider": { "@id": "https://generationhealth.me/#business" },
      "areaServed": { "@type": "State", "name": "North Carolina" },
      "serviceType": "[MEDICARE: Medicare Insurance Advisory | ACA: ACA Marketplace Advisory | DUAL: Health Insurance Advisory]",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "description": "[MEDICARE: Free Medicare plan comparison and advisory | ACA: Free ACA Marketplace plan comparison and advisory | DUAL: Free Medicare and ACA plan comparison and advisory]"
      }
    },

    <!-- DUAL ONLY: Add second Service for ACA (delete for MEDICARE/ACA pages) -->
    <!-- 
    {
      "@type": "Service",
      "@id": "https://generationhealth.me/[PAGE-SLUG]/#service-medicare",
      "name": "Medicare Plan Comparison in Durham County NC",
      "description": "Free Medicare Advantage, Medigap, and Part D plan comparison for seniors in Durham and Wake County.",
      "provider": { "@id": "https://generationhealth.me/#business" },
      "areaServed": { "@type": "State", "name": "North Carolina" },
      "serviceType": "Medicare Insurance Advisory",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
    },
    {
      "@type": "Service",
      "@id": "https://generationhealth.me/[PAGE-SLUG]/#service-aca",
      "name": "ACA Marketplace Plan Comparison in Durham County NC",
      "description": "Free ACA marketplace plan comparison with subsidy calculation for individuals and families in Durham and Wake County.",
      "provider": { "@id": "https://generationhealth.me/#business" },
      "areaServed": { "@type": "State", "name": "North Carolina" },
      "serviceType": "ACA Marketplace Advisory",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
    },
    -->

    {
      "@type": "FAQPage",
      "@id": "https://generationhealth.me/[PAGE-SLUG]/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "[FAQ QUESTION 1]",
          "acceptedAnswer": { "@type": "Answer", "text": "[FAQ ANSWER 1]" }
        },
        {
          "@type": "Question",
          "name": "[FAQ QUESTION 2]",
          "acceptedAnswer": { "@type": "Answer", "text": "[FAQ ANSWER 2]" }
        },
        {
          "@type": "Question",
          "name": "[FAQ QUESTION 3]",
          "acceptedAnswer": { "@type": "Answer", "text": "[FAQ ANSWER 3]" }
        },
        {
          "@type": "Question",
          "name": "[FAQ QUESTION 4]",
          "acceptedAnswer": { "@type": "Answer", "text": "[FAQ ANSWER 4]" }
        },
        {
          "@type": "Question",
          "name": "[FAQ QUESTION 5]",
          "acceptedAnswer": { "@type": "Answer", "text": "[FAQ ANSWER 5]" }
        },
        {
          "@type": "Question",
          "name": "[FAQ QUESTION 6]",
          "acceptedAnswer": { "@type": "Answer", "text": "[FAQ ANSWER 6]" }
        }
      ]
    },

    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://generationhealth.me" },
        { "@type": "ListItem", "position": 2, "name": "[BREADCRUMB CATEGORY — e.g. Medicare NC]", "item": "https://generationhealth.me/[CATEGORY-SLUG]" },
        { "@type": "ListItem", "position": 3, "name": "[BREADCRUMB PAGE]", "item": "https://generationhealth.me/[PAGE-SLUG]" }
      ]
    },

    {
      "@type": "Review",
      "itemReviewed": { "@id": "https://generationhealth.me/#business" },
      "author": { "@type": "Person", "name": "[REVIEWER 1 FIRST NAME + COUNTY — e.g. Carol, Durham County]" },
      "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
      "reviewBody": "[REVIEW 1 TEXT — pull from Google reviews]"
    },
    {
      "@type": "Review",
      "itemReviewed": { "@id": "https://generationhealth.me/#business" },
      "author": { "@type": "Person", "name": "[REVIEWER 2 FIRST NAME + COUNTY]" },
      "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
      "reviewBody": "[REVIEW 2 TEXT]"
    },
    {
      "@type": "Review",
      "itemReviewed": { "@id": "https://generationhealth.me/#business" },
      "author": { "@type": "Person", "name": "[REVIEWER 3 FIRST NAME + COUNTY]" },
      "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
      "reviewBody": "[REVIEW 3 TEXT]"
    },

    {
      "@type": "ClaimReview",
      "@id": "https://generationhealth.me/[PAGE-SLUG]/#claim",
      "url": "https://generationhealth.me/[PAGE-SLUG]",
      "claimReviewed": "[KEY FACTUAL CLAIM ON THIS PAGE — e.g. Medicare agents are paid by carriers, not by you]",
      "author": { "@id": "https://generationhealth.me/#author" },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5",
        "bestRating": "5",
        "alternateName": "True"
      }
    },

    {
      "@type": "SpecialAnnouncement",
      "@id": "https://generationhealth.me/[PAGE-SLUG]/#announcement",
      "name": "[ANNOUNCEMENT TITLE — MEDICARE: 2026 Medicare Plan Changes Now in Effect | ACA: 2026 ACA Open Enrollment Information]",
      "text": "[ANNOUNCEMENT TEXT — MEDICARE: 2026 Part B premium is $202.90/mo. Part D OOP cap is $2,100. MA OOP max is $9,350. | ACA: 2026 enhanced subsidies expired. Subsidy cliff at 400% FPL ($62,600 single). OEP: Nov 1 – Jan 15.]",
      "datePosted": "[YYYY-MM-DD]",
      "expires": "2026-12-31",
      "announcementLocation": { "@id": "https://generationhealth.me/#business" }
    }

  ]
}
</script>


<!-- ═══════════════════════════════════════════════════════════
     FONTS
     ═══════════════════════════════════════════════════════════ -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;0,9..144,700;0,9..144,800;1,9..144,400&display=swap" rel="stylesheet">


<style>
/* ════════════════════════════════════════════════════════════
   GENERATIONHEALTH MASTER TEMPLATE v5.2
   Full standalone document edition
   Elementor widget paste: remove html/head/body tags,
   scope all CSS to .gh-page, keep style+content+script only.

   v5.2 CHANGE: NEPQ copy framework baked in throughout.
   All [BRACKET] placeholders now include NEPQ-annotated
   guidance comments and correct-formula examples.
   CSS and JS are unchanged from v5.1.
   ════════════════════════════════════════════════════════════ */

/* ── TOKENS ── */
:root {
  --white:#FFFFFF; --snow:#FAFBFC; --cloud:#F3F5F7; --mist:#E8ECF0;
  --silver:#C4CDD5; --slate:#6B7B8D; --charcoal:#3A4553; --midnight:#1A2332;
  --blue-50:#EFF6FF; --blue-100:#DBEAFE; --blue-200:#BFDBFE;
  --blue-600:#2563EB; --blue-700:#1D4ED8; --blue-800:#1E3A5F; --blue-900:#0F2440;
  --teal-50:#F0FDFA; --teal-100:#CCFBF1; --teal-500:#14B8A6; --teal-600:#0D9488; --teal-700:#0F766E;
  --nc-blue:#00529B; --nc-gold:#FFC72C; --nc-gold-l:#FFD54F; --nc-gold-m:#E8B830;
  --carolina:#4B9CD3; --carolina-d:#1A5FA0;
  --amber-50:#FFFBEB; --amber-500:#F59E0B; --amber-600:#D97706;
  --success:#16A34A; --success-bg:#F0FDF4;
  --error:#DC2626; --error-bg:#FEF2F2;
  --font-display:'Fraunces',Georgia,'Times New Roman',serif;
  --font-body:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  --prose:720px; --content:980px; --wide:1200px;
  --r-sm:8px; --r-md:12px; --r-lg:16px; --r-xl:20px; --r-2xl:24px; --r-full:100px;
  --sh-xs:0 1px 2px rgba(0,0,0,.04); --sh-sm:0 2px 8px rgba(0,0,0,.06);
  --sh-md:0 4px 20px rgba(0,0,0,.08); --sh-lg:0 8px 32px rgba(0,0,0,.10);
  --sh-xl:0 12px 48px rgba(0,0,0,.12);
  --ease:cubic-bezier(.25,.46,.45,.94);
  --dur-fast:150ms; --dur-normal:250ms; --dur-slow:400ms;
}

/* ── RESET ── */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:var(--font-body);font-size:17px;line-height:1.7;color:var(--midnight);background:var(--white);-webkit-font-smoothing:antialiased;}
a{color:var(--carolina);text-decoration:none;transition:color var(--dur-fast) var(--ease);}
a:hover{color:var(--carolina-d);}
img{max-width:100%;height:auto;}

/* ── ACCESSIBILITY ── */
.gh-skip{position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;}
.gh-skip:focus{position:fixed;left:16px;top:16px;width:auto;height:auto;padding:12px 20px;background:var(--carolina);color:#fff;border-radius:var(--r-md);z-index:9999;font-weight:700;}
:focus-visible{outline:2px solid var(--carolina);outline-offset:3px;}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms !important;transition-duration:.01ms !important;}}

/* ── SHIMMER KEYFRAMES ── */
@keyframes ghShimmer{0%{background-position:200% center;}100%{background-position:-200% center;}}
@keyframes ghSweep{0%{left:-100%;}100%{left:200%;}}

/* ── FONT SIZE TOGGLE ── */
body.gh-font-lg{font-size:19px;}
body.gh-font-lg article p,body.gh-font-lg article li{font-size:19px;}

/* ── LAYOUT ── */
.gh-container{max-width:var(--content);margin:0 auto;padding:0 24px;}
.gh-prose{max-width:var(--prose);}


/* ════════════════════════
   STICKY HEADER
   ════════════════════════ */
.gh-header{position:sticky;top:0;z-index:1000;background:rgba(255,255,255,.96);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid rgba(0,0,0,.06);transition:box-shadow var(--dur-normal) var(--ease);}
.gh-header.scrolled{box-shadow:0 2px 20px rgba(0,0,0,.08);}
.gh-header-inner{max-width:var(--wide);margin:0 auto;padding:0 24px;height:64px;display:flex;align-items:center;justify-content:space-between;}
.gh-logo{font-family:var(--font-display);font-size:22px;font-weight:700;color:var(--midnight);text-decoration:none;letter-spacing:-.02em;}
.gh-logo span{color:var(--teal-600);}
.gh-logo .dot{color:var(--slate);font-weight:500;}
.gh-header-actions{display:flex;align-items:center;gap:12px;}
.gh-header-phone{display:flex;align-items:center;gap:8px;padding:10px 20px;border-radius:var(--r-full);border:1.5px solid rgba(0,0,0,.10);font-size:15px;font-weight:600;color:var(--midnight);text-decoration:none;transition:all var(--dur-normal) var(--ease);}
.gh-header-phone:hover{background:#ECFDF5;border-color:#16A34A;color:#059669;transform:translateY(-1px);box-shadow:0 4px 16px rgba(16,185,129,.25);}
.gh-header-phone svg{width:16px;height:16px;color:var(--success);}
.gh-header-cta{display:inline-flex;align-items:center;padding:10px 24px;border-radius:var(--r-full);background:var(--carolina);color:#fff !important;font-size:15px;font-weight:600;text-decoration:none;position:relative;overflow:hidden;transition:all var(--dur-normal) var(--ease);}
.gh-header-cta::before{content:"";position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(120deg,transparent,rgba(255,255,255,.2),transparent);transform:skewX(-15deg);animation:ghSweep 4s ease-in-out infinite;}
.gh-header-cta:hover{background:var(--carolina-d);transform:translateY(-1px);box-shadow:0 6px 24px rgba(26,95,160,.4);}


/* ════════════════════════
   HERO
   ════════════════════════ */
.gh-hero{position:relative;width:100%;min-height:520px;display:flex;flex-direction:column;justify-content:center;overflow:hidden;background:linear-gradient(165deg,var(--blue-900) 0%,var(--blue-800) 40%,var(--midnight) 100%);}
.gh-hero::before{content:"";position:absolute;top:-15%;right:-8%;width:55%;height:85%;background:radial-gradient(ellipse at 60% 40%,rgba(75,156,211,.18) 0%,rgba(59,130,246,.08) 50%,transparent 75%);pointer-events:none;}
.gh-hero::after{content:"";position:absolute;bottom:-10%;left:-5%;width:40%;height:50%;background:radial-gradient(ellipse,rgba(20,184,166,.06) 0%,transparent 70%);pointer-events:none;}
.gh-hero-inner{position:relative;z-index:2;max-width:var(--wide);margin:0 auto;padding:72px 80px 48px;width:100%;}
.gh-eyebrow{display:flex;align-items:center;gap:16px;margin-bottom:24px;}
.gh-eyebrow-text{font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--nc-gold);}
.gh-eyebrow-rule{flex:0 0 80px;height:1px;background:rgba(255,255,255,.25);}
.gh-h1{font-family:var(--font-display);font-size:clamp(38px,5.5vw,68px);font-weight:800;line-height:1.08;letter-spacing:-.025em;margin-bottom:20px;}
.gh-h1-line1{display:block;color:#fff;}
.gh-h1-line2{display:block;color:var(--carolina);}
.gh-hero-sub{font-size:clamp(16px,1.8vw,21px);font-weight:600;color:#fff !important;text-shadow:0 1px 3px rgba(0,0,0,.2);margin-bottom:36px;max-width:560px;}
.gh-hero-actions{display:flex;gap:14px;flex-wrap:wrap;}
/* Shimmer hero buttons */
.gh-hero-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:16px 36px;border-radius:var(--r-full);font-family:var(--font-body);font-size:16px;font-weight:700;text-decoration:none;border:none;cursor:pointer;transition:all var(--dur-normal) var(--ease);}
.gh-hero-btn--call{background:linear-gradient(120deg,#fff 0%,#fff 35%,#e0f2fe 50%,#fff 65%,#fff 100%);background-size:200% auto;color:var(--carolina) !important;box-shadow:0 4px 20px rgba(0,0,0,.15);animation:ghShimmer 3s linear infinite;}
.gh-hero-btn--call:hover{background:#ECFDF5;color:#059669 !important;transform:translateY(-3px);box-shadow:0 8px 32px rgba(16,185,129,.35);}
.gh-hero-btn--compare{background:linear-gradient(120deg,var(--carolina) 0%,var(--carolina) 35%,#6cb8e6 50%,var(--carolina) 65%,var(--carolina) 100%);background-size:200% auto;color:#fff !important;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,.15);animation:ghShimmer 3.4s linear infinite;}
.gh-hero-btn--compare:hover{background:var(--carolina-d);transform:translateY(-3px);}

/* Credential strip */
.gh-creds{position:relative;z-index:2;max-width:var(--wide);margin:0 auto;width:100%;}
.gh-creds-rule{height:1px;background:rgba(255,255,255,.12);margin:0 80px;}
.gh-creds-inner{display:flex;align-items:center;gap:24px;padding:18px 80px 24px;flex-wrap:wrap;}
.gh-cred{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.7);white-space:nowrap;}
.gh-cred a{color:inherit;text-decoration:none;}
.gh-cred--gold{color:var(--nc-gold);}
.gh-cred--cta{color:var(--carolina);}
.gh-cred--cta a:hover{color:#fff;}
.gh-cred-divider{width:1px;height:14px;background:rgba(255,255,255,.15);}


/* ════════════════════════
   CONTENT TYPOGRAPHY
   ════════════════════════ */
article h2{font-family:var(--font-display);font-size:clamp(26px,3.5vw,34px);font-weight:600;letter-spacing:-.015em;line-height:1.2;color:var(--midnight);margin-top:72px;margin-bottom:20px;}
article h3{font-family:var(--font-body);font-size:clamp(20px,2.5vw,24px);font-weight:600;letter-spacing:-.01em;line-height:1.3;color:var(--midnight);margin-top:48px;margin-bottom:16px;}
article p{font-size:17px;line-height:1.78;color:var(--charcoal);margin-bottom:20px;max-width:var(--prose);}
article ul,article ol{max-width:var(--prose);margin:24px 0;padding:0;list-style:none;}
article li{padding-left:28px;position:relative;margin-bottom:14px;font-size:17px;line-height:1.65;color:var(--charcoal);}
article li::before{content:'';position:absolute;left:0;top:10px;width:8px;height:8px;background:var(--teal-500);border-radius:50%;}
.gh-inline{color:var(--carolina);font-weight:600;}
.gh-inline:hover{color:var(--carolina-d);}
.gh-date{color:var(--nc-gold-m);font-weight:600;}


/* ════════════════════════
   INSTANT ANSWER BLOCK
   AEO / Voice optimized
   ════════════════════════ */
.gh-answer{background:linear-gradient(135deg,#EFF6FF,#DBEAFE);border-left:4px solid var(--carolina);border-radius:var(--r-lg);padding:26px 30px;margin:24px 0 30px;max-width:var(--prose);box-shadow:0 2px 12px rgba(75,156,211,.12);}
.gh-answer-label{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--carolina);margin-bottom:8px;display:block;}
.gh-answer p{font-size:15px;line-height:1.7;color:var(--midnight);margin:0;max-width:none;}


/* ════════════════════════
   DUAL PAGE: FORK CARDS
   Medicare (blue) + ACA (purple)
   ════════════════════════ */
.gh-fork-wrap{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:32px 0 40px;max-width:520px;}
.gh-fork-card{border-radius:var(--r-lg);padding:22px 26px;cursor:pointer;text-decoration:none;display:block;position:relative;overflow:hidden;transition:transform 250ms var(--ease),box-shadow 250ms var(--ease);}
.gh-fork-card::after{content:"";position:absolute;top:0;left:-150%;width:80%;height:100%;background:linear-gradient(120deg,transparent,rgba(255,255,255,.12),transparent);transform:skewX(-15deg);animation:ghSweep 5s ease-in-out infinite;}
.gh-fork-card:hover{transform:translateY(-3px);box-shadow:0 8px 32px rgba(0,0,0,.2);}
.gh-fork-card--medicare{background:linear-gradient(135deg,#185FA5,#0C447C);}
.gh-fork-card--medicare::after{animation-delay:0s;}
.gh-fork-card--aca{background:linear-gradient(135deg,#534AB7,#3C3489);}
.gh-fork-card--aca::after{animation-delay:2.5s;}
.gh-fork-title{font-family:var(--font-display);font-size:18px;font-weight:600;color:#fff !important;margin:0 0 4px;display:block;}
.gh-fork-sub{font-size:13px;color:rgba(255,255,255,.75) !important;margin:0;display:block;}
.gh-fork-arrow{font-size:12px;color:rgba(255,255,255,.6);margin-top:8px;display:block;}


/* ════════════════════════
   DUAL PAGE: CONTENT SECTIONS
   Medicare (blue accent) + ACA (purple accent)
   ════════════════════════ */
.gh-dual-section{background:var(--snow);border-radius:var(--r-xl);padding:40px 44px;margin:48px 0;position:relative;scroll-margin-top:80px;}
.gh-dual-section--medicare{border-left:4px solid #185FA5;}
.gh-dual-section--aca{border-left:4px solid #534AB7;}
.gh-dual-badge{display:inline-block;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:4px 12px;border-radius:var(--r-full);margin-bottom:12px;}
.gh-dual-badge--medicare{background:rgba(24,95,165,.1);color:#185FA5;}
.gh-dual-badge--aca{background:rgba(83,74,183,.1);color:#534AB7;}
.gh-dual-section h2{font-family:var(--font-display);font-size:clamp(22px,3vw,28px);font-weight:600;color:var(--midnight);margin:0 0 8px;}
.gh-dual-section>p{font-size:15px;color:var(--slate);margin:0 0 28px;max-width:none;}


/* ════════════════════════
   DUAL PAGE: CONSEQUENCE LIST
   Pain points with X markers
   ════════════════════════ */
.gh-consequence-list{display:flex;flex-direction:column;gap:14px;margin-bottom:32px;}
.gh-consequence-item{display:flex;align-items:flex-start;gap:12px;}
.gh-consequence-marker{font-size:14px;line-height:1.6;flex-shrink:0;}
.gh-consequence-marker--medicare{color:#185FA5;}
.gh-consequence-marker--aca{color:#534AB7;}
.gh-consequence-text{font-size:15px;line-height:1.6;color:var(--charcoal);margin:0;}


/* ════════════════════════
   DUAL PAGE: FAQ TAGS
   Medicare / ACA / General labels
   ════════════════════════ */
.gh-faq-tag{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:2px 8px;border-radius:var(--r-sm);margin-right:8px;}
.gh-faq-tag--medicare{background:rgba(24,95,165,.1);color:#185FA5;}
.gh-faq-tag--aca{background:rgba(83,74,183,.1);color:#534AB7;}
.gh-faq-tag--general{background:var(--cloud);color:var(--slate);}


/* ════════════════════════
   DUAL PAGE: RESPONSIVE
   ════════════════════════ */
@media(max-width:640px){
  .gh-fork-wrap{grid-template-columns:1fr;gap:12px;}
  .gh-dual-section{padding:28px 24px;}
}


/* ════════════════════════
   BASELINE / COST STRIP
   Dark gradient, 4-item
   ════════════════════════ */
.gh-costs{background:linear-gradient(135deg,var(--blue-800),var(--blue-900));border-radius:var(--r-2xl);padding:44px 48px;margin:40px 0;position:relative;overflow:hidden;}
.gh-costs::before{content:"";position:absolute;top:-20%;right:-10%;width:45%;height:75%;background:radial-gradient(ellipse,rgba(75,156,211,.15) 0%,transparent 70%);pointer-events:none;}
.gh-costs-hd{text-align:center;margin-bottom:28px;position:relative;z-index:2;}
.gh-costs-hd h3{font-family:var(--font-display);font-size:20px;font-weight:700;color:#fff !important;margin:0 0 4px;}
.gh-costs-hd p{color:rgba(255,255,255,.62) !important;font-size:13px;margin:0;max-width:none;}
.gh-costs-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;position:relative;z-index:2;}
.gh-cost-box{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:var(--r-lg);padding:20px 16px;text-align:center;position:relative;overflow:hidden;}
.gh-cost-box::after{content:"";position:absolute;top:0;left:-150%;width:80%;height:100%;background:linear-gradient(120deg,transparent,rgba(255,255,255,.07),transparent);transform:skewX(-15deg);animation:ghSweep 6s ease-in-out infinite;}
.gh-cost-box:nth-child(2)::after{animation-delay:1.5s;}
.gh-cost-box:nth-child(3)::after{animation-delay:3s;}
.gh-cost-box:nth-child(4)::after{animation-delay:4.5s;}
.gh-cost-label{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.55);margin-bottom:6px;}
.gh-cost-val{font-family:var(--font-display);font-size:22px;font-weight:800;color:#fff;display:block;margin-bottom:4px;}
.gh-cost-note{font-size:11px;color:rgba(255,255,255,.5);line-height:1.5;}
.gh-costs-src{margin-top:20px;padding:12px 20px;background:rgba(255,255,255,.06);border-radius:var(--r-md);position:relative;z-index:2;}
.gh-costs-src p{font-size:12px;color:rgba(255,255,255,.55);margin:0;max-width:none;}
.gh-costs-src a{color:rgba(75,156,211,.9);}


/* ════════════════════════
   6-CARD GRID
   ════════════════════════ */
.gh-6grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:28px 0;}
.gh-6card{background:var(--snow);border:1.5px solid rgba(0,0,0,.07);border-radius:var(--r-lg);padding:20px 18px;box-shadow:var(--sh-sm);position:relative;overflow:hidden;transition:transform 200ms var(--ease),box-shadow 200ms var(--ease),border-color 200ms;}
.gh-6card::before{content:"";position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(120deg,transparent,rgba(75,156,211,.08),transparent);transform:skewX(-15deg);transition:left 500ms var(--ease);}
.gh-6card:hover{transform:translateY(-2px);box-shadow:var(--sh-md);border-color:rgba(75,156,211,.25);}
.gh-6card:hover::before{left:150%;}
.gh-6card-icon{font-size:24px;margin-bottom:8px;}
.gh-6card h4{font-size:14px;font-weight:700;color:var(--midnight);margin:0 0 6px;}
.gh-6card p{font-size:13px;line-height:1.6;color:var(--slate);margin:0;max-width:none;}


/* ════════════════════════
   EXPERT TIP — teal
   ════════════════════════ */
.gh-tip{background:linear-gradient(135deg,var(--teal-50),#dcfce7);border-left:4px solid var(--teal-500);border-radius:var(--r-lg);padding:28px 32px;margin:40px 0;max-width:var(--prose);}
.gh-tip-header{display:flex;align-items:center;gap:8px;margin-bottom:10px;font-weight:700;font-size:16px;color:var(--teal-700);}
.gh-tip p{font-size:15px;line-height:1.7;color:var(--teal-700);margin:0;max-width:none;}


/* ════════════════════════
   WARNING — amber
   ════════════════════════ */
.gh-warning{background:linear-gradient(135deg,var(--amber-50),#fff9e6);border-left:4px solid var(--nc-gold-m);border-radius:var(--r-lg);padding:28px 32px;margin:40px 0;max-width:var(--prose);}
.gh-warning-header{font-weight:700;font-size:16px;color:var(--amber-600);margin-bottom:10px;}
.gh-warning p{font-size:15px;line-height:1.7;color:var(--amber-600);margin:0;max-width:none;}


/* ════════════════════════
   CRITICAL ALERT — red
   ════════════════════════ */
.gh-alert-critical{background:linear-gradient(135deg,var(--error-bg),#fee2e2);border-left:4px solid var(--error);border-radius:var(--r-lg);padding:28px 32px;margin:40px 0;max-width:var(--prose);}
.gh-alert-critical .gh-warning-header{color:var(--error);}
.gh-alert-critical p{font-size:15px;line-height:1.7;color:var(--error);margin:0;max-width:none;}


/* ════════════════════════
   FORMULA BOX
   ════════════════════════ */
.gh-formula{background:linear-gradient(135deg,var(--teal-50),#dcfce7);border-left:4px solid var(--teal-500);border-radius:var(--r-lg);padding:26px 30px;margin:36px 0;max-width:var(--prose);}
.gh-formula-label{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--teal-700);margin-bottom:10px;display:block;}
.gh-formula-eq{font-family:var(--font-display);font-size:17px;font-weight:600;color:var(--midnight);line-height:1.5;margin-bottom:10px;}
.gh-formula p{font-size:14px;line-height:1.7;color:var(--teal-700);margin:0;max-width:none;}


/* ════════════════════════
   CTA MODAL
   NC blue gradient
   ════════════════════════ */
.gh-cta-modal{background:linear-gradient(135deg,var(--nc-blue) 0%,#003D73 60%,#002B54 100%);border-radius:var(--r-2xl);padding:52px 44px;margin:56px 0;position:relative;overflow:hidden;}
.gh-cta-modal::before{content:"";position:absolute;top:-20%;right:-10%;width:50%;height:80%;background:radial-gradient(ellipse,rgba(75,156,211,.12) 0%,transparent 70%);pointer-events:none;}
.gh-cta-hd{text-align:center;margin-bottom:36px;position:relative;z-index:2;}
.gh-cta-hd h2{font-family:var(--font-display);font-size:clamp(22px,2.8vw,30px);font-weight:700;color:#fff !important;margin:0 0 8px;}
.gh-cta-hd p{color:rgba(255,255,255,.78) !important;font-size:15px;margin:0;max-width:none;}
.gh-cta-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;position:relative;z-index:2;}
/* Glassmorphism cards with shimmer sweep */
.gh-cta-card{background:linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.04));backdrop-filter:blur(12px);border:1.5px solid rgba(255,255,255,.15);border-radius:var(--r-xl);padding:32px 28px;position:relative;overflow:hidden;transition:border-color 300ms var(--ease),box-shadow 300ms var(--ease);}
.gh-cta-card::after{content:"";position:absolute;top:0;left:-150%;width:80%;height:100%;background:linear-gradient(120deg,transparent,rgba(255,255,255,.07),transparent);transform:skewX(-15deg);animation:ghSweep 5s ease-in-out infinite;}
.gh-cta-card:nth-child(2)::after{animation-delay:2.5s;}
.gh-cta-card:hover{border-color:rgba(255,255,255,.3);box-shadow:0 0 0 1px rgba(75,156,211,.25),0 8px 32px rgba(0,0,0,.2);}
.gh-cta-card h3{font-family:var(--font-display);font-size:20px;font-weight:600;color:#fff !important;margin:0 0 8px;}
.gh-cta-card>p{font-size:14px;color:rgba(255,255,255,.72) !important;line-height:1.6;margin-bottom:20px !important;max-width:none;}
/* Ghost buttons with shimmer sweep */
.gh-ghost{display:block;text-align:center;padding:14px 24px;border-radius:var(--r-full);font-family:var(--font-body);font-size:15px;text-decoration:none !important;margin-bottom:8px;border:1.5px solid rgba(255,255,255,.32);background:transparent;color:#fff !important;font-weight:600;transition:all 280ms var(--ease);position:relative;overflow:hidden;}
.gh-ghost::before{content:"";position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(120deg,transparent,rgba(255,255,255,.18),transparent);transform:skewX(-15deg);animation:ghSweep 3.5s ease-in-out infinite;}
.gh-ghost:last-child{margin-bottom:0;}
.gh-ghost--primary{background:rgba(255,255,255,.1) !important;font-weight:700;}
.gh-ghost--primary::before{animation-delay:.2s;}
.gh-ghost--call::before{animation-delay:.5s;}
.gh-ghost--text::before{animation-delay:1s;}
.gh-ghost--sched::before{animation-delay:1.5s;}
.gh-ghost--call:hover{background:rgba(22,163,74,.3) !important;border-color:rgba(22,163,74,.6) !important;}
.gh-ghost--text:hover{background:rgba(139,92,246,.3) !important;border-color:rgba(139,92,246,.6) !important;}
.gh-ghost--sched:hover{background:rgba(245,158,11,.3) !important;border-color:rgba(245,158,11,.6) !important;}
.gh-ghost--compare:hover{background:rgba(75,156,211,.3) !important;border-color:var(--carolina) !important;}
.gh-ghost-sub{display:block;font-size:11px;margin-top:2px;color:rgba(255,255,255,.55) !important;font-weight:400;}


/* ════════════════════════
   DECISION SCENARIO CARDS
   3-card color-coded
   ════════════════════════ */
.gh-scenarios{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin:32px 0;}
.gh-scenario{border-radius:var(--r-xl);overflow:hidden;box-shadow:var(--sh-md);transition:transform 250ms var(--ease);}
.gh-scenario:hover{transform:translateY(-3px);}
.gh-scenario-hd{padding:20px 22px 14px;position:relative;overflow:hidden;}
.gh-scenario-hd::after{content:"";position:absolute;top:0;left:-150%;width:80%;height:100%;background:linear-gradient(120deg,transparent,rgba(255,255,255,.07),transparent);transform:skewX(-15deg);animation:ghSweep 7s ease-in-out infinite;}
.gh-scenario-hd--blue{background:linear-gradient(135deg,#00529B,#003D73);}
.gh-scenario-hd--green{background:linear-gradient(135deg,#065F46,#047857);}
.gh-scenario-hd--purple{background:linear-gradient(135deg,#4C1D95,#5B21B6);}
.gh-scenario-hd--teal{background:linear-gradient(135deg,#0F766E,#0D9488);}
.gh-scenario-hd--amber{background:linear-gradient(135deg,#92400E,#B45309);}
.gh-scenario-badge{display:inline-block;padding:3px 10px;border-radius:var(--r-full);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;background:rgba(255,255,255,.15);color:rgba(255,255,255,.9);margin-bottom:8px;}
.gh-scenario-hd h4{font-family:var(--font-display);font-size:17px;font-weight:700;color:#fff !important;margin:0;}
.gh-scenario-body{background:var(--white);border:1.5px solid rgba(0,0,0,.07);border-top:none;border-radius:0 0 var(--r-xl) var(--r-xl);padding:20px 22px;}
.gh-scenario-body p{font-size:13px;line-height:1.65;color:var(--charcoal);margin-bottom:12px;max-width:none;}
.gh-verdict{padding:10px 14px;border-radius:var(--r-md);font-size:12px;font-weight:700;color:var(--midnight);}
.gh-verdict--blue{background:var(--blue-50);}
.gh-verdict--green{background:#F0FDF4;}
.gh-verdict--purple{background:#F5F3FF;}
.gh-verdict--teal{background:var(--teal-50);}
.gh-verdict--amber{background:var(--amber-50);}


/* ════════════════════════
   HOW-TO STEPS
   Dark gradient, shimmer
   ════════════════════════ */
.gh-howto{background:linear-gradient(135deg,var(--blue-800),var(--blue-900));border-radius:var(--r-2xl);padding:48px;margin:44px 0;position:relative;overflow:hidden;}
.gh-howto::before{content:"";position:absolute;top:-20%;right:-10%;width:45%;height:75%;background:radial-gradient(ellipse,rgba(75,156,211,.12) 0%,transparent 70%);pointer-events:none;}
.gh-howto-hd{text-align:center;margin-bottom:36px;position:relative;z-index:2;}
.gh-howto-hd h3{font-family:var(--font-display);font-size:clamp(20px,2.4vw,26px);font-weight:700;color:#fff !important;margin:0 0 6px;}
.gh-howto-hd p{color:rgba(255,255,255,.72) !important;font-size:15px;margin:0;max-width:none;}
/* Use 4 or 5 steps — adjust grid-template-columns accordingly */
.gh-steps-4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;position:relative;z-index:2;}
.gh-steps-5{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;position:relative;z-index:2;}
.gh-step{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:var(--r-xl);padding:26px 20px;position:relative;overflow:hidden;}
.gh-step::before{content:"";position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(120deg,transparent,rgba(255,255,255,.07),transparent);transform:skewX(-15deg);animation:ghSweep 4s ease-in-out infinite;}
.gh-step:nth-child(2)::before{animation-delay:.8s;}
.gh-step:nth-child(3)::before{animation-delay:1.6s;}
.gh-step:nth-child(4)::before{animation-delay:2.4s;}
.gh-step:nth-child(5)::before{animation-delay:3.2s;}
.gh-step-num{width:38px;height:38px;border-radius:50%;background:rgba(255,199,44,.2);border:1.5px solid rgba(255,199,44,.5);color:var(--nc-gold);font-weight:800;font-size:17px;display:flex;align-items:center;justify-content:center;margin:0 0 14px;}
.gh-step h4{font-size:14px;font-weight:700;color:#fff !important;margin:0 0 8px;}
.gh-step p{font-size:12px;color:rgba(255,255,255,.68) !important;line-height:1.6;margin:0;max-width:none;}


/* ════════════════════════
   2-COL CARDS
   ════════════════════════ */
.gh-2col{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:28px 0;}
.gh-col-card{background:var(--white);border:1.5px solid rgba(0,0,0,.08);border-radius:var(--r-xl);padding:26px;box-shadow:var(--sh-md);}
.gh-col-card h4{font-size:16px;font-weight:700;color:var(--midnight);margin-bottom:14px;}
.gh-col-list{list-style:none;margin:0 !important;padding:0 !important;}
.gh-col-list li{padding:7px 0 7px 20px !important;position:relative;border-bottom:1px solid rgba(0,0,0,.05);font-size:13px !important;line-height:1.6 !important;color:var(--charcoal) !important;}
.gh-col-list li:last-child{border-bottom:none;}
.gh-col-list li::before{content:none !important;}.gh-col-list-arrow{position:absolute;left:0;top:8px;color:var(--carolina);font-size:12px;line-height:1;pointer-events:none;}


/* ════════════════════════
   TIMING / ENROLLMENT GRID
   ════════════════════════ */
.gh-timing{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:28px 0;}
.gh-timing-card{background:var(--snow);border:1.5px solid rgba(0,0,0,.07);border-radius:var(--r-lg);padding:20px 18px;box-shadow:var(--sh-sm);}
.gh-timing-card.urgent{border-color:var(--error);background:linear-gradient(135deg,#FEF2F2,var(--white));}
.gh-timing-window{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--carolina);margin-bottom:5px;}
.gh-timing-card.urgent .gh-timing-window{color:var(--error);}
.gh-timing-dates{font-family:var(--font-display);font-size:16px;font-weight:700;color:var(--midnight);margin-bottom:7px;}
.gh-timing-card p{font-size:12px;line-height:1.6;color:var(--slate);margin:0;max-width:none;}


/* ════════════════════════
   BAR CHART INFOGRAPHIC
   ════════════════════════ */
.gh-chart{background:linear-gradient(135deg,var(--snow),var(--white));border-radius:var(--r-2xl);padding:56px 48px;margin:64px 0;box-shadow:var(--sh-xl);border:1px solid rgba(0,0,0,.06);}
.gh-chart-header{text-align:center;margin-bottom:40px;}
.gh-chart-header h3{font-family:var(--font-display);font-size:26px;font-weight:600;margin:0 0 8px;color:var(--midnight);}
.gh-chart-header p{font-size:15px;color:var(--slate);margin:0;max-width:none;}
.gh-bar{margin-bottom:16px;padding:24px 28px;background:var(--white);border-radius:var(--r-xl);border:1px solid rgba(0,0,0,.05);box-shadow:var(--sh-xs);transition:transform var(--dur-normal) var(--ease),box-shadow var(--dur-normal);}
.gh-bar:hover{transform:translateY(-2px);box-shadow:var(--sh-sm);}
.gh-bar-top{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:6px;}
.gh-bar-title{font-size:16px;font-weight:600;color:var(--midnight);}
.gh-bar-pct{font-size:22px;font-weight:800;letter-spacing:-.02em;color:var(--midnight);}
.gh-bar-desc{font-size:13px;color:var(--slate);margin-bottom:16px;}
.gh-bar-track{width:100%;height:8px;background:var(--cloud);border-radius:var(--r-full);overflow:hidden;}
.gh-bar-fill{height:100%;border-radius:var(--r-full);}
.gh-bar-fill--blue{background:linear-gradient(90deg,#3B82F6,#60A5FA,#93C5FD);}
.gh-bar-fill--green{background:linear-gradient(90deg,#0D9488,#2DD4BF,#5EEAD4);}
.gh-bar-fill--amber{background:linear-gradient(90deg,#D97706,#FBBF24,#FCD34D);}
.gh-bar-fill--purple{background:linear-gradient(90deg,#7C3AED,#A78BFA,#C4B5FD);}
.gh-chart-source{margin-top:28px;padding:16px 24px;background:var(--blue-50);border-radius:var(--r-md);border-left:4px solid var(--carolina);}
.gh-chart-source p{font-size:13px;color:var(--slate);margin:0;max-width:none;}


/* ════════════════════════
   COMPARISON TABLE
   ════════════════════════ */
.gh-comparison{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:48px 0;}
.gh-comparison-card{background:var(--snow);border:1.5px solid rgba(0,0,0,.08);border-radius:var(--r-xl);padding:32px 28px;box-shadow:var(--sh-md);}
.gh-comparison-card h3{margin:0 0 20px;padding-bottom:16px;border-bottom:3px solid var(--carolina);font-family:var(--font-display);font-size:22px;}
.gh-comp-item{padding:14px 0;border-bottom:1px solid rgba(0,0,0,.06);}
.gh-comp-item:last-child{border-bottom:none;}
.gh-comp-label{font-weight:600;font-size:12px;color:var(--slate);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;}
.gh-comp-value{font-size:15px;line-height:1.5;color:var(--charcoal);}


/* ════════════════════════
   TESTIMONIAL
   ════════════════════════ */
.gh-testimonial{background:var(--white);border:1.5px solid rgba(0,0,0,.08);border-radius:var(--r-xl);padding:36px;margin:48px 0;max-width:var(--prose);box-shadow:var(--sh-md);position:relative;}
.gh-testimonial::before{content:none;}.gh-testimonial-quote{position:absolute;top:-8px;left:24px;font-size:72px;color:var(--carolina);opacity:.2;font-family:Georgia,serif;line-height:1;pointer-events:none;}
.gh-testimonial blockquote{font-style:italic;font-size:16px;line-height:1.75;color:var(--charcoal);margin-bottom:16px;}
.gh-testimonial-author{font-size:14px;font-weight:600;color:var(--slate);}
.gh-testimonial-link{margin-top:12px;font-size:14px;}


/* ════════════════════════
   TRUST LADDER
   4 steps, dark gradient
   ════════════════════════ */
.gh-ladder{background:linear-gradient(135deg,var(--blue-800),var(--blue-900));border-radius:var(--r-2xl);padding:48px;margin:56px 0;position:relative;overflow:hidden;}
.gh-ladder::before{content:"";position:absolute;top:-20%;right:-10%;width:45%;height:75%;background:radial-gradient(ellipse,rgba(75,156,211,.12) 0%,transparent 70%);pointer-events:none;}
.gh-ladder-hd{text-align:center;margin-bottom:40px;position:relative;z-index:2;}
.gh-ladder-hd h3{font-family:var(--font-display);font-size:clamp(20px,2.4vw,26px);font-weight:700;color:#fff !important;margin:0 0 8px;}
.gh-ladder-hd p{color:rgba(255,255,255,.72) !important;font-size:15px;margin:0;max-width:520px;margin-left:auto;margin-right:auto;}
.gh-ladder-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:2px;position:relative;z-index:2;}
.gh-ladder-step{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);padding:26px 20px;text-align:center;}
.gh-ladder-step:first-child{border-radius:var(--r-xl) 0 0 var(--r-xl);}
.gh-ladder-step:last-child{border-radius:0 var(--r-xl) var(--r-xl) 0;}
.gh-ladder-num{width:38px;height:38px;border-radius:50%;background:rgba(75,156,211,.25);border:1.5px solid rgba(75,156,211,.5);color:var(--carolina);font-weight:800;font-size:17px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;}
.gh-ladder-title{font-weight:700;font-size:14px;color:#fff;margin-bottom:7px;}
.gh-ladder-desc{font-size:12px;color:rgba(255,255,255,.62);line-height:1.6;}


/* ════════════════════════
   TRUST STRIP — 3 badges
   ════════════════════════ */
.gh-trust-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin:56px 0;}
.gh-trust-badge{background:var(--snow);border:1px solid rgba(0,0,0,.08);border-radius:var(--r-lg);padding:28px 20px;text-align:center;box-shadow:var(--sh-sm);transition:transform var(--dur-normal) var(--ease);}
.gh-trust-badge:hover{transform:translateY(-2px);}
.gh-trust-badge-icon{font-size:28px;margin-bottom:10px;}
.gh-trust-badge h4{font-family:var(--font-body);font-size:16px;font-weight:700;color:var(--midnight);margin-bottom:4px;}
.gh-trust-badge p{font-size:13px;color:var(--slate);margin:0;max-width:none;}


/* ════════════════════════
   SAVINGS PROGRAMS GRID
   ════════════════════════ */
.gh-programs{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:28px 0;}
.gh-program-card{background:var(--white);border:1.5px solid rgba(0,0,0,.08);border-radius:var(--r-xl);padding:26px;box-shadow:var(--sh-md);position:relative;overflow:hidden;transition:transform 200ms var(--ease),box-shadow 200ms;}
.gh-program-card::before{content:"";position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(120deg,transparent,rgba(75,156,211,.06),transparent);transform:skewX(-15deg);transition:left 500ms var(--ease);}
.gh-program-card:hover{transform:translateY(-2px);box-shadow:var(--sh-lg);}
.gh-program-card:hover::before{left:150%;}
.gh-program-icon{font-size:28px;margin-bottom:10px;}
.gh-program-card h4{font-size:16px;font-weight:700;color:var(--midnight);margin:0 0 8px;}
.gh-program-card p{font-size:13px;line-height:1.65;color:var(--charcoal);margin:0 0 12px;max-width:none;}
.gh-program-limit{display:inline-block;padding:4px 12px;border-radius:var(--r-full);font-size:11px;font-weight:700;background:var(--blue-50);color:var(--carolina);}


/* ════════════════════════
   RELATED LINKS
   ════════════════════════ */
.gh-related{background:var(--snow);border:1px solid rgba(0,0,0,.07);border-radius:var(--r-2xl);padding:40px;margin:56px 0;}
.gh-related>h3{font-family:var(--font-display);font-size:22px;font-weight:600;color:var(--midnight);margin:0 0 24px;}
.gh-related-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;}
.gh-rlink{display:flex;align-items:center;gap:7px;padding:10px 14px;background:var(--white);border:1px solid rgba(0,0,0,.06);border-radius:var(--r-md);font-size:14px;font-weight:500;color:var(--charcoal);text-decoration:none;transition:all 180ms var(--ease);}
.gh-rlink::before{content:none;}.gh-rlink-arrow{color:var(--carolina);font-size:12px;flex-shrink:0;}
.gh-rlink:hover{color:var(--carolina);border-color:var(--carolina);}
.gh-county-hd{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--carolina);margin:24px 0 12px;padding-top:24px;border-top:1px solid var(--mist);}
.gh-county-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;}
.gh-clink{display:flex;align-items:center;gap:5px;padding:9px 12px;background:var(--white);border:1px solid rgba(0,0,0,.06);border-radius:var(--r-md);font-size:13px;font-weight:600;color:var(--carolina);text-decoration:none;transition:all 180ms var(--ease);}
.gh-clink:hover{background:var(--blue-50);border-color:var(--carolina);}
.gh-clink::before{content:none;}.gh-clink-pin{font-size:10px;}


/* ════════════════════════
   AUTHOR CARD
   ════════════════════════ */
.gh-author{max-width:920px;margin:64px auto 32px;border:1px solid rgba(0,0,0,.08);border-radius:var(--r-xl);background:var(--white);box-shadow:var(--sh-lg);overflow:hidden;}
.gh-author-header{background:linear-gradient(135deg,var(--blue-600),var(--blue-700));color:#fff;padding:40px 36px;text-align:center;}
.gh-author-header h2{font-family:var(--font-display);font-size:26px;font-weight:700;color:#fff !important;margin:0 0 8px;}
.gh-author-header p{font-size:15px;color:rgba(255,255,255,.9) !important;margin:0 0 6px;max-width:none;}
.gh-author-stars{display:inline-block;margin-top:14px;padding:8px 20px;background:rgba(255,255,255,.18);border-radius:var(--r-sm);font-size:14px;color:#fff;}
.gh-author-contact-row{display:flex;flex-wrap:wrap;justify-content:center;gap:20px;margin-top:14px;font-size:14px;}
.gh-author-contact-row a{color:#fff !important;}
.gh-author-body{padding:40px 36px;}
.gh-author-body h3{font-family:var(--font-body);font-size:20px;font-weight:700;color:var(--blue-600);padding-bottom:10px;border-bottom:3px solid var(--blue-600);margin:0 0 16px;}
.gh-author-body p{font-size:15px;line-height:1.65;color:var(--charcoal);margin-bottom:14px;max-width:none;}
.gh-contact-box{background:var(--snow);padding:24px;border-radius:var(--r-md);margin:24px 0;}
.gh-contact-box h3{font-size:17px;margin-bottom:12px;border-bottom:none !important;padding-bottom:0 !important;}
.gh-contact-box p{font-size:14px;margin:0 0 8px;}
.gh-contact-box a{color:var(--carolina);font-weight:600;}
.gh-hours-box{background:var(--blue-50);padding:20px 24px;border-radius:var(--r-md);border-left:4px solid var(--blue-600);margin:24px 0;}
.gh-hours-box h3{font-size:17px;margin-bottom:12px;border-bottom:none !important;padding-bottom:0 !important;}
.gh-hours-box p{font-size:14px;margin:0 0 8px;}
.gh-license-box{background:#FEF3C7;padding:18px 22px;border-radius:var(--r-md);border-left:4px solid var(--amber-500);margin:24px 0;}
.gh-license-box p{font-size:14px;margin:0;}
.gh-license-box a{color:var(--carolina);font-weight:600;}
.gh-disclaimer{margin-top:24px;}
.gh-disclaimer h3{font-size:17px;margin-bottom:12px;}
.gh-disclaimer p{font-size:13px;line-height:1.7;color:rgba(26,35,50,.7);margin-bottom:8px;}


/* ════════════════════════
   FAQ — native <details>
   ════════════════════════ */
.gh-faq{margin:72px 0;max-width:var(--prose);}
.gh-faq-title{font-family:var(--font-display);font-size:clamp(26px,3vw,34px);font-weight:600;color:var(--midnight);margin-bottom:8px;}
.gh-faq-sub{font-size:16px;color:var(--slate);margin-bottom:32px;}
.gh-faq-list{display:flex;flex-direction:column;gap:8px;}
.gh-faq-item{background:var(--white);border:1.5px solid var(--mist);border-radius:var(--r-lg);overflow:hidden;transition:border-color 180ms,box-shadow 180ms;}
.gh-faq-item[open]{border-color:var(--carolina);box-shadow:var(--sh-md);}
.gh-faq-q{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:20px 22px;font-size:16px;font-weight:600;color:var(--midnight);cursor:pointer;list-style:none;}
.gh-faq-q::-webkit-details-marker{display:none;}
.gh-faq-q:hover{color:var(--carolina);}
.gh-faq-chev{width:18px;height:18px;flex-shrink:0;color:var(--silver);transition:transform 280ms var(--ease),color 150ms;}
.gh-faq-item[open] .gh-faq-chev{transform:rotate(180deg);color:var(--carolina);}
.gh-faq-a{padding:0 22px 20px;font-size:15px;line-height:1.7;color:var(--charcoal);}
.gh-faq-a p{font-size:15px;color:var(--charcoal);margin:0 0 8px !important;max-width:none;}
.gh-faq-a p:last-child{margin-bottom:0 !important;}


/* ════════════════════════
   FOOTER
   ════════════════════════ */
.gh-last-updated{background:var(--cloud);padding:16px 24px;border-radius:var(--r-md);font-size:14px;color:var(--slate);text-align:center;margin:32px 0;}
.gh-footer-trust{max-width:var(--content);margin:0 auto;padding:48px 24px;border-top:1px solid var(--mist);text-align:center;}
.gh-footer-trust p{font-size:13px;color:var(--silver);line-height:1.7;margin-bottom:8px;max-width:640px;margin-left:auto;margin-right:auto;}
.gh-footer-trust a{color:var(--carolina);}


/* ════════════════════════
   FLOATING CALL BUTTON
   Mobile only
   ════════════════════════ */
.gh-float-call{display:none;position:fixed;bottom:24px;right:24px;z-index:999;width:60px;height:60px;border-radius:50%;background:var(--success);color:#fff;border:none;box-shadow:0 6px 24px rgba(22,163,74,.4);cursor:pointer;align-items:center;justify-content:center;transition:transform var(--dur-normal) var(--ease),box-shadow var(--dur-normal);text-decoration:none;}
.gh-float-call:hover{transform:scale(1.08);box-shadow:0 8px 32px rgba(22,163,74,.5);}
.gh-float-call svg{width:26px;height:26px;}
@keyframes float-pulse{0%,100%{box-shadow:0 6px 24px rgba(22,163,74,.4);}50%{box-shadow:0 6px 24px rgba(22,163,74,.4),0 0 0 12px rgba(22,163,74,.12);}}
.gh-float-call.pulse{animation:float-pulse 2s ease-in-out 1;}


/* ════════════════════════
   RESPONSIVE — 768px
   ════════════════════════ */
@media(max-width:768px){
  .gh-header-inner{height:56px;padding:0 16px;}
  .gh-header-cta{display:none;}
  .gh-header-phone .phone-text{display:none;}
  .gh-header-phone{padding:8px 12px;border-color:var(--success);}
  .gh-hero{min-height:420px;}
  .gh-hero-inner{padding:48px 24px 32px;}
  .gh-hero-actions{flex-direction:column;}
  .gh-hero-btn{width:100%;justify-content:center;}
  .gh-creds-rule{margin:0 24px;}
  .gh-creds-inner{padding:14px 24px 20px;gap:10px;}
  .gh-cred{font-size:11px;}
  .gh-cred-divider{display:none;}
  .gh-costs{padding:28px 18px;}
  .gh-costs-grid{grid-template-columns:1fr 1fr;}
  .gh-6grid{grid-template-columns:1fr 1fr;}
  .gh-2col{grid-template-columns:1fr;}
  .gh-comparison{grid-template-columns:1fr;}
  .gh-timing{grid-template-columns:1fr 1fr;}
  .gh-chart{padding:36px 20px;}
  .gh-howto{padding:32px 18px;}
  .gh-steps-4,.gh-steps-5{grid-template-columns:1fr 1fr;}
  .gh-scenarios{grid-template-columns:1fr;}
  .gh-programs{grid-template-columns:1fr;}
  .gh-cta-modal{padding:40px 20px;margin:48px 0;}
  .gh-cta-grid{grid-template-columns:1fr;gap:20px;}
  .gh-ladder{padding:32px 18px;}
  .gh-ladder-steps{grid-template-columns:1fr 1fr;}
  .gh-trust-strip{grid-template-columns:1fr;gap:12px;}
  .gh-related{padding:28px 18px;}
  .gh-related-grid{grid-template-columns:1fr;}
  .gh-county-grid{grid-template-columns:1fr 1fr;}
  .gh-author-header{padding:32px 20px;}
  .gh-author-body{padding:28px 20px;}
  .gh-float-call{display:flex;}
}
/* ── CTA MODAL BUTTONS — Rich color shimmer @ 8s ── */
.gh-cta-modal .gh-ghost::before{width:70%;animation-duration:8s;}
.gh-cta-modal .gh-ghost--compare{border-color:rgba(75,156,211,.55);background:rgba(75,156,211,.07);}
.gh-cta-modal .gh-ghost--compare::before{animation-delay:0s;background:linear-gradient(120deg,transparent 20%,rgba(75,156,211,.75) 50%,transparent 80%);}
.gh-cta-modal .gh-ghost--call{border-color:rgba(22,163,74,.55);}
.gh-cta-modal .gh-ghost--call::before{animation-delay:2s;background:linear-gradient(120deg,transparent 20%,rgba(22,163,74,.80) 50%,transparent 80%);}
.gh-cta-modal .gh-ghost--text{border-color:rgba(139,92,246,.55);}
.gh-cta-modal .gh-ghost--text::before{animation-delay:4s;background:linear-gradient(120deg,transparent 20%,rgba(139,92,246,.78) 50%,transparent 80%);}
.gh-cta-modal .gh-ghost--sched{border-color:rgba(245,158,11,.55);}
.gh-cta-modal .gh-ghost--sched::before{animation-delay:6s;background:linear-gradient(120deg,transparent 20%,rgba(245,158,11,.80) 50%,transparent 80%);}
@media(min-width:769px){
  .gh-float-call{display:none;}
}

/* ════════════════════════════════════════════════════════════
   NEPQ OPTIMIZED COVERAGE VISUALIZATION
   MA vs Medigap vs Optimized Coverage strategy
   ════════════════════════════════════════════════════════════ */
.gh-nepq{margin:64px 0;}
.gh-nepq-methodology{background:#fff;border-radius:16px;padding:24px;border:1px solid #e2e8f0;margin-bottom:32px;}
.gh-nepq-methodology-label{font-size:11px;color:#d97706;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 8px;font-weight:600;}
.gh-nepq-methodology p{font-size:14px;color:#0f172a;margin:0 0 12px;line-height:1.6;}
.gh-nepq-methodology p:last-child{font-size:12px;color:#64748b;margin:0;}

.gh-nepq-seed{text-align:center;padding:48px 24px 32px;background:#fff;}
.gh-nepq-seed h2{font-family:var(--font-display);font-size:clamp(28px,4vw,36px);font-weight:700;color:#0f172a;margin:0 0 12px;line-height:1.2;}
.gh-nepq-seed p{font-size:18px;color:#64748b;margin:0 0 32px;}
.gh-nepq-pills{display:flex;justify-content:center;gap:16px;flex-wrap:wrap;}
.gh-nepq-pill{display:flex;align-items:center;gap:10px;padding:16px 28px;border-radius:10px;color:#fff;font-size:16px;font-weight:600;}
.gh-nepq-pill--ma{background:#10b981;}
.gh-nepq-pill--mg{background:#8b5cf6;}
.gh-nepq-pill-dot{width:10px;height:10px;background:#fff;border-radius:50%;}

.gh-nepq-graph{background:#fff;border-radius:24px;padding:40px 36px;box-shadow:0 1px 2px rgba(0,0,0,0.03),0 4px 12px rgba(0,0,0,0.04),0 16px 40px rgba(0,0,0,0.04);border:1px solid rgba(0,0,0,0.06);margin:0 0 32px;}
.gh-nepq-graph-hd{text-align:center;margin-bottom:24px;}
.gh-nepq-graph-hd h3{font-size:20px;font-weight:600;color:#0f172a;margin:0 0 8px;}
.gh-nepq-graph-hd p{font-size:13px;color:#64748b;margin:0;}
.gh-nepq-svg{width:100%;height:auto;}
.gh-nepq-totals{display:flex;justify-content:center;gap:32px;margin-top:28px;padding-top:24px;border-top:1px solid #f4f4f5;flex-wrap:wrap;}
.gh-nepq-total{text-align:center;padding:16px 28px;border-radius:14px;border:1.5px solid;}
.gh-nepq-total--ma{background:linear-gradient(135deg,rgba(16,185,129,0.06),rgba(52,211,153,0.02));border-color:rgba(16,185,129,0.15);}
.gh-nepq-total--mg{background:linear-gradient(135deg,rgba(139,92,246,0.06),rgba(167,139,250,0.02));border-color:rgba(139,92,246,0.15);}
.gh-nepq-total--opt{background:linear-gradient(135deg,rgba(245,158,11,0.12),rgba(251,191,36,0.05));border-color:rgba(245,158,11,0.3);border-width:2px;box-shadow:0 4px 12px rgba(245,158,11,0.15);}
.gh-nepq-total-label{font-size:10px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;font-weight:600;}
.gh-nepq-total-label--ma{color:#059669;}
.gh-nepq-total-label--mg{color:#7c3aed;}
.gh-nepq-total-label--opt{color:#b45309;}
.gh-nepq-total-val{font-size:28px;font-weight:700;letter-spacing:-0.5px;}
.gh-nepq-total-val--ma{color:#10b981;}
.gh-nepq-total-val--mg{color:#8b5cf6;}
.gh-nepq-total-val--opt{color:#d97706;}
.gh-nepq-note{font-size:10px;color:#94a3b8;margin:16px 0 0;text-align:center;line-height:1.5;}

.gh-nepq-pivot{text-align:center;padding:32px 24px;background:#f8fafc;}
.gh-nepq-pivot p{font-size:17px;color:#64748b;margin:0 0 8px;}
.gh-nepq-pivot p:last-child{font-size:22px;color:#0f172a;font-weight:700;margin:0 0 32px;}
.gh-nepq-pivot h2{font-family:var(--font-display);font-size:clamp(30px,4.5vw,38px);font-weight:700;color:#0f172a;margin:0 0 12px;line-height:1.15;letter-spacing:-0.5px;}
.gh-nepq-pivot-sub{font-size:19px;color:#64748b;margin:0 0 24px;font-weight:400;}

.gh-nepq-legend{display:flex;justify-content:center;gap:28px;margin-bottom:24px;font-size:13px;flex-wrap:wrap;}
.gh-nepq-legend span{display:flex;align-items:center;gap:8px;font-weight:500;}
.gh-nepq-legend-bar{width:28px;height:3px;border-radius:2px;}
.gh-nepq-legend-bar--ma{background:linear-gradient(90deg,#10b981,#34d399);}
.gh-nepq-legend-bar--mg{background:linear-gradient(90deg,#8b5cf6,#a78bfa);}
.gh-nepq-legend-bar--opt{background:linear-gradient(90deg,#f59e0b,#fbbf24);height:4px;}
.gh-nepq-legend-text--ma{color:#059669;}
.gh-nepq-legend-text--mg{color:#7c3aed;}
.gh-nepq-legend-text--opt{color:#d97706;font-weight:600;}

.gh-nepq-warning{margin-top:24px;background:linear-gradient(135deg,#fef3c7,#fef9c3);border:2px solid #f59e0b;border-radius:16px;padding:24px;display:flex;align-items:flex-start;gap:16px;}
.gh-nepq-warning-icon{flex-shrink:0;width:44px;height:44px;background:#f59e0b;border-radius:12px;display:flex;align-items:center;justify-content:center;}
.gh-nepq-warning-icon svg{width:24px;height:24px;stroke:#fff;stroke-width:2.5;fill:none;}
.gh-nepq-warning h4{font-size:15px;color:#92400e;margin:0 0 8px;font-weight:700;}
.gh-nepq-warning p{font-size:13px;color:#a16207;margin:0;line-height:1.6;}

.gh-nepq-close{background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);border-radius:24px;padding:44px 40px;text-align:center;margin-top:32px;}
.gh-nepq-close h3{font-size:28px;color:#fff;margin:0 0 16px;font-weight:700;line-height:1.3;}
.gh-nepq-close p{font-size:18px;color:#94a3b8;margin:0 0 28px;line-height:1.6;}
.gh-nepq-close-cta{display:inline-block;background:#10b981;color:#fff;font-size:18px;font-weight:600;padding:18px 40px;border-radius:14px;text-decoration:none;box-shadow:0 4px 14px rgba(16,185,129,0.4);transition:transform 150ms,box-shadow 150ms;}
.gh-nepq-close-cta:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(16,185,129,0.5);}

.gh-nepq-disclosures{background:#fefce8;border:1px solid #fef08a;border-radius:16px;padding:24px;margin-top:32px;}
.gh-nepq-disclosures h4{font-size:13px;color:#854d0e;margin:0 0 12px;font-weight:700;}
.gh-nepq-disclosures p{font-size:12px;color:#713f12;margin:0 0 12px;line-height:1.7;}
.gh-nepq-disclosures p:last-child{margin:0;}
.gh-nepq-disclosures p.gh-nepq-disc-small{font-size:11px;color:#92400e;margin:0 0 10px;line-height:1.6;}

.gh-nepq-compliance{margin-top:20px;padding-top:20px;border-top:1px solid #e5e7eb;text-align:center;}
.gh-nepq-compliance p{font-size:10px;color:#9ca3af;margin:0 0 8px;line-height:1.6;}
.gh-nepq-compliance p:last-child{margin:0;}

@media(max-width:768px){
  .gh-nepq-graph{padding:24px 18px;}
  .gh-nepq-totals{gap:12px;}
  .gh-nepq-total{padding:14px 18px;}
  .gh-nepq-total-val{font-size:24px;}
  .gh-nepq-warning{flex-direction:column;gap:12px;}
  .gh-nepq-close{padding:32px 20px;}
}


/* ════════════════════════════════════════════════════════════
   ACA NEPQ SECTION STYLES
   Use on ACA pages only (PAGE-TYPE: ACA)
   Matches Medicare NEPQ visual language with ACA-specific content
   ════════════════════════════════════════════════════════════ */

.gh-aca-nepq{margin:64px 0;}

.gh-aca-nepq-intro{text-align:center;padding:48px 24px 32px;background:#fff;}
.gh-aca-nepq-intro h2{font-family:var(--font-display);font-size:clamp(28px,4vw,36px);font-weight:700;color:#0f172a;margin:0 0 12px;line-height:1.2;}
.gh-aca-nepq-intro p{font-size:18px;color:#64748b;margin:0 0 32px;max-width:680px;margin-left:auto;margin-right:auto;}

/* Part 1: Subsidy Reality Check */
.gh-aca-subsidy{background:#fff;border-radius:24px;padding:40px 36px;box-shadow:0 1px 2px rgba(0,0,0,0.03),0 4px 12px rgba(0,0,0,0.04),0 16px 40px rgba(0,0,0,0.04);border:1px solid rgba(0,0,0,0.06);margin:0 0 32px;}
.gh-aca-subsidy-hd{text-align:center;margin-bottom:32px;}
.gh-aca-subsidy-hd h3{font-size:22px;font-weight:700;color:#0f172a;margin:0 0 8px;}
.gh-aca-subsidy-hd p{font-size:14px;color:#64748b;margin:0;}

.gh-aca-subsidy-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:24px;}
.gh-aca-subsidy-card{border-radius:16px;padding:24px;text-align:center;position:relative;overflow:hidden;transition:transform 200ms var(--ease);}
.gh-aca-subsidy-card:hover{transform:translateY(-2px);}
.gh-aca-subsidy-card::after{content:"";position:absolute;top:0;left:-150%;width:80%;height:100%;background:linear-gradient(120deg,transparent,rgba(255,255,255,.12),transparent);transform:skewX(-15deg);animation:ghSweep 6s ease-in-out infinite;}
.gh-aca-subsidy-card:nth-child(2)::after{animation-delay:2s;}
.gh-aca-subsidy-card:nth-child(3)::after{animation-delay:4s;}

.gh-aca-subsidy-card--eligible{background:linear-gradient(135deg,#059669,#10b981);border:2px solid rgba(16,185,129,0.3);}
.gh-aca-subsidy-card--partial{background:linear-gradient(135deg,#d97706,#f59e0b);border:2px solid rgba(245,158,11,0.3);}
.gh-aca-subsidy-card--cliff{background:linear-gradient(135deg,#dc2626,#ef4444);border:2px solid rgba(239,68,68,0.3);}

.gh-aca-subsidy-income{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.7);margin-bottom:8px;}
.gh-aca-subsidy-amount{font-family:var(--font-display);font-size:32px;font-weight:800;color:#fff;margin-bottom:4px;}
.gh-aca-subsidy-label{font-size:13px;color:rgba(255,255,255,.85);font-weight:500;}
.gh-aca-subsidy-note{font-size:11px;color:rgba(255,255,255,.6);margin-top:8px;line-height:1.4;}

.gh-aca-subsidy-fpl{display:flex;justify-content:center;gap:24px;padding:16px 0;border-top:1px solid #f4f4f5;flex-wrap:wrap;}
.gh-aca-subsidy-fpl span{font-size:12px;color:#64748b;}
.gh-aca-subsidy-fpl strong{color:#0f172a;}

/* Part 2: Total Cost Trap */
.gh-aca-trap{background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);border-radius:24px;padding:48px 36px;margin:0 0 32px;position:relative;overflow:hidden;}
.gh-aca-trap::before{content:"";position:absolute;top:-20%;right:-10%;width:50%;height:80%;background:radial-gradient(ellipse,rgba(245,158,11,.08) 0%,transparent 70%);pointer-events:none;}

.gh-aca-trap-hd{text-align:center;margin-bottom:36px;position:relative;z-index:2;}
.gh-aca-trap-hd h3{font-family:var(--font-display);font-size:clamp(22px,2.8vw,28px);font-weight:700;color:#fff;margin:0 0 8px;}
.gh-aca-trap-hd p{font-size:15px;color:rgba(255,255,255,.65);margin:0;}

.gh-aca-trap-scenario{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;position:relative;z-index:2;}
.gh-aca-trap-card{background:rgba(255,255,255,.05);backdrop-filter:blur(12px);border:1.5px solid rgba(255,255,255,.1);border-radius:20px;padding:28px 24px;position:relative;overflow:hidden;transition:border-color 300ms var(--ease),box-shadow 300ms var(--ease);}
.gh-aca-trap-card::after{content:"";position:absolute;top:0;left:-150%;width:80%;height:100%;background:linear-gradient(120deg,transparent,rgba(255,255,255,.05),transparent);transform:skewX(-15deg);animation:ghSweep 7s ease-in-out infinite;}
.gh-aca-trap-card:nth-child(2)::after{animation-delay:2.3s;}
.gh-aca-trap-card:nth-child(3)::after{animation-delay:4.6s;}
.gh-aca-trap-card:hover{border-color:rgba(255,255,255,.25);box-shadow:0 8px 32px rgba(0,0,0,.3);}

.gh-aca-trap-card--bronze{border-color:rgba(180,83,9,.4);}
.gh-aca-trap-card--silver{border-color:rgba(100,116,139,.4);}
.gh-aca-trap-card--csr{border-color:rgba(16,185,129,.5);background:rgba(16,185,129,.08);}

.gh-aca-trap-badge{display:inline-block;padding:4px 12px;border-radius:var(--r-full);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px;}
.gh-aca-trap-badge--bronze{background:rgba(180,83,9,.2);color:#fbbf24;}
.gh-aca-trap-badge--silver{background:rgba(100,116,139,.2);color:#cbd5e1;}
.gh-aca-trap-badge--csr{background:rgba(16,185,129,.2);color:#34d399;}

.gh-aca-trap-card h4{font-family:var(--font-display);font-size:17px;font-weight:700;color:#fff;margin:0 0 16px;}

.gh-aca-trap-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.08);}
.gh-aca-trap-row:last-of-type{border-bottom:none;padding-top:12px;margin-top:4px;border-top:2px solid rgba(255,255,255,.15);}
.gh-aca-trap-label{font-size:13px;color:rgba(255,255,255,.6);}
.gh-aca-trap-val{font-size:14px;font-weight:600;color:#fff;}
.gh-aca-trap-val--total{font-size:20px;font-weight:800;}
.gh-aca-trap-val--bronze{color:#fbbf24;}
.gh-aca-trap-val--silver{color:#cbd5e1;}
.gh-aca-trap-val--csr{color:#34d399;}

.gh-aca-trap-verdict{margin-top:16px;padding:12px 16px;border-radius:var(--r-md);font-size:12px;font-weight:600;text-align:center;}
.gh-aca-trap-verdict--bad{background:rgba(239,68,68,.15);color:#fca5a5;}
.gh-aca-trap-verdict--ok{background:rgba(100,116,139,.15);color:#94a3b8;}
.gh-aca-trap-verdict--best{background:rgba(16,185,129,.2);color:#34d399;}

.gh-aca-trap-note{text-align:center;margin-top:24px;font-size:11px;color:rgba(255,255,255,.45);line-height:1.5;}

/* ACA Warning Box */
.gh-aca-warning{margin-top:32px;background:linear-gradient(135deg,#fef3c7,#fef9c3);border:2px solid #f59e0b;border-radius:16px;padding:24px;display:flex;align-items:flex-start;gap:16px;}
.gh-aca-warning-icon{flex-shrink:0;width:44px;height:44px;background:#f59e0b;border-radius:12px;display:flex;align-items:center;justify-content:center;}
.gh-aca-warning-icon svg{width:24px;height:24px;stroke:#fff;stroke-width:2.5;fill:none;}
.gh-aca-warning h4{font-size:15px;color:#92400e;margin:0 0 8px;font-weight:700;}
.gh-aca-warning p{font-size:13px;color:#a16207;margin:0;line-height:1.6;}

/* ACA Close CTA */
.gh-aca-close{background:linear-gradient(135deg,#059669 0%,#10b981 100%);border-radius:24px;padding:44px 40px;text-align:center;margin-top:32px;position:relative;overflow:hidden;}
.gh-aca-close::before{content:"";position:absolute;top:-30%;right:-15%;width:50%;height:80%;background:radial-gradient(ellipse,rgba(255,255,255,.12) 0%,transparent 70%);pointer-events:none;}
.gh-aca-close h3{font-size:28px;color:#fff;margin:0 0 12px;font-weight:700;line-height:1.3;position:relative;z-index:2;}
.gh-aca-close p{font-size:17px;color:rgba(255,255,255,.85);margin:0 0 28px;line-height:1.6;position:relative;z-index:2;}
.gh-aca-close-cta{display:inline-block;background:#fff;color:#059669;font-size:18px;font-weight:700;padding:18px 40px;border-radius:14px;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,.15);transition:transform 150ms,box-shadow 150ms;position:relative;z-index:2;}
.gh-aca-close-cta:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.2);color:#047857;}

/* ACA Disclosures */
.gh-aca-disclosures{margin-top:24px;padding:20px 24px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;}
.gh-aca-disclosures h4{font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin:0 0 12px;}
.gh-aca-disclosures p{font-size:12px;color:#64748b;line-height:1.6;margin:0 0 10px;}
.gh-aca-disclosures p:last-child{margin:0;}
.gh-aca-disc-small{font-size:11px !important;color:#94a3b8 !important;}

/* ACA Compliance footer */
.gh-aca-compliance{margin-top:16px;padding:16px 20px;background:#fff;border-radius:8px;border:1px solid #e2e8f0;}
.gh-aca-compliance p{font-size:11px;color:#94a3b8;line-height:1.5;margin:0 0 8px;}
.gh-aca-compliance p:last-child{margin:0;}

/* ACA Responsive */
@media(max-width:768px){
  .gh-aca-subsidy{padding:28px 18px;}
  .gh-aca-subsidy-grid{grid-template-columns:1fr;}
  .gh-aca-trap{padding:32px 18px;}
  .gh-aca-trap-scenario{grid-template-columns:1fr;}
  .gh-aca-warning{flex-direction:column;text-align:center;}
  .gh-aca-warning-icon{margin:0 auto;}
  .gh-aca-close{padding:32px 20px;}
  .gh-aca-subsidy-fpl{flex-direction:column;gap:8px;align-items:center;}
}
</style>
</head>
<body>

<!-- ╔═══════════════════════════════════════════════════════════╗
     ║   GENERATIONHEALTH v5.6 — NEPQ COPY QUICK REFERENCE     ║
     ╚═══════════════════════════════════════════════════════════╝

  NEPQ = Neuro-Emotional Persuasion Questioning (Jeremy Miner)
  Core premise: People decide emotionally, justify logically.
  Copy must surface PAIN before presenting SOLUTION.

  ── 4-STAGE SEQUENCE ────────────────────────────────────────
  1. CONNECTING       Current situation. No pressure. Who are you?
  2. PROBLEM AWARE    The specific risk they face but may not know.
  3. CONSEQUENCE      The real cost of inaction. Dollar-specific.
  4. VISION BRIDGE    What it looks like when it goes right.
                      Then → Rob as the specific answer.

  ── PAGE COPY MAP ───────────────────────────────────────────
  Hero H1/subtitle   → Formulas 1, 3, or 4. Pain or question first.
  Instant Answer     → Problem Paragraph. Lead with "don't realize"
  Body P1            → Problem Paragraph pattern
  Body P2            → Consequence Block (if relevant)
  Scenario cards     → Problem (setup) + Vision Bridge (resolution)
  CTA #1             → Vision Bridge headline
  Trust Ladder       → Vision Bridge in step form
  CTA #2             → Soft invitation / question headline
  FAQ                → Formula 3 questions · At least 1 consequence

  ── APPROVED CTA LANGUAGE ───────────────────────────────────
  ✓ "Let's figure out what's right for you →"
  ✓ "Talk to Rob →"
  ✓ "Let's check your doctors and drugs →"
  ✓ "Let's make sure you're enrolled correctly →"
  ✓ "One call. No strangers. No spam."
  ✗ NEVER: "Get a Free Quote Now" / "Submit Your Information"
  ✗ NEVER: "Request a Callback" / "Apply Now" / "Enroll Today"

  ── VOICE RULES ─────────────────────────────────────────────
  ✓ Question-first openers
  ✓ Specific dollar amounts and penalty math
  ✓ First-person from Rob ("I check your doctors myself")
  ✓ The call center as the villain (never name competitors)
  ✓ NC-local always (Durham, Wake, Triangle, specific county)
  ✗ NEVER start a body paragraph with "Medicare is..." or "In NC..."
  ✗ NEVER lead with the solution before the problem

  Full framework: GH-NEPQ-Copy-Framework-v1.docx

  ── PRE-DELIVERY CHECKLIST ──────────────────────────────────
  ☐ All [BRACKET] placeholders replaced
  ☐ Schema @graph: all 11 types present, slugs/dates filled
  ☐ FAQPage schema matches FAQ accordion exactly (6 items)
  ☐ Hero H1 uses NEPQ Formula 1, 3, or 4
  ☐ CTA buttons use approved language only (see above)

  ☐ INTERNAL CROSS-LINKS — 3+ inline body links filled
  ☐ RELATED GUIDES — all 8 slots filled with real URLs
  ☐ No [RELATED-SLUG] or [RELATED GUIDE] placeholders in hrefs
  ☐ Pillar page linked from this post (if cluster post)
  ☐ County grid intact (8 links)
  ☐ Elementor dark sections: inline style !important on all text
  ☐ .gh-costs-src: inline style="color:rgba(255,255,255,.75)..."
  ☐ No DOMContentLoaded — IIFE pattern only
  ☐ Stat row (.gh-stat-row) present
  ☐ .gh-sources citations panel — min 5 .gov sources
  ☐ Branded infographic present (pure black bg, dominant numbers)
═══════════════════════════════════════════════════════════ -->


<!-- ╔═══════════════════════════════════════════════════════════╗
     ║   GENERATIONHEALTH v5.7.2 — DESIGN PHILOSOPHY            ║
     ╚═══════════════════════════════════════════════════════════╝

  GUIDING PRINCIPLE: Apple-quality restraint.
  Every element earns its place. Nothing decorative. Nothing clever.
  If it doesn't help the person decide, it doesn't belong.

  ── VISUAL HIERARCHY ────────────────────────────────────────
  1. ONE focal point per scroll viewport (~500px vertical chunk)
  2. Numbers displayed LARGE and ISOLATED — never buried in prose
  3. Headlines answer questions or name consequences — never features
  4. Body text serves the headline — 2-3 sentences max per paragraph
  5. Dark sections break rhythm — use sparingly (hero, costs, NEPQ quotes)

  ── WHITESPACE RULES ────────────────────────────────────────
  ✓ margin-top: 72px before H2 sections
  ✓ margin-top: 48px before H3 sections  
  ✓ margin-bottom: 20px after paragraphs
  ✓ padding: 44px on card containers (.gh-costs, .gh-cta-modal)
  ✓ gap: 16-24px in grid layouts
  ✗ NEVER stack elements without breathing room
  ✗ NEVER fill space just because it's empty

  ── TYPOGRAPHY HIERARCHY ────────────────────────────────────
  Display (Fraunces):  H1 hero (38-68px), H2 sections (26-34px)
  Body (DM Sans):      H3 (20-24px), body (17px), small (12-14px)
  
  Weight progression:  800 → 700 → 600 → 400
  Letter-spacing:      Tight on display (-0.025em), normal on body

  ── COLOR RESTRAINT ─────────────────────────────────────────
  Primary palette only — no gradients except hero/costs backgrounds:
  • --midnight (#1A2332): Primary text
  • --charcoal (#3A4553): Body text  
  • --carolina (#4B9CD3): Links, accents, h1-line2
  • --nc-gold (#FFC72C): Eyebrow, trust badges
  • --teal-600 (#0D9488): CTAs, success states
  • --white: Backgrounds, hero text

  ✗ NEVER use colors not in the template CSS variables
  ✗ NEVER use emoji as decoration (✓/✗/⚠️ functional only)

  ── COMPONENT DENSITY ───────────────────────────────────────
  Hero:           1 H1, 1 subtitle, 2 buttons, credential strip
  Instant Answer: 1 label, 1 paragraph (2-4 sentences)
  Cost Strip:     1 header, 4 boxes max, 1 source citation
  CTA Modal:      1 vision headline, 2 cards (compare + contact)
  FAQ:            6 items — no more, no less
  
  If a section feels crowded, it has too much. Remove, don't rearrange.

  ── ENGAGEMENT ARCHITECTURE ─────────────────────────────────
  Target: 3+ minute time-on-page
  
  Scroll 0-25%:   HOOK — Hero + NEPQ quote + Instant answer
                  Person must feel: "This is about MY situation"
  
  Scroll 25-50%:  PROBLEM — Cost strip + Pain points + Consequence
                  Person must feel: "I didn't realize this risk"
  
  Scroll 50-75%:  SOLUTION — Process steps + Case studies + Trust
                  Person must feel: "This person can actually help"
  
  Scroll 75-100%: ACTION — CTA + FAQ + Author + Footer
                  Person must feel: "I should call today"

  Each section rewards scrolling. Never repeat. Never pad.

  ── PROGRESSIVE DISCLOSURE ──────────────────────────────────
  Layer 1 (visible):     Headlines, numbers, labels
  Layer 2 (scannable):   Short paragraphs, bullet points
  Layer 3 (on demand):   FAQ accordions, expandable details
  
  Person can get the gist in 30 seconds.
  Person can read deeply in 3 minutes.
  Person never hits a wall of text.

  ── DARK SECTION RULES ──────────────────────────────────────
  Dark backgrounds (.gh-hero, .gh-costs, .gh-nepq-quote):
  
  ✓ MUST use inline style="color:#fff !important" on all text
  ✓ MUST use hardcoded hex gradients, not CSS variables
  ✓ MUST include !important on every color override
  
  Reason: Elementor's global article p { color: var(--charcoal) }
  overrides class-based rules. Inline !important is the only fix.

  ── MOBILE-FIRST PATTERNS ───────────────────────────────────
  All layouts must work at 375px width (iPhone SE)
  
  ✓ Hero buttons: flex-direction: column on mobile
  ✓ Cost grid: single column on mobile
  ✓ CTA cards: stack vertically on mobile
  ✓ Credential strip: wrap with reduced gap
  ✓ Touch targets: minimum 44px height

  ── PRE-FLIGHT VISUAL CHECK ─────────────────────────────────
  ☐ Can I identify the ONE main point in each scroll viewport?
  ☐ Are all dollar amounts large and isolated?
  ☐ Is there breathing room around every element?
  ☐ Do dark sections have inline !important color overrides?
  ☐ Does the page reward scrolling with new value?
  ☐ Would this feel at home on apple.com?

═══════════════════════════════════════════════════════════ -->


<!-- ACCESSIBILITY: Skip link -->
<a href="#main-content" class="gh-skip">Skip to main content</a>


<!-- ═══════════════════════════════════════════════════════════
     STICKY HEADER
     ═══════════════════════════════════════════════════════════ -->
<header class="gh-header" id="siteHeader">
  <div class="gh-header-inner">
    <a href="https://generationhealth.me" class="gh-logo">Generation<span>Health</span><span class="dot">.me</span></a>
    <div class="gh-header-actions">
      <a href="tel:828-761-3326" class="gh-header-phone" aria-label="Call 828-761-3326">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.24 1.02l-2.21 2.2z"/></svg>
        <span class="phone-text">(828) 761-3326</span>
      </a>
      <a href="https://www.sunfirematrix.com/app/consumer/medicareadvocates/10447418/" class="gh-header-cta">Compare Plans</a>
    </div>
  </div>
</header>


<!-- ═══════════════════════════════════════════════════════════
     HERO  ·  NEPQ STAGE: CONNECTING + PROBLEM AWARENESS
     ───────────────────────────────────────────────────────────
     The hero must do 3 things in 8 seconds:
       1. Confirm the visitor is in the right place (CONNECTING)
       2. Surface the fear or problem that brought them here
          (PROBLEM AWARENESS — use a Formula 1, 3, or 4 headline)
       3. Position Rob as the specific local solution

     HEADLINE FORMULA OPTIONS — pick one per page:
       Formula 1 (Consequence Gap):
         "[Desired outcome] without [feared consequence]."
         e.g. "Enroll in Medicare correctly the first time —
               without the penalty you'd pay permanently."
       Formula 3 (Question):
         "What happens to your [thing] if you [common mistake]?"
       Formula 4 (Identity / Local):
         "If you're turning 65 in [county] this year, here's
          what nobody told you about Medicare enrollment."

     SUBTITLE RULE: Must name the specific pain or risk.
       WRONG: "Get help with Medicare in North Carolina."
       RIGHT: "The employer-size test, the 8-month window, and the
               permanent penalty — everything to enroll correctly
               in 2026 without a mistake you pay for forever."

     EYEBROW: County + year + trust signal:
       "Durham & Wake County · 2026 · No SSN Required"

     CTA BUTTONS — approved language only:
       Primary: "Let's figure out what's right for you →"
                "Let's make sure you're enrolled correctly →"
                "Let's check your doctors and drugs →"
       Secondary call: "Talk to Rob · 828-761-3326"
       NEVER USE: "Get a Free Quote Now" / "Submit Your Information"
     ═══════════════════════════════════════════════════════════ -->
<section class="gh-hero" aria-label="Page hero">
  <div class="gh-hero-inner">
    <div class="gh-eyebrow">
      <!-- NEPQ CONNECTING: County + year + no-friction trust signal -->
      <span class="gh-eyebrow-text">[EYEBROW — e.g. "Durham &amp; Wake County &middot; 2026 &middot; No SSN Required"]</span>
      <span class="gh-eyebrow-rule"></span>
    </div>
    <h1 class="gh-h1">
      <!-- NEPQ HEADLINE: Use Formula 1, 3, or 4. Line 1 = white. Line 2 = carolina blue.
           Formula 1 example split:
             Line 1: "Medicare Coverage That Fits Your Doctors."
             Line 2: "Without Overpaying for a Plan That Doesn't."
           Formula 4 example split:
             Line 1: "If You're Turning 65 in North Carolina,"
             Line 2: "This Is What Nobody Told You." -->
      <span class="gh-h1-line1">[H1 LINE 1 — white]</span>
      <span class="gh-h1-line2">[H1 LINE 2 — carolina blue accent]</span>
    </h1>
    <!-- NEPQ SUBTITLE: Name the specific pain/risk. Max 560px width.
         Pattern: "[Specific problem elements] — everything you need
         to [desired outcome] in 2026 without [feared consequence]." -->
    <p class="gh-hero-sub">[HERO SUBTITLE — name the specific pain, not the service. Max 22 words.]</p>
    <div class="gh-hero-actions">
      <!-- PRIMARY CTA: Use NEPQ-approved language. See framework Section 5. -->
      <a href="tel:828-761-3326" class="gh-hero-btn gh-hero-btn--call">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.24 1.02l-2.21 2.2z"/></svg>
        [PRIMARY CTA — e.g. "Talk to Rob" or "Let's Figure Out What's Right for You"]
      </a>
      <!-- MEDICARE: Use SunFire Matrix link -->
      <!-- ACA: Use HealthSherpa link: https://www.healthsherpa.com/?_agent_id=hst-t4qptg -->
      <a href="[MEDICARE: https://www.sunfirematrix.com/app/consumer/medicareadvocates/10447418/ | ACA: https://www.healthsherpa.com/?_agent_id=hst-t4qptg]" class="gh-hero-btn gh-hero-btn--compare">[SECONDARY CTA — e.g. "Compare Plans Side by Side"]</a>
    </div>
  </div>
  <!-- Credential Strip — DO NOT CHANGE content below -->
  <div class="gh-creds">
    <div class="gh-creds-rule"></div>
    <div class="gh-creds-inner">
      <span class="gh-cred">NC License #10447418</span>
      <span class="gh-cred-divider"></span>
      <span class="gh-cred">AHIP Certified</span>
      <span class="gh-cred-divider"></span>
      <span class="gh-cred gh-cred--gold">★ 5.0 &mdash; 20 Google Reviews</span>
      <span class="gh-cred-divider"></span>
      <span class="gh-cred">No Spam Calls &middot; $0 Cost</span>
      <span class="gh-cred-divider"></span>
      <span class="gh-cred gh-cred--cta"><a href="tel:828-761-3326">828-761-3326</a></span>
    </div>
  </div>
</section>


<!-- ═══════════════════════════════════════════════════════════
     MAIN CONTENT
     ═══════════════════════════════════════════════════════════ -->
<main id="main-content">
<article>
<div class="gh-container">


<!-- ═══════════════════════════════════════════════════════════════════════════
     ██████╗ ██╗   ██╗ █████╗ ██╗         ██████╗  █████╗  ██████╗ ███████╗
     ██╔══██╗██║   ██║██╔══██╗██║         ██╔══██╗██╔══██╗██╔════╝ ██╔════╝
     ██║  ██║██║   ██║███████║██║         ██████╔╝███████║██║  ███╗█████╗  
     ██║  ██║██║   ██║██╔══██║██║         ██╔═══╝ ██╔══██║██║   ██║██╔══╝  
     ██████╔╝╚██████╔╝██║  ██║███████╗    ██║     ██║  ██║╚██████╔╝███████╗
     ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚══════╝    ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚══════╝
     
     DUAL PAGE STRUCTURE — Use for PAGE-TYPE: DUAL only
     Delete this entire section for MEDICARE or ACA pages
     ═══════════════════════════════════════════════════════════════════════════ -->

  <!-- ─────────────────────────────────────────────
       DUAL: TRI-PATH INSTANT ANSWER
       AI can cite from Medicare angle, ACA angle, or general
       ───────────────────────────────────────────── -->
  <div class="gh-prose">
    <h2>Who Can Help You Find the Right Health Insurance?</h2>
    
    <div class="gh-answer" role="note" aria-label="Quick answer">
      <span class="gh-answer-label">Quick Answer</span>
      <p>Finding the right health insurance depends on where you are in life. <strong>If you're 65 or older</strong>, you're navigating Medicare — the alphabet soup of Part A, B, C, D, Medigap, and Advantage plans. <strong>If you're under 65</strong> without employer coverage, you're looking at ACA marketplace plans with subsidies, metal tiers, and enrollment windows. Either way, an independent broker can compare every option at no cost to you. Rob Simm at GenerationHealth has helped over 500 families in Wake and Durham counties figure out exactly what they need.</p>
    </div>
  </div>


  <!-- ─────────────────────────────────────────────
       DUAL: FORK CARDS
       Click scrolls to corresponding section
       ───────────────────────────────────────────── -->
  <div class="gh-fork-wrap">
    <a href="#medicare-section" class="gh-fork-card gh-fork-card--medicare">
      <span class="gh-fork-title">65 or older?</span>
      <span class="gh-fork-sub">Medicare &amp; supplement plans</span>
      <span class="gh-fork-arrow">↓ Scroll to Medicare help</span>
    </a>
    <a href="#aca-section" class="gh-fork-card gh-fork-card--aca">
      <span class="gh-fork-title">Need individual coverage?</span>
      <span class="gh-fork-sub">ACA marketplace plans</span>
      <span class="gh-fork-arrow">↓ Scroll to ACA help</span>
    </a>
  </div>


  <!-- ─────────────────────────────────────────────
       DUAL: MEDICARE SECTION
       Pain points + CTA modal
       ───────────────────────────────────────────── -->
  <section class="gh-dual-section gh-dual-section--medicare" id="medicare-section" aria-label="Medicare coverage help">
    <span class="gh-dual-badge gh-dual-badge--medicare">Medicare</span>
    <h2>It's Overwhelming — Here's What Most People Struggle With</h2>
    <p>Picking the wrong Medicare plan can cost you thousands. These are the consequences people face:</p>
    
    <div class="gh-consequence-list">
      <div class="gh-consequence-item">
        <span class="gh-consequence-marker gh-consequence-marker--medicare">✗</span>
        <p class="gh-consequence-text">Choosing the wrong plan and paying thousands out of pocket for care you thought was covered</p>
      </div>
      <div class="gh-consequence-item">
        <span class="gh-consequence-marker gh-consequence-marker--medicare">✗</span>
        <p class="gh-consequence-text">Missing enrollment deadlines and getting hit with penalties that last the rest of your life</p>
      </div>
      <div class="gh-consequence-item">
        <span class="gh-consequence-marker gh-consequence-marker--medicare">✗</span>
        <p class="gh-consequence-text">Finding out your doctor doesn't accept your plan after you've already enrolled</p>
      </div>
      <div class="gh-consequence-item">
        <span class="gh-consequence-marker gh-consequence-marker--medicare">✗</span>
        <p class="gh-consequence-text">Discovering your medications aren't covered when you're standing at the pharmacy counter</p>
      </div>
      <div class="gh-consequence-item">
        <span class="gh-consequence-marker gh-consequence-marker--medicare">✗</span>
        <p class="gh-consequence-text">Paying for coverage you don't need while missing the benefits you actually use</p>
      </div>
      <div class="gh-consequence-item">
        <span class="gh-consequence-marker gh-consequence-marker--medicare">✗</span>
        <p class="gh-consequence-text">Getting stuck in a plan that doesn't work and waiting 12 months to make a change</p>
      </div>
      <div class="gh-consequence-item">
        <span class="gh-consequence-marker gh-consequence-marker--medicare">✗</span>
        <p class="gh-consequence-text">Falling into the Part D coverage gap and paying full price for prescriptions</p>
      </div>
      <div class="gh-consequence-item">
        <span class="gh-consequence-marker gh-consequence-marker--medicare">✗</span>
        <p class="gh-consequence-text">Not understanding the difference between Original Medicare and Medicare Advantage until it's too late</p>
      </div>
      <div class="gh-consequence-item">
        <span class="gh-consequence-marker gh-consequence-marker--medicare">✗</span>
        <p class="gh-consequence-text">Choosing a plan based on premium alone and getting hit with hidden deductibles and copays</p>
      </div>
      <div class="gh-consequence-item">
        <span class="gh-consequence-marker gh-consequence-marker--medicare">✗</span>
        <p class="gh-consequence-text">Losing coverage during a hospital stay because you didn't understand observation vs. admission rules</p>
      </div>
    </div>

    <!-- MEDICARE CTA MODAL — Same structure as main template -->
    <div class="gh-cta-modal">
      <div class="gh-cta-hd">
        <h2>Let's Figure Out What's Right for You</h2>
        <p>One call. No strangers. No spam. Just real Medicare help from a local broker.</p>
      </div>
      <div class="gh-cta-grid">
        <div class="gh-cta-card">
          <h3>Compare Medicare Plans</h3>
          <p>See plans side by side — your doctors, your drugs, your costs. Rob runs every comparison himself.</p>
          <a href="https://www.sunfirematrix.com/app/consumer/medicareadvocates/10447418/" class="gh-ghost gh-ghost--primary gh-ghost--compare">Compare Plans →</a>
          <a href="tel:828-761-3326" class="gh-ghost gh-ghost--call">📞 Call Rob <span class="gh-ghost-sub">828-761-3326</span></a>
        </div>
        <div class="gh-cta-card">
          <h3>Talk to Rob Directly</h3>
          <p>Real answers, no scripts. Call, text, or book a time that works for you.</p>
          <a href="sms:828-761-3326" class="gh-ghost gh-ghost--text">💬 Text Rob</a>
          <a href="https://calendly.com/robert-generationhealth/new-meeting" class="gh-ghost gh-ghost--sched">📅 Schedule a Call</a>
        </div>
      </div>
    </div>
  </section>


  <!-- ─────────────────────────────────────────────
       DUAL: ACA SECTION
       Pain points + CTA modal
       ───────────────────────────────────────────── -->
  <section class="gh-dual-section gh-dual-section--aca" id="aca-section" aria-label="ACA coverage help">
    <span class="gh-dual-badge gh-dual-badge--aca">ACA / Marketplace</span>
    <h2>It's Overwhelming — Here's What Most People Struggle With</h2>
    <p>One wrong choice can cost you thousands in premiums, bills, or tax surprises:</p>
    
    <div class="gh-consequence-list">
      <div class="gh-consequence-item">
        <span class="gh-consequence-marker gh-consequence-marker--aca">✗</span>
        <p class="gh-consequence-text">Paying full price when you qualify for subsidies you didn't know existed</p>
      </div>
      <div class="gh-consequence-item">
        <span class="gh-consequence-marker gh-consequence-marker--aca">✗</span>
        <p class="gh-consequence-text">Choosing the cheapest premium and getting hit with a $9,000 deductible when you need care</p>
      </div>
      <div class="gh-consequence-item">
        <span class="gh-consequence-marker gh-consequence-marker--aca">✗</span>
        <p class="gh-consequence-text">Finding out your doctor is out of network after your first appointment bill arrives</p>
      </div>
      <div class="gh-consequence-item">
        <span class="gh-consequence-marker gh-consequence-marker--aca">✗</span>
        <p class="gh-consequence-text">Missing open enrollment and going without coverage for the entire year</p>
      </div>
      <div class="gh-consequence-item">
        <span class="gh-consequence-marker gh-consequence-marker--aca">✗</span>
        <p class="gh-consequence-text">Losing your subsidy mid-year because you underestimated your income</p>
      </div>
      <div class="gh-consequence-item">
        <span class="gh-consequence-marker gh-consequence-marker--aca">✗</span>
        <p class="gh-consequence-text">Picking the wrong metal tier and overpaying every month for coverage you never use</p>
      </div>
      <div class="gh-consequence-item">
        <span class="gh-consequence-marker gh-consequence-marker--aca">✗</span>
        <p class="gh-consequence-text">Not understanding cost-sharing and getting surprise bills after a procedure</p>
      </div>
      <div class="gh-consequence-item">
        <span class="gh-consequence-marker gh-consequence-marker--aca">✗</span>
        <p class="gh-consequence-text">Enrolling in a plan that doesn't cover your prescriptions or specialist</p>
      </div>
      <div class="gh-consequence-item">
        <span class="gh-consequence-marker gh-consequence-marker--aca">✗</span>
        <p class="gh-consequence-text">Estimating income wrong and owing thousands back at tax time</p>
      </div>
      <div class="gh-consequence-item">
        <span class="gh-consequence-marker gh-consequence-marker--aca">✗</span>
        <p class="gh-consequence-text">Losing employer coverage and not knowing you have 60 days to enroll before you're locked out</p>
      </div>
    </div>

    <!-- ACA CTA MODAL — Same structure as main template -->
    <div class="gh-cta-modal">
      <div class="gh-cta-hd">
        <h2>Let's Figure Out What's Right for You</h2>
        <p>One call. No strangers. No spam. Just real ACA help from a local broker.</p>
      </div>
      <div class="gh-cta-grid">
        <div class="gh-cta-card">
          <h3>Compare ACA Plans</h3>
          <p>See plans side by side — your doctors, your drugs, your subsidies. Rob runs every comparison himself.</p>
          <a href="https://www.healthsherpa.com/?_agent_id=hst-t4qptg" class="gh-ghost gh-ghost--primary gh-ghost--compare">Compare Plans →</a>
          <a href="tel:828-761-3326" class="gh-ghost gh-ghost--call">📞 Call Rob <span class="gh-ghost-sub">828-761-3326</span></a>
        </div>
        <div class="gh-cta-card">
          <h3>Talk to Rob Directly</h3>
          <p>Real answers, no scripts. Call, text, or book a time that works for you.</p>
          <a href="sms:828-761-3326" class="gh-ghost gh-ghost--text">💬 Text Rob</a>
          <a href="https://calendly.com/robert-generationhealth/new-meeting" class="gh-ghost gh-ghost--sched">📅 Schedule a Call</a>
        </div>
      </div>
    </div>
  </section>


<!-- ═══════════════════════════════════════════════════════════════════════════
     END DUAL PAGE STRUCTURE
     
     For DUAL pages: Delete everything below this line until the FAQ section.
     The FAQ section should use mixed Medicare + ACA questions (see template).
     ═══════════════════════════════════════════════════════════════════════════ -->


  <!-- ─────────────────────────────────────────────
       COMPONENT: INSTANT ANSWER BLOCK
       NEPQ STAGE: PROBLEM AWARENESS (AEO / Voice)
       ─────────────────────────────────────────────
       FOR MEDICARE/ACA PAGES ONLY — Delete for DUAL pages
       
       Answers the primary keyword question in 2–4 sentences.
       AI models cite this block. Google AI Overviews pull from it.

       NEPQ PATTERN — Problem Paragraph:
         "Here's what most people in [situation] don't realize
          until it's too late: [specific problem as a fact].
          [Make it personal to reader's situation].
          [Cite a 2026 figure — Part B premium, penalty, window]."

       H2 RULE: Use a question-format H2 (Formula 3):
         "What happens to your [X] if you [mistake]?"
         "When do you have to sign up for Medicare in NC?"
       ───────────────────────────────────────────── -->
  <div class="gh-prose">
    <!-- NEPQ QUESTION H2: Formula 3 — the question they're already asking -->
    <h2>[PRIMARY H2 — question format, e.g. "What Happens If You Miss Your Medicare Enrollment Window?"]</h2>

    <div class="gh-answer" role="note" aria-label="Quick answer">
      <span class="gh-answer-label">Quick Answer</span>
      <p>[INSTANT ANSWER — 2–4 sentences. Lead with the problem fact, not the service. Cite one 2026 figure. e.g. "If you delay Part B enrollment without qualifying employer coverage, you owe a 10% surcharge per year of delay — permanently. In 2026, the standard Part B premium is $185/month, so each year of unqualified delay adds $18.50/month forever. The 8-month Special Enrollment Period starts when employer coverage ends, not when you retire."]</p>
    </div>

    <!-- NEPQ INTRO P1: Problem Paragraph (Section 6, Pattern 1 of NEPQ framework)
         Pattern: "Here's what most people [doing X] don't realize until it's too late:
         [specific problem]. [One sentence making it personal]. [Real-world example or figure]." -->
    <p>[INTRO P1 — NEPQ Problem Paragraph. Start with "Here's what most people..." or name the specific risk. DO NOT start with "Medicare is..." or "In North Carolina..."]</p>

    <!-- NEPQ INTRO P2: Transition to Rob. Include inline phone link. Vision bridge sentence. -->
    <p>[INTRO P2 — Brief vision bridge: what happens when this goes right. Close with Rob. e.g. "That's the conversation Rob has with every client before making a single recommendation. Call <a href="tel:828-761-3326" class="gh-inline">828-761-3326</a> or keep reading to understand what's at stake."]</p>
  </div>


  <!-- ─────────────────────────────────────────────
       COMPONENT: 2026 BASELINE / COST STRIP
       Dark gradient. 4-item grid. Shimmer cards.
       Use for key figures that anchor the page.
       
       MEDICARE FIGURES:
         Part B Premium: $202.90/mo | Part B Deductible: $283
         Part A Deductible: $1,736 | HD-G Deductible: $2,870
         Part D OOP Cap: $2,100 | MA OOP Max: $9,350
       
       ACA FIGURES:
         100% FPL (single): $15,650 | 400% FPL Cliff: $62,600
         Bronze Avg Deductible: $7,500 | Silver Avg Deductible: $5,300
         OOP Max: $10,600 | OEP: Nov 1 – Jan 15
       ───────────────────────────────────────────── -->
  <div class="gh-costs" aria-label="2026 cost figures">
    <div class="gh-costs-hd">
      <h3>[COST STRIP TITLE — MEDICARE: "2026 Medicare Plan Costs — North Carolina" | ACA: "2026 ACA Marketplace Figures — North Carolina"]</h3>
      <p>[COST STRIP SUBTITLE — MEDICARE: "What your quotes will show · Source: CMS.gov" | ACA: "What determines your subsidy · Source: HHS.gov"]</p>
    </div>
    <div class="gh-costs-grid">
      <div class="gh-cost-box">
        <div class="gh-cost-label">[LABEL 1 — MEDICARE: "Part B Premium" | ACA: "Subsidy Cliff"]</div>
        <span class="gh-cost-val">[VALUE 1 — MEDICARE: "$202.90/mo" | ACA: "$62,600"]</span>
        <div class="gh-cost-note">[NOTE 1 — MEDICARE: "Standard 2026 premium" | ACA: "400% FPL (single) — no subsidy above this"]</div>
      </div>
      <div class="gh-cost-box">
        <div class="gh-cost-label">[LABEL 2 — MEDICARE: "Part D OOP Cap" | ACA: "CSR Cutoff"]</div>
        <span class="gh-cost-val">[VALUE 2 — MEDICARE: "$2,100" | ACA: "$39,125"]</span>
        <div class="gh-cost-note">[NOTE 2 — MEDICARE: "New 2026 drug cost cap" | ACA: "250% FPL — Silver CSR available below this"]</div>
      </div>
      <div class="gh-cost-box">
        <div class="gh-cost-label">[LABEL 3 — MEDICARE: "MA OOP Max" | ACA: "Bronze Deductible"]</div>
        <span class="gh-cost-val">[VALUE 3 — MEDICARE: "$9,350" | ACA: "~$7,500"]</span>
        <div class="gh-cost-note">[NOTE 3 — MEDICARE: "In-network maximum" | ACA: "2026 average — you pay this before coverage"]</div>
      </div>
      <div class="gh-cost-box">
        <div class="gh-cost-label">[LABEL 4 — MEDICARE: "Part B Deductible" | ACA: "OOP Maximum"]</div>
        <span class="gh-cost-val">[VALUE 4 — MEDICARE: "$283" | ACA: "$10,600"]</span>
        <div class="gh-cost-note">[NOTE 4 — MEDICARE: "Annual deductible" | ACA: "2026 individual cap"]</div>
      </div>
    </div>
    <div class="gh-costs-src"><p style="color:rgba(255,255,255,.75) !important"><strong style="color:rgba(255,255,255,.75) !important">Source:</strong> <span style="color:rgba(255,255,255,.75) !important">[MEDICARE: CMS 2026 figures | ACA: HHS 2025 FPL (used for 2026 coverage)].</span> For personalized NC plan data, <a href="tel:828-761-3326" style="color:rgba(75,156,211,.9) !important">call 828-761-3326</a>.</p></div>
  </div>


  <!-- ─────────────────────────────────────────────
       COMPONENT: FORMULA BOX
       Use on cost/math-heavy pages.
       Remove if not relevant.
       ───────────────────────────────────────────── -->
  <div class="gh-prose">
    <div class="gh-formula">
      <span class="gh-formula-label">[FORMULA LABEL — e.g. "The Total Cost Formula"]</span>
      <div class="gh-formula-eq">[FORMULA — e.g. "(Monthly premiums × 12) + deductibles + copays + drug costs = Total annual cost"]</div>
      <p>[FORMULA EXPLANATION — 1–2 sentences contextualizing what the formula means for this page.]</p>
    </div>
  </div>


  <!-- ─────────────────────────────────────────────
       COMPONENT: 6-CARD GRID
       Use for feature/benefit breakdowns.
       Icons are emoji. 3×2 desktop, 2×3 mobile.
       ───────────────────────────────────────────── -->
  <div class="gh-prose">
    <h2>[6-GRID SECTION H2]</h2>
    <p>[INTRO SENTENCE for the grid.]</p>
  </div>
  <div class="gh-6grid" role="list">
    <div class="gh-6card" role="listitem">
      <div class="gh-6card-icon">💰</div>
      <h4>[CARD 1 TITLE]</h4>
      <p>[CARD 1 BODY — 2 sentences max.]</p>
    </div>
    <div class="gh-6card" role="listitem">
      <div class="gh-6card-icon">📋</div>
      <h4>[CARD 2 TITLE]</h4>
      <p>[CARD 2 BODY]</p>
    </div>
    <div class="gh-6card" role="listitem">
      <div class="gh-6card-icon">🏥</div>
      <h4>[CARD 3 TITLE]</h4>
      <p>[CARD 3 BODY]</p>
    </div>
    <div class="gh-6card" role="listitem">
      <div class="gh-6card-icon">💊</div>
      <h4>[CARD 4 TITLE]</h4>
      <p>[CARD 4 BODY]</p>
    </div>
    <div class="gh-6card" role="listitem">
      <div class="gh-6card-icon">🛡️</div>
      <h4>[CARD 5 TITLE]</h4>
      <p>[CARD 5 BODY]</p>
    </div>
    <div class="gh-6card" role="listitem">
      <div class="gh-6card-icon">🦷</div>
      <h4>[CARD 6 TITLE]</h4>
      <p>[CARD 6 BODY]</p>
    </div>
  </div>


  <!-- ─────────────────────────────────────────────
       COMPONENT: EXPERT TIP
       Teal gradient. Always attributed to Rob Simm.
       ───────────────────────────────────────────── -->
  <div class="gh-prose">
    <div class="gh-tip">
      <div class="gh-tip-header">💡 Expert Tip from Rob Simm</div>
      <p>[TIP TEXT — First-person. Practical insight Rob wouldn't find on Medicare.gov. 2–4 sentences.]</p>
    </div>
  </div>


  <!-- ─────────────────────────────────────────────
       COMPONENT: WARNING BOX (amber)
       Use for deadlines, penalties, common mistakes.
       ───────────────────────────────────────────── -->
  <div class="gh-prose">
    <div class="gh-warning">
      <div class="gh-warning-header">⚠️ [WARNING TITLE — e.g. "Important Enrollment Deadline"]</div>
      <p>[WARNING BODY — Factual, specific. Cite dates or dollar amounts where possible.]</p>
    </div>
  </div>


  <!-- ─────────────────────────────────────────────
       COMPONENT: CRITICAL ALERT (red)
       Use sparingly — only for high-stakes penalties
       or irreversible mistakes.
       ───────────────────────────────────────────── -->
  <!--
  <div class="gh-prose">
    <div class="gh-alert-critical">
      <div class="gh-warning-header">🚨 [ALERT TITLE]</div>
      <p>[ALERT BODY]</p>
    </div>
  </div>
  -->


</div><!-- /gh-container -->


<!-- ═══════════════════════════════════════════════════════════
     CTA MODAL #1  ·  NEPQ STAGE: VISION BRIDGE
     ───────────────────────────────────────────────────────────
     Placed at ~25–30% page depth, after the reader understands
     the problem. This is the VISION stage — invite them to see
     the better outcome before they commit to anything.

     HEADLINE: Use the vision bridge or contrast formula:
       "Here's what it looks like when you get this right."
       "One call. Your doctors confirmed. Your drugs priced."
       "Questions About [Topic] in [County]? Let's talk."
     NEVER: "Ready to Compare Plans?" / "Get a Free Quote"

     LEFT CARD: Compare tool — low friction, no SSN.
     RIGHT CARD: Talk to Rob — vision-bridge copy.
       "Your doctors verified. Your drugs priced. Total annual
        cost calculated. No follow-up calls from strangers."
     ═══════════════════════════════════════════════════════════ -->
<div class="gh-container">
  <div class="gh-cta-modal" aria-label="Get help comparing Medicare plans">
    <div class="gh-cta-hd">
      <!-- NEPQ VISION HEADLINE: What does it look like when it goes right?
           e.g. "One call. Your doctors confirmed. Your drugs priced. No strangers."
           e.g. "Questions About [Topic] in [County]? Let's figure out what's right for you." -->
      <h2>[CTA 1 HEADLINE — vision bridge or question. e.g. "Let's Make Sure You Get This Right."]</h2>
      <p>Licensed &middot; Independent &middot; All Carriers &middot; Your Data Never Sold</p>
    </div>
    <div class="gh-cta-grid">
      <div class="gh-cta-card">
        <h3>Compare Plans Side by Side</h3>
        <!-- MEDICARE: Medicare Advantage, Medigap, Part D | ACA: ACA Marketplace plans -->
        <p>[MEDICARE: County-specific plan data. Every Medicare Advantage, Medigap, and Part D plan in your NC county. No SSN, no spam calls. | ACA: Every ACA Marketplace plan available in your NC county. See your real subsidy, compare total costs. No SSN, no spam calls.]</p>
        <!-- MEDICARE: SunFire Matrix | ACA: HealthSherpa -->
        <a href="[MEDICARE: https://www.sunfirematrix.com/app/consumer/medicareadvocates/10447418/ | ACA: https://www.healthsherpa.com/?_agent_id=hst-t4qptg]" class="gh-ghost gh-ghost--primary gh-ghost--compare">Let's See What&rsquo;s Available &rarr;</a>
      </div>
      <div class="gh-cta-card">
        <!-- NEPQ VISION BRIDGE: Name the specific outcome, not the service -->
        <h3>Talk to Rob Directly</h3>
        <!-- MEDICARE vision | ACA vision -->
        <p>[MEDICARE: Doctors verified. Drugs priced. Total annual cost calculated. No follow-up calls from strangers. | ACA: Your real subsidy calculated. Doctors and drugs checked. Total annual cost — not just the monthly premium. No follow-up calls from strangers.]</p>
        <a href="tel:828-761-3326" class="gh-ghost gh-ghost--call">📞 Call 828-761-3326<span class="gh-ghost-sub">Mon&ndash;Fri 9am&ndash;7pm &middot; Sat 12pm&ndash;4pm</span></a>
        <a href="sms:828-761-3326" class="gh-ghost gh-ghost--text">💬 Text Us</a>
        <a href="https://calendly.com/robert-generationhealth/new-meeting" class="gh-ghost gh-ghost--sched">📅 Book a Free Call</a>
      </div>
    </div>
  </div>
</div>


<div class="gh-container">

  <!-- ─────────────────────────────────────────────
       COMPONENT: DECISION SCENARIO CARDS (3-card)
       NEPQ STAGE: CONSEQUENCE + VISION (per card)
       ─────────────────────────────────────────────
       Each card = one reader situation. Structure:
         BADGE: Who is this person? (Identity label)
         TITLE: The specific risk or question they face
         SETUP (P1): NEPQ Problem Paragraph — the situation
           and what they don't realize. 2–3 sentences.
         RESOLUTION (P2): NEPQ Vision Bridge — what Rob
           caught that a call center would have missed.
         VERDICT: The specific consequence avoided or
           the specific outcome achieved. Concrete.

       COLOR-CODING by urgency/type:
         blue = standard Medicare scenario
         green = favorable / positive outcome
         purple = complexity / comparison decision
         teal = ACA or special enrollment
         amber = warning / penalty / deadline risk
       ───────────────────────────────────────────── -->
  <div class="gh-prose">
    <!-- NEPQ SECTION H2: "The thing they didn't know they needed to know" formula -->
    <h2>[SCENARIO H2 — e.g. "Three Situations Where Getting Medicare Wrong Is Easy — and Expensive"]</h2>
    <p>[INTRO — 1 sentence: "Here are three situations Rob sees regularly. Each one ends differently depending on whether someone caught the problem in time."]</p>
  </div>
  <div class="gh-scenarios" role="list">
    <div class="gh-scenario" role="listitem">
      <div class="gh-scenario-hd gh-scenario-hd--blue">
        <!-- BADGE: Identity label — who is this person? -->
        <div class="gh-scenario-badge">[BADGE 1 — e.g. "Working Past 65" or "New to Medicare"]</div>
        <!-- TITLE: The specific risk or question they face -->
        <h4>[SCENARIO 1 TITLE — e.g. "Stayed on Employer Plan — But Employer Has 12 Employees"]</h4>
      </div>
      <div class="gh-scenario-body">
        <!-- P1: NEPQ Problem Paragraph — the situation + what they don't realize -->
        <p>[SCENARIO 1 SETUP — e.g. "She had employer coverage, so she assumed she was protected from Medicare penalties. What she didn't know: her employer had 14 employees, which means Medicare was her primary coverage the day she turned 65 — not her employer plan."]</p>
        <!-- P2: NEPQ Vision Bridge — what Rob caught that a call center wouldn't -->
        <p>[SCENARIO 1 RESOLUTION — e.g. "Rob caught it before the 8-month SEP closed. She enrolled in Part B on time and avoided a permanent 10% annual penalty. The call center quote she got online never asked about employer size."]</p>
        <div class="gh-verdict gh-verdict--blue">⚠️ [VERDICT — e.g. "The right question: How many people work at your employer?"]</div>
      </div>
    </div>
    <div class="gh-scenario" role="listitem">
      <div class="gh-scenario-hd gh-scenario-hd--green">
        <div class="gh-scenario-badge">[BADGE 2]</div>
        <h4>[SCENARIO 2 TITLE]</h4>
      </div>
      <div class="gh-scenario-body">
        <p>[SCENARIO 2 SETUP — NEPQ Problem Paragraph]</p>
        <p>[SCENARIO 2 RESOLUTION — NEPQ Vision Bridge]</p>
        <div class="gh-verdict gh-verdict--green">💡 [VERDICT — specific outcome or insight]</div>
      </div>
    </div>
    <div class="gh-scenario" role="listitem">
      <div class="gh-scenario-hd gh-scenario-hd--purple">
        <div class="gh-scenario-badge">[BADGE 3]</div>
        <h4>[SCENARIO 3 TITLE]</h4>
      </div>
      <div class="gh-scenario-body">
        <p>[SCENARIO 3 SETUP — NEPQ Problem Paragraph]</p>
        <p>[SCENARIO 3 RESOLUTION — NEPQ Vision Bridge]</p>
        <div class="gh-verdict gh-verdict--purple">💡 [VERDICT — specific outcome or insight]</div>
      </div>
    </div>
  </div>


  <!-- ═══════════════════════════════════════════════════════════
       COMPONENT: NEPQ OPTIMIZED COVERAGE VISUALIZATION (MEDICARE)
       The "third option" — MA early, switch to Medigap later.
       Data-backed projections with full disclaimers.
       
       CONDITIONAL: USE ON MEDICARE PAGES ONLY
       For ACA pages, comment out this section and uncomment
       the ACA NEPQ section below.
       ═══════════════════════════════════════════════════════════ -->
  <div class="gh-nepq" id="optimizedCoverage">
    
    <!-- Methodology box -->
    <div class="gh-nepq-methodology">
      <p class="gh-nepq-methodology-label">For illustrative purposes only</p>
      <p>The following projections are hypothetical illustrations based on national averages and typical utilization patterns. <strong>Your actual costs will vary</strong> based on your health status, geographic location, specific plan selection, and individual healthcare utilization.</p>
      <p>Sources: KFF/NAIC 2023, PolicyGuide 2026, ValuePenguin 2026, CMS National Health Expenditure Data</p>
    </div>
    
    <!-- Pivot + Optimized Coverage intro -->
    <div class="gh-nepq-pivot">
      <p>Everyone tells you there is one road to take.</p>
      <p>Is that really the right choice?</p>
      <h2>What if you could optimize your choice?</h2>
      <p class="gh-nepq-pivot-sub">The best of both paths — without the trade-offs.</p>
      
      <!-- Legend -->
      <div class="gh-nepq-legend">
        <span><span class="gh-nepq-legend-bar gh-nepq-legend-bar--ma"></span><span class="gh-nepq-legend-text--ma">Stay on MA</span></span>
        <span><span class="gh-nepq-legend-bar gh-nepq-legend-bar--mg"></span><span class="gh-nepq-legend-text--mg">Start Medigap</span></span>
        <span><span class="gh-nepq-legend-bar gh-nepq-legend-bar--opt"></span><span class="gh-nepq-legend-text--opt">Optimized Coverage</span></span>
      </div>
    </div>
    
    <!-- Optimized Coverage Graph -->
    <div class="gh-nepq-graph">
      <svg class="gh-nepq-svg" viewBox="0 0 600 280">
        <defs>
          <linearGradient id="greenGradNEPQ" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#10b981"/>
            <stop offset="100%" stop-color="#34d399"/>
          </linearGradient>
          <linearGradient id="purpleGradNEPQ" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#8b5cf6"/>
            <stop offset="100%" stop-color="#a78bfa"/>
          </linearGradient>
          <linearGradient id="amberGradNEPQ" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#f59e0b"/>
            <stop offset="100%" stop-color="#fbbf24"/>
          </linearGradient>
        </defs>
        
        <!-- Grid -->
        <line x1="70" y1="30" x2="560" y2="30" stroke="#f4f4f5" stroke-width="1"/>
        <line x1="70" y1="70" x2="560" y2="70" stroke="#f4f4f5" stroke-width="1"/>
        <line x1="70" y1="110" x2="560" y2="110" stroke="#f4f4f5" stroke-width="1"/>
        <line x1="70" y1="150" x2="560" y2="150" stroke="#f4f4f5" stroke-width="1"/>
        <line x1="70" y1="190" x2="560" y2="190" stroke="#f4f4f5" stroke-width="1"/>
        
        <!-- Y-axis labels -->
        <text x="60" y="34" text-anchor="end" font-size="11" fill="#a1a1aa" font-weight="500">$14k</text>
        <text x="60" y="74" text-anchor="end" font-size="11" fill="#a1a1aa" font-weight="500">$11k</text>
        <text x="60" y="114" text-anchor="end" font-size="11" fill="#a1a1aa" font-weight="500">$8k</text>
        <text x="60" y="154" text-anchor="end" font-size="11" fill="#a1a1aa" font-weight="500">$5k</text>
        <text x="60" y="194" text-anchor="end" font-size="11" fill="#a1a1aa" font-weight="500">$2k</text>
        
        <!-- LINE 1: Stay on MA — GREEN (ends highest) -->
        <path d="M80 181 Q120 178, 150 172 Q190 158, 220 138 Q280 108, 340 75 Q420 48, 550 28" 
              fill="none" stroke="url(#greenGradNEPQ)" stroke-width="3" stroke-linecap="round"/>
        
        <!-- LINE 2: Start Medigap — PURPLE (middle) -->
        <path d="M80 138 Q150 134, 220 128 Q320 118, 420 105 Q500 95, 550 88" 
              fill="none" stroke="url(#purpleGradNEPQ)" stroke-width="3" stroke-linecap="round"/>
        
        <!-- LINE 3: OPTIMIZED COVERAGE — AMBER with BUMP at switch -->
        <!-- MA phase: follows green line trajectory until age 72 -->
        <path d="M80 181 Q110 178, 140 174 Q170 168, 200 155 Q215 148, 225 142" fill="none" stroke="url(#amberGradNEPQ)" stroke-width="4.5" stroke-linecap="round"/>
        <!-- THE BUMP: jumps UP to 72-year-old Medigap rates -->
        <path d="M225 142 L235 125" fill="none" stroke="url(#amberGradNEPQ)" stroke-width="4.5" stroke-linecap="round"/>
        <!-- Post-switch: gradual Medigap increase, ends below pure Medigap -->
        <path d="M235 125 Q300 118, 380 108 Q480 98, 550 93" fill="none" stroke="url(#amberGradNEPQ)" stroke-width="4.5" stroke-linecap="round"/>
        
        <!-- Switch point — AMBER -->
        <circle cx="230" cy="133" r="16" fill="#f59e0b" opacity="0.08"/>
        <circle cx="230" cy="133" r="10" fill="#f59e0b" opacity="0.12"/>
        <circle cx="230" cy="133" r="7" fill="#fff" stroke="#f59e0b" stroke-width="3"/>
        <circle cx="230" cy="133" r="2.5" fill="#f59e0b"/>
        
        <!-- Savings indicator -->
        <line x1="535" y1="89" x2="535" y2="91" stroke="#10b981" stroke-width="2"/>
        <text x="555" y="78" font-size="14" fill="#10b981" font-weight="700">~$16k</text>
        <text x="555" y="92" font-size="10" fill="#10b981" font-weight="500">saved*</text>
        
        <!-- Switch annotation -->
        <line x1="230" y1="148" x2="230" y2="210" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.5"/>
        <text x="230" y="227" text-anchor="middle" font-size="12" fill="#d97706" font-weight="600">The switch*</text>
        <text x="230" y="243" text-anchor="middle" font-size="10" fill="#71717a">Age 70–72</text>
        
        <!-- Age labels -->
        <text x="80" y="265" text-anchor="middle" font-size="11" fill="#71717a" font-weight="500">65</text>
        <text x="220" y="265" text-anchor="middle" font-size="11" fill="#71717a" font-weight="500">71</text>
        <text x="360" y="265" text-anchor="middle" font-size="11" fill="#71717a" font-weight="500">77</text>
        <text x="550" y="265" text-anchor="middle" font-size="11" fill="#71717a" font-weight="500">85</text>
      </svg>
      
      <!-- Lifetime comparison totals -->
      <div class="gh-nepq-totals">
        <div class="gh-nepq-total gh-nepq-total--ma">
          <div class="gh-nepq-total-label gh-nepq-total-label--ma">Stay on MA*</div>
          <div class="gh-nepq-total-val gh-nepq-total-val--ma">~$158k</div>
        </div>
        <div class="gh-nepq-total gh-nepq-total--mg">
          <div class="gh-nepq-total-label gh-nepq-total-label--mg">Start Medigap*</div>
          <div class="gh-nepq-total-val gh-nepq-total-val--mg">~$137k</div>
        </div>
        <div class="gh-nepq-total gh-nepq-total--opt">
          <div class="gh-nepq-total-label gh-nepq-total-label--opt">Optimized Coverage*</div>
          <div class="gh-nepq-total-val gh-nepq-total-val--opt">~$121k</div>
        </div>
      </div>
      
      <p class="gh-nepq-note">*Optimized Coverage reflects 7 years on MA (~$29k) + 13 years Medigap at 72+ rates (~$92k). Medigap premiums start higher when enrolling at 72 vs 65.</p>
    </div>
    
    <!-- Underwriting Warning Box -->
    <div class="gh-nepq-warning">
      <div class="gh-nepq-warning-icon">
        <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <div>
        <h4>This strategy requires you to qualify for Medigap at the time of switch.</h4>
        <p>Outside of your initial 6-month Open Enrollment Period, insurance companies can use <strong>medical underwriting</strong> to evaluate your health. If you develop conditions like diabetes, heart disease, or cancer while on Medicare Advantage, you may be <strong>denied Medigap coverage entirely</strong> — or face significantly higher premiums. This is why working with a broker who monitors your health status and knows when to make the switch is critical.</p>
      </div>
    </div>
    
    <!-- The Close -->
    <div class="gh-nepq-close">
      <h3>Medicare isn't a one-time decision.</h3>
      <p>It's a 20-year conversation about maximizing your coverage —<br>and knowing when to make the right move.</p>
      <a href="tel:828-761-3326" class="gh-nepq-close-cta">Let's start that conversation → (828) 761-3326</a>
    </div>
    
    <!-- Disclosures -->
    <div class="gh-nepq-disclosures">
      <h4>Important Disclosures</h4>
      <p><strong>For educational and illustrative purposes only.</strong> The projections, estimates, and cost comparisons shown above are hypothetical illustrations based on national average data and are not guarantees of future costs or savings. Your actual costs will depend on many individual factors.</p>
      <p class="gh-nepq-disc-small"><strong>Medigap Underwriting:</strong> The "Optimized Coverage" strategy requires qualifying for a Medigap policy at the time of switch. Outside of your initial 6-month Medigap Open Enrollment Period or a guaranteed issue situation, insurance companies may use medical underwriting and can deny coverage, charge higher premiums, or exclude pre-existing conditions based on your health status at the time of application. There is no guarantee you will qualify for Medigap coverage when you want to switch.</p>
      <p class="gh-nepq-disc-small"><strong>Medicare Advantage Costs:</strong> MA out-of-pocket costs vary significantly by plan, provider network, geographic area, and your individual healthcare utilization. The illustrations assume typical utilization patterns that increase with age, but your experience may differ substantially.</p>
      <p class="gh-nepq-disc-small"><strong>Premium Estimates:</strong> Medigap premiums shown are national averages and will vary by state, insurance carrier, rating method (attained-age, issue-age, or community-rated), gender, tobacco use, and other factors. Premiums also increase over time due to age and healthcare inflation.</p>
      <p class="gh-nepq-disc-small"><strong>Not Personalized Advice:</strong> This information is general in nature and does not constitute personalized insurance, financial, tax, or legal advice. Please consult with a licensed insurance agent to discuss your specific situation, coverage needs, and options available in your area.</p>
    </div>
    
    <!-- Compliance footer -->
    <div class="gh-nepq-compliance">
      <p>Robert Simm is a licensed insurance agent in North Carolina (License #10447418, NPN #10447418). GenerationHealth.me is not connected with or endorsed by the U.S. Government or the federal Medicare program. This is a solicitation of insurance. A licensed agent may contact you.</p>
      <p>Data sources: Kaiser Family Foundation (KFF) analysis of NAIC data, CMS National Health Expenditure Data, PolicyGuide 2026 Medigap Rate Analysis, ValuePenguin Medicare Cost Analysis. Last updated: March 2026.</p>
    </div>
    
  </div>
  <!-- END NEPQ OPTIMIZED COVERAGE (MEDICARE) -->


  <!-- ═══════════════════════════════════════════════════════════
       ACA NEPQ SECTION — USE ON ACA PAGES ONLY
       "What Most People Get Wrong About ACA Plans"
       Two-part structure: Subsidy Reality Check + Total Cost Trap
       
       CONDITIONAL: Include this section on ACA pages.
                    Remove/comment out the Medicare NEPQ section above.
       ═══════════════════════════════════════════════════════════ -->
  <!--
  <div class="gh-aca-nepq" aria-label="ACA cost comparison visualization">
    
    <div class="gh-aca-nepq-intro">
      <h2>What Most People Get Wrong About ACA Plans</h2>
      <p>Two mistakes cost North Carolinians thousands every year: not knowing their real subsidy, and picking the "cheapest" plan that isn't actually cheapest.</p>
    </div>
    
    
    <div class="gh-aca-subsidy">
      <div class="gh-aca-subsidy-hd">
        <h3>Most People Don't Know What They Actually Qualify For</h3>
        <p>Your income determines your monthly subsidy. Here's what a single person qualifies for in 2026:</p>
      </div>
      
      <div class="gh-aca-subsidy-grid">
        
        <div class="gh-aca-subsidy-card gh-aca-subsidy-card--eligible">
          <div class="gh-aca-subsidy-income">Income: $28,000/yr</div>
          <div class="gh-aca-subsidy-amount">~$350/mo</div>
          <div class="gh-aca-subsidy-label">Monthly Subsidy</div>
          <div class="gh-aca-subsidy-note">179% FPL · Eligible for Cost-Sharing Reductions</div>
        </div>
        
        <div class="gh-aca-subsidy-card gh-aca-subsidy-card--partial">
          <div class="gh-aca-subsidy-income">Income: $50,000/yr</div>
          <div class="gh-aca-subsidy-amount">~$180/mo</div>
          <div class="gh-aca-subsidy-label">Monthly Subsidy</div>
          <div class="gh-aca-subsidy-note">320% FPL · Premium help only, no CSR</div>
        </div>
        
        <div class="gh-aca-subsidy-card gh-aca-subsidy-card--cliff">
          <div class="gh-aca-subsidy-income">Income: $65,000/yr</div>
          <div class="gh-aca-subsidy-amount">$0/mo</div>
          <div class="gh-aca-subsidy-label">No Subsidy</div>
          <div class="gh-aca-subsidy-note">416% FPL · Above the subsidy cliff*</div>
        </div>
        
      </div>
      
      <div class="gh-aca-subsidy-fpl">
        <span><strong>2026 FPL (single):</strong> $15,650</span>
        <span><strong>Medicaid cutoff:</strong> $21,597 (138%)</span>
        <span><strong>CSR cutoff:</strong> $39,125 (250%)</span>
        <span><strong>Subsidy cliff:</strong> $62,600 (400%)</span>
      </div>
    </div>
    
    
    <div class="gh-aca-trap">
      <div class="gh-aca-trap-hd">
        <h3>The Cheapest Premium Isn't the Cheapest Plan</h3>
        <p>Same person. Same income ($28,000). Three different decisions. Wildly different total costs.</p>
      </div>
      
      <div class="gh-aca-trap-scenario">
        
        <div class="gh-aca-trap-card gh-aca-trap-card--bronze">
          <span class="gh-aca-trap-badge gh-aca-trap-badge--bronze">Bronze Plan</span>
          <h4>"Lowest Premium"</h4>
          <div class="gh-aca-trap-row">
            <span class="gh-aca-trap-label">Monthly Premium</span>
            <span class="gh-aca-trap-val">$0</span>
          </div>
          <div class="gh-aca-trap-row">
            <span class="gh-aca-trap-label">Annual Premium</span>
            <span class="gh-aca-trap-val">$0</span>
          </div>
          <div class="gh-aca-trap-row">
            <span class="gh-aca-trap-label">Deductible</span>
            <span class="gh-aca-trap-val">$7,500</span>
          </div>
          <div class="gh-aca-trap-row">
            <span class="gh-aca-trap-label">If You Use Care</span>
            <span class="gh-aca-trap-val gh-aca-trap-val--total gh-aca-trap-val--bronze">$7,500+</span>
          </div>
          <div class="gh-aca-trap-verdict gh-aca-trap-verdict--bad">⚠️ One ER visit = financial hit</div>
        </div>
        
        <div class="gh-aca-trap-card gh-aca-trap-card--silver">
          <span class="gh-aca-trap-badge gh-aca-trap-badge--silver">Silver Plan</span>
          <h4>"Middle Ground"</h4>
          <div class="gh-aca-trap-row">
            <span class="gh-aca-trap-label">Monthly Premium</span>
            <span class="gh-aca-trap-val">$85</span>
          </div>
          <div class="gh-aca-trap-row">
            <span class="gh-aca-trap-label">Annual Premium</span>
            <span class="gh-aca-trap-val">$1,020</span>
          </div>
          <div class="gh-aca-trap-row">
            <span class="gh-aca-trap-label">Deductible</span>
            <span class="gh-aca-trap-val">$5,300</span>
          </div>
          <div class="gh-aca-trap-row">
            <span class="gh-aca-trap-label">If You Use Care</span>
            <span class="gh-aca-trap-val gh-aca-trap-val--total gh-aca-trap-val--silver">$6,320+</span>
          </div>
          <div class="gh-aca-trap-verdict gh-aca-trap-verdict--ok">Better, but missing the real savings</div>
        </div>
        
        <div class="gh-aca-trap-card gh-aca-trap-card--csr">
          <span class="gh-aca-trap-badge gh-aca-trap-badge--csr">Silver + CSR</span>
          <h4>"The Right Choice"</h4>
          <div class="gh-aca-trap-row">
            <span class="gh-aca-trap-label">Monthly Premium</span>
            <span class="gh-aca-trap-val">$85</span>
          </div>
          <div class="gh-aca-trap-row">
            <span class="gh-aca-trap-label">Annual Premium</span>
            <span class="gh-aca-trap-val">$1,020</span>
          </div>
          <div class="gh-aca-trap-row">
            <span class="gh-aca-trap-label">Deductible</span>
            <span class="gh-aca-trap-val">$650</span>
          </div>
          <div class="gh-aca-trap-row">
            <span class="gh-aca-trap-label">If You Use Care</span>
            <span class="gh-aca-trap-val gh-aca-trap-val--total gh-aca-trap-val--csr">$1,670</span>
          </div>
          <div class="gh-aca-trap-verdict gh-aca-trap-verdict--best">✓ $5,830 less than Bronze</div>
        </div>
        
      </div>
      
      <p class="gh-aca-trap-note">*Based on 2026 average plan data. CSR (Cost-Sharing Reductions) only available on Silver plans for incomes below 250% FPL. Your actual costs depend on plan, carrier, and county.</p>
    </div>
    
    
    <div class="gh-aca-warning">
      <div class="gh-aca-warning-icon">
        <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <div>
        <h4>Enhanced ACA subsidies expired December 31, 2025.</h4>
        <p>The 400% FPL subsidy cliff is back. If your income is above $62,600 (single) or $128,600 (family of 4), you now pay full price — no matter how expensive the plan. If you're near the cliff, small income adjustments (retirement contributions, HSA deposits) can make a $5,000+ difference in annual costs. <strong>This is exactly the kind of situation where 15 minutes with a broker pays for itself.</strong></p>
      </div>
    </div>
    
    
    <div class="gh-aca-close">
      <h3>15 minutes. Your real subsidy. Your real costs.</h3>
      <p>We look at your actual income, run your doctors and prescriptions through every plan available in NC, and compare total annual cost — not just the monthly premium.</p>
      <a href="tel:828-761-3326" class="gh-aca-close-cta">Let's find out what you qualify for → (828) 761-3326</a>
    </div>
    
    
    <div class="gh-aca-disclosures">
      <h4>Important Disclosures</h4>
      <p><strong>For educational and illustrative purposes only.</strong> The subsidy estimates, cost comparisons, and scenarios shown above are hypothetical illustrations based on 2026 federal poverty guidelines and national average plan data. Your actual subsidies and costs will depend on your specific income, household size, age, location, and the plans available in your county.</p>
      <p class="gh-aca-disc-small"><strong>Subsidy Estimates:</strong> Premium tax credit amounts are calculated based on the difference between the benchmark (second-lowest-cost Silver) plan premium and your expected contribution, which varies by income as a percentage of FPL. Actual subsidy amounts vary by age, location, and available plans.</p>
      <p class="gh-aca-disc-small"><strong>Cost-Sharing Reductions:</strong> CSR is only available on Silver plans purchased through the Health Insurance Marketplace for individuals with household income between 100% and 250% of FPL. CSR reduces deductibles, copays, and out-of-pocket maximums but does not reduce monthly premiums.</p>
      <p class="gh-aca-disc-small"><strong>Plan Costs:</strong> Deductible and premium examples are based on 2026 national averages from KFF analysis. Actual plan costs vary significantly by state, county, carrier, and plan design.</p>
      <p class="gh-aca-disc-small"><strong>Not Personalized Advice:</strong> This information is general in nature and does not constitute personalized insurance, financial, tax, or legal advice. Please consult with a licensed insurance agent to discuss your specific situation and options available in your area.</p>
    </div>
    
    <div class="gh-aca-compliance">
      <p>Robert Simm is a licensed insurance agent in North Carolina (License #10447418, NPN #10447418). GenerationHealth.me is not affiliated with or endorsed by the U.S. Government, the federal Health Insurance Marketplace, or Healthcare.gov.</p>
      <p>Data sources: KFF Marketplace Plan Analysis 2026, HealthCare.gov plan categories, HHS 2025 Federal Poverty Guidelines (used for 2026 coverage eligibility). Last updated: March 2026.</p>
    </div>
    
  </div>
  -->
  <!-- END ACA NEPQ SECTION -->


  <!-- ─────────────────────────────────────────────
       COMPONENT: HOW-TO STEPS
       Dark gradient. Use 4 OR 5 steps.
       4 steps: class="gh-steps-4"
       5 steps: class="gh-steps-5"
       ───────────────────────────────────────────── -->
  <div class="gh-howto" aria-label="Step-by-step instructions">
    <div class="gh-howto-hd">
      <h3>[HOW-TO TITLE — e.g. "How to Get Accurate Medicare Quotes in NC"]</h3>
      <p>[HOW-TO SUBTITLE — e.g. "The right process takes about 20 minutes."]</p>
    </div>
    <div class="gh-steps-4"><!-- or gh-steps-5 -->
      <div class="gh-step"><div class="gh-step-num">1</div><h4>[STEP 1 TITLE]</h4><p>[STEP 1 BODY — 2–3 sentences.]</p></div>
      <div class="gh-step"><div class="gh-step-num">2</div><h4>[STEP 2 TITLE]</h4><p>[STEP 2 BODY]</p></div>
      <div class="gh-step"><div class="gh-step-num">3</div><h4>[STEP 3 TITLE]</h4><p>[STEP 3 BODY]</p></div>
      <div class="gh-step"><div class="gh-step-num">4</div><h4>[STEP 4 TITLE]</h4><p>[STEP 4 BODY]</p></div>
      <!-- Add 5th step here if using gh-steps-5 -->
    </div>
  </div>


  <!-- ─────────────────────────────────────────────
       COMPONENT: 2-COL CARDS
       Use for side-by-side "what to gather" lists,
       pro/con tables, or two-sided comparisons.
       ───────────────────────────────────────────── -->
  <div class="gh-2col">
    <div class="gh-col-card">
      <h4>[COL CARD 1 TITLE]</h4>
      <ul class="gh-col-list">
        <li><span class="gh-col-list-arrow" aria-hidden="true">&#x2192;</span>[ITEM 1]</li>
        <li><span class="gh-col-list-arrow" aria-hidden="true">&#x2192;</span>[ITEM 2]</li>
        <li><span class="gh-col-list-arrow" aria-hidden="true">&#x2192;</span>[ITEM 3]</li>
        <li><span class="gh-col-list-arrow" aria-hidden="true">&#x2192;</span>[ITEM 4]</li>
        <li><span class="gh-col-list-arrow" aria-hidden="true">&#x2192;</span>[ITEM 5]</li>
      </ul>
    </div>
    <div class="gh-col-card">
      <h4>[COL CARD 2 TITLE]</h4>
      <ul class="gh-col-list">
        <li><span class="gh-col-list-arrow" aria-hidden="true">&#x2192;</span>[ITEM 1]</li>
        <li><span class="gh-col-list-arrow" aria-hidden="true">&#x2192;</span>[ITEM 2]</li>
        <li><span class="gh-col-list-arrow" aria-hidden="true">&#x2192;</span>[ITEM 3]</li>
        <li><span class="gh-col-list-arrow" aria-hidden="true">&#x2192;</span>[ITEM 4]</li>
        <li><span class="gh-col-list-arrow" aria-hidden="true">&#x2192;</span>[ITEM 5]</li>
      </ul>
    </div>
  </div>


  <!-- ─────────────────────────────────────────────
       COMPONENT: ENROLLMENT TIMING GRID
       Use on enrollment and deadline pages.
       Mark urgent windows with class="urgent".
       Remove if not relevant to page topic.
       ───────────────────────────────────────────── -->
  <div class="gh-prose">
    <h2>[TIMING SECTION H2 — e.g. "When to Enroll in Medicare in NC"]</h2>
  </div>
  <div class="gh-timing">
    <div class="gh-timing-card">
      <div class="gh-timing-window">[WINDOW NAME]</div>
      <div class="gh-timing-dates">[DATES]</div>
      <p>[WINDOW DESCRIPTION]</p>
    </div>
    <div class="gh-timing-card">
      <div class="gh-timing-window">[WINDOW NAME]</div>
      <div class="gh-timing-dates">[DATES]</div>
      <p>[WINDOW DESCRIPTION]</p>
    </div>
    <div class="gh-timing-card">
      <div class="gh-timing-window">[WINDOW NAME]</div>
      <div class="gh-timing-dates">[DATES]</div>
      <p>[WINDOW DESCRIPTION]</p>
    </div>
    <div class="gh-timing-card urgent">
      <div class="gh-timing-window">⚠️ [URGENT WINDOW NAME]</div>
      <div class="gh-timing-dates">[DATES]</div>
      <p>[URGENT DESCRIPTION]</p>
    </div>
  </div>


  <!-- ─────────────────────────────────────────────
       COMPONENT: BAR CHART INFOGRAPHIC
       Use for distribution / enrollment data.
       Remove if not relevant to page topic.
       ───────────────────────────────────────────── -->
  <!--
  <div class="gh-chart" aria-label="Chart: [TITLE]">
    <div class="gh-chart-header">
      <h3>[CHART TITLE]</h3>
      <p>[CHART SUBTITLE]</p>
    </div>
    <div class="gh-bar">
      <div class="gh-bar-top">
        <div class="gh-bar-title">[BAR LABEL]</div>
        <div class="gh-bar-pct">[XX]%</div>
      </div>
      <div class="gh-bar-desc">[BAR DESCRIPTION]</div>
      <div class="gh-bar-track"><div class="gh-bar-fill gh-bar-fill--blue" style="width:[XX]%"></div></div>
    </div>
    <div class="gh-bar">
      <div class="gh-bar-top"><div class="gh-bar-title">[BAR LABEL]</div><div class="gh-bar-pct">[XX]%</div></div>
      <div class="gh-bar-desc">[BAR DESCRIPTION]</div>
      <div class="gh-bar-track"><div class="gh-bar-fill gh-bar-fill--green" style="width:[XX]%"></div></div>
    </div>
    <div class="gh-bar">
      <div class="gh-bar-top"><div class="gh-bar-title">[BAR LABEL]</div><div class="gh-bar-pct">[XX]%</div></div>
      <div class="gh-bar-desc">[BAR DESCRIPTION]</div>
      <div class="gh-bar-track"><div class="gh-bar-fill gh-bar-fill--amber" style="width:[XX]%"></div></div>
    </div>
    <div class="gh-bar">
      <div class="gh-bar-top"><div class="gh-bar-title">[BAR LABEL]</div><div class="gh-bar-pct">[XX]%</div></div>
      <div class="gh-bar-desc">[BAR DESCRIPTION]</div>
      <div class="gh-bar-track"><div class="gh-bar-fill gh-bar-fill--purple" style="width:[XX]%"></div></div>
    </div>
    <div class="gh-chart-source">
      <p><strong>Source:</strong> [SOURCE CITATION]. For personalized NC plan data, <a href="tel:828-761-3326">call 828-761-3326</a>.</p>
    </div>
  </div>
  -->


  <!-- ─────────────────────────────────────────────
       COMPONENT: COMPARISON TABLE
       Use for MA vs Medigap feature tables.
       Remove if not relevant.
       ───────────────────────────────────────────── -->
  <!--
  <div class="gh-comparison" aria-label="Plan comparison table">
    <div class="gh-comparison-card">
      <h3>[PLAN TYPE A — e.g. Original Medicare]</h3>
      <div class="gh-comp-item"><div class="gh-comp-label">[ATTRIBUTE]</div><div class="gh-comp-value">[VALUE]</div></div>
      <div class="gh-comp-item"><div class="gh-comp-label">[ATTRIBUTE]</div><div class="gh-comp-value">[VALUE]</div></div>
      <div class="gh-comp-item"><div class="gh-comp-label">[ATTRIBUTE]</div><div class="gh-comp-value">[VALUE]</div></div>
      <div class="gh-comp-item"><div class="gh-comp-label">[ATTRIBUTE]</div><div class="gh-comp-value">[VALUE]</div></div>
    </div>
    <div class="gh-comparison-card">
      <h3>[PLAN TYPE B — e.g. Medicare Advantage]</h3>
      <div class="gh-comp-item"><div class="gh-comp-label">[ATTRIBUTE]</div><div class="gh-comp-value">[VALUE]</div></div>
      <div class="gh-comp-item"><div class="gh-comp-label">[ATTRIBUTE]</div><div class="gh-comp-value">[VALUE]</div></div>
      <div class="gh-comp-item"><div class="gh-comp-label">[ATTRIBUTE]</div><div class="gh-comp-value">[VALUE]</div></div>
      <div class="gh-comp-item"><div class="gh-comp-label">[ATTRIBUTE]</div><div class="gh-comp-value">[VALUE]</div></div>
    </div>
  </div>
  -->


  <!-- ─────────────────────────────────────────────
       COMPONENT: TESTIMONIAL
       Pull from Google reviews. Real quotes only.
       ───────────────────────────────────────────── -->
  <div class="gh-testimonial">
    <span class="gh-testimonial-quote" aria-hidden="true">&#x201C;</span>
    <blockquote>[TESTIMONIAL QUOTE — pulled from Google review. Attribute to county, not full name.]</blockquote>
    <div class="gh-testimonial-author">&mdash; [FIRST NAME OR INITIALS], [COUNTY] County Resident</div>
    <div class="gh-testimonial-link"><a href="https://www.google.com/maps/place/GenerationHealth" target="_blank" rel="noopener">Read all 20+ five-star reviews on Google &rarr;</a></div>
  </div>


  <!-- ─────────────────────────────────────────────
       COMPONENT: SAVINGS PROGRAMS GRID
       Use on cost pages. Remove if not relevant.
       
       MEDICARE programs: Extra Help (LIS), MSP, PACE
       ACA programs: Premium Tax Credits, CSR, Medicaid
       ───────────────────────────────────────────── -->
  <div class="gh-prose">
    <!-- MEDICARE: "Programs That Lower Your Medicare Costs" | ACA: "Programs That Lower Your ACA Costs" -->
    <h2>[MEDICARE: Programs That Lower Your Medicare Costs | ACA: Programs That Lower Your ACA Marketplace Costs]</h2>
    <p>Before finalizing any comparison, check whether you qualify for savings programs that can reduce your costs.</p>
  </div>
  <div class="gh-programs">
    <!-- ═══════════════════════════════════════════════════════════
         MEDICARE SAVINGS PROGRAMS (use on Medicare pages)
         ═══════════════════════════════════════════════════════════ -->
    <!-- MEDICARE PROGRAM 1: Extra Help -->
    <div class="gh-program-card">
      <div class="gh-program-icon">💊</div>
      <h4>[MEDICARE: Extra Help (Low Income Subsidy) | ACA: Premium Tax Credits]</h4>
      <p>[MEDICARE: Income under ~$22,590/year (individual) qualifies for reduced Part D premiums, deductibles, and copays. Can save $5,000+/year for people on expensive medications. | ACA: Income between 100%–400% FPL ($15,650–$62,600 single) qualifies for monthly subsidies that reduce your premium. Most people pay less than $100/month after subsidies.]</p>
      <span class="gh-program-limit">[MEDICARE: Income limit: ~$22,590/yr individual | ACA: Income range: $15,650–$62,600/yr single]</span>
    </div>
    <!-- MEDICARE PROGRAM 2: MSP | ACA PROGRAM 2: CSR -->
    <div class="gh-program-card">
      <div class="gh-program-icon">💰</div>
      <h4>[MEDICARE: Medicare Savings Programs (MSP) | ACA: Cost-Sharing Reductions (CSR)]</h4>
      <p>[MEDICARE: QMB pays your Part B premium ($202.90/mo), deductibles, and coinsurance. SLMB and QI pay Part B premium. Income limits up to $1,816/month individual in 2026. | ACA: Income below 250% FPL ($39,125 single) qualifies for reduced deductibles, copays, and out-of-pocket maximums on Silver plans. Deductible can drop from $5,300 to $650 or less.]</p>
      <span class="gh-program-limit">[MEDICARE: Income limit: up to $1,816/mo individual | ACA: Income limit: $39,125/yr single (250% FPL)]</span>
    </div>
  </div>


</div><!-- /gh-container -->


<!-- ═══════════════════════════════════════════════════════════
     TRUST LADDER  ·  NEPQ STAGE: VISION BRIDGE
     ───────────────────────────────────────────────────────────
     The ladder is where the reader sees the outcome before they
     commit. It's the "here's what it looks like when it goes
     right" moment — NEPQ Vision Bridge in step-by-step form.

     TITLE: What actually happens — not a generic process name.
       WRONG: "Our Simple 4-Step Process"
       RIGHT: "What Happens When You Work With Rob"
              "Here's How This Usually Goes"

     SUBTITLE: Vision language. Contrast with call center villain.
       e.g. "One broker. Real numbers. Your information stays private."
       e.g. "Not a 1-800 number. Not a stranger. Here's the process."

     STEP TITLES: Action-oriented. First-person from Rob's POV.
       1. "You Tell Me Your Situation" (not "Initial Consultation")
       2. "I Check Your Doctors and Drugs" (not "Plan Research")
       3. "We Look at Real Numbers Together" (not "Comparison")
       4. "You Make a Confident Decision" (not "Enrollment")
     ═══════════════════════════════════════════════════════════ -->
<div class="gh-container">
  <div class="gh-ladder" aria-label="How Rob's process works">
    <div class="gh-ladder-hd">
      <!-- NEPQ VISION TITLE: What it looks like when it goes right -->
      <h3>[LADDER TITLE — e.g. "What Happens When You Work With Rob"]</h3>
      <!-- NEPQ VILLAIN CONTRAST: Contrast against call center model -->
      <p>[LADDER SUBTITLE — e.g. "Not a 1-800 number. Not a stranger. One broker, one conversation, real numbers."]</p>
    </div>
    <div class="gh-ladder-steps">
      <!-- Each step title = action from Rob's first-person POV, not a corporate process label -->
      <div class="gh-ladder-step"><div class="gh-ladder-num">1</div><div class="gh-ladder-title">[STEP 1 — e.g. "You Tell Me Your Situation"]</div><div class="gh-ladder-desc">[STEP 1 DESC — what Rob asks, what the reader shares. 2 sentences. No jargon.]</div></div>
      <div class="gh-ladder-step"><div class="gh-ladder-num">2</div><div class="gh-ladder-title">[STEP 2 — e.g. "I Check Your Doctors and Drugs"]</div><div class="gh-ladder-desc">[STEP 2 DESC — the specific work Rob does. Name the tool or action.]</div></div>
      <div class="gh-ladder-step"><div class="gh-ladder-num">3</div><div class="gh-ladder-title">[STEP 3 — e.g. "We Look at Real Numbers Together"]</div><div class="gh-ladder-desc">[STEP 3 DESC — specific outcome: total annual cost, not just premium.]</div></div>
      <div class="gh-ladder-step"><div class="gh-ladder-num">4</div><div class="gh-ladder-title">[STEP 4 — e.g. "You Make a Confident Decision"]</div><div class="gh-ladder-desc">[STEP 4 DESC — the feeling of the outcome. No pressure. Your choice.]</div></div>
    </div>
  </div>
</div>


<!-- ═══════════════════════════════════════════════════════════
     CTA MODAL #2  ·  NEPQ STAGE: VISION BRIDGE (lower friction)
     ───────────────────────────────────────────────────────────
     Placed at ~70–75% page depth. By now the reader understands
     the problem AND the process. This CTA is lower commitment —
     an invitation, not a pitch.

     HEADLINE: Conversational question or soft invitation.
       e.g. "Questions About [Topic] in [County]?"
       e.g. "Still figuring out the right Medicare plan?"
       e.g. "Not sure where to start? That's exactly why Rob's here."
     NEVER: "Get Your Free Quote Today" / "Enroll Now"

     LEFT CARD: Compare tool — show them the data, no pressure.
     RIGHT CARD: Rob — Vision language, not service language.
       Default copy is approved and locked — only change the
       headline and left card text for each page.
     ═══════════════════════════════════════════════════════════ -->
<div class="gh-container">
  <!-- MEDICARE: aria-label="Get help comparing Medicare plans" | ACA: aria-label="Get help comparing ACA plans" -->
  <div class="gh-cta-modal" aria-label="Get help comparing plans">
    <div class="gh-cta-hd">
      <!-- NEPQ SOFT INVITATION: Question or "still figuring out" language -->
      <h2>[CTA 2 HEADLINE — conversational. e.g. "Questions About [Topic] in Durham or Wake County?"]</h2>
      <p>Licensed &middot; Independent &middot; All Carriers &middot; Your Data Never Sold</p>
    </div>
    <div class="gh-cta-grid">
      <div class="gh-cta-card">
        <h3>Compare Plans Side by Side</h3>
        <!-- MEDICARE: Medicare plan language | ACA: ACA plan language -->
        <p>[MEDICARE: County-specific plan data for every Medicare Advantage, Medigap, and Part D plan in North Carolina. No SSN, no spam calls. | ACA: Every ACA Marketplace plan in North Carolina. See your real subsidy, compare total annual costs. No SSN, no spam calls.]</p>
        <!-- MEDICARE: SunFire Matrix | ACA: HealthSherpa -->
        <a href="[MEDICARE: https://www.sunfirematrix.com/app/consumer/medicareadvocates/10447418/ | ACA: https://www.healthsherpa.com/?_agent_id=hst-t4qptg]" class="gh-ghost gh-ghost--primary gh-ghost--compare">Let&rsquo;s See What&rsquo;s Available &rarr;</a>
      </div>
      <div class="gh-cta-card">
        <!-- LOCKED: Vision bridge copy — do not change without NEPQ review -->
        <h3>Talk to Rob Directly</h3>
        <!-- MEDICARE vision | ACA vision -->
        <p>[MEDICARE: One call. Doctors and drugs checked. Total annual cost calculated. No follow-up calls from strangers. | ACA: One call. Your real subsidy calculated. Doctors and prescriptions checked. Total annual cost — not just the premium. No strangers.]</p>
        <a href="tel:828-761-3326" class="gh-ghost gh-ghost--call">📞 Call 828-761-3326<span class="gh-ghost-sub">Mon&ndash;Fri 9am&ndash;7pm &middot; Sat 12pm&ndash;4pm</span></a>
        <a href="sms:828-761-3326" class="gh-ghost gh-ghost--text">💬 Text Us</a>
        <a href="https://calendly.com/robert-generationhealth/new-meeting" class="gh-ghost gh-ghost--sched">📅 Book a Free Call</a>
      </div>
    </div>
  </div>
</div>


<div class="gh-container">

  <!-- ─────────────────────────────────────────────
       TRUST STRIP — 3 badges
       DO NOT CHANGE content. Update verify link if needed.
       ───────────────────────────────────────────── -->
  <div class="gh-trust-strip" aria-label="Trust indicators">
    <div class="gh-trust-badge">
      <div class="gh-trust-badge-icon">🔒</div>
      <h4>No SSN Required</h4>
      <p>ZIP code, doctors, and drug list is all it takes to start</p>
    </div>
    <div class="gh-trust-badge">
      <div class="gh-trust-badge-icon">🔝</div>
      <h4>No Spam Calls</h4>
      <p>One broker. Your information never sold to other agents.</p>
    </div>
    <div class="gh-trust-badge">
      <div class="gh-trust-badge-icon">🛡️</div>
      <h4>$0 Cost to Compare</h4>
      <p>License #10447418 &middot; <a href="https://www.ncdoi.gov/consumers/verify-license" target="_blank" rel="noopener">Verify at NCDOI.gov</a></p>
    </div>
  </div>


  <!-- ─────────────────────────────────────────────
       INTERNAL CROSS-LINKING  ·  REQUIRED FOR SEO
       ─────────────────────────────────────────────
       THIS SECTION IS MANDATORY. Do not skip or stub it.
       Internal linking is one of the highest-leverage SEO
       actions on the site — it passes authority between pages
       and tells Google how content clusters relate.

       REQUIRED ON EVERY PAGE — 3 TYPES OF LINKS:

       TYPE 1 — BODY COPY INLINE LINKS (most important)
         Minimum 3 contextual links inside article prose.
         Rules:
           • Anchor text = descriptive keyword phrase,
             NEVER "click here" or "this page"
           • Link to the most relevant page for that phrase
           • Place naturally inside a sentence — not at end
           • Use class="gh-inline" on <a> tags
         Examples:
           "...which is why understanding the
            <a href="/medicare-advantage-vs-medigap-nc/"
            class="gh-inline">difference between Medicare
            Advantage and Medigap</a> matters before..."
           "...the <a href="/medicare-part-b-penalty-nc/"
            class="gh-inline">Part B late enrollment
            penalty</a> is permanent and calculated..."

       TYPE 2 — RELATED GUIDES GRID (this section below)
         8 links minimum. Must be topically relevant.
         Priority order:
           1. Pillar page for this cluster (if this is a post)
           2. Other posts in the same cluster
           3. Adjacent cluster pillar pages
           4. County pages if geo-relevant
         Anchor text = page H1 or close variation.
         NEVER leave [RELATED-SLUG] placeholders unfilled.

       TYPE 3 — COUNTY GRID (locked, always include)
         Standard 8-county grid. Do not remove.
         Distributes authority to all geo pages.

       CROSS-LINKING AUDIT CHECKLIST (run before delivery):
         ☐ At least 3 inline links in article body
         ☐ All 8 related guide slots filled with real URLs
         ☐ No [BRACKET] placeholders remaining in href attrs
         ☐ Anchor text is descriptive, keyword-rich
         ☐ No two links point to the same destination
         ☐ Pillar page linked from all its cluster posts
         ☐ County grid present and all 8 links intact
       ───────────────────────────────────────────── -->
  <div class="gh-related">
    <!-- MEDICARE: "Related Medicare Guides" | ACA: "Related ACA Guides" -->
    <h3>[MEDICARE: Related Medicare Guides | ACA: Related ACA Guides]</h3>
    <div class="gh-related-grid">
      <!-- ═══════════════════════════════════════════════════════════
           MEDICARE RELATED GUIDES: Fill with Medicare cluster pages
           ACA RELATED GUIDES (defaults):
             1. /north-carolina-aca-health-insurance-plans/ (NC ACA Plans - Pillar)
             2. /north-carolina-health-insurance-marketplace/ (NC Marketplace)
             3. /cheap-health-insurance-north-carolina/ (Cheap Insurance NC)
             4. /north-carolina-health-insurance-broker/ (NC Broker Guide)
             5. /individual-health-insurance-north-carolina/ (Individual NC)
             6. /self-employed-health-insurance-north-carolina/ (Self-Employed NC)
             7. /lost-job-health-insurance-north-carolina/ (Lost Job NC)
             8. /best-health-insurance-plans-north-carolina/ (Best Plans NC)
           ═══════════════════════════════════════════════════════════ -->
      <a href="https://generationhealth.me/[RELATED-SLUG-1]/" class="gh-rlink"><span class="gh-rlink-arrow" aria-hidden="true">&#x2192;</span>[RELATED GUIDE 1]</a>
      <a href="https://generationhealth.me/[RELATED-SLUG-2]/" class="gh-rlink"><span class="gh-rlink-arrow" aria-hidden="true">&#x2192;</span>[RELATED GUIDE 2]</a>
      <a href="https://generationhealth.me/[RELATED-SLUG-3]/" class="gh-rlink"><span class="gh-rlink-arrow" aria-hidden="true">&#x2192;</span>[RELATED GUIDE 3]</a>
      <a href="https://generationhealth.me/[RELATED-SLUG-4]/" class="gh-rlink"><span class="gh-rlink-arrow" aria-hidden="true">&#x2192;</span>[RELATED GUIDE 4]</a>
      <a href="https://generationhealth.me/[RELATED-SLUG-5]/" class="gh-rlink"><span class="gh-rlink-arrow" aria-hidden="true">&#x2192;</span>[RELATED GUIDE 5]</a>
      <a href="https://generationhealth.me/[RELATED-SLUG-6]/" class="gh-rlink"><span class="gh-rlink-arrow" aria-hidden="true">&#x2192;</span>[RELATED GUIDE 6]</a>
      <a href="https://generationhealth.me/[RELATED-SLUG-7]/" class="gh-rlink"><span class="gh-rlink-arrow" aria-hidden="true">&#x2192;</span>[RELATED GUIDE 7]</a>
      <a href="https://generationhealth.me/[RELATED-SLUG-8]/" class="gh-rlink"><span class="gh-rlink-arrow" aria-hidden="true">&#x2192;</span>[RELATED GUIDE 8]</a>
    </div>
    <div class="gh-county-hd">Get Help by NC County</div>
    <div class="gh-county-grid">
      <!-- ═══════════════════════════════════════════════════════════
           MEDICARE COUNTY LINKS: /medicare-agents-in-[county]-county-nc/
           ACA COUNTY LINKS: /aca-health-insurance-[county]-county-nc/
           NOTE: ACA county pages not yet built — use pillar link for now
           ═══════════════════════════════════════════════════════════ -->
      <!-- MEDICARE county grid -->
      <a href="https://generationhealth.me/[MEDICARE: medicare-agents-in-durham-county-nc | ACA: north-carolina-aca-health-insurance-plans]/" class="gh-clink"><span class="gh-clink-pin" aria-hidden="true">📍</span>Durham</a>
      <a href="https://generationhealth.me/[MEDICARE: medicare-agents-in-wake-county-nc | ACA: north-carolina-aca-health-insurance-plans]/" class="gh-clink"><span class="gh-clink-pin" aria-hidden="true">📍</span>Wake</a>
      <a href="https://generationhealth.me/[MEDICARE: medicare-agents-in-mecklenburg-county-nc | ACA: north-carolina-aca-health-insurance-plans]/" class="gh-clink"><span class="gh-clink-pin" aria-hidden="true">📍</span>Mecklenburg</a>
      <a href="https://generationhealth.me/[MEDICARE: medicare-agents-in-guilford-county-nc | ACA: north-carolina-aca-health-insurance-plans]/" class="gh-clink"><span class="gh-clink-pin" aria-hidden="true">📍</span>Guilford</a>
      <a href="https://generationhealth.me/[MEDICARE: medicare-agents-in-forsyth-county-nc | ACA: north-carolina-aca-health-insurance-plans]/" class="gh-clink"><span class="gh-clink-pin" aria-hidden="true">📍</span>Forsyth</a>
      <a href="https://generationhealth.me/[MEDICARE: medicare-agents-in-buncombe-county-nc | ACA: north-carolina-aca-health-insurance-plans]/" class="gh-clink"><span class="gh-clink-pin" aria-hidden="true">📍</span>Buncombe</a>
      <a href="https://generationhealth.me/[MEDICARE: medicare-agents-in-orange-county-nc | ACA: north-carolina-aca-health-insurance-plans]/" class="gh-clink"><span class="gh-clink-pin" aria-hidden="true">📍</span>Orange</a>
      <a href="https://generationhealth.me/[MEDICARE: medicare-nc | ACA: north-carolina-aca-health-insurance-plans]/" class="gh-clink"><span class="gh-clink-pin" aria-hidden="true">📍</span>All NC Counties</a>
    </div>
  </div>

</div><!-- /gh-container -->


<!-- ═══════════════════════════════════════════════════════════
     AUTHOR CARD — DO NOT CHANGE except dates/page refs
     MEDICARE: "Licensed Medicare Broker"
     ACA: "Licensed Health Insurance Advisor"
     ═══════════════════════════════════════════════════════════ -->
<div class="gh-container">
  <div class="gh-author">
    <div class="gh-author-header">
      <!-- MEDICARE: "Licensed Medicare Broker" | ACA: "Licensed Health Insurance Advisor" -->
      <h2>Robert Simm, [MEDICARE: Licensed Medicare Broker | ACA: Licensed Health Insurance Advisor]</h2>
      <p>NC License #10447418 &middot; NPN #10447418 &middot; AHIP Certified</p>
      <p>12+ Years &middot; 500+ NC Families &middot; Your Data Never Shared</p>
      <div class="gh-author-contact-row">
        <span>📞 <a href="tel:828-761-3326">828-761-3326</a></span>
        <span>📍 2731 Meridian Pkwy, Durham, NC 27713</span>
      </div>
      <div class="gh-author-stars">★★★★★ 5.0 / 5 Stars &middot; 20 Google Reviews</div>
    </div>
    <div class="gh-author-body">
      <h3>About the Author</h3>
      <p><em>&ldquo;He guided. He found a solution. He returns calls. Just&hellip; helpful.&rdquo;</em> &mdash; That&rsquo;s not our marketing copy. It&rsquo;s what our clients actually say, review after review.</p>
      <p><strong>Robert Simm</strong> is a licensed, independent health insurance advisor and founder of <a href="https://generationhealth.me">GenerationHealth.me</a>. With 12+ years of experience and 500+ families helped, Rob specializes in Medicare, ACA Marketplace coverage, and supplemental health plans across North Carolina. There is only one rule: place the person in the best plan based on their needs, not financial incentives.</p>
      <p><strong>If you&rsquo;re reading this and you&rsquo;re not sure where to start &mdash; that&rsquo;s okay. That&rsquo;s exactly why I&rsquo;m here.</strong></p>
      <div class="gh-contact-box">
        <h3>📍 Contact Information</h3>
        <p><strong>Phone:</strong> <a href="tel:828-761-3326">828-761-3326</a></p>
        <p><strong>SMS:</strong> <a href="sms:828-761-3326">Text 828-761-3326</a></p>
        <p><strong>Email:</strong> <a href="/cdn-cgi/l/email-protection#780a171a1d0a0c381f1d161d0a190c111716101d19140c1056151d"><span class="__cf_email__" data-cfemail="0c7e636e697e784c6b6962697e6d7865636264696d607864226169">[email&#160;protected]</span></a></p>
        <p><strong>Address:</strong> 2731 Meridian Pkwy, Durham, NC 27713</p>
      </div>
      <div class="gh-hours-box">
        <h3>Office Hours</h3>
        <p><strong>Monday &ndash; Friday:</strong> 9:00 AM &ndash; 7:00 PM EST</p>
        <p><strong>Saturday:</strong> 12:00 PM &ndash; 4:00 PM EST</p>
        <p><strong>Sunday:</strong> Closed</p>
      </div>
      <div class="gh-license-box">
        <p><strong>NC Insurance License #10447418</strong> &middot; NPN #10447418<br>
        <a href="https://www.ncdoi.gov/consumers/verify-license" target="_blank" rel="noopener">Verify at NCDOI.gov &nearr;</a></p>
      </div>
      <div class="gh-disclaimer">
        <h3>⚖️ Compliance Disclaimer</h3>
        <!-- MEDICARE Disclaimer -->
        <!-- <p>Information is for educational purposes only and should not be considered legal or financial advice. Plan availability, premiums, and benefits vary by location and carrier. Always verify with <a href="https://www.medicare.gov" target="_blank" rel="noopener">Medicare.gov</a> before enrolling.</p>
        <p>We do not offer every plan available in your area. Please contact Medicare.gov or 1-800-MEDICARE for information on all of your options. GenerationHealth.me and Robert Simm are independent agents not affiliated with or endorsed by the U.S. government or the federal Medicare program.</p> -->
        
        <!-- ACA Disclaimer -->
        <!-- <p>Information is for educational purposes only and should not be considered legal or financial advice. Plan availability, premiums, and benefits vary by location and carrier. Always verify with <a href="https://www.healthcare.gov" target="_blank" rel="noopener">Healthcare.gov</a> before enrolling.</p>
        <p>We do not offer every plan available in your area. Please contact Healthcare.gov or 1-800-318-2596 for information on all of your options. GenerationHealth.me and Robert Simm are independent agents not affiliated with or endorsed by the U.S. government or the federal Health Insurance Marketplace.</p> -->
        
        <!-- USE ONE OF THE ABOVE based on PAGE-TYPE -->
        <!-- DUAL Disclaimer -->
        <!-- <p>Information is for educational purposes only and should not be considered legal or financial advice. Plan availability, premiums, and benefits vary by location and carrier. Always verify with <a href="https://www.medicare.gov" target="_blank" rel="noopener">Medicare.gov</a> or <a href="https://www.healthcare.gov" target="_blank" rel="noopener">Healthcare.gov</a> before enrolling.</p>
        <p>We do not offer every plan available in your area. Please contact Medicare.gov, Healthcare.gov, or call us directly for information on all of your options. GenerationHealth.me and Robert Simm are independent agents not affiliated with or endorsed by the U.S. government or the federal Medicare program or Health Insurance Marketplace.</p> -->
        
        <p>Information is for educational purposes only and should not be considered legal or financial advice. Plan availability, premiums, and benefits vary by location and carrier. Always verify with <a href="[MEDICARE: https://www.medicare.gov | ACA: https://www.healthcare.gov | DUAL: https://www.medicare.gov]" target="_blank" rel="noopener">[MEDICARE: Medicare.gov | ACA: Healthcare.gov | DUAL: Medicare.gov or Healthcare.gov]</a> before enrolling.</p>
        <p>We do not offer every plan available in your area. Please contact [MEDICARE: Medicare.gov or 1-800-MEDICARE | ACA: Healthcare.gov or 1-800-318-2596 | DUAL: Medicare.gov, Healthcare.gov, or call us directly] for information on all of your options. GenerationHealth.me and Robert Simm are independent agents not affiliated with or endorsed by the U.S. government or the federal [MEDICARE: Medicare program | ACA: Health Insurance Marketplace | DUAL: Medicare program or Health Insurance Marketplace].</p>
      </div>
    </div>
  </div>
</div>


<!-- ═══════════════════════════════════════════════════════════
     FAQ  ·  NEPQ STAGE: PROBLEM AWARENESS (closes loops)
     ───────────────────────────────────────────────────────────
     FAQ questions must match the reader's internal questions
     at this point in the page — after they understand the problem
     and have seen Rob's process. Use Formula 3 (Question Headline)
     for every FAQ question title:
       "What happens if [specific mistake or scenario]?"
       "Do I [common misconception]?"
       "How does [specific process] work?"

     RULE: FAQ questions must match FAQPage schema EXACTLY.
     RULE: Answer each question as Rob would answer it directly
           — conversational, specific, no hedging.
     RULE: At least one FAQ should surface a consequence
           (penalty, wrong plan, missed deadline) to reinforce
           NEPQ problem awareness.
     RULE: At least one FAQ should end with a soft Rob CTA:
           "If you're not sure, call Rob at 828-761-3326 — ..."
     
     DUAL PAGE FAQs:
     - Mix Medicare + ACA + General questions (aim for 2-2-2)
     - Use .gh-faq-tag spans to label each question type:
       <span class="gh-faq-tag gh-faq-tag--medicare">Medicare</span>
       <span class="gh-faq-tag gh-faq-tag--aca">ACA</span>
       <span class="gh-faq-tag gh-faq-tag--general">General</span>
     - Example Medicare Q: "What happens if I miss my Initial Enrollment Period?"
     - Example ACA Q: "How do I know if I qualify for subsidies?"
     - Example General Q: "Do I pay anything for your help?"
     ═══════════════════════════════════════════════════════════ -->
<div class="gh-container">
  <div class="gh-faq">
    <div class="gh-faq-title">Frequently Asked Questions</div>
    <!-- UPDATE: subtitle relevant to page topic -->
    <!-- DUAL: "Common questions about health insurance in Durham and Wake County." -->
    <div class="gh-faq-sub">[FAQ SUBTITLE — MEDICARE: "Common questions about Medicare in Durham County." | ACA: "Common questions about ACA coverage in Durham County." | DUAL: "Common questions about health insurance in Durham and Wake County."]</div>
    <div class="gh-faq-list">

      <!-- DUAL EXAMPLE FAQ STRUCTURE (delete for MEDICARE/ACA pages):
      <details class="gh-faq-item">
        <summary class="gh-faq-q"><span class="gh-faq-tag gh-faq-tag--medicare">Medicare</span> What happens if I miss my Initial Enrollment Period?
          <svg class="gh-faq-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
        </summary>
        <div class="gh-faq-a"><p>You may face late enrollment penalties and coverage gaps. The 10% Part B penalty compounds for every 12-month period you could have enrolled but didn't — and you pay it for the rest of your life.</p></div>
      </details>
      
      <details class="gh-faq-item">
        <summary class="gh-faq-q"><span class="gh-faq-tag gh-faq-tag--aca">ACA</span> How do I know if I qualify for subsidies?
          <svg class="gh-faq-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
        </summary>
        <div class="gh-faq-a"><p>Subsidies depend on your household income and family size. In 2026, individuals earning up to $62,600 (400% FPL) may qualify. I run the numbers for you in about 5 minutes.</p></div>
      </details>
      
      <details class="gh-faq-item">
        <summary class="gh-faq-q"><span class="gh-faq-tag gh-faq-tag--general">General</span> Do I pay anything for your help?
          <svg class="gh-faq-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
        </summary>
        <div class="gh-faq-a"><p>No — my services are completely free to you. I'm compensated by the insurance carriers, not by you. You pay the same premium whether you enroll directly or through me.</p></div>
      </details>
      -->

      <details class="gh-faq-item">
        <summary class="gh-faq-q">[FAQ QUESTION 1]
          <svg class="gh-faq-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
        </summary>
        <div class="gh-faq-a"><p>[FAQ ANSWER 1]</p></div>
      </details>

      <details class="gh-faq-item">
        <summary class="gh-faq-q">[FAQ QUESTION 2]
          <svg class="gh-faq-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
        </summary>
        <div class="gh-faq-a"><p>[FAQ ANSWER 2]</p></div>
      </details>

      <details class="gh-faq-item">
        <summary class="gh-faq-q">[FAQ QUESTION 3]
          <svg class="gh-faq-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
        </summary>
        <div class="gh-faq-a"><p>[FAQ ANSWER 3]</p></div>
      </details>

      <details class="gh-faq-item">
        <summary class="gh-faq-q">[FAQ QUESTION 4]
          <svg class="gh-faq-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
        </summary>
        <div class="gh-faq-a"><p>[FAQ ANSWER 4]</p></div>
      </details>

      <details class="gh-faq-item">
        <summary class="gh-faq-q">[FAQ QUESTION 5]
          <svg class="gh-faq-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
        </summary>
        <div class="gh-faq-a"><p>[FAQ ANSWER 5]</p></div>
      </details>

      <details class="gh-faq-item">
        <summary class="gh-faq-q">[FAQ QUESTION 6]
          <svg class="gh-faq-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
        </summary>
        <div class="gh-faq-a"><p>[FAQ ANSWER 6]</p></div>
      </details>

    </div>
  </div>
</div>

</article>
</main>


<!-- ═══════════════════════════════════════════════════════════
     FOOTER
     ═══════════════════════════════════════════════════════════ -->
<div class="gh-container">
  <!-- UPDATE: dates -->
  <!-- MEDICARE: "Licensed Medicare Broker" | ACA: "Licensed Health Insurance Advisor" | DUAL: "Licensed Health Insurance Advisor" -->
  <div class="gh-last-updated">
    Last Updated: <strong>[MONTH DD, YYYY]</strong> &nbsp;|&nbsp; Reviewed By: Robert Simm, [MEDICARE: Licensed Medicare Broker | ACA: Licensed Health Insurance Advisor | DUAL: Licensed Health Insurance Advisor], NC #10447418 &nbsp;|&nbsp; Next Review: <strong>October 2026</strong>
  </div>
</div>

<footer class="gh-footer-trust">
  <p><strong>GenerationHealth</strong> &middot; Independent Licensed Health Insurance Advisory &middot; North Carolina</p>
  <p>Robert Simm &middot; NC License #10447418 &middot; NPN #10447418 &middot; AHIP Certified &middot; <a href="https://www.ncdoi.gov/consumers/verify-license" target="_blank" rel="noopener">Verify License</a></p>
  <p>📞 <a href="tel:828-761-3326">828-761-3326</a> &middot; 📧 <a href="/cdn-cgi/l/email-protection#1b6974797e696f5b7c7e757e697a6f727475737e7a776f7335767e"><span class="__cf_email__" data-cfemail="55273a373027211532303b302734213c3a3b3d303439213d7b3830">[email&#160;protected]</span></a> &middot; 📍 2731 Meridian Pkwy, Durham, NC 27713</p>
  <!-- MEDICARE footer disclaimer -->
  <!-- <p style="margin-top:14px;">We do not offer every plan available in your area. Please contact Medicare.gov or 1-800-MEDICARE for information on all of your options. Not affiliated with or endorsed by the U.S. government or the federal Medicare program.</p> -->
  <!-- ACA footer disclaimer -->
  <!-- <p style="margin-top:14px;">We do not offer every plan available in your area. Please contact Healthcare.gov or 1-800-318-2596 for information on all of your options. Not affiliated with or endorsed by the U.S. government or the federal Health Insurance Marketplace.</p> -->
  <!-- DUAL footer disclaimer -->
  <!-- <p style="margin-top:14px;">We do not offer every plan available in your area. Please contact Medicare.gov, Healthcare.gov, or call us directly for information on all of your options. Not affiliated with or endorsed by the U.S. government or the federal Medicare program or Health Insurance Marketplace.</p> -->
  <p style="margin-top:14px;">We do not offer every plan available in your area. Please contact [MEDICARE: Medicare.gov or 1-800-MEDICARE | ACA: Healthcare.gov or 1-800-318-2596 | DUAL: Medicare.gov, Healthcare.gov, or call us directly] for information on all of your options. Not affiliated with or endorsed by the U.S. government or the federal [MEDICARE: Medicare program | ACA: Health Insurance Marketplace | DUAL: Medicare program or Health Insurance Marketplace].</p>
  <p style="margin-top:16px;font-size:12px;color:var(--mist);">
    <a href="https://generationhealth.me">Home</a> &middot;
    <!-- MEDICARE: Medicare NC Hub | ACA: ACA Plans Hub | DUAL: both links -->
    <a href="https://generationhealth.me/[MEDICARE: medicare-nc | ACA: north-carolina-aca-health-insurance-plans]/">[MEDICARE: Medicare NC Hub | ACA: ACA Plans Hub]</a> &middot;
    <a href="https://generationhealth.me/about/">About Rob Simm</a> &middot;
    <a href="https://generationhealth.me/contact/">Contact</a>
  </p>
</footer>


<!-- FLOATING CALL BUTTON — Mobile only, auto-shows via CSS -->
<a href="tel:828-761-3326" class="gh-float-call" id="floatCall" aria-label="Call 828-761-3326">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.24 1.02l-2.21 2.2z"/></svg>
</a>


<!-- ═══════════════════════════════════════════════════════════
     JAVASCRIPT
     ═══════════════════════════════════════════════════════════ -->
<script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script><script>
(function(){

  // ── Sticky header shadow
  var hdr = document.getElementById('siteHeader');
  if(hdr){
    window.addEventListener('scroll', function(){
      hdr.classList.toggle('scrolled', window.scrollY > 10);
    }, {passive:true});
  }

  // ── Float button pulse — fires once after first CTA modal scrolls past viewport
  var floatBtn = document.getElementById('floatCall');
  var hasPulsed = false;
  if(floatBtn){
    var firstModal = document.querySelector('.gh-cta-modal');
    if(firstModal){
      var obs = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if(!e.isIntersecting && !hasPulsed){
            floatBtn.classList.add('pulse');
            hasPulsed = true;
          }
        });
      }, {threshold:0});
      obs.observe(firstModal);
    }
  }

  // ── FAQ — close others when one opens (optional enhancement)
  // Native <details> handles open/close; this closes siblings
  document.querySelectorAll('.gh-faq details').forEach(function(det){
    det.addEventListener('toggle', function(){
      if(det.open){
        document.querySelectorAll('.gh-faq details').forEach(function(other){
          if(other !== det) other.removeAttribute('open');
        });
      }
    });
  });

  // ── DUAL PAGE: Smooth scroll for fork cards
  document.querySelectorAll('.gh-fork-card').forEach(function(card){
    card.addEventListener('click', function(e){
      var href = card.getAttribute('href');
      if(href && href.startsWith('#')){
        e.preventDefault();
        var target = document.querySelector(href);
        if(target){
          target.scrollIntoView({behavior:'smooth', block:'start'});
        }
      }
    });
  });

})();
</script>
</body>
</html>`;

// All placeholders in the template
export const TEMPLATE_PLACEHOLDERS = [
  'ALERT BODY',
  'ALERT TITLE',
  'ATTRIBUTE',
  'BADGE 2',
  'BADGE 3',
  'BAR DESCRIPTION',
  'BAR LABEL',
  'BRACKET',
  'BREADCRUMB PAGE',
  'CARD 1 TITLE',
  'CARD 2 BODY',
  'CARD 2 TITLE',
  'CARD 3 BODY',
  'CARD 3 TITLE',
  'CARD 4 BODY',
  'CARD 4 TITLE',
  'CARD 5 BODY',
  'CARD 5 TITLE',
  'CARD 6 BODY',
  'CARD 6 TITLE',
  'CATEGORY-SLUG',
  'CHART SUBTITLE',
  'CHART TITLE',
  'COL CARD 1 TITLE',
  'COL CARD 2 TITLE',
  'COUNTY',
  'DATES',
  'FAQ ANSWER 1',
  'FAQ ANSWER 2',
  'FAQ ANSWER 3',
  'FAQ ANSWER 4',
  'FAQ ANSWER 5',
  'FAQ ANSWER 6',
  'FAQ QUESTION 1',
  'FAQ QUESTION 2',
  'FAQ QUESTION 3',
  'FAQ QUESTION 4',
  'FAQ QUESTION 5',
  'FAQ QUESTION 6',
  'FIRST NAME OR INITIALS',
  'ITEM 1',
  'ITEM 2',
  'ITEM 3',
  'ITEM 4',
  'ITEM 5',
  'PAGE META DESCRIPTION',
  'PAGE TITLE',
  'PAGE-SLUG',
  'RELATED GUIDE',
  'RELATED GUIDE 1',
  'RELATED GUIDE 2',
  'RELATED GUIDE 3',
  'RELATED GUIDE 4',
  'RELATED GUIDE 5',
  'RELATED GUIDE 6',
  'RELATED GUIDE 7',
  'RELATED GUIDE 8',
  'RELATED-SLUG',
  'RELATED-SLUG-1',
  'RELATED-SLUG-2',
  'RELATED-SLUG-3',
  'RELATED-SLUG-4',
  'RELATED-SLUG-5',
  'RELATED-SLUG-6',
  'RELATED-SLUG-7',
  'RELATED-SLUG-8',
  'REVIEW 2 TEXT',
  'REVIEW 3 TEXT',
  'SCENARIO 2 TITLE',
  'SCENARIO 3 TITLE',
  'SOURCE CITATION',
  'STEP 1 TITLE',
  'STEP 2 BODY',
  'STEP 2 TITLE',
  'STEP 3 BODY',
  'STEP 3 TITLE',
  'STEP 4 BODY',
  'STEP 4 TITLE',
  'TITLE',
  'URGENT DESCRIPTION',
  'URGENT WINDOW NAME',
  'VALUE',
  'WINDOW DESCRIPTION',
  'WINDOW NAME',
  'XX',
  'YYYY-MM-DD',
] as const;

export type TemplatePlaceholder = typeof TEMPLATE_PLACEHOLDERS[number];

/**
 * assembleHTML — String replacement ONLY.
 * Takes the master template and a map of placeholder values.
 * Replaces [PLACEHOLDER] with the provided value.
 * Does NOT construct HTML. Does NOT modify template structure.
 */
export function assembleHTML(values: Record<string, string>): string {
  let html = MASTER_TEMPLATE;
  for (const [key, value] of Object.entries(values)) {
    // Replace all occurrences of [KEY] with value
    const pattern = new RegExp('\\[' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\]', 'g');
    html = html.replace(pattern, value);
  }
  return html;
}
