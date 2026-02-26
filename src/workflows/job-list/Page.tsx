import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Search, ChevronUp, ChevronDown, CheckCircle2, Loader2,
  XCircle, Clock, Play, RotateCcw, Copy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/StatusBadge'
import { ALL_JOBS, JobRecord } from '@/workflows/adr-namespace/jobData'
import { NewJobWizard } from '@/workflows/adr-namespace/NewJobWizard'
import type { JobPrefill } from '@/workflows/adr-namespace/NewJobWizard'
import type { Hub } from '@/workflows/adr-namespace/Page'
// ─── Map job display type → wizard job-type id ───────────────────────────────
const TYPE_TO_WIZARD_ID: Record<string, string> = {
  'Software Update': 'software-update',
  'Certificate Revocation': 'cert-revocation',
  'Management Action': 'management-action',
  'Management Update': 'management-update',
}

// ─── Mock hub + aio data (same fleet as namespace page) ──────────────────────
const MOCK_HUBS: Hub[] = [
  { name: 'hub-tx-wind-01', region: 'South Central US', devices: 4_250, status: 'Healthy' },
  { name: 'hub-tx-wind-02', region: 'South Central US', devices: 3_980, status: 'Healthy' },
  { name: 'hub-tx-wind-03', region: 'East US 2', devices: 2_617, status: 'Healthy' },
  { name: 'hub-tx-wind-04', region: 'East US 2', devices: 2_000, status: 'Degraded' },
]
const MOCK_AIO = [{ name: 'aio-tx-abilene-01', site: 'Abilene Wind Farm', status: 'Healthy', connectedDevices: 3200, assets: 3200 }]
const MOCK_EXISTING_JOBS = ALL_JOBS.map(j => ({ id: j.id, name: j.name, type: j.type, status: j.status, targets: `${j.targetDevices.toLocaleString()} devices`, started: j.started }))

const FILTER_STYLES: Record<string, { dot: string; badge: string }> = {
  Running: { dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  Completed: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  Failed: { dot: 'bg-red-500', badge: 'bg-red-50 text-red-700 border-red-200' },
  Scheduled: { dot: 'bg-slate-400', badge: 'bg-slate-50 text-slate-600 border-slate-200' },
}

const TYPE_COLORS: Record<string, string> = {
  'Software Update': 'bg-violet-50 text-violet-700 border-violet-200',
  'Certificate Revocation': 'bg-amber-50 text-amber-700 border-amber-200',
  'Management Action': 'bg-sky-50 text-sky-700 border-sky-200',
  'Management Update': 'bg-teal-50 text-teal-700 border-teal-200',
}

function TypeBadge({ type }: { type: string }) {
  const cls = TYPE_COLORS[type] ?? 'bg-slate-50 text-slate-600 border-slate-200'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${cls}`}>
      {type}
    </span>
  )
}

// ─── Sortable column header ───────────────────────────────────────────────────

type SortKey = 'id' | 'name' | 'type' | 'status' | 'targetDevices' | 'started'
type SortDir = 'asc' | 'desc'

function SortHeader({
  label, colKey, sort, onSort,
}: {
  label: string; colKey: SortKey; sort: { key: SortKey; dir: SortDir }; onSort: (k: SortKey) => void
}) {
  const active = sort.key === colKey
  return (
    <button
      className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wide select-none hover:text-slate-900 transition-colors ${active ? 'text-slate-900' : 'text-slate-500'}`}
      onClick={() => onSort(colKey)}
    >
      {label}
      {active ? (
        sort.dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
      ) : (
        <ChevronUp className="w-3 h-3 opacity-25" />
      )}
    </button>
  )
}

// ─── Mini device breakdown bar ────────────────────────────────────────────────
function DeviceBar({ job }: { job: JobRecord }) {
  const total = job.devices.succeeded + job.devices.pending + job.devices.failed
  if (total === 0) return <span className="text-xs text-slate-400">—</span>
  const pctSucceeded = (job.devices.succeeded / total) * 100
  const pctFailed = (job.devices.failed / total) * 100

  if (job.status === 'Scheduled') {
    return <span className="text-xs text-slate-400">{total.toLocaleString()} devices</span>
  }

  return (
    <div className="flex flex-col gap-1 min-w-[120px]">
      <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-slate-100">
        <div className="bg-emerald-500" style={{ width: `${pctSucceeded}%` }} />
        <div className="bg-red-400" style={{ width: `${pctFailed}%` }} />
        <div className="flex-1 bg-blue-200" />
      </div>
      <span className="text-[10px] text-slate-500">
        {total.toLocaleString()} devices
      </span>
    </div>
  )
}

// ─── Summary stat cards ───────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white border border-slate-100 rounded-lg px-5 py-4 flex items-center gap-4 shadow-sm">
      <div className={`p-2.5 rounded-lg ${color}`}>{icon}</div>
      <div>
        <div className="text-2xl font-semibold text-slate-900">{value}</div>
        <div className="text-xs text-slate-500 mt-0.5">{label}</div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const ALL_STATUSES = ['Running', 'Completed', 'Failed', 'Scheduled']
const ALL_TYPES = Array.from(new Set(ALL_JOBS.map(j => j.type)))

export default function JobListPage() {
  const navigate = useNavigate()
  return <JobListContent navigate={(path) => navigate(path)} showBackNav />
}

export function JobListEmbedded({ onNavigate }: { onNavigate?: (path: string) => void } = {}) {
  const navigate = useNavigate()
  const navFn = onNavigate ?? ((path: string) => navigate(path))
  return <JobListContent navigate={navFn} showBackNav={false} />
}

function JobListContent({ navigate, showBackNav }: { navigate: (path: string) => void; showBackNav: boolean }) {

  const [showWizard, setShowWizard] = useState(false)
  const [wizardPrefill, setWizardPrefill] = useState<JobPrefill | undefined>(undefined)

  function openNewJob() {
    setWizardPrefill(undefined)
    setShowWizard(true)
  }

  function openCopyJob(job: JobRecord, e: React.MouseEvent) {
    e.stopPropagation()
    setWizardPrefill({
      jobType: TYPE_TO_WIZARD_ID[job.type],
      jobName: `Copy of ${job.name}`,
      jobDescription: job.description,
      targetMode: job.targetMode,
      scheduleMode: job.scheduleMode,
      priority: job.priority,
      copiedFrom: job.id,
    })
    setShowWizard(true)
  }

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [typeFilter, setTypeFilter] = useState<string[]>([])
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'id', dir: 'desc' })

  function toggleStatus(s: string) {
    setStatusFilter(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }
  function toggleType(t: string) {
    setTypeFilter(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }
  function handleSort(key: SortKey) {
    setSort(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })
  }
  function clearFilters() {
    setSearch(''); setStatusFilter([]); setTypeFilter([])
  }

  const filtered = useMemo(() => {
    let jobs = [...ALL_JOBS]
    if (search.trim()) {
      const q = search.toLowerCase()
      jobs = jobs.filter(j => j.id.toLowerCase().includes(q) || j.name.toLowerCase().includes(q))
    }
    if (statusFilter.length) jobs = jobs.filter(j => statusFilter.includes(j.status))
    if (typeFilter.length) jobs = jobs.filter(j => typeFilter.includes(j.type))

    jobs.sort((a, b) => {
      let av: string | number = ''
      let bv: string | number = ''
      if (sort.key === 'id') { av = a.id; bv = b.id }
      else if (sort.key === 'name') { av = a.name; bv = b.name }
      else if (sort.key === 'type') { av = a.type; bv = b.type }
      else if (sort.key === 'status') { av = a.status; bv = b.status }
      else if (sort.key === 'targetDevices') { av = a.targetDevices; bv = b.targetDevices }
      else if (sort.key === 'started') { av = a.startedIso; bv = b.startedIso }

      if (av < bv) return sort.dir === 'asc' ? -1 : 1
      if (av > bv) return sort.dir === 'asc' ? 1 : -1
      return 0
    })
    return jobs
  }, [search, statusFilter, typeFilter, sort])

  const counts = {
    running: ALL_JOBS.filter(j => j.status === 'Running').length,
    completed: ALL_JOBS.filter(j => j.status === 'Completed').length,
    failed: ALL_JOBS.filter(j => j.status === 'Failed').length,
    scheduled: ALL_JOBS.filter(j => j.status === 'Scheduled').length,
  }

  const hasFilters = search.trim() || statusFilter.length || typeFilter.length

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="max-w-6xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBackNav && (
            <>
              <button
                onClick={() => navigate('/adr-namespace')}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Texas-Wind-Namespace
              </button>
              <span className="text-slate-300">/</span>
              <span className="text-sm font-semibold text-slate-900">Jobs</span>
            </>
          )}
        </div>
        <Button size="sm" className="gap-1.5" onClick={openNewJob}>
          <Play className="w-3.5 h-3.5" />
          New Job
        </Button>
      </div>

      {/* Page title */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Job History</h1>
        <p className="text-sm text-slate-500 mt-1">
          All jobs in <span className="font-medium text-slate-700">Texas-Wind-Namespace</span> — sorted by most recent
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Running"
          value={counts.running}
          icon={<Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
          color="bg-blue-50"
        />
        <StatCard
          label="Completed"
          value={counts.completed}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          color="bg-emerald-50"
        />
        <StatCard
          label="Failed"
          value={counts.failed}
          icon={<XCircle className="w-5 h-5 text-red-500" />}
          color="bg-red-50"
        />
        <StatCard
          label="Scheduled"
          value={counts.scheduled}
          icon={<Clock className="w-5 h-5 text-slate-400" />}
          color="bg-slate-50"
        />
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-100 rounded-lg p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or ID..."
              className="pl-9 h-9 text-sm"
            />
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear filters
            </button>
          )}
        </div>

        <div className="flex items-center gap-6 pt-1 border-t border-slate-50">
          {/* Status filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</span>
            <div className="flex items-center gap-1.5">
              {ALL_STATUSES.map(s => {
                const active = statusFilter.includes(s)
                const cfg = FILTER_STYLES[s]
                return (
                  <button
                    key={s}
                    onClick={() => toggleStatus(s)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                      active ? cfg.badge : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {s}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* Type filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {ALL_TYPES.map(t => {
                const active = typeFilter.includes(t)
                return (
                  <button
                    key={t}
                    onClick={() => toggleType(t)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition-all ${
                      active ? (TYPE_COLORS[t] ?? 'bg-slate-100 text-slate-700 border-slate-300') : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {t}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              <th className="px-5 py-3 text-left">
                <SortHeader label="Job ID" colKey="id" sort={sort} onSort={handleSort} />
              </th>
              <th className="px-5 py-3 text-left">
                <SortHeader label="Name" colKey="name" sort={sort} onSort={handleSort} />
              </th>
              <th className="px-5 py-3 text-left">
                <SortHeader label="Type" colKey="type" sort={sort} onSort={handleSort} />
              </th>
              <th className="px-5 py-3 text-left">
                <SortHeader label="Status" colKey="status" sort={sort} onSort={handleSort} />
              </th>
              <th className="px-5 py-3 text-left">
                <SortHeader label="Devices" colKey="targetDevices" sort={sort} onSort={handleSort} />
              </th>
              <th className="px-5 py-3 text-left">
                <SortHeader label="Started" colKey="started" sort={sort} onSort={handleSort} />
              </th>
              <th className="px-4 py-3 w-[50px]" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-sm">
                  No jobs match the current filters.
                </td>
              </tr>
            ) : (
              filtered.map((job, i) => (
                <tr
                  key={job.id}
                  onClick={() => navigate(`/job-detail?id=${job.id}`)}
                  className={`cursor-pointer hover:bg-slate-50 transition-colors ${i !== filtered.length - 1 ? 'border-b border-slate-50' : ''}`}
                >
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs text-slate-500">{job.id}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-medium text-slate-900 line-clamp-1">{job.name}</span>
                    {job.description && (
                      <span className="block text-[11px] text-slate-400 mt-0.5 line-clamp-1">{job.description}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <TypeBadge type={job.type} />
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <DeviceBar job={job} />
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                    {job.started}
                    {job.duration && <span className="block text-[11px] text-slate-400">{job.duration}</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={e => openCopyJob(job, e)}
                      title="Copy job"
                      className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/40 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Showing {filtered.length} of {ALL_JOBS.length} jobs
            </span>
            {hasFilters && (
              <span className="text-xs text-blue-600 font-medium">{ALL_JOBS.length - filtered.length} hidden by filters</span>
            )}
          </div>
        )}
      </div>

      {/* Wizard */}
      <AnimatePresence>
        {showWizard && (
          <NewJobWizard
            linkedHubs={MOCK_HUBS}
            aioInstances={MOCK_AIO}
            totalAssets={3200}
            existingJobs={MOCK_EXISTING_JOBS}
            prefill={wizardPrefill}
            onClose={() => setShowWizard(false)}
            onCreate={() => setShowWizard(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
