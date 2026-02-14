import { motion } from 'framer-motion'
import {
  Server,
  Cpu,
  Radio,
  ShieldCheck,
  RefreshCw,
  KeyRound,
  Upload,
  Activity,
  MapPin,
  Play,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  ChevronRight,
  Wind,
  ArrowUpRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/StatusBadge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

/* ─── Mock Data ───────────────────────────────────────────────── */

const namespace = {
  name: 'Texas-Wind',
  subscription: 'Zava Energy – Production',
  resourceGroup: 'rg-zava-southcentralus',
  region: 'South Central US',
  totalDevices: 12_847,
  totalAssets: 3_215,
}

const services = [
  { name: 'Provisioning', icon: Upload, status: 'Healthy' },
  { name: 'Certificate Management', icon: KeyRound, status: 'Healthy' },
  { name: 'Device Update', icon: RefreshCw, status: 'Warning' },
]

const hubs = [
  { name: 'hub-tx-wind-01', region: 'South Central US', devices: 4_250, status: 'Active' },
  { name: 'hub-tx-wind-02', region: 'South Central US', devices: 3_980, status: 'Active' },
  { name: 'hub-tx-wind-03', region: 'East US 2', devices: 2_617, status: 'Active' },
  { name: 'hub-tx-wind-04', region: 'East US 2', devices: 2_000, status: 'Degraded' },
]

const aioInstances = [
  { name: 'aio-tx-abilene-01', site: 'Abilene Wind Farm', status: 'Running', connectedDevices: 842 },
]

const jobs = [
  { id: 'JOB-1042', name: 'Firmware update – v3.2.1', type: 'Update', status: 'Running', targets: '2,400 devices', started: '35 min ago' },
  { id: 'JOB-1041', name: 'Certificate renewal – Q1 2026', type: 'Certificate', status: 'Completed', targets: '12,847 devices', started: '2 days ago' },
  { id: 'JOB-1040', name: 'Reboot turbine controllers', type: 'Command', status: 'Completed', targets: '620 devices', started: '5 days ago' },
  { id: 'JOB-1039', name: 'Edge config push – telemetry interval', type: 'Configuration', status: 'Completed', targets: '3,215 assets', started: '1 week ago' },
  { id: 'JOB-1038', name: 'Firmware update – v3.1.0', type: 'Update', status: 'Completed', targets: '8,200 devices', started: '2 weeks ago' },
]

const jobStatusStyles: Record<string, string> = {
  Running: 'text-blue-600 bg-blue-50 border-blue-200',
  Completed: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  Failed: 'text-red-700 bg-red-50 border-red-200',
  Scheduled: 'text-amber-700 bg-amber-50 border-amber-200',
}

const jobStatusIcons: Record<string, typeof CheckCircle2> = {
  Running: Loader2,
  Completed: CheckCircle2,
  Failed: Activity,
  Scheduled: Clock,
}

/* ─── Page ────────────────────────────────────────────────────── */

export default function AdrNamespacePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-8"
    >
      {/* ── Header / Hero ────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Wind className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{namespace.name}</h1>
              <p className="text-sm text-muted-foreground">ADR Namespace</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {namespace.region}
          <span className="mx-1 text-border">|</span>
          {namespace.subscription}
        </div>
      </div>

      {/* ── Hero Metrics ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <HeroStat icon={Radio} label="Devices" value={namespace.totalDevices.toLocaleString()} />
        <HeroStat icon={Cpu} label="Assets" value={namespace.totalAssets.toLocaleString()} />
        <HeroStat icon={Server} label="IoT Hubs" value={hubs.length.toString()} />
        <HeroStat icon={Activity} label={<><span className="whitespace-nowrap">IoT&nbsp;Operations</span> Instances</>} value={aioInstances.length.toString()} />
      </div>

      {/* ── Services Health ──────────────────────────────────── */}
      <div>
        <SectionHeading title="Namespace Services" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {services.map((svc) => (
            <Card key={svc.name} className="shadow-sm">
              <CardContent className="flex items-start gap-4 p-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <svc.icon className="h-4 w-4 text-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{svc.name}</p>
                  <div className="mt-2">
                    <StatusBadge status={svc.status} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ── IoT Hubs ─────────────────────────────────────────── */}
      <div>
        <SectionHeading title="Linked IoT Hubs" count={hubs.length} />
        <div className="rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hub Name</TableHead>
                <TableHead>Region</TableHead>
                <TableHead className="text-right">Connected Devices</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hubs.map((hub) => (
                <TableRow key={hub.name}>
                  <TableCell className="font-medium">{hub.name}</TableCell>
                  <TableCell className="text-muted-foreground">{hub.region}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{hub.devices.toLocaleString()}</TableCell>
                  <TableCell><StatusBadge status={hub.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── AIO Instances ────────────────────────────────────── */}
      <div>
        <SectionHeading title={<><span className="whitespace-nowrap">IoT&nbsp;Operations</span> Instances</>} count={aioInstances.length} />
        <div className="rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Instance</TableHead>
                <TableHead>Site</TableHead>
                <TableHead className="text-right">Connected Devices</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aioInstances.map((inst) => (
                <TableRow key={inst.name}>
                  <TableCell className="font-medium">{inst.name}</TableCell>
                  <TableCell className="text-muted-foreground">{inst.site}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{inst.connectedDevices.toLocaleString()}</TableCell>
                  <TableCell><StatusBadge status={inst.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Jobs ─────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <SectionHeading title="Jobs" />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Play className="h-3.5 w-3.5" />
              Run Existing Job
            </Button>
            <Button size="sm" className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              New Job
            </Button>
          </div>
        </div>
        <div className="rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Job ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Targets</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead className="w-[40px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => {
                const StatusIcon = jobStatusIcons[job.status] || CheckCircle2
                return (
                  <TableRow key={job.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{job.id}</TableCell>
                    <TableCell className="font-medium">{job.name}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md border bg-muted/40 px-2 py-0.5 text-xs font-medium">
                        {job.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{job.targets}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${jobStatusStyles[job.status] || ''}`}>
                        <StatusIcon className={`h-3 w-3 ${job.status === 'Running' ? 'animate-spin' : ''}`} />
                        {job.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{job.started}</TableCell>
                    <TableCell>
                      <button className="rounded-md p-1 text-muted-foreground hover:bg-muted transition-colors">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Sub-components ────────────────────────────────────────── */

function HeroStat({ icon: Icon, label, value }: { icon: typeof Radio; label: React.ReactNode; value: string }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-5 w-5 text-foreground" />
        </div>
        <div>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function SectionHeading({ title, count }: { title: React.ReactNode; count?: number }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {count !== undefined && (
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {count}
        </span>
      )}
    </div>
  )
}
