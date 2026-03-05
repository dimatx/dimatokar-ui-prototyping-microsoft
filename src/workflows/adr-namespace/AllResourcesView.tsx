import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Search } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { mockAssets, mockDevices, mockCredentials, mockPolicies } from './mockData'
import { SegBar, HBar } from './chartHelpers'
import { SubViewHeader, statusBadgeLabel, normalizeHealth, ALL_RESOURCE_TYPE_STYLES } from './sharedComponents'

/* ─── All Resources View ─────────────────────────────────────── */

export function AllResourcesView({ onAssetSelect, onDeviceSelect }: { onAssetSelect?: (id: string) => void; onDeviceSelect?: (id: string) => void }) {
  const [typeFilter, setTypeFilter] = useState<string>('All')
  const [search, setSearch] = useState('')

  const allRows = useMemo(() => [
    ...mockAssets.map(a => ({ id: a.id, name: a.name, resourceType: 'Asset' as const, rawStatus: a.status, site: a.site, lastSeen: a.lastSeen })),
    ...mockDevices.map(d => ({ id: d.id, name: d.name, resourceType: 'Device' as const, rawStatus: d.status, site: d.site, lastSeen: d.lastSeen })),
    ...mockCredentials.map(c => ({ id: c.id, name: c.name, resourceType: 'Credential' as const, rawStatus: c.status, site: c.site, lastSeen: c.lastSeen })),
    ...mockPolicies.map(p => ({ id: p.id, name: p.name, resourceType: 'Policy' as const, rawStatus: p.status, site: p.site, lastSeen: p.lastSeen })),
  ], [])

  const filtered = useMemo(() => {
    let rows = typeFilter === 'All' ? allRows : allRows.filter(r => r.resourceType === typeFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(r => r.id.toLowerCase().includes(q) || r.name.toLowerCase().includes(q))
    }
    return rows
  }, [allRows, typeFilter, search])

  const byType = [
    { label: 'Assets',      count: mockAssets.length,      color: '#0ea5e9' },
    { label: 'Devices',     count: mockDevices.length,     color: '#6366f1' },
    { label: 'Credentials', count: mockCredentials.length, color: '#f59e0b' },
    { label: 'Policies',    count: mockPolicies.length,    color: '#8b5cf6' },
  ]

  const healthCounts = useMemo(() => allRows.reduce((acc, r) => {
    const key = normalizeHealth(r.rawStatus)
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {} as Record<string, number>), [allRows])

  const bySite = useMemo(() => {
    const map: Record<string, number> = {}
    allRows.filter(r => r.site !== 'N/A').forEach(r => { map[r.site] = (map[r.site] ?? 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [allRows])
  const maxSite = bySite[0]?.[1] ?? 1

  const FILTER_TYPES = ['All', 'Asset', 'Device', 'Credential', 'Policy'] as const
  const PLURAL_LABELS: Record<string, string> = { Asset: 'Assets', Device: 'Devices', Credential: 'Credentials', Policy: 'Policies' }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-6"
    >
      <SubViewHeader
        title="All Resources"
        count={allRows.length}
        subtitle="Assets, Devices, Credentials and Policies in this namespace"
      />

      {/* ── Charts ───────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {/* By Resource Type */}
        <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">By Resource Type</p>
          <SegBar segs={byType.map(t => ({ v: t.count, c: t.color }))} />
          <div className="space-y-1.5">
            {byType.map(t => (
              <div key={t.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-sm flex-shrink-0" style={{ background: t.color }} />
                  <span className="text-slate-600">{t.label}</span>
                </div>
                <span className="font-medium text-slate-900">{t.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Health Overview */}
        <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Health Overview</p>
          <SegBar segs={[
            { v: healthCounts.healthy  ?? 0, c: '#10b981' },
            { v: healthCounts.degraded ?? 0, c: '#f59e0b' },
            { v: healthCounts.error    ?? 0, c: '#ef4444' },
            { v: healthCounts.inactive ?? 0, c: '#94a3b8' },
          ]} />
          <div className="space-y-1.5">
            {([
              { label: 'Healthy / Active',    color: '#10b981', key: 'healthy'  },
              { label: 'Degraded / Warning',  color: '#f59e0b', key: 'degraded' },
              { label: 'Unhealthy / Error',   color: '#ef4444', key: 'error'    },
              { label: 'Unknown / Inactive',  color: '#94a3b8', key: 'inactive' },
            ] as const).map(row => (
              <div key={row.key} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-sm flex-shrink-0" style={{ background: row.color }} />
                  <span className="text-slate-600">{row.label}</span>
                </div>
                <span className="font-medium text-slate-900">{healthCounts[row.key] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By Site */}
        <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">By Site</p>
          <div className="space-y-2.5 pt-0.5">
            {bySite.map(([site, count]) => (
              <div key={site} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 truncate max-w-[150px]">{site}</span>
                  <span className="font-medium text-slate-900">{count}</span>
                </div>
                <HBar value={count} max={maxSite} color="#6366f1" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filter Buttons + Search ───────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="relative mr-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or ID…"
            className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 w-52"
          />
        </div>
        {FILTER_TYPES.map(t => {
          const count = t === 'All' ? allRows.length : allRows.filter(r => r.resourceType === t).length
          return (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                typeFilter === t
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              {t === 'All' ? `All (${count})` : `${PLURAL_LABELS[t]} (${count})`}
            </button>
          )
        })}
      </div>

      {/* ── Table ────────────────────────────────────────────── */}
      <div className="rounded-lg border border-slate-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-[100px]">ID</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Health</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Site</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(row => {
              const isClickable = row.resourceType === 'Asset' || row.resourceType === 'Device'
              return (
              <TableRow
                key={row.id}
                className={`transition-colors ${isClickable ? 'cursor-pointer hover:bg-slate-50/80' : 'hover:bg-slate-50/60'}`}
                onClick={() => {
                  if (row.resourceType === 'Asset') onAssetSelect?.(row.id)
                  else if (row.resourceType === 'Device') onDeviceSelect?.(row.id)
                }}
              >
                <TableCell className="font-mono text-xs text-slate-500">{row.id}</TableCell>
                <TableCell className="font-medium text-sm text-slate-900">{row.name}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${ALL_RESOURCE_TYPE_STYLES[row.resourceType]}`}>
                    {row.resourceType}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={statusBadgeLabel(row.resourceType, row.rawStatus)} />
                </TableCell>
                <TableCell className="text-sm text-slate-600">{row.site}</TableCell>
                <TableCell className="text-xs text-slate-400">{row.lastSeen}</TableCell>
                {isClickable && (
                  <TableCell className="text-right pr-3 w-6">
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                  </TableCell>
                )}
              </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  )
}
