export interface Hub {
  name: string
  region: string
  devices: number
  status: string
}

export interface IotOperationsInstance {
  name: string
  site: string
  status: string
  connectedDevices: number
  assets: number
}

export const initialHubs: Hub[] = [
  { name: 'hub-tx-wind-01', region: 'South Central US', devices: 4_250, status: 'Healthy' },
  { name: 'hub-tx-wind-02', region: 'South Central US', devices: 3_980, status: 'Healthy' },
  { name: 'hub-tx-wind-03', region: 'East US 2', devices: 2_617, status: 'Healthy' },
  { name: 'hub-tx-wind-04', region: 'East US 2', devices: 2_000, status: 'Degraded' },
]

export const aioInstances: IotOperationsInstance[] = [
  { name: 'aio-tx-abilene-01', site: 'Abilene Wind Farm', status: 'Healthy', connectedDevices: 842, assets: 434 },
  { name: 'aio-tx-midland-01', site: 'Midland Wind Farm', status: 'Healthy', connectedDevices: 671, assets: 318 },
  { name: 'aio-tx-sanangelo-01', site: 'San Angelo Wind Farm', status: 'Degraded', connectedDevices: 512, assets: 244 },
  { name: 'aio-tx-lubbock-01', site: 'Lubbock Wind Farm', status: 'Healthy', connectedDevices: 390, assets: 187 },
]
