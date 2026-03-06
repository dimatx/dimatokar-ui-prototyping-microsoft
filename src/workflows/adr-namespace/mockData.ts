import {
  Upload,
  KeyRound,
  RefreshCw,
  Shield,
  Puzzle,
  CheckCircle2,
  X,
} from 'lucide-react'

/* ─── Mock Data ───────────────────────────────────────────────── */

export const namespace = {
  name: 'Texas-Wind-Namespace',
  subscription: 'Zava Energy – Production',
  resourceGroup: 'rg-zava-southcentralus',
  region: 'South Central US',
  totalDevices: 12_847,
  totalAssets: 3_215,
}

export interface NamespaceService {
  name: string
  icon: typeof Upload
  status: string
  configurable?: boolean
  description?: string
  instanceName?: string
}

export const INSTANCE_NAME_OPTIONS: Record<string, string[]> = {
  'Provisioning': ['dps-zava-tx-01', 'dps-zava-tx-02', 'dps-zava-global'],
  'Certificate Management': ['certmgr-zava-tx-01', 'certmgr-zava-prod', 'certmgr-zava-internal'],
  'Device Update': ['adu-zava-tx-01', 'adu-zava-prod-01', 'adu-zava-staging'],
  'Firmware Analysis': ['fwa-zava-tx-01', 'fwa-zava-prod-01'],
  'Future 3P Integration': ['3p-zava-tx-01', '3p-zava-dev-01'],
}

export const initialServices: NamespaceService[] = [
  { name: 'Provisioning', icon: Upload, status: 'Healthy', instanceName: 'dps-zava-tx-01' },
  { name: 'Certificate Management', icon: KeyRound, status: 'Healthy', configurable: true, instanceName: 'certmgr-zava-tx-01' },
  { name: 'Device Update', icon: RefreshCw, status: 'Healthy', configurable: true },
  { name: 'Firmware Analysis', icon: Shield, status: 'Healthy', configurable: true, instanceName: 'fwa-zava-tx-01' },
]

export const addableServices: NamespaceService[] = [
  { name: 'Future 3P Integration', icon: Puzzle, status: 'Disabled', configurable: true, description: 'Connect third-party services to the namespace' },
]

export interface Hub {
  name: string
  region: string
  devices: number
  status: string
}

export const initialHubs: Hub[] = [
  { name: 'hub-tx-wind-01', region: 'South Central US', devices: 4_250, status: 'Healthy' },
  { name: 'hub-tx-wind-02', region: 'South Central US', devices: 3_980, status: 'Healthy' },
  { name: 'hub-tx-wind-03', region: 'East US 2', devices: 2_617, status: 'Healthy' },
  { name: 'hub-tx-wind-04', region: 'East US 2', devices: 2_000, status: 'Degraded' },
]

export const availableHubs: Hub[] = [
  { name: 'hub-zava-westus-01', region: 'West US 2', devices: 1_820, status: 'Healthy' },
  { name: 'hub-zava-eastus-05', region: 'East US 2', devices: 3_100, status: 'Healthy' },
  { name: 'hub-zava-euwest-01', region: 'West Europe', devices: 950, status: 'Healthy' },
  { name: 'hub-zava-jpeast-01', region: 'Japan East', devices: 420, status: 'Healthy' },
]

export const aioInstances = [
  { name: 'aio-tx-abilene-01',  site: 'Abilene Wind Farm',    status: 'Healthy',  connectedDevices: 842, assets: 434 },
  { name: 'aio-tx-midland-01',  site: 'Midland Wind Farm',    status: 'Healthy',  connectedDevices: 671, assets: 318 },
  { name: 'aio-tx-sanangelo-01',site: 'San Angelo Wind Farm', status: 'Degraded', connectedDevices: 512, assets: 244 },
  { name: 'aio-tx-lubbock-01',  site: 'Lubbock Wind Farm',   status: 'Healthy',  connectedDevices: 390, assets: 187 },
]

export const firmwareImages = [
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
export const fwByManufacturer = [
  { label: 'Contoso Wind Systems', value: 9_050, color: '#3b82f6' },
  { label: 'Zephyr Sensors Inc.', value: 1_412, color: '#3b82f6' },
  { label: 'AeroLogix Systems', value: 1_400, color: '#3b82f6' },
  { label: 'Meridian Edge Tech.', value: 985, color: '#3b82f6' },
]

export const fwByModel = [
  { label: 'TurbineController-X700', value: 9_050, color: '#8b5cf6' },
  { label: 'AnemometerPro-2400', value: 1_412, color: '#8b5cf6' },
  { label: 'PitchController-5000', value: 1_400, color: '#8b5cf6' },
  { label: 'EdgeGateway-1900', value: 985, color: '#8b5cf6' },
]

export const cveBySeverity = [
  { label: 'Critical', value: 3, color: '#dc2626' },
  { label: 'High', value: 7, color: '#f97316' },
  { label: 'Medium', value: 14, color: '#f59e0b' },
  { label: 'Low', value: 19, color: '#94a3b8' },
]

export const cveByName = [
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

export const firmwareDetailData: Record<string, {
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

export const initialJobs = [
  { id: 'JOB-1042', name: 'Firmware update – v3.2.1', type: 'Update', status: 'Running', targets: '2,400 devices', started: '35 min ago' },
  { id: 'JOB-1041', name: 'Certificate renewal – Q1 2026', type: 'Certificate', status: 'Completed', targets: '12,847 devices', started: '2 days ago' },
  { id: 'JOB-1040', name: 'Reboot turbine controllers', type: 'Command', status: 'Completed', targets: '620 devices', started: '5 days ago' },
  { id: 'JOB-1039', name: 'Edge config push – telemetry interval', type: 'Configuration', status: 'Completed', targets: '3,215 assets', started: '1 week ago' },
  { id: 'JOB-1038', name: 'Firmware update – v3.1.0', type: 'Update', status: 'Completed', targets: '8,200 devices', started: '2 weeks ago' },
]

/* ─── Assets Mock Data ───────────────────────────────────────── */

export const assetHealthData = [
  { label: 'Available', value: 2_847, color: '#10b981' },
  { label: 'Degraded', value: 198, color: '#f59e0b' },
  { label: 'Unhealthy', value: 91, color: '#ef4444' },
  { label: 'Unknown', value: 79, color: '#94a3b8' },
]

export const dashJobStatusData = [
  { label: 'Completed', value: 14, color: '#10b981' },
  { label: 'Running',   value: 1,  color: '#3b82f6' },
  { label: 'Scheduled', value: 3,  color: '#94a3b8' },
  { label: 'Failed',    value: 2,  color: '#ef4444' },
]

export const dashJobTypeData = [
  { label: 'Software Update',      value: 8, color: '#3b82f6' },
  { label: 'Certificate Rotation', value: 4, color: '#f59e0b' },
  { label: 'Reboot',               value: 3, color: '#8b5cf6' },
  { label: 'Diagnostics',          value: 2, color: '#10b981' },
  { label: 'Custom Script',        value: 3, color: '#94a3b8' },
]

export const dashGroupsData = [
  { label: 'Device Groups',  value: 7, color: '#3b82f6' },
  { label: 'Asset Groups',   value: 3, color: '#8b5cf6' },
  { label: 'ADU (classic)',  value: 3, color: '#f59e0b' },
]

export const assetsByManufacturer = [
  { label: 'Contoso Wind Systems', value: 1_420, color: '#3b82f6' },
  { label: 'Zephyr Sensors Inc.', value: 782, color: '#3b82f6' },
  { label: 'Meridian Edge Tech.', value: 541, color: '#3b82f6' },
  { label: 'AeroLogix Systems', value: 320, color: '#3b82f6' },
  { label: 'Others', value: 152, color: '#3b82f6' },
]

export const assetsBySite = [
  { label: 'Abilene Wind Farm', value: 1_247, color: '#8b5cf6' },
  { label: 'Midland Wind Farm', value: 892, color: '#8b5cf6' },
  { label: 'Odessa Wind Farm', value: 634, color: '#8b5cf6' },
  { label: 'San Angelo Wind Farm', value: 442, color: '#8b5cf6' },
]

export const mockAssets = [
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

export const deviceHealthData = [
  { label: 'Healthy', value: 11_423, color: '#10b981' },
  { label: 'Degraded', value: 847, color: '#f59e0b' },
  { label: 'Unhealthy', value: 341, color: '#ef4444' },
  { label: 'Unknown', value: 236, color: '#94a3b8' },
]

export const deviceConnectivity = [
  { label: 'Connected', value: 11_912, color: '#3b82f6' },
  { label: 'Disconnected', value: 621, color: '#f59e0b' },
  { label: 'Never Connected', value: 314, color: '#94a3b8' },
]

export const deviceFirmwareVersions = [
  { label: 'v3.2.1 (latest)', value: 2_847, color: '#10b981' },
  { label: 'v3.1.0', value: 6_203, color: '#f59e0b' },
  { label: 'v2.4.0', value: 1_412, color: '#3b82f6' },
  { label: 'v1.9.3', value: 985, color: '#f97316' },
  { label: 'Other', value: 1_400, color: '#94a3b8' },
]

export const mockDevices = [
  { id: 'DEV-0001', name: 'tx-wind-a001-ctrl', type: 'Turbine Controller', manufacturer: 'Contoso Wind Systems', model: 'TurbineController-X700', hub: 'hub-tx-wind-01', site: 'Abilene Wind Farm', status: 'Healthy', connectivity: 'Connected', firmware: 'v3.2.1', lastSeen: '1 min ago', otaManaged: true },
  { id: 'DEV-0002', name: 'tx-wind-a014-anem', type: 'Anemometer', manufacturer: 'Zephyr Sensors Inc.', model: 'AnemometerPro-2400', hub: 'hub-tx-wind-01', site: 'Abilene Wind Farm', status: 'Healthy', connectivity: 'Connected', firmware: 'v2.4.0', lastSeen: '3 min ago', otaManaged: true },
  { id: 'DEV-0003', name: 'tx-wind-a021-pitch', type: 'Pitch Controller', manufacturer: 'AeroLogix Systems', model: 'PitchController-5000', hub: 'hub-tx-wind-02', site: 'Abilene Wind Farm', status: 'Degraded', connectivity: 'Connected', firmware: 'v5.0.2', lastSeen: '8 min ago', otaManaged: true },
  { id: 'DEV-0004', name: 'tx-wind-m007-ctrl', type: 'Turbine Controller', manufacturer: 'Contoso Wind Systems', model: 'TurbineController-X700', hub: 'hub-tx-wind-01', site: 'Midland Wind Farm', status: 'Healthy', connectivity: 'Connected', firmware: 'v3.0.5', lastSeen: '2 min ago', otaManaged: false },
  { id: 'DEV-0005', name: 'tx-wind-m011-ctrl', type: 'Turbine Controller', manufacturer: 'Contoso Wind Systems', model: 'TurbineController-X700', hub: 'hub-tx-wind-02', site: 'Midland Wind Farm', status: 'Unhealthy', connectivity: 'Disconnected', firmware: 'v3.1.0', lastSeen: '4 hrs ago', otaManaged: true },
  { id: 'DEV-0006', name: 'tx-wind-o003-ctrl', type: 'Turbine Controller', manufacturer: 'Contoso Wind Systems', model: 'TurbineController-X700', hub: 'hub-tx-wind-03', site: 'Odessa Wind Farm', status: 'Healthy', connectivity: 'Connected', firmware: 'v3.2.1', lastSeen: '1 min ago', otaManaged: true },
  { id: 'DEV-0007', name: 'tx-wind-o017-pitch', type: 'Pitch Controller', manufacturer: 'AeroLogix Systems', model: 'PitchController-5000', hub: 'hub-tx-wind-03', site: 'Odessa Wind Farm', status: 'Degraded', connectivity: 'Connected', firmware: 'v5.0.2', lastSeen: '31 min ago', otaManaged: true },
  { id: 'DEV-0008', name: 'tx-wind-s002-ctrl', type: 'Turbine Controller', manufacturer: 'Contoso Wind Systems', model: 'TurbineController-X700', hub: 'hub-tx-wind-04', site: 'San Angelo Wind Farm', status: 'Healthy', connectivity: 'Connected', firmware: 'v3.2.1', lastSeen: '5 min ago', otaManaged: true },
  { id: 'DEV-0009', name: 'tx-wind-a033-edge', type: 'Edge Gateway', manufacturer: 'Meridian Edge Technologies', model: 'EdgeGateway-1900', hub: 'hub-tx-wind-01', site: 'Abilene Wind Farm', status: 'Healthy', connectivity: 'Connected', firmware: 'v1.9.3', lastSeen: '2 min ago', otaManaged: true },
  { id: 'DEV-0010', name: 'tx-wind-m023-anem', type: 'Anemometer', manufacturer: 'Zephyr Sensors Inc.', model: 'AnemometerPro-2400', hub: 'hub-tx-wind-02', site: 'Midland Wind Farm', status: 'Healthy', connectivity: 'Connected', firmware: 'v2.4.0', lastSeen: '6 min ago', otaManaged: true },
  { id: 'DEV-0011', name: 'tx-wind-o009-anem', type: 'Anemometer', manufacturer: 'Zephyr Sensors Inc.', model: 'AnemometerPro-2400', hub: 'hub-tx-wind-03', site: 'Odessa Wind Farm', status: 'Healthy', connectivity: 'Connected', firmware: 'v2.4.0', lastSeen: '4 min ago', otaManaged: true },
  { id: 'DEV-0012', name: 'tx-wind-s015-ctrl', type: 'Turbine Controller', manufacturer: 'Contoso Wind Systems', model: 'TurbineController-X700', hub: 'hub-tx-wind-04', site: 'San Angelo Wind Farm', status: 'Degraded', connectivity: 'Connected', firmware: 'v3.1.0', lastSeen: '19 min ago', otaManaged: true },
  { id: 'DEV-0013', name: 'tx-wind-a044-ctrl', type: 'Turbine Controller', manufacturer: 'Contoso Wind Systems', model: 'TurbineController-X700', hub: 'hub-tx-wind-01', site: 'Abilene Wind Farm', status: 'Healthy', connectivity: 'Connected', firmware: 'v3.1.0', lastSeen: '7 min ago', otaManaged: true },
  { id: 'DEV-0014', name: 'tx-wind-m031-pitch', type: 'Pitch Controller', manufacturer: 'AeroLogix Systems', model: 'PitchController-5000', hub: 'hub-tx-wind-02', site: 'Midland Wind Farm', status: 'Unknown', connectivity: 'Never Connected', firmware: '—', lastSeen: 'Never', otaManaged: true },
  { id: 'DEV-0015', name: 'tx-wind-s008-edge', type: 'Edge Gateway', manufacturer: 'Meridian Edge Technologies', model: 'EdgeGateway-1900', hub: 'hub-tx-wind-04', site: 'San Angelo Wind Farm', status: 'Healthy', connectivity: 'Connected', firmware: 'v1.9.3', lastSeen: '3 min ago', otaManaged: true },
]

/* ─── Time-Series Mock Data ──────────────────────────────────── */

export const certOpsL1D = [124, 98, 87, 142, 201, 185, 167, 210, 340, 412, 389, 356, 398, 420, 411, 380, 392, 415, 440, 398, 360, 312, 278, 241]
export const certRevokedL1D = [2, 1, 0, 3, 4, 2, 1, 2, 6, 8, 5, 4, 3, 7, 5, 4, 3, 4, 5, 3, 2, 2, 1, 2]
export const certOpsL30D = [3200, 2980, 3410, 3250, 3870, 4120, 3960, 4380, 4210, 4050, 3880, 3990, 4100, 4420, 4190, 4340, 4510, 4380, 4190, 4260, 4320, 4480, 4290, 4130, 4200, 4350, 4410, 4180, 4050, 3980]

export const provRegistrationsL1D = [18, 12, 9, 14, 22, 31, 28, 24, 42, 67, 58, 54, 61, 72, 68, 54, 49, 62, 71, 58, 44, 38, 29, 21]
export const provAssignedL1D     = [14, 9,  7, 11, 17, 25, 22, 19, 36, 55, 49, 47, 52, 60, 57, 46, 39, 51, 59, 50, 37, 31, 23, 16]
export const provAttestL1D       = [ 9, 5,  3,  7, 18, 44, 52, 38, 27, 41, 35, 29, 48, 63, 59, 45, 28, 19, 24, 32, 27, 18, 12,  7]

/* ─── Capability Page Mock Data ─────────────────────────────── */

export const mockEnrollmentGroups = [
  { id: 'EG-001', name: 'Contoso Turbine Controllers', attestation: 'X.509 Intermediate CA', devices: 4_820, status: 'Active',   created: '2025-11-14' },
  { id: 'EG-002', name: 'AeroLogix Pitch Controllers',  attestation: 'X.509 Intermediate CA', devices: 2_617, status: 'Active',   created: '2025-11-14' },
  { id: 'EG-003', name: 'Zephyr Anemometers',           attestation: 'Symmetric Key',         devices: 1_840, status: 'Active',   created: '2025-12-01' },
  { id: 'EG-004', name: 'Meridian Edge Gateways',       attestation: 'X.509 Intermediate CA', devices: 984,   status: 'Active',   created: '2026-01-08' },
  { id: 'EG-005', name: 'Legacy Sensors – Batch A',     attestation: 'TPM 2.0',               devices: 312,   status: 'Inactive', created: '2025-09-20' },
]

export const mockGroups = [
  { id: 'GRP-001', name: 'All Turbine Controllers',     memberKind: 'devices' as const, type: 'Device Group' as const,        devices: 6_100, assets: 0,   status: 'Active',   criteria: { type: 'Turbine Controller' } },
  { id: 'GRP-002', name: 'Abilene Wind Farm – All',      memberKind: 'devices' as const, type: 'Device Group' as const,        devices: 2_430, assets: 434, status: 'Active',   criteria: { site: 'Abilene Wind Farm' } },
  { id: 'GRP-003', name: 'Midland Wind Farm – All',      memberKind: 'devices' as const, type: 'Device Group' as const,        devices: 2_180, assets: 318, status: 'Active',   criteria: { site: 'Midland Wind Farm' } },
  { id: 'GRP-004', name: 'Odessa Wind Farm – All',       memberKind: 'devices' as const, type: 'Device Group' as const,        devices: 1_820, assets: 244, status: 'Active',   criteria: { site: 'Odessa Wind Farm' } },
  { id: 'GRP-005', name: 'San Angelo Wind Farm – All',   memberKind: 'devices' as const, type: 'Device Group' as const,        devices: 1_100, assets: 187, status: 'Active',   criteria: { site: 'San Angelo Wind Farm' } },
  { id: 'GRP-006', name: 'Firmware v3.1.0 – Pending Update', memberKind: 'devices' as const, type: 'Device Group' as const,   devices: 6_203, assets: 0, status: 'Active', criteria: { firmware: 'v3.1.0' } },
  { id: 'GRP-007', name: 'Degraded + Unhealthy',         memberKind: 'devices' as const, type: 'Device Group' as const,        devices: 583,   assets: 0,   status: 'Active',   criteria: { status: 'Degraded' } },
  { id: 'GRP-008', name: 'Contoso Turbine Assets',       memberKind: 'assets'  as const, type: 'Asset Group' as const,         devices: 0,     assets: 1_420, status: 'Active', criteria: { manufacturer: 'Contoso Wind Systems' } },
  { id: 'GRP-009', name: 'All Anemometer Sensors',       memberKind: 'assets'  as const, type: 'Asset Group' as const,         devices: 0,     assets: 782,  status: 'Active',   criteria: { type: 'Anemometer' } },
  { id: 'GRP-010', name: 'Edge Gateways – All Sites',    memberKind: 'assets'  as const, type: 'Asset Group' as const,         devices: 0,     assets: 541,  status: 'Active',   criteria: { type: 'Edge Gateway' } },
  { id: 'GRP-011', name: 'Turbine Controllers – TX Wind', memberKind: 'devices' as const, type: 'ADU Group (classic)' as const, devices: 4_210, assets: 0,   status: 'Active',   criteria: { type: 'Turbine Controller' } },
  { id: 'GRP-012', name: 'Pitch Controllers – All Sites', memberKind: 'devices' as const, type: 'ADU Group (classic)' as const, devices: 2_180, assets: 0,   status: 'Active',   criteria: { type: 'Pitch Controller' } },
  { id: 'GRP-013', name: 'Edge Gateways – Update Ring A', memberKind: 'devices' as const, type: 'ADU Group (classic)' as const, devices: 876,   assets: 0,   status: 'Active',   criteria: { type: 'Edge Gateway' } },
]

export const mockCertHierarchy = [
  { id: 'CA-001', name: 'Zava Energy Root CA',       type: 'Root CA',          issuer: 'Self-signed',         validTo: '2035-01-01', status: 'Valid' },
  { id: 'CA-002', name: 'Zava Energy ICA',           type: 'Intermediate CA',  issuer: 'Zava Energy Root CA', validTo: '2030-06-01', status: 'Valid' },
]

export const mockThirdPartyIntegrations = [
  { id: '3P-001', name: 'RealWear Deployment Manager', vendor: 'RealWear',    category: 'Field Service',     status: 'Available' },
  { id: '3P-002', name: 'Sight Machine IoT Analytics', vendor: 'Sight Machine', category: 'Analytics',      status: 'Available' },
  { id: '3P-003', name: 'PTC ThingWorx Connector',    vendor: 'PTC',          category: 'Industrial IoT',   status: 'Available' },
  { id: '3P-004', name: 'Claroty Edge Security',      vendor: 'Claroty',      category: 'Security',         status: 'Available' },
]

export const mockCredentials = [
  { id: 'CRT-0001', name: 'Zava Energy Root CA', site: 'N/A', status: 'Valid', lastSeen: '1 day ago' },
]

export const mockPolicies = [
  { id: 'ICA-0001', name: 'Zava Energy CA', site: 'N/A', status: 'Active', lastSeen: '12 hrs ago' },
]

/* ─── Filter & Sort Constants ────────────────────────────────── */

export const ASSET_STATUSES = ['Available', 'Degraded', 'Unhealthy', 'Unknown']
export const ASSET_MANUFACTURERS = [...new Set(mockAssets.map(a => a.manufacturer))].sort()
export const ASSET_FIRMWARE_VERSIONS = [...new Set(mockAssets.map(a => a.firmware).filter(f => f !== '—'))].sort()
export const LATEST_ASSET_FW_BY_TYPE: Record<string, string> = mockAssets.reduce((acc, a) => {
  if (a.firmware !== '—' && (!acc[a.type] || a.firmware > acc[a.type])) acc[a.type] = a.firmware
  return acc
}, {} as Record<string, string>)
export const LATEST_DEVICE_FW_BY_MODEL: Record<string, string> = mockDevices.reduce((acc, d) => {
  if (d.firmware !== '—' && (!acc[d.model] || d.firmware > acc[d.model])) acc[d.model] = d.firmware
  return acc
}, {} as Record<string, string>)
export const ASSET_SORT_FIELDS = [
  { field: 'id', label: 'Asset ID', cls: 'w-[90px]' },
  { field: 'name', label: 'Name' },
  { field: 'type', label: 'Type' },
  { field: 'manufacturer', label: 'Manufacturer' },
  { field: 'site', label: 'Site' },
  { field: 'firmware', label: 'Firmware' },
  { field: 'status', label: 'Status' },
  { field: 'lastSeen', label: 'Last Seen' },
]

export const DEVICE_STATUSES_FILTER = ['Healthy', 'Degraded', 'Unhealthy', 'Unknown']
export const CONNECTIVITY_OPTIONS = ['Connected', 'Disconnected', 'Never Connected']
export const DEVICE_FIRMWARE_VERSIONS = [...new Set(mockDevices.map(d => d.firmware).filter(f => f !== '\u2014'))].sort()
export const DEVICE_MANUFACTURERS = [...new Set(mockDevices.map(d => d.manufacturer))].sort()
export const DEVICE_MODELS = [...new Set(mockDevices.map(d => d.model))].sort()
export const DEVICE_SORT_FIELDS = [
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
export const DEVICE_ACTIONS = [
  { id: 'enable', label: 'Enable', icon: CheckCircle2, cls: 'text-emerald-700' },
  { id: 'disable', label: 'Disable', icon: X, cls: 'text-slate-700' },
  { id: 'revoke-cert', label: 'Revoke Certificate', icon: KeyRound, cls: 'text-amber-700' },
  { id: 'update-firmware', label: 'Update Firmware', icon: Upload, cls: 'text-blue-700' },
]

/* ─── Group Filter Constants ─────────────────────────────────── */

export const GROUP_DEVICE_TYPES = ['Turbine Controller', 'Anemometer', 'Pitch Controller', 'Edge Gateway']
export const GROUP_ASSET_TYPES  = ['Turbine Controller', 'Anemometer', 'Pitch Controller', 'Edge Gateway']
export const GROUP_SITES        = ['Abilene Wind Farm', 'Midland Wind Farm', 'Odessa Wind Farm', 'San Angelo Wind Farm']
export const GROUP_MANUFACTURERS = ['Contoso Wind Systems', 'Zephyr Sensors Inc.', 'AeroLogix Systems', 'Meridian Edge Technologies']
export const GROUP_STATUSES     = ['Healthy', 'Degraded', 'Unhealthy']

/* ─── Sensitivity & Detail Constants ─────────────────────────── */

export const SENSITIVITY_LABELS = [
  { label: 'Non-Business',        color: '#475569', bg: '#f8fafc', border: '#cbd5e1', locked: false },
  { label: 'Public',              color: '#166534', bg: '#f0fdf4', border: '#86efac', locked: false },
  { label: 'General',             color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd', locked: false },
  { label: 'Confidential',        color: '#c2410c', bg: '#fff7ed', border: '#fdba74', locked: true  },
  { label: 'Highly Confidential', color: '#991b1b', bg: '#fef2f2', border: '#fca5a5', locked: true  },
]

export const ASSET_MODEL_MAP: Record<string, string> = {
  'Turbine Controller': 'TurbineController-X700',
  'Anemometer': 'AnemometerPro-2400',
  'Pitch Controller': 'PitchController-5000',
  'Edge Gateway': 'EdgeGateway-1900',
}

/* ─── Health / Observability Mock Data ───────────────────────── */

// Deterministic pseudo-noise for consistent sparkline generation
function _dn(seed: number, i: number): number {
  const x = Math.sin(seed * 7.3 + i * 1.37 + seed * i * 0.011) * 43758.5453
  return (x - Math.floor(x)) // 0..1
}
function _genSeries(len: number, base: number, variance: number, seed: number, dips?: [number, number][]): number[] {
  return Array.from({ length: len }, (_, i) => {
    let v = base + (_dn(seed, i) * 2 - 1) * variance + Math.sin(i * 0.4) * variance * 0.4
    if (dips) for (const [s, e] of dips) if (i >= s && i < e) v *= 0.08
    return Math.max(0, Math.round(v))
  })
}
function _genCumulative(len: number, startVal: number, ratePerSlot: number, seed: number): number[] {
  let cum = startVal
  return Array.from({ length: len }, (_, i) => {
    cum += ratePerSlot * (0.7 + _dn(seed, i) * 0.6)
    return Math.round(cum)
  })
}
function _genConnectivity(len: number, dropSlots?: [number, number][]): boolean[] {
  return Array.from({ length: len }, (_, i) => {
    if (dropSlots) for (const [s, e] of dropSlots) if (i >= s && i < e) return false
    return true
  })
}

// Asset time-series (48 slots = 30-min intervals over 24h)
// Fields: msgPerMin (current rate), errorsPerHr, msgCount (cumulative total), connectivity (boolean[48])
export interface AssetObsData {
  msgPerMin: number[]
  errorsPerHr: number[]
  msgCount: number[]
  connectivity: boolean[]
}

export const assetObservabilityData: Record<string, AssetObsData> = {
  'AST-0001': { msgPerMin: _genSeries(48, 62, 12, 1),    errorsPerHr: _genSeries(24, 1,  1,  11),  msgCount: _genCumulative(48, 84_200, 62, 1),   connectivity: _genConnectivity(48) },
  'AST-0002': { msgPerMin: _genSeries(48, 28, 6,  2),    errorsPerHr: _genSeries(24, 0,  0.5,12),  msgCount: _genCumulative(48, 31_400, 28, 2),   connectivity: _genConnectivity(48) },
  'AST-0003': { msgPerMin: _genSeries(48, 115, 20, 3),   errorsPerHr: _genSeries(24, 2,  1,  13),  msgCount: _genCumulative(48, 162_000, 115, 3),  connectivity: _genConnectivity(48) },
  // AST-0004: Degraded — Baremetal memory pressure (91%), elevated latency causing some msg loss
  'AST-0004': { msgPerMin: _genSeries(48, 38, 18, 4, [[32, 40]]), errorsPerHr: _genSeries(24, 8, 4, 14), msgCount: _genCumulative(48, 41_900, 38, 4), connectivity: _genConnectivity(48, [[33, 36]]) },
  'AST-0005': { msgPerMin: _genSeries(48, 65, 10, 5),   errorsPerHr: _genSeries(24, 1,  1,  15),  msgCount: _genCumulative(48, 91_300, 65, 5),   connectivity: _genConnectivity(48) },
  'AST-0006': { msgPerMin: _genSeries(48, 26, 5,  6),   errorsPerHr: _genSeries(24, 0,  0.4,16),  msgCount: _genCumulative(48, 29_100, 26, 6),   connectivity: _genConnectivity(48) },
  // AST-0007: Unhealthy — AIO broker CrashLoopBackOff, Baremetal memory 87% + CPU 94%
  'AST-0007': { msgPerMin: _genSeries(48, 58, 30, 7, [[28, 48]]), errorsPerHr: _genSeries(24, 24, 12, 17), msgCount: _genCumulative(48, 77_800, 22, 7), connectivity: _genConnectivity(48, [[30, 48]]) },
  'AST-0008': { msgPerMin: _genSeries(48, 108, 18, 8),  errorsPerHr: _genSeries(24, 2,  1,  18),  msgCount: _genCumulative(48, 148_000, 108, 8),  connectivity: _genConnectivity(48) },
  'AST-0009': { msgPerMin: _genSeries(48, 60, 11, 9),   errorsPerHr: _genSeries(24, 1,  1,  19),  msgCount: _genCumulative(48, 88_400, 60, 9),   connectivity: _genConnectivity(48) },
  // AST-0010: Degraded — AIO instance aio-tx-odessa-01 degraded (MQTT broker high latency)
  'AST-0010': { msgPerMin: _genSeries(48, 35, 15, 10, [[20, 26], [38, 43]]), errorsPerHr: _genSeries(24, 6, 3, 20), msgCount: _genCumulative(48, 39_200, 35, 10), connectivity: _genConnectivity(48, [[20, 23]]) },
  'AST-0011': { msgPerMin: _genSeries(48, 24, 5,  21),  errorsPerHr: _genSeries(24, 0,  0.4,31),  msgCount: _genCumulative(48, 27_600, 24, 21),  connectivity: _genConnectivity(48) },
  'AST-0012': { msgPerMin: _genSeries(48, 63, 12, 22),  errorsPerHr: _genSeries(24, 1,  1,  32),  msgCount: _genCumulative(48, 87_700, 63, 22),  connectivity: _genConnectivity(48) },
  'AST-0013': { msgPerMin: _genSeries(48, 112, 19, 23), errorsPerHr: _genSeries(24, 2,  1,  33),  msgCount: _genCumulative(48, 158_000, 112, 23), connectivity: _genConnectivity(48) },
  'AST-0014': { msgPerMin: _genSeries(48, 55, 10, 24),  errorsPerHr: _genSeries(24, 3,  2,  34),  msgCount: _genCumulative(48, 72_400, 55, 24),  connectivity: _genConnectivity(48, [[10, 12]]) },
  'AST-0015': { msgPerMin: _genSeries(48, 0, 0, 25),    errorsPerHr: _genSeries(24, 0, 0, 35),   msgCount: _genCumulative(48, 1_200, 0, 25),    connectivity: _genConnectivity(48, [[0, 48]]) },
}

// Device time-series (48 slots = 30-min intervals over 24h)
// Fields: msgPerMin, errorsPerHr, dataKBPerMin, connectivity
export interface DeviceObsData {
  msgPerMin: number[]
  errorsPerHr: number[]
  dataKBPerMin: number[]
  connectivity: boolean[]
}

export const deviceObservabilityData: Record<string, DeviceObsData> = {
  'DEV-0001': { msgPerMin: _genSeries(48, 58, 11, 41),  errorsPerHr: _genSeries(24, 1, 1,  51), dataKBPerMin: _genSeries(48, 22, 5,  61), connectivity: _genConnectivity(48) },
  'DEV-0002': { msgPerMin: _genSeries(48, 25, 5,  42),  errorsPerHr: _genSeries(24, 0, 0.4,52), dataKBPerMin: _genSeries(48, 8,  2,  62), connectivity: _genConnectivity(48) },
  'DEV-0003': { msgPerMin: _genSeries(48, 32, 14, 43, [[24, 30]]), errorsPerHr: _genSeries(24, 7, 4, 53), dataKBPerMin: _genSeries(48, 14, 7, 63), connectivity: _genConnectivity(48, [[25, 28]]) },
  'DEV-0004': { msgPerMin: _genSeries(48, 62, 10, 44),  errorsPerHr: _genSeries(24, 1, 1,  54), dataKBPerMin: _genSeries(48, 24, 5,  64), connectivity: _genConnectivity(48) },
  // DEV-0005: Unhealthy / Disconnected
  'DEV-0005': { msgPerMin: _genSeries(48, 55, 25, 45, [[28, 48]]), errorsPerHr: _genSeries(24, 18, 9, 55), dataKBPerMin: _genSeries(48, 20, 12, 65, [[28, 48]]), connectivity: _genConnectivity(48, [[28, 48]]) },
  'DEV-0006': { msgPerMin: _genSeries(48, 60, 11, 46),  errorsPerHr: _genSeries(24, 1, 1,  56), dataKBPerMin: _genSeries(48, 23, 5,  66), connectivity: _genConnectivity(48) },
  'DEV-0007': { msgPerMin: _genSeries(48, 30, 12, 47, [[18, 23]]), errorsPerHr: _genSeries(24, 5, 3, 57), dataKBPerMin: _genSeries(48, 12, 6, 67, [[18, 23]]), connectivity: _genConnectivity(48, [[19, 22]]) },
  // DEV-0008: on hub-tx-wind-04 (Degraded) — throttling visible, elevated errors
  'DEV-0008': { msgPerMin: _genSeries(48, 58, 20, 48, [[16, 22], [32, 38]]), errorsPerHr: _genSeries(24, 12, 6, 58), dataKBPerMin: _genSeries(48, 22, 10, 68, [[16, 22]]), connectivity: _genConnectivity(48) },
  'DEV-0009': { msgPerMin: _genSeries(48, 110, 18, 49), errorsPerHr: _genSeries(24, 2, 1,  59), dataKBPerMin: _genSeries(48, 44, 8,  69), connectivity: _genConnectivity(48) },
  'DEV-0010': { msgPerMin: _genSeries(48, 27, 5,  50),  errorsPerHr: _genSeries(24, 0, 0.4,60), dataKBPerMin: _genSeries(48, 10, 2,  70), connectivity: _genConnectivity(48) },
  'DEV-0011': { msgPerMin: _genSeries(48, 23, 5,  71),  errorsPerHr: _genSeries(24, 0, 0.4,81), dataKBPerMin: _genSeries(48, 9,  2,  91), connectivity: _genConnectivity(48) },
  // DEV-0012: on hub-tx-wind-04 (Degraded)
  'DEV-0012': { msgPerMin: _genSeries(48, 52, 22, 72, [[20, 26]]), errorsPerHr: _genSeries(24, 10, 5, 82), dataKBPerMin: _genSeries(48, 20, 9, 92, [[20, 26]]), connectivity: _genConnectivity(48) },
  'DEV-0013': { msgPerMin: _genSeries(48, 53, 9,  73),  errorsPerHr: _genSeries(24, 2, 1,  83), dataKBPerMin: _genSeries(48, 20, 4,  93), connectivity: _genConnectivity(48) },
  'DEV-0014': { msgPerMin: _genSeries(48, 0,  0,  74),  errorsPerHr: _genSeries(24, 0, 0,  84), dataKBPerMin: _genSeries(48, 0,  0,  94), connectivity: _genConnectivity(48, [[0, 48]]) },
  // DEV-0015: on hub-tx-wind-04 (Degraded)
  'DEV-0015': { msgPerMin: _genSeries(48, 106, 24, 75, [[22, 28], [36, 40]]), errorsPerHr: _genSeries(24, 9, 5, 85), dataKBPerMin: _genSeries(48, 40, 12, 95, [[22, 28]]), connectivity: _genConnectivity(48) },
}

// Full-stack health layers per asset
export interface StackLayer {
  type: 'asset' | 'aio' | 'k8s' | 'baremetal'
  label: string
  name: string
  status: 'Healthy' | 'Degraded' | 'Warning' | 'Unhealthy'
  detail: string
  alertMsg?: string
  nodes?: Array<{ name: string; status: 'Healthy' | 'Degraded' | 'Warning' | 'Unhealthy'; detail: string; alertMsg?: string }>
}

function _healthyStack(assetName: string, aioName: string, k8sName: string, baremetalName: string, aioDetail: string, k8sDetail: string, baremetalDetail: string): StackLayer[] {
  return [
    { type: 'asset',      label: 'Asset',                        name: assetName,    status: 'Healthy',  detail: 'Operating normally' },
    { type: 'aio',        label: 'Azure IoT\u00a0Operations',    name: aioName,      status: 'Healthy',  detail: aioDetail },
    { type: 'k8s',        label: 'Kubernetes',                   name: k8sName,      status: 'Healthy',  detail: k8sDetail },
    { type: 'baremetal',  label: 'Host OS',                       name: baremetalName, status: 'Healthy', detail: baremetalDetail },
  ]
}

export const assetStackHealth: Record<string, StackLayer[]> = {
  // Healthy assets — all layers green
  'AST-0001': _healthyStack('Turbine Controller #A-001', 'aio-tx-abilene-01', 'k8s-abilene-prod', 'host-abilene-01', 'Broker running · 434 assets', '5/5 nodes ready', 'CPU 42% · Mem 58%'),
  'AST-0002': _healthyStack('Anemometer Sensor #A-014',  'aio-tx-abilene-01', 'k8s-abilene-prod', 'host-abilene-02', 'Broker running · 434 assets', '5/5 nodes ready', 'CPU 38% · Mem 61%'),
  'AST-0003': _healthyStack('Edge Gateway #AB-03',        'aio-tx-abilene-01', 'k8s-abilene-prod', 'host-abilene-02', 'Broker running · 434 assets', '5/5 nodes ready', 'CPU 38% · Mem 61%'),
  // AST-0004: Degraded — Baremetal memory pressure causing latency
  'AST-0004': [
    { type: 'asset',     label: 'Asset',                       name: 'Pitch Controller #A-021', status: 'Degraded', detail: 'Elevated message latency · p99 1,840ms', alertMsg: 'Latency spike traced to host OS memory pressure' },
    { type: 'aio',       label: 'Azure IoT\u00a0Operations',   name: 'aio-tx-abilene-01',       status: 'Healthy',  detail: 'Broker running · 434 assets' },
    { type: 'k8s',       label: 'Kubernetes',                  name: 'k8s-abilene-prod',        status: 'Healthy',  detail: '5/5 nodes ready' },
    { type: 'baremetal', label: 'Host OS',                     name: 'abilene-hosts',           status: 'Warning',  detail: '1 of 5 hosts under memory pressure',
      nodes: [
        { name: 'host-abilene-01', status: 'Healthy', detail: 'CPU 42% · Mem 58%' },
        { name: 'host-abilene-02', status: 'Healthy', detail: 'CPU 38% · Mem 61%' },
        { name: 'host-abilene-03', status: 'Warning', detail: 'CPU 78% · Mem 91% · 3 pods at risk', alertMsg: 'Memory pressure causing GC pauses on aio-broker pod' },
        { name: 'host-abilene-04', status: 'Healthy', detail: 'CPU 35% · Mem 54%' },
        { name: 'host-abilene-05', status: 'Healthy', detail: 'CPU 41% · Mem 60%' },
      ],
    },
  ],
  'AST-0005': _healthyStack('Turbine Controller #M-007', 'aio-tx-midland-01', 'k8s-midland-prod', 'host-midland-02', 'Broker running · 318 assets', '4/4 nodes ready', 'CPU 44% · Mem 62%'),
  'AST-0006': _healthyStack('Anemometer Sensor #M-023',  'aio-tx-midland-01', 'k8s-midland-prod', 'host-midland-02', 'Broker running · 318 assets', '4/4 nodes ready', 'CPU 44% · Mem 62%'),
  // AST-0007: Unhealthy — AIO broker CrashLoopBackOff root-caused to baremetal memory+CPU
  'AST-0007': [
    { type: 'asset',     label: 'Asset',                       name: 'Turbine Controller #M-011', status: 'Unhealthy', detail: 'No data received · last seen 3h ago', alertMsg: 'Asset unreachable — MQTT broker unavailable' },
    { type: 'aio',       label: 'Azure IoT\u00a0Operations',   name: 'aio-tx-midland-01',        status: 'Degraded',  detail: 'aio-broker: CrashLoopBackOff · restarted 8×', alertMsg: 'Broker pod OOMKilled — insufficient memory on host' },
    { type: 'k8s',       label: 'Kubernetes',                  name: 'k8s-midland-prod',         status: 'Warning',   detail: '3/4 nodes ready · host-midland-01 NotReady', alertMsg: '1 node is in NotReady state due to memory exhaustion' },
    { type: 'baremetal', label: 'Host OS',                     name: 'midland-hosts',            status: 'Unhealthy', detail: '1 of 4 hosts under severe resource pressure',
      nodes: [
        { name: 'host-midland-01', status: 'Unhealthy', detail: 'CPU 94% · Mem 87% · OOMKill events: 12', alertMsg: 'Node under severe resource pressure — root cause of asset failure' },
        { name: 'host-midland-02', status: 'Healthy',   detail: 'CPU 44% · Mem 62%' },
        { name: 'host-midland-03', status: 'Healthy',   detail: 'CPU 47% · Mem 65%' },
        { name: 'host-midland-04', status: 'Healthy',   detail: 'CPU 39% · Mem 57%' },
      ],
    },
  ],
  'AST-0008': _healthyStack('Edge Gateway #MB-01',        'aio-tx-midland-01', 'k8s-midland-prod', 'host-midland-02', 'Broker running · 318 assets', '4/4 nodes ready', 'CPU 44% · Mem 62%'),
  'AST-0009': _healthyStack('Turbine Controller #O-003', 'aio-tx-odessa-01',  'k8s-odessa-prod',  'host-odessa-01',  'Broker running · 244 assets', '4/4 nodes ready', 'CPU 40% · Mem 55%'),
  // AST-0010: Degraded — AIO instance on Odessa degraded (MQTT broker high latency)
  'AST-0010': [
    { type: 'asset',     label: 'Asset',                       name: 'Pitch Controller #O-017',  status: 'Degraded', detail: 'Intermittent connectivity · MQTT timeouts', alertMsg: 'MQTT broker latency affecting asset telemetry' },
    { type: 'aio',       label: 'Azure IoT\u00a0Operations',   name: 'aio-tx-odessa-01',         status: 'Degraded', detail: 'MQTT broker p99 latency: 3,200ms · throttling', alertMsg: 'Broker overloaded — possible noisy-neighbor on shared node' },
    { type: 'k8s',       label: 'Kubernetes',                  name: 'k8s-odessa-prod',          status: 'Healthy',  detail: '4/4 nodes ready' },
    { type: 'baremetal', label: 'Host OS',                     name: 'host-odessa-01',           status: 'Healthy',  detail: 'CPU 45% · Mem 62%' },
  ],
  'AST-0011': _healthyStack('Anemometer Sensor #O-009', 'aio-tx-odessa-01',  'k8s-odessa-prod',  'host-odessa-01',  'Broker running · 244 assets', '4/4 nodes ready', 'CPU 40% · Mem 55%'),
  'AST-0012': _healthyStack('Turbine Controller #S-002', 'aio-tx-sanangelo-01', 'k8s-sanangelo-prod', 'host-sanangelo-01', 'Broker running · 244 assets', '4/4 nodes ready', 'CPU 51% · Mem 67%'),
  'AST-0013': _healthyStack('Edge Gateway #SB-02',       'aio-tx-sanangelo-01', 'k8s-sanangelo-prod', 'host-sanangelo-01', 'Broker running · 244 assets', '4/4 nodes ready', 'CPU 51% · Mem 67%'),
  'AST-0014': _healthyStack('Turbine Controller #A-044', 'aio-tx-abilene-01', 'k8s-abilene-prod', 'host-abilene-01', 'Broker running · 434 assets', '5/5 nodes ready', 'CPU 42% · Mem 58%'),
  'AST-0015': [
    { type: 'asset',     label: 'Asset',                       name: 'Pitch Controller #M-031', status: 'Degraded',  detail: 'Never connected · no telemetry received' },
    { type: 'aio',       label: 'Azure IoT\u00a0Operations',   name: 'aio-tx-midland-01',       status: 'Healthy',  detail: 'Broker running · 318 assets' },
    { type: 'k8s',       label: 'Kubernetes',                  name: 'k8s-midland-prod',        status: 'Healthy',  detail: '4/4 nodes ready' },
    { type: 'baremetal', label: 'Host OS',                     name: 'host-midland-02',         status: 'Healthy',  detail: 'CPU 44% · Mem 62%' },
  ],
}

// Device hub health layers (device + its hub)
export interface HubHealthData {
  hubName: string
  hubStatus: 'Healthy' | 'Degraded' | 'Warning'
  p50ms: number
  p99ms: number
  throttled: boolean
  detail: string
  alertMsg?: string
}

const _healthyHub = (hubName: string, p50: number, p99: number): HubHealthData => ({
  hubName, hubStatus: 'Healthy', p50ms: p50, p99ms: p99, throttled: false,
  detail: `${p50}ms p50 · ${p99}ms p99 · No throttling`,
})
const _degradedHub = (hubName: string): HubHealthData => ({
  hubName, hubStatus: 'Degraded', p50ms: 820, p99ms: 4_200, throttled: true,
  detail: 'p50: 820ms · p99: 4,200ms · Throttling active',
  alertMsg: 'Hub is throttling D2C messages — quota limit exceeded. Devices on this hub may experience message loss and delayed commands.',
})

export const deviceHubHealthData: Record<string, HubHealthData> = {
  'DEV-0001': _healthyHub('hub-tx-wind-01', 48, 210),
  'DEV-0002': _healthyHub('hub-tx-wind-01', 52, 190),
  'DEV-0003': _healthyHub('hub-tx-wind-02', 61, 280),
  'DEV-0004': _healthyHub('hub-tx-wind-01', 45, 195),
  'DEV-0005': _healthyHub('hub-tx-wind-02', 55, 240),
  'DEV-0006': _healthyHub('hub-tx-wind-03', 42, 180),
  'DEV-0007': _healthyHub('hub-tx-wind-03', 44, 195),
  'DEV-0008': _degradedHub('hub-tx-wind-04'),
  'DEV-0009': _healthyHub('hub-tx-wind-01', 50, 215),
  'DEV-0010': _healthyHub('hub-tx-wind-02', 58, 250),
  'DEV-0011': _healthyHub('hub-tx-wind-03', 41, 185),
  'DEV-0012': _degradedHub('hub-tx-wind-04'),
  'DEV-0013': _healthyHub('hub-tx-wind-01', 47, 205),
  'DEV-0014': _healthyHub('hub-tx-wind-02', 0,  0),
  'DEV-0015': _degradedHub('hub-tx-wind-04'),
}

// Namespace-level health data
export const namespaceFleetMetrics = {
  // 48 half-hour slots over 24h — aggregate across all assets/devices
  totalMsgPerMin:    _genSeries(48, 3_840, 420, 101),
  totalErrorsPerHr:  _genSeries(24, 186,  60,  102),
  totalDataKBPerMin: _genSeries(48, 1_520, 180, 103),
  connectedDevices:  _genSeries(48, 11_912, 80, 104),
}

export const namespaceActiveIssues = [
  {
    id: 'ISS-001',
    severity: 'Critical' as const,
    layer: 'Host OS',
    resource: 'host-midland-01',
    symptom: 'Memory exhausted (87%) + CPU 94% — caused OOMKill on aio-broker pod, asset Turbine Controller #M-011 unreachable',
    since: '3 hrs ago',
    assetId: 'AST-0007',
  },
  {
    id: 'ISS-002',
    severity: 'Warning' as const,
    layer: 'Azure IoT\u00a0Operations',
    resource: 'aio-tx-odessa-01',
    symptom: 'MQTT broker latency spike (p99 3,200ms) — Pitch Controller #O-017 experiencing intermittent timeouts',
    since: '1 hr 12 min ago',
    assetId: 'AST-0010',
  },
  {
    id: 'ISS-003',
    severity: 'Warning' as const,
    layer: 'IoT Hub',
    resource: 'hub-tx-wind-04',
    symptom: 'D2C throttling active — 3 devices affected (p99 4,200ms). Quota limit reached.',
    since: '2 hrs 40 min ago',
    deviceId: 'DEV-0008',
  },
  {
    id: 'ISS-004',
    severity: 'Warning' as const,
    layer: 'Host OS',
    resource: 'host-abilene-03',
    symptom: 'Memory at 91% — GC pressure on aio-broker pod causing latency for Pitch Controller #A-021',
    since: '47 min ago',
    assetId: 'AST-0004',
  },
]

export const namespaceStackSummary = [
  { layer: 'Assets',                         total: 3_215, healthy: 2_926, degraded: 198,  unhealthy: 91  },
  { layer: 'Azure IoT\u00a0Operations',      total: 5,     healthy: 3,     degraded: 2,    unhealthy: 0   },
  { layer: 'IoT Hubs',                       total: 4,     healthy: 3,     degraded: 1,    unhealthy: 0   },
  { layer: 'Kubernetes Clusters',            total: 5,     healthy: 4,     degraded: 1,    unhealthy: 0   },
  { layer: 'Host OS',                        total: 12,    healthy: 10,    degraded: 1,    unhealthy: 1   },
]
