import React from 'react'
import { Card, CardContent } from '@/components/ui/card'

/* ─── Mini chart helpers ─────────────────────────────────────── */

export function SegBar({ segs }: { segs: { v: number; c: string }[] }) {
  const total = segs.reduce((s, x) => s + x.v, 0)
  if (!total) return null
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full gap-px">
      {segs.filter(s => s.v > 0).map((s, i) => (
        <div key={i} style={{ width: `${(s.v / total) * 100}%`, background: s.c }} />
      ))}
    </div>
  )
}

export function HBar({ value, max, color = '#3b82f6' }: { value: number; max: number; color?: string }) {
  return (
    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${Math.round((value / Math.max(max, 1)) * 100)}%`, background: color }} />
    </div>
  )
}

/* ─── Donut Chart ────────────────────────────────────────────── */

export function DonutChart({ segments, centerLabel, legendBelow }: { segments: { label: string; value: number; color: string }[]; centerLabel?: string; legendBelow?: boolean }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  const size = 130
  const cx = size / 2, cy = size / 2
  const r = 48, innerR = 30
  let cumulative = 0
  const paths = segments.map((seg) => {
    const startAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2
    cumulative += seg.value
    const endAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2
    const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle)
    const ix1 = cx + innerR * Math.cos(startAngle), iy1 = cy + innerR * Math.sin(startAngle)
    const ix2 = cx + innerR * Math.cos(endAngle), iy2 = cy + innerR * Math.sin(endAngle)
    const largeArc = seg.value / total > 0.5 ? 1 : 0
    const d = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1} Z`
    return { d, ...seg }
  })
  const mainSeg = segments.reduce((a, b) => (a.value > b.value ? a : b))
  const mainPct = Math.round((mainSeg.value / total) * 100)
  if (legendBelow) {
    return (
      <div className="flex flex-col items-center gap-3">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {paths.map((p, i) => <path key={i} d={p.d} fill={p.color} />)}
          <text x={cx} y={cy - 5} textAnchor="middle" style={{ fontSize: 18, fontWeight: 600, fill: '#0f172a' }}>{mainPct}%</text>
          <text x={cx} y={cy + 12} textAnchor="middle" style={{ fontSize: 10, fill: '#64748b' }}>{centerLabel ?? mainSeg.label}</text>
        </svg>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 w-full">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center gap-1.5 text-xs">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-muted-foreground">{seg.label}</span>
              <span className="font-mono tabular-nums text-foreground">{seg.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-5">
      <div className="shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {paths.map((p, i) => <path key={i} d={p.d} fill={p.color} />)}
          <text x={cx} y={cy - 5} textAnchor="middle" style={{ fontSize: 18, fontWeight: 600, fill: '#0f172a' }}>{mainPct}%</text>
          <text x={cx} y={cy + 12} textAnchor="middle" style={{ fontSize: 10, fill: '#64748b' }}>{centerLabel ?? mainSeg.label}</text>
        </svg>
      </div>
      <div className="space-y-2 flex-1 min-w-0">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-muted-foreground truncate">{seg.label}</span>
            <span className="ml-auto font-mono pl-2 tabular-nums">{seg.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function HBarChart({ data, onBarClick }: { data: { label: string; value: number; color: string }[]; onBarClick?: (label: string) => void }) {
  const max = Math.max(...data.map(d => d.value))
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex items-center justify-between text-xs mb-1">
            {onBarClick ? (
              <button
                onClick={() => onBarClick(d.label)}
                className="text-blue-600 hover:text-blue-800 hover:underline underline-offset-2 truncate mr-2 text-left transition-colors"
              >{d.label}</button>
            ) : (
              <span className="text-muted-foreground truncate mr-2">{d.label}</span>
            )}
            <span className="font-mono tabular-nums shrink-0">{d.value.toLocaleString()}</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${(d.value / max) * 100}%`, backgroundColor: d.color }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5">
        <p className="text-sm font-semibold mb-4">{title}</p>
        {children}
      </CardContent>
    </Card>
  )
}

/** SVG line chart that fills the container width */
export function TinyLineChart({ data, color = '#3b82f6', label }: { data: number[]; color?: string; label?: string }) {
  const h = 80
  const pad = 6
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (300 - pad * 2)
    const y = h - pad - ((v - min) / range) * (h - pad * 2)
    return `${x},${y}`
  }).join(' ')
  const lastPt = pts.split(' ').at(-1)!
  const lastVal = data[data.length - 1]
  return (
    <div className="w-full">
      <svg viewBox={`0 0 300 ${h}`} className="w-full" preserveAspectRatio="none" style={{ height: h }}>
        <defs>
          <linearGradient id={`tl-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`${pad},${h - pad} ${pts} ${300 - pad},${h - pad}`} fill={`url(#tl-${color.replace('#','')})`} />
        <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        {lastPt && <circle cx={lastPt.split(',')[0]} cy={lastPt.split(',')[1]} r="3" fill={color} />}
      </svg>
      {label && <p className="text-xs text-muted-foreground mt-1">{label}: <span className="font-mono font-medium text-foreground">{lastVal.toLocaleString()}</span></p>}
    </div>
  )
}

export function VBarChart({ data, total }: { data: { label: string; value: number }[]; total: number }) {
  const max = total
  return (
    <div className="flex items-end gap-3" style={{ height: 130 }}>
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1 h-full justify-end">
          <span className="text-xs font-mono tabular-nums">{d.value}</span>
          <div className="w-full flex items-end" style={{ height: 80 }}>
            <div
              className="w-full rounded-t-sm bg-blue-500/80 transition-all"
              style={{ height: `${max > 0 ? (d.value / max) * 80 : 0}px` }}
            />
          </div>
          <span className="text-[9px] text-muted-foreground leading-tight text-center">{d.label}</span>
        </div>
      ))}
      <div className="self-end pb-5 text-[10px] text-muted-foreground whitespace-nowrap">/ {total}</div>
    </div>
  )
}
