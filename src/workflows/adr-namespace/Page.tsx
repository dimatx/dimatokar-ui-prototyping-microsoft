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
  const [firmwareTarget, setFirmwareTarget] = useState<string | null>(null)
  const [devicePrefilter, setDevicePrefilter] = useState<string>('')
  const [deviceFirmwarePrefilter, setDeviceFirmwarePrefilter] = useState<string>('')
  const [assetPrefilter, setAssetPrefilter] = useState<string>('')

  const navigateTo = (id: string, opts?: { firmware?: string; deviceFilter?: string; firmwareVersionFilter?: string; assetFilter?: string }) => {
    setActiveMenuItem(id)
    setFirmwareTarget(opts?.firmware ?? null)
    setDevicePrefilter(opts?.deviceFilter ?? '')
    setDeviceFirmwarePrefilter(opts?.firmwareVersionFilter ?? '')
    setAssetPrefilter(opts?.assetFilter ?? '')
  }

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
        onItemClick={(id) => navigateTo(id)}
      />
      <div className="flex-1 min-w-0 pl-6">
      <AnimatePresence mode="wait">
      {activeMenuItem === 'assets' ? (
        <AssetsView key="assets" />
      ) : activeMenuItem === 'devices' ? (
        <DevicesView
          key={`devices-${devicePrefilter}-${deviceFirmwarePrefilter}`}
          initialSearch={devicePrefilter}
          initialFirmwareFilter={deviceFirmwarePrefilter}
          onFirmwareSelect={(v) => navigateTo('firmware', { firmware: v })}
        />
      ) : activeMenuItem === 'iot-hub' ? (
        <IotHubView key="iot-hub" hubs={linkedHubs} onAddHub={() => setShowHubPicker(true)} unlinkedCount={unlinkedHubs.length} />
      ) : activeMenuItem === 'iot-ops' ? (
        <IotOpsView key="iot-ops" />
      ) : activeMenuItem === 'firmware' && firmwareTarget ? (
        <FirmwareDetailView
          key={`fw-${firmwareTarget}`}
          version={firmwareTarget}
          onBack={() => setFirmwareTarget(null)}
          onDevicesClick={(v, mfr) => navigateTo('devices', { firmwareVersionFilter: `v${v}`, deviceFilter: mfr })}
          onAssetsClick={(mfr) => navigateTo('assets', { assetFilter: mfr })}
        />
      ) : activeMenuItem === 'firmware' ? (
        <FirmwareAnalysisView
          key="firmware"
          onFirmwareSelect={(v) => setFirmwareTarget(v)}
          onVersionClick={(v) => navigateTo('devices', { firmwareVersionFilter: v })}
          onManufacturerClick={(m) => navigateTo('devices', { deviceFilter: m })}
          onModelClick={(m) => navigateTo('devices', { deviceFilter: m })}
        />
      ) : activeMenuItem === 'jobs' ? (
        <JobsView key="jobs" jobs={jobs} setJobs={setJobs} expandedJobId={expandedJobId} setExpandedJobId={setExpandedJobId} showNewJobWizard={showNewJobWizard} setShowNewJobWizard={setShowNewJobWizard} linkedHubs={linkedHubs} aioInstances={aioInstances} namespaceSvcs={namespaceSvcs} />
      ) : activeMenuItem === 'credentials' ? (
        <PlaceholderView key="credentials" title="Credentials" description="Manage device certificates and credentials stored in this namespace. Assign credentials to devices, rotate keys, and set expiry policies." icon={KeyRound} />
      ) : activeMenuItem === 'policies' ? (
        <PlaceholderView key="policies" title="Policies" description="Define access control and compliance policies for devices and assets in this namespace. Control what operations are allowed and under which conditions." icon={FileText} />
      ) : activeMenuItem === 'provisioning' ? (
        <PlaceholderView key="provisioning" title="Provisioning" description="Configure device provisioning rules and enrollment groups. Connect to IoT Hub Device Provisioning Service instances linked to this namespace." icon={Upload} />
      ) : activeMenuItem === 'cert-mgmt' ? (
        <PlaceholderView key="cert-mgmt" title="Certificate Management" description="Manage the certificate authority (CA) hierarchy for this namespace. Issue, renew, and revoke device certificates at scale." icon={Shield} />
      ) : activeMenuItem === 'groups' ? (
        <PlaceholderView key="groups" title="Groups" description="Organize devices and assets into groups for targeted operations such as firmware updates, configuration pushes, and policy assignments." icon={Users} />
      ) : activeMenuItem === 'device-update' ? (
        <PlaceholderView key="device-update" title="Device Update" description="Manage over-the-air (OTA) firmware and software update deployments across device groups. Powered by Azure Device Update for IoT Hub." icon={RefreshCw} />
      ) : activeMenuItem === '3p' ? (
        <PlaceholderView key="3p" title="3P Capability" description="Integrate third-party extensions and partner solutions into this namespace. Extend ADR with custom capabilities registered via the Azure Marketplace." icon={Puzzle} />
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
                navigateTo('iot-hub')
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

function PlaceholderView({ title, description, icon: Icon }: { title: string; description: string; icon: React.ElementType }) {
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
      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
        Coming soon
      </span>
    </motion.div>
  )
}

/* ─── Sort Icon ─────────────────────────────────────────────── */

function SortIcon({ field, sort }: { field: string; sort: { field: string; dir: string } }) {
  if (sort.field !== field) return <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-70 transition-opacity" />
  return sort.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
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

function AssetsView({ initialSearch = '' }: { initialSearch?: string }) {
  const [search, setSearch] = useState(initialSearch)
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

function DevicesView({ initialSearch = '', initialFirmwareFilter = '', onFirmwareSelect }: { initialSearch?: string; initialFirmwareFilter?: string; onFirmwareSelect?: (version: string) => void }) {
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

  const filtered = useMemo(() => {
    let rows = mockDevices
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
          {/* Health multi-select dropdown */}
          <div className="relative" ref={statusDropdownRef}>
            <button
              onClick={() => { setStatusDropdownOpen(v => !v); setMfrDropdownOpen(false); setModelDropdownOpen(false); setConnDropdownOpen(false); setFwDropdownOpen(false) }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                statusValues.size > 0 ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:bg-muted/50'
              }`}
            >
              {statusLabel}
              {statusValues.size > 0 && (
                <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold leading-none"
                  onClick={e => { e.stopPropagation(); setStatusValues(new Set()) }} title="Clear">×</span>
              )}
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>
            <AnimatePresence>
              {statusDropdownOpen && (
                <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ duration: 0.12 }}
                  className="absolute left-0 top-full mt-1 z-30 w-48 rounded-lg border bg-white shadow-lg">
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <input autoFocus placeholder="Search…" value={statusSearch} onChange={e => setStatusSearch(e.target.value)}
                        className="w-full pl-6 pr-2 py-1 text-xs rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-300" />
                    </div>
                  </div>
                  <div className="py-1 max-h-52 overflow-y-auto">
                    {filteredStatusOptions.length === 0
                      ? <p className="px-3 py-2 text-xs text-muted-foreground">No matches.</p>
                      : filteredStatusOptions.map(v => (
                        <label key={v} className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-muted/50 cursor-pointer">
                          <input type="checkbox" checked={statusValues.has(v)} onChange={() => toggleStatusValue(v)} className="h-3.5 w-3.5 rounded border-slate-300 cursor-pointer" />
                          <span className="text-xs">{v}</span>
                        </label>
                      ))}
                  </div>
                  {statusValues.size > 0 && (
                    <div className="border-t p-2">
                      <button onClick={() => setStatusValues(new Set())} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center">Clear selection</button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Manufacturer multi-select dropdown */}
          <div className="relative" ref={mfrDropdownRef}>
            <button
              onClick={() => { setMfrDropdownOpen(v => !v); setStatusDropdownOpen(false); setModelDropdownOpen(false); setConnDropdownOpen(false); setFwDropdownOpen(false) }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                mfrValues.size > 0 ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:bg-muted/50'
              }`}
            >
              {mfrLabel}
              {mfrValues.size > 0 && (
                <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold leading-none"
                  onClick={e => { e.stopPropagation(); setMfrValues(new Set()) }} title="Clear">×</span>
              )}
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>
            <AnimatePresence>
              {mfrDropdownOpen && (
                <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ duration: 0.12 }}
                  className="absolute left-0 top-full mt-1 z-30 w-64 rounded-lg border bg-white shadow-lg">
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <input autoFocus placeholder="Search…" value={mfrSearch} onChange={e => setMfrSearch(e.target.value)}
                        className="w-full pl-6 pr-2 py-1 text-xs rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-300" />
                    </div>
                  </div>
                  <div className="py-1 max-h-52 overflow-y-auto">
                    {filteredMfrOptions.length === 0
                      ? <p className="px-3 py-2 text-xs text-muted-foreground">No matches.</p>
                      : filteredMfrOptions.map(v => (
                        <label key={v} className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-muted/50 cursor-pointer">
                          <input type="checkbox" checked={mfrValues.has(v)} onChange={() => toggleMfrValue(v)} className="h-3.5 w-3.5 rounded border-slate-300 cursor-pointer" />
                          <span className="text-xs">{v}</span>
                        </label>
                      ))}
                  </div>
                  {mfrValues.size > 0 && (
                    <div className="border-t p-2">
                      <button onClick={() => setMfrValues(new Set())} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center">Clear selection</button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Model multi-select dropdown */}
          <div className="relative" ref={modelDropdownRef}>
            <button
              onClick={() => { setModelDropdownOpen(v => !v); setStatusDropdownOpen(false); setMfrDropdownOpen(false); setConnDropdownOpen(false); setFwDropdownOpen(false) }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                modelValues.size > 0 ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:bg-muted/50'
              }`}
            >
              {modelLabel}
              {modelValues.size > 0 && (
                <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold leading-none"
                  onClick={e => { e.stopPropagation(); setModelValues(new Set()) }} title="Clear">×</span>
              )}
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>
            <AnimatePresence>
              {modelDropdownOpen && (
                <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ duration: 0.12 }}
                  className="absolute left-0 top-full mt-1 z-30 w-64 rounded-lg border bg-white shadow-lg">
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <input autoFocus placeholder="Search…" value={modelSearch} onChange={e => setModelSearch(e.target.value)}
                        className="w-full pl-6 pr-2 py-1 text-xs rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-300" />
                    </div>
                  </div>
                  <div className="py-1 max-h-52 overflow-y-auto">
                    {filteredModelOptions.length === 0
                      ? <p className="px-3 py-2 text-xs text-muted-foreground">No matches.</p>
                      : filteredModelOptions.map(v => (
                        <label key={v} className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-muted/50 cursor-pointer">
                          <input type="checkbox" checked={modelValues.has(v)} onChange={() => toggleModelValue(v)} className="h-3.5 w-3.5 rounded border-slate-300 cursor-pointer" />
                          <span className="font-mono text-xs">{v}</span>
                        </label>
                      ))}
                  </div>
                  {modelValues.size > 0 && (
                    <div className="border-t p-2">
                      <button onClick={() => setModelValues(new Set())} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center">Clear selection</button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Connectivity multi-select dropdown */}
          <div className="relative" ref={connDropdownRef}>
            <button
              onClick={() => { setConnDropdownOpen(v => !v); setStatusDropdownOpen(false); setMfrDropdownOpen(false); setModelDropdownOpen(false); setFwDropdownOpen(false) }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                connectivityValues.size > 0 ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:bg-muted/50'
              }`}
            >
              {connLabel}
              {connectivityValues.size > 0 && (
                <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold leading-none"
                  onClick={e => { e.stopPropagation(); setConnectivityValues(new Set()) }} title="Clear">×</span>
              )}
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>
            <AnimatePresence>
              {connDropdownOpen && (
                <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ duration: 0.12 }}
                  className="absolute left-0 top-full mt-1 z-30 w-52 rounded-lg border bg-white shadow-lg">
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <input autoFocus placeholder="Search…" value={connSearch} onChange={e => setConnSearch(e.target.value)}
                        className="w-full pl-6 pr-2 py-1 text-xs rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-300" />
                    </div>
                  </div>
                  <div className="py-1 max-h-52 overflow-y-auto">
                    {filteredConnOptions.length === 0
                      ? <p className="px-3 py-2 text-xs text-muted-foreground">No matches.</p>
                      : filteredConnOptions.map(v => (
                        <label key={v} className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-muted/50 cursor-pointer">
                          <input type="checkbox" checked={connectivityValues.has(v)} onChange={() => toggleConnValue(v)} className="h-3.5 w-3.5 rounded border-slate-300 cursor-pointer" />
                          <span className="text-xs">{v}</span>
                        </label>
                      ))}
                  </div>
                  {connectivityValues.size > 0 && (
                    <div className="border-t p-2">
                      <button onClick={() => setConnectivityValues(new Set())} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center">Clear selection</button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Firmware version multi-select dropdown */}
          <div className="relative" ref={fwDropdownRef}>
            <button
              onClick={() => { setFwDropdownOpen(v => !v); setStatusDropdownOpen(false); setMfrDropdownOpen(false); setModelDropdownOpen(false); setConnDropdownOpen(false) }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                firmwareVersions.size > 0
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'border-slate-200 text-slate-600 hover:bg-muted/50'
              }`}
            >
              <span>{fwLabel}</span>
              {firmwareVersions.size > 0 && (
                <span
                  className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold leading-none"
                  onClick={e => { e.stopPropagation(); setFirmwareVersions(new Set()) }}
                  title="Clear"
                >×</span>
              )}
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>
            <AnimatePresence>
              {fwDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  className="absolute left-0 top-full mt-1 z-30 w-52 rounded-lg border bg-white shadow-lg"
                >
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <input
                        autoFocus
                        placeholder="Search versions…"
                        value={fwSearch}
                        onChange={e => setFwSearch(e.target.value)}
                        className="w-full pl-6 pr-2 py-1 text-xs rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-300"
                      />
                    </div>
                  </div>
                  <div className="py-1 max-h-52 overflow-y-auto">
                    {filteredFwOptions.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-muted-foreground">No versions match.</p>
                    ) : filteredFwOptions.map(v => (
                      <label
                        key={v}
                        className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-muted/50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={firmwareVersions.has(v)}
                          onChange={() => toggleFwVersion(v)}
                          className="h-3.5 w-3.5 rounded border-slate-300 cursor-pointer"
                        />
                        <span className="font-mono text-xs">{v}</span>
                      </label>
                    ))}
                  </div>
                  {firmwareVersions.size > 0 && (
                    <div className="border-t p-2">
                      <button
                        onClick={() => setFirmwareVersions(new Set())}
                        className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
                      >Clear selection</button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
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

const severityDetailBg: Record<string, string> = {
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
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${severityDetailBg[c.severity]}`}>{c.severity}</span>
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

const severityColor: Record<string, string> = {
  Critical: '#dc2626', High: '#f97316', Medium: '#f59e0b', Low: '#94a3b8',
}
const severityBg: Record<string, string> = {
  Critical: 'bg-red-600 text-white', High: 'bg-orange-500 text-white',
  Medium: 'bg-amber-100 text-amber-700 border border-amber-200',
  Low: 'bg-slate-100 text-slate-500 border border-slate-200',
}

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
