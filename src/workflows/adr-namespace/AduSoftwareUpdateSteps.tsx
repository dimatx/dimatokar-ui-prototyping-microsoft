/* ─── ADU Software Update Wizard Steps ──────────────────────────────────────────
   Self-contained module for the Software Update job flow.

   To remove this entire flow:
     1. Delete this file and aduData.ts
     2. Remove the "ADU Software Update Integration" import block in NewJobWizard.tsx
     3. Remove `deviceUpdateEnabled` from NewJobWizardProps in NewJobWizard.tsx
     4. Remove the `if (jobType === 'software-update') return ADU_SW_STEPS` line in getSteps()
     5. Remove the `const [aduState, ...]` useState in the wizard
     6. Remove the two ADU step cases in canProceed()
     7. Remove the ADU step rendering blocks and <AduReviewSection> in the wizard JSX
     8. Remove `deviceUpdateEnabled` pass-through in Page.tsx
   ─────────────────────────────────────────────────────────────────────────────── */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, ChevronDown, Package, RotateCcw, FileText,
} from 'lucide-react'
import type { AduUpdate } from './aduData'
import { ADU_UPDATES } from './aduData'

// ─── Step sequence ────────────────────────────────────────────────────────────
// Note: 'Target' is shared with the main wizard StepTarget (reused as-is).

export const ADU_SW_STEPS = [
  'Job Type', 'Basics', 'Target', 'Select Update', 'Rollback', 'Schedule', 'Review',
]

// ─── Shared state shape ───────────────────────────────────────────────────────

export interface AduWizardState {
  selectedUpdate: AduUpdate | null
  rollback: {
    enabled: boolean
    thresholdPercent: number
    rollbackVersion: string
  }
}

export const initialAduState: AduWizardState = {
  selectedUpdate: null,
  rollback: { enabled: false, thresholdPercent: 25, rollbackVersion: '1.3.0' },
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function validateAduStep(stepName: string, state: AduWizardState): boolean {
  switch (stepName) {
    case 'Select Update':
      return state.selectedUpdate !== null
    case 'Rollback':
      return true
    default:
      return false
  }
}

// ─── Step: Select Update ──────────────────────────────────────────────────────

export function StepSelectUpdate({
  state,
  onChange,
}: {
  state: AduWizardState
  onChange: (patch: Partial<AduWizardState>) => void
}) {
  const updates = ADU_UPDATES.slice().reverse() // newest first
  const [expandedKey, setExpandedKey] = useState<string | null>(
    state.selectedUpdate
      ? `${state.selectedUpdate.provider}/${state.selectedUpdate.name}/${state.selectedUpdate.version}`
      : null
  )

  const selectedKey = state.selectedUpdate
    ? `${state.selectedUpdate.provider}/${state.selectedUpdate.name}/${state.selectedUpdate.version}`
    : null

  function select(update: AduUpdate) {
    onChange({ selectedUpdate: update })
    setExpandedKey(`${update.provider}/${update.name}/${update.version}`)
  }

  function toggleExpand(key: string, e: React.MouseEvent) {
    e.stopPropagation()
    setExpandedKey(k => k === key ? null : key)
  }

  function fmtSize(mb: number) {
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(mb * 1024).toFixed(0)} KB`
  }

  function shortHash(h: string) {
    return h.slice(0, 8) + '…' + h.slice(-8)
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Select Update</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose the firmware update to deploy to the selected devices.
        </p>
      </div>

      <div className="space-y-2">
        {updates.map(update => {
          const key = `${update.provider}/${update.name}/${update.version}`
          const isSelected = selectedKey === key
          const isExpanded = expandedKey === key
          const isLatest = update.version === ADU_UPDATES[ADU_UPDATES.length - 1].version

          return (
            <div
              key={key}
              className={`rounded-lg border transition-all ${isSelected ? 'border-foreground ring-1 ring-foreground' : 'hover:bg-muted/10'}`}
            >
              {/* Row header */}
              <div
                className="flex items-center gap-3 p-3 cursor-pointer"
                onClick={() => select(update)}
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isSelected ? 'bg-foreground text-white' : 'bg-muted text-foreground'}`}>
                  <Package className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{update.displayName}</span>
                    <span className={`text-xs font-mono font-semibold px-1.5 py-0.5 rounded ${isSelected ? 'bg-foreground/10 text-foreground' : 'bg-muted text-muted-foreground'}`}>
                      v{update.version}
                    </span>
                    {isLatest && (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        Latest
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{update.description}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isSelected && <Check className="h-4 w-4 text-foreground" />}
                  <button
                    onClick={e => toggleExpand(key, e)}
                    className="rounded p-1 hover:bg-muted transition-colors"
                  >
                    <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t px-3 py-3 space-y-3">
                      <p className="text-[11px] text-slate-600">{update.description}</p>

                      <div className="space-y-1">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Compatibility</p>
                        {update.compatibility.map((c, i) => (
                          <p key={i} className="text-[11px] font-mono text-slate-700">
                            {c.manufacturer} / {c.model}
                          </p>
                        ))}
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Files</p>
                        {update.files.map(f => (
                          <div key={f.name} className="flex items-start gap-2 rounded-md border bg-slate-50 px-2.5 py-2">
                            <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-mono font-medium text-slate-700 truncate">{f.name}</p>
                              <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-[10px] text-muted-foreground">{fmtSize(f.sizeMb)}</span>
                                <span className="text-[10px] text-muted-foreground font-mono">SHA256: {shortHash(f.sha256)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <p className="text-[10px] text-muted-foreground">
                        Imported {new Date(update.importedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        &nbsp;&middot;&nbsp;Handler: <span className="font-mono">{update.handler}</span>
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
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

  const availableVersions = ADU_UPDATES
    .filter(u => u.version !== state.selectedUpdate?.version)
    .map(u => u.version)
    .sort((a, b) => b.localeCompare(a))

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
                        <option key={v} value={v}>v{v} — {ADU_UPDATES.find(u => u.version === v)?.displayName ?? ''}</option>
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
                      if <span className="font-medium">&gt;{rollback.thresholdPercent}%</span> of devices fail.
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
  const totalSize = u.files.reduce((s, f) => s + f.sizeMb, 0)

  return (
    <>
      <div className="px-4 py-3 border-b">
        <p className="text-xs font-medium text-muted-foreground mb-2">Update</p>
        <div className="flex items-center gap-2">
          <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs font-medium">{u.displayName}</span>
          <span className="text-xs font-mono text-muted-foreground">v{u.version}</span>
        </div>
        <p className="text-[11px] text-muted-foreground ml-5 mt-0.5">
          {u.files.length} file{u.files.length !== 1 ? 's' : ''} &middot; {totalSize.toFixed(1)} MB total
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
