import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Server,
  Cpu,
  Drill,
  RefreshCw,
  KeyRound,
  Upload,
  Activity,
  ChevronDown,
  ChevronLeft,
  Wind,
  Shield,
  Puzzle,
  FileText,
  Users,
  LayoutDashboard,
  Layers,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type LeftMenuItem = {
  id: string
  label: string
  icon: LucideIcon
  disabled?: boolean
}

type LeftMenuSection = {
  title: string
  collapsible?: boolean
  defaultCollapsed?: boolean
  items: LeftMenuItem[]
}

const LEFT_MENU_SECTIONS: LeftMenuSection[] = [
  {
    title: 'Dashboard',
    items: [
      { id: '', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'health', label: 'Health', icon: Activity },
    ],
  },
  {
    title: 'Resources',
    items: [
      { id: 'all-resources', label: 'All', icon: Layers },
      { id: 'assets', label: 'Assets', icon: Drill },
      { id: 'devices', label: 'Devices', icon: Cpu },
      { id: 'credentials', label: 'Credentials', icon: KeyRound },
      { id: 'policies', label: 'Policies', icon: FileText },
    ],
  },
  {
    title: 'Capabilities',
    items: [
      { id: 'provisioning', label: 'Provisioning', icon: Upload },
      { id: 'cert-mgmt', label: 'Certificate Mgmt.', icon: KeyRound },
      { id: 'ota-management', label: 'Firmware Management', icon: RefreshCw },
      { id: 'groups', label: 'Groups', icon: Users },
      { id: 'jobs', label: 'Jobs', icon: Activity },
      { id: '3p', label: '3P Capability', icon: Puzzle, disabled: true },
    ],
  },
  {
    title: 'Linked Instances',
    items: [
      { id: 'iot-hub', label: 'IoT Hub', icon: Server },
      { id: 'iot-ops', label: 'IoT Operations', icon: Wind },
    ],
  },
  {
    title: 'Other',
    collapsible: true,
    defaultCollapsed: true,
    items: [
      { id: 'firmware', label: 'Firmware Analysis', icon: Shield },
      { id: 'device-update', label: 'Device Update', icon: RefreshCw },
    ],
  },
]

export function LeftMenu({
  open,
  onToggle,
  activeItem,
  onItemClick,
}: {
  open: boolean
  onToggle: () => void
  activeItem: string
  onItemClick: (id: string) => void
}) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    () => new Set(LEFT_MENU_SECTIONS.filter((s) => s.defaultCollapsed).map((s) => s.title))
  )
  const { pathname } = useLocation()
  const visibleSections = LEFT_MENU_SECTIONS.filter(
    (s) => s.title !== 'Other' || pathname.includes('/other')
  )

  return (
    <motion.div
      animate={{ width: open ? 204 : 40 }}
      initial={false}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="shrink-0 overflow-hidden border-r border-slate-100"
    >
      <div className={`flex items-center border-b border-slate-100 py-2 ${open ? 'justify-end px-2' : 'justify-center'}`}>
        <button
          onClick={onToggle}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          title={open ? 'Collapse menu' : 'Expand menu'}
        >
          <ChevronLeft className={`h-4 w-4 transition-transform duration-200 ${open ? '' : 'rotate-180'}`} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="py-3"
          >
            {visibleSections.map((section, si) => {
              const isSectionCollapsed = !!(section.collapsible && collapsedSections.has(section.title))
              return (
                <div key={section.title} className={si > 0 ? 'mt-3 pt-3 border-t border-slate-100' : ''}>
                  {section.collapsible ? (
                    <button
                      onClick={() =>
                        setCollapsedSections((p) => {
                          const n = new Set(p)
                          n.has(section.title) ? n.delete(section.title) : n.add(section.title)
                          return n
                        })
                      }
                      className="w-full flex items-center justify-between px-3 py-0.5 mb-1 group"
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 whitespace-nowrap group-hover:text-muted-foreground/80 transition-colors">
                        {section.title}
                      </span>
                      <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform duration-150 ${isSectionCollapsed ? '-rotate-90' : ''}`} />
                    </button>
                  ) : (
                    <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 whitespace-nowrap">
                      {section.title}
                    </p>
                  )}

                  {!isSectionCollapsed &&
                    section.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => !item.disabled && onItemClick(item.id)}
                        disabled={item.disabled}
                        title={item.disabled ? 'Coming soon' : undefined}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors whitespace-nowrap ${
                          item.disabled
                            ? 'text-slate-300 cursor-not-allowed'
                            : activeItem === item.id
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-slate-600 hover:bg-muted/50 hover:text-foreground'
                        }`}
                      >
                        <item.icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    ))}
                </div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
