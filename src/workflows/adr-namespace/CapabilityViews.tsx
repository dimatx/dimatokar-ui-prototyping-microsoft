import { motion } from 'framer-motion'
import { Upload, Shield, KeyRound, FileText, Puzzle, ChevronRight } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { NamespaceService } from './mockData'
import {
  mockEnrollmentGroups, mockCertHierarchy, mockThirdPartyIntegrations,
  provRegistrationsL1D, provAssignedL1D, provAttestL1D,
  certOpsL1D, certRevokedL1D, certOpsL30D,
} from './mockData'
import { ChartCard, TinyLineChart } from './chartHelpers'
import { CapabilityPageHeader } from './sharedComponents'

/* ─── Provisioning View ──────────────────────────────────────── */

export function ProvisioningView({ svc, onConfigure }: { svc: NamespaceService; onConfigure: () => void }) {
  const totalDevices = mockEnrollmentGroups.reduce((s, g) => s + g.devices, 0)
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <CapabilityPageHeader icon={Upload} title="Provisioning" description="Manage device enrollment groups and provisioning rules for this namespace." svc={svc} onConfigure={onConfigure} />
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Enrollment Groups', value: mockEnrollmentGroups.length.toString() },
          { label: 'Registered Devices', value: totalDevices.toLocaleString() },
          { label: 'Allocation Policy', value: 'Evenly Weighted Distribution' },
        ].map(c => (
          <div key={c.label} className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">{c.label}</p>
            <p className="text-xl font-semibold text-slate-900">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <ChartCard title="Registration Attempts – 24h">
          <TinyLineChart data={provRegistrationsL1D} color="#3b82f6" label="Current hour" />
        </ChartCard>
        <ChartCard title="Devices Assigned – 24h">
          <TinyLineChart data={provAssignedL1D} color="#10b981" label="Current hour" />
        </ChartCard>
        <ChartCard title="Attestation Attempts – 24h">
          <TinyLineChart data={provAttestL1D} color="#f59e0b" label="Current hour" />
        </ChartCard>
      </div>
      <div className="rounded-lg border border-slate-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">ID</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Enrollment Group</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Attestation</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Devices</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Created</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockEnrollmentGroups.map(g => (
              <TableRow key={g.id} className="hover:bg-slate-50/60">
                <TableCell className="font-mono text-xs text-slate-400">{g.id}</TableCell>
                <TableCell className="font-medium text-sm">{g.name}</TableCell>
                <TableCell className="text-sm text-slate-600">{g.attestation}</TableCell>
                <TableCell className="text-right font-mono text-sm">{g.devices.toLocaleString()}</TableCell>
                <TableCell className="text-xs text-slate-400">{g.created}</TableCell>
                <TableCell><StatusBadge status={g.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  )
}

/* ─── Certificate Management View ───────────────────────────── */

export function CertMgmtView({ svc, onConfigure, onNavigate }: { svc: NamespaceService; onConfigure: () => void; onNavigate: (id: string) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <CapabilityPageHeader icon={Shield} title="Certificate Management" description="Manage the CA hierarchy and certificate lifecycle for devices in this namespace." svc={svc} onConfigure={onConfigure} />
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'CAs',                      value: '2'                    },
          { label: 'Root CAs',                  value: '1'                    },
          { label: 'Intermediate CAs',           value: '1'                    },
          { label: 'Active Leaf Certificates',   value: (8_421).toLocaleString() },
        ].map(c => (
          <div key={c.label} className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">{c.label}</p>
            <p className="text-xl font-semibold text-slate-900">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <ChartCard title="Certificate Operations – Last 24h">
          <TinyLineChart data={certOpsL1D} color="#3b82f6" label="Issued this hour" />
          <p className="text-[11px] text-muted-foreground mt-2">Revocations: <span className="font-mono">{certRevokedL1D[certRevokedL1D.length - 1]}</span> in current hour</p>
        </ChartCard>
        <ChartCard title="Certificate Operations – Last 30 Days">
          <TinyLineChart data={certOpsL30D} color="#8b5cf6" label="Issued today" />
        </ChartCard>
      </div>
      <div className="rounded-lg border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">CA Hierarchy</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-white">
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">ID</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Issuer</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Valid To</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockCertHierarchy.map(c => {
              const destId = c.type === 'Root CA' ? 'credentials' : 'policies'
              const destLabel = c.type === 'Root CA' ? 'View in Credentials' : 'View in Policies'
              return (
                <TableRow
                  key={c.id}
                  className="hover:bg-slate-50/80 cursor-pointer"
                  onClick={() => onNavigate(destId)}
                >
                  <TableCell className="font-mono text-xs text-slate-400">{c.id}</TableCell>
                  <TableCell className="font-medium text-sm">{c.name}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-slate-50 text-slate-600 border-slate-200">{c.type}</span>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">{c.issuer}</TableCell>
                  <TableCell className="text-xs text-slate-400">{c.validTo}</TableCell>
                  <TableCell><StatusBadge status={c.status === 'Valid' ? 'Healthy' : c.status} /></TableCell>
                  <TableCell className="text-right">
                    <span className="text-xs text-blue-600 hover:underline flex items-center gap-1 justify-end">
                      {destLabel}<ChevronRight className="h-3 w-3" />
                    </span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  )
}

/* ─── Credentials Page View ──────────────────────────────────── */

export function CredentialsPageView() {
  const ca = mockCertHierarchy.find(c => c.type === 'Root CA')!
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <CapabilityPageHeader icon={KeyRound} title="Credentials" description="Root certificate authority anchoring device identity for this namespace." />
      <div className="rounded-lg border border-slate-100 bg-white shadow-sm p-6 max-w-lg space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-50 text-amber-600">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">{ca.name}</p>
            <p className="text-xs text-slate-400">{ca.type}</p>
          </div>
          <div className="ml-auto"><StatusBadge status="Healthy" /></div>
        </div>
        {[
          { label: 'Issuer',        value: ca.issuer },
          { label: 'Valid To',      value: ca.validTo },
          { label: 'Algorithm',     value: 'RSA 4096 / SHA-256' },
          { label: 'Fingerprint',   value: 'E4:2B:C1:9A:…:7F:03' },
          { label: 'Namespace',     value: 'Texas-Wind-Namespace' },
        ].map(r => (
          <div key={r.label} className="flex justify-between text-sm">
            <span className="text-slate-500">{r.label}</span>
            <span className="font-medium text-slate-800 font-mono text-xs">{r.value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

/* ─── Policies Page View ─────────────────────────────────────── */

export function PoliciesPageView() {
  const ica = mockCertHierarchy.find(c => c.type === 'Intermediate CA')!
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <CapabilityPageHeader icon={FileText} title="Policies" description="Intermediate certificate authority (ICA) issuing device certificates for this namespace." />
      <div className="rounded-lg border border-slate-100 bg-white shadow-sm p-6 max-w-lg space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-50 text-violet-600">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">{ica.name}</p>
            <p className="text-xs text-slate-400">{ica.type}</p>
          </div>
          <div className="ml-auto"><StatusBadge status="Healthy" /></div>
        </div>
        {[
          { label: 'Issuer',          value: ica.issuer },
          { label: 'Valid To',        value: ica.validTo },
          { label: 'Algorithm',       value: 'RSA 2048 / SHA-256' },
          { label: 'Fingerprint',     value: 'A1:9D:B4:22:…:FC:88' },
          { label: 'Scope',           value: 'Texas-Wind-Namespace' },
          { label: 'Max Path Length', value: '0 (leaf certs only)' },
        ].map(r => (
          <div key={r.label} className="flex justify-between text-sm">
            <span className="text-slate-500">{r.label}</span>
            <span className="font-medium text-slate-800 font-mono text-xs">{r.value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

/* ─── Third Party View ───────────────────────────────────────── */

export function ThirdPartyView({ svc, onConfigure }: { svc: NamespaceService | undefined; onConfigure: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <CapabilityPageHeader icon={Puzzle} title="3P Capability" description="Connect third-party partner services and marketplace integrations to this namespace." svc={svc ?? null} onConfigure={svc ? onConfigure : undefined} />
      <div className="rounded-lg border border-slate-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Integration</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Vendor</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockThirdPartyIntegrations.map(t => (
              <TableRow key={t.id} className="hover:bg-slate-50/60">
                <TableCell className="font-medium text-sm">{t.name}</TableCell>
                <TableCell className="text-sm text-slate-600">{t.vendor}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-slate-50 text-slate-600 border-slate-200">{t.category}</span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-sky-50 text-sky-700 border-sky-200">{t.status}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  )
}
