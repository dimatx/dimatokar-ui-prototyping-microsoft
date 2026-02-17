import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Settings2,
  Terminal,
  RefreshCw,
  Globe,
  Server,
  Copy,
  Bookmark,
  FolderOpen,
  Save,
  ShieldX,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

/* ─── Types ─────────────────────────────────────────────────── */

import type { Hub } from './Page'

interface TwinSetting {
  id: string
  path: string
  value: string
}

interface PerHubTarget {
  hubName: string
  condition: string
}

type TargetingMode = 'across' | 'per-hub' | 'adr'

interface AdrFilter {
  field: string
  value: string
}

const ADR_FILTER_FIELDS = [
  { id: 'manufacturer', label: 'Manufacturer', sample: 'Contoso Wind Systems' },
  { id: 'model', label: 'Model', sample: 'TurbineController-X700' },
  { id: 'swVersion', label: 'Software Version', sample: '3.1.0' },
  { id: 'osName', label: 'OS Name', sample: 'Azure RTOS' },
]

export interface CreatedJob {
  id: string
  name: string
  type: string
  status: string
  targets: string
  started: string
  hubProgress?: { hubName: string; total: number; completed: number; status: string }[]
}

export interface ExistingJob {
  id: string
  name: string
  type: string
  status: string
  targets: string
  started: string
}

interface SavedGroup {
  id: string
  name: string
  condition: string
}

interface NewJobWizardProps {
  linkedHubs: Hub[]
  existingJobs: ExistingJob[]
  onClose: () => void
  onCreate: (job: CreatedJob) => void
}

const JOB_TYPES = [
  {
    id: 'twin-update',
    name: 'Device Twin Update',
    description: 'Update desired properties on device twins across hubs',
    icon: Settings2,
  },
  {
    id: 'cert-revocation',
    name: 'Certificate Revocation',
    description: 'Revoke device certificates across hubs and trigger re-provisioning',
    icon: ShieldX,
  },
  {
    id: 'software-update',
    name: 'Software Update',
    description: 'Deploy firmware or software packages to targeted devices',
    icon: RefreshCw,
  },
  {
    id: 'direct-method',
    name: 'Invoke Direct Method',
    description: 'Call a direct method on devices and receive responses',
    icon: Terminal,
  },
  {
    id: 'outer-loop',
    name: 'Update ARM Records',
    description: 'Sync device state changes back to ARM resource representations',
    icon: Globe,
  },
]

const TWIN_STEPS = ['Job Type', 'Details', 'Hubs', 'Twin Settings', 'Targeting', 'Review']
const DEFAULT_STEPS = ['Job Type', 'Details', 'Hubs', 'Targeting', 'Review']

function getSteps(jobType: string | null) {
  if (jobType === 'twin-update') return TWIN_STEPS
  return DEFAULT_STEPS
}

const JOB_TYPE_LABELS: Record<string, string> = {
  'twin-update': 'Twin Update',
  'cert-revocation': 'Cert Revocation',
  'software-update': 'Software Update',
  'direct-method': 'Direct Method',
  'outer-loop': 'Update ARM Records',
}

const SAMPLE_SAVED_GROUPS: SavedGroup[] = [
  { id: 'g1', name: 'All Abilene turbines', condition: "tags.site = 'abilene' AND tags.assetType = 'turbine'" },
  { id: 'g2', name: 'Edge devices – firmware < 3.2', condition: "properties.reported.firmware.version < '3.2.0'" },
  { id: 'g3', name: 'Critical wind sensors', condition: "tags.priority = 'critical' AND tags.assetType = 'sensor'" },
  { id: 'g4', name: 'Sweetwater cluster', condition: "tags.site = 'sweetwater' AND tags.cluster = 'sw-main'" },
]

/* ─── Wizard ────────────────────────────────────────────────── */

export function NewJobWizard({ linkedHubs, existingJobs, onClose, onCreate }: NewJobWizardProps) {
  const [step, setStep] = useState(0)

  // Step 0: Job type
  const [jobType, setJobType] = useState<string | null>(null)
  const [showCopyPicker, setShowCopyPicker] = useState(false)
  const [selectedCopyJob, setSelectedCopyJob] = useState<ExistingJob | null>(null)

  // Step 1: Details
  const [jobName, setJobName] = useState('')
  const [jobDescription, setJobDescription] = useState('')

  // Step 2: Hub scope
  const [scopeMode, setScopeMode] = useState<'namespace' | 'select'>('namespace')
  const [selectedHubs, setSelectedHubs] = useState<Set<string>>(new Set())

  // Step 3: Twin settings
  const [twinSettings, setTwinSettings] = useState<TwinSetting[]>([
    {
      id: crypto.randomUUID(),
      path: '',
      value: '',
    },
  ])

  // Step 4: Targeting
  const [priority, setPriority] = useState('10')
  const [targetCondition, setTargetCondition] = useState('')
  const [targetingMode, setTargetingMode] = useState<TargetingMode>('adr')
  const [perHubTargets, setPerHubTargets] = useState<PerHubTarget[]>([])
  const [adrFilters, setAdrFilters] = useState<AdrFilter[]>([])
  const [savedGroups, setSavedGroups] = useState<SavedGroup[]>([...SAMPLE_SAVED_GROUPS])
  const [showSaveGroupInput, setShowSaveGroupInput] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [justSavedGroup, setJustSavedGroup] = useState(false)
  const steps = getSteps(jobType)
  const activeHubs = linkedHubs
  const scopedHubs = scopeMode === 'namespace' ? activeHubs : activeHubs.filter((h) => selectedHubs.has(h.name))
  const totalDevices = scopedHubs.reduce((sum, h) => sum + h.devices, 0)

  // Initialize per-hub targets when switching to per-hub mode
  function switchTargetingMode(mode: TargetingMode) {
    if (mode === 'per-hub' && targetingMode !== 'per-hub') {
      setPerHubTargets(
        scopedHubs.map((h) => ({ hubName: h.name, condition: '' }))
      )
    }
    setTargetingMode(mode)
  }

  function saveCurrentAsGroup() {
    if (!newGroupName.trim()) return
    const currentCondition = targetingMode === 'per-hub'
      ? perHubTargets.map(t => `${t.hubName}: ${t.condition}`).join('; ')
      : targetingMode === 'adr'
      ? adrFilters.map(f => {
          const fd = ADR_FILTER_FIELDS.find(d => d.id === f.field)
          return `${fd?.label ?? f.field} = ${f.value}`
        }).join(', ')
      : targetCondition
    setSavedGroups(prev => [
      { id: crypto.randomUUID(), name: newGroupName.trim(), condition: currentCondition },
      ...prev,
    ])
    setNewGroupName('')
    setShowSaveGroupInput(false)
    setJustSavedGroup(true)
    setTimeout(() => setJustSavedGroup(false), 2000)
  }

  function loadGroup(group: SavedGroup) {
    setTargetCondition(group.condition)
    setTargetingMode('across')
  }

  // Map step index to step name for validation
  function currentStepName(): string {
    return steps[step] ?? ''
  }

  // Validation per step
  function canProceed(): boolean {
    const name = currentStepName()
    switch (name) {
      case 'Job Type': return jobType !== null && !showCopyPicker
      case 'Details': return jobName.trim().length > 0
      case 'Hubs': return scopeMode === 'namespace' || selectedHubs.size > 0
      case 'Twin Settings': return twinSettings.length > 0 && twinSettings.every((s) => s.path.trim() && s.value.trim())
      case 'Targeting': {
        if (targetingMode === 'per-hub') {
          return perHubTargets.every((t) => t.condition.trim().length > 0) && priority.trim().length > 0
        }
        if (targetingMode === 'adr') {
          return adrFilters.length > 0 && adrFilters.every(f => f.value.trim().length > 0) && priority.trim().length > 0
        }
        return targetCondition.trim().length > 0 && priority.trim().length > 0
      }
      case 'Review': return true
      default: return false
    }
  }

  function handleCreate() {
    const nextId = `JOB-${1043 + Date.now() % 10000}`
    onCreate({
      id: nextId,
      name: jobName,
      type: JOB_TYPE_LABELS[jobType ?? 'twin-update'] ?? 'Job',
      status: 'Running',
      targets: `${totalDevices.toLocaleString()} devices`,
      started: 'Just now',
      hubProgress: scopedHubs.map((h) => ({
        hubName: h.name,
        total: h.devices,
        completed: 0,
        status: 'Running',
      })),
    })
  }

  function toggleHub(hubName: string) {
    setSelectedHubs((prev) => {
      const next = new Set(prev)
      if (next.has(hubName)) next.delete(hubName)
      else next.add(hubName)
      return next
    })
  }

  function addTwinSetting() {
    setTwinSettings((prev) => [
      ...prev,
      { id: crypto.randomUUID(), path: 'properties.desired.', value: '' },
    ])
  }

  function removeTwinSetting(id: string) {
    setTwinSettings((prev) => prev.filter((s) => s.id !== id))
  }

  function updateTwinSetting(id: string, field: 'path' | 'value', val: string) {
    setTwinSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: val } : s))
    )
  }

  function updatePerHubTarget(hubName: string, condition: string) {
    setPerHubTargets((prev) =>
      prev.map((t) => (t.hubName === hubName ? { ...t, condition } : t))
    )
  }

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.25 }}
        className="flex h-[min(90vh,720px)] w-full max-w-2xl flex-col rounded-xl border bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-base font-semibold">New Job</h2>
            <p className="text-sm text-muted-foreground">
              Create a job in the Texas-Wind-Namespace
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Step indicator ─────────────────────────────────── */}
        <div className="border-b px-6 py-3">
          <div className="flex items-center gap-1">
            {steps.map((label, i) => (
              <div key={label} className="flex items-center gap-1">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                    i < step
                      ? 'bg-emerald-100 text-emerald-700'
                      : i === step
                      ? 'bg-foreground text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {i < step ? <Check className="h-3 w-3" /> : i + 1}
                </div>
                <span
                  className={`text-xs ${
                    i === step ? 'font-medium text-foreground' : 'text-muted-foreground'
                  } ${i > step ? 'hidden sm:inline' : ''}`}
                >
                  {label}
                </span>
                {i < steps.length - 1 && (
                  <div className={`mx-1 h-px w-4 ${i < step ? 'bg-emerald-300' : 'bg-border'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Content ────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.15 }}
            >
              {currentStepName() === 'Job Type' && step === 0 && (
                showCopyPicker ? (
                  <StepCopyFromExisting
                    existingJobs={existingJobs}
                    selectedJob={selectedCopyJob}
                    onSelect={setSelectedCopyJob}
                    onBack={() => {
                      setShowCopyPicker(false)
                      setJobType(null)
                    }}
                  />
                ) : (
                  <StepJobType
                    selected={jobType}
                    onSelect={(id) => {
                      if (id === 'copy-existing') {
                        setJobType(id)
                        setShowCopyPicker(true)
                      } else {
                        setJobType(id)
                      }
                    }}
                  />
                )
              )}
              {currentStepName() === 'Details' && (
                <StepDetails
                  name={jobName}
                  description={jobDescription}
                  jobType={jobType}
                  onNameChange={setJobName}
                  onDescriptionChange={setJobDescription}
                />
              )}
              {currentStepName() === 'Hubs' && (
                <StepHubScope
                  hubs={activeHubs}
                  scopeMode={scopeMode}
                  onScopeModeChange={setScopeMode}
                  selectedHubs={selectedHubs}
                  onToggleHub={toggleHub}
                />
              )}
              {currentStepName() === 'Twin Settings' && (
                <StepTwinSettings
                  settings={twinSettings}
                  onAdd={addTwinSetting}
                  onRemove={removeTwinSetting}
                  onUpdate={updateTwinSetting}
                />
              )}
              {currentStepName() === 'Targeting' && (
                <StepTargeting
                  priority={priority}
                  onPriorityChange={setPriority}
                  targetCondition={targetCondition}
                  onTargetConditionChange={setTargetCondition}
                  targetingMode={targetingMode}
                  onTargetingModeChange={switchTargetingMode}
                  perHubTargets={perHubTargets}
                  onUpdatePerHubTarget={updatePerHubTarget}
                  adrFilters={adrFilters}
                  onAdrFiltersChange={setAdrFilters}
                  scopedHubs={scopedHubs}
                  savedGroups={savedGroups}
                  showSaveGroupInput={showSaveGroupInput}
                  onToggleSaveGroup={() => setShowSaveGroupInput(!showSaveGroupInput)}
                  newGroupName={newGroupName}
                  onNewGroupNameChange={setNewGroupName}
                  onSaveGroup={saveCurrentAsGroup}
                  justSaved={justSavedGroup}
                  onLoadGroup={loadGroup}
                />
              )}
              {currentStepName() === 'Review' && (
                <StepReview
                  jobName={jobName}
                  jobDescription={jobDescription}
                  jobType={JOB_TYPES.find((t) => t.id === jobType)?.name ?? 'Job'}
                  scopeMode={scopeMode}
                  scopedHubs={scopedHubs}
                  totalDevices={totalDevices}
                  twinSettings={jobType === 'twin-update' ? twinSettings : []}
                  priority={priority}
                  targetCondition={targetCondition}
                  targetingMode={targetingMode}
                  perHubTargets={perHubTargets}
                  adrFilters={adrFilters}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Footer ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-t px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (showCopyPicker) {
                setShowCopyPicker(false)
                setJobType(null)
                setSelectedCopyJob(null)
              } else {
                setStep((s) => Math.max(0, s - 1))
              }
            }}
            disabled={step === 0 && !showCopyPicker}
            className="gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            {showCopyPicker ? null : step < steps.length - 1 ? (
              <Button
                size="sm"
                disabled={!canProceed()}
                onClick={() => setStep((s) => s + 1)}
                className="gap-1"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button size="sm" onClick={handleCreate} className="gap-1">
                <Check className="h-3.5 w-3.5" />
                Create Job
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}

/* ─── Step 0: Job Type ──────────────────────────────────────── */

function StepJobType({
  selected,
  onSelect,
}: {
  selected: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Select Job Type</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose the type of operation to run across your namespace hubs.
        </p>
      </div>
      <div className="space-y-2">
        {JOB_TYPES.map((type) => {
          const isSelected = selected === type.id
          const priorityLabel = ['twin-update', 'software-update', 'direct-method', 'outer-loop'].includes(type.id) ? 'P0' : type.id === 'cert-revocation' ? 'P1' : null
          const isDemo = type.id === 'twin-update' || type.id === 'cert-revocation'
          return (
            <button
              key={type.id}
              onClick={() => onSelect(type.id)}
              className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                isSelected
                  ? 'border-foreground bg-muted/30 ring-1 ring-foreground'
                  : 'hover:bg-muted/30'
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  isSelected ? 'bg-foreground text-white' : 'bg-muted text-foreground'
                }`}
              >
                <type.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{type.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{type.description}</p>
              </div>
              <div className="ml-auto flex items-center gap-2 shrink-0">
                {isDemo && (
                  <span className="rounded-full border border-dashed border-amber-300 bg-amber-50 px-2 py-0.5 text-[9px] font-medium text-amber-600 tracking-wide uppercase">
                    try me
                  </span>
                )}
                {priorityLabel && (
                  <span className="rounded-full border border-dashed border-amber-300 bg-amber-50 px-2 py-0.5 text-[9px] font-medium text-amber-600 tracking-wide uppercase">
                    {priorityLabel}
                  </span>
                )}
                {isSelected && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-white">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Separator + Copy from Existing */}
      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs text-muted-foreground">or</span>
        </div>
      </div>

      <button
        onClick={() => onSelect('copy-existing')}
        className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
          selected === 'copy-existing'
            ? 'border-foreground bg-muted/30 ring-1 ring-foreground'
            : 'border-dashed hover:bg-muted/30'
        }`}
      >
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            selected === 'copy-existing' ? 'bg-foreground text-white' : 'bg-muted text-foreground'
          }`}
        >
          <Copy className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">Copy from Existing Job</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Start from a previous job's configuration and customize it
          </p>
        </div>
        {selected === 'copy-existing' && (
          <div className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-white">
            <Check className="h-3 w-3" />
          </div>
        )}
      </button>
    </div>
  )
}

/* ─── Copy from Existing (dead end) ─────────────────────────── */

function StepCopyFromExisting({
  existingJobs,
  selectedJob,
  onSelect,
  onBack,
}: {
  existingJobs: ExistingJob[]
  selectedJob: ExistingJob | null
  onSelect: (job: ExistingJob) => void
  onBack: () => void
}) {
  const statusDot: Record<string, string> = {
    Running: 'bg-blue-500',
    Completed: 'bg-emerald-500',
    Failed: 'bg-red-500',
    Scheduled: 'bg-amber-500',
  }

  return (
    <div className="space-y-4">
      <div>
        <button
          onClick={onBack}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mb-2"
        >
          <ChevronLeft className="h-3 w-3" />
          Back to job types
        </button>
        <h3 className="text-sm font-semibold">Copy from Existing Job</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Select a previous job to use as a template. Its configuration will be copied into a new job.
        </p>
      </div>
      <div className="space-y-2">
        {existingJobs.map((job) => {
          const isSelected = selectedJob?.id === job.id
          return (
            <button
              key={job.id}
              onClick={() => onSelect(job)}
              className={`flex w-full items-center gap-4 rounded-lg border p-3.5 text-left transition-all ${
                isSelected
                  ? 'border-foreground bg-muted/30 ring-1 ring-foreground'
                  : 'hover:bg-muted/30'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{job.name}</p>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-mono">{job.id}</span>
                  <span>·</span>
                  <span>{job.type}</span>
                  <span>·</span>
                  <span>{job.targets}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusDot[job.status] || 'bg-gray-400'}`} />
                    {job.status}
                  </span>
                </div>
              </div>
              {isSelected && (
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-white">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {selectedJob && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-amber-200 bg-amber-50 p-4"
        >
          <p className="text-xs font-medium text-amber-800">
            Configuration from "{selectedJob.name}" will be loaded into a new job.
          </p>
          <p className="mt-1 text-xs text-amber-700">
            You'll be able to modify all settings before creating the job.
          </p>
        </motion.div>
      )}
    </div>
  )
}

/* ─── Step 1: Details ───────────────────────────────────────── */

function StepDetails({
  name,
  description,
  jobType,
  onNameChange,
  onDescriptionChange,
}: {
  name: string
  description: string
  jobType: string | null
  onNameChange: (v: string) => void
  onDescriptionChange: (v: string) => void
}) {
  const isCert = jobType === 'cert-revocation'
  const sampleName = isCert
    ? 'Certificate revocation – compromised Abilene edge gateways'
    : 'Turbine pitch calibration – Abilene Wind Farm'
  const sampleDesc = isCert
    ? 'Revoke X.509 device certificates for edge gateways flagged in the February 2026 security audit. Affected devices will be re-provisioned with new certificates via DPS.'
    : 'Update pitch angle and RPM targets for all turbine controllers in the Abilene wind farm cluster to optimize output for spring wind patterns.'
  const placeholder = isCert
    ? 'e.g. Certificate revocation – compromised Abilene edge gateways'
    : 'e.g. Turbine pitch calibration – Abilene Wind Farm'

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold">Job Details</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Give this job a descriptive name so it's easy to find later.
        </p>
      </div>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <ClickableLabel
            label="Job Name"
            required
            onFill={() => onNameChange(sampleName)}
          />
          <Input
            placeholder={placeholder}
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <ClickableLabel
            label="Description"
            onFill={() => onDescriptionChange(sampleDesc)}
          />
          <textarea
            placeholder="Describe the purpose and scope of this job…"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </div>
    </div>
  )
}

/* ─── Step 2: Hubs ──────────────────────────────────────────── */

function StepHubScope({
  hubs,
  scopeMode,
  onScopeModeChange,
  selectedHubs,
  onToggleHub,
}: {
  hubs: Hub[]
  scopeMode: 'namespace' | 'select'
  onScopeModeChange: (m: 'namespace' | 'select') => void
  selectedHubs: Set<string>
  onToggleHub: (name: string) => void
}) {
  const allDevices = hubs.reduce((s, h) => s + h.devices, 0)
  const selectedDevices = hubs
    .filter((h) => selectedHubs.has(h.name))
    .reduce((s, h) => s + h.devices, 0)

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold">Hubs</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Unlike single-hub jobs, namespace jobs can span multiple linked hubs. Choose which hubs to target.
        </p>
      </div>

      {/* Scope mode selector */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onScopeModeChange('namespace')}
          className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-all ${
            scopeMode === 'namespace'
              ? 'border-foreground bg-muted/30 ring-1 ring-foreground'
              : 'hover:bg-muted/30'
          }`}
        >
          <Globe className={`h-5 w-5 ${scopeMode === 'namespace' ? 'text-foreground' : 'text-muted-foreground'}`} />
          <div>
            <p className="text-sm font-medium">Entire Namespace</p>
            <p className="text-xs text-muted-foreground">
              {hubs.length} hubs · {allDevices.toLocaleString()} devices
            </p>
          </div>
        </button>
        <button
          onClick={() => onScopeModeChange('select')}
          className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-all ${
            scopeMode === 'select'
              ? 'border-foreground bg-muted/30 ring-1 ring-foreground'
              : 'hover:bg-muted/30'
          }`}
        >
          <Server className={`h-5 w-5 ${scopeMode === 'select' ? 'text-foreground' : 'text-muted-foreground'}`} />
          <div>
            <p className="text-sm font-medium">Select Hubs</p>
            <p className="text-xs text-muted-foreground">
              {selectedHubs.size > 0
                ? `${selectedHubs.size} selected · ${selectedDevices.toLocaleString()} devices`
                : 'Pick individual hubs'}
            </p>
          </div>
        </button>
      </div>

      {/* Hub list - always visible */}
      <div className="space-y-2">
        {hubs.map((hub) => {
          const checked = scopeMode === 'namespace' || selectedHubs.has(hub.name)
          const isDisabled = scopeMode === 'namespace'
          return (
            <button
              key={hub.name}
              onClick={() => !isDisabled && onToggleHub(hub.name)}
              disabled={isDisabled}
              className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                checked
                  ? isDisabled
                    ? 'border-muted bg-muted/10'
                    : 'border-foreground bg-muted/20'
                  : 'hover:bg-muted/30'
              } ${isDisabled ? 'cursor-default' : ''}`}
            >
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                  checked
                    ? isDisabled
                      ? 'border-muted-foreground/40 bg-muted-foreground/40 text-white'
                      : 'border-foreground bg-foreground text-white'
                    : 'border-muted-foreground/30'
                }`}
              >
                {checked && <Check className="h-3 w-3" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${isDisabled ? 'text-muted-foreground' : ''}`}>{hub.name}</p>
                <p className="text-xs text-muted-foreground">
                  {hub.region} · {hub.devices.toLocaleString()} devices
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Step 3: Twin Settings ─────────────────────────────────── */

function StepTwinSettings({
  settings,
  onAdd,
  onRemove,
  onUpdate,
}: {
  settings: TwinSetting[]
  onAdd: () => void
  onRemove: (id: string) => void
  onUpdate: (id: string, field: 'path' | 'value', val: string) => void
}) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold">Device Twin Settings</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Specify the desired properties to set on targeted device twins. Add the twin path and the JSON value.
        </p>
      </div>

      <div className="space-y-4">
        {settings.map((setting, idx) => (
          <Card key={setting.id} className="shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Setting {idx + 1}
                </span>
                {settings.length > 1 && (
                  <button
                    onClick={() => onRemove(setting.id)}
                    className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="space-y-1.5">
                <ClickableLabel
                  label="Twin Path"
                  onFill={() => onUpdate(setting.id, 'path', 'properties.desired.turbineConfig')}
                />
                <Input
                  value={setting.path}
                  onChange={(e) => onUpdate(setting.id, 'path', e.target.value)}
                  placeholder="properties.desired.turbineConfig"
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <ClickableLabel
                  label="JSON Value"
                  onFill={() => onUpdate(setting.id, 'value', JSON.stringify({ targetRPM: 14, pitchAngle: 3.5, cutOutWindSpeed: 25 }, null, 2))}
                />
                <textarea
                  value={setting.value}
                  onChange={(e) => onUpdate(setting.id, 'value', e.target.value)}
                  placeholder='{ "targetRPM": 14, "pitchAngle": 3.5 }'
                  rows={6}
                  className="flex w-full rounded-md border border-input bg-muted/30 px-3 py-2 font-mono text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={onAdd}>
        <Plus className="h-3.5 w-3.5" />
        Add Another Setting
      </Button>
    </div>
  )
}

/* ─── Step 4: Targeting ─────────────────────────────────────── */

function StepTargeting({
  priority,
  onPriorityChange,
  targetCondition,
  onTargetConditionChange,
  targetingMode,
  onTargetingModeChange,
  perHubTargets,
  onUpdatePerHubTarget,
  adrFilters,
  onAdrFiltersChange,
  scopedHubs,
  savedGroups,
  showSaveGroupInput,
  onToggleSaveGroup,
  newGroupName,
  onNewGroupNameChange,
  onSaveGroup,
  justSaved,
  onLoadGroup,
}: {
  priority: string
  onPriorityChange: (v: string) => void
  targetCondition: string
  onTargetConditionChange: (v: string) => void
  targetingMode: TargetingMode
  onTargetingModeChange: (mode: TargetingMode) => void
  perHubTargets: PerHubTarget[]
  onUpdatePerHubTarget: (hubName: string, condition: string) => void
  adrFilters: AdrFilter[]
  onAdrFiltersChange: (filters: AdrFilter[]) => void
  scopedHubs: Hub[]
  savedGroups: SavedGroup[]
  showSaveGroupInput: boolean
  onToggleSaveGroup: () => void
  newGroupName: string
  onNewGroupNameChange: (v: string) => void
  onSaveGroup: () => void
  justSaved: boolean
  onLoadGroup: (group: SavedGroup) => void
}) {
  const hasCondition =
    targetingMode === 'per-hub'
      ? perHubTargets.some(t => t.condition.trim().length > 0)
      : targetingMode === 'adr'
      ? adrFilters.some(f => f.value.trim().length > 0)
      : targetCondition.trim().length > 0

  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false)
  const [adrFieldDropdownOpen, setAdrFieldDropdownOpen] = useState(false)

  const availableAdrFields = ADR_FILTER_FIELDS.filter(
    f => !adrFilters.some(af => af.field === f.id)
  )

  function addAdrFilter(fieldId: string) {
    onAdrFiltersChange([...adrFilters, { field: fieldId, value: '' }])
    setAdrFieldDropdownOpen(false)
  }

  function removeAdrFilter(fieldId: string) {
    onAdrFiltersChange(adrFilters.filter(f => f.field !== fieldId))
  }

  function updateAdrFilterValue(fieldId: string, value: string) {
    onAdrFiltersChange(adrFilters.map(f => f.field === fieldId ? { ...f, value } : f))
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold">Targeting</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Define a priority and target condition using IoT Hub query language to scope which devices
          receive this job.
        </p>
      </div>

      <div className="space-y-4">
        {/* Priority */}
        <div className="space-y-1.5">
          <ClickableLabel label="Priority" required onFill={() => onPriorityChange('10')} />
          <Input
            type="number"
            min="1"
            value={priority}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="w-32"
            placeholder="10"
          />
          <p className="text-xs text-muted-foreground">
            Higher values take precedence when multiple configurations target the same device.
          </p>
        </div>

        {/* Target condition mode toggle + Load from group */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-foreground">Target Condition <span className="text-red-500">*</span></span>
              <div className="flex items-center rounded-lg border bg-muted/30 p-0.5">
                <button
                  onClick={() => onTargetingModeChange('adr')}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                    targetingMode === 'adr'
                      ? 'bg-white text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Use ARG
                  <span className="ml-1.5 rounded-full border border-dashed border-amber-300 bg-amber-50 px-1.5 py-px text-[8px] font-medium text-amber-600 tracking-wide uppercase leading-none">P0</span>
                </button>
                <button
                  onClick={() => onTargetingModeChange('across')}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                    targetingMode === 'across'
                      ? 'bg-white text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Define across hubs
                  <span className="ml-1.5 rounded-full border border-dashed border-amber-300 bg-amber-50 px-1.5 py-px text-[8px] font-medium text-amber-600 tracking-wide uppercase leading-none">P0</span>
                </button>
                <button
                  onClick={() => onTargetingModeChange('per-hub')}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                    targetingMode === 'per-hub'
                      ? 'bg-white text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Define per hub
                  <span className="ml-1.5 rounded-full border border-dashed border-amber-300 bg-amber-50 px-1.5 py-px text-[8px] font-medium text-amber-600 tracking-wide uppercase leading-none">P1</span>
                </button>
              </div>
            </div>
            {/* Inline group loader */}
            <div className="flex items-center gap-1">
              <div className="relative">
                <button
                  onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}
                  className="inline-flex items-center gap-1 rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  title="Load from saved group"
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                </button>
                {groupDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setGroupDropdownOpen(false)} />
                    <div className="absolute right-0 top-full z-20 mt-1 w-72 rounded-lg border bg-white shadow-lg">
                      <div className="px-3 py-2 border-b">
                        <p className="text-[11px] font-medium text-muted-foreground">Saved Target Groups</p>
                      </div>
                      <div className="max-h-48 overflow-y-auto py-1">
                        {savedGroups.map((group) => (
                          <button
                            key={group.id}
                            onClick={() => { onLoadGroup(group); setGroupDropdownOpen(false) }}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/40 transition-colors"
                          >
                            <Bookmark className="h-3 w-3 text-muted-foreground shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium">{group.name}</p>
                              <p className="text-[10px] font-mono text-muted-foreground truncate">{group.condition}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              {hasCondition && (
                <div className="relative">
                  <button
                    onClick={onToggleSaveGroup}
                    className="inline-flex items-center gap-1 rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    title="Save as group"
                  >
                    {justSaved ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                  </button>
                  {showSaveGroupInput && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={onToggleSaveGroup} />
                      <div className="absolute right-0 top-full z-20 mt-1 w-72 rounded-lg border bg-white shadow-lg">
                        <div className="px-3 py-2 border-b">
                          <p className="text-[11px] font-medium text-muted-foreground">Save Target Group</p>
                        </div>
                        <div className="flex items-center gap-2 p-3">
                          <Input
                            value={newGroupName}
                            onChange={(e) => onNewGroupNameChange(e.target.value)}
                            placeholder="e.g. All Abilene turbines"
                            className="h-7 text-xs flex-1"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newGroupName.trim()) onSaveGroup()
                              if (e.key === 'Escape') onToggleSaveGroup()
                            }}
                          />
                          <Button
                            size="sm"
                            className="h-7 text-xs gap-1 px-2 shrink-0"
                            disabled={!newGroupName.trim()}
                            onClick={onSaveGroup}
                          >
                            <Check className="h-3 w-3" />
                            Save
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {targetingMode === 'across' ? (
            <div className="space-y-1.5">
              <ClickableLabel
                label="Query"
                onFill={() => onTargetConditionChange("tags.site = 'abilene' AND tags.assetType = 'turbine'")}
              />
              <textarea
                value={targetCondition}
                onChange={(e) => onTargetConditionChange(e.target.value)}
                placeholder="tags.site = 'abilene' AND tags.assetType = 'turbine'"
                rows={2}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <p className="text-xs text-muted-foreground">
                Use twin tags (e.g. <code className="rounded bg-muted px-1 py-0.5 text-xs">tags.site = 'abilene'</code>)
                or reported properties (e.g. <code className="rounded bg-muted px-1 py-0.5 text-xs">properties.reported.firmware.version = '3.1.0'</code>).
              </p>
            </div>
          ) : targetingMode === 'per-hub' ? (
            <div className="space-y-3">
              {scopedHubs.map((hub, idx) => {
                const target = perHubTargets.find((t) => t.hubName === hub.name)
                const sampleQueries = [
                  "tags.site = 'abilene' AND tags.assetType = 'turbine'",
                  "tags.site = 'sweetwater' AND properties.reported.firmware.version < '3.2.0'",
                  "tags.cluster = 'eastus-edge' AND tags.priority = 'critical'",
                  "tags.assetType = 'sensor' AND tags.category = 'vibration'",
                ]
                const sampleQuery = sampleQueries[idx % sampleQueries.length]
                return (
                  <div key={hub.name} className="rounded-lg border p-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Server className="h-3.5 w-3.5 text-muted-foreground" />
                      <span
                        className="text-xs font-medium cursor-pointer hover:text-blue-600 transition-colors inline-flex items-center gap-1 group/hub"
                        onClick={() => onUpdatePerHubTarget(hub.name, sampleQuery)}
                        title="Click to fill with sample value"
                      >
                        {hub.name}
                        <span className="opacity-0 group-hover/hub:opacity-100 text-[10px] text-blue-500 transition-opacity">← click to fill</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {hub.region} · {hub.devices.toLocaleString()} devices
                      </span>
                    </div>
                    <textarea
                      value={target?.condition ?? ''}
                      onChange={(e) => onUpdatePerHubTarget(hub.name, e.target.value)}
                      placeholder={sampleQuery}
                      rows={1}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                )
              })}
            </div>
          ) : (
            /* ADR targeting mode */
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Target devices using Azure Device Registry attributes. Add one or more criteria to narrow the scope.
              </p>

              {/* Active filter pills */}
              {adrFilters.length > 0 && (
                <div className="space-y-2">
                  {adrFilters.map((filter) => {
                    const fieldDef = ADR_FILTER_FIELDS.find(f => f.id === filter.field)
                    if (!fieldDef) return null
                    return (
                      <div
                        key={filter.field}
                        className="flex items-center gap-2 rounded-lg border bg-muted/10 px-3 py-2"
                      >
                        <span className="text-xs font-medium text-foreground whitespace-nowrap min-w-[120px]">
                          {fieldDef.label}
                        </span>
                        <span className="text-xs text-muted-foreground">=</span>
                        <Input
                          value={filter.value}
                          onChange={(e) => updateAdrFilterValue(filter.field, e.target.value)}
                          placeholder="Enter a value"
                          className="h-7 text-xs flex-1 font-mono"
                        />
                        <button
                          onClick={() => removeAdrFilter(filter.field)}
                          className="rounded-md p-1 text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Remove filter"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Add filter button + dropdown */}
              {availableAdrFields.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setAdrFieldDropdownOpen(!adrFieldDropdownOpen)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-dashed px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    Add criteria
                  </button>
                  {adrFieldDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setAdrFieldDropdownOpen(false)} />
                      <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-lg border bg-white shadow-lg">
                        <div className="py-1">
                          {availableAdrFields.map((field) => (
                            <button
                              key={field.id}
                              onClick={() => addAdrFilter(field.id)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted/40 transition-colors"
                            >
                              <span className="font-medium">{field.label}</span>
                              <span className="text-muted-foreground ml-auto font-mono text-[10px]">{field.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Click-to-fill all */}
              {adrFilters.length > 0 && adrFilters.some(f => !f.value.trim()) && (
                <button
                  onClick={() => {
                    onAdrFiltersChange(adrFilters.map(f => {
                      if (f.value.trim()) return f
                      const fieldDef = ADR_FILTER_FIELDS.find(fd => fd.id === f.field)
                      return { ...f, value: fieldDef?.sample ?? '' }
                    }))
                  }}
                  className="text-[11px] text-muted-foreground hover:text-blue-600 transition-colors cursor-pointer"
                >
                  ← click to fill all with sample values
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Step 5: Review ────────────────────────────────────────── */

function StepReview({
  jobName,
  jobDescription,
  jobType,
  scopeMode,
  scopedHubs,
  totalDevices,
  twinSettings,
  priority,
  targetCondition,
  targetingMode,
  perHubTargets,
  adrFilters,
}: {
  jobName: string
  jobDescription: string
  jobType: string
  scopeMode: 'namespace' | 'select'
  scopedHubs: Hub[]
  totalDevices: number
  twinSettings: TwinSetting[]
  priority: string
  targetCondition: string
  targetingMode: TargetingMode
  perHubTargets: PerHubTarget[]
  adrFilters: AdrFilter[]
}) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold">Review & Create</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Confirm the job configuration before creating.
        </p>
      </div>

      <div className="space-y-4">
        {/* Summary card */}
        <div className="rounded-lg border divide-y">
          <ReviewRow label="Job Type" value={jobType} />
          <ReviewRow label="Name" value={jobName} />
          {jobDescription && <ReviewRow label="Description" value={jobDescription} />}
          <ReviewRow
            label="Hubs"
            value={
              scopeMode === 'namespace'
                ? `Entire namespace (${scopedHubs.length} hubs)`
                : scopedHubs.map((h) => h.name).join(', ')
            }
          />
          <ReviewRow label="Total Devices" value={totalDevices.toLocaleString()} />
          <ReviewRow label="Priority" value={priority} />

          {/* Twin settings */}
          {twinSettings.length > 0 && (
            <div className="px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Twin Settings</p>
              <div className="space-y-2">
                {twinSettings.map((s) => (
                  <div key={s.id} className="rounded border bg-muted/20 p-3">
                    <p className="text-xs font-mono font-medium">{s.path}</p>
                    <pre className="mt-1 text-xs font-mono text-muted-foreground whitespace-pre-wrap">{s.value}</pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Targeting */}
          <div className="px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Target Condition</p>
            {targetingMode === 'per-hub' ? (
              <div className="space-y-2">
                {perHubTargets.map((t) => (
                  <div key={t.hubName} className="rounded border bg-muted/20 p-3">
                    <p className="text-xs font-medium">{t.hubName}</p>
                    <p className="mt-1 text-xs font-mono text-muted-foreground">{t.condition}</p>
                  </div>
                ))}
              </div>
            ) : targetingMode === 'adr' ? (
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium text-muted-foreground mb-1">ARG Attributes</p>
                <div className="flex flex-wrap gap-2">
                  {adrFilters.map((f) => {
                    const fieldDef = ADR_FILTER_FIELDS.find(fd => fd.id === f.field)
                    return (
                      <span
                        key={f.field}
                        className="inline-flex items-center gap-1.5 rounded-full border bg-blue-50 border-blue-200 px-3 py-1 text-xs font-medium text-blue-700"
                      >
                        {fieldDef?.label} = {f.value}
                      </span>
                    )
                  })}
                </div>
              </div>
            ) : (
              <p className="rounded border bg-muted/20 p-3 text-xs font-mono text-muted-foreground">
                {targetCondition}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between px-4 py-3">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%]">{value}</span>
    </div>
  )
}

/* ─── Clickable Label (demo helper) ─────────────────────────── */

function ClickableLabel({
  label,
  required,
  onFill,
}: {
  label: string
  required?: boolean
  onFill: () => void
}) {
  return (
    <label
      className="text-xs font-medium text-foreground cursor-pointer hover:text-blue-600 transition-colors inline-flex items-center gap-1 group"
      onClick={onFill}
      title="Click to fill with sample value"
    >
      {label}
      {required && <span className="text-red-500">*</span>}
      <span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-500 transition-opacity">← click to fill</span>
    </label>
  )
}
