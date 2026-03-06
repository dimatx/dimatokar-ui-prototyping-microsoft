import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Play, X, CheckCircle2 } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { JobPrefill } from './NewJobWizard'
import {
  namespace, mockAssets,
  assetHealthData, assetsByManufacturer, assetsBySite,
  ASSET_STATUSES, ASSET_MANUFACTURERS, ASSET_FIRMWARE_VERSIONS,
  LATEST_ASSET_FW_BY_TYPE, ASSET_SORT_FIELDS, DEVICE_ACTIONS,
  isFirmwareAffectedByNewCve,
} from './mockData'
import { ChartCard, DonutChart, HBarChart } from './ChartHelpers'
import { SubViewHeader, SortIcon, mkDropdown } from './SharedComponents'

export function AssetsView({ initialSearch = '', onRunJob, onAssetSelect, onUpdateFirmware }: { initialSearch?: string; onRunJob?: (ids: string[], names: Record<string, string>) => void; onAssetSelect?: (id: string) => void; onUpdateFirmware?: (prefill: JobPrefill) => void }) {
  const [search, setSearch] = useState(initialSearch)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  // Health multi-select
  const [statusValues, setStatusValues] = useState<Set<string>>(new Set())
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const [statusSearch, setStatusSearch] = useState('')
  const statusDropdownRef = useRef<HTMLDivElement>(null)
  // Manufacturer multi-select
  const [mfrValues, setMfrValues] = useState<Set<string>>(new Set())
  const [mfrDropdownOpen, setMfrDropdownOpen] = useState(false)
  const [mfrSearch, setMfrSearch] = useState('')
  const mfrDropdownRef = useRef<HTMLDivElement>(null)
  // Firmware multi-select
  const [fwValues, setFwValues] = useState<Set<string>>(new Set())
  const [fwDropdownOpen, setFwDropdownOpen] = useState(false)
  const [fwSearch, setFwSearch] = useState('')
  const fwDropdownRef = useRef<HTMLDivElement>(null)

  const [sort, setSort] = useState({ field: 'id', dir: 'asc' })
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [actionDone, setActionDone] = useState<string | null>(null)
  function confirmAction() {
    const n = selected.size
    const label = DEVICE_ACTIONS.find(a => a.id === pendingAction)?.label ?? pendingAction ?? ''
    setPendingAction(null)
    setSelected(new Set())
    setActionDone(`${label} applied to ${n} asset${n !== 1 ? 's' : ''}.`)
    setTimeout(() => setActionDone(null), 3000)
  }

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) setStatusDropdownOpen(false)
      if (mfrDropdownRef.current && !mfrDropdownRef.current.contains(e.target as Node)) setMfrDropdownOpen(false)
      if (fwDropdownRef.current && !fwDropdownRef.current.contains(e.target as Node)) setFwDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredStatusOptions = ASSET_STATUSES.filter(v => v.toLowerCase().includes(statusSearch.toLowerCase()))
  const filteredMfrOptions = ASSET_MANUFACTURERS.filter(v => v.toLowerCase().includes(mfrSearch.toLowerCase()))
  const filteredFwOptions = ASSET_FIRMWARE_VERSIONS.filter(v => v.toLowerCase().includes(fwSearch.toLowerCase()))
  const effectiveStatus = (a: typeof mockAssets[number]) => isFirmwareAffectedByNewCve(a.firmware) && a.status === 'Available' ? 'Degraded' : a.status

  const filtered = useMemo(() => {
    let rows = mockAssets
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(a =>
        a.id.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q) || a.manufacturer.toLowerCase().includes(q) ||
        a.site.toLowerCase().includes(q) || a.firmware.toLowerCase().includes(q)
      )
    }
    if (statusValues.size > 0) rows = rows.filter(a => statusValues.has(effectiveStatus(a)))
    if (mfrValues.size > 0) rows = rows.filter(a => mfrValues.has(a.manufacturer))
    if (fwValues.size > 0) rows = rows.filter(a => fwValues.has(a.firmware))
    return [...rows].sort((a, b) => {
      const av = (a as Record<string, string>)[sort.field] ?? ''
      const bv = (b as Record<string, string>)[sort.field] ?? ''
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [search, statusValues, mfrValues, fwValues, sort])

  function toggleSort(field: string) {
    setSort(s => s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' })
  }

  const statusLabel = statusValues.size === 0 ? 'Health' : statusValues.size === 1 ? [...statusValues][0] : `${statusValues.size} statuses`
  const mfrLabel = mfrValues.size === 0 ? 'Manufacturer' : mfrValues.size === 1 ? [...mfrValues][0] : `${mfrValues.size} selected`
  const fwLabel = fwValues.size === 0 ? 'Firmware version' : fwValues.size === 1 ? [...fwValues][0] : `${fwValues.size} versions`
  const showEnableInBar = [...selected].filter(id => { const a = mockAssets.find(x => x.id === id); return a?.status === 'Disabled' || a?.status === 'Inactive' }).length > selected.size / 2

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-8"
    >
      <SubViewHeader title="Assets" count={namespace.totalAssets} subtitle="Texas-Wind-Namespace" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ChartCard title="Asset Health">
          <DonutChart segments={assetHealthData} centerLabel="Available" />
        </ChartCard>
        <ChartCard title="By Manufacturer">
          <HBarChart data={assetsByManufacturer} />
        </ChartCard>
        <ChartCard title="By Site">
          <HBarChart data={assetsBySite} />
        </ChartCard>
      </div>
      <div>
        {/* Toolbar */}
        <div className="mb-3 relative flex flex-wrap items-center gap-2 py-2">
          <div className="relative min-w-[200px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search assets…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          {mkDropdown(statusLabel, statusDropdownOpen, setStatusDropdownOpen, statusDropdownRef, statusSearch, setStatusSearch, filteredStatusOptions, statusValues, (v) => setStatusValues(p => { const n = new Set(p); n.has(v) ? n.delete(v) : n.add(v); return n }), () => setStatusValues(new Set()))}
          {mkDropdown(mfrLabel, mfrDropdownOpen, setMfrDropdownOpen, mfrDropdownRef, mfrSearch, setMfrSearch, filteredMfrOptions, mfrValues, (v) => setMfrValues(p => { const n = new Set(p); n.has(v) ? n.delete(v) : n.add(v); return n }), () => setMfrValues(new Set()))}
          {mkDropdown(fwLabel, fwDropdownOpen, setFwDropdownOpen, fwDropdownRef, fwSearch, setFwSearch, filteredFwOptions, fwValues, (v) => setFwValues(p => { const n = new Set(p); n.has(v) ? n.delete(v) : n.add(v); return n }), () => setFwValues(new Set()), true)}
          <span className="ml-auto text-xs text-muted-foreground">
            {filtered.length.toLocaleString()} of {namespace.totalAssets.toLocaleString()}
          </span>
          <AnimatePresence>
            {selected.size > 0 && !pendingAction && !actionDone && (
              <motion.div key="sel-action" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
                className="absolute inset-0 flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 z-10"
              >
                <span className="text-xs font-semibold text-slate-700 pr-3 border-r border-slate-200 mr-1">{selected.size} selected</span>
                {DEVICE_ACTIONS.filter(a => a.id === 'enable' ? showEnableInBar : a.id === 'disable' ? !showEnableInBar : true).map(action => (
                  <button key={action.id} onClick={() => {
                    if (action.id === 'update-firmware' && onUpdateFirmware) {
                      const names = Object.fromEntries([...selected].map(id => [id, mockAssets.find(a => a.id === id)?.name ?? id]))
                      onUpdateFirmware({ jobType: 'software-update', jobName: `Firmware Update – ${selected.size} asset${selected.size !== 1 ? 's' : ''}`, startAtStep: 3, preselectedIds: [...selected], preselectedSource: 'Assets', preselectedNames: names })
                      setSelected(new Set())
                    } else {
                      setPendingAction(action.id)
                    }
                  }}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white hover:shadow-sm ${action.cls}`}>
                    <action.icon className="h-3 w-3" />{action.label}
                  </button>
                ))}
                {onRunJob && (
                  <button onClick={() => { const names = Object.fromEntries([...selected].map(id => [id, mockAssets.find(a => a.id === id)?.name ?? id])); onRunJob([...selected], names); setSelected(new Set()); }}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-white hover:shadow-sm">
                    <Play className="h-3 w-3" />Run Job
                  </button>
                )}
                <div className="ml-auto" />
                <button onClick={() => setSelected(new Set())} className="rounded-full p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )}
            {pendingAction && (
              <motion.div key="sel-confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
                className="absolute inset-0 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 z-10"
              >
                <span className="text-xs font-medium text-amber-900">
                  Apply <span className="font-semibold">{DEVICE_ACTIONS.find(a => a.id === pendingAction)?.label}</span> to {selected.size} asset{selected.size !== 1 ? 's' : ''}?
                </span>
                <button onClick={confirmAction} className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition-colors">Confirm</button>
                <button onClick={() => setPendingAction(null)} className="ml-auto text-xs text-amber-700 hover:text-amber-900 transition-colors">Cancel</button>
              </motion.div>
            )}
            {actionDone && (
              <motion.div key="sel-success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
                className="absolute inset-0 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 z-10"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span className="text-xs font-medium text-emerald-800">{actionDone}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="rounded-lg border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 pr-0">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && filtered.every(a => selected.has(a.id))}
                    ref={el => { if (el) el.indeterminate = !filtered.every(a => selected.has(a.id)) && filtered.some(a => selected.has(a.id)) }}
                    onChange={() => {
                      const allSel = filtered.every(a => selected.has(a.id))
                      setSelected(s => { const n = new Set(s); filtered.forEach(a => allSel ? n.delete(a.id) : n.add(a.id)); return n })
                    }}
                    className="h-4 w-4 rounded border-slate-300 cursor-pointer"
                  />
                </TableHead>
                {ASSET_SORT_FIELDS.map(col => (
                  <TableHead
                    key={col.field}
                    className={`cursor-pointer select-none group ${col.cls ?? ''}`}
                    onClick={() => toggleSort(col.field)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      <SortIcon field={col.field} sort={sort} />
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                    No assets match your filters.
                  </TableCell>
                </TableRow>
              ) : filtered.map(a => (
                <TableRow key={a.id} className={`cursor-pointer hover:bg-slate-50/80 ${selected.has(a.id) ? 'bg-blue-50/50' : ''}`} onClick={() => onAssetSelect?.(a.id)}>
                  <TableCell className="pr-0" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(a.id)}
                      onChange={() => setSelected(s => { const n = new Set(s); n.has(a.id) ? n.delete(a.id) : n.add(a.id); return n })}
                      className="h-4 w-4 rounded border-slate-300 cursor-pointer"
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{a.id}</TableCell>
                  <TableCell className="font-medium text-sm">{a.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.type}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.manufacturer}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.site}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs">{a.firmware}</span>
                      {a.firmware !== '—' && LATEST_ASSET_FW_BY_TYPE[a.type] === a.firmware && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 leading-none">LATEST</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell><StatusBadge status={effectiveStatus(a)} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{a.lastSeen}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </motion.div>
  )
}
