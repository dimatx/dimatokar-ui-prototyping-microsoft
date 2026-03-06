import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Search, ArrowUp, ArrowDown, ArrowUpDown, LockKeyhole, Shield, Settings } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/StatusBadge'
import type { NamespaceService } from './mockData'
import { SENSITIVITY_LABELS } from './mockData'

/* ─── HeroStat ───────────────────────────────────────────────── */

export function HeroStat({ icon: Icon, label, value }: { icon: React.ElementType; label: React.ReactNode; value: string }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-5 w-5 text-foreground" />
        </div>
        <div>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

/* ─── Section Headings ────────────────────────────────────────── */

export function SectionHeading({ title, count }: { title: React.ReactNode; count?: number }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {count !== undefined && (
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {count}
        </span>
      )}
    </div>
  )
}

export function CollapsibleHeading({
  title,
  count,
  open,
  onToggle,
  action,
  summaryStatus,
}: {
  title: React.ReactNode
  count?: number
  open: boolean
  onToggle: () => void
  action?: React.ReactNode
  summaryStatus?: React.ReactNode
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 rounded-lg -ml-1.5 px-1.5 py-1 hover:bg-muted/50 transition-colors"
      >
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
            open ? '' : '-rotate-90'
          }`}
        />
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {count !== undefined && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {count}
          </span>
        )}
        {!open && summaryStatus && (
          <span className="ml-1">{summaryStatus}</span>
        )}
      </button>
      {action}
    </div>
  )
}

/* ─── Status helpers ───────────────────────────────────────── */

export const statusToColor: Record<string, string> = {
  Healthy: 'bg-emerald-500',
  Running: 'bg-emerald-500',
  Active: 'bg-emerald-500',
  Adding: 'bg-blue-500 animate-pulse',
  Warning: 'bg-amber-500',
  Degraded: 'bg-amber-500',
  Error: 'bg-red-500',
  Critical: 'bg-red-500',
  Inactive: 'bg-gray-400',
}

export function SummaryStatusDots({ statuses }: { statuses: string[] }) {
  return (
    <span className="inline-flex items-center gap-1">
      {statuses.map((status, i) => (
        <span
          key={i}
          title={status}
          className={`h-2 w-2 rounded-full ${statusToColor[status] || 'bg-gray-400'}`}
        />
      ))}
    </span>
  )
}

export function statusBadgeLabel(resourceType: string, rawStatus: string): string {
  if (rawStatus === 'Available' || rawStatus === 'Healthy' || rawStatus === 'Valid') return 'Healthy'
  if (rawStatus === 'Active') return 'Active'
  if (rawStatus === 'Degraded') return 'Degraded'
  if (rawStatus === 'Expiring Soon') return 'Warning'
  if (rawStatus === 'Unhealthy') return 'Error'
  if (rawStatus === 'Expired') return 'Critical'
  if (rawStatus === 'Inactive') return 'Inactive'
  return 'Inactive' // Unknown
}

export function normalizeHealth(rawStatus: string): 'healthy' | 'degraded' | 'error' | 'inactive' {
  if (['Available', 'Healthy', 'Valid', 'Active'].includes(rawStatus)) return 'healthy'
  if (['Degraded', 'Expiring Soon', 'Warning'].includes(rawStatus)) return 'degraded'
  if (['Unhealthy', 'Error', 'Critical', 'Expired'].includes(rawStatus)) return 'error'
  return 'inactive'
}

export const ALL_RESOURCE_TYPE_STYLES: Record<string, string> = {
  Asset:      'bg-sky-50 text-sky-700 border-sky-200',
  Device:     'bg-indigo-50 text-indigo-700 border-indigo-200',
  Credential: 'bg-amber-50 text-amber-700 border-amber-200',
  Policy:     'bg-violet-50 text-violet-700 border-violet-200',
}

/* ─── Severity Color Constants ───────────────────────────────── */

export const severityColor: Record<string, string> = {
  Critical: '#dc2626', High: '#f97316', Medium: '#f59e0b', Low: '#94a3b8',
}
export const severityBg: Record<string, string> = {
  Critical: 'bg-red-600 text-white', High: 'bg-orange-500 text-white',
  Medium: 'bg-amber-100 text-amber-700 border border-amber-200',
  Low: 'bg-slate-100 text-slate-500 border border-slate-200',
}

/* ─── SubViewHeader & PlaceholderView ────────────────────────── */

export function SubViewHeader({ title, subtitle, count }: { title: React.ReactNode; subtitle?: string; count?: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {count !== undefined && (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-sm font-medium text-muted-foreground">{count.toLocaleString()}</span>
        )}
      </div>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  )
}

export function PlaceholderView({ title, description, icon: Icon, action }: { title: string; description: string; icon: React.ElementType; action?: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-400 mb-5">
        <Icon className="h-7 w-7" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">{title}</h2>
      <p className="max-w-md text-sm text-muted-foreground leading-relaxed mb-6">{description}</p>
      {action ?? (
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
          Coming soon
        </span>
      )}
    </motion.div>
  )
}

/* ─── Shared Capability Page Header ─────────────────────────── */

export function CapabilityPageHeader({ icon: Icon, title, description, svc, onConfigure }: {
  icon: React.ElementType
  title: string
  description: string
  svc?: NamespaceService | null
  onConfigure?: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500 shrink-0 mt-0.5">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {svc && onConfigure && (
              <button
                onClick={onConfigure}
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                title={`Configure ${svc.name}`}
              >
                <Settings className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      {svc && (
        <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white px-4 py-2.5 shadow-sm shrink-0">
          <span className="text-xs text-slate-500 font-medium">Status</span>
          <StatusBadge status={svc.status} />
          {svc.instanceName && <span className="font-mono text-xs text-slate-400">{svc.instanceName}</span>}
        </div>
      )}
    </div>
  )
}

/* ─── SortIcon ────────────────────────────────────────────────── */

export function SortIcon({ field, sort }: { field: string; sort: { field: string; dir: string } }) {
  if (sort.field !== field) return <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-70 transition-opacity" />
  return sort.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
}

/* ─── mkDropdown ──────────────────────────────────────────────── */

export function mkDropdown<T extends string>(
  label: string, open: boolean, setOpen: (v: boolean) => void,
  ref: React.RefObject<HTMLDivElement>, searchVal: string, setSearch: (v: string) => void,
  options: T[], values: Set<T>, toggle: (v: T) => void, clear: () => void,
  mono = false
) {
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
          values.size > 0 ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:bg-muted/50'
        }`}
      >
        {label}
        {values.size > 0 && (
          <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold leading-none"
            onClick={e => { e.stopPropagation(); clear() }} title="Clear">×</span>
        )}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ duration: 0.12 }}
            className="absolute left-0 top-full mt-1 z-30 w-56 rounded-lg border bg-white shadow-sm">
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <input autoFocus placeholder="Search…" value={searchVal} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-6 pr-2 py-1 text-xs rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-300" />
              </div>
            </div>
            <div className="py-1 max-h-52 overflow-y-auto">
              {options.length === 0
                ? <p className="px-3 py-2 text-xs text-muted-foreground">No matches.</p>
                : options.map(v => (
                  <label key={v} className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-muted/50 cursor-pointer">
                    <input type="checkbox" checked={values.has(v)} onChange={() => toggle(v)} className="h-3.5 w-3.5 rounded border-slate-300 cursor-pointer" />
                    <span className={`text-xs${mono ? ' font-mono' : ''}`}>{v}</span>
                  </label>
                ))}
            </div>
            {values.size > 0 && (
              <div className="border-t p-2">
                <button onClick={clear} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center">Clear selection</button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Sensitivity Select ──────────────────────────────────────── */

export function SensitivitySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const opt = SENSITIVITY_LABELS.find(s => s.label === value) ?? SENSITIVITY_LABELS[2]
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors hover:opacity-90"
        style={{ backgroundColor: opt.bg, borderColor: opt.border, color: opt.color }}
      >
        {opt.locked
          ? <LockKeyhole className="h-3 w-3 shrink-0" />
          : <Shield className="h-3 w-3 shrink-0" />
        }
        <span className="text-slate-500 font-normal">Data Sensitivity</span>
        <span className="font-semibold">{opt.label}</span>
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-1 z-30 w-52 rounded-lg border bg-white shadow-sm py-1"
          >
            {SENSITIVITY_LABELS.map(s => (
              <button
                key={s.label}
                onClick={() => { onChange(s.label); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-50 transition-colors text-left"
              >
                {s.label === value
                  ? <span className="h-3.5 w-3.5 shrink-0 flex items-center justify-center rounded-full" style={{ backgroundColor: s.color }}><span className="h-1.5 w-1.5 rounded-full bg-white" /></span>
                  : <span className="h-3.5 w-3.5 shrink-0 rounded-full border-2" style={{ borderColor: s.border }} />
                }
                <span className="font-medium" style={{ color: s.color }}>{s.label}</span>
                {s.locked && <LockKeyhole className="h-3 w-3 ml-auto opacity-50" style={{ color: s.color }} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
