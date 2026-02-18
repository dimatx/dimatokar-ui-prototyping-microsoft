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
  FileCode2,
  Activity,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

/* ─── Types ─────────────────────────────────────────────────── */

import type { Hub } from './Page'

interface AdrFilter {
  field: string
  value: string
}

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
  deviceCount: number
}

interface NewJobWizardProps {
  linkedHubs: Hub[]
  aioInstances: { name: string; site: string; status: string; connectedDevices: number; assets: number }[]
  totalAssets: number
  existingJobs: ExistingJob[]
  onClose: () => void
  onCreate: (job: CreatedJob) => void
}

const JOB_TYPES_MAIN = [
  {
    id: 'management-action',
    name: 'Management Action',
    description: 'Take an action on devices and assets.',
    icon: Activity,
    tags: ['Hub', 'AIO'],
  },
  {
    id: 'management-update',
    name: 'Management Update',
    description: 'Update properties on devices and assets.',
    icon: Settings2,
    tags: ['Hub', 'AIO'],
  },
]

const JOB_TYPES_MORE = [
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

const JOB_TYPES = [...JOB_TYPES_MAIN, ...JOB_TYPES_MORE]

const DETAILS_STEPS = ['Job Type', 'Basics', 'Scope', 'Details', 'Target', 'Review']
const DEFAULT_STEPS = ['Job Type', 'Basics', 'Scope', 'Target', 'Review']

function getSteps(jobType: string | null) {
  if (jobType === 'management-action' || jobType === 'management-update') return DETAILS_STEPS
  return DEFAULT_STEPS
}

const JOB_TYPE_LABELS: Record<string, string> = {
  'management-action': 'Management Action',
  'management-update': 'Management Update',
  'cert-revocation': 'Cert Revocation',
  'software-update': 'Software Update',
}

const SAMPLE_SAVED_GROUPS: SavedGroup[] = [
  { id: 'g1', name: 'All Abilene turbines', condition: 'all turbines at Abilene Wind Farm', deviceCount: 3_412 },
  { id: 'g2', name: 'Outdated firmware devices', condition: 'devices running firmware older than 3.2.0', deviceCount: 18_754 },
  { id: 'g3', name: 'Critical wind sensors', condition: 'critical sensors at any site', deviceCount: 1_209 },
  { id: 'g4', name: 'Sweetwater cluster', condition: 'all devices in Sweetwater cluster', deviceCount: 7_831 },
]

/* ─── Wizard ────────────────────────────────────────────────── */

export function NewJobWizard({ linkedHubs, aioInstances, totalAssets, existingJobs, onClose, onCreate }: NewJobWizardProps) {
  const [step, setStep] = useState(0)

  // Step 0: Job type
  const [jobType, setJobType] = useState<string | null>(null)
  const [showCopyPicker, setShowCopyPicker] = useState(false)
  const [selectedCopyJob, setSelectedCopyJob] = useState<ExistingJob | null>(null)

  // Step 1: Basics
  const [jobName, setJobName] = useState('')
  const [jobDescription, setJobDescription] = useState('')

  // Step 2: Scope
  const [scopeMode, setScopeMode] = useState<'namespace' | 'select' | 'aio'>('namespace')
  const [selectedHubs, setSelectedHubs] = useState<Set<string>>(new Set())
  const [selectedAio, setSelectedAio] = useState<Set<string>>(new Set())

  // ARM Detail step
  const [armActionMode, setArmActionMode] = useState<'update-properties' | 'arm-action'>('update-properties')
  const [armProperties, setArmProperties] = useState<AdrFilter[]>([])
  const [armActionName, setArmActionName] = useState('')
  const [armActionPayload, setArmActionPayload] = useState('')

  // Step: Targeting
  const [priority, setPriority] = useState('10')
  const [targetCondition, setTargetCondition] = useState('')
  const [savedGroups, setSavedGroups] = useState<SavedGroup[]>([...SAMPLE_SAVED_GROUPS])
  const [showSaveGroupInput, setShowSaveGroupInput] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [justSavedGroup, setJustSavedGroup] = useState(false)
  const steps = getSteps(jobType)
  const activeHubs = linkedHubs
  const scopedHubs = scopeMode === 'namespace' ? activeHubs : activeHubs.filter((h) => selectedHubs.has(h.name))
  const totalDevices = scopedHubs.reduce((sum, h) => sum + h.devices, 0)

  function saveCurrentAsGroup() {
    if (!newGroupName.trim()) return
    setSavedGroups(prev => [
      { id: crypto.randomUUID(), name: newGroupName.trim(), condition: targetCondition, deviceCount: Math.floor(totalDevices * (0.1 + 0.5 * Math.random())) || Math.floor(Math.random() * 5000) + 500 },
      ...prev,
    ])
    setNewGroupName('')
    setShowSaveGroupInput(false)
    setJustSavedGroup(true)
    setTimeout(() => setJustSavedGroup(false), 2000)
  }

  function loadGroup(group: SavedGroup) {
    setTargetCondition(group.condition)
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
      case 'Basics': return jobName.trim().length > 0
      case 'Scope': {
        if (scopeMode === 'namespace') return true
        if (scopeMode === 'select') return selectedHubs.size > 0
        if (scopeMode === 'aio') return selectedAio.size > 0
        return false
      }
      case 'Details': {
        if (jobType === 'management-update') {
          return armProperties.length > 0 && armProperties.every(p => p.value.trim().length > 0)
        }
        return armActionName.trim().length > 0 && armActionPayload.trim().length > 0
      }
      case 'Target': return targetCondition.trim().length > 0 && priority.trim().length > 0
      case 'Review': return true
      default: return false
    }
  }

  function handleCreate() {
    const nextId = `JOB-${1043 + Date.now() % 10000}`
    onCreate({
      id: nextId,
      name: jobName,
      type: JOB_TYPE_LABELS[jobType ?? 'management-update'] ?? 'Job',
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

  function toggleAio(name: string) {
    setSelectedAio((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
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
                        // Auto-select arm detail mode based on job type
                        if (id === 'management-update') setArmActionMode('update-properties')
                        if (id === 'management-action') setArmActionMode('arm-action')
                      }
                    }}
                  />
                )
              )}
              {currentStepName() === 'Basics' && (
                <StepDetails
                  name={jobName}
                  description={jobDescription}
                  jobType={jobType}
                  onNameChange={setJobName}
                  onDescriptionChange={setJobDescription}
                />
              )}
              {currentStepName() === 'Scope' && (
                <StepHubScope
                  hubs={activeHubs}
                  scopeMode={scopeMode}
                  onScopeModeChange={setScopeMode}
                  selectedHubs={selectedHubs}
                  onToggleHub={toggleHub}
                  jobType={jobType}
                  aioInstances={aioInstances}
                  selectedAio={selectedAio}
                  onToggleAio={toggleAio}
                  totalAssets={totalAssets}
                />
              )}
              {currentStepName() === 'Details' && (
                <StepArmAction
                  jobType={jobType}
                  mode={armActionMode}
                  onModeChange={setArmActionMode}
                  properties={armProperties}
                  onPropertiesChange={setArmProperties}
                  actionName={armActionName}
                  onActionNameChange={setArmActionName}
                  payload={armActionPayload}
                  onPayloadChange={setArmActionPayload}
                />
              )}
              {currentStepName() === 'Target' && (
                <StepTargeting
                  priority={priority}
                  onPriorityChange={setPriority}
                  targetCondition={targetCondition}
                  onTargetConditionChange={setTargetCondition}
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
                  selectedAio={selectedAio}
                  totalDevices={totalDevices}
                  priority={priority}
                  targetCondition={targetCondition}
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
  const [showMore, setShowMore] = useState(false)

  const visibleTypes = showMore ? JOB_TYPES : JOB_TYPES_MAIN

  // If the selected job is in the "more" section, always show it
  const hasMoreSelected = JOB_TYPES_MORE.some((t) => t.id === selected)

  const renderJobButton = (type: typeof JOB_TYPES[number]) => {
    const isSelected = selected === type.id
    const priorityLabel = ['management-action', 'management-update'].includes(type.id) ? 'P0' : ['software-update', 'cert-revocation'].includes(type.id) ? 'P1' : null
    const isDemo = type.id === 'management-update' || type.id === 'management-action' || type.id === 'cert-revocation'
    return (
      <button
        key={type.id}
        onClick={() => onSelect(type.id)}
        className={`relative flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
          isSelected
            ? 'border-foreground bg-muted/30 ring-1 ring-foreground'
            : 'hover:bg-muted/30'
        }`}
      >
        {priorityLabel && (
          <span className={`absolute -right-2 -top-2 z-10 rounded-full border border-dashed px-1.5 py-0.5 text-[9px] font-medium tracking-wide uppercase ${
            priorityLabel === 'P0' ? 'border-red-300 bg-red-50 text-red-600' : 'border-yellow-300 bg-yellow-50 text-yellow-600'
          }`}>
            {priorityLabel}
          </span>
        )}
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            isSelected ? 'bg-foreground text-white' : 'bg-muted text-foreground'
          }`}
        >
          <type.icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium flex items-center gap-1.5">
            {type.name}
            {type.tags.map((tag) => (
              <span key={tag} className="rounded bg-slate-100 px-1.5 py-px text-[9px] font-medium text-slate-500 uppercase tracking-wide">{tag}</span>
            ))}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{type.description}</p>
        </div>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {isDemo && (
            <span className="rounded-full border border-orange-300 bg-orange-50 px-2 py-0.5 text-[9px] font-medium text-orange-600 tracking-wide uppercase">
              try me
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
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Select Job Type</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose the type of operation to run across your namespace hubs.
        </p>
      </div>
      <div className="space-y-2">
        {(hasMoreSelected ? JOB_TYPES : visibleTypes).map(renderJobButton)}
      </div>

      {/* Show more / less toggle */}
      {!hasMoreSelected && (
        <button
          onClick={() => setShowMore(!showMore)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className={`h-3 w-3 transition-transform ${showMore ? 'rotate-90' : ''}`} />
          {showMore ? 'Show fewer job types' : `Show ${JOB_TYPES_MORE.length} more job type${JOB_TYPES_MORE.length !== 1 ? 's' : ''}`}
        </button>
      )}

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

/* ─── Step 2: Scope ─────────────────────────────────────────── */

function StepHubScope({
  hubs,
  scopeMode,
  onScopeModeChange,
  selectedHubs,
  onToggleHub,
  jobType,
  aioInstances,
  selectedAio,
  onToggleAio,
  totalAssets,
}: {
  hubs: Hub[]
  scopeMode: 'namespace' | 'select' | 'aio'
  onScopeModeChange: (m: 'namespace' | 'select' | 'aio') => void
  selectedHubs: Set<string>
  onToggleHub: (name: string) => void
  jobType: string | null
  aioInstances: { name: string; site: string; status: string; connectedDevices: number; assets: number }[]
  selectedAio: Set<string>
  onToggleAio: (name: string) => void
  totalAssets: number
}) {
  const allHubDevices = hubs.reduce((s, h) => s + h.devices, 0)
  const allAioDevices = aioInstances.reduce((s, a) => s + a.connectedDevices, 0)
  const selectedHubDevices = hubs
    .filter((h) => selectedHubs.has(h.name))
    .reduce((s, h) => s + h.devices, 0)
  const selectedAioDevices = aioInstances
    .filter((a) => selectedAio.has(a.name))
    .reduce((s, a) => s + a.connectedDevices, 0)

  const aioEnabled = jobType === 'management-action' || jobType === 'management-update'

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold">Scope</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose the scope for this job — target the entire namespace, individual IoT&nbsp;Hubs, or IoT&nbsp;Operations instances.
        </p>
      </div>

      {/* Scope mode selector — always 3 options */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => onScopeModeChange('namespace')}
          className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-all ${
            scopeMode === 'namespace'
              ? 'border-foreground bg-muted/30 ring-1 ring-foreground'
              : 'hover:bg-muted/30'
          }`}
        >
          <Globe className={`h-5 w-5 mt-0.5 shrink-0 ${scopeMode === 'namespace' ? 'text-foreground' : 'text-muted-foreground'}`} />
          <div className="min-w-0">
            <p className="text-sm font-medium">Entire Namespace</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {hubs.length} IoT&nbsp;Hubs<br />
              <span className={!aioEnabled ? 'line-through opacity-40' : ''}>
                {aioInstances.length} AIO instance{aioInstances.length !== 1 ? 's' : ''}
              </span>
            </p>
          </div>
        </button>
        <button
          onClick={() => onScopeModeChange('select')}
          className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-all ${
            scopeMode === 'select'
              ? 'border-foreground bg-muted/30 ring-1 ring-foreground'
              : 'hover:bg-muted/30'
          }`}
        >
          <Server className={`h-5 w-5 mt-0.5 shrink-0 ${scopeMode === 'select' ? 'text-foreground' : 'text-muted-foreground'}`} />
          <div className="min-w-0">
            <p className="text-sm font-medium">IoT&nbsp;Hubs</p>
            <p className="text-xs text-muted-foreground">
              {selectedHubs.size > 0
                ? `${selectedHubs.size} selected · ${selectedHubDevices.toLocaleString()} devices`
                : `${hubs.length} available`}
            </p>
          </div>
        </button>
        <button
          onClick={() => aioEnabled && onScopeModeChange('aio')}
          disabled={!aioEnabled}
          className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-all ${
            !aioEnabled
              ? 'opacity-40 cursor-not-allowed'
              : scopeMode === 'aio'
              ? 'border-foreground bg-muted/30 ring-1 ring-foreground'
              : 'hover:bg-muted/30'
          }`}
        >
          <Activity className={`h-5 w-5 mt-0.5 shrink-0 ${scopeMode === 'aio' ? 'text-foreground' : 'text-muted-foreground'}`} />
          <div className="min-w-0">
            <p className="text-sm font-medium">IoT&nbsp;Operations</p>
            <p className="text-xs text-muted-foreground">
              {selectedAio.size > 0
                ? `${selectedAio.size} selected · ${selectedAioDevices.toLocaleString()} devices`
                : `${aioInstances.length} instance${aioInstances.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </button>
      </div>

      {/* Resource list */}
      {scopeMode === 'namespace' && (
        <div className="space-y-1">
          {hubs.map((hub) => (
            <div
              key={hub.name}
              className="flex items-center gap-2 rounded-md border border-muted bg-muted/10 px-3 py-2 cursor-default"
            >
              <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-muted-foreground/40 bg-muted-foreground/40 text-white">
                <Check className="h-2.5 w-2.5" />
              </div>
              <Server className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
              <span className="text-xs text-muted-foreground">{hub.name}</span>
              <span className="text-[10px] text-muted-foreground/60 ml-auto">{hub.devices.toLocaleString()} devices</span>
            </div>
          ))}
          {aioInstances.map((inst) => (
            <div
              key={inst.name}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 cursor-default ${aioEnabled ? 'border-muted bg-muted/10' : 'border-muted/50 bg-muted/5 opacity-50'}`}
            >
              <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${aioEnabled ? 'border-muted-foreground/40 bg-muted-foreground/40 text-white' : 'border-muted-foreground/30 bg-transparent'}`}>
                {aioEnabled && <Check className="h-2.5 w-2.5" />}
              </div>
              <Activity className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
              <span className="text-xs text-muted-foreground">{inst.name}</span>
              {!aioEnabled && <span className="text-[10px] text-muted-foreground/50 ml-1 italic">not supported for this job type</span>}
              <span className="text-[10px] text-muted-foreground/60 ml-auto">{inst.connectedDevices.toLocaleString()} devices · {inst.assets.toLocaleString()} assets</span>
            </div>
          ))}
        </div>
      )}

      {/* Hub list — shown for select mode */}
      {scopeMode === 'select' && (
        <div className="space-y-1.5">
          {hubs.map((hub) => {
            const checked = selectedHubs.has(hub.name)
            return (
              <button
                key={hub.name}
                onClick={() => onToggleHub(hub.name)}
                className={`flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left transition-all ${
                  checked ? 'border-foreground bg-muted/20' : 'hover:bg-muted/30'
                }`}
              >
                <div
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                    checked
                      ? 'border-foreground bg-foreground text-white'
                      : 'border-muted-foreground/30'
                  }`}
                >
                  {checked && <Check className="h-2.5 w-2.5" />}
                </div>
                <span className="text-xs font-medium">{hub.name}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{hub.region} · {hub.devices.toLocaleString()} devices</span>
              </button>
            )
          })}
        </div>
      )}

      {/* AIO instance list — shown for aio mode */}
      {scopeMode === 'aio' && (
        <div className="space-y-1.5">
          {aioInstances.map((inst) => {
            const checked = selectedAio.has(inst.name)
            return (
              <button
                key={inst.name}
                onClick={() => onToggleAio(inst.name)}
                className={`flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left transition-all ${
                  checked ? 'border-foreground bg-muted/20' : 'hover:bg-muted/30'
                }`}
              >
                <div
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                    checked
                      ? 'border-foreground bg-foreground text-white'
                      : 'border-muted-foreground/30'
                  }`}
                >
                  {checked && <Check className="h-2.5 w-2.5" />}
                </div>
                <span className="text-xs font-medium">{inst.name}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{inst.site} · {inst.connectedDevices.toLocaleString()} devices · {inst.assets.toLocaleString()} assets</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── ARM Action Step ───────────────────────────────────────── */

const ARM_PROPERTY_FIELDS = [
  { id: 'manufacturer', label: 'Manufacturer', sample: 'Contoso Wind Systems' },
  { id: 'model', label: 'Model', sample: 'TurbineController-X700' },
  { id: 'swVersion', label: 'Software Version', sample: '3.2.0' },
  { id: 'osName', label: 'OS Name', sample: 'Azure RTOS' },
  { id: 'serialNumber', label: 'Serial Number', sample: 'SN-2026-0042' },
  { id: 'location', label: 'Location', sample: 'Abilene, TX' },
]

function StepArmAction({
  jobType,
  mode,
  onModeChange,
  properties,
  onPropertiesChange,
  actionName,
  onActionNameChange,
  payload,
  onPayloadChange,
}: {
  jobType: string | null
  mode: 'update-properties' | 'arm-action'
  onModeChange: (m: 'update-properties' | 'arm-action') => void
  properties: AdrFilter[]
  onPropertiesChange: (p: AdrFilter[]) => void
  actionName: string
  onActionNameChange: (v: string) => void
  payload: string
  onPayloadChange: (v: string) => void
}) {
  const [propDropdownOpen, setPropDropdownOpen] = useState(false)
  const availableProps = ARM_PROPERTY_FIELDS.filter(
    (f) => !properties.some((p) => p.field === f.id)
  )

  function addProperty(fieldId: string) {
    onPropertiesChange([...properties, { field: fieldId, value: '' }])
    setPropDropdownOpen(false)
  }

  function fillPropertySample(fieldId: string) {
    const fieldDef = ARM_PROPERTY_FIELDS.find((f) => f.id === fieldId)
    if (fieldDef) {
      onPropertiesChange(properties.map((p) => (p.field === fieldId ? { ...p, value: fieldDef.sample } : p)))
    }
  }

  function updatePropertyValue(fieldId: string, value: string) {
    onPropertiesChange(properties.map((p) => (p.field === fieldId ? { ...p, value } : p)))
  }

  function removeProperty(fieldId: string) {
    onPropertiesChange(properties.filter((p) => p.field !== fieldId))
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold">Details</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {jobType === 'management-update'
            ? 'Set the properties to update on the target devices and assets.'
            : 'Define the operation to invoke on the target devices and assets.'}
        </p>
      </div>

      {mode === 'update-properties' ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Select properties to update on the ARM resource records. Set the new value for each.
          </p>

          {/* Active property rows */}
          {properties.length > 0 && (
            <div className="space-y-2">
              {properties.map((prop) => {
                const fieldDef = ARM_PROPERTY_FIELDS.find((f) => f.id === prop.field)
                if (!fieldDef) return null
                return (
                  <div
                    key={prop.field}
                    className="flex items-center gap-2 rounded-lg border bg-muted/10 px-3 py-2"
                  >
                    <button
                      onClick={() => fillPropertySample(prop.field)}
                      className="text-xs font-medium text-foreground whitespace-nowrap min-w-[120px] text-left hover:text-blue-600 transition-colors cursor-pointer"
                      title={`Click to fill sample: ${fieldDef.sample}`}
                    >
                      {fieldDef.label}
                    </button>
                    <span className="text-xs text-muted-foreground">=</span>
                    <Input
                      value={prop.value}
                      onChange={(e) => updatePropertyValue(prop.field, e.target.value)}
                      placeholder="Enter a value"
                      className="h-7 text-xs flex-1 font-mono"
                    />
                    <button
                      onClick={() => removeProperty(prop.field)}
                      className="rounded-md p-1 text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Remove property"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Add property button + dropdown */}
          {availableProps.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setPropDropdownOpen(!propDropdownOpen)}
                className="inline-flex items-center gap-1.5 rounded-md border border-dashed px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                <Plus className="h-3 w-3" />
                Add property
              </button>
              {propDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setPropDropdownOpen(false)} />
                  <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-lg border bg-white shadow-lg">
                    <div className="py-1">
                      {availableProps.map((field) => (
                        <button
                          key={field.id}
                          onClick={() => addProperty(field.id)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted/40 transition-colors"
                        >
                          <span className="font-medium">{field.label}</span>
                          <span className="text-muted-foreground ml-auto text-[10px]">{field.sample}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Action name */}
          <div className="space-y-1.5">
            <ClickableLabel
              label="Action Name"
              onFill={() => onActionNameChange('setTargetRPM')}
            />
            <Input
              value={actionName}
              onChange={(e) => onActionNameChange(e.target.value)}
              placeholder="e.g. setTargetRPM"
              className="font-mono text-sm"
            />
          </div>

          {/* Payload */}
          <div className="space-y-1.5">
            <ClickableLabel
              label="Payload"
              onFill={() => onPayloadChange(JSON.stringify({ targetTemperature: 72, unit: 'F', mode: 'auto' }, null, 2))}
            />
            <textarea
              value={payload}
              onChange={(e) => onPayloadChange(e.target.value)}
              placeholder='{ "targetTemperature": 72, "unit": "F" }'
              rows={6}
              className="flex w-full rounded-md border border-input bg-muted/30 px-3 py-2 font-mono text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <p className="text-xs text-muted-foreground">
              JSON payload sent with the action request.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Step 4: Targeting ─────────────────────────────────────── */

function StepTargeting({
  priority,
  onPriorityChange,
  targetCondition,
  onTargetConditionChange,
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
  savedGroups: SavedGroup[]
  showSaveGroupInput: boolean
  onToggleSaveGroup: () => void
  newGroupName: string
  onNewGroupNameChange: (v: string) => void
  onSaveGroup: () => void
  justSaved: boolean
  onLoadGroup: (group: SavedGroup) => void
}) {
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false)
  const hasCondition = targetCondition.trim().length > 0

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold">Target</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Define a priority and describe which devices should receive this job.
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

        {/* Target pseudo-language input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <ClickableLabel
              label="Target"
              required
              onFill={() => onTargetConditionChange('turbines with firmware older than 3.2.0 or all sensors at Sweetwater farm where temperature = 72')}
            />
            {/* Saved Groups buttons */}
            <div className="flex items-center gap-1">
              <div className="relative">
                <button
                  onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}
                  className="relative inline-flex items-center gap-1 rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  title="Load from saved groups"
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                  <span className="absolute -right-2 -top-2 z-10 rounded-full border border-dashed border-yellow-300 bg-yellow-50 px-1 py-px text-[8px] font-medium tracking-wide uppercase text-yellow-600">P1</span>
                </button>
                {groupDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setGroupDropdownOpen(false)} />
                    <div className="absolute right-0 top-full z-20 mt-1 w-72 rounded-lg border bg-white shadow-lg">
                      <div className="px-3 py-2 border-b">
                        <p className="text-[11px] font-medium text-muted-foreground">Saved Targets</p>
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
                              <p className="text-[10px] text-muted-foreground truncate italic">{group.condition}</p>
                            </div>
                            <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">{group.deviceCount.toLocaleString()} devices</span>
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
                    className="relative inline-flex items-center gap-1 rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    title="Save as group"
                  >
                    {justSaved ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    <span className="absolute -right-2 -top-2 z-10 rounded-full border border-dashed border-yellow-300 bg-yellow-50 px-1 py-px text-[8px] font-medium tracking-wide uppercase text-yellow-600">P1</span>
                  </button>
                  {showSaveGroupInput && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={onToggleSaveGroup} />
                      <div className="absolute right-0 top-full z-20 mt-1 w-72 rounded-lg border bg-white shadow-lg">
                        <div className="px-3 py-2 border-b">
                          <p className="text-[11px] font-medium text-muted-foreground">Save as Target</p>
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
          <textarea
            value={targetCondition}
            onChange={(e) => onTargetConditionChange(e.target.value)}
            placeholder="e.g. turbines with firmware older than 3.2.0"
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Describe the devices to target — e.g. <span className="italic">turbines with firmware older than 3.2.0</span> or <span className="italic">all sensors at Sweetwater farm where temperature = 72</span>.
          </p>
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
  selectedAio,
  totalDevices,
  priority,
  targetCondition,
}: {
  jobName: string
  jobDescription: string
  jobType: string
  scopeMode: 'namespace' | 'select' | 'aio'
  scopedHubs: Hub[]
  selectedAio: Set<string>
  totalDevices: number
  priority: string
  targetCondition: string
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
            label="Scope"
            value={
              scopeMode === 'namespace'
                ? `Entire namespace (${scopedHubs.length} hubs)`
                : scopeMode === 'aio'
                ? `IoT Operations (${selectedAio.size} instance${selectedAio.size !== 1 ? 's' : ''})`
                : scopedHubs.map((h) => h.name).join(', ')
            }
          />
          <ReviewRow label="Total Devices" value={totalDevices.toLocaleString()} />
          <ReviewRow label="Priority" value={priority} />

          {/* Target */}
          {targetCondition.trim() && (
            <div className="px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Target</p>
              <p className="rounded border bg-muted/20 p-3 text-xs text-foreground">
                {targetCondition}
              </p>
            </div>
          )}
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
