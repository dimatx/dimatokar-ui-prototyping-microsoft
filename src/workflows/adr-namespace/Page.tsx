import { motion, AnimatePresence } from 'framer-motion'
import React, { useState, useEffect, useRef, useMemo } from 'react'
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
  ChevronLeft,
  Wind,
  X,
  Search,
  Settings,
  Shield,
  Puzzle,
  FileText,
  ExternalLink,
  Users,
  LayoutDashboard,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
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
  { name: 'Firmware Analysis', icon: Shield, status: 'Healthy', configurable: true, instanceName: 'fwa-zava-tx-01' },
]

const addableServices: NamespaceService[] = [
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

// Derived chart data from firmwareImages
const fwByManufacturer = [
  { label: 'Contoso Wind Systems', value: 9_050, color: '#3b82f6' },
  { label: 'Zephyr Sensors Inc.', value: 1_412, color: '#3b82f6' },
  { label: 'AeroLogix Systems', value: 1_400, color: '#3b82f6' },
  { label: 'Meridian Edge Tech.', value: 985, color: '#3b82f6' },
]

const fwByModel = [
  { label: 'TurbineController-X700', value: 9_050, color: '#8b5cf6' },
  { label: 'AnemometerPro-2400', value: 1_412, color: '#8b5cf6' },
  { label: 'PitchController-5000', value: 1_400, color: '#8b5cf6' },
  { label: 'EdgeGateway-1900', value: 985, color: '#8b5cf6' },
]

const cveBySeverity = [
  { label: 'Critical', value: 3, color: '#dc2626' },
  { label: 'High', value: 7, color: '#f97316' },
  { label: 'Medium', value: 14, color: '#f59e0b' },
  { label: 'Low', value: 19, color: '#94a3b8' },
]

const cveByName = [
  { cve: 'CVE-2025-2841', severity: 'Critical', devices: 6_203, description: 'Remote code execution via crafted OTA payload' },
  { cve: 'CVE-2024-9901', severity: 'Critical', devices: 985, description: 'Buffer overflow in MQTT client' },
  { cve: 'CVE-2024-4812', severity: 'Critical', devices: 6_203, description: 'Improper cert validation in TLS handshake' },
  { cve: 'CVE-2024-7723', severity: 'High', devices: 9_050, description: 'Heap use-after-free in firmware parser' },
  { cve: 'CVE-2024-5612', severity: 'High', devices: 6_203, description: 'Privilege escalation via /proc traversal' },
  { cve: 'CVE-2024-4401', severity: 'High', devices: 2_847, description: 'Weak RNG used for device key generation' },
  { cve: 'CVE-2025-1099', severity: 'High', devices: 985, description: 'Command injection in diagnostic endpoint' },
  { cve: 'CVE-2024-3301', severity: 'High', devices: 985, description: 'Unauthenticated REST API access' },
  { cve: 'CVE-2024-6612', severity: 'Medium', devices: 9_050, description: 'Cleartext credentials in debug logs' },
  { cve: 'CVE-2024-8831', severity: 'Medium', devices: 6_203, description: 'Missing input validation in config parser' },
  { cve: 'CVE-2024-2201', severity: 'Medium', devices: 1_412, description: 'Side-channel timing vulnerability' },
  { cve: 'CVE-2024-9102', severity: 'Medium', devices: 985, description: 'Path traversal in file upload handler' },
]

const initialJobs = [
  { id: 'JOB-1042', name: 'Firmware update – v3.2.1', type: 'Update', status: 'Running', targets: '2,400 devices', started: '35 min ago' },
  { id: 'JOB-1041', name: 'Certificate renewal – Q1 2026', type: 'Certificate', status: 'Completed', targets: '12,847 devices', started: '2 days ago' },
  { id: 'JOB-1040', name: 'Reboot turbine controllers', type: 'Command', status: 'Completed', targets: '620 devices', started: '5 days ago' },
  { id: 'JOB-1039', name: 'Edge config push – telemetry interval', type: 'Configuration', status: 'Completed', targets: '3,215 assets', started: '1 week ago' },
  { id: 'JOB-1038', name: 'Firmware update – v3.1.0', type: 'Update', status: 'Completed', targets: '8,200 devices', started: '2 weeks ago' },
]

/* ─── Assets Mock Data ───────────────────────────────────────── */

const assetHealthData = [
  { label: 'Available', value: 2_847, color: '#10b981' },
  { label: 'Degraded', value: 198, color: '#f59e0b' },
  { label: 'Unhealthy', value: 91, color: '#ef4444' },
  { label: 'Unknown', value: 79, color: '#94a3b8' },
]

const assetsByManufacturer = [
  { label: 'Contoso Wind Systems', value: 1_420, color: '#3b82f6' },
  { label: 'Zephyr Sensors Inc.', value: 782, color: '#3b82f6' },
  { label: 'Meridian Edge Tech.', value: 541, color: '#3b82f6' },
  { label: 'AeroLogix Systems', value: 320, color: '#3b82f6' },
  { label: 'Others', value: 152, color: '#3b82f6' },
]

const assetsBySite = [
  { label: 'Abilene Wind Farm', value: 1_247, color: '#8b5cf6' },
  { label: 'Midland Wind Farm', value: 892, color: '#8b5cf6' },
  { label: 'Odessa Wind Farm', value: 634, color: '#8b5cf6' },
  { label: 'San Angelo Wind Farm', value: 442, color: '#8b5cf6' },
]

const mockAssets = [
  { id: 'AST-0001', name: 'Turbine Controller #A-001', type: 'Turbine Controller', manufacturer: 'Contoso Wind Systems', site: 'Abilene Wind Farm', status: 'Available', firmware: 'v3.2.1', lastSeen: '1 min ago' },
  { id: 'AST-0002', name: 'Anemometer Sensor #A-014', type: 'Anemometer', manufacturer: 'Zephyr Sensors Inc.', site: 'Abilene Wind Farm', status: 'Available', firmware: 'v2.4.0', lastSeen: '4 min ago' },
  { id: 'AST-0003', name: 'Edge Gateway #AB-03', type: 'Edge Gateway', manufacturer: 'Meridian Edge Tech.', site: 'Abilene Wind Farm', status: 'Available', firmware: 'v1.9.3', lastSeen: '2 min ago' },
  { id: 'AST-0004', name: 'Pitch Controller #A-021', type: 'Pitch Controller', manufacturer: 'AeroLogix Systems', site: 'Abilene Wind Farm', status: 'Degraded', firmware: 'v5.0.2', lastSeen: '12 min ago' },
  { id: 'AST-0005', name: 'Turbine Controller #M-007', type: 'Turbine Controller', manufacturer: 'Contoso Wind Systems', site: 'Midland Wind Farm', status: 'Available', firmware: 'v3.2.1', lastSeen: '2 min ago' },
  { id: 'AST-0006', name: 'Anemometer Sensor #M-023', type: 'Anemometer', manufacturer: 'Zephyr Sensors Inc.', site: 'Midland Wind Farm', status: 'Available', firmware: 'v2.4.0', lastSeen: '7 min ago' },
  { id: 'AST-0007', name: 'Turbine Controller #M-011', type: 'Turbine Controller', manufacturer: 'Contoso Wind Systems', site: 'Midland Wind Farm', status: 'Unhealthy', firmware: 'v3.1.0', lastSeen: '3 hrs ago' },
  { id: 'AST-0008', name: 'Edge Gateway #MB-01', type: 'Edge Gateway', manufacturer: 'Meridian Edge Tech.', site: 'Midland Wind Farm', status: 'Available', firmware: 'v1.9.3', lastSeen: '1 min ago' },
  { id: 'AST-0009', name: 'Turbine Controller #O-003', type: 'Turbine Controller', manufacturer: 'Contoso Wind Systems', site: 'Odessa Wind Farm', status: 'Available', firmware: 'v3.2.1', lastSeen: '3 min ago' },
  { id: 'AST-0010', name: 'Pitch Controller #O-017', type: 'Pitch Controller', manufacturer: 'AeroLogix Systems', site: 'Odessa Wind Farm', status: 'Degraded', firmware: 'v5.0.2', lastSeen: '28 min ago' },
  { id: 'AST-0011', name: 'Anemometer Sensor #O-009', type: 'Anemometer', manufacturer: 'Zephyr Sensors Inc.', site: 'Odessa Wind Farm', status: 'Available', firmware: 'v2.4.0', lastSeen: '5 min ago' },
  { id: 'AST-0012', name: 'Turbine Controller #S-002', type: 'Turbine Controller', manufacturer: 'Contoso Wind Systems', site: 'San Angelo Wind Farm', status: 'Available', firmware: 'v3.2.1', lastSeen: '6 min ago' },
  { id: 'AST-0013', name: 'Edge Gateway #SB-02', type: 'Edge Gateway', manufacturer: 'Meridian Edge Tech.', site: 'San Angelo Wind Farm', status: 'Available', firmware: 'v1.9.3', lastSeen: '2 min ago' },
  { id: 'AST-0014', name: 'Turbine Controller #A-044', type: 'Turbine Controller', manufacturer: 'Contoso Wind Systems', site: 'Abilene Wind Farm', status: 'Available', firmware: 'v3.1.0', lastSeen: '9 min ago' },
  { id: 'AST-0015', name: 'Pitch Controller #M-031', type: 'Pitch Controller', manufacturer: 'AeroLogix Systems', site: 'Midland Wind Farm', status: 'Unknown', firmware: '—', lastSeen: '2 days ago' },
]

/* ─── Devices Mock Data ──────────────────────────────────────── */

const deviceHealthData = [
  { label: 'Healthy', value: 11_423, color: '#10b981' },
  { label: 'Degraded', value: 847, color: '#f59e0b' },
  { label: 'Unhealthy', value: 341, color: '#ef4444' },
  { label: 'Unknown', value: 236, color: '#94a3b8' },
]

const deviceConnectivity = [
  { label: 'Connected', value: 11_912, color: '#3b82f6' },
  { label: 'Disconnected', value: 621, color: '#f59e0b' },
  { label: 'Never Connected', value: 314, color: '#94a3b8' },
]

const deviceFirmwareVersions = [
  { label: 'v3.2.1 (latest)', value: 2_847, color: '#10b981' },
  { label: 'v3.1.0', value: 6_203, color: '#f59e0b' },
  { label: 'v2.4.0', value: 1_412, color: '#3b82f6' },
  { label: 'v1.9.3', value: 985, color: '#f97316' },
  { label: 'Other', value: 1_400, color: '#94a3b8' },
]

const mockDevices = [
  { id: 'DEV-0001', name: 'tx-wind-a001-ctrl', type: 'Turbine Controller', hub: 'hub-tx-wind-01', site: 'Abilene Wind Farm', status: 'Healthy', connectivity: 'Connected', firmware: 'v3.2.1', lastSeen: '1 min ago' },
  { id: 'DEV-0002', name: 'tx-wind-a014-anem', type: 'Anemometer', hub: 'hub-tx-wind-01', site: 'Abilene Wind Farm', status: 'Healthy', connectivity: 'Connected', firmware: 'v2.4.0', lastSeen: '3 min ago' },
  { id: 'DEV-0003', name: 'tx-wind-a021-pitch', type: 'Pitch Controller', hub: 'hub-tx-wind-02', site: 'Abilene Wind Farm', status: 'Degraded', connectivity: 'Connected', firmware: 'v5.0.2', lastSeen: '8 min ago' },
  { id: 'DEV-0004', name: 'tx-wind-m007-ctrl', type: 'Turbine Controller', hub: 'hub-tx-wind-01', site: 'Midland Wind Farm', status: 'Healthy', connectivity: 'Connected', firmware: 'v3.1.0', lastSeen: '2 min ago' },
  { id: 'DEV-0005', name: 'tx-wind-m011-ctrl', type: 'Turbine Controller', hub: 'hub-tx-wind-02', site: 'Midland Wind Farm', status: 'Unhealthy', connectivity: 'Disconnected', firmware: 'v3.1.0', lastSeen: '4 hrs ago' },
  { id: 'DEV-0006', name: 'tx-wind-o003-ctrl', type: 'Turbine Controller', hub: 'hub-tx-wind-03', site: 'Odessa Wind Farm', status: 'Healthy', connectivity: 'Connected', firmware: 'v3.2.1', lastSeen: '1 min ago' },
  { id: 'DEV-0007', name: 'tx-wind-o017-pitch', type: 'Pitch Controller', hub: 'hub-tx-wind-03', site: 'Odessa Wind Farm', status: 'Degraded', connectivity: 'Connected', firmware: 'v5.0.2', lastSeen: '31 min ago' },
  { id: 'DEV-0008', name: 'tx-wind-s002-ctrl', type: 'Turbine Controller', hub: 'hub-tx-wind-04', site: 'San Angelo Wind Farm', status: 'Healthy', connectivity: 'Connected', firmware: 'v3.2.1', lastSeen: '5 min ago' },
  { id: 'DEV-0009', name: 'tx-wind-a033-edge', type: 'Edge Gateway', hub: 'hub-tx-wind-01', site: 'Abilene Wind Farm', status: 'Healthy', connectivity: 'Connected', firmware: 'v1.9.3', lastSeen: '2 min ago' },
  { id: 'DEV-0010', name: 'tx-wind-m023-anem', type: 'Anemometer', hub: 'hub-tx-wind-02', site: 'Midland Wind Farm', status: 'Healthy', connectivity: 'Connected', firmware: 'v2.4.0', lastSeen: '6 min ago' },
  { id: 'DEV-0011', name: 'tx-wind-o009-anem', type: 'Anemometer', hub: 'hub-tx-wind-03', site: 'Odessa Wind Farm', status: 'Healthy', connectivity: 'Connected', firmware: 'v2.4.0', lastSeen: '4 min ago' },
  { id: 'DEV-0012', name: 'tx-wind-s015-ctrl', type: 'Turbine Controller', hub: 'hub-tx-wind-04', site: 'San Angelo Wind Farm', status: 'Degraded', connectivity: 'Connected', firmware: 'v3.1.0', lastSeen: '19 min ago' },
  { id: 'DEV-0013', name: 'tx-wind-a044-ctrl', type: 'Turbine Controller', hub: 'hub-tx-wind-01', site: 'Abilene Wind Farm', status: 'Healthy', connectivity: 'Connected', firmware: 'v3.1.0', lastSeen: '7 min ago' },
  { id: 'DEV-0014', name: 'tx-wind-m031-pitch', type: 'Pitch Controller', hub: 'hub-tx-wind-02', site: 'Midland Wind Farm', status: 'Unknown', connectivity: 'Never Connected', firmware: '—', lastSeen: 'Never' },
  { id: 'DEV-0015', name: 'tx-wind-s008-edge', type: 'Edge Gateway', hub: 'hub-tx-wind-04', site: 'San Angelo Wind Farm', status: 'Healthy', connectivity: 'Connected', firmware: 'v1.9.3', lastSeen: '3 min ago' },
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
      <div className="flex-1 min-w-0 pl-6">
      <AnimatePresence mode="wait">
      {activeMenuItem === 'assets' ? (
        <AssetsView key="assets" />
      ) : activeMenuItem === 'devices' ? (
        <DevicesView key="devices" />
      ) : activeMenuItem === 'iot-hub' ? (
        <IotHubView key="iot-hub" hubs={linkedHubs} onAddHub={() => setShowHubPicker(true)} unlinkedCount={unlinkedHubs.length} />
      ) : activeMenuItem === 'iot-ops' ? (
        <IotOpsView key="iot-ops" />
      ) : activeMenuItem === 'firmware' ? (
        <FirmwareAnalysisView key="firmware" />
      ) : activeMenuItem === 'jobs' ? (
        <JobsView key="jobs" jobs={jobs} setJobs={setJobs} expandedJobId={expandedJobId} setExpandedJobId={setExpandedJobId} showNewJobWizard={showNewJobWizard} setShowNewJobWizard={setShowNewJobWizard} linkedHubs={linkedHubs} aioInstances={aioInstances} namespaceSvcs={namespaceSvcs} />
      ) : (
      <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-8">
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

      {/* Jobs + Firmware Analysis moved to dedicated menu sub-views */}

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
      </motion.div>
      )}
      </AnimatePresence>
      </div>
    </motion.div>
  )
}

/* ─── Left Menu ─────────────────────────────────────────────── */

const LEFT_MENU_SECTIONS = [
  {
    title: 'Navigation',
    items: [
      { id: '', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
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
                    onClick={() => onItemClick(item.id)}
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

/* ─── Chart Helpers ─────────────────────────────────────────── */

function DonutChart({ segments, centerLabel, legendBelow }: { segments: { label: string; value: number; color: string }[]; centerLabel?: string; legendBelow?: boolean }) {
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

function HBarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map(d => d.value))
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground truncate mr-2">{d.label}</span>
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

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5">
        <p className="text-sm font-semibold mb-4">{title}</p>
        {children}
      </CardContent>
    </Card>
  )
}

function SubViewHeader({ title, subtitle, count }: { title: React.ReactNode; subtitle?: string; count?: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {count !== undefined && (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-sm font-medium text-muted-foreground">{count.toLocaleString()}</span>
        )}
      </div>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  )
}

/* ─── Assets View ────────────────────────────────────────────── */

/* ─── Sort Icon ─────────────────────────────────────────────── */

function SortIcon({ field, sort }: { field: string; sort: { field: string; dir: string } }) {
  if (sort.field !== field) return <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-70 transition-opacity" />
  return sort.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
}

/* ─── Assets View ────────────────────────────────────────────── */

const ASSET_STATUSES = ['Available', 'Degraded', 'Unhealthy', 'Unknown']
const ASSET_SORT_FIELDS = [
  { field: 'id', label: 'Asset ID', cls: 'w-[90px]' },
  { field: 'name', label: 'Name' },
  { field: 'type', label: 'Type' },
  { field: 'manufacturer', label: 'Manufacturer' },
  { field: 'site', label: 'Site' },
  { field: 'firmware', label: 'Firmware' },
  { field: 'status', label: 'Status' },
  { field: 'lastSeen', label: 'Last Seen' },
]

function AssetsView() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sort, setSort] = useState({ field: 'id', dir: 'asc' })

  const filtered = useMemo(() => {
    let rows = mockAssets
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(a =>
        a.id.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q) || a.manufacturer.toLowerCase().includes(q) ||
        a.site.toLowerCase().includes(q) || a.firmware.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'all') rows = rows.filter(a => a.status === statusFilter)
    return [...rows].sort((a, b) => {
      const av = (a as Record<string, string>)[sort.field] ?? ''
      const bv = (b as Record<string, string>)[sort.field] ?? ''
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [search, statusFilter, sort])

  function toggleSort(field: string) {
    setSort(s => s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-8"
    >
      <SubViewHeader title="Assets" count={namespace.totalAssets} subtitle="Texas-Wind-Namespace" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ChartCard title="Asset Health">
          <DonutChart segments={assetHealthData} centerLabel="Available" />
        </ChartCard>
        <ChartCard title="By Manufacturer">
          <HBarChart data={assetsByManufacturer} />
        </ChartCard>
        <ChartCard title="By Site">
          <HBarChart data={assetsBySite} />
        </ChartCard>
      </div>
      <div>
        {/* Toolbar */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search assets…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <div className="flex items-center gap-1">
            {['all', ...ASSET_STATUSES].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                  statusFilter === s ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:bg-muted/50'
                }`}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-muted-foreground">
            {filtered.length.toLocaleString()} of {namespace.totalAssets.toLocaleString()}
          </span>
        </div>
        <div className="rounded-lg border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {ASSET_SORT_FIELDS.map(col => (
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
                  <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                    No assets match your filters.
                  </TableCell>
                </TableRow>
              ) : filtered.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{a.id}</TableCell>
                  <TableCell className="font-medium text-sm">{a.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.type}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.manufacturer}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.site}</TableCell>
                  <TableCell className="font-mono text-xs">{a.firmware}</TableCell>
                  <TableCell><StatusBadge status={a.status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{a.lastSeen}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Devices View ───────────────────────────────────────────── */

const DEVICE_STATUSES_FILTER = ['Healthy', 'Degraded', 'Unhealthy', 'Unknown']
const CONNECTIVITY_OPTIONS = ['Connected', 'Disconnected', 'Never Connected']
const DEVICE_SORT_FIELDS = [
  { field: 'id', label: 'Device ID', cls: 'w-[90px]' },
  { field: 'name', label: 'Name' },
  { field: 'type', label: 'Type' },
  { field: 'hub', label: 'IoT Hub' },
  { field: 'site', label: 'Site' },
  { field: 'firmware', label: 'Firmware' },
  { field: 'connectivity', label: 'Connectivity' },
  { field: 'status', label: 'Status' },
  { field: 'lastSeen', label: 'Last Seen' },
]
const DEVICE_ACTIONS = [
  { id: 'enable', label: 'Enable', icon: CheckCircle2, cls: 'text-emerald-700' },
  { id: 'disable', label: 'Disable', icon: X, cls: 'text-slate-700' },
  { id: 'revoke-cert', label: 'Revoke Certificate', icon: KeyRound, cls: 'text-amber-700' },
  { id: 'update-firmware', label: 'Update Firmware', icon: Upload, cls: 'text-blue-700' },
]

function DevicesView() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [connectivityFilter, setConnectivityFilter] = useState('all')
  const [sort, setSort] = useState({ field: 'id', dir: 'asc' })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [actionDone, setActionDone] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let rows = mockDevices
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(d =>
        d.id.toLowerCase().includes(q) || d.name.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q) || d.hub.toLowerCase().includes(q) ||
        d.site.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'all') rows = rows.filter(d => d.status === statusFilter)
    if (connectivityFilter !== 'all') rows = rows.filter(d => d.connectivity === connectivityFilter)
    return [...rows].sort((a, b) => {
      const av = (a as Record<string, string>)[sort.field] ?? ''
      const bv = (b as Record<string, string>)[sort.field] ?? ''
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [search, statusFilter, connectivityFilter, sort])

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

  function confirmAction() {
    const n = selectionCount
    const label = DEVICE_ACTIONS.find(a => a.id === pendingAction)?.label ?? pendingAction ?? ''
    setPendingAction(null)
    setSelected(new Set())
    setActionDone(`${label} applied to ${n} device${n !== 1 ? 's' : ''}.`)
    setTimeout(() => setActionDone(null), 3000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-8"
    >
      <SubViewHeader title="Devices" count={namespace.totalDevices} subtitle="Texas-Wind-Namespace" />
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
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search devices…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {['all', ...DEVICE_STATUSES_FILTER].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                  statusFilter === s ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:bg-muted/50'
                }`}
              >{s === 'all' ? 'All status' : s}</button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {['all', ...CONNECTIVITY_OPTIONS].map(c => (
              <button
                key={c}
                onClick={() => setConnectivityFilter(c)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                  connectivityFilter === c ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:bg-muted/50'
                }`}
              >{c === 'all' ? 'All connectivity' : c}</button>
            ))}
          </div>
          <span className="ml-auto text-xs text-muted-foreground">
            {filtered.length.toLocaleString()} of {namespace.totalDevices.toLocaleString()}
          </span>
        </div>

        {/* Action / confirmation bars */}
        <AnimatePresence>
          {selectionCount > 0 && !pendingAction && !actionDone && (
            <motion.div
              key="action-bar"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <span className="text-xs font-medium text-slate-700 mr-1">{selectionCount} selected</span>
              {DEVICE_ACTIONS.map(action => (
                <button
                  key={action.id}
                  onClick={() => setPendingAction(action.id)}
                  className={`inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-white hover:border-slate-400 ${action.cls}`}
                >
                  <action.icon className="h-3 w-3" />
                  {action.label}
                </button>
              ))}
              <button
                onClick={() => setSelected(new Set())}
                className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
          {pendingAction && (
            <motion.div
              key="confirm-bar"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2"
            >
              <span className="text-xs font-medium text-amber-900">
                Apply <span className="font-semibold">{DEVICE_ACTIONS.find(a => a.id === pendingAction)?.label}</span> to {selectionCount} device{selectionCount !== 1 ? 's' : ''}?
              </span>
              <button
                onClick={confirmAction}
                className="rounded-md bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
              >Confirm</button>
              <button
                onClick={() => setPendingAction(null)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >Cancel</button>
            </motion.div>
          )}
          {actionDone && (
            <motion.div
              key="success-bar"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="text-xs font-medium text-emerald-800">{actionDone}</span>
            </motion.div>
          )}
        </AnimatePresence>

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
                    className={`cursor-pointer ${isSelected ? 'bg-blue-50/50' : ''}`}
                    onClick={() => toggleDevice(d.id)}
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
                    <TableCell className="font-mono text-xs">{d.firmware}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium ${
                        d.connectivity === 'Connected' ? 'text-emerald-600'
                        : d.connectivity === 'Disconnected' ? 'text-amber-600'
                        : 'text-slate-400'
                      }`}>{d.connectivity}</span>
                    </TableCell>
                    <TableCell><StatusBadge status={d.status} /></TableCell>
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

/* ─── IoT Hub View ───────────────────────────────────────────── */

function IotHubView({ hubs, onAddHub, unlinkedCount }: { hubs: Hub[]; onAddHub: () => void; unlinkedCount: number }) {
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
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={onAddHub}
          disabled={unlinkedCount === 0}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Linked Hub
        </Button>
      </div>
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

/* ─── IoT Operations View ────────────────────────────────────── */

function IotOpsView() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-8"
    >
      <SubViewHeader
        title={<><span className="whitespace-nowrap">IoT&nbsp;Operations</span> Instances</>}
        count={aioInstances.length}
        subtitle="Texas-Wind-Namespace"
      />
      <div className="rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Instance</TableHead>
              <TableHead>Site</TableHead>
              <TableHead className="text-right">Connected Devices</TableHead>
              <TableHead className="text-right">Assets</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {aioInstances.map((inst) => (
              <TableRow key={inst.name}>
                <TableCell className="font-mono text-sm font-medium">{inst.name}</TableCell>
                <TableCell className="text-muted-foreground">{inst.site}</TableCell>
                <TableCell className="text-right font-mono text-sm">{inst.connectedDevices.toLocaleString()}</TableCell>
                <TableCell className="text-right font-mono text-sm">{inst.assets.toLocaleString()}</TableCell>
                <TableCell><StatusBadge status={inst.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  )
}

/* ─── Jobs View ─────────────────────────────────────────────── */

interface JobsViewProps {
  jobs: CreatedJob[]
  setJobs: React.Dispatch<React.SetStateAction<CreatedJob[]>>
  expandedJobId: string | null
  setExpandedJobId: (id: string | null) => void
  showNewJobWizard: boolean
  setShowNewJobWizard: (v: boolean) => void
  linkedHubs: Hub[]
  aioInstances: { name: string; site: string; status: string; connectedDevices: number; assets: number }[]
  namespaceSvcs: NamespaceService[]
}

const JOB_TYPE_COLOR: Record<string, string> = {
  'Software Update': 'bg-blue-100 text-blue-700',
  'Certificate': 'bg-purple-100 text-purple-700',
  'Command': 'bg-slate-100 text-slate-600',
  'Configuration': 'bg-teal-100 text-teal-700',
}

function JobsView({ jobs, setJobs, expandedJobId, setExpandedJobId, showNewJobWizard, setShowNewJobWizard, linkedHubs, aioInstances: aioInst, namespaceSvcs }: JobsViewProps) {
  const deviceUpdateEnabled = namespaceSvcs.some(s => s.name === 'Device Update' && s.status === 'Healthy')

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <SubViewHeader title="Jobs" count={jobs.length} subtitle="Texas-Wind-Namespace" />
        <Button size="sm" className="gap-1.5 text-xs" onClick={() => setShowNewJobWizard(true)}>
          <Plus className="h-3.5 w-3.5" />
          New Job
        </Button>
      </div>
      <div className="rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[90px]">Job ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Targets</TableHead>
              <TableHead>Started</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map(job => (
              <>
                <TableRow
                  key={job.id}
                  className="cursor-pointer"
                  onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">{job.id}</TableCell>
                  <TableCell className="font-medium text-sm">{job.name}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ${
                      JOB_TYPE_COLOR[job.type] ?? 'bg-slate-100 text-slate-600'
                    }`}>{job.type}</span>
                  </TableCell>
                  <TableCell><StatusBadge status={job.status} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{job.targets}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{job.started}</TableCell>
                  <TableCell>
                    <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${
                      expandedJobId === job.id ? 'rotate-90' : ''
                    }`} />
                  </TableCell>
                </TableRow>
                <AnimatePresence>
                {expandedJobId === job.id && (
                  <TableRow key={`${job.id}-exp`}>
                    <TableCell colSpan={7} className="p-0">
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 py-4 bg-slate-50 border-t">
                          {job.hubProgress && job.hubProgress.length > 0 ? (
                            <div className="space-y-3">
                              {job.hubProgress.map(hp => {
                                const pct = hp.total > 0 ? Math.round(((hp.completed) / hp.total) * 100) : 0
                                return (
                                  <div key={hp.hubName}>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-mono text-xs font-medium">{hp.hubName}</span>
                                      <span className="text-xs text-muted-foreground">{hp.completed.toLocaleString()} / {hp.total.toLocaleString()} · {pct}%</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                      <div
                                        className="h-full rounded-full bg-emerald-500 transition-all"
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">No per-hub breakdown available.</p>
                          )}
                        </div>
                      </motion.div>
                    </TableCell>
                  </TableRow>
                )}
                </AnimatePresence>
              </>
            ))}
          </TableBody>
        </Table>
      </div>

      <AnimatePresence>
        {showNewJobWizard && (
          <motion.div
            key="new-job-wizard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-start justify-end p-6"
          >
            <NewJobWizard
              linkedHubs={linkedHubs}
              aioInstances={aioInst}
              totalAssets={namespace.totalAssets}
              existingJobs={jobs}
              deviceUpdateEnabled={deviceUpdateEnabled}
              onClose={() => setShowNewJobWizard(false)}
              onCreate={(job) => {
                setJobs(prev => [job, ...prev])
                setShowNewJobWizard(false)
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ─── Firmware Analysis View ─────────────────────────────────── */

const severityColor: Record<string, string> = {
  Critical: '#dc2626', High: '#f97316', Medium: '#f59e0b', Low: '#94a3b8',
}
const severityBg: Record<string, string> = {
  Critical: 'bg-red-600 text-white', High: 'bg-orange-500 text-white',
  Medium: 'bg-amber-100 text-amber-700 border border-amber-200',
  Low: 'bg-slate-100 text-slate-500 border border-slate-200',
}

function FirmwareAnalysisView() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-8"
    >
      <SubViewHeader title="Firmware Analysis" subtitle="Texas-Wind-Namespace" count={firmwareImages.length} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ChartCard title="Affected Devices by Manufacturer">
          <HBarChart data={fwByManufacturer} />
        </ChartCard>
        <ChartCard title="Affected Devices by Model">
          <HBarChart data={fwByModel} />
        </ChartCard>
        <ChartCard title="CVEs by Severity">
          <DonutChart segments={cveBySeverity} centerLabel="CVEs" legendBelow />
        </ChartCard>
        <ChartCard title="Top CVEs by Affected Devices">
          <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
            {cveByName.map((c) => (
              <div key={c.cve}>
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${severityBg[c.severity]}`}>
                      {c.severity[0]}
                    </span>
                    <span className="font-mono text-[11px] truncate text-foreground">{c.cve}</span>
                  </div>
                  <span className="font-mono text-xs tabular-nums ml-2 shrink-0">{c.devices.toLocaleString()}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(c.devices / 12_847) * 100}%`, backgroundColor: severityColor[c.severity] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <div>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-base font-semibold">Firmware Images</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{firmwareImages.length} images</span>
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
                <TableHead className="text-right">Devices Affected</TableHead>
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
                          {fw.cves.high > 0 && <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold bg-orange-500 text-white">{fw.cves.high} High</span>}
                          {fw.cves.medium > 0 && <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-amber-100 text-amber-700 border border-amber-200">{fw.cves.medium} Medium</span>}
                          {fw.cves.low > 0 && <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">{fw.cves.low} Low</span>}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">{fw.devicesAffected.toLocaleString()}</TableCell>
                    <TableCell>
                      <button className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
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
      </div>

      {/* CVE Detail Table */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-base font-semibold">CVE Detail</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{cveByName.length} vulnerabilities</span>
        </div>
        <div className="rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CVE ID</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Devices Affected</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cveByName.map((c) => (
                <TableRow key={c.cve}>
                  <TableCell className="font-mono text-xs font-medium">{c.cve}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${severityBg[c.severity]}`}>
                      {c.severity}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.description}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{c.devices.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </motion.div>
  )
}
