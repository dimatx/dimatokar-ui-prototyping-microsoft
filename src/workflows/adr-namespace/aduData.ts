/* ─── ADU Mock Data ─────────────────────────────────────────────────────────────
   Used only by the Software Update job flow (AduSoftwareUpdateSteps.tsx).
   Delete this file + AduSoftwareUpdateSteps.tsx to remove the SW Update flow.
   ─────────────────────────────────────────────────────────────────────────────── */

export interface AduUpdate {
  provider: string
  name: string
  version: string
  compatibility: Array<{ manufacturer: string; model: string }>
  isDeployable: boolean
  importedAt: string
  handler: string
  files: string[]
  installedCriteria: string
}

export interface AduDeviceGroup {
  groupName: string
  deviceCount: number
  onLatest: number
  updateInProgress: number
  newUpdatesAvailable: number
  hasActiveDeployment: boolean
  activeDeploymentVersion?: string
}

/** Per-hub imported update catalog — mirrors what you'd see in the ADU "Updates" tab per hub */
export const ADU_HUB_CATALOGS: { hubName: string; updates: AduUpdate[] }[] = [
  {
    hubName: 'hub-tx-wind-01',
    updates: [
      {
        provider: 'contoso', name: 'firmware-rpi', version: '3.1.0',
        compatibility: [{ manufacturer: 'contoso', model: 'rpi' }],
        isDeployable: true, importedAt: '2026-02-05T01:45:00Z',
        handler: 'microsoft/swupdate:2',
        files: ['contoso-firmware-rpi-3.1.0.swu'],
        installedCriteria: '3.1.0',
      },
      {
        provider: 'contoso', name: 'firmware-rpi', version: '3.2.1',
        compatibility: [{ manufacturer: 'contoso', model: 'rpi' }],
        isDeployable: true, importedAt: '2026-02-19T09:00:00Z',
        handler: 'microsoft/swupdate:2',
        files: ['contoso-firmware-rpi-3.2.1.swu', 'post-install.sh'],
        installedCriteria: '3.2.1',
      },
    ],
  },
  {
    hubName: 'hub-tx-wind-02',
    updates: [
      {
        provider: 'contoso', name: 'firmware-rpi', version: '3.1.0',
        compatibility: [{ manufacturer: 'contoso', model: 'rpi' }],
        isDeployable: true, importedAt: '2026-02-05T02:10:00Z',
        handler: 'microsoft/swupdate:2',
        files: ['contoso-firmware-rpi-3.1.0.swu'],
        installedCriteria: '3.1.0',
      },
      {
        provider: 'contoso', name: 'firmware-rpi', version: '3.2.1',
        compatibility: [{ manufacturer: 'contoso', model: 'rpi' }],
        isDeployable: true, importedAt: '2026-02-19T09:05:00Z',
        handler: 'microsoft/swupdate:2',
        files: ['contoso-firmware-rpi-3.2.1.swu', 'post-install.sh'],
        installedCriteria: '3.2.1',
      },
    ],
  },
  {
    hubName: 'hub-tx-wind-03',
    updates: [
      {
        provider: 'contoso', name: 'firmware-rpi', version: '3.1.0',
        compatibility: [{ manufacturer: 'contoso', model: 'rpi' }],
        isDeployable: true, importedAt: '2026-02-05T02:30:00Z',
        handler: 'microsoft/swupdate:2',
        files: ['contoso-firmware-rpi-3.1.0.swu'],
        installedCriteria: '3.1.0',
      },
      {
        provider: 'contoso', name: 'firmware-rpi', version: '3.2.1',
        compatibility: [{ manufacturer: 'contoso', model: 'rpi' }],
        isDeployable: true, importedAt: '2026-02-19T09:12:00Z',
        handler: 'microsoft/swupdate:2',
        files: ['contoso-firmware-rpi-3.2.1.swu', 'post-install.sh'],
        installedCriteria: '3.2.1',
      },
    ],
  },
  {
    hubName: 'hub-tx-wind-04',
    updates: [
      {
        provider: 'contoso', name: 'firmware-rpi', version: '3.1.0',
        compatibility: [{ manufacturer: 'contoso', model: 'rpi' }],
        isDeployable: true, importedAt: '2026-02-05T02:55:00Z',
        handler: 'microsoft/swupdate:2',
        files: ['contoso-firmware-rpi-3.1.0.swu'],
        installedCriteria: '3.1.0',
      },
      // NOTE: 3.2.1 intentionally NOT imported on hub-04 — triggers the inline import flow in the wizard
    ],
  },
]

/** ADU device groups per hub — auto-created from the ADUGroup device twin tag */
export const ADU_HUB_GROUPS: { hubName: string; groups: AduDeviceGroup[] }[] = [
  {
    hubName: 'hub-tx-wind-01',
    groups: [
      {
        groupName: 'turbine-controllers',
        deviceCount: 3200, onLatest: 0, updateInProgress: 0, newUpdatesAvailable: 3200,
        hasActiveDeployment: false,
      },
      {
        groupName: 'edge-gateways',
        deviceCount: 1050, onLatest: 1050, updateInProgress: 0, newUpdatesAvailable: 0,
        hasActiveDeployment: false,
      },
    ],
  },
  {
    hubName: 'hub-tx-wind-02',
    groups: [
      {
        groupName: 'turbine-controllers',
        deviceCount: 2980, onLatest: 0, updateInProgress: 0, newUpdatesAvailable: 2980,
        hasActiveDeployment: false,
      },
      {
        groupName: 'monitoring-sensors',
        deviceCount: 1000, onLatest: 850, updateInProgress: 0, newUpdatesAvailable: 150,
        hasActiveDeployment: false,
      },
    ],
  },
  {
    hubName: 'hub-tx-wind-03',
    groups: [
      {
        groupName: 'turbine-controllers',
        deviceCount: 2617, onLatest: 0, updateInProgress: 0, newUpdatesAvailable: 2617,
        hasActiveDeployment: false,
      },
    ],
  },
  {
    hubName: 'hub-tx-wind-04',
    groups: [
      {
        groupName: 'turbine-controllers',
        deviceCount: 2000, onLatest: 0, updateInProgress: 0, newUpdatesAvailable: 2000,
        hasActiveDeployment: false,
      },
    ],
  },
]
