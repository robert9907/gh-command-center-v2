# GH Command Center v2

**GenerationHealth.me** — Next.js Operations Dashboard

Successor to the single-file `index.html` Command Center. Built on Next.js 14, deployed via Vercel.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

1. Push this repo to GitHub as `robert9907/gh-command-center-v2`
2. Import in Vercel → auto-deploys on push
3. No environment variables needed for Session 1

## Architecture

```
src/
├── app/
│   ├── layout.tsx          # Root layout + fonts
│   ├── page.tsx            # Main page (tab router)
│   └── globals.css         # Tailwind + GH brand theme
├── components/
│   ├── layout/
│   │   └── Header.tsx      # Nav bar + tab switching
│   ├── performance/
│   │   └── PerformancePanel.tsx  # Daily snapshot dashboard
│   └── shared/
│       ├── MetricCard.tsx   # Reusable KPI card
│       ├── MiniChart.tsx    # Sparkline chart
│       └── PlaceholderPanel.tsx  # Stub for future tabs
├── data/
│   └── seed.ts             # Performance history from v1
├── lib/
│   └── utils.ts            # Formatting, trends, localStorage
└── types/
    └── index.ts            # TypeScript interfaces
```

## Tabs (Build Roadmap)

| Tab | Status | Session |
|-----|--------|---------|
| Architecture | 🔲 Placeholder | 2 |
| Optimize | 🔲 Placeholder | 2 |
| Page Builder | 🔲 Placeholder | 3 |
| Citation Monitor | 🔲 Placeholder | 3 |
| Content Studio | 🔲 Placeholder | 4 |
| Keyword War Room | 🔲 Placeholder | 4 |
| Indexing | 🔲 Placeholder | 4 |
| Performance | ✅ Built | 1 |

## Brand

- **Colors**: Carolina `#4B9CD3`, NC Gold `#FFC72C`, Blue-800 `#1E3A5F`, Teal `#14B8A6`
- **Fonts**: DM Sans (body), Fraunces (display)
- **Design**: Dark mode, Apple-quality restraint

## Data Migration

The `seed.ts` file contains all 22 weeks of performance data from the v1 Command Center's `BAKED_DATA.perfData`. Future sessions will add localStorage persistence + optional backend sync.
