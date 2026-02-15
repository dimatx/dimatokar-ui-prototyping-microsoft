import { lazy } from 'react'
import { LayoutDashboard, Wind } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface Workflow {
  id: string
  name: string
  description: string
  path: string
  icon: LucideIcon
  component: React.LazyExoticComponent<React.ComponentType>
}

export const workflows: Workflow[] = [
  {
    id: 'adr-namespace',
    name: 'ADR Namespace',
    description: 'Texas-Wind namespace with devices, assets, hubs, IoT Operations instances, and jobs',
    path: '/adr-namespace',
    icon: Wind,
    component: lazy(() => import('./adr-namespace/Page')),
  },
  {
    id: 'resource-overview',
    name: 'Resource Overview',
    description: 'SaaS dashboard with metrics, charts, and service status table',
    path: '/resource-overview',
    icon: LayoutDashboard,
    component: lazy(() => import('./resource-overview/Page')),
  },
  // ──────────────────────────────────────────────
  // ADD NEW WORKFLOWS HERE
  //
  // 1. Copy  src/workflows/_template/  →  src/workflows/my-flow/
  // 2. Edit  Page.tsx  with your mockup content
  // 3. Add an entry to this array:
  //
  //    {
  //      id: 'my-flow',
  //      name: 'My Flow',
  //      description: 'What this demonstrates',
  //      path: '/my-flow',
  //      icon: SomeIcon,  // import from lucide-react
  //      component: lazy(() => import('./my-flow/Page')),
  //    },
  // ──────────────────────────────────────────────
]
