import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cpu, Drill, Plus, ChevronRight, Search, X, Users, Layers, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/StatusBadge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  mockGroups,
  GROUP_DEVICE_TYPES, GROUP_ASSET_TYPES, GROUP_SITES, GROUP_MANUFACTURERS, GROUP_STATUSES,
} from './mockData'
import { ChartCard, DonutChart, HBarChart } from './ChartHelpers'
import { CapabilityPageHeader, SortIcon } from './SharedComponents'

/* ─── Types ──────────────────────────────────────────────────── */

type GroupDraft = {
  name: string; description: string; memberKind: 'devices' | 'assets'
  criteriaManufacturer: string; criteriaSite: string; criteriaType: string; criteriaStatus: string; freeQuery: string
}

/* ─── Create Group Wizard ────────────────────────────────────── */

function CreateGroupWizard({ onClose, onCreate }: { onClose: () => void; onCreate: (draft: GroupDraft) => void }) {
  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState<GroupDraft>({
    name: '', description: '', memberKind: 'devices',
    criteriaManufacturer: '', criteriaSite: '', criteriaType: '', criteriaStatus: '', freeQuery: '',
  })
  const canNext1 = draft.name.trim().length > 0
  const canCreate = canNext1

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg rounded-xl border bg-white shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h3 className="text-base font-semibold">Create Group</h3>
            <p className="text-xs text-muted-foreground">Step {step} of 2 — {step === 1 ? 'Basic Info' : 'Membership Criteria'}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {step === 1 && (
            <>
              <div className="space-y-1.5">
                <label
                  className="text-xs font-medium cursor-pointer select-none hover:text-blue-600 transition-colors inline-flex items-center gap-1 group"
                  title="Click to fill"
                  onClick={() => setDraft(d => ({ ...d, name: 'San Angelo – TurbineCtrl Q2 Update' }))}
                >Group Name *<span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-500 transition-opacity">← click to fill</span></label>
                <Input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="e.g. San Angelo – TurbineCtrl Q2 Update" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label
                  className="text-xs font-medium cursor-pointer select-none hover:text-blue-600 transition-colors inline-flex items-center gap-1 group"
                  title="Click to fill"
                  onClick={() => setDraft(d => ({ ...d, description: 'Targets Contoso Wind Systems turbine controllers at the San Angelo Wind Farm scheduled for Q2 firmware rollout.' }))}
                >Description<span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-500 transition-opacity">← click to fill</span></label>
                <textarea value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
                  placeholder="Optional description…" rows={2}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Group Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['devices', 'assets'] as const).map(k => (
                    <button key={k} onClick={() => setDraft(d => ({ ...d, memberKind: k }))}
                      className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-all ${draft.memberKind === k ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 hover:border-slate-300'}`}>
                      {k === 'devices' ? <Cpu className="h-4 w-4" /> : <Drill className="h-4 w-4" />}
                      {k === 'devices' ? 'Device Group' : 'Asset Group'}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <p className="text-xs text-muted-foreground">Define membership criteria. All matching {draft.memberKind} will be included automatically.</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Manufacturer', key: 'criteriaManufacturer' as const, opts: GROUP_MANUFACTURERS, demo: 'Contoso Wind Systems' },
                  { label: 'Site', key: 'criteriaSite' as const, opts: GROUP_SITES, demo: 'San Angelo Wind Farm' },
                  { label: 'Type', key: 'criteriaType' as const, opts: draft.memberKind === 'devices' ? GROUP_DEVICE_TYPES : GROUP_ASSET_TYPES, demo: 'Turbine Controller' },
                  { label: 'Health Status', key: 'criteriaStatus' as const, opts: GROUP_STATUSES, demo: 'Degraded' },
                ].map(({ label, key, opts, demo }) => (
                  <div key={key} className="space-y-1">
                    <label
                      className="text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-blue-600 transition-colors inline-flex items-center gap-1 group"
                      title="Click to fill"
                      onClick={() => setDraft(d => ({ ...d, [key]: demo }))}
                    >{label}<span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-500 transition-opacity">← click to fill</span></label>
                    <select value={draft[key]} onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
                      className="flex h-9 w-full rounded-md border border-input bg-white px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                      <option value="">Any</option>
                      {opts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <label
                  className="text-xs font-medium cursor-pointer select-none hover:text-blue-600 transition-colors inline-flex items-center gap-1 group"
                  title="Click to fill"
                  onClick={() => setDraft(d => ({ ...d, freeQuery: 'devices that have not reported telemetry in the last 24 hours' }))}
                >Additional Query<span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-500 transition-opacity">← click to fill</span></label>
                <textarea value={draft.freeQuery} onChange={e => setDraft(d => ({ ...d, freeQuery: e.target.value }))}
                  placeholder="e.g. devices that have not reported telemetry in the last 24 hours"
                  rows={2}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between border-t px-6 py-4">
          <Button variant="outline" size="sm" onClick={step === 1 ? onClose : () => setStep(1)}>
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          {step < 2 ? (
            <Button size="sm" disabled={!canNext1} onClick={() => setStep(2)}>Next</Button>
          ) : (
            <Button size="sm" disabled={!canCreate} onClick={() => onCreate(draft)}>Create Group</Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Edit Group Modal ───────────────────────────────────────── */

function EditGroupModal({ group, onClose, onSave }: {
  group: typeof mockGroups[0]
  onClose: () => void
  onSave: (updated: typeof mockGroups[0]) => void
}) {
  const [name, setName] = useState(group.name)
  const [description, setDescription] = useState('')
  const [memberKind, setMemberKind] = useState<'devices' | 'assets'>(group.memberKind)
  const [criteriaManufacturer, setCriteriaManufacturer] = useState(group.criteria?.manufacturer ?? '')
  const [criteriaSite, setCriteriaSite] = useState(group.criteria?.site ?? '')
  const [criteriaType, setCriteriaType] = useState(group.criteria?.type ?? '')
  const [criteriaStatus, setCriteriaStatus] = useState(group.criteria?.status ?? '')
  const [freeQuery, setFreeQuery] = useState('')
  const canSave = name.trim().length > 0

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg rounded-xl border bg-white shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h3 className="text-base font-semibold">Edit Group</h3>
            <p className="text-xs text-muted-foreground font-mono">{group.id}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[68vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label
              className="text-xs font-medium cursor-pointer select-none hover:text-blue-600 transition-colors inline-flex items-center gap-1 group"
              title="Click to fill"
              onClick={() => setName('San Angelo – TurbineCtrl Q2 Update')}
            >Group Name *<span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-500 transition-opacity">← click to fill</span></label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. San Angelo – TurbineCtrl Q2 Update" className="h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <label
              className="text-xs font-medium cursor-pointer select-none hover:text-blue-600 transition-colors inline-flex items-center gap-1 group"
              title="Click to fill"
              onClick={() => setDescription('Targets Contoso Wind Systems turbine controllers at the San Angelo Wind Farm scheduled for Q2 firmware rollout.')}
            >Description<span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-500 transition-opacity">← click to fill</span></label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Optional description…" rows={2}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Group Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(['devices', 'assets'] as const).map(k => (
                <button key={k} onClick={() => setMemberKind(k)}
                  className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-all ${memberKind === k ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 hover:border-slate-300'}`}>
                  {k === 'devices' ? <Cpu className="h-4 w-4" /> : <Drill className="h-4 w-4" />}
                  {k === 'devices' ? 'Device Group' : 'Asset Group'}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Membership Criteria</p>
            <p className="text-xs text-muted-foreground mb-3">All matching {memberKind} will be included automatically.</p>
            <div className="grid grid-cols-2 gap-3">
              {([
                { label: 'Manufacturer', value: criteriaManufacturer, onChange: setCriteriaManufacturer, opts: GROUP_MANUFACTURERS, demo: 'Contoso Wind Systems' },
                { label: 'Site', value: criteriaSite, onChange: setCriteriaSite, opts: GROUP_SITES, demo: 'San Angelo Wind Farm' },
                { label: 'Type', value: criteriaType, onChange: setCriteriaType, opts: memberKind === 'devices' ? GROUP_DEVICE_TYPES : GROUP_ASSET_TYPES, demo: 'Turbine Controller' },
                { label: 'Health Status', value: criteriaStatus, onChange: setCriteriaStatus, opts: GROUP_STATUSES, demo: 'Degraded' },
              ] as { label: string; value: string; onChange: (v: string) => void; opts: string[]; demo: string }[]).map(({ label, value, onChange, opts, demo }) => (
                <div key={label} className="space-y-1">
                  <label
                    className="text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-blue-600 transition-colors inline-flex items-center gap-1 group"
                    title="Click to fill"
                    onClick={() => onChange(demo)}
                  >{label}<span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-500 transition-opacity">← click to fill</span></label>
                  <select value={value} onChange={e => onChange(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-white px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                    <option value="">Any</option>
                    {opts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="space-y-1.5 mt-3">
              <label
                className="text-xs font-medium cursor-pointer select-none hover:text-blue-600 transition-colors inline-flex items-center gap-1 group"
                title="Click to fill"
                onClick={() => setFreeQuery('devices that have not reported telemetry in the last 24 hours')}
              >Additional Query<span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-500 transition-opacity">← click to fill</span></label>
              <textarea value={freeQuery} onChange={e => setFreeQuery(e.target.value)}
                placeholder="e.g. devices that have not reported telemetry in the last 24 hours" rows={2}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t px-6 py-4">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!canSave} onClick={() => onSave({
            ...group,
            name,
            memberKind,
            type: memberKind === 'devices' ? 'Device Group' as const : 'Asset Group' as const,
            criteria: {
              manufacturer: criteriaManufacturer || undefined,
              site: criteriaSite || undefined,
              type: criteriaType || undefined,
              status: criteriaStatus || undefined,
            },
          } as typeof mockGroups[0])}>Save Changes</Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Groups View ────────────────────────────────────────────── */

export function GroupsView({ onGroupSelect }: { onGroupSelect?: (id: string) => void }) {
  const [groups, setGroups] = useState(mockGroups)
  const [showWizard, setShowWizard] = useState(false)
  const [editTarget, setEditTarget] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<'name' | 'members'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [filterKind, setFilterKind] = useState<'all' | 'Device Group' | 'Asset Group' | 'ADU Group (classic)'>('all')

  const deviceGroups = groups.filter(g => g.memberKind === 'devices' && g.type !== 'ADU Group (classic)')
  const assetGroups  = groups.filter(g => g.memberKind === 'assets')
  const aduGroups    = groups.filter(g => g.type === 'ADU Group (classic)')

  const filteredGroups = useMemo(() => {
    let result: typeof mockGroups = groups
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(g => g.name.toLowerCase().includes(q) || g.id.toLowerCase().includes(q))
    }
    if (filterKind !== 'all') result = result.filter(g => g.type === filterKind)
    return [...result].sort((a, b) => {
      let cmp = 0
      if (sortField === 'name') cmp = a.name.localeCompare(b.name)
      if (sortField === 'members') cmp = (a.memberKind === 'devices' ? a.devices : a.assets) - (b.memberKind === 'devices' ? b.devices : b.assets)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [groups, search, filterKind, sortField, sortDir])

  const toggleSort = (field: 'name' | 'members') => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  function handleCreate(draft: GroupDraft) {
    const newId = `GRP-${String(groups.length + 1).padStart(3, '0')}`
    const newGroup = {
      id: newId,
      name: draft.name,
      memberKind: draft.memberKind,
      type: draft.memberKind === 'devices' ? 'Device Group' as const : 'Asset Group' as const,
      devices: draft.memberKind === 'devices' ? Math.floor(Math.random() * 200 + 50) : 0,
      assets:  draft.memberKind === 'assets'  ? Math.floor(Math.random() * 100 + 20) : 0,
      status: 'Active' as const,
      criteria: {
        manufacturer: draft.criteriaManufacturer || undefined,
        site: draft.criteriaSite || undefined,
        type: draft.criteriaType || undefined,
        status: draft.criteriaStatus || undefined,
      },
    }
    setGroups(prev => [...prev, newGroup] as typeof mockGroups)
    setShowWizard(false)
  }

  function handleSaveEdit(updated: typeof mockGroups[0]) {
    setGroups(prev => prev.map(g => g.id === updated.id ? updated : g) as typeof mockGroups)
    setEditTarget(null)
  }

  const editGroup = editTarget ? groups.find(g => g.id === editTarget) ?? null : null

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <CapabilityPageHeader icon={Users} title="Groups" description="Organize devices and assets into groups for targeted jobs, policies, and firmware deployments." />
        <Button size="sm" className="gap-1.5 text-xs shrink-0" onClick={() => setShowWizard(true)}>
          <Plus className="h-3.5 w-3.5" />
          Create Group
        </Button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Groups',   value: groups.length.toString() },
          { label: 'Device Groups',  value: deviceGroups.length.toString() },
          { label: 'Asset Groups',   value: assetGroups.length.toString() },
          { label: 'ADU (classic)',  value: aduGroups.length.toString() },
        ].map(c => (
          <div key={c.label} className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">{c.label}</p>
            <p className="text-xl font-semibold text-slate-900">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <ChartCard title="Groups by Type">
          <DonutChart segments={[
            { label: 'Device Groups', value: deviceGroups.length, color: '#3b82f6' },
            { label: 'Asset Groups',  value: assetGroups.length,  color: '#8b5cf6' },
            { label: 'ADU (classic)', value: aduGroups.length,    color: '#f59e0b' },
          ]} centerLabel="Groups" legendBelow />
        </ChartCard>
        <ChartCard title="Member Count by Group">
          <HBarChart data={groups.slice(0, 6).map(g => ({
            label: g.name.length > 28 ? g.name.slice(0, 28) + '…' : g.name,
            value: g.memberKind === 'devices' ? g.devices : g.assets,
            color: g.memberKind === 'devices' ? '#3b82f6' : '#8b5cf6',
          }))} />
        </ChartCard>
      </div>

      <div className="rounded-lg border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-white">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search groups…"
              className="w-full pl-8 pr-3 h-8 text-sm rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
          <select
            value={filterKind}
            onChange={e => setFilterKind(e.target.value as typeof filterKind)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="all">All Types</option>
            <option value="Device Group">Device Group</option>
            <option value="Asset Group">Asset Group</option>
            <option value="ADU Group (classic)">ADU Group (classic)</option>
          </select>
          {(search || filterKind !== 'all') && (
            <button onClick={() => { setSearch(''); setFilterKind('all') }} className="text-xs text-slate-500 hover:text-slate-700 transition-colors">
              Clear
            </button>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            {filteredGroups.length}{filteredGroups.length !== groups.length ? ` of ${groups.length}` : ''} group{filteredGroups.length !== 1 ? 's' : ''}
          </span>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">ID</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <button className="inline-flex items-center gap-1 group" onClick={() => toggleSort('name')}>
                  Group Name<SortIcon field="name" sort={{ field: sortField, dir: sortDir }} />
                </button>
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Kind</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">
                <button className="inline-flex items-center gap-1 group ml-auto" onClick={() => toggleSort('members')}>
                  Members<SortIcon field="members" sort={{ field: sortField, dir: sortDir }} />
                </button>
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-10">No groups match your search.</TableCell>
              </TableRow>
            ) : filteredGroups.map(g => (
              <TableRow key={g.id} className="hover:bg-slate-50/80 cursor-pointer" onClick={() => onGroupSelect?.(g.id)}>
                <TableCell className="font-mono text-xs text-slate-400">{g.id}</TableCell>
                <TableCell className="font-medium text-sm">{g.name}</TableCell>
                <TableCell>
                  {g.type === 'ADU Group (classic)' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">
                      <Layers className="h-3 w-3" />
                      ADU Group (classic)
                    </span>
                  ) : (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${g.memberKind === 'assets' ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                      {g.memberKind === 'assets' ? <Drill className="h-3 w-3" /> : <Cpu className="h-3 w-3" />}
                      {g.type}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {g.memberKind === 'devices' ? g.devices.toLocaleString() : g.assets.toLocaleString()}
                </TableCell>
                <TableCell><StatusBadge status={g.status} /></TableCell>
                <TableCell className="text-right pr-3">
                  <div className="flex items-center justify-end gap-1">
                    {g.type !== 'ADU Group (classic)' && (
                      <button
                        onClick={e => { e.stopPropagation(); setEditTarget(g.id) }}
                        className="rounded-md p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Edit group"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <span className="text-xs text-blue-600 flex items-center gap-1 pl-1">
                      View {g.memberKind === 'assets' ? 'Assets' : 'Devices'}<ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <AnimatePresence>
        {showWizard && <CreateGroupWizard onClose={() => setShowWizard(false)} onCreate={handleCreate} />}
        {editGroup && <EditGroupModal key={editGroup.id} group={editGroup} onClose={() => setEditTarget(null)} onSave={handleSaveEdit} />}
      </AnimatePresence>
    </motion.div>
  )
}
