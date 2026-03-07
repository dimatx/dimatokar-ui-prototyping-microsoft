export const ID_TO_SEGMENT: Record<string, string> = {
  '': '',
  health: 'health',
  'all-resources': 'all-resources',
  assets: 'assets',
  devices: 'devices',
  credentials: 'credentials',
  policies: 'policies',
  provisioning: 'provisioning',
  'cert-mgmt': 'cert-mgmt',
  groups: 'groups',
  jobs: 'jobs',
  'device-update': 'device-update',
  firmware: 'firmware',
  'ota-management': 'ota-management',
  'iot-hub': 'iot-hubs',
  'iot-ops': 'iot-ops',
  '3p': '3p',
}

const SEGMENT_TO_ID: Record<string, string> = Object.fromEntries(
  Object.entries(ID_TO_SEGMENT).map(([k, v]) => [v || k, k])
)

export function parseMenuFromPath(pathname: string): string {
  const sub = pathname.replace(/^\/adr-namespace\/?/, '')
  const seg = sub.split('/')[0]
  return SEGMENT_TO_ID[seg] ?? ''
}

export function parseFirmwareFromPath(pathname: string): string | null {
  const parts = pathname.replace(/^\/adr-namespace\/?/, '').split('/')
  if (parts[0] === 'firmware' && parts[1]) {
    return parts[1].startsWith('v') ? parts[1].slice(1) : parts[1]
  }
  return null
}

export const SECTION_LABELS: Record<string, string> = {
  '': 'Dashboard',
  health: 'Health',
  'all-resources': 'All Resources',
  assets: 'Assets',
  devices: 'Devices',
  credentials: 'Credentials',
  policies: 'Policies',
  provisioning: 'Provisioning',
  'cert-mgmt': 'Certificate Management',
  'ota-management': 'Firmware Management',
  groups: 'Groups',
  jobs: 'Jobs',
  'iot-hub': 'IoT Hubs',
  'iot-ops': 'IoT Operations',
  firmware: 'Firmware Analysis',
  'device-update': 'Device Update',
  '3p': '3P Capability',
}

export type NavState = {
  menuItem: string
  firmwareTarget: string | null
  devicePrefilter: string
  deviceFirmwarePrefilter: string
  assetPrefilter: string
  deviceGroupPrefilter: string
  assetDetailId: string | null
  deviceDetailId: string | null
}
