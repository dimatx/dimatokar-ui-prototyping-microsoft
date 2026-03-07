# AI Handoff Notes

This repo is optimized for rapid UI prototyping, not production hardening.

## Default Loop

- Run `npm run dev` for iteration.
- Run `npm run check` before push.

## Workflow Pattern

- Add new workflow by copying `src/workflows/_template/Page.tsx`.
- Register it in `src/workflows/registry.ts`.
- Do not change app routing/layout for workflow-specific work.

## High-Risk Shell Files

Small edits in these files can cause visible screenshot regressions:

- `src/components/layout/Layout.tsx`
- `src/components/layout/TopNav.tsx`
- `src/components/layout/Sidebar.tsx`

When editing shell files:

- Preserve full-height sidebar behavior.
- Keep prototype disclaimer visually stable and centered.
- Prefer minimal spacing tweaks over structural flex rewrites.

## ADR Namespace Hotspots

- Main orchestrator: `src/workflows/adr-namespace/Page.tsx`
- Mock data/types: `src/workflows/adr-namespace/mockData.ts`
- Wizard flow: `src/workflows/adr-namespace/NewJobWizard.tsx`

For safe refactors, extract constants/view helpers first, then re-run `npm run check`.

## Demo-First Rule

Choose the smallest change that improves presentation quality and iteration speed.
Avoid adding production-only complexity unless it directly helps prototype velocity.
