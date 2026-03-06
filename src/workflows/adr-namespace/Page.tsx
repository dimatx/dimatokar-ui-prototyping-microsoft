import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation, useNavigationType } from 'react-router-dom'
import {
  Server,
  Cpu,
  Drill,
  RefreshCw,
  KeyRound,
  Upload,
  Activity,
  MapPin,
  Loader2,
  Plus,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Wind,
  X,
  Search,
  Shield,
  Puzzle,
  FileText,
  ExternalLink,
  Users,
  LayoutDashboard,
  Layers,
  Play,
  Zap,
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
import { NewJobWizard, type CreatedJob, type JobPrefill } from './NewJobWizard'
import { JobListEmbedded } from '@/workflows/job-list/Page'
import JobDetailPage from '@/workflows/job-detail/Page'

import {
  namespace,
  type NamespaceService,
  INSTANCE_NAME_OPTIONS,
  initialServices,
  addableServices,
  type Hub,
  initialHubs,
  availableHubs,
  aioInstances,
  mockAssets,
  mockDevices,
  mockGroups,
  initialJobs,
  deviceHealthData,
  assetHealthData,
  dashJobStatusData,
  dashJobTypeData,
  dashGroupsData,
  deviceFirmwareVersions,
} from './mockData'
import { ChartCard, DonutChart, HBarChart } from './ChartHelpers'
import { HeroStat, SectionHeading, CollapsibleHeading, SummaryStatusDots, PlaceholderView } from './SharedComponents'
import { ProvisioningView, CertMgmtView, CredentialsPageView, PoliciesPageView, ThirdPartyView } from './CapabilityViews'
import { GroupsView } from './GroupsView'
import { AllResourcesView } from './AllResourcesView'
import { AssetsView } from './AssetsView'
import { DevicesView } from './DevicesView'
import { IotHubView, IotOpsView } from './IotViews'
import { FirmwareDetailView, FirmwareAnalysisView, OtaManagementView } from './FirmwareViews'
import { AssetDetailView, DeviceDetailView } from './DetailViews'
import { NamespaceHealthView } from './HealthView'

export type { Hub } from './mockData'
/* ─── URL mapping ────────────────────────────────────────────── */

const ID_TO_SEGMENT: Record<string, string> = {
  '':               '',
  'health':         'health',
  'all-resources':  'all-resources',
  'assets':         'assets',
  'devices':        'devices',
  'credentials':    'credentials',
  'policies':       'policies',
  'provisioning':   'provisioning',
  'cert-mgmt':      'cert-mgmt',
  'groups':         'groups',
  'jobs':           'jobs',
  'device-update':  'device-update',
  'firmware':       'firmware',
  'ota-management': 'ota-management',
  'iot-hub':        'iot-hubs',
  'iot-ops':        'iot-ops',
  '3p':             '3p',
}
const SEGMENT_TO_ID: Record<string, string> = Object.fromEntries(
  Object.entries(ID_TO_SEGMENT).map(([k, v]) => [v || k, k])
)

function parseMenuFromPath(pathname: string): string {
  const sub = pathname.replace(/^\/adr-namespace\/?/, '')
  const seg = sub.split('/')[0]
  return SEGMENT_TO_ID[seg] ?? ''
}

function parseFirmwareFromPath(pathname: string): string | null {
  const parts = pathname.replace(/^\/adr-namespace\/?/, '').split('/')
  if (parts[0] === 'firmware' && parts[1]) {
    return parts[1].startsWith('v') ? parts[1].slice(1) : parts[1]
  }
  return null
}

/* ─── Navigation State ──────────────────────────────────────── */

const SECTION_LABELS: Record<string, string> = {
  '':               'Dashboard',
  'health':         'Health',
  'all-resources':  'All Resources',
  'assets':         'Assets',
  'devices':        'Devices',
  'credentials':    'Credentials',
  'policies':       'Policies',
  'provisioning':   'Provisioning',
  'cert-mgmt':      'Certificate Management',
  'ota-management': 'Firmware Management',
  'groups':         'Groups',
  'jobs':           'Jobs',
  'iot-hub':        'IoT Hubs',
  'iot-ops':        'IoT Operations',
  'firmware':       'Firmware Analysis',
  'device-update':  'Device Update',
  '3p':             '3P Capability',
}

type NavState = {
  menuItem: string
  firmwareTarget: string | null
  devicePrefilter: string
  deviceFirmwarePrefilter: string
  assetPrefilter: string
  deviceGroupPrefilter: string
  assetDetailId: string | null
  deviceDetailId: string | null
}

/* ─── Page ────────────────────────────────────────────────────── */

export default function AdrNamespacePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const navType = useNavigationType()
  const [hubsOpen, setHubsOpen] = useState(true)
  const [aioOpen, setAioOpen] = useState(true)
  const [linkedHubs, setLinkedHubs] = useState<Hub[]>(initialHubs)
  const [showHubPicker, setShowHubPicker] = useState(false)
  const [hubSearch, setHubSearch] = useState('')
  const [hubSearchResults, setHubSearchResults] = useState<Hub[]>([])
  const [hubSearching, setHubSearching] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [hubToConfirm, setHubToConfirm] = useState<Hub | null>(null)
  const [hubConfirmText, setHubConfirmText] = useState('')
  const [jobs, setJobs] = useState<CreatedJob[]>(initialJobs)
  const [runJobTarget, setRunJobTarget] = useState<{ ids: string[]; names: Record<string, string>; source: 'Devices' | 'Assets' } | null>(null)
  const [jobPrefill, setJobPrefill] = useState<JobPrefill | null>(null)
  const [pendingOtaUpload, setPendingOtaUpload] = useState(false)
  const [cveDismissed, setCveDismissed] = useState(false)

  // Services state
  const [namespaceSvcs, setNamespaceSvcs] = useState<NamespaceService[]>(initialServices)
  const deviceUpdateEnabled = namespaceSvcs.some(s => s.name === 'Device Update' && s.status === 'Healthy')
  const [svcConfigTarget, setSvcConfigTarget] = useState<NamespaceService | null>(null)
  const [disableConfirmText, setDisableConfirmText] = useState('')
  const [showAddService, setShowAddService] = useState(false)
  const [enableInstanceName, setEnableInstanceName] = useState<string>('')
  const [leftMenuOpen, setLeftMenuOpen] = useState(true)
  const [activeMenuItem, setActiveMenuItem] = useState<string>(() => parseMenuFromPath(location.pathname))
  const [firmwareTarget, setFirmwareTarget] = useState<string | null>(() => parseFirmwareFromPath(location.pathname))
  const [devicePrefilter, setDevicePrefilter] = useState<string>('')
  const [deviceFirmwarePrefilter, setDeviceFirmwarePrefilter] = useState<string>('')
  const [assetPrefilter, setAssetPrefilter] = useState<string>('')
  const [deviceGroupPrefilter, setDeviceGroupPrefilter] = useState<string>('')
  const [assetDetailId, setAssetDetailId] = useState<string | null>(() => {
    const p = new URLSearchParams(location.search)
    return p.get('asset')
  })
  const [deviceDetailId, setDeviceDetailId] = useState<string | null>(() => {
    const p = new URLSearchParams(location.search)
    return p.get('device')
  })

  const navigateTo = (id: string, opts?: { firmware?: string; deviceFilter?: string; firmwareVersionFilter?: string; assetFilter?: string; groupFilter?: string }) => {
    const newFirmware = opts?.firmware ?? null
    const newDevicePre = opts?.deviceFilter ?? ''
    const newFwPre = opts?.firmwareVersionFilter ?? ''
    const newAssetPre = opts?.assetFilter ?? ''
    const newGroupPre = opts?.groupFilter ?? ''
    const state: NavState = {
      menuItem: id,
      firmwareTarget: newFirmware,
      devicePrefilter: newDevicePre,
      deviceFirmwarePrefilter: newFwPre,
      assetPrefilter: newAssetPre,
      deviceGroupPrefilter: newGroupPre,
      assetDetailId: null,
      deviceDetailId: null,
    }
    setActiveMenuItem(id)
    setFirmwareTarget(newFirmware)
    setDevicePrefilter(newDevicePre)
    setDeviceFirmwarePrefilter(newFwPre)
    setAssetPrefilter(newAssetPre)
    setDeviceGroupPrefilter(newGroupPre)
    setAssetDetailId(null)
    setDeviceDetailId(null)
    const seg = ID_TO_SEGMENT[id] ?? id
    navigate(`/adr-namespace${seg ? '/' + seg : ''}`, { state })
  }

  const navigateToDetail = (kind: 'asset' | 'device', id: string) => {
    const state: NavState = {
      menuItem: activeMenuItem,
      firmwareTarget,
      devicePrefilter,
      deviceFirmwarePrefilter,
      assetPrefilter,
      deviceGroupPrefilter,
      assetDetailId: kind === 'asset' ? id : null,
      deviceDetailId: kind === 'device' ? id : null,
    }
    if (kind === 'asset') setAssetDetailId(id)
    else setDeviceDetailId(id)
    const seg = ID_TO_SEGMENT[activeMenuItem] ?? activeMenuItem
    const base = `/adr-namespace${seg ? '/' + seg : ''}`
    const param = kind === 'asset' ? `asset=${encodeURIComponent(id)}` : `device=${encodeURIComponent(id)}`
    navigate(`${base}?${param}`, { state })
  }

  // Restore full navigation state when user navigates back/forward
  useEffect(() => {
    if (navType !== 'POP') return
    const st = location.state as NavState | null
    const p = new URLSearchParams(location.search)
    const urlAsset = p.get('asset')
    const urlDevice = p.get('device')
    if (!st) {
      setActiveMenuItem(parseMenuFromPath(location.pathname))
      setFirmwareTarget(parseFirmwareFromPath(location.pathname))
      setDevicePrefilter('')
      setDeviceFirmwarePrefilter('')
      setAssetPrefilter('')
      setDeviceGroupPrefilter('')
      setAssetDetailId(urlAsset)
      setDeviceDetailId(urlDevice)
      return
    }
    setActiveMenuItem(st.menuItem)
    setFirmwareTarget(st.firmwareTarget)
    setDevicePrefilter(st.devicePrefilter)
    setDeviceFirmwarePrefilter(st.deviceFirmwarePrefilter)
    setAssetPrefilter(st.assetPrefilter)
    setDeviceGroupPrefilter(st.deviceGroupPrefilter)
    setAssetDetailId(st.assetDetailId ?? urlAsset)
    setDeviceDetailId(st.deviceDetailId ?? urlDevice)
  }, [location, navType])

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
    <>
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
        onItemClick={(id) => navigateTo(id)}
      />
      <div className="flex-1 min-w-0 pl-6">
      {/* ── Breadcrumb ─────────────────────────────────────── */}
      {(() => {
        const isJobDetail = activeMenuItem === 'jobs' && location.pathname.includes('/jobs/job-detail')
        const isFwDetail  = activeMenuItem === 'firmware' && !!firmwareTarget
        const childLabel =
          assetDetailId  ? (mockAssets.find(a => a.id === assetDetailId)?.name  ?? assetDetailId)
          : deviceDetailId ? (mockDevices.find(d => d.id === deviceDetailId)?.name ?? deviceDetailId)
          : isFwDetail   ? `v${firmwareTarget}`
          : isJobDetail  ? 'Job Detail'
          : null
        if (!childLabel) return null
        const parentLabel = SECTION_LABELS[activeMenuItem] ?? activeMenuItem
        return (
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5 mt-0.5">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-slate-100 hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-3 w-3" />
              {parentLabel}
            </button>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <span className="text-slate-700 font-medium truncate max-w-xs">{childLabel}</span>
          </nav>
        )
      })()}
      <AnimatePresence mode="wait">
      {activeMenuItem === 'all-resources' && assetDetailId ? (
        <AssetDetailView
          key={`ar-asset-detail-${assetDetailId}`}
          assetId={assetDetailId}
          onBack={() => navigate(-1)}
          onFirmwareSelect={(v) => navigateTo('firmware', { firmware: v })}
          onRunJob={(ids, names) => setRunJobTarget({ ids, names, source: 'Assets' })}
          onUpdateFirmware={(pf) => setJobPrefill(pf)}
        />
      ) : activeMenuItem === 'all-resources' && deviceDetailId ? (
        <DeviceDetailView
          key={`ar-device-detail-${deviceDetailId}`}
          deviceId={deviceDetailId}
          onBack={() => navigate(-1)}
          onFirmwareSelect={(v) => { if (v === 'ota-management-upload') { setPendingOtaUpload(true); navigateTo('ota-management') } else if (v === 'ota-management') { navigateTo('ota-management') } else { navigateTo('firmware', { firmware: v }) } }}
          onRunJob={(ids, names) => setRunJobTarget({ ids, names, source: 'Devices' })}
          onUpdateFirmware={(pf) => setJobPrefill(pf)}
        />
      ) : activeMenuItem === 'all-resources' ? (
        <AllResourcesView
          key="all-resources"
          onAssetSelect={(id) => navigateToDetail('asset', id)}
          onDeviceSelect={(id) => navigateToDetail('device', id)}
        />
      ) : activeMenuItem === 'assets' && assetDetailId ? (
        <AssetDetailView
          key={`asset-detail-${assetDetailId}`}
          assetId={assetDetailId}
          onBack={() => navigate(-1)}
          onFirmwareSelect={(v) => navigateTo('firmware', { firmware: v })}
          onRunJob={(ids, names) => setRunJobTarget({ ids, names, source: 'Assets' })}
          onUpdateFirmware={(pf) => setJobPrefill(pf)}
        />
      ) : activeMenuItem === 'assets' ? (
        <AssetsView key={`assets-${assetPrefilter}`} initialSearch={assetPrefilter} onRunJob={(ids, names) => setRunJobTarget({ ids, names, source: 'Assets' })} onAssetSelect={(id) => navigateToDetail('asset', id)} onUpdateFirmware={(pf) => setJobPrefill(pf)} />
      ) : activeMenuItem === 'devices' && deviceDetailId ? (
        <DeviceDetailView
          key={`device-detail-${deviceDetailId}`}
          deviceId={deviceDetailId}
          onBack={() => navigate(-1)}
          onFirmwareSelect={(v) => { if (v === 'ota-management-upload') { setPendingOtaUpload(true); navigateTo('ota-management') } else if (v === 'ota-management') { navigateTo('ota-management') } else { navigateTo('firmware', { firmware: v }) } }}
          onRunJob={(ids, names) => setRunJobTarget({ ids, names, source: 'Devices' })}
          onUpdateFirmware={(pf) => setJobPrefill(pf)}
        />
      ) : activeMenuItem === 'devices' ? (
        <DevicesView
          key={`devices-${devicePrefilter}-${deviceFirmwarePrefilter}-${deviceGroupPrefilter}`}
          initialSearch={devicePrefilter}
          initialFirmwareFilter={deviceFirmwarePrefilter}
          initialGroupFilter={deviceGroupPrefilter}
          onFirmwareSelect={(v) => navigateTo('firmware', { firmware: v })}
          onRunJob={(ids, names) => setRunJobTarget({ ids, names, source: 'Devices' })}
          onDeviceSelect={(id) => navigateToDetail('device', id)}
          onClearGroupFilter={() => navigate(-1)}
          onUpdateFirmware={(pf) => setJobPrefill(pf)}
        />
      ) : activeMenuItem === 'health' ? (
        <NamespaceHealthView
          key="health"
          onViewAsset={(id) => navigateToDetail('asset', id)}
          onViewDevice={(id) => navigateToDetail('device', id)}
        />
      ) : activeMenuItem === 'iot-hub' ? (
        <IotHubView key="iot-hub" hubs={linkedHubs} onAddHub={() => setShowHubPicker(true)} unlinkedCount={unlinkedHubs.length} />
      ) : activeMenuItem === 'iot-ops' ? (
        <IotOpsView key="iot-ops" />
      ) : activeMenuItem === 'ota-management' ? (
        <OtaManagementView
          key="ota-management"
          autoOpenUpload={pendingOtaUpload}
          onAutoOpenConsumed={() => setPendingOtaUpload(false)}
          onFirmwareSelect={(v) => navigateTo('firmware', { firmware: v })}
          onDeploy={(prefill) => setJobPrefill(prefill)}
        />
      ) : activeMenuItem === 'firmware' && firmwareTarget ? (
        <FirmwareDetailView
          key={`fw-${firmwareTarget}`}
          version={firmwareTarget}
          onBack={() => navigate(-1)}
          onDevicesClick={(v, mfr) => navigateTo('devices', { firmwareVersionFilter: `v${v}`, deviceFilter: mfr })}
          onAssetsClick={(mfr) => navigateTo('assets', { assetFilter: mfr })}
        />
      ) : activeMenuItem === 'firmware' ? (
        <FirmwareAnalysisView
          key="firmware"
          onFirmwareSelect={(v) => { setFirmwareTarget(v); navigate(`/adr-namespace/firmware/${v}`) }}
          onVersionClick={(v) => navigateTo('devices', { firmwareVersionFilter: v })}
          onManufacturerClick={(m) => navigateTo('devices', { deviceFilter: m })}
          onModelClick={(m) => navigateTo('devices', { deviceFilter: m })}
        />
      ) : activeMenuItem === 'jobs' && location.pathname.includes('/jobs/job-detail') ? (
        <JobDetailPage key="job-detail" hideBreadcrumb />
      ) : activeMenuItem === 'jobs' ? (
        <JobListEmbedded key="jobs" deviceUpdateEnabled={deviceUpdateEnabled} onNavigate={(path) => {
          if (path.startsWith('/job-detail')) {
            navigate(`/adr-namespace/jobs${path}&from=/adr-namespace/jobs`)
          } else {
            navigate(path)
          }
        }} />
      ) : activeMenuItem === 'credentials' ? (
        <CredentialsPageView key="credentials" />
      ) : activeMenuItem === 'policies' ? (
        <PoliciesPageView key="policies" />
      ) : activeMenuItem === 'provisioning' ? (() => {
        const svc = namespaceSvcs.find(s => s.name === 'Provisioning')!
        return <ProvisioningView key="provisioning" svc={svc} onConfigure={() => { setSvcConfigTarget(svc); setDisableConfirmText(''); setEnableInstanceName(INSTANCE_NAME_OPTIONS[svc.name]?.[0] ?? '') }} />
      })() : activeMenuItem === 'cert-mgmt' ? (() => {
        const svc = namespaceSvcs.find(s => s.name === 'Certificate Management')!
        return <CertMgmtView key="cert-mgmt" svc={svc} onConfigure={() => { setSvcConfigTarget(svc); setDisableConfirmText(''); setEnableInstanceName(INSTANCE_NAME_OPTIONS[svc.name]?.[0] ?? '') }} onNavigate={(id) => navigateTo(id)} />
      })() : activeMenuItem === 'groups' ? (
        <GroupsView key="groups" onGroupSelect={(id) => {
          const grp = mockGroups.find(g => g.id === id)
          if (!grp) return
          if (grp.memberKind === 'assets') {
            navigateTo('assets', { assetFilter: grp.criteria?.manufacturer ?? grp.criteria?.type ?? '' })
          } else {
            navigateTo('devices', { groupFilter: id })
          }
        }} />
      ) : activeMenuItem === 'device-update' ? (() => {
        const svc = namespaceSvcs.find(s => s.name === 'Device Update')!
        const isDisabled = svc.status === 'Disabled' || svc.status === 'Enabling'
        return (
          <PlaceholderView key="device-update" title="Device Update" description="Manage over-the-air (OTA) firmware and software update deployments across device groups. Powered by Azure Device Update for IoT Hub." icon={RefreshCw}
            action={
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-6 py-3 shadow-sm">
                  <span className="text-sm text-slate-600 font-medium">Status</span>
                  <StatusBadge status={svc.status} />
                  {svc.instanceName && <span className="font-mono text-xs text-slate-400">{svc.instanceName}</span>}
                </div>
                {svc.status === 'Enabling' ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />Enabling…
                  </div>
                ) : svc.status === 'Disabled' ? (
                  <Button className="gap-2" onClick={() => { setSvcConfigTarget(svc); setDisableConfirmText(''); setEnableInstanceName(INSTANCE_NAME_OPTIONS[svc.name]?.[0] ?? '') }}>
                    <Activity className="h-4 w-4" />Enable Device Update
                  </Button>
                ) : (
                  <Button variant="outline" className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => { setSvcConfigTarget(svc); setDisableConfirmText('') }}>
                    Disable Device Update
                  </Button>
                )}
              </div>
            }
          />
        )
      })() : activeMenuItem === '3p' ? (() => {
        const svc = [...namespaceSvcs, ...addableServices].find(s => s.name === 'Future 3P Integration')
        return <ThirdPartyView key="3p" svc={svc} onConfigure={() => { if (svc) { setSvcConfigTarget(svc); setDisableConfirmText(''); setEnableInstanceName(INSTANCE_NAME_OPTIONS[svc.name]?.[0] ?? '') } }} />
      })() : (
      <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-8">
      {/* ── Header / Hero ────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Azure Device Registry</p>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Wind className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{namespace.name}</h1>
              <p className="text-sm text-muted-foreground">Namespace</p>
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

      {/* ── CVE Alert Banner ─────────────────────────────────── */}
      <AnimatePresence>
        {location.pathname.includes('new-cve') && !cveDismissed && (
          <motion.div
            key="cve-alert"
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3.5 flex items-start gap-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-red-100">
                <Shield className="h-4 w-4 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-red-900">New vulnerability detected</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-200 text-red-800 border border-red-300">HIGH</span>
                  <a
                    href="https://nvd.nist.gov/vuln/detail/CVE-2014-0160"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-red-700 hover:text-red-900 hover:underline transition-colors"
                  >
                    CVE-2014-0160
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <p className="mt-1 text-sm text-red-800">
                  <span className="font-semibold">OpenSSL Information Disclosure Vulnerability</span> (Heartbleed) was identified in firmware&nbsp;
                  <span className="font-mono font-semibold">v3.1.0</span>.
                  &nbsp;<span className="font-semibold">6,203 devices</span> are affected. Deploy updated firmware to mitigate.
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    onClick={() => setJobPrefill({ jobType: 'software-update', jobName: 'CVE-2014-0160 Mitigation – v3.1.0 → v3.2.1', jobDescription: 'Deploy firmware v3.2.1 to all devices running v3.1.0 to mitigate CVE-2014-0160 (OpenSSL Heartbleed).', targetMode: 'custom', targetCondition: "firmware = '3.1.0'", prefillEstimateDevices: 6203, priority: '5' })}
                    className="inline-flex items-center gap-1.5 rounded-md bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800 transition-colors"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Remediate via OTA → v3.2.1
                  </button>
                  <button
                    onClick={() => { navigateTo('firmware', { firmware: '3.1.0' }) }}
                    className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    More details
                  </button>
                </div>
              </div>
              <button
                onClick={() => setCveDismissed(true)}
                className="mt-0.5 shrink-0 rounded p-1 text-red-400 hover:text-red-700 hover:bg-red-100 transition-colors"
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero Metrics ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <HeroStat icon={Cpu} label="Devices" value={namespace.totalDevices.toLocaleString()} />
        <HeroStat icon={Drill} label="Assets" value={namespace.totalAssets.toLocaleString()} />
        <HeroStat icon={Server} label="IoT Hubs" value={linkedHubs.length.toString()} />
        <HeroStat icon={Activity} label={<><span className="whitespace-nowrap">IoT&nbsp;Operations</span> Instances</>} value={aioInstances.length.toString()} />
      </div>

      {/* ── Health + Activity Charts ───────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <ChartCard title="Device Health">
          <DonutChart segments={deviceHealthData} centerLabel="Healthy" />
        </ChartCard>
        <ChartCard title="Asset Health">
          <DonutChart segments={assetHealthData} centerLabel="Available" />
        </ChartCard>
        <ChartCard title="Jobs by Status">
          <DonutChart segments={dashJobStatusData} centerLabel="Jobs" legendBelow />
        </ChartCard>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <ChartCard title="Firmware Versions – Devices">
          <HBarChart data={deviceFirmwareVersions} />
        </ChartCard>
        <ChartCard title="Groups by Type">
          <HBarChart data={dashGroupsData} />
        </ChartCard>
        <ChartCard title="Jobs by Type">
          <HBarChart data={dashJobTypeData} />
        </ChartCard>
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
                navigateTo('iot-hub')
              }}
            >
              <Server className="h-3.5 w-3.5" />
              Manage Hubs
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

      </div>

      {/* ── IoT Operations Instances (collapsible) ───────────── */}
      <div>
        <CollapsibleHeading
          title={<><span className="whitespace-nowrap">IoT&nbsp;Operations</span> Instances</>}
          count={aioInstances.length}
          open={aioOpen}
          onToggle={() => setAioOpen((v) => !v)}
          summaryStatus={<SummaryStatusDots statuses={aioInstances.map((i) => i.status)} />}
          action={
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs relative"
              onClick={(e) => { e.stopPropagation(); navigateTo('iot-ops') }}
            >
              <Wind className="h-3.5 w-3.5" />
              Manage <span className="whitespace-nowrap">IoT&nbsp;Operations</span> Instances
            </Button>
          }
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

      {/* ── Capabilities ─────────────────────────────────────── */}
      <div>
        <SectionHeading title="Capabilities" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {namespaceSvcs.map((svc) => {
            const SVC_NAV_ID: Record<string, string> = {
              'Provisioning': 'provisioning',
              'Certificate Management': 'cert-mgmt',
              'Device Update': 'device-update',
              'IoT Operations': 'iot-ops',
              'Firmware Analysis': 'firmware',
            }
            const navId = SVC_NAV_ID[svc.name]
            return (
            <Card
              key={svc.name}
              className={`shadow-sm relative ${navId ? 'cursor-pointer hover:border-slate-300 hover:shadow-md transition-all' : ''}`}
              onClick={() => { if (navId) navigateTo(navId) }}
            >
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted mt-0.5">
                  <svc.icon className="h-4 w-4 text-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{svc.name}</p>
                  {svc.instanceName && (
                    <p className="text-[11px] font-mono text-muted-foreground mt-0.5 truncate">{svc.instanceName}</p>
                  )}
                  <div className="mt-2">
                    <StatusBadge status={svc.status} />
                  </div>
                </div>
              </CardContent>
            </Card>
            )
          })}
          {/* Add Service card */}
          {addableServices.filter(as => !namespaceSvcs.some(s => s.name === as.name)).length > 0 && (
            <Card
              className="shadow-sm border-dashed cursor-pointer hover:bg-muted/20 transition-colors relative"
              onClick={() => setShowAddService(true)}
            >
              <CardContent className="flex items-center justify-center gap-2 p-4 h-full">
                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Add Service</span>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

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
            className="w-full max-w-sm rounded-lg border bg-white shadow-sm"
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
      </motion.div>
      )}
      </AnimatePresence>
      {/* Hub picker modal — rendered at top level so it works from any view */}
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
              className="w-full max-w-lg rounded-lg border bg-white shadow-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b px-6 py-4">
                <div>
                  <h3 className="text-base font-semibold">Add Existing Hub</h3>
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
      {runJobTarget && createPortal(
        <NewJobWizard
          linkedHubs={linkedHubs}
          aioInstances={[]}
          totalAssets={namespace.totalAssets}
          existingJobs={jobs}
          preselectedDevices={runJobTarget}
          onClose={() => setRunJobTarget(null)}
          onCreate={(job) => { setJobs(prev => [job, ...prev]); setRunJobTarget(null) }}
          deviceUpdateEnabled={deviceUpdateEnabled}
          disabledJobTypes={
            runJobTarget.source === 'Devices' &&
            runJobTarget.ids.every(id => (mockDevices.find(d => d.id === id) as any)?.otaManaged === false)
              ? ['software-update']
              : undefined
          }
        />,
        document.body
      )}
      {jobPrefill && createPortal(
        <NewJobWizard
          linkedHubs={linkedHubs}
          aioInstances={[]}
          totalAssets={namespace.totalAssets}
          existingJobs={jobs}
          prefill={jobPrefill}
          onClose={() => setJobPrefill(null)}
          onCreate={(job) => { setJobs(prev => [job, ...prev]); setJobPrefill(null) }}
          deviceUpdateEnabled={deviceUpdateEnabled}
        />,
        document.body
      )}
      </div>
    </motion.div>

    {/* ── Service Config Dialog (outside motion.div to avoid transform containing block) ── */}
    {svcConfigTarget && (
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
          className="w-full max-w-sm rounded-lg border bg-white shadow-sm"
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
      </motion.div>
    )}
    </>
  )
}

/* ─── Left Menu ─────────────────────────────────────────────── */

const LEFT_MENU_SECTIONS = [
  {
    title: 'Dashboard',
    items: [
      { id: '', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'health', label: 'Health', icon: Activity },
    ],
  },
  {
    title: 'Resources',
    items: [
      { id: 'all-resources', label: 'All', icon: Layers },
      { id: 'assets', label: 'Assets', icon: Drill },
      { id: 'devices', label: 'Devices', icon: Cpu },
      { id: 'credentials', label: 'Credentials', icon: KeyRound },
      { id: 'policies', label: 'Policies', icon: FileText },
    ],
  },
  {
    title: 'Capabilities',
    items: [
      { id: 'provisioning', label: 'Provisioning', icon: Upload },
      { id: 'cert-mgmt', label: 'Certificate Mgmt.', icon: KeyRound },
      { id: 'ota-management', label: 'Firmware Management', icon: Zap },
      { id: 'groups', label: 'Groups', icon: Users },
      { id: 'jobs', label: 'Jobs', icon: Activity },
      { id: '3p', label: '3P Capability', icon: Puzzle, disabled: true },
    ],
  },
  {
    title: 'Linked Instances',
    items: [
      { id: 'iot-hub', label: 'IoT Hub', icon: Server },
      { id: 'iot-ops', label: 'IoT Operations', icon: Wind },
    ],
  },
  {
    title: 'Other',
    collapsible: true,
    defaultCollapsed: true,
    items: [
      { id: 'firmware', label: 'Firmware Analysis', icon: Shield },
      { id: 'device-update', label: 'Device Update', icon: RefreshCw },
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
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    () => new Set((LEFT_MENU_SECTIONS as Array<{ title: string; collapsible?: boolean; defaultCollapsed?: boolean; items: unknown[] }>).filter(s => s.defaultCollapsed).map(s => s.title))
  )
  const { pathname } = useLocation()
  const visibleSections = (LEFT_MENU_SECTIONS as Array<{ title: string; collapsible?: boolean; defaultCollapsed?: boolean; items: { id: string; label: string; icon: typeof Cpu; disabled?: boolean }[] }>).filter(
    s => s.title !== 'Other' || pathname.includes('/other')
  )
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
            {visibleSections.map((section, si) => {
              const isSectionCollapsed = !!(section.collapsible && collapsedSections.has(section.title))
              return (
              <div key={section.title} className={si > 0 ? 'mt-3 pt-3 border-t border-slate-100' : ''}>
                {section.collapsible ? (
                  <button
                    onClick={() => setCollapsedSections(p => { const n = new Set(p); n.has(section.title) ? n.delete(section.title) : n.add(section.title); return n })}
                    className="w-full flex items-center justify-between px-3 py-0.5 mb-1 group"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 whitespace-nowrap group-hover:text-muted-foreground/80 transition-colors">
                      {section.title}
                    </span>
                    <ChevronDown className={`h-3 w-3 text-muted-foreground/40 transition-transform duration-150 ${isSectionCollapsed ? '-rotate-90' : ''}`} />
                  </button>
                ) : (
                  <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 whitespace-nowrap">
                    {section.title}
                  </p>
                )}
                {!isSectionCollapsed && section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => !('disabled' in item && item.disabled) && onItemClick(item.id)}
                    disabled={'disabled' in item && item.disabled}
                    title={'disabled' in item && item.disabled ? 'Coming soon' : undefined}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors whitespace-nowrap ${
                      'disabled' in item && item.disabled
                        ? 'text-slate-300 cursor-not-allowed'
                        : activeItem === item.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-slate-600 hover:bg-muted/50 hover:text-foreground'
                    }`}
                  >
                    <item.icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

