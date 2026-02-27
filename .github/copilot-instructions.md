# Copilot Instructions for Dima's Product Lab

## What This Repo Is

A **local-only** high-fidelity UI prototyping environment for a product manager (Dima) to create interactive mockups, take screenshots/videos, and demo concepts to PMs and developers. This code is never shipped — it exists for storytelling, iteration, and feedback.

## Tech Stack (Do Not Change)

- **React** + **TypeScript** (strict mode off — speed over safety)
- **Vite** for dev server and hot reload
- **Tailwind CSS** with CSS variables for theming
- **shadcn/ui** components in `src/components/ui/` (Card, Table, Badge, Button, Input, etc.)
- **Framer Motion** for animations
- **Lucide React** for icons ([lucide.dev/icons](https://lucide.dev/icons))
- Path alias: `@/` maps to `src/`

## Design System — Follow These Exactly

- **Font**: Inter (400, 500, 600, 700) via Google Fonts
- **Background**: Pure white `#FFFFFF` (`bg-white`)
- **Borders**: `#F1F5F9` (slate-100), always 1px
- **Sidebar**: `bg-slate-900` with `border-slate-800` dividers
- **Rounded corners**: `rounded-lg` (8px) on all cards, tables, modals
- **Shadows**: `shadow-sm` only — very subtle elevation
- **Typography**: `font-semibold` for headings, `text-sm text-muted-foreground` for labels
- **Aesthetic target**: Linear, Vercel — clean, professional, high-density but airy

## Architecture: Workflow System

Each mockup/demo is a **workflow** — a self-contained page that lives in `src/workflows/<id>/Page.tsx`.

### To create a new workflow:
1. Copy `src/workflows/_template/Page.tsx` → `src/workflows/<id>/Page.tsx`
2. Add an entry to `src/workflows/registry.ts`
3. That's it — sidebar and routing pick it up automatically

### To remove a workflow:
1. Delete `src/workflows/<id>/`
2. Remove its entry from `registry.ts`

**No other files need to change.** Never modify `App.tsx`, `Layout`, `Sidebar`, or routing for individual workflows.

### Registry entry format:
```ts
{
  id: 'my-flow',
  name: 'Display Name',
  description: 'Short description for home page card',
  path: '/my-flow',
  icon: SomeIcon, // from lucide-react
  component: lazy(() => import('./my-flow/Page')),
}
```

## Key Patterns to Follow

### Page structure
Every workflow page should:
- Wrap content in `<motion.div>` with fade-in: `initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}`
- Start with a header section (title + subtitle)
- Use `space-y-8` for vertical rhythm between sections

### Status badges
Use `<StatusBadge status="..." />` from `@/components/StatusBadge`. Supported statuses:
- **Green**: `Healthy`, `Active`, `Running`
- **Blue (pulsing)**: `Adding`
- **Amber**: `Warning`, `Degraded`
- **Red**: `Error`, `Critical`
- **Gray**: `Inactive`, `Disabled`

Prefer `Healthy` over `Active` for resource health.

### Collapsible sections
For tables/lists that take vertical space, use the `CollapsibleHeading` pattern with `AnimatePresence`. Show a summary status indicator when collapsed so the user gets key info without expanding.

### Interactive flows
Mock interactions are welcome (modals, state transitions, timers). They make demos compelling. Example: "Add Linked Hub" shows a picker, hub appears as "Adding", transitions to "Healthy" after a delay.

### Product terminology
- Say **"IoT Operations"** not "AIO" — and use `&nbsp;` or `whitespace-nowrap` to prevent line breaks between "IoT" and "Operations"
- Say **"Provisioning"**, **"Certificate Management"**, **"Device Update"** — not DPS, ADU
- These are **namespace-scoped services** — don't imply shared/cross-namespace unless specifically asked

### Wizard field labels — click to fill
Every `<label>` in a wizard that has a demo/sample value **must** use the click-to-fill pattern so presenters can populate forms in one click:

```tsx
<label
  className="text-xs font-medium cursor-pointer select-none hover:text-blue-600 transition-colors inline-flex items-center gap-1 group"
  title="Click to fill"
  onClick={() => setValue('demo value')}
>
  Field Name
  <span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-500 transition-opacity">← click to fill</span>
</label>
```

Apply this to **all** editable fields in every wizard (text inputs, textareas, selects). Fields without a meaningful demo value (e.g. toggle groups) are exempt.

## Reusable Components Available

| Component | Path | Use For |
|-----------|------|---------|
| `MetricCard` | `@/components/MetricCard` | KPI cards with sparkline charts |
| `StatusBadge` | `@/components/StatusBadge` | Status pills with colored dots |
| `SparklineChart` | `@/components/SparklineChart` | Inline SVG line charts |
| `CommandSearch` | `@/components/CommandSearch` | ⌘K search bar |
| Card, Table, Badge, Button, Input | `@/components/ui/*` | shadcn/ui primitives |

Build new reusable components in `src/components/` when a pattern repeats across workflows.

## Context Files

The `/context/` folder in the workspace (separate repo) contains product documents, transcripts, and architecture notes. **Read these** when building domain-specific workflows to get terminology, relationships, and data shapes right.

## Git Workflow

- Always commit and push after completing a set of changes
- Write descriptive commit messages listing what changed
- This is a single-branch (`main`) repo — no PRs needed

## Deployment

- This repo **does deploy** — to **Azure Static Web Apps** via GitHub Actions
- The workflow file is `.github/workflows/azure-static-web-apps-agreeable-flower-03b208803.yml`
- Every push to `main` triggers an automatic build and deploy
- Changes are live within ~2 minutes of pushing

## File Editing Rules

- **Never use PowerShell (or any terminal command) to write or modify source files** — it corrupts UTF-8 characters (e.g. `·` becomes `Â·`)
- Only use the file editing tools (`replace_string_in_file`, `create_file`, etc.) for all source code changes
- Terminal is allowed for read-only operations: `git`, `tsc --noEmit`, etc.

## General Principles

1. **Speed over perfection** — this is throwaway prototyping code. Don't over-engineer.
2. **Visual fidelity matters** — screenshots and recordings are the output. Polish the UI.
3. **Mock data should feel real** — use plausible names, numbers, and statuses. Avoid "Lorem ipsum" or "Test 1, Test 2".
4. **Interactivity sells the story** — add state transitions, modals, animations where they help tell the product narrative.
5. **Keep workflows independent** — each workflow should be self-contained. Don't create cross-workflow dependencies.
