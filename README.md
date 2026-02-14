# Product Lab — UI Prototyping

High-fidelity UI mockups and prototypes for storytelling, iteration, and stakeholder feedback.  
Built with React + Tailwind CSS + shadcn/ui.

## Quick Start

```bash
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

## Creating a New Workflow

1. Copy `src/workflows/_template/` → `src/workflows/my-flow/`
2. Edit `Page.tsx` with your mockup content
3. Add an entry to `src/workflows/registry.ts`:

```ts
import { YourIcon } from 'lucide-react'

{
  id: 'my-flow',
  name: 'My Flow',
  description: 'What this workflow demonstrates',
  path: '/my-flow',
  icon: YourIcon,
  component: lazy(() => import('./my-flow/Page')),
},
```

4. Save — hot reload will show it in the sidebar immediately.

## Removing a Workflow

1. Delete the folder from `src/workflows/`
2. Remove its entry from `registry.ts`

That's it. No other files to touch.

## Available Components

| Component | Import | Use For |
|-----------|--------|---------|
| MetricCard | `@/components/MetricCard` | KPI cards with sparkline charts |
| StatusBadge | `@/components/StatusBadge` | Status pills (Active, Warning, etc.) |
| SparklineChart | `@/components/SparklineChart` | Inline SVG line charts |
| CommandSearch | `@/components/CommandSearch` | ⌘K search bar UI |
| Card | `@/components/ui/card` | Content containers |
| Table | `@/components/ui/table` | Data tables |
| Badge | `@/components/ui/badge` | Labels and tags |
| Button | `@/components/ui/button` | Buttons (multiple variants) |
| Input | `@/components/ui/input` | Form inputs |

## Icons

Browse all icons at [lucide.dev/icons](https://lucide.dev/icons)

```tsx
import { Settings, Users, BarChart3 } from 'lucide-react'
```

## Design System

- **Font**: Inter (400, 500, 600, 700)
- **Background**: White (#FFFFFF)
- **Borders**: #F1F5F9 (slate-100), 1px
- **Sidebar**: slate-900
- **Corners**: 8px (rounded-lg)
- **Shadows**: shadow-sm
- **Animation**: Framer Motion fade-in on page load

## Project Structure

```
src/
├── components/
│   ├── layout/       ← Shell (sidebar, top nav)
│   ├── ui/           ← shadcn/ui primitives
│   ├── MetricCard    ← Reusable mockup components
│   ├── StatusBadge
│   └── ...
├── workflows/
│   ├── registry.ts   ← Add new workflows here
│   ├── resource-overview/  ← Sample dashboard
│   └── _template/    ← Copy this to start
├── pages/
│   └── Home.tsx      ← Landing page
└── lib/
    └── utils.ts      ← Tailwind utilities
```
