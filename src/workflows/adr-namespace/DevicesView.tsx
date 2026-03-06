import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Play, X, CheckCircle2, Filter } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { JobPrefill } from './NewJobWizard'
import {
  namespace, mockDevices, mockGroups,
  deviceHealthData, deviceConnectivity, deviceFirmwareVersions,
  DEVICE_STATUSES_FILTER, CONNECTIVITY_OPTIONS, DEVICE_FIRMWARE_VERSIONS,
  DEVICE_MANUFACTURERS, DEVICE_MODELS, DEVICE_SORT_FIELDS, DEVICE_ACTIONS,
  LATEST_DEVICE_FW_BY_MODEL,
  newCveNotification,
  isFirmwareAffectedByNewCve,
} from './mockData'
import { ChartCard, DonutChart, HBarChart } from './ChartHelpers'
import { SubViewHeader, SortIcon, mkDropdown } from './SharedComponents'

export function DevicesView({ initialSearch = '', initialFirmwareFilter = '', initialGroupFilter = '', onFirmwareSelect, onRunJob, onDeviceSelect, onClearGroupFilter, onUpdateFirmware }: { initialSearch?: string; initialFirmwareFilter?: string; initialGroupFilter?: string; onFirmwareSelect?: (version: string) => void; onRunJob?: (ids: string[], names: Record<string, string>) => void; onDeviceSelect?: (id: string) => void; onClearGroupFilter?: () => void; onUpdateFirmware?: (prefill: JobPrefill) => void }) {
  const [search, setSearch] = useState(initialSearch)
  // Status multi-select
  const [statusValues, setStatusValues] = useState<Set<string>>(new Set())
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const [statusSearch, setStatusSearch] = useState('')
  const statusDropdownRef = useRef<HTMLDivElement>(null)
  // Manufacturer multi-select
  const [mfrValues, setMfrValues] = useState<Set<string>>(new Set())
  const [mfrDropdownOpen, setMfrDropdownOpen] = useState(false)
  const [mfrSearch, setMfrSearch] = useState('')
  const mfrDropdownRef = useRef<HTMLDivElement>(null)
  // Model multi-select
  const [modelValues, setModelValues] = useState<Set<string>>(new Set())
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false)
  const [modelSearch, setModelSearch] = useState('')
  const modelDropdownRef = useRef<HTMLDivElement>(null)
  // Connectivity multi-select
  const [connectivityValues, setConnectivityValues] = useState<Set<string>>(new Set())
  const [connDropdownOpen, setConnDropdownOpen] = useState(false)
  const [connSearch, setConnSearch] = useState('')
  const connDropdownRef = useRef<HTMLDivElement>(null)
  // Firmware multi-select
  const [firmwareVersions, setFirmwareVersions] = useState<Set<string>>(() => {
    if (!initialFirmwareFilter) return new Set()
    const v = initialFirmwareFilter.startsWith('v') ? initialFirmwareFilter : `v${initialFirmwareFilter}`
    return new Set([v])
  })
  const [fwDropdownOpen, setFwDropdownOpen] = useState(false)
  const [fwSearch, setFwSearch] = useState('')
  const fwDropdownRef = useRef<HTMLDivElement>(null)

  const [sort, setSort] = useState({ field: 'id', dir: 'asc' })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [actionDone, setActionDone] = useState<string | null>(null)

  // Close any dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) setStatusDropdownOpen(false)
      if (mfrDropdownRef.current && !mfrDropdownRef.current.contains(e.target as Node)) setMfrDropdownOpen(false)
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) setModelDropdownOpen(false)
      if (connDropdownRef.current && !connDropdownRef.current.contains(e.target as Node)) setConnDropdownOpen(false)
      if (fwDropdownRef.current && !fwDropdownRef.current.contains(e.target as Node)) setFwDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredStatusOptions = DEVICE_STATUSES_FILTER.filter(v => v.toLowerCase().includes(statusSearch.toLowerCase()))
  const filteredMfrOptions = DEVICE_MANUFACTURERS.filter(v => v.toLowerCase().includes(mfrSearch.toLowerCase()))
  const filteredModelOptions = DEVICE_MODELS.filter(v => v.toLowerCase().includes(modelSearch.toLowerCase()))
  const filteredConnOptions = CONNECTIVITY_OPTIONS.filter(v => v.toLowerCase().includes(connSearch.toLowerCase()))
  const filteredFwOptions = DEVICE_FIRMWARE_VERSIONS.filter(v => v.toLowerCase().includes(fwSearch.toLowerCase()))

  const activeGroup = initialGroupFilter ? mockGroups.find(g => g.id === initialGroupFilter) : undefined
  const effectiveStatus = (d: typeof mockDevices[number]) => isFirmwareAffectedByNewCve(d.firmware) && d.status === 'Healthy' ? 'Degraded' : d.status

  const filtered = useMemo(() => {
    let rows = mockDevices
    // Group pre-filter
    if (initialGroupFilter) {
      const grp = mockGroups.find(g => g.id === initialGroupFilter)
      if (grp?.criteria) {
        if (grp.criteria.type) rows = rows.filter(d => d.type === grp.criteria.type)
        if (grp.criteria.site) rows = rows.filter(d => d.site === grp.criteria.site)
        if (grp.criteria.manufacturer) rows = rows.filter(d => d.manufacturer === grp.criteria.manufacturer)
        if (grp.criteria.status) rows = rows.filter(d => effectiveStatus(d) === grp.criteria.status)
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(d =>
        d.id.toLowerCase().includes(q) || d.name.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q) || d.hub.toLowerCase().includes(q) ||
        d.site.toLowerCase().includes(q) || d.manufacturer.toLowerCase().includes(q) ||
        d.model.toLowerCase().includes(q)
      )
    }
    if (statusValues.size > 0) rows = rows.filter(d => statusValues.has(effectiveStatus(d)))
    if (mfrValues.size > 0) rows = rows.filter(d => mfrValues.has(d.manufacturer))
    if (modelValues.size > 0) rows = rows.filter(d => modelValues.has(d.model))
    if (connectivityValues.size > 0) rows = rows.filter(d => connectivityValues.has(d.connectivity))
    if (firmwareVersions.size > 0) rows = rows.filter(d => firmwareVersions.has(d.firmware))
    return [...rows].sort((a, b) => {
      const av = (a as unknown as Record<string, string>)[sort.field] ?? ''
      const bv = (b as unknown as Record<string, string>)[sort.field] ?? ''
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [search, statusValues, mfrValues, modelValues, connectivityValues, firmwareVersions, sort])

  const allSelected = filtered.length > 0 && filtered.every(d => selected.has(d.id))
  const someSelected = !allSelected && filtered.some(d => selected.has(d.id))
  const selectionCount = selected.size

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(s => { const n = new Set(s); filtered.forEach(d => n.delete(d.id)); return n })
    } else {
      setSelected(s => { const n = new Set(s); filtered.forEach(d => n.add(d.id)); return n })
    }
  }

  function toggleDevice(id: string) {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function toggleSort(field: string) {
    setSort(s => s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' })
  }

  function toggleFwVersion(v: string) {
    setFirmwareVersions(prev => { const n = new Set(prev); n.has(v) ? n.delete(v) : n.add(v); return n })
  }
  function toggleStatusValue(v: string) {
    setStatusValues(prev => { const n = new Set(prev); n.has(v) ? n.delete(v) : n.add(v); return n })
  }
  function toggleMfrValue(v: string) {
    setMfrValues(prev => { const n = new Set(prev); n.has(v) ? n.delete(v) : n.add(v); return n })
  }
  function toggleModelValue(v: string) {
    setModelValues(prev => { const n = new Set(prev); n.has(v) ? n.delete(v) : n.add(v); return n })
  }
  function toggleConnValue(v: string) {
    setConnectivityValues(prev => { const n = new Set(prev); n.has(v) ? n.delete(v) : n.add(v); return n })
  }

  function confirmAction() {
    const n = selectionCount
    const label = DEVICE_ACTIONS.find(a => a.id === pendingAction)?.label ?? pendingAction ?? ''
    setPendingAction(null)
    setSelected(new Set())
    setActionDone(`${label} applied to ${n} device${n !== 1 ? 's' : ''}.`)
    setTimeout(() => setActionDone(null), 3000)
  }

  const statusLabel = statusValues.size === 0 ? 'Health' : statusValues.size === 1 ? [...statusValues][0] : `${statusValues.size} statuses`
  const mfrLabel = mfrValues.size === 0 ? 'Manufacturer' : mfrValues.size === 1 ? [...mfrValues][0] : `${mfrValues.size} selected`
  const modelLabel = modelValues.size === 0 ? 'Model' : modelValues.size === 1 ? [...modelValues][0] : `${modelValues.size} selected`
  const connLabel = connectivityValues.size === 0 ? 'Connectivity' : connectivityValues.size === 1 ? [...connectivityValues][0] : `${connectivityValues.size} selected`
  const fwLabel = firmwareVersions.size === 0 ? 'Firmware version' : firmwareVersions.size === 1 ? [...firmwareVersions][0] : `${firmwareVersions.size} versions`
  const showEnableInBar = [...selected].filter(id => { const d = mockDevices.find(x => x.id === id); return d?.status === 'Disabled' || d?.status === 'Inactive' }).length > selected.size / 2

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-8"
    >
      <SubViewHeader title="Devices" count={namespace.totalDevices} subtitle="Texas-Wind-Namespace" />
      {activeGroup && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-800">
          <Filter className="h-4 w-4 shrink-0 text-blue-500" />
          Filtered by group: <span className="font-semibold">{activeGroup.name}</span>
          <span className="text-blue-500 ml-1">· {filtered.length} matching devices</span>
          <div className="ml-auto flex items-center gap-2">
            {onRunJob && filtered.length > 0 && (
              <button
                onClick={() => {
                  const names = Object.fromEntries(filtered.map(d => [d.id, d.name]))
                  onRunJob(filtered.map(d => d.id), names)
                }}
                className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Play className="h-3 w-3" />
                Run job on group
              </button>
            )}
            <button
              onClick={() => onClearGroupFilter?.()}
              className="flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-300 hover:bg-blue-100 transition-colors"
            >
              <X className="h-3 w-3" />Clear filter
            </button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ChartCard title="Device Health">
          <DonutChart segments={deviceHealthData} centerLabel="Healthy" />
        </ChartCard>
        <ChartCard title="Connectivity Status">
          <HBarChart data={deviceConnectivity} />
        </ChartCard>
        <ChartCard title="Firmware Version">
          <HBarChart data={deviceFirmwareVersions} />
        </ChartCard>
      </div>
      <div>
        {/* Toolbar */}
        <div className="mb-3 relative flex flex-wrap items-center gap-2 py-2">
          <div className="relative min-w-[200px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search devices…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          {mkDropdown(statusLabel, statusDropdownOpen, setStatusDropdownOpen, statusDropdownRef, statusSearch, setStatusSearch, filteredStatusOptions, statusValues, toggleStatusValue, () => setStatusValues(new Set()))}
          {mkDropdown(mfrLabel, mfrDropdownOpen, setMfrDropdownOpen, mfrDropdownRef, mfrSearch, setMfrSearch, filteredMfrOptions, mfrValues, toggleMfrValue, () => setMfrValues(new Set()))}
          {mkDropdown(modelLabel, modelDropdownOpen, setModelDropdownOpen, modelDropdownRef, modelSearch, setModelSearch, filteredModelOptions, modelValues, toggleModelValue, () => setModelValues(new Set()), true)}
          {mkDropdown(connLabel, connDropdownOpen, setConnDropdownOpen, connDropdownRef, connSearch, setConnSearch, filteredConnOptions, connectivityValues, toggleConnValue, () => setConnectivityValues(new Set()))}
          {mkDropdown(fwLabel, fwDropdownOpen, setFwDropdownOpen, fwDropdownRef, fwSearch, setFwSearch, filteredFwOptions, firmwareVersions, toggleFwVersion, () => setFirmwareVersions(new Set()), true)}
          <span className="ml-auto text-xs text-muted-foreground">
            {filtered.length.toLocaleString()} of {namespace.totalDevices.toLocaleString()}
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
                      const names = Object.fromEntries([...selected].map(id => [id, mockDevices.find(d => d.id === id)?.name ?? id]))
                      onUpdateFirmware({ jobType: 'software-update', jobName: `Firmware Update – ${selected.size} device${selected.size !== 1 ? 's' : ''}`, startAtStep: 3, preselectedIds: [...selected], preselectedSource: 'Devices', preselectedNames: names })
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
                  <button onClick={() => { const names = Object.fromEntries([...selected].map(id => [id, mockDevices.find(d => d.id === id)?.name ?? id])); onRunJob([...selected], names); setSelected(new Set()); }}
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
                  Apply <span className="font-semibold">{DEVICE_ACTIONS.find(a => a.id === pendingAction)?.label}</span> to {selected.size} device{selected.size !== 1 ? 's' : ''}?
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

        {/* Table */}
        <div className="rounded-lg border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 pr-0">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => { if (el) el.indeterminate = someSelected }}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 cursor-pointer"
                  />
                </TableHead>
                {DEVICE_SORT_FIELDS.map(col => (
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
                  <TableCell colSpan={10} className="py-10 text-center text-sm text-muted-foreground">
                    No devices match your filters.
                  </TableCell>
                </TableRow>
              ) : filtered.map(d => {
                const isSelected = selected.has(d.id)
                return (
                  <TableRow
                    key={d.id}
                    className={`cursor-pointer hover:bg-slate-50/80 ${isSelected ? 'bg-blue-50/50' : ''}`}
                    onClick={() => onDeviceSelect?.(d.id)}
                  >
                    <TableCell className="pr-0" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleDevice(d.id)}
                        className="h-4 w-4 rounded border-slate-300 cursor-pointer"
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{d.id}</TableCell>
                    <TableCell className="font-mono text-xs font-medium">{d.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.type}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{d.hub}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.site}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {d.firmware && d.firmware !== '\u2014' && onFirmwareSelect ? (
                          <button
                            onClick={e => { e.stopPropagation(); onFirmwareSelect(d.firmware.startsWith('v') ? d.firmware.slice(1) : d.firmware) }}
                            className="font-mono text-xs text-blue-600 hover:text-blue-800 hover:underline underline-offset-2 transition-colors"
                          >{d.firmware}</button>
                        ) : (
                          <span className="font-mono text-xs">{d.firmware}</span>
                        )}
                        {d.firmware && d.firmware !== '\u2014' && LATEST_DEVICE_FW_BY_MODEL[d.model] === d.firmware && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 leading-none">LATEST</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium ${
                        d.connectivity === 'Connected' ? 'text-emerald-600'
                        : d.connectivity === 'Disconnected' ? 'text-amber-600'
                        : 'text-slate-400'
                      }`}>{d.connectivity}</span>
                    </TableCell>
                    <TableCell><StatusBadge status={effectiveStatus(d)} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{d.lastSeen}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </motion.div>
  )
}
