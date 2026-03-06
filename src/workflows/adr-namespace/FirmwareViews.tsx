import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Zap, Play, Shield, CheckCircle2, RefreshCw, AlertTriangle, Upload, Trash2, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { JobPrefill } from './NewJobWizard'
import {
  firmwareImages, firmwareDetailData,
  fwByManufacturer, fwByModel, cveBySeverity, cveByName,
  GROUP_MANUFACTURERS,
} from './mockData'
import { VBarChart, DonutChart, HBarChart, ChartCard } from './ChartHelpers'
import { severityColor, severityBg, HeroStat, SubViewHeader } from './SharedComponents'

const FW_TABS = ['Overview', 'Weaknesses', 'Software Components', 'Binary Hardening', 'Certificates', 'Password Hashes', 'Keys'] as const
type FwTab = typeof FW_TABS[number]

export function FirmwareDetailView({ version, onBack, onDevicesClick, onAssetsClick }: {
  version: string
  onBack: () => void
  onDevicesClick?: (version: string, manufacturer: string) => void
  onAssetsClick?: (manufacturer: string) => void
}) {
  const [activeTab, setActiveTab] = useState<FwTab>('Overview')
  const fw = firmwareImages.find(f => f.version === version)
  const detail = firmwareDetailData[version]
  if (!fw || !detail) return null

  const totalCves = detail.cvesBySeverity.critical + detail.cvesBySeverity.high + detail.cvesBySeverity.medium + detail.cvesBySeverity.low
  const cveSeveritySegments = [
    { label: 'Critical', value: detail.cvesBySeverity.critical, color: '#dc2626' },
    { label: 'High', value: detail.cvesBySeverity.high, color: '#f97316' },
    { label: 'Medium', value: detail.cvesBySeverity.medium, color: '#f59e0b' },
    { label: 'Low', value: detail.cvesBySeverity.low, color: '#94a3b8' },
  ].filter(s => s.value > 0)

  const keySegments = [
    { label: 'Private Keys', value: detail.keys.private, color: '#0ea5e9' },
    { label: 'Public Keys', value: detail.keys.public, color: '#1e3a5f' },
  ]

  const certTotal = detail.certificates.expired + detail.certificates.expiringSoon + detail.certificates.valid
  const certExpiredPct = certTotal > 0 ? (detail.certificates.expired / certTotal) * 100 : 0
  const certExpiringSoonPct = certTotal > 0 ? (detail.certificates.expiringSoon / certTotal) * 100 : 0
  const certValidPct = certTotal > 0 ? (detail.certificates.valid / certTotal) * 100 : 0

  const binaryData = [
    { label: 'NX', value: detail.binaryHardening.nx },
    { label: 'PIE', value: detail.binaryHardening.pie },
    { label: 'RELRO', value: detail.binaryHardening.relro },
    { label: 'Canary', value: detail.binaryHardening.canary },
    { label: 'Stripped', value: detail.binaryHardening.stripped },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{fw.file}</h1>
          <span className="inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-medium text-slate-600">v{fw.version}</span>
          {fw.cves.critical > 0 && (
            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
              {fw.cves.critical} Critical
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5 flex-wrap">
          <span>{fw.manufacturer}</span>
          <span className="text-slate-300">·</span>
          <span>{fw.model}</span>
          <span className="text-slate-300">·</span>
          <button
            onClick={() => onDevicesClick?.(fw.version, fw.manufacturer)}
            className="text-blue-600 hover:text-blue-800 hover:underline underline-offset-2 transition-colors"
          >{fw.devicesAffected.toLocaleString()} devices</button>
          <span className="text-slate-300">·</span>
          <button
            onClick={() => onAssetsClick?.(fw.manufacturer)}
            className="text-blue-600 hover:text-blue-800 hover:underline underline-offset-2 transition-colors"
          >{fw.assetsAffected.toLocaleString()} assets</button>
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {FW_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >{tab}</button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Weaknesses */}
          <Card className="shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm font-semibold mb-1">Weaknesses</p>
              <p className="text-3xl font-bold mb-1">{totalCves}</p>
              <p className="text-xs text-muted-foreground mb-4">Total CVEs</p>
              {cveSeveritySegments.length > 0 ? (
                <DonutChart segments={cveSeveritySegments} centerLabel="CVEs" legendBelow />
              ) : (
                <p className="text-sm text-emerald-600 font-medium py-4 text-center">Clean — no known CVEs</p>
              )}
              <button className="mt-4 text-xs text-blue-600 hover:underline" onClick={() => setActiveTab('Weaknesses')}>
                Weaknesses &gt;
              </button>
            </CardContent>
          </Card>

          {/* Binary Hardening */}
          <Card className="shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm font-semibold mb-1">Binary Hardening</p>
              <p className="text-3xl font-bold mb-1">{detail.binaryHardening.total}</p>
              <p className="text-xs text-muted-foreground mb-4">Total binaries</p>
              <VBarChart data={binaryData} total={detail.binaryHardening.total} />
              <button className="mt-4 text-xs text-blue-600 hover:underline" onClick={() => setActiveTab('Binary Hardening')}>
                Binary hardening &gt;
              </button>
            </CardContent>
          </Card>

          {/* Keys */}
          <Card className="shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm font-semibold mb-1">Keys</p>
              <div className="flex gap-5 mb-4">
                <div><p className="text-3xl font-bold">{detail.keys.total}</p><p className="text-xs text-muted-foreground">Total keys</p></div>
                {detail.keys.pairedKeys > 0 && <div><p className="text-3xl font-bold text-amber-600">{detail.keys.pairedKeys}</p><p className="text-xs text-muted-foreground">Paired keys</p></div>}
                {detail.keys.shortKeySize > 0 && <div><p className="text-3xl font-bold text-red-600">{detail.keys.shortKeySize}</p><p className="text-xs text-muted-foreground">Short key size</p></div>}
              </div>
              {keySegments.every(s => s.value > 0) && (
                <DonutChart segments={keySegments} centerLabel="Keys" />
              )}
              <button className="mt-4 text-xs text-blue-600 hover:underline" onClick={() => setActiveTab('Keys')}>
                Keys &gt;
              </button>
            </CardContent>
          </Card>

          {/* Software Components */}
          <Card className="shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm font-semibold mb-1">Software components</p>
              <p className="text-3xl font-bold mb-1">{detail.softwareComponents.length}</p>
              <p className="text-xs text-muted-foreground mb-4">Total components</p>
              <div className="space-y-0">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5 px-0.5">
                  <span>Top components by CVE</span><span>CVEs</span>
                </div>
                {detail.softwareComponents.slice(0, 4).map(c => (
                  <div key={c.name} className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm">
                    <span className="text-foreground">{c.name}</span>
                    <span className="font-mono tabular-nums text-xs">{c.cves}</span>
                  </div>
                ))}
              </div>
              <button className="mt-3 text-xs text-blue-600 hover:underline" onClick={() => setActiveTab('Software Components')}>
                Software components &gt;
              </button>
            </CardContent>
          </Card>

          {/* Certificates */}
          <Card className="shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm font-semibold mb-1">Certificates</p>
              <div className="flex gap-4 mb-4">
                <div><p className="text-3xl font-bold">{detail.certificates.total}</p><p className="text-xs text-muted-foreground">Total</p></div>
                {detail.certificates.weakSig > 0 && <div><p className="text-3xl font-bold text-red-600">{detail.certificates.weakSig}</p><p className="text-xs text-muted-foreground">Weak signature</p></div>}
                {detail.certificates.selfSigned > 0 && <div><p className="text-3xl font-bold text-amber-600">{detail.certificates.selfSigned}</p><p className="text-xs text-muted-foreground">Self signed</p></div>}
                {detail.certificates.shortKey > 0 && <div><p className="text-3xl font-bold text-orange-600">{detail.certificates.shortKey}</p><p className="text-xs text-muted-foreground">Short key size</p></div>}
              </div>
              <p className="text-xs text-muted-foreground mb-2">Certificate expiration status</p>
              <div className="flex h-3 w-full rounded-full overflow-hidden">
                {certExpiredPct > 0 && <div style={{ width: `${certExpiredPct}%`, backgroundColor: '#1e293b' }} />}
                {certExpiringSoonPct > 0 && <div style={{ width: `${certExpiringSoonPct}%`, backgroundColor: '#f97316' }} />}
                {certValidPct > 0 && <div style={{ width: `${certValidPct}%`, backgroundColor: '#0ea5e9' }} />}
              </div>
              <div className="flex gap-4 mt-2">
                {certExpiredPct > 0 && <div className="flex items-center gap-1 text-[11px] text-muted-foreground"><span className="h-2 w-2 rounded-sm bg-slate-900 shrink-0" />Expired</div>}
                {certExpiringSoonPct > 0 && <div className="flex items-center gap-1 text-[11px] text-muted-foreground"><span className="h-2 w-2 rounded-sm bg-orange-400 shrink-0" />Expiring Soon</div>}
                {certValidPct > 0 && <div className="flex items-center gap-1 text-[11px] text-muted-foreground"><span className="h-2 w-2 rounded-sm bg-sky-500 shrink-0" />Valid</div>}
              </div>
              <button className="mt-4 text-xs text-blue-600 hover:underline" onClick={() => setActiveTab('Certificates')}>
                Certificates &gt;
              </button>
            </CardContent>
          </Card>

          {/* Password Hashes */}
          <Card className="shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm font-semibold mb-1">Password hashes</p>
              <p className="text-3xl font-bold mb-1">{detail.passwordHashes.total}</p>
              <p className="text-xs text-muted-foreground mb-4">Total password hashes</p>
              <div className="space-y-0">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5 px-0.5">
                  <span>Top algorithms</span><span>Count</span>
                </div>
                {detail.passwordHashes.algorithms.map(a => (
                  <div key={a.name} className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm">
                    <span className="text-foreground">{a.name}</span>
                    <span className="font-mono tabular-nums text-xs">{a.count}</span>
                  </div>
                ))}
              </div>
              <button className="mt-3 text-xs text-blue-600 hover:underline" onClick={() => setActiveTab('Password Hashes')}>
                Password hashes &gt;
              </button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'Weaknesses' && (
        <div className="rounded-lg border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[140px]">CVE ID</TableHead>
                <TableHead className="w-[100px]">Severity</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.cves.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs font-medium">{c.id}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${severityBg[c.severity]}`}>{c.severity}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {activeTab === 'Software Components' && (
        <div className="rounded-lg border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Component</TableHead>
                <TableHead>Version</TableHead>
                <TableHead className="text-right">CVEs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.softwareComponents.map(c => (
                <TableRow key={c.name}>
                  <TableCell className="font-medium text-sm">{c.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{c.version}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{c.cves > 0 ? c.cves : <span className="text-emerald-600 text-xs">Clean</span>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {activeTab === 'Binary Hardening' && (
        <div className="rounded-lg border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Protection</TableHead>
                <TableHead className="text-right">Enabled</TableHead>
                <TableHead className="text-right">Total Binaries</TableHead>
                <TableHead className="text-right">Coverage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {binaryData.map(b => (
                <TableRow key={b.label}>
                  <TableCell className="font-medium text-sm">{b.label}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{b.value}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-muted-foreground">{detail.binaryHardening.total}</TableCell>
                  <TableCell className="text-right">
                    <span className={`text-sm font-medium ${b.value / detail.binaryHardening.total >= 0.8 ? 'text-emerald-600' : b.value / detail.binaryHardening.total >= 0.5 ? 'text-amber-600' : 'text-red-600'}`}>
                      {Math.round((b.value / detail.binaryHardening.total) * 100)}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {(activeTab === 'Certificates' || activeTab === 'Password Hashes' || activeTab === 'Keys') && (
        <div className="rounded-lg border bg-slate-50 p-10 text-center">
          <p className="text-sm font-medium text-slate-700">{activeTab}</p>
          <p className="text-sm text-muted-foreground mt-1">Detailed {activeTab.toLowerCase()} analysis view coming soon.</p>
        </div>
      )}
    </motion.div>
  )
}

export function FirmwareAnalysisView({ onFirmwareSelect, onVersionClick, onManufacturerClick, onModelClick }: {
  onFirmwareSelect?: (version: string) => void
  onVersionClick?: (version: string) => void
  onManufacturerClick?: (name: string) => void
  onModelClick?: (name: string) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-8"
    >
      <SubViewHeader title="Firmware Analysis" subtitle="Texas-Wind-Namespace" count={firmwareImages.length} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ChartCard title="Affected Devices by Manufacturer">
          <HBarChart data={fwByManufacturer} onBarClick={onManufacturerClick} />
        </ChartCard>
        <ChartCard title="Affected Devices by Model">
          <HBarChart data={fwByModel} onBarClick={onModelClick} />
        </ChartCard>
        <ChartCard title="CVEs by Severity">
          <DonutChart segments={cveBySeverity} centerLabel="CVEs" legendBelow />
        </ChartCard>
        <ChartCard title="Top CVEs by Affected Devices">
          <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
            {cveByName.map((c) => (
              <div key={c.cve}>
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${severityBg[c.severity]}`}>
                      {c.severity[0]}
                    </span>
                    <span className="font-mono text-[11px] truncate text-foreground">{c.cve}</span>
                  </div>
                  <span className="font-mono text-xs tabular-nums ml-2 shrink-0">{c.devices.toLocaleString()}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(c.devices / 12_847) * 100}%`, backgroundColor: severityColor[c.severity] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <div>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-base font-semibold">Firmware Images</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{firmwareImages.length} images</span>
        </div>
        <div className="rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Firmware Image</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Vulnerabilities</TableHead>
                <TableHead className="text-right">Devices Affected</TableHead>
                <TableHead className="w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {firmwareImages.map((fw) => {
                const totalCves = fw.cves.critical + fw.cves.high + fw.cves.medium + fw.cves.low
                return (
                  <TableRow key={fw.file}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{fw.file}</TableCell>
                    <TableCell className="text-sm">{fw.manufacturer}</TableCell>
                    <TableCell className="text-sm">{fw.model}</TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">v{fw.version}</span>
                    </TableCell>
                    <TableCell>
                      {totalCves === 0 ? (
                        <span className="text-xs text-emerald-600 font-medium">Clean</span>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {fw.cves.critical > 0 && (
                            <span className="relative inline-flex items-center">
                              <span className="absolute inset-0 rounded-md bg-red-500 animate-ping opacity-75" />
                              <span className="relative inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold bg-red-600 text-white">
                                {fw.cves.critical} Critical
                              </span>
                            </span>
                          )}
                          {fw.cves.high > 0 && <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold bg-orange-500 text-white">{fw.cves.high} High</span>}
                          {fw.cves.medium > 0 && <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-amber-100 text-amber-700 border border-amber-200">{fw.cves.medium} Medium</span>}
                          {fw.cves.low > 0 && <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">{fw.cves.low} Low</span>}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">{fw.devicesAffected.toLocaleString()}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => onFirmwareSelect?.(fw.version)}
                        className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium text-blue-600 border-blue-200 hover:bg-blue-50 transition-colors"
                      >
                        <FileText className="h-3 w-3" />
                        Report
                      </button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* CVE Detail Table */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-base font-semibold">CVE Detail</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{cveByName.length} vulnerabilities</span>
        </div>
        <div className="rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CVE ID</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Devices Affected</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cveByName.map((c) => (
                <TableRow key={c.cve}>
                  <TableCell className="font-mono text-xs font-medium">{c.cve}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${severityBg[c.severity]}`}>
                      {c.severity}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.description}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{c.devices.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </motion.div>
  )
}

export function OtaManagementView({ onFirmwareSelect, onDeploy, autoOpenUpload, onAutoOpenConsumed }: {
  onFirmwareSelect?: (version: string) => void
  onDeploy?: (prefill: JobPrefill) => void
  autoOpenUpload?: boolean
  onAutoOpenConsumed?: () => void
}) {
  const [images, setImages] = useState(() => [...firmwareImages])
  const [showUpload, setShowUpload] = useState(autoOpenUpload ?? false)
  useEffect(() => { if (autoOpenUpload) onAutoOpenConsumed?.() }, [])
  const [uploadDraft, setUploadDraft] = useState({ file: '', manufacturer: '', model: '', version: '' })

  const latestByModel = useMemo(() => {
    const map: Record<string, string> = {}
    images.forEach(f => { if (!map[f.model] || f.version > map[f.model]) map[f.model] = f.version })
    return map
  }, [images])

  const deviceBarData = useMemo(() =>
    images.map(f => ({
      label: `v${f.version} · ${f.model.replace(/([A-Z])/g, ' $1').trim().split(' ')[0]}`,
      value: f.devicesAffected,
      color: f.version === latestByModel[f.model] ? '#22c55e' : '#f97316',
    })).sort((a, b) => b.value - a.value),
    [images, latestByModel]
  )

  const assetBarData = useMemo(() =>
    images.map(f => ({
      label: `v${f.version} · ${f.model.replace(/([A-Z])/g, ' $1').trim().split(' ')[0]}`,
      value: f.assetsAffected,
      color: f.version === latestByModel[f.model] ? '#22c55e' : '#f97316',
    })).sort((a, b) => b.value - a.value),
    [images, latestByModel]
  )

  const totalCritical = images.reduce((s, f) => s + f.cves.critical, 0)
  const devicesNeedingUpdate = images.filter(f => f.version !== latestByModel[f.model]).reduce((s, f) => s + f.devicesAffected, 0)
  const devicesUpToDate = images.filter(f => f.version === latestByModel[f.model]).reduce((s, f) => s + f.devicesAffected, 0)

  function handleUpload() {
    if (!uploadDraft.file.trim() || !uploadDraft.version.trim()) return
    setImages(prev => [...prev, {
      file: uploadDraft.file,
      manufacturer: uploadDraft.manufacturer || GROUP_MANUFACTURERS[0],
      model: uploadDraft.model || 'Unknown',
      version: uploadDraft.version,
      cves: { critical: 0, high: 0, medium: 0, low: 0 },
      devicesAffected: 0,
      assetsAffected: 0,
    }])
    setUploadDraft({ file: '', manufacturer: '', model: '', version: '' })
    setShowUpload(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <Zap className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Firmware Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Texas-Wind-Namespace</p>
          </div>
        </div>
        <button
          onClick={() => onDeploy?.({ jobType: 'software-update' })}
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-700"
        >
          <Play className="h-3.5 w-3.5" />
          Deploy Update
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <HeroStat icon={Shield} label="Firmware Images" value={String(images.length)} />
        <HeroStat icon={CheckCircle2} label="Devices Up-to-Date" value={devicesUpToDate.toLocaleString()} />
        <HeroStat icon={RefreshCw} label="Devices Need Update" value={devicesNeedingUpdate.toLocaleString()} />
        <HeroStat icon={AlertTriangle} label="Critical CVEs" value={String(totalCritical)} />
      </div>

      {/* Distribution charts */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ChartCard title="Devices by Firmware Version">
          <HBarChart data={deviceBarData} />
        </ChartCard>
        <ChartCard title="Assets by Firmware Version">
          <HBarChart data={assetBarData} />
        </ChartCard>
        <ChartCard title="Top CVEs by Affected Devices">
          <div className="space-y-3">
            {cveByName.slice(0, 5).map((c) => (
              <div key={c.cve}>
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${severityBg[c.severity]}`}>
                      {c.severity[0]}
                    </span>
                    <span className="font-mono text-[11px] truncate text-foreground">{c.cve}</span>
                  </div>
                  <span className="font-mono text-xs tabular-nums ml-2 shrink-0">{c.devices.toLocaleString()}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(c.devices / 12_847) * 100}%`, backgroundColor: severityColor[c.severity] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Firmware Library */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">Firmware Library</h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{images.length} images</span>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload Firmware
          </button>
        </div>
        <div className="rounded-lg border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Image File</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Vulnerabilities</TableHead>
                <TableHead className="text-right">Devices</TableHead>
                <TableHead className="text-right">Assets</TableHead>
                <TableHead className="w-[170px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {images.map(fw => {
                const isLatest = fw.version === latestByModel[fw.model]
                return (
                  <TableRow key={fw.file} className="group hover:bg-slate-50/80">
                    <TableCell className="font-mono text-xs text-muted-foreground">{fw.file}</TableCell>
                    <TableCell className="text-sm">{fw.manufacturer}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{fw.model}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-xs">v{fw.version}</span>
                        {isLatest && (
                          <span className="inline-flex w-fit items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">Latest</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(fw.cves.critical + fw.cves.high + fw.cves.medium + fw.cves.low) === 0 ? (
                        <span className="text-xs text-emerald-600 font-medium">Clean</span>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {fw.cves.critical > 0 && (
                            <span className="relative inline-flex items-center">
                              <span className="absolute inset-0 rounded-md bg-red-500 animate-ping opacity-75" />
                              <span className="relative inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold bg-red-600 text-white">{fw.cves.critical} Critical</span>
                            </span>
                          )}
                          {fw.cves.high > 0 && <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold bg-orange-500 text-white">{fw.cves.high} High</span>}
                          {fw.cves.medium > 0 && <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-amber-100 text-amber-700 border border-amber-200">{fw.cves.medium} Medium</span>}
                          {fw.cves.low > 0 && <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">{fw.cves.low} Low</span>}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">{fw.devicesAffected.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{fw.assetsAffected.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onFirmwareSelect?.(fw.version)}
                          className="inline-flex items-center gap-1 rounded-md border border-blue-200 px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <FileText className="h-3 w-3" />
                          Analyze
                        </button>
                        <button
                          onClick={() => onDeploy?.({ jobType: 'software-update' })}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-slate-700"
                        >
                          <Play className="h-3 w-3" />
                          Deploy
                        </button>
                        <button
                          onClick={() => setImages(prev => prev.filter(f => f.file !== fw.file))}
                          className="ml-1 rounded-md border border-transparent p-1 text-slate-300 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all"
                          title="Remove firmware image"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {images.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                    No firmware images. Upload one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* CVE Detail Table */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-base font-semibold">CVE Detail</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{cveByName.length} vulnerabilities</span>
        </div>
        <div className="rounded-lg border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>CVE ID</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Devices Affected</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cveByName.map((c) => (
                <TableRow key={c.cve}>
                  <TableCell className="font-mono text-xs font-medium">{c.cve}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${severityBg[c.severity]}`}>
                      {c.severity}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.description}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{c.devices.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Upload Firmware Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => setShowUpload(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-xl border bg-white shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b px-6 py-4">
                <div>
                  <h3 className="text-base font-semibold">Upload Firmware Image</h3>
                  <p className="text-xs text-muted-foreground">Add a new image to the firmware library</p>
                </div>
                <button onClick={() => setShowUpload(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"><X className="h-4 w-4" /></button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-medium cursor-pointer select-none hover:text-blue-600 transition-colors inline-flex items-center gap-1 group"
                    title="Click to fill"
                    onClick={() => setUploadDraft(d => ({ ...d, file: 'turbine-ctrl-x700-v3.3.0.bin' }))}
                  >File Name<span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-500 transition-opacity">← click to fill</span></label>
                  <Input value={uploadDraft.file} onChange={e => setUploadDraft(d => ({ ...d, file: e.target.value }))} placeholder="e.g. turbine-ctrl-x700-v3.3.0.bin" className="h-9 text-sm font-mono" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label
                      className="text-xs font-medium cursor-pointer select-none hover:text-blue-600 transition-colors inline-flex items-center gap-1 group"
                      title="Click to fill"
                      onClick={() => setUploadDraft(d => ({ ...d, manufacturer: 'Contoso Wind Systems' }))}
                    >Manufacturer<span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-500 transition-opacity">← click to fill</span></label>
                    <select value={uploadDraft.manufacturer} onChange={e => setUploadDraft(d => ({ ...d, manufacturer: e.target.value }))} className="flex h-9 w-full rounded-md border border-input bg-white px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                      <option value="">Select…</option>
                      {GROUP_MANUFACTURERS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label
                      className="text-xs font-medium cursor-pointer select-none hover:text-blue-600 transition-colors inline-flex items-center gap-1 group"
                      title="Click to fill"
                      onClick={() => setUploadDraft(d => ({ ...d, model: 'TurbineController-X700' }))}
                    >Model<span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-500 transition-opacity">← click to fill</span></label>
                    <select value={uploadDraft.model} onChange={e => setUploadDraft(d => ({ ...d, model: e.target.value }))} className="flex h-9 w-full rounded-md border border-input bg-white px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                      <option value="">Select…</option>
                      {['TurbineController-X700', 'AnemometerPro-2400', 'PitchController-5000', 'EdgeGateway-1900'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-medium cursor-pointer select-none hover:text-blue-600 transition-colors inline-flex items-center gap-1 group"
                    title="Click to fill"
                    onClick={() => setUploadDraft(d => ({ ...d, version: '3.3.0' }))}
                  >Version<span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-500 transition-opacity">← click to fill</span></label>
                  <Input value={uploadDraft.version} onChange={e => setUploadDraft(d => ({ ...d, version: e.target.value }))} placeholder="e.g. 3.3.0" className="h-9 text-sm font-mono" />
                </div>
              </div>
              <div className="flex items-center justify-between border-t px-6 py-4">
                <Button variant="outline" size="sm" onClick={() => setShowUpload(false)}>Cancel</Button>
                <Button size="sm" disabled={!uploadDraft.file.trim() || !uploadDraft.version.trim()} onClick={handleUpload}>
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Upload
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
