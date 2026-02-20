/* ─── ADU Software Update Wizard Steps ──────────────────────────────────────────
   Self-contained module for the Software Update job flow.

   To remove this entire flow:
     1. Delete this file and aduData.ts
     2. Remove the "ADU Software Update Integration" import block in NewJobWizard.tsx
     3. Remove `deviceUpdateEnabled` from NewJobWizardProps in NewJobWizard.tsx
     4. Remove the `if (jobType === 'software-update') return ADU_SW_STEPS` line in getSteps()
     5. Remove the `const [aduState, ...]` useState in the wizard
     6. Remove the three ADU step cases in canProceed()
     7. Remove the ADU step rendering blocks and <AduReviewSection> in the wizard JSX
     8. Remove `deviceUpdateEnabled` pass-through in Page.tsx
   ─────────────────────────────────────────────────────────────────────────────── */

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, ChevronDown, AlertTriangle, Upload, Loader2,
  Package, RotateCcw, FileCode2, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { AduUpdate } from './aduData'
import { ADU_HUB_CATALOGS, ADU_HUB_GROUPS } from './aduData'

// ─── Step sequence ────────────────────────────────────────────────────────────

export const ADU_SW_STEPS = [
  'Job Type', 'Basics', 'Select Update', 'Target Groups', 'Rollback', 'Schedule', 'Review',
]

// ─── Shared state shape ───────────────────────────────────────────────────────

export interface AduWizardState {
  selectedUpdate: AduUpdate | null
  /** Internal: keys are `hubName:provider/name/version`; never shown in UI */
  _hubsImportedDuringJob: string[]
  /** Keys are group names (e.g. "turbine-controllers") — NOT hub names */
  groupSelections: Record<string, boolean>
  rollback: {
    enabled: boolean
    thresholdPercent: number
    rollbackVersion: string
  }
}

export const initialAduState: AduWizardState = {
  selectedUpdate: null,
  _hubsImportedDuringJob: [],
  groupSelections: {},
  rollback: { enabled: false, thresholdPercent: 25, rollbackVersion: '3.1.0' },
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function validateAduStep(stepName: string, state: AduWizardState): boolean {
  switch (stepName) {
    case 'Select Update':
      if (!state.selectedUpdate) return false
      return getUpdateReadiness(state.selectedUpdate, state._hubsImportedDuringJob).missingCount === 0
    case 'Target Groups':
      return true
    case 'Rollback':
      return true
    default:
      return false
  }
}

// ─── Internal helpers (hubs never surface to UI) ─────────────────────────────

function getUniqueUpdates(): AduUpdate[] {
  const seen = new Set<string>()
  const result: AduUpdate[] = []
  for (const catalog of ADU_HUB_CATALOGS) {
    for (const u of catalog.updates) {
      const key = `${u.provider}/${u.name}/${u.version}`
      if (!seen.has(key)) { seen.add(key); result.push(u) }
    }
  }
  return result.sort((a, b) => b.version.localeCompare(a.version))
}

function getUpdateReadiness(
  update: AduUpdate,
  importedDuringJob: string[],
): { readyCount: number; totalHubs: number; missingCount: number } {
  const totalHubs = ADU_HUB_CATALOGS.length
  let readyCount = 0
  for (const catalog of ADU_HUB_CATALOGS) {
    const alreadyIn = catalog.updates.some(
      u => u.provider === update.provider && u.name === update.name && u.version === update.version
    )
    const importedNow = importedDuringJob.includes(
      `${catalog.hubName}:${update.provider}/${update.name}/${update.version}`
    )
    if (alreadyIn || importedNow) readyCount++
  }
  return { readyCount, totalHubs, missingCount: totalHubs - readyCount }
}

/** Returns the first hub that is missing the update — used only during import flow */
function getFirstMissingHub(update: AduUpdate, importedDuringJob: string[]): string | null {
  for (const catalog of ADU_HUB_CATALOGS) {
    const alreadyIn = catalog.updates.some(
      u => u.provider === update.provider && u.name === update.name && u.version === update.version
    )
    const importedNow = importedDuringJob.includes(
      `${catalog.hubName}:${update.provider}/${update.name}/${update.version}`
    )
    if (!alreadyIn && !importedNow) return catalog.hubName
  }
  return null
}

interface AggregatedGroup {
  groupName: string
  deviceCount: number
  onLatest: number
  updateInProgress: number
  newUpdatesAvailable: number
  hasActiveDeployment: boolean
  activeDeploymentVersion?: string
}

function aggregateGroups(): AggregatedGroup[] {
  const map = new Map<string, AggregatedGroup>()
  for (const hubEntry of ADU_HUB_GROUPS) {
    for (const g of hubEntry.groups) {
      const existing = map.get(g.groupName)
      if (existing) {
        existing.deviceCount += g.deviceCount
        existing.onLatest += g.onLatest
        existing.updateInProgress += g.updateInProgress
        existing.newUpdatesAvailable += g.newUpdatesAvailable
        if (g.hasActiveDeployment) {
          existing.hasActiveDeployment = true
          existing.activeDeploymentVersion ??= g.activeDeploymentVersion
        }
      } else {
        map.set(g.groupName, { ...g })
      }
    }
  }
  // Sort: groups needing updates first
  return [...map.values()].sort(
    (a, b) => (b.newUpdatesAvailable + b.updateInProgress) - (a.newUpdatesAvailable + a.updateInProgress)
  )
}

// ─── Step: Select Update ──────────────────────────────────────────────────────

export function StepSelectUpdate({
  state,
  onChange,
}: {
  state: AduWizardState
  onChange: (patch: Partial<AduWizardState>) => void
}) {
  const updates = useMemo(getUniqueUpdates, [])
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [showImportForm, setShowImportForm] = useState(false)
  const [importLabel, setImportLabel] = useState('')
  const [importFileSelected, setImportFileSelected] = useState(false)
  const [importProgress, setImportProgress] = useState<'idle' | 'uploading' | 'done'>('idle')

  useEffect(() => {
    if (state.selectedUpdate) {
      const k = `${state.selectedUpdate.provider}/${state.selectedUpdate.name}/${state.selectedUpdate.version}`
      setExpandedKey(k)
    }
  }, [])

  function selectUpdate(update: AduUpdate) {
    onChange({ selectedUpdate: update, groupSelections: {} })
    setExpandedKey(`${update.provider}/${update.name}/${update.version}`)
    setShowImportForm(false)
  }

  function handleImport() {
    if (!state.selectedUpdate) return
    setImportProgress('uploading')
    setTimeout(() => {
      const missingHub = getFirstMissingHub(state.selectedUpdate!, state._hubsImportedDuringJob)
      if (missingHub) {
        const key = `${missingHub}:${state.selectedUpdate!.provider}/${state.selectedUpdate!.name}/${state.selectedUpdate!.version}`
        onChange({ _hubsImportedDuringJob: [...state._hubsImportedDuringJob, key] })
      }
      setImportProgress('done')
      setTimeout(() => {
        setShowImportForm(false)
        setImportLabel('')
        setImportFileSelected(false)
        setImportProgress('idle')
      }, 900)
    }, 1600)
  }

  const selectedKey = state.selectedUpdate
    ? `${state.selectedUpdate.provider}/${state.selectedUpdate.name}/${state.selectedUpdate.version}`
    : null

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Select Update</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose an update to deploy across the namespace. All linked hubs will receive the deployment.
        </p>
      </div>

      <div className="space-y-2">
        {updates.map(update => {
          const key = `${update.provider}/${update.name}/${update.version}`
          const isSelected = selectedKey === key
          const isExpanded = expandedKey === key
          const readiness = getUpdateReadiness(update, state._hubsImportedDuringJob)
          const allReady = readiness.missingCount === 0

          return (
            <div
              key={key}
              className={`rounded-lg border transition-all ${isSelected ? 'border-foreground ring-1 ring-foreground' : 'hover:bg-muted/10'}`}
            >
              <div
                className="flex items-center gap-3 p-3 cursor-pointer"
                onClick={() => selectUpdate(update)}
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isSelected ? 'bg-foreground text-white' : 'bg-muted text-foreground'}`}>
                  <Package className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium font-mono">{update.provider} / {update.name}</span>
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${isSelected ? 'bg-foreground/10 text-foreground' : 'bg-muted text-muted-foreground'}`}>
                      v{update.version}
                    </span>
                    {allReady ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        <Check className="h-2.5 w-2.5" />
                        Ready across all hubs
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        Available on {readiness.readyCount} of {readiness.totalHubs} hubs
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {update.compatibility.map(c => `${c.manufacturer} · ${c.model}`).join(', ')}
                    &nbsp;&middot;&nbsp;{update.files.length} file{update.files.length !== 1 ? 's' : ''}
                    &nbsp;&middot;&nbsp;{update.handler}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isSelected && <Check className="h-4 w-4 text-foreground" />}
                  <button
                    onClick={e => { e.stopPropagation(); setExpandedKey(k => k === key ? null : key) }}
                    className="rounded p-1 hover:bg-muted transition-colors"
                  >
                    <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Namespace readiness details + inline import */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t px-3 py-3 space-y-2.5">
                      {/* Namespace-level readiness bar */}
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          Namespace readiness
                        </p>
                        {!allReady && !showImportForm && isSelected && (
                          <button
                            onClick={() => setShowImportForm(true)}
                            className="flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 px-2 py-1 rounded transition-colors"
                          >
                            <Upload className="h-2.5 w-2.5" />
                            Import to namespace
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted-foreground/20 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${(readiness.readyCount / readiness.totalHubs) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {readiness.readyCount}/{readiness.totalHubs} hubs
                        </span>
                      </div>

                      <p className="text-[11px] text-muted-foreground">
                        {allReady
                          ? `Available across all ${readiness.totalHubs} hubs in this namespace.`
                          : `Missing on ${readiness.missingCount} hub${readiness.missingCount !== 1 ? 's' : ''}. Import to make it available namespace-wide before deploying.`}
                      </p>

                      {/* Inline import form (no hub names exposed) */}
                      <AnimatePresence>
                        {showImportForm && isSelected && !allReady && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.16 }}
                            className="overflow-hidden"
                          >
                            <div className="rounded-lg border bg-slate-50 p-3 space-y-2.5">
                              <p className="text-[11px] font-semibold text-slate-700">
                                Import update to namespace
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                The update will be imported to all hubs that are currently missing it.
                              </p>

                              <div className="space-y-1">
                                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                                  Descriptive label
                                </label>
                                <Input
                                  value={importLabel}
                                  onChange={e => setImportLabel(e.target.value)}
                                  placeholder={`${update.name}-v${update.version}`}
                                  className="h-7 text-xs"
                                  autoFocus
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                                  Storage container
                                </label>
                                {!importFileSelected ? (
                                  <button
                                    onClick={() => setImportFileSelected(true)}
                                    className="flex items-center gap-1.5 w-full rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground hover:bg-white hover:border-slate-300 transition-colors"
                                  >
                                    <FileCode2 className="h-3.5 w-3.5" />
                                    Select from storage container
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-2 rounded-md border bg-white px-3 py-2">
                                    <FileCode2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                    <span className="text-xs font-mono text-slate-700 flex-1 truncate">
                                      {update.files[0]}
                                    </span>
                                    <button onClick={() => setImportFileSelected(false)} className="text-muted-foreground hover:text-red-500 transition-colors">
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2 pt-0.5">
                                {importProgress === 'done' ? (
                                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                                    <Check className="h-3.5 w-3.5" /> Import complete
                                  </span>
                                ) : (
                                  <>
                                    <Button
                                      size="sm"
                                      className="h-7 text-xs gap-1"
                                      disabled={!importFileSelected || importProgress === 'uploading'}
                                      onClick={handleImport}
                                    >
                                      {importProgress === 'uploading'
                                        ? <><Loader2 className="h-3 w-3 animate-spin" /> Importing…</>
                                        : <><Upload className="h-3 w-3" /> Import</>
                                      }
                                    </Button>
                                    <button
                                      onClick={() => setShowImportForm(false)}
                                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                      disabled={importProgress === 'uploading'}
                                    >
                                      Cancel
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {state.selectedUpdate && getUpdateReadiness(state.selectedUpdate, state._hubsImportedDuringJob).missingCount > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Expand the update above and import it to the namespace before proceeding.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Step: Target Groups ──────────────────────────────────────────────────────

export function StepTargetGroups({
  state,
  onChange,
}: {
  state: AduWizardState
  onChange: (patch: Partial<AduWizardState>) => void
}) {
  const groups = useMemo(aggregateGroups, [])

  // Default: select groups that have devices needing updates
  useEffect(() => {
    if (Object.keys(state.groupSelections).length > 0) return
    const defaults: Record<string, boolean> = {}
    for (const g of groups) {
      defaults[g.groupName] = g.newUpdatesAvailable > 0 || g.updateInProgress > 0
    }
    onChange({ groupSelections: defaults })
  }, [])

  function toggleGroup(groupName: string) {
    onChange({
      groupSelections: {
        ...state.groupSelections,
        [groupName]: !state.groupSelections[groupName],
      },
    })
  }

  const totalDevicesTargeted = groups.reduce((sum, g) => {
    if (state.groupSelections[g.groupName]) sum += g.newUpdatesAvailable + g.updateInProgress
    return sum
  }, 0)

  const selectedCount = Object.values(state.groupSelections).filter(Boolean).length

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Target Groups</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Device groups across the namespace. Uncheck groups to exclude them from this deployment.
        </p>
      </div>

      {state.selectedUpdate && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2">
          <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground">Deploying</span>
          <span className="text-xs font-mono font-medium text-foreground">
            {state.selectedUpdate.provider} / {state.selectedUpdate.name} /{' '}
            <span className="font-semibold">v{state.selectedUpdate.version}</span>
          </span>
        </div>
      )}

      <div className="divide-y rounded-lg border overflow-hidden">
        {groups.map(group => {
          const selected = state.groupSelections[group.groupName] ?? false
          return (
            <div
              key={group.groupName}
              className={`flex items-start gap-3 px-3 py-3 cursor-pointer transition-colors hover:bg-muted/10 ${!selected ? 'opacity-50' : ''}`}
              onClick={() => toggleGroup(group.groupName)}
            >
              <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${selected ? 'border-foreground bg-foreground' : 'border-muted-foreground/40'}`}>
                {selected && <Check className="h-2.5 w-2.5 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-800">{group.groupName}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {group.deviceCount.toLocaleString()} devices
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {group.newUpdatesAvailable > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                      {group.newUpdatesAvailable.toLocaleString()} needs update
                    </span>
                  )}
                  {group.updateInProgress > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                      {group.updateInProgress.toLocaleString()} in progress
                    </span>
                  )}
                  {group.onLatest > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      {group.onLatest.toLocaleString()} on latest
                    </span>
                  )}
                </div>
                {group.hasActiveDeployment && group.activeDeploymentVersion && (
                  <p className="text-[10px] text-amber-600 mt-1">
                    ⚠ Has active deployment (v{group.activeDeploymentVersion}) — this will supersede it
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {totalDevicesTargeted > 0 && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{selectedCount} group{selectedCount !== 1 ? 's' : ''}</span> selected
          &nbsp;&middot;&nbsp;
          <span className="font-medium text-foreground">{totalDevicesTargeted.toLocaleString()} devices</span> will be targeted
        </p>
      )}
    </div>
  )
}

// ─── Step: Rollback Policy ────────────────────────────────────────────────────

export function StepRollbackPolicy({
  state,
  onChange,
}: {
  state: AduWizardState
  onChange: (patch: Partial<AduWizardState>) => void
}) {
  const { rollback } = state

  const availableVersions = useMemo(() => {
    const seen = new Set<string>()
    const result: string[] = []
    for (const catalog of ADU_HUB_CATALOGS) {
      for (const u of catalog.updates) {
        if (!seen.has(u.version) && u.version !== state.selectedUpdate?.version) {
          seen.add(u.version)
          result.push(u.version)
        }
      }
    }
    return result.sort((a, b) => b.localeCompare(a))
  }, [state.selectedUpdate?.version])

  function setRollback(patch: Partial<typeof rollback>) {
    onChange({ rollback: { ...rollback, ...patch } })
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold">Rollback Policy</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Automatically roll back all devices in a group if the failure rate exceeds a threshold.
          Applied namespace-wide.
        </p>
      </div>

      <div className={`rounded-lg border transition-all ${rollback.enabled ? 'border-foreground ring-1 ring-foreground' : ''}`}>
        <button
          onClick={() => setRollback({ enabled: !rollback.enabled })}
          className="w-full flex items-start gap-3 p-4 text-left"
        >
          <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${rollback.enabled ? 'border-foreground bg-foreground' : 'border-muted-foreground/40'}`}>
            {rollback.enabled && <Check className="h-3 w-3 text-white" />}
          </div>
          <div>
            <p className="text-sm font-medium">Enable automatic rollback</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Roll back to a stable version if failures exceed the threshold
            </p>
          </div>
        </button>

        <AnimatePresence>
          {rollback.enabled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="border-t px-4 py-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Failure threshold
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={5} max={75} step={5}
                      value={rollback.thresholdPercent}
                      onChange={e => setRollback({ thresholdPercent: Number(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="w-12 text-center text-sm font-semibold text-foreground">
                      {rollback.thresholdPercent}%
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    If more than {rollback.thresholdPercent}% of devices in a group fail, all devices in that group roll back.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Roll back to version
                  </label>
                  {availableVersions.length > 0 ? (
                    <select
                      value={rollback.rollbackVersion || availableVersions[0]}
                      onChange={e => setRollback({ rollbackVersion: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {availableVersions.map(v => (
                        <option key={v} value={v}>v{v}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No previous versions available.</p>
                  )}
                </div>

                <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <p className="text-xs text-slate-600">
                      On failure: roll back to{' '}
                      <span className="font-mono font-medium">v{rollback.rollbackVersion || availableVersions[0]}</span>{' '}
                      if <span className="font-medium">&gt;{rollback.thresholdPercent}%</span> of devices in any group fail.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!rollback.enabled && (
        <p className="text-xs text-muted-foreground">
          No automatic rollback — failed devices stay at their current version until manually retried.
        </p>
      )}
    </div>
  )
}

// ─── Review section ───────────────────────────────────────────────────────────

export function AduReviewSection({ state }: { state: AduWizardState }) {
  if (!state.selectedUpdate) return null
  const u = state.selectedUpdate
  const selectedGroups = Object.entries(state.groupSelections).filter(([, v]) => v)
  const groups = useMemo(aggregateGroups, [])
  const totalDevices = groups.reduce((sum, g) => {
    if (state.groupSelections[g.groupName]) sum += g.newUpdatesAvailable + g.updateInProgress
    return sum
  }, 0)

  return (
    <>
      <div className="px-4 py-3 border-b">
        <p className="text-xs font-medium text-muted-foreground mb-2">Update</p>
        <div className="flex items-center gap-2">
          <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs font-mono">
            {u.provider} / {u.name} /{' '}
            <span className="font-semibold">v{u.version}</span>
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground ml-5 mt-0.5">
          {u.compatibility.map(c => `${c.manufacturer} · ${c.model}`).join(', ')}
          &nbsp;&middot;&nbsp;{u.handler}
        </p>
      </div>

      <div className="px-4 py-3 border-b">
        <p className="text-xs font-medium text-muted-foreground mb-1">Scope</p>
        <p className="text-sm font-medium">
          {totalDevices.toLocaleString()} devices &middot; {selectedGroups.length} group{selectedGroups.length !== 1 ? 's' : ''}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {selectedGroups.map(([name]) => name).join(', ')}
        </p>
      </div>

      {state.rollback.enabled && (
        <div className="px-4 py-3 border-b">
          <p className="text-xs font-medium text-muted-foreground mb-1">Rollback Policy</p>
          <p className="text-xs text-foreground">
            Auto-rollback to{' '}
            <span className="font-mono font-medium">v{state.rollback.rollbackVersion}</span>{' '}
            if failure rate exceeds{' '}
            <span className="font-medium">{state.rollback.thresholdPercent}%</span>
          </p>
        </div>
      )}
    </>
  )
}
