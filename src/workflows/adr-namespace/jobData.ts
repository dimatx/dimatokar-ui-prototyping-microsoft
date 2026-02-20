/* ─── Shared Job Data ─────────────────────────────────────────
   Used by the ADR Namespace page, Job List, and Job Detail.
   ─────────────────────────────────────────────────────────── */

export interface AduGroupProgress {
  groupName: string
  targeted: number
  onLatest: number
  updateInProgress: number
  newUpdatesAvailable: number
}

export interface HubProgress {
  hubName: string
  total: number
  succeeded: number
  failed: number
  pending: number
  status: 'Running' | 'Completed' | 'Failed' | 'Pending' | 'Skipped'
  /** ADU-only: whether this hub had the update before the job, or it was imported inline */
  importStatus?: 'ready' | 'imported-during-job'
  /** ADU-only: per-group compliance breakdown for this hub */
  aduGroups?: AduGroupProgress[]
}

export interface TimelineEvent {
  time: string
  event: string
  detail?: string
  type: 'start' | 'info' | 'success' | 'warn' | 'error'
}

export interface JobRecord {
  id: string
  name: string
  type: string
  status: 'Running' | 'Completed' | 'Failed' | 'Scheduled'
  namespace: string
  targetMode: 'namespace' | 'group' | 'custom'
  targetName: string
  targetDevices: number
  scheduleMode: 'now' | 'later'
  scheduleDate?: string
  priority: string
  description?: string
  started: string
  startedIso: string
  completedIso?: string
  duration?: string
  createdBy: string
  devices: { succeeded: number; pending: number; failed: number }
  hubProgress: HubProgress[]
  timeline: TimelineEvent[]
  /** ADU Software Update fields — only present on type === 'Software Update' */
  updateRef?: { provider: string; name: string; version: string }
  compatibility?: Array<Record<string, string>>
  rollbackPolicy?: { enabled: boolean; failureThresholdPercent: number; rollbackVersion: string }
  descriptiveLabel?: string
}

export const ALL_JOBS: JobRecord[] = [
  {
    id: 'JOB-1042',
    name: 'Firmware update – v3.2.1',
    type: 'Software Update',
    status: 'Running',
    namespace: 'Texas-Wind-Namespace',
    targetMode: 'namespace',
    targetName: 'Texas-Wind-Namespace',
    targetDevices: 12847,
    scheduleMode: 'now',
    priority: '10',
    description: 'Deploy turbine controller firmware v3.2.1 to all hubs. Patches CVE-2025-3812 (high severity).',
    started: '35 min ago',
    startedIso: '2026-02-19T13:10:00Z',
    createdBy: 'dima@zava.energy',
    devices: { succeeded: 5240, pending: 7365, failed: 242 },
    updateRef: { provider: 'contoso', name: 'firmware-rpi', version: '3.2.1' },
    compatibility: [{ manufacturer: 'contoso', model: 'rpi' }],
    rollbackPolicy: { enabled: true, failureThresholdPercent: 25, rollbackVersion: '3.1.0' },
    hubProgress: [
      {
        hubName: 'hub-tx-wind-01', total: 4250, succeeded: 3980, failed: 42, pending: 228, status: 'Running',
        importStatus: 'ready',
        aduGroups: [
          { groupName: 'turbine-controllers', targeted: 3800, onLatest: 3600, updateInProgress: 150, newUpdatesAvailable: 50 },
          { groupName: 'edge-gateways', targeted: 450, onLatest: 380, updateInProgress: 50, newUpdatesAvailable: 20 },
        ],
      },
      {
        hubName: 'hub-tx-wind-02', total: 3980, succeeded: 1260, failed: 200, pending: 2520, status: 'Running',
        importStatus: 'ready',
        aduGroups: [
          { groupName: 'turbine-controllers', targeted: 3550, onLatest: 1100, updateInProgress: 200, newUpdatesAvailable: 2250 },
          { groupName: 'monitoring-sensors', targeted: 430, onLatest: 160, updateInProgress: 0, newUpdatesAvailable: 270 },
        ],
      },
      {
        hubName: 'hub-tx-wind-03', total: 2617, succeeded: 0, failed: 0, pending: 2617, status: 'Pending',
        importStatus: 'ready',
        aduGroups: [
          { groupName: 'turbine-controllers', targeted: 2617, onLatest: 0, updateInProgress: 0, newUpdatesAvailable: 2617 },
        ],
      },
      {
        hubName: 'hub-tx-wind-04', total: 2000, succeeded: 0, failed: 0, pending: 2000, status: 'Pending',
        importStatus: 'imported-during-job',
        aduGroups: [
          { groupName: 'turbine-controllers', targeted: 2000, onLatest: 0, updateInProgress: 0, newUpdatesAvailable: 2000 },
        ],
      },
    ],
    timeline: [
      { time: '13:10:00', event: 'Job created and queued', type: 'start' },
      { time: '13:10:08', event: 'Validation passed — 4 hubs in scope', type: 'info' },
      { time: '13:10:14', event: 'Execution started on hub-tx-wind-01', detail: '4,250 devices targeted', type: 'info' },
      { time: '13:18:31', event: 'hub-tx-wind-01: 1,000 devices updated successfully', type: 'success' },
      { time: '13:22:47', event: 'Execution started on hub-tx-wind-02', detail: '3,980 devices targeted', type: 'info' },
      { time: '13:28:05', event: 'hub-tx-wind-01: 42 devices timed out — retrying', detail: 'Sensor offline: hub-tx-wind-01/sector-7', type: 'warn' },
      { time: '13:35:12', event: 'hub-tx-wind-02: 200 device failures reported', detail: 'Firmware signature mismatch on legacy controllers', type: 'error' },
      { time: '13:40:00', event: 'hub-tx-wind-01: 3,980 devices completed', type: 'success' },
    ],
  },
  {
    id: 'JOB-1041',
    name: 'Certificate renewal – Q1 2026',
    type: 'Certificate Revocation',
    status: 'Completed',
    namespace: 'Texas-Wind-Namespace',
    targetMode: 'namespace',
    targetName: 'Texas-Wind-Namespace',
    targetDevices: 12847,
    scheduleMode: 'now',
    priority: '5',
    description: 'Rotate all device certificates ahead of Q1 expiry window.',
    started: '2 days ago',
    startedIso: '2026-02-17T08:00:00Z',
    completedIso: '2026-02-17T12:14:00Z',
    duration: '4h 14m',
    createdBy: 'platform-bot@zava.energy',
    devices: { succeeded: 12847, pending: 0, failed: 0 },
    hubProgress: [
      { hubName: 'hub-tx-wind-01', total: 4250, succeeded: 4250, failed: 0, pending: 0, status: 'Completed' },
      { hubName: 'hub-tx-wind-02', total: 3980, succeeded: 3980, failed: 0, pending: 0, status: 'Completed' },
      { hubName: 'hub-tx-wind-03', total: 2617, succeeded: 2617, failed: 0, pending: 0, status: 'Completed' },
      { hubName: 'hub-tx-wind-04', total: 2000, succeeded: 2000, failed: 0, pending: 0, status: 'Completed' },
    ],
    timeline: [
      { time: '08:00:00', event: 'Scheduled job triggered', type: 'start' },
      { time: '08:00:11', event: 'Certificate rotation started on hub-tx-wind-01', type: 'info' },
      { time: '09:12:44', event: 'hub-tx-wind-01: all 4,250 certs renewed', type: 'success' },
      { time: '09:13:02', event: 'Certificate rotation started on hub-tx-wind-02', type: 'info' },
      { time: '10:28:19', event: 'hub-tx-wind-02: all 3,980 certs renewed', type: 'success' },
      { time: '10:28:40', event: 'Certificate rotation started on hub-tx-wind-03', type: 'info' },
      { time: '11:18:55', event: 'hub-tx-wind-03: all 2,617 certs renewed', type: 'success' },
      { time: '11:19:10', event: 'Certificate rotation started on hub-tx-wind-04', type: 'info' },
      { time: '12:13:48', event: 'hub-tx-wind-04: all 2,000 certs renewed', type: 'success' },
      { time: '12:14:00', event: 'Job completed — 12,847 devices renewed, 0 failures', type: 'success' },
    ],
  },
  {
    id: 'JOB-1040',
    name: 'Reboot turbine controllers',
    type: 'Management Action',
    status: 'Completed',
    namespace: 'Texas-Wind-Namespace',
    targetMode: 'group',
    targetName: 'Critical wind sensors',
    targetDevices: 620,
    scheduleMode: 'now',
    priority: '8',
    description: 'Force reboot of turbine controller fleet to clear persistent memory leaks after firmware 3.1.0.',
    started: '5 days ago',
    startedIso: '2026-02-14T14:30:00Z',
    completedIso: '2026-02-14T15:02:00Z',
    duration: '32m',
    createdBy: 'dima@zava.energy',
    devices: { succeeded: 608, pending: 0, failed: 12 },
    hubProgress: [
      { hubName: 'hub-tx-wind-01', total: 290, succeeded: 284, failed: 6, pending: 0, status: 'Completed' },
      { hubName: 'hub-tx-wind-02', total: 220, succeeded: 216, failed: 4, pending: 0, status: 'Completed' },
      { hubName: 'hub-tx-wind-03', total: 110, succeeded: 108, failed: 2, pending: 0, status: 'Completed' },
    ],
    timeline: [
      { time: '14:30:00', event: 'Job created — targeting group "Critical wind sensors"', type: 'start' },
      { time: '14:30:06', event: 'Reboot commands dispatched to hub-tx-wind-01 (290 devices)', type: 'info' },
      { time: '14:41:18', event: 'hub-tx-wind-01: 284 / 290 rebooted, 6 timed out', detail: 'Timed-out devices flagged for manual inspection', type: 'warn' },
      { time: '14:41:30', event: 'Reboot commands dispatched to hub-tx-wind-02 (220 devices)', type: 'info' },
      { time: '14:52:44', event: 'hub-tx-wind-02: 216 / 220 rebooted, 4 offline', type: 'warn' },
      { time: '14:52:55', event: 'Reboot commands dispatched to hub-tx-wind-03 (110 devices)', type: 'info' },
      { time: '15:01:47', event: 'hub-tx-wind-03: 108 / 110 rebooted', type: 'success' },
      { time: '15:02:00', event: 'Job completed — 608 succeeded, 12 failed', type: 'warn' },
    ],
  },
  {
    id: 'JOB-1039',
    name: 'Edge config push – telemetry interval',
    type: 'Management Update',
    status: 'Completed',
    namespace: 'Texas-Wind-Namespace',
    targetMode: 'namespace',
    targetName: 'Texas-Wind-Namespace',
    targetDevices: 12847,
    scheduleMode: 'now',
    priority: '10',
    description: 'Update telemetry reporting interval from 60s → 30s across all assets to improve anomaly detection latency.',
    started: '1 week ago',
    startedIso: '2026-02-12T09:00:00Z',
    completedIso: '2026-02-12T11:48:00Z',
    duration: '2h 48m',
    createdBy: 'dima@zava.energy',
    devices: { succeeded: 12847, pending: 0, failed: 0 },
    hubProgress: [
      { hubName: 'hub-tx-wind-01', total: 4250, succeeded: 4250, failed: 0, pending: 0, status: 'Completed' },
      { hubName: 'hub-tx-wind-02', total: 3980, succeeded: 3980, failed: 0, pending: 0, status: 'Completed' },
      { hubName: 'hub-tx-wind-03', total: 2617, succeeded: 2617, failed: 0, pending: 0, status: 'Completed' },
      { hubName: 'hub-tx-wind-04', total: 2000, succeeded: 2000, failed: 0, pending: 0, status: 'Completed' },
    ],
    timeline: [
      { time: '09:00:00', event: 'Job created', type: 'start' },
      { time: '09:00:09', event: 'Property update dispatched to all hubs', detail: 'telemetryInterval: 60 → 30', type: 'info' },
      { time: '09:52:14', event: 'hub-tx-wind-01: all 4,250 devices acknowledged', type: 'success' },
      { time: '10:31:08', event: 'hub-tx-wind-02: all 3,980 devices acknowledged', type: 'success' },
      { time: '11:14:22', event: 'hub-tx-wind-03: all 2,617 devices acknowledged', type: 'success' },
      { time: '11:47:55', event: 'hub-tx-wind-04: all 2,000 devices acknowledged', type: 'success' },
      { time: '11:48:00', event: 'Job completed — 12,847 devices updated', type: 'success' },
    ],
  },
  {
    id: 'JOB-1038',
    name: 'Firmware update – v3.1.0',
    type: 'Software Update',
    status: 'Completed',
    namespace: 'Texas-Wind-Namespace',
    targetMode: 'namespace',
    targetName: 'Texas-Wind-Namespace',
    targetDevices: 12847,
    scheduleMode: 'later',
    scheduleDate: '2026-02-05T02:00:00Z',
    priority: '10',
    description: 'Scheduled off-hours rollout of turbine firmware v3.1.0.',
    started: '2 weeks ago',
    startedIso: '2026-02-05T02:00:00Z',
    completedIso: '2026-02-05T09:22:00Z',
    duration: '7h 22m',
    createdBy: 'ci-pipeline@zava.energy',
    devices: { succeeded: 12529, pending: 0, failed: 318 },
    hubProgress: [
      { hubName: 'hub-tx-wind-01', total: 4250, succeeded: 4100, failed: 150, pending: 0, status: 'Completed' },
      { hubName: 'hub-tx-wind-02', total: 3980, succeeded: 3880, failed: 100, pending: 0, status: 'Completed' },
      { hubName: 'hub-tx-wind-03', total: 2617, succeeded: 2549, failed: 68, pending: 0, status: 'Completed' },
      { hubName: 'hub-tx-wind-04', total: 2000, succeeded: 2000, failed: 0, pending: 0, status: 'Completed' },
    ],
    timeline: [
      { time: '02:00:00', event: 'Scheduled job triggered', type: 'start' },
      { time: '02:00:14', event: 'Firmware package validated — v3.1.0', type: 'info' },
      { time: '02:00:21', event: 'Rollout started on hub-tx-wind-01', type: 'info' },
      { time: '04:12:30', event: 'hub-tx-wind-01: 150 failures (legacy TurbineController-X600 incompatible)', detail: '150 devices require manual upgrade path', type: 'error' },
      { time: '04:13:00', event: 'hub-tx-wind-01 partial completion: 4,100 / 4,250', type: 'warn' },
      { time: '05:55:11', event: 'hub-tx-wind-02: 3,880 / 3,980 completed, 100 failures', type: 'warn' },
      { time: '07:44:02', event: 'hub-tx-wind-03: 2,549 / 2,617 completed, 68 failures', type: 'warn' },
      { time: '09:22:00', event: 'hub-tx-wind-04: all 2,000 completed successfully', type: 'success' },
      { time: '09:22:00', event: 'Job completed — 12,529 succeeded, 318 failed', type: 'warn' },
    ],
  },
  {
    id: 'JOB-1037',
    name: 'Security audit — access token revocation',
    type: 'Certificate Revocation',
    status: 'Failed',
    namespace: 'Texas-Wind-Namespace',
    targetMode: 'group',
    targetName: 'Outdated firmware devices',
    targetDevices: 6203,
    scheduleMode: 'now',
    priority: '1',
    description: 'Emergency revocation of compromised SAS tokens following security incident.',
    started: '3 weeks ago',
    startedIso: '2026-01-29T16:45:00Z',
    completedIso: '2026-01-29T17:12:00Z',
    duration: '27m',
    createdBy: 'security-bot@zava.energy',
    devices: { succeeded: 1840, pending: 0, failed: 4363 },
    hubProgress: [
      { hubName: 'hub-tx-wind-01', total: 2400, succeeded: 1840, failed: 560, pending: 0, status: 'Failed' },
      { hubName: 'hub-tx-wind-02', total: 2203, succeeded: 0, failed: 2203, pending: 0, status: 'Failed' },
      { hubName: 'hub-tx-wind-03', total: 1600, succeeded: 0, failed: 1600, pending: 0, status: 'Failed' },
    ],
    timeline: [
      { time: '16:45:00', event: 'Emergency job triggered by security-bot', type: 'start' },
      { time: '16:45:04', event: 'Token revocation started on hub-tx-wind-01', type: 'info' },
      { time: '16:51:30', event: 'hub-tx-wind-01: Certificate Management service unreachable on 560 devices', type: 'error' },
      { time: '16:52:00', event: 'hub-tx-wind-02: DPS endpoint returned 503 — hub unreachable', detail: 'Hub maintenance window collision', type: 'error' },
      { time: '16:52:00', event: 'hub-tx-wind-03: DPS endpoint returned 503', type: 'error' },
      { time: '16:55:14', event: 'hub-tx-wind-01: 1,840 tokens revoked successfully', type: 'success' },
      { time: '17:12:00', event: 'Job failed — 4,363 / 6,203 devices unreachable', detail: 'Manual remediation required for hub-tx-wind-02 and hub-tx-wind-03', type: 'error' },
    ],
  },
  {
    id: 'JOB-1036',
    name: 'Planned maintenance reboot – Q1 window',
    type: 'Management Action',
    status: 'Scheduled',
    namespace: 'Texas-Wind-Namespace',
    targetMode: 'namespace',
    targetName: 'Texas-Wind-Namespace',
    targetDevices: 12847,
    scheduleMode: 'later',
    scheduleDate: '2026-02-28T01:00:00Z',
    priority: '10',
    description: 'Quarterly maintenance reboot of the full device fleet during the approved off-peak window.',
    started: 'Feb 28 at 1:00 AM',
    startedIso: '2026-02-28T01:00:00Z',
    createdBy: 'dima@zava.energy',
    devices: { succeeded: 0, pending: 12847, failed: 0 },
    hubProgress: [
      { hubName: 'hub-tx-wind-01', total: 4250, succeeded: 0, failed: 0, pending: 4250, status: 'Pending' },
      { hubName: 'hub-tx-wind-02', total: 3980, succeeded: 0, failed: 0, pending: 3980, status: 'Pending' },
      { hubName: 'hub-tx-wind-03', total: 2617, succeeded: 0, failed: 0, pending: 2617, status: 'Pending' },
      { hubName: 'hub-tx-wind-04', total: 2000, succeeded: 0, failed: 0, pending: 2000, status: 'Pending' },
    ],
    timeline: [
      { time: 'Feb 19 – 09:30', event: 'Job scheduled by dima@zava.energy', detail: 'Scheduled for Feb 28 at 1:00 AM UTC', type: 'start' },
    ],
  },
]
