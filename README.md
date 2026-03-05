# Product Lab — UI Prototyping

High-fidelity UI mockups and interactive prototypes for product storytelling, stakeholder demos, and design iteration.  
Built with React + TypeScript + Tailwind CSS + shadcn/ui. **Never shipped — for screenshots and demos only.**

## Quick Start

```bash
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

## Deployment

Pushes to `main` auto-deploy to **Azure Static Web Apps** via GitHub Actions (`.github/workflows/azure-static-web-apps-agreeable-flower-03b208803.yml`). Live within ~2 minutes.

## Workflows

| Workflow | Description |
|----------|-------------|
| **ADR Namespace** | Texas-Wind namespace — devices, assets, IoT Hubs, IoT Operations instances, jobs, firmware, credentials, policies, provisioning, certificate management, groups. Full drill-down with device/asset detail views, a new-job wizard, and mock state transitions. |
| **Job List** | All namespace jobs — filtering, sorting, status summary cards. |
| **Job Detail** | Single job execution view — device pie chart, per-hub progress bars, activity timeline. |

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
| StatusBadge | `@/components/StatusBadge` | Status pills (Healthy, Warning, Error, etc.) |
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
- **Sidebar**: slate-900 with slate-800 dividers
- **Corners**: 8px (`rounded-lg`)
- **Shadows**: `shadow-sm` only
- **Animation**: Framer Motion fade-in on page load
- **Aesthetic target**: Linear / Vercel — clean, high-density, airy

## Key Conventions

- **Wizard labels** use the click-to-fill pattern — clicking a label populates the field with a demo value so presenters can fill forms in one click.
- **StatusBadge** statuses: `Healthy` (green), `Adding` (blue/pulsing), `Warning` / `Degraded` (amber), `Error` / `Critical` (red), `Inactive` / `Disabled` (gray).
- **CollapsibleHeading** pattern for long sections — collapsed state shows a summary status so you can scan without expanding.
- **Never use PowerShell to edit source files** — UTF-8 characters get corrupted. Use the editor tools only.

## Project Structure

```
src/
├── components/
│   ├── layout/           ← Shell (sidebar, top nav)
│   ├── ui/               ← shadcn/ui primitives
│   ├── MetricCard.tsx    ← KPI card with sparkline
│   ├── StatusBadge.tsx   ← Status pill component
│   ├── SparklineChart.tsx
│   └── CommandSearch.tsx
├── workflows/
│   ├── registry.ts       ← Add new workflows here
│   ├── adr-namespace/    ← Main ADR namespace prototype
│   ├── job-list/         ← Job list view
│   ├── job-detail/       ← Job detail view
│   └── _template/        ← Copy this to start a new workflow
├── pages/
│   └── Home.tsx          ← Landing page / workflow cards
└── lib/
    └── utils.ts          ← Tailwind utilities
```
