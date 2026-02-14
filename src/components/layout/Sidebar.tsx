import { NavLink } from 'react-router-dom'
import { Home, Beaker } from 'lucide-react'
import { cn } from '@/lib/utils'
import { workflows } from '@/workflows/registry'

export function Sidebar() {
  return (
    <div className="flex h-full w-[240px] shrink-0 flex-col bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-5 border-b border-slate-800">
        <Beaker className="h-5 w-5 text-blue-400" />
        <span className="text-sm font-semibold tracking-tight">Dima's Product Lab</span>
      </div>

      {/* Home link */}
      <div className="px-3 pt-4">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              isActive
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            )
          }
        >
          <Home className="h-4 w-4" />
          Home
        </NavLink>
      </div>

      {/* Workflows */}
      <div className="flex-1 overflow-y-auto px-3 pt-6">
        <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-slate-500">
          Workflows
        </p>
        <nav className="space-y-1">
          {workflows.map((workflow) => (
            <NavLink
              key={workflow.id}
              to={workflow.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                )
              }
            >
              <workflow.icon className="h-4 w-4" />
              {workflow.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 p-4">
        <p className="text-[11px] text-slate-500">UI Prototyping</p>
      </div>
    </div>
  )
}
