import { NavLink } from 'react-router-dom'
import { Home, Beaker, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { workflows } from '@/workflows/registry'

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <div
      className={cn(
        'flex h-full shrink-0 flex-col bg-slate-900 text-white transition-all duration-200',
        collapsed ? 'w-[52px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-3 border-b border-slate-800">
        {collapsed ? (
          <button
            onClick={onToggle}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors mx-auto"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        ) : (
          <>
            <Beaker className="h-5 w-5 shrink-0 text-blue-400 ml-2" />
            <span className="text-sm font-semibold tracking-tight whitespace-nowrap overflow-hidden">Dima's Product Lab</span>
            <button
              onClick={onToggle}
              className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-800 hover:text-white transition-colors"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Home link */}
      <div className="px-2 pt-4">
        <NavLink
          to="/"
          end
          title="Home"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              collapsed && 'justify-center px-0',
              isActive
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            )
          }
        >
          <Home className="h-4 w-4 shrink-0" />
          {!collapsed && 'Home'}
        </NavLink>
      </div>

      {/* Workflows */}
      <div className="flex-1 overflow-y-auto px-2 pt-6">
        {!collapsed && (
          <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Workflows
          </p>
        )}
        <nav className="space-y-1">
          {workflows.map((workflow) => (
            <NavLink
              key={workflow.id}
              to={workflow.path}
              title={workflow.name}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  collapsed && 'justify-center px-0',
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                )
              }
            >
              <workflow.icon className="h-4 w-4 shrink-0" />
              {!collapsed && workflow.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-slate-800 p-4">
          <p className="text-[11px] text-slate-500">UI Prototyping</p>
        </div>
      )}
    </div>
  )
}
