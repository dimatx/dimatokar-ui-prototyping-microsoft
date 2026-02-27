import { motion, AnimatePresence } from 'framer-motion'
import React, { useState, useEffect, useRef, useMemo } from 'react'
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
  Layers,
  Play,
  Tag,
  AlertTriangle,
  Pencil,
  Globe,
  Wifi,
  Copy,
  Filter,
  BarChart2,
  Network,
  ClipboardList,
  Zap,
  Trash2,
  LockKeyhole,
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
  { name: 'aio-tx-abilene-01',  site: 'Abilene Wind Farm',    status: 'Healthy',  connectedDevices: 842, assets: 434 },
  { name: 'aio-tx-midland-01',  site: 'Midland Wind Farm',    status: 'Healthy',  connectedDevices: 671, assets: 318 },
  { name: 'aio-tx-sanangelo-01',site: 'San Angelo Wind Farm', status: 'Degraded', connectedDevices: 512, assets: 244 },
  { name: 'aio-tx-lubbock-01',  site: 'Lubbock Wind Farm',   status: 'Healthy',  connectedDevices: 390, assets: 187 },
]

const firmwareImages = [
  {
    file: 'turbine-ctrl-x700-v3.2.1.bin',
    manufacturer: 'Contoso Wind Systems',
    model: 'TurbineController-X700',
    version: '3.2.1',
    cves: { critical: 0, high: 1, medium: 3, low: 5 },
    devicesAffected: 2_847,
    assetsAffected: 312,
  },
  {
    file: 'turbine-ctrl-x700-v3.1.0.bin',
    manufacturer: 'Contoso Wind Systems',
    model: 'TurbineController-X700',
    version: '3.1.0',
    cves: { critical: 2, high: 4, medium: 6, low: 8 },
    devicesAffected: 6_203,
    assetsAffected: 741,
  },
  {
    file: 'anem-sensor-fw-v2.4.0.bin',
    manufacturer: 'Zephyr Sensors Inc.',
    model: 'AnemometerPro-2400',
    version: '2.4.0',
    cves: { critical: 0, high: 0, medium: 1, low: 2 },
    devicesAffected: 1_412,
    assetsAffected: 128,
  },
  {
    file: 'edge-gateway-v1.9.3.bin',
    manufacturer: 'Meridian Edge Technologies',
    model: 'EdgeGateway-1900',
    version: '1.9.3',
    cves: { critical: 1, high: 2, medium: 4, low: 3 },
    devicesAffected: 985,
    assetsAffected: 94,
  },
  {
    file: 'pitchctrl-v5.0.2.bin',
    manufacturer: 'AeroLogix Systems',
    model: 'PitchController-5000',
    version: '5.0.2',
    cves: { critical: 0, high: 0, medium: 0, low: 1 },
    devicesAffected: 1_400,
    assetsAffected: 156,
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

/* ─── Per-Firmware Detail Mock Data ─────────────────────────── */

const firmwareDetailData: Record<string, {
  cvesBySeverity: { critical: number; high: number; medium: number; low: number }
  cves: { id: string; severity: string; description: string }[]
  softwareComponents: { name: string; version: string; cves: number }[]
  binaryHardening: { total: number; nx: number; pie: number; relro: number; canary: number; stripped: number }
  keys: { total: number; private: number; public: number; pairedKeys: number; shortKeySize: number }
  certificates: { total: number; weakSig: number; selfSigned: number; shortKey: number; expired: number; expiringSoon: number; valid: number }
  passwordHashes: { total: number; algorithms: { name: string; count: number }[] }
}> = {
  '3.2.1': {
    cvesBySeverity: { critical: 0, high: 1, medium: 3, low: 5 },
    cves: [
      { id: 'CVE-2024-7723', severity: 'High', description: 'Heap use-after-free in firmware parser' },
      { id: 'CVE-2024-4401', severity: 'High', description: 'Weak RNG used for device key generation' },
      { id: 'CVE-2024-6612', severity: 'Medium', description: 'Cleartext credentials in debug logs' },
      { id: 'CVE-2023-8812', severity: 'Medium', description: 'Integer overflow in OTA size validation' },
      { id: 'CVE-2023-7201', severity: 'Medium', description: 'Insufficient entropy in session token' },
    ],
    softwareComponents: [
      { name: 'openssl', version: '3.0.7', cves: 3 },
      { name: 'busybox', version: '1.36.1', cves: 2 },
      { name: 'dropbear', version: '2022.83', cves: 2 },
      { name: 'dnsmasq', version: '2.89', cves: 1 },
      { name: 'curl', version: '8.0.1', cves: 1 },
    ],
    binaryHardening: { total: 18, nx: 16, pie: 12, relro: 10, canary: 9, stripped: 14 },
    keys: { total: 4, private: 1, public: 3, pairedKeys: 0, shortKeySize: 1 },
    certificates: { total: 3, weakSig: 0, selfSigned: 1, shortKey: 0, expired: 0, expiringSoon: 1, valid: 2 },
    passwordHashes: { total: 6, algorithms: [{ name: 'SHA-256', count: 4 }, { name: 'SHA-512', count: 1 }, { name: 'MD5', count: 1 }] },
  },
  '3.1.0': {
    cvesBySeverity: { critical: 2, high: 4, medium: 6, low: 8 },
    cves: [
      { id: 'CVE-2025-2841', severity: 'Critical', description: 'Remote code execution via crafted OTA payload' },
      { id: 'CVE-2024-4812', severity: 'Critical', description: 'Improper cert validation in TLS handshake' },
      { id: 'CVE-2024-7723', severity: 'High', description: 'Heap use-after-free in firmware parser' },
      { id: 'CVE-2024-5612', severity: 'High', description: 'Privilege escalation via /proc traversal' },
      { id: 'CVE-2024-4401', severity: 'High', description: 'Weak RNG used for device key generation' },
      { id: 'CVE-2024-3812', severity: 'High', description: 'Stack buffer overflow in config parser' },
    ],
    softwareComponents: [
      { name: 'apache', version: '2.4.54', cves: 12 },
      { name: 'busybox', version: '1.34.1', cves: 7 },
      { name: 'openssl', version: '1.1.1t', cves: 6 },
      { name: 'pppd', version: '2.4.9', cves: 4 },
      { name: 'dropbear', version: '2020.81', cves: 3 },
      { name: 'radvd', version: '2.19', cves: 2 },
    ],
    binaryHardening: { total: 18, nx: 14, pie: 9, relro: 7, canary: 5, stripped: 16 },
    keys: { total: 6, private: 2, public: 4, pairedKeys: 1, shortKeySize: 2 },
    certificates: { total: 5, weakSig: 2, selfSigned: 2, shortKey: 1, expired: 1, expiringSoon: 2, valid: 2 },
    passwordHashes: { total: 14, algorithms: [{ name: 'MD5', count: 8 }, { name: 'DES', count: 4 }, { name: 'SHA-512', count: 2 }] },
  },
  '2.4.0': {
    cvesBySeverity: { critical: 0, high: 0, medium: 1, low: 2 },
    cves: [
      { id: 'CVE-2024-2201', severity: 'Medium', description: 'Side-channel timing vulnerability' },
      { id: 'CVE-2023-4102', severity: 'Low', description: 'Information disclosure via error messages' },
      { id: 'CVE-2023-3801', severity: 'Low', description: 'Missing rate limit on diagnostic API' },
    ],
    softwareComponents: [
      { name: 'busybox', version: '1.36.1', cves: 2 },
      { name: 'dropbear', version: '2022.83', cves: 1 },
      { name: 'musl libc', version: '1.2.3', cves: 0 },
    ],
    binaryHardening: { total: 8, nx: 8, pie: 6, relro: 5, canary: 4, stripped: 6 },
    keys: { total: 3, private: 1, public: 2, pairedKeys: 1, shortKeySize: 0 },
    certificates: { total: 2, weakSig: 0, selfSigned: 0, shortKey: 0, expired: 0, expiringSoon: 0, valid: 2 },
    passwordHashes: { total: 3, algorithms: [{ name: 'SHA-256', count: 2 }, { name: 'SHA-512', count: 1 }] },
  },
  '1.9.3': {
    cvesBySeverity: { critical: 1, high: 2, medium: 4, low: 3 },
    cves: [
      { id: 'CVE-2024-9901', severity: 'Critical', description: 'Buffer overflow in MQTT client' },
      { id: 'CVE-2025-1099', severity: 'High', description: 'Command injection in diagnostic endpoint' },
      { id: 'CVE-2024-3301', severity: 'High', description: 'Unauthenticated REST API access' },
      { id: 'CVE-2024-9102', severity: 'Medium', description: 'Path traversal in file upload handler' },
      { id: 'CVE-2024-8111', severity: 'Medium', description: 'Weak cipher suite in TLS negotiation' },
      { id: 'CVE-2024-6011', severity: 'Medium', description: 'Insecure default config in nginx' },
    ],
    softwareComponents: [
      { name: 'nginx', version: '1.22.0', cves: 4 },
      { name: 'busybox', version: '1.33.2', cves: 3 },
      { name: 'openssl', version: '1.0.2u', cves: 3 },
      { name: 'dropbear', version: '2019.78', cves: 2 },
      { name: 'uClibc', version: '0.9.33', cves: 1 },
    ],
    binaryHardening: { total: 22, nx: 18, pie: 10, relro: 8, canary: 6, stripped: 20 },
    keys: { total: 12, private: 3, public: 9, pairedKeys: 2, shortKeySize: 3 },
    certificates: { total: 5, weakSig: 1, selfSigned: 2, shortKey: 1, expired: 2, expiringSoon: 1, valid: 2 },
    passwordHashes: { total: 9, algorithms: [{ name: 'MD5', count: 3 }, { name: 'DES', count: 2 }, { name: 'SHA-256', count: 2 }, { name: 'SHA-1', count: 2 }] },
  },
  '5.0.2': {
    cvesBySeverity: { critical: 0, high: 0, medium: 0, low: 1 },
    cves: [
      { id: 'CVE-2023-2101', severity: 'Low', description: 'Debug interface accessible without authentication' },
    ],
    softwareComponents: [
      { name: 'busybox', version: '1.36.1', cves: 1 },
      { name: 'musl libc', version: '1.2.4', cves: 0 },
    ],
    binaryHardening: { total: 6, nx: 6, pie: 5, relro: 4, canary: 3, stripped: 3 },
    keys: { total: 2, private: 1, public: 1, pairedKeys: 1, shortKeySize: 0 },
    certificates: { total: 1, weakSig: 0, selfSigned: 0, shortKey: 0, expired: 0, expiringSoon: 0, valid: 1 },
    passwordHashes: { total: 2, algorithms: [{ name: 'SHA-256', count: 2 }] },
  },
}

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
  { id: 'DEV-0001', name: 'tx-wind-a001-ctrl', type: 'Turbine Controller', manufacturer: 'Contoso Wind Systems', model: 'TurbineController-X700', hub: 'hub-tx-wind-01', site: 'Abilene Wind Farm', status: 'Healthy', connectivity: 'Connected', firmware: 'v3.2.1', lastSeen: '1 min ago' },
  { id: 'DEV-0002', name: 'tx-wind-a014-anem', type: 'Anemometer', manufacturer: 'Zephyr Sensors Inc.', model: 'AnemometerPro-2400', hub: 'hub-tx-wind-01', site: 'Abilene Wind Farm', status: 'Healthy', connectivity: 'Connected', firmware: 'v2.4.0', lastSeen: '3 min ago' },
  { id: 'DEV-0003', name: 'tx-wind-a021-pitch', type: 'Pitch Controller', manufacturer: 'AeroLogix Systems', model: 'PitchController-5000', hub: 'hub-tx-wind-02', site: 'Abilene Wind Farm', status: 'Degraded', connectivity: 'Connected', firmware: 'v5.0.2', lastSeen: '8 min ago' },
  { id: 'DEV-0004', name: 'tx-wind-m007-ctrl', type: 'Turbine Controller', manufacturer: 'Contoso Wind Systems', model: 'TurbineController-X700', hub: 'hub-tx-wind-01', site: 'Midland Wind Farm', status: 'Healthy', connectivity: 'Connected', firmware: 'v3.1.0', lastSeen: '2 min ago' },
  { id: 'DEV-0005', name: 'tx-wind-m011-ctrl', type: 'Turbine Controller', manufacturer: 'Contoso Wind Systems', model: 'TurbineController-X700', hub: 'hub-tx-wind-02', site: 'Midland Wind Farm', status: 'Unhealthy', connectivity: 'Disconnected', firmware: 'v3.1.0', lastSeen: '4 hrs ago' },
  { id: 'DEV-0006', name: 'tx-wind-o003-ctrl', type: 'Turbine Controller', manufacturer: 'Contoso Wind Systems', model: 'TurbineController-X700', hub: 'hub-tx-wind-03', site: 'Odessa Wind Farm', status: 'Healthy', connectivity: 'Connected', firmware: 'v3.2.1', lastSeen: '1 min ago' },
  { id: 'DEV-0007', name: 'tx-wind-o017-pitch', type: 'Pitch Controller', manufacturer: 'AeroLogix Systems', model: 'PitchController-5000', hub: 'hub-tx-wind-03', site: 'Odessa Wind Farm', status: 'Degraded', connectivity: 'Connected', firmware: 'v5.0.2', lastSeen: '31 min ago' },
  { id: 'DEV-0008', name: 'tx-wind-s002-ctrl', type: 'Turbine Controller', manufacturer: 'Contoso Wind Systems', model: 'TurbineController-X700', hub: 'hub-tx-wind-04', site: 'San Angelo Wind Farm', status: 'Healthy', connectivity: 'Connected', firmware: 'v3.2.1', lastSeen: '5 min ago' },
  { id: 'DEV-0009', name: 'tx-wind-a033-edge', type: 'Edge Gateway', manufacturer: 'Meridian Edge Technologies', model: 'EdgeGateway-1900', hub: 'hub-tx-wind-01', site: 'Abilene Wind Farm', status: 'Healthy', connectivity: 'Connected', firmware: 'v1.9.3', lastSeen: '2 min ago' },
  { id: 'DEV-0010', name: 'tx-wind-m023-anem', type: 'Anemometer', manufacturer: 'Zephyr Sensors Inc.', model: 'AnemometerPro-2400', hub: 'hub-tx-wind-02', site: 'Midland Wind Farm', status: 'Healthy', connectivity: 'Connected', firmware: 'v2.4.0', lastSeen: '6 min ago' },
  { id: 'DEV-0011', name: 'tx-wind-o009-anem', type: 'Anemometer', manufacturer: 'Zephyr Sensors Inc.', model: 'AnemometerPro-2400', hub: 'hub-tx-wind-03', site: 'Odessa Wind Farm', status: 'Healthy', connectivity: 'Connected', firmware: 'v2.4.0', lastSeen: '4 min ago' },
  { id: 'DEV-0012', name: 'tx-wind-s015-ctrl', type: 'Turbine Controller', manufacturer: 'Contoso Wind Systems', model: 'TurbineController-X700', hub: 'hub-tx-wind-04', site: 'San Angelo Wind Farm', status: 'Degraded', connectivity: 'Connected', firmware: 'v3.1.0', lastSeen: '19 min ago' },
  { id: 'DEV-0013', name: 'tx-wind-a044-ctrl', type: 'Turbine Controller', manufacturer: 'Contoso Wind Systems', model: 'TurbineController-X700', hub: 'hub-tx-wind-01', site: 'Abilene Wind Farm', status: 'Healthy', connectivity: 'Connected', firmware: 'v3.1.0', lastSeen: '7 min ago' },
  { id: 'DEV-0014', name: 'tx-wind-m031-pitch', type: 'Pitch Controller', manufacturer: 'AeroLogix Systems', model: 'PitchController-5000', hub: 'hub-tx-wind-02', site: 'Midland Wind Farm', status: 'Unknown', connectivity: 'Never Connected', firmware: '—', lastSeen: 'Never' },
  { id: 'DEV-0015', name: 'tx-wind-s008-edge', type: 'Edge Gateway', manufacturer: 'Meridian Edge Technologies', model: 'EdgeGateway-1900', hub: 'hub-tx-wind-04', site: 'San Angelo Wind Farm', status: 'Healthy', connectivity: 'Connected', firmware: 'v1.9.3', lastSeen: '3 min ago' },
]

/* ─── Mini chart helpers ─────────────────────────────────────── */

function SegBar({ segs }: { segs: { v: number; c: string }[] }) {
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

function HBar({ value, max, color = '#3b82f6' }: { value: number; max: number; color?: string }) {
  return (
    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${Math.round((value / Math.max(max, 1)) * 100)}%`, background: color }} />
    </div>
  )
}

/* ─── URL mapping ────────────────────────────────────────────── */

const ID_TO_SEGMENT: Record<string, string> = {
  '':               '',
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
          onFirmwareSelect={(v) => navigateTo('firmware', { firmware: v })}
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
        <AssetsView key={`assets-${assetPrefilter}`} initialSearch={assetPrefilter} onRunJob={(ids, names) => setRunJobTarget({ ids, names, source: 'Assets' })} onAssetSelect={(id) => navigateToDetail('asset', id)} />
      ) : activeMenuItem === 'devices' && deviceDetailId ? (
        <DeviceDetailView
          key={`device-detail-${deviceDetailId}`}
          deviceId={deviceDetailId}
          onBack={() => navigate(-1)}
          onFirmwareSelect={(v) => navigateTo('firmware', { firmware: v })}
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
        />
      ) : activeMenuItem === 'iot-hub' ? (
        <IotHubView key="iot-hub" hubs={linkedHubs} onAddHub={() => setShowHubPicker(true)} unlinkedCount={unlinkedHubs.length} />
      ) : activeMenuItem === 'iot-ops' ? (
        <IotOpsView key="iot-ops" />
      ) : activeMenuItem === 'ota-management' ? (
        <OtaManagementView
          key="ota-management"
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
        <JobDetailPage key="job-detail" />
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
        <HeroStat icon={Cpu} label="Devices" value={namespace.totalDevices.toLocaleString()} />
        <HeroStat icon={Drill} label="Assets" value={namespace.totalAssets.toLocaleString()} />
        <HeroStat icon={Server} label="IoT Hubs" value={linkedHubs.length.toString()} />
        <HeroStat icon={Activity} label={<><span className="whitespace-nowrap">IoT&nbsp;Operations</span> Instances</>} value={aioInstances.length.toString()} />
      </div>

      {/* ── Resource Health Charts ──────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <ChartCard title="Device Health">
          <DonutChart segments={deviceHealthData} centerLabel="Healthy" />
        </ChartCard>
        <ChartCard title="Asset Health">
          <DonutChart segments={assetHealthData} centerLabel="Available" />
        </ChartCard>
        <ChartCard title="Resources by Type">
          <HBarChart data={[
            { label: 'Devices',  value: namespace.totalDevices, color: '#3b82f6' },
            { label: 'Assets',   value: namespace.totalAssets,  color: '#8b5cf6' },
            { label: 'IoT Hubs', value: linkedHubs.length,      color: '#10b981' },
            { label: 'IoT&nbsp;Ops Instances', value: aioInstances.length, color: '#f59e0b' },
          ]} />
        </ChartCard>
      </div>

      {/* ── Services Health ──────────────────────────────────── */}
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

      {/* Jobs + Firmware Analysis moved to dedicated menu sub-views */}

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
              className="w-full max-w-lg rounded-xl border bg-white shadow-xl"
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
      { id: 'cert-mgmt', label: 'Certificate Management', icon: KeyRound },
      { id: 'groups', label: 'Groups', icon: Users },
      { id: 'jobs', label: 'Jobs', icon: Activity },
      { id: 'ota-management', label: 'OTA Management', icon: Zap },
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
            {(LEFT_MENU_SECTIONS as Array<{ title: string; collapsible?: boolean; defaultCollapsed?: boolean; items: { id: string; label: string; icon: typeof Cpu; disabled?: boolean }[] }>).map((section, si) => {
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

/* ─── Sub-components ────────────────────────────────────────── */

function HeroStat({ icon: Icon, label, value }: { icon: typeof Cpu; label: React.ReactNode; value: string }) {
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

function HBarChart({ data, onBarClick }: { data: { label: string; value: number; color: string }[]; onBarClick?: (label: string) => void }) {
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

/** SVG line chart that fills the container width */
function TinyLineChart({ data, color = '#3b82f6', label }: { data: number[]; color?: string; label?: string }) {
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

/* ─── Time-Series Mock Data ──────────────────────────────────── */

// Cert ops: 24h (hourly operations issued / revoked)
const certOpsL1D = [124, 98, 87, 142, 201, 185, 167, 210, 340, 412, 389, 356, 398, 420, 411, 380, 392, 415, 440, 398, 360, 312, 278, 241]
const certRevokedL1D = [2, 1, 0, 3, 4, 2, 1, 2, 6, 8, 5, 4, 3, 7, 5, 4, 3, 4, 5, 3, 2, 2, 1, 2]
// Cert ops: 30d (daily)
const certOpsL30D = [3200, 2980, 3410, 3250, 3870, 4120, 3960, 4380, 4210, 4050, 3880, 3990, 4100, 4420, 4190, 4340, 4510, 4380, 4190, 4260, 4320, 4480, 4290, 4130, 4200, 4350, 4410, 4180, 4050, 3980]

// Provisioning: 24h (hourly registration attempts)
// Registrations: broad mid-day hump, high amplitude
const provRegistrationsL1D = [18, 12, 9, 14, 22, 31, 28, 24, 42, 67, 58, 54, 61, 72, 68, 54, 49, 62, 71, 58, 44, 38, 29, 21]
// Assigned: successful subset (~85% of registrations), smoother with slight lag
const provAssignedL1D     = [14, 9,  7, 11, 17, 25, 22, 19, 36, 55, 49, 47, 52, 60, 57, 46, 39, 51, 59, 50, 37, 31, 23, 16]
// Attestation attempts: spikier early morning + lunch surge, drops sharply at night
const provAttestL1D       = [ 9, 5,  3,  7, 18, 44, 52, 38, 27, 41, 35, 29, 48, 63, 59, 45, 28, 19, 24, 32, 27, 18, 12,  7]



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

/* ─── Placeholder View ───────────────────────────────────────── */

function PlaceholderView({ title, description, icon: Icon, action }: { title: string; description: string; icon: React.ElementType; action?: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-400 mb-5">
        <Icon className="h-7 w-7" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">{title}</h2>
      <p className="max-w-md text-sm text-muted-foreground leading-relaxed mb-6">{description}</p>
      {action ?? (
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
          Coming soon
        </span>
      )}
    </motion.div>
  )
}

/* ─── Capability Page Mock Data ─────────────────────────────── */

const mockEnrollmentGroups = [
  { id: 'EG-001', name: 'Contoso Turbine Controllers', attestation: 'X.509 Intermediate CA', devices: 4_820, status: 'Active',   created: '2025-11-14' },
  { id: 'EG-002', name: 'AeroLogix Pitch Controllers',  attestation: 'X.509 Intermediate CA', devices: 2_617, status: 'Active',   created: '2025-11-14' },
  { id: 'EG-003', name: 'Zephyr Anemometers',           attestation: 'Symmetric Key',         devices: 1_840, status: 'Active',   created: '2025-12-01' },
  { id: 'EG-004', name: 'Meridian Edge Gateways',       attestation: 'X.509 Intermediate CA', devices: 984,   status: 'Active',   created: '2026-01-08' },
  { id: 'EG-005', name: 'Legacy Sensors – Batch A',     attestation: 'TPM 2.0',               devices: 312,   status: 'Inactive', created: '2025-09-20' },
]

const mockGroups = [
  { id: 'GRP-001', name: 'All Turbine Controllers',     memberKind: 'devices' as const, type: 'Device Group',  devices: 6_100, assets: 0,   status: 'Active',   criteria: { type: 'Turbine Controller' } },
  { id: 'GRP-002', name: 'Abilene Wind Farm – All',      memberKind: 'devices' as const, type: 'Device Group',  devices: 2_430, assets: 434, status: 'Active',   criteria: { site: 'Abilene Wind Farm' } },
  { id: 'GRP-003', name: 'Midland Wind Farm – All',      memberKind: 'devices' as const, type: 'Device Group',  devices: 2_180, assets: 318, status: 'Active',   criteria: { site: 'Midland Wind Farm' } },
  { id: 'GRP-004', name: 'Odessa Wind Farm – All',       memberKind: 'devices' as const, type: 'Device Group',  devices: 1_820, assets: 244, status: 'Active',   criteria: { site: 'Odessa Wind Farm' } },
  { id: 'GRP-005', name: 'San Angelo Wind Farm – All',   memberKind: 'devices' as const, type: 'Device Group',  devices: 1_100, assets: 187, status: 'Active',   criteria: { site: 'San Angelo Wind Farm' } },
  { id: 'GRP-006', name: 'Firmware v3.1.0 – Pending Update', memberKind: 'devices' as const, type: 'Device Group', devices: 6_203, assets: 0, status: 'Active', criteria: { firmware: 'v3.1.0' } },
  { id: 'GRP-007', name: 'Degraded + Unhealthy',         memberKind: 'devices' as const, type: 'Device Group',  devices: 583,   assets: 0,   status: 'Active',   criteria: { status: 'Degraded' } },
  { id: 'GRP-008', name: 'Contoso Turbine Assets',       memberKind: 'assets'  as const, type: 'Asset Group',   devices: 0,     assets: 1_420, status: 'Active', criteria: { manufacturer: 'Contoso Wind Systems' } },
  { id: 'GRP-009', name: 'All Anemometer Sensors',       memberKind: 'assets'  as const, type: 'Asset Group',   devices: 0,     assets: 782,  status: 'Active',   criteria: { type: 'Anemometer' } },
  { id: 'GRP-010', name: 'Edge Gateways – All Sites',    memberKind: 'assets'  as const, type: 'Asset Group',   devices: 0,     assets: 541,  status: 'Active',   criteria: { type: 'Edge Gateway' } },
]

const mockCertHierarchy = [
  { id: 'CA-001', name: 'Zava Energy Root CA',       type: 'Root CA',          issuer: 'Self-signed',         validTo: '2035-01-01', status: 'Valid' },
  { id: 'CA-002', name: 'Zava Energy ICA',           type: 'Intermediate CA',  issuer: 'Zava Energy Root CA', validTo: '2030-06-01', status: 'Valid' },
]

const mockThirdPartyIntegrations = [
  { id: '3P-001', name: 'RealWear Deployment Manager', vendor: 'RealWear',    category: 'Field Service',     status: 'Available' },
  { id: '3P-002', name: 'Sight Machine IoT Analytics', vendor: 'Sight Machine', category: 'Analytics',      status: 'Available' },
  { id: '3P-003', name: 'PTC ThingWorx Connector',    vendor: 'PTC',          category: 'Industrial IoT',   status: 'Available' },
  { id: '3P-004', name: 'Claroty Edge Security',      vendor: 'Claroty',      category: 'Security',         status: 'Available' },
]

/* ─── Shared Capability Page Header ─────────────────────────── */

function CapabilityPageHeader({ icon: Icon, title, description, svc, onConfigure }: {
  icon: React.ElementType
  title: string
  description: string
  svc?: NamespaceService | null
  onConfigure?: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500 shrink-0 mt-0.5">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {svc && onConfigure && (
              <button
                onClick={onConfigure}
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                title={`Configure ${svc.name}`}
              >
                <Settings className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      {svc && (
        <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white px-4 py-2.5 shadow-sm shrink-0">
          <span className="text-xs text-slate-500 font-medium">Status</span>
          <StatusBadge status={svc.status} />
          {svc.instanceName && <span className="font-mono text-xs text-slate-400">{svc.instanceName}</span>}
        </div>
      )}
    </div>
  )
}

/* ─── Provisioning View ──────────────────────────────────────── */

function ProvisioningView({ svc, onConfigure }: { svc: NamespaceService; onConfigure: () => void }) {
  const totalDevices = mockEnrollmentGroups.reduce((s, g) => s + g.devices, 0)
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <CapabilityPageHeader icon={Upload} title="Provisioning" description="Manage device enrollment groups and provisioning rules for this namespace." svc={svc} onConfigure={onConfigure} />
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Enrollment Groups', value: mockEnrollmentGroups.length.toString() },
          { label: 'Registered Devices', value: totalDevices.toLocaleString() },
          { label: 'Allocation Policy', value: 'Evenly Weighted Distribution' },
        ].map(c => (
          <div key={c.label} className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">{c.label}</p>
            <p className="text-xl font-semibold text-slate-900">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <ChartCard title="Registration Attempts – 24h">
          <TinyLineChart data={provRegistrationsL1D} color="#3b82f6" label="Current hour" />
        </ChartCard>
        <ChartCard title="Devices Assigned – 24h">
          <TinyLineChart data={provAssignedL1D} color="#10b981" label="Current hour" />
        </ChartCard>
        <ChartCard title="Attestation Attempts – 24h">
          <TinyLineChart data={provAttestL1D} color="#f59e0b" label="Current hour" />
        </ChartCard>
      </div>
      <div className="rounded-lg border border-slate-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">ID</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Enrollment Group</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Attestation</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Devices</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Created</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockEnrollmentGroups.map(g => (
              <TableRow key={g.id} className="hover:bg-slate-50/60">
                <TableCell className="font-mono text-xs text-slate-400">{g.id}</TableCell>
                <TableCell className="font-medium text-sm">{g.name}</TableCell>
                <TableCell className="text-sm text-slate-600">{g.attestation}</TableCell>
                <TableCell className="text-right font-mono text-sm">{g.devices.toLocaleString()}</TableCell>
                <TableCell className="text-xs text-slate-400">{g.created}</TableCell>
                <TableCell><StatusBadge status={g.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  )
}

/* ─── Certificate Management View ───────────────────────────── */

function CertMgmtView({ svc, onConfigure, onNavigate }: { svc: NamespaceService; onConfigure: () => void; onNavigate: (id: string) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <CapabilityPageHeader icon={Shield} title="Certificate Management" description="Manage the CA hierarchy and certificate lifecycle for devices in this namespace." svc={svc} onConfigure={onConfigure} />
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'CAs',                      value: '2'                    },
          { label: 'Root CAs',                  value: '1'                    },
          { label: 'Intermediate CAs',           value: '1'                    },
          { label: 'Active Leaf Certificates',   value: (8_421).toLocaleString() },
        ].map(c => (
          <div key={c.label} className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">{c.label}</p>
            <p className="text-xl font-semibold text-slate-900">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <ChartCard title="Certificate Operations – Last 24h">
          <TinyLineChart data={certOpsL1D} color="#3b82f6" label="Issued this hour" />
          <p className="text-[11px] text-muted-foreground mt-2">Revocations: <span className="font-mono">{certRevokedL1D[certRevokedL1D.length - 1]}</span> in current hour</p>
        </ChartCard>
        <ChartCard title="Certificate Operations – Last 30 Days">
          <TinyLineChart data={certOpsL30D} color="#8b5cf6" label="Issued today" />
        </ChartCard>
      </div>
      <div className="rounded-lg border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">CA Hierarchy</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-white">
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">ID</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Issuer</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Valid To</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockCertHierarchy.map(c => {
              const destId = c.type === 'Root CA' ? 'credentials' : 'policies'
              const destLabel = c.type === 'Root CA' ? 'View in Credentials' : 'View in Policies'
              return (
                <TableRow
                  key={c.id}
                  className="hover:bg-slate-50/80 cursor-pointer"
                  onClick={() => onNavigate(destId)}
                >
                  <TableCell className="font-mono text-xs text-slate-400">{c.id}</TableCell>
                  <TableCell className="font-medium text-sm">{c.name}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-slate-50 text-slate-600 border-slate-200">{c.type}</span>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">{c.issuer}</TableCell>
                  <TableCell className="text-xs text-slate-400">{c.validTo}</TableCell>
                  <TableCell><StatusBadge status={c.status === 'Valid' ? 'Healthy' : c.status} /></TableCell>
                  <TableCell className="text-right">
                    <span className="text-xs text-blue-600 hover:underline flex items-center gap-1 justify-end">
                      {destLabel}<ChevronRight className="h-3 w-3" />
                    </span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  )
}

/* ─── Groups View ────────────────────────────────────────────── */

const GROUP_DEVICE_TYPES = ['Turbine Controller', 'Anemometer', 'Pitch Controller', 'Edge Gateway']
const GROUP_ASSET_TYPES  = ['Turbine Controller', 'Anemometer', 'Pitch Controller', 'Edge Gateway']
const GROUP_SITES        = ['Abilene Wind Farm', 'Midland Wind Farm', 'Odessa Wind Farm', 'San Angelo Wind Farm']
const GROUP_MANUFACTURERS = ['Contoso Wind Systems', 'Zephyr Sensors Inc.', 'AeroLogix Systems', 'Meridian Edge Technologies']
const GROUP_STATUSES     = ['Healthy', 'Degraded', 'Unhealthy']

type GroupDraft = {
  name: string; description: string; memberKind: 'devices' | 'assets'
  criteriaManufacturer: string; criteriaSite: string; criteriaType: string; criteriaStatus: string; freeQuery: string
}

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

function GroupsView({ onGroupSelect }: { onGroupSelect?: (id: string) => void }) {
  const [groups, setGroups] = useState(mockGroups)
  const [showWizard, setShowWizard] = useState(false)

  const deviceGroups = groups.filter(g => g.memberKind === 'devices')
  const assetGroups  = groups.filter(g => g.memberKind === 'assets')

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
          { label: 'Active Groups',  value: groups.filter(g => g.status === 'Active').length.toString() },
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
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">ID</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Group Name</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Kind</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Members</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map(g => (
              <TableRow key={g.id} className="hover:bg-slate-50/80 cursor-pointer" onClick={() => onGroupSelect?.(g.id)}>
                <TableCell className="font-mono text-xs text-slate-400">{g.id}</TableCell>
                <TableCell className="font-medium text-sm">{g.name}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${g.memberKind === 'assets' ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                    {g.memberKind === 'assets' ? <Drill className="h-3 w-3" /> : <Cpu className="h-3 w-3" />}
                    {g.type}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {g.memberKind === 'devices' ? g.devices.toLocaleString() : g.assets.toLocaleString()}
                </TableCell>
                <TableCell><StatusBadge status={g.status} /></TableCell>
                <TableCell className="text-right pr-4">
                  <span className="text-xs text-blue-600 flex items-center gap-1 justify-end">
                    View {g.memberKind === 'assets' ? 'Assets' : 'Devices'}<ChevronRight className="h-3 w-3" />
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <AnimatePresence>
        {showWizard && <CreateGroupWizard onClose={() => setShowWizard(false)} onCreate={handleCreate} />}
      </AnimatePresence>
    </motion.div>
  )
}


/* ─── Credentials Page View ──────────────────────────────────── */

function CredentialsPageView() {
  const ca = mockCertHierarchy.find(c => c.type === 'Root CA')!
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <CapabilityPageHeader icon={KeyRound} title="Credentials" description="Root certificate authority anchoring device identity for this namespace." />
      <div className="rounded-lg border border-slate-100 bg-white shadow-sm p-6 max-w-lg space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-50 text-amber-600">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">{ca.name}</p>
            <p className="text-xs text-slate-400">{ca.type}</p>
          </div>
          <div className="ml-auto"><StatusBadge status="Healthy" /></div>
        </div>
        {[
          { label: 'Issuer',        value: ca.issuer },
          { label: 'Valid To',      value: ca.validTo },
          { label: 'Algorithm',     value: 'RSA 4096 / SHA-256' },
          { label: 'Fingerprint',   value: 'E4:2B:C1:9A:…:7F:03' },
          { label: 'Namespace',     value: 'Texas-Wind-Namespace' },
        ].map(r => (
          <div key={r.label} className="flex justify-between text-sm">
            <span className="text-slate-500">{r.label}</span>
            <span className="font-medium text-slate-800 font-mono text-xs">{r.value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

/* ─── Policies Page View ─────────────────────────────────────── */

function PoliciesPageView() {
  const ica = mockCertHierarchy.find(c => c.type === 'Intermediate CA')!
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <CapabilityPageHeader icon={FileText} title="Policies" description="Intermediate certificate authority (ICA) issuing device certificates for this namespace." />
      <div className="rounded-lg border border-slate-100 bg-white shadow-sm p-6 max-w-lg space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-50 text-violet-600">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">{ica.name}</p>
            <p className="text-xs text-slate-400">{ica.type}</p>
          </div>
          <div className="ml-auto"><StatusBadge status="Healthy" /></div>
        </div>
        {[
          { label: 'Issuer',          value: ica.issuer },
          { label: 'Valid To',        value: ica.validTo },
          { label: 'Algorithm',       value: 'RSA 2048 / SHA-256' },
          { label: 'Fingerprint',     value: 'A1:9D:B4:22:…:FC:88' },
          { label: 'Scope',           value: 'Texas-Wind-Namespace' },
          { label: 'Max Path Length', value: '0 (leaf certs only)' },
        ].map(r => (
          <div key={r.label} className="flex justify-between text-sm">
            <span className="text-slate-500">{r.label}</span>
            <span className="font-medium text-slate-800 font-mono text-xs">{r.value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

/* ─── Third Party View ───────────────────────────────────────── */

function ThirdPartyView({ svc, onConfigure }: { svc: NamespaceService | undefined; onConfigure: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <CapabilityPageHeader icon={Puzzle} title="3P Capability" description="Connect third-party partner services and marketplace integrations to this namespace." svc={svc ?? null} onConfigure={svc ? onConfigure : undefined} />
      <div className="rounded-lg border border-slate-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Integration</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Vendor</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockThirdPartyIntegrations.map(t => (
              <TableRow key={t.id} className="hover:bg-slate-50/60">
                <TableCell className="font-medium text-sm">{t.name}</TableCell>
                <TableCell className="text-sm text-slate-600">{t.vendor}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-slate-50 text-slate-600 border-slate-200">{t.category}</span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-sky-50 text-sky-700 border-sky-200">{t.status}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  )
}

/* ─── Sort Icon ─────────────────────────────────────────────── */

function SortIcon({ field, sort }: { field: string; sort: { field: string; dir: string } }) {
  if (sort.field !== field) return <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-70 transition-opacity" />
  return sort.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
}

/* ─── All Resources Mock Data ───────────────────────────────── */

const mockCredentials = [
  { id: 'CRT-0001', name: 'Zava Energy Root CA', site: 'N/A', status: 'Valid', lastSeen: '1 day ago' },
]

const mockPolicies = [
  { id: 'ICA-0001', name: 'Zava Energy CA', site: 'N/A', status: 'Active', lastSeen: '12 hrs ago' },
]

function statusBadgeLabel(resourceType: string, rawStatus: string): string {
  if (rawStatus === 'Available' || rawStatus === 'Healthy' || rawStatus === 'Valid') return 'Healthy'
  if (rawStatus === 'Active') return 'Active'
  if (rawStatus === 'Degraded') return 'Degraded'
  if (rawStatus === 'Expiring Soon') return 'Warning'
  if (rawStatus === 'Unhealthy') return 'Error'
  if (rawStatus === 'Expired') return 'Critical'
  if (rawStatus === 'Inactive') return 'Inactive'
  return 'Inactive' // Unknown
}

function normalizeHealth(rawStatus: string): 'healthy' | 'degraded' | 'error' | 'inactive' {
  if (['Available', 'Healthy', 'Valid', 'Active'].includes(rawStatus)) return 'healthy'
  if (['Degraded', 'Expiring Soon', 'Warning'].includes(rawStatus)) return 'degraded'
  if (['Unhealthy', 'Error', 'Critical', 'Expired'].includes(rawStatus)) return 'error'
  return 'inactive'
}

const ALL_RESOURCE_TYPE_STYLES: Record<string, string> = {
  Asset:      'bg-sky-50 text-sky-700 border-sky-200',
  Device:     'bg-indigo-50 text-indigo-700 border-indigo-200',
  Credential: 'bg-amber-50 text-amber-700 border-amber-200',
  Policy:     'bg-violet-50 text-violet-700 border-violet-200',
}

/* ─── All Resources View ─────────────────────────────────────── */

function AllResourcesView({ onAssetSelect, onDeviceSelect }: { onAssetSelect?: (id: string) => void; onDeviceSelect?: (id: string) => void }) {
  const [typeFilter, setTypeFilter] = useState<string>('All')
  const [search, setSearch] = useState('')

  const allRows = useMemo(() => [
    ...mockAssets.map(a => ({ id: a.id, name: a.name, resourceType: 'Asset' as const, rawStatus: a.status, site: a.site, lastSeen: a.lastSeen })),
    ...mockDevices.map(d => ({ id: d.id, name: d.name, resourceType: 'Device' as const, rawStatus: d.status, site: d.site, lastSeen: d.lastSeen })),
    ...mockCredentials.map(c => ({ id: c.id, name: c.name, resourceType: 'Credential' as const, rawStatus: c.status, site: c.site, lastSeen: c.lastSeen })),
    ...mockPolicies.map(p => ({ id: p.id, name: p.name, resourceType: 'Policy' as const, rawStatus: p.status, site: p.site, lastSeen: p.lastSeen })),
  ], [])

  const filtered = useMemo(() => {
    let rows = typeFilter === 'All' ? allRows : allRows.filter(r => r.resourceType === typeFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(r => r.id.toLowerCase().includes(q) || r.name.toLowerCase().includes(q))
    }
    return rows
  }, [allRows, typeFilter, search])

  const byType = [
    { label: 'Assets',      count: mockAssets.length,      color: '#0ea5e9' },
    { label: 'Devices',     count: mockDevices.length,     color: '#6366f1' },
    { label: 'Credentials', count: mockCredentials.length, color: '#f59e0b' },
    { label: 'Policies',    count: mockPolicies.length,    color: '#8b5cf6' },
  ]

  const healthCounts = useMemo(() => allRows.reduce((acc, r) => {
    const key = normalizeHealth(r.rawStatus)
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {} as Record<string, number>), [allRows])

  const bySite = useMemo(() => {
    const map: Record<string, number> = {}
    allRows.filter(r => r.site !== 'N/A').forEach(r => { map[r.site] = (map[r.site] ?? 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [allRows])
  const maxSite = bySite[0]?.[1] ?? 1

  const FILTER_TYPES = ['All', 'Asset', 'Device', 'Credential', 'Policy'] as const
  const PLURAL_LABELS: Record<string, string> = { Asset: 'Assets', Device: 'Devices', Credential: 'Credentials', Policy: 'Policies' }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-6"
    >
      <SubViewHeader
        title="All Resources"
        count={allRows.length}
        subtitle="Assets, Devices, Credentials and Policies in this namespace"
      />

      {/* ── Charts ───────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {/* By Resource Type */}
        <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">By Resource Type</p>
          <SegBar segs={byType.map(t => ({ v: t.count, c: t.color }))} />
          <div className="space-y-1.5">
            {byType.map(t => (
              <div key={t.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-sm flex-shrink-0" style={{ background: t.color }} />
                  <span className="text-slate-600">{t.label}</span>
                </div>
                <span className="font-medium text-slate-900">{t.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Health Overview */}
        <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Health Overview</p>
          <SegBar segs={[
            { v: healthCounts.healthy  ?? 0, c: '#10b981' },
            { v: healthCounts.degraded ?? 0, c: '#f59e0b' },
            { v: healthCounts.error    ?? 0, c: '#ef4444' },
            { v: healthCounts.inactive ?? 0, c: '#94a3b8' },
          ]} />
          <div className="space-y-1.5">
            {([
              { label: 'Healthy / Active',    color: '#10b981', key: 'healthy'  },
              { label: 'Degraded / Warning',  color: '#f59e0b', key: 'degraded' },
              { label: 'Unhealthy / Error',   color: '#ef4444', key: 'error'    },
              { label: 'Unknown / Inactive',  color: '#94a3b8', key: 'inactive' },
            ] as const).map(row => (
              <div key={row.key} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-sm flex-shrink-0" style={{ background: row.color }} />
                  <span className="text-slate-600">{row.label}</span>
                </div>
                <span className="font-medium text-slate-900">{healthCounts[row.key] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By Site */}
        <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">By Site</p>
          <div className="space-y-2.5 pt-0.5">
            {bySite.map(([site, count]) => (
              <div key={site} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 truncate max-w-[150px]">{site}</span>
                  <span className="font-medium text-slate-900">{count}</span>
                </div>
                <HBar value={count} max={maxSite} color="#6366f1" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filter Buttons + Search ───────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="relative mr-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or ID…"
            className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 w-52"
          />
        </div>
        {FILTER_TYPES.map(t => {
          const count = t === 'All' ? allRows.length : allRows.filter(r => r.resourceType === t).length
          return (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                typeFilter === t
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              {t === 'All' ? `All (${count})` : `${PLURAL_LABELS[t]} (${count})`}
            </button>
          )
        })}
      </div>

      {/* ── Table ────────────────────────────────────────────── */}
      <div className="rounded-lg border border-slate-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-[100px]">ID</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Health</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Site</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(row => {
              const isClickable = row.resourceType === 'Asset' || row.resourceType === 'Device'
              return (
              <TableRow
                key={row.id}
                className={`transition-colors ${isClickable ? 'cursor-pointer hover:bg-slate-50/80' : 'hover:bg-slate-50/60'}`}
                onClick={() => {
                  if (row.resourceType === 'Asset') onAssetSelect?.(row.id)
                  else if (row.resourceType === 'Device') onDeviceSelect?.(row.id)
                }}
              >
                <TableCell className="font-mono text-xs text-slate-500">{row.id}</TableCell>
                <TableCell className="font-medium text-sm text-slate-900">{row.name}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${ALL_RESOURCE_TYPE_STYLES[row.resourceType]}`}>
                    {row.resourceType}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={statusBadgeLabel(row.resourceType, row.rawStatus)} />
                </TableCell>
                <TableCell className="text-sm text-slate-600">{row.site}</TableCell>
                <TableCell className="text-xs text-slate-400">{row.lastSeen}</TableCell>
                {isClickable && (
                  <TableCell className="text-right pr-3 w-6">
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                  </TableCell>
                )}
              </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  )
}

/* ─── Assets View ────────────────────────────────────────────── */

const ASSET_STATUSES = ['Available', 'Degraded', 'Unhealthy', 'Unknown']
const ASSET_MANUFACTURERS = [...new Set(mockAssets.map(a => a.manufacturer))].sort()
const ASSET_FIRMWARE_VERSIONS = [...new Set(mockAssets.map(a => a.firmware).filter(f => f !== '—'))].sort()
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

/** Reusable multi-select filter dropdown used by AssetsView & DevicesView. */
function mkDropdown<T extends string>(
  label: string, open: boolean, setOpen: (v: boolean) => void,
  ref: React.RefObject<HTMLDivElement>, searchVal: string, setSearch: (v: string) => void,
  options: T[], values: Set<T>, toggle: (v: T) => void, clear: () => void,
  mono = false
) {
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
          values.size > 0 ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:bg-muted/50'
        }`}
      >
        {label}
        {values.size > 0 && (
          <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold leading-none"
            onClick={e => { e.stopPropagation(); clear() }} title="Clear">×</span>
        )}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ duration: 0.12 }}
            className="absolute left-0 top-full mt-1 z-30 w-56 rounded-lg border bg-white shadow-lg">
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <input autoFocus placeholder="Search…" value={searchVal} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-6 pr-2 py-1 text-xs rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-300" />
              </div>
            </div>
            <div className="py-1 max-h-52 overflow-y-auto">
              {options.length === 0
                ? <p className="px-3 py-2 text-xs text-muted-foreground">No matches.</p>
                : options.map(v => (
                  <label key={v} className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-muted/50 cursor-pointer">
                    <input type="checkbox" checked={values.has(v)} onChange={() => toggle(v)} className="h-3.5 w-3.5 rounded border-slate-300 cursor-pointer" />
                    <span className={`text-xs${mono ? ' font-mono' : ''}`}>{v}</span>
                  </label>
                ))}
            </div>
            {values.size > 0 && (
              <div className="border-t p-2">
                <button onClick={clear} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center">Clear selection</button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function AssetsView({ initialSearch = '', onRunJob, onAssetSelect }: { initialSearch?: string; onRunJob?: (ids: string[], names: Record<string, string>) => void; onAssetSelect?: (id: string) => void }) {
  const [search, setSearch] = useState(initialSearch)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  // Health multi-select
  const [statusValues, setStatusValues] = useState<Set<string>>(new Set())
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const [statusSearch, setStatusSearch] = useState('')
  const statusDropdownRef = useRef<HTMLDivElement>(null)
  // Manufacturer multi-select
  const [mfrValues, setMfrValues] = useState<Set<string>>(new Set())
  const [mfrDropdownOpen, setMfrDropdownOpen] = useState(false)
  const [mfrSearch, setMfrSearch] = useState('')
  const mfrDropdownRef = useRef<HTMLDivElement>(null)
  // Firmware multi-select
  const [fwValues, setFwValues] = useState<Set<string>>(new Set())
  const [fwDropdownOpen, setFwDropdownOpen] = useState(false)
  const [fwSearch, setFwSearch] = useState('')
  const fwDropdownRef = useRef<HTMLDivElement>(null)

  const [sort, setSort] = useState({ field: 'id', dir: 'asc' })
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [actionDone, setActionDone] = useState<string | null>(null)
  function confirmAction() {
    const n = selected.size
    const label = DEVICE_ACTIONS.find(a => a.id === pendingAction)?.label ?? pendingAction ?? ''
    setPendingAction(null)
    setSelected(new Set())
    setActionDone(`${label} applied to ${n} asset${n !== 1 ? 's' : ''}.`)
    setTimeout(() => setActionDone(null), 3000)
  }

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) setStatusDropdownOpen(false)
      if (mfrDropdownRef.current && !mfrDropdownRef.current.contains(e.target as Node)) setMfrDropdownOpen(false)
      if (fwDropdownRef.current && !fwDropdownRef.current.contains(e.target as Node)) setFwDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredStatusOptions = ASSET_STATUSES.filter(v => v.toLowerCase().includes(statusSearch.toLowerCase()))
  const filteredMfrOptions = ASSET_MANUFACTURERS.filter(v => v.toLowerCase().includes(mfrSearch.toLowerCase()))
  const filteredFwOptions = ASSET_FIRMWARE_VERSIONS.filter(v => v.toLowerCase().includes(fwSearch.toLowerCase()))

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
    if (statusValues.size > 0) rows = rows.filter(a => statusValues.has(a.status))
    if (mfrValues.size > 0) rows = rows.filter(a => mfrValues.has(a.manufacturer))
    if (fwValues.size > 0) rows = rows.filter(a => fwValues.has(a.firmware))
    return [...rows].sort((a, b) => {
      const av = (a as Record<string, string>)[sort.field] ?? ''
      const bv = (b as Record<string, string>)[sort.field] ?? ''
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [search, statusValues, mfrValues, fwValues, sort])

  function toggleSort(field: string) {
    setSort(s => s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' })
  }

  const statusLabel = statusValues.size === 0 ? 'Health' : statusValues.size === 1 ? [...statusValues][0] : `${statusValues.size} statuses`
  const mfrLabel = mfrValues.size === 0 ? 'Manufacturer' : mfrValues.size === 1 ? [...mfrValues][0] : `${mfrValues.size} selected`
  const fwLabel = fwValues.size === 0 ? 'Firmware version' : fwValues.size === 1 ? [...fwValues][0] : `${fwValues.size} versions`

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
          {mkDropdown(statusLabel, statusDropdownOpen, setStatusDropdownOpen, statusDropdownRef, statusSearch, setStatusSearch, filteredStatusOptions, statusValues, (v) => setStatusValues(p => { const n = new Set(p); n.has(v) ? n.delete(v) : n.add(v); return n }), () => setStatusValues(new Set()))}
          {mkDropdown(mfrLabel, mfrDropdownOpen, setMfrDropdownOpen, mfrDropdownRef, mfrSearch, setMfrSearch, filteredMfrOptions, mfrValues, (v) => setMfrValues(p => { const n = new Set(p); n.has(v) ? n.delete(v) : n.add(v); return n }), () => setMfrValues(new Set()))}
          {mkDropdown(fwLabel, fwDropdownOpen, setFwDropdownOpen, fwDropdownRef, fwSearch, setFwSearch, filteredFwOptions, fwValues, (v) => setFwValues(p => { const n = new Set(p); n.has(v) ? n.delete(v) : n.add(v); return n }), () => setFwValues(new Set()), true)}
          <span className="ml-auto text-xs text-muted-foreground">
            {filtered.length.toLocaleString()} of {namespace.totalAssets.toLocaleString()}
          </span>
        </div>
        <AnimatePresence>
          {selected.size > 0 && !pendingAction && !actionDone && (
            <motion.div
              key="action-bar"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <span className="text-xs font-medium text-slate-700 mr-1">{selected.size} selected</span>
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
              {onRunJob && (
                <button
                  onClick={() => { const names = Object.fromEntries([...selected].map(id => [id, mockAssets.find(a => a.id === id)?.name ?? id])); onRunJob([...selected], names); setSelected(new Set()) }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-white hover:border-slate-400"
                >
                  <Play className="h-3 w-3" />
                  Run Job
                </button>
              )}
              <button
                onClick={() => setSelected(new Set())}
                className="ml-auto rounded-md p-1 text-slate-400 hover:text-slate-700 transition-colors"
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
                Apply <span className="font-semibold">{DEVICE_ACTIONS.find(a => a.id === pendingAction)?.label}</span> to {selected.size} asset{selected.size !== 1 ? 's' : ''}?
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
        <div className="rounded-lg border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 pr-0">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && filtered.every(a => selected.has(a.id))}
                    ref={el => { if (el) el.indeterminate = !filtered.every(a => selected.has(a.id)) && filtered.some(a => selected.has(a.id)) }}
                    onChange={() => {
                      const allSel = filtered.every(a => selected.has(a.id))
                      setSelected(s => { const n = new Set(s); filtered.forEach(a => allSel ? n.delete(a.id) : n.add(a.id)); return n })
                    }}
                    className="h-4 w-4 rounded border-slate-300 cursor-pointer"
                  />
                </TableHead>
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
                  <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                    No assets match your filters.
                  </TableCell>
                </TableRow>
              ) : filtered.map(a => (
                <TableRow key={a.id} className={`cursor-pointer hover:bg-slate-50/80 ${selected.has(a.id) ? 'bg-blue-50/50' : ''}`} onClick={() => onAssetSelect?.(a.id)}>
                  <TableCell className="pr-0" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(a.id)}
                      onChange={() => setSelected(s => { const n = new Set(s); n.has(a.id) ? n.delete(a.id) : n.add(a.id); return n })}
                      className="h-4 w-4 rounded border-slate-300 cursor-pointer"
                    />
                  </TableCell>
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
const DEVICE_FIRMWARE_VERSIONS = [...new Set(mockDevices.map(d => d.firmware).filter(f => f !== '\u2014'))].sort()
const DEVICE_MANUFACTURERS = [...new Set(mockDevices.map(d => d.manufacturer))].sort()
const DEVICE_MODELS = [...new Set(mockDevices.map(d => d.model))].sort()
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

function DevicesView({ initialSearch = '', initialFirmwareFilter = '', initialGroupFilter = '', onFirmwareSelect, onRunJob, onDeviceSelect, onClearGroupFilter }: { initialSearch?: string; initialFirmwareFilter?: string; initialGroupFilter?: string; onFirmwareSelect?: (version: string) => void; onRunJob?: (ids: string[], names: Record<string, string>) => void; onDeviceSelect?: (id: string) => void; onClearGroupFilter?: () => void }) {
  const [search, setSearch] = useState(initialSearch)
  // Status multi-select
  const [statusValues, setStatusValues] = useState<Set<string>>(new Set())
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const [statusSearch, setStatusSearch] = useState('')
  const statusDropdownRef = useRef<HTMLDivElement>(null)
  // Manufacturer multi-select
  const [mfrValues, setMfrValues] = useState<Set<string>>(new Set())
  const [mfrDropdownOpen, setMfrDropdownOpen] = useState(false)
  const [mfrSearch, setMfrSearch] = useState('')
  const mfrDropdownRef = useRef<HTMLDivElement>(null)
  // Model multi-select
  const [modelValues, setModelValues] = useState<Set<string>>(new Set())
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false)
  const [modelSearch, setModelSearch] = useState('')
  const modelDropdownRef = useRef<HTMLDivElement>(null)
  // Connectivity multi-select
  const [connectivityValues, setConnectivityValues] = useState<Set<string>>(new Set())
  const [connDropdownOpen, setConnDropdownOpen] = useState(false)
  const [connSearch, setConnSearch] = useState('')
  const connDropdownRef = useRef<HTMLDivElement>(null)
  // Firmware multi-select
  const [firmwareVersions, setFirmwareVersions] = useState<Set<string>>(() => {
    if (!initialFirmwareFilter) return new Set()
    const v = initialFirmwareFilter.startsWith('v') ? initialFirmwareFilter : `v${initialFirmwareFilter}`
    return new Set([v])
  })
  const [fwDropdownOpen, setFwDropdownOpen] = useState(false)
  const [fwSearch, setFwSearch] = useState('')
  const fwDropdownRef = useRef<HTMLDivElement>(null)

  const [sort, setSort] = useState({ field: 'id', dir: 'asc' })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [actionDone, setActionDone] = useState<string | null>(null)

  // Close any dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) setStatusDropdownOpen(false)
      if (mfrDropdownRef.current && !mfrDropdownRef.current.contains(e.target as Node)) setMfrDropdownOpen(false)
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) setModelDropdownOpen(false)
      if (connDropdownRef.current && !connDropdownRef.current.contains(e.target as Node)) setConnDropdownOpen(false)
      if (fwDropdownRef.current && !fwDropdownRef.current.contains(e.target as Node)) setFwDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredStatusOptions = DEVICE_STATUSES_FILTER.filter(v => v.toLowerCase().includes(statusSearch.toLowerCase()))
  const filteredMfrOptions = DEVICE_MANUFACTURERS.filter(v => v.toLowerCase().includes(mfrSearch.toLowerCase()))
  const filteredModelOptions = DEVICE_MODELS.filter(v => v.toLowerCase().includes(modelSearch.toLowerCase()))
  const filteredConnOptions = CONNECTIVITY_OPTIONS.filter(v => v.toLowerCase().includes(connSearch.toLowerCase()))
  const filteredFwOptions = DEVICE_FIRMWARE_VERSIONS.filter(v => v.toLowerCase().includes(fwSearch.toLowerCase()))

  const activeGroup = initialGroupFilter ? mockGroups.find(g => g.id === initialGroupFilter) : undefined

  const filtered = useMemo(() => {
    let rows = mockDevices
    // Group pre-filter
    if (initialGroupFilter) {
      const grp = mockGroups.find(g => g.id === initialGroupFilter)
      if (grp?.criteria) {
        if (grp.criteria.type) rows = rows.filter(d => d.type === grp.criteria.type)
        if (grp.criteria.site) rows = rows.filter(d => d.site === grp.criteria.site)
        if (grp.criteria.manufacturer) rows = rows.filter(d => d.manufacturer === grp.criteria.manufacturer)
        if (grp.criteria.status) rows = rows.filter(d => d.status === grp.criteria.status)
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(d =>
        d.id.toLowerCase().includes(q) || d.name.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q) || d.hub.toLowerCase().includes(q) ||
        d.site.toLowerCase().includes(q) || d.manufacturer.toLowerCase().includes(q) ||
        d.model.toLowerCase().includes(q)
      )
    }
    if (statusValues.size > 0) rows = rows.filter(d => statusValues.has(d.status))
    if (mfrValues.size > 0) rows = rows.filter(d => mfrValues.has(d.manufacturer))
    if (modelValues.size > 0) rows = rows.filter(d => modelValues.has(d.model))
    if (connectivityValues.size > 0) rows = rows.filter(d => connectivityValues.has(d.connectivity))
    if (firmwareVersions.size > 0) rows = rows.filter(d => firmwareVersions.has(d.firmware))
    return [...rows].sort((a, b) => {
      const av = (a as Record<string, string>)[sort.field] ?? ''
      const bv = (b as Record<string, string>)[sort.field] ?? ''
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [search, statusValues, mfrValues, modelValues, connectivityValues, firmwareVersions, sort])

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

  function toggleFwVersion(v: string) {
    setFirmwareVersions(prev => { const n = new Set(prev); n.has(v) ? n.delete(v) : n.add(v); return n })
  }
  function toggleStatusValue(v: string) {
    setStatusValues(prev => { const n = new Set(prev); n.has(v) ? n.delete(v) : n.add(v); return n })
  }
  function toggleMfrValue(v: string) {
    setMfrValues(prev => { const n = new Set(prev); n.has(v) ? n.delete(v) : n.add(v); return n })
  }
  function toggleModelValue(v: string) {
    setModelValues(prev => { const n = new Set(prev); n.has(v) ? n.delete(v) : n.add(v); return n })
  }
  function toggleConnValue(v: string) {
    setConnectivityValues(prev => { const n = new Set(prev); n.has(v) ? n.delete(v) : n.add(v); return n })
  }

  function confirmAction() {
    const n = selectionCount
    const label = DEVICE_ACTIONS.find(a => a.id === pendingAction)?.label ?? pendingAction ?? ''
    setPendingAction(null)
    setSelected(new Set())
    setActionDone(`${label} applied to ${n} device${n !== 1 ? 's' : ''}.`)
    setTimeout(() => setActionDone(null), 3000)
  }

  const statusLabel = statusValues.size === 0 ? 'Health' : statusValues.size === 1 ? [...statusValues][0] : `${statusValues.size} statuses`
  const mfrLabel = mfrValues.size === 0 ? 'Manufacturer' : mfrValues.size === 1 ? [...mfrValues][0] : `${mfrValues.size} selected`
  const modelLabel = modelValues.size === 0 ? 'Model' : modelValues.size === 1 ? [...modelValues][0] : `${modelValues.size} selected`
  const connLabel = connectivityValues.size === 0 ? 'Connectivity' : connectivityValues.size === 1 ? [...connectivityValues][0] : `${connectivityValues.size} selected`
  const fwLabel = firmwareVersions.size === 0 ? 'Firmware version' : firmwareVersions.size === 1 ? [...firmwareVersions][0] : `${firmwareVersions.size} versions`

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-8"
    >
      <SubViewHeader title="Devices" count={namespace.totalDevices} subtitle="Texas-Wind-Namespace" />
      {activeGroup && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-800">
          <Filter className="h-4 w-4 shrink-0 text-blue-500" />
          Filtered by group: <span className="font-semibold">{activeGroup.name}</span>
          <span className="text-blue-500 ml-1">· {filtered.length} matching devices</span>
          <button
            onClick={() => onClearGroupFilter?.()}
            className="ml-auto flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-300 hover:bg-blue-100 transition-colors"
          >
            <X className="h-3 w-3" />Clear filter
          </button>
        </div>
      )}
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
          {mkDropdown(statusLabel, statusDropdownOpen, setStatusDropdownOpen, statusDropdownRef, statusSearch, setStatusSearch, filteredStatusOptions, statusValues, toggleStatusValue, () => setStatusValues(new Set()))}
          {mkDropdown(mfrLabel, mfrDropdownOpen, setMfrDropdownOpen, mfrDropdownRef, mfrSearch, setMfrSearch, filteredMfrOptions, mfrValues, toggleMfrValue, () => setMfrValues(new Set()))}
          {mkDropdown(modelLabel, modelDropdownOpen, setModelDropdownOpen, modelDropdownRef, modelSearch, setModelSearch, filteredModelOptions, modelValues, toggleModelValue, () => setModelValues(new Set()), true)}
          {mkDropdown(connLabel, connDropdownOpen, setConnDropdownOpen, connDropdownRef, connSearch, setConnSearch, filteredConnOptions, connectivityValues, toggleConnValue, () => setConnectivityValues(new Set()))}
          {mkDropdown(fwLabel, fwDropdownOpen, setFwDropdownOpen, fwDropdownRef, fwSearch, setFwSearch, filteredFwOptions, firmwareVersions, toggleFwVersion, () => setFirmwareVersions(new Set()), true)}
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
              {onRunJob && (
                <button
                  onClick={() => { const names = Object.fromEntries([...selected].map(id => [id, mockDevices.find(d => d.id === id)?.name ?? id])); onRunJob([...selected], names); setSelected(new Set()) }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-white hover:border-slate-400"
                >
                  <Play className="h-3 w-3" />
                  Run Job
                </button>
              )}
              <button
                onClick={() => setSelected(new Set())}
                className="ml-auto rounded-md p-1 text-slate-400 hover:text-slate-700 transition-colors"
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
                    className={`cursor-pointer hover:bg-slate-50/80 ${isSelected ? 'bg-blue-50/50' : ''}`}
                    onClick={() => onDeviceSelect?.(d.id)}
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
                    <TableCell>
                      {d.firmware && d.firmware !== '\u2014' && onFirmwareSelect ? (
                        <button
                          onClick={e => { e.stopPropagation(); onFirmwareSelect(d.firmware.startsWith('v') ? d.firmware.slice(1) : d.firmware) }}
                          className="font-mono text-xs text-blue-600 hover:text-blue-800 hover:underline underline-offset-2 transition-colors"
                        >{d.firmware}</button>
                      ) : (
                        <span className="font-mono text-xs">{d.firmware}</span>
                      )}
                    </TableCell>
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
      {/* AIO charts */}
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

/* ─── Vertical Bar Chart (for Binary Hardening) ─────────────── */

function VBarChart({ data, total }: { data: { label: string; value: number }[]; total: number }) {
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

/* ─── Firmware Detail View ───────────────────────────────────── */

const FW_TABS = ['Overview', 'Weaknesses', 'Software Components', 'Binary Hardening', 'Certificates', 'Password Hashes', 'Keys'] as const
type FwTab = typeof FW_TABS[number]

const severityColor: Record<string, string> = {
  Critical: '#dc2626', High: '#f97316', Medium: '#f59e0b', Low: '#94a3b8',
}
const severityBg: Record<string, string> = {
  Critical: 'bg-red-600 text-white', High: 'bg-orange-500 text-white',
  Medium: 'bg-amber-100 text-amber-700 border border-amber-200',
  Low: 'bg-slate-100 text-slate-500 border border-slate-200',
}

function FirmwareDetailView({ version, onBack, onDevicesClick, onAssetsClick }: {
  version: string
  onBack: () => void
  onDevicesClick?: (version: string, manufacturer: string) => void
  onAssetsClick?: (manufacturer: string) => void
}) {
  const [activeTab, setActiveTab] = useState<FwTab>('Overview')
  const fw = firmwareImages.find(f => f.version === version)
  const detail = firmwareDetailData[version]
  if (!fw || !detail) return null

  const totalCves = detail.cvesBySeverity.critical + detail.cvesBySeverity.high + detail.cvesBySeverity.medium + detail.cvesBySeverity.low
  const cveSeveritySegments = [
    { label: 'Critical', value: detail.cvesBySeverity.critical, color: '#dc2626' },
    { label: 'High', value: detail.cvesBySeverity.high, color: '#f97316' },
    { label: 'Medium', value: detail.cvesBySeverity.medium, color: '#f59e0b' },
    { label: 'Low', value: detail.cvesBySeverity.low, color: '#94a3b8' },
  ].filter(s => s.value > 0)

  const keySegments = [
    { label: 'Private Keys', value: detail.keys.private, color: '#0ea5e9' },
    { label: 'Public Keys', value: detail.keys.public, color: '#1e3a5f' },
  ]

  const certTotal = detail.certificates.expired + detail.certificates.expiringSoon + detail.certificates.valid
  const certExpiredPct = certTotal > 0 ? (detail.certificates.expired / certTotal) * 100 : 0
  const certExpiringSoonPct = certTotal > 0 ? (detail.certificates.expiringSoon / certTotal) * 100 : 0
  const certValidPct = certTotal > 0 ? (detail.certificates.valid / certTotal) * 100 : 0

  const binaryData = [
    { label: 'NX', value: detail.binaryHardening.nx },
    { label: 'PIE', value: detail.binaryHardening.pie },
    { label: 'RELRO', value: detail.binaryHardening.relro },
    { label: 'Canary', value: detail.binaryHardening.canary },
    { label: 'Stripped', value: detail.binaryHardening.stripped },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Breadcrumb + header */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Firmware Analysis
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{fw.file}</h1>
          <span className="inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-medium text-slate-600">v{fw.version}</span>
          {fw.cves.critical > 0 && (
            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
              {fw.cves.critical} Critical
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5 flex-wrap">
          <span>{fw.manufacturer}</span>
          <span className="text-slate-300">·</span>
          <span>{fw.model}</span>
          <span className="text-slate-300">·</span>
          <button
            onClick={() => onDevicesClick?.(fw.version, fw.manufacturer)}
            className="text-blue-600 hover:text-blue-800 hover:underline underline-offset-2 transition-colors"
          >{fw.devicesAffected.toLocaleString()} devices</button>
          <span className="text-slate-300">·</span>
          <button
            onClick={() => onAssetsClick?.(fw.manufacturer)}
            className="text-blue-600 hover:text-blue-800 hover:underline underline-offset-2 transition-colors"
          >{fw.assetsAffected.toLocaleString()} assets</button>
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {FW_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >{tab}</button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Weaknesses */}
          <Card className="shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm font-semibold mb-1">Weaknesses</p>
              <p className="text-3xl font-bold mb-1">{totalCves}</p>
              <p className="text-xs text-muted-foreground mb-4">Total CVEs</p>
              {cveSeveritySegments.length > 0 ? (
                <DonutChart segments={cveSeveritySegments} centerLabel="CVEs" legendBelow />
              ) : (
                <p className="text-sm text-emerald-600 font-medium py-4 text-center">Clean — no known CVEs</p>
              )}
              <button className="mt-4 text-xs text-blue-600 hover:underline" onClick={() => setActiveTab('Weaknesses')}>
                Weaknesses &gt;
              </button>
            </CardContent>
          </Card>

          {/* Binary Hardening */}
          <Card className="shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm font-semibold mb-1">Binary Hardening</p>
              <p className="text-3xl font-bold mb-1">{detail.binaryHardening.total}</p>
              <p className="text-xs text-muted-foreground mb-4">Total binaries</p>
              <VBarChart data={binaryData} total={detail.binaryHardening.total} />
              <button className="mt-4 text-xs text-blue-600 hover:underline" onClick={() => setActiveTab('Binary Hardening')}>
                Binary hardening &gt;
              </button>
            </CardContent>
          </Card>

          {/* Keys */}
          <Card className="shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm font-semibold mb-1">Keys</p>
              <div className="flex gap-5 mb-4">
                <div><p className="text-3xl font-bold">{detail.keys.total}</p><p className="text-xs text-muted-foreground">Total keys</p></div>
                {detail.keys.pairedKeys > 0 && <div><p className="text-3xl font-bold text-amber-600">{detail.keys.pairedKeys}</p><p className="text-xs text-muted-foreground">Paired keys</p></div>}
                {detail.keys.shortKeySize > 0 && <div><p className="text-3xl font-bold text-red-600">{detail.keys.shortKeySize}</p><p className="text-xs text-muted-foreground">Short key size</p></div>}
              </div>
              {keySegments.every(s => s.value > 0) && (
                <DonutChart segments={keySegments} centerLabel="Keys" />
              )}
              <button className="mt-4 text-xs text-blue-600 hover:underline" onClick={() => setActiveTab('Keys')}>
                Keys &gt;
              </button>
            </CardContent>
          </Card>

          {/* Software Components */}
          <Card className="shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm font-semibold mb-1">Software components</p>
              <p className="text-3xl font-bold mb-1">{detail.softwareComponents.length}</p>
              <p className="text-xs text-muted-foreground mb-4">Total components</p>
              <div className="space-y-0">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5 px-0.5">
                  <span>Top components by CVE</span><span>CVEs</span>
                </div>
                {detail.softwareComponents.slice(0, 4).map(c => (
                  <div key={c.name} className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm">
                    <span className="text-foreground">{c.name}</span>
                    <span className="font-mono tabular-nums text-xs">{c.cves}</span>
                  </div>
                ))}
              </div>
              <button className="mt-3 text-xs text-blue-600 hover:underline" onClick={() => setActiveTab('Software Components')}>
                Software components &gt;
              </button>
            </CardContent>
          </Card>

          {/* Certificates */}
          <Card className="shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm font-semibold mb-1">Certificates</p>
              <div className="flex gap-4 mb-4">
                <div><p className="text-3xl font-bold">{detail.certificates.total}</p><p className="text-xs text-muted-foreground">Total</p></div>
                {detail.certificates.weakSig > 0 && <div><p className="text-3xl font-bold text-red-600">{detail.certificates.weakSig}</p><p className="text-xs text-muted-foreground">Weak signature</p></div>}
                {detail.certificates.selfSigned > 0 && <div><p className="text-3xl font-bold text-amber-600">{detail.certificates.selfSigned}</p><p className="text-xs text-muted-foreground">Self signed</p></div>}
                {detail.certificates.shortKey > 0 && <div><p className="text-3xl font-bold text-orange-600">{detail.certificates.shortKey}</p><p className="text-xs text-muted-foreground">Short key size</p></div>}
              </div>
              <p className="text-xs text-muted-foreground mb-2">Certificate expiration status</p>
              <div className="flex h-3 w-full rounded-full overflow-hidden">
                {certExpiredPct > 0 && <div style={{ width: `${certExpiredPct}%`, backgroundColor: '#1e293b' }} />}
                {certExpiringSoonPct > 0 && <div style={{ width: `${certExpiringSoonPct}%`, backgroundColor: '#f97316' }} />}
                {certValidPct > 0 && <div style={{ width: `${certValidPct}%`, backgroundColor: '#0ea5e9' }} />}
              </div>
              <div className="flex gap-4 mt-2">
                {certExpiredPct > 0 && <div className="flex items-center gap-1 text-[11px] text-muted-foreground"><span className="h-2 w-2 rounded-sm bg-slate-900 shrink-0" />Expired</div>}
                {certExpiringSoonPct > 0 && <div className="flex items-center gap-1 text-[11px] text-muted-foreground"><span className="h-2 w-2 rounded-sm bg-orange-400 shrink-0" />Expiring Soon</div>}
                {certValidPct > 0 && <div className="flex items-center gap-1 text-[11px] text-muted-foreground"><span className="h-2 w-2 rounded-sm bg-sky-500 shrink-0" />Valid</div>}
              </div>
              <button className="mt-4 text-xs text-blue-600 hover:underline" onClick={() => setActiveTab('Certificates')}>
                Certificates &gt;
              </button>
            </CardContent>
          </Card>

          {/* Password Hashes */}
          <Card className="shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm font-semibold mb-1">Password hashes</p>
              <p className="text-3xl font-bold mb-1">{detail.passwordHashes.total}</p>
              <p className="text-xs text-muted-foreground mb-4">Total password hashes</p>
              <div className="space-y-0">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5 px-0.5">
                  <span>Top algorithms</span><span>Count</span>
                </div>
                {detail.passwordHashes.algorithms.map(a => (
                  <div key={a.name} className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm">
                    <span className="text-foreground">{a.name}</span>
                    <span className="font-mono tabular-nums text-xs">{a.count}</span>
                  </div>
                ))}
              </div>
              <button className="mt-3 text-xs text-blue-600 hover:underline" onClick={() => setActiveTab('Password Hashes')}>
                Password hashes &gt;
              </button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'Weaknesses' && (
        <div className="rounded-lg border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[140px]">CVE ID</TableHead>
                <TableHead className="w-[100px]">Severity</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.cves.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs font-medium">{c.id}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${severityBg[c.severity]}`}>{c.severity}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {activeTab === 'Software Components' && (
        <div className="rounded-lg border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Component</TableHead>
                <TableHead>Version</TableHead>
                <TableHead className="text-right">CVEs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.softwareComponents.map(c => (
                <TableRow key={c.name}>
                  <TableCell className="font-medium text-sm">{c.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{c.version}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{c.cves > 0 ? c.cves : <span className="text-emerald-600 text-xs">Clean</span>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {activeTab === 'Binary Hardening' && (
        <div className="rounded-lg border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Protection</TableHead>
                <TableHead className="text-right">Enabled</TableHead>
                <TableHead className="text-right">Total Binaries</TableHead>
                <TableHead className="text-right">Coverage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {binaryData.map(b => (
                <TableRow key={b.label}>
                  <TableCell className="font-medium text-sm">{b.label}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{b.value}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-muted-foreground">{detail.binaryHardening.total}</TableCell>
                  <TableCell className="text-right">
                    <span className={`text-sm font-medium ${b.value / detail.binaryHardening.total >= 0.8 ? 'text-emerald-600' : b.value / detail.binaryHardening.total >= 0.5 ? 'text-amber-600' : 'text-red-600'}`}>
                      {Math.round((b.value / detail.binaryHardening.total) * 100)}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {(activeTab === 'Certificates' || activeTab === 'Password Hashes' || activeTab === 'Keys') && (
        <div className="rounded-lg border bg-slate-50 p-10 text-center">
          <p className="text-sm font-medium text-slate-700">{activeTab}</p>
          <p className="text-sm text-muted-foreground mt-1">Detailed {activeTab.toLowerCase()} analysis view coming soon.</p>
        </div>
      )}
    </motion.div>
  )
}

/* ─── Firmware Analysis View ─────────────────────────────────── */

function FirmwareAnalysisView({ onFirmwareSelect, onVersionClick, onManufacturerClick, onModelClick }: {
  onFirmwareSelect?: (version: string) => void
  onVersionClick?: (version: string) => void
  onManufacturerClick?: (name: string) => void
  onModelClick?: (name: string) => void
}) {
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
          <HBarChart data={fwByManufacturer} onBarClick={onManufacturerClick} />
        </ChartCard>
        <ChartCard title="Affected Devices by Model">
          <HBarChart data={fwByModel} onBarClick={onModelClick} />
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
                    <TableCell>
                      <span className="font-mono text-xs">v{fw.version}</span>
                    </TableCell>
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
                      <button
                        onClick={() => onFirmwareSelect?.(fw.version)}
                        className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium text-blue-600 border-blue-200 hover:bg-blue-50 transition-colors"
                      >
                        <FileText className="h-3 w-3" />
                        Report
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
/* ─── OTA Management View ─────────────────────────────────── */

function OtaManagementView({ onFirmwareSelect, onDeploy }: {
  onFirmwareSelect?: (version: string) => void
  onDeploy?: (prefill: JobPrefill) => void
}) {
  const [images, setImages] = useState(() => [...firmwareImages])
  const [showUpload, setShowUpload] = useState(false)
  const [uploadDraft, setUploadDraft] = useState({ file: '', manufacturer: '', model: '', version: '' })

  const latestByModel = useMemo(() => {
    const map: Record<string, string> = {}
    images.forEach(f => { if (!map[f.model] || f.version > map[f.model]) map[f.model] = f.version })
    return map
  }, [images])

  const deviceBarData = useMemo(() =>
    images.map(f => ({
      label: `v${f.version} · ${f.model.replace(/([A-Z])/g, ' $1').trim().split(' ')[0]}`,
      value: f.devicesAffected,
      color: f.version === latestByModel[f.model] ? '#22c55e' : '#f97316',
    })).sort((a, b) => b.value - a.value),
    [images, latestByModel]
  )

  const assetBarData = useMemo(() =>
    images.map(f => ({
      label: `v${f.version} · ${f.model.replace(/([A-Z])/g, ' $1').trim().split(' ')[0]}`,
      value: f.assetsAffected,
      color: f.version === latestByModel[f.model] ? '#22c55e' : '#f97316',
    })).sort((a, b) => b.value - a.value),
    [images, latestByModel]
  )

  const totalCritical = images.reduce((s, f) => s + f.cves.critical, 0)
  const devicesNeedingUpdate = images.filter(f => f.version !== latestByModel[f.model]).reduce((s, f) => s + f.devicesAffected, 0)
  const devicesUpToDate = images.filter(f => f.version === latestByModel[f.model]).reduce((s, f) => s + f.devicesAffected, 0)

  function handleUpload() {
    if (!uploadDraft.file.trim() || !uploadDraft.version.trim()) return
    setImages(prev => [...prev, {
      file: uploadDraft.file,
      manufacturer: uploadDraft.manufacturer || GROUP_MANUFACTURERS[0],
      model: uploadDraft.model || 'Unknown',
      version: uploadDraft.version,
      cves: { critical: 0, high: 0, medium: 0, low: 0 },
      devicesAffected: 0,
      assetsAffected: 0,
    }])
    setUploadDraft({ file: '', manufacturer: '', model: '', version: '' })
    setShowUpload(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <SubViewHeader title="OTA Management" subtitle="Texas-Wind-Namespace" />
        <button
          onClick={() => onDeploy?.({ jobType: 'software-update' })}
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-700"
        >
          <Play className="h-3.5 w-3.5" />
          Deploy Update
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <HeroStat icon={Shield} label="Firmware Images" value={String(images.length)} />
        <HeroStat icon={CheckCircle2} label="Devices Up-to-Date" value={devicesUpToDate.toLocaleString()} />
        <HeroStat icon={RefreshCw} label="Devices Need Update" value={devicesNeedingUpdate.toLocaleString()} />
        <HeroStat icon={AlertTriangle} label="Critical CVEs" value={String(totalCritical)} />
      </div>

      {/* Distribution charts */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ChartCard title="Devices by Firmware Version">
          <HBarChart data={deviceBarData} />
        </ChartCard>
        <ChartCard title="Assets by Firmware Version">
          <HBarChart data={assetBarData} />
        </ChartCard>
      </div>

      {/* Firmware Library */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">Firmware Library</h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{images.length} images</span>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload Firmware
          </button>
        </div>
        <div className="rounded-lg border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Image File</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Vulnerabilities</TableHead>
                <TableHead className="text-right">Devices</TableHead>
                <TableHead className="text-right">Assets</TableHead>
                <TableHead className="w-[170px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {images.map(fw => {
                const isLatest = fw.version === latestByModel[fw.model]
                return (
                  <TableRow key={fw.file} className="hover:bg-slate-50/80">
                    <TableCell className="font-mono text-xs text-muted-foreground">{fw.file}</TableCell>
                    <TableCell className="text-sm">{fw.manufacturer}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{fw.model}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-xs">v{fw.version}</span>
                        {isLatest && (
                          <span className="inline-flex w-fit items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">Latest</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(fw.cves.critical + fw.cves.high + fw.cves.medium + fw.cves.low) === 0 ? (
                        <span className="text-xs text-emerald-600 font-medium">Clean</span>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {fw.cves.critical > 0 && (
                            <span className="relative inline-flex items-center">
                              <span className="absolute inset-0 rounded-md bg-red-500 animate-ping opacity-75" />
                              <span className="relative inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold bg-red-600 text-white">{fw.cves.critical} Critical</span>
                            </span>
                          )}
                          {fw.cves.high > 0 && <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold bg-orange-500 text-white">{fw.cves.high} High</span>}
                          {fw.cves.medium > 0 && <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-amber-100 text-amber-700 border border-amber-200">{fw.cves.medium} Medium</span>}
                          {fw.cves.low > 0 && <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">{fw.cves.low} Low</span>}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">{fw.devicesAffected.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{fw.assetsAffected.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onDeploy?.({ jobType: 'software-update' })}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-slate-700"
                        >
                          <Play className="h-3 w-3" />
                          Deploy
                        </button>
                        <button
                          onClick={() => onFirmwareSelect?.(fw.version)}
                          className="inline-flex items-center gap-1 rounded-md border border-blue-200 px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <FileText className="h-3 w-3" />
                          Analyze
                        </button>
                        <button
                          onClick={() => setImages(prev => prev.filter(f => f.file !== fw.file))}
                          className="rounded-md border border-slate-200 p-1 text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors"
                          title="Remove firmware image"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {images.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                    No firmware images. Upload one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Upload Firmware Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => setShowUpload(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-xl border bg-white shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b px-6 py-4">
                <div>
                  <h3 className="text-base font-semibold">Upload Firmware Image</h3>
                  <p className="text-xs text-muted-foreground">Add a new image to the firmware library</p>
                </div>
                <button onClick={() => setShowUpload(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"><X className="h-4 w-4" /></button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-medium cursor-pointer select-none hover:text-blue-600 transition-colors inline-flex items-center gap-1 group"
                    title="Click to fill"
                    onClick={() => setUploadDraft(d => ({ ...d, file: 'turbine-ctrl-x700-v3.3.0.bin' }))}
                  >File Name<span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-500 transition-opacity">← click to fill</span></label>
                  <Input value={uploadDraft.file} onChange={e => setUploadDraft(d => ({ ...d, file: e.target.value }))} placeholder="e.g. turbine-ctrl-x700-v3.3.0.bin" className="h-9 text-sm font-mono" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label
                      className="text-xs font-medium cursor-pointer select-none hover:text-blue-600 transition-colors inline-flex items-center gap-1 group"
                      title="Click to fill"
                      onClick={() => setUploadDraft(d => ({ ...d, manufacturer: 'Contoso Wind Systems' }))}
                    >Manufacturer<span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-500 transition-opacity">← click to fill</span></label>
                    <select value={uploadDraft.manufacturer} onChange={e => setUploadDraft(d => ({ ...d, manufacturer: e.target.value }))} className="flex h-9 w-full rounded-md border border-input bg-white px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                      <option value="">Select…</option>
                      {GROUP_MANUFACTURERS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label
                      className="text-xs font-medium cursor-pointer select-none hover:text-blue-600 transition-colors inline-flex items-center gap-1 group"
                      title="Click to fill"
                      onClick={() => setUploadDraft(d => ({ ...d, model: 'TurbineController-X700' }))}
                    >Model<span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-500 transition-opacity">← click to fill</span></label>
                    <select value={uploadDraft.model} onChange={e => setUploadDraft(d => ({ ...d, model: e.target.value }))} className="flex h-9 w-full rounded-md border border-input bg-white px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                      <option value="">Select…</option>
                      {['TurbineController-X700', 'AnemometerPro-2400', 'PitchController-5000', 'EdgeGateway-1900'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-medium cursor-pointer select-none hover:text-blue-600 transition-colors inline-flex items-center gap-1 group"
                    title="Click to fill"
                    onClick={() => setUploadDraft(d => ({ ...d, version: '3.3.0' }))}
                  >Version<span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-500 transition-opacity">← click to fill</span></label>
                  <Input value={uploadDraft.version} onChange={e => setUploadDraft(d => ({ ...d, version: e.target.value }))} placeholder="e.g. 3.3.0" className="h-9 text-sm font-mono" />
                </div>
              </div>
              <div className="flex items-center justify-between border-t px-6 py-4">
                <Button variant="outline" size="sm" onClick={() => setShowUpload(false)}>Cancel</Button>
                <Button size="sm" disabled={!uploadDraft.file.trim() || !uploadDraft.version.trim()} onClick={handleUpload}>
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Upload
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ─── Sensitivity Labels ─────────────────────────────────────── */

const SENSITIVITY_LABELS = [
  { label: 'Non-Business',        color: '#475569', bg: '#f8fafc', border: '#cbd5e1', locked: false },
  { label: 'Public',              color: '#166534', bg: '#f0fdf4', border: '#86efac', locked: false },
  { label: 'General',             color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd', locked: false },
  { label: 'Confidential',        color: '#c2410c', bg: '#fff7ed', border: '#fdba74', locked: true  },
  { label: 'Highly Confidential', color: '#991b1b', bg: '#fef2f2', border: '#fca5a5', locked: true  },
]

function SensitivitySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const opt = SENSITIVITY_LABELS.find(s => s.label === value) ?? SENSITIVITY_LABELS[2]
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors hover:opacity-90"
        style={{ backgroundColor: opt.bg, borderColor: opt.border, color: opt.color }}
      >
        {opt.locked
          ? <LockKeyhole className="h-3 w-3 shrink-0" />
          : <Shield className="h-3 w-3 shrink-0" />
        }
        <span className="text-slate-500 font-normal">Data Sensitivity</span>
        <span className="font-semibold">{opt.label}</span>
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-1 z-30 w-52 rounded-lg border bg-white shadow-lg py-1"
          >
            {SENSITIVITY_LABELS.map(s => (
              <button
                key={s.label}
                onClick={() => { onChange(s.label); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-50 transition-colors text-left"
              >
                {s.label === value
                  ? <span className="h-3.5 w-3.5 shrink-0 flex items-center justify-center rounded-full" style={{ backgroundColor: s.color }}><span className="h-1.5 w-1.5 rounded-full bg-white" /></span>
                  : <span className="h-3.5 w-3.5 shrink-0 rounded-full border-2" style={{ borderColor: s.border }} />
                }
                <span className="font-medium" style={{ color: s.color }}>{s.label}</span>
                {s.locked && <LockKeyhole className="h-3 w-3 ml-auto opacity-50" style={{ color: s.color }} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Asset Detail View ──────────────────────────────────────── */

const ASSET_MODEL_MAP: Record<string, string> = {
  'Turbine Controller': 'TurbineController-X700',
  'Anemometer': 'AnemometerPro-2400',
  'Pitch Controller': 'PitchController-5000',
  'Edge Gateway': 'EdgeGateway-1900',
}

function AssetDetailView({ assetId, onBack, onFirmwareSelect, onRunJob, onUpdateFirmware }: { assetId: string; onBack: () => void; onFirmwareSelect: (v: string) => void; onRunJob?: (ids: string[], names: Record<string, string>) => void; onUpdateFirmware?: (prefill: JobPrefill) => void }) {
  const asset = mockAssets.find(a => a.id === assetId)
  const [sensitivity, setSensitivity] = useState('General')
  if (!asset) return <div className="p-8 text-muted-foreground text-sm">Asset not found.</div>

  const fwVersion = asset.firmware.startsWith('v') ? asset.firmware.slice(1) : asset.firmware
  const fwData = firmwareDetailData[fwVersion]
  const model = ASSET_MODEL_MAP[asset.type] ?? asset.type
  const sevColor: Record<string, string> = { Critical: '#ef4444', High: '#f97316', Medium: '#f59e0b', Low: '#94a3b8' }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-6">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="rounded-lg p-1.5 hover:bg-slate-100 transition-colors text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-lg font-semibold">{asset.name}</h1>
          <p className="text-xs text-muted-foreground">{asset.id} · {asset.type}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SensitivitySelect value={sensitivity} onChange={setSensitivity} />
          <StatusBadge status={asset.status === 'Available' ? 'Healthy' : asset.status} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {DEVICE_ACTIONS.map(action => (
          <button
            key={action.id}
            onClick={action.id === 'update-firmware' && onUpdateFirmware
              ? () => onUpdateFirmware({
                  jobType: 'software-update',
                  jobName: `Firmware Update – ${asset.name}`,
                  startAtStep: 3,
                  preselectedIds: [asset.id],
                  preselectedSource: 'Assets',
                  preselectedNames: { [asset.id]: asset.name },
                })
              : undefined}
            className={`inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium shadow-sm transition-colors hover:bg-slate-50 ${action.cls}`}
          >
            <action.icon className="h-3.5 w-3.5" />
            {action.label}
          </button>
        ))}
        {onRunJob && (
          <button
            onClick={() => onRunJob([asset.id], { [asset.id]: asset.name })}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <Play className="h-3.5 w-3.5" />
            Run Job
          </button>
        )}
      </div>

      <div className="rounded-lg border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center gap-2">
          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Azure Resource Properties</p>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-4 py-4">
          {[
            { label: 'Resource Group',   value: 'rg-zava-southcentralus' },
            { label: 'Location',          value: 'South Central US' },
            { label: 'Subscription',      value: 'Zava Energy – Production' },
            { label: 'Subscription ID',   value: '47b2c901-9f3a-4d81-b628-3e51a0c74f22' },
            { label: 'Namespace',         value: 'Texas-Wind-Namespace' },
            { label: 'Site',              value: asset.site },
          ].map(p => (
            <div key={p.label} className="flex flex-col gap-0.5">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{p.label}</span>
              <span className="text-sm font-mono text-slate-700">{p.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center gap-2">
          <Drill className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Asset Properties</p>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-4 py-4">
          {[
            { label: 'Manufacturer', value: asset.manufacturer },
            { label: 'Model',         value: model },
            { label: 'Type',          value: asset.type },
          ].map(p => (
            <div key={p.label} className="flex flex-col gap-0.5">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{p.label}</span>
              <span className="text-sm font-mono text-slate-700">{p.value}</span>
            </div>
          ))}
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Software Version</span>
            {asset.firmware === '—' ? (
              <span className="text-sm font-mono text-slate-400">—</span>
            ) : (
              <button onClick={() => onFirmwareSelect(fwVersion)} className="text-sm font-mono text-blue-600 hover:underline text-left flex items-center gap-1">
                {asset.firmware}<ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Last Seen</span>
            <span className="text-sm text-slate-700">{asset.lastSeen}</span>
          </div>
        </div>
      </div>

      {fwData && (
        <div className="rounded-lg border border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">CVE Summary</p>
            </div>
            <button onClick={() => onFirmwareSelect(fwVersion)} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View vulnerability report<ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="px-4 py-4">
            <div className="grid grid-cols-4 gap-3 mb-4">
              {(['Critical', 'High', 'Medium', 'Low'] as const).map(s => {
                const sk = s.toLowerCase() as keyof typeof fwData.cvesBySeverity
                return (
                  <div key={s} className="rounded-lg border border-slate-100 p-3 text-center">
                    <p className="text-lg font-bold" style={{ color: sevColor[s] }}>{fwData.cvesBySeverity[sk]}</p>
                    <p className="text-xs text-muted-foreground">{s}</p>
                  </div>
                )
              })}
            </div>
            <div className="space-y-1.5">
              {fwData.cves.slice(0, 3).map(c => (
                <div key={c.id} className="flex items-start gap-2 text-sm">
                  <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: `${sevColor[c.severity]}20`, color: sevColor[c.severity] }}>{c.severity[0]}</span>
                  <span className="font-mono text-xs text-slate-500 shrink-0 pt-0.5">{c.id}</span>
                  <span className="text-xs text-muted-foreground">{c.description}</span>
                </div>
              ))}
              {fwData.cves.length > 3 && (
                <button onClick={() => onFirmwareSelect(fwVersion)} className="text-xs text-blue-600 hover:underline mt-1">
                  +{fwData.cves.length - 3} more CVEs → view vulnerability report
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

/* ─── Device Detail View ─────────────────────────────────────── */

function DeviceDetailView({ deviceId, onBack, onFirmwareSelect, onRunJob, onUpdateFirmware }: { deviceId: string; onBack: () => void; onFirmwareSelect: (v: string) => void; onRunJob?: (ids: string[], names: Record<string, string>) => void; onUpdateFirmware?: (prefill: JobPrefill) => void }) {
  const device = mockDevices.find(d => d.id === deviceId)
  const [sensitivity, setSensitivity] = useState('General')
  if (!device) return <div className="p-8 text-muted-foreground text-sm">Device not found.</div>

  const fwVersion = device.firmware.startsWith('v') ? device.firmware.slice(1) : device.firmware
  const fwData = fwVersion !== '—' ? firmwareDetailData[fwVersion] : undefined
  const sevColor: Record<string, string> = { Critical: '#ef4444', High: '#f97316', Medium: '#f59e0b', Low: '#94a3b8' }
  const isEdge = device.type === 'Edge Gateway'
  const outboundEndpoint = isEdge ? 'None' : `${device.hub}.azure-devices.net`
  const inboundEndpoint = isEdge ? `mqtts://${device.name}.westus2.azure-devices.net:8883` : 'None'

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-6">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="rounded-lg p-1.5 hover:bg-slate-100 transition-colors text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-lg font-semibold font-mono">{device.name}</h1>
          <p className="text-xs text-muted-foreground">{device.id} · {device.type}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SensitivitySelect value={sensitivity} onChange={setSensitivity} />
          <StatusBadge status={device.status} />
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${device.connectivity === 'Connected' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
            <Wifi className="h-3 w-3" />{device.connectivity}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {DEVICE_ACTIONS.map(action => (
          <button
            key={action.id}
            onClick={action.id === 'update-firmware' && onUpdateFirmware
              ? () => onUpdateFirmware({
                  jobType: 'software-update',
                  jobName: `Firmware Update – ${device.name}`,
                  startAtStep: 3,
                  preselectedIds: [device.id],
                  preselectedSource: 'Devices',
                  preselectedNames: { [device.id]: device.name },
                })
              : undefined}
            className={`inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium shadow-sm transition-colors hover:bg-slate-50 ${action.cls}`}
          >
            <action.icon className="h-3.5 w-3.5" />
            {action.label}
          </button>
        ))}
        {onRunJob && (
          <button
            onClick={() => onRunJob([device.id], { [device.id]: device.name })}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <Play className="h-3.5 w-3.5" />
            Run Job
          </button>
        )}
      </div>

      <div className="rounded-lg border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center gap-2">
          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Azure Resource Properties</p>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-4 py-4">
          {[
            { label: 'Resource Group',   value: 'rg-zava-southcentralus' },
            { label: 'Location',          value: 'South Central US' },
            { label: 'Subscription',      value: 'Zava Energy – Production' },
            { label: 'Subscription ID',   value: '47b2c901-9f3a-4d81-b628-3e51a0c74f22' },
            { label: 'Namespace',         value: 'Texas-Wind-Namespace' },
            { label: 'IoT Hub',           value: device.hub },
            { label: 'Site',              value: device.site },
            { label: 'Last Seen',         value: device.lastSeen },
          ].map(p => (
            <div key={p.label} className="flex flex-col gap-0.5">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{p.label}</span>
              <span className="text-sm font-mono text-slate-700">{p.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center gap-2">
          <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Device Properties</p>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-4 py-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Manufacturer</span>
            <span className="text-sm font-mono text-slate-700">{device.manufacturer}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Model</span>
            <span className="text-sm font-mono text-slate-700">{device.model}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Firmware Version</span>
            {device.firmware === '—' ? (
              <span className="text-sm font-mono text-slate-400">—</span>
            ) : (
              <button onClick={() => onFirmwareSelect(fwVersion)} className="text-sm font-mono text-blue-600 hover:underline text-left flex items-center gap-1">
                {device.firmware}<ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Type</span>
            <span className="text-sm font-mono text-slate-700">{device.type}</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center gap-2">
          <Network className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Endpoints</p>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-4 py-4">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Outbound Endpoint</span>
            {outboundEndpoint === 'None' ? (
              <span className="text-xs text-slate-400 italic">None</span>
            ) : (
              <span className="text-xs font-mono text-slate-700 break-all">{outboundEndpoint}</span>
            )}
            <span className="text-[10px] text-slate-400">{isEdge ? 'Edge gateways route outbound via local broker' : 'AMQP/MQTT to IoT Hub'}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Inbound Endpoint</span>
            {inboundEndpoint === 'None' ? (
              <span className="text-xs text-slate-400 italic">None</span>
            ) : (
              <span className="text-xs font-mono text-slate-700 break-all">{inboundEndpoint}</span>
            )}
            <span className="text-[10px] text-slate-400">{isEdge ? 'Accepts MQTT connections from leaf devices' : 'Leaf devices connect upstream to edge gateway'}</span>
          </div>
        </div>
      </div>

      {fwData && (
        <div className="rounded-lg border border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">CVE Summary</p>
            </div>
            <button onClick={() => onFirmwareSelect(fwVersion)} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View vulnerability report<ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="px-4 py-4">
            <div className="grid grid-cols-4 gap-3 mb-4">
              {(['Critical', 'High', 'Medium', 'Low'] as const).map(s => {
                const sk = s.toLowerCase() as keyof typeof fwData.cvesBySeverity
                return (
                  <div key={s} className="rounded-lg border border-slate-100 p-3 text-center">
                    <p className="text-lg font-bold" style={{ color: sevColor[s] }}>{fwData.cvesBySeverity[sk]}</p>
                    <p className="text-xs text-muted-foreground">{s}</p>
                  </div>
                )
              })}
            </div>
            <div className="space-y-1.5">
              {fwData.cves.slice(0, 3).map(c => (
                <div key={c.id} className="flex items-start gap-2 text-sm">
                  <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: `${sevColor[c.severity]}20`, color: sevColor[c.severity] }}>{c.severity[0]}</span>
                  <span className="font-mono text-xs text-slate-500 shrink-0 pt-0.5">{c.id}</span>
                  <span className="text-xs text-muted-foreground">{c.description}</span>
                </div>
              ))}
              {fwData.cves.length > 3 && (
                <button onClick={() => onFirmwareSelect(fwVersion)} className="text-xs text-blue-600 hover:underline mt-1">
                  +{fwData.cves.length - 3} more CVEs → view vulnerability report
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}