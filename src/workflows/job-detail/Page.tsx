import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, CheckCircle2, XCircle, Loader2, Clock, AlertTriangle,
  User, CalendarClock, Target, Layers, Info, ChevronRight,
} from 'lucide-react'
import { ALL_JOBS } from '@/workflows/adr-namespace/jobData'
import type { JobRecord, HubProgress, TimelineEvent } from '@/workflows/adr-namespace/jobData'

// ─── Donut chart ─────────────────────────────────────────────────────────────

interface DonutSegment { value: number; color: string; label: string }

function DonutChart({ segments, size = 180 }: { segments: DonutSegment[]; size?: number }) {
  const cx = size / 2
  const cy = size / 2
  const r = (size - 32) / 2
  const circumference = 2 * Math.PI * r
  const gap = 3
  const total = segments.reduce((s, seg) => s + seg.value, 0)

  if (total === 0) {
    return (
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth={20} />
      </svg>
    )
  }

  let cumulative = 0
  const paths = segments.map((seg, i) => {
    const fraction = seg.value / total
    const dashLen = fraction * circumference - (fraction > 0 ? gap : 0)
    const dashOffset = circumference - (cumulative / total) * circumference
    cumulative += seg.value
    if (seg.value === 0) return null
    return (
      <circle
        key={i}
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={seg.color}
        strokeWidth={22}
        strokeDasharray={`${Math.max(dashLen, 0)} ${circumference}`}
        strokeDashoffset={dashOffset}
        strokeLinecap="butt"
        style={{ transform: `rotate(-90deg)`, transformOrigin: `${cx}px ${cy}px` }}
      />
    )
  })

  const pct = total > 0 ? Math.round((segments[0].value / total) * 100) : 0

  return (
    <svg width={size} height={size}>
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={22} />
      {paths}
      {/* Center text */}
      <text x={cx} y={cy - 8} textAnchor="middle" className="fill-slate-900" style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>
        {pct}%
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" className="fill-slate-400" style={{ fontSize: 11, fontFamily: 'Inter, sans-serif' }}>
        success rate
      </text>
    </svg>
  )
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; badge: string }> = {
  Running: {
    label: 'Running',
    icon: <Loader2 className="w-4 h-4 animate-spin text-blue-500" />,
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  Completed: {
    label: 'Completed',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  Failed: {
    label: 'Failed',
    icon: <XCircle className="w-4 h-4 text-red-500" />,
    badge: 'bg-red-50 text-red-700 border-red-200',
  },
  Scheduled: {
    label: 'Scheduled',
    icon: <Clock className="w-4 h-4 text-slate-400" />,
    badge: 'bg-slate-50 text-slate-600 border-slate-200',
  },
}

const HUB_STATUS_COLORS: Record<string, string> = {
  Running: 'text-blue-600',
  Completed: 'text-emerald-600',
  Failed: 'text-red-600',
  Pending: 'text-slate-400',
  Skipped: 'text-slate-400',
}

const TIMELINE_STYLES: Record<string, { dot: string; icon: React.ReactNode }> = {
  start: { dot: 'bg-slate-400', icon: <div className="w-2 h-2 rounded-full bg-slate-400" /> },
  info: { dot: 'bg-blue-400', icon: <div className="w-2 h-2 rounded-full bg-blue-400" /> },
  success: { dot: 'bg-emerald-500', icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> },
  warn: { dot: 'bg-amber-400', icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> },
  error: { dot: 'bg-red-500', icon: <XCircle className="w-3.5 h-3.5 text-red-500" /> },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, sub }: { label: string; value: number; icon: React.ReactNode; color: string; sub?: string }) {
  return (
    <div className={`rounded-lg border p-4 flex items-center gap-3 ${color}`}>
      <div className="shrink-0">{icon}</div>
      <div>
        <div className="text-xl font-semibold">{value.toLocaleString()}</div>
        <div className="text-xs opacity-70 mt-0.5">{label}</div>
        {sub && <div className="text-[10px] opacity-50">{sub}</div>}
      </div>
    </div>
  )
}

function HubRow({ hub, total: jobTotal }: { hub: HubProgress; total: number }) {
  const total = hub.total
  const pctSucceeded = total > 0 ? (hub.succeeded / total) * 100 : 0
  const pctFailed = total > 0 ? (hub.failed / total) * 100 : 0
  const pctPending = total > 0 ? (hub.pending / total) * 100 : 0
  const statusCls = HUB_STATUS_COLORS[hub.status] ?? 'text-slate-400'

  return (
    <div className="py-4 border-b border-slate-50 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium text-slate-800">{hub.hubName}</span>
          <span className={`text-xs font-medium ${statusCls}`}>{hub.status}</span>
        </div>
        <span className="text-xs text-slate-500">{total.toLocaleString()} devices</span>
      </div>
      {/* Tri-color bar */}
      <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-100">
        <div className="bg-emerald-500 transition-all" style={{ width: `${pctSucceeded}%` }} />
        <div className="bg-red-400 transition-all" style={{ width: `${pctFailed}%` }} />
        <div className="bg-blue-200 transition-all" style={{ width: `${pctPending}%` }} />
      </div>
      <div className="flex items-center gap-4 mt-1.5">
        {hub.succeeded > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            {hub.succeeded.toLocaleString()} succeeded
          </span>
        )}
        {hub.failed > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-red-500">
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
            {hub.failed.toLocaleString()} failed
          </span>
        )}
        {hub.pending > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-blue-200 inline-block" />
            {hub.pending.toLocaleString()} pending
          </span>
        )}
      </div>
    </div>
  )
}

function TimelineRow({ event }: { event: TimelineEvent }) {
  const style = TIMELINE_STYLES[event.type] ?? TIMELINE_STYLES.info
  return (
    <div className="flex gap-3 group">
      <div className="flex flex-col items-center pt-1">
        <div className="w-5 h-5 rounded-full bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
          {style.icon}
        </div>
        <div className="flex-1 w-px bg-slate-100 mt-1 group-last:hidden" />
      </div>
      <div className="pb-5 group-last:pb-0">
        <div className="text-xs font-mono text-slate-400 mb-0.5">{event.time}</div>
        <div className="text-sm font-medium text-slate-800">{event.event}</div>
        {event.detail && <div className="text-xs text-slate-500 mt-0.5">{event.detail}</div>}
      </div>
    </div>
  )
}

// ─── Detail row helper ────────────────────────────────────────────────────────
function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className="w-7 h-7 rounded-md bg-slate-50 flex items-center justify-center mt-0.5 shrink-0 text-slate-400">
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-xs text-slate-400 font-medium">{label}</span>
        <span className="text-sm text-slate-800 font-medium mt-0.5">{value}</span>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function JobDetailPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const jobId = params.get('id') ?? ''
  const job = ALL_JOBS.find(j => j.id === jobId)

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
        <XCircle className="w-8 h-8" />
        <p className="text-sm">Job <span className="font-mono">{jobId || '(none)'}</span> not found.</p>
        <button onClick={() => navigate('/job-list')} className="text-sm text-blue-600 hover:underline mt-2">
          Back to Job List
        </button>
      </div>
    )
  }

  const total = job.devices.succeeded + job.devices.pending + job.devices.failed
  const statusCfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.Completed

  const donutSegments = [
    { value: job.devices.succeeded, color: '#10b981', label: 'Succeeded' },
    { value: job.devices.failed, color: '#f87171', label: 'Failed' },
    { value: job.devices.pending, color: '#93c5fd', label: 'Pending' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-6xl mx-auto space-y-6"
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <button onClick={() => navigate('/adr-namespace')} className="hover:text-slate-900 transition-colors">
          Texas-Wind-Namespace
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <button onClick={() => navigate('/job-list')} className="hover:text-slate-900 transition-colors">
          Jobs
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="font-mono text-slate-700">{job.id}</span>
      </div>

      {/* Job header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-semibold text-slate-900">{job.name}</h1>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusCfg.badge}`}>
              {statusCfg.icon}
              {statusCfg.label}
            </span>
          </div>
          {job.description && <p className="text-sm text-slate-500 max-w-xl">{job.description}</p>}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total devices"
          value={total}
          icon={<Layers className="w-5 h-5 text-slate-400" />}
          color="bg-white border-slate-100"
        />
        <StatCard
          label="Succeeded"
          value={job.devices.succeeded}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          color="bg-emerald-50 border-emerald-100 text-emerald-900"
          sub={total > 0 ? `${Math.round((job.devices.succeeded / total) * 100)}%` : undefined}
        />
        <StatCard
          label="Failed"
          value={job.devices.failed}
          icon={<XCircle className="w-5 h-5 text-red-500" />}
          color={job.devices.failed > 0 ? 'bg-red-50 border-red-100 text-red-900' : 'bg-white border-slate-100 text-slate-500'}
          sub={total > 0 && job.devices.failed > 0 ? `${Math.round((job.devices.failed / total) * 100)}%` : undefined}
        />
        <StatCard
          label="Pending"
          value={job.devices.pending}
          icon={<Loader2 className={`w-5 h-5 text-blue-400 ${job.status === 'Running' ? 'animate-spin' : ''}`} />}
          color={job.devices.pending > 0 ? 'bg-blue-50 border-blue-100 text-blue-900' : 'bg-white border-slate-100 text-slate-500'}
        />
      </div>

      {/* Main 2-col layout */}
      <div className="grid grid-cols-5 gap-6">
        {/* LEFT: donut + hub progress */}
        <div className="col-span-3 space-y-6">
          {/* Donut + legend */}
          <div className="bg-white border border-slate-100 rounded-lg shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-5">Device Execution Breakdown</h2>
            <div className="flex items-center gap-8">
              <DonutChart segments={donutSegments} size={180} />
              <div className="space-y-3 flex-1">
                {donutSegments.filter(s => s.value > 0 || job.status !== 'Scheduled').map(seg => (
                  <div key={seg.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                      <span className="text-sm text-slate-700">{seg.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-slate-900">{seg.value.toLocaleString()}</span>
                      {total > 0 && (
                        <span className="text-xs text-slate-400 ml-1.5">
                          ({Math.round((seg.value / total) * 100)}%)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hub progress */}
          <div className="bg-white border border-slate-100 rounded-lg shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-1">Hub Progress</h2>
            <p className="text-xs text-slate-400 mb-4">Per-hub device execution status</p>
            {job.hubProgress.map(hub => (
              <HubRow key={hub.hubName} hub={hub} total={total} />
            ))}
          </div>
        </div>

        {/* RIGHT: job config + timeline */}
        <div className="col-span-2 space-y-6">
          {/* Configuration */}
          <div className="bg-white border border-slate-100 rounded-lg shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-2">Configuration</h2>
            <DetailRow
              icon={<User className="w-4 h-4" />}
              label="Created by"
              value={job.createdBy}
            />
            <DetailRow
              icon={<CalendarClock className="w-4 h-4" />}
              label="Started"
              value={<span>{job.started}{job.duration && <span className="text-slate-400 font-normal"> &middot; {job.duration}</span>}</span>}
            />
            <DetailRow
              icon={<Target className="w-4 h-4" />}
              label="Target"
              value={<span>{job.targetName}<span className="text-xs text-slate-400 font-normal ml-1.5">({job.targetMode})</span></span>}
            />
            <DetailRow
              icon={<Info className="w-4 h-4" />}
              label="Job type"
              value={job.type}
            />
            <DetailRow
              icon={<Layers className="w-4 h-4" />}
              label="Priority"
              value={job.priority}
            />
            {job.scheduleMode === 'later' && job.scheduleDate && (
              <DetailRow
                icon={<CalendarClock className="w-4 h-4" />}
                label="Scheduled for"
                value={new Date(job.scheduleDate).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
              />
            )}
          </div>

          {/* Activity timeline */}
          <div className="bg-white border border-slate-100 rounded-lg shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-5">Activity Timeline</h2>
            <div>
              {job.timeline.map((ev, i) => (
                <TimelineRow key={i} event={ev} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
