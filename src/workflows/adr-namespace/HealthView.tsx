import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Zap, Server, Layers, Drill, CloudUpload, RefreshCw,
  AlertTriangle, XCircle,
  TrendingUp, TrendingDown, ChevronRight, Activity,
  Wind, MapPin,
} from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { SparklineChart } from '@/components/SparklineChart'
import {
  namespace,
  namespaceFleetMetrics,
  namespaceActiveIssues,
  namespaceStackSummary,
} from './mockData'

/* ─── Fleet KPI card ─────────────────────────────────────────── */

function FleetKpiCard({ title, value, unit, sub, data, color, trend }: {
  title: string; value: string; unit?: string; sub?: string
  data: number[]; color: string; trend: 'up' | 'down' | 'flat'
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Activity
  const trendCls = trend === 'flat' ? 'text-slate-400' : trend === 'up' ? 'text-emerald-600' : 'text-red-500'
  return (
    <div className="rounded-lg border border-slate-100 bg-white px-5 py-4 shadow-sm flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <TrendIcon className={`h-3.5 w-3.5 ${trendCls}`} />
      </div>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-2xl font-semibold tracking-tight">{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      <div className="mt-2">
        <SparklineChart data={data} color={color} width={180} height={30} />
      </div>
    </div>
  )
}

/* ─── Stack health row in the overview table ─────────────────── */

function StackHealthRow({ layer, total, healthy, degraded, unhealthy }: {
  layer: string; total: number; healthy: number; degraded: number; unhealthy: number
}) {
  const other = total - healthy - degraded - unhealthy
  const pctH = (healthy / total) * 100
  const pctD = (degraded / total) * 100
  const pctU = (unhealthy / total) * 100
  const pctO = (other / total) * 100

  const worstStatus = unhealthy > 0 ? 'Critical' : degraded > 0 ? 'Warning' : 'Healthy'

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-3 pl-4 pr-6">
        <span className="text-sm font-medium text-slate-700">{layer}</span>
      </td>
      <td className="py-3 pr-4 text-sm text-muted-foreground text-right tabular-nums">{total.toLocaleString()}</td>
      <td className="py-3 pr-6 w-48">
        <div className="flex h-2 rounded-full overflow-hidden gap-px">
          <div className="bg-emerald-400 rounded-l-full" style={{ width: `${pctH}%` }} />
          {pctD > 0 && <div className="bg-amber-400" style={{ width: `${pctD}%` }} />}
          {pctU > 0 && <div className="bg-red-400" style={{ width: `${pctU}%` }} />}
          {pctO > 0 && <div className="bg-slate-200 rounded-r-full" style={{ width: `${pctO}%` }} />}
        </div>
      </td>
      <td className="py-3 pr-4">
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-emerald-700"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />{healthy.toLocaleString()}</span>
          {degraded > 0 && <span className="flex items-center gap-1 text-amber-700"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />{degraded}</span>}
          {unhealthy > 0 && <span className="flex items-center gap-1 text-red-700"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />{unhealthy}</span>}
        </div>
      </td>
      <td className="py-3 pr-4 text-right">
        <StatusBadge status={worstStatus} />
      </td>
    </tr>
  )
}

/* ─── Active issue card ──────────────────────────────────────── */

function IssueCard({ issue, onViewAsset, onViewDevice }: {
  issue: typeof namespaceActiveIssues[0]
  onViewAsset?: (id: string) => void
  onViewDevice?: (id: string) => void
}) {
  const sevCls = issue.severity === 'Critical'
    ? 'bg-red-50 border-red-200 text-red-700'
    : 'bg-amber-50 border-amber-200 text-amber-700'
  const sevIcon = issue.severity === 'Critical' ? XCircle : AlertTriangle
  const SevIcon = sevIcon

  return (
    <div className={`rounded-lg border px-4 py-3 flex items-start gap-3 ${sevCls}`}>
      <SevIcon className={`h-4 w-4 mt-0.5 shrink-0 ${issue.severity === 'Critical' ? 'text-red-500' : 'text-amber-500'}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${issue.severity === 'Critical' ? 'bg-red-100 border-red-300 text-red-700' : 'bg-amber-100 border-amber-300 text-amber-700'}`}>
            {issue.severity}
          </span>
          <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">{issue.layer}</span>
          <span className="text-xs font-mono text-slate-700">{issue.resource}</span>
          <span className="text-[11px] text-slate-400 ml-auto">{issue.since}</span>
        </div>
        <p className="text-xs text-slate-600">{issue.symptom}</p>
      </div>
      {(issue.assetId || issue.deviceId) && (
        <button
          onClick={() => {
            if (issue.assetId && onViewAsset) onViewAsset(issue.assetId)
            else if (issue.deviceId && onViewDevice) onViewDevice(issue.deviceId)
          }}
          className={`shrink-0 flex items-center gap-1 text-xs font-medium hover:underline mt-0.5 ${issue.severity === 'Critical' ? 'text-red-700' : 'text-amber-700'}`}
        >
          View in Azure Monitor <ChevronRight className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

/* ─── Layer icon ─────────────────────────────────────────────── */

function LayerIcon({ layer }: { layer: string }) {
  if (layer.includes('Asset')) return <Drill className="h-4 w-4 text-slate-400" />
  if (layer.includes('IoT\u00a0Operations') || layer.includes('IoT Operations')) return <Zap className="h-4 w-4 text-slate-400" />
  if (layer.includes('Hub')) return <CloudUpload className="h-4 w-4 text-slate-400" />
  if (layer.includes('Kubernetes')) return <Layers className="h-4 w-4 text-slate-400" />
  if (layer.includes('Host OS')) return <Server className="h-4 w-4 text-slate-400" />
  return <Activity className="h-4 w-4 text-slate-400" />
}

/* ─── Namespace Health View ──────────────────────────────────── */

interface NamespaceHealthViewProps {
  onViewAsset?: (id: string) => void
  onViewDevice?: (id: string) => void
}

export function NamespaceHealthView({ onViewAsset, onViewDevice }: NamespaceHealthViewProps) {
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)

  function refresh() {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
      setLastRefresh(new Date())
    }, 900)
  }

  // Auto-refresh every 30s for demo
  useEffect(() => {
    const t = setInterval(refresh, 30_000)
    return () => clearInterval(t)
  }, [])

  const criticalCount = namespaceActiveIssues.filter(i => i.severity === 'Critical').length
  const warningCount  = namespaceActiveIssues.filter(i => i.severity === 'Warning').length
  const totalIssues   = namespaceActiveIssues.length

  const m = namespaceFleetMetrics
  const lastMsg  = m.totalMsgPerMin[m.totalMsgPerMin.length - 1]
  const lastErr  = m.totalErrorsPerHr[m.totalErrorsPerHr.length - 1]
  const lastKBm  = m.totalDataKBPerMin[m.totalDataKBPerMin.length - 1]
  const lastConn = m.connectedDevices[m.connectedDevices.length - 1]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Azure Device Registry</p>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Wind className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{namespace.name}</h1>
              <p className="text-sm text-muted-foreground">Namespace &middot; Health</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {namespace.region}
            <span className="mx-1 text-border">|</span>
            {namespace.subscription}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Refreshed {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <button
              onClick={refresh}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Issue banner */}
      {totalIssues > 0 && (
        <div className={`rounded-lg border px-5 py-4 flex items-center gap-4 ${criticalCount > 0 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
          {criticalCount > 0
            ? <XCircle className="h-5 w-5 text-red-500 shrink-0" />
            : <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
          }
          <div>
            <p className={`text-sm font-semibold ${criticalCount > 0 ? 'text-red-800' : 'text-amber-800'}`}>
              {totalIssues} active {totalIssues === 1 ? 'issue' : 'issues'} affecting your operations
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {criticalCount > 0 && `${criticalCount} critical`}
              {criticalCount > 0 && warningCount > 0 && ' · '}
              {warningCount > 0 && `${warningCount} warning`}
              {' · '}Assets, Devices, IoT Operations instances, and IoT Hubs.
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {criticalCount > 0 && (
              <button
                onClick={() => document.getElementById('active-alerts')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 transition-colors cursor-pointer"
              >
                <XCircle className="h-3 w-3" />
                {criticalCount} Critical
              </button>
            )}
            {warningCount > 0 && (
              <button
                onClick={() => document.getElementById('active-alerts')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-300 hover:bg-amber-200 transition-colors cursor-pointer"
              >
                <AlertTriangle className="h-3 w-3" />
                {warningCount} Warning
              </button>
            )}
          </div>
        </div>
      )}

      {/* Fleet KPI row */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Fleet Metrics · Last 24 Hours</p>
        <div className="grid grid-cols-4 gap-4">
          <FleetKpiCard
            title="Total Messages / min"
            value={lastMsg.toLocaleString()}
            data={m.totalMsgPerMin}
            color="#3b82f6"
            trend="up"
          />
          <FleetKpiCard
            title="Errors / hr"
            value={lastErr.toLocaleString()}
            sub="Across all assets + devices"
            data={m.totalErrorsPerHr}
            color="#ef4444"
            trend="up"
          />
          <FleetKpiCard
            title="Data to Cloud"
            value="1.8"
            unit="GB/hr"
            data={m.totalDataKBPerMin}
            color="#8b5cf6"
            trend="flat"
          />
          <FleetKpiCard
            title="Connected Devices"
            value={lastConn.toLocaleString()}
            sub={`of ${(12_847).toLocaleString()} total`}
            data={m.connectedDevices}
            color="#10b981"
            trend="flat"
          />
        </div>
      </div>

      {/* Stack health overview */}
      <div className="rounded-lg border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100 flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Operational Health</p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-2 pl-4 pr-6 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Layer</th>
              <th className="text-right py-2 pr-4 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Total</th>
              <th className="py-2 pr-6 text-[11px] font-medium text-muted-foreground uppercase tracking-wide w-48">Distribution</th>
              <th className="py-2 pr-4 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Breakdown</th>
              <th className="py-2 pr-4 text-right text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody>
            {namespaceStackSummary.map(row => (
              <StackHealthRow key={row.layer} {...row} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Active alerts */}
      <div id="active-alerts">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Active Alerts</p>
          <a href="#" className="text-[11px] text-blue-600 hover:underline font-medium">Manage in Azure Monitor</a>
        </div>
        <div className="space-y-2.5">
          {namespaceActiveIssues.map(issue => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onViewAsset={onViewAsset}
              onViewDevice={onViewDevice}
            />
          ))}
        </div>
      </div>

    </motion.div>
  )
}
