import { Activity, RefreshCw, Settings2, ShieldX } from 'lucide-react'
import { ADU_SW_STEPS } from './AduSoftwareUpdateSteps'

export interface SavedGroup {
  id: string
  name: string
  condition: string
  deviceCount: number
  kind?: 'adu-classic'
}

export interface MockNamespace {
  id: string
  name: string
  region: string
  hubCount: number
  aioCount: number
  devices: number
  assets: number
}

export const JOB_TYPES_MAIN = [
  {
    id: 'management-action',
    name: 'Management Action',
    description: 'Take an action on devices and assets.',
    icon: Activity,
    tags: ['Hub', 'IoT Operations'],
  },
  {
    id: 'management-update',
    name: 'Management Update',
    description: 'Update properties on devices and assets.',
    icon: Settings2,
    tags: ['Hub', 'IoT Operations'],
  },
]

export const JOB_TYPES_MORE = [
  {
    id: 'software-update',
    name: 'Software Update',
    description: 'Deploy firmware or software packages to targeted devices',
    icon: RefreshCw,
    tags: ['Hub'],
  },
  {
    id: 'cert-revocation',
    name: 'Certificate Revocation',
    description: 'Revoke device certificates across hubs and trigger re-provisioning',
    icon: ShieldX,
    tags: ['Hub'],
  },
]

export const JOB_TYPES = [...JOB_TYPES_MAIN, ...JOB_TYPES_MORE]

export const MOCK_NAMESPACES: MockNamespace[] = [
  { id: 'texas-wind', name: 'Texas-Wind-Namespace', region: 'East US', hubCount: 4, aioCount: 1, devices: 24180, assets: 3200 },
  { id: 'offshore-energy', name: 'Offshore-Energy-Namespace', region: 'East US 2', hubCount: 2, aioCount: 0, devices: 8540, assets: 0 },
  { id: 'pacific-solar', name: 'Pacific-Solar-Grid', region: 'West US 2', hubCount: 3, aioCount: 0, devices: 15020, assets: 0 },
  { id: 'northeast-grid', name: 'Northeast-Grid-Operations', region: 'East US', hubCount: 1, aioCount: 0, devices: 4210, assets: 0 },
]

const DETAILS_STEPS = ['Job Type', 'Basics', 'Target', 'Details', 'Schedule', 'Review']
const DEFAULT_STEPS = ['Job Type', 'Basics', 'Target', 'Schedule', 'Review']

export function getSteps(jobType: string | null) {
  if (jobType === 'software-update') return ADU_SW_STEPS
  if (jobType === 'management-action' || jobType === 'management-update') return DETAILS_STEPS
  return DEFAULT_STEPS
}

export const JOB_TYPE_LABELS: Record<string, string> = {
  'management-action': 'Management Action',
  'management-update': 'Management Update',
  'cert-revocation': 'Cert Revocation',
  'software-update': 'Software Update',
}

export const SAMPLE_SAVED_GROUPS: SavedGroup[] = [
  { id: 'g1', name: 'All Abilene turbines', condition: 'all turbines at Abilene Wind Farm', deviceCount: 3_412 },
  { id: 'g2', name: 'Outdated firmware devices', condition: 'devices running firmware older than 3.2.0', deviceCount: 18_754 },
  { id: 'g3', name: 'Critical wind sensors', condition: 'critical sensors at any site', deviceCount: 1_209 },
  { id: 'g4', name: 'Sweetwater cluster', condition: 'all devices in Sweetwater cluster', deviceCount: 7_831 },
  { id: 'g5', name: 'Turbine Controllers', condition: 'ADUGroup=turbine-controllers', deviceCount: 10_797 },
  { id: 'ag1', name: 'Turbine Controllers - TX Wind', condition: 'ADUGroup=turbine-controllers-tx', deviceCount: 4_210, kind: 'adu-classic' },
  { id: 'ag2', name: 'Pitch Controllers - All Sites', condition: 'ADUGroup=pitch-controllers-all', deviceCount: 2_180, kind: 'adu-classic' },
  { id: 'ag3', name: 'Edge Gateways - Update Ring A', condition: 'ADUGroup=edge-gateways-ring-a', deviceCount: 876, kind: 'adu-classic' },
]

export const ARM_PROPERTY_FIELDS = [
  { id: 'manufacturer', label: 'Manufacturer', sample: 'Contoso Wind Systems' },
  { id: 'model', label: 'Model', sample: 'TurbineController-X700' },
  { id: 'swVersion', label: 'Software Version', sample: '3.2.0' },
  { id: 'osName', label: 'OS Name', sample: 'Azure RTOS' },
  { id: 'serialNumber', label: 'Serial Number', sample: 'SN-2026-0042' },
  { id: 'location', label: 'Location', sample: 'Abilene, TX' },
]
