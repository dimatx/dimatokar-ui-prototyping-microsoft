import React from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Hub } from './mockData'
import { aioInstances } from './mockData'
import { SegBar, HBar } from './ChartHelpers'
import { SubViewHeader } from './SharedComponents'

export function IotHubView({ hubs, onAddHub, unlinkedCount }: { hubs: Hub[]; onAddHub: () => void; unlinkedCount: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <SubViewHeader title="IoT Hubs" count={hubs.length} subtitle="Texas-Wind-Namespace" />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={onAddHub}
            disabled={unlinkedCount === 0}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Existing Hub
          </Button>
          <Button
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => {}}
          >
            <Plus className="h-3.5 w-3.5" />
            Add New Hub
          </Button>
        </div>
      </div>
      {/* Hub charts */}
      {(() => {
        const healthy = hubs.filter(h => h.status === 'Healthy').length
        const degraded = hubs.filter(h => h.status === 'Degraded').length
        const other = hubs.length - healthy - degraded
        const byRegion = hubs.reduce<Record<string, number>>((acc, h) => { acc[h.region] = (acc[h.region] ?? 0) + h.devices; return acc }, {})
        const regionEntries = Object.entries(byRegion).sort((a, b) => b[1] - a[1])
        const maxRegion = Math.max(...regionEntries.map(r => r[1]))
        const maxHub = Math.max(...hubs.filter(h => h.status !== 'Adding').map(h => h.devices))
        if (hubs.length === 0) return null
        return (
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border p-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Hub Health</p>
              <SegBar segs={[{ v: healthy, c: '#22c55e' }, { v: degraded, c: '#f59e0b' }, { v: other, c: '#94a3b8' }]} />
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {healthy > 0 && <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />{healthy} Healthy</span>}
                {degraded > 0 && <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />{degraded} Degraded</span>}
                {other > 0 && <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="h-2 w-2 rounded-full bg-slate-300 shrink-0" />{other} Other</span>}
              </div>
            </div>
            <div className="rounded-lg border p-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Devices by Region</p>
              <div className="space-y-2">
                {regionEntries.map(([region, count]) => (
                  <div key={region}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-muted-foreground truncate max-w-[130px]">{region}</span>
                      <span className="text-[11px] font-mono text-foreground ml-2">{count.toLocaleString()}</span>
                    </div>
                    <HBar value={count} max={maxRegion} color="#6366f1" />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border p-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Device Load per Hub</p>
              <div className="space-y-2">
                {hubs.filter(h => h.status !== 'Adding').map(hub => (
                  <div key={hub.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[120px]">{hub.name.replace('hub-', '')}</span>
                      <span className="text-[11px] font-mono text-foreground ml-2">{hub.devices.toLocaleString()}</span>
                    </div>
                    <HBar value={hub.devices} max={maxHub} color={hub.status === 'Degraded' ? '#f59e0b' : '#3b82f6'} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })()}
      <div className="rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hub Name</TableHead>
              <TableHead>Region</TableHead>
              <TableHead className="text-right">Connected Devices</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hubs.map((hub) => (
              <TableRow key={hub.name} className={hub.status === 'Adding' ? 'bg-blue-50/30' : ''}>
                <TableCell className="font-mono text-sm font-medium">{hub.name}</TableCell>
                <TableCell className="text-muted-foreground">{hub.region}</TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {hub.status === 'Adding' ? '—' : hub.devices.toLocaleString()}
                </TableCell>
                <TableCell><StatusBadge status={hub.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  )
}

export function IotOpsView() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <SubViewHeader
          title={<><span className="whitespace-nowrap">IoT&nbsp;Operations</span> Instances</>}
          count={aioInstances.length}
          subtitle="Texas-Wind-Namespace"
        />
        <Button
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => {}}
        >
          <Plus className="h-3.5 w-3.5" />
          Deploy new IoT Operations instance
        </Button>
      </div>
      {/* IoT Operations charts */}
      {(() => {
        const healthy = aioInstances.filter(i => i.status === 'Healthy').length
        const degraded = aioInstances.filter(i => i.status === 'Degraded').length
        const other = aioInstances.length - healthy - degraded
        const maxDevices = Math.max(...aioInstances.map(i => i.connectedDevices))
        const maxAssets  = Math.max(...aioInstances.map(i => i.assets))
        return (
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border p-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Instance Health</p>
              <SegBar segs={[{ v: healthy, c: '#22c55e' }, { v: degraded, c: '#f59e0b' }, { v: other, c: '#94a3b8' }]} />
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {healthy > 0 && <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />{healthy} Healthy</span>}
                {degraded > 0 && <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />{degraded} Degraded</span>}
                {other > 0 && <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="h-2 w-2 rounded-full bg-slate-300 shrink-0" />{other} Other</span>}
              </div>
            </div>
            <div className="rounded-lg border p-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Assets</p>
              <div className="space-y-2">
                {aioInstances.map(inst => (
                  <div key={inst.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[130px]">{inst.name.replace('aio-tx-', '')}</span>
                      <span className="text-[11px] font-mono text-foreground ml-2">{inst.assets.toLocaleString()}</span>
                    </div>
                    <HBar value={inst.assets} max={maxAssets} color="#8b5cf6" />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border p-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Devices</p>
              <div className="space-y-2">
                {aioInstances.map(inst => (
                  <div key={inst.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[130px]">{inst.name.replace('aio-tx-', '')}</span>
                      <span className="text-[11px] font-mono text-foreground ml-2">{inst.connectedDevices.toLocaleString()}</span>
                    </div>
                    <HBar value={inst.connectedDevices} max={maxDevices} color={inst.status === 'Degraded' ? '#f59e0b' : '#3b82f6'} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })()}
      <div className="rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Instance</TableHead>
              <TableHead>Site</TableHead>
              <TableHead className="text-right">Assets</TableHead>
              <TableHead className="text-right">Devices</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {aioInstances.map((inst) => (
              <TableRow key={inst.name}>
                <TableCell className="font-mono text-sm font-medium">{inst.name}</TableCell>
                <TableCell className="text-muted-foreground">{inst.site}</TableCell>
                <TableCell className="text-right font-mono text-sm">{inst.assets.toLocaleString()}</TableCell>
                <TableCell className="text-right font-mono text-sm">{inst.connectedDevices.toLocaleString()}</TableCell>
                <TableCell><StatusBadge status={inst.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  )
}
