/**
 * aeoPage.ts
 *
 * The AEO 3.0 county landing page template, exported as a string constant.
 * Contains {{variable}} placeholders that templateEngine.renderTemplate()
 * fills in from CountyData.
 *
 * Generated from medicare_broker_landing_v3_TEMPLATE.html.
 * DO NOT EDIT BY HAND — edit the source HTML and regenerate if you need changes.
 */

export const AEO_PAGE_TEMPLATE: string = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Medicare Broker {{county}} NC: Which Plans Actually Cover Your {{health_system}} Doctors?</title>
    <meta name="description" content="I check family history and health risks — then find the plan that covers what you might need next year, not just today. Rob Simm, NC Medicare broker serving {{county}} County.">
    
    <style>
        /* Apple-Quality Design System */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        :root {
            --gh-blue: #0071E3;
            --gh-blue-hover: #0077ED;
            --text-primary: #1D1D1F;
            --text-secondary: #6E6E73;
            --surface: #F5F5F7;
            --surface-elevated: #FFFFFF;
            --border: #D2D2D7;
            --border-light: #E5E5EA;
            --alert-red: #DC2626;
            --alert-yellow: #F59E0B;
            --alert-green: #10B981;
            
            --font-display: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
            --font-body: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
            
            --space-sm: 16px;
            --space-md: 24px;
            --space-lg: 48px;
            --space-xl: 80px;
            
            --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.04);
            --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
            --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
            
            --radius-sm: 8px;
            --radius-md: 12px;
            --radius-lg: 16px;
            --radius-pill: 980px;
        }
        
        body {
            font-family: var(--font-body);
            font-size: 17px;
            line-height: 1.6;
            color: var(--text-primary);
            background: var(--surface-elevated);
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        /* Header */
        .gh-header {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: saturate(180%) blur(20px);
            border-bottom: 1px solid var(--border-light);
            position: sticky;
            top: 0;
            z-index: 100;
        }
        
        .gh-nav {
            max-width: 1200px;
            margin: 0 auto;
            padding: 16px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .gh-logo {
            font-size: 20px;
            font-weight: 600;
            letter-spacing: -0.01em;
            color: var(--text-primary);
        }
        
        .gh-phone {
            font-size: 17px;
            font-weight: 600;
            color: var(--gh-blue);
            text-decoration: none;
            letter-spacing: -0.01em;
        }
        
        /* Container */
        .container {
            max-width: 740px;
            margin: 0 auto;
            padding: 0 24px;
        }
        
        .container-wide {
            max-width: 980px;
            margin: 0 auto;
            padding: 0 24px;
        }
        
        /* Hero Section */
        .hero {
            padding: var(--space-xl) 0 var(--space-lg) 0;
        }
        
        .hero h1 {
            font-family: var(--font-display);
            font-size: 48px;
            font-weight: 700;
            line-height: 1.08;
            letter-spacing: -0.03em;
            color: var(--text-primary);
            margin-bottom: 20px;
        }
        
        .hero .subhead {
            font-size: 24px;
            line-height: 1.4;
            color: var(--text-secondary);
            margin-bottom: 40px;
            font-weight: 400;
        }
        
        /* Broker Card */
        .broker-card {
            background: var(--surface-elevated);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 32px;
            margin: 40px 0;
            box-shadow: var(--shadow-md);
        }
        
        .broker-header {
            display: flex;
            align-items: center;
            gap: 24px;
            margin-bottom: 24px;
            padding-bottom: 24px;
            border-bottom: 1px solid var(--border-light);
        }
        
        .broker-photo {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: var(--gh-blue);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 32px;
            font-weight: 700;
            flex-shrink: 0;
            box-shadow: var(--shadow-sm);
        }
        
        .broker-info h2 {
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 4px;
            letter-spacing: -0.01em;
        }
        
        .broker-info .title {
            font-size: 15px;
            color: var(--text-secondary);
        }
        
        .broker-contact {
            display: grid;
            gap: 16px;
            margin-bottom: 24px;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .contact-icon {
            width: 32px;
            height: 32px;
            background: var(--surface);
            border-radius: var(--radius-sm);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
        }
        
        .contact-item a {
            color: var(--gh-blue);
            text-decoration: none;
            font-weight: 500;
            font-size: 17px;
        }
        
        .contact-item span {
            color: var(--text-secondary);
            font-size: 15px;
        }
        
        /* Body Copy */
        .hero-body {
            font-size: 19px;
            line-height: 1.6;
            color: var(--text-secondary);
        }
        
        .hero-body p {
            margin-bottom: 20px;
        }
        
        .hero-body strong {
            color: var(--text-primary);
            font-weight: 600;
        }
        
        /* CTA Button */
        .cta-primary {
            display: inline-block;
            background: var(--gh-blue);
            color: white;
            padding: 16px 32px;
            border-radius: var(--radius-pill);
            font-size: 19px;
            font-weight: 600;
            text-decoration: none;
            box-shadow: var(--shadow-md);
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            margin-top: 24px;
        }
        
        .cta-primary:hover {
            background: var(--gh-blue-hover);
            transform: translateY(-1px);
            box-shadow: var(--shadow-lg);
        }
        
        /* Section Styling */
        section {
            padding: var(--space-xl) 0;
        }
        
        section.alt {
            background: var(--surface);
            border-top: 1px solid var(--border-light);
            border-bottom: 1px solid var(--border-light);
        }
        
        h2 {
            font-family: var(--font-display);
            font-size: 36px;
            font-weight: 700;
            line-height: 1.1;
            letter-spacing: -0.02em;
            margin-bottom: 24px;
            color: var(--text-primary);
        }
        
        h3 {
            font-size: 24px;
            font-weight: 600;
            line-height: 1.3;
            letter-spacing: -0.01em;
            margin-bottom: 16px;
            color: var(--text-primary);
        }
        
        /* Color-Coded Callout Boxes */
        .callout {
            padding: 20px 24px;
            border-left: 4px solid;
            border-radius: var(--radius-sm);
            margin: 24px 0;
            box-shadow: var(--shadow-sm);
        }
        
        .callout-warning {
            background: #FEF3C7;
            border-left-color: var(--alert-yellow);
        }
        
        .callout-warning p {
            color: #92400E;
            font-weight: 500;
            margin-bottom: 0;
        }
        
        .callout-danger {
            background: #FEE2E2;
            border-left-color: var(--alert-red);
        }
        
        .callout-danger p {
            color: #7F1D1D;
            margin-bottom: 12px;
        }
        
        .callout-danger p:last-child {
            margin-bottom: 0;
        }
        
        .callout-success {
            background: #D1FAE5;
            border-left-color: var(--alert-green);
        }
        
        .callout-success p {
            color: #065F46;
            margin-bottom: 12px;
        }
        
        .callout-success p:last-child {
            margin-bottom: 0;
        }
        
        .callout-tip {
            background: #EFF6FF;
            border-left-color: var(--gh-blue);
        }
        
        .callout-tip p {
            color: #1E40AF;
            font-weight: 500;
            margin-bottom: 0;
        }
        
        /* Quote Callouts */
        .quote-callout {
            background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%);
            border: 1px solid var(--border);
            border-left: 4px solid var(--gh-blue);
            border-radius: var(--radius-md);
            padding: 24px 28px;
            margin: 32px 0;
            font-size: 21px;
            line-height: 1.5;
            font-style: italic;
            color: var(--text-primary);
            box-shadow: var(--shadow-sm);
        }
        
        /* Real Questions Section */
        .section-intro {
            font-size: 19px;
            color: var(--text-secondary);
            margin-bottom: 32px;
        }
        
        .question-list {
            list-style: none;
            margin-bottom: 32px;
        }
        
        .question-item {
            background: #FEF3C7;
            border-left: 4px solid var(--alert-yellow);
            border-radius: var(--radius-sm);
            padding: 16px 20px;
            margin-bottom: 16px;
            box-shadow: var(--shadow-sm);
        }
        
        .question-item p {
            font-size: 17px;
            line-height: 1.5;
            color: #92400E;
            font-weight: 500;
            margin: 0;
        }
        
        .question-item::before {
            content: '⚠️ ';
            font-size: 18px;
            margin-right: 8px;
        }
        
        /* Process Section */
        .process-grid {
            display: grid;
            gap: 24px;
            margin-top: 32px;
        }
        
        .process-box {
            background: var(--surface-elevated);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            padding: 24px;
            transition: all 0.2s;
            box-shadow: var(--shadow-sm);
        }
        
        .process-box:hover {
            border-color: var(--gh-blue);
            box-shadow: var(--shadow-md);
        }
        
        .process-box h4 {
            font-size: 19px;
            font-weight: 600;
            color: var(--gh-blue);
            margin-bottom: 12px;
        }
        
        .process-box p {
            font-size: 16px;
            line-height: 1.6;
            color: var(--text-secondary);
        }
        
        .process-conclusion {
            margin-top: 40px;
            padding: 24px;
            background: var(--surface-elevated);
            border: 2px solid var(--gh-blue);
            border-radius: var(--radius-md);
            font-size: 19px;
            font-weight: 600;
            line-height: 1.5;
            color: var(--text-primary);
            box-shadow: var(--shadow-sm);
        }
        
        /* Knowledge Gaps */
        .gap-item {
            margin-bottom: 48px;
        }
        
        .gap-item h3 {
            margin-bottom: 16px;
        }
        
        .gap-item p {
            font-size: 17px;
            line-height: 1.7;
            color: var(--text-secondary);
        }
        
        .gap-conclusion {
            margin-top: 48px;
            font-size: 21px;
            font-weight: 600;
            text-align: center;
            color: var(--text-primary);
        }
        
        /* Scenario Section */
        .scenario-note {
            margin-top: 32px;
            padding: 24px;
            background: var(--surface-elevated);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-sm);
        }
        
        .scenario-note p {
            font-size: 17px;
            line-height: 1.7;
            color: var(--text-secondary);
        }
        
        .scenario-note strong {
            color: var(--text-primary);
            font-weight: 600;
        }
        
        /* Comparison Table */
        .comparison-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin: 32px 0;
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            overflow: hidden;
            box-shadow: var(--shadow-md);
        }
        
        .comparison-table thead {
            background: var(--text-primary);
        }
        
        .comparison-table th {
            padding: 16px;
            text-align: left;
            font-weight: 600;
            font-size: 15px;
            color: white;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .comparison-table td {
            padding: 20px 16px;
            border-bottom: 1px solid var(--border-light);
            font-size: 15px;
            line-height: 1.6;
        }
        
        .comparison-table td:first-child {
            font-weight: 600;
            color: var(--text-primary);
        }
        
        .comparison-table td:not(:first-child) {
            color: var(--text-secondary);
        }
        
        .comparison-table tbody tr:last-child td {
            border-bottom: none;
        }
        
        .comparison-table tbody tr:hover {
            background: var(--surface);
        }
        
        .comparison-table .highlight {
            background: #EFF6FF;
            font-weight: 600;
            color: var(--gh-blue);
        }
        
        /* Honesty Box */
        .honesty-box {
            background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
            border: 2px solid var(--gh-blue);
            border-radius: var(--radius-lg);
            padding: 40px;
            margin: 40px 0;
            box-shadow: var(--shadow-md);
        }
        
        .honesty-box h3 {
            color: var(--gh-blue);
            margin-bottom: 20px;
        }
        
        .honesty-box p {
            font-size: 17px;
            line-height: 1.7;
            color: #1E40AF;
            margin-bottom: 16px;
        }
        
        .honesty-box p:last-child {
            font-weight: 600;
            font-size: 19px;
            margin-top: 24px;
            margin-bottom: 0;
        }
        
        /* Final CTA Section */
        .final-cta {
            padding: var(--space-xl) 0;
            text-align: center;
            background: var(--surface-elevated);
            border-top: 1px solid var(--border-light);
        }
        
        .cta-steps {
            max-width: 600px;
            margin: 40px auto;
            text-align: left;
        }
        
        .cta-step {
            padding: 24px 0;
            border-bottom: 1px solid var(--border-light);
        }
        
        .cta-step:last-child {
            border-bottom: none;
        }
        
        .cta-step strong {
            font-size: 19px;
            color: var(--text-primary);
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
        }
        
        .cta-step p {
            font-size: 15px;
            color: var(--text-secondary);
            line-height: 1.6;
        }
        
        .no-pressure {
            margin-top: 40px;
            font-size: 24px;
            font-weight: 600;
            color: var(--text-primary);
        }
        
        .btn-large {
            display: inline-block;
            background: var(--gh-blue);
            color: white;
            padding: 20px 48px;
            border-radius: var(--radius-pill);
            font-size: 24px;
            font-weight: 600;
            text-decoration: none;
            box-shadow: var(--shadow-lg);
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            margin-top: 32px;
        }
        
        .btn-large:hover {
            background: var(--gh-blue-hover);
            transform: translateY(-2px);
            box-shadow: 0 12px 32px rgba(0, 113, 227, 0.4);
        }
        
        /* Footer */
        .gh-footer {
            background: var(--text-primary);
            color: var(--text-secondary);
            padding: 48px 24px;
            text-align: center;
        }
        
        .gh-footer p {
            margin: 8px 0;
            font-size: 14px;
        }
        
        .gh-footer .phone {
            color: white;
            font-size: 21px;
            font-weight: 600;
            margin: 16px 0;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .hero h1 {
                font-size: 36px;
            }
            
            .hero .subhead {
                font-size: 21px;
            }
            
            h2 {
                font-size: 28px;
            }
            
            .broker-header {
                flex-direction: column;
                text-align: center;
            }
            
            .comparison-table {
                font-size: 13px;
            }
            
            .comparison-table th,
            .comparison-table td {
                padding: 12px 8px;
            }
            
            .honesty-box {
                padding: 24px;
            }
        }
    </style>
</head>
<body>
    
    <!-- Header -->
    <header class="gh-header">
        <nav class="gh-nav">
            <div class="gh-logo">
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="background: linear-gradient(135deg, #0071E3 0%, #0077ED 100%); 
                                    padding: 6px 12px; 
                                    border-radius: 6px; 
                                    font-weight: 700; 
                                    font-size: 18px; 
                                    color: white;
                                    letter-spacing: -0.02em;
                                    box-shadow: 0 2px 8px rgba(0, 113, 227, 0.25);">
                            GH.me
                        </div>
                        <div style="width: 1px; height: 20px; background: var(--border-light);"></div>
                        <div style="font-size: 16px; font-weight: 600; color: var(--text-primary); letter-spacing: -0.01em;">
                            GenerationHealth.me
                        </div>
                    </div>
                    <div style="font-size: 11px; 
                                color: var(--text-secondary); 
                                font-weight: 500;
                                letter-spacing: 0.3px;
                                text-transform: uppercase;
                                padding-left: 2px;">
                        Independent Medicare Broker
                    </div>
                </div>
            </div>
            <a href="tel:8287613326" class="gh-phone">(828) 761-3326</a>
        </nav>
    </header>
    
    <!-- Hero Section -->
    <section class="hero">
        <div class="container">
            <h1>Medicare Broker {{county}} NC: Which Plans Actually Cover Your {{health_system}} Doctors?</h1>
            
            <p class="subhead">I check family history and health risks — then find the plan that covers what you might need next year, not just today.</p>
            
            <!-- Broker Card -->
            <div class="broker-card">
                <div class="broker-header">
                    <div class="broker-photo">RS</div>
                    <div class="broker-info">
                        <h2>Rob Simm</h2>
                        <p class="title">Licensed NC Medicare Broker | NPN #10447418</p>
                    </div>
                </div>
                
                <div class="broker-contact">
                    <div class="contact-item">
                        <div class="contact-icon">📞</div>
                        <a href="tel:8287613326">(828) 761-3326</a>
                    </div>
                    <div class="contact-item">
                        <div class="contact-icon">📍</div>
                        <span>2731 Meridian Pkwy, Durham NC 27713</span>
                    </div>
                    <div class="contact-item">
                        <div class="contact-icon">🛡️</div>
                        <span>AHIP Certified | Serving {{county}} County and Surrounding Areas</span>
                    </div>
                </div>
            </div>
            
            <!-- Hero Body Copy -->
            <div class="hero-body">
                <p><strong>I don't just check if your current doctors and medications are covered.</strong></p>
                
                <p>Cancer runs in your family? I'm checking {{specialties[0]}} oncologists and whether you need PPO vs HMO.</p>
                
                <p>Heart disease history? I'm verifying your cardiologist, {{specialties[1]}}, and cardiac rehab are in-network.</p>
                
                <p>Healthy and active? I'm finding the $0 premium plan that keeps costs low.</p>
                
                <a href="tel:8287613326" class="cta-primary">Call (828) 761-3326 — 10 minutes, straight answers</a>
            </div>
        </div>
    </section>
    
    <!-- What You're Really Asking -->
    <section class="alt">
        <div class="container">
            <h2>What You're Really Asking</h2>
            <p class="section-intro">You're not confused about Medicare. You're asking:</p>
            
            <div class="question-list">
                <div class="question-item">
                    <p>If I get diagnosed with cancer next year, will my plan cover {{specialties[0]}}?</p>
                </div>
                
                <div class="question-item">
                    <p>If my cardiologist says I need a stent, am I going to get hit with a $15,000 surprise bill?</p>
                </div>
                
                <div class="question-item">
                    <p>If I need physical therapy after knee surgery, will I have to drive 40 minutes because none of the in-network providers are near me?</p>
                </div>
                
                <div class="question-item">
                    <p>What happens if my Parkinson's medication isn't covered and I can't afford $800/month?</p>
                </div>
            </div>
            
            <div class="callout-tip">
                <p><strong>These aren't hypotheticals. This is what happens when you pick the wrong plan.</strong></p>
            </div>
        </div>
    </section>
    
    <!-- Here's What I Actually Do -->
    <section>
        <div class="container">
            <h2>Here's What I Actually Do</h2>
            
            <div class="process-grid">
                <div class="process-box">
                    <h4>You tell me:</h4>
                    <p>Your doctors (primary care, specialists, hospitals)<br>
                    Your medications<br>
                    Your health concerns<br>
                    Your family history (cancer, heart disease, diabetes)</p>
                </div>
                
                <div class="process-box">
                    <h4>I check all Medicare plans available in {{county}} County:</h4>
                    <p>Which plans cover your {{health_system}} oncologist AND {{hospitals[0]}}<br>
                    Which plans put your medications on Tier 2 vs Tier 4 (this is a $2,000/year difference)<br>
                    Which plans have {{health_system}} physical therapy in-network vs requiring you to drive out of county<br>
                    Which plans cover the specialists you might need based on your family history</p>
                </div>
            </div>
            
            <div class="process-conclusion">
                Then you decide. Enroll with me, enroll yourself, or think about it. I don't get paid more for one plan vs another, so I have zero incentive to lie to you.
            </div>
        </div>
    </section>
    
    <!-- Why You Can't Do This Yourself -->
    <section class="alt">
        <div class="container">
            <h2>Why You Can't Do This Yourself</h2>
            
            <div class="gap-item">
                <h3>1. Medicare.gov's plan finder doesn't know which {{health_system}} doctors accept Medicare Advantage</h3>
                <p>The website says "{{health_system}} in-network" but {{hospitals[0]}} and {{hospitals[1]}} are often on different contracts. One might be in-network, the other requires a $500/day copay.</p>
            </div>
            
            <div class="gap-item">
                <h3>2. Insurance company websites list doctors who stopped taking MAPD patients 6 months ago</h3>
                <p>{{health_system}} specialists can be "in-network" on paper but won't accept Medicare Advantage referrals. You won't find out until you show up for your appointment.</p>
            </div>
            
            <div class="gap-item">
                <h3>3. Drug formularies change mid-year and your $15/month medication becomes $180/month</h3>
                <p>Plans can move drugs between tiers. If you're on 4+ medications, you need someone checking this every year, not just at enrollment.</p>
            </div>
            
            <div class="gap-item">
                <h3>4. "In-network" doesn't mean what you think it means</h3>
                <p>Your {{health_system}} cardiologist might be in-network, but if {{specialties[1]}} requires prior authorization and your plan denies it, you're paying $12,000 out-of-pocket for the procedure.</p>
            </div>
            
            <p class="gap-conclusion">This is what I check. This is why people call me.</p>
        </div>
    </section>
    
    <!-- Real Scenario -->
    <section>
        <div class="container">
            <h2>What Actually Happens If You Pick Wrong</h2>
            <p class="section-intro">Real scenario from 2025:</p>
            
            <div class="callout-danger">
                <p><strong>Client A picked Humana Gold Plus because $0 premium sounded good.</strong></p>
                <p>Then she was diagnosed with breast cancer.</p>
                <p>Her {{health_system}} oncologist was in-network. {{hospitals[0]}} was in-network.</p>
                <p><strong>But {{specialties[0]}} radiation was NOT in-network.</strong></p>
                <p>She found out after her first radiation appointment when the bill came:</p>
                <p style="font-size: 24px; font-weight: 700; color: #991B1B; margin-top: 16px;">$38,000 out-of-pocket maximum vs the $2,500 she expected.</p>
            </div>
            
            <div class="callout-success">
                <p><strong>We switched her to Aetna Medicare Eagle during a Special Enrollment Period</strong> (cancer diagnosis qualifies).</p>
                <p>{{specialties[0]}} radiation was in-network. She paid $2,500 total for the year.</p>
                <p style="font-size: 24px; font-weight: 700; color: #047857; margin-top: 16px;">The difference between picking the right plan and picking the wrong plan was $35,500.</p>
            </div>
            
            <div class="scenario-note">
                <p><strong>This is not a scare tactic. This is what happens.</strong></p>
            </div>
        </div>
    </section>
    
    <!-- Comparison Table -->
    <section class="alt">
        <div class="container-wide">
            <h2>Medicare.gov vs Calling Me</h2>
            
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th></th>
                        <th>Medicare.gov Plan Finder</th>
                        <th>Calling Me (828) 761-3326</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Coverage Info</td>
                        <td>Shows "{{health_system}} in-network"</td>
                        <td>I tell you if your specific {{health_system}} oncologist is covered</td>
                    </tr>
                    <tr>
                        <td>Plan Selection</td>
                        <td>Lists dozens of plans, doesn't explain differences</td>
                        <td class="highlight">I narrow it to 2-3 plans based on your family history and health risks</td>
                    </tr>
                    <tr>
                        <td>Network Knowledge</td>
                        <td>Doesn't know {{hospitals[0]}} vs {{hospitals[1]}} can be on different contracts</td>
                        <td>I know which plans cover which {{health_system}} facilities</td>
                    </tr>
                    <tr>
                        <td>Family History</td>
                        <td>Doesn't ask</td>
                        <td class="highlight">I ask about cancer, heart disease, diabetes history — then architect coverage around future risk</td>
                    </tr>
                    <tr>
                        <td>Provider Verification</td>
                        <td>Can't verify if your {{health_system}} specialist accepts MAPD referrals</td>
                        <td>I call {{health_system}} and verify before you enroll</td>
                    </tr>
                    <tr>
                        <td>Risk Assessment</td>
                        <td>None</td>
                        <td class="highlight">I analyze family genetics, lifestyle, exercise habits — then find plans that cover what you MIGHT need, not just what you need today</td>
                    </tr>
                    <tr>
                        <td>Ongoing Support</td>
                        <td>You're on your own if something goes wrong</td>
                        <td>I answer my phone when you call next year</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>
    
    <!-- Why I Don't Lie to You -->
    <section>
        <div class="container">
            <div class="honesty-box">
                <h3>Why I Don't Lie to You</h3>
                <p>I get paid the same commission whether you pick Humana, Aetna, or UnitedHealthcare. I get paid the same whether you pick a $0 premium plan or a $150 premium plan.</p>
                <p><strong>I have zero financial incentive to sell you the wrong plan.</strong></p>
                <p>Call centers get bonuses for enrolling X number of people in Plan A. I don't.</p>
                <p>If I sell you a plan that doesn't cover your {{health_system}} oncologist and you find out next year, you'll leave a 1-star review and tell 10 people not to trust me. I serve {{county}} County directly. I can't afford that.</p>
                <p>My incentive is to tell you the truth so you refer your friends.</p>
            </div>
        </div>
    </section>
    
    <!-- Final CTA -->
    <section class="final-cta">
        <div class="container">
            <h2>What Happens When You Call</h2>
            
            <div class="cta-steps">
                <div class="cta-step">
                    <strong>1. You talk to me — Rob Simm, not a call center agent</strong>
                    <p>(828) 761-3326</p>
                </div>
                
                <div class="cta-step">
                    <strong>2. You tell me your doctors and medications</strong>
                    <p>{{health_system}} cardiologist? {{health_system}} primary care? What medications are you on?</p>
                </div>
                
                <div class="cta-step">
                    <strong>3. I check every plan in {{county}} County against your specific situation</strong>
                    <p>Takes 10 minutes. I'll tell you which 2-3 plans cover everything and cost the least.</p>
                </div>
                
                <div class="cta-step">
                    <strong>4. You decide</strong>
                    <p>Enroll with me (free, I get paid by the insurance company), enroll yourself, or think about it. Your choice.</p>
                </div>
            </div>
            
            <p class="no-pressure">No pressure. No sales pitch. Just honest answers.</p>
            
            <a href="tel:8287613326" class="btn-large">Call (828) 761-3326</a>
        </div>
    </section>
    
    <!-- Pre-Footer Soft CTA -->
    <section style="background: var(--surface); padding: 60px 24px; border-top: 1px solid var(--border-light);">
        <div class="container" style="text-align: center;">
            <h2 style="font-size: 32px; margin-bottom: 16px;">Questions About Medicare Plans in {{county}} County?</h2>
            <p style="font-size: 17px; color: var(--text-secondary); margin-bottom: 32px;">
                Licensed · Independent · All Carriers · Your Data Never Sold
            </p>
            
            <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin-bottom: 40px;">
                <a href="https://www.sunfirematrix.com/app/consumer/medicareadvocates/10447418/#/" 
                   style="display: inline-block; background: var(--surface-elevated); color: var(--gh-blue); 
                          padding: 14px 28px; border-radius: var(--radius-pill); font-size: 17px; font-weight: 600; 
                          text-decoration: none; border: 2px solid var(--gh-blue); transition: all 0.2s;">
                    Compare Plans Side by Side →
                </a>
                <a href="tel:8287613326" class="cta-primary" style="margin: 0;">
                    Talk to Rob Directly
                </a>
            </div>
            
            <!-- Trust Badges -->
            <div style="display: flex; gap: 24px; justify-content: center; flex-wrap: wrap; font-size: 14px; color: var(--text-secondary);">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 16px;">🔒</span>
                    <span>No SSN Required</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 16px;">🚫</span>
                    <span>No Spam Calls</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 16px;">🛡️</span>
                    <span>$0 Cost to Compare</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 16px;">✓</span>
                    <span>License #10447418 · <a href="https://www.ncdoi.gov/consumers/verify-license" style="color: var(--gh-blue); text-decoration: none;">Verify</a></span>
                </div>
            </div>
        </div>
    </section>
    
    <!-- Related Medicare Guides & AEO/GEO Elements -->
    <section style="background: var(--surface-elevated); padding: 60px 24px; border-top: 1px solid var(--border-light);">
        <div class="container-wide">
            
            <!-- Related Medicare Guides -->
            <div style="margin-bottom: 48px;">
                <h3 style="font-size: 21px; font-weight: 600; color: var(--text-primary); margin-bottom: 24px; text-align: center;">Related Medicare Guides</h3>
                <div style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; font-size: 15px;">
                    <a href="https://generationhealth.me/medicare-enrollment-in-north-carolina/" style="color: var(--gh-blue); text-decoration: none; padding: 8px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); transition: all 0.2s;">Medicare Enrollment in NC</a>
                    <a href="https://generationhealth.me/compare-medicare-plans-in-north-carolina/" style="color: var(--gh-blue); text-decoration: none; padding: 8px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); transition: all 0.2s;">Compare Medicare Plans</a>
                    <a href="https://generationhealth.me/medigap-plans-in-north-carolina-plan-g-vs-plan-n/" style="color: var(--gh-blue); text-decoration: none; padding: 8px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); transition: all 0.2s;">Medigap Plan G vs N</a>
                    <a href="https://generationhealth.me/medicare-cost-comparison-nc/" style="color: var(--gh-blue); text-decoration: none; padding: 8px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); transition: all 0.2s;">Medicare Costs NC 2026</a>
                </div>
            </div>
            
            <!-- Get Help by NC County -->
            <div style="margin-bottom: 48px;">
                <h3 style="font-size: 21px; font-weight: 600; color: var(--text-primary); margin-bottom: 24px; text-align: center;">Get Help in Nearby NC Counties</h3>
                <div style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; font-size: 15px;">
                    {{#each neighboring_counties}}<a href="https://generationhealth.me/medicare-agents-in-{{this_slug}}-county-nc/" style="color: var(--gh-blue); text-decoration: none; padding: 8px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm);">{{this}}</a>
                    {{/each}}<a href="https://generationhealth.me/medicare-nc/" style="color: var(--gh-blue); text-decoration: none; padding: 8px 16px; background: var(--gh-blue); color: white; border: 1px solid var(--gh-blue); border-radius: var(--radius-sm); font-weight: 600;">All NC Counties →</a>
                </div>
            </div>
            
            <!-- Credentials Block (for EEAT) -->
            <div style="text-align: center; padding: 32px 0; border-top: 1px solid var(--border-light);">
                <p style="font-size: 18px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">Robert Simm, Licensed Medicare Broker</p>
                <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 12px;">
                    NC License #10447418 · NPN #10447418 · AHIP Certified
                </p>
                <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 12px;">
                    12+ Years Experience · 500+ NC Families Helped · 2731 Meridian Pkwy, Durham NC 27713
                </p>
                <p style="font-size: 14px; color: var(--text-secondary);">
                    ★★★★★ 5.0 Rating · 20+ Google Reviews · 
                    <a href="https://www.ncdoi.gov/consumers/verify-license" style="color: var(--gh-blue); text-decoration: none;">Verify License →</a>
                </p>
            </div>
            
            <!-- Last Updated & Review Info (EEAT Signal) -->
            <div style="text-align: center; font-size: 12px; color: var(--text-secondary); padding-top: 24px; border-top: 1px solid var(--border-light);">
                <p><strong>Last Updated:</strong> April 5, 2026 | <strong>Reviewed By:</strong> Robert Simm, Licensed Medicare Broker, NC #10447418 | <strong>Next Review:</strong> October 2026</p>
            </div>
            
        </div>
    </section>
    
    <!-- Site-Wide Footer Will Be Added Here by WordPress Theme -->
    
</body>
</html>
`;
