// ═══════════════════════════════════════════════════
// Page Builder — Zones, Content Cards, scan67
// ═══════════════════════════════════════════════════

export interface Zone {
  id: string;
  color: string;
  bg: string;
  border: string;
  label: string;
  desc: string;
  pct: number;
}

export const ZONES: Zone[] = [
  { id: 'z1', color: '#3B82F6', bg: 'rgba(59,130,246,0.07)', border: 'rgba(59,130,246,0.5)', label: 'Zone 1', desc: 'Top of Page', pct: 0.10 },
  { id: 'z2', color: '#16A34A', bg: 'rgba(22,163,74,0.07)', border: 'rgba(22,163,74,0.5)', label: 'Zone 2', desc: 'Upper Section', pct: 0.22 },
  { id: 'z3', color: '#7C3AED', bg: 'rgba(124,58,237,0.07)', border: 'rgba(124,58,237,0.5)', label: 'Zone 3', desc: 'Mid-Upper', pct: 0.34 },
  { id: 'z4', color: '#D97706', bg: 'rgba(217,119,6,0.07)', border: 'rgba(217,119,6,0.5)', label: 'Zone 4', desc: 'Middle', pct: 0.46 },
  { id: 'z5', color: '#DC2626', bg: 'rgba(220,38,38,0.07)', border: 'rgba(220,38,38,0.5)', label: 'Zone 5', desc: 'Mid-Lower', pct: 0.57 },
  { id: 'z6', color: '#0D9488', bg: 'rgba(13,148,136,0.07)', border: 'rgba(13,148,136,0.5)', label: 'Zone 6', desc: 'Lower Section', pct: 0.68 },
  { id: 'z7', color: '#DB2777', bg: 'rgba(219,39,119,0.07)', border: 'rgba(219,39,119,0.5)', label: 'Zone 7', desc: 'Near Bottom', pct: 0.78 },
  { id: 'z8', color: '#EA580C', bg: 'rgba(234,88,12,0.07)', border: 'rgba(234,88,12,0.5)', label: 'Zone 8', desc: 'Bottom of Page', pct: 0.88 },
];

export interface ContentCard {
  id: string;
  tag: string;
  tagline: string;
  q: string;
  a: string;
}

export const MEDICARE_CARDS: ContentCard[] = [
  { id: 'mc-seed', tag: 'SEED', tagline: 'Plant the idea \u2014 plan weakness', q: 'Every plan on the market was built with a weakness.', a: "Medicare salespeople won\u2019t tell you which one you\u2019re in. I will. Every plan \u2014 Medicare Advantage, Medigap, Part D \u2014 was designed with trade-offs. A $0 premium plan isn\u2019t free. A plan with a big name on the card isn\u2019t necessarily the best plan in your county. The weakness isn\u2019t in the brochure. It shows up when you need the plan to actually work." },
  { id: 'mc-water', tag: 'WATER', tagline: 'Raise the stakes \u2014 real costs', q: "Here\u2019s what Medicare Advantage actually costs when something goes wrong.", a: "Your PCP visit is $0. Your blood work is $0. Then you have a cardiac event. A cancer diagnosis. A surgery that requires a specialist who isn\u2019t in your network. Now you\u2019re looking at an $8,300 out-of-pocket maximum, prior authorization delays, and a facility bill you didn\u2019t expect. The $0 premium plan isn\u2019t free \u2014 you\u2019ll find that out the hard way, or you won\u2019t." },
  { id: 'mc-harvest', tag: 'HARVEST', tagline: 'Close \u2014 20-minute plan analysis', q: "Every plan I\u2019ve ever reviewed has a weakness.", a: "Most people don\u2019t know theirs until they need it most. Here\u2019s what I do: I pull every plan available in your county, run your doctors and prescriptions through each one, and show you the total annual cost side by side \u2014 not just the monthly premium. One free call, 20 minutes. You leave knowing exactly which plan fits your life and exactly why. No pressure. No obligation. Just the full picture, finally." },
];

export const ACA_CARDS: ContentCard[] = [
  { id: 'ac-seed', tag: 'SEED', tagline: 'Plant the idea \u2014 plan weakness', q: "If you\u2019re buying insurance on your own, the plan you picked probably wasn\u2019t built for you.", a: "It was built for the healthiest version of you. The marketplace makes it easy to pick a premium and move on. What it doesn\u2019t show you is the deductible you\u2019ll face before coverage kicks in, whether your doctors are actually in-network, or what your prescriptions will cost under that formulary. The plan that looks affordable in January can cost you thousands by June." },
  { id: 'ac-water', tag: 'WATER', tagline: 'Raise the stakes \u2014 real costs', q: "When you call the number on the letterhead, you\u2019re not talking to someone who knows your doctors.", a: "You\u2019re talking to a call center. They don\u2019t know your preferred hospital, your specialist, or whether your medications are covered. They know the plan options on their screen. A local independent broker knows the networks, knows the carriers, and has no incentive to steer you toward the more expensive plan. That\u2019s a different conversation entirely." },
  { id: 'ac-harvest', tag: 'HARVEST', tagline: 'Close \u2014 free plan review', q: "I can show you in 15 minutes whether your current plan is costing you more than it should.", a: "We look at your actual subsidy based on your real income, run your doctors and prescriptions through every plan available to you, and compare total annual cost \u2014 not just the monthly premium. Most people find they\u2019re either overpaying or underprotected. Either way, 15 minutes gives you the full picture. No obligation. No follow-up calls from strangers. Just clarity." },
];

export const NEPQ_CARDS: ContentCard[] = [
  { id: 'nq-situation', tag: 'SITUATION', tagline: 'Where are they right now?', q: "Are you actually sure you understand what you\u2019re signing up for?", a: "Most people turning 65 get buried in Medicare mail, carrier calls, and TV ads \u2014 all saying the same thing. Nobody\u2019s sitting down with you and walking through what your plan actually covers, what it doesn\u2019t, and what it costs when something goes wrong. That\u2019s the conversation that\u2019s missing." },
  { id: 'nq-problem', tag: 'PROBLEM AWARENESS', tagline: 'Do they know there\u2019s a problem?', q: "Do you know what your plan\u2019s weakness is?", a: "Every plan on the market was built with one. The $0 premium, the low monthly cost \u2014 those numbers look great until something goes wrong. Most people never find the weakness in their plan. They find it when they need the plan to work." },
  { id: 'nq-consequence', tag: 'CONSEQUENCE', tagline: 'What happens if nothing changes?', q: "What happens if you\u2019re on the wrong plan when something serious comes up?", a: "Nothing \u2014 until it does. A diagnosis. A surgery. A specialist that isn\u2019t covered. That\u2019s when the affordable plan starts costing you thousands. And by the time you find out, the enrollment window is usually closed. That\u2019s not a hypothetical \u2014 that\u2019s what happens to people every year in North Carolina." },
  { id: 'nq-solution', tag: 'SOLUTION AWARENESS', tagline: 'Do they see the better path?', q: "What if you could see exactly what your plan costs before you ever needed it?", a: "Not just the premium. The total \u2014 doctors verified, drugs priced, out-of-pocket maximum calculated. That\u2019s how this decision should be made. Most people never get shown their plan this way. When you do, the right choice becomes obvious. That\u2019s exactly what I do in a free 20-minute review." },
  { id: 'nq-commit', tag: 'COMMITTING', tagline: 'Lock in the next step', q: "What would it mean to make this decision knowing exactly where you stand?", a: "No stack of mail. No guessing. No finding out later that your plan has a gap you didn\u2019t know about. Here\u2019s what I do: I pull every plan available in your county, run your doctors and drugs through each one, and show you the total annual cost side by side. One call, 20 minutes, no obligation. You leave knowing exactly what to do \u2014 and exactly why." },
];
