import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Drill, Zap, Layers, Server, Wifi, WifiOff, CloudUpload,
  AlertTriangle, CheckCircle2, XCircle, AlertCircle,
  TrendingUp, TrendingDown, Minus, ExternalLink, Play, Shield,
} from 'lucide-react'
import { SparklineChart } from '@/components/SparklineChart'
import { StatusBadge } from '@/components/StatusBadge'
import type { StackLayer, HubHealthData } from './mockData'

/* ─── Tiny metric card (compact, inline sparkline) ──────────── */

interface MiniMetricProps {
  title: string
  value: string
  unit?: string
  trend?: 'up' | 'down' | 'flat'
  trendPositive?: boolean
  data: number[]
  color?: string
}

export function MiniMetric({ title, value, unit, trend = 'flat', trendPositive = true, data, color = '#3b82f6' }: MiniMetricProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'flat' ? 'text-slate-400' : trendPositive ? 'text-emerald-600' : 'text-red-500'
  return (
    <div className="rounded-lg border border-slate-100 px-4 py-3 flex flex-col gap-1 bg-white">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide truncate">{title}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-semibold tracking-tight text-slate-800">{value}</span>
        {unit && <span className="text-[11px] text-muted-foreground">{unit}</span>}
        <TrendIcon className={`h-3 w-3 ml-1 ${trendColor}`} />
      </div>
      <div className="mt-0.5">
        <SparklineChart data={data} color={color} width={160} height={28} />
      </div>
    </div>
  )
}

/* ─── 4-up metrics row ───────────────────────────────────────── */

interface MetricsRowProps {
  isAsset: boolean
  msgPerMin: number[]
  errorsPerHr: number[]
  msgCountOrDataKB: number[]
  connectivity: boolean[]
}

export function MetricsRow({ isAsset, msgPerMin, errorsPerHr, msgCountOrDataKB, connectivity }: MetricsRowProps) {
  const lastMsg = msgPerMin[msgPerMin.length - 1] ?? 0
  const prevMsg = msgPerMin[msgPerMin.length - 8] ?? lastMsg
  const msgTrend: 'up' | 'down' | 'flat' = lastMsg > prevMsg * 1.1 ? 'up' : lastMsg < prevMsg * 0.9 ? 'down' : 'flat'

  const lastErr = errorsPerHr[errorsPerHr.length - 1] ?? 0
  const prevErr = errorsPerHr[errorsPerHr.length - 4] ?? lastErr
  const errTrend: 'up' | 'down' | 'flat' = lastErr > prevErr * 1.2 ? 'up' : lastErr < prevErr * 0.8 ? 'down' : 'flat'

  const lastKB = msgCountOrDataKB[msgCountOrDataKB.length - 1] ?? 0
  const connectedCount = connectivity.filter(Boolean).length
  const uptimePct = Math.round((connectedCount / connectivity.length) * 100)

  return (
    <div className="grid grid-cols-4 gap-3">
      <MiniMetric
        title="Messages / min"
        value={lastMsg.toLocaleString()}
        trend={msgTrend}
        trendPositive={msgTrend !== 'down'}
        data={msgPerMin}
        color="#3b82f6"
      />
      <MiniMetric
        title="Errors / hr"
        value={lastErr.toLocaleString()}
        trend={errTrend}
        trendPositive={errTrend !== 'up'}
        data={errorsPerHr}
        color={lastErr > 5 ? '#ef4444' : lastErr > 1 ? '#f59e0b' : '#10b981'}
      />
      <MiniMetric
        title={isAsset ? 'Total Messages' : 'Data to Cloud'}
        value={isAsset ? lastKB.toLocaleString() : (lastKB / 12).toFixed(1)}
        unit={isAsset ? 'msgs' : 'GB/hr'}
        trend="up"
        trendPositive={true}
        data={msgCountOrDataKB}
        color="#8b5cf6"
      />
      <MiniMetric
        title="Uptime (24h)"
        value={`${uptimePct}%`}
        trend={uptimePct === 100 ? 'flat' : 'down'}
        trendPositive={uptimePct > 95}
        data={connectivity.map(c => c ? 1 : 0)}
        color={uptimePct === 100 ? '#10b981' : uptimePct > 95 ? '#f59e0b' : '#ef4444'}
      />
    </div>
  )
}

/* ─── Connectivity timeline (48 half-hour blocks = 24h) ─────── */

interface ConnectivityTimelineProps {
  connectivity: boolean[]
}

export function ConnectivityTimeline({ connectivity }: ConnectivityTimelineProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const connectedCount = connectivity.filter(Boolean).length
  const uptimePct = Math.round((connectedCount / connectivity.length) * 100)

  function slotLabel(i: number) {
    const hoursAgo = ((connectivity.length - 1 - i) * 30) / 60
    if (hoursAgo === 0) return 'Now'
    if (hoursAgo < 1) return `${Math.round(hoursAgo * 60)}m ago`
    return `${Math.round(hoursAgo)}h ago`
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Connectivity (24h)</p>
        <span className={`text-xs font-semibold ${uptimePct === 100 ? 'text-emerald-600' : uptimePct > 95 ? 'text-amber-600' : 'text-red-500'}`}>
          {uptimePct}% uptime
        </span>
      </div>
      <div className="relative">
        <div className="flex gap-0.5 items-end">
          {connectivity.map((connected, i) => (
            <div
              key={i}
              className="relative flex-1"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div
                className={`h-5 rounded-[2px] transition-opacity ${connected ? 'bg-emerald-400' : 'bg-slate-200'} ${hoveredIdx === i ? 'opacity-80' : 'opacity-100'}`}
              />
              {hoveredIdx === i && (
                <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded shadow-md pointer-events-none">
                  {slotLabel(i)} · {connected ? 'Connected' : 'Disconnected'}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-slate-400">24h ago</span>
          <span className="text-[10px] text-slate-400">Now</span>
        </div>
      </div>
    </div>
  )
}

/* ─── Stack health status icon ───────────────────────────────── */

function StatusIcon({ status }: { status: StackLayer['status'] }) {
  if (status === 'Healthy')   return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
  if (status === 'Degraded')  return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
  if (status === 'Warning')   return <AlertCircle   className="h-4 w-4 text-amber-500 shrink-0" />
  if (status === 'Unhealthy') return <XCircle       className="h-4 w-4 text-red-500 shrink-0" />
  return <Minus className="h-4 w-4 text-slate-400 shrink-0" />
}

function layerIcon(type: StackLayer['type']) {
  if (type === 'asset')     return Drill
  if (type === 'aio')       return Zap
  if (type === 'k8s')       return Layers
  if (type === 'baremetal') return Server
  return Server
}

function layerBorder(status: StackLayer['status']) {
  if (status === 'Unhealthy') return 'border-red-300 bg-red-50'
  if (status === 'Degraded')  return 'border-amber-300 bg-amber-50'
  if (status === 'Warning')   return 'border-amber-200 bg-amber-50'
  return 'border-slate-100 bg-white'
}

/* ─── Full asset stack visualization ────────────────────────── */

interface AssetStackHealthProps {
  layers: StackLayer[]
  securityAdvisory?: {
    severity: string
    cveId: string
    title: string
    shortName: string
    firmwareVersion: string
    affectedDevices: number
    nvdUrl: string
    onRemediate?: () => void
    onMoreDetails: () => void
  }
}

export function AssetStackHealth({ layers, securityAdvisory }: AssetStackHealthProps) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">End-to-End</p>
      <div className="relative">
        {layers.map((layer, idx) => {
          const hasSecurityAdvisory = layer.type === 'asset' && !!securityAdvisory
          const Icon = layerIcon(layer.type)
          const isLast = idx === layers.length - 1
          const iconColor = hasSecurityAdvisory
            ? 'text-red-600'
            : layer.status === 'Healthy'
            ? 'text-slate-500'
            : layer.status === 'Unhealthy'
            ? 'text-red-600'
            : 'text-amber-600'
          const iconBg = hasSecurityAdvisory
            ? 'bg-red-100'
            : layer.status === 'Healthy'
            ? 'bg-slate-100'
            : layer.status === 'Unhealthy'
            ? 'bg-red-100'
            : 'bg-amber-100'
          const wrapperCls = hasSecurityAdvisory ? 'border-red-300 bg-red-50' : layerBorder(layer.status)
          const statusForIcon = hasSecurityAdvisory ? 'Unhealthy' : layer.status
          return (
            <div key={layer.type}>
              {layer.nodes ? (
                <motion.div
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className={`rounded-lg border overflow-hidden ${wrapperCls}`}
                >
                  <div className="px-4 py-2.5 flex items-center gap-2 border-b border-slate-100/80">
                    <div className={`p-1.5 rounded-md ${iconBg}`}>
                      <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{layer.label}</span>
                    <StatusIcon status={layer.status} />
                    <span className="text-[11px] text-muted-foreground ml-auto">{layer.nodes.length} hosts</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {layer.nodes.map(node => (
                      <div
                        key={node.name}
                        className={`px-4 py-2 ${node.status === 'Unhealthy' ? 'bg-red-50/60' : node.status !== 'Healthy' ? 'bg-amber-50/40' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <StatusIcon status={node.status} />
                          <span className="text-xs font-mono text-slate-700">{node.name}</span>
                          <span className="text-xs text-muted-foreground ml-1">{node.detail}</span>
                        </div>
                        {node.alertMsg && (
                          <div className={`mt-1 ml-7 flex items-start gap-1.5 text-[11px] rounded px-1.5 py-0.5 w-fit ${node.status === 'Unhealthy' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                            <span>{node.alertMsg}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className={`rounded-lg border px-4 py-3 flex items-start gap-3 ${wrapperCls}`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    <div className={`p-1.5 rounded-md ${iconBg}`}>
                      <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{layer.label}</span>
                      <StatusIcon status={statusForIcon as StackLayer['status']} />
                      <span className="text-xs font-semibold text-slate-700 font-mono">{layer.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{layer.detail}</p>
                    {hasSecurityAdvisory && securityAdvisory && (
                      <div className="mt-2 rounded-md border border-red-200 bg-red-100/70 px-2.5 py-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-semibold text-red-900">Security advisory</span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-200 text-red-800 border border-red-300">{securityAdvisory.severity.toUpperCase()}</span>
                          <a
                            href={securityAdvisory.nvdUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-red-700 hover:text-red-900 hover:underline"
                          >
                            {securityAdvisory.cveId}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        <p className="text-xs text-red-800 mt-1">
                          <span className="font-semibold">{securityAdvisory.title}</span> ({securityAdvisory.shortName}) was identified in firmware v{securityAdvisory.firmwareVersion}.
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          {securityAdvisory.onRemediate && (
                            <button
                              onClick={securityAdvisory.onRemediate}
                              className="inline-flex items-center gap-1.5 rounded-md bg-red-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-red-800 transition-colors"
                            >
                              <Play className="h-3 w-3" />
                              Remediate via OTA {'->'} v3.2.1
                            </button>
                          )}
                          <button
                            onClick={securityAdvisory.onMoreDetails}
                            className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50 transition-colors"
                          >
                            <Shield className="h-3 w-3" />
                            More details
                          </button>
                        </div>
                      </div>
                    )}
                    {layer.alertMsg && (
                      <div className={`mt-1.5 flex items-start gap-1.5 text-xs rounded px-2 py-1 ${layer.status === 'Unhealthy' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                        <span>{layer.alertMsg}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
              {!isLast && (
                <div className="flex justify-start pl-[22px]">
                  <div className="w-px h-3 bg-slate-300" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Device hub health visualization ───────────────────────── */

interface DeviceHubHealthProps {
  deviceName: string
  deviceStatus: string
  deviceConnectivity: string
  hubData: HubHealthData
  securityAdvisory?: {
    severity: string
    cveId: string
    title: string
    shortName: string
    firmwareVersion: string
    affectedDevices: number
    nvdUrl: string
    onRemediate?: () => void
    onMoreDetails: () => void
  }
}

export function DeviceHubHealth({ deviceName, deviceStatus, deviceConnectivity, hubData, securityAdvisory }: DeviceHubHealthProps) {
  const isConnected = deviceConnectivity === 'Connected'
  const hasSecurityAdvisory = !!securityAdvisory

  const deviceLayerBorder = hasSecurityAdvisory
    ? 'border-red-300 bg-red-50'
    : deviceStatus === 'Unhealthy'
    ? 'border-red-300 bg-red-50'
    : deviceStatus === 'Degraded'
    ? 'border-amber-300 bg-amber-50'
    : 'border-slate-100 bg-white'

  const hubLayerBorder = hubData.hubStatus === 'Degraded'
    ? 'border-amber-300 bg-amber-50'
    : hubData.hubStatus === 'Warning'
    ? 'border-amber-200 bg-amber-50'
    : 'border-slate-100 bg-white'

  const deviceStatusMapped = hasSecurityAdvisory ? 'Unhealthy'
    : deviceStatus === 'Healthy' ? 'Healthy'
    : deviceStatus === 'Degraded' ? 'Degraded'
    : deviceStatus === 'Unhealthy' ? 'Unhealthy'
    : 'Inactive' as const

  const hubStatusMapped = hubData.hubStatus === 'Healthy' ? 'Healthy'
    : hubData.hubStatus === 'Degraded' ? 'Degraded'
    : 'Warning' as const

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">End-to-End</p>
      <div>
        {/* Device layer */}
        <motion.div
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          className={`rounded-lg border px-4 py-3 flex items-start gap-3 ${deviceLayerBorder}`}
        >
          <div className="mt-0.5">
            <div className={`p-1.5 rounded-md ${hasSecurityAdvisory ? 'bg-red-100' : deviceStatus === 'Healthy' ? 'bg-slate-100' : deviceStatus === 'Unhealthy' ? 'bg-red-100' : 'bg-amber-100'}`}>
              <Wifi className={`h-3.5 w-3.5 ${hasSecurityAdvisory ? 'text-red-600' : deviceStatus === 'Healthy' ? 'text-slate-500' : deviceStatus === 'Unhealthy' ? 'text-red-600' : 'text-amber-600'}`} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Device</span>
              <StatusIcon status={deviceStatusMapped as StackLayer['status']} />
              <span className="text-xs font-semibold text-slate-700 font-mono">{deviceName}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isConnected
                ? <Wifi className="h-3 w-3 text-emerald-500" />
                : <WifiOff className="h-3 w-3 text-slate-400" />
              }
              <span className="text-xs text-muted-foreground">{deviceConnectivity}</span>
            </div>
            {hasSecurityAdvisory && securityAdvisory && (
              <div className="mt-2 rounded-md border border-red-200 bg-red-100/70 px-2.5 py-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-semibold text-red-900">Security advisory</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-200 text-red-800 border border-red-300">{securityAdvisory.severity.toUpperCase()}</span>
                  <a
                    href={securityAdvisory.nvdUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-red-700 hover:text-red-900 hover:underline"
                  >
                    {securityAdvisory.cveId}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <p className="text-xs text-red-800 mt-1">
                  <span className="font-semibold">{securityAdvisory.title}</span> ({securityAdvisory.shortName}) was identified in firmware v{securityAdvisory.firmwareVersion}.
                  &nbsp;<span className="font-semibold">{securityAdvisory.affectedDevices.toLocaleString()} devices</span> are affected.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  {securityAdvisory.onRemediate && (
                    <button
                      onClick={securityAdvisory.onRemediate}
                      className="inline-flex items-center gap-1.5 rounded-md bg-red-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-red-800 transition-colors"
                    >
                      <Play className="h-3 w-3" />
                      Remediate via OTA {'->'} v3.2.1
                    </button>
                  )}
                  <button
                    onClick={securityAdvisory.onMoreDetails}
                    className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50 transition-colors"
                  >
                    <Shield className="h-3 w-3" />
                    More details
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Connector */}
        <div className="flex justify-start pl-[22px]">
          <div className="w-px h-3 bg-slate-300" />
        </div>

        {/* Hub layer */}
        <motion.div
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.06 }}
          className={`rounded-lg border px-4 py-3 flex items-start gap-3 ${hubLayerBorder}`}
        >
          <div className="mt-0.5">
            <div className={`p-1.5 rounded-md ${hubData.hubStatus === 'Healthy' ? 'bg-slate-100' : 'bg-amber-100'}`}>
              <CloudUpload className={`h-3.5 w-3.5 ${hubData.hubStatus === 'Healthy' ? 'text-slate-500' : 'text-amber-600'}`} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">IoT Hub</span>
              <StatusIcon status={hubStatusMapped as StackLayer['status']} />
              <span className="text-xs font-semibold text-slate-700 font-mono">{hubData.hubName}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{hubData.detail}</p>
            {hubData.alertMsg && (
              <div className="mt-1.5 flex items-start gap-1.5 text-xs bg-amber-100 text-amber-700 rounded px-2 py-1">
                <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                <span>{hubData.alertMsg}</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

/* ─── Health section wrapper (collapsible) ───────────────────── */

interface HealthSectionProps {
  children: React.ReactNode
  defaultOpen?: boolean
  summaryStatus?: string // e.g. 'Healthy' | 'Degraded' | 'Unhealthy'
}

export function HealthSection({ children, defaultOpen = true, summaryStatus }: HealthSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  const badgeStatus = summaryStatus === 'Unhealthy' ? 'Error'
    : summaryStatus === 'Degraded' ? 'Warning'
    : 'Healthy'

  return (
    <div className="rounded-lg border border-slate-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center justify-between hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Health</p>
        </div>
        <div className="flex items-center gap-2">
          {!open && summaryStatus && <StatusBadge status={badgeStatus} />}
          <span className="text-slate-400 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="px-4 py-4 space-y-5"
        >
          {children}
        </motion.div>
      )}
    </div>
  )
}
