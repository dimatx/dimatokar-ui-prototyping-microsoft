import re

f = open('src/workflows/adr-namespace/NewJobWizard.tsx', encoding='utf-8')
text = f.read()
f.close()

# ── 1. Update step lists ──────────────────────────────────────────────────────
text = text.replace(
    "const DETAILS_STEPS = ['Job Type', 'Basics', 'Scope', 'Details', 'Target', 'Review']",
    "const DETAILS_STEPS = ['Job Type', 'Basics', 'Target', 'Details', 'Review']"
)
text = text.replace(
    "const DEFAULT_STEPS = ['Job Type', 'Basics', 'Scope', 'Target', 'Review']",
    "const DEFAULT_STEPS = ['Job Type', 'Basics', 'Target', 'Review']"
)

# ── 2. Replace scope-related state with targetMode + selectedGroup ─────────────
text = text.replace(
    "  // Step 2: Scope\n"
    "  const [scopeMode, setScopeMode] = useState<'namespace' | 'select' | 'aio'>('namespace')\n"
    "  const [selectedHubs, setSelectedHubs] = useState<Set<string>>(new Set())\n"
    "  const [selectedAio, setSelectedAio] = useState<Set<string>>(new Set())\n",
    "  // Target mode\n"
    "  const [targetMode, setTargetMode] = useState<'namespace' | 'group' | 'custom'>('namespace')\n"
    "  const [selectedGroup, setSelectedGroup] = useState<SavedGroup | null>(null)\n"
)

# ── 3. Update derived values (scopedHubs / totalDevices) ─────────────────────
text = text.replace(
    "  const activeHubs = linkedHubs\n"
    "  const scopedHubs = scopeMode === 'namespace' ? activeHubs : activeHubs.filter((h) => selectedHubs.has(h.name))\n"
    "  const totalDevices = scopedHubs.reduce((sum, h) => sum + h.devices, 0)\n",
    "  const scopedHubs = linkedHubs\n"
    "  const totalDevices = scopedHubs.reduce((sum, h) => sum + h.devices, 0)\n"
    "  const effectiveDeviceCount = targetMode === 'group' && selectedGroup ? selectedGroup.deviceCount : totalDevices\n"
)

# ── 4. Update saveCurrentAsGroup to use effectiveDeviceCount ─────────────────
text = text.replace(
    "      { id: crypto.randomUUID(), name: newGroupName.trim(), condition: targetCondition, deviceCount: Math.floor(totalDevices * (0.1 + 0.5 * Math.random())) || Math.floor(Math.random() * 5000) + 500 },",
    "      { id: crypto.randomUUID(), name: newGroupName.trim(), condition: targetCondition, deviceCount: Math.floor(effectiveDeviceCount * (0.3 + 0.5 * Math.random())) || Math.floor(Math.random() * 5000) + 500 },"
)

# ── 5. Update canProceed for Scope->Target ────────────────────────────────────
text = text.replace(
    "      case 'Scope': {\n"
    "        if (scopeMode === 'namespace') return true\n"
    "        if (scopeMode === 'select') return selectedHubs.size > 0\n"
    "        if (scopeMode === 'aio') return selectedAio.size > 0\n"
    "        return false\n"
    "      }\n",
    ""
)
text = text.replace(
    "      case 'Target': return targetCondition.trim().length > 0 && priority.trim().length > 0\n",
    "      case 'Target': {\n"
    "        if (targetMode === 'namespace') return true\n"
    "        if (targetMode === 'group') return selectedGroup !== null\n"
    "        if (targetMode === 'custom') return targetCondition.trim().length > 0 && priority.trim().length > 0\n"
    "        return false\n"
    "      }\n"
)

# ── 6. Update handleCreate to use effectiveDeviceCount ────────────────────────
text = text.replace(
    "      targets: `${totalDevices.toLocaleString()} devices`,",
    "      targets: `${effectiveDeviceCount.toLocaleString()} devices`,"
)

# ── 7. Remove toggleHub and toggleAio helper functions ────────────────────────
text = re.sub(
    r'  function toggleHub\(hubName: string\) \{.*?\}\n\n  function toggleAio\(name: string\) \{.*?\}\n\n',
    '',
    text, flags=re.DOTALL
)

# ── 8. Replace Scope render -> nothing, replace Target render call ─────────────
text = text.replace(
    "              {currentStepName() === 'Scope' && (\n"
    "                <StepHubScope\n"
    "                  hubs={activeHubs}\n"
    "                  scopeMode={scopeMode}\n"
    "                  onScopeModeChange={setScopeMode}\n"
    "                  selectedHubs={selectedHubs}\n"
    "                  onToggleHub={toggleHub}\n"
    "                  jobType={jobType}\n"
    "                  aioInstances={aioInstances}\n"
    "                  selectedAio={selectedAio}\n"
    "                  onToggleAio={toggleAio}\n"
    "                  totalAssets={totalAssets}\n"
    "                />\n"
    "              )}\n",
    ""
)
text = text.replace(
    "              {currentStepName() === 'Target' && (\n"
    "                <StepTargeting\n"
    "                  priority={priority}\n"
    "                  onPriorityChange={setPriority}\n"
    "                  targetCondition={targetCondition}\n"
    "                  onTargetConditionChange={setTargetCondition}\n"
    "                  savedGroups={savedGroups}\n"
    "                  showSaveGroupInput={showSaveGroupInput}\n"
    "                  onToggleSaveGroup={() => setShowSaveGroupInput(!showSaveGroupInput)}\n"
    "                  newGroupName={newGroupName}\n"
    "                  onNewGroupNameChange={setNewGroupName}\n"
    "                  onSaveGroup={saveCurrentAsGroup}\n"
    "                  justSaved={justSavedGroup}\n"
    "                  onLoadGroup={loadGroup}\n"
    "                />\n"
    "              )}\n",
    "              {currentStepName() === 'Target' && (\n"
    "                <StepTarget\n"
    "                  hubs={scopedHubs}\n"
    "                  aioInstances={aioInstances}\n"
    "                  jobType={jobType}\n"
    "                  targetMode={targetMode}\n"
    "                  onTargetModeChange={(m) => { setTargetMode(m); setSelectedGroup(null); setTargetCondition('') }}\n"
    "                  selectedGroup={selectedGroup}\n"
    "                  onSelectGroup={(g) => { setSelectedGroup(g); setTargetCondition(g.condition) }}\n"
    "                  savedGroups={savedGroups}\n"
    "                  targetCondition={targetCondition}\n"
    "                  onTargetConditionChange={setTargetCondition}\n"
    "                  priority={priority}\n"
    "                  onPriorityChange={setPriority}\n"
    "                  showSaveGroupInput={showSaveGroupInput}\n"
    "                  onToggleSaveGroup={() => setShowSaveGroupInput(!showSaveGroupInput)}\n"
    "                  newGroupName={newGroupName}\n"
    "                  onNewGroupNameChange={setNewGroupName}\n"
    "                  onSaveGroup={saveCurrentAsGroup}\n"
    "                  justSaved={justSavedGroup}\n"
    "                />\n"
    "              )}\n"
)

# ── 9. Update StepReview call site ─────────────────────────────────────────────
text = text.replace(
    "              {currentStepName() === 'Review' && (\n"
    "                <StepReview\n"
    "                  jobName={jobName}\n"
    "                  jobDescription={jobDescription}\n"
    "                  jobType={JOB_TYPES.find((t) => t.id === jobType)?.name ?? 'Job'}\n"
    "                  scopeMode={scopeMode}\n"
    "                  scopedHubs={scopedHubs}\n"
    "                  selectedAio={selectedAio}\n"
    "                  totalDevices={totalDevices}\n"
    "                  priority={priority}\n"
    "                  targetCondition={targetCondition}\n"
    "                />\n"
    "              )}\n",
    "              {currentStepName() === 'Review' && (\n"
    "                <StepReview\n"
    "                  jobName={jobName}\n"
    "                  jobDescription={jobDescription}\n"
    "                  jobType={JOB_TYPES.find((t) => t.id === jobType)?.name ?? 'Job'}\n"
    "                  hubs={scopedHubs}\n"
    "                  aioInstances={aioInstances}\n"
    "                  targetMode={targetMode}\n"
    "                  selectedGroup={selectedGroup}\n"
    "                  effectiveDeviceCount={effectiveDeviceCount}\n"
    "                  priority={priority}\n"
    "                  targetCondition={targetCondition}\n"
    "                />\n"
    "              )}\n"
)

# ── 10. Replace StepHubScope function with new StepTarget ─────────────────────
# Find start: "function StepHubScope({" and end of its closing "}"
# We'll replace from the comment before it through the end of the function
old_hub_scope_start = "function StepHubScope({"
# Find full function by counting braces
idx = text.find(old_hub_scope_start)
assert idx != -1, "StepHubScope not found"
# Walk back to find the comment line
comment_start = text.rfind('/* ', 0, idx)
# Count braces from the function start to find the closing }
depth = 0
end = idx
for i, ch in enumerate(text[idx:]):
    if ch == '{': depth += 1
    elif ch == '}':
        depth -= 1
        if depth == 0:
            end = idx + i + 1
            break
# Consume trailing newlines
while end < len(text) and text[end] == '\n':
    end += 1

new_step_target = '''/* \u2500\u2500\u2500 Step: Target \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

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
  const aioEnabled = jobType === 'management-action' || jobType === 'management-update'

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
        {/* 1 \u2014 My Namespace */}
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
              {hubs.length} IoT\u00a0Hubs\u00a0\u00b7\u00a0{totalHubDevices.toLocaleString()} devices
              {aioEnabled && <>\u00a0\u00b7\u00a0{aioInstances.length} IoT\u00a0Operations instance{aioInstances.length !== 1 ? 's' : ''}</>}
            </p>
          </div>
          {targetMode === 'namespace' && <Check className="h-4 w-4 text-foreground shrink-0 mt-0.5" />}
        </button>

        {/* 2 \u2014 Load Group */}
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

        {/* 3 \u2014 Custom */}
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

          {/* Custom input \u2014 shown when mode = custom */}
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
                <p className="text-[11px] text-muted-foreground">
                  Describe the devices to target \u2014 e.g. <span className="italic">turbines with firmware older than 3.2.0</span> or <span className="italic">all sensors at Sweetwater farm where temperature = 72</span>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

'''

text = text[:comment_start] + new_step_target + text[end:]

# ── 11. Remove old StepTargeting function ─────────────────────────────────────
idx2 = text.find('/* \u2500\u2500\u2500 Step 4: Targeting')
if idx2 == -1:
    idx2 = text.find('/* \u2500\u2500\u2500 Step 4')
if idx2 == -1:
    # find via function name
    idx2 = text.rfind('\n/* ', 0, text.find('function StepTargeting'))
# find function start
fn_start = text.find('function StepTargeting', idx2)
assert fn_start != -1, 'StepTargeting not found'
depth = 0
end2 = fn_start
for i, ch in enumerate(text[fn_start:]):
    if ch == '{': depth += 1
    elif ch == '}':
        depth -= 1
        if depth == 0:
            end2 = fn_start + i + 1
            break
while end2 < len(text) and text[end2] == '\n':
    end2 += 1
text = text[:idx2] + text[end2:]

# ── 12. Update StepReview signature + body ────────────────────────────────────
old_review_sig = (
    'function StepReview({\n'
    '  jobName,\n'
    '  jobDescription,\n'
    '  jobType,\n'
    '  scopeMode,\n'
    '  scopedHubs,\n'
    '  selectedAio,\n'
    '  totalDevices,\n'
    '  priority,\n'
    '  targetCondition,\n'
    '}: {\n'
    '  jobName: string\n'
    '  jobDescription: string\n'
    '  jobType: string\n'
    "  scopeMode: 'namespace' | 'select' | 'aio'\n"
    '  scopedHubs: Hub[]\n'
    '  selectedAio: Set<string>\n'
    '  totalDevices: number\n'
    '  priority: string\n'
    '  targetCondition: string\n'
    '})'
)
new_review_sig = (
    'function StepReview({\n'
    '  jobName,\n'
    '  jobDescription,\n'
    '  jobType,\n'
    '  hubs,\n'
    '  aioInstances,\n'
    '  targetMode,\n'
    '  selectedGroup,\n'
    '  effectiveDeviceCount,\n'
    '  priority,\n'
    '  targetCondition,\n'
    '}: {\n'
    '  jobName: string\n'
    '  jobDescription: string\n'
    '  jobType: string\n'
    '  hubs: Hub[]\n'
    '  aioInstances: { name: string; connectedDevices: number; assets: number }[]\n'
    "  targetMode: 'namespace' | 'group' | 'custom'\n"
    '  selectedGroup: SavedGroup | null\n'
    '  effectiveDeviceCount: number\n'
    '  priority: string\n'
    '  targetCondition: string\n'
    '})'
)
text = text.replace(old_review_sig, new_review_sig)

# Update the Scope ReviewRow block in StepReview body
old_review_rows = (
    '          <ReviewRow label="Job Type" value={jobType} />\n'
    '          <ReviewRow label="Name" value={jobName} />\n'
    '          {jobDescription && <ReviewRow label="Description" value={jobDescription} />}\n'
    '          <ReviewRow\n'
    '            label="Scope"\n'
    '            value={\n'
    "              scopeMode === 'namespace'\n"
    "                ? `Entire namespace (${scopedHubs.length} hubs)`\n"
    "                : scopeMode === 'aio'\n"
    "                ? `IoT Operations (${selectedAio.size} instance${selectedAio.size !== 1 ? 's' : ''})`\n"
    "                : scopedHubs.map((h) => h.name).join(', ')\n"
    '            }\n'
    '          />\n'
    '          <ReviewRow label="Total Devices" value={totalDevices.toLocaleString()} />\n'
    '          <ReviewRow label="Priority" value={priority} />\n'
    '\n'
    '          {/* Target */}\n'
    '          {targetCondition.trim() && (\n'
    '            <div className="px-4 py-3">\n'
    '              <p className="text-xs font-medium text-muted-foreground mb-2">Target</p>\n'
    '              <p className="rounded border bg-muted/20 p-3 text-xs text-foreground">\n'
    '                {targetCondition}\n'
    '              </p>\n'
    '            </div>\n'
    '          )}'
)
new_review_rows = (
    '          <ReviewRow label="Job Type" value={jobType} />\n'
    '          <ReviewRow label="Name" value={jobName} />\n'
    '          {jobDescription && <ReviewRow label="Description" value={jobDescription} />}\n'
    '          <ReviewRow label="Devices" value={effectiveDeviceCount.toLocaleString()} />\n'
    "          {priority && <ReviewRow label=\"Priority\" value={priority} />}\n"
    '\n'
    '          {/* Target */}\n'
    '          <div className="px-4 py-3">\n'
    '            <p className="text-xs font-medium text-muted-foreground mb-2">Target</p>\n'
    "            {targetMode === 'namespace' && (\n"
    '              <p className="text-xs text-foreground">\n'
    '                My Namespace \u2014 {hubs.length} IoT\u00a0Hubs\u00a0\u00b7\u00a0{hubs.reduce((s,h)=>s+h.devices,0).toLocaleString()} devices\n'
    '                {aioInstances.length > 0 && <>\u00a0\u00b7\u00a0{aioInstances.length} IoT\u00a0Operations instance{aioInstances.length!==1?\'s\':\'\'}</>}\n'
    '              </p>\n'
    '            )}\n'
    "            {targetMode === 'group' && selectedGroup && (\n"
    '              <div>\n'
    '                <p className="text-xs font-medium">{selectedGroup.name}</p>\n'
    '                <p className="text-[11px] text-muted-foreground italic mt-0.5">{selectedGroup.condition}</p>\n'
    '                <p className="text-[11px] text-muted-foreground mt-0.5">{selectedGroup.deviceCount.toLocaleString()} devices</p>\n'
    '              </div>\n'
    '            )}\n'
    "            {targetMode === 'custom' && (\n"
    '              <p className="rounded border bg-muted/20 p-3 text-xs text-foreground">{targetCondition}</p>\n'
    '            )}\n'
    '          </div>'
)
if old_review_rows in text:
    text = text.replace(old_review_rows, new_review_rows)
    print('Review rows updated')
else:
    print('WARNING: review rows not matched exactly — check manually')

with open('src/workflows/adr-namespace/NewJobWizard.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Done. Lines:', text.count('\n'))
print('StepHubScope remaining:', 'StepHubScope' in text)
print('StepTargeting remaining:', 'StepTargeting' in text)
print('StepTarget remaining:', 'StepTarget' in text)
print('scopeMode remaining:', 'scopeMode' in text)
print('selectedHubs remaining:', 'selectedHubs' in text)
