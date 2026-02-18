import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
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
  Loader2,
  Zap,
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

const DETAILS_STEPS = ['Job Type', 'Basics', 'Target', 'Details', 'Review']
const DEFAULT_STEPS = ['Job Type', 'Basics', 'Target', 'Review']

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

  // Target mode
  const [targetMode, setTargetMode] = useState<'namespace' | 'group' | 'custom'>('namespace')
  const [selectedGroup, setSelectedGroup] = useState<SavedGroup | null>(null)

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
  const scopedHubs = linkedHubs
  const totalDevices = scopedHubs.reduce((sum, h) => sum + h.devices, 0)
  const effectiveDeviceCount = targetMode === 'group' && selectedGroup ? selectedGroup.deviceCount : totalDevices

  function saveCurrentAsGroup() {
    if (!newGroupName.trim()) return
    setSavedGroups(prev => [
      { id: crypto.randomUUID(), name: newGroupName.trim(), condition: targetCondition, deviceCount: Math.floor(effectiveDeviceCount * (0.3 + 0.5 * Math.random())) || Math.floor(Math.random() * 5000) + 500 },
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
      case 'Details': {
        if (jobType === 'management-update') {
          return armProperties.length > 0 && armProperties.every(p => p.value.trim().length > 0)
        }
        return armActionName.trim().length > 0 && armActionPayload.trim().length > 0
      }
      case 'Target': {
        if (targetMode === 'namespace') return true
        if (targetMode === 'group') return selectedGroup !== null
        if (targetMode === 'custom') return targetCondition.trim().length > 0 && priority.trim().length > 0
        return false
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
      type: JOB_TYPE_LABELS[jobType ?? 'management-update'] ?? 'Job',
      status: 'Running',
      targets: `${effectiveDeviceCount.toLocaleString()} devices`,
      started: 'Just now',
      hubProgress: scopedHubs.map((h) => ({
        hubName: h.name,
        total: h.devices,
        completed: 0,
        status: 'Running',
      })),
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
                <StepTarget
                  hubs={scopedHubs}
                  aioInstances={aioInstances}
                  jobType={jobType}
                  targetMode={targetMode}
                  onTargetModeChange={(m) => { setTargetMode(m); setSelectedGroup(null); setTargetCondition('') }}
                  selectedGroup={selectedGroup}
                  onSelectGroup={(g) => { setSelectedGroup(g); setTargetCondition(g.condition) }}
                  savedGroups={savedGroups}
                  targetCondition={targetCondition}
                  onTargetConditionChange={setTargetCondition}
                  priority={priority}
                  onPriorityChange={setPriority}
                  showSaveGroupInput={showSaveGroupInput}
                  onToggleSaveGroup={() => setShowSaveGroupInput(!showSaveGroupInput)}
                  newGroupName={newGroupName}
                  onNewGroupNameChange={setNewGroupName}
                  onSaveGroup={saveCurrentAsGroup}
                  justSaved={justSavedGroup}
                />
              )}
              {currentStepName() === 'Review' && (
                <StepReview
                  jobName={jobName}
                  jobDescription={jobDescription}
                  jobType={JOB_TYPES.find((t) => t.id === jobType)?.name ?? 'Job'}
                  hubs={scopedHubs}
                  aioInstances={aioInstances}
                  targetMode={targetMode}
                  selectedGroup={selectedGroup}
                  effectiveDeviceCount={effectiveDeviceCount}
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

/* ─── Step: Target ───────────────────────────────────────── */

function StepTarget({
  hubs,
  aioInstances,
  jobType,
  targetMode,
  onTargetModeChange,
  selectedGroup,
  onSelectGroup,
  savedGroups,
  targetCondition,
  onTargetConditionChange,
  priority,
  onPriorityChange,
  showSaveGroupInput,
  onToggleSaveGroup,
  newGroupName,
  onNewGroupNameChange,
  onSaveGroup,
  justSaved,
}: {
  hubs: Hub[]
  aioInstances: { name: string; site: string; status: string; connectedDevices: number; assets: number }[]
  jobType: string | null
  targetMode: 'namespace' | 'group' | 'custom'
  onTargetModeChange: (m: 'namespace' | 'group' | 'custom') => void
  selectedGroup: SavedGroup | null
  onSelectGroup: (g: SavedGroup) => void
  savedGroups: SavedGroup[]
  targetCondition: string
  onTargetConditionChange: (v: string) => void
  priority: string
  onPriorityChange: (v: string) => void
  showSaveGroupInput: boolean
  onToggleSaveGroup: () => void
  newGroupName: string
  onNewGroupNameChange: (v: string) => void
  onSaveGroup: () => void
  justSaved: boolean
}) {
  const totalHubDevices = hubs.reduce((s, h) => s + h.devices, 0)
  const totalAssets = aioInstances.reduce((s, a) => s + a.assets, 0)
  const aioEnabled = jobType === 'management-action' || jobType === 'management-update'

  const [estimate, setEstimate] = useState<{ devices: number; assets: number } | null>(null)
  const [estimating, setEstimating] = useState(false)

  // Clear estimate whenever the condition changes
  useEffect(() => { setEstimate(null) }, [targetCondition])

  function runEstimate() {
    setEstimating(true)
    setEstimate(null)
    setTimeout(() => {
      // Stable pseudo-random from the condition string
      let h = 0
      for (let i = 0; i < targetCondition.length; i++) {
        h = (Math.imul(31, h) + targetCondition.charCodeAt(i)) | 0
      }
      const r = (Math.abs(h) % 10000) / 10000
      const devices = Math.max(1, Math.floor(totalHubDevices * (0.04 + r * 0.38)))
      const assets = totalAssets > 0 ? Math.max(0, Math.floor(totalAssets * (0.02 + r * 0.35))) : 0
      setEstimate({ devices, assets })
      setEstimating(false)
    }, 900)
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold">Target</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose which devices receive this job.
        </p>
      </div>

      {/* Three option cards */}
      <div className="space-y-2">
        {/* 1 — My Namespace */}
        <button
          onClick={() => onTargetModeChange('namespace')}
          className={`w-full flex items-start gap-3 rounded-lg border p-4 text-left transition-all ${
            targetMode === 'namespace'
              ? 'border-foreground bg-muted/30 ring-1 ring-foreground'
              : 'hover:bg-muted/20'
          }`}
        >
          <Globe className={`h-4 w-4 mt-0.5 shrink-0 ${targetMode === 'namespace' ? 'text-foreground' : 'text-muted-foreground'}`} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">My Namespace</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {hubs.length} IoT Hubs · {aioInstances.length} IoT Operations instance{aioInstances.length !== 1 ? 's' : ''}
               · {totalHubDevices.toLocaleString()} devices
              {totalAssets > 0 && <> · {totalAssets.toLocaleString()} assets</>}
            </p>
          </div>
          {targetMode === 'namespace' && <Check className="h-4 w-4 text-foreground shrink-0 mt-0.5" />}
        </button>

        {/* 2 — Load Group */}
        <div
          className={`rounded-lg border transition-all ${
            targetMode === 'group' ? 'border-foreground ring-1 ring-foreground' : 'hover:bg-muted/20'
          }`}
        >
          <button
            onClick={() => onTargetModeChange('group')}
            className="w-full flex items-start gap-3 p-4 text-left"
          >
            <Bookmark className={`h-4 w-4 mt-0.5 shrink-0 ${targetMode === 'group' ? 'text-foreground' : 'text-muted-foreground'}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Load Group</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedGroup ? selectedGroup.name : 'Pick a saved group of devices'}
              </p>
            </div>
            {selectedGroup && <Check className="h-4 w-4 text-foreground shrink-0 mt-0.5" />}
          </button>

          {/* Group list — shown when mode = group */}
          {targetMode === 'group' && (
            <div className="border-t mx-0">
              <div className="divide-y max-h-52 overflow-y-auto">
                {savedGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => onSelectGroup(group)}
                    className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left hover:bg-muted/40 transition-colors ${
                      selectedGroup?.id === group.id ? 'bg-muted/30' : ''
                    }`}
                  >
                    <div className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      selectedGroup?.id === group.id ? 'border-foreground bg-foreground' : 'border-muted-foreground/40'
                    }`}>
                      {selectedGroup?.id === group.id && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium">{group.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate italic">{group.condition}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{group.deviceCount.toLocaleString()} devices</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3 — Custom */}
        <div
          className={`rounded-lg border transition-all ${
            targetMode === 'custom' ? 'border-foreground ring-1 ring-foreground' : 'hover:bg-muted/20'
          }`}
        >
          <button
            onClick={() => onTargetModeChange('custom')}
            className="w-full flex items-start gap-3 p-4 text-left"
          >
            <Terminal className={`h-4 w-4 mt-0.5 shrink-0 ${targetMode === 'custom' ? 'text-foreground' : 'text-muted-foreground'}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Custom</p>
              <p className="text-xs text-muted-foreground mt-0.5">Describe a target in plain language</p>
            </div>
          </button>

          {/* Custom input — shown when mode = custom */}
          {targetMode === 'custom' && (
            <div className="border-t px-4 py-3 space-y-3">
              {/* Priority */}
              <div className="flex items-center gap-3">
                <ClickableLabel label="Priority" required onFill={() => onPriorityChange('10')} />
                <Input
                  type="number"
                  min="1"
                  value={priority}
                  onChange={(e) => onPriorityChange(e.target.value)}
                  className="w-24 h-7 text-xs"
                  placeholder="10"
                />
                <p className="text-[11px] text-muted-foreground">Higher = higher precedence</p>
              </div>

              {/* Target condition with save button */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <ClickableLabel
                    label="Condition"
                    required
                    onFill={() => onTargetConditionChange('turbines with firmware older than 3.2.0 or all sensors at Sweetwater farm where temperature = 72')}
                  />
                  {targetCondition.trim() && (
                    <div className="relative">
                      <button
                        onClick={onToggleSaveGroup}
                        className="relative inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        title="Save as group"
                      >
                        {justSaved ? <Check className="h-3 w-3 text-green-600" /> : <Save className="h-3 w-3" />}
                        <span className="ml-1">{justSaved ? 'Saved' : 'Save as group'}</span>
                      </button>
                      {showSaveGroupInput && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={onToggleSaveGroup} />
                          <div className="absolute right-0 top-full z-20 mt-1 w-64 rounded-lg border bg-white shadow-lg">
                            <div className="px-3 py-2 border-b">
                              <p className="text-[11px] font-medium text-muted-foreground">Save as Group</p>
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
                              <Button size="sm" className="h-7 text-xs gap-1 px-2 shrink-0" disabled={!newGroupName.trim()} onClick={onSaveGroup}>
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
                <textarea
                  value={targetCondition}
                  onChange={(e) => onTargetConditionChange(e.target.value)}
                  placeholder="e.g. turbines with firmware older than 3.2.0"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                />

                {/* Estimate row */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={runEstimate}
                    disabled={!targetCondition.trim() || estimating}
                    className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {estimating
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <Zap className="h-3 w-3" />}
                    Estimate scope
                  </button>
                  {estimate && (
                    <p className="text-xs text-muted-foreground">
                      This condition targets&nbsp;<span className="font-medium text-foreground">~{estimate.devices.toLocaleString()} devices</span>
                      {estimate.assets > 0 && <> and&nbsp;<span className="font-medium text-foreground">{estimate.assets.toLocaleString()} assets</span></>}.
                    </p>
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground">
                  Describe the devices to target — e.g. <span className="italic">turbines with firmware older than 3.2.0</span> or <span className="italic">all sensors at Sweetwater farm where temperature = 72</span>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
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


/* ─── Step 5: Review ────────────────────────────────────────── */

function StepReview({
  jobName,
  jobDescription,
  jobType,
  hubs,
  aioInstances,
  targetMode,
  selectedGroup,
  effectiveDeviceCount,
  priority,
  targetCondition,
}: {
  jobName: string
  jobDescription: string
  jobType: string
  hubs: Hub[]
  aioInstances: { name: string; connectedDevices: number; assets: number }[]
  targetMode: 'namespace' | 'group' | 'custom'
  selectedGroup: SavedGroup | null
  effectiveDeviceCount: number
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
          <ReviewRow label="Devices" value={effectiveDeviceCount.toLocaleString()} />
          {priority && <ReviewRow label="Priority" value={priority} />}

          {/* Target */}
          <div className="px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Target</p>
            {targetMode === 'namespace' && (
              <p className="text-xs text-foreground">
                My Namespace — {hubs.length} IoT Hubs · {aioInstances.length} IoT Operations instance{aioInstances.length!==1?'s':''}
                {" · "}{hubs.reduce((s,h)=>s+h.devices,0).toLocaleString()} devices
                {aioInstances.reduce((s,a)=>s+a.assets,0) > 0 && <> · {aioInstances.reduce((s,a)=>s+a.assets,0).toLocaleString()} assets</>}
              </p>
            )}
            {targetMode === 'group' && selectedGroup && (
              <div>
                <p className="text-xs font-medium">{selectedGroup.name}</p>
                <p className="text-[11px] text-muted-foreground italic mt-0.5">{selectedGroup.condition}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{selectedGroup.deviceCount.toLocaleString()} devices</p>
              </div>
            )}
            {targetMode === 'custom' && (
              <p className="rounded border bg-muted/20 p-3 text-xs text-foreground">{targetCondition}</p>
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
