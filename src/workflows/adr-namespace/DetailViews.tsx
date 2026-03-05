import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight, ChevronDown, Play, ExternalLink, Tag, Drill,
  AlertTriangle, Shield, Upload, Loader2, Network, Wifi, Cpu, LockKeyhole,
} from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import type { JobPrefill } from './NewJobWizard'
import {
  mockAssets, mockDevices,
  ASSET_MODEL_MAP, DEVICE_ACTIONS,
  LATEST_ASSET_FW_BY_TYPE, LATEST_DEVICE_FW_BY_MODEL,
  firmwareDetailData,
  assetObservabilityData,
  deviceObservabilityData,
  assetStackHealth,
  deviceHubHealthData,
} from './mockData'
import { SensitivitySelect } from './sharedComponents'
import { MetricsRow, ConnectivityTimeline, AssetStackHealth, DeviceHubHealth, HealthSection } from './healthComponents'

export function AssetDetailView({ assetId, onBack, onFirmwareSelect, onRunJob, onUpdateFirmware }: { assetId: string; onBack: () => void; onFirmwareSelect: (v: string) => void; onRunJob?: (ids: string[], names: Record<string, string>) => void; onUpdateFirmware?: (prefill: JobPrefill) => void }) {
  const asset = mockAssets.find(a => a.id === assetId)
  const [sensitivity, setSensitivity] = useState('General')
  const [itemStatus, setItemStatus] = useState(() => asset?.status ?? 'Available')
  const [toggling, setToggling] = useState<null | 'enabling' | 'disabling'>(null)
  if (!asset) return <div className="p-8 text-muted-foreground text-sm">Asset not found.</div>
  const isItemDisabled = itemStatus === 'Disabled' || itemStatus === 'Inactive'
  const handleToggle = () => {
    if (toggling) return
    if (isItemDisabled) {
      setToggling('enabling')
      setTimeout(() => { setItemStatus('Available'); setToggling(null) }, 1500)
    } else {
      setToggling('disabling')
      setTimeout(() => { setItemStatus('Disabled'); setToggling(null) }, 1500)
    }
  }

  const fwVersion = asset.firmware.startsWith('v') ? asset.firmware.slice(1) : asset.firmware
  const fwData = firmwareDetailData[fwVersion]
  const model = ASSET_MODEL_MAP[asset.type] ?? asset.type
  const sevColor: Record<string, string> = { Critical: '#ef4444', High: '#f97316', Medium: '#f59e0b', Low: '#94a3b8' }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-6">
      <div className="flex items-center gap-2">
        <div>
          <h1 className="text-lg font-semibold">{asset.name}</h1>
          <p className="text-xs text-muted-foreground">{asset.id} · {asset.type}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SensitivitySelect value={sensitivity} onChange={setSensitivity} />
          <StatusBadge status={itemStatus === 'Available' ? 'Healthy' : itemStatus} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {DEVICE_ACTIONS.filter(a => {
          if (a.id === 'enable') return isItemDisabled
          if (a.id === 'disable') return !isItemDisabled
          return true
        }).map(action => (
          <button
            key={action.id}
            onClick={
              (action.id === 'enable' || action.id === 'disable')
                ? handleToggle
                : action.id === 'update-firmware' && onUpdateFirmware
                  ? () => onUpdateFirmware({
                      jobType: 'software-update',
                      jobName: `Firmware Update – ${asset.name}`,
                      startAtStep: 3,
                      preselectedIds: [asset.id],
                      preselectedSource: 'Assets',
                      preselectedNames: { [asset.id]: asset.name },
                    })
                  : undefined
            }
            disabled={toggling !== null && (action.id === 'enable' || action.id === 'disable')}
            className={`inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60 ${action.cls}`}
          >
            {toggling !== null && (action.id === 'enable' || action.id === 'disable')
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />{toggling === 'enabling' ? 'Enabling…' : 'Disabling…'}</>
              : <><action.icon className="h-3.5 w-3.5" />{action.label}</>
            }
          </button>
        ))}
        {onRunJob && (
          <button
            onClick={() => onRunJob([asset.id], { [asset.id]: asset.name })}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <Play className="h-3.5 w-3.5" />
            Run Job
          </button>
        )}
        <button onClick={() => {}} className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50">
          <ExternalLink className="h-3.5 w-3.5" />
          View in Azure Monitor
        </button>
      </div>

      <div className="rounded-lg border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center gap-2">
          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Azure Resource Properties</p>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-4 py-4">
          {[
            { label: 'Resource Group',   value: 'rg-zava-southcentralus' },
            { label: 'Location',          value: 'South Central US' },
            { label: 'Subscription',      value: 'Zava Energy – Production' },
            { label: 'Subscription ID',   value: '47b2c901-9f3a-4d81-b628-3e51a0c74f22' },
            { label: 'Namespace',         value: 'Texas-Wind-Namespace' },
            { label: 'Site',              value: asset.site },
          ].map(p => (
            <div key={p.label} className="flex flex-col gap-0.5">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{p.label}</span>
              <span className="text-sm font-mono text-slate-700">{p.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center gap-2">
          <Drill className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Asset Properties</p>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-4 py-4">
          {[
            { label: 'Manufacturer', value: asset.manufacturer },
            { label: 'Model',         value: model },
            { label: 'Type',          value: asset.type },
          ].map(p => (
            <div key={p.label} className="flex flex-col gap-0.5">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{p.label}</span>
              <span className="text-sm font-mono text-slate-700">{p.value}</span>
            </div>
          ))}
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Software Version</span>
            {asset.firmware === '—' ? (
              <span className="text-sm font-mono text-slate-400">—</span>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => onFirmwareSelect(fwVersion)} className="text-sm font-mono text-blue-600 hover:underline text-left flex items-center gap-1">
                  {asset.firmware}<ChevronRight className="h-3 w-3" />
                </button>
                {LATEST_ASSET_FW_BY_TYPE[asset.type] === asset.firmware ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 leading-none">LATEST</span>
                ) : LATEST_ASSET_FW_BY_TYPE[asset.type] ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 leading-none">Update available</span>
                ) : null}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Last Seen</span>
            <span className="text-sm text-slate-700">{asset.lastSeen}</span>
          </div>
        </div>
      </div>

      {fwData && (
        <div className="rounded-lg border border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Security summary</p>
            </div>
            <button onClick={() => onFirmwareSelect(fwVersion)} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View vulnerability report<ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="px-4 py-4">
            <div className="grid grid-cols-4 gap-3 mb-4">
              {(['Critical', 'High', 'Medium', 'Low'] as const).map(s => {
                const sk = s.toLowerCase() as keyof typeof fwData.cvesBySeverity
                return (
                  <div key={s} className="rounded-lg border border-slate-100 p-3 text-center">
                    <p className="text-lg font-bold" style={{ color: sevColor[s] }}>{fwData.cvesBySeverity[sk]}</p>
                    <p className="text-xs text-muted-foreground">{s}</p>
                  </div>
                )
              })}
            </div>
            <div className="space-y-1.5">
              {fwData.cves.slice(0, 3).map(c => (
                <div key={c.id} className="flex items-start gap-2 text-sm">
                  <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: `${sevColor[c.severity]}20`, color: sevColor[c.severity] }}>{c.severity[0]}</span>
                  <span className="font-mono text-xs text-slate-500 shrink-0 pt-0.5">{c.id}</span>
                  <span className="text-xs text-muted-foreground">{c.description}</span>
                </div>
              ))}
              {fwData.cves.length > 3 && (
                <button onClick={() => onFirmwareSelect(fwVersion)} className="text-xs text-blue-600 hover:underline mt-1">
                  +{fwData.cves.length - 3} more CVEs → view vulnerability report
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Health section ── */}
      {(() => {
        const obs = assetObservabilityData[asset.id]
        const layers = assetStackHealth[asset.id]
        const overallStatus = asset.status === 'Available' ? 'Healthy' : asset.status
        if (!obs || !layers) return null
        return (
          <HealthSection summaryStatus={overallStatus}>
            <MetricsRow
              isAsset={true}
              msgPerMin={obs.msgPerMin}
              errorsPerHr={obs.errorsPerHr}
              msgCountOrDataKB={obs.msgCount}
              connectivity={obs.connectivity}
            />
            <ConnectivityTimeline connectivity={obs.connectivity} />
            <AssetStackHealth layers={layers} />
          </HealthSection>
        )
      })()}
    </motion.div>
  )
}

export function DeviceDetailView({ deviceId, onBack, onFirmwareSelect, onRunJob, onUpdateFirmware }: { deviceId: string; onBack: () => void; onFirmwareSelect: (v: string) => void; onRunJob?: (ids: string[], names: Record<string, string>) => void; onUpdateFirmware?: (prefill: JobPrefill) => void }) {
  const device = mockDevices.find(d => d.id === deviceId)
  const [sensitivity, setSensitivity] = useState('General')
  const [itemStatus, setItemStatus] = useState(() => device?.status ?? 'Healthy')
  const [toggling, setToggling] = useState<null | 'enabling' | 'disabling'>(null)
  if (!device) return <div className="p-8 text-muted-foreground text-sm">Device not found.</div>
  const isItemDisabled = itemStatus === 'Disabled' || itemStatus === 'Inactive'
  const handleToggle = () => {
    if (toggling) return
    if (isItemDisabled) {
      setToggling('enabling')
      setTimeout(() => { setItemStatus('Healthy'); setToggling(null) }, 1500)
    } else {
      setToggling('disabling')
      setTimeout(() => { setItemStatus('Disabled'); setToggling(null) }, 1500)
    }
  }

  const fwVersion = device.firmware.startsWith('v') ? device.firmware.slice(1) : device.firmware
  const fwData = fwVersion !== '—' ? firmwareDetailData[fwVersion] : undefined
  const sevColor: Record<string, string> = { Critical: '#ef4444', High: '#f97316', Medium: '#f59e0b', Low: '#94a3b8' }
  const isEdge = device.type === 'Edge Gateway'
  const outboundEndpoint = isEdge ? 'None' : `${device.hub}.azure-devices.net`
  const inboundEndpoint = isEdge ? `mqtts://${device.name}.westus2.azure-devices.net:8883` : 'None'

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-6">
      <div className="flex items-center gap-2">
        <div>
          <h1 className="text-lg font-semibold font-mono">{device.name}</h1>
          <p className="text-xs text-muted-foreground">{device.id} · {device.type}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SensitivitySelect value={sensitivity} onChange={setSensitivity} />
          <StatusBadge status={itemStatus} />
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${device.connectivity === 'Connected' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
            <Wifi className="h-3 w-3" />{device.connectivity}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {DEVICE_ACTIONS.filter(a => {
          if (a.id === 'enable') return isItemDisabled
          if (a.id === 'disable') return !isItemDisabled
          return true
        }).map(action => {
          const isNoOta = (device as any).otaManaged === false
          const isFwBtn = action.id === 'update-firmware'
          if (isFwBtn && isNoOta) {
            return (
              <div key={action.id} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-400 cursor-not-allowed select-none" title="ADU agent not installed">
                <Upload className="h-3.5 w-3.5" />
                <span>No ADU agent installed</span>
              </div>
            )
          }
          return (
            <button
              key={action.id}
              onClick={
                (action.id === 'enable' || action.id === 'disable')
                  ? handleToggle
                  : action.id === 'update-firmware' && onUpdateFirmware
                    ? () => onUpdateFirmware({
                        jobType: 'software-update',
                        jobName: `Firmware Update – ${device.name}`,
                        startAtStep: 3,
                        preselectedIds: [device.id],
                        preselectedSource: 'Devices',
                        preselectedNames: { [device.id]: device.name },
                      })
                    : undefined
              }
              disabled={toggling !== null && (action.id === 'enable' || action.id === 'disable')}
              className={`inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60 ${action.cls}`}
            >
              {toggling !== null && (action.id === 'enable' || action.id === 'disable')
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />{toggling === 'enabling' ? 'Enabling…' : 'Disabling…'}</>
                : <><action.icon className="h-3.5 w-3.5" />{action.label}</>
              }
            </button>
          )
        })}
        {onRunJob && (
          <button
            onClick={() => onRunJob([device.id], { [device.id]: device.name })}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <Play className="h-3.5 w-3.5" />
            Run Job
          </button>
        )}
        <button onClick={() => {}} className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50">
          <ExternalLink className="h-3.5 w-3.5" />
          View in Azure Monitor
        </button>
      </div>

      <div className="rounded-lg border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center gap-2">
          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Azure Resource Properties</p>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-4 py-4">
          {[
            { label: 'Resource Group',   value: 'rg-zava-southcentralus' },
            { label: 'Location',          value: 'South Central US' },
            { label: 'Subscription',      value: 'Zava Energy – Production' },
            { label: 'Subscription ID',   value: '47b2c901-9f3a-4d81-b628-3e51a0c74f22' },
            { label: 'Namespace',         value: 'Texas-Wind-Namespace' },
            { label: 'IoT Hub',           value: device.hub },
            { label: 'Site',              value: device.site },
            { label: 'Last Seen',         value: device.lastSeen },
          ].map(p => (
            <div key={p.label} className="flex flex-col gap-0.5">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{p.label}</span>
              <span className="text-sm font-mono text-slate-700">{p.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center gap-2">
          <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Device Properties</p>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-4 py-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Manufacturer</span>
            <span className="text-sm font-mono text-slate-700">{device.manufacturer}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Model</span>
            <span className="text-sm font-mono text-slate-700">{device.model}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Firmware Version</span>
            {device.firmware === '—' ? (
              <span className="text-sm font-mono text-slate-400">—</span>
            ) : (device as any).otaManaged === false ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-mono text-slate-700">{device.firmware}</span>
                <button onClick={() => onFirmwareSelect('ota-management-upload')} className="text-[11px] text-blue-600 hover:underline cursor-pointer">
                  Not found. Upload firmware image to library.
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => onFirmwareSelect(fwVersion)} className="text-sm font-mono text-blue-600 hover:underline text-left flex items-center gap-1">
                  {device.firmware}<ChevronRight className="h-3 w-3" />
                </button>
                {LATEST_DEVICE_FW_BY_MODEL[device.model] === device.firmware ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 leading-none">LATEST</span>
                ) : LATEST_DEVICE_FW_BY_MODEL[device.model] ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 leading-none">Update available</span>
                ) : null}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Type</span>
            <span className="text-sm font-mono text-slate-700">{device.type}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Update capable?</span>
            {(device as any).otaManaged === false ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex w-fit items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-50 text-slate-500 border border-slate-200 leading-none">AGENT NOT INSTALLED</span>
                <a href="https://learn.microsoft.com/en-us/azure/iot-hub-device-update/understand-device-update" target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 hover:underline">Learn about Azure Device Update.</a>
              </div>
            ) : (
              <span className="inline-flex w-fit items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 leading-none">AGENT INSTALLED</span>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center gap-2">
          <Network className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Endpoints</p>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-4 py-4">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Outbound Endpoint</span>
            {outboundEndpoint === 'None' ? (
              <span className="text-xs text-slate-400 italic">None</span>
            ) : (
              <span className="text-xs font-mono text-slate-700 break-all">{outboundEndpoint}</span>
            )}
            <span className="text-[10px] text-slate-400">{isEdge ? 'Edge gateways route outbound via local broker' : 'AMQP/MQTT to IoT Hub'}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Inbound Endpoint</span>
            {inboundEndpoint === 'None' ? (
              <span className="text-xs text-slate-400 italic">None</span>
            ) : (
              <span className="text-xs font-mono text-slate-700 break-all">{inboundEndpoint}</span>
            )}
            <span className="text-[10px] text-slate-400">{isEdge ? 'Accepts MQTT connections from leaf devices' : 'Leaf devices connect upstream to edge gateway'}</span>
          </div>
        </div>
      </div>

      {(device as any).otaManaged === false ? (
        <div className="rounded-lg border border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-slate-400" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Security Summary</p>
          </div>
          <div className="px-4 py-4">
            <div className="grid grid-cols-4 gap-3 mb-5">
              {(['Critical', 'High', 'Medium', 'Low'] as const).map(s => (
                <div key={s} className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-center">
                  <p className="text-lg font-bold text-amber-400">?</p>
                  <p className="text-xs text-amber-600">{s}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col items-center gap-2 py-3 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50">
              <Shield className="h-7 w-7 text-slate-300 mb-1" />
              <p className="text-sm font-medium text-slate-500">No firmware image linked to this device</p>
              <p className="text-xs text-slate-400 max-w-sm">
                Associate a firmware image with this device type in Firmware Analysis to automatically detect CVEs, assess binary hardening, and score security posture.
              </p>
              <button onClick={() => onFirmwareSelect('firmware-management')} className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-600 shadow-sm transition-colors hover:bg-slate-50">
                <Upload className="h-3.5 w-3.5" />Upload firmware image
              </button>
            </div>
          </div>
        </div>
      ) : fwData ? (
        <div className="rounded-lg border border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Security summary</p>
            </div>
            <button onClick={() => onFirmwareSelect(fwVersion)} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View vulnerability report<ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="px-4 py-4">
            <div className="grid grid-cols-4 gap-3 mb-4">
              {(['Critical', 'High', 'Medium', 'Low'] as const).map(s => {
                const sk = s.toLowerCase() as keyof typeof fwData.cvesBySeverity
                return (
                  <div key={s} className="rounded-lg border border-slate-100 p-3 text-center">
                    <p className="text-lg font-bold" style={{ color: sevColor[s] }}>{fwData.cvesBySeverity[sk]}</p>
                    <p className="text-xs text-muted-foreground">{s}</p>
                  </div>
                )
              })}
            </div>
            <div className="space-y-1.5">
              {fwData.cves.slice(0, 3).map(c => (
                <div key={c.id} className="flex items-start gap-2 text-sm">
                  <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: `${sevColor[c.severity]}20`, color: sevColor[c.severity] }}>{c.severity[0]}</span>
                  <span className="font-mono text-xs text-slate-500 shrink-0 pt-0.5">{c.id}</span>
                  <span className="text-xs text-muted-foreground">{c.description}</span>
                </div>
              ))}
              {fwData.cves.length > 3 && (
                <button onClick={() => onFirmwareSelect(fwVersion)} className="text-xs text-blue-600 hover:underline mt-1">
                  +{fwData.cves.length - 3} more CVEs → view vulnerability report
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Health section ── */}
      {(() => {
        const obs = deviceObservabilityData[device.id]
        const hubData = deviceHubHealthData[device.id]
        if (!obs || !hubData) return null
        return (
          <HealthSection summaryStatus={device.status === 'Healthy' ? 'Healthy' : device.status}>
            <MetricsRow
              isAsset={false}
              msgPerMin={obs.msgPerMin}
              errorsPerHr={obs.errorsPerHr}
              msgCountOrDataKB={obs.dataKBPerMin}
              connectivity={obs.connectivity}
            />
            <ConnectivityTimeline connectivity={obs.connectivity} />
            <DeviceHubHealth
              deviceName={device.name}
              deviceStatus={device.status}
              deviceConnectivity={device.connectivity}
              hubData={hubData}
            />
          </HealthSection>
        )
      })()}
    </motion.div>
  )
}
