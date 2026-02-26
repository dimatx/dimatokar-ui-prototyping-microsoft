import { motion, AnimatePresence } from 'framer-motion'
import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  Server,
  Cpu,
  Radio,
  RefreshCw,
  KeyRound,
  Upload,
  Activity,
  MapPin,
  CheckCircle2,
  Loader2,
  Plus,
  ChevronRight,
  ChevronDown,
  Wind,
  X,
  Search,
  Settings,
  Shield,
  Puzzle,
  FileText,
  ExternalLink,
  Users,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/StatusBadge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { NewJobWizard, type CreatedJob } from './NewJobWizard'

/* ─── Mock Data ───────────────────────────────────────────────── */

const namespace = {
  name: 'Texas-Wind-Namespace',
  subscription: 'Zava Energy – Production',
  resourceGroup: 'rg-zava-southcentralus',
  region: 'South Central US',
  totalDevices: 12_847,
  totalAssets: 3_215,
}

interface NamespaceService {
  name: string
  icon: typeof Upload
  status: string
  configurable?: boolean
  description?: string
  instanceName?: string
}

const INSTANCE_NAME_OPTIONS: Record<string, string[]> = {
  'Provisioning': ['dps-zava-tx-01', 'dps-zava-tx-02', 'dps-zava-global'],
  'Certificate Management': ['certmgr-zava-tx-01', 'certmgr-zava-prod', 'certmgr-zava-internal'],
  'Device Update': ['adu-zava-tx-01', 'adu-zava-prod-01', 'adu-zava-staging'],
  'Firmware Analysis': ['fwa-zava-tx-01', 'fwa-zava-prod-01'],
  'Future 3P Integration': ['3p-zava-tx-01', '3p-zava-dev-01'],
}

const initialServices: NamespaceService[] = [
  { name: 'Provisioning', icon: Upload, status: 'Healthy', instanceName: 'dps-zava-tx-01' },
  { name: 'Certificate Management', icon: KeyRound, status: 'Healthy', configurable: true, instanceName: 'certmgr-zava-tx-01' },
  { name: 'Device Update', icon: RefreshCw, status: 'Healthy', configurable: true },
]

const addableServices: NamespaceService[] = [
  { name: 'Firmware Analysis', icon: Shield, status: 'Disabled', configurable: true, description: 'Scan firmware images for known vulnerabilities' },
  { name: 'Future 3P Integration', icon: Puzzle, status: 'Disabled', configurable: true, description: 'Connect third-party services to the namespace' },
]

interface Hub {
  name: string
  region: string
  devices: number
  status: string
}
export type { Hub }

const initialHubs: Hub[] = [
  { name: 'hub-tx-wind-01', region: 'South Central US', devices: 4_250, status: 'Healthy' },
  { name: 'hub-tx-wind-02', region: 'South Central US', devices: 3_980, status: 'Healthy' },
  { name: 'hub-tx-wind-03', region: 'East US 2', devices: 2_617, status: 'Healthy' },
  { name: 'hub-tx-wind-04', region: 'East US 2', devices: 2_000, status: 'Degraded' },
]

const availableHubs: Hub[] = [
  { name: 'hub-zava-westus-01', region: 'West US 2', devices: 1_820, status: 'Healthy' },
  { name: 'hub-zava-eastus-05', region: 'East US 2', devices: 3_100, status: 'Healthy' },
  { name: 'hub-zava-euwest-01', region: 'West Europe', devices: 950, status: 'Healthy' },
  { name: 'hub-zava-jpeast-01', region: 'Japan East', devices: 420, status: 'Healthy' },
]

const aioInstances = [
  { name: 'aio-tx-abilene-01', site: 'Abilene Wind Farm', status: 'Healthy', connectedDevices: 842, assets: 434 },
]

const firmwareImages = [
  {
    file: 'turbine-ctrl-x700-v3.2.1.bin',
    manufacturer: 'Contoso Wind Systems',
    model: 'TurbineController-X700',
    version: '3.2.1',
    cves: { critical: 0, high: 1, medium: 3, low: 5 },
    devicesAffected: 2_847,
  },
  {
    file: 'turbine-ctrl-x700-v3.1.0.bin',
    manufacturer: 'Contoso Wind Systems',
    model: 'TurbineController-X700',
    version: '3.1.0',
    cves: { critical: 2, high: 4, medium: 6, low: 8 },
    devicesAffected: 6_203,
  },
  {
    file: 'anem-sensor-fw-v2.4.0.bin',
    manufacturer: 'Zephyr Sensors Inc.',
    model: 'AnemometerPro-2400',
    version: '2.4.0',
    cves: { critical: 0, high: 0, medium: 1, low: 2 },
    devicesAffected: 1_412,
  },
  {
    file: 'edge-gateway-v1.9.3.bin',
    manufacturer: 'Meridian Edge Technologies',
    model: 'EdgeGateway-1900',
    version: '1.9.3',
    cves: { critical: 1, high: 2, medium: 4, low: 3 },
    devicesAffected: 985,
  },
  {
    file: 'pitchctrl-v5.0.2.bin',
    manufacturer: 'AeroLogix Systems',
    model: 'PitchController-5000',
    version: '5.0.2',
    cves: { critical: 0, high: 0, medium: 0, low: 1 },
    devicesAffected: 1_400,
  },
]

const initialJobs = [
  { id: 'JOB-1042', name: 'Firmware update – v3.2.1', type: 'Update', status: 'Running', targets: '2,400 devices', started: '35 min ago' },
  { id: 'JOB-1041', name: 'Certificate renewal – Q1 2026', type: 'Certificate', status: 'Completed', targets: '12,847 devices', started: '2 days ago' },
  { id: 'JOB-1040', name: 'Reboot turbine controllers', type: 'Command', status: 'Completed', targets: '620 devices', started: '5 days ago' },
  { id: 'JOB-1039', name: 'Edge config push – telemetry interval', type: 'Configuration', status: 'Completed', targets: '3,215 assets', started: '1 week ago' },
  { id: 'JOB-1038', name: 'Firmware update – v3.1.0', type: 'Update', status: 'Completed', targets: '8,200 devices', started: '2 weeks ago' },
]

/* ─── Page ────────────────────────────────────────────────────── */

export default function AdrNamespacePage() {
  const navigate = useNavigate()
  const [hubsOpen, setHubsOpen] = useState(false)
  const [aioOpen, setAioOpen] = useState(false)
  const [linkedHubs, setLinkedHubs] = useState<Hub[]>(initialHubs)
  const [showHubPicker, setShowHubPicker] = useState(false)
  const [hubSearch, setHubSearch] = useState('')
  const [hubSearchResults, setHubSearchResults] = useState<Hub[]>([])
  const [hubSearching, setHubSearching] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [hubToConfirm, setHubToConfirm] = useState<Hub | null>(null)
  const [hubConfirmText, setHubConfirmText] = useState('')
  const [jobs, setJobs] = useState<CreatedJob[]>(initialJobs)
  const [showNewJobWizard, setShowNewJobWizard] = useState(false)
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null)

  // Services state
  const [namespaceSvcs, setNamespaceSvcs] = useState<NamespaceService[]>(initialServices)
  const [svcConfigTarget, setSvcConfigTarget] = useState<NamespaceService | null>(null)
  const [disableConfirmText, setDisableConfirmText] = useState('')
  const [showAddService, setShowAddService] = useState(false)
  const [enableInstanceName, setEnableInstanceName] = useState<string>('')
  const [leftMenuOpen, setLeftMenuOpen] = useState(true)
  const [activeMenuItem, setActiveMenuItem] = useState<string>('')

  // Simulate per-hub progress ticking for running jobs
  useEffect(() => {
    const runningJobs = jobs.filter((j) => j.hubProgress && j.status === 'Running')
    if (runningJobs.length === 0) return

    const interval = setInterval(() => {
      setJobs((prev) =>
        prev.map((job) => {
          if (!job.hubProgress || job.status !== 'Running') return job
          const updatedProgress = job.hubProgress.map((hp) => {
            if (hp.status === 'Completed') return hp
            const increment = Math.floor(Math.random() * Math.ceil(hp.total * 0.15)) + Math.ceil(hp.total * 0.05)
            const newCompleted = Math.min(hp.completed + increment, hp.total)
            return {
              ...hp,
              completed: newCompleted,
              status: newCompleted >= hp.total ? 'Completed' : 'Running',
            }
          })
          const allDone = updatedProgress.every((hp) => hp.status === 'Completed')
          return {
            ...job,
            hubProgress: updatedProgress,
            status: allDone ? 'Completed' : 'Running',
          }
        })
      )
    }, 2_000)

    return () => clearInterval(interval)
  }, [jobs])

  const unlinkedHubs = availableHubs.filter(
    (h) => !linkedHubs.some((lh) => lh.name === h.name)
  )

  // Debounced hub search with simulated delay
  useEffect(() => {
    if (!showHubPicker) return
    if (hubSearch.trim() === '') {
      setHubSearchResults(unlinkedHubs)
      setHubSearching(false)
      return
    }
    setHubSearching(true)
    const timer = setTimeout(() => {
      const q = hubSearch.toLowerCase()
      setHubSearchResults(
        unlinkedHubs.filter(
          (h) => h.name.toLowerCase().includes(q) || h.region.toLowerCase().includes(q)
        )
      )
      setHubSearching(false)
    }, 1_200)
    return () => clearTimeout(timer)
  }, [hubSearch, showHubPicker, linkedHubs])

  // Reset search when opening picker
  useEffect(() => {
    if (showHubPicker) {
      setHubSearch('')
      setHubSearchResults(unlinkedHubs)
      setHubSearching(false)
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [showHubPicker])

  function handleAddHub(hub: Hub) {
    const addingHub = { ...hub, devices: 0, status: 'Adding' }
    setLinkedHubs((prev) => [...prev, addingHub])
    setShowHubPicker(false)
    setHubsOpen(true)

    // Simulate transition to Healthy after 3 seconds
    setTimeout(() => {
      setLinkedHubs((prev) =>
        prev.map((h) =>
          h.name === hub.name ? { ...h, devices: hub.devices, status: 'Healthy' } : h
        )
      )
    }, 3_000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex items-start"
    >
      <LeftMenu
        open={leftMenuOpen}
        onToggle={() => setLeftMenuOpen((v) => !v)}
        activeItem={activeMenuItem}
        onItemClick={setActiveMenuItem}
      />
      <div className="flex-1 min-w-0 space-y-8 pl-6">
      {/* ── Header / Hero ────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Wind className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{namespace.name}</h1>
              <p className="text-sm text-muted-foreground">ADR Namespace</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {namespace.region}
          <span className="mx-1 text-border">|</span>
          {namespace.subscription}
        </div>
      </div>

      {/* ── Hero Metrics ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <HeroStat icon={Radio} label="Devices" value={namespace.totalDevices.toLocaleString()} />
        <HeroStat icon={Cpu} label="Assets" value={namespace.totalAssets.toLocaleString()} />
        <HeroStat icon={Server} label="IoT Hubs" value={linkedHubs.length.toString()} />
        <HeroStat icon={Activity} label={<><span className="whitespace-nowrap">IoT&nbsp;Operations</span> Instances</>} value={aioInstances.length.toString()} />
      </div>

      {/* ── Services Health ──────────────────────────────────── */}
      <div>
        <SectionHeading title="Namespace Services" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {namespaceSvcs.map((svc) => (
            <Card key={svc.name} className="shadow-sm relative">
              {svc.name === 'Device Update' && svc.status === 'Disabled' && (
                <span className="absolute -right-2 -top-2 z-10 rounded-full border border-orange-300 bg-orange-50 px-2 py-0.5 text-[9px] font-medium text-orange-600 tracking-wide uppercase shadow-sm">
                  try me
                </span>
              )}
              <CardContent className="flex items-start gap-4 p-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <svc.icon className="h-4 w-4 text-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{svc.name}</p>
                    {svc.configurable && (
                      <button
                        onClick={() => { setSvcConfigTarget(svc); setDisableConfirmText(''); setEnableInstanceName(INSTANCE_NAME_OPTIONS[svc.name]?.[0] ?? '') }}
                        className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        title={`Configure ${svc.name}`}
                      >
                        <Settings className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  {svc.instanceName && (
                    <p className="text-xs font-mono text-muted-foreground mt-0.5 truncate">{svc.instanceName}</p>
                  )}
                  <div className="mt-2">
                    <StatusBadge status={svc.status} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {/* Add Service card */}
          {addableServices.filter(as => !namespaceSvcs.some(s => s.name === as.name)).length > 0 && (
            <Card
              className="shadow-sm border-dashed cursor-pointer hover:bg-muted/20 transition-colors relative"
              onClick={() => setShowAddService(true)}
            >
              <span className="absolute -right-2 -top-2 z-10 rounded-full border border-orange-300 bg-orange-50 px-2 py-0.5 text-[9px] font-medium text-orange-600 tracking-wide uppercase shadow-sm">
                try me
              </span>
              <CardContent className="flex items-center justify-center gap-2 p-5 h-full">
                <Plus className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Add Service</span>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── IoT Hubs (collapsible) ───────────────────────────── */}
      <div>
        <CollapsibleHeading
          title="Linked IoT Hubs"
          count={linkedHubs.length}
          open={hubsOpen}
          onToggle={() => setHubsOpen((v) => !v)}
          summaryStatus={<SummaryStatusDots statuses={linkedHubs.map((h) => h.status)} />}
          action={
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs relative"
              onClick={(e) => {
                e.stopPropagation()
                setShowHubPicker(true)
              }}
              disabled={unlinkedHubs.length === 0}
            >
              <span className="absolute -right-2 -top-2 z-10 rounded-full border border-orange-300 bg-orange-50 px-1.5 py-0.5 text-[9px] font-medium text-orange-600 tracking-wide uppercase shadow-sm">
                try me
              </span>
              <Plus className="h-3.5 w-3.5" />
              Add Linked Hub
            </Button>
          }
        />

        <AnimatePresence initial={false}>
          {hubsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
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
                    {linkedHubs.map((hub) => (
                      <TableRow key={hub.name} className={hub.status === 'Adding' ? 'bg-blue-50/30' : ''}>
                        <TableCell className="font-medium">{hub.name}</TableCell>
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
          )}
        </AnimatePresence>

        {/* Hub picker modal */}
        {showHubPicker && createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
              onClick={() => { setShowHubPicker(false); setHubToConfirm(null); setHubConfirmText('') }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-lg rounded-xl border bg-white shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b px-6 py-4">
                  <div>
                    <h3 className="text-base font-semibold">Add Linked Hub</h3>
                    <p className="text-sm text-muted-foreground">Select an existing hub to link to this namespace</p>
                  </div>
                  <button
                    onClick={() => { setShowHubPicker(false); setHubToConfirm(null); setHubConfirmText('') }}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="border-b px-6 py-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      ref={searchInputRef}
                      placeholder="Search hubs by name or region…"
                      value={hubSearch}
                      onChange={(e) => setHubSearch(e.target.value)}
                      className="pl-9 text-sm"
                    />
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto px-6 py-3">
                  {hubToConfirm ? (
                    <div className="space-y-4 py-2">
                      <div className="rounded-lg border p-3">
                        <p className="text-xs font-medium">{hubToConfirm.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {hubToConfirm.region} · {hubToConfirm.devices.toLocaleString()} devices
                        </p>
                      </div>
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                        <p className="text-xs font-medium text-amber-800">This is an irreversible operation.</p>
                        <p className="text-[11px] text-amber-700 mt-0.5">Once linked, this hub cannot be removed from the namespace.</p>
                      </div>
                      <div className="space-y-1.5">
                        <label
                          className="text-xs font-medium text-foreground cursor-pointer hover:text-blue-600 transition-colors inline-flex items-center gap-1 group"
                          onClick={() => setHubConfirmText(hubToConfirm.name)}
                          title="Click to fill"
                        >
                          Type <span className="font-mono text-foreground">{hubToConfirm.name}</span> to confirm
                          <span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-500 transition-opacity">← click to fill</span>
                        </label>
                        <Input
                          value={hubConfirmText}
                          onChange={(e) => setHubConfirmText(e.target.value)}
                          placeholder={hubToConfirm.name}
                          className="h-8 text-sm font-mono"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && hubConfirmText === hubToConfirm.name) {
                              handleAddHub(hubToConfirm)
                              setHubToConfirm(null)
                              setHubConfirmText('')
                            }
                            if (e.key === 'Escape') {
                              setHubToConfirm(null)
                              setHubConfirmText('')
                            }
                          }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 gap-2"
                          disabled={hubConfirmText !== hubToConfirm.name}
                          onClick={() => {
                            handleAddHub(hubToConfirm)
                            setHubToConfirm(null)
                            setHubConfirmText('')
                          }}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Link Hub
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => { setHubToConfirm(null); setHubConfirmText('') }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : hubSearching ? (
                    <div className="flex items-center justify-center gap-2 py-10">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Searching…</span>
                    </div>
                  ) : hubSearchResults.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">
                      {hubSearch.trim() ? 'No hubs matching your search.' : 'No additional hubs available to link.'}
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {hubSearchResults.map((hub) => (
                        <button
                          key={hub.name}
                          onClick={() => { setHubToConfirm(hub); setHubConfirmText('') }}
                          className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left transition-colors hover:bg-muted/50"
                        >
                          <div>
                            <p className="text-xs font-medium">{hub.name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {hub.region} · {hub.devices.toLocaleString()} devices
                            </p>
                          </div>
                          <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
      </div>

      {/* ── IoT Operations Instances (collapsible) ───────────── */}
      <div>
        <CollapsibleHeading
          title={<><span className="whitespace-nowrap">IoT&nbsp;Operations</span> Instances</>}
          count={aioInstances.length}
          open={aioOpen}
          onToggle={() => setAioOpen((v) => !v)}
          summaryStatus={<SummaryStatusDots statuses={aioInstances.map((i) => i.status)} />}
        />
        <AnimatePresence initial={false}>
          {aioOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="rounded-lg border shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Instance</TableHead>
                      <TableHead>Site</TableHead>
                      <TableHead className="text-right">Connected Devices</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aioInstances.map((inst) => (
                      <TableRow key={inst.name}>
                        <TableCell className="font-medium">{inst.name}</TableCell>
                        <TableCell className="text-muted-foreground">{inst.site}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{inst.connectedDevices.toLocaleString()}</TableCell>
                        <TableCell><StatusBadge status={inst.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Jobs ─────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Jobs</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/job-list')}
              className="text-xs text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1"
            >
              View all
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <Button size="sm" className="gap-1.5 text-xs relative" onClick={() => setShowNewJobWizard(true)}>
              <span className="absolute -right-2 -top-2 z-10 rounded-full border border-orange-300 bg-orange-50 px-1.5 py-0.5 text-[9px] font-medium text-orange-600 tracking-wide uppercase shadow-sm">
                try me
              </span>
              <Plus className="h-3.5 w-3.5" />
              New Job
            </Button>
          </div>
        </div>
        <div className="rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Job ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Targets</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead className="w-[40px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => {
                const isExpandable = !!job.hubProgress
                const isExpanded = expandedJobId === job.id
                return (
                  <React.Fragment key={job.id}>
                    <TableRow
                      className={isExpandable ? 'cursor-pointer hover:bg-muted/30' : ''}
                      onClick={() => isExpandable && setExpandedJobId(isExpanded ? null : job.id)}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">{job.id}</TableCell>
                      <TableCell className="font-medium">{job.name}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-md border bg-muted/40 px-2 py-0.5 text-xs font-medium">
                          {job.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{job.targets}</TableCell>
                      <TableCell>
                        <StatusBadge status={job.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{job.started}</TableCell>
                      <TableCell>
                        {isExpandable ? (
                          <ChevronDown
                            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`}
                          />
                        ) : (
                          <button
                            className="rounded-md p-1 text-muted-foreground hover:bg-muted transition-colors"
                            onClick={(e) => { e.stopPropagation(); navigate(`/job-detail?id=${job.id}`) }}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                    {isExpandable && isExpanded && (
                      <TableRow key={`${job.id}-detail`}>
                        <TableCell colSpan={7} className="p-0">
                          <div className="bg-muted/20 px-6 py-4 space-y-3">
                            <p className="text-xs font-medium text-muted-foreground">Per-Hub Progress</p>
                            <div className="space-y-2">
                              {job.hubProgress!.map((hp) => {
                                const pct = hp.total > 0 ? Math.round((hp.completed / hp.total) * 100) : 0
                                const isDone = hp.status === 'Completed'
                                return (
                                  <div key={hp.hubName} className="flex items-center gap-4">
                                    <div className="w-40 shrink-0">
                                      <p className="text-xs font-medium">{hp.hubName}</p>
                                    </div>
                                    <div className="flex-1">
                                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                                        <div
                                          className={`h-full rounded-full transition-all duration-700 ${isDone ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                          style={{ width: `${pct}%` }}
                                        />
                                      </div>
                                    </div>
                                    <div className="w-36 shrink-0 text-right">
                                      {isDone ? (
                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                                          <CheckCircle2 className="h-3 w-3" />
                                          Done
                                        </span>
                                      ) : (
                                        <span className="text-xs text-muted-foreground font-mono">
                                          {hp.completed.toLocaleString()} / {hp.total.toLocaleString()} devices
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Firmware Analysis ────────────────────────────────── */}
      <AnimatePresence>
        {namespaceSvcs.some(s => s.name === 'Firmware Analysis' && s.status !== 'Disabled') && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold tracking-tight">Firmware Analysis</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{firmwareImages.length} images</span>
              </div>
            </div>
            <div className="rounded-lg border shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Firmware Image</TableHead>
                    <TableHead>Manufacturer</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Vulnerabilities</TableHead>
                    <TableHead>Devices Affected</TableHead>
                    <TableHead className="w-[100px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {firmwareImages.map((fw) => {
                    const totalCves = fw.cves.critical + fw.cves.high + fw.cves.medium + fw.cves.low
                    return (
                      <TableRow key={fw.file}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{fw.file}</TableCell>
                        <TableCell className="text-sm">{fw.manufacturer}</TableCell>
                        <TableCell className="text-sm">{fw.model}</TableCell>
                        <TableCell className="font-mono text-xs">{fw.version}</TableCell>
                        <TableCell>
                          {totalCves === 0 ? (
                            <span className="text-xs text-emerald-600 font-medium">Clean</span>
                          ) : (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {fw.cves.critical > 0 && (
                                <span className="relative inline-flex items-center">
                                  <span className="absolute inset-0 rounded-md bg-red-500 animate-ping opacity-75" />
                                  <span className="relative inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold bg-red-600 text-white">
                                    {fw.cves.critical} Critical
                                  </span>
                                </span>
                              )}
                              {fw.cves.high > 0 && (
                                <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold bg-orange-500 text-white">
                                  {fw.cves.high} High
                                </span>
                              )}
                              {fw.cves.medium > 0 && (
                                <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-amber-100 text-amber-700 border border-amber-200">
                                  {fw.cves.medium} Medium
                                </span>
                              )}
                              {fw.cves.low > 0 && (
                                <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                  {fw.cves.low} Low
                                </span>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{fw.devicesAffected.toLocaleString()}</TableCell>
                        <TableCell>
                          <button
                            className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                            onClick={() => {}}
                          >
                            <FileText className="h-3 w-3" />
                            Report
                            <ExternalLink className="h-2.5 w-2.5" />
                          </button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── New Job Wizard ───────────────────────────────────── */}
      <AnimatePresence>
        {showNewJobWizard && (
          <NewJobWizard
            linkedHubs={linkedHubs}
            aioInstances={aioInstances}
            totalAssets={namespace.totalAssets}
            existingJobs={initialJobs}
            deviceUpdateEnabled={namespaceSvcs.find(s => s.name === 'Device Update')?.status === 'Healthy'}
            onClose={() => setShowNewJobWizard(false)}
            onCreate={(job: CreatedJob) => {
              setJobs((prev) => [job, ...prev])
              setExpandedJobId(job.id)
              setShowNewJobWizard(false)
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Service Config Dialog ────────────────────────────── */}
      {svcConfigTarget && createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSvcConfigTarget(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm rounded-xl border bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h3 className="text-base font-semibold">Configure {svcConfigTarget.name}</h3>
                <p className="text-sm text-muted-foreground">Manage service availability</p>
              </div>
              <button
                onClick={() => setSvcConfigTarget(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">Service Status</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {svcConfigTarget.status === 'Disabled'
                      ? 'This service is currently disabled for the namespace.'
                      : svcConfigTarget.status === 'Enabling'
                      ? 'This service is being enabled…'
                      : 'This service is active and healthy.'}
                  </p>
                  {svcConfigTarget.instanceName && svcConfigTarget.status !== 'Disabled' && (
                    <p className="text-xs font-mono text-muted-foreground mt-1">{svcConfigTarget.instanceName}</p>
                  )}
                </div>
                <StatusBadge status={svcConfigTarget.status} />
              </div>
              {svcConfigTarget.status === 'Enabling' ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enabling service…
                </div>
              ) : svcConfigTarget.status === 'Disabled' ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Instance Name</label>
                    <select
                      value={enableInstanceName}
                      onChange={(e) => setEnableInstanceName(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono"
                    >
                      {(INSTANCE_NAME_OPTIONS[svcConfigTarget.name] ?? []).map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <Button
                    className="w-full gap-2"
                    disabled={!enableInstanceName}
                    onClick={() => {
                      const name = svcConfigTarget.name
                      const inst = enableInstanceName
                      setNamespaceSvcs(prev => prev.map(s => s.name === name ? { ...s, status: 'Enabling', instanceName: inst } : s))
                      setSvcConfigTarget(prev => prev ? { ...prev, status: 'Enabling', instanceName: inst } : null)
                      setTimeout(() => {
                        setNamespaceSvcs(prev => prev.map(s => s.name === name ? { ...s, status: 'Healthy' } : s))
                        setSvcConfigTarget(prev => prev && prev.name === name ? { ...prev, status: 'Healthy' } : prev)
                      }, 3_000)
                    }}
                  >
                    <Activity className="h-4 w-4" />
                    Enable {svcConfigTarget.name}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label
                      className="text-xs font-medium text-foreground cursor-pointer hover:text-blue-600 transition-colors inline-flex items-center gap-1 group"
                      onClick={() => setDisableConfirmText('disable')}
                      title="Click to fill"
                    >
                      Type <span className="font-mono text-red-600">disable</span> to confirm
                      <span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-500 transition-opacity">← click to fill</span>
                    </label>
                    <Input
                      value={disableConfirmText}
                      onChange={(e) => setDisableConfirmText(e.target.value)}
                      placeholder="disable"
                      className="h-8 text-sm font-mono"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && disableConfirmText === 'disable') {
                          const name = svcConfigTarget.name
                          setNamespaceSvcs(prev => prev.map(s => s.name === name ? { ...s, status: 'Disabled', instanceName: undefined } : s))
                          setSvcConfigTarget(prev => prev ? { ...prev, status: 'Disabled', instanceName: undefined } : null)
                          setDisableConfirmText('')
                        }
                      }}
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    disabled={disableConfirmText !== 'disable'}
                    onClick={() => {
                      const name = svcConfigTarget.name
                      setNamespaceSvcs(prev => prev.map(s => s.name === name ? { ...s, status: 'Disabled', instanceName: undefined } : s))
                      setSvcConfigTarget(prev => prev ? { ...prev, status: 'Disabled', instanceName: undefined } : null)
                      setDisableConfirmText('')
                    }}
                  >
                    Disable {svcConfigTarget.name}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>,
        document.body
      )}

      {/* ── Add Service Dialog ───────────────────────────────── */}
      {showAddService && createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowAddService(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm rounded-xl border bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h3 className="text-base font-semibold">Add Service</h3>
                <p className="text-sm text-muted-foreground">Add a new service to this namespace</p>
              </div>
              <button
                onClick={() => setShowAddService(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-2">
              {addableServices
                .filter(as => !namespaceSvcs.some(s => s.name === as.name))
                .map(svc => (
                  <button
                    key={svc.name}
                    onClick={() => {
                      setNamespaceSvcs(prev => [...prev, { ...svc, status: 'Disabled' }])
                      setShowAddService(false)
                    }}
                    className="flex w-full items-center gap-3 rounded-lg border p-3 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <svc.icon className="h-4 w-4 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{svc.name}</p>
                      <p className="text-xs text-muted-foreground">{svc.description}</p>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              {addableServices.filter(as => !namespaceSvcs.some(s => s.name === as.name)).length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">All available services have been added.</p>
              )}
            </div>
          </motion.div>
        </motion.div>,
        document.body
      )}
      </div>
    </motion.div>
  )
}

/* ─── Left Menu ─────────────────────────────────────────────── */

const LEFT_MENU_SECTIONS = [
  {
    title: 'ADR Resources',
    items: [
      { id: 'assets', label: 'Assets', icon: Cpu },
      { id: 'devices', label: 'Devices', icon: Radio },
      { id: 'credentials', label: 'Credentials', icon: KeyRound },
      { id: 'policies', label: 'Policies', icon: FileText },
    ],
  },
  {
    title: 'Capabilities',
    items: [
      { id: 'provisioning', label: 'Provisioning', icon: Upload },
      { id: 'cert-mgmt', label: 'Certificate Management', icon: KeyRound },
      { id: 'groups', label: 'Groups', icon: Users },
      { id: 'jobs', label: 'Jobs', icon: Activity },
      { id: 'device-update', label: 'Device Update', icon: RefreshCw },
      { id: 'firmware', label: 'Firmware Analysis', icon: Shield },
      { id: '3p', label: '3P Capability', icon: Puzzle },
    ],
  },
  {
    title: 'Linked Instances',
    items: [
      { id: 'iot-hub', label: 'IoT Hub', icon: Server },
      { id: 'iot-ops', label: 'IoT Operations', icon: Wind },
    ],
  },
]

function LeftMenu({
  open,
  onToggle,
  activeItem,
  onItemClick,
}: {
  open: boolean
  onToggle: () => void
  activeItem: string
  onItemClick: (id: string) => void
}) {
  return (
    <motion.div
      animate={{ width: open ? 204 : 40 }}
      initial={false}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="shrink-0 overflow-hidden border-r border-slate-100"
    >
      {/* Toggle button */}
      <div className={`flex items-center border-b border-slate-100 py-2 ${open ? 'justify-end px-2' : 'justify-center'}`}>
        <button
          onClick={onToggle}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          title={open ? 'Collapse menu' : 'Expand menu'}
        >
          <ChevronLeft className={`h-4 w-4 transition-transform duration-200 ${open ? '' : 'rotate-180'}`} />
        </button>
      </div>

      {/* Menu sections */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="py-3"
          >
            {LEFT_MENU_SECTIONS.map((section, si) => (
              <div key={section.title} className={si > 0 ? 'mt-3 pt-3 border-t border-slate-100' : ''}>
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 whitespace-nowrap">
                  {section.title}
                </p>
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onItemClick(activeItem === item.id ? '' : item.id)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors whitespace-nowrap ${
                      activeItem === item.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-slate-600 hover:bg-muted/50 hover:text-foreground'
                    }`}
                  >
                    <item.icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ─── Sub-components ────────────────────────────────────────── */

function HeroStat({ icon: Icon, label, value }: { icon: typeof Radio; label: React.ReactNode; value: string }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-5 w-5 text-foreground" />
        </div>
        <div>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function SectionHeading({ title, count }: { title: React.ReactNode; count?: number }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {count !== undefined && (
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {count}
        </span>
      )}
    </div>
  )
}

function CollapsibleHeading({
  title,
  count,
  open,
  onToggle,
  action,
  summaryStatus,
}: {
  title: React.ReactNode
  count?: number
  open: boolean
  onToggle: () => void
  action?: React.ReactNode
  summaryStatus?: React.ReactNode
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 rounded-lg -ml-1.5 px-1.5 py-1 hover:bg-muted/50 transition-colors"
      >
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
            open ? '' : '-rotate-90'
          }`}
        />
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {count !== undefined && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {count}
          </span>
        )}
        {!open && summaryStatus && (
          <span className="ml-1">{summaryStatus}</span>
        )}
      </button>
      {action}
    </div>
  )
}

const statusToColor: Record<string, string> = {
  Healthy: 'bg-emerald-500',
  Running: 'bg-emerald-500',
  Active: 'bg-emerald-500',
  Adding: 'bg-blue-500 animate-pulse',
  Warning: 'bg-amber-500',
  Degraded: 'bg-amber-500',
  Error: 'bg-red-500',
  Critical: 'bg-red-500',
  Inactive: 'bg-gray-400',
}

function SummaryStatusDots({ statuses }: { statuses: string[] }) {
  return (
    <span className="inline-flex items-center gap-1">
      {statuses.map((status, i) => (
        <span
          key={i}
          title={status}
          className={`h-2 w-2 rounded-full ${statusToColor[status] || 'bg-gray-400'}`}
        />
      ))}
    </span>
  )
}
