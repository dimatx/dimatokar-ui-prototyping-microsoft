/* ─── ADU Mock Data ─────────────────────────────────────────────────────────────
   Used only by the Software Update job flow (AduSoftwareUpdateSteps.tsx).
   Delete this file + AduSoftwareUpdateSteps.tsx to remove the SW Update flow.
   ─────────────────────────────────────────────────────────────────────────────── */

export interface AduUpdate {
  provider: string
  name: string
  version: string
  displayName: string
  description: string
  compatibility: Array<{ manufacturer: string; model: string }>
  isDeployable: boolean
  importedAt: string
  handler: string
  files: Array<{ name: string; sizeMb: number; sha256: string }>
  installedCriteria: string
}

export interface AduClassicGroup {
  groupName: string
  displayName: string
  deviceCount: number
  description: string
}

// ─── Updates catalog (namespace-wide, no per-hub breakdown) ──────────────────

export const ADU_UPDATES: AduUpdate[] = [
  {
    provider: 'zava-energy',
    name: 'turbine-controller-fw',
    version: '1.2.5',
    displayName: 'Blade Pitch Calibration Fix',
    description: 'Corrects blade pitch sensor drift under high-load conditions. Recommended for turbines with > 5,000 operating hours.',
    compatibility: [{ manufacturer: 'zava-energy', model: 'turbine-controller-v2' }],
    isDeployable: true,
    importedAt: '2025-11-14T08:30:00Z',
    handler: 'microsoft/swupdate:2',
    files: [
      { name: 'zava-turbine-fw-1.2.5.swu', sizeMb: 14.2, sha256: 'a3f8c2d91e4b7a05f6c3e8d2b14f9a7c2e5b8d3f1a6c9e2b5d8f1a4c7e0b3d6' },
      { name: 'post-install.sh', sizeMb: 0.02, sha256: 'c7e0b3d6a3f8c2d91e4b7a05f6c3e8d2b14f9a7c2e5b8d3f1a6c9e2b5d8f1a4' },
    ],
    installedCriteria: '1.2.5',
  },
  {
    provider: 'zava-energy',
    name: 'turbine-controller-fw',
    version: '1.3.0',
    displayName: 'Efficiency & SCADA Improvements',
    description: 'Increases power output by 3–8% via improved yaw control algorithm. Updates SCADA communication protocol to IEC 61400-25.',
    compatibility: [{ manufacturer: 'zava-energy', model: 'turbine-controller-v2' }],
    isDeployable: true,
    importedAt: '2026-01-22T10:15:00Z',
    handler: 'microsoft/swupdate:2',
    files: [
      { name: 'zava-turbine-fw-1.3.0.swu', sizeMb: 18.7, sha256: 'b7d4e1f2a8c3b9e0d5f1a2c8d4e9b3f0a7c1e6b2d8f3a5c0e4b7d2f9a1c6e3b0' },
      { name: 'scada-protocol-patch.bin', sizeMb: 1.4, sha256: 'e1f2a8c3b9e0d5f1a2c8d4e9b3f0a7c1e6b2d8f3a5c0e4b7d2f9a1c6e3b0d5f1' },
      { name: 'post-install.sh', sizeMb: 0.02, sha256: 'f9a1c6e3b0d5f1a2c8d4e9b3f0a7c1e6b2d8f3a5c0e4b7d2f9a1c6e3b0d5f1a2' },
    ],
    installedCriteria: '1.3.0',
  },
  {
    provider: 'zava-energy',
    name: 'turbine-controller-fw',
    version: '1.4.0',
    displayName: 'Emergency Auto Shut-off',
    description: 'Critical safety update. Adds automated grid fault detection with sub-100ms safe shut-down sequencing. Required for NERC CIP compliance by 2026-06-01.',
    compatibility: [{ manufacturer: 'zava-energy', model: 'turbine-controller-v2' }],
    isDeployable: true,
    importedAt: '2026-02-18T14:00:00Z',
    handler: 'microsoft/swupdate:2',
    files: [
      { name: 'zava-turbine-fw-1.4.0.swu', sizeMb: 19.1, sha256: 'c9a2f5e1b8d4a0f7c3e9b5d1f8a4c0e6b2d8f4a0c6e2b9d5f1a7c3e0b6d2f8a4' },
      { name: 'grid-fault-detector.bin', sizeMb: 2.3, sha256: 'd4a0f7c3e9b5d1f8a4c0e6b2d8f4a0c6e2b9d5f1a7c3e0b6d2f8a4c9a2f5e1b8' },
      { name: 'safety-relay-config.json', sizeMb: 0.01, sha256: 'f8a4c9a2f5e1b8d4a0f7c3e9b5d1f8a4c0e6b2d8f4a0c6e2b9d5f1a7c3e0b6d2' },
      { name: 'post-install.sh', sizeMb: 0.02, sha256: 'a0f7c3e9b5d1f8a4c0e6b2d8f4a0c6e2b9d5f1a7c3e0b6d2f8a4c9a2f5e1b8d4' },
    ],
    installedCriteria: '1.4.0',
  },
]

// ─── Classic ADU Groups (from ADUGroup device twin tag) ───────────────────────

export const ADU_CLASSIC_GROUPS: AduClassicGroup[] = [
  {
    groupName: 'turbine-controllers',
    displayName: 'Turbine Controllers',
    deviceCount: 10_797,
    description: 'Main nacelle controllers across all sites',
  },
  {
    groupName: 'edge-gateways',
    displayName: 'Edge Gateways',
    deviceCount: 1_050,
    description: 'Field-edge compute gateways handling local aggregation',
  },
  {
    groupName: 'nacelle-controllers',
    displayName: 'Nacelle Controllers',
    deviceCount: 3_240,
    description: 'Secondary nacelle drive-train and generator controllers',
  },
  {
    groupName: 'pitch-control-units',
    displayName: 'Pitch Control Units',
    deviceCount: 2_180,
    description: 'Blade pitch servo controllers and actuator firmware',
  },
  {
    groupName: 'monitoring-sensors',
    displayName: 'Monitoring Sensors',
    deviceCount: 1_000,
    description: 'Vibration, temperature, and load monitoring endpoints',
  },
  {
    groupName: 'met-mast-sensors',
    displayName: 'Met Mast Sensors',
    deviceCount: 890,
    description: 'Meteorological mast anemometers and weather instruments',
  },
]
